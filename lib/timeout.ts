/**
 * Wraps a promise in a timeout that rejects if the promise does not resolve within the specified limit.
 */
export function withTimeout<T>(
  promise: Promise<T> | (() => Promise<T>),
  timeoutMs: number,
  errorMsg = "Operation timed out"
): Promise<T> {
  const actualPromise = typeof promise === "function" ? promise() : promise;

  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(errorMsg));
    }, timeoutMs);

    actualPromise
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}
