import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { DraftSettings, DraftManager, Player, FieldPosition, FORMATIONS, FormationName, POSITION_COORDINATES } from '../types';
import { PlayerService } from './player.service';

@Injectable({
  providedIn: 'root'
})
export class DraftService {
  private draftSettingsSubject = new BehaviorSubject<DraftSettings | null>(null);
  private currentPickedPlayerSubject = new BehaviorSubject<Player | null>(null);
  private fieldPositionsSubject = new BehaviorSubject<FieldPosition[]>([]);
  private benchPlayersSubject = new BehaviorSubject<Player[]>([]);
  private currentFormationSubject = new BehaviorSubject<FormationName>('4-3-3 Flat');

  draftSettings$ = this.draftSettingsSubject.asObservable();
  currentPickedPlayer$ = this.currentPickedPlayerSubject.asObservable();
  fieldPositions$ = this.fieldPositionsSubject.asObservable();
  benchPlayers$ = this.benchPlayersSubject.asObservable();
  currentFormation$ = this.currentFormationSubject.asObservable();

  constructor(private playerService: PlayerService) {
    this.initializeFieldPositions();
  }

  initializeDraft(managerNames: string[]): void {
    const managers: DraftManager[] = managerNames.map((name, index) => ({
      id: index,
      name,
      team: []
    }));

    const draftSettings: DraftSettings = {
      managers,
      currentManagerIndex: 0,
      currentRound: 1,
      isSnakeDirection: false,
      maxRounds: 18
    };

    this.draftSettingsSubject.next(draftSettings);
    this.resetCurrentManagerState();
  }

  getCurrentManager(): DraftManager | null {
    const settings = this.draftSettingsSubject.value;
    if (!settings) return null;
    return settings.managers[settings.currentManagerIndex];
  }

  pickPlayer(player: Player): void {
    this.currentPickedPlayerSubject.next(player);
    // Copy to clipboard
    navigator.clipboard.writeText(player.commonName || `${player.firstName} ${player.lastName}`);
  }

  placePlayerOnField(positionId: string): void {
    const pickedPlayer = this.currentPickedPlayerSubject.value;
    if (!pickedPlayer) return;

    const positions = [...this.fieldPositionsSubject.value];
    const positionIndex = positions.findIndex(pos => pos.id === positionId);

    if (positionIndex !== -1) {
      // If there's already a player in this position, move them to bench
      if (positions[positionIndex].player) {
        this.addToBench(positions[positionIndex].player!);
      }

      positions[positionIndex].player = pickedPlayer;
      this.fieldPositionsSubject.next(positions);

      // Clear the current picked player after placement
      this.currentPickedPlayerSubject.next(null);
    }
  }

  addToBench(player: Player): void {
    const bench = [...this.benchPlayersSubject.value];
    if (!bench.find(p => p.id === player.id)) {
      bench.push(player);
      this.benchPlayersSubject.next(bench);
    }
  }

  placePlayerOnBench(): void {
    const pickedPlayer = this.currentPickedPlayerSubject.value;
    if (!pickedPlayer) return;

    // Check if bench is full (max 7 players)
    const currentBench = this.benchPlayersSubject.value;
    if (currentBench.length >= 7) {
      console.warn('Bench is full. Cannot add more than 7 players.');
      return;
    }

    this.addToBench(pickedPlayer);

    // Clear the current picked player after placement
    this.currentPickedPlayerSubject.next(null);
  }

  undoPlayerPlacement(): void {
    const pickedPlayer = this.currentPickedPlayerSubject.value;
    if (!pickedPlayer) return;

    // Remove from field
    const positions = [...this.fieldPositionsSubject.value];
    positions.forEach(pos => {
      if (pos.player?.id === pickedPlayer.id) {
        pos.player = undefined;
      }
    });
    this.fieldPositionsSubject.next(positions);

    // Remove from bench
    const bench = this.benchPlayersSubject.value.filter(p => p.id !== pickedPlayer.id);
    this.benchPlayersSubject.next(bench);

    // Unselect the player so they appear back in the main table
    this.playerService.unselectPlayer(pickedPlayer.id);

    // Clear the current picked player
    this.currentPickedPlayerSubject.next(null);
  }

  finishTurn(): void {
    const settings = this.draftSettingsSubject.value;
    const pickedPlayer = this.currentPickedPlayerSubject.value;

    if (!settings || !pickedPlayer) return;

    // Add player to current manager's team
    const currentManager = settings.managers[settings.currentManagerIndex];
    currentManager.team.push(pickedPlayer);

    // Move to next turn
    this.moveToNextTurn();
  }

  private moveToNextTurn(): void {
    const settings = this.draftSettingsSubject.value;
    if (!settings) return;

    const totalManagers = settings.managers.length;
    let nextManagerIndex: number;
    let nextRound = settings.currentRound;
    let isSnakeDirection = settings.isSnakeDirection;

    if (settings.isSnakeDirection) {
      // Snake draft: going backwards
      nextManagerIndex = settings.currentManagerIndex - 1;
      if (nextManagerIndex < 0) {
        nextManagerIndex = 0;
        nextRound++;
        isSnakeDirection = false;
      }
    } else {
      // Normal direction: going forwards
      nextManagerIndex = settings.currentManagerIndex + 1;
      if (nextManagerIndex >= totalManagers) {
        nextManagerIndex = totalManagers - 1;
        nextRound++;
        isSnakeDirection = true;
      }
    }

    const updatedSettings: DraftSettings = {
      ...settings,
      currentManagerIndex: nextManagerIndex,
      currentRound: nextRound,
      isSnakeDirection
    };

    this.draftSettingsSubject.next(updatedSettings);
    this.resetCurrentManagerState();
  }

  private resetCurrentManagerState(): void {
    this.currentPickedPlayerSubject.next(null);
    this.initializeFieldPositions();
    this.benchPlayersSubject.next([]);

    // Load current manager's team state
    const currentManager = this.getCurrentManager();
    if (currentManager) {
      // For now, just put all players on bench - in a real app you'd save field positions
      this.benchPlayersSubject.next([...currentManager.team]);
    }
  }

  private initializeFieldPositions(): void {
    const formation = this.currentFormationSubject.value;
    this.setFormation(formation);
  }

  setFormation(formationName: FormationName): void {
    const positions = FORMATIONS[formationName];
    const currentPositions = this.fieldPositionsSubject.value;

    // Create a map of existing players by position type
    const existingPlayers = new Map<string, Player>();
    currentPositions.forEach(pos => {
      if (pos.player) {
        const positionLabel = pos.id.toUpperCase().replace(/\d+$/, '');
        existingPlayers.set(pos.id, pos.player);
      }
    });

    // Create new field positions based on the formation
    const newFieldPositions: FieldPosition[] = [];
    const positionCounts = new Map<string, number>();

    positions.forEach((positionType, index) => {
      const count = positionCounts.get(positionType) || 0;
      const positionId = count === 0 ? positionType.toLowerCase() : `${positionType.toLowerCase()}_${count}`;
      positionCounts.set(positionType, count + 1);

      const baseCoords = POSITION_COORDINATES[positionType];

      // Calculate position with slight adjustments for multiple players in same position
      let x = baseCoords.x;
      let y = baseCoords.y;

      // Count how many of this position type we've seen so far (for spacing)
      const positionsProcessedSoFar = positions.slice(0, index + 1).filter(p => p === positionType).length;
      const totalSamePositions = positions.filter(p => p === positionType).length;

      // Adjust x coordinate for multiple positions of the same type
      if (totalSamePositions > 1) {
        const currentIndex = positionsProcessedSoFar - 1;

        if (totalSamePositions === 2) {
          x = baseCoords.x + (currentIndex === 0 ? -12 : 12);
        } else if (totalSamePositions === 3) {
          x = baseCoords.x + (currentIndex === 0 ? -18 : currentIndex === 1 ? 0 : 18);
        } else if (totalSamePositions === 4) {
          x = baseCoords.x + (currentIndex * 12 - 18);
        }
      }

      newFieldPositions.push({
        id: positionId,
        x,
        y,
        player: undefined
      });
    });

    this.currentFormationSubject.next(formationName);
    this.fieldPositionsSubject.next(newFieldPositions);
  }

  getAvailableFormations(): { name: FormationName; label: string }[] {
    return Object.keys(FORMATIONS).map(name => ({
      name: name as FormationName,
      label: name
    }));
  }

  isDraftComplete(): boolean {
    const settings = this.draftSettingsSubject.value;
    return settings ? settings.currentRound > settings.maxRounds : false;
  }

  finishDraft(): void {
    // Mark draft as complete - could add additional logic here
    const settings = this.draftSettingsSubject.value;
    if (settings) {
      const completedSettings = { ...settings, currentRound: settings.maxRounds + 1 };
      this.draftSettingsSubject.next(completedSettings);
    }
  }
}
