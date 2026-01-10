/**
 * Result type for operations that can fail
 * Provides type-safe error handling without exceptions
 */
export type Result<T, E = Error>
  = | { success: true; data: T }
    | { success: false; error: E };

/**
 * Type guard to check if result is successful
 */
export function isSuccess<T, E>(result: Result<T, E>): result is { success: true; data: T } {
  return result.success;
}

/**
 * Type guard to check if result is an error
 */
export function isError<T, E>(result: Result<T, E>): result is { success: false; error: E } {
  return !result.success;
}

/**
 * Helper to create a success result
 */
export function ok<T>(data: T): Result<T, never> {
  return { success: true, data };
}

/**
 * Helper to create an error result
 */
export function err<E = Error>(error: E): Result<never, E> {
  return { success: false, error };
}
