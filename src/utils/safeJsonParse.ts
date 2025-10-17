export const safeJsonParse = async (r: Response | Request) => {
  try {
    return {
      data: await r.json(),
    };
  } catch (error) {
    return {
      error,
    };
  }
};
