export class AuthRequiredError extends Error {
  code = 'AUTH_REQUIRED' as const;
  constructor(message = 'Authentication required') {
    super(message);
    this.name = 'AuthRequiredError';
  }
}

export class ApiUnauthorizedError extends Error {
  code = 'UNAUTHORIZED' as const;
  status = 401 as const;
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'ApiUnauthorizedError';
  }
}

export class ApiError extends Error {
  code = 'API_ERROR' as const;
  status?: number;
  constructor(message = 'API error', status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}
