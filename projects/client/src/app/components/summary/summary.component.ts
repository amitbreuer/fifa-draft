import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DraftService } from '../../services/draft.service';
import { DraftSettings, DraftManager } from '../../types';

@Component({
  selector: 'app-summary',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './summary.component.html',
  styleUrl: './summary.component.scss'
})
export class SummaryComponent implements OnInit {
  draftSettings: DraftSettings | null = null;
  managers: DraftManager[] = [];
  activeIndex = 0;

  private readonly ATT = ['ST', 'CF', 'LW', 'RW'];
  private readonly MID = ['CAM', 'LAM', 'RAM', 'CM', 'LCM', 'RCM', 'LM', 'RM', 'CDM'];
  private readonly DEF = ['CB', 'LB', 'RB', 'LWB', 'RWB', 'GK'];

  constructor(
    private draftService: DraftService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.draftService.draftSettings$.subscribe(settings => {
      if (!settings) {
        this.router.navigate(['/']);
        return;
      }
      this.draftSettings = settings;
      this.managers = settings.managers;
    });
  }

  selectManager(i: number): void {
    this.activeIndex = i;
  }

  private avgFor(manager: DraftManager, positions: string[]): number {
    const players = manager.team.filter(p => positions.includes(p.position.shortLabel));
    if (players.length === 0) return 0;
    const sum = players.reduce((s, p) => s + p.overallRating, 0);
    return Math.round(sum / players.length);
  }

  attackAvg(manager: DraftManager): number { return this.avgFor(manager, this.ATT); }
  midfieldAvg(manager: DraftManager): number { return this.avgFor(manager, this.MID); }
  defenceAvg(manager: DraftManager): number { return this.avgFor(manager, this.DEF); }

  overallAvg(manager: DraftManager): number {
    if (manager.team.length === 0) return 0;
    const sum = manager.team.reduce((s, p) => s + p.overallRating, 0);
    return Math.round(sum / manager.team.length);
  }

  backToSettings(): void {
    this.router.navigate(['/']);
  }
}
