import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { DraftService } from '../../services/draft.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    CardModule,
    DividerModule
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent {
  numManagers = 2;
  managerNames: string[] = ['Manager 1', 'Manager 2'];

  constructor(
    private draftService: DraftService,
    private router: Router
  ) {}

  updateManagerNames(): void {
    const newNames: string[] = [];
    for (let i = 0; i < this.numManagers; i++) {
      newNames.push(this.managerNames[i] || `Manager ${i + 1}`);
    }
    this.managerNames = newNames;
  }

  canStartDraft(): boolean {
    return this.numManagers >= 2 &&
           this.managerNames.length === this.numManagers &&
           this.managerNames.every(name => name.trim().length > 0);
  }

  startDraft(): void {
    if (this.canStartDraft()) {
      this.draftService.initializeDraft(this.managerNames);
      this.router.navigate(['/draft']);
    }
  }
}
