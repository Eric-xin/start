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
  bgCard: "#F2EEE7",
  bgSurface: "#FFF8EF",
  borderPrimary: "#D4CABC",
  borderDim: "#E8E2D9",
  borderFaint: "#F0EDE8",
  blue: "#3B7DD8",
  blueLight: "#74A4E8",
  blueDim: "#EBF1FB",
  blueBright: "#2B66C0",
  green: "#2D8A4E",
  red: "#C0392B",
  amber: "#D28C1D",
  teal: "#4BA7A0",
  textBright: "#1A1A2E",
  textPrimary: "#433F56",
  textDim: "#6B6880",
  textMuted: "#A09CB0",
  cardSurface: "#FFFDF9",
  cardText: "#1E1A17",
  cardTextBody: "#4D4A58",
  cardBorder: "#D4CABC",
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
