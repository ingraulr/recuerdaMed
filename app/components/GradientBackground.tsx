// app/components/GradientBackground.tsx
import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/Colors';
import { StyleSheet } from 'react-native';

interface GradientBackgroundProps {
  children: React.ReactNode;
  style?: any;
}

export const GradientBackground: React.FC<GradientBackgroundProps> = ({ 
  children, 
  style = {} 
}) => {
  return (
    <LinearGradient
      colors={[
        Colors.backgroundGradient.start,   // #FAFBFF (casi blanco)
        Colors.backgroundGradient.middle,  // #F0F9FF (azul muy claro)
        Colors.backgroundGradient.end      // #EBF8FF (azul suave)
      ]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      locations={[0, 0.5, 1]}
      style={[styles.gradient, style]}
    >
      {children}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
});
