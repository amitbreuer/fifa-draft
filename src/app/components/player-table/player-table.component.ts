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
import { Player, AVAILABLE_POSITIONS, PositionFilter } from '../../models/player.model';
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
    // Load sample data for now - in real app this would come from JSON file
    this.loadSampleData();

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

  private loadSampleData(): void {
    // Sample data - replace with actual JSON loading
    const samplePlayers: Player[] = [
      {
        id: 1,
        firstName: 'Lionel',
        lastName: 'Messi',
        commonName: 'Messi',
        overallRating: 93,
        skillMoves: 4,
        weakFootAbility: 4,
        position: {
          id: 'RW',
          shortLabel: 'RW',
          label: 'Right Wing',
          positionType: { id: 'ATT', name: 'Attacker' }
        },
        alternatePositions: [
          { id: 'CAM', label: 'Central Attacking Midfielder', shortLabel: 'CAM' },
          { id: 'ST', label: 'Striker', shortLabel: 'ST' }
        ],
        playerAbilities: [
          {
            id: 'finesse_shot',
            label: 'Finesse Shot',
            description: 'Improved finesse shots',
            imageUrl: '',
            type: { id: 'shooting', label: 'Shooting' }
          }
        ],
        team: {
          id: 1,
          label: 'Inter Miami CF',
          imageUrl: 'https://via.placeholder.com/24x24',
          isPopular: true
        },
        nationality: {
          id: 1,
          label: 'Argentina',
          imageUrl: 'https://via.placeholder.com/24x24'
        },
        stats: {
          pace: { value: 85, diff: 0 },
          shooting: { value: 92, diff: 0 },
          passing: { value: 91, diff: 0 },
          dribbling: { value: 95, diff: 0 },
          defending: { value: 35, diff: 0 },
          physical: { value: 65, diff: 0 }
        },
        shieldUrl: 'https://via.placeholder.com/24x24'
      }
      // Add more sample players as needed
    ];

    this.playerService.loadPlayers(samplePlayers);
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
    event.target.src = 'https://via.placeholder.com/24x24?text=?';
  }
}
