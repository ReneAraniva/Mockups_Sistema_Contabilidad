import { useState } from "react";
import { BALANCE_OCT, EMPRESA_OFICIAL, RESULTADO, RETIROS, flujoEfectivo, redondear, suma } from "../datos/caso";
import { Marco } from "../marco/Marco";
import { Aviso, Pagina, Pestanas, Segmento, Selector, Tarjeta, Titulo, cx, dinero } from "../ui";
import { BotonExportar, Cifra, EncabezadoLibro, Nota, TablaCifras } from "../ui/reportes";

type Formato = "clase" | "niif";
const NOMBRES: Record<Formato, { er: string; bg: string }> = {
  clase: { er: "Estado de resultados", bg: "Balance general" },
  niif: { er: "Estado del resultado integral", bg: "Estado de situación financiera" },
};
const PERIODOS = ["Octubre 2026", "Septiembre 2026"];

type Fila = { id: string; t: string; v: number[]; fuerte?: boolean; sub?: boolean };

/** HU-40 · HU-41 · HU-42 · HU-43: patrimonio, flujo de efectivo, formato y comparativos. */
export function EstadosAdicionales() {
  const [tab, setTab] = useState<"pat" | "flujo" | "comp">("pat");
  const [formato, setFormato] = useState<Formato>("clase");
  const [tipo, setTipo] = useState<"socios" | "sociedad">("socios");
  const [que, setQue] = useState<"bg" | "er">("bg");
  const [a, setA] = useState(PERIODOS[0]), [b, setB] = useState(PERIODOS[1]);
  const flujo = flujoEfectivo();
  const nom = NOMBRES[formato];

  /* ---- patrimonio ---- */
  const cols = tipo === "socios" ? ["Capital", "Utilidad del ejercicio", "Retiros del titular"] : ["Capital social", "Reserva legal", "Utilidades", "Retiros"];
  const mk = (t: string, capital: number, util: number, ret: number, fuerte?: boolean): Fila => ({ id: t, t, fuerte, v: tipo === "socios" ? [capital, util, ret] : [capital, 0, util, ret] });
  const filasPat: Fila[] = [
    mk("Saldo al 1 de octubre de 2026", 0, 0, 0, true),
    mk("Aportes de los socios", 22500, 0, 0),
    mk("Resultado del ejercicio", 0, RESULTADO.neta, 0),
    mk("Retiros del titular", 0, 0, -RETIROS),
    mk("Saldo al 31 de octubre de 2026", 22500, RESULTADO.neta, -RETIROS, true),
  ];
  const totalFila = (f: Fila) => suma(f.v);

  /* ---- comparativos ---- */
  const bgOct = (p: string): number[] => {
    const x = p === PERIODOS[0] ? { ef: BALANCE_OCT.efectivo, inv: BALANCE_OCT.inventarios, ant: BALANCE_OCT.anticipados, cxc: BALANCE_OCT.cxc, mob: BALANCE_OCT.mobiliario, dep: -BALANCE_OCT.depreciacion, pas: BALANCE_OCT.pasivo, cap: BALANCE_OCT.capital, res: BALANCE_OCT.utilidad - BALANCE_OCT.retiros }
      : { ef: 0, inv: 0, ant: 0, cxc: 0, mob: 0, dep: 0, pas: 0, cap: 0, res: 0 };
    return [x.ef, x.inv, x.ant, x.cxc, x.mob, x.dep, x.pas, x.cap, x.res];
  };
  const etiquetasBg = ["Efectivo y equivalentes", "Inventarios", "Gastos pagados por anticipado", "Otras cuentas por cobrar", "Mobiliario y equipo", "(−) Depreciación acumulada", "Total pasivo", "Capital", "Resultado del ejercicio menos retiros"];
  const erVal = (p: string) => (p === PERIODOS[0] ? [RESULTADO.ventasCcf, RESULTADO.ventasCf, RESULTADO.ventas, -RESULTADO.costo, RESULTADO.bruta, -RESULTADO.admin, -RESULTADO.venta, RESULTADO.operacion, -RESULTADO.financieros, RESULTADO.neta] : new Array(10).fill(0));
  const etiquetasEr = ["Ventas a contribuyentes", "Ventas a consumidor final", "Ventas netas", "(−) Costo de ventas", "Utilidad bruta", "(−) Gastos de administración", "(−) Gastos de venta", "Utilidad de operación", "(−) Costos financieros", "Utilidad del ejercicio"];
  const fuertes = new Set(["Ventas netas", "Utilidad bruta", "Utilidad de operación", "Utilidad del ejercicio", "Total pasivo"]);
  const A = que === "bg" ? bgOct(a) : erVal(a), B = que === "bg" ? bgOct(b) : erVal(b);
  const etiquetas = que === "bg" ? etiquetasBg : etiquetasEr;
  const filasComp: Fila[] = etiquetas.map((t, i) => ({ id: t, t, v: [A[i], B[i], redondear(A[i] - B[i])], fuerte: fuertes.has(t) }));
  const pct = (f: Fila) => (f.v[1] === 0 ? "n/a" : `${(((f.v[0] - f.v[1]) / Math.abs(f.v[1])) * 100).toFixed(1)} %`);

  return (
    <Marco ruta={[{ t: "Libros y reportes" }, { t: "Patrimonio, flujo y comparativos" }]}>
      <Pagina ancho="max-w-[1100px]">
        <Titulo t="Patrimonio, flujo y comparativos" sub="Estado de cambios en el patrimonio, flujo de efectivo y comparación entre períodos">
          <BotonExportar nombre="Estado financiero" formatos={["PDF", "Excel"]} />
        </Titulo>
        <Tarjeta className="p-4 flex flex-wrap items-center gap-4">
          <div className="grid gap-1.5 text-sm font-semibold">Formato de presentación
            <Segmento valor={formato} onChange={setFormato} opciones={[{ v: "clase", t: "Formato de clase" }, { v: "niif", t: "NIIF para las PYMES" }]} /></div>
          <p className="text-sm text-texto2 flex-1 min-w-[240px]">El formato se elige al generar el estado. Ambos dan las mismas cifras: cambian los nombres y el orden.</p>
        </Tarjeta>
        <Pestanas valor={tab} onChange={setTab} opciones={[{ v: "pat", t: "Cambios en el patrimonio" }, { v: "flujo", t: "Flujo de efectivo" }, { v: "comp", t: "Comparativos" }]} />

        {tab === "pat" && (
          <>
            <div className="flex flex-wrap items-center gap-3"><span className="text-sm font-semibold">Tipo de contribuyente</span>
              <Segmento valor={tipo} onChange={setTipo} opciones={[{ v: "socios", t: "Empresa de socios" }, { v: "sociedad", t: "Sociedad anónima" }]} /></div>
            {tipo === "sociedad" && <Aviso>En una sociedad la reserva legal (7 % de la utilidad) se separa al cerrar el ejercicio, no al cerrar un mes; por eso octubre no la muestra.</Aviso>}
            <Tarjeta className="overflow-hidden">
              <EncabezadoLibro empresa={EMPRESA_OFICIAL} titulo="Estado de cambios en el patrimonio" periodo="Del 1 al 31 de octubre de 2026" sucursal="Todas las sucursales" nota="Valores en US$" />
              <TablaCifras<Fila> clave={(f) => f.id} filas={filasPat} totales={false}
                tarjeta={(f) => ({ meta: cols.filter((_, i) => f.v[i]).join(" · ") || "Sin movimientos", titulo: f.t, valor: dinero(totalFila(f)) })}
                claseFila={(f) => (f.fuerte ? "font-bold bg-tarjeta2/60" : undefined)}
                cols={[
                  { clave: "t", titulo: "Concepto", ver: (f) => f.t },
                  ...cols.map((c, i) => ({ clave: c, titulo: c, tipo: "num" as const, ver: (f: Fila) => <Cifra v={f.v[i]} vacio="0.00" /> })),
                  { clave: "tot", titulo: "Total patrimonio", tipo: "num" as const, ver: (f: Fila) => <Cifra v={totalFila(f)} vacio="0.00" className="font-semibold" /> },
                ]} />
            </Tarjeta>
            <Nota>Coincide con el patrimonio del {nom.bg.toLowerCase()} · US$ {dinero(BALANCE_OCT.patrimonio)}</Nota>
          </>
        )}

        {tab === "flujo" && (
          <>
            <Tarjeta className="overflow-hidden">
              <EncabezadoLibro empresa={EMPRESA_OFICIAL} titulo="Estado de flujo de efectivo · método indirecto" periodo="Del 1 al 31 de octubre de 2026" sucursal="Todas las sucursales" nota="Valores en US$" />
              <TablaCifras<{ id: string; t: string; v?: number; fuerte?: boolean; sub?: boolean }> clave={(f) => f.id} totales={false} claseFila={(f) => (f.fuerte ? "font-bold bg-tarjeta2/60" : f.v === undefined ? "font-semibold" : undefined)}
                filas={[
                  { id: "h1", t: "Actividades de operación" }, ...flujo.operacion.map((o) => ({ id: o.t, t: o.t, v: o.v, sub: true })), { id: "t1", t: "Efectivo neto de actividades de operación", v: flujo.totalOp, fuerte: true },
                  { id: "h2", t: "Actividades de inversión" }, { id: "n2", t: "El mobiliario se aportó en especie: no mueve efectivo", v: 0, sub: true }, { id: "t2", t: "Efectivo neto de actividades de inversión", v: flujo.totalInv, fuerte: true },
                  { id: "h3", t: "Actividades de financiamiento" }, ...flujo.financiamiento.map((o) => ({ id: o.t, t: o.t, v: o.v, sub: true })), { id: "t3", t: "Efectivo neto de actividades de financiamiento", v: flujo.totalFin, fuerte: true },
                  { id: "v", t: "Variación neta del efectivo", v: flujo.variacion, fuerte: true },
                  { id: "i", t: "Efectivo al inicio del período", v: flujo.inicial }, { id: "f", t: "Efectivo al final del período", v: flujo.final, fuerte: true },
                ]}
                cols={[
                  { clave: "t", titulo: "Concepto", ver: (f) => <span className={cx("block", f.sub && "pl-6 text-texto2")}>{f.t}</span> },
                  { clave: "v", titulo: "US$", tipo: "num", ver: (f) => (f.v === undefined ? null : <Cifra v={f.v} vacio="0.00" />) },
                ]} />
            </Tarjeta>
            <Nota>La variación neta coincide con Efectivo y equivalentes del balance · US$ {dinero(BALANCE_OCT.efectivo)}</Nota>
          </>
        )}

        {tab === "comp" && (
          <>
            <Tarjeta className="p-4 flex flex-wrap items-end gap-3">
              <Segmento valor={que} onChange={setQue} opciones={[{ v: "bg", t: nom.bg }, { v: "er", t: nom.er }]} />
              <label className="grid gap-1.5 text-sm font-semibold">Período A<Selector value={a} onChange={(e) => setA(e.target.value)} className="h-10 w-[180px]">{PERIODOS.map((p) => <option key={p}>{p}</option>)}</Selector></label>
              <label className="grid gap-1.5 text-sm font-semibold">Período B<Selector value={b} onChange={(e) => setB(e.target.value)} className="h-10 w-[180px]">{PERIODOS.map((p) => <option key={p}>{p}</option>)}</Selector></label>
            </Tarjeta>
            <Aviso>La empresa inició operaciones en octubre de 2026, por eso septiembre no tiene movimientos y la variación porcentual se muestra como «n/a».</Aviso>
            <Tarjeta className="overflow-hidden">
              <EncabezadoLibro empresa={EMPRESA_OFICIAL} titulo={`${que === "bg" ? nom.bg : nom.er} comparativo`} periodo={`${a} frente a ${b}`} sucursal="Todas las sucursales" nota="Valores en US$" />
              <TablaCifras<Fila> clave={(f) => f.id} filas={filasComp} totales={false} claseFila={(f) => (f.fuerte ? "font-bold bg-tarjeta2/60" : undefined)}
                tarjeta={(f) => ({ meta: pct(f), titulo: f.t, valor: dinero(f.v[0]), detalle: `${b}: ${dinero(f.v[1])} · variación ${dinero(f.v[2])}` })}
                cols={[
                  { clave: "t", titulo: "Concepto", ver: (f) => f.t },
                  { clave: "a", titulo: a, tipo: "num", ver: (f) => <Cifra v={f.v[0]} vacio="0.00" /> },
                  { clave: "b", titulo: b, tipo: "num", ver: (f) => <Cifra v={f.v[1]} vacio="0.00" /> },
                  { clave: "d", titulo: "Variación US$", tipo: "num", ver: (f) => <Cifra v={f.v[2]} vacio="0.00" /> },
                  { clave: "p", titulo: "Variación %", tipo: "num", ver: (f) => <span className="cifra text-texto2">{pct(f)}</span> },
                ]} />
            </Tarjeta>
          </>
        )}
      </Pagina>
    </Marco>
  );
}
