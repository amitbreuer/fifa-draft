import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { Player, FieldPosition, FormationName, FORMATIONS } from '../../types';
import { DraftService } from '../../services/draft.service';

@Component({
  selector: 'app-field',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    TagModule,
    SelectModule
  ],
  templateUrl: './field.component.html',
  styleUrl: './field.component.scss'
})
export class FieldComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  fieldPositions: FieldPosition[] = [];
  benchPlayers: Player[] = [];
  currentPickedPlayer: Player | null = null;

  private draggedPlayer: Player | null = null;
  private draggedFromPosition: string | null = null;
  private draggedFromBench = false;
  isDragOverBench = false;

  // Tap-to-move state
  selectedPositionId: string | null = null;
  selectedBenchPlayer: Player | null = null;

  // Formation dropdown
  selectedFormation: FormationName = '4-3-3 Attack';
  formations: { label: string; value: FormationName }[] = [];

  constructor(
    private draftService: DraftService
  ) {
    this.formations = Object.keys(FORMATIONS).map(key => ({
      label: key,
      value: key as FormationName
    }));
  }

  ngOnInit(): void {
    // Subscribe to field positions
    this.draftService.fieldPositions$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(positions => {
      this.fieldPositions = positions;
    });

    // Subscribe to bench players
    this.draftService.benchPlayers$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(players => {
      this.benchPlayers = players;
    });

    // Subscribe to current picked player
    this.draftService.currentPickedPlayer$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(player => {
      this.currentPickedPlayer = player;
    });

    // Subscribe to current formation
    this.draftService.currentFormation$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(formation => {
      this.selectedFormation = formation;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onPositionClick(positionId: string): void {
    const position = this.fieldPositions.find(p => p.id === positionId);
    if (!position) return;

    // Priority 1: Place newly picked player
    if (this.currentPickedPlayer) {
      this.draftService.placePlayerOnField(positionId);
      this.clearSelection();
      return;
    }

    // Priority 2: Move selected bench player to this position
    if (this.selectedBenchPlayer) {
      this.draftService.movePlayerFromBenchToField(this.selectedBenchPlayer, positionId);
      this.clearSelection();
      return;
    }

    // Priority 3: If another field position is selected, swap them
    if (this.selectedPositionId && this.selectedPositionId !== positionId) {
      const fromPos = this.fieldPositions.find(p => p.id === this.selectedPositionId);
      if (fromPos?.player) {
        this.draftService.swapFieldPositions(this.selectedPositionId, positionId);
      }
      this.clearSelection();
      return;
    }

    // Priority 4: Select this position (if it has a player)
    if (position.player) {
      if (this.selectedPositionId === positionId) {
        this.clearSelection(); // Deselect on second tap
      } else {
        this.selectedPositionId = positionId;
        this.selectedBenchPlayer = null;
      }
      return;
    }

    this.clearSelection();
  }

  onBenchPlayerClick(player: Player): void {
    // If a field position is selected, swap bench player to that position
    if (this.selectedPositionId) {
      const fieldPos = this.fieldPositions.find(p => p.id === this.selectedPositionId);
      if (fieldPos) {
        this.draftService.movePlayerFromBenchToField(player, this.selectedPositionId);
      }
      this.clearSelection();
      return;
    }

    // Toggle bench player selection
    if (this.selectedBenchPlayer?.id === player.id) {
      this.clearSelection();
    } else {
      this.selectedBenchPlayer = player;
      this.selectedPositionId = null;
    }
  }

  isPositionSelected(positionId: string): boolean {
    return this.selectedPositionId === positionId;
  }

  isBenchPlayerSelected(player: Player): boolean {
    return this.selectedBenchPlayer?.id === player.id;
  }

  private clearSelection(): void {
    this.selectedPositionId = null;
    this.selectedBenchPlayer = null;
  }

  canPlacePlayer(): boolean {
    return this.currentPickedPlayer !== null;
  }

  placeOnBench(): void {
    this.draftService.placePlayerOnBench();
  }

  onBenchClick(): void {
    // Move selected field player to bench
    if (this.selectedPositionId && !this.isBenchFull()) {
      const pos = this.fieldPositions.find(p => p.id === this.selectedPositionId);
      if (pos?.player) {
        this.draftService.movePlayerFromFieldToBench(pos.player, this.selectedPositionId);
        this.clearSelection();
        return;
      }
    }

    // Place newly picked player on bench
    if (this.canPlacePlayer() && !this.isBenchFull()) {
      this.placeOnBench();
    }
  }

  isBenchFull(): boolean {
    return this.benchPlayers.length >= 7;
  }

  getPlayerNumber(player: Player): string {
    // Simple number assignment based on player ID
    return (player.id % 99 + 1).toString();
  }

  getPositionLabel(positionId: string): string {
    // Extract the base position type (remove _0, _1, etc suffixes)
    const basePosition = positionId.replace(/_\d+$/, '').toUpperCase();
    return basePosition;
  }

  trackByPlayerId(_index: number, player: Player): number {
    return player.id;
  }

  // Drag and Drop handlers
  onDragStart(event: DragEvent, player: Player, fromBench: boolean = false): void {
    this.draggedPlayer = player;
    this.draggedFromBench = fromBench;

    // Find if player is on field position
    const fieldPosition = this.fieldPositions.find(pos => pos.player?.id === player.id);
    this.draggedFromPosition = fieldPosition ? fieldPosition.id : null;

    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', player.id.toString());
    }
  }

  onDragEnd(_event: DragEvent): void {
    this.draggedPlayer = null;
    this.draggedFromPosition = null;
    this.draggedFromBench = false;
    this.isDragOverBench = false;
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  onDragEnter(event: DragEvent): void {
    event.preventDefault();
    if (event.target) {
      (event.target as HTMLElement).classList.add('drag-over');
    }
  }

  onDragLeave(event: DragEvent): void {
    if (event.target) {
      (event.target as HTMLElement).classList.remove('drag-over');
    }
  }

  onDrop(event: DragEvent, positionId: string): void {
    event.preventDefault();

    if (event.target) {
      (event.target as HTMLElement).classList.remove('drag-over');
    }

    if (!this.draggedPlayer) return;

    // If dragging from one field position to another
    if (this.draggedFromPosition) {
      this.draftService.swapFieldPositions(this.draggedFromPosition, positionId);
    } else if (this.draggedFromBench) {
      // Dragging from bench to field
      this.draftService.movePlayerFromBenchToField(this.draggedPlayer, positionId);
    }
  }

  onDropToBench(event: DragEvent): void {
    event.preventDefault();
    this.isDragOverBench = false;

    if (event.target) {
      (event.target as HTMLElement).classList.remove('drag-over');
    }

    if (!this.draggedPlayer) return;

    // Only handle dragging from field to bench
    if (this.draggedFromPosition) {
      this.draftService.movePlayerFromFieldToBench(this.draggedPlayer, this.draggedFromPosition);
    }
    // Dragging from bench to bench does nothing (player stays on bench)
  }

  onImageError(event: any): void {
    event.target.src = 'iniesta.jpg';
  }

  onFormationChange(): void {
    this.draftService.setFormation(this.selectedFormation);
  }
}
