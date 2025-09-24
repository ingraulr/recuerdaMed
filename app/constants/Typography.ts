// constants/Typography.ts
export const Typography = {
  // Tamaños de fuente (más grandes para adultos mayores)
  sizes: {
    xs: 14,      // Texto muy pequeño
    sm: 16,      // Texto pequeño
    base: 18,    // Texto normal (más grande que estándar)
    lg: 20,      // Texto grande
    xl: 24,      // Texto extra grande
    '2xl': 28,   // Títulos pequeños
    '3xl': 32,   // Títulos medianos
    '4xl': 36,   // Títulos grandes
    '5xl': 42,   // Títulos extra grandes
  },
  
  // Pesos de fuente
  weights: {
    light: '300' as const,
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
  
  // Alturas de línea
  lineHeights: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
    loose: 1.8,
  },
  
  // Espaciado entre letras
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1,
  },
};