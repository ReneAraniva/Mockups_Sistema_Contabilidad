import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, TriangleAlert } from "lucide-react";
import { useApp } from "../contexto";
import { PARTIDAS_CHERO } from "../datos/ejemplo";
import { EMPRESA_CHERO, aNumFecha, cuentasConMovimiento, enDinero, mayorDe, naturaleza, paginarDiario, saldosContrarios, type FilaDiario, type MovMayor } from "../datos/libros";
import { Marco } from "../marco/Marco";
import { Aviso, Boton, Etiqueta, Pagina, Segmento, Selector, Tarjeta, Titulo, cx, dinero } from "../ui";
import { BarraFiltros, BotonExportar, Cifra, EncabezadoLibro, TablaCifras } from "../ui/reportes";

const NOTA = "Cifras ilustrativas del caso CheroPhonex";

/** Filtra las partidas del caso por el rango de fechas escrito; si una fecha está incompleta no se filtra por ella. */
function enRango(desde: string, hasta: string) {
  const a = aNumFecha(desde), b = aNumFecha(hasta);
  return PARTIDAS_CHERO.filter((p) => { const f = aNumFecha(p.fecha); return (isNaN(a) || f >= a) && (isNaN(b) || f <= b); });
}
const etqEstado = (e: string) => (e === "Anulada" ? <Etiqueta t="anulada">Anulada</Etiqueta> : null);

/* ======================= HU-25 Libro diario ======================= */
export function LibroDiario() {
  const { sucursal } = useApp();
  const [desde, setDesde] = useState("01/11/2026");
  const [hasta, setHasta] = useState("30/11/2026");
  const [hoja, setHoja] = useState(0);
  const folios = useMemo(() => paginarDiario(enRango(desde, hasta)), [desde, hasta]);
  const i = Math.min(hoja, Math.max(folios.length - 1, 0));
  const filas = folios[i] ?? [];

  const sobreTabla = (f: FilaDiario) => f.k === "vienen" || f.k === "pasan" || f.k === "total";
  return (
    <Marco ruta={[{ t: "Libros y reportes" }, { t: "Libro diario" }]}>
      <Pagina ancho="max-w-[1100px]">
        <Titulo t="Libro diario" sub="Partidas en orden cronológico, en el formato de clase" />
        <BarraFiltros desde={desde} hasta={hasta} onDesde={(v) => { setDesde(v); setHoja(0); }} onHasta={(v) => { setHasta(v); setHoja(0); }}
          exportar={<BotonExportar nombre="Libro diario" />} />
        <Tarjeta className="overflow-hidden">
          <EncabezadoLibro empresa={EMPRESA_CHERO} titulo="Libro diario" periodo={`Del ${desde} al ${hasta}`} sucursal={`Consolidado · ${sucursal}`} folio={folios.length ? `${i + 1} de ${folios.length}` : undefined} nota={NOTA} />
          <TablaCifras<FilaDiario>
            clave={(f) => f.id} filas={filas} totales={false} vacio="No hay partidas en el rango de fechas elegido."
            claseFila={(f) => sobreTabla(f) && "font-bold bg-tarjeta2/60"}
            cols={[
              { clave: "f", titulo: "Fecha", ver: (f) => f.k === "cab" ? <span className="cifra whitespace-nowrap">{f.p.fecha}</span> : null, ancho: "w-28" },
              { clave: "n", titulo: "Partida", ver: (f) => f.k === "cab" ? <span className="cifra font-semibold">N.º {f.p.num}</span> : null, ancho: "w-24" },
              { clave: "c", titulo: "Código y cuenta", ver: (f) => {
                if (f.k === "cab") return <span className="flex items-center gap-2 flex-wrap font-semibold">{f.p.concepto}<span className="text-xs text-texto3 font-normal">{f.p.tipo}</span>{etqEstado(f.p.estado ?? "")}</span>;
                if (f.k === "linea") return <span className={cx("block", f.l.h > 0 && "pl-8")}><span className="cifra text-texto3 mr-2">{f.l.c}</span>{f.l.n}</span>;
                return <span className="block text-right uppercase tracking-[.08em] text-xs">{f.k === "vienen" ? "Vienen" : f.k === "pasan" ? "Pasan" : "Suma total"}</span>;
              } },
              { clave: "d", titulo: "Debe", tipo: "num", ver: (f) => f.k === "linea" ? <Cifra v={f.l.d} /> : f.k === "cab" ? null : <span className="cifra">{dinero(enDinero(f.d))}</span> },
              { clave: "h", titulo: "Haber", tipo: "num", ver: (f) => f.k === "linea" ? <Cifra v={f.l.h} /> : f.k === "cab" ? null : <span className="cifra">{dinero(enDinero(f.h))}</span> },
            ]}
          />
        </Tarjeta>
        {folios.length > 1 && (
          <div className="flex items-center justify-between gap-3">
            <Boton disabled={i === 0} onClick={() => setHoja(i - 1)}><ChevronLeft size={16} />Folio anterior</Boton>
            <span className="text-sm text-texto2 cifra">Folio {i + 1} de {folios.length}</span>
            <Boton disabled={i === folios.length - 1} onClick={() => setHoja(i + 1)}>Folio siguiente<ChevronRight size={16} /></Boton>
          </div>
        )}
        <p className="text-xs text-texto3">Incluye partidas contabilizadas y anuladas, nunca borradores. Las anuladas se muestran con su reversión.</p>
      </Pagina>
    </Marco>
  );
}

/* ======================= HU-27 · HU-28 · HU-29 Libro mayor ======================= */
function EsquemaT({ cod, nombre, movs, d, h }: { cod: string; nombre: string; movs: MovMayor[]; d: number; h: number }) {
  const deudor = movs.filter((m) => m.d);
  const acreedor = movs.filter((m) => m.h);
  const lado = d >= h ? "D" : "H";
  const Col = ({ lista, k, titulo }: { lista: MovMayor[]; k: "d" | "h"; titulo: string }) => (
    <div className="min-w-0">
      <p className="text-center text-xs font-bold tracking-[.08em] uppercase text-texto3 py-2.5 border-b border-borde">{titulo}</p>
      <ul className="min-h-[120px]">
        {lista.map((m, i) => (
          <li key={i} className={cx("flex justify-between gap-3 px-4 py-2 text-sm border-b border-borde/60", m.estado === "Anulada" && "text-texto3")}>
            <span className="cifra text-texto3">{m.num}</span><span className={cx("cifra", m.estado === "Anulada" && "line-through")}>{dinero(enDinero(m[k]))}</span>
          </li>
        ))}
      </ul>
      <p className="flex justify-between px-4 py-3 border-t border-bordef font-bold"><span>Suma</span><span className="cifra">{dinero(enDinero(k === "d" ? d : h))}</span></p>
    </div>
  );
  return (
    <div>
      <div className="text-center px-4 pt-5 pb-3"><b className="font-semibold"><span className="cifra text-texto3 mr-2">{cod}</span>{nombre}</b></div>
      <div className="grid grid-cols-2 border-t border-borde [&>*:first-child]:border-r [&>*:first-child]:border-bordef">
        <Col lista={deudor} k="d" titulo="Debe" /><Col lista={acreedor} k="h" titulo="Haber" />
      </div>
      <div className={cx("grid grid-cols-2 border-t border-borde")}>
        <p className="px-4 py-3 font-bold flex justify-between">{lado === "D" && <><span>Saldo</span><span className="cifra">{dinero(enDinero(Math.abs(d - h)))}</span></>}</p>
        <p className="px-4 py-3 font-bold flex justify-between border-l border-bordef">{lado === "H" && <><span>Saldo</span><span className="cifra">{dinero(enDinero(Math.abs(d - h)))}</span></>}</p>
      </div>
    </div>
  );
}

export function LibroMayor() {
  const { sucursal } = useApp();
  const cuentas = useMemo(cuentasConMovimiento, []);
  const contrarios = useMemo(saldosContrarios, []);
  const [cod, setCod] = useState("11010301");
  const [vista, setVista] = useState<"mov" | "t">("mov");
  const [desde, setDesde] = useState("01/11/2026");
  const [hasta, setHasta] = useState("30/11/2026");
  const cuenta = cuentas.find((c) => c.c === cod)!;
  const { movs: todos, saldo } = mayorDe(cod);
  const a = aNumFecha(desde), b = aNumFecha(hasta);
  const movs = todos.filter((m) => { const f = aNumFecha(m.fecha); return (isNaN(a) || f >= a) && (isNaN(b) || f <= b); });
  const contrario = saldo < 0;
  const esContrario = (c: string) => contrarios.some((x) => x.c === c);

  return (
    <Marco ruta={[{ t: "Libros y reportes" }, { t: "Libro mayor" }]}>
      <Pagina ancho="max-w-[1100px]">
        <Titulo t="Libro mayor" sub="Movimientos y saldo corrido de una cuenta" />
        {contrarios.length > 0 && !contrario && (
          <Aviso mal>
            <b className="font-semibold">{contrarios.length === 1 ? "1 cuenta tiene" : `${contrarios.length} cuentas tienen`} saldo contrario a su naturaleza:</b>{" "}
            {contrarios.map((c) => (
              <button key={c.c} type="button" onClick={() => setCod(c.c)} className="underline underline-offset-4 font-semibold mr-2">{c.c} {c.n}</button>
            ))}
          </Aviso>
        )}
        <BarraFiltros desde={desde} hasta={hasta} onDesde={setDesde} onHasta={setHasta} exportar={<BotonExportar nombre={`Mayor de ${cuenta.n}`} />}>
          <label className="grid gap-1.5 text-sm font-semibold flex-1 min-w-[240px]">Cuenta
            <Selector value={cod} onChange={(e) => setCod(e.target.value)} className="h-10">
              {cuentas.map((c) => <option key={c.c} value={c.c}>{esContrario(c.c) ? "⚠ " : ""}{c.c} · {c.n}</option>)}
            </Selector>
          </label>
          <Segmento valor={vista} onChange={setVista} opciones={[{ v: "mov", t: "Movimientos" }, { v: "t", t: "Esquema T" }]} />
        </BarraFiltros>

        {contrario && (
          <Aviso mal>
            <TriangleAlert size={14} className="inline mr-1.5 -mt-0.5" />
            <b className="font-semibold">Saldo contrario.</b> {cuenta.n} es de naturaleza {naturaleza(cod) === "D" ? "deudora" : "acreedora"} pero termina con saldo {naturaleza(cod) === "D" ? "acreedor" : "deudor"} de US$ {dinero(enDinero(-saldo))}.
            Revisa si es un anticipo o un error de registro; no se bloquea la consulta.
          </Aviso>
        )}

        <Tarjeta className="overflow-hidden">
          <EncabezadoLibro empresa={EMPRESA_CHERO} titulo={`Mayor · ${cod} ${cuenta.n}`} periodo={`Del ${desde} al ${hasta}`} sucursal={`Consolidado · ${sucursal}`} nota={NOTA} />
          {vista === "mov" ? (
            <TablaCifras<MovMayor>
              clave={(m) => String(m.num) + m.d + m.h} filas={movs} vacio="Esta cuenta no tiene movimientos en el rango elegido."
              resaltar={(m) => m.saldo < 0}
              cols={[
                { clave: "f", titulo: "Fecha", ver: (m) => <span className="cifra whitespace-nowrap">{m.fecha}</span> },
                { clave: "p", titulo: "Partida", ver: (m) => <span className="cifra">N.º {m.num}</span> },
                { clave: "c", titulo: "Concepto", ver: (m) => <span className="flex items-center gap-2 flex-wrap">{m.concepto}{etqEstado(m.estado)}</span> },
                { clave: "d", titulo: "Debe", tipo: "num", ver: (m) => <Cifra v={enDinero(m.d)} />, total: enDinero(movs.reduce((t, m) => t + m.d, 0)) },
                { clave: "h", titulo: "Haber", tipo: "num", ver: (m) => <Cifra v={enDinero(m.h)} />, total: enDinero(movs.reduce((t, m) => t + m.h, 0)) },
                { clave: "s", titulo: "Saldo", tipo: "num", ver: (m) => <Cifra v={enDinero(m.saldo)} className={cx("font-semibold", m.saldo < 0 && "text-alerta")} vacio="0.00" /> },
              ]}
            />
          ) : <EsquemaT cod={cod} nombre={cuenta.n} movs={movs} d={movs.reduce((t, m) => t + m.d, 0)} h={movs.reduce((t, m) => t + m.h, 0)} />}
        </Tarjeta>
        <p className="text-xs text-texto3">En el esquema T cada renglón es el número de partida y su monto. Incluye partidas anuladas, nunca borradores.</p>
      </Pagina>
    </Marco>
  );
}
