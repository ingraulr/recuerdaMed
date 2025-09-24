// app/screens/HomeScreen.tsx
import React, { useMemo, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

// Import individual constants
import { GlobalStyles } from '../constants/GlobalStyles';
import { Colors } from '../constants/Colors';
import { Layout } from '../constants/Layout';
import { Typography } from '../constants/Typography';

// Ajusta la ruta según tu proyecto
import { supabase } from '../lib/supabase';

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(false);

  async function logout() {
    Alert.alert(
      '¿Cerrar sesión?',
      '¿Estás seguro que quieres salir de la aplicación?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, salir',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await supabase.auth.signOut();
              navigation.replace('Login');
            } catch (error) {
              console.log('Logout error:', error);
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  }

  // Datos de ejemplo para mostrar funcionalidades futuras
  const nextMedication = {
    name: 'Vitamina D',
    time: '2:00 PM',
    dose: '1 pastilla',
  };

  const todayStats = {
    taken: 3,
    pending: 1,
    total: 4,
  };

  const formattedDate = useMemo(
    () =>
      new Date().toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    [],
  );

  return (
    <SafeAreaView style={GlobalStyles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header con saludo */}
        <View style={styles.headerContainer}>
          <View style={styles.greetingSection}>
            <Text style={styles.greetingText}>¡Hola! 👋</Text>
            <Text style={GlobalStyles.welcomeText}>Bienvenido a RecuerdaMed</Text>
            <Text style={styles.dateText}>{formattedDate}</Text>
          </View>
        </View>

        {/* Próximo medicamento */}
        <View style={[GlobalStyles.card, styles.nextMedCard]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>⏰</Text>
            <Text style={styles.cardTitle}>Próximo medicamento</Text>
          </View>
          <View style={styles.medicationInfo}>
            <Text style={styles.medicationName}>{nextMedication.name}</Text>
            <Text style={styles.medicationDetails}>
              {nextMedication.time} • {nextMedication.dose}
            </Text>
          </View>
          <TouchableOpacity style={styles.reminderButton} activeOpacity={0.8}>
            <Text style={styles.reminderButtonText}>Marcar como tomado</Text>
          </TouchableOpacity>
        </View>

        {/* Estadísticas del día */}
        <View style={[GlobalStyles.card, GlobalStyles.mb_lg]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>📊</Text>
            <Text style={styles.cardTitle}>Resumen de hoy</Text>
          </View>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: Colors.success }]}>
                {todayStats.taken}
              </Text>
              <Text style={styles.statLabel}>Tomados</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: Colors.warning }]}>
                {todayStats.pending}
              </Text>
              <Text style={styles.statLabel}>Pendientes</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: Colors.primary }]}>
                {todayStats.total}
              </Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
          </View>
        </View>

        {/* Acciones rápidas */}
        <View style={[GlobalStyles.card, GlobalStyles.mb_lg]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>🔧</Text>
            <Text style={styles.cardTitle}>Acciones rápidas</Text>
          </View>
          <View style={styles.quickActionsContainer}>
            <TouchableOpacity style={styles.quickActionButton} activeOpacity={0.8}>
              <Text style={styles.quickActionIcon}>💊</Text>
              <Text style={styles.quickActionText}>Mis medicamentos</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionButton} activeOpacity={0.8}>
              <Text style={styles.quickActionIcon}>📅</Text>
              <Text style={styles.quickActionText}>Horarios</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionButton} activeOpacity={0.8}>
              <Text style={styles.quickActionIcon}>📱</Text>
              <Text style={styles.quickActionText}>Recordatorios</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionButton} activeOpacity={0.8}>
              <Text style={styles.quickActionIcon}>📈</Text>
              <Text style={styles.quickActionText}>Historial</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Botón de cerrar sesión */}
        <View style={styles.logoutContainer}>
          <TouchableOpacity
            style={[
              GlobalStyles.button,
              GlobalStyles.buttonSecondary,
              loading && GlobalStyles.buttonDisabled,
            ]}
            onPress={logout}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text
              style={[
                GlobalStyles.buttonText,
                GlobalStyles.buttonTextSecondary,
                loading && GlobalStyles.buttonTextDisabled,
              ]}
            >
              {loading ? 'Cerrando sesión...' : 'Cerrar sesión'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    padding: Layout.padding.container,
    paddingBottom: Layout.spacing['3xl'],
  },

  headerContainer: {
    marginBottom: Layout.spacing.xl,
  },

  greetingSection: {
    // Personaliza si necesitas
  },

  greetingText: {
    fontSize: Typography.sizes.lg,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
  },

  dateText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    textTransform: 'capitalize',
    marginTop: 2,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },

  cardIcon: {
    fontSize: Typography.sizes.xl,
  },

  cardTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: '600',
    color: Colors.textPrimary,
  },

  nextMedCard: {
    marginBottom: Layout.spacing.lg,
  },

  medicationInfo: {
    marginTop: 4,
    marginBottom: 12,
  },

  medicationName: {
    fontSize: Typography.sizes.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
  },

  medicationDetails: {
    marginTop: 2,
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
  },

  reminderButton: {
    alignSelf: 'flex-start',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: Colors.primary,
  },

  reminderButtonText: {
    color: Colors.primary,
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
  },

  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },

  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
  },

  statNumber: {
    fontSize: Typography.sizes.xl,
    fontWeight: '700',
  },

  statLabel: {
    marginTop: 2,
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
  },

  quickActionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },

  quickActionButton: {
    flexBasis: '48%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },

  quickActionIcon: {
    fontSize: Typography.sizes.lg,
    marginBottom: 8,
  },

  quickActionText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textPrimary,
    textAlign: 'center',
  },

  logoutContainer: {
    marginTop: Layout.spacing.md,
    marginBottom: Layout.spacing['3xl'],
  },
});