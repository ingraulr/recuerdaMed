// constants/GlobalStyles.ts
import { Colors } from '../constants/Colors';
import { Layout } from '../constants/Layout';
import { Typography } from '../constants/Typography';
import { StyleSheet } from 'react-native';

export const GlobalStyles = StyleSheet.create({
  // Contenedores principales
  container: {
    flex: 1,
    backgroundColor: Colors.background, // Fallback para dispositivos que no soportan gradientes
  },
  
  containerCentered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Layout.padding.container,
  },
  
  contentContainer: {
    flex: 1,
    paddingHorizontal: Layout.padding.container,
    paddingVertical: Layout.spacing.lg,
  },
  
  // Tarjetas y superficies
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.padding.card,
    ...Layout.shadow.medium,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)', // Borde sutil para profundidad
  },

  medicationCard: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.borderRadius.lg,
    paddingVertical: Layout.spacing['2xl'], // Mucho más padding arriba y abajo
    paddingHorizontal: Layout.spacing['2xl'], // Mucho más padding a los lados
    marginHorizontal: Layout.spacing.lg, // Mayor margen lateral
    marginVertical: Layout.spacing.md, // Margen vertical entre tarjetas
    ...Layout.shadow.medium,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)', // Borde sutil
  },
  
  surface: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.borderRadius.md,
  },
  
  // Textos
  title: {
    fontSize: Typography.sizes['3xl'],
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Layout.spacing.xl,
  },
  
  subtitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
    marginBottom: Layout.spacing.md,
  },
  
  bodyText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.normal,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeights.relaxed * Typography.sizes.base,
  },

  welcomeText: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.medium,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Layout.spacing.lg,
  },

  // Etiquetas para formularios
  label: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.medium,
    color: Colors.textPrimary,
    marginBottom: Layout.spacing.sm,
  },

  // Texto muted (gris claro)
  muted: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.normal,
    color: Colors.textLight,
  },

  // Tag de advertencia
  warningTag: {
    backgroundColor: Colors.error,
    color: Colors.textOnPrimary,
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.medium,
    paddingVertical: Layout.spacing.sm,
    paddingHorizontal: Layout.spacing.md,
    borderRadius: Layout.borderRadius.md,
    textAlign: 'center',
    overflow: 'hidden',
  },

  // Inputs
  input: {
    height: Layout.input.height,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: Layout.borderRadius.md,
    paddingHorizontal: Layout.spacing.md,
    fontSize: Typography.sizes.base,
    color: Colors.textPrimary,
    backgroundColor: Colors.surface,
  },
  
  inputFocused: {
    borderColor: Colors.borderFocus,
    ...Layout.shadow.small,
  },
  
  inputError: {
    borderColor: Colors.error,
  },
  
  // Botones
  button: {
    height: Layout.button.height.lg,
    borderRadius: Layout.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Layout.padding.button,
    ...Layout.shadow.medium,
  },
  
  buttonPrimary: {
    backgroundColor: Colors.primary,
  },
  
  buttonSecondary: {
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  
  buttonDanger: {
    backgroundColor: Colors.error,
  },
  
  buttonDisabled: {
    backgroundColor: Colors.secondaryLight,
    ...Layout.shadow.small,
  },
  
  // Textos de botones
  buttonText: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.textOnPrimary,
  },
  
  buttonTextSecondary: {
    color: Colors.primary,
  },
  
  buttonTextDisabled: {
    color: Colors.textLight,
  },
  
  // Espaciado y layout
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  spaceBetween: {
    justifyContent: 'space-between',
  },
  
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Márgenes comunes
  mb_xs: { marginBottom: Layout.spacing.xs },
  mb_sm: { marginBottom: Layout.spacing.sm },
  mb_md: { marginBottom: Layout.spacing.md },
  mb_lg: { marginBottom: Layout.spacing.lg },
  mb_xl: { marginBottom: Layout.spacing.xl },
  
  mt_xs: { marginTop: Layout.spacing.xs },
  mt_sm: { marginTop: Layout.spacing.sm },
  mt_md: { marginTop: Layout.spacing.md },
  mt_lg: { marginTop: Layout.spacing.lg },
  mt_xl: { marginTop: Layout.spacing.xl },
  
  // Estados de loading
  loadingContainer: {
    ...Layout.shadow.small,
    opacity: 0.7,
  },

  // FAB (Floating Action Button)
  fab: {
    position: 'absolute',
    bottom: Layout.spacing.xl,
    right: Layout.spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Layout.shadow.large,
  },

  fabText: {
    fontSize: 24,
    fontWeight: Typography.weights.bold,
    color: Colors.textOnPrimary,
  },
});

export { Typography, Colors, Layout };
