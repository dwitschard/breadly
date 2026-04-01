import { Component, signal } from '@angular/core';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ProfileMenuComponent } from './profile-menu.component';
import { Profile } from '../../../generated/api';

const mockProfile: Profile = {
  sub: 'user-1',
  email: 'alice@example.com',
  emailVerified: true,
  name: 'Alice',
  roles: [],
};

@Component({
  imports: [ProfileMenuComponent],
  template: `
    <app-profile-menu
      [profile]="profile()"
      [isLoggedIn]="isLoggedIn()"
      (loginClick)="loginClicks.set(loginClicks() + 1)"
      (profileClick)="profileClicks.set(profileClicks() + 1)"
      (logoutClick)="logoutClicks.set(logoutClicks() + 1)"
    />
  `,
})
class TestHostComponent {
  readonly profile = signal<Profile | null>(null);
  readonly isLoggedIn = signal(false);
  readonly loginClicks = signal(0);
  readonly profileClicks = signal(0);
  readonly logoutClicks = signal(0);
}

describe('ProfileMenuComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileMenuComponent, TestHostComponent],
    }).compileComponents();
  });

  function create(
    profile: Profile | null,
    isLoggedIn: boolean,
  ): ComponentFixture<ProfileMenuComponent> {
    const fixture = TestBed.createComponent(ProfileMenuComponent);
    fixture.componentRef.setInput('profile', profile);
    fixture.componentRef.setInput('isLoggedIn', isLoggedIn);
    fixture.detectChanges();
    return fixture;
  }

  function createHost(
    profile: Profile | null,
    isLoggedIn: boolean,
  ): {
    hostFixture: ComponentFixture<TestHostComponent>;
    host: TestHostComponent;
    menu: ProfileMenuComponent;
  } {
    const hostFixture = TestBed.createComponent(TestHostComponent);
    const host = hostFixture.componentInstance;
    host.profile.set(profile);
    host.isLoggedIn.set(isLoggedIn);
    hostFixture.detectChanges();
    const menu = hostFixture.debugElement.children[0].componentInstance as ProfileMenuComponent;
    return { hostFixture, host, menu };
  }

  function asAny(instance: ProfileMenuComponent) {
    return instance as any;
  }

  describe('when logged out', () => {
    it('renders a Login button', () => {
      const fixture = create(null, false);
      const btn: HTMLButtonElement = fixture.nativeElement.querySelector('button');
      expect(btn).toBeTruthy();
      expect(btn.textContent?.trim()).toBe('Login');
    });

    it('emits loginClick via host binding', () => {
      const { hostFixture, host, menu } = createHost(null, false);
      expect(host.loginClicks()).toBe(0);
      menu.loginClick.emit();
      hostFixture.detectChanges();
      expect(host.loginClicks()).toBe(1);
    });
  });

  describe('when logged in', () => {
    it('renders an avatar button with aria-haspopup', () => {
      const fixture = create(mockProfile, true);
      const btn = fixture.nativeElement.querySelector('[aria-haspopup="menu"]');
      expect(btn).toBeTruthy();
    });

    it('dropdown is closed by default', () => {
      const fixture = create(mockProfile, true);
      expect(fixture.nativeElement.querySelector('[role="menu"]')).toBeNull();
    });

    it('opens the dropdown when toggle() is called', () => {
      const fixture = create(mockProfile, true);
      asAny(fixture.componentInstance).toggle();
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('[role="menu"]')).toBeTruthy();
    });

    it('closes the dropdown when toggle() is called twice', () => {
      const fixture = create(mockProfile, true);
      asAny(fixture.componentInstance).toggle();
      fixture.detectChanges();
      asAny(fixture.componentInstance).toggle();
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('[role="menu"]')).toBeNull();
    });

    it('shows the display name and email in the dropdown header', () => {
      const fixture = create(mockProfile, true);
      asAny(fixture.componentInstance).toggle();
      fixture.detectChanges();
      const text: string = fixture.nativeElement.textContent ?? '';
      expect(text).toContain('Alice');
      expect(text).toContain('alice@example.com');
    });

    it('emits profileClick and closes dropdown via host binding', () => {
      const { hostFixture, host, menu } = createHost(mockProfile, true);
      expect(host.profileClicks()).toBe(0);
      asAny(menu).toggle();
      hostFixture.detectChanges();
      asAny(menu).onProfileClick();
      hostFixture.detectChanges();
      expect(host.profileClicks()).toBe(1);
      expect(hostFixture.nativeElement.querySelector('[role="menu"]')).toBeNull();
    });

    it('emits logoutClick and closes dropdown via host binding', () => {
      const { hostFixture, host, menu } = createHost(mockProfile, true);
      expect(host.logoutClicks()).toBe(0);
      asAny(menu).toggle();
      hostFixture.detectChanges();
      asAny(menu).onLogoutClick();
      hostFixture.detectChanges();
      expect(host.logoutClicks()).toBe(1);
      expect(hostFixture.nativeElement.querySelector('[role="menu"]')).toBeNull();
    });

    it('shows SVG fallback when profile has no picture', () => {
      const profileNoPic: Profile = { ...mockProfile, picture: undefined };
      const fixture = create(profileNoPic, true);
      const svg = fixture.nativeElement.querySelector('svg');
      expect(svg).toBeTruthy();
    });

    it('falls back to givenName when name is absent', () => {
      const profileNoName: Profile = {
        ...mockProfile,
        name: undefined,
        givenName: 'Ali',
      };
      const fixture = create(profileNoName, true);
      const btn: HTMLElement = fixture.nativeElement.querySelector('[aria-haspopup="menu"]');
      expect(btn.getAttribute('aria-label')).toContain('Ali');
    });

    it('closes the dropdown on outside click', () => {
      const fixture = create(mockProfile, true);
      asAny(fixture.componentInstance).toggle();
      fixture.detectChanges();
      const outsideEl = document.createElement('div');
      document.body.appendChild(outsideEl);
      fixture.componentInstance.onDocumentClick({ target: outsideEl } as unknown as MouseEvent);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('[role="menu"]')).toBeNull();
      document.body.removeChild(outsideEl);
    });
  });
});
