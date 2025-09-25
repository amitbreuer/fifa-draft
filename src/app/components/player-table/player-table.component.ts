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
import { Player, AVAILABLE_POSITIONS, PositionFilter } from '../../types';
import { PlayerService } from '../../services/player.service';
import { DraftService } from '../../services/draft.service';

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
    TagModule
  ],
  templateUrl: './player-table.component.html',
  styleUrl: './player-table.component.scss'
})
export class PlayerTableComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  filteredPlayers: Player[] = [];
  selectedPlayer: Player | null = null;
  expandedRows: { [key: string]: boolean } = {};

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

  toggleRow(player: Player, event: Event): void {
    event.stopPropagation();
    this.expandedRows[player.id] = !this.expandedRows[player.id];
  }

  pickPlayer(): void {
    if (this.selectedPlayer && !this.isPlayerSelected(this.selectedPlayer.id)) {
      this.draftService.pickPlayer(this.selectedPlayer);
      this.selectedPlayer = null;
    }
  }

  isPlayerSelected(playerId: number): boolean {
    return this.playerService.isPlayerSelected(playerId);
  }

  getPlayerDisplayName(player: Player): string {
    return this.playerService.getPlayerDisplayName(player);
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
}
