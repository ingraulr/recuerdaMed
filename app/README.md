# RecuerdaMed 🩺💊

![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?logo=typescript&logoColor=white)
![React Native](https://img.shields.io/badge/React%20Native-0.7x-61dafb?logo=react&logoColor=black)
![Supabase](https://img.shields.io/badge/Supabase-Postgres-3fcf8e?logo=supabase&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-black)
![CI](https://img.shields.io/badge/CI-GitHub%20Actions-2088ff?logo=githubactions&logoColor=white)

> **RecuerdaMed** es una app móvil para **gestionar medicamentos, horarios y tomas** (doses). Soporta múltiples horarios, zona horaria por usuario y estados de toma con Supabase (Postgres + RLS).

---

## 🧭 Índice

- [✨ Funcionalidades](#-funcionalidades)
- [🧱 Stack](#-stack)
- [🏗️ Arquitectura](#️-arquitectura)
- [🚀 Inicio Rápido](#-inicio-rápido)
- [⚙️ Variables de Entorno](#️-variables-de-entorno)
- [🗄️ Esquema & RPC](#️-esquema--rpc)
- [🧪 Pruebas](#-pruebas)
- [🧹 Calidad de Código](#-calidad-de-código)
- [🛠️ Scripts](#️-scripts)
- [📦 Estructura del Repo](#-estructura-del-repo)
- [🗺️ Roadmap](#️-roadmap)
- [🤝 Contribuir](#-contribuir)
- [📄 Licencia](#-licencia)

---

## ✨ Funcionalidades

- 👤 Autenticación con Supabase.
- 💊 CRUD de **Medicamentos**.
- ⏰ **Horarios** con `fixed_times` (time[]) y TZ por usuario.
- ✅ Registro de **tomas** (doses) con estados (p. ej. *completed*).
- 🧮 **Dashboard** del día: tomados, pendientes y total.
- 🔔 (Próximo) Notificaciones locales por horario.
- 👪 (Opcional) **Cuidadores** con acceso delegado (políticas RLS).

---

## 🧱 Stack

- **App**: React Native + TypeScript.
- **Backend**: Supabase (Postgres, Row Level Security, RPC).
- **Estado/Networking**: Supabase JS Client; (opcional) Zustand/React Query.
- **Pruebas**: Jest/RTL (unit), Playwright (E2E web si aplica), Appium (E2E móvil opcional).
- **CI/CD**: GitHub Actions.

---

## 🏗️ Arquitectura

```mermaid
flowchart LR
  A[App RN (Home, Medicamentos, Horarios, Historial)] -- Supabase JS --> B((Supabase))
  subgraph B[Supabase / Postgres]
    M[medications]
    S[schedules]
    D[doses]
    R[(RLS Policies)]
    F[RPC: home_dashboard]
  end
  C[(Auth)] --> B
  A <-- Realtime/Queries --> M & S & D
  A --> F

  sequenceDiagram
  participant U as Usuario
  participant App as App RN
  participant DB as Supabase (doses)
  U->>App: Tap "Marcar como tomado"
  App->>DB: UPDATE doses SET status='completed' WHERE id=next
  DB-->>App: 200 OK
  App->>App: UI optimista (taken++, pending--)
  App->>DB: RPC home_dashboard()
  DB-->>App: next/taken/pending/total

  