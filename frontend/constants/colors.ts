import { useThemeStore } from "../store/themeStore";

interface BaseColorPalette {
  bg: string;
  bgPanel: string;
  bgCard: string;
  bgSurface: string;
  borderPrimary: string;
  borderDim: string;
  borderFaint: string;
  blue: string;
  blueLight: string;
  blueDim: string;
  blueBright: string;
  green: string;
  red: string;
  amber: string;
  teal: string;
  textBright: string;
  textPrimary: string;
  textDim: string;
  textMuted: string;
  cardSurface: string;
  cardText: string;
  cardTextBody: string;
  cardBorder: string;
  cardBand: Record<string, string>;
}

export const DarkColors: BaseColorPalette = {
  bg: "#070d1a",
  bgPanel: "#0a1628",
  bgCard: "#0d1f3c",
  bgSurface: "#111d35",
  borderPrimary: "#0a6cf5",
  borderDim: "#1a3a6b",
  borderFaint: "#0d2040",
  blue: "#0a6cf5",
  blueLight: "#4d9fff",
  blueDim: "#1a4a8a",
  blueBright: "#2979ff",
  green: "#00e676",
  red: "#ff1744",
  amber: "#ffab00",
  teal: "#00bcd4",
  textBright: "#e8f4ff",
  textPrimary: "#a8c8f0",
  textDim: "#4a7aaa",
  textMuted: "#253a55",
  cardSurface: "#f5f0e8",
  cardText: "#1a1a1a",
  cardTextBody: "#3a3a3a",
  cardBorder: "#d8d0c0",
  cardBand: {
    red: "#d32f2f",
    green: "#2e7d32",
    amber: "#f57f17",
    purple: "#6a1b9a",
    steel_blue: "#1565c0",
  } as Record<string, string>,
};

export const LightColors: BaseColorPalette = {
  bg: "#F7F5F0",
  bgPanel: "#FFFFFF",
  bgCard: "#F4EDE3",
  bgSurface: "#FFF8F1",
  borderPrimary: "#D8C1A7",
  borderDim: "#E7D8C8",
  borderFaint: "#F3ECE3",
  blue: "#A65A3A",
  blueLight: "#C98363",
  blueDim: "#F7E8DF",
  blueBright: "#8D492D",
  green: "#4C8757",
  red: "#B54A3A",
  amber: "#C7922A",
  teal: "#5D958B",
  textBright: "#2E2118",
  textPrimary: "#5B463A",
  textDim: "#8A705F",
  textMuted: "#B9A89B",
  cardSurface: "#FFFDF9",
  cardText: "#1E1A17",
  cardTextBody: "#5A493E",
  cardBorder: "#D8C1A7",
  cardBand: DarkColors.cardBand,
};

function withAliases(palette: BaseColorPalette) {
  return {
    ...palette,
    terminalDark: palette.bgPanel,
    terminalGreen: palette.green,
    bloombergBlue: palette.blue,
    textSecondary: palette.textPrimary,
  };
}

export type AppColors = ReturnType<typeof withAliases>;

export const Colors = withAliases(DarkColors);

export function useColors(): AppColors {
  const mode = useThemeStore((state) => state.mode);
  return withAliases(mode === "normal" ? LightColors : DarkColors);
}
