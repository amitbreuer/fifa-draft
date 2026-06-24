import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

export interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    user?: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
      language_code?: string;
    };
    start_param?: string;
  };
  version: string;
  platform: string;
  colorScheme: 'light' | 'dark';
  themeParams: Record<string, string>;
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isActive: boolean;
    show(): void;
    hide(): void;
    setText(text: string): void;
    onClick(callback: () => void): void;
    offClick(callback: () => void): void;
    enable(): void;
    disable(): void;
    showProgress(leaveActive?: boolean): void;
    hideProgress(): void;
  };
  BackButton: {
    isVisible: boolean;
    show(): void;
    hide(): void;
    onClick(callback: () => void): void;
    offClick(callback: () => void): void;
  };
  HapticFeedback: {
    impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void;
    notificationOccurred(type: 'error' | 'success' | 'warning'): void;
    selectionChanged(): void;
  };
  ready(): void;
  expand(): void;
  close(): void;
  disableVerticalSwipes(): void;
  enableVerticalSwipes(): void;
  setHeaderColor(color: string): void;
  setBackgroundColor(color: string): void;
  onEvent(eventType: string, callback: () => void): void;
  offEvent(eventType: string, callback: () => void): void;
}

@Injectable({
  providedIn: 'root'
})
export class TelegramService {
  private webApp: TelegramWebApp | null = null;
  private readySubject = new BehaviorSubject<boolean>(false);

  ready$ = this.readySubject.asObservable();

  constructor(private ngZone: NgZone) {
    this.initialize();
  }

  private initialize(): void {
    if (window.Telegram?.WebApp) {
      this.webApp = window.Telegram.WebApp;
      this.webApp.ready();
      this.webApp.expand();
      this.webApp.disableVerticalSwipes();
      this.readySubject.next(true);
    }
  }

  get isInTelegram(): boolean {
    return !!this.webApp?.initData;
  }

  get initData(): string {
    return this.webApp?.initData || '';
  }

  get user() {
    return this.webApp?.initDataUnsafe?.user || null;
  }

  get startParam(): string | undefined {
    return this.webApp?.initDataUnsafe?.start_param;
  }

  get colorScheme(): 'light' | 'dark' {
    return this.webApp?.colorScheme || 'dark';
  }

  // Main Button
  showMainButton(text: string, onClick: () => void): void {
    if (!this.webApp) return;
    this.webApp.MainButton.setText(text);
    this.webApp.MainButton.onClick(() => this.ngZone.run(onClick));
    this.webApp.MainButton.show();
  }

  hideMainButton(): void {
    this.webApp?.MainButton.hide();
  }

  setMainButtonLoading(loading: boolean): void {
    if (!this.webApp) return;
    if (loading) {
      this.webApp.MainButton.showProgress();
    } else {
      this.webApp.MainButton.hideProgress();
    }
  }

  // Back Button
  showBackButton(onClick: () => void): void {
    if (!this.webApp) return;
    this.webApp.BackButton.onClick(() => this.ngZone.run(onClick));
    this.webApp.BackButton.show();
  }

  hideBackButton(): void {
    this.webApp?.BackButton.hide();
  }

  // Haptic Feedback
  hapticImpact(style: 'light' | 'medium' | 'heavy' = 'medium'): void {
    this.webApp?.HapticFeedback.impactOccurred(style);
  }

  hapticNotification(type: 'success' | 'warning' | 'error'): void {
    this.webApp?.HapticFeedback.notificationOccurred(type);
  }

  hapticSelection(): void {
    this.webApp?.HapticFeedback.selectionChanged();
  }

  close(): void {
    this.webApp?.close();
  }
}
