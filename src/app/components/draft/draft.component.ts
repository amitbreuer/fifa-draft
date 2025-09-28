import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
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

  constructor(
    private draftService: DraftService,
    private playerService: PlayerService,
    private confirmationService: ConfirmationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Subscribe to draft settings
    this.draftService.draftSettings$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(settings => {
      this.draftSettings = settings;

      // If no draft settings, redirect to settings
      if (!settings) {
        this.router.navigate(['/']);
      }

      // Check if draft is complete
      if (settings && this.draftService.isDraftComplete()) {
        this.onDraftComplete();
      }
    });

    // Subscribe to current picked player
    this.draftService.currentPickedPlayer$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(player => {
      this.currentPickedPlayer = player;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getCurrentManagerName(): string {
    if (!this.draftSettings) return '';
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
    return this.currentPickedPlayer !== null;
  }

  finishTurn(): void {
    if (!this.canFinishTurn()) return;

    this.confirmationService.confirm({
      message: `Finish turn for ${this.getCurrentManagerName()}?`,
      header: 'Confirm Turn',
      icon: 'pi pi-question-circle',
      accept: () => {
        // Mark the player as selected before finishing the turn
        this.playerService.selectPlayer(this.currentPickedPlayer!.id);
        this.draftService.finishTurn();
      }
    });
  }

  confirmFinishDraft(): void {
    this.confirmationService.confirm({
      message: 'Are you sure you want to finish the draft early? This cannot be undone.',
      header: 'Finish Draft',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-warning',
      accept: () => {
        this.draftService.finishDraft();
        this.onDraftComplete();
      }
    });
  }

  private onDraftComplete(): void {
    this.confirmationService.confirm({
      message: 'Draft completed! Would you like to start a new draft?',
      header: 'Draft Complete',
      icon: 'pi pi-check-circle',
      acceptLabel: 'New Draft',
      rejectLabel: 'Stay Here',
      accept: () => {
        this.router.navigate(['/']);
      }
    });
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
}
