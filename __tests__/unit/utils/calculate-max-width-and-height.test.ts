/**
 * Tests calculateWidthAndHeight
 *
 * @group unit
 */

import { calculateWidthAndHeight } from '../../../utils/calculate-max-width-and-height';

describe('Calculate Max Width And Height', () => {
  test('Should return same width and height if width <= 250', () => {
    // Arrange
    const currentWidth = 200;
    const currentHeight = 200;

    // Act
    const { width: newWidth, height: newHeight } = calculateWidthAndHeight({
      width: currentWidth,
      height: currentHeight,
    });

    // Assert
    expect(newWidth).toBe(250);
    expect(newHeight).toBe(250);
  });

  test('Should return new width and height if width >= 250', () => {
    // Arrange
    const currentWidth = 500;
    const currentHeight = 500;

    // Act
    const { width: newWidth, height: newHeight } = calculateWidthAndHeight({
      width: currentWidth,
      height: currentHeight,
    });

    // Assert
    expect(newWidth).toBe(250);
    expect(newHeight).toBe(250);
  });
});
