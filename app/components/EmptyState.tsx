// app/components/EmptyState.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Layout, Typography } from '../constants/GlobalStyles';

interface EmptyStateProps {
  title: string;
  subtitle?: string;
  actionText?: string;
  onAction?: () => void;
  type?: 'info' | 'warning' | 'error';
}

export default function EmptyState({ 
  title, 
  subtitle, 
  actionText, 
  onAction, 
  type = 'info' 
}: EmptyStateProps) {
  const getTypeStyles = () => {
    switch (type) {
      case 'warning':
        return {
          backgroundColor: Colors.warning + '15',
          borderColor: Colors.warning,
          textColor: Colors.warning,
          emoji: '⚠️',
        };
      case 'error':
        return {
          backgroundColor: Colors.error + '15',
          borderColor: Colors.error,
          textColor: Colors.error,
          emoji: '❌',
        };
      default:
        return {
          backgroundColor: Colors.primary + '10',
          borderColor: Colors.primary + '30',
          textColor: Colors.primary,
          emoji: '💊',
        };
    }
  };

  const typeStyles = getTypeStyles();

  return (
    <View style={styles.container}>
      <View style={[
        styles.card,
        {
          backgroundColor: typeStyles.backgroundColor,
          borderColor: typeStyles.borderColor,
        }
      ]}>
        <Text style={styles.emoji}>{typeStyles.emoji}</Text>
        <Text style={[styles.title, { color: typeStyles.textColor }]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={styles.subtitle}>
            {subtitle}
          </Text>
        )}
        {actionText && onAction && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: typeStyles.textColor }]}
            onPress={onAction}
          >
            <Text style={styles.actionButtonText}>
              {actionText}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.xl,
  },
  card: {
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.xl,
    alignItems: 'center',
    borderWidth: 2,
    minWidth: 280,
    maxWidth: 320,
    ...Layout.shadow.medium,
  },
  emoji: {
    fontSize: 48,
    marginBottom: Layout.spacing.md,
  },
  title: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    textAlign: 'center',
    marginBottom: Layout.spacing.sm,
  },
  subtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Layout.spacing.lg,
    lineHeight: 20,
  },
  actionButton: {
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.md,
    borderRadius: Layout.borderRadius.md,
    minWidth: 120,
  },
  actionButtonText: {
    color: Colors.textOnPrimary,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    textAlign: 'center',
  },
});
