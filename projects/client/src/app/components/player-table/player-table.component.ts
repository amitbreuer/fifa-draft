import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, combineLatest } from 'rxjs';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { CheckboxModule } from 'primeng/checkbox';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ProgressBarModule } from 'primeng/progressbar';
import { RatingModule } from 'primeng/rating';
import { SpeedDialModule } from 'primeng/speeddial';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { ChipModule } from 'primeng/chip';
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
    MultiSelectModule,
    CheckboxModule,
    CardModule,
    TagModule,
    ProgressBarModule,
    RatingModule,
    SpeedDialModule,
    DialogModule,
    TooltipModule,
    ChipModule,
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

  @Output() playerSelected = new EventEmitter<void>();

  filteredPlayers: Player[] = [];
  selectedPlayer: Player | null = null;
  selectedPlayerForDialog: Player | null = null;
  showPlayerDialog = false;
  placedPlayerIdsThisTurn: Set<number> = new Set();
  hasPlacedPlayerThisTurn = false;

  // Comparison dialog
  showComparisonDialog = false;
  comparisonPlayer1: Player | null = null;
  comparisonPlayer2: Player | null = null;
  playerOptions: { label: string; value: Player }[] = [];

  selectedPositions: PositionFilter[] = [];
  selectedTeamIds: number[] = [];
  selectedNationalityIds: number[] = [];
  showSelectedPlayers = false;
  searchText = '';

  positionOptions = AVAILABLE_POSITIONS.map(pos => ({ label: pos, value: pos }));

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
      this.updatePlayerOptions();
    });

    // Subscribe to current picked player to clear selection after placement
    this.draftService.currentPickedPlayer$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(pickedPlayer => {
      if (!pickedPlayer) {
        this.selectedPlayer = null;
      }
    });

    // Subscribe to placed players this turn
    this.draftService.placedPlayerIdsThisTurn$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(placedIds => {
      this.placedPlayerIdsThisTurn = placedIds;
    });

    // Subscribe to hasPlacedPlayerThisTurn to disable all selections
    this.draftService.hasPlacedPlayerThisTurn$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(hasPlaced => {
      this.hasPlacedPlayerThisTurn = hasPlaced;
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
    this.selectedPositions = [];
    this.selectedTeamIds = [];
    this.selectedNationalityIds = [];
    this.showSelectedPlayers = false;
    this.searchText = '';
    this.updateFilteredPlayers();
  }

  hasActiveFilters(): boolean {
    return this.selectedPositions.length > 0 ||
           this.selectedTeamIds.length > 0 ||
           this.selectedNationalityIds.length > 0 ||
           this.showSelectedPlayers ||
           this.searchText.trim().length > 0;
  }

  getActiveChips(): { label: string; type: 'position' | 'team' | 'nationality'; value: any }[] {
    const chips: { label: string; type: 'position' | 'team' | 'nationality'; value: any }[] = [];
    for (const pos of this.selectedPositions) {
      chips.push({ label: pos, type: 'position', value: pos });
    }
    for (const teamId of this.selectedTeamIds) {
      const team = this.teamOptions.find(t => t.value === teamId);
      if (team) chips.push({ label: team.label, type: 'team', value: teamId });
    }
    for (const natId of this.selectedNationalityIds) {
      const nat = this.nationalityOptions.find(n => n.value === natId);
      if (nat) chips.push({ label: nat.label, type: 'nationality', value: natId });
    }
    return chips;
  }

  removeChip(chip: { type: 'position' | 'team' | 'nationality'; value: any }): void {
    if (chip.type === 'position') {
      this.selectedPositions = this.selectedPositions.filter(p => p !== chip.value);
    } else if (chip.type === 'team') {
      this.selectedTeamIds = this.selectedTeamIds.filter(id => id !== chip.value);
    } else if (chip.type === 'nationality') {
      this.selectedNationalityIds = this.selectedNationalityIds.filter(id => id !== chip.value);
    }
    this.onFilterChange();
  }

  onSelectionChange(event: Player | null): void {
    // Don't allow selecting players that are already placed this turn
    if (event && this.isPlayerPlacedThisTurn(event.id)) {
      this.selectedPlayer = null;
      return;
    }

    // Don't allow selecting a new player if one has already been placed this turn
    if (event && this.hasPlacedPlayerThisTurn) {
      this.selectedPlayer = null;
      return;
    }

    this.selectedPlayer = event;
    if (event) {
      this.draftService.pickPlayer(event);
      this.playerSelected.emit();
    }
  }

  private updateFilteredPlayers(): void {
    this.filteredPlayers = this.playerService.getFilteredPlayersByMultiplePositions(
      this.selectedPositions,
      this.showSelectedPlayers,
      this.selectedTeamIds.length > 0 ? this.selectedTeamIds : undefined,
      this.selectedNationalityIds.length > 0 ? this.selectedNationalityIds : undefined,
      this.searchText
    );
  }



  isPlayerSelected(playerId: number): boolean {
    return this.playerService.isPlayerSelected(playerId);
  }

  isPlayerPlacedThisTurn(playerId: number): boolean {
    return this.placedPlayerIdsThisTurn.has(playerId);
  }


  onImageError(event: any): void {
    event.target.src = 'iniesta.jpg';
  }

  getOvrClass(rating: number): string {
    if (rating >= 85) return 'high';
    if (rating >= 75) return 'mid';
    return 'low';
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

  onRowClick(player: Player, event: Event): void {
    // Open dialog but don't interfere with selection
    event.stopPropagation();
    this.selectedPlayerForDialog = player;
    this.showPlayerDialog = true;
  }

  closePlayerDialog(): void {
    this.showPlayerDialog = false;
    this.selectedPlayerForDialog = null;
  }

  openComparisonDialog(): void {
    if (this.selectedPlayerForDialog) {
      this.comparisonPlayer1 = this.selectedPlayerForDialog;
      this.comparisonPlayer2 = null;
      this.showPlayerDialog = false;
      this.showComparisonDialog = true;
    }
  }

  closeComparisonDialog(): void {
    this.showComparisonDialog = false;
    this.comparisonPlayer1 = null;
    this.comparisonPlayer2 = null;
  }

  private updatePlayerOptions(): void {
    const allPlayers = this.playerService.getPlayers();
    this.playerOptions = allPlayers.map(player => ({
      label: player.commonName || `${player.firstName} ${player.lastName}`,
      value: player
    }));
  }
}
