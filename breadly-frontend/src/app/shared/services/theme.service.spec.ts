import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    TestBed.configureTestingModule({});
    service = TestBed.inject(ThemeService);
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('defaults to light theme when localStorage is empty', () => {
    expect(service.theme()).toBe('light');
  });

  it('reads saved dark theme from localStorage', () => {
    localStorage.setItem('breadly-theme', 'dark');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const svc = TestBed.inject(ThemeService);
    expect(svc.theme()).toBe('dark');
  });

  it('setTheme updates the signal', () => {
    service.setTheme('dark');
    expect(service.theme()).toBe('dark');
  });

  it('setTheme persists to localStorage', () => {
    service.setTheme('dark');
    expect(localStorage.getItem('breadly-theme')).toBe('dark');
  });

  it('setTheme adds dark class to documentElement', () => {
    service.setTheme('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('setTheme removes dark class when switching to light', () => {
    service.setTheme('dark');
    service.setTheme('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});
