import { CATALOGO, PARTIDAS_CHERO, imputables, type Linea, type PartidaChero } from "./ejemplo";
import { PARAMS } from "./parametros";

/* Cálculos de libros, balanzas, hoja de trabajo y cierre sobre el caso CheroPhonex.
 * Todo se hace en centavos enteros para que nada se descuadre por redondeo. */

export const EMPRESA_CHERO = "CheroPhonex, S.A. de C.V.";

export const cent = (n: number) => Math.round(n * 100);
export const enDinero = (c: number) => c / 100;

/** Naturaleza de cada cuenta imputable del catálogo. */
const NAT = new Map(imputables(CATALOGO).map((c) => [c.c, c.nat]));
export const naturaleza = (cod: string): "D" | "A" => NAT.get(cod) ?? "D";

/** "dd/mm/aaaa" → aaaammdd; NaN si no es una fecha completa. */
export const aNumFecha = (f: string) => {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(f.trim());
  return m ? +m[3] * 10000 + +m[2] * 100 + +m[1] : NaN;
};

export type Saldo = { c: string; n: string; d: number; h: number }; // centavos
export function sumar(lineas: Linea[]): Saldo[] {
  const m = new Map<string, Saldo>();
  for (const l of lineas) {
    const s = m.get(l.c) ?? { c: l.c, n: l.n, d: 0, h: 0 };
    s.d += cent(l.d); s.h += cent(l.h); m.set(l.c, s);
  }
  return [...m.values()].sort((a, b) => a.c.localeCompare(b.c, "en", { numeric: true }));
}
/** Saldo neto en la columna que le toca: deudor o acreedor. */
export const neto = (s: { d: number; h: number }) => ({ d: Math.max(s.d - s.h, 0), h: Math.max(s.h - s.d, 0) });
/** Saldo según la naturaleza de la cuenta (positivo = normal, negativo = contrario). */
export const saldoNat = (cod: string, d: number, h: number) => (naturaleza(cod) === "D" ? d - h : h - d);

const todas = () => PARTIDAS_CHERO.flatMap((p) => p.lineas);
const L = (c: string, n: string, d: number, h: number): Linea => ({ c, n, d: enDinero(d), h: enDinero(h) });
const nombreDe = (cod: string) => sumar(todas()).find((s) => s.c === cod)?.n ?? cod;

/* ---------- Cierre (HU-34 · HU-35 · HU-36) ---------- */
export function calcularCierre() {
  const base = sumar(todas());
  const clase = (k: string) => base.filter((s) => s.c.startsWith(k));
  const ingresos = clase("5").map((s) => ({ ...s, v: s.h - s.d }));
  const gastos = clase("4").map((s) => ({ ...s, v: s.d - s.h }));
  const totIng = ingresos.reduce((t, x) => t + x.v, 0);
  const totGas = gastos.reduce((t, x) => t + x.v, 0);
  const utilAntes = totIng - totGas;
  const isr = Math.max(Math.round((utilAntes * PARAMS.isr) / 100), 0);
  const neta = utilAntes - isr;
  const reserva = Math.max(Math.round((neta * PARAMS.reserva) / 100), 0);
  const acumulada = neta - reserva;

  const lineasIsr: Linea[] = [L("4107", nombreDe("4107"), isr, 0), L("2108", nombreDe("2108"), 0, isr)];
  const gastosCierre = [...gastos, { c: "4107", n: nombreDe("4107"), d: 0, h: 0, v: isr }];
  const lineasCierre: Linea[] = [
    ...ingresos.map((x) => L(x.c, x.n, x.v, 0)), L("6101", "Pérdidas y Ganancias", 0, totIng),
    L("6101", "Pérdidas y Ganancias", totGas + isr, 0), ...gastosCierre.map((x) => L(x.c, x.n, 0, x.v)),
    L("6101", "Pérdidas y Ganancias", neta, 0), L("3103", "Reserva legal", 0, reserva), L("3105", "Utilidades acumuladas", 0, acumulada),
  ];
  // Saldos de balance después del ISR y del cierre = base de la reapertura.
  const post = sumar([...todas(), ...lineasIsr, ...lineasCierre]).filter((s) => /^[123]/.test(s.c));
  const balance = post.map((s) => ({ ...s, ...neto(s) })).filter((s) => s.d || s.h);
  const lineasReapertura: Linea[] = balance.map((s) => L(s.c, s.n, s.d, s.h));
  return { ingresos, gastos: gastosCierre, totIng, totGas, utilAntes, isr, neta, reserva, acumulada, lineasIsr, lineasCierre, lineasReapertura, balance };
}

/* ---------- Balanzas (HU-30) ---------- */
export type TipoBalanza = "antes" | "ajustada" | "posterior";
export function balanza(tipo: TipoBalanza) {
  const ajustes = PARTIDAS_CHERO.filter((p) => p.tipo === "Ajuste").flatMap((p) => p.lineas);
  const noAjustes = PARTIDAS_CHERO.filter((p) => p.tipo !== "Ajuste").flatMap((p) => p.lineas);
  const cierre = calcularCierre();
  let filas: { c: string; n: string; d: number; h: number }[];
  if (tipo === "antes") filas = sumar(noAjustes).map((s) => ({ ...s, ...neto(s) }));
  else if (tipo === "ajustada") filas = sumar([...noAjustes, ...ajustes, ...cierre.lineasIsr]).map((s) => ({ ...s, ...neto(s) }));
  else filas = cierre.balance;
  filas = filas.filter((f) => f.d || f.h);
  const d = filas.reduce((t, f) => t + f.d, 0), h = filas.reduce((t, f) => t + f.h, 0);
  return { filas, d, h, dif: d - h };
}

/* ---------- Hoja de trabajo de 10 columnas (HU-31) ---------- */
export type FilaHoja = { c: string; n: string; bcD: number; bcH: number; ajD: number; ajH: number; baD: number; baH: number; erD: number; erH: number; bgD: number; bgH: number };
export function hojaTrabajo() {
  const cierre = calcularCierre();
  const ajustes = sumar([...PARTIDAS_CHERO.filter((p) => p.tipo === "Ajuste").flatMap((p) => p.lineas), ...cierre.lineasIsr]);
  const antes = sumar(PARTIDAS_CHERO.filter((p) => p.tipo !== "Ajuste").flatMap((p) => p.lineas));
  const codigos = [...new Set([...antes, ...ajustes].map((s) => s.c))].sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
  const filas: FilaHoja[] = codigos.map((c) => {
    const a = antes.find((s) => s.c === c), j = ajustes.find((s) => s.c === c);
    const bc = neto(a ?? { d: 0, h: 0 });
    const aj = { d: j?.d ?? 0, h: j?.h ?? 0 };
    const ba = neto({ d: (a?.d ?? 0) + aj.d, h: (a?.h ?? 0) + aj.h });
    const esRes = /^[45]/.test(c);
    return {
      c, n: (a ?? j)!.n, bcD: bc.d, bcH: bc.h, ajD: aj.d, ajH: aj.h, baD: ba.d, baH: ba.h,
      erD: esRes ? ba.d : 0, erH: esRes ? ba.h : 0, bgD: esRes ? 0 : ba.d, bgH: esRes ? 0 : ba.h,
    };
  });
  const tot = (k: keyof FilaHoja) => filas.reduce((t, f) => t + (f[k] as number), 0);
  const sub = { bcD: tot("bcD"), bcH: tot("bcH"), ajD: tot("ajD"), ajH: tot("ajH"), baD: tot("baD"), baH: tot("baH"), erD: tot("erD"), erH: tot("erH"), bgD: tot("bgD"), bgH: tot("bgH") };
  // Utilidad cuadrada: lo que le falta al lado menor del estado de resultados y su contrapartida en el balance.
  const util = sub.erH - sub.erD; // positivo = utilidad
  const fin = {
    ...sub,
    erD: sub.erD + Math.max(util, 0), erH: sub.erH + Math.max(-util, 0),
    bgD: sub.bgD + Math.max(-util, 0), bgH: sub.bgH + Math.max(util, 0),
  };
  return { filas, sub, fin, util };
}

/* ---------- Libro diario (HU-25) ---------- */
export type FilaDiario =
  | { k: "vienen" | "pasan" | "total"; d: number; h: number; id: string }
  | { k: "cab"; p: PartidaChero; id: string }
  | { k: "linea"; l: Linea; p: PartidaChero; id: string };

/** Reparte el diario en folios de `porFolio` renglones, con «Vienen» y «Pasan» entre ellos. */
export function paginarDiario(partidas: PartidaChero[], porFolio = 16): FilaDiario[][] {
  const crudas: FilaDiario[] = partidas.flatMap((p) => [
    { k: "cab" as const, p, id: `c${p.num}` },
    ...p.lineas.map((l, i) => ({ k: "linea" as const, l, p, id: `l${p.num}-${i}` })),
  ]);
  const hojas: FilaDiario[][] = [];
  for (let i = 0; i < crudas.length; i += porFolio) hojas.push(crudas.slice(i, i + porFolio));
  let d = 0, h = 0;
  return hojas.map((hoja, i) => {
    const vienen = i > 0 ? [{ k: "vienen" as const, d, h, id: `v${i}` }] : [];
    for (const f of hoja) if (f.k === "linea") { d += cent(f.l.d); h += cent(f.l.h); }
    const cierre: FilaDiario = i < hojas.length - 1 ? { k: "pasan", d, h, id: `p${i}` } : { k: "total", d, h, id: "total" };
    return [...vienen, ...hoja, cierre];
  });
}

/* ---------- Libro mayor (HU-27 · HU-28 · HU-29) ---------- */
export type MovMayor = { num: number; fecha: string; concepto: string; estado: string; d: number; h: number; saldo: number };
export function mayorDe(cod: string) {
  let acum = 0;
  const movs: MovMayor[] = [];
  for (const p of PARTIDAS_CHERO) for (const l of p.lineas) if (l.c === cod) {
    acum += saldoNat(cod, cent(l.d), cent(l.h));
    movs.push({ num: p.num, fecha: p.fecha, concepto: p.concepto, estado: p.estado ?? "Contabilizada", d: cent(l.d), h: cent(l.h), saldo: acum });
  }
  const d = movs.reduce((t, m) => t + m.d, 0), h = movs.reduce((t, m) => t + m.h, 0);
  return { movs, d, h, saldo: saldoNat(cod, d, h) };
}
export const cuentasConMovimiento = () => sumar(todas());
/** Cuentas cuyo saldo final es contrario a su naturaleza (HU-29). */
export const saldosContrarios = () => cuentasConMovimiento().filter((s) => saldoNat(s.c, s.d, s.h) < 0);

/* ---------- Estados financieros (HU-37 · HU-38) ---------- */
const FIN_NOV = 20261130;
/** Saldos por cuenta de las partidas del caso entre dos fechas y, si se pide, de una sola sucursal.
 *  La provisión del ISR es de la empresa completa: solo entra en el consolidado. */
function saldosPeriodo(desde: number, hasta: number, suc: string): Map<string, Saldo> {
  const ps = PARTIDAS_CHERO.filter((p) => {
    const f = aNumFecha(p.fecha);
    return (isNaN(desde) || f >= desde) && (isNaN(hasta) || f <= hasta) && (!suc || p.suc === suc);
  });
  const lineas = ps.flatMap((p) => p.lineas);
  if (!suc && (isNaN(hasta) || hasta >= FIN_NOV)) lineas.push(...calcularCierre().lineasIsr);
  return new Map(sumar(lineas).map((s) => [s.c, s]));
}
const porClase = (m: Map<string, Saldo>, pref: string, excluir: string[] = []) =>
  [...m.values()].filter((s) => s.c.startsWith(pref) && !excluir.includes(s.c)).sort((a, b) => a.c.localeCompare(b.c, "en", { numeric: true }));
const valor = (s: Saldo) => saldoNat(s.c, s.d, s.h);
const total = (ls: Saldo[]) => ls.reduce((t, s) => t + valor(s), 0);

export function estadoResultados(desde: string, hasta: string, suc: string) {
  const m = saldosPeriodo(aNumFecha(desde), aNumFecha(hasta), suc);
  const ventas = porClase(m, "5101"), otros = porClase(m, "5", ["5101"]);
  const costo = porClase(m, "4104"), gastos = porClase(m, "4", ["4104", "4107"]), isr = porClase(m, "4107");
  const bruta = total(ventas) - total(costo);
  const operacion = bruta - total(gastos);
  const antesIsr = operacion + total(otros);
  const neta = antesIsr - total(isr);
  return { ventas, costo, gastos, otros, isr, bruta, operacion, antesIsr, neta, valor, total };
}

export function balanceGeneral(hasta: string, suc: string) {
  const m = saldosPeriodo(NaN, aNumFecha(hasta), suc);
  const corriente = porClase(m, "11"), noCorriente = porClase(m, "12"), pasivo = porClase(m, "2"), capital = porClase(m, "3");
  // En el activo todo se mide como debe − haber: la depreciación acumulada (acreedora) resta. Pasivo y patrimonio, al revés.
  const vBalance = (s: Saldo) => (s.c.startsWith("1") ? s.d - s.h : s.h - s.d);
  const tot = (ls: Saldo[]) => ls.reduce((t, s) => t + vBalance(s), 0);
  const resultado = [...m.values()].filter((s) => /^[45]/.test(s.c)).reduce((t, s) => t + (s.h - s.d), 0);
  const activo = tot(corriente) + tot(noCorriente);
  const pasivoMasPatrimonio = tot(pasivo) + tot(capital) + resultado;
  return { corriente, noCorriente, pasivo, capital, resultado, activo, pasivoMasPatrimonio, dif: activo - pasivoMasPatrimonio, valor: vBalance, total: tot };
}
