# 📋 Changelog – Kamana Roster App

All notable changes to this project will be documented here.

This project adheres to [Semantic Versioning](https://semver.org/).

---

## [v1.0.0] – 2025-05-26

### 🚀 Added
- Modal de confirmación manual para guardar cambios de turnos.
- Script `start-roster.bat` para ejecutar backend y frontend automáticamente.
- Archivo `CHANGELOG.md` y `README.md` con documentación inicial.

### 🛠 Fixed
- Guardado de turnos no persistía por error en `Modal.confirm`.
- Conflicto con submódulo accidental en carpeta `client/`.

### 🧹 Changed
- Migración del backend desde `bin/www` a `index.js` como punto de entrada único.
- Limpieza del repositorio y estructura más clara para ambientes multi-dispositivo.

---


## [v1.1.0] – 2025-05-27

### 🚀 Added
- Vista `ShiftConfigPage` dividida en dos grupos: ⏱ Timed Shifts y 🚫 OFF Reasons.
- Input para agregar nuevos motivos de días OFF (ej. SICK, PUBLIC HOLIDAY).
- Íconos de basurero con tooltips para eliminar horarios y razones OFF.
- Navegación lateral (SidebarLayout) con diseño inspirado en Kamana HSK App.
- Rutas frontend con React Router: `/roster` y `/shifts`.
- Archivo `SidebarLayout.js` como contenedor base para navegación y layout.
- Estilos visuales mejorados para estructura y legibilidad.

### 🛠 Fixed
- Problemas de guardado en `ShiftConfigPage` por error en rutas PUT.
- Error de compilación al importar componentes desde carpeta `pages/` inexistente.

### 🧹 Changed
- Refactor visual y funcional de `ShiftConfigPage.js` y `RosterPage.js` para mayor claridad.
- Estructura de carpetas reorganizada con `src/components/` y `src/layout/`.
- `rosters.js` en backend ahora valida y guarda correctamente el roster semanal completo.

---
## [v1.2.0-beta] - 2025-06-30
### Added
- **defaultRoster.json** con plantilla semanal cargada al iniciar.
- Endpoint **GET /api/rosters/default** para servir la plantilla.
- Carga y normalización automática del roster por defecto en `RosterPage`.
- Sistema de celdas compactas con `Tag` a ancho completo y colores persistentes.
- Primer layout responsive (sidebar como Drawer en < 768 px).

### Changed
- Centralización de colores de turnos (`client/src/constants/colors.js`).
- Fila & padding más finos (`.compact-rows`).

### Fixed
- Pérdida de datos al refrescar: ahora se precarga la plantilla por defecto.
