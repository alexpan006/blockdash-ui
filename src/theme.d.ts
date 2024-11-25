import '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Theme {
    breakpoints: {
      values: {
        xs: number;
        sm: number;
        md: number;
        lg: number;
        xl: number;
      };
    };
  }

  interface ThemeOptions {
    breakpoints?: {
      values?: {
        xs?: number;
        sm?: number;
        md?: number;
        lg?: number;
        xl?: number;
      };
    };
  }
}
