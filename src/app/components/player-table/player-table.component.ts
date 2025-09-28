import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, combineLatest } from 'rxjs';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ProgressBarModule } from 'primeng/progressbar';
import { RatingModule } from 'primeng/rating';
import { Player, AVAILABLE_POSITIONS, PositionFilter, mainStatsMap, MainStats } from '../../types';
import { PlayerService } from '../../services/player.service';
import { DraftService } from '../../services/draft.service';
import { Ripple } from 'primeng/ripple';

@Component({
  selector: 'app-player-table',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    SelectModule,
    CheckboxModule,
    CardModule,
    TagModule,
    ProgressBarModule,
    RatingModule,
    Ripple
  ],
  templateUrl: './player-table.component.html',
  styleUrl: './player-table.component.scss'
})
export class PlayerTableComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  filteredPlayers: Player[] = [];
  selectedPlayers: Player[] = [];
  expandedRows: { [key: number]: boolean } = {};

  selectedPosition: PositionFilter = 'ALL';
  showSelectedPlayers = false;

  positionOptions = [
    { label: 'All Positions', value: 'ALL' },
    ...AVAILABLE_POSITIONS.map(pos => ({ label: pos, value: pos }))
  ];

  constructor(
    private playerService: PlayerService,
    private draftService: DraftService
  ) {}

  ngOnInit(): void {
    // Subscribe to changes
    combineLatest([
      this.playerService.players$,
      this.playerService.selectedPlayerIds$
    ]).pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.updateFilteredPlayers();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onFilterChange(): void {
    this.updateFilteredPlayers();
  }

  private updateFilteredPlayers(): void {
    this.filteredPlayers = this.playerService.getFilteredPlayers(
      this.selectedPosition,
      this.showSelectedPlayers
    );
  }

  pickSelectedPlayers(): void {
    const availablePlayers = this.selectedPlayers.filter(player =>
      !this.isPlayerSelected(player.id)
    );

    availablePlayers.forEach(player => {
      this.draftService.pickPlayer(player);
    });

    this.selectedPlayers = [];
  }

  isPlayerSelected(playerId: number): boolean {
    return this.playerService.isPlayerSelected(playerId);
  }

  getRatingSeverity(rating: number): string {
    if (rating >= 90) return 'success';
    if (rating >= 80) return 'info';
    if (rating >= 70) return 'warning';
    return 'danger';
  }

  onImageError(event: any): void {
    event.target.src = 'iniesta.jpg';
  }

  getPlayerStats(player: Player): { key: string; value: { value: number; diff: number } }[] {
    return Object.entries(player.stats).map(([key, value]) => ({
      key,
      value
    }));
  }

  formatStatName(statKey: string): string {
    // Convert stat key to readable format
    return statKey
      .replace(/([A-Z])/g, ' $1') // Add space before capital letters
      .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
      .trim();
  }

  getMainStats(player: Player): MainStats {
    return Object.entries(mainStatsMap).reduce((mainStats, [mainKey, subKeys]) => {
      const { sum, count } = subKeys.reduce(
        (acc, subKey) => {
          const stat = player.stats[subKey];
          if (stat && !Number.isNaN(stat.value)) {
            acc.sum += stat.value;
            acc.count += 1;
          }
          return acc;
        },
        { sum: 0, count: 0 }
      );

      (mainStats as any)[mainKey] = count > 0 ? Math.round(sum / count) : 0;
      return mainStats;
    }, {} as MainStats);
  }

  getMainStatsKeys(): (keyof typeof mainStatsMap)[] {
    return Object.keys(mainStatsMap) as (keyof typeof mainStatsMap)[];
  }

  getSubStatsForMainStat(mainStat: keyof typeof mainStatsMap): string[] {
    return mainStatsMap[mainStat];
  }

  formatMainStatName(statKey: string): string {
    return statKey.toUpperCase();
  }

  getStatSeverity(statValue: number): string {
    if (statValue >= 85) return 'success'; // Green
    if (statValue >= 70) return 'warn'; // Yellow
    if (statValue >= 55) return 'info'; // Orange
    return 'danger'; // Red
  }
}
