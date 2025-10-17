export const parseJsonWithFallback = (candidate: string) => {
  try {
    return JSON.parse(candidate);
  } catch {
    return candidate;
  }
};
