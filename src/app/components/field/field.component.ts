import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { Player, FieldPosition } from '../../types';
import { DraftService } from '../../services/draft.service';
import { PlayerService } from '../../services/player.service';

@Component({
  selector: 'app-field',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    TagModule
  ],
  templateUrl: './field.component.html',
  styleUrl: './field.component.scss'
})
export class FieldComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  fieldPositions: FieldPosition[] = [];
  benchPlayers: Player[] = [];
  currentPickedPlayer: Player | null = null;
  freePositionedPlayers: { player: Player, x: number, y: number }[] = [];

  private draggedPlayer: Player | null = null;
  private draggedFromPosition: string | null = null;
  private draggedFromFreePosition = false;
  isDragOverBench = false;

  constructor(
    private draftService: DraftService,
    private playerService: PlayerService
  ) {}

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

  undoPlacement(): void {
    this.draftService.undoPlayerPlacement();
  }

  getPlayerNumber(player: Player): string {
    // Simple number assignment based on player ID
    return (player.id % 99 + 1).toString();
  }

  getPositionLabel(positionId: string): string {
    const labels: { [key: string]: string } = {
      'gk': 'GK',
      'rb': 'RB',
      'cb1': 'CB',
      'cb2': 'CB',
      'lb': 'LB',
      'cm1': 'CM',
      'cm2': 'CM',
      'cm3': 'CM',
      'rw': 'RW',
      'st': 'ST',
      'lw': 'LW'
    };
    return labels[positionId] || positionId.toUpperCase();
  }

  trackByPlayerId(index: number, player: Player): number {
    return player.id;
  }

  // Drag and Drop handlers
  onDragStart(event: DragEvent, player: Player): void {
    this.draggedPlayer = player;

    // Find if player is on field position
    const fieldPosition = this.fieldPositions.find(pos => pos.player?.id === player.id);
    this.draggedFromPosition = fieldPosition ? fieldPosition.id : null;

    // Check if player is in free position
    const freePositionIndex = this.freePositionedPlayers.findIndex(fp => fp.player.id === player.id);
    this.draggedFromFreePosition = freePositionIndex !== -1;

    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', player.id.toString());
    }
  }

  onDragEnd(event: DragEvent): void {
    this.draggedPlayer = null;
    this.draggedFromPosition = null;
    this.draggedFromFreePosition = false;
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

    // Remove player from original position
    this.removePlayerFromOriginalPosition();

    // Place player in new position
    const targetPosition = this.fieldPositions.find(pos => pos.id === positionId);
    if (targetPosition) {
      // If target position has a player, move them to bench
      if (targetPosition.player) {
        this.draftService.addToBench(targetPosition.player);
      }
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

    // Remove player from original position
    this.removePlayerFromOriginalPosition();

    // Add to bench
    this.draftService.addToBench(this.draggedPlayer);
  }

  // Free positioning on field
  onFieldDrop(event: DragEvent): void {
    event.preventDefault();

    if (!this.draggedPlayer) return;

    const fieldElement = event.currentTarget as HTMLElement;
    const rect = fieldElement.getBoundingClientRect();

    // Calculate relative position within the field (as percentages)
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    // Remove player from original positions
    this.removePlayerFromOriginalPosition();

    // Add or update player in free position
    const existingIndex = this.freePositionedPlayers.findIndex(fp => fp.player.id === this.draggedPlayer!.id);
    if (existingIndex !== -1) {
      // Update existing position
      this.freePositionedPlayers[existingIndex] = { player: this.draggedPlayer, x, y };
    } else {
      // Add new free position
      this.freePositionedPlayers.push({ player: this.draggedPlayer, x, y });
    }
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
    const benchIndex = this.benchPlayers.findIndex(p => p.id === this.draggedPlayer!.id);
    if (benchIndex !== -1) {
      this.benchPlayers.splice(benchIndex, 1);
    }

    // Remove from free positions if dragging from there
    if (this.draggedFromFreePosition) {
      const freeIndex = this.freePositionedPlayers.findIndex(fp => fp.player.id === this.draggedPlayer!.id);
      if (freeIndex !== -1) {
        this.freePositionedPlayers.splice(freeIndex, 1);
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
}
