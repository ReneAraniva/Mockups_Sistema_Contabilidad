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
export type Partida = {
  id: string; num?: number; fecha: string; tipo: string; concepto: string; doc?: string;
  debe: number; haber: number; estado: EstadoPartida; autor: string; suc: string; lineas?: Linea[];
};

export const PARTIDAS: Partida[] = [
  { id: "b1", fecha: "09/11/2026", tipo: "Operación", concepto: "Compra de mercadería al crédito", doc: "CCF n.º 245", debe: 1130, haber: 1105, estado: "Borrador", autor: "Josué Martínez", suc: "San Miguel Centro",
    lineas: [{ c: "1109", n: "Inventarios", d: 1000, h: 0 }, { c: "1112", n: "Crédito Fiscal IVA", d: 130, h: 0 }, { c: "210201", n: "Cuentas por Pagar Comerciales · Locales", d: 0, h: 1105 }] },
  { id: "b2", fecha: "10/11/2026", tipo: "Operación", concepto: "Pago de energía eléctrica", doc: "Factura n.º 88120", debe: 85.4, haber: 85.4, estado: "Borrador", autor: "Josué Martínez", suc: "San Miguel Centro",
    lineas: [{ c: "4106", n: "Gastos de administración", d: 85.4, h: 0 }, { c: "11010301", n: "Banco Agrícola · cuenta corriente", d: 0, h: 85.4 }] },
  { id: "b3", fecha: "10/11/2026", tipo: "Ajuste", concepto: "Depreciación de mobiliario", debe: 120, haber: 120, estado: "Borrador", autor: "María Rivas", suc: "Casa matriz",
    lineas: [{ c: "4106", n: "Gastos de administración", d: 120, h: 0 }, { c: "1202", n: "Depreciación acumulada", d: 0, h: 120 }] },
  { id: "p7", num: 7, fecha: "08/11/2026", tipo: "Operación", concepto: "Venta al contado según factura 1201", doc: "Factura n.º 1201", debe: 565, haber: 565, estado: "Contabilizada", autor: "Josué Martínez", suc: "San Miguel Centro" },
  { id: "p6", num: 6, fecha: "06/11/2026", tipo: "Operación", concepto: "Abono de cliente Distribuidora Lemus", doc: "Recibo n.º 330", debe: 1200, haber: 1200, estado: "Contabilizada", autor: "Josué Martínez", suc: "San Miguel Centro" },
  { id: "p5", num: 5, fecha: "05/11/2026", tipo: "Operación", concepto: "Pago de alquiler del local", doc: "Recibo n.º 41", debe: 650, haber: 650, estado: "Contabilizada", autor: "María Rivas", suc: "Casa matriz" },
  { id: "p4", num: 4, fecha: "04/11/2026", tipo: "Operación", concepto: "Compra de papelería", doc: "Factura n.º 5512", debe: 42.3, haber: 42.3, estado: "Anulada", autor: "Josué Martínez", suc: "Usulután" },
  { id: "p3", num: 3, fecha: "03/11/2026", tipo: "Operación", concepto: "Remesa a Banco Agrícola", doc: "Remesa n.º 9921", debe: 3000, haber: 3000, estado: "Contabilizada", autor: "Josué Martínez", suc: "Casa matriz" },
  { id: "p2", num: 2, fecha: "02/11/2026", tipo: "Operación", concepto: "Venta al crédito a Ferretería Chávez", doc: "CCF n.º 77", debe: 2260, haber: 2260, estado: "Contabilizada", autor: "Josué Martínez", suc: "San Miguel Centro" },
  { id: "p1", num: 1, fecha: "01/11/2026", tipo: "Apertura", concepto: "Partida de apertura de noviembre", debe: 98450.2, haber: 98450.2, estado: "Contabilizada", autor: "María Rivas", suc: "Casa matriz" },
];

export const TIPOS_PARTIDA = ["Apertura", "Operación", "Ajuste", "Cierre", "Reapertura", "Reversión"];
