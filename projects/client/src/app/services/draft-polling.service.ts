import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subject, switchMap, timer, takeUntil, tap, retry, catchError, EMPTY } from 'rxjs';
import { DraftApiService, DraftState } from './draft-api.service';

@Injectable({
  providedIn: 'root'
})
export class DraftPollingService implements OnDestroy {
  private destroy$ = new Subject<void>();
  private draftCode$ = new BehaviorSubject<string | null>(null);
  private stateSubject = new BehaviorSubject<DraftState | null>(null);
  private pollingActive = false;

  state$ = this.stateSubject.asObservable();

  constructor(private api: DraftApiService) {}

  /** Start polling a draft every 3 seconds */
  startPolling(code: string): void {
    if (this.pollingActive && this.draftCode$.value === code) return;

    this.stopPolling();
    this.draftCode$.next(code);
    this.pollingActive = true;

    timer(0, 3000).pipe(
      takeUntil(this.destroy$),
      switchMap(() => this.api.getDraftState(code).pipe(
        retry({ count: 2, delay: 1000 }),
        catchError(() => EMPTY)
      )),
      tap(state => this.stateSubject.next(state))
    ).subscribe();
  }

  /** Stop polling */
  stopPolling(): void {
    this.destroy$.next();
    this.destroy$ = new Subject<void>();
    this.pollingActive = false;
  }

  /** Get current state snapshot */
  get currentState(): DraftState | null {
    return this.stateSubject.value;
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }
}
