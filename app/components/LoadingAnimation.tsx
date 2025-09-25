// app/components/LoadingAnimation.tsx
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Colors, Typography, Layout } from '../constants/GlobalStyles';

interface LoadingAnimationProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
}

export default function LoadingAnimation({ 
  message = 'Cargando...', 
  size = 'medium' 
}: LoadingAnimationProps) {
  const spinValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Animación de rotación continua
    const spinAnimation = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    // Animación de pulso
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseValue, {
          toValue: 1.2,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseValue, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    spinAnimation.start();
    pulseAnimation.start();

    return () => {
      spinAnimation.stop();
      pulseAnimation.stop();
    };
  }, [spinValue, pulseValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const sizeStyles = {
    small: { width: 40, height: 40, fontSize: 20 },
    medium: { width: 60, height: 60, fontSize: 30 },
    large: { width: 80, height: 80, fontSize: 40 },
  };

  const containerStyles = {
    small: styles.containerSmall,
    medium: styles.containerMedium,
    large: styles.containerLarge,
  };

  return (
    <View style={[styles.container, containerStyles[size]]}>
      <Animated.View
        style={[
          styles.spinner,
          sizeStyles[size],
          {
            transform: [
              { rotate: spin },
              { scale: pulseValue },
            ],
          },
        ]}
      >
        <Text style={[styles.emoji, { fontSize: sizeStyles[size].fontSize }]}>
          💊
        </Text>
      </Animated.View>
      
      {message && (
        <Animated.Text 
          style={[
            styles.loadingText,
            size === 'small' ? styles.loadingTextSmall : 
            size === 'large' ? styles.loadingTextLarge : styles.loadingTextMedium,
            { opacity: pulseValue }
          ]}
        >
          {message}
        </Animated.Text>
      )}
      
      {/* Puntos animados */}
      <View style={styles.dotsContainer}>
        {[0, 1, 2].map((index) => (
          <Animated.View
            key={index}
            style={[
              styles.dot,
              {
                opacity: pulseValue,
                transform: [
                  {
                    scale: pulseValue.interpolate({
                      inputRange: [1, 1.2],
                      outputRange: [0.8, 1.2],
                    }),
                  },
                ],
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  
  containerSmall: {
    padding: Layout.spacing.md,
  },
  
  containerMedium: {
    padding: Layout.spacing.lg,
  },
  
  containerLarge: {
    padding: Layout.spacing.xl,
  },
  
  spinner: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 50,
    backgroundColor: Colors.surface,
    marginBottom: Layout.spacing.md,
    ...Layout.shadow.medium,
  },
  
  emoji: {
    textAlign: 'center',
  },
  
  loadingText: {
    fontWeight: Typography.weights.medium,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Layout.spacing.sm,
  },
  
  loadingTextSmall: {
    fontSize: Typography.sizes.sm,
  },
  
  loadingTextMedium: {
    fontSize: Typography.sizes.base,
  },
  
  loadingTextLarge: {
    fontSize: Typography.sizes.lg,
  },
  
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
});
