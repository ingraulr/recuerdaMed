// constants/Colors.ts
export const Colors = {
  // Colores principales (azules calmantes)
  primary: '#4A90E2',        // Azul principal
  primaryLight: '#7BB3F0',   // Azul claro
  primaryDark: '#2E5C8A',    // Azul oscuro
  
  // Colores secundarios (neutros)
  secondary: '#6B7280',      // Gris medio
  secondaryLight: '#9CA3AF', // Gris claro
  secondaryDark: '#374151',  // Gris oscuro
  
  // Colores de fondo
  background: '#F0F9FF',     // Azul muy claro con toque de cyan (sky-50)
  backgroundGradient: {
    start: '#FAFBFF',        // Casi blanco con toque azul
    middle: '#F0F9FF',       // Azul muy claro (sky-50)
    end: '#EBF8FF'           // Azul muy suave (blue-50)
  },
  surface: '#FFFFFF',        // Blanco puro
  surfaceLight: '#F0F9FF',   // Azul muy claro para tarjetas
  
  // Colores de texto
  textPrimary: '#1F2937',    // Casi negro para buena legibilidad
  textSecondary: '#6B7280',  // Gris para texto secundario
  textLight: '#9CA3AF',      // Gris claro para placeholders
  textOnPrimary: '#FFFFFF',  // Blanco sobre colores primarios
  
  // Colores de estado
  success: '#10B981',        // Verde para éxito
  successLight: '#D1FAE5',   // Verde claro para fondos
  warning: '#F59E0B',        // Amarillo para advertencias  
  warningLight: '#FEF3C7',   // Amarillo claro para fondos
  error: '#EF4444',          // Rojo para errores
  errorLight: '#FEE2E2',     // Rojo claro para fondos
  
  // Colores para medicamentos (útil para la app)
  medicine: {
    morning: '#FFE4B5',      // Amarillo suave para mañana
    afternoon: '#87CEEB',    // Azul cielo para tarde
    evening: '#DDA0DD',      // Violeta suave para noche
    night: '#2F4F4F',        // Azul oscuro para noche
  },
  
  // Colores de borde
  border: '#E5E7EB',         // Gris muy claro
  borderLight: '#F3F4F6',    // Gris más claro
  borderFocus: '#4A90E2',    // Azul cuando está enfocado
  
  // Sombras
  shadow: 'rgba(0, 0, 0, 0.1)',
  shadowDark: 'rgba(0, 0, 0, 0.2)',
};