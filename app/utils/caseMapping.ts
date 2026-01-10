/**
 * Convert camelCase string to snake_case
 */
export function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

/**
 * Convert snake_case string to camelCase
 */
export function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Convert object keys from camelCase to snake_case
 * Skips undefined values
 */
export function camelToSnakeObject<T extends Record<string, any>>(
  obj: T,
): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) {
      continue;
    }
    const snakeKey = camelToSnake(key);
    result[snakeKey] = value;
  }
  return result;
}

/**
 * Convert object keys from snake_case to camelCase
 */
export function snakeToCamelObject<T extends Record<string, any>>(
  obj: T,
): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = snakeToCamel(key);
    result[camelKey] = value;
  }
  return result;
}
