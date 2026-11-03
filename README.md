# 🚗 Taller de Don Ramiro - Gestión de Reparaciones

Aplicación web mobile-first diseñada para resolver los cuellos de botella operativos en un taller mecánico, con backend real en Supabase (PostgreSQL) y despliegue continuo.

## 📌 El Problema
Don Ramiro y sus 4 mecánicos enfrentaban dos problemas principales:
1. **Interrupciones constantes:** Los clientes llamaban varias veces al día para preguntar por el estado de su coche, interrumpiendo el trabajo de los mecánicos (quienes suelen tener las manos sucias).
2. **Aprobación de reparaciones adicionales:** Cuando surgía un gasto extra, el trabajo se detenía hasta que el cliente aprobara por teléfono. Esto tardaba días y no había un registro auditable, lo que generaba conflictos si el cliente negaba haber autorizado el gasto.

## 💡 La Solución
Una aplicación que permite a los clientes consultar el estado de su vehículo sin llamar, mediante un enlace seguro con token único por orden (enviable por WhatsApp). Si hay una reparación extra, el cliente puede **aprobar o rechazar** directamente desde su celular, dejando un registro exacto (nombre, fecha y hora) visible para el taller.

## 🎯 ICP (Ideal Customer Profile)
- **Quién:** Dueños de talleres mecánicos pequeños (2-6 mecánicos) en Latinoamérica, como Don Ramiro.
- **Dolor:** Pierden horas al día atendiendo llamadas de "¿cómo va mi carro?" y discuten con clientes por gastos extras aprobados verbalmente sin evidencia.
- **Comportamiento:** Usan WhatsApp como canal principal con clientes; el dueño y mecánicos trabajan desde el celular en el piso del taller.
- **Por qué esta app:** Cero instalación, mobile-first, en español, botones grandes, y el cliente no necesita crear cuenta.

## 🛠️ Stack Tecnológico
- **Frontend:** React, TypeScript, Tailwind CSS, Vite.
- **Iconos:** Lucide React.
- **Backend:** Supabase (PostgreSQL) con Row Level Security, funciones RPC y autenticación por email.
- **Despliegue:** Vercel (plan Hobby), conectado a GitHub con deploy automático en cada push a `main`.

---

## 📐 Spec Driven Development (SDD)

### 1. Contexto Persistente (Contexto para el Agente)
- **Idioma:** Toda la interfaz en español.
- **UX/UI:** Mobile-first. Botones grandes (mínimo 48px), alto contraste y márgenes amplios.
- **Restricciones:** No incluye control de inventario ni pasarelas de pago. No requiere login para los clientes.
- **Modelo de Datos:** Taller, Usuario (dueño/mecánico), Cliente, Orden, Cotización, Aprobación, Evento de historial.

### 2. Especificación del Feature Principal
**Feature:** Aprobación de Cotización Adicional por el Cliente.
- **Diseño:** El cliente accede a una vista pública mediante un enlace con token único (no adivinable) por orden. Si hay una cotización pendiente, ve una tarjeta con el monto y botones de "Aprobar" / "Rechazar". Al decidir, se registra la acción y el panel del taller se actualiza.
- **Criterios de Aceptación (QA Validado):**
  - [x] **CA1:** La vista del cliente muestra una alerta clara de "Acción requerida" cuando hay una cotización pendiente.
  - [x] **CA2:** Al aprobar, el sistema registra el nombre del cliente y la fecha/hora exacta.
  - [x] **CA3:** El panel del taller refleja el cambio de estado (Aprobado/Rechazado) y muestra el registro de auditoría.
  - [x] **CA4:** Los botones de acción se bloquean tras la decisión para evitar duplicados.

### 3. Skill de Marca
- **Personalidad:** Industrial, confiable y directa.
- **Colores:** Fondo gris claro/oscuro, botones primarios en Naranja (`bg-orange-500`), estados en verde (éxito), amarillo (alerta) y rojo (peligro).
- **Tipografía:** Sans-serif (Inter), priorizando la legibilidad.

---

## 🗄️ Arquitectura del Backend (Supabase)

### Tablas (7)
`workshops`, `workshop_users`, `clients`, `mechanics`, `orders`, `quotes`, `approvals`, `order_events`.

### Seguridad
- **Row Level Security activado en todas las tablas.** Los usuarios autenticados del taller solo ven datos de su propio taller (función `is_workshop_member()`); nunca de otros talleres.
- **Acceso del cliente sin cuenta:** dos funciones RPC de seguridad definida:
  - `get_order_by_code_token(code, token)`: devuelve la orden, cotizaciones, aprobaciones e historial solo si el código de orden **y** su token secreto coinciden. El token es un UUID aleatorio por orden: no se puede enumerar la placa ni el código para ver datos ajenos.
  - `submit_approval_decision(...)`: registra la decisión del cliente validando el mismo par código+token; rechaza decisiones duplicadas.
- **El frontend solo usa la publishable key** (pública por diseño). Ninguna clave de servicio (`service_role`) ni contraseña de base de datos llega al navegador: toda la autorización la impone la base de datos con RLS.
- El archivo `.env` del repositorio contiene únicamente la URL pública del proyecto y la publishable key (equivalente a lo que cualquier navegador recibe al cargar la app).

### Autenticación del taller
- El panel del taller requiere login con email/contraseña (Supabase Auth). La vista del cliente es pública con token.

---

## 🚀 Demo
Aplicación en vivo: **https://taller-don-ramiro-three.vercel.app**

**Pruebas sugeridas (requieren las credenciales y enlaces de demo entregados con el proyecto):**
1. **Panel del taller:** inicia sesión con el usuario de demostración, cambia el estado de la orden TR-1042 y crea una cotización adicional.
2. **Vista del cliente:** abre el enlace de seguimiento de TR-1042 (incluye su token). Verás el estado actualizado en tiempo real.
3. **Aprobación:** desde la vista del cliente, aprueba o rechaza la cotización pendiente; verifica en el panel del taller que el registro quedó guardado con nombre y fecha/hora.
4. **Privacidad:** intenta abrir el mismo enlace con el token alterado: no se muestra ningún dato.

## 💻 Instalación Local
```bash
npm install
# crea un archivo .env con:
#   VITE_SUPABASE_URL=https://<tu-proyecto>.supabase.co
#   VITE_SUPABASE_PUBLISHABLE_KEY=<tu-publishable-key>
npm run dev
```

## ✅ Pruebas realizadas
- Suite de pruebas de backend contra la base real: acceso anónimo bloqueado a tablas (RLS), RPC de consulta con token válido/inválido, flujo completo de decisión de aprobación (aprobar, verificar persistencia, revertir), y operaciones CRUD del taller autenticado. (El proyecto opera con un único taller; ver 'Límites conocidos'.)
- Pruebas visuales sobre la URL pública: actualización de una orden desde el panel del taller visible al recargar la vista del cliente, aprobación de cotización con persistencia verificada en la base de datos, y pruebas negativas (token alterado y contraseña incorrecta rechazados). Las pruebas de cliente se ejecutaron en contexto anónimo (sin sesión iniciada) y la persistencia se verificó de forma independiente contra la base.

---

## 🔧 Mantenimiento: corrección del bloqueo al recargar (nov 2026)

### Causa
El efecto de verificación de sesión del panel (`WorkshopGate` en `src/App.tsx`) dependía del objeto `store` completo. Como `useStore()` devuelve un objeto nuevo en cada render, cada carga de datos volvía a ejecutar el efecto y su limpieza cancelaba la autorización antes de completarla. Al recargar con sesión guardada esto producía un bucle infinito de verificación (cientos de consultas repetidas por minuto) y la pantalla quedaba en "Verificando acceso..." indefinidamente. El primer inicio de sesión no lo mostraba porque esa ruta autoriza de forma directa.

### Corrección
El efecto ahora depende de `store.loadWorkshopData` (referencia estable). Además, si la verificación supera 20 segundos se muestra un aviso con opción de reintentar en lugar del spinner infinito.

### Cómo se verificó
- Recarga con sesión guardada: 3/3 entra al panel en ~1,5 s (antes: 3/3 bloqueado).
- Conteo de peticiones: 7 consultas al cargar y 0 adicionales en 15 s (antes: repetición infinita).
- Login nuevo ~4 s; contraseña incorrecta rechazada en ~1 s con mensaje claro; vista del cliente con enlace real ~2 s.
- Políticas RLS leídas en vivo desde `pg_policies` y funciones revisadas (`security definer`).

### Límites conocidos
- **Sin separación de roles:** hay un solo nivel de acceso al taller. Cualquier cuenta en `workshop_users` puede abrir tanto el panel de mecánico como el de administración (la diferencia es solo el botón de entrada); la base de datos aplica `is_workshop_member()` sin distinguir roles.
- **Un solo taller:** `is_workshop_member()` no acota por taller; el diseño asume un único taller por proyecto.
- **Recuperación de contraseña:** con el servicio de correo por defecto de Supabase, los correos solo se entregan a miembros del equipo del proyecto y con un límite bajo (del orden de 2 por hora, variable). Para uso real conviene configurar un SMTP propio.
- **Sin auto-refresco del panel:** el panel se actualiza al actuar (cambiar estado, crear orden o cotización) o al recargar; no se actualiza solo cuando el cliente responde una cotización.
- **Registro a nivel API abierto:** `disable_signup=false`. Una cuenta creada sin fila en `workshop_users` no ve datos (RLS), pero conviene decidir si se cierra el registro o se agrega un flujo de invitación.

