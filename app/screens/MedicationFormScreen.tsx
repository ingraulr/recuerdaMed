// app/screens/MedicationFormScreen.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { GlobalStyles } from '../constants/GlobalStyles';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function MedicationFormScreen() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const onSaved = route.params?.onSaved;
  const medicationToEdit = route.params?.medication;
  const isEditing = !!medicationToEdit;

  const [name, setName] = useState(medicationToEdit?.name || '');
  const [dose, setDose] = useState<string>(medicationToEdit?.dose?.toString() || '');
  const [unit, setUnit] = useState(medicationToEdit?.unit || 'mg');
  const [notes, setNotes] = useState(medicationToEdit?.notes || '');
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!name.trim()) return Alert.alert('Nombre requerido');

    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    let error;
    
    if (isEditing) {
      // Actualizar medicamento existente
      const { error: updateError } = await supabase
        .from('medications')
        .update({
          name,
          dose: dose ? Number(dose) : null,
          unit,
          notes: notes || null,
        })
        .eq('id', medicationToEdit.id)
        .eq('patient_user_id', user!.id);
      error = updateError;
    } else {
      // Crear nuevo medicamento
      const { error: insertError } = await supabase
        .from('medications')
        .insert({
          patient_user_id: user!.id,
          name,
          dose: dose ? Number(dose) : null,
          unit,
          notes: notes || null,
        });
      error = insertError;
    }
    
    setSaving(false);
    if (error) return Alert.alert('Error', error.message);
    
    Alert.alert(
      '✅ Guardado', 
      isEditing ? 'Medicamento actualizado correctamente' : 'Medicamento creado correctamente'
    );
    onSaved?.();
    nav.goBack();
  }

  return (
    <View style={[GlobalStyles.contentContainer, { gap: 12 }]}>
      <Text style={GlobalStyles.subtitle}>
        {isEditing ? 'Editar Medicamento' : 'Nuevo Medicamento'}
      </Text>
      
      <Text style={GlobalStyles.label}>Nombre</Text>
      <TextInput style={GlobalStyles.input} value={name} onChangeText={setName} placeholder="Ej. Vitamina D" />

      <Text style={GlobalStyles.label}>Dosis</Text>
      <TextInput style={GlobalStyles.input} value={dose} onChangeText={setDose} keyboardType="numeric" placeholder="Ej. 50" />

      <Text style={GlobalStyles.label}>Unidad</Text>
      <TextInput style={GlobalStyles.input} value={unit} onChangeText={setUnit} placeholder="mg | ml | pastilla" />

      <Text style={GlobalStyles.label}>Notas</Text>
      <TextInput style={[GlobalStyles.input, { height: 90 }]} value={notes} onChangeText={setNotes} multiline />

      <TouchableOpacity 
        style={[GlobalStyles.button, GlobalStyles.buttonPrimary]} 
        onPress={save} 
        disabled={saving}
      >
        <Text style={GlobalStyles.buttonText}>
          {saving ? 'Guardando…' : (isEditing ? 'Actualizar Medicamento' : 'Guardar Medicamento')}
        </Text>
      </TouchableOpacity>
    </View>
  );
}