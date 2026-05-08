import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeService } from './theme.service';
import { SettingsService } from './settings.service';
import { signal } from '@angular/core';

describe('ThemeService', () => {
  let service: ThemeService;
  let updateSettingSpy: ReturnType<typeof vi.fn>;
  const themeSignal = signal<'light' | 'dark'>('light');

  beforeEach(() => {
    updateSettingSpy = vi.fn();
    document.documentElement.classList.remove('dark');

    TestBed.configureTestingModule({
      providers: [
        {
          provide: SettingsService,
          useValue: {
            theme: themeSignal.asReadonly(),
            language: signal('de').asReadonly(),
            updateSetting: updateSettingSpy,
            initialize: () => {},
          },
        },
      ],
    });
    service = TestBed.inject(ThemeService);
  });

  afterEach(() => {
    document.documentElement.classList.remove('dark');
    themeSignal.set('light');
  });

  it('theme() reflects the settings service signal', () => {
    themeSignal.set('dark');
    expect(service.theme()).toBe('dark');
  });

  it('setTheme delegates to settingsService.updateSetting', () => {
    service.setTheme('dark');
    expect(updateSettingSpy).toHaveBeenCalledWith('theme', 'dark');
  });
});
