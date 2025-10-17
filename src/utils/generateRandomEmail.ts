export const generateRandomEmail = () => {
  return `demo+${Math.random().toString(36).substring(2, 9)}@example.com`;
};
