import { useMemo, useState } from "react";
import { FileDown, FilePlus2 } from "lucide-react";
import { useApp } from "../contexto";
import {
  EMPRESA_OFICIAL, PLANILLA_EMPLEADOS, TASAS_CASO, calcularPlanilla, diasAguinaldo, liquidacionEmpleado, redondear, suma, type FilaPlanilla,
} from "../datos/caso";
import { Marco, Permiso } from "../marco/Marco";
import { Aviso, Boton, Campo, Dialogo, Entrada, Etiqueta, Pagina, Pestanas, Selector, Tarjeta, Titulo, dinero } from "../ui";
import { BotonExportar, Cifra, EncabezadoLibro, TablaCifras, VistaPartida } from "../ui/reportes";

const num = (v: string) => { const n = parseFloat(v.replace(/,/g, "")); return isNaN(n) ? 0 : n; };
const MESES = ["Octubre 2026", "Septiembre 2026"];

/** Boleta de pago de un empleado, con los ajustes del período. */
function Boleta({ f }: { f: FilaPlanilla }) {
  const Fila = ({ k, v, fuerte }: { k: string; v: number; fuerte?: boolean }) => (
    <div className={`flex justify-between py-1.5 text-sm ${fuerte ? "font-bold border-t border-bordef mt-1 pt-2.5" : ""}`}><span className={fuerte ? "" : "text-texto2"}>{k}</span><span className="cifra">{dinero(v)}</span></div>
  );
  return (
    <div className="bg-fondo rounded-2xl p-5 grid gap-3">
      <div className="text-center"><b className="block text-xs tracking-[.08em] uppercase text-texto3">{EMPRESA_OFICIAL}</b><b className="block text-lg font-medium mt-0.5">Boleta de pago · octubre 2026</b><span className="text-sm text-texto2">{f.nombre} · {f.cargo}</span></div>
      <div>
        <b className="text-xs tracking-[.08em] uppercase text-texto3">Ingresos</b>
        <Fila k="Sueldo base" v={f.salario} />
        <b className="text-xs tracking-[.08em] uppercase text-texto3 block mt-3">Descuentos</b>
        <Fila k={`ISSS ${TASAS_CASO.isssLab} %`} v={f.isss} /><Fila k={`AFP ${TASAS_CASO.afpLab} %`} v={f.afp} /><Fila k="Impuesto sobre la renta" v={f.renta} />
        <Fila k="Líquido a pagar" v={f.liquido} fuerte />
      </div>
    </div>
  );
}

/** HU-72 · HU-73: planilla del período, cuotas patronales, boletas y partida. */
export function Planilla() {
  const { avisar } = useApp();
  const [mes, setMes] = useState(MESES[0]);
  const [tab, setTab] = useState<"empleado" | "patronal" | "gasto">("empleado");
  const [sel, setSel] = useState<FilaPlanilla | null>(null);
  const [horas, setHoras] = useState("0"), [desc, setDesc] = useState("0"), [aus, setAus] = useState("0");
  const [partida, setPartida] = useState(false);
  const [hecha, setHecha] = useState(false);
  const hay = mes === MESES[0];
  const filas = hay ? calcularPlanilla() : [];
  const t = (f: (x: FilaPlanilla) => number) => suma(filas.map(f));

  /* ajuste del empleado elegido: horas extra al doble, ausencias a razón de salario/30 */
  const ajustada = useMemo(() => {
    if (!sel) return null;
    const extra = redondear((sel.salario / 30 / 8) * num(horas) * 2);
    const ausencia = redondear((sel.salario / 30) * num(aus));
    const [r] = calcularPlanilla([{ ...sel, salario: redondear(sel.salario + extra - ausencia) }]);
    const liquido = redondear(r.liquido - num(desc));
    return { ...r, extra, ausencia, descuentos: num(desc), liquido, nombre: sel.nombre, cargo: sel.cargo };
  }, [sel, horas, aus, desc]);

  const adm = filas.filter((f) => f.area === "Administración"), ven = filas.filter((f) => f.area === "Ventas");
  const gasto = (l: FilaPlanilla[]) => suma(l.map((f) => f.salario + f.cuotaPat + f.vacaciones + f.aguinaldo));
  const lineas = [
    { c: "4201", n: "Gastos de Administración · sueldos y prestaciones", d: gasto(adm), h: 0 },
    { c: "4202", n: "Gastos de Venta · sueldos y prestaciones", d: gasto(ven), h: 0 },
    { c: "2106", n: "Retenciones por Pagar · ISSS y AFP de empleados", d: 0, h: t((f) => f.isss + f.afp) },
    { c: "2107", n: "Obligaciones con empleados · cuotas patronales y provisiones", d: 0, h: t((f) => f.cuotaPat + f.vacaciones + f.aguinaldo) },
    { c: "11010301", n: "Banco Agrícola · líquido a pagar", d: 0, h: t((f) => f.liquido) },
  ];

  return (
    <Marco ruta={[{ t: "Planilla" }, { t: "Planilla y boletas" }]}>
      <Pagina>
        <Titulo t="Planilla y boletas" sub="Cálculo del período con ISSS, AFP y renta; cuotas patronales y provisiones">
          <Permiso roles={["admin", "contador"]}>
            <Boton onClick={() => avisar("Boletas del mes generadas en un solo PDF")} disabled={!hay}><FileDown size={16} />Boletas en lote</Boton>
            <Boton v="pri" disabled={!hay || hecha} onClick={() => setPartida(true)}><FilePlus2 size={16} />Generar partida de planilla</Boton>
          </Permiso>
        </Titulo>
        <Tarjeta className="p-4 flex flex-wrap items-end gap-3">
          <label className="grid gap-1.5 text-sm font-semibold">Período
            <Selector value={mes} onChange={(e) => setMes(e.target.value)} className="h-10 w-[200px]">{MESES.map((m) => <option key={m}>{m}</option>)}</Selector></label>
          <div className="flex-1" />
          {hecha ? <Etiqueta t="contab">Partida generada</Etiqueta> : <Etiqueta t="borrador">Sin partida</Etiqueta>}
          <BotonExportar nombre="Planilla" formatos={["PDF", "Excel"]} />
        </Tarjeta>
        <Pestanas valor={tab} onChange={setTab} opciones={[{ v: "empleado", t: "Por empleado" }, { v: "patronal", t: "Cuotas patronales y provisiones" }, { v: "gasto", t: "Distribución del gasto" }]} />
        <Tarjeta className="overflow-hidden">
          <EncabezadoLibro empresa={EMPRESA_OFICIAL} titulo={`Planilla de sueldos · ${mes}`} periodo="Valores en US$" sucursal="Todas las sucursales" folio="8" />
          {tab === "empleado" && (
            <TablaCifras<FilaPlanilla> clave={(f) => String(f.n)} filas={filas} fijarPrimera vacio="Este mes no tiene planilla." onFila={(f) => { setSel(f); setHoras("0"); setDesc("0"); setAus("0"); }}
              tarjeta={(f) => ({ meta: `${f.cargo} · ${f.area}`, titulo: f.nombre, valor: dinero(f.liquido), detalle: `Salario ${dinero(f.salario)} · retenciones ${dinero(f.retenciones)}` })}
              cols={[
                { clave: "n", titulo: "Empleado", ver: (f) => <span className="block min-w-[220px]"><b className="font-semibold block">{f.nombre}</b><span className="text-xs text-texto2">{f.cargo} · {f.area}</span></span> },
                { clave: "s", titulo: "Salario", tipo: "num", total: t((f) => f.salario), ver: (f) => <Cifra v={f.salario} /> },
                { clave: "i", titulo: "ISSS 3 %", tipo: "num", total: t((f) => f.isss), ver: (f) => <Cifra v={f.isss} /> },
                { clave: "a", titulo: "AFP 7.25 %", tipo: "num", total: t((f) => f.afp), ver: (f) => <Cifra v={f.afp} /> },
                { clave: "b", titulo: "Base para renta", tipo: "num", total: t((f) => f.base), ver: (f) => <Cifra v={f.base} /> },
                { clave: "r", titulo: "Renta", tipo: "num", total: t((f) => f.renta), ver: (f) => <Cifra v={f.renta} /> },
                { clave: "tr", titulo: "Total retenciones", tipo: "num", total: t((f) => f.retenciones), ver: (f) => <Cifra v={f.retenciones} /> },
                { clave: "l", titulo: "Líquido a pagar", tipo: "num", total: t((f) => f.liquido), ver: (f) => <Cifra v={f.liquido} className="font-semibold" /> },
              ]} />
          )}
          {tab === "patronal" && (
            <TablaCifras<FilaPlanilla> clave={(f) => String(f.n)} filas={filas} vacio="Este mes no tiene planilla."
              tarjeta={(f) => ({ meta: f.cargo, titulo: f.nombre, valor: dinero(f.cuotaPat), detalle: `Vacaciones ${dinero(f.vacaciones)} · aguinaldo ${dinero(f.aguinaldo)}` })}
              cols={[
                { clave: "n", titulo: "Empleado", ver: (f) => <span className="block max-w-[260px] truncate">{f.nombre}</span> },
                { clave: "i", titulo: "ISSS patronal 7.5 %", tipo: "num", total: t((f) => f.isssPat), ver: (f) => <Cifra v={f.isssPat} /> },
                { clave: "a", titulo: "AFP patronal 8.75 %", tipo: "num", total: t((f) => f.afpPat), ver: (f) => <Cifra v={f.afpPat} /> },
                { clave: "c", titulo: "Total cuota patronal", tipo: "num", total: t((f) => f.cuotaPat), ver: (f) => <Cifra v={f.cuotaPat} /> },
                { clave: "v", titulo: "Provisión vacaciones", tipo: "num", total: t((f) => f.vacaciones), ver: (f) => <Cifra v={f.vacaciones} /> },
                { clave: "g", titulo: "Provisión aguinaldo", tipo: "num", total: t((f) => f.aguinaldo), ver: (f) => <Cifra v={f.aguinaldo} /> },
              ]} />
          )}
          {tab === "gasto" && (
            <TablaCifras<{ a: string; l: FilaPlanilla[] }> clave={(x) => x.a} filas={hay ? [{ a: "Gastos de administración", l: adm }, { a: "Gastos de venta", l: ven }] : []} vacio="Este mes no tiene planilla."
              cols={[
                { clave: "a", titulo: "Área", ver: (x) => x.a },
                { clave: "s", titulo: "Sueldos", tipo: "num", total: t((f) => f.salario), ver: (x) => <Cifra v={suma(x.l.map((f) => f.salario))} /> },
                { clave: "i", titulo: "ISSS patronal", tipo: "num", total: t((f) => f.isssPat), ver: (x) => <Cifra v={suma(x.l.map((f) => f.isssPat))} /> },
                { clave: "p", titulo: "AFP patronal", tipo: "num", total: t((f) => f.afpPat), ver: (x) => <Cifra v={suma(x.l.map((f) => f.afpPat))} /> },
                { clave: "v", titulo: "Vacaciones", tipo: "num", total: t((f) => f.vacaciones), ver: (x) => <Cifra v={suma(x.l.map((f) => f.vacaciones))} /> },
                { clave: "g", titulo: "Aguinaldo", tipo: "num", total: t((f) => f.aguinaldo), ver: (x) => <Cifra v={suma(x.l.map((f) => f.aguinaldo))} /> },
              ]} />
          )}
        </Tarjeta>
        <p className="text-xs text-texto3">Tasas vigentes: ISSS laboral {TASAS_CASO.isssLab} % con techo de US$ {dinero(TASAS_CASO.techoIsss)}, AFP laboral {TASAS_CASO.afpLab} %. Se editan en Empleados y tasas.</p>
      </Pagina>

      <Dialogo lateral abierto={!!sel} onCerrar={() => setSel(null)} titulo={sel?.nombre ?? ""} sub="Ajustes del período y boleta de pago."
        pie={<><Boton v="fan" onClick={() => setSel(null)}>Cerrar</Boton><Boton v="pri" onClick={() => { avisar(`Boleta de ${sel?.nombre} generada en PDF`); setSel(null); }}><FileDown size={16} />Boleta en PDF</Boton></>}>
        <div className="grid grid-cols-3 gap-3">
          <Campo label="Horas extra"><Entrada value={horas} onChange={(e) => setHoras(e.target.value)} inputMode="decimal" className="cifra" /></Campo>
          <Campo label="Días de ausencia"><Entrada value={aus} onChange={(e) => setAus(e.target.value)} inputMode="decimal" className="cifra" /></Campo>
          <Campo label="Otros descuentos"><Entrada value={desc} onChange={(e) => setDesc(e.target.value)} inputMode="decimal" className="cifra" /></Campo>
        </div>
        <p className="text-xs text-texto3 -mt-2">Las horas extra se pagan al doble y cada ausencia descuenta 1/30 del sueldo.</p>
        {ajustada && <Boleta f={ajustada} />}
        {ajustada && (ajustada.extra > 0 || ajustada.ausencia > 0) && <Aviso>Con los ajustes, el salario del mes queda en US$ {dinero(ajustada.salario)}.</Aviso>}
      </Dialogo>

      <Dialogo lateral abierto={partida} onCerrar={() => setPartida(false)} titulo="Generar la partida de planilla" sub="Se crea ya contabilizada en octubre de 2026. Revísala antes de confirmar."
        pie={<><Boton v="fan" onClick={() => setPartida(false)}>Cancelar</Boton><Boton v="pri" onClick={() => { setHecha(true); setPartida(false); avisar("Partida de planilla generada y contabilizada"); }}>Confirmar y contabilizar</Boton></>}>
        <VistaPartida lineas={lineas} borrador={false} />
      </Dialogo>
    </Marco>
  );
}

/** HU-74: provisión mensual de vacaciones y aguinaldo, y liquidación de un empleado que se retira. */
export function Prestaciones() {
  const { avisar } = useApp();
  const [tab, setTab] = useState<"prov" | "liq">("prov");
  const [emp, setEmp] = useState(PLANILLA_EMPLEADOS[1].nombre);
  const [retiro, setRetiro] = useState("31/12/2026");
  const filas = calcularPlanilla();
  const e = PLANILLA_EMPLEADOS.find((x) => x.nombre === emp)!;
  const l = liquidacionEmpleado(e.salario, e.ingreso, retiro);
  const ok = /^\d{2}\/\d{2}\/\d{4}$/.test(retiro) && l.dias > 0;
  const provV = suma(filas.map((f) => f.vacaciones)), provA = suma(filas.map((f) => f.aguinaldo));
  return (
    <Marco ruta={[{ t: "Planilla" }, { t: "Prestaciones" }]}>
      <Pagina ancho="max-w-[1000px]">
        <Titulo t="Prestaciones" sub="Vacaciones, aguinaldo e indemnización: provisión mensual y liquidación" />
        <Pestanas valor={tab} onChange={setTab} opciones={[{ v: "prov", t: "Provisión mensual" }, { v: "liq", t: "Liquidación de un empleado" }]} />
        <Aviso>Vacación de 15 días más 30 % de recargo. Aguinaldo: {diasAguinaldo(0)} días con menos de 3 años, {diasAguinaldo(3)} de 3 a 10 y {diasAguinaldo(10)} con 10 o más. Se configuran en Parámetros. La provisión del mes va dentro de la partida de planilla.</Aviso>
        {tab === "prov" ? (
          <Tarjeta className="overflow-hidden">
            <EncabezadoLibro empresa={EMPRESA_OFICIAL} titulo="Provisión de prestaciones" periodo="Octubre 2026" sucursal="Todas las sucursales" nota="Se contabiliza junto con la planilla" />
            <TablaCifras<FilaPlanilla> clave={(f) => String(f.n)} filas={filas}
              tarjeta={(f) => ({ meta: f.cargo, titulo: f.nombre, valor: dinero(f.vacaciones + f.aguinaldo), detalle: `Vacaciones ${dinero(f.vacaciones)} · aguinaldo ${dinero(f.aguinaldo)}` })}
              cols={[
                { clave: "n", titulo: "Empleado", ver: (f) => <span className="block max-w-[260px] truncate">{f.nombre}</span> },
                { clave: "s", titulo: "Salario", tipo: "num", ver: (f) => <Cifra v={f.salario} /> },
                { clave: "v", titulo: "Vacaciones del mes", tipo: "num", total: provV, ver: (f) => <Cifra v={f.vacaciones} /> },
                { clave: "a", titulo: "Aguinaldo del mes", tipo: "num", total: provA, ver: (f) => <Cifra v={f.aguinaldo} /> },
                { clave: "t", titulo: "Total", tipo: "num", total: suma([provV, provA]), ver: (f) => <Cifra v={redondear(f.vacaciones + f.aguinaldo)} className="font-semibold" /> },
              ]} />
          </Tarjeta>
        ) : (
          <Tarjeta className="p-5 grid gap-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <Campo label="Empleado"><Selector value={emp} onChange={(x) => setEmp(x.target.value)}>{PLANILLA_EMPLEADOS.map((x) => <option key={x.n}>{x.nombre}</option>)}</Selector></Campo>
              <Campo label="Fecha de retiro" error={!ok ? "Escribe una fecha posterior al ingreso (dd/mm/aaaa)." : undefined}><Entrada value={retiro} onChange={(x) => setRetiro(x.target.value)} mal={!ok} className="cifra" /></Campo>
            </div>
            <p className="text-sm text-texto2">Ingreso el {e.ingreso} · {e.cargo} · salario US$ {dinero(e.salario)} · {ok ? `${l.dias} días (${l.anios.toFixed(2)} años)` : "—"}</p>
            {ok && (
              <div className="rounded-2xl border border-borde overflow-hidden">
                <TablaCifras<{ t: string; v: number; n: string }> clave={(x) => x.t} filas={[
                  { t: "Vacaciones proporcionales", v: l.vacaciones, n: "15 días + 30 %" },
                  { t: "Aguinaldo proporcional", v: l.aguinaldo, n: `${diasAguinaldo(l.anios)} días` },
                  { t: "Indemnización", v: l.indemnizacion, n: "Un salario por año de servicio, proporcional" },
                ]} totales="Total a liquidar"
                  cols={[{ clave: "t", titulo: "Concepto", ver: (x) => x.t }, { clave: "n", titulo: "Base", ver: (x) => <span className="text-texto2">{x.n}</span> }, { clave: "v", titulo: "US$", tipo: "num", total: l.total, ver: (x) => <Cifra v={x.v} /> }]} />
              </div>
            )}
            <Permiso roles={["admin", "contador"]}><div className="flex justify-end"><Boton v="pri" disabled={!ok} onClick={() => avisar("Liquidación registrada y partida generada en borrador")}>Registrar liquidación</Boton></div></Permiso>
          </Tarjeta>
        )}
      </Pagina>
    </Marco>
  );
}
