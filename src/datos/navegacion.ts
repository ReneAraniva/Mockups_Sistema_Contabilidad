import {
  Archive, BookOpen, Building2, Calculator, CalendarDays, ChartColumn, ClipboardCheck,
  FileText, History, House, Inbox, Landmark, LayoutGrid, ListTree, LockKeyhole, MapPin, Package, Receipt,
  Repeat, Scale, ShieldCheck, ShoppingCart, SlidersHorizontal, Upload, Users, Wallet, type LucideIcon,
} from "lucide-react";

export type Rol = "admin" | "contador" | "auxiliar" | "consulta";
export const TODOS: Rol[] = ["admin", "contador", "auxiliar", "consulta"];
export const ROLES: Record<Rol, string> = {
  admin: "Administrador",
  contador: "Contador",
  auxiliar: "Auxiliar contable",
  consulta: "Solo consulta",
};

export type Opcion = {
  n: string;
  ruta?: string; // sin ruta = pantalla aún en diseño
  ico: LucideIcon;
  s: 1 | 2 | 3 | 4;
  roles?: Rol[];
  badge?: number;
};

/** Menú principal agrupado por módulo; respeta la matriz de permisos del levantamiento. */
export const MENU: { t: string; items: Opcion[] }[] = [
  { t: "General", items: [{ n: "Tablero", ruta: "/tablero", ico: House, s: 1 }] },
  {
    t: "Contabilidad",
    items: [
      { n: "Catálogo de cuentas", ruta: "/catalogo", ico: ListTree, s: 1 },
      { n: "Partidas", ruta: "/partidas", ico: FileText, s: 1 },
      { n: "Pendientes", ruta: "/pendientes", ico: Inbox, s: 1, badge: 3, roles: ["admin", "contador", "auxiliar"] },
      { n: "Ejercicios y períodos", ruta: "/periodos", ico: CalendarDays, s: 1 },
      { n: "Importar desde Excel", ruta: "/importar", ico: Upload, s: 1, roles: ["admin", "contador"] },
      { n: "Cierre del ejercicio", ruta: "/cierre", ico: LockKeyhole, s: 2, roles: ["admin", "contador"] },
      { n: "Partidas recurrentes", ico: Repeat, s: 4, roles: ["admin", "contador"] },
    ],
  },
  {
    t: "Libros y reportes",
    items: [
      { n: "Libro diario", ruta: "/libro-diario", ico: BookOpen, s: 2 },
      { n: "Libro mayor", ruta: "/libro-mayor", ico: BookOpen, s: 2 },
      { n: "Balanzas de comprobación", ruta: "/balanzas", ico: Scale, s: 2 },
      { n: "Hoja de trabajo", ruta: "/hoja-trabajo", ico: LayoutGrid, s: 2 },
      { n: "Estados financieros", ico: Receipt, s: 2 },
      { n: "Razones y proyecciones", ico: ChartColumn, s: 4 },
    ],
  },
  {
    t: "Tributario",
    items: [
      { n: "Libros de IVA", ico: BookOpen, s: 3 },
      { n: "Declaraciones F-07 y F-14", ico: Calculator, s: 3, roles: ["admin", "contador", "consulta"] },
      { n: "Calendario tributario", ico: CalendarDays, s: 4 },
    ],
  },
  { t: "Facturación", items: [{ n: "Documentos DTE", ico: Receipt, s: 4, roles: ["admin", "contador", "auxiliar"] }] },
  {
    t: "Comercial",
    items: [
      { n: "Clientes y proveedores", ico: Users, s: 2 },
      { n: "Compras", ico: ShoppingCart, s: 3 },
      { n: "Ventas", ico: Receipt, s: 3 },
      { n: "Cobros y pagos", ico: Wallet, s: 3 },
    ],
  },
  {
    t: "Inventario",
    items: [
      { n: "Productos", ico: Package, s: 2 },
      { n: "Kardex", ico: LayoutGrid, s: 3 },
      { n: "Toma física", ico: ClipboardCheck, s: 4, roles: ["admin", "contador", "auxiliar"] },
    ],
  },
  {
    t: "Planilla",
    items: [
      { n: "Empleados", ico: Users, s: 2, roles: ["admin", "contador"] },
      { n: "Planilla y boletas", ico: Receipt, s: 3, roles: ["admin", "contador"] },
      { n: "Prestaciones", ico: CalendarDays, s: 3, roles: ["admin", "contador"] },
    ],
  },
  {
    t: "Tesorería",
    items: [
      { n: "Caja y bancos", ico: Landmark, s: 2 },
      { n: "Conciliación bancaria", ico: ClipboardCheck, s: 3, roles: ["admin", "contador"] },
    ],
  },
  {
    t: "Activo fijo",
    items: [
      { n: "Activos fijos", ico: Building2, s: 2 },
      { n: "Depreciación", ico: ChartColumn, s: 3, roles: ["admin", "contador"] },
    ],
  },
  {
    t: "Administración",
    items: [
      { n: "Empresa", ruta: "/empresa", ico: Building2, s: 1 },
      { n: "Sucursales", ruta: "/sucursales", ico: MapPin, s: 1 },
      { n: "Usuarios y roles", ruta: "/usuarios", ico: ShieldCheck, s: 1, roles: ["admin"] },
      { n: "Bitácora", ruta: "/bitacora", ico: History, s: 1, roles: ["admin", "contador", "consulta"] },
      { n: "Parámetros", ico: SlidersHorizontal, s: 2, roles: ["admin"] },
      { n: "Respaldos", ico: Archive, s: 3, roles: ["admin", "contador"] },
    ],
  },
];

/** Pantallas del prototipo agrupadas por sprint (para el índice). */
export type Pantalla = { n: string; ruta?: string; hu: string; desc: string };
export const SPRINTS: { s: number; meta: string; fechas: string; pantallas: Pantalla[] }[] = [
  {
    s: 1,
    meta: "Sistema publicado con acceso, empresas, usuarios y permisos, catálogo y partidas de punta a punta.",
    fechas: "10 al 16 de noviembre de 2026",
    pantallas: [
      { n: "Inicio de sesión", ruta: "/login", hu: "HU-05", desc: "Correo y contraseña, errores y enlace de recuperación." },
      { n: "Recuperar contraseña", ruta: "/recuperar", hu: "HU-05", desc: "Solicitud por correo y nueva contraseña." },
      { n: "Tablero", ruta: "/tablero", hu: "HU-04 · HU-09", desc: "Resumen del período, pendientes y accesos rápidos." },
      { n: "Empresa", ruta: "/empresa", hu: "HU-06", desc: "Datos fiscales, logotipo y registro de una empresa nueva." },
      { n: "Sucursales", ruta: "/sucursales", hu: "HU-07", desc: "Códigos de Hacienda, casa matriz e inactivación." },
      { n: "Usuarios y roles", ruta: "/usuarios", hu: "HU-08 · HU-10", desc: "Invitaciones, roles por empresa y matriz de permisos." },
      { n: "Bitácora", ruta: "/bitacora", hu: "HU-11", desc: "Filtros, valores anteriores y nuevos, exportación." },
      { n: "Catálogo de cuentas", ruta: "/catalogo", hu: "HU-15 · HU-16 · HU-18", desc: "Árbol con búsqueda, niveles y edición de cuentas." },
      { n: "Importar desde Excel", ruta: "/importar", hu: "HU-17", desc: "Plantillas, validación por fila y carga todo o nada." },
      { n: "Ejercicios y períodos", ruta: "/periodos", hu: "HU-19", desc: "Ejercicios con sus doce períodos y su estado." },
      { n: "Partidas", ruta: "/partidas", hu: "HU-20 · HU-22", desc: "Listado con filtros por estado, tipo y fecha." },
      { n: "Nueva partida", ruta: "/partidas/nueva", hu: "HU-20 · HU-21", desc: "Totales en vivo, diferencia y guardado como borrador." },
      { n: "Bandeja de pendientes", ruta: "/pendientes", hu: "HU-21 · HU-22", desc: "Borradores y contabilización por lote." },
    ],
  },
  {
    s: 2,
    meta: "Edición y anulación de partidas, libros, balanzas, estados básicos y cierre.",
    fechas: "17 al 23 de noviembre de 2026",
    pantallas: [
      { n: "Detalle de partida", ruta: "/partidas/p5", hu: "HU-23 · HU-24", desc: "Versiones, anulación por reversión con motivo." },
      { n: "Parámetros de la empresa", hu: "HU-12", desc: "Numeración, formato de estados y valuación." },
      { n: "Libro diario", ruta: "/libro-diario", hu: "HU-25", desc: "Formato de clase con folio, Vienen y Pasan." },
      { n: "Libro mayor", ruta: "/libro-mayor", hu: "HU-27 · HU-28 · HU-29", desc: "Columnar y esquemas T, saldo contrario." },
      { n: "Balanzas de comprobación", ruta: "/balanzas", hu: "HU-30", desc: "Antes de ajustes, ajustada y posterior al cierre." },
      { n: "Hoja de trabajo", ruta: "/hoja-trabajo", hu: "HU-31", desc: "Diez columnas con utilidad cuadrada." },
      { n: "Cierre de período y del ejercicio", ruta: "/cierre", hu: "HU-32 a HU-36", desc: "Asistente: ISR, cierre y reapertura." },
      { n: "Estado de resultados y balance", hu: "HU-37 · HU-38 · HU-39", desc: "Por sucursal o consolidado, con firmas." },
      { n: "Clientes y proveedores", hu: "HU-58", desc: "NIT, NRC y clasificación." },
      { n: "Productos", hu: "HU-64", desc: "Categoría, mínimo y método de valuación." },
      { n: "Empleados y tasas", hu: "HU-70 · HU-71", desc: "Datos de ISSS, AFP y tabla de renta." },
      { n: "Caja, bancos y activos", hu: "HU-76 · HU-81", desc: "Cuentas de efectivo y registro de activos." },
    ],
  },
  {
    s: 3,
    meta: "IVA, compras y ventas, inventario, planilla, bancos y estados restantes.",
    fechas: "Por planificar",
    pantallas: [
      { n: "Libros de IVA", hu: "HU-45 · HU-46 · HU-47", desc: "Compras, contribuyentes y consumidor final." },
      { n: "Liquidación F-07 y F-14", hu: "HU-48 · HU-49 · HU-50", desc: "Remanente, pago a cuenta y retenciones." },
      { n: "Compras y ventas", hu: "HU-59 · HU-60 · HU-61", desc: "Registro en un paso con su partida." },
      { n: "Cobros, pagos y antigüedad", hu: "HU-62 · HU-63", desc: "Abonos y rangos de vencimiento." },
      { n: "Kardex", hu: "HU-65", desc: "Costo promedio y PEPS." },
      { n: "Planilla, boletas y prestaciones", hu: "HU-72 · HU-73 · HU-74", desc: "Cálculo y provisiones." },
      { n: "Caja chica, bancos y conciliación", hu: "HU-77 · HU-78 · HU-79", desc: "Movimientos y partidas en tránsito." },
      { n: "Depreciación", hu: "HU-82", desc: "Cuadro por activo y partida mensual." },
      { n: "Patrimonio, flujo y comparativos", hu: "HU-40 a HU-43", desc: "Formato de clase o NIIF." },
      { n: "Respaldos", hu: "HU-13", desc: "Respaldo y restauración por empresa." },
    ],
  },
  {
    s: 4,
    meta: "Facturación electrónica, análisis, firma digital y funciones complementarias.",
    fechas: "Por planificar",
    pantallas: [
      { n: "Documentos DTE", hu: "HU-53 a HU-57", desc: "Emisión, sello, QR e invalidación." },
      { n: "Tablero con gráficas", hu: "HU-83", desc: "Indicadores por mes y sucursal." },
      { n: "Razones y proyecciones", hu: "HU-84 · HU-85", desc: "Liquidez, rentabilidad y rangos de confianza." },
      { n: "Firma y verificación", hu: "HU-87 · HU-88", desc: "Firma PAdES y portal público por QR." },
      { n: "Perfil e idioma", hu: "HU-14 · HU-89", desc: "Español o inglés y modo didáctico." },
      { n: "Calendario y anexos", hu: "HU-51 · HU-52", desc: "Vencimientos y CSV del F-07." },
      { n: "Notas, recurrentes y más", hu: "HU-26 · HU-44 · HU-66 a HU-69 · HU-75 · HU-80", desc: "Funciones complementarias." },
    ],
  },
];
