import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface UserSettings {
  font: string;
  showLeftMenu: boolean;
}

// Font family mappings
export const FONT_FAMILIES: { [key: string]: string } = {
  'default': 'system-ui',
  'serif': 'Georgia, serif',
  'monospace': 'Courier New, monospace',
  'comic': 'Comic Sans MS, cursive',
  'verdana': 'Verdana, sans-serif'
};

@Injectable({
  providedIn: 'root'
})
export class UserSettingsService {
  private settingsSubject = new BehaviorSubject<UserSettings>({
    font: 'default',
    showLeftMenu: true
  });

  public settings$ = this.settingsSubject.asObservable();

  constructor(private http: HttpClient) {}

  getSettings(): Observable<UserSettings> {
    return this.http.get<UserSettings>('/api/user-settings').pipe(
      tap(settings => this.settingsSubject.next(settings))
    );
  }

  updateSettings(settings: UserSettings): Observable<UserSettings> {
    return this.http.put<UserSettings>('/api/user-settings', settings).pipe(
      tap(updated => this.settingsSubject.next(updated))
    );
  }

  updateFont(font: string): Observable<UserSettings> {
    const current = this.settingsSubject.value;
    return this.updateSettings({ ...current, font });
  }

  updateShowLeftMenu(showLeftMenu: boolean): Observable<UserSettings> {
    const current = this.settingsSubject.value;
    return this.updateSettings({ ...current, showLeftMenu });
  }

  getCurrentSettings(): UserSettings {
    return this.settingsSubject.value;
  }

  /**
   * Apply font immediately to the DOM and update subject
   * Used for instant font changes in the UI
   */
  applyFontImmediately(fontId: string): void {
    const fontFamily = FONT_FAMILIES[fontId] || FONT_FAMILIES['default'];
    document.documentElement.style.fontFamily = fontFamily;
    
    // Update subject immediately
    const current = this.settingsSubject.value;
    this.settingsSubject.next({ ...current, font: fontId });
  }
}
