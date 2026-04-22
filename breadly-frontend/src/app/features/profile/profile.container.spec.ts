import { signal } from '@angular/core';
import { ProfileContainerComponent } from './profile.container';
import { ProfileService } from '../../shared/services/profile.service';
import { Profile } from '../../generated/api';
import { renderWithProviders, screen } from '../../../testing/render-with-providers';

describe('ProfileContainerComponent', () => {
  it('renders the profile view child component', async () => {
    await setup({ profile: mockProfile });

    expect(screen.getByTestId('profile-title')).toBeInTheDocument();
    expect(screen.getByText('PROFILE.TITLE')).toBeInTheDocument();
  });

  it('shows profile data when a profile is provided', async () => {
    await setup({ profile: mockProfile });

    expect(screen.getByTestId('profile-display-name')).toHaveTextContent('alice@example.com');
    expect(screen.getByTestId('profile-user-id')).toHaveTextContent('user-1');
  });

  it('calls load() on init when profile is null', async () => {
    const load = vi.fn();
    await setup({ profile: null, load });

    expect(load).toHaveBeenCalledTimes(1);
  });

  it('does NOT call load() when profile is already set', async () => {
    const load = vi.fn();
    await setup({ profile: mockProfile, load });

    expect(load).not.toHaveBeenCalled();
  });

  it('shows loading indicator while loading', async () => {
    await setup({ profile: null, loading: true });

    expect(screen.getByText('PROFILE.LOADING')).toBeInTheDocument();
  });

  const mockProfile: Profile = {
    sub: 'user-1',
    email: 'alice@example.com',
    emailVerified: true,
    roles: [],
  };

  async function setup(options: {
    profile: Profile | null;
    loading?: boolean;
    load?: () => void;
  }) {
    const { profile, loading = false, load = vi.fn() } = options;

    const profileSignal = signal<Profile | null>(profile);

    const fakeProfileService = {
      profile: profileSignal.asReadonly(),
      loading: signal(loading).asReadonly(),
      load,
      clear: vi.fn(),
    };

    return renderWithProviders(ProfileContainerComponent, {
      componentProviders: [
        { provide: ProfileService, useValue: fakeProfileService },
      ],
    });
  }
});
