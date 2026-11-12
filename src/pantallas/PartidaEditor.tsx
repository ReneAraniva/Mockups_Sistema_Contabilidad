import { useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CircleAlert, CircleCheck, Plus, Search, X } from "lucide-react";
import { PERIODOS, useApp } from "../contexto";
import { PARTIDAS, TIPOS_PARTIDA, imputables, type Linea } from "../datos/ejemplo";
import { Marco, Permiso } from "../marco/Marco";
import { Aviso, Boton, BotonIcono, Campo, Dialogo, Entrada, Etiqueta, Flotante, Pagina, Selector, Tarjeta, cx, dinero } from "../ui";

const aCentavos = (s: string) => Math.round((parseFloat(s.replace(/,/g, "")) || 0) * 100);
const formato = (c: number) => (c ? dinero(c / 100) : "");
type Fila = { c: string; n: string; d: string; h: string };

/** HU-20 y HU-21: registro de una partida con totales en vivo y guardado como borrador. */
export function PartidaEditor() {
  const { id } = useParams();
  const ir = useNavigate();
  const { periodo, avisar, puede } = useApp();
  const base = PARTIDAS.find((p) => p.id === id);
  const abierto = PERIODOS.find((p) => p.n === periodo)?.abierto ?? true;
  const soloVer = !!base && base.estado !== "Borrador" || puede("consulta");

  const [fecha, setFecha] = useState(base?.fecha ?? "09/11/2026");
  const [tipo, setTipo] = useState(base?.tipo ?? "Operación");
  const [doc, setDoc] = useState(base?.doc ?? "");
  const [concepto, setConcepto] = useState(base?.concepto ?? "");
  const [filas, setFilas] = useState<Fila[]>(
    (base?.lineas ?? (base ? [] : PARTIDAS[0].lineas!)).map((l: Linea) => ({ c: l.c, n: l.n, d: formato(l.d * 100), h: formato(l.h * 100) })),
  );
  const [buscar, setBuscar] = useState(false);
  const [q, setQ] = useState("");
  const [confirmar, setConfirmar] = useState(false);
  const [salir, setSalir] = useState(false);
  const ancla = useRef<HTMLButtonElement>(null);

  const td = filas.reduce((s, f) => s + aCentavos(f.d), 0);
  const th = filas.reduce((s, f) => s + aCentavos(f.h), 0);
  const dif = td - th;
  const cuadra = filas.length >= 2 && td > 0 && dif === 0;
  const opciones = useMemo(() => imputables().filter((c) => c.activa !== false && (c.c.startsWith(q) || c.n.toLowerCase().includes(q.toLowerCase()))), [q]);

  const cambiar = (i: number, campo: "d" | "h", v: string) =>
    setFilas((fs) => fs.map((f, j) => (j === i ? { ...f, [campo]: v.replace(/[^\d.,]/g, ""), ...(v ? { [campo === "d" ? "h" : "d"]: "" } : {}) } : f)));
  const pulir = (i: number, campo: "d" | "h") => setFilas((fs) => fs.map((f, j) => (j === i ? { ...f, [campo]: formato(aCentavos(f[campo])) } : f)));

  const titulo = base ? (base.num ? `Partida n.º ${base.num}` : "Borrador de partida") : "Nueva partida";

  return (
    <Marco ruta={[{ t: "Partidas", a: "/partidas" }, { t: titulo }]}>
      <Pagina ancho="max-w-[1200px]">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <h1 className="text-[28px] sm:text-[32px] font-normal tracking-tight">{titulo}</h1>
          {base?.estado === "Contabilizada" ? <Etiqueta t="contab">Contabilizada</Etiqueta>
            : base?.estado === "Anulada" ? <Etiqueta t="anulada">Anulada</Etiqueta>
            : <Etiqueta t="borrador">Sin número · se asigna al contabilizar</Etiqueta>}
        </div>

        {!abierto && <Aviso mal>{periodo} está cerrado. No se pueden registrar ni editar partidas en él; elige un período abierto en el encabezado.</Aviso>}
        {soloVer && base?.estado !== "Borrador" && base && <Aviso>Las partidas contabilizadas se editan con historial y se anulan por reversión (Sprint 2).</Aviso>}

        <Tarjeta className="p-5 grid gap-4">
          <div className="grid gap-4 grid-cols-2 md:grid-cols-[160px_200px_minmax(0,1fr)]">
            <Campo label="Fecha"><Entrada value={fecha} onChange={(e) => setFecha(e.target.value)} disabled={soloVer} inputMode="numeric" placeholder="dd/mm/aaaa" /></Campo>
            <Campo label="Tipo">
              <Selector value={tipo} onChange={(e) => setTipo(e.target.value)} disabled={soloVer}>{TIPOS_PARTIDA.map((t) => <option key={t}>{t}</option>)}</Selector>
            </Campo>
            <Campo label="Documento de soporte" ayuda="Opcional" className="col-span-2 md:col-span-1">
              <Entrada value={doc} onChange={(e) => setDoc(e.target.value)} disabled={soloVer} placeholder="CCF, factura, recibo…" />
            </Campo>
          </div>
          <Campo label="Concepto" ayuda="Opcional"><Entrada value={concepto} onChange={(e) => setConcepto(e.target.value)} disabled={soloVer} placeholder="Describe la operación" /></Campo>
        </Tarjeta>

        <Tarjeta className="overflow-hidden">
          <div className="hidden sm:grid grid-cols-[110px_minmax(0,1fr)_140px_140px_44px] gap-3 px-5 py-3 border-b border-borde text-xs font-bold tracking-[.08em] uppercase text-texto3">
            <span>Código</span><span>Cuenta</span><span className="text-right">Debe</span><span className="text-right">Haber</span><span />
          </div>
          {filas.map((f, i) => (
            <div key={f.c + i} className="grid grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[110px_minmax(0,1fr)_140px_140px_44px] gap-x-3 gap-y-2 px-5 py-3 border-b border-borde items-center">
              <span className="hidden sm:block text-texto2 cifra">{f.c}</span>
              <span className="min-w-0 truncate"><span className="sm:hidden text-texto3 cifra mr-2">{f.c}</span>{f.n}</span>
              <BotonIcono aria-label={`Quitar ${f.n}`} disabled={soloVer} onClick={() => setFilas(filas.filter((_, j) => j !== i))} className="sm:order-last"><X size={16} /></BotonIcono>
              <div className="col-span-2 sm:col-span-1 grid grid-cols-2 sm:contents gap-2">
                <Entrada aria-label={`Debe de ${f.n}`} value={f.d} placeholder="0.00" disabled={soloVer || !!f.h} inputMode="decimal"
                  onChange={(e) => cambiar(i, "d", e.target.value)} onBlur={() => pulir(i, "d")} className="text-right cifra h-10 font-semibold disabled:opacity-40" />
                <Entrada aria-label={`Haber de ${f.n}`} value={f.h} placeholder="0.00" disabled={soloVer || !!f.d} inputMode="decimal"
                  onChange={(e) => cambiar(i, "h", e.target.value)} onBlur={() => pulir(i, "h")} className="text-right cifra h-10 font-semibold disabled:opacity-40" />
              </div>
            </div>
          ))}
          {!soloVer && (
            <div className="px-5 py-3 border-b border-borde flex items-center gap-3 flex-wrap">
              <button ref={ancla} type="button" onClick={() => setBuscar(!buscar)} className="h-9 px-3 -ml-3 rounded-full inline-flex items-center gap-2 font-semibold hover:bg-tarjeta2">
                <Plus size={16} />Agregar cuenta
              </button>
              <span className="text-xs text-texto3">Solo cuentas de último nivel y activas</span>
            </div>
          )}
          <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] sm:grid-cols-[110px_minmax(0,1fr)_140px_140px_44px] gap-3 px-5 py-4 border-t border-bordef font-bold items-center">
            <span className="hidden sm:block" /><span>Totales</span>
            <span className="text-right cifra text-base">{dinero(td / 100)}</span>
            <span className="text-right cifra text-base">{dinero(th / 100)}</span>
          </div>
        </Tarjeta>

        <Flotante abierto={buscar} onCerrar={() => { setBuscar(false); setQ(""); }} ancla={ancla} ancho={420} alinear="izq">
          <div className="relative m-1 mb-2">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-texto3" />
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Código o nombre de la cuenta"
              className="w-full h-10 pl-10 pr-3 rounded-full border border-bordef bg-fondo outline-none focus:border-texto2" />
          </div>
          <div className="max-h-72 overflow-y-auto">
            {opciones.map((c) => (
              <button key={c.c} type="button" onClick={() => { setFilas([...filas, { c: c.c, n: c.n, d: "", h: "" }]); setBuscar(false); setQ(""); }}
                className="flex w-full items-center gap-3 h-10 px-2.5 rounded-xl hover:bg-tarjeta2 text-left text-sm">
                <span className="text-texto3 cifra w-20 shrink-0">{c.c}</span><span className="flex-1 truncate">{c.n}</span>
                <span className="text-xs text-texto3">{c.nat === "D" ? "Deudora" : "Acreedora"}</span>
              </button>
            ))}
            {!opciones.length && <p className="text-texto2 text-sm p-4 text-center">Sin cuentas imputables con «{q}».</p>}
          </div>
        </Flotante>

        {!soloVer && (
          <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-3 sm:justify-between">
            <div aria-live="polite">
              {filas.length < 2 ? <span className="text-sm text-texto2">Agrega al menos dos cuentas.</span>
                : dif ? (
                  <span className="inline-flex items-center gap-2 h-9 px-3.5 rounded-full bg-alertaf text-alerta text-sm font-semibold">
                    <CircleAlert size={16} />Diferencia US$ {dinero(Math.abs(dif) / 100)} · puedes guardarla como borrador
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 h-9 px-3.5 rounded-full bg-tarjeta2 text-texto text-sm font-semibold"><CircleCheck size={16} />La partida cuadra</span>
                )}
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <Boton v="fan" onClick={() => setSalir(true)}>Cancelar</Boton>
              <Boton disabled={!abierto || !filas.length} onClick={() => { avisar("Borrador guardado en la bandeja de pendientes"); ir("/pendientes"); }}>Guardar borrador</Boton>
              <Permiso roles={["admin", "contador"]}>
                <Boton v="pri" disabled={!cuadra || !abierto} onClick={() => setConfirmar(true)} className="col-span-2 order-first sm:order-none"
                  title={!cuadra ? "Debe y haber tienen que ser iguales" : undefined}>Contabilizar</Boton>
              </Permiso>
            </div>
          </div>
        )}
        <Permiso roles={["auxiliar"]}><p className="text-xs text-texto3 text-right -mt-2">Un contador revisará y contabilizará tu borrador.</p></Permiso>
      </Pagina>

      <Dialogo abierto={confirmar} onCerrar={() => setConfirmar(false)} titulo="¿Contabilizar la partida?"
        sub="Pasará al libro diario con el siguiente número correlativo y ya no podrá eliminarse."
        pie={<><Boton v="fan" onClick={() => setConfirmar(false)}>Cancelar</Boton><Boton v="pri" onClick={() => { avisar("Partida n.º 8 contabilizada"); ir("/partidas"); }}>Contabilizar como n.º 8</Boton></>}>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-fondo rounded-xl p-3"><span className="text-texto3 block text-xs">Fecha y tipo</span>{fecha} · {tipo}</div>
          <div className="bg-fondo rounded-xl p-3"><span className="text-texto3 block text-xs">Total</span><span className="cifra font-semibold">US$ {dinero(td / 100)}</span></div>
        </div>
      </Dialogo>
      <Dialogo abierto={salir} onCerrar={() => setSalir(false)} titulo="¿Salir sin guardar?" sub="Perderás los cambios. Si la partida no cuadra, puedes guardarla como borrador."
        pie={<><Boton v="fan" onClick={() => setSalir(false)}>Seguir editando</Boton><Boton v="pel" onClick={() => ir("/partidas")}>Salir sin guardar</Boton></>}>
        <span className={cx("text-xs text-texto3")}>Esta confirmación solo aparece cuando hay cambios.</span>
      </Dialogo>
    </Marco>
  );
}
