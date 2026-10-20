# SnapDuty · Planificador de Servicio Social con Base de Datos MongoDB

SnapDuty es una plataforma integral para planear y registrar actividades de servicio social con propósito. Su lema es: **Cada hora de servicio, un cambio que cuenta.**

La aplicación cuenta con una **base de datos funcional en MongoDB** diseñada específicamente para dar soporte a cada una de sus funciones clave.

---

## 🏗️ Arquitectura de la Base de Datos

Cada módulo de SnapDuty tiene su modelo y colección correspondiente en MongoDB:

| Función de la Aplicación | Colección / Modelo | Descripción y Propósito |
| :--- | :--- | :--- |
| **Agenda y Calendario** | [`Activity`](file:///models/Activity.js) | CRUD completo de actividades: título, fecha, área/categoría, hora inicio/fin, prioridad, notas y estado (pendiente/completada). |
| **Cronómetro y Medidor Diario** | [`ServiceTimer`](file:///models/ServiceTimer.js) | Registro de jornada diaria (4h/día), cálculo de salida estimada, estado de notificación y registro de horas trabajadas. |
| **Metas de Servicio Social** | [`Goal`](file:///models/Goal.js) | Meta diaria (4h), meta semanal (20h) y meta reglamentaria total para liberación de servicio (480h). |
| **Bitácora y Reflexiones** | [`Reflection`](file:///models/Reflection.js) | Diario de aprendizajes con fecha, área, impacto y horas asociadas. |
| **Preferencias de Usuario** | [`Setting`](file:///models/Setting.js) | Tema visual (claro / oscuro) y configuración rápida persistente. |

---

## 🚀 Comandos y Scripts

| Comando | Acción |
| :--- | :--- |
| `npm start` | Inicia el servidor Express conectado a MongoDB en `http://localhost:3000`. |
| `npm run dev` | Inicia el servidor en modo desarrollo con reinicio automático (`--watch`). |
| `npm run seed` | Puebla la base de datos con datos representativos de servicio social (actividades, jornadas, metas y reflexiones). |
| `npm test` o `npm run test:db` | Ejecuta la suite de pruebas automatizadas que valida cada operación CRUD y consulta de la base de datos. |

---

## 🔌 Endpoints de la API REST (`/api`)

### Estado y Arranque
- `GET /api/status`: Verifica la conexión y devuelve el conteo de documentos en cada colección.
- `GET /api/bootstrap`: Carga atómicamente todos los datos iniciales necesarios para el renderizado del cliente.

### Actividades (`/api/activities`)
- `GET /api/activities`: Consulta actividades con filtros por `date`, rango (`startDate` a `endDate`), `category`, `status` (`done`/`pending`) y `search`.
- `POST /api/activities`: Crea o actualiza una actividad (upsert con validaciones).
- `GET /api/activities/:id`: Obtiene el detalle de una actividad.
- `PUT /api/activities/:id`: Modifica los campos de una actividad.
- `PATCH /api/activities/:id/toggle`: Alterna el estado entre completada y pendiente.
- `DELETE /api/activities/:id`: Elimina la actividad.
- `POST /api/activities/bulk-sync`: Sincronización masiva desde almacenamiento local.

### Cronómetro y Jornadas (`/api/timers`)
- `GET /api/timers`: Devuelve el mapa de jornadas registradas por fecha.
- `POST /api/timers`: Registra el inicio de una jornada con su timestamp.
- `PATCH /api/timers/:date`: Actualiza estado (`notified`, `endAt`, `hoursWorked`, `notes`).
- `DELETE /api/timers/:date`: Reinicia la jornada del día.
- `POST /api/timers/bulk-sync`: Sincroniza jornadas masivamente.

### Metas y Estadísticas
- `GET /api/goals` & `PUT /api/goals`: Consulta y actualiza metas (4h día, 20h semana, 480h total).
- `GET /api/stats`: Agregación en tiempo real de impacto (horas totales, desglose por área, días activos, porcentaje de avance).
- `GET /api/reflections` & `POST /api/reflections`: Gestión de la bitácora de servicio social.
- `GET /api/export` & `POST /api/import`: Respaldo y restauración completa de la base de datos en JSON.

---

## ⚙️ Configuración (`.env`)

```env
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/snapduty
```
