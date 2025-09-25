# 💊 RecuerdaMed

**RecuerdaMed** es una aplicación móvil moderna para la gestión de medicamentos y recordatorios médicos. Diseñada para pacientes y cuidadores, facilita el seguimiento de horarios de medicamentos, historial de dosis y gestión de tratamientos médicos.

## 🌟 Características Principales

- 📱 **Interfaz moderna y accesible** con React Native y Expo
- 💊 **Gestión completa de medicamentos** con imágenes y dosis
- ⏰ **Sistema de horarios inteligente** con notificaciones
- 📊 **Historial detallado** de tomas y adherencia al tratamiento  
- 👥 **Sistema de roles** (Paciente/Cuidador) con permisos diferenciados
- 🔄 **Sincronización en tiempo real** con Supabase
- 🎨 **Animaciones fluidas** y experiencia de usuario optimizada
- 🔐 **Seguridad y privacidad** con autenticación robusta

## 🚀 Instalación Rápida

### Pre-requisitos

- **Node.js** 18+ ([Descargar aquí](https://nodejs.org/))
- **npm** o **yarn**
- **Expo CLI**: `npm install -g @expo/cli`
- **Cuenta de Supabase** ([Crear cuenta gratis](https://supabase.com))

### Configuración del Proyecto

1. **Clona el repositorio**
   ```bash
   git clone https://github.com/ingraulr/recuerdaMed.git
   cd recuerdaMed
   ```

2. **Instala las dependencias**
   ```bash
   npm install
   ```

3. **Configura Supabase**
   - Crea un proyecto en [Supabase](https://supabase.com)
   - Ejecuta los scripts SQL (ver sección [Base de Datos](#-base-de-datos))
   - Crea el archivo `.env` en la carpeta `app/`:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=tu_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
   ```

4. **Inicia la aplicación**
   ```bash
   npm start
   ```

5. **Ejecuta en tu dispositivo**
   - Escanea el código QR con **Expo Go** (Android/iOS)
   - O usa un emulador: `npm run android` / `npm run ios`

## 📁 Estructura del Proyecto

```
recuerdaMed/
├── 📄 README.md                 # Documentación principal
├── 📄 LICENSE.md               # Licencia del proyecto
├── 📦 package.json             # Configuración workspace
├── 🔧 recuerdaMed.code-workspace # VS Code workspace
├── 📂 app/                     # Aplicación principal Expo
│   ├── 📦 package.json         # Dependencias React Native
│   ├── 🔧 app.config.ts        # Configuración Expo
│   ├── 📱 App.tsx              # Punto de entrada
│   ├── 📂 components/          # Componentes reutilizables
│   │   ├── 🔄 LoadingAnimation.tsx    # Animación de carga
│   │   ├── ⏰ TimePickerModal.tsx     # Modal selector de tiempo
│   │   ├── 📋 EmptyState.tsx          # Estado vacío
│   │   └── 🎨 ui/                     # Componentes UI base
│   ├── 📂 constants/           # Constantes y tema
│   │   ├── 🎨 Colors.ts        # Paleta de colores
│   │   ├── 📐 Layout.ts        # Espaciados y dimensiones
│   │   ├── ✏️ Typography.ts    # Tipografías
│   │   └── 🌐 GlobalStyles.ts  # Estilos globales
│   ├── 📂 hooks/              # Hooks personalizados
│   │   ├── 🎨 use-color-scheme.ts
│   │   └── 🌈 use-theme-color.ts
│   ├── 📂 lib/                # Bibliotecas y configuraciones
│   │   └── 🔌 supabase.ts     # Cliente Supabase
│   ├── 📂 navigation/         # Configuración navegación
│   ├── 📂 screens/            # Pantallas principales
│   │   ├── 🏠 HomeScreen.tsx         # Dashboard principal
│   │   ├── 💊 MedicamentosScreen.tsx # Gestión medicamentos
│   │   ├── 📝 MedicationFormScreen.tsx # Formulario medicamento
│   │   ├── ⏰ HorariosScreen.tsx     # Configuración horarios
│   │   ├── ⚙️ HorarioFormScreen.tsx  # Formulario horario personalizado
│   │   ├── 📊 HistorialScreen.tsx    # Historial de dosis
│   │   ├── 🔐 LoginScreen.tsx        # Autenticación
│   │   └── 🔧 DebugScreen.tsx        # Herramientas debug
│   └── 📂 assets/             # Recursos estáticos
│       └── 🖼️ images/         # Iconos y imágenes
├── 📂 backend/                # Scripts backend (Node.js)
│   └── 📋 todo.js             # Tareas pendientes
└── 📂 docs/                   # Documentación y SQL
    ├── 📊 diagrama.txt        # Diagrama de arquitectura
    ├── 🗄️ scripts.sql         # Schema principal
    ├── 🔧 fix-doses-policy.sql # Corrección políticas
    └── 💾 storage.sql         # Configuración Storage
```

## 🗄️ Base de Datos

### Configuración Supabase

1. **Crea las tablas y tipos** ejecutando `docs/scripts.sql`
2. **Configura el Storage** con `docs/storage.sql`
3. **Aplica las correcciones** con `docs/fix-doses-policy.sql`

### Schema de la Base de Datos

#### 🏗️ Tipos Enumerados
```sql
create type app_role as enum ('paciente','cuidador');
create type unit as enum ('mg','ml','tableta','cápsula','gotas','puff');
create type dose_status as enum ('scheduled','notified','done','skipped','late');
```

#### 📊 Tablas Principales

| Tabla | Descripción | Campos Clave |
|-------|-------------|--------------|
| **profiles** | Perfiles de usuario con roles | `user_id`, `full_name`, `role` |
| **caregiver_links** | Vínculos paciente-cuidador | `patient_user_id`, `caregiver_user_id` |
| **medications** | Medicamentos del paciente | `name`, `dose`, `unit`, `image_url` |
| **schedules** | Horarios de medicamentos | `fixed_times[]`, `tz`, `tolerance_minutes` |
| **doses** | Registro de dosis tomadas | `planned_at`, `status`, `schedule_id` |

#### 🔐 Políticas de Seguridad (RLS)
- **Pacientes**: CRUD completo sobre sus datos
- **Cuidadores**: Solo lectura de pacientes vinculados
- **Aislamiento**: Cada usuario solo ve sus propios datos

### 📷 Configuración de Storage
```sql
-- Bucket para imágenes de medicamentos
insert into storage.buckets (id, name, public)
values ('meds-images', 'meds-images', true);
```

## 📱 Capturas de Pantalla

### 🏠 Pantalla Principal (Dashboard)
*Resumen de próximas dosis y estado general*
- Vista de medicamentos próximos
- Estado de adherencia al tratamiento
- Acceso rápido a funciones principales

### 💊 Gestión de Medicamentos  
*Lista y formulario de medicamentos*
- Catálogo visual de medicamentos
- Formulario con imagen, dosis y unidades
- Búsqueda y filtrado

### ⏰ Configuración de Horarios
*Pantalla de horarios con opciones rápidas*
- Botones de frecuencia (1x, 2x, 3x, 4x al día)
- Iconos visuales por tiempo del día 🌅🌆🌙
- Horarios personalizados avanzados
- Vista de agenda configurada

### 📊 Historial de Dosis
*Registro completo de adherencia*
- Calendario de dosis tomadas/perdidas
- Estadísticas de adherencia
- Detalles por medicamento

### 🔐 Autenticación
*Login seguro con Supabase*
- Registro con roles (Paciente/Cuidador)
- Recuperación de contraseña
- Perfil de usuario

## 📖 Guía de Uso

### 👤 Para Pacientes

#### 🚀 Primeros Pasos
1. **Regístrate** seleccionando el rol "Paciente"
2. **Agrega tu primer medicamento**:
   - Ve a "Medicamentos" → "+"
   - Ingresa nombre, dosis y toma una foto
   - Guarda el medicamento

3. **Configura horarios**:
   - Ve a "Horarios"
   - Elige frecuencia (1x, 2x, 3x, 4x por día)
   - Selecciona el medicamento
   - Confirma los horarios automáticos

#### ⏰ Horarios Rápidos vs Personalizados

**🚀 Horarios Rápidos** (Recomendado)
- **1x al día**: 8:00 AM 🌅
- **2x al día**: 8:00 AM, 8:00 PM 🌅🌙  
- **3x al día**: 8:00 AM, 4:00 PM, 12:00 AM 🌅🌆🌙
- **4x al día**: 6:00 AM, 12:00 PM, 6:00 PM, 12:00 AM 🌅🌤️🌆🌙

**⚙️ Horarios Personalizados**
- Usa "Configurar Horario Personalizado"
- Selecciona horas específicas manualmente
- Ajusta zona horaria si es necesario

#### 📱 Uso Diario
1. **Recibe notificaciones** en los horarios configurados
2. **Marca dosis como tomada** desde la notificación o la app
3. **Revisa tu historial** en la pestaña "Historial"
4. **Edita medicamentos** si cambian las dosis

### 👥 Para Cuidadores

#### 🔗 Vinculación con Pacientes
1. **Regístrate** como "Cuidador"
2. **Solicita acceso** al paciente (función en desarrollo)
3. **Monitorea adherencia** de tus pacientes vinculados
4. **Recibe alertas** de dosis perdidas

### 🔧 Funciones Avanzadas

#### 📊 Dashboard Inteligente
- **Próximas dosis**: Lista de medicamentos por tomar
- **Estadísticas**: Porcentaje de adherencia semanal/mensual
- **Alertas**: Medicamentos con dosis perdidas

#### 🛠️ Gestión de Datos
- **Backup automático**: Todos los datos se sincronizan en la nube
- **Exportación**: Genera reportes para compartir con médicos
- **Privacidad**: Control total sobre quién ve tus datos

## 🛠️ Scripts Disponibles

### 🏠 Desde la raíz del proyecto:
```bash
npm start          # Inicia la aplicación Expo
npm run android    # Ejecuta en emulador Android
npm run ios        # Ejecuta en simulador iOS  
npm run web        # Ejecuta en navegador web
npm run lint       # Ejecuta linter ESLint
```

### 📱 Desde la carpeta app/:
```bash
expo start                    # Servidor de desarrollo
expo start --clear           # Limpia caché y reinicia
npx expo install             # Instala dependencias compatibles
npx expo prebuild           # Genera código nativo
node scripts/reset-project.js # Resetea proyecto a estado inicial
```

## 🧪 Desarrollo y Testing

### 🔧 Herramientas de Debug
- **Debug Screen**: Pantalla especial para testing (`/debug`)
- **Flipper**: Debugging avanzado React Native
- **Expo Dev Tools**: Recarga rápida y debugging

### 🧩 Componentes Reutilizables
- **LoadingAnimation**: Animación de carga temática con píldoras
- **TimePickerModal**: Selector de tiempo personalizado
- **EmptyState**: Estados vacíos consistentes

### 📐 Sistema de Diseño
- **Colores**: Paleta médica profesional en `constants/Colors.ts`
- **Tipografía**: Sistema tipográfico escalable
- **Espaciados**: Grid system en `constants/Layout.ts`
- **Componentes**: Librería UI consistente

## 🤝 Contribuir

### 📋 Proceso de Contribución
1. **Fork** el repositorio
2. **Crea una rama** para tu feature: `git checkout -b feature/nueva-funcionalidad`
3. **Desarrolla y testea** tu funcionalidad
4. **Commit** siguiendo convenciones: `git commit -m "feat: nueva funcionalidad"`
5. **Push** a tu rama: `git push origin feature/nueva-funcionalidad`
6. **Crea un Pull Request** con descripción detallada

### 🐛 Reportar Bugs
- Usa el template de **Issues** de GitHub
- Incluye **pasos para reproducir** el bug
- Agrega **capturas de pantalla** si es posible
- Especifica **versión de la app** y **dispositivo**

## 📄 Licencia

Este proyecto está licenciado bajo la **Licencia MIT**. Ver el archivo [LICENSE.md](LICENSE.md) para más detalles.

## 👥 Equipo

- **Desarrollador Principal**: [ingraulr](https://github.com/ingraulr)
- **UI/UX**: Sistema de diseño médico profesional
- **Backend**: Arquitectura Supabase serverless

## 🌟 Agradecimientos

- **Expo Team**: Por la excelente plataforma de desarrollo
- **Supabase**: Por el backend-as-a-service robusto  
- **React Native Community**: Por el ecosistema de componentes
- **Comunidad Médica**: Por los insights sobre gestión de medicamentos

---

**¿Necesitas ayuda?** 🆘  
- 📧 **Email**: soporte@recuerdamed.app
- 📱 **Issues**: [GitHub Issues](https://github.com/ingraulr/recuerdaMed/issues)
- 📖 **Docs**: [Documentación completa](https://docs.recuerdamed.app)

**¡Mantente saludable! 💊✨**
