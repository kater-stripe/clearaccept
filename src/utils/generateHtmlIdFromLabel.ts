export const generateHtmlIdFromLabel = (label: string) => {
  return label.toLowerCase().replace(/ /g, '_');
};
