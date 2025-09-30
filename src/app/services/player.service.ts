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

  getFilteredPlayers(
    positionFilter: PositionFilter,
    showSelected: boolean,
    teamId?: number,
    nationalityId?: number
  ): Player[] {
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

    // Filter by team
    if (teamId !== undefined && teamId !== null) {
      filteredPlayers = filteredPlayers.filter(player => player.team.id === teamId);
    }

    // Filter by nationality
    if (nationalityId !== undefined && nationalityId !== null) {
      filteredPlayers = filteredPlayers.filter(player => player.nationality.id === nationalityId);
    }

    // Filter by selected/unselected
    if (showSelected) {
      filteredPlayers = filteredPlayers.filter(player => selectedIds.has(player.id));
    } else {
      filteredPlayers = filteredPlayers.filter(player => !selectedIds.has(player.id));
    }

    return filteredPlayers;
  }

  getAllTeams(): { id: number; label: string; imageUrl: string }[] {
    const allPlayers = this.playersSubject.value;
    const teamsMap = new Map<number, { id: number; label: string; imageUrl: string }>();

    allPlayers.forEach(player => {
      if (!teamsMap.has(player.team.id)) {
        teamsMap.set(player.team.id, player.team);
      }
    });

    return Array.from(teamsMap.values()).sort((a, b) => a.label.localeCompare(b.label));
  }

  getAllNationalities(): { id: number; label: string; imageUrl: string }[] {
    const allPlayers = this.playersSubject.value;
    const nationalitiesMap = new Map<number, { id: number; label: string; imageUrl: string }>();

    allPlayers.forEach(player => {
      if (!nationalitiesMap.has(player.nationality.id)) {
        nationalitiesMap.set(player.nationality.id, player.nationality);
      }
    });

    return Array.from(nationalitiesMap.values()).sort((a, b) => a.label.localeCompare(b.label));
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
