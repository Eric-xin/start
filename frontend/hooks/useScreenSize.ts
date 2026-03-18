import { useWindowDimensions } from "react-native";

export function useScreenSize() {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const isTablet = Math.min(width, height) >= 768;

  return {
    width,
    height,
    isLandscape,
    isTablet,
    gameAreaWidth: isTablet ? width - (isLandscape ? 200 : 0) : width,
  };
}
