import { Component, OnDestroy, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ProgressBarModule } from 'primeng/progressbar';
import { DividerModule } from 'primeng/divider';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { PlayerTableComponent } from '../player-table/player-table.component';
import { FieldComponent } from '../field/field.component';
import { DraftService } from '../../services/draft.service';
import { PlayerService } from '../../services/player.service';
import { DraftApiService, DraftState, ManagerInfo } from '../../services/draft-api.service';
import { DraftPollingService } from '../../services/draft-polling.service';
import { TelegramService } from '../../services/telegram.service';
import { DraftSettings, Player } from '../../types';

@Component({
  selector: 'app-draft',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    TagModule,
    ProgressBarModule,
    DividerModule,
    ConfirmDialogModule,
    PlayerTableComponent,
    FieldComponent
  ],
  providers: [ConfirmationService],
  templateUrl: './draft.component.html',
  styleUrl: './draft.component.scss'
})
export class DraftComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  draftSettings: DraftSettings | null = null;
  currentPickedPlayer: Player | null = null;
  hasPlacedPlayerThisTurn = false;
  actionHistory: any[] = [];

  // Multiplayer state
  isMultiplayer = false;
  draftCode: string | null = null;
  serverState: DraftState | null = null;
  myTelegramId: number | null = null;
  isMyTurn = false;
  myManagerIndex = -1;
  submittingPick = false;

  @ViewChild('teamSection') teamSection!: ElementRef;

  viewingManagerIndex: number | null = null;

  constructor(
    private draftService: DraftService,
    private playerService: PlayerService,
    private confirmationService: ConfirmationService,
    private router: Router,
    private route: ActivatedRoute,
    private api: DraftApiService,
    private polling: DraftPollingService,
    private telegram: TelegramService
  ) {}

  ngOnInit(): void {
    // Check if this is a multiplayer draft
    this.draftCode = this.route.snapshot.queryParamMap.get('code');
    this.isMultiplayer = !!this.draftCode;

    if (this.isMultiplayer && this.draftCode) {
      this.myTelegramId = this.telegram.user?.id || (
        // Dev mode fallback
        typeof window !== 'undefined' ? 12345 : null
      );
      this.initMultiplayer(this.draftCode);
    } else {
      this.initLocal();
    }

    // Subscribe to current picked player
    this.draftService.currentPickedPlayer$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(player => {
      this.currentPickedPlayer = player;
    });

    // Subscribe to placement status
    this.draftService.hasPlacedPlayerThisTurn$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(hasPlaced => {
      this.hasPlacedPlayerThisTurn = hasPlaced;
    });

    // Subscribe to action history
    this.draftService.actionHistory$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(history => {
      this.actionHistory = history;
    });

    // Telegram back button
    if (this.telegram.isInTelegram) {
      this.telegram.showBackButton(() => this.router.navigate(['/']));
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.polling.stopPolling();
    this.telegram.hideBackButton();
    this.telegram.hideMainButton();
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  /** Initialize multiplayer mode with server polling */
  private initMultiplayer(code: string): void {
    this.polling.startPolling(code);

    this.polling.state$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(state => {
      if (!state) return;

      const prevState = this.serverState;
      this.serverState = state;

      // Find my manager index
      this.myManagerIndex = state.managers.findIndex(m => {
        // Match by telegram ID through the user lookup
        // In dev mode, match by the first manager (slot 0)
        if (!this.telegram.isInTelegram) return m.slotIndex === 0;
        return true; // Will be refined once we have user matching
      });

      this.isMyTurn = state.currentManagerIndex === this.myManagerIndex && state.status === 'active';

      // Update drafted players as selected in player service
      const pickedPlayerIds = new Set(state.picks.map(p => p.playerId));
      pickedPlayerIds.forEach(id => this.playerService.selectPlayer(id));

      // Build local draft settings from server state
      this.draftSettings = this.buildDraftSettingsFromServer(state);

      // Haptic feedback when it becomes my turn
      if (this.isMyTurn && prevState && prevState.currentManagerIndex !== state.currentManagerIndex) {
        this.telegram.hapticNotification('success');
      }

      // Navigate to summary if complete
      if (state.status === 'complete') {
        this.router.navigate(['/summary'], { queryParams: { code } });
      }

      // Show/hide Telegram MainButton for finishing turn
      this.updateMainButton();
    });
  }

  /** Initialize local (offline) mode */
  private initLocal(): void {
    this.draftService.draftSettings$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(settings => {
      this.draftSettings = settings;

      if (!settings) {
        this.router.navigate(['/']);
      }

      if (settings && this.draftService.isDraftComplete()) {
        this.onDraftComplete();
      }
    });
  }

  /** Build DraftSettings from server state for the UI */
  private buildDraftSettingsFromServer(state: DraftState): DraftSettings {
    return {
      managers: state.managers.map(m => ({
        id: m.id,
        name: m.username ? `@${m.username}` : m.firstName || `Manager ${m.slotIndex + 1}`,
        team: state.picks
          .filter(p => p.managerId === m.id)
          .map(p => this.playerService.getPlayerById(p.playerId))
          .filter((p): p is Player => !!p),
        formation: m.formation as any,
        fieldPositions: m.fieldPositions as any,
        benchPlayers: (m.benchPlayerIds || [])
          .map((id: number) => this.playerService.getPlayerById(id))
          .filter((p: Player | undefined): p is Player => !!p),
      })),
      currentManagerIndex: state.currentManagerIndex,
      currentRound: state.currentRound,
      isSnakeDirection: state.isSnakeDirection,
      maxRounds: state.maxRounds,
      draftName: state.name,
    };
  }

  /** Update Telegram MainButton based on turn state */
  private updateMainButton(): void {
    if (!this.telegram.isInTelegram) return;

    if (this.isMyTurn && this.hasPlacedPlayerThisTurn) {
      this.telegram.showMainButton('✅ Finish Turn', () => this.finishTurn());
    } else {
      this.telegram.hideMainButton();
    }
  }

  getCurrentManagerName(): string {
    if (!this.draftSettings) return '';
    if (this.isMultiplayer) {
      const manager = this.draftSettings.managers[this.draftSettings.currentManagerIndex];
      return manager ? manager.name : '';
    }
    const currentManager = this.draftService.getCurrentManager();
    return currentManager ? currentManager.name : '';
  }

  getDraftProgress(): number {
    if (!this.draftSettings) return 0;
    const totalRounds = this.draftSettings.maxRounds;
    const currentRound = this.draftSettings.currentRound;
    return Math.min(((currentRound - 1) / totalRounds) * 100, 100);
  }

  canFinishTurn(): boolean {
    if (this.isMultiplayer) {
      return this.isMyTurn && this.hasPlacedPlayerThisTurn && !this.submittingPick;
    }
    return this.hasPlacedPlayerThisTurn;
  }

  canPick(): boolean {
    if (this.isMultiplayer) {
      return this.isMyTurn && !this.submittingPick;
    }
    return true;
  }

  canUndo(): boolean {
    if (this.isMultiplayer && !this.isMyTurn) return false;
    return this.hasPlacedPlayerThisTurn || this.actionHistory.length > 0;
  }

  undoPlacement(): void {
    this.draftService.undoPlayerPlacement();
  }

  onPlayerSelected(): void {
    if (this.teamSection?.nativeElement) {
      this.teamSection.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  viewManagerTeam(index: number): void {
    if (!this.draftSettings) return;
    const manager = this.draftSettings.managers[index];
    if (!manager) return;

    // Toggle: click same manager again to go back to current
    if (this.viewingManagerIndex === index) {
      this.viewingManagerIndex = null;
      this.restoreCurrentManagerView();
      return;
    }

    this.viewingManagerIndex = index;

    // Load this manager's field/bench into the field component (read-only view)
    if (manager.fieldPositions?.length) {
      this.draftService.viewManagerTeam(manager);
    }

    // Scroll to the pitch
    if (this.teamSection?.nativeElement) {
      this.teamSection.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  private restoreCurrentManagerView(): void {
    this.draftService.restoreCurrentManagerView();
  }

  finishTurn(): void {
    if (!this.canFinishTurn()) return;

    if (this.isMultiplayer && this.draftCode) {
      this.finishTurnMultiplayer();
    } else {
      this.draftService.finishTurn();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /** Submit pick to server and save squad */
  private finishTurnMultiplayer(): void {
    if (!this.draftCode || this.submittingPick) return;

    this.submittingPick = true;
    this.telegram.setMainButtonLoading(true);

    // Get the player that was placed this turn
    const placedIds = Array.from(this.draftService.getPlacedPlayerIdsThisTurn());
    if (placedIds.length === 0) return;

    const playerId = placedIds[0]; // One pick per turn

    // Submit pick to server
    this.api.submitPick(this.draftCode, playerId).subscribe({
      next: () => {
        // Save squad layout to server
        const fieldPositions = this.draftService.getFieldPositions();
        const benchPlayerIds = this.draftService.getBenchPlayers().map(p => p.id);
        const formation = this.draftService.getCurrentFormation();

        this.api.updateSquad(this.draftCode!, { formation, fieldPositions, benchPlayerIds }).subscribe({
          next: () => {
            this.submittingPick = false;
            this.telegram.setMainButtonLoading(false);
            this.telegram.hapticNotification('success');
            // Reset turn state — polling will update with new server state
            this.draftService.resetTurnState();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          },
          error: () => {
            this.submittingPick = false;
            this.telegram.setMainButtonLoading(false);
          }
        });
      },
      error: () => {
        this.submittingPick = false;
        this.telegram.setMainButtonLoading(false);
        this.telegram.hapticNotification('error');
      }
    });
  }

  confirmFinishDraft(): void {
    this.confirmationService.confirm({
      message: 'Are you sure you want to finish the draft early?',
      header: 'Finish Draft',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-warning',
      accept: () => {
        this.draftService.finishDraft();
        this.router.navigate(['/summary']);
      }
    });
  }

  private onDraftComplete(): void {
    this.router.navigate(['/summary']);
  }

  getManagerTagSeverity(managerIndex: number): string {
    if (!this.draftSettings) return 'info';

    if (managerIndex === this.draftSettings.currentManagerIndex) {
      return 'success';
    }

    const manager = this.draftSettings.managers[managerIndex];
    const averageTeamSize = this.draftSettings.managers.reduce((sum, m) => sum + m.team.length, 0) / this.draftSettings.managers.length;

    if (manager.team.length > averageTeamSize) {
      return 'info';
    } else if (manager.team.length < averageTeamSize) {
      return 'warning';
    }

    return 'secondary';
  }

  /** Check if a manager is currently online (for multiplayer) */
  isManagerOnline(managerIndex: number): boolean {
    if (!this.serverState) return false;
    const manager = this.serverState.managers[managerIndex];
    if (!manager?.lastSeenAt) return false;
    return Date.now() - new Date(manager.lastSeenAt).getTime() < 10_000;
  }
}
