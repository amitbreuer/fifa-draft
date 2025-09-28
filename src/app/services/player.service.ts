import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Player, PositionFilter } from '../types';
import playersData from '../../assets/players.json';

@Injectable({
  providedIn: 'root'
})
export class PlayerService {
  private playersSubject = new BehaviorSubject<Player[]>(playersData);
  private selectedPlayerIdsSubject = new BehaviorSubject<Set<number>>(new Set());

  players$ = this.playersSubject.asObservable();
  selectedPlayerIds$ = this.selectedPlayerIdsSubject.asObservable();

  constructor() {}

  getPlayers(): Player[] {
    return this.playersSubject.value;
  }

  getAvailablePlayers(): Player[] {
    const allPlayers = this.playersSubject.value;
    const selectedIds = this.selectedPlayerIdsSubject.value;
    return allPlayers.filter(player => !selectedIds.has(player.id));
  }

  getFilteredPlayers(positionFilter: PositionFilter, showSelected: boolean): Player[] {
    const allPlayers = this.playersSubject.value;
    const selectedIds = this.selectedPlayerIdsSubject.value;

    let filteredPlayers = allPlayers;

    // Filter by position
    if (positionFilter !== 'ALL') {
      filteredPlayers = filteredPlayers.filter(player =>
        player.position.shortLabel === positionFilter ||
        player.alternatePositions?.some(pos => pos.shortLabel === positionFilter)
      );
    }

    // Filter by selected/unselected
    if (showSelected) {
      filteredPlayers = filteredPlayers.filter(player => selectedIds.has(player.id));
    } else {
      filteredPlayers = filteredPlayers.filter(player => !selectedIds.has(player.id));
    }

    return filteredPlayers;
  }

  selectPlayer(playerId: number): void {
    const selectedIds = new Set(this.selectedPlayerIdsSubject.value);
    selectedIds.add(playerId);
    this.selectedPlayerIdsSubject.next(selectedIds);
  }

  unselectPlayer(playerId: number): void {
    const selectedIds = new Set(this.selectedPlayerIdsSubject.value);
    selectedIds.delete(playerId);
    this.selectedPlayerIdsSubject.next(selectedIds);
  }

  isPlayerSelected(playerId: number): boolean {
    return this.selectedPlayerIdsSubject.value.has(playerId);
  }

  getPlayerById(playerId: number): Player | undefined {
    return this.playersSubject.value.find(player => player.id === playerId);
  }
}
