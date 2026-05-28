import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TelegramService } from './telegram.service';
import { environment } from '../../environments/environment';

export interface DraftResponse {
  id: string;
  shortCode: string;
  name: string;
}

export interface ManagerInfo {
  id: number;
  slotIndex: number;
  formation: string;
  fieldPositions: any;
  benchPlayerIds: number[];
  userId: number;
  username: string;
  firstName: string;
  lastSeenAt: string | null;
}

export interface PickInfo {
  id: number;
  draftId: string;
  managerId: number;
  playerId: number;
  round: number;
  pickOrder: number;
}

export interface DraftState {
  id: string;
  shortCode: string;
  name: string;
  status: 'waiting' | 'active' | 'complete';
  maxRounds: number;
  currentManagerIndex: number;
  currentRound: number;
  isSnakeDirection: boolean;
  managers: ManagerInfo[];
  picks: PickInfo[];
}

export interface PickResponse {
  message: string;
  nextManagerIndex: number;
  round: number;
  status: string;
}

@Injectable({
  providedIn: 'root'
})
export class DraftApiService {
  private baseUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private telegram: TelegramService
  ) {}

  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    if (this.telegram.isInTelegram) {
      headers = headers.set('X-Telegram-Init-Data', this.telegram.initData);
    } else {
      // Dev mode
      headers = headers.set('X-Dev-Telegram-Id', '12345');
    }

    return headers;
  }

  createDraft(name: string, maxManagers: number, maxRounds: number): Observable<DraftResponse> {
    return this.http.post<DraftResponse>(
      `${this.baseUrl}/api/drafts`,
      { name, maxManagers, maxRounds },
      { headers: this.getHeaders() }
    );
  }

  joinDraft(code: string): Observable<{ message: string; slotIndex: number }> {
    return this.http.post<{ message: string; slotIndex: number }>(
      `${this.baseUrl}/api/drafts/${code}/join`,
      {},
      { headers: this.getHeaders() }
    );
  }

  startDraft(code: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.baseUrl}/api/drafts/${code}/start`,
      {},
      { headers: this.getHeaders() }
    );
  }

  getDraftState(code: string): Observable<DraftState> {
    return this.http.get<DraftState>(
      `${this.baseUrl}/api/drafts/${code}/state`,
      { headers: this.getHeaders() }
    );
  }

  getDraftInfo(code: string): Observable<any> {
    return this.http.get(
      `${this.baseUrl}/api/drafts/${code}`,
      { headers: this.getHeaders() }
    );
  }

  submitPick(code: string, playerId: number): Observable<PickResponse> {
    return this.http.post<PickResponse>(
      `${this.baseUrl}/api/drafts/${code}/pick`,
      { playerId },
      { headers: this.getHeaders() }
    );
  }

  updateSquad(code: string, data: { formation?: string; fieldPositions?: any; benchPlayerIds?: number[] }): Observable<any> {
    return this.http.put(
      `${this.baseUrl}/api/drafts/${code}/squad`,
      data,
      { headers: this.getHeaders() }
    );
  }
}
