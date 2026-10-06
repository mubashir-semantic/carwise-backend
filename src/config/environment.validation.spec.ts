import { validateEnvironment } from './environment.validation';

describe('validateEnvironment', () => {
  it('does not require production-only variables outside production', () => {
    expect(() => validateEnvironment({ NODE_ENV: 'development' })).not.toThrow();
  });

  it('throws when required production variables are missing', () => {
    expect(() => validateEnvironment({ NODE_ENV: 'production' })).toThrow(
      'Missing required environment variables in production',
    );
  });

  it('passes when required production variables are present', () => {
    const config = {
      NODE_ENV: 'production',
      MONGODB_URI: 'mongodb://example',
      JWT_SECRET: 'secret',
      JWT_EXPIRES_IN: '15m',
      EMAIL_USER: 'no-reply@example.com',
      EMAIL_PASS: 'app-password',
    };

    expect(validateEnvironment(config)).toEqual(config);
  });
});
