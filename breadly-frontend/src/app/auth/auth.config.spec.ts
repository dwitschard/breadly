import { buildAuthConfig } from './auth.config';

describe('buildAuthConfig', () => {
  const issuer = 'https://cognito-idp.eu-central-1.amazonaws.com/eu-central-1_abc123';
  const clientId = 'test-client-id';

  let baseURISpy: ReturnType<typeof vi.spyOn>;

  afterEach(() => {
    baseURISpy?.mockRestore();
  });

  it('should set redirectUri using document.baseURI for root deployment', () => {
    baseURISpy = vi
      .spyOn(document, 'baseURI', 'get')
      .mockReturnValue('https://example.cloudfront.net/');

    const config = buildAuthConfig(issuer, clientId);

    expect(config.redirectUri).toBe('https://example.cloudfront.net/oidc-callback');
  });

  it('should set redirectUri using document.baseURI for preview deployment', () => {
    baseURISpy = vi
      .spyOn(document, 'baseURI', 'get')
      .mockReturnValue('https://example.cloudfront.net/preview/my-branch/');

    const config = buildAuthConfig(issuer, clientId);

    expect(config.redirectUri).toBe(
      'https://example.cloudfront.net/preview/my-branch/oidc-callback',
    );
  });

  it('should pass through issuer and clientId unchanged', () => {
    baseURISpy = vi.spyOn(document, 'baseURI', 'get').mockReturnValue('https://example.com/');

    const config = buildAuthConfig(issuer, clientId);

    expect(config.issuer).toBe(issuer);
    expect(config.clientId).toBe(clientId);
  });

  it('should use authorization code flow', () => {
    baseURISpy = vi.spyOn(document, 'baseURI', 'get').mockReturnValue('https://example.com/');

    const config = buildAuthConfig(issuer, clientId);

    expect(config.responseType).toBe('code');
  });

  it('should request openid and email scopes', () => {
    baseURISpy = vi.spyOn(document, 'baseURI', 'get').mockReturnValue('https://example.com/');

    const config = buildAuthConfig(issuer, clientId);

    expect(config.scope).toBe('openid email profile');
  });
});
