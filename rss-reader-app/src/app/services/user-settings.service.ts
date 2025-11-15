import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

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
  private readonly apiUrl = environment.apiUrl || '/api';
  private settingsSubject = new BehaviorSubject<UserSettings>({
    font: 'default',
    showLeftMenu: true,
    showFeedImages: true,
    headerColor: 'purple',
    darkMode: false,
    enablePIP: true
  });

  public settings$ = this.settingsSubject.asObservable();
  private settingsLoaded = false; // Track if settings have been successfully loaded

  constructor(private http: HttpClient) {
    // Try to restore settings from localStorage on init
    this.restoreFromLocalStorage();
  }

  /**
   * Restore settings from localStorage if available
   */
  private restoreFromLocalStorage(): void {
    try {
      // Only access localStorage in browser environment
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return;
      }
      
      const saved = localStorage.getItem('userSettings');
      if (saved) {
        const settings = JSON.parse(saved);
        // Validate that it has the required properties
        if (settings.font && settings.headerColor !== undefined) {
          this.settingsSubject.next(settings);
        }
      }
    } catch (e) {
      console.warn('[UserSettingsService] Failed to restore from localStorage:', e);
    }
  }

  /**
   * Extract data from wrapped API response {success, data}
   * Falls back to original response if not wrapped
   */
  private extractData<T>(response: any): T {
    return response?.data !== undefined ? response.data : response;
  }

  getSettings(): Observable<UserSettings> {
    return this.http.get<any>(`${this.apiUrl}/user-settings`, { withCredentials: true }).pipe(
      map(response => {
        const settings = this.extractData<UserSettings>(response);
        return settings;
      }),
      tap(settings => {
        this.settingsSubject.next(settings);
        this.settingsLoaded = true;
        // Save to localStorage for future offline access
        try {
          if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
            localStorage.setItem('userSettings', JSON.stringify(settings));
          }
        } catch (e) {
          console.warn('[UserSettingsService] Failed to save to localStorage:', e);
        }
      }),
      catchError(error => {
        console.error('[UserSettingsService] Error fetching settings:', error);
        // Don't overwrite current settings on error - keep what we have
        return of(this.settingsSubject.value);
      })
    );
  }

  updateSettings(settings: UserSettings): Observable<UserSettings> {
    return this.http.put<any>(`${this.apiUrl}/user-settings`, settings, { withCredentials: true }).pipe(
      map(response => this.extractData<UserSettings>(response)),
      tap(updated => {
        this.settingsSubject.next(updated);
        // Save to localStorage
        try {
          if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
            localStorage.setItem('userSettings', JSON.stringify(updated));
          }
        } catch (e) {
          console.warn('[UserSettingsService] Failed to save updated settings to localStorage:', e);
        }
      }),
      catchError((error: any) => {
        console.error('[UserSettingsService] Error updating settings:', error);
        // On error, keep the current settings - don't reset
        return of(this.settingsSubject.value);
      })
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
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        localStorage.setItem('darkMode', String(darkMode));
      }
    } catch (e) {
      // localStorage might not be available
    }

    // Apply to both html and body elements (only in browser)
    if (typeof document !== 'undefined') {
      if (darkMode) {
        document.documentElement.classList.add('dark-mode');
        document.body.classList.add('dark-mode');
      } else {
        document.documentElement.classList.remove('dark-mode');
        document.body.classList.remove('dark-mode');
      }
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
  exportData(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/export`, { 
      responseType: 'json',
      withCredentials: true
    }).pipe(
      map(response => this.extractData<any>(response)),
      catchError((error: any) => {
        console.error('[UserSettingsService] Error exporting data:', error);
        return of(null);
      })
    );
  }

  /**
   * Import user data from XML
   */
  importData(xmlData: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/import`, { xmlData }, { withCredentials: true }).pipe(
      map(response => this.extractData<any>(response)),
      catchError((error: any) => {
        console.error('[UserSettingsService] Error importing data:', error);
        return of(null);
      })
    );
  }
}
