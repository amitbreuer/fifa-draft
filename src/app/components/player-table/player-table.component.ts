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
import { SpeedDialModule } from 'primeng/speeddial';
import { Player, AVAILABLE_POSITIONS, PositionFilter, mainStatsMap, MainStats } from '../../types';
import { PlayerService } from '../../services/player.service';
import { DraftService } from '../../services/draft.service';
import { RatingSeverityPipe } from '../../pipes/rating-severity.pipe';
import { StatSeverityPipe } from '../../pipes/stat-severity.pipe';
import { StatNamePipe } from '../../pipes/stat-name.pipe';
import { MainStatNamePipe } from '../../pipes/main-stat-name.pipe';

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
    SpeedDialModule,
    RatingSeverityPipe,
    StatSeverityPipe,
    StatNamePipe,
    MainStatNamePipe,
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
  selectedTeamId: number | null = null;
  selectedNationalityId: number | null = null;
  showSelectedPlayers = false;

  positionOptions = [
    { label: 'All Positions', value: 'ALL' },
    ...AVAILABLE_POSITIONS.map(pos => ({ label: pos, value: pos }))
  ];

  teamOptions: { label: string; value: number }[] = [];
  nationalityOptions: { label: string; value: number }[] = [];

  constructor(
    private playerService: PlayerService,
    private draftService: DraftService
  ) {
    // Load teams and nationalities
    this.teamOptions = this.playerService.getAllTeams().map(team => ({
      label: team.label,
      value: team.id
    }));

    this.nationalityOptions = this.playerService.getAllNationalities().map(nat => ({
      label: nat.label,
      value: nat.id
    }));
  }

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

  clearFilters(): void {
    this.selectedPosition = 'ALL';
    this.selectedTeamId = null;
    this.selectedNationalityId = null;
    this.showSelectedPlayers = false;
    this.updateFilteredPlayers();
  }

  hasActiveFilters(): boolean {
    return this.selectedPosition !== 'ALL' ||
           this.selectedTeamId !== null ||
           this.selectedNationalityId !== null ||
           this.showSelectedPlayers;
  }

  onSelectionChange(event: Player[]): void {
    this.selectedPlayers = event;
  }

  private updateFilteredPlayers(): void {
    this.filteredPlayers = this.playerService.getFilteredPlayers(
      this.selectedPosition,
      this.showSelectedPlayers,
      this.selectedTeamId ?? undefined,
      this.selectedNationalityId ?? undefined
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
    this.scrollToField();
  }

  private scrollToField(): void {
    // Scroll to the field component
    setTimeout(() => {
      const fieldElement = document.querySelector('app-field');
      if (fieldElement) {
        fieldElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    }, 100);
  }


  isPlayerSelected(playerId: number): boolean {
    return this.playerService.isPlayerSelected(playerId);
  }


  onImageError(event: any): void {
    event.target.src = 'iniesta.jpg';
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
}
