import { Dimensions, PixelRatio, ScaledSize } from 'react-native';

// Diseño base (iPhone 11)
const guidelineBaseWidth = 414;
const guidelineBaseHeight = 896;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT }: ScaledSize = Dimensions.get('window');

export const scale = (size: number) => (SCREEN_WIDTH / guidelineBaseWidth) * size;
export const verticalScale = (size: number) => (SCREEN_HEIGHT / guidelineBaseHeight) * size;
export const moderateScale = (size: number, factor = 0.5) =>
  size + (scale(size) - size) * factor;

export const rs = {
  s: scale,
  vs: verticalScale,
  ms: moderateScale,
};

export const getNumColumns = (minItemWidth = 160, spacing = 16) => {
  const available = SCREEN_WIDTH - spacing * 2;
  const columns = Math.max(1, Math.floor(available / (minItemWidth + spacing)));
  return columns;
};

export const dpi = (size: number) => PixelRatio.getFontScale() * size;


