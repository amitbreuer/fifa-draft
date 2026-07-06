import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DraftService } from '../../services/draft.service';
import { PlayerService } from '../../services/player.service';
import { Select } from 'primeng/select';
import { Dataset } from '../../types';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    Select
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent implements OnInit {
  draftName = '';
  managerNames: string[] = ['', ''];
  maxRounds = 18;
  Math = Math;

  // Pick-order lottery state
  lotteryPhase: 'idle' | 'countdown' | 'shuffling' | 'reveal' = 'idle';
  countdown = 3;
  lotteryNames: string[] = [];
  private lotteryTimers: any[] = [];

  // Dataset selection
  datasets: Dataset[] = [];
  selectedDatasetId = 'fc-2026';

  // Saved drafts
  savedDrafts: string[] = [];
  selectedSavedDraft: string | null = null;

  constructor(
    private draftService: DraftService,
    private playerService: PlayerService,
    private router: Router
  ) {
    this.loadSavedDrafts();
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  ngOnInit(): void {
    // Load datasets from server, fall back to default
    this.playerService.loadDatasets().subscribe({
      next: (datasets) => this.datasets = datasets,
      error: () => {
        this.datasets = [{ id: 'fc-2026', label: 'EA FC 25/26', file: 'fc-2026.json', default: true }];
      }
    });
  }

  addManager(): void {
    if (this.managerNames.length < 10) {
      this.managerNames.push('');
    }
  }

  removeManager(index: number): void {
    if (this.managerNames.length > 2) {
      this.managerNames.splice(index, 1);
    }
  }

  /** Human-friendly name for a manager slot, falling back to a placeholder. */
  displayName(name: string, index: number): string {
    return (name || '').trim() || `Manager ${index + 1}`;
  }

  /**
   * Run a "draft lottery": show a countdown, a shuffle animation, then reveal
   * the randomized pick order and apply it to the manager list.
   */
  randomizeOrder(): void {
    if (this.lotteryPhase !== 'idle' || this.managerNames.length < 2) return;

    // Snapshot display names so the reveal always shows something readable.
    const names = this.managerNames.map((n, i) => this.displayName(n, i));

    this.lotteryPhase = 'countdown';
    this.countdown = 3;
    this.lotteryNames = [...names];

    const tick = (n: number) => {
      this.countdown = n;
      if (n > 0) {
        this.lotteryTimers.push(setTimeout(() => tick(n - 1), 1000));
      } else {
        this.startShuffleAnimation(names);
      }
    };
    this.lotteryTimers.push(setTimeout(() => tick(2), 1000));
  }

  private startShuffleAnimation(names: string[]): void {
    this.lotteryPhase = 'shuffling';

    let ticks = 0;
    const spin = () => {
      this.lotteryNames = this.shuffle(names);
      ticks++;
      if (ticks < 12) {
        this.lotteryTimers.push(setTimeout(spin, 90 + ticks * 12));
      } else {
        // Final order — shuffle the actual manager inputs to match.
        const finalOrder = this.shuffleWithNames(this.managerNames);
        this.managerNames = finalOrder.names;
        this.lotteryNames = finalOrder.display;
        this.lotteryPhase = 'reveal';
      }
    };
    spin();
  }

  closeLottery(): void {
    this.lotteryTimers.forEach(t => clearTimeout(t));
    this.lotteryTimers = [];
    this.lotteryPhase = 'idle';
  }

  private shuffle(arr: string[]): string[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /** Shuffle raw names while producing matching display labels for the reveal. */
  private shuffleWithNames(names: string[]): { names: string[]; display: string[] } {
    const indexed = names.map((n, i) => ({ n, i }));
    for (let i = indexed.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indexed[i], indexed[j]] = [indexed[j], indexed[i]];
    }
    return {
      names: indexed.map(x => x.n),
      display: indexed.map((x, pos) => this.displayName(x.n, x.i)),
    };
  }

  canStartDraft(): boolean {
    return this.managerNames.length >= 2;
  }

  startDraft(): void {
    if (this.canStartDraft()) {
      // Fill empty names with defaults
      const names = this.managerNames.map((name, i) =>
        name.trim() || `Manager ${i + 1}`
      );
      const draftName = this.draftName.trim() || 'Galactico';
      // Load dataset if changed from default
      this.playerService.loadDataset(this.selectedDatasetId).subscribe(() => {
        this.draftService.initializeDraft(names, draftName, this.maxRounds);
        this.router.navigate(['/draft']);
      });
    }
  }

  loadSavedDrafts(): void {
    this.savedDrafts = this.draftService.getAllSavedDrafts();
  }

  hasSavedDrafts(): boolean {
    return this.savedDrafts.length > 0;
  }

  continueDraft(): void {
    if (!this.selectedSavedDraft) return;

    const success = this.draftService.loadDraftFromLocalStorage(this.selectedSavedDraft);
    if (success) {
      this.router.navigate(['/draft']);
    } else {
      console.error('Failed to load draft');
    }
  }

  deleteSavedDraft(): void {
    if (!this.selectedSavedDraft) return;

    if (confirm(`Are you sure you want to delete "${this.selectedSavedDraft}"?`)) {
      this.draftService.deleteDraft(this.selectedSavedDraft);
      this.selectedSavedDraft = null;
      this.loadSavedDrafts();
    }
  }
}
