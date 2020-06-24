import 'source-map-support/register';

export const MAX_WIDTH = 250;

export const calculateWidthAndHeight = (dimensions: {
  width: number;
  height: number;
}): {
  width: number;
  height: number;
} => {
  const { width: currentWidth, height: currentHeight } = dimensions;

  let ratio = currentWidth / MAX_WIDTH;

  const newHeight = Math.round(currentHeight / ratio);
  const newWidth = Math.round(currentWidth / ratio);

  return { width: newWidth, height: newHeight };
};
