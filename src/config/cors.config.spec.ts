import { createCorsOptions } from './cors.config';

describe('createCorsOptions', () => {
  const originalCorsOrigins = process.env.CORS_ORIGINS;

  afterEach(() => {
    process.env.CORS_ORIGINS = originalCorsOrigins;
  });

  it('allows requests from configured frontend origins', (done) => {
    process.env.CORS_ORIGINS = 'https://staging.example.com';
    const options = createCorsOptions();
    const originHandler = options.origin as (
      origin: string,
      callback: (error: Error | null, allow?: boolean) => void,
    ) => void;

    originHandler('https://carwise-frontend.vercel.app', (error, allow) => {
      expect(error).toBeNull();
      expect(allow).toBe(true);
      done();
    });
  });

  it('blocks unknown origins', (done) => {
    const options = createCorsOptions();
    const originHandler = options.origin as (
      origin: string,
      callback: (error: Error | null, allow?: boolean) => void,
    ) => void;

    originHandler('https://malicious.example.com', (error, allow) => {
      expect(error).toBeInstanceOf(Error);
      expect(allow).toBe(false);
      done();
    });
  });

  it('allows requests without an origin header', (done) => {
    const options = createCorsOptions();
    const originHandler = options.origin as (
      origin: undefined,
      callback: (error: Error | null, allow?: boolean) => void,
    ) => void;

    originHandler(undefined, (error, allow) => {
      expect(error).toBeNull();
      expect(allow).toBe(true);
      done();
    });
  });
});
