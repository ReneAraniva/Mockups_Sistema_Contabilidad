/** Datos de ejemplo del prototipo (Comercial Oriente, noviembre 2026). */

export type Cuenta = { c: string; n: string; nat: "D" | "A"; activa?: boolean; saldo?: number; h?: Cuenta[] };

const k = (c: string, n: string, nat: "D" | "A", h?: Cuenta[], saldo?: number, activa = true): Cuenta => ({ c, n, nat, h, saldo, activa });

export const CATALOGO: Cuenta[] = [
  k("1", "Activo", "D", [
    k("11", "Activo corriente", "D", [
      k("1101", "Efectivo y equivalentes", "D", [
        k("110101", "Caja general", "D", undefined, 2450.0),
        k("110102", "Caja chica", "D", undefined, 150.0),
        k("110103", "Bancos", "D", [
          k("11010301", "Banco Agrícola · cuenta corriente", "D", undefined, 18320.55),
          k("11010302", "Banco Cuscatlán · cuenta de ahorro", "D", undefined, 5210.0),
        ]),
      ]),
      k("1103", "Cuentas por cobrar", "D", [
        k("110301", "Clientes locales", "D", undefined, 7840.25),
        k("110302", "Estimación para cuentas incobrables", "A", undefined, -320.0),
      ]),
      k("1109", "Inventarios", "D", undefined, 26115.0),
      k("1112", "Crédito Fiscal IVA", "D", undefined, 1290.4),
      k("1113", "IVA percibido", "D", undefined, 0, false),
    ]),
    k("12", "Activo no corriente", "D", [
      k("1201", "Propiedad, planta y equipo", "D", [
        k("120101", "Mobiliario y equipo de oficina", "D", undefined, 6400.0),
        k("120102", "Equipo de transporte", "D", undefined, 18500.0),
      ]),
      k("1202", "Depreciación acumulada", "A", undefined, -4210.0),
    ]),
  ]),
  k("2", "Pasivo", "A", [
    k("21", "Pasivo corriente", "A", [
      k("2102", "Cuentas por pagar", "A", [
        k("210201", "Cuentas por Pagar Comerciales · Locales", "A", undefined, 9105.0),
        k("210202", "Cuentas por Pagar Comerciales · Exterior", "A", undefined, 0),
      ]),
      k("2106", "Débito Fiscal IVA", "A", undefined, 2310.6),
      k("2107", "Retenciones por pagar", "A", undefined, 415.3),
      k("2108", "Impuesto sobre la renta por pagar", "A", undefined, 0),
    ]),
  ]),
  k("3", "Patrimonio", "A", [
    k("31", "Capital contable", "A", [
      k("3101", "Capital social", "A", undefined, 50000.0),
      k("3103", "Reserva legal", "A", undefined, 1820.0),
      k("3105", "Utilidades acumuladas", "A", undefined, 4250.0),
    ]),
  ]),
  k("4", "Cuentas de resultado deudoras", "D", [
    k("41", "Costos y gastos de operación", "D", [
      k("4104", "Costo de Ventas", "D", undefined, 31240.0),
      k("4105", "Gastos de venta", "D", undefined, 3410.8),
      k("4106", "Gastos de administración", "D", undefined, 5120.0),
      k("4107", "Gasto por impuesto sobre la renta", "D", undefined, 0),
    ]),
  ]),
  k("5", "Cuentas de resultado acreedoras", "A", [
    k("51", "Ingresos de operación", "A", [
      k("5101", "Ventas", "A", undefined, 48760.0),
      k("5103", "Otros ingresos", "A", undefined, 210.0),
    ]),
  ]),
  k("6", "Cuenta liquidadora", "A", [k("6101", "Pérdidas y Ganancias", "A", undefined, 0)]),
];

/** Lista plana de cuentas de último nivel (imputables). */
export function imputables(lista = CATALOGO, out: Cuenta[] = []): Cuenta[] {
  for (const c of lista) { if (c.h?.length) imputables(c.h, out); else out.push(c); }
  return out;
}

export const NIVEL: Record<number, string> = { 1: "Clase", 2: "Rubro", 4: "Cuenta de mayor", 6: "Subcuenta", 8: "Detalle", 10: "Analítica" };

export type EstadoPartida = "Borrador" | "Contabilizada" | "Anulada";
export type Linea = { c: string; n: string; d: number; h: number };
/** Una versión guardada de una partida contabilizada (HU-23). La vigente es la última. */
export type Version = { n: number; fecha: string; autor: string; motivo: string; lineas: Linea[] };
export type Partida = {
  id: string; num?: number; fecha: string; tipo: string; concepto: string; doc?: string;
  debe: number; haber: number; estado: EstadoPartida; autor: string; suc: string; lineas?: Linea[];
  versiones?: Version[];
  /** Partida original que esta revierte (HU-24). */
  reversaDe?: string;
  /** Partida de reversión que anuló a esta, con su motivo (HU-24). */
  anuladaPor?: { id: string; fecha: string; autor: string; motivo: string };
};

const L = (c: string, n: string, d: number, h: number): Linea => ({ c, n, d, h });

export const PARTIDAS: Partida[] = [
  { id: "b1", fecha: "09/11/2026", tipo: "Operación", concepto: "Compra de mercadería al crédito", doc: "CCF n.º 245", debe: 1130, haber: 1105, estado: "Borrador", autor: "Josué Martínez", suc: "San Miguel Centro",
    lineas: [{ c: "1109", n: "Inventarios", d: 1000, h: 0 }, { c: "1112", n: "Crédito Fiscal IVA", d: 130, h: 0 }, { c: "210201", n: "Cuentas por Pagar Comerciales · Locales", d: 0, h: 1105 }] },
  { id: "b2", fecha: "10/11/2026", tipo: "Operación", concepto: "Pago de energía eléctrica", doc: "Factura n.º 88120", debe: 85.4, haber: 85.4, estado: "Borrador", autor: "Josué Martínez", suc: "San Miguel Centro",
    lineas: [{ c: "4106", n: "Gastos de administración", d: 85.4, h: 0 }, { c: "11010301", n: "Banco Agrícola · cuenta corriente", d: 0, h: 85.4 }] },
  { id: "b3", fecha: "10/11/2026", tipo: "Ajuste", concepto: "Depreciación de mobiliario", debe: 120, haber: 120, estado: "Borrador", autor: "María Rivas", suc: "Casa matriz",
    lineas: [{ c: "4106", n: "Gastos de administración", d: 120, h: 0 }, { c: "1202", n: "Depreciación acumulada", d: 0, h: 120 }] },
  { id: "p8", num: 8, fecha: "11/11/2026", tipo: "Reversión", concepto: "Reversión de la partida n.º 4 · Compra de papelería", doc: "Factura n.º 5512", debe: 42.3, haber: 42.3, estado: "Contabilizada", autor: "María Rivas", suc: "Usulután", reversaDe: "p4",
    lineas: [L("110102", "Caja chica", 42.3, 0), L("4106", "Gastos de administración", 0, 37.43), L("1112", "Crédito Fiscal IVA", 0, 4.87)] },
  { id: "p7", num: 7, fecha: "08/11/2026", tipo: "Operación", concepto: "Venta al contado según factura 1201", doc: "Factura n.º 1201", debe: 565, haber: 565, estado: "Contabilizada", autor: "Josué Martínez", suc: "San Miguel Centro",
    lineas: [L("110101", "Caja general", 565, 0), L("5101", "Ventas", 0, 500), L("2106", "Débito Fiscal IVA", 0, 65)] },
  { id: "p6", num: 6, fecha: "06/11/2026", tipo: "Operación", concepto: "Abono de cliente Distribuidora Lemus", doc: "Recibo n.º 330", debe: 1200, haber: 1200, estado: "Contabilizada", autor: "Josué Martínez", suc: "San Miguel Centro",
    lineas: [L("11010301", "Banco Agrícola · cuenta corriente", 1200, 0), L("110301", "Clientes locales", 0, 1200)] },
  { id: "p5", num: 5, fecha: "05/11/2026", tipo: "Operación", concepto: "Pago de alquiler del local", doc: "Recibo n.º 41", debe: 650, haber: 650, estado: "Contabilizada", autor: "María Rivas", suc: "Casa matriz",
    lineas: [L("4106", "Gastos de administración", 575.22, 0), L("1112", "Crédito Fiscal IVA", 74.78, 0), L("110101", "Caja general", 0, 650)],
    versiones: [
      { n: 1, fecha: "05/11/2026 09:12", autor: "María Rivas", motivo: "Contabilización original",
        lineas: [L("4105", "Gastos de venta", 575.22, 0), L("1112", "Crédito Fiscal IVA", 74.78, 0), L("110101", "Caja general", 0, 650)] },
      { n: 2, fecha: "07/11/2026 15:40", autor: "Carlos Hernández", motivo: "El alquiler corresponde a la oficina administrativa, no a ventas.",
        lineas: [L("4106", "Gastos de administración", 575.22, 0), L("1112", "Crédito Fiscal IVA", 74.78, 0), L("110101", "Caja general", 0, 650)] },
    ] },
  { id: "p4", num: 4, fecha: "04/11/2026", tipo: "Operación", concepto: "Compra de papelería", doc: "Factura n.º 5512", debe: 42.3, haber: 42.3, estado: "Anulada", autor: "Josué Martínez", suc: "Usulután",
    lineas: [L("4106", "Gastos de administración", 37.43, 0), L("1112", "Crédito Fiscal IVA", 4.87, 0), L("110102", "Caja chica", 0, 42.3)],
    anuladaPor: { id: "p8", fecha: "11/11/2026", autor: "María Rivas", motivo: "La factura era de otra sucursal; se registrará de nuevo en la correcta." } },
  { id: "p3", num: 3, fecha: "03/11/2026", tipo: "Operación", concepto: "Remesa a Banco Agrícola", doc: "Remesa n.º 9921", debe: 3000, haber: 3000, estado: "Contabilizada", autor: "Josué Martínez", suc: "Casa matriz",
    lineas: [L("11010301", "Banco Agrícola · cuenta corriente", 3000, 0), L("110101", "Caja general", 0, 3000)] },
  { id: "p2", num: 2, fecha: "02/11/2026", tipo: "Operación", concepto: "Venta al crédito a Ferretería Chávez", doc: "CCF n.º 77", debe: 2260, haber: 2260, estado: "Contabilizada", autor: "Josué Martínez", suc: "San Miguel Centro",
    lineas: [L("110301", "Clientes locales", 2260, 0), L("5101", "Ventas", 0, 2000), L("2106", "Débito Fiscal IVA", 0, 260)] },
  { id: "p1", num: 1, fecha: "01/11/2026", tipo: "Apertura", concepto: "Partida de apertura de noviembre", debe: 98450.2, haber: 98450.2, estado: "Contabilizada", autor: "María Rivas", suc: "Casa matriz",
    lineas: [L("110101", "Caja general", 2450, 0), L("110102", "Caja chica", 150, 0), L("11010301", "Banco Agrícola · cuenta corriente", 18320.55, 0), L("11010302", "Banco Cuscatlán · cuenta de ahorro", 5210, 0),
      L("110301", "Clientes locales", 7840.25, 0), L("1109", "Inventarios", 38289, 0), L("1112", "Crédito Fiscal IVA", 1290.4, 0), L("120101", "Mobiliario y equipo de oficina", 6400, 0), L("120102", "Equipo de transporte", 18500, 0),
      L("1202", "Depreciación acumulada", 0, 4210), L("210201", "Cuentas por Pagar Comerciales · Locales", 0, 9105), L("3101", "Capital social", 0, 50000), L("3105", "Utilidades acumuladas", 0, 35135.2)] },
];

export const TIPOS_PARTIDA = ["Apertura", "Operación", "Ajuste", "Cierre", "Reapertura", "Reversión"];

/* =====================================================================================
 * CheroPhonex · noviembre 2026 (HU-90).
 * OJO: son cifras ILUSTRATIVAS, coherentes entre sí (cuadran al centavo). El caso oficial
 * del docente no está en el repositorio; al tenerlo se sustituye SOLO este bloque y todos
 * los libros, balanzas y estados que lo usen seguirán cuadrando.
 * Los montos se llevan en centavos enteros para que no haya errores de redondeo.
 * ===================================================================================== */
export type PartidaChero = { num: number; fecha: string; tipo: string; concepto: string; suc: string; estado?: "Contabilizada" | "Anulada"; lineas: Linea[] };
const NOMBRE: Record<string, string> = {
  "110101": "Caja general", "11010301": "Banco Agrícola · cuenta corriente", "110301": "Clientes locales", "1109": "Inventarios",
  "1112": "Crédito Fiscal IVA", "120101": "Mobiliario y equipo de oficina", "1202": "Depreciación acumulada",
  "210201": "Cuentas por Pagar Comerciales · Locales", "2106": "Débito Fiscal IVA", "2107": "Retenciones por pagar",
  "3101": "Capital social", "3103": "Reserva legal", "3105": "Utilidades acumuladas", "6101": "Pérdidas y Ganancias",
  "4107": "Gasto por impuesto sobre la renta", "2108": "Impuesto sobre la renta por pagar", "4104": "Costo de Ventas", "4105": "Gastos de venta", "4106": "Gastos de administración", "5101": "Ventas",
};
const c = (cod: string, d: number, h = 0): Linea => ({ c: cod, n: NOMBRE[cod], d, h });
const h = (cod: string, v: number): Linea => c(cod, 0, v);

export const PARTIDAS_CHERO: PartidaChero[] = [
  { num: 1, fecha: "01/11/2026", tipo: "Apertura", concepto: "Partida de apertura", suc: "Casa matriz",
    lineas: [c("110101", 5000), c("11010301", 20000), c("1109", 30000), c("120101", 8000), h("3101", 63000)] },
  { num: 2, fecha: "02/11/2026", tipo: "Operación", concepto: "Compra de teléfonos al crédito", suc: "Casa matriz",
    lineas: [c("1109", 10000), c("1112", 1300), h("210201", 11300)] },
  { num: 3, fecha: "04/11/2026", tipo: "Operación", concepto: "Venta al contado", suc: "Metrocentro",
    lineas: [c("110101", 6780), h("5101", 6000), h("2106", 780)] },
  { num: 4, fecha: "04/11/2026", tipo: "Operación", concepto: "Costo de la venta al contado", suc: "Metrocentro",
    lineas: [c("4104", 3600), h("1109", 3600)] },
  { num: 5, fecha: "06/11/2026", tipo: "Operación", concepto: "Venta al crédito", suc: "Casa matriz",
    lineas: [c("110301", 5650), h("5101", 5000), h("2106", 650)] },
  { num: 6, fecha: "06/11/2026", tipo: "Operación", concepto: "Costo de la venta al crédito", suc: "Casa matriz",
    lineas: [c("4104", 3000), h("1109", 3000)] },
  { num: 7, fecha: "09/11/2026", tipo: "Operación", concepto: "Pago de alquiler del local", suc: "Metrocentro",
    lineas: [c("4106", 800), c("1112", 104), h("11010301", 904)] },
  { num: 8, fecha: "10/11/2026", tipo: "Operación", concepto: "Pago parcial a proveedor", suc: "Casa matriz",
    lineas: [c("210201", 5000), h("11010301", 5000)] },
  { num: 9, fecha: "12/11/2026", tipo: "Operación", concepto: "Cobro a cliente (incluye un anticipo)", suc: "Casa matriz",
    lineas: [c("11010301", 6000), h("110301", 6000)] },
  { num: 10, fecha: "13/11/2026", tipo: "Operación", concepto: "Pago de energía eléctrica", suc: "Metrocentro",
    lineas: [c("4106", 120), h("11010301", 120)] },
  { num: 11, fecha: "13/11/2026", tipo: "Reversión", concepto: "Reversión de la partida n.º 10", suc: "Metrocentro",
    lineas: [c("11010301", 120), h("4106", 120)] },
  { num: 12, fecha: "15/11/2026", tipo: "Operación", concepto: "Sueldos del personal de ventas", suc: "Casa matriz",
    lineas: [c("4105", 1500), h("2107", 150), h("11010301", 1350)] },
  { num: 13, fecha: "16/11/2026", tipo: "Ajuste", concepto: "Depreciación de mobiliario", suc: "Casa matriz",
    lineas: [c("4106", 200), h("1202", 200)] },
];
/** La partida 10 quedó anulada por la 11; el resto está contabilizada. */
PARTIDAS_CHERO.forEach((p) => { p.estado = p.num === 10 ? "Anulada" : "Contabilizada"; });

export type SaldoChero = { c: string; n: string; d: number; h: number };
/** Totales de debe y haber por cuenta (incluye anuladas y reversiones, como pide la regla de reportes). */
export function balanzaChero(): SaldoChero[] {
  const m = new Map<string, SaldoChero>();
  for (const p of PARTIDAS_CHERO) for (const l of p.lineas) {
    const s = m.get(l.c) ?? { c: l.c, n: l.n, d: 0, h: 0 };
    s.d += l.d; s.h += l.h; m.set(l.c, s);
  }
  return [...m.values()].sort((a, b) => a.c.localeCompare(b.c, "en", { numeric: true }));
}
