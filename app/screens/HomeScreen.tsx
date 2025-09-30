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
import { useNavigation, useFocusEffect } from '@react-navigation/native';

// Import individual constants
import { GlobalStyles } from '../constants/GlobalStyles';
import { Colors } from '../constants/Colors';
import { Layout } from '../constants/Layout';
import { Typography } from '../constants/Typography';
import { GradientBackground } from '../components/GradientBackground';

// Ajusta la ruta según tu proyecto
import { supabase } from '../lib/supabase';
import LoadingAnimation from '../components/LoadingAnimation';

// Tipos para los datos
type MedicationSchedule = {
  id: string;
  medication_id: string;
  fixed_times: string[];
  medication_name: string;
  dose?: number;
  unit?: string;
};

type TodayStats = {
  taken: number;
  pending: number;
  total: number;
};

type NextMedication = {
  name: string;
  time: string;
  dose: string;
  scheduleId: string;
  medicationId: string;
} | null;

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(false);
  const [todayStats, setTodayStats] = useState<TodayStats>({ taken: 0, pending: 0, total: 0 });
  const [nextMedication, setNextMedication] = useState<NextMedication>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [userName, setUserName] = useState<string>('');

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

  // Función para extraer el nombre del email
  const extractNameFromEmail = (email: string): string => {
    const nameFromEmail = email.split('@')[0];
    // Capitalizar la primera letra y reemplazar puntos/guiones por espacios
    return nameFromEmail
      .replace(/[._-]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Función para obtener los horarios de hoy
  const loadTodayData = React.useCallback(async () => {
    try {
      setDataLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Extraer y establecer el nombre del usuario desde el email
      if (user.email) {
        const extractedName = extractNameFromEmail(user.email);
        setUserName(extractedName);
      }

      // Obtener todos los horarios del usuario con información del medicamento
      const { data: schedules, error } = await supabase
        .from('schedules')
        .select(`
          id,
          medication_id,
          fixed_times,
          medications (
            name,
            dose,
            unit
          )
        `)
        .eq('patient_user_id', user.id);

      if (error) {
        console.error('Error loading schedules:', error);
        return;
      }

      // Procesar los horarios para hoy
      const schedulesWithMedication: MedicationSchedule[] = (schedules || []).map(schedule => {
        const medication = Array.isArray(schedule.medications) 
          ? schedule.medications[0] 
          : schedule.medications;
        
        return {
          id: schedule.id,
          medication_id: schedule.medication_id,
          fixed_times: schedule.fixed_times || [],
          medication_name: medication?.name || 'Medicamento',
          dose: medication?.dose || undefined,
          unit: medication?.unit || undefined,
        };
      });

      // Función helper para formatear la hora
      const formatTime = (hours: number, minutes: number): string => {
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
        const displayMinutes = minutes.toString().padStart(2, '0');
        return `${displayHours}:${displayMinutes} ${period}`;
      };

      // Función para calcular las estadísticas del día
      const calculateTodayStats = async (schedules: MedicationSchedule[]) => {
        let total = 0;
        
        // Contar total de dosis programadas para hoy
        schedules.forEach(schedule => {
          total += schedule.fixed_times.length;
        });

        // Obtener dosis ya tomadas hoy
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const { data: takenDoses, error } = await supabase
          .from('doses')
          .select('*')
          .eq('patient_user_id', user.id)
          .gte('planned_at', `${today}T00:00:00.000Z`)
          .lte('planned_at', `${today}T23:59:59.999Z`)
          .eq('status', 'done');

        if (error) {
          console.error('Error fetching taken doses:', error);
        }

        const taken = takenDoses?.length || 0;
        const pending = total - taken;

        setTodayStats({
          taken,
          pending,
          total
        });
      };

      // Función para encontrar el próximo medicamento
      const findNextMedication = async (schedules: MedicationSchedule[]) => {
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        
        // Obtener las dosis ya tomadas hoy para filtrarlas
        const { data: takenDoses, error } = await supabase
          .from('doses')
          .select('schedule_id, planned_at')
          .eq('patient_user_id', user.id)
          .gte('planned_at', `${today}T00:00:00.000Z`)
          .lte('planned_at', `${today}T23:59:59.999Z`)
          .eq('status', 'done');

        if (error) {
          console.error('Error fetching taken doses for next medication:', error);
        }

        // Crear set de schedule_ids ya tomados para búsqueda rápida
        const takenScheduleIds = new Set(
          (takenDoses || []).map(dose => dose.schedule_id)
        );
        
        let nextMed: NextMedication | null = null;
        let nextTime = Infinity;

        schedules.forEach(schedule => {
          // Verificar si este schedule ya tiene dosis tomadas hoy
          const hasTakenDoses = takenScheduleIds.has(schedule.id);
          
          schedule.fixed_times.forEach(timeStr => {
            const [hours, minutes] = timeStr.split(':').map(Number);
            const scheduleTime = hours * 60 + minutes;
            
            // Si es un horario futuro del día de hoy y no tiene dosis tomadas
            if (scheduleTime > currentTime && 
                scheduleTime < nextTime && 
                !hasTakenDoses) {
              nextTime = scheduleTime;
              const dose = schedule.dose ? `${schedule.dose} ${schedule.unit || ''}` : '1 dosis';
              
              nextMed = {
                name: schedule.medication_name,
                time: formatTime(hours, minutes),
                dose: dose.trim(),
                scheduleId: schedule.id,
                medicationId: schedule.medication_id
              };
            }
          });
        });

        setNextMedication(nextMed);
      };

      // Calcular estadísticas y próximo medicamento
      await calculateTodayStats(schedulesWithMedication);
      await findNextMedication(schedulesWithMedication);

    } catch (error) {
      console.error('Error loading today data:', error);
    } finally {
      setDataLoading(false);
    }
  }, []);

  const markAsTaken = React.useCallback(async () => {
    if (!nextMedication) return;

    // Mostrar confirmación
    const confirmResult = await new Promise<boolean>((resolve) => {
      Alert.alert(
        '💊 Confirmar medicamento tomado',
        `¿Confirmas que has tomado ${nextMedication.name} (${nextMedication.dose}) a las ${nextMedication.time}?`,
        [
          {
            text: 'Cancelar',
            style: 'cancel',
            onPress: () => resolve(false),
          },
          {
            text: '✅ Sí, lo tomé',
            style: 'default',
            onPress: () => resolve(true),
          },
        ]
      );
    });

    if (!confirmResult) return;

    try {
      setDataLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Registrar la dosis como tomada en la tabla doses
      const now = new Date();
      const { error } = await supabase
        .from('doses')
        .insert({
          patient_user_id: user.id,
          schedule_id: nextMedication.scheduleId,
          planned_at: now.toISOString(), // Hora en que se tomó
          status: 'done'
        });

      if (error) {
        console.error('Error marking medication as taken:', error);
        return;
      }

      // Recargar los datos para actualizar estadísticas y próximo medicamento
      await loadTodayData();

      // Mostrar mensaje de éxito
      Alert.alert(
        '🎉 ¡Excelente!',
        `Has marcado correctamente que tomaste ${nextMedication.name}`,
        [{ text: 'OK', style: 'default' }]
      );
      
    } catch (error) {
      console.error('Error in markAsTaken:', error);
    }
  }, [nextMedication, loadTodayData]);

  // Cargar datos cuando se monta el componente y cuando regresa el foco
  useFocusEffect(
    React.useCallback(() => {
      loadTodayData();
    }, [loadTodayData])
  );

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

  // Mostrar pantalla de carga inicial
  if (dataLoading && !nextMedication && todayStats.total === 0) {
    return <LoadingAnimation message="Cargando tu información..." size="large" />;
  }

  return (
    <GradientBackground>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header con saludo y logout */}
        <View style={styles.headerContainer}>
          <View style={styles.greetingSection}>
            <Text style={styles.greetingText}>¡Hola{userName ? `, ${userName}` : ''}! 👋</Text>
            <Text style={GlobalStyles.welcomeText}>Bienvenido a RecuerdaMed</Text>
            <Text style={styles.dateText}>{formattedDate}</Text>
          </View>
          <View style={styles.logoutSection}>
            <Text style={styles.logoutLabel}>Cerrar sesión</Text>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={logout}
              disabled={loading}
              activeOpacity={0.7}
            >
              <Text style={styles.logoutIcon}>{loading ? '⏳' : '🚪'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Próximo medicamento */}
        <View style={[GlobalStyles.card, styles.nextMedCard]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>⏰</Text>
            <Text style={styles.cardTitle}>Próximo medicamento</Text>
          </View>
          {nextMedication ? (
            <>
              <View style={styles.medicationInfo}>
                <Text style={styles.medicationName}>{nextMedication.name}</Text>
                <Text style={styles.medicationDetails}>
                  {nextMedication.time} • {nextMedication.dose}
                </Text>
              </View>
              <TouchableOpacity 
                style={[
                  styles.reminderButton,
                  dataLoading && styles.reminderButtonDisabled
                ]} 
                activeOpacity={dataLoading ? 1 : 0.8}
                onPress={markAsTaken}
                disabled={dataLoading}
              >
                <Text style={[
                  styles.reminderButtonText,
                  dataLoading && styles.reminderButtonTextDisabled
                ]}>
                  {dataLoading ? '⏳ Marcando...' : '✅ Marcar como tomado'}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.noMedicationContainer}>
              <Text style={styles.noMedicationText}>
                {dataLoading ? '⏳ Cargando...' : '🎉 ¡No hay más medicamentos por hoy!'}
              </Text>
              <Text style={styles.noMedicationSubtext}>
                {dataLoading ? 'Obteniendo tus horarios...' : 'Has completado todos los horarios del día'}
              </Text>
            </View>
          )}
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
            <TouchableOpacity 
              style={styles.quickActionButton} 
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Medicamentos')}
            >
              <Text style={styles.quickActionIcon}>💊</Text>
              <Text style={styles.quickActionText}>Mis medicamentos</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.quickActionButton} 
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Horarios')}
            >
              <Text style={styles.quickActionIcon}>📅</Text>
              <Text style={styles.quickActionText}>Horarios</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.quickActionButton} 
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Recordatorios')}
            >
              <Text style={styles.quickActionIcon}>⏲️</Text>
              <Text style={styles.quickActionText}>Recordatorios</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.quickActionButton} 
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Historial')}
            >
              <Text style={styles.quickActionIcon}>📈</Text>
              <Text style={styles.quickActionText}>Historial</Text>
            </TouchableOpacity>
          </View>
        </View>


      </ScrollView>
    </SafeAreaView>
  </GradientBackground>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    padding: Layout.padding.container,
    paddingBottom: Layout.spacing['3xl'],
  },

  headerContainer: {
    marginBottom: Layout.spacing.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  greetingSection: {
    flex: 1,
  },

  logoutSection: {
    alignItems: 'center',
    marginTop: 8,
  },

  logoutLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.textLight,
    marginBottom: 4,
    fontWeight: Typography.weights.medium,
  },

  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...Layout.shadow.small,
  },

  logoutIcon: {
    fontSize: Typography.sizes.lg,
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
    color: Colors.textOnPrimary,
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
  },

  reminderButtonDisabled: {
    backgroundColor: Colors.textSecondary,
    opacity: 0.6,
  },

  reminderButtonTextDisabled: {
    color: Colors.textOnPrimary,
    opacity: 0.8,
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

  noMedicationContainer: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
  },

  noMedicationText: {
    fontSize: Typography.sizes.base,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },

  noMedicationSubtext: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.sizes.sm * 1.4,
  },
});