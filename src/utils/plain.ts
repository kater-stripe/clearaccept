/**
 * Certain objects returned by the Stripe API cannot be passed from server to client verbatim.
 * This function uses a little hack to take any object and returns a plain object that can be passed to the client.
 */
export const plain = <T>(data: T): T => {
  return JSON.parse(JSON.stringify(data)) as T;
};
