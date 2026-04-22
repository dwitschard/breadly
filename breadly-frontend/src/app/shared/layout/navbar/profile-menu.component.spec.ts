import { ProfileMenuComponent } from './profile-menu.component';
import { Profile } from '../../../generated/api';
import { renderWithProviders, screen, userEvent } from '../../../../testing/render-with-providers';

describe('ProfileMenuComponent', () => {
  const user = userEvent.setup();

  describe('when logged out', () => {
    it('renders a Login button and emits loginClick when clicked', async () => {
      const loginClick = vi.fn();
      await setup({ profile: null, isLoggedIn: false, on: { loginClick } });

      await user.click(screen.getByRole('button', { name: 'NAV.LOGIN' }));

      expect(loginClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('when logged in', () => {
    it('renders an avatar button with aria-haspopup and dropdown is closed by default', async () => {
      await setup({ profile: mockProfile, isLoggedIn: true });

      expect(screen.getByRole('button', { name: 'NAV.ACCOUNT_MENU' })).toHaveAttribute(
        'aria-haspopup',
        'menu',
      );
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('opens the dropdown when avatar is clicked, shows display name and email', async () => {
      await setup({ profile: mockProfile, isLoggedIn: true });

      await user.click(screen.getByRole('button', { name: 'NAV.ACCOUNT_MENU' }));

      expect(screen.getByRole('menu')).toBeInTheDocument();
      expect(screen.getByTestId('nav-display-name')).toHaveTextContent('Alice');
      expect(screen.getByTestId('nav-display-email')).toHaveTextContent('alice@example.com');
    });

    it('closes the dropdown when avatar is clicked twice', async () => {
      await setup({ profile: mockProfile, isLoggedIn: true });

      await user.click(screen.getByRole('button', { name: 'NAV.ACCOUNT_MENU' }));
      await user.click(screen.getByRole('button', { name: 'NAV.ACCOUNT_MENU' }));

      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('emits profileClick and closes dropdown when Profile item is clicked', async () => {
      const profileClick = vi.fn();
      await setup({ profile: mockProfile, isLoggedIn: true, on: { profileClick } });

      await user.click(screen.getByRole('button', { name: 'NAV.ACCOUNT_MENU' }));
      await user.click(screen.getByRole('menuitem', { name: 'NAV.PROFILE' }));

      expect(profileClick).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('emits logoutClick and closes dropdown when Logout item is clicked', async () => {
      const logoutClick = vi.fn();
      await setup({ profile: mockProfile, isLoggedIn: true, on: { logoutClick } });

      await user.click(screen.getByRole('button', { name: 'NAV.ACCOUNT_MENU' }));
      await user.click(screen.getByRole('menuitem', { name: 'NAV.LOGOUT' }));

      expect(logoutClick).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('shows no profile picture when profile has no picture', async () => {
      await setup({ profile: { ...mockProfile, picture: undefined }, isLoggedIn: true });

      expect(screen.queryByRole('img')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'NAV.ACCOUNT_MENU' })).toBeInTheDocument();
    });

    it('falls back to givenName when name is absent', async () => {
      await setup({
        profile: { ...mockProfile, name: undefined, givenName: 'Ali' },
        isLoggedIn: true,
      });

      expect(screen.getByRole('button', { name: 'NAV.ACCOUNT_MENU' })).toBeInTheDocument();
    });

    it('does not show health menu item when isAdmin is false', async () => {
      await setup({ profile: mockProfile, isLoggedIn: true, isAdmin: false });

      await user.click(screen.getByRole('button', { name: 'NAV.ACCOUNT_MENU' }));

      expect(screen.queryByRole('menuitem', { name: 'NAV.HEALTH' })).not.toBeInTheDocument();
    });

    it('shows health menu item and emits healthClick when isAdmin is true', async () => {
      const healthClick = vi.fn();
      await setup({ profile: mockProfile, isLoggedIn: true, isAdmin: true, on: { healthClick } });

      await user.click(screen.getByRole('button', { name: 'NAV.ACCOUNT_MENU' }));
      await user.click(screen.getByRole('menuitem', { name: 'NAV.HEALTH' }));

      expect(healthClick).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('closes the dropdown on outside click', async () => {
      await setup({ profile: mockProfile, isLoggedIn: true });

      await user.click(screen.getByRole('button', { name: 'NAV.ACCOUNT_MENU' }));
      expect(screen.getByRole('menu')).toBeInTheDocument();

      await user.click(document.body);

      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
  });

  const mockProfile: Profile = {
    sub: 'user-1',
    email: 'alice@example.com',
    emailVerified: true,
    name: 'Alice',
    roles: [],
  };

  async function setup(options: {
    profile: Profile | null;
    isLoggedIn: boolean;
    isAdmin?: boolean;
    on?: {
      loginClick?: () => void;
      profileClick?: () => void;
      logoutClick?: () => void;
      healthClick?: () => void;
    };
  }) {
    const { profile, isLoggedIn, isAdmin = false, on = {} } = options;
    return renderWithProviders(ProfileMenuComponent, {
      componentInputs: { profile, isLoggedIn, isAdmin },
      on,
    });
  }
});
