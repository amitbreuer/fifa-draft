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
import { PlayerService } from '../../services/player.service';

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

  // Formation dropdown
  selectedFormation: FormationName = '4-3-3 Flat';
  formations: { label: string; value: FormationName }[] = [];

  constructor(
    private draftService: DraftService,
    private playerService: PlayerService
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
    if (this.canPlacePlayer()) {
      this.draftService.placePlayerOnField(positionId);
    }
  }

  canPlacePlayer(): boolean {
    return this.currentPickedPlayer !== null;
  }

  placeOnBench(): void {
    this.draftService.placePlayerOnBench();
  }

  onBenchClick(): void {
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

  trackByPlayerId(index: number, player: Player): number {
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

  onDragEnd(event: DragEvent): void {
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

    // Find target position
    const targetPosition = this.fieldPositions.find(pos => pos.id === positionId);
    if (!targetPosition) return;

    const targetPlayer = targetPosition.player;

    // If dragging from one field position to another (swap scenario)
    if (this.draggedFromPosition && targetPlayer) {
      // Swap: put target player in the dragged player's original position
      const originalPosition = this.fieldPositions.find(pos => pos.id === this.draggedFromPosition);
      if (originalPosition) {
        originalPosition.player = targetPlayer;
        targetPosition.player = this.draggedPlayer;
      }
    } else {
      // Remove player from original position (bench or empty position)
      this.removePlayerFromOriginalPosition();

      // If target position has a player and we're dragging from bench, move target to bench
      if (targetPlayer && this.draggedFromBench) {
        this.draftService.addToBench(targetPlayer);
      }

      // Place dragged player in target position
      targetPosition.player = this.draggedPlayer;
    }
  }

  onDropToBench(event: DragEvent): void {
    event.preventDefault();
    this.isDragOverBench = false;

    if (event.target) {
      (event.target as HTMLElement).classList.remove('drag-over');
    }

    if (!this.draggedPlayer) return;

    // Check if bench is full (max 7 players) and dragging from field
    if (this.isBenchFull() && !this.draggedFromBench) {
      console.warn('Bench is full. Cannot add more than 7 players.');
      return;
    }

    // Remove player from original position
    this.removePlayerFromOriginalPosition();

    // Add to bench
    this.draftService.addToBench(this.draggedPlayer);
  }

  private removePlayerFromOriginalPosition(): void {
    if (!this.draggedPlayer) return;

    // Remove from fixed positions
    if (this.draggedFromPosition) {
      const originalPosition = this.fieldPositions.find(pos => pos.id === this.draggedFromPosition);
      if (originalPosition) {
        originalPosition.player = undefined;
      }
    }

    // Remove from bench
    if (this.draggedFromBench) {
      const benchIndex = this.benchPlayers.findIndex(p => p.id === this.draggedPlayer!.id);
      if (benchIndex !== -1) {
        this.benchPlayers.splice(benchIndex, 1);
      }
    }
  }

  onShirtImageError(event: any): void {
    // Fallback to a colored rectangle if shirt image fails
    event.target.style.display = 'none';
    const parent = event.target.parentElement;
    if (parent && !parent.querySelector('.fallback-shirt')) {
      const fallback = document.createElement('div');
      fallback.className = 'fallback-shirt';
      fallback.style.cssText = `
        width: 50px;
        height: 50px;
        background: linear-gradient(45deg, #007ad9, #0056b3);
        border-radius: 8px;
        position: absolute;
        top: 0;
        left: 0;
      `;
      parent.appendChild(fallback);
    }
  }

  onFormationChange(): void {
    this.draftService.setFormation(this.selectedFormation);
  }
}
