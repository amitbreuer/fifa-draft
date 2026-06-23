import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Player, PositionFilter, Dataset } from '../types';
import { environment } from '../../environments/environment';
import playersData from '../../assets/data/2026.json';

@Injectable({
  providedIn: 'root'
})
export class PlayerService {
  private playersSubject = new BehaviorSubject<Player[]>(playersData);
  private selectedPlayerIdsSubject = new BehaviorSubject<Set<number>>(new Set());
  private datasetsSubject = new BehaviorSubject<Dataset[]>([
    { id: 'fc-2026', label: 'EA FC 25/26', file: 'fc-2026.json', default: true }
  ]);
  private currentDatasetSubject = new BehaviorSubject<string>('fc-2026');

  players$ = this.playersSubject.asObservable();
  selectedPlayerIds$ = this.selectedPlayerIdsSubject.asObservable();
  datasets$ = this.datasetsSubject.asObservable();
  currentDataset$ = this.currentDatasetSubject.asObservable();

  constructor(private http: HttpClient) {}

  /** Fetch available datasets from server */
  loadDatasets(): Observable<Dataset[]> {
    return this.http.get<Dataset[]>(`${environment.apiUrl}/api/players/datasets`).pipe(
      tap(datasets => this.datasetsSubject.next(datasets))
    );
  }

  /** Load a specific dataset's players */
  loadDataset(datasetId: string): Observable<Player[]> {
    if (datasetId === 'fc-2026' && this.currentDatasetSubject.value === 'fc-2026') {
      // Already loaded from bundled data
      return new Observable(sub => {
        sub.next(this.playersSubject.value);
        sub.complete();
      });
    }

    return this.http.get<Player[]>(`${environment.apiUrl}/api/players/${datasetId}`).pipe(
      tap(players => {
        this.playersSubject.next(players);
        this.currentDatasetSubject.next(datasetId);
        this.selectedPlayerIdsSubject.next(new Set()); // reset selections
      })
    );
  }

  get currentDatasetId(): string {
    return this.currentDatasetSubject.value;
  }

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

  getFilteredPlayersByMultiplePositions(
    positionFilters: PositionFilter[],
    showSelected: boolean,
    teamId?: number,
    nationalityId?: number
  ): Player[] {
    const allPlayers = this.playersSubject.value;
    const selectedIds = this.selectedPlayerIdsSubject.value;

    let filteredPlayers = allPlayers;

    // Filter by multiple positions
    if (positionFilters.length > 0) {
      filteredPlayers = filteredPlayers.filter(player =>
        positionFilters.some(position =>
          player.position.shortLabel === position ||
          player.alternatePositions?.some(pos => pos.shortLabel === position)
        )
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
