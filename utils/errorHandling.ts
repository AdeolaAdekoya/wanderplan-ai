/**
 * Custom error types for better error handling
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class StorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StorageError';
  }
}

/**
 * Checks if an error is a rate limit/quota error
 */
export const isQuotaError = (error: unknown): boolean => {
  if (error && typeof error === 'object') {
    const err = error as { status?: number; message?: string };
    return (
      err.status === 429 ||
      err.message?.includes('429') ||
      err.message?.includes('quota') ||
      err.message?.includes('RESOURCE_EXHAUSTED')
    );
  }
  return false;
};

/**
 * Checks if an error is a server error (5xx)
 */
export const isServerError = (error: unknown): boolean => {
  if (error && typeof error === 'object') {
    const err = error as { status?: number };
    return err.status === 503 || (err.status !== undefined && err.status >= 500);
  }
  return false;
};

/**
 * Safely extracts error message
 */
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  return 'An unknown error occurred';
};

