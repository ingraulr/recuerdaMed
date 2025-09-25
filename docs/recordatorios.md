# 🔔 Sistema de Recordatorios - RecuerdaMed

## 📋 Descripción General

El sistema de recordatorios de RecuerdaMed utiliza **notificaciones locales** para ayudar a los usuarios a recordar tomar sus medicamentos en los horarios correctos. El sistema está construido sobre **Expo Notifications** y proporciona una experiencia completa e interactiva.

## 🏗️ Arquitectura del Sistema

### Componentes Principales

1. **NotificationService** (`/services/NotificationService.ts`)
   - Servicio principal para manejar todas las operaciones de notificaciones
   - Gestión de permisos y configuración
   - Programación y cancelación de recordatorios
   - Acciones interactivas (Marcar como tomado, Snooze, Omitir)

2. **useNotifications Hook** (`/hooks/useNotifications.ts`)
   - Hook personalizado para integrar notificaciones en componentes
   - Manejo de estado de permisos
   - Funciones de alto nivel para schedules

3. **Integración en HorariosScreen** (`/screens/HorariosScreen.tsx`)
   - Botones para activar/desactivar recordatorios por medicamento
   - Configuración inicial de permisos
   - UI visual para el estado de notificaciones

## ✨ Funcionalidades Implementadas

### 🔐 Gestión de Permisos
- **Solicitud automática** de permisos de notificación
- **Configuración de canales** Android específicos
- **Detección de simulador** con alertas informativas
- **Guías visuales** para habilitar permisos manualmente

### ⏰ Programación de Recordatorios
- **Recordatorios diarios recurrentes** basados en `fixed_times`
- **Múltiples horarios por medicamento** (1x, 2x, 3x, 4x al día)
- **Información personalizada** con nombre y dosis del medicamento
- **Gestión automática** de zona horaria del usuario

### 🎯 Acciones Interactivas
Cada notificación incluye 3 acciones directas:

1. **✅ Marcar como Tomado**
   - Actualiza la base de datos (`doses` table)
   - Status: `'done'`
   - No requiere abrir la app

2. **⏰ Snooze (15 minutos)**
   - Reagenda la notificación para 15 minutos después
   - Mantiene el contexto del medicamento
   - Ideal para casos de "en unos minutos"

3. **⏭️ Omitir**
   - Marca la dosis como `'skipped'` en la base de datos
   - Útil para situaciones donde no se puede tomar

### 🎨 Interfaz de Usuario

#### En HorariosScreen:
- **Botón 🔔 Configurar Recordatorios**: Configuración inicial
- **Botón individual por medicamento**: 🔔 (activo) / 🔕 (inactivo)
- **Estados visuales**: Botones con colores diferentes según estado
- **Feedback inmediato**: Alerts de confirmación

#### Elementos Visuales:
```typescript
// Estados de botón de notificación
🔔 = Recordatorios activos
🔕 = Recordatorios inactivos

// Colores
notificationButtonActive: {
  backgroundColor: Colors.primary + '20',
  borderColor: Colors.primary,
}
```

## 🔧 Configuración Técnica

### Dependencias Instaladas
```json
{
  "expo-notifications": "~0.32.11",
  "expo-device": "latest", 
  "expo-constants": "latest"
}
```

### Configuración Android
```typescript
// Canal específico para medicamentos
await Notifications.setNotificationChannelAsync('medication-reminders', {
  name: 'Recordatorios de Medicamentos',
  description: 'Notificaciones para recordar tomar medicamentos',
  importance: Notifications.AndroidImportance.HIGH,
  vibrationPattern: [0, 250, 250, 250],
  lightColor: '#FF6B6B',
});
```

### Estructura de Datos
```typescript
interface MedicationReminder {
  id: string;           // Único por horario
  medicationId: string; // ID del medicamento
  medicationName: string; // Nombre para mostrar
  dose: string;         // Dosis formateada
  time: string;         // HH:MM formato
  scheduleId: string;   // ID del schedule
}
```

## 📱 Flujo de Usuario

### 1. Configuración Inicial
```
Usuario -> HorariosScreen 
       -> "🔔 Configurar Recordatorios" 
       -> Solicitud de permisos 
       -> Confirmación
```

### 2. Activación por Medicamento
```
Usuario -> Lista de horarios 
       -> Botón 🔕 
       -> Programación automática 
       -> Confirmación ✅
       -> Botón cambia a 🔔
```

### 3. Recepción de Notificación
```
Sistema -> Envía notificación a la hora programada
        -> Usuario ve: "💊 Hora de tu medicamento"
        -> 3 opciones: ✅ Tomado | ⏰ 15 min | ⏭️ Omitir
```

### 4. Respuesta Interactiva
```
Usuario -> Selecciona acción
        -> Sistema actualiza BD automáticamente
        -> (Opcional) Reagenda si es Snooze
```

## 🗄️ Integración con Base de Datos

### Tabla `doses`
```sql
-- Registro automático cuando se marca como tomado/omitido
INSERT INTO doses (
  patient_user_id, 
  schedule_id, 
  planned_at, 
  status  -- 'done' | 'skipped'
) VALUES (...);
```

### Políticas RLS
- **Pacientes**: Pueden insertar sus propias dosis
- **Cuidadores**: Pueden insertar dosis para pacientes vinculados
- **Seguridad**: Cada usuario solo maneja sus datos

## 🎯 Casos de Uso

### Escenario 1: Paciente Regular
```
María configura recordatorios para su vitamina D (1x día, 8:00 AM)
-> Sistema programa notificación diaria
-> Cada mañana recibe: "💊 Hora de tu medicamento - Vitamina D (1000 IU)"
-> Toca "✅ Tomado" -> Se registra automáticamente
```

### Escenario 2: Medicamento Múltiple
```
Juan tiene antibiótico 3x al día (8:00, 14:00, 20:00)
-> Sistema programa 3 notificaciones diarias
-> A las 14:00 está en junta -> Toca "⏰ 15 min"
-> A las 14:15 recibe recordatorio -> Toca "✅ Tomado"
```

### Escenario 3: Manejo de Excepciones
```
Ana no puede tomar su medicamento porque está enferma
-> Recibe notificación normal
-> Toca "⏭️ Omitir" 
-> Se registra como 'skipped' para el seguimiento médico
```

## 🔍 Debugging y Monitoreo

### Logs del Sistema
```typescript
// Ejemplos de logs generados
"📅 Recordatorio programado para Aspirina a las 08:00 (ID: abc123)"
"🗑️ Recordatorio cancelado: abc123"  
"✅ Dosis marcada como tomada desde notificación"
"⏰ Recordatorio reagendado para 15 minutos"
```

### Herramientas de Debug
```typescript
// Obtener estadísticas
const stats = await NotificationService.getNotificationStats();
console.log(`Total programados: ${stats.total}`);
console.log(`Próximo: ${stats.nextReminder?.time}`);

// Listar notificaciones activas
const scheduled = await NotificationService.getScheduledNotifications();
```

## 🚀 Próximas Mejoras

### Funcionalidades Planificadas
- [ ] **Recordatorios inteligentes** basados en ubicación
- [ ] **Integración con Apple Health/Google Fit**
- [ ] **Estadísticas avanzadas** de adherencia
- [ ] **Recordatorios para cuidadores** cuando paciente no toma
- [ ] **Personalización de sonidos** por medicamento
- [ ] **Modo "No molestar"** configurable

### Optimizaciones Técnicas
- [ ] **Background sync** para actualizar horarios
- [ ] **Offline support** para notificaciones programadas
- [ ] **Push notifications** como backup de locales
- [ ] **Analytics** de efectividad de recordatorios

## ⚡ Performance y Limitaciones

### Limitaciones Conocidas
- **Notificaciones locales**: Máximo ~64 programadas por app en iOS
- **Precisión**: Depende del sistema operativo (±1 minuto típico)
- **Simulador**: No funciona en simuladores, solo dispositivos físicos
- **Background**: App debe estar instalada, notificaciones persisten

### Optimizaciones Aplicadas
- **Cancelación previa**: Evita duplicados al reprogramar
- **Batch operations**: Múltiples recordatorios en una operación
- **Error handling**: Recuperación automática de fallos
- **Memory efficient**: Limpieza automática de listeners

---

## 📞 Soporte y Documentación

Para más información técnica, revisar:
- `/services/NotificationService.ts` - Implementación completa
- `/hooks/useNotifications.ts` - Hook de integración  
- `/screens/HorariosScreen.tsx` - UI y experiencia de usuario
- **Expo Notifications Docs**: https://docs.expo.dev/versions/latest/sdk/notifications/

¡El sistema de recordatorios está listo para mejorar la adherencia al tratamiento de los usuarios! 💊✨
