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
  numManagers = 4;
  managerNames: string[] = ['Manager 1', 'Manager 2', 'Manager 3', 'Manager 4'];
  managerOptions = [
    { label: '2', value: 2 },
    { label: '3', value: 3 },
    { label: '4', value: 4 },
    { label: '5', value: 5 },
    { label: '6', value: 6 }
  ];

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

  ngOnInit(): void {
    // Load datasets from server, fall back to default
    this.playerService.loadDatasets().subscribe({
      next: (datasets) => this.datasets = datasets,
      error: () => {
        this.datasets = [{ id: 'fc-2026', label: 'EA FC 25/26', file: 'fc-2026.json', default: true }];
      }
    });
  }

  updateManagerNames(): void {
    const newNames: string[] = [];
    for (let i = 0; i < this.numManagers; i++) {
      newNames.push(this.managerNames[i] || `Manager ${i + 1}`);
    }
    this.managerNames = newNames;
  }

  canStartDraft(): boolean {
    return this.draftName.trim().length > 0 &&
           this.numManagers >= 2 &&
           this.managerNames.length === this.numManagers &&
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
