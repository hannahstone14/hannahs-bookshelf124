/**
 * Run a promise with a timeout that will resolve with a fallback value
 * if the promise doesn't complete within the specified milliseconds.
 * 
 * @param promise The promise to execute
 * @param timeoutMs Timeout in milliseconds
 * @param fallback Optional function to provide a fallback value on timeout
 * @returns Promise result or fallback value
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  fallback?: () => T
): Promise<T> {
  let timeoutId: NodeJS.Timeout | null = null;
  
  try {
    // Create a promise that rejects after the specified timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });
    
    // Race the original promise against the timeout
    const result = await Promise.race([promise, timeoutPromise]);
    return result as T;
  } catch (error) {
    console.error(`Operation timed out or failed after ${timeoutMs}ms:`, error);
    
    // If a fallback is provided, use it
    if (fallback) {
      console.log('Using fallback value due to timeout');
      return fallback();
    }
    
    // Otherwise, rethrow the error
    throw error;
  } finally {
    // Clear the timeout if it's still active
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}
