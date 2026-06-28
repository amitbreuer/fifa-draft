import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { SelectButtonModule } from 'primeng/selectbutton';
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
    ButtonModule,
    InputTextModule,
    CardModule,
    DividerModule,
    SelectButtonModule,
    Select
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent implements OnInit {
  draftName = '';
  managerNames: string[] = ['', ''];

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

  canStartDraft(): boolean {
    return this.draftName.trim().length > 0 &&
           this.managerNames.length >= 2 &&
           this.managerNames.every(name => name.trim().length > 0);
  }

  startDraft(): void {
    if (this.canStartDraft()) {
      // Load dataset if changed from default
      this.playerService.loadDataset(this.selectedDatasetId).subscribe(() => {
        this.draftService.initializeDraft(this.managerNames, this.draftName);
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
