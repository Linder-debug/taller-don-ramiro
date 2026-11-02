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
- Suite de pruebas de backend contra la base real: acceso anónimo bloqueado a tablas (RLS), RPC de consulta con token válido/inválido, flujo completo de decisión de aprobación (aprobar, verificar persistencia, revertir), y operaciones CRUD del taller autenticado con aislamiento entre talleres.
- Pruebas visuales sobre la URL pública: actualización de una orden desde el panel del taller visible al recargar la vista del cliente, aprobación de cotización con persistencia verificada en la base de datos, y pruebas negativas (token alterado y contraseña incorrecta rechazados). Las pruebas de cliente se ejecutaron en contexto anónimo (sin sesión iniciada) y la persistencia se verificó de forma independiente contra la base.
