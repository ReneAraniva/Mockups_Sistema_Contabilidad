/* =====================================================================================
 * Caso oficial CheroPhonex · octubre de 2026 (Sprint 3).
 * Cifras tomadas de CheroPhonex_Libros_Octubre2026.pdf (hojas 3 a 8, 28 a 32).
 * Lo que no está en el PDF (cuentas por cobrar con crédito, cheques, remesas) se marca «ilustrativo».
 * Montos en dólares con dos decimales; las sumas se redondean al centavo.
 * ===================================================================================== */

export const EMPRESA_OFICIAL = "CheroPhonex";
export const NRC_EMPRESA = "312456-7";
export const PERIODO_CASO = "Octubre 2026";
export const redondear = (n: number) => Math.round(n * 100 + 1e-7) / 100;
export const suma = (v: number[]) => redondear(v.reduce((t, x) => t + x, 0));

/* ---------- Libros de IVA (HU-45 · HU-46 · HU-47) ---------- */
export type Compra = { n: number; fecha: string; tipo: "CCF" | "Factura"; doc: string; nrc: string; proveedor: string; concepto: string; exentas: number; gravadas: number; iva: number; total: number };
const comp = (n: number, fecha: string, tipo: Compra["tipo"], doc: string, nrc: string, proveedor: string, concepto: string, exentas: number, gravadas: number): Compra => {
  const iva = redondear(gravadas * 0.13);
  return { n, fecha, tipo, doc, nrc, proveedor, concepto, exentas, gravadas, iva, total: redondear(exentas + gravadas + iva) };
};
export const LIBRO_COMPRAS: Compra[] = [
  comp(1, "01/10/2026", "CCF", "CCF-P001", "301245-7", "Totalynk El Salvador", "Mercadería para la venta", 0, 11670),
  comp(2, "02/10/2026", "CCF", "CCF-P002", "187652-0", "SP Importadora", "Mercadería para la venta", 0, 11800),
  comp(3, "03/10/2026", "CCF", "CCF-P003", "254398-2", "A1A Solutions", "Mercadería para la venta", 0, 11720),
  comp(4, "04/10/2026", "CCF", "CCF-P004", "299871-4", "Protectores por Mayor", "Mercadería para la venta", 0, 4810),
  comp(5, "05/10/2026", "CCF", "CCF-A0101", "210457-9", "Inmobiliaria Roosevelt, S.A. de C.V.", "Alquiler del local · octubre", 0, 600),
  comp(6, "15/10/2026", "CCF", "CCF-E2231", "100231-4", "EEO, S.A. de C.V.", "Energía eléctrica", 0, 150),
  comp(7, "15/10/2026", "Factura", "FAC-AN5587", "N/A", "ANDA", "Servicio de agua", 25, 0),
  comp(8, "15/10/2026", "CCF", "CCF-T7741", "156320-1", "Telecom Oriente, S.A. de C.V.", "Internet y telefonía", 0, 60),
  comp(9, "22/10/2026", "CCF", "CCF-L0412", "213654-0", "Librería y Papelería San Miguel", "Papelería y útiles", 0, 50),
  comp(10, "22/10/2026", "CCF", "CCF-L0413", "213654-0", "Librería y Papelería San Miguel", "Material de aseo", 0, 40),
  comp(11, "28/10/2026", "CCF", "CCF-P0920", "248761-3", "Publicidad Oriental, S.A. de C.V.", "Publicidad en redes y volantes", 0, 200),
];

export type VentaCcf = { n: number; fecha: string; doc: string; nrc: string; cliente: string; gravadas: number; iva: number; retenido: number; total: number };
const vc = (n: number, fecha: string, doc: string, nrc: string, cliente: string, gravadas: number, iva: number): VentaCcf =>
  ({ n, fecha, doc, nrc, cliente, gravadas, iva, retenido: 0, total: redondear(gravadas + iva) });
export const LIBRO_CONTRIBUYENTES: VentaCcf[] = [
  vc(1, "08/10/2026", "CCF-0001", "245871-3", "Tecno Plaza San Miguel, S.A. de C.V.", 2740.5, 356.27),
  vc(2, "10/10/2026", "CCF-0002", "198342-6", "Celulares El Oriente, S.A. de C.V.", 3152.25, 409.79),
  vc(3, "15/10/2026", "CCF-0003", "276510-1", "Comercial Chaparrastique, S.A. de C.V.", 3928.5, 510.71),
  vc(4, "17/10/2026", "CCF-0004", "231984-8", "Distribuidora La Ceiba, S.A. de C.V.", 4627.8, 601.61),
  vc(5, "22/10/2026", "CCF-0005", "264017-5", "MultiCell Usulután, S.A. de C.V.", 2218.05, 288.35),
  vc(6, "24/10/2026", "CCF-0006", "245871-3", "Tecno Plaza San Miguel, S.A. de C.V.", 2582.55, 335.73),
  vc(7, "29/10/2026", "CCF-0007", "198342-6", "Celulares El Oriente, S.A. de C.V.", 3325.05, 432.26),
  vc(8, "31/10/2026", "CCF-0008", "276510-1", "Comercial Chaparrastique, S.A. de C.V.", 3048.3, 396.28),
];

export type VentaCf = { n: number; fecha: string; del: string; al: string; caja: string; gravadas: number; iva: number; total: number };
const cf = (n: number, fecha: string, del: string, al: string, gravadas: number, iva: number): VentaCf =>
  ({ n, fecha, del, al, caja: "Caja-01", gravadas, iva, total: redondear(gravadas + iva) });
export const LIBRO_CONSUMIDOR: VentaCf[] = [
  cf(1, "10/10/2026", "FCF-00001", "FCF-00015", 3966.3, 515.62),
  cf(2, "17/10/2026", "FCF-00016", "FCF-00032", 4999.05, 649.88),
  cf(3, "24/10/2026", "FCF-00033", "FCF-00049", 6470.55, 841.17),
  cf(4, "31/10/2026", "FCF-00050", "FCF-00065", 4992.3, 649.0),
];

/** Liquidación del IVA y pago a cuenta (HU-48 · HU-49), hoja 32 del PDF. */
export function liquidacion() {
  const debitoCcf = suma(LIBRO_CONTRIBUYENTES.map((v) => v.iva));
  const debitoCf = suma(LIBRO_CONSUMIDOR.map((v) => v.iva));
  const debito = suma([debitoCcf, debitoCf]);
  const credito = suma(LIBRO_COMPRAS.map((c) => c.iva));
  const retenido = 0, percibido = 0, remanenteAnterior = 0;
  const neto = redondear(debito - credito - retenido + percibido - remanenteAnterior);
  const porPagar = Math.max(neto, 0);
  const remanente = Math.max(-neto, 0);
  const ingresos = suma([...LIBRO_CONTRIBUYENTES.map((v) => v.gravadas), ...LIBRO_CONSUMIDOR.map((v) => v.gravadas)]);
  const pagoCuenta = redondear(ingresos * 0.0175);
  return { debitoCcf, debitoCf, debito, credito, retenido, percibido, remanenteAnterior, porPagar, remanente, ingresos, pagoCuenta };
}

/* ---------- Planilla (HU-72 · HU-73 · HU-74) ---------- */
export type EmpleadoCaso = { n: number; nombre: string; cargo: string; area: "Administración" | "Ventas"; salario: number; ingreso: string };
export const PLANILLA_EMPLEADOS: EmpleadoCaso[] = [
  { n: 1, nombre: "Lenin Alejandro Hernández Coreas", cargo: "Administrador", area: "Administración", salario: 600, ingreso: "01/10/2026" },
  { n: 2, nombre: "Bremond Antony Hernández Coreas", cargo: "Vendedor", area: "Ventas", salario: 450, ingreso: "01/10/2026" },
  { n: 3, nombre: "René Francisco Pacheco Araniva", cargo: "Vendedor", area: "Ventas", salario: 450, ingreso: "01/10/2026" },
  { n: 4, nombre: "Nelson René Rodríguez Quintanilla", cargo: "Técnico de soporte y garantía", area: "Ventas", salario: 450, ingreso: "01/10/2026" },
  { n: 5, nombre: "Kevin Bladimir Guardado Ortez", cargo: "Cajero y bodeguero", area: "Ventas", salario: 450, ingreso: "01/10/2026" },
];
export const TASAS_CASO = { isssLab: 3, isssPat: 7.5, techoIsss: 1000, afpLab: 7.25, afpPat: 8.75 };

/** Retención de renta mensual según la tabla del caso (tramos I a IV). */
export function rentaMensual(base: number): number {
  if (base <= 550) return 0;
  if (base <= 895.24) return redondear((base - 550) * 0.1 + 17.67);
  if (base <= 2038.1) return redondear((base - 895.24) * 0.2 + 60);
  return redondear((base - 2038.1) * 0.3 + 288.57);
}
export type FilaPlanilla = EmpleadoCaso & {
  isss: number; afp: number; base: number; renta: number; retenciones: number; liquido: number;
  isssPat: number; afpPat: number; cuotaPat: number; vacaciones: number; aguinaldo: number;
};
export function calcularPlanilla(emps = PLANILLA_EMPLEADOS): FilaPlanilla[] {
  return emps.map((e) => {
    const isss = redondear(Math.min(e.salario, TASAS_CASO.techoIsss) * (TASAS_CASO.isssLab / 100));
    const afp = redondear(e.salario * (TASAS_CASO.afpLab / 100));
    const base = redondear(e.salario - isss - afp);
    const renta = rentaMensual(base);
    const retenciones = redondear(isss + afp + renta);
    const isssPat = redondear(Math.min(e.salario, TASAS_CASO.techoIsss) * (TASAS_CASO.isssPat / 100));
    const afpPat = redondear(e.salario * (TASAS_CASO.afpPat / 100));
    return {
      ...e, isss, afp, base, renta, retenciones, liquido: redondear(e.salario - retenciones),
      isssPat, afpPat, cuotaPat: redondear(isssPat + afpPat),
      vacaciones: redondear(((e.salario / 30) * 15 * 1.3) / 12), aguinaldo: redondear(((e.salario / 30) * 15) / 12),
    };
  });
}

/** Días entre dos fechas dd/mm/aaaa (la de término incluida). */
export function diasEntre(desde: string, hasta: string): number {
  const f = (s: string) => { const [d, m, a] = s.split("/").map(Number); return Date.UTC(a, m - 1, d); };
  return Math.max(Math.round((f(hasta) - f(desde)) / 86400000) + 1, 0);
}
/** Días de aguinaldo según la antigüedad: 15 (menos de 3 años), 19 (3 a 10) y 21 (10 o más). */
export const diasAguinaldo = (anios: number) => (anios < 3 ? 15 : anios < 10 ? 19 : 21);
/** Liquidación proporcional de un empleado que se retira (HU-74). Valores a título de diseño. */
export function liquidacionEmpleado(salario: number, ingreso: string, retiro: string) {
  const dias = diasEntre(ingreso, retiro);
  const anios = dias / 365;
  const vacaciones = redondear(((salario / 30) * 15 * 1.3) * Math.min(anios, 1));
  const aguinaldo = redondear(((salario / 30) * diasAguinaldo(anios)) * Math.min(anios, 1));
  const indemnizacion = redondear(salario * anios);
  return { dias, anios, vacaciones, aguinaldo, indemnizacion, total: suma([vacaciones, aguinaldo, indemnizacion]) };
}

/* ---------- Inventario y kardex (HU-65) ---------- */
export const DOCS_VENTA = [
  { doc: "CCF-0001", fecha: "08/10" }, { doc: "CCF-0002", fecha: "10/10" }, { doc: "CCF-0003", fecha: "15/10" }, { doc: "CCF-0004", fecha: "17/10" },
  { doc: "CCF-0005", fecha: "22/10" }, { doc: "CCF-0006", fecha: "24/10" }, { doc: "CCF-0007", fecha: "29/10" }, { doc: "CCF-0008", fecha: "31/10" },
  { doc: "CF-S1", fecha: "10/10" }, { doc: "CF-S2", fecha: "17/10" }, { doc: "CF-S3", fecha: "24/10" }, { doc: "CF-S4", fecha: "31/10" },
];
const PROVEEDOR: Record<string, { n: string; fecha: string; doc: string }> = {
  Samsung: { n: "Totalynk El Salvador", fecha: "01/10/2026", doc: "CCF-P001" },
  iPhone: { n: "SP Importadora", fecha: "02/10/2026", doc: "CCF-P002" },
  "Xiaomi/Honor": { n: "A1A Solutions", fecha: "03/10/2026", doc: "CCF-P003" },
  Accesorios: { n: "Protectores por Mayor", fecha: "04/10/2026", doc: "CCF-P004" },
};
export type ProductoCaso = {
  categoria: "Teléfonos" | "Accesorios"; marca: string; nombre: string; proveedor: string; fechaCompra: string; docCompra: string;
  costo: number; precio: number; compradas: number; ventas: number[]; vendidas: number; finales: number;
  compras: number; costoVentas: number; invFinal: number; ventasNetas: number; utilidad: number;
};
const prod = (categoria: ProductoCaso["categoria"], marca: string, nombre: string, costo: number, compradas: number, ventas: number[]): ProductoCaso => {
  const p = PROVEEDOR[marca];
  const precio = Math.round(costo * 135) / 100;
  const vendidas = ventas.reduce((t, x) => t + x, 0);
  return {
    categoria, marca, nombre, proveedor: p.n, fechaCompra: p.fecha, docCompra: p.doc, costo, precio, compradas, ventas, vendidas, finales: compradas - vendidas,
    compras: redondear(costo * compradas), costoVentas: redondear(costo * vendidas), invFinal: redondear(costo * (compradas - vendidas)),
    ventasNetas: redondear(precio * vendidas), utilidad: redondear((precio - costo) * vendidas),
  };
};
export const PRODUCTOS_CASO: ProductoCaso[] = [
  prod("Teléfonos", "Samsung", "Samsung Galaxy S24 256 GB", 590, 8, [1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0]),
  prod("Teléfonos", "Samsung", "Samsung Galaxy S24 FE", 450, 5, [0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0]),
  prod("Teléfonos", "Samsung", "Samsung Galaxy S25", 700, 4, [0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 0]),
  prod("Teléfonos", "Samsung", "Samsung Galaxy S25 Ultra", 950, 2, [0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1]),
  prod("Teléfonos", "iPhone", "iPhone 13", 400, 11, [1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1]),
  prod("Teléfonos", "iPhone", "iPhone 14", 450, 10, [1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1]),
  prod("Teléfonos", "iPhone", "iPhone 15", 580, 5, [0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1, 1]),
  prod("Teléfonos", "Xiaomi/Honor", "Redmi 15C", 150, 8, [1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0, 1]),
  prod("Teléfonos", "Xiaomi/Honor", "Redmi 15", 190, 8, [1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0]),
  prod("Teléfonos", "Xiaomi/Honor", "Redmi Note 15", 240, 8, [0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1]),
  prod("Teléfonos", "Xiaomi/Honor", "Redmi Note 15 Pro", 300, 7, [0, 0, 1, 1, 1, 0, 0, 0, 1, 0, 1, 1]),
  prod("Teléfonos", "Xiaomi/Honor", "Honor X7d", 178, 10, [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1]),
  prod("Teléfonos", "Xiaomi/Honor", "Honor 400 Smart", 230, 8, [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0]),
  prod("Teléfonos", "Xiaomi/Honor", "Honor 400", 340, 4, [0, 0, 0, 0, 0, 1, 1, 0, 0, 1, 0, 0]),
  prod("Accesorios", "Accesorios", "Cases / Fundas", 10, 130, [8, 8, 8, 7, 7, 7, 8, 8, 12, 12, 13, 13]),
  prod("Accesorios", "Accesorios", "Vidrios templados", 5, 180, [11, 11, 11, 10, 10, 10, 10, 11, 17, 17, 17, 18]),
  prod("Accesorios", "Accesorios", "Cargadores", 30, 30, [2, 2, 2, 2, 2, 2, 1, 1, 3, 3, 3, 3]),
  prod("Accesorios", "Accesorios", "Cables", 15, 40, [2, 3, 3, 3, 2, 2, 2, 2, 3, 4, 4, 4]),
  prod("Accesorios", "Accesorios", "Audífonos Bluetooth", 25, 20, [1, 1, 2, 1, 1, 1, 1, 1, 2, 2, 2, 2]),
  prod("Accesorios", "Accesorios", "Power bank", 30, 10, [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1]),
  prod("Accesorios", "Accesorios", "Adaptadores para carro", 30, 5, [0, 0, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0]),
  prod("Accesorios", "Accesorios", "Soportes para celular", 20, 5, [0, 0, 0, 0, 0, 1, 1, 0, 0, 1, 1, 0]),
  prod("Accesorios", "Accesorios", "Otros accesorios", 20, 3, [0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1, 0]),
];
export type MovKardex = { fecha: string; doc: string; detalle: string; entrada: number; salida: number; costo: number; saldoUnid: number; saldoValor: number };
export function kardexDe(p: ProductoCaso): MovKardex[] {
  let unid = p.compradas;
  const movs: MovKardex[] = [{ fecha: p.fechaCompra, doc: p.docCompra, detalle: `Compra · ${p.proveedor}`, entrada: p.compradas, salida: 0, costo: p.costo, saldoUnid: unid, saldoValor: redondear(unid * p.costo) }];
  DOCS_VENTA.forEach((d, i) => {
    const u = p.ventas[i];
    if (!u) return;
    unid -= u;
    movs.push({ fecha: `${d.fecha}/2026`, doc: d.doc, detalle: d.doc.startsWith("CCF") ? "Venta a contribuyente" : "Venta a consumidor final", entrada: 0, salida: u, costo: p.costo, saldoUnid: unid, saldoValor: redondear(unid * p.costo) });
  });
  return movs.sort((a, b) => fechaNum(a.fecha) - fechaNum(b.fecha) || (a.entrada ? -1 : 1));
}
export const fechaNum = (f: string) => { const [d, m, a] = f.split("/").map(Number); return a * 10000 + m * 100 + d; };

/* ---------- Cuentas por cobrar y por pagar (HU-62 · HU-63) · ilustrativo ---------- */
export type DocSaldo = { id: string; tercero: string; doc: string; fecha: string; vence: string; monto: number; abonado: number; dias: number };
/** Antigüedad al 31/10/2026. En el caso oficial todas las ventas y compras se pagan de contado; estas son ilustrativas. */
export const POR_COBRAR: DocSaldo[] = [
  { id: "c1", tercero: "Tecno Plaza San Miguel, S.A. de C.V.", doc: "CCF-0006", fecha: "24/10/2026", vence: "23/11/2026", monto: 2918.28, abonado: 0, dias: 7 },
  { id: "c2", tercero: "Celulares El Oriente, S.A. de C.V.", doc: "CCF-0007", fecha: "29/10/2026", vence: "28/11/2026", monto: 3757.31, abonado: 1000, dias: 2 },
  { id: "c3", tercero: "Distribuidora La Ceiba, S.A. de C.V.", doc: "CCF-0004", fecha: "17/10/2026", vence: "16/11/2026", monto: 5229.41, abonado: 0, dias: 14 },
  { id: "c4", tercero: "MultiCell Usulután, S.A. de C.V.", doc: "CCF-0005", fecha: "22/08/2026", vence: "21/09/2026", monto: 640.0, abonado: 0, dias: 70 },
];
export const POR_PAGAR: DocSaldo[] = [
  { id: "p1", tercero: "Totalynk El Salvador", doc: "CCF-P001", fecha: "01/10/2026", vence: "31/10/2026", monto: 13187.1, abonado: 8000, dias: 30 },
  { id: "p2", tercero: "Protectores por Mayor", doc: "CCF-P004", fecha: "04/10/2026", vence: "03/11/2026", monto: 5435.3, abonado: 0, dias: 27 },
  { id: "p3", tercero: "Inmobiliaria Roosevelt, S.A. de C.V.", doc: "CCF-A0101", fecha: "05/10/2026", vence: "15/11/2026", monto: 678.0, abonado: 0, dias: 26 },
];
export const RANGOS = ["0–30", "31–60", "61–90", "Más de 90"] as const;
export type Rango = (typeof RANGOS)[number];
/** `dias` = días transcurridos desde la fecha del documento hasta el corte (31/10/2026). */
export const rangoDe = (d: DocSaldo): Rango => (d.dias <= 30 ? "0–30" : d.dias <= 60 ? "31–60" : d.dias <= 90 ? "61–90" : "Más de 90");
/** Un documento está vencido si su fecha de vencimiento es igual o anterior al corte. */
export const vencido = (d: DocSaldo) => fechaNum(d.vence) <= 20261031;
export const saldoDoc = (d: DocSaldo) => redondear(d.monto - d.abonado);

/* ---------- Caja chica, bancos y conciliación (HU-77 · HU-78 · HU-79) ---------- */
export const FONDO_CAJA_CHICA = 200;
export const VALES = [
  { id: "v1", fecha: "22/10/2026", doc: "CCF-L0412", concepto: "Papelería y útiles", neto: 50, iva: 6.5, total: 56.5, estado: "Reintegrado" },
  { id: "v2", fecha: "22/10/2026", doc: "CCF-L0413", concepto: "Material de aseo", neto: 40, iva: 5.2, total: 45.2, estado: "Reintegrado" },
];
export type Movimiento = { id: string; fecha: string; tipo: "Cheque" | "Remesa" | "Nota de cargo" | "Nota de abono"; numero: string; detalle: string; monto: number; estado: "Emitido" | "Cobrado" | "Anulado" | "En tránsito" | "Acreditada" | "Aplicada" };
/** El banco y el cheque en circulación son ilustrativos; la comisión de US$ 15.00 sí está en el caso. */
export const MOV_BANCOS: Movimiento[] = [
  { id: "m1", fecha: "28/10/2026", tipo: "Cheque", numero: "CK-0014", detalle: "Publicidad Oriental · CCF-P0920", monto: 226, estado: "Emitido" },
  { id: "m2", fecha: "29/10/2026", tipo: "Cheque", numero: "CK-0013", detalle: "Telecom Oriente · CCF-T7741", monto: 67.8, estado: "Cobrado" },
  { id: "m3", fecha: "31/10/2026", tipo: "Remesa", numero: "RM-0008", detalle: "Depósito de ventas de caja · semana 4", monto: 5641.3, estado: "En tránsito" },
  { id: "m4", fecha: "30/10/2026", tipo: "Nota de cargo", numero: "NC-1178", detalle: "Comisiones bancarias de octubre", monto: 15, estado: "Aplicada" },
  { id: "m5", fecha: "24/10/2026", tipo: "Cheque", numero: "CK-0012", detalle: "Cheque anulado por error de monto", monto: 150, estado: "Anulado" },
];
export const CONCILIACION = {
  cuenta: "Banco Agrícola · cuenta corriente", corte: "31/10/2026",
  saldoLibros: 22070.89, saldoBanco: 16655.59,
  transito: [{ id: "t1", t: "Remesa RM-0008 depositada el 01/11", v: 5641.3, signo: 1 }, { id: "t2", t: "Cheque CK-0014 en circulación", v: 226, signo: -1 }],
};

/* ---------- Depreciación (HU-82) ---------- */
export const ACTIVO_CASO = { codigo: "MOB-001", nombre: "Mobiliario y equipo de oficina", costo: 2500, residual: 0, tasa: 50, inicio: "01/10/2026", cuenta: "1201", gasto: "4201", acumulada: "1202" };
export function cuadroDepreciacion(meses = 24) {
  const cuota = redondear(ACTIVO_CASO.costo * (ACTIVO_CASO.tasa / 100) / 12);
  const nombres = ["Oct 2026", "Nov 2026", "Dic 2026", "Ene 2027", "Feb 2027", "Mar 2027", "Abr 2027", "May 2027", "Jun 2027", "Jul 2027", "Ago 2027", "Sep 2027", "Oct 2027", "Nov 2027", "Dic 2027", "Ene 2028", "Feb 2028", "Mar 2028", "Abr 2028", "May 2028", "Jun 2028", "Jul 2028", "Ago 2028", "Sep 2028"];
  let acum = 0;
  return nombres.slice(0, meses).map((mes, i) => {
    const c = i === meses - 1 ? redondear(ACTIVO_CASO.costo - acum) : cuota; // el último mes absorbe el redondeo
    acum = redondear(acum + c);
    return { mes, cuota: c, acumulada: acum, enLibros: redondear(ACTIVO_CASO.costo - acum) };
  });
}

/* ---------- Estados adicionales (HU-40 a HU-43) ---------- */
export const SOCIOS = ["Carlos Alberto Granados Amaya", "Lenin Alejandro Hernández Coreas", "Bremond Antony Hernández Coreas", "René Francisco Pacheco Araniva", "Nelson René Rodríguez Quintanilla", "Kevin Bladimir Guardado Ortez"];
export const RESULTADO = { ventasCcf: 25623, ventasCf: 20428.2, ventas: 46051.2, costo: 34112, bruta: 11939.2, admin: 1864.17, venta: 2465.04, operacion: 7609.99, financieros: 15, neta: 7594.99 };
export const RETIROS = 450;
export const BALANCE_OCT = {
  efectivo: 22270.89, inventarios: 5888, anticipados: 805.9, cxc: 600, creditoFiscal: 0, activoCorriente: 29564.79,
  mobiliario: 2500, depreciacion: 104.17, activoNoCorriente: 2395.83, activo: 31960.62,
  retenciones: 246.02, empleados: 620.04, ivaDebito: 0, impuestos: 1449.57, pasivo: 2315.63,
  capital: 22500, utilidad: 7594.99, retiros: 450, patrimonio: 29644.99,
};
export const BALANCE_APERTURA = { efectivo: 20000, inventarios: 0, anticipados: 0, cxc: 0, creditoFiscal: 0, mobiliario: 2500, depreciacion: 0, pasivo: 0, capital: 22500, utilidad: 0, retiros: 0 };
/** Flujo de efectivo por el método indirecto; la variación neta coincide con Efectivo y equivalentes. */
export function flujoEfectivo() {
  const operacion = [
    { t: "Utilidad del ejercicio", v: RESULTADO.neta },
    { t: "(+) Depreciación del período", v: BALANCE_OCT.depreciacion },
    { t: "(−) Aumento de inventarios", v: -BALANCE_OCT.inventarios },
    { t: "(−) Aumento de gastos pagados por anticipado", v: -BALANCE_OCT.anticipados },
    { t: "(−) Aumento de otras cuentas por cobrar", v: -BALANCE_OCT.cxc },
    { t: "(+) Retenciones por pagar", v: BALANCE_OCT.retenciones },
    { t: "(+) Obligaciones con empleados", v: BALANCE_OCT.empleados },
    { t: "(+) Impuestos por pagar", v: BALANCE_OCT.impuestos },
  ];
  const financiamiento = [{ t: "(+) Capital aportado en efectivo", v: 20000 }, { t: "(−) Retiros del titular", v: -RETIROS }];
  const totalOp = suma(operacion.map((o) => o.v)), totalFin = suma(financiamiento.map((o) => o.v));
  return { operacion, inversion: [] as { t: string; v: number }[], financiamiento, totalOp, totalInv: 0, totalFin, variacion: suma([totalOp, totalFin]), inicial: 0, final: BALANCE_OCT.efectivo };
}

/* ---------- Respaldos (HU-13) · ilustrativo ---------- */
export type Respaldo = { id: string; fecha: string; alcance: string; tipo: "Manual" | "Automático" | "Previo a restaurar"; tamano: string; autor: string; estado: "Listo" | "En proceso" };
export const RESPALDOS: Respaldo[] = [
  { id: "r1", fecha: "01/11/2026 02:00", alcance: "Empresa completa", tipo: "Automático", tamano: "4.2 MB", autor: "Sistema", estado: "Listo" },
  { id: "r2", fecha: "31/10/2026 18:42", alcance: "Empresa completa", tipo: "Manual", tamano: "4.1 MB", autor: "María Rivas", estado: "Listo" },
  { id: "r3", fecha: "31/10/2026 02:00", alcance: "Empresa completa", tipo: "Automático", tamano: "4.0 MB", autor: "Sistema", estado: "Listo" },
  { id: "r4", fecha: "28/10/2026 11:05", alcance: "Sucursal Metrocentro", tipo: "Manual", tamano: "1.3 MB", autor: "María Rivas", estado: "Listo" },
];
