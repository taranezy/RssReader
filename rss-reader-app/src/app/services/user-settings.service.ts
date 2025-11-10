import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface UserSettings {
  font: string;
  showLeftMenu: boolean;
  showFeedImages: boolean;
  headerColor: string;
  darkMode: boolean;
  enablePIP: boolean;
}

// Font family mappings
export const FONT_FAMILIES: { [key: string]: string } = {
  'default': 'system-ui',
  'serif': 'Georgia, serif',
  'monospace': 'Courier New, monospace',
  'comic': 'Comic Sans MS, cursive',
  'verdana': 'Verdana, sans-serif'
};

// Header color themes with complementary gradients
export const HEADER_COLOR_THEMES: { [key: string]: { primary: string; secondary: string; name: string } } = {
  'purple': { primary: '#667eea', secondary: '#764ba2', name: 'Purple Dream' },
  'ocean': { primary: '#2E3192', secondary: '#1BFFFF', name: 'Ocean Blue' },
  'sunset': { primary: '#FF6B6B', secondary: '#FFE66D', name: 'Sunset Orange' },
  'forest': { primary: '#134E5E', secondary: '#71B280', name: 'Forest Green' },
  'rose': { primary: '#E91E63', secondary: '#F06292', name: 'Rose Pink' },
  'midnight': { primary: '#2C3E50', secondary: '#4CA1AF', name: 'Midnight Blue' },
  'fire': { primary: '#C33764', secondary: '#1D2671', name: 'Fire Red' },
  'tropical': { primary: '#11998e', secondary: '#38ef7d', name: 'Tropical Teal' },
  'royal': { primary: '#4A00E0', secondary: '#8E2DE2', name: 'Royal Purple' },
  'amber': { primary: '#F09819', secondary: '#EDDE5D', name: 'Amber Gold' }
};

@Injectable({
  providedIn: 'root'
})
export class UserSettingsService {
  private settingsSubject = new BehaviorSubject<UserSettings>({
    font: 'default',
    showLeftMenu: true,
    showFeedImages: true,
    headerColor: 'purple',
    darkMode: false,
    enablePIP: true
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

  updateShowFeedImages(showFeedImages: boolean): Observable<UserSettings> {
    const current = this.settingsSubject.value;
    return this.updateSettings({ ...current, showFeedImages });
  }

  updateHeaderColor(headerColor: string): Observable<UserSettings> {
    const current = this.settingsSubject.value;
    return this.updateSettings({ ...current, headerColor });
  }

  updateDarkMode(darkMode: boolean): Observable<UserSettings> {
    const current = this.settingsSubject.value;
    this.applyDarkMode(darkMode);
    return this.updateSettings({ ...current, darkMode });
  }

  getCurrentSettings(): UserSettings {
    return this.settingsSubject.value;
  }

  /**
   * Apply dark mode immediately to the DOM
   */
  applyDarkMode(darkMode: boolean): void {
    // Cache to localStorage for instant application on next load
    try {
      localStorage.setItem('darkMode', String(darkMode));
    } catch (e) {
      // localStorage might not be available
    }

    // Apply to both html and body elements
    if (darkMode) {
      document.documentElement.classList.add('dark-mode');
      document.body.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark-mode');
      document.body.classList.remove('dark-mode');
    }
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

  /**
   * Export all user data as XML
   */
  exportData(): Observable<Blob> {
    return this.http.get('/api/export', { 
      responseType: 'blob'
    });
  }

  /**
   * Import user data from XML
   */
  importData(xmlData: string): Observable<any> {
    return this.http.post('/api/import', { xmlData });
  }
}
