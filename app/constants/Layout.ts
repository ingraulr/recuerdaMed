// constants/Layout.ts
import { Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const Layout = {
  // Dimensiones de pantalla
  screen: {
    width: screenWidth,
    height: screenHeight,
  },
  
  // Espaciado (más generoso para adultos mayores)
  spacing: {
    xs: 4,       // Espaciado muy pequeño
    sm: 8,       // Espaciado pequeño
    md: 16,      // Espaciado medio
    lg: 24,      // Espaciado grande
    xl: 32,      // Espaciado extra grande
    '2xl': 40,   // Espaciado muy grande
    '3xl': 48,   // Espaciado máximo
  },
  
  // Padding de contenedores
  padding: {
    container: 20,    // Padding principal de pantallas
    section: 16,      // Padding de secciones
    card: 20,         // Padding de tarjetas
    button: 16,       // Padding interno de botones
  },
  
  // Bordes redondeados
  borderRadius: {
    sm: 4,       // Borde pequeño
    md: 8,       // Borde medio
    lg: 12,      // Borde grande
    xl: 16,      // Borde extra grande
    full: 9999,  // Completamente redondo
  },
  
  // Tamaños de botones (más grandes para facilitar el uso)
  button: {
    height: {
      sm: 44,    // Botón pequeño
      md: 52,    // Botón medio
      lg: 60,    // Botón grande
    },
    minWidth: 120, // Ancho mínimo
  },
  
  // Tamaños de inputs
  input: {
    height: 52,    // Altura de campos de entrada
    minHeight: 52, // Altura mínima
  },
  
  // Tamaños de iconos
  icon: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 32,
    xl: 40,
  },
  
  // Sombras
  shadow: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 4,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 8,
    },
  },
};