import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DraftService } from '../../services/draft.service';
import { DraftSettings, DraftManager } from '../../types';

@Component({
  selector: 'app-summary',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule
  ],
  templateUrl: './summary.component.html',
  styleUrl: './summary.component.scss'
})
export class SummaryComponent implements OnInit {
  draftSettings: DraftSettings | null = null;
  managers: DraftManager[] = [];

  constructor(
    private draftService: DraftService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.draftService.draftSettings$.subscribe(settings => {
      if (!settings) {
        // No draft data, redirect to settings
        this.router.navigate(['/']);
        return;
      }
      this.draftSettings = settings;
      this.managers = settings.managers;
    });
  }

  backToSettings(): void {
    this.router.navigate(['/']);
  }
}
