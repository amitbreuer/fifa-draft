import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { DraftSettings, DraftManager, Player, FieldPosition } from '../models/player.model';

@Injectable({
  providedIn: 'root'
})
export class DraftService {
  private draftSettingsSubject = new BehaviorSubject<DraftSettings | null>(null);
  private currentPickedPlayerSubject = new BehaviorSubject<Player | null>(null);
  private fieldPositionsSubject = new BehaviorSubject<FieldPosition[]>([]);
  private benchPlayersSubject = new BehaviorSubject<Player[]>([]);

  draftSettings$ = this.draftSettingsSubject.asObservable();
  currentPickedPlayer$ = this.currentPickedPlayerSubject.asObservable();
  fieldPositions$ = this.fieldPositionsSubject.asObservable();
  benchPlayers$ = this.benchPlayersSubject.asObservable();

  constructor() {
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

    this.addToBench(pickedPlayer);
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
    // Initialize field positions in a basic 4-3-3 formation
    const positions: FieldPosition[] = [
      // Goalkeeper
      { id: 'gk', x: 50, y: 10, player: undefined },

      // Defense
      { id: 'rb', x: 80, y: 25, player: undefined },
      { id: 'cb1', x: 60, y: 25, player: undefined },
      { id: 'cb2', x: 40, y: 25, player: undefined },
      { id: 'lb', x: 20, y: 25, player: undefined },

      // Midfield
      { id: 'cm1', x: 65, y: 50, player: undefined },
      { id: 'cm2', x: 50, y: 50, player: undefined },
      { id: 'cm3', x: 35, y: 50, player: undefined },

      // Attack
      { id: 'rw', x: 75, y: 75, player: undefined },
      { id: 'st', x: 50, y: 75, player: undefined },
      { id: 'lw', x: 25, y: 75, player: undefined }
    ];

    this.fieldPositionsSubject.next(positions);
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
