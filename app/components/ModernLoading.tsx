// app/components/ModernLoading.tsx
import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Colors, Layout } from '../constants/GlobalStyles';

interface ModernLoadingProps {
  size?: 'small' | 'medium' | 'large';
}

export default function ModernLoading({ size = 'medium' }: ModernLoadingProps) {
  const spinValue = React.useRef(new Animated.Value(0)).current;
  const pulseValue = React.useRef(new Animated.Value(0.7)).current;

  React.useEffect(() => {
    const spin = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    );

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseValue, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseValue, {
          toValue: 0.7,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    );

    spin.start();
    pulse.start();

    return () => {
      spin.stop();
      pulse.stop();
    };
  }, [spinValue, pulseValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const getSizeStyle = () => {
    switch (size) {
      case 'small':
        return { width: 24, height: 24 };
      case 'large':
        return { width: 60, height: 60 };
      default:
        return { width: 40, height: 40 };
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.spinner,
          getSizeStyle(),
          {
            transform: [{ rotate: spin }, { scale: pulseValue }],
          },
        ]}
      >
        <View style={[styles.innerCircle, getSizeStyle()]} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: Layout.spacing.xl,
  },
  spinner: {
    borderWidth: 3,
    borderColor: Colors.primary + '30',
    borderTopColor: Colors.primary,
    borderRadius: 50,
  },
  innerCircle: {
    position: 'absolute',
    top: 3,
    left: 3,
    right: 3,
    bottom: 3,
    borderRadius: 50,
    backgroundColor: Colors.primary + '10',
  },
});
