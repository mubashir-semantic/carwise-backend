type Environment = Record<string, unknown>;

const REQUIRED_PRODUCTION_ENV_VARS = [
  'MONGODB_URI',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
  'EMAIL_USER',
  'EMAIL_PASS',
];

function isMissing(value: unknown): boolean {
  return typeof value !== 'string' || value.trim().length === 0;
}

export function validateEnvironment(config: Environment): Environment {
  if (config.NODE_ENV !== 'production') {
    return config;
  }

  const missingVars = REQUIRED_PRODUCTION_ENV_VARS.filter((key) =>
    isMissing(config[key]),
  );

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables in production: ${missingVars.join(
        ', ',
      )}`,
    );
  }

  return config;
}
