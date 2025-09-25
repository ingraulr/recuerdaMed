// app/screens/HistorialScreen.tsx
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { GlobalStyles } from '../constants/GlobalStyles';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { Layout } from '../constants/Layout';
import LoadingAnimation from '../components/LoadingAnimation';

// Tipos para el historial
interface HistorialDose {
  id: string;
  medication_name: string;
  dose_amount: string;
  planned_at: string;
  status: 'done' | 'scheduled' | 'skipped' | 'late';
  created_at: string;
  schedule_id: string;
}

interface GroupedHistory {
  [date: string]: HistorialDose[];
}

export default function HistorialScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [historialData, setHistorialData] = useState<HistorialDose[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'done' | 'skipped'>('all');

  // Cargar historial desde la base de datos
  const loadHistorial = React.useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Por ahora, crear datos de ejemplo para mostrar la funcionalidad
      // TODO: Implementar consulta real cuando tengamos datos en la base
      
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const twoDaysAgo = new Date(now);
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      const sampleData: HistorialDose[] = [
        {
          id: '1',
          medication_name: 'Vitamina D',
          dose_amount: '1000 mg',
          planned_at: now.toISOString(),
          status: 'done',
          created_at: now.toISOString(),
          schedule_id: 'schedule1',
        },
        {
          id: '2',
          medication_name: 'Paracetamol',
          dose_amount: '500 mg',
          planned_at: yesterday.toISOString(),
          status: 'done',
          created_at: yesterday.toISOString(),
          schedule_id: 'schedule2',
        },
        {
          id: '3',
          medication_name: 'Omeprazol',
          dose_amount: '20 mg',
          planned_at: yesterday.toISOString(),
          status: 'done',
          created_at: yesterday.toISOString(),
          schedule_id: 'schedule3',
        },
        {
          id: '4',
          medication_name: 'Aspirina',
          dose_amount: '100 mg',
          planned_at: twoDaysAgo.toISOString(),
          status: 'skipped',
          created_at: twoDaysAgo.toISOString(),
          schedule_id: 'schedule4',
        },
      ];

      setHistorialData(sampleData);

    } catch (error) {
      console.error('Error in loadHistorial:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar datos cuando se enfoca la pantalla
  useFocusEffect(
    React.useCallback(() => {
      loadHistorial();
    }, [loadHistorial])
  );

  // Agrupar historial por fecha
  const groupedHistory = useMemo(() => {
    const filtered = historialData.filter(dose => {
      if (selectedStatus === 'all') return true;
      if (selectedStatus === 'done') return dose.status === 'done';
      if (selectedStatus === 'skipped') return dose.status === 'skipped';
      return false;
    });

    const grouped: GroupedHistory = {};
    
    filtered.forEach(dose => {
      const date = new Date(dose.planned_at).toISOString().split('T')[0];
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(dose);
    });

    return grouped;
  }, [historialData, selectedStatus]);

  // Formatear fecha para mostrar
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hoy';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ayer';
    } else {
      return date.toLocaleDateString('es-ES', { 
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      });
    }
  };

  // Formatear hora
  const formatTime = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <SafeAreaView style={GlobalStyles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Atrás</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📈 Historial</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Filtros */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity 
            style={[styles.filterButton, selectedStatus === 'all' && styles.filterButtonActive]}
            onPress={() => setSelectedStatus('all')}
          >
            <Text style={[styles.filterButtonText, selectedStatus === 'all' && styles.filterButtonTextActive]}>
              Todas
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterButton, selectedStatus === 'done' && styles.filterButtonActive]}
            onPress={() => setSelectedStatus('done')}
          >
            <Text style={[styles.filterButtonText, selectedStatus === 'done' && styles.filterButtonTextActive]}>
              ✅ Tomadas
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterButton, selectedStatus === 'skipped' && styles.filterButtonActive]}
            onPress={() => setSelectedStatus('skipped')}
          >
            <Text style={[styles.filterButtonText, selectedStatus === 'skipped' && styles.filterButtonTextActive]}>
              ⏭️ Omitidas
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Contenido */}
      {loading ? (
        <LoadingAnimation message="Cargando historial..." size="medium" />
      ) : (
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {Object.keys(groupedHistory).length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyTitle}>Sin historial</Text>
              <Text style={styles.emptyMessage}>
                Aquí aparecerán los medicamentos que hayas tomado
              </Text>
            </View>
          ) : (
            Object.keys(groupedHistory)
              .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
              .map(date => (
                <View key={date} style={styles.daySection}>
                  <Text style={styles.dayTitle}>{formatDate(date)}</Text>
                  {groupedHistory[date].map(dose => (
                    <View key={dose.id} style={styles.doseCard}>
                      <View style={styles.doseHeader}>
                        <Text style={styles.medicationName}>{dose.medication_name}</Text>
                        <Text style={styles.doseTime}>{formatTime(dose.planned_at)}</Text>
                      </View>
                      <Text style={styles.doseAmount}>{dose.dose_amount}</Text>
                      <View style={styles.statusContainer}>
                        <View style={[
                          styles.statusBadge, 
                          dose.status === 'done' ? styles.statusBadgeDone : styles.statusBadgeSkipped
                        ]}>
                          <Text style={[
                            styles.statusText,
                            dose.status === 'done' ? styles.statusTextDone : styles.statusTextSkipped
                          ]}>
                            {dose.status === 'done' ? '✅ Tomado' : '⏭️ Omitido'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = {
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: Layout.spacing.md,
    paddingTop: Layout.spacing.xl * 1.5,
    paddingBottom: Layout.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.background,
  },

  backButton: {
    padding: Layout.spacing.xs,
  },

  backButtonText: {
    fontSize: Typography.sizes.base,
    color: Colors.primary,
    fontWeight: '600' as const,
  },

  headerTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: '700' as const,
    color: Colors.textPrimary,
  },

  headerSpacer: {
    width: 50, // Para balancear el botón de atrás
  },

  filtersContainer: {
    paddingVertical: Layout.spacing.sm,
    paddingHorizontal: Layout.spacing.md,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },

  filterButton: {
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.xs,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    marginRight: Layout.spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  filterButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },

  filterButtonText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },

  filterButtonTextActive: {
    color: Colors.textOnPrimary,
    fontWeight: '600' as const,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingVertical: Layout.spacing.xl,
  },

  loadingText: {
    marginTop: Layout.spacing.sm,
    fontSize: Typography.sizes.base,
    color: Colors.textSecondary,
  },

  scrollContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingVertical: Layout.spacing.xl * 2,
    paddingHorizontal: Layout.spacing.lg,
  },

  emptyIcon: {
    fontSize: 48,
    marginBottom: Layout.spacing.md,
  },

  emptyTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: '700' as const,
    color: Colors.textPrimary,
    marginBottom: Layout.spacing.xs,
    textAlign: 'center' as const,
  },

  emptyMessage: {
    fontSize: Typography.sizes.base,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: Typography.sizes.base * 1.5,
  },

  daySection: {
    marginBottom: Layout.spacing.lg,
  },

  dayTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: '700' as const,
    color: Colors.textPrimary,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    backgroundColor: Colors.surface,
    marginBottom: Layout.spacing.xs,
    textTransform: 'capitalize' as const,
  },

  doseCard: {
    backgroundColor: Colors.background,
    marginHorizontal: Layout.spacing.md,
    marginBottom: Layout.spacing.xs,
    padding: Layout.spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  doseHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    marginBottom: Layout.spacing.xs,
  },

  medicationName: {
    fontSize: Typography.sizes.base,
    fontWeight: '600' as const,
    color: Colors.textPrimary,
    flex: 1,
  },

  doseTime: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },

  doseAmount: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    marginBottom: Layout.spacing.sm,
  },

  statusContainer: {
    flexDirection: 'row' as const,
    justifyContent: 'flex-start' as const,
  },

  statusBadge: {
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: Layout.spacing.xs / 2,
    borderRadius: 12,
  },

  statusBadgeDone: {
    backgroundColor: Colors.success + '20', // 20% opacity
  },

  statusBadgeSkipped: {
    backgroundColor: Colors.warning + '20', // 20% opacity
  },

  statusText: {
    fontSize: Typography.sizes.xs,
    fontWeight: '600' as const,
  },

  statusTextDone: {
    color: Colors.success,
  },

  statusTextSkipped: {
    color: Colors.warning,
  },
};
