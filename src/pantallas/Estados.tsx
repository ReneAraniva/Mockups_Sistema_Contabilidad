import { useState } from "react";
import { FileDown } from "lucide-react";
import { useApp } from "../contexto";
import { PARAMS } from "../datos/parametros";
import { EMPRESA_CHERO, balanceGeneral, enDinero, estadoResultados, hojaTrabajo } from "../datos/libros";
import { Marco, Permiso } from "../marco/Marco";
import { Aviso, Boton, Campo, Casilla, Dialogo, Entrada, Pagina, Pestanas, Segmento, Selector, Tarjeta, Titulo, cx, dinero } from "../ui";
import { BarraFiltros, BotonExportar, Cifra, Cuadre, EncabezadoLibro, Nota, TablaCifras } from "../ui/reportes";

type Fila = { id: string; t: string; v?: number; nivel?: 0 | 1; fuerte?: boolean };
const SUCURSALES = ["Casa matriz", "Metrocentro"];
const NOTA = "Cifras ilustrativas del caso CheroPhonex";

const Estado = ({ filas }: { filas: Fila[] }) => (
  <TablaCifras<Fila>
    clave={(f) => f.id} filas={filas} totales={false}
    claseFila={(f) => (f.fuerte ? "font-bold bg-tarjeta2/60" : f.v === undefined ? "font-semibold" : undefined)}
    cols={[
      { clave: "t", titulo: "Concepto", ver: (f) => <span className={cx("block", f.nivel === 1 && "pl-6 text-texto2")}>{f.t}</span> },
      { clave: "v", titulo: "US$", tipo: "num", ver: (f) => (f.v === undefined ? null : <Cifra v={enDinero(f.v)} vacio="0.00" />) },
    ]}
  />
);

/** HU-37 · HU-38 · HU-39: estado de resultados y balance general, con exportación con firmas. */
export function Estados() {
  const { sucursal: activa } = useApp();
  const [tab, setTab] = useState<"er" | "bg">("er");
  const [ambito, setAmbito] = useState<"consolidado" | "sucursal">("consolidado");
  const [suc, setSuc] = useState(SUCURSALES[0]);
  const [desde, setDesde] = useState("01/11/2026");
  const [hasta, setHasta] = useState("30/11/2026");
  const [exportar, setExportar] = useState(false);
  const filtro = ambito === "consolidado" ? "" : suc;

  const er = estadoResultados(desde, hasta, filtro);
  const bg = balanceGeneral(hasta, filtro);
  const lineas = (ls: ReturnType<typeof estadoResultados>["ventas"], nivel: 1 = 1): Fila[] => ls.map((s) => ({ id: s.c, t: `${s.c} · ${s.n}`, v: er.valor(s), nivel }));
  const lineasB = (ls: typeof bg.corriente): Fila[] => ls.map((s) => ({ id: s.c, t: `${s.c} · ${s.n}`, v: bg.valor(s), nivel: 1 }));

  const filasEr: Fila[] = [
    { id: "h1", t: "Ventas" }, ...lineas(er.ventas), { id: "h2", t: "(−) Costo de ventas" }, ...lineas(er.costo),
    { id: "ub", t: "Utilidad bruta", v: er.bruta, fuerte: true },
    { id: "h3", t: "(−) Gastos de operación" }, ...lineas(er.gastos),
    { id: "uo", t: "Utilidad de operación", v: er.operacion, fuerte: true },
    ...(er.otros.length ? [{ id: "h4", t: "(+) Otros ingresos" }, ...lineas(er.otros)] : []),
    { id: "ua", t: "Utilidad antes del impuesto", v: er.antesIsr, fuerte: true },
    ...(filtro ? [] : [{ id: "isr", t: `(−) Impuesto sobre la renta ${PARAMS.isr}%`, v: er.total(er.isr) }]),
    { id: "un", t: filtro ? "Utilidad antes del impuesto de la sucursal" : er.neta >= 0 ? "Utilidad neta" : "Pérdida neta", v: filtro ? er.antesIsr : er.neta, fuerte: true },
  ];
  const filasBg: Fila[] = [
    { id: "a", t: "Activo corriente" }, ...lineasB(bg.corriente), { id: "ac", t: "Total activo corriente", v: bg.total(bg.corriente), fuerte: true },
    { id: "n", t: "Activo no corriente" }, ...lineasB(bg.noCorriente), { id: "anc", t: "Total activo no corriente", v: bg.total(bg.noCorriente), fuerte: true },
    { id: "ta", t: "TOTAL ACTIVO", v: bg.activo, fuerte: true },
    { id: "p", t: "Pasivo" }, ...lineasB(bg.pasivo), { id: "tp", t: "Total pasivo", v: bg.total(bg.pasivo), fuerte: true },
    { id: "c", t: "Patrimonio" }, ...lineasB(bg.capital), { id: "ur", t: bg.resultado >= 0 ? "Utilidad del período" : "Pérdida del período", v: bg.resultado, nivel: 1 },
    { id: "tpa", t: "Total patrimonio", v: bg.total(bg.capital) + bg.resultado, fuerte: true },
    { id: "tpp", t: "TOTAL PASIVO + PATRIMONIO", v: bg.pasivoMasPatrimonio, fuerte: true },
  ];

  const completo = !filtro && desde === "01/11/2026" && hasta === "30/11/2026";
  const coincide = completo && er.neta === hojaTrabajo().util;
  const periodo = tab === "er" ? `Del ${desde} al ${hasta}` : `Al ${hasta}`;
  const titulo = tab === "er" ? "Estado de resultados" : "Balance general";
  const [formato, setFormato] = useState<"PDF" | "Excel">("PDF");
  const [logo, setLogo] = useState(true);
  const [rep, setRep] = useState("Carlos Hernández");
  const [cont, setCont] = useState("María Rivas");
  const { avisar } = useApp();

  return (
    <Marco ruta={[{ t: "Libros y reportes" }, { t: "Estados financieros" }]}>
      <Pagina ancho="max-w-[1000px]">
        <Titulo t="Estados financieros" sub={`${PARAMS.formato === "clase" ? "Formato de clase" : "NIIF para las PYMES"} · se cambia en Parámetros`}>
          <Permiso roles={["admin", "contador"]}><Boton v="pri" onClick={() => setExportar(true)}><FileDown size={16} />Exportar con firmas</Boton></Permiso>
        </Titulo>
        <Pestanas valor={tab} onChange={setTab} opciones={[{ v: "er", t: "Estado de resultados" }, { v: "bg", t: "Balance general" }]} />
        <BarraFiltros desde={desde} hasta={hasta} onDesde={setDesde} onHasta={setHasta} exportar={<BotonExportar nombre={titulo} formatos={["PDF", "Excel"]} />}>
          <Segmento valor={ambito} onChange={setAmbito} opciones={[{ v: "consolidado", t: "Consolidado" }, { v: "sucursal", t: "Por sucursal" }]} />
          {ambito === "sucursal" && <Selector value={suc} onChange={(e) => setSuc(e.target.value)} className="h-10 w-auto" aria-label="Sucursal">{SUCURSALES.map((s) => <option key={s}>{s}</option>)}</Selector>}
        </BarraFiltros>
        {tab === "bg" && <p className="text-xs text-texto3 -mt-2">El balance es a la fecha «Hasta»; «Desde» solo aplica al estado de resultados.</p>}

        {tab === "er"
          ? coincide ? <Nota>Coincide al centavo con la hoja de trabajo · US$ {dinero(enDinero(er.neta))}</Nota> : null
          : <Cuadre d={bg.activo} h={bg.pasivoMasPatrimonio} etiqueta="Activo y pasivo más patrimonio" />}
        {tab === "er" && filtro && <Aviso>El impuesto sobre la renta se calcula para la empresa completa, por eso no aparece por sucursal.</Aviso>}

        <Tarjeta className="overflow-hidden">
          <EncabezadoLibro empresa={EMPRESA_CHERO} titulo={titulo} periodo={periodo} sucursal={filtro || `Consolidado · ${activa}`} nota={`${NOTA} · en dólares de EE. UU.`} />
          <Estado filas={tab === "er" ? filasEr : filasBg} />
        </Tarjeta>
      </Pagina>

      <Dialogo lateral abierto={exportar} onCerrar={() => setExportar(false)} titulo={`Exportar ${titulo.toLowerCase()}`} sub="Con espacios de firma para el propietario y el contador."
        pie={<><Boton v="fan" onClick={() => setExportar(false)}>Cancelar</Boton><Boton v="pri" onClick={() => { setExportar(false); avisar(`${titulo} exportado en ${formato} con firmas`); }}>Exportar en {formato}</Boton></>}>
        <Segmento valor={formato} onChange={setFormato} opciones={[{ v: "PDF", t: "PDF" }, { v: "Excel", t: "Excel" }]} />
        <Casilla checked={logo} onChange={setLogo} label="Incluir el logotipo de la empresa" />
        <Campo label="Propietario o representante legal"><Entrada value={rep} onChange={(e) => setRep(e.target.value)} /></Campo>
        <Campo label="Contador"><Entrada value={cont} onChange={(e) => setCont(e.target.value)} /></Campo>
        <div className="bg-fondo rounded-2xl p-4 grid gap-4 text-center text-sm">
          <div className="grid gap-0.5">
            {logo && <span className="mx-auto w-10 h-10 rounded-xl bg-tarjeta2 grid place-items-center text-xs font-bold">CP</span>}
            <b className="font-semibold">{EMPRESA_CHERO}</b><span>{titulo} · {periodo}</span><span className="text-texto3 text-xs">Expresado en dólares de EE. UU.</span>
          </div>
          <div className="grid grid-cols-2 gap-6 pt-6">
            {[[rep, "Representante legal"], [cont, "Contador"]].map(([n, r]) => (
              <div key={r} className="border-t border-bordef pt-2"><b className="font-semibold block">{n || "—"}</b><span className="text-texto3 text-xs">{r}</span></div>
            ))}
          </div>
        </div>
      </Dialogo>
    </Marco>
  );
}
