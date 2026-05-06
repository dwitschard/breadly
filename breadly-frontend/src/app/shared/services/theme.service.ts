import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'breadly-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly _theme = signal<'light' | 'dark'>(this.readInitialTheme());

  readonly theme = this._theme.asReadonly();

  setTheme(theme: 'light' | 'dark'): void {
    this._theme.set(theme);
    localStorage.setItem(STORAGE_KEY, theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }

  private readInitialTheme(): 'light' | 'dark' {
    const saved = localStorage.getItem(STORAGE_KEY);
    const resolved = saved === 'dark' || saved === 'light' ? saved : 'light';
    document.documentElement.classList.toggle('dark', resolved === 'dark');
    return resolved;
  }
}
