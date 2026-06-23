import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil, interval, switchMap } from 'rxjs';
import { DraftApiService, DraftState } from '../../services/draft-api.service';
import { TelegramService } from '../../services/telegram.service';
import { PlayerService } from '../../services/player.service';
import { Dataset } from '../../types';

type LobbyMode = 'home' | 'create' | 'join' | 'waiting';

@Component({
  selector: 'app-lobby',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lobby.component.html',
  styleUrl: './lobby.component.scss'
})
export class LobbyComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  mode: LobbyMode = 'home';
  draftName = '';
  maxManagers = 4;
  maxRounds = 18;
  joinCode = '';
  error = '';
  Math = Math;

  // Waiting room state
  draftState: DraftState | null = null;
  isCreator = false;

  // Dataset selection
  datasets: Dataset[] = [{ id: 'fc-2026', label: 'EA FC 25/26', file: 'fc-2026.json', default: true }];
  selectedDatasetId = 'fc-2026';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private api: DraftApiService,
    private telegram: TelegramService,
    private playerService: PlayerService
  ) {}

  ngOnInit(): void {
    // Load available datasets
    this.playerService.loadDatasets().subscribe({
      next: (datasets) => this.datasets = datasets,
      error: () => {} // keep defaults
    });

    // Check query params or Telegram start param
    const queryMode = this.route.snapshot.queryParamMap.get('mode');
    const queryCode = this.route.snapshot.queryParamMap.get('code');
    const startParam = this.telegram.startParam;

    if (startParam) {
      this.joinCode = startParam;
      this.mode = 'join';
      this.onJoin();
    } else if (queryMode === 'create') {
      this.mode = 'create';
    } else if (queryMode === 'join') {
      this.mode = 'join';
      if (queryCode) {
        this.joinCode = queryCode;
        this.onJoin();
      }
    }

    // Telegram back button
    if (this.telegram.isInTelegram) {
      this.telegram.showBackButton(() => this.onBack());
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.telegram.hideBackButton();
    this.telegram.hideMainButton();
  }

  onBack(): void {
    if (this.mode === 'home') {
      this.telegram.close();
    } else if (this.mode === 'waiting') {
      this.mode = 'home';
      this.destroy$.next(); // stop polling
    } else {
      this.mode = 'home';
    }
  }

  onCreateDraft(): void {
    this.error = '';
    this.api.createDraft(this.draftName || 'FIFA Draft', this.maxManagers, this.maxRounds, this.selectedDatasetId)
      .subscribe({
        next: (res) => {
          this.joinCode = res.shortCode;
          this.isCreator = true;
          this.mode = 'waiting';
          this.startWaitingPolling(res.shortCode);
        },
        error: (err) => {
          this.error = err.error?.error || 'Failed to create draft';
        }
      });
  }

  onJoin(): void {
    if (!this.joinCode.trim()) {
      this.error = 'Enter a draft code';
      return;
    }
    this.error = '';
    this.api.joinDraft(this.joinCode.trim().toUpperCase())
      .subscribe({
        next: () => {
          this.isCreator = false;
          this.mode = 'waiting';
          this.startWaitingPolling(this.joinCode.trim().toUpperCase());
        },
        error: (err) => {
          this.error = err.error?.error || 'Failed to join draft';
        }
      });
  }

  onStartDraft(): void {
    this.api.startDraft(this.joinCode).subscribe({
      next: () => {
        this.telegram.hapticNotification('success');
        this.router.navigate(['/draft'], { queryParams: { code: this.joinCode } });
      },
      error: (err) => {
        this.error = err.error?.error || 'Failed to start draft';
      }
    });
  }

  private startWaitingPolling(code: string): void {
    interval(2000).pipe(
      takeUntil(this.destroy$),
      switchMap(() => this.api.getDraftState(code))
    ).subscribe({
      next: (state) => {
        this.draftState = state;
        if (state.status === 'active') {
          this.router.navigate(['/draft'], { queryParams: { code } });
        }
      }
    });

    // Also fetch initial state immediately
    this.api.getDraftState(code).subscribe(state => this.draftState = state);
  }

  goSinglePlayer(): void {
    this.router.navigate(['/settings']);
  }

  copyCode(): void {
    navigator.clipboard.writeText(this.joinCode);
    this.telegram.hapticNotification('success');
  }

  get shareLink(): string {
    return `https://t.me/${this.getBotUsername()}?start=${this.joinCode}`;
  }

  private getBotUsername(): string {
    return 'YourFifaDraftBot'; // TODO: configure via environment
  }
}
