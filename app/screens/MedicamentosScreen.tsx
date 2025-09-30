// app/screens/MedicamentosScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, Alert, StyleSheet, TextInput, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { GlobalStyles, Colors, Layout, Typography } from '../constants/GlobalStyles';
import LoadingAnimation from '../components/LoadingAnimation';
import EmptyState from '../components/EmptyState';
import { SimpleNotificationService } from '../services/SimpleNotificationService';
import { GradientBackground } from '../components/GradientBackground';

type Medication = {
  id: string;
  name: string;
  dose: number | null;
  unit: string | null;
  notes: string | null;
  image_url: string | null;
};

export default function MedicamentosScreen() {
  const nav = useNavigation<any>();
  const [items, setItems] = useState<Medication[]>([]);
  const [filteredItems, setFilteredItems] = useState<Medication[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [medicationSchedules, setMedicationSchedules] = useState<{[key: string]: number}>({});

  const load = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    // Cargar medicamentos
    const { data, error } = await supabase
      .from('medications')
      .select('id,name,dose,unit,notes,image_url')
      .eq('patient_user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setItems(data as Medication[]);
      setFilteredItems(data as Medication[]);
      
      // Cargar conteo de horarios para cada medicamento
      const scheduleCounts: {[key: string]: number} = {};
      for (const medication of data) {
        const { data: schedules } = await supabase
          .from('schedules')
          .select('id')
          .eq('medication_id', medication.id)
          .eq('patient_user_id', user.id);
        scheduleCounts[medication.id] = schedules?.length || 0;
      }
      setMedicationSchedules(scheduleCounts);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Función de búsqueda
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setFilteredItems(items);
    } else {
      const filtered = items.filter((item: Medication) =>
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        (item.notes && item.notes.toLowerCase().includes(query.toLowerCase()))
      );
      setFilteredItems(filtered);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const editMedication = (medication: Medication) => {
    nav.navigate('MedicationForm', { 
      medication: medication,
      onSaved: load 
    });
  };

  const testNotifications = async () => {
    try {
      console.log('🧪 Iniciando prueba de notificaciones...');
      await SimpleNotificationService.scheduleTestNotification();
    } catch (error) {
      console.error('❌ Error en prueba de notificaciones:', error);
      Alert.alert('Error', 'No se pudo probar las notificaciones');
    }
  };

  const deleteMedication = async (medication: Medication) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Contar horarios asociados
      const { data: schedules, error: countError } = await supabase
        .from('schedules')
        .select('id')
        .eq('medication_id', medication.id)
        .eq('patient_user_id', user.id);

      if (countError) {
        Alert.alert('Error', 'No se pudo verificar los horarios asociados');
        return;
      }

      const scheduleCount = schedules?.length || 0;
      const scheduleText = scheduleCount > 0 
        ? `\n\n⚠️ Este medicamento tiene ${scheduleCount} horario${scheduleCount > 1 ? 's' : ''} configurado${scheduleCount > 1 ? 's' : ''} que también ${scheduleCount > 1 ? 'serán eliminados' : 'será eliminado'}.`
        : '';

      Alert.alert(
        'Eliminar medicamento',
        `¿Estás seguro de que quieres eliminar "${medication.name}"?${scheduleText}`,
        [
          { text: '❌ Cancelar', style: 'cancel' },
          { 
            text: '🗑️ Eliminar', 
            style: 'destructive',
            onPress: async () => {
              try {
                // Primero eliminar los horarios asociados
                if (scheduleCount > 0) {
                  await supabase
                    .from('schedules')
                    .delete()
                    .eq('medication_id', medication.id)
                    .eq('patient_user_id', user.id);
                }

                // Luego eliminar el medicamento
                const { error } = await supabase
                  .from('medications')
                  .delete()
                  .eq('id', medication.id)
                  .eq('patient_user_id', user.id);
                
                if (error) {
                  Alert.alert('Error', 'No se pudo eliminar el medicamento');
                  console.error('Error deleting medication:', error);
                } else {
                  Alert.alert(
                    '✅ Eliminado', 
                    scheduleCount > 0 
                      ? `Medicamento y ${scheduleCount} horario${scheduleCount > 1 ? 's' : ''} eliminado${scheduleCount > 1 ? 's' : ''} correctamente`
                      : 'Medicamento eliminado correctamente'
                  );
                  load(); // Recargar la lista
                }
              } catch (err) {
                Alert.alert('Error', 'Error inesperado al eliminar el medicamento');
                console.error('Error in deleteMedication:', err);
              }
            }
          }
        ]
      );
    } catch (err) {
      Alert.alert('Error', 'Error al verificar el medicamento');
      console.error('Error checking medication:', err);
    }
  };

  if (loading) return <LoadingAnimation message="Cargando medicamentos..." size="large" />;

  return (
    <GradientBackground>
      <View style={{ flex: 1 }}>
      {/* Barra de búsqueda */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar medicamentos..."
          value={searchQuery}
          onChangeText={handleSearch}
          placeholderTextColor={Colors.textSecondary}
        />
        <Text style={styles.searchIcon}>🔍</Text>
      </View>

      <FlatList
        data={filteredItems}
        keyExtractor={(i) => i.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          items.length === 0 ? (
            <EmptyState
              title="No tienes medicamentos"
              subtitle="Crea tu primer medicamento para comenzar a gestionar tus horarios"
              actionText="Crear medicamento"
              onAction={() => nav.navigate('MedicationForm', { onSaved: load })}
              type="info"
            />
          ) : (
            <EmptyState
              title="Sin resultados"
              subtitle={`No se encontraron medicamentos que coincidan con "${searchQuery}"`}
              type="warning"
            />
          )
        }
        renderItem={({ item }) => (
          <View style={styles.medicationCard}>
            <View style={styles.medicationContent}>
              {/* Imagen del medicamento */}
              {item.image_url ? (
                <View style={styles.medicationImageContainer}>
                  <Image 
                    source={{ uri: item.image_url }} 
                    style={styles.medicationImage}
                    resizeMode="cover"
                  />
                </View>
              ) : (
                <View style={styles.medicationImagePlaceholder}>
                  <Text style={styles.medicationImagePlaceholderText}>💊</Text>
                </View>
              )}
              
              <View style={styles.medicationInfo}>
                <Text style={styles.medicationTitle}>{item.name}</Text>
                <Text style={GlobalStyles.muted}>
                  {item.dose && item.unit ? `${item.dose} ${item.unit}` : 'Sin dosis especificada'}
                </Text>
                {item.notes ? <Text style={styles.notesText}>{item.notes}</Text> : null}
              </View>
              
              <View style={styles.medicationActions}>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => editMedication(item)}
                >
                  <Text style={styles.actionButtonText}>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => deleteMedication(item)}
                >
                  <Text style={styles.actionButtonText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Tag de horarios en esquina inferior derecha */}
            {medicationSchedules[item.id] > 0 && (
              <View style={styles.schedulesBadge}>
                <Text style={styles.schedulesBadgeText}>
                  {medicationSchedules[item.id]} horario{medicationSchedules[item.id] > 1 ? 's' : ''}
                </Text>
              </View>
            )}
          </View>
        )}
      />
      <TouchableOpacity
        style={[GlobalStyles.fab]}
        onPress={() => nav.navigate('MedicationForm', { onSaved: load })}
      >
        <Text style={GlobalStyles.fabText}>＋</Text>
      </TouchableOpacity>
      
      {/* Botones de prueba de notificaciones - solo para desarrollo */}
      <TouchableOpacity
        style={[GlobalStyles.fab, { bottom: 100, backgroundColor: Colors.warning }]}
        onPress={testNotifications}
      >
        <Text style={GlobalStyles.fabText}>🔔</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[GlobalStyles.fab, { bottom: 160, backgroundColor: Colors.success }]}
        onPress={() => SimpleNotificationService.listScheduledNotifications()}
      >
        <Text style={GlobalStyles.fabText}>📋</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[GlobalStyles.fab, { bottom: 220, backgroundColor: Colors.secondary }]}
        onPress={() => SimpleNotificationService.cancelAllNotifications()}
      >
        <Text style={GlobalStyles.fabText}>🗑️</Text>
      </TouchableOpacity>
      
      {/* Botón de debug - solo para desarrollo */}
      <TouchableOpacity
        style={[GlobalStyles.fab, { bottom: 280, backgroundColor: Colors.error }]}
        onPress={() => nav.navigate('Debug')}
      >
        <Text style={GlobalStyles.fabText}>🔧</Text>
      </TouchableOpacity>
    </View>
  </GradientBackground>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Layout.borderRadius.md,
    marginHorizontal: Layout.spacing.md,
    marginVertical: Layout.spacing.sm,
    paddingHorizontal: Layout.spacing.md,
    ...Layout.shadow.small,
  },
  
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: Typography.sizes.base,
    color: Colors.textPrimary,
  },
  
  searchIcon: {
    fontSize: Typography.sizes.lg,
    color: Colors.textSecondary,
    marginLeft: Layout.spacing.sm,
  },
  
  medicationCard: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.borderRadius.md,
    padding: Layout.spacing.md,
    marginBottom: Layout.spacing.md,
    marginHorizontal: Layout.spacing.md,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  
  medicationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  
  medicationInfo: {
    flex: 1,
    paddingRight: Layout.spacing.sm,
    justifyContent: 'center',
  },
  
  notesText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  
  medicationActions: {
    flexDirection: 'row',
    gap: Layout.spacing.xs,
    alignItems: 'center',
  },
  
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: Layout.borderRadius.sm,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  deleteButton: {
    backgroundColor: Colors.errorLight,
    borderColor: Colors.error,
  },
  
  actionButtonText: {
    fontSize: Typography.sizes.base,
  },
  

  
  schedulesBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: Colors.primary,
    borderRadius: Layout.borderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  
  medicationTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.medium,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  
  schedulesBadgeText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textOnPrimary,
    fontWeight: Typography.weights.medium,
  },

  medicationImageContainer: {
    width: 48,
    height: 48,
    marginRight: Layout.spacing.md,
    borderRadius: Layout.borderRadius.md,
    overflow: 'hidden',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  medicationImage: {
    width: '100%',
    height: '100%',
  },

  medicationImagePlaceholder: {
    width: 48,
    height: 48,
    marginRight: Layout.spacing.md,
    borderRadius: Layout.borderRadius.md,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },

  medicationImagePlaceholderText: {
    fontSize: 20,
    color: Colors.textSecondary,
  },
});