import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { DraftSettings, DraftManager, Player, FieldPosition, FORMATIONS, FormationName, POSITION_COORDINATES } from '../types';
import { PlayerService } from './player.service';

type ActionType = 'placeOnField' | 'placeOnBench' | 'moveFromBench' | 'swapField';

interface DraftAction {
  type: ActionType;
  player: Player;
  fromPositionId?: string;
  toPositionId?: string;
  fromBench?: boolean;
  toBench?: boolean;
  swappedPlayer?: Player;
}

@Injectable({
  providedIn: 'root'
})
export class DraftService {
  private draftSettingsSubject = new BehaviorSubject<DraftSettings | null>(null);
  private currentPickedPlayerSubject = new BehaviorSubject<Player | null>(null);
  private fieldPositionsSubject = new BehaviorSubject<FieldPosition[]>([]);
  private benchPlayersSubject = new BehaviorSubject<Player[]>([]);
  private currentFormationSubject = new BehaviorSubject<FormationName>('4-3-3 Flat');
  private hasPlacedPlayerThisTurnSubject = new BehaviorSubject<boolean>(false);
  private placedPlayerIdsThisTurnSubject = new BehaviorSubject<Set<number>>(new Set());
  private actionHistorySubject = new BehaviorSubject<DraftAction[]>([]);

  draftSettings$ = this.draftSettingsSubject.asObservable();
  currentPickedPlayer$ = this.currentPickedPlayerSubject.asObservable();
  fieldPositions$ = this.fieldPositionsSubject.asObservable();
  benchPlayers$ = this.benchPlayersSubject.asObservable();
  currentFormation$ = this.currentFormationSubject.asObservable();
  hasPlacedPlayerThisTurn$ = this.hasPlacedPlayerThisTurnSubject.asObservable();
  placedPlayerIdsThisTurn$ = this.placedPlayerIdsThisTurnSubject.asObservable();
  actionHistory$ = this.actionHistorySubject.asObservable();

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
      const existingPlayer = positions[positionIndex].player;

      // Track the action
      const action: DraftAction = {
        type: existingPlayer ? 'swapField' : 'placeOnField',
        player: pickedPlayer,
        toPositionId: positionId,
        swappedPlayer: existingPlayer
      };

      // If there's already a player in this position, move them to bench
      if (existingPlayer) {
        this.addToBench(existingPlayer);
      }

      positions[positionIndex].player = pickedPlayer;
      this.fieldPositionsSubject.next(positions);

      // Track this player as placed this turn
      const placedIds = new Set(this.placedPlayerIdsThisTurnSubject.value);
      placedIds.add(pickedPlayer.id);
      this.placedPlayerIdsThisTurnSubject.next(placedIds);

      // Add action to history
      const history = [...this.actionHistorySubject.value, action];
      this.actionHistorySubject.next(history);

      // Mark that player has been placed this turn
      this.hasPlacedPlayerThisTurnSubject.next(true);

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

  // Method for drag-and-drop within field (swapping positions)
  swapFieldPositions(fromPositionId: string, toPositionId: string): void {
    const positions = [...this.fieldPositionsSubject.value];
    const fromPos = positions.find(pos => pos.id === fromPositionId);
    const toPos = positions.find(pos => pos.id === toPositionId);

    if (!fromPos || !toPos || !fromPos.player) return;

    const fromPlayer = fromPos.player;
    const toPlayer = toPos.player;

    // Swap players
    fromPos.player = toPlayer;
    toPos.player = fromPlayer;

    this.fieldPositionsSubject.next(positions);

    // Track the action
    const action: DraftAction = {
      type: 'swapField',
      player: fromPlayer,
      fromPositionId,
      toPositionId,
      swappedPlayer: toPlayer
    };

    const history = [...this.actionHistorySubject.value, action];
    this.actionHistorySubject.next(history);
    this.hasPlacedPlayerThisTurnSubject.next(true);
  }

  // Method for drag-and-drop from bench to field
  movePlayerFromBenchToField(player: Player, toPositionId: string): void {
    const positions = [...this.fieldPositionsSubject.value];
    const bench = [...this.benchPlayersSubject.value];
    const targetPos = positions.find(pos => pos.id === toPositionId);

    if (!targetPos) return;

    const existingPlayer = targetPos.player;

    // Remove from bench
    const benchIndex = bench.findIndex(p => p.id === player.id);
    if (benchIndex !== -1) {
      bench.splice(benchIndex, 1);
    }

    // If target has a player, swap them to bench
    if (existingPlayer) {
      bench.push(existingPlayer);
    }

    targetPos.player = player;

    this.fieldPositionsSubject.next(positions);
    this.benchPlayersSubject.next(bench);

    // Track the action
    const action: DraftAction = {
      type: existingPlayer ? 'swapField' : 'moveFromBench',
      player,
      toPositionId,
      fromBench: true,
      swappedPlayer: existingPlayer
    };

    const history = [...this.actionHistorySubject.value, action];
    this.actionHistorySubject.next(history);
    this.hasPlacedPlayerThisTurnSubject.next(true);
  }

  // Method for drag-and-drop from field to bench
  movePlayerFromFieldToBench(player: Player, fromPositionId: string): void {
    const positions = [...this.fieldPositionsSubject.value];
    const bench = [...this.benchPlayersSubject.value];

    // Check if bench is full
    if (bench.length >= 7) {
      console.warn('Bench is full. Cannot add more than 7 players.');
      return;
    }

    const fromPos = positions.find(pos => pos.id === fromPositionId);
    if (!fromPos) return;

    // Remove from field
    fromPos.player = undefined;

    // Add to bench
    bench.push(player);

    this.fieldPositionsSubject.next(positions);
    this.benchPlayersSubject.next(bench);

    // Track the action
    const action: DraftAction = {
      type: 'moveFromBench', // We'll treat this as reverse operation
      player,
      fromPositionId,
      toBench: true
    };

    const history = [...this.actionHistorySubject.value, action];
    this.actionHistorySubject.next(history);
    this.hasPlacedPlayerThisTurnSubject.next(true);
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

    // Track the action
    const action: DraftAction = {
      type: 'placeOnBench',
      player: pickedPlayer,
      toBench: true
    };

    this.addToBench(pickedPlayer);

    // Track this player as placed this turn
    const placedIds = new Set(this.placedPlayerIdsThisTurnSubject.value);
    placedIds.add(pickedPlayer.id);
    this.placedPlayerIdsThisTurnSubject.next(placedIds);

    // Add action to history
    const history = [...this.actionHistorySubject.value, action];
    this.actionHistorySubject.next(history);

    // Mark that player has been placed this turn
    this.hasPlacedPlayerThisTurnSubject.next(true);

    // Clear the current picked player after placement
    this.currentPickedPlayerSubject.next(null);
  }

  undoPlayerPlacement(): void {
    const history = this.actionHistorySubject.value;
    if (history.length === 0) return;

    // Get the last action
    const lastAction = history[history.length - 1];
    const positions = [...this.fieldPositionsSubject.value];
    const bench = [...this.benchPlayersSubject.value];

    // Undo based on action type
    switch (lastAction.type) {
      case 'placeOnField':
        // Remove player from field
        const fieldPos = positions.find(pos => pos.id === lastAction.toPositionId);
        if (fieldPos) {
          fieldPos.player = undefined;
        }
        break;

      case 'placeOnBench':
        // Remove player from bench
        const benchIndex = bench.findIndex(p => p.id === lastAction.player.id);
        if (benchIndex !== -1) {
          bench.splice(benchIndex, 1);
        }
        break;

      case 'swapField':
        if (lastAction.fromBench) {
          // Undo bench to field move (with possible swap)
          const pos = positions.find(p => p.id === lastAction.toPositionId);
          if (pos) {
            // Put player back on bench
            bench.push(lastAction.player);
            // Restore swapped player to field or clear position
            pos.player = lastAction.swappedPlayer;
            // Remove swapped player from bench if they were swapped
            if (lastAction.swappedPlayer) {
              const swappedIdx = bench.findIndex(p => p.id === lastAction.swappedPlayer!.id);
              if (swappedIdx !== -1) {
                bench.splice(swappedIdx, 1);
              }
            }
          }
        } else if (lastAction.toBench) {
          // Undo field to bench move
          const pos = positions.find(p => p.id === lastAction.fromPositionId);
          if (pos) {
            // Remove from bench
            const idx = bench.findIndex(p => p.id === lastAction.player.id);
            if (idx !== -1) {
              bench.splice(idx, 1);
            }
            // Put back on field
            pos.player = lastAction.player;
          }
        } else if (lastAction.fromPositionId && lastAction.toPositionId) {
          // Undo field position swap
          const fromPos = positions.find(p => p.id === lastAction.fromPositionId);
          const toPos = positions.find(p => p.id === lastAction.toPositionId);
          if (fromPos && toPos) {
            // Swap back
            const temp = fromPos.player;
            fromPos.player = toPos.player;
            toPos.player = temp;
          }
        } else {
          // Original swapField logic (placing from selection with swap)
          const swapPos = positions.find(pos => pos.id === lastAction.toPositionId);
          if (swapPos) {
            swapPos.player = undefined;
          }
          if (lastAction.swappedPlayer) {
            const swappedBenchIndex = bench.findIndex(p => p.id === lastAction.swappedPlayer!.id);
            if (swappedBenchIndex !== -1) {
              bench.splice(swappedBenchIndex, 1);
            }
            if (swapPos) {
              swapPos.player = lastAction.swappedPlayer;
            }
          }
        }
        break;

      case 'moveFromBench':
        if (lastAction.toBench) {
          // Undo field to bench move
          const pos = positions.find(p => p.id === lastAction.fromPositionId);
          if (pos) {
            // Remove from bench
            const idx = bench.findIndex(p => p.id === lastAction.player.id);
            if (idx !== -1) {
              bench.splice(idx, 1);
            }
            // Put back on field
            pos.player = lastAction.player;
          }
        } else {
          // Undo bench to field move
          const pos = positions.find(p => p.id === lastAction.toPositionId);
          if (pos) {
            pos.player = undefined;
            // Put back on bench
            bench.push(lastAction.player);
          }
        }
        break;
    }

    // Update state
    this.fieldPositionsSubject.next(positions);
    this.benchPlayersSubject.next(bench);

    // Remove player from placed this turn tracking
    const placedIds = new Set(this.placedPlayerIdsThisTurnSubject.value);
    placedIds.delete(lastAction.player.id);
    this.placedPlayerIdsThisTurnSubject.next(placedIds);

    // Remove the last action from history
    const newHistory = history.slice(0, -1);
    this.actionHistorySubject.next(newHistory);

    // Clear the current picked player
    this.currentPickedPlayerSubject.next(null);

    // Check if there are still any actions
    this.hasPlacedPlayerThisTurnSubject.next(newHistory.length > 0);
  }

  finishTurn(): void {
    const settings = this.draftSettingsSubject.value;
    if (!settings) return;

    // Get all placed players this turn
    const placedIds = this.placedPlayerIdsThisTurnSubject.value;

    // Mark all placed players as permanently selected
    placedIds.forEach(playerId => {
      this.playerService.selectPlayer(playerId);
    });

    // Add all placed players to current manager's team
    const currentManager = settings.managers[settings.currentManagerIndex];
    const allPlayers = [
      ...this.fieldPositionsSubject.value.filter(pos => pos.player).map(pos => pos.player!),
      ...this.benchPlayersSubject.value
    ];

    allPlayers.forEach(player => {
      if (!currentManager.team.find(p => p.id === player.id)) {
        currentManager.team.push(player);
      }
    });

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
    this.hasPlacedPlayerThisTurnSubject.next(false);
    this.placedPlayerIdsThisTurnSubject.next(new Set());
    this.actionHistorySubject.next([]);

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
