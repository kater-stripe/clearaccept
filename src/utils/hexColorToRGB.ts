export const hexColorToRGB = (hexColor: string) => {
  const rgb = Number.parseInt(hexColor.replace('#', ''), 16);

  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = (rgb >> 0) & 0xff;

  return [r, g, b];
};
