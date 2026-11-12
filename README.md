# Prototipo de interfaz · Sistema Contable UNIVO

Prototipo navegable del diseño (tema oscuro, Nunito, menú flotante). Solo muestra el diseño y el comportamiento de la interfaz: nada se guarda ni se procesa.

## Abrirlo

- **Sin instalar nada:** doble clic en `dist/index.html`.
- **Modo desarrollo:** `pnpm install` y luego `pnpm dev` (abre http://localhost:5173).
- **Regenerar `dist/index.html`:** `pnpm build`.

## Cómo está organizado

- El índice agrupa las pantallas por sprint. Cada tarjeta se abre en escritorio, tableta o celular.
- En el avatar de usuario se cambia el rol con "Ver como": el menú y los botones respetan la matriz de permisos.
- Stack: React 18, TypeScript, Tailwind 3 e íconos lucide. La paleta está en `tailwind.config.js` y los componentes base en `src/ui/`.
- Para agregar una pantalla: créala en `src/pantallas/`, registra su ruta en `src/App.tsx` y ponle `ruta` en `src/datos/navegacion.ts` (en el menú y en `SPRINTS`).
