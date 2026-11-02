# 🚗 Taller de Don Ramiro - Gestión de Reparaciones

Aplicación web mobile-first diseñada para resolver los cuellos de botella operativos en un taller mecánico. 

## 📌 El Problema
Don Ramiro y sus 4 mecánicos enfrentaban dos problemas principales:
1. **Interrupciones constantes:** Los clientes llamaban varias veces al día para preguntar por el estado de su coche, interrumpiendo el trabajo de los mecánicos (quienes suelen tener las manos sucias).
2. **Aprobación de reparaciones adicionales:** Cuando surgía un gasto extra, el trabajo se detenía hasta que el cliente aprobara por teléfono. Esto tardaba días y no había un registro auditable, lo que generaba conflictos si el cliente negaba haber autorizado el gasto.

## 💡 La Solución
Una aplicación que permite a los clientes consultar el estado de su vehículo sin llamar, mediante un enlace público (usando placa o número de orden). Si hay una reparación extra, el cliente puede **aprobar o rechazar** directamente desde su celular, dejando un registro exacto (nombre, fecha y hora) visible para el taller.

## 🛠️ Stack Tecnológico
- **Frontend:** React, TypeScript, Tailwind CSS.
- **Iconos:** Lucide React.
- **Estado/Persistencia:** LocalStorage (simulación de base de datos para el prototipo MVP).
- **Deployment:** Bolt.new / Netlify.

---

## 📐 Spec Driven Development (SDD)

Este proyecto fue construido siguiendo la metodología de SDD, asegurando que el agente de IA tuviera reglas claras, una especificación detallada y una identidad de marca antes de escribir código.

### 1. Contexto Persistente (Contexto para el Agente)
- **Idioma:** Toda la interfaz en español.
- **UX/UI:** Mobile-first. Botones grandes (mínimo 48px), alto contraste y márgenes amplios.
- **Restricciones:** No incluye control de inventario ni pasarelas de pago. No requiere login para los clientes.
- **Modelo de Datos:** Orden, Cotización, Mecánico, Estado.

### 2. Especificación del Feature Principal
**Feature:** Aprobación de Cotización Adicional por el Cliente.
- **Diseño:** El cliente accede a una vista pública. Si hay una cotización pendiente, ve una tarjeta con el monto y botones de "Aprobar" / "Rechazar". Al hacer clic, se registra la acción y se actualiza el estado en el panel del taller.
- **Criterios de Aceptación (QA Validado):**
  - [x] **CA1:** La vista del cliente muestra una alerta clara de "Acción requerida" cuando hay una cotización pendiente.
  - [x] **CA2:** Al aprobar, el sistema registra el nombre del cliente y la fecha/hora exacta.
  - [x] **CA3:** El panel de administración/mecánico refleja inmediatamente el cambio de estado (Aprobado/Rechazado) y muestra el registro de auditoría.
  - [x] **CA4:** Los botones de acción se bloquean u ocultan tras la aprobación para evitar duplicados.

### 3. Skill de Marca
- **Personalidad:** Industrial, confiable y directa.
- **Colores:** Fondo gris claro/oscuro, botones primarios en Naranja (`bg-orange-500`), estados en verde (éxito), amarillo (alerta) y rojo (peligro).
- **Tipografía:** Sans-serif (Inter), priorizando la legibilidad.

---

## 🚀 Demo
Puedes probar la aplicación en vivo aquí: 
*(Reemplaza este texto con la URL que te dio Bolt al hacer Deploy)*

**Pruebas sugeridas:**
1. Entra a la vista pública e ingresa la placa o código: `TR-1043`.
2. Aprueba la cotización adicional.
3. Regresa al panel de administración (botón "Inicio" abajo a la derecha) y verifica que el estado se actualizó y el registro de aprobación quedó guardado.

## 💻 Instalación Local
Si deseas correr el proyecto en tu computadora:
```bash
npm install
npm run dev
