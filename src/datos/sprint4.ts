/* =====================================================================================
 * Datos del Sprint 4 sobre el caso oficial CheroPhonex (octubre de 2026).
 * Todo lo que no sale del PDF (sellos, códigos, IMEI, fechas límite) es ilustrativo y está marcado así en pantalla.
 * ===================================================================================== */
import {
  BALANCE_OCT, LIBRO_COMPRAS, LIBRO_CONSUMIDOR, LIBRO_CONTRIBUYENTES, PRODUCTOS_CASO, RESULTADO, calcularPlanilla, redondear, suma, type ProductoCaso,
} from "./caso";

/** Cadena hexadecimal determinista (no es un hash real): sirve para códigos, sellos y huellas de muestra. */
export function hex(semilla: number, largo: number): string {
  let s = (semilla * 2654435761) >>> 0, out = "";
  while (out.length < largo) { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; out += s.toString(16).padStart(8, "0"); }
  return out.slice(0, largo).toUpperCase();
}
export const uuid = (n: number) => { const h = hex(n + 77, 32); return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`; };

/* ---------- Documentos tributarios electrónicos (HU-53 a HU-57) ---------- */
export type TipoDte = "01" | "03" | "05" | "06";
export const TIPOS_DTE: Record<TipoDte, string> = { "01": "Factura", "03": "Comprobante de crédito fiscal", "05": "Nota de crédito", "06": "Nota de débito" };
export type EstadoDte = "Generado" | "Firmado" | "Con sello" | "Invalidado";
export type Dte = {
  id: string; tipo: TipoDte; numero: string; codigo: string; fecha: string; receptor: string; nrc: string; concepto: string;
  gravado: number; iva: number; total: number; estado: EstadoDte; sello?: string; referencia?: string; motivoInvalidacion?: string;
};
const control = (tipo: TipoDte, n: number) => `DTE-${tipo}-M001P001-${String(n).padStart(15, "0")}`;
const dte = (n: number, tipo: TipoDte, fecha: string, receptor: string, nrc: string, concepto: string, gravado: number, iva: number, estado: EstadoDte, extra: Partial<Dte> = {}): Dte => ({
  id: `d${n}`, tipo, numero: control(tipo, n), codigo: uuid(n), fecha, receptor, nrc, concepto, gravado, iva, total: redondear(gravado + iva), estado,
  sello: estado === "Con sello" || estado === "Invalidado" ? `2026${hex(n + 500, 36)}` : undefined, ...extra,
});
export const DTES: Dte[] = [
  ...LIBRO_CONTRIBUYENTES.map((v, i) => dte(i + 1, "03", v.fecha, v.cliente, v.nrc, `Venta de equipos · ${v.doc}`, v.gravadas, v.iva,
    v.doc === "CCF-0008" ? "Firmado" : v.doc === "CCF-0005" ? "Invalidado" : "Con sello",
    v.doc === "CCF-0005" ? { motivoInvalidacion: "Error en el monto del documento" } : {})),
  dte(9, "01", "10/10/2026", "Consumidor final", "N/A", `Ventas de caja · ${LIBRO_CONSUMIDOR[0].del}`, 78.1, 10.15, "Con sello"),
  dte(10, "01", "17/10/2026", "Consumidor final", "N/A", `Ventas de caja · ${LIBRO_CONSUMIDOR[1].del}`, 118.5, 15.4, "Con sello"),
  dte(11, "05", "20/10/2026", LIBRO_CONTRIBUYENTES[3].cliente, LIBRO_CONTRIBUYENTES[3].nrc, "Rebaja sobre CCF-0004", 100, 13, "Con sello", { referencia: "CCF-0004" }),
  dte(12, "01", "31/10/2026", "Consumidor final", "N/A", `Ventas de caja · ${LIBRO_CONSUMIDOR[3].del}`, 64.6, 8.4, "Generado"),
];
export const MOTIVOS_INVALIDACION = ["Error en la información del documento", "Rescindir la operación", "Documento duplicado", "Otro"];

/* ---------- Indicadores y gráficas (HU-83) ---------- */
export const SEMANAS = [
  { e: "1 a 7 oct", ccf: 0, cf: 0 },
  { e: "8 a 14 oct", ccf: suma([2740.5, 3152.25]), cf: 3966.3 },
  { e: "15 a 21 oct", ccf: suma([3928.5, 4627.8]), cf: 4999.05 },
  { e: "22 a 28 oct", ccf: suma([2218.05, 2582.55]), cf: 6470.55 },
  { e: "29 a 31 oct", ccf: suma([3325.05, 3048.3]), cf: 4992.3 },
];
export const porCategoria = () => (["Teléfonos", "Accesorios"] as const).map((c) => {
  const l = PRODUCTOS_CASO.filter((p) => p.categoria === c);
  return { t: c, ventas: suma(l.map((p) => p.ventasNetas)), utilidad: suma(l.map((p) => p.utilidad)), unidades: l.reduce((t, p) => t + p.vendidas, 0) };
});
export const topUtilidad = (n = 8) => [...PRODUCTOS_CASO].sort((a, b) => b.utilidad - a.utilidad).slice(0, n);

/* ---------- Razones financieras y proyecciones (HU-84 · HU-85) ---------- */
export type Razon = { id: string; grupo: "Liquidez" | "Endeudamiento" | "Rentabilidad" | "Actividad"; nombre: string; formula: string; valor: number; unidad: "veces" | "%" | "US$" | "días"; lectura: string };
export function razones(): Razon[] {
  const b = BALANCE_OCT, r = RESULTADO;
  const ac = b.activoCorriente, pc = b.pasivo;
  const invProm = redondear((0 + b.inventarios) / 2);
  const rotacion = redondear(r.costo / invProm);
  return [
    { id: "lc", grupo: "Liquidez", nombre: "Liquidez corriente", formula: "Activo corriente ÷ Pasivo corriente", valor: redondear(ac / pc), unidad: "veces", lectura: "Por cada dólar que debe a corto plazo, tiene este monto en activos corrientes." },
    { id: "pa", grupo: "Liquidez", nombre: "Prueba ácida", formula: "(Activo corriente − Inventarios) ÷ Pasivo corriente", valor: redondear((ac - b.inventarios) / pc), unidad: "veces", lectura: "Mide si paga sus deudas sin vender inventario." },
    { id: "ct", grupo: "Liquidez", nombre: "Capital de trabajo", formula: "Activo corriente − Pasivo corriente", valor: redondear(ac - pc), unidad: "US$", lectura: "Recursos que quedan para operar después de pagar lo de corto plazo." },
    { id: "en", grupo: "Endeudamiento", nombre: "Endeudamiento", formula: "Pasivo total ÷ Activo total", valor: redondear((b.pasivo / b.activo) * 100), unidad: "%", lectura: "Parte de los activos financiada con deudas." },
    { id: "ap", grupo: "Endeudamiento", nombre: "Apalancamiento", formula: "Pasivo total ÷ Patrimonio", valor: redondear(b.pasivo / b.patrimonio), unidad: "veces", lectura: "Deuda por cada dólar de patrimonio." },
    { id: "mb", grupo: "Rentabilidad", nombre: "Margen bruto", formula: "Utilidad bruta ÷ Ventas netas", valor: redondear((r.bruta / r.ventas) * 100), unidad: "%", lectura: "Ganancia sobre cada venta antes de gastos de operación." },
    { id: "mn", grupo: "Rentabilidad", nombre: "Margen neto", formula: "Utilidad del ejercicio ÷ Ventas netas", valor: redondear((r.neta / r.ventas) * 100), unidad: "%", lectura: "Ganancia final de cada dólar vendido." },
    { id: "roa", grupo: "Rentabilidad", nombre: "Rendimiento del activo (ROA)", formula: "Utilidad del ejercicio ÷ Activo total", valor: redondear((r.neta / b.activo) * 100), unidad: "%", lectura: "Qué tanto rinden los activos en el período." },
    { id: "roe", grupo: "Rentabilidad", nombre: "Rendimiento del patrimonio (ROE)", formula: "Utilidad del ejercicio ÷ Patrimonio", valor: redondear((r.neta / b.patrimonio) * 100), unidad: "%", lectura: "Qué tanto rinde el capital de los socios." },
    { id: "ri", grupo: "Actividad", nombre: "Rotación de inventario", formula: "Costo de ventas ÷ Inventario promedio", valor: rotacion, unidad: "veces", lectura: "Veces que el inventario se vende y se repone en el mes." },
    { id: "di", grupo: "Actividad", nombre: "Días de inventario", formula: "30 ÷ Rotación de inventario", valor: redondear(30 / rotacion), unidad: "días", lectura: "Días que tarda en venderse el inventario." },
  ];
}
export type PuntoProy = { e: string; v: number; lo?: number; hi?: number; proy?: boolean };
/** Proyección de ventas con crecimiento mensual supuesto y un rango que se abre con cada mes. Octubre es el único mes con historia. */
export function proyectar(meses: number, crecimiento: number, banda: number): PuntoProy[] {
  const nombres = ["Nov 2026", "Dic 2026", "Ene 2027", "Feb 2027", "Mar 2027", "Abr 2027"];
  const base = RESULTADO.ventas;
  const out: PuntoProy[] = [{ e: "Oct 2026", v: base }];
  for (let i = 1; i <= meses; i++) {
    const v = redondear(base * Math.pow(1 + crecimiento / 100, i));
    const a = (banda / 100) * Math.sqrt(i);
    out.push({ e: nombres[i - 1], v, lo: redondear(v * (1 - a)), hi: redondear(v * (1 + a)), proy: true });
  }
  return out;
}

/* ---------- Calendario tributario y anexos (HU-51 · HU-52) ---------- */
export type Vencimiento = { id: string; fecha: string; titulo: string; tipo: "IVA" | "Renta" | "Planilla" | "Prestaciones" | "Interno"; estado: "Presentada" | "Pendiente" | "Próxima"; nota?: string };
/** Las fechas son de ejemplo: los plazos reales se configuran en Parámetros. */
export const VENCIMIENTOS: Vencimiento[] = [
  { id: "v1", fecha: "12/11/2026", titulo: "Planilla ISSS y AFP · octubre", tipo: "Planilla", estado: "Presentada" },
  { id: "v2", fecha: "13/11/2026", titulo: "F-07 IVA · octubre", tipo: "IVA", estado: "Presentada", nota: "IVA por pagar US$ 643.67" },
  { id: "v3", fecha: "13/11/2026", titulo: "F-14 Pago a cuenta · octubre", tipo: "Renta", estado: "Presentada", nota: "Pago a cuenta US$ 805.90" },
  { id: "v4", fecha: "05/12/2026", titulo: "Cierre contable de noviembre", tipo: "Interno", estado: "Próxima" },
  { id: "v5", fecha: "11/12/2026", titulo: "Planilla ISSS y AFP · noviembre", tipo: "Planilla", estado: "Pendiente" },
  { id: "v6", fecha: "14/12/2026", titulo: "F-07 IVA · noviembre", tipo: "IVA", estado: "Pendiente" },
  { id: "v7", fecha: "14/12/2026", titulo: "F-14 Pago a cuenta · noviembre", tipo: "Renta", estado: "Pendiente" },
  { id: "v8", fecha: "20/12/2026", titulo: "Pago del aguinaldo", tipo: "Prestaciones", estado: "Pendiente", nota: "Provisionado: US$ 100.00" },
];
export type Anexo = { id: string; nombre: string; filas: number; total: number; columnas: string[]; muestra: string[][] };
export const ANEXOS: Anexo[] = [
  { id: "a1", nombre: "Anexo de compras", filas: LIBRO_COMPRAS.length, total: suma(LIBRO_COMPRAS.map((c) => c.total)),
    columnas: ["Fecha", "Tipo", "Documento", "NRC", "Gravadas", "IVA", "Total"], muestra: LIBRO_COMPRAS.slice(0, 3).map((c) => [c.fecha, c.tipo, c.doc, c.nrc, c.gravadas.toFixed(2), c.iva.toFixed(2), c.total.toFixed(2)]) },
  { id: "a2", nombre: "Anexo de ventas a contribuyentes", filas: LIBRO_CONTRIBUYENTES.length, total: suma(LIBRO_CONTRIBUYENTES.map((c) => c.total)),
    columnas: ["Fecha", "Tipo", "Documento", "NRC", "Gravadas", "Débito fiscal", "Total"], muestra: LIBRO_CONTRIBUYENTES.slice(0, 3).map((v) => [v.fecha, "CCF", v.doc, v.nrc, v.gravadas.toFixed(2), v.iva.toFixed(2), v.total.toFixed(2)]) },
  { id: "a3", nombre: "Anexo de ventas a consumidor final", filas: LIBRO_CONSUMIDOR.length, total: suma(LIBRO_CONSUMIDOR.map((c) => c.total)),
    columnas: ["Fecha", "Del N.º", "Al N.º", "Caja", "Gravadas", "IVA incluido", "Total"], muestra: LIBRO_CONSUMIDOR.slice(0, 3).map((v) => [v.fecha, v.del, v.al, v.caja, v.gravadas.toFixed(2), v.iva.toFixed(2), v.total.toFixed(2)]) },
];

/* ---------- Notas a los estados financieros (HU-44) ---------- */
export type Nota = { n: number; titulo: string; texto: string; campos: { k: string; v: string }[] };
export const NOTAS: Nota[] = [
  { n: 1, titulo: "Entidad y actividad", texto: "CheroPhonex es una empresa dedicada a la venta de teléfonos celulares y accesorios, con sede en San Miguel, El Salvador. Inició operaciones el 1 de octubre de 2026.", campos: [{ k: "NRC", v: "312456-7" }, { k: "Socios", v: "6" }, { k: "Sucursales", v: "2" }] },
  { n: 2, titulo: "Políticas contables", texto: "Los estados financieros se preparan en dólares de los Estados Unidos de América. El inventario se valúa por el método de costo promedio. El mobiliario se deprecia en línea recta al 50 % anual.", campos: [{ k: "Moneda", v: "US$" }, { k: "Valuación", v: "Costo promedio" }, { k: "Depreciación", v: "50 % anual" }] },
  { n: 3, titulo: "Efectivo y equivalentes", texto: "El efectivo comprende la caja chica y los saldos en cuentas bancarias, sin restricciones de uso.", campos: [{ k: "Caja chica", v: "200.00" }, { k: "Bancos", v: "22,070.89" }, { k: "Total", v: "22,270.89" }] },
  { n: 4, titulo: "Inventarios", texto: "Los inventarios corresponden a teléfonos celulares y accesorios para la venta, valuados al costo. Al cierre del mes quedaron 76 unidades.", campos: [{ k: "Compras del mes", v: "40,000.00" }, { k: "Costo de ventas", v: "34,112.00" }, { k: "Inventario final", v: "5,888.00" }] },
  { n: 5, titulo: "Mobiliario y equipo", texto: "El mobiliario fue aportado por los socios y se deprecia desde el 1 de octubre de 2026.", campos: [{ k: "Costo", v: "2,500.00" }, { k: "Depreciación acumulada", v: "104.17" }, { k: "Valor en libros", v: "2,395.83" }] },
  { n: 6, titulo: "Obligaciones por pagar", texto: "Las obligaciones comprenden las retenciones y cuotas de seguridad social, las provisiones de prestaciones y los impuestos del mes, que se pagan en noviembre.", campos: [{ k: "Retenciones", v: "246.02" }, { k: "Empleados", v: "620.04" }, { k: "Impuestos", v: "1,449.57" }] },
  { n: 7, titulo: "Capital", texto: "El capital está formado por los aportes de seis socios, a partes iguales.", campos: [{ k: "Aporte por socio", v: "3,750.00" }, { k: "Capital total", v: "22,500.00" }] },
];

/* ---------- Partidas recurrentes (HU-26) ---------- */
export type Recurrente = { id: string; nombre: string; frecuencia: "Mensual" | "Trimestral" | "Anual"; dia: number; proxima: string; estado: "Activa" | "Pausada"; lineas: { c: string; n: string; d: number; h: number }[] };
export const RECURRENTES: Recurrente[] = [
  { id: "re1", nombre: "Alquiler del local", frecuencia: "Mensual", dia: 5, proxima: "05/11/2026", estado: "Activa", lineas: [{ c: "4201", n: "Gastos de Administración · alquileres", d: 600, h: 0 }, { c: "1112", n: "Crédito Fiscal IVA", d: 78, h: 0 }, { c: "11010301", n: "Banco Agrícola", d: 0, h: 678 }] },
  { id: "re2", nombre: "Depreciación del mobiliario", frecuencia: "Mensual", dia: 30, proxima: "30/11/2026", estado: "Activa", lineas: [{ c: "4201", n: "Gastos de Administración · depreciación", d: 104.17, h: 0 }, { c: "1202", n: "(R) Depreciaciones", d: 0, h: 104.17 }] },
  { id: "re3", nombre: "Internet y telefonía", frecuencia: "Mensual", dia: 15, proxima: "15/11/2026", estado: "Activa", lineas: [{ c: "4201", n: "Gastos de Administración · comunicaciones", d: 60, h: 0 }, { c: "1112", n: "Crédito Fiscal IVA", d: 7.8, h: 0 }, { c: "11010301", n: "Banco Agrícola", d: 0, h: 67.8 }] },
  { id: "re4", nombre: "Licencia de funcionamiento", frecuencia: "Anual", dia: 15, proxima: "15/10/2027", estado: "Pausada", lineas: [{ c: "4201", n: "Gastos de Administración · licencias", d: 50, h: 0 }, { c: "110101", n: "Caja general", d: 0, h: 50 }] },
];

/* ---------- Inventario: toma física, series, reabastecimiento, sistema analítico (HU-66 a HU-69) ---------- */
export type Conteo = { p: ProductoCaso; sistema: number; contado: number };
/** Conteo del 31/10: casi todo coincide; dos productos tienen faltante. */
export const conteoInicial = (): Conteo[] => PRODUCTOS_CASO.map((p) => ({ p, sistema: p.finales, contado: p.nombre === "Cases / Fundas" ? p.finales - 1 : p.nombre === "Cables" ? p.finales - 1 : p.finales }));
export const minimoDe = (p: ProductoCaso) => Math.ceil(p.vendidas / 4);
export const reabastecer = () => PRODUCTOS_CASO.filter((p) => p.finales < minimoDe(p)).map((p) => ({ p, minimo: minimoDe(p), sugerido: minimoDe(p) * 2 - p.finales }));
export type Serie = { imei: string; producto: string; costo: number; estado: "En inventario" | "Vendido"; doc?: string };
export const SERIES: Serie[] = [
  ...["CCF-0001", "CCF-0005", "CCF-0006", "CCF-0007", "CCF-0008", "CF-S1", "CF-S2", "CF-S3", "CF-S4"].map((d, i) => ({ imei: `35${hex(i + 11, 13).replace(/[A-F]/g, (c) => String(c.charCodeAt(0) % 10))}`, producto: "iPhone 13", costo: 400, estado: "Vendido" as const, doc: d })),
  ...[0, 1].map((i) => ({ imei: `35${hex(i + 40, 13).replace(/[A-F]/g, (c) => String(c.charCodeAt(0) % 10))}`, producto: "iPhone 13", costo: 400, estado: "En inventario" as const })),
];

/* ---------- Planillas de ISSS y AFP (HU-75) ---------- */
export function planillasOficiales() {
  const f = calcularPlanilla();
  return {
    isss: f.map((x) => ({ n: x.n, nombre: x.nombre, base: Math.min(x.salario, 1000), lab: x.isss, pat: x.isssPat, total: redondear(x.isss + x.isssPat) })),
    afp: f.map((x) => ({ n: x.n, nombre: x.nombre, base: x.salario, lab: x.afp, pat: x.afpPat, total: redondear(x.afp + x.afpPat) })),
  };
}

/* ---------- Firma digital (HU-87 · HU-88) · ilustrativo ---------- */
export type Firmado = { codigo: string; documento: string; periodo: string; fecha: string; firmante: string; huella: string; estado: "Válida" | "Revocada" };
export const FIRMADOS: Firmado[] = [
  { codigo: "EQ-7F3A-91C2-0B84", documento: "Balance general", periodo: "Octubre 2026", fecha: "01/11/2026 10:12", firmante: "Carlos Alberto Granados Amaya", huella: hex(901, 64), estado: "Válida" },
  { codigo: "EQ-2D90-4E17-A6F5", documento: "Estado de resultados", periodo: "Octubre 2026", fecha: "01/11/2026 10:15", firmante: "Carlos Alberto Granados Amaya", huella: hex(902, 64), estado: "Válida" },
  { codigo: "EQ-B1C4-33AA-7E02", documento: "Estado de resultados", periodo: "Septiembre 2026", fecha: "02/10/2026 16:40", firmante: "Carlos Alberto Granados Amaya", huella: hex(903, 64), estado: "Revocada" },
];
export const DOCUMENTOS_FIRMABLES = ["Balance general", "Estado de resultados", "Estado de cambios en el patrimonio", "Estado de flujo de efectivo", "Notas a los estados financieros"];
