import { render, screen } from '@testing-library/angular';
import { of } from 'rxjs';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { HomeComponent } from './home.component';

const DE_TRANSLATIONS = {
  HOME: {
    TITLE: 'Willkommen bei Breadly',
    SUBTITLE:
      'Deine Rezeptverwaltung. Melde dich an, um Rezepte zu verwalten und den Systemstatus zu prüfen.',
    LOGIN_BUTTON: 'Jetzt anmelden',
  },
};

async function renderHome(isLoggedIn = false) {
  return render(HomeComponent, {
    inputs: { isLoggedIn },
    imports: [
      TranslateModule.forRoot({
        lang: 'de',
        loader: {
          provide: TranslateLoader,
          useValue: { getTranslation: () => of(DE_TRANSLATIONS) },
        },
      }),
    ],
  });
}

describe('HomeComponent – i18n', () => {
  it('renders the German title, not the raw key', async () => {
    await renderHome();

    expect(screen.getByTestId('home-title')).toHaveTextContent('Willkommen bei Breadly');
    expect(screen.getByTestId('home-title')).not.toHaveTextContent('HOME.TITLE');
  });

  it('renders the German subtitle, not the raw key', async () => {
    await renderHome();

    expect(screen.getByText(/Deine Rezeptverwaltung/)).toBeInTheDocument();
  });

  it('renders the German login button when logged out, not the raw key', async () => {
    await renderHome(false);

    expect(screen.getByTestId('home-login-btn')).toHaveTextContent('Jetzt anmelden');
    expect(screen.getByTestId('home-login-btn')).not.toHaveTextContent('HOME.LOGIN_BUTTON');
  });

  it('hides the login button when logged in', async () => {
    await renderHome(true);

    expect(screen.queryByTestId('home-login-btn')).not.toBeInTheDocument();
  });
});
