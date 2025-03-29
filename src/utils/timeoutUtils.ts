
/**
 * Utility for handling timeouts in async operations
 */

export type PromiseWithTimeout<T> = Promise<T> | { then(onfulfilled: any): any };

/**
 * Executes a promise with a timeout
 * @param promise The promise to execute
 * @param timeoutMs The timeout in milliseconds
 * @param fallbackFn Optional fallback function to execute if the promise times out
 * @returns The result of the promise or fallback function
 */
export const withTimeout = async <T>(
  promise: PromiseWithTimeout<T>,
  timeoutMs: number,
  fallbackFn?: () => T
): Promise<T> => {
  let timeoutId: NodeJS.Timeout;
  
  // Convert the input to a proper Promise if it's not already one
  const actualPromise = Promise.resolve(promise);
  
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Request timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });
  
  try {
    const result = await Promise.race([
      actualPromise,
      timeoutPromise
    ]);
    
    clearTimeout(timeoutId);
    return result as T;
  } catch (error) {
    clearTimeout(timeoutId);
    if (fallbackFn) {
      console.warn('Using fallback function due to error:', error);
      return fallbackFn();
    }
    throw error;
  }
};
