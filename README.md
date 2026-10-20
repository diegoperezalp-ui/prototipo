# SnapDuty · Planificador de Servicio Social con Base de Datos MongoDB y Autenticación

SnapDuty es una plataforma integral para planear y registrar actividades de servicio social con propósito. Su lema es: **Cada hora de servicio, un cambio que cuenta.**

Cuenta con un sistema de **autenticación y sesiones independientes en MongoDB** con cifrado `bcrypt` y tokens `JWT`, garantizando que cada estudiante tenga su propia agenda, cronómetro, reflexiones y estadísticas completamente aisladas y seguras.

---

## 🔐 Autenticación y Cuentas de Prueba

La aplicación incluye una interfaz visual moderna con glassmorphism para **Iniciar Sesión** y **Crear Cuenta**.

### Credenciales de prueba listas para usar:
| Usuario | Correo Electrónico | Contraseña | Perfil y Enfoque |
| :--- | :--- | :--- | :--- |
| **Carlos Mendoza** | `carlos.demo@snapduty.com` | `Password123!` | Universidad Nacional Autónoma · Asistencia Comunitaria y Talleres |
| **Sofía García** | `sofia.garcia@snapduty.com` | `Password123!` | Instituto Politécnico · Alfabetización Digital y Biblioteca |

*(También puedes hacer clic directamente en los botones de acceso rápido **Carlos M.** o **Sofía G.** dentro de la pantalla de inicio de sesión).*

---

## 🏗️ Arquitectura de la Base de Datos Multi-Usuario

Cada registro en MongoDB está estrictamente vinculado al `userId` del estudiante autenticado:

| Función de la Aplicación | Colección / Modelo | Aislamiento por Sesión en MongoDB |
| :--- | :--- | :--- |
| **Usuarios y Perfil** | [`User`](file:///models/User.js) | Nombre, correo único, contraseña encriptada con bcrypt, institución, metas personales. |
| **Agenda y Calendario** | [`Activity`](file:///models/Activity.js) | CRUD de actividades asociadas al usuario con índice compuesto `{ userId: 1, id: 1 }`. |
| **Cronómetro y Medidor Diario** | [`ServiceTimer`](file:///models/ServiceTimer.js) | Jornada diaria (4h/día), salida estimada y horas acumuladas con índice `{ userId: 1, date: 1 }`. |
| **Bitácora y Reflexiones** | [`Reflection`](file:///models/Reflection.js) | Diario de aprendizajes y horas registradas por el usuario. |
| **Preferencias de Usuario** | [`Setting`](file:///models/Setting.js) | Tema visual (claro / oscuro) y reflexiones rápidas con índice `{ userId: 1, key: 1 }`. |

---

## 🚀 Comandos y Scripts

| Comando | Acción |
| :--- | :--- |
| `npm start` | Inicia el servidor Express conectado a MongoDB en `http://localhost:3000`. |
| `npm run dev` | Inicia el servidor en modo desarrollo con reinicio automático (`--watch`). |
| `npm run seed` | Puebla la base de datos con los usuarios demo y sus actividades independientes. |
| `npm test` o `npm run test:db` | Ejecuta la suite de pruebas automatizadas que valida autenticación, encriptación y aislamiento de datos (9/9 pasadas). |

---

## 🔌 Endpoints de la API REST

### Autenticación (`/api/auth`)
- `POST /api/auth/register`: Registro de nuevo estudiante (crea usuario y configura bienvenida).
- `POST /api/auth/login`: Autentica credenciales con bcrypt y genera token JWT.
- `GET /api/auth/me`: Devuelve los datos del usuario de la sesión actual.
- `POST /api/auth/demo`: Acceso instantáneo a la cuenta de prueba.
- `PUT /api/auth/profile`: Actualiza metas y datos institucionales del perfil.

### Datos del Usuario Autenticado (`/api`) *(Requieren `Authorization: Bearer <token>`)*
- `GET /api/bootstrap`: Carga integral de las actividades, cronómetros y preferencias exclusivas del usuario.
- `GET /api/activities`: Consulta actividades con filtros (`date`, `category`, `status`, `search`).
- `POST /api/activities`: Crea o edita actividades del usuario.
- `PATCH /api/activities/:id/toggle`: Alterna estado completada/pendiente.
- `DELETE /api/activities/:id`: Elimina la actividad.
- `GET /api/timers` & `POST /api/timers`: Gestión de jornadas y horas del cronómetro diario.
- `GET /api/stats`: Métricas de impacto del estudiante en tiempo real (horas totales, avance de meta 480h).
- `GET /api/reflections` & `POST /api/reflections`: Bitácora personal del estudiante.

---

## ⚙️ Variables de Entorno (`.env`)

```env
PORT=3000
MONGODB_URI=<tu-cadena-de-conexion-de-MongoDB>
JWT_SECRET=<una-clave-aleatoria-larga-y-privada>
```

No publiques el archivo `.env` ni guardes secretos en el repositorio. En producción, configura `MONGODB_URI` y `JWT_SECRET` en los ajustes del proyecto de Vercel.

## ☁️ Publicación en Vercel

El repositorio está preparado para ejecutar Express como aplicación en Vercel. El proyecto de Vercel debe apuntar a la rama `main` de GitHub; cada push a esa rama inicia un nuevo despliegue.

Antes de publicar:

1. Configura una base de datos MongoDB Atlas y usa su cadena de conexión en `MONGODB_URI`.
2. Genera un `JWT_SECRET` aleatorio y privado (por ejemplo, con `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`).
3. Añade ambas variables en **Vercel → Project → Settings → Environment Variables** para **Production** (y **Preview** si también vas a probar previews).
4. En Atlas, configura el acceso de red para que las funciones de Vercel puedan conectarse y limita el usuario de base de datos a los permisos que necesita la aplicación.

No uses una URI local (`127.0.0.1` o `localhost`) en Vercel: la base de datos debe ser accesible desde internet.
