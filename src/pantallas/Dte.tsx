import { useMemo, useState } from "react";
import { Ban, CircleCheck, FileDown, FileJson, Loader2, PenLine, Plus, Send } from "lucide-react";
import { useApp } from "../contexto";
import { EMPRESA_OFICIAL, LIBRO_CONTRIBUYENTES, NRC_EMPRESA, redondear } from "../datos/caso";
import { DTES, MOTIVOS_INVALIDACION, TIPOS_DTE, hex, uuid, type Dte, type EstadoDte, type TipoDte } from "../datos/sprint4";
import { Marco, Permiso } from "../marco/Marco";
import { Aviso, Boton, Campo, Dialogo, Entrada, Etiqueta, Pagina, Pasos, Selector, Tarjeta, Titulo, dinero } from "../ui";
import { Qr } from "../ui/Qr";
import { Cifra, TablaCifras } from "../ui/reportes";
import type { Rol } from "../datos/navegacion";

const ESCRIBE: Rol[] = ["admin", "contador", "auxiliar"];
const num = (v: string) => { const n = parseFloat(v.replace(/,/g, "")); return isNaN(n) ? 0 : n; };
const etq = (e: EstadoDte) => (e === "Con sello" ? "contab" : e === "Invalidado" ? "anulada" : e === "Firmado" ? "abierto" : "borrador");

/** Representación gráfica del documento, como saldría en el PDF: papel claro, datos del emisor y receptor, QR y sello. */
function Representacion({ d }: { d: Dte }) {
  return (
    <div className="bg-pri text-prit rounded-2xl p-5 grid gap-4 text-[13px] relative overflow-hidden">
      {d.estado === "Invalidado" && <span className="absolute inset-0 grid place-items-center text-5xl font-bold tracking-[.2em] text-prit/10 -rotate-12 pointer-events-none">INVALIDADO</span>}
      <div className="flex justify-between gap-4">
        <div><b className="block text-sm tracking-[.12em] uppercase">{EMPRESA_OFICIAL}</b><span className="text-prit/60">NRC {NRC_EMPRESA} · San Miguel, El Salvador</span></div>
        <div className="text-right"><b className="block">{TIPOS_DTE[d.tipo]}</b><span className="text-prit/60 cifra">{d.fecha}</span></div>
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[12px]">
        <dt className="text-prit/60">N.º de control</dt><dd className="cifra break-all">{d.numero}</dd>
        <dt className="text-prit/60">Código de generación</dt><dd className="cifra break-all">{d.codigo}</dd>
        <dt className="text-prit/60">Receptor</dt><dd>{d.receptor}{d.nrc !== "N/A" && <span className="text-prit/60"> · NRC {d.nrc}</span>}</dd>
        {d.referencia && <><dt className="text-prit/60">Documento relacionado</dt><dd className="cifra">{d.referencia}</dd></>}
      </dl>
      <table className="w-full text-[12px]">
        <thead><tr className="border-y border-prit/20 text-prit/60"><th className="text-left py-1.5 font-semibold">Descripción</th><th className="text-right font-semibold">Valor</th></tr></thead>
        <tbody>
          <tr><td className="py-1.5">{d.concepto}</td><td className="text-right cifra">{dinero(d.gravado)}</td></tr>
          <tr className="text-prit/70"><td className="py-1">IVA 13 %</td><td className="text-right cifra">{dinero(d.iva)}</td></tr>
          <tr className="border-t border-prit/20 font-bold"><td className="py-1.5">Total a pagar</td><td className="text-right cifra">US$ {dinero(d.total)}</td></tr>
        </tbody>
      </table>
      <div className="flex items-end justify-between gap-4 pt-1">
        <div className="min-w-0 text-[11px] text-prit/60">
          <b className="block text-prit text-xs">Sello de recepción (simulado)</b>
          <span className="cifra break-all">{d.sello ?? "Pendiente de transmisión"}</span>
          <span className="block mt-1">Ambiente de pruebas · sin validez fiscal</span>
        </div>
        <span className="text-prit shrink-0"><Qr valor={d.codigo} tam={92} /></span>
      </div>
    </div>
  );
}

/** HU-53 a HU-57: emisión, firma, sello simulado, representación gráfica e invalidación de documentos electrónicos. */
export function Documentos() {
  const { avisar } = useApp();
  const [lista, setLista] = useState<Dte[]>(DTES);
  const [tipo, setTipo] = useState("Todos"), [estado, setEstado] = useState("Todos"), [q, setQ] = useState("");
  const [sel, setSel] = useState<string | null>(null);
  const [emitir, setEmitir] = useState(false);
  const [inval, setInval] = useState(false);
  const [motivo, setMotivo] = useState(MOTIVOS_INVALIDACION[0]);

  /* emisión */
  const [paso, setPaso] = useState(0);
  const [trabajando, setTrabajando] = useState(false);
  const [f, setF] = useState({ tipo: "03" as TipoDte, receptor: LIBRO_CONTRIBUYENTES[0].cliente, concepto: "", gravado: "", ref: "CCF-0001" });
  const [nuevo, setNuevo] = useState<Dte | null>(null);

  const d = lista.find((x) => x.id === sel) ?? null;
  const filas = useMemo(() => lista.filter((x) => (tipo === "Todos" || x.tipo === tipo) && (estado === "Todos" || x.estado === estado) && (x.numero + x.receptor + x.concepto).toLowerCase().includes(q.toLowerCase())), [lista, tipo, estado, q]);
  const cuenta = (e: EstadoDte) => lista.filter((x) => x.estado === e).length;
  const receptores = f.tipo === "01" ? ["Consumidor final"] : [...new Set(LIBRO_CONTRIBUYENTES.map((c) => c.cliente))];

  const gr = num(f.gravado), iva = redondear(gr * 0.13);
  const okDatos = f.concepto.trim().length > 2 && gr > 0;
  const cambiar = (id: string, e: EstadoDte, extra: Partial<Dte> = {}) => setLista((l) => l.map((x) => (x.id === id ? { ...x, estado: e, ...extra } : x)));
  const avanzar = (despues: () => void) => { setTrabajando(true); setTimeout(() => { setTrabajando(false); despues(); }, 900); };

  const abrirEmision = () => { setPaso(0); setNuevo(null); setF({ tipo: "03", receptor: LIBRO_CONTRIBUYENTES[0].cliente, concepto: "", gravado: "", ref: "CCF-0001" }); setEmitir(true); };
  const crear = (): Dte => {
    const n = lista.length + 1;
    return { id: `d${n}`, tipo: f.tipo, numero: `DTE-${f.tipo}-M001P001-${String(n).padStart(15, "0")}`, codigo: uuid(n), fecha: "31/10/2026", receptor: f.tipo === "01" ? "Consumidor final" : f.receptor, nrc: f.tipo === "01" ? "N/A" : LIBRO_CONTRIBUYENTES.find((c) => c.cliente === f.receptor)?.nrc ?? "N/A",
      concepto: f.concepto, gravado: gr, iva, total: redondear(gr + iva), estado: "Generado", referencia: f.tipo === "05" || f.tipo === "06" ? f.ref : undefined };
  };

  return (
    <Marco ruta={[{ t: "Facturación" }, { t: "Documentos DTE" }]}>
      <Pagina>
        <Titulo t="Documentos DTE" sub="Factura, comprobante de crédito fiscal y notas · ambiente de pruebas con sello de recepción simulado">
          <Permiso roles={ESCRIBE}><Boton v="pri" onClick={abrirEmision}><Plus size={17} />Emitir documento</Boton></Permiso>
        </Titulo>
        <Aviso>Los documentos se firman con un certificado de prueba y el sello lo genera el sistema; no se transmiten a Hacienda y no tienen validez fiscal.</Aviso>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {(["Con sello", "Firmado", "Generado", "Invalidado"] as EstadoDte[]).map((e) => (
            <Tarjeta key={e} className="p-4"><span className="text-xs text-texto2">{e === "Firmado" ? "Firmados sin sello" : e === "Generado" ? "Por firmar" : e === "Con sello" ? "Con sello" : "Invalidados"}</span><b className="cifra block text-2xl mt-1 font-semibold">{cuenta(e)}</b></Tarjeta>
          ))}
        </div>
        <Tarjeta className="overflow-hidden">
          <div className="p-4 sm:px-5 border-b border-borde flex flex-wrap gap-3 items-center">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por número, receptor o concepto" aria-label="Buscar" className="flex-1 min-w-[220px] h-10 px-4 rounded-full border border-bordef bg-fondo outline-none focus:border-texto2 placeholder:text-texto3" />
            <Selector value={tipo} onChange={(e) => setTipo(e.target.value)} className="h-10 w-full sm:w-[230px]" aria-label="Tipo de documento"><option>Todos</option>{(Object.keys(TIPOS_DTE) as TipoDte[]).map((t) => <option key={t} value={t}>{t} · {TIPOS_DTE[t]}</option>)}</Selector>
            <Selector value={estado} onChange={(e) => setEstado(e.target.value)} className="h-10 w-full sm:w-[160px]" aria-label="Estado">{["Todos", "Generado", "Firmado", "Con sello", "Invalidado"].map((e) => <option key={e}>{e}</option>)}</Selector>
          </div>
          <TablaCifras<Dte> clave={(x) => x.id} filas={filas} totales={false} onFila={(x) => setSel(x.id)} vacio="Ningún documento coincide con los filtros."
            tarjeta={(x) => ({ meta: `${x.fecha} · ${TIPOS_DTE[x.tipo]}`, estado: <Etiqueta t={etq(x.estado)}>{x.estado}</Etiqueta>, titulo: x.receptor, valor: dinero(x.total), detalle: x.numero })}
            cols={[
              { clave: "f", titulo: "Fecha", ver: (x) => <span className="cifra whitespace-nowrap">{x.fecha}</span> },
              { clave: "t", titulo: "Tipo", ver: (x) => <span className="whitespace-nowrap">{x.tipo} · {TIPOS_DTE[x.tipo]}</span> },
              { clave: "n", titulo: "N.º de control", ver: (x) => <span className="cifra text-texto2 text-xs">{x.numero}</span> },
              { clave: "r", titulo: "Receptor", ver: (x) => <span className="block max-w-[260px] truncate">{x.receptor}</span> },
              { clave: "e", titulo: "Estado", ver: (x) => <Etiqueta t={etq(x.estado)}>{x.estado}</Etiqueta> },
              { clave: "tt", titulo: "Total", tipo: "num", ver: (x) => <Cifra v={x.total} /> },
            ]} />
        </Tarjeta>
      </Pagina>

      {/* Detalle */}
      <Dialogo lateral abierto={!!d} onCerrar={() => setSel(null)} titulo={d ? `${TIPOS_DTE[d.tipo]}` : ""} sub={d ? <span className="cifra">{d.numero}</span> : undefined}
        pie={d && <>
          <Boton onClick={() => avisar("Representación gráfica descargada en PDF")}><FileDown size={16} />PDF</Boton>
          <Boton onClick={() => avisar("Archivo JSON descargado")}><FileJson size={16} />JSON</Boton>
          <Permiso roles={["admin", "contador"]}>
            {d.estado === "Con sello" && <Boton onClick={() => { setMotivo(MOTIVOS_INVALIDACION[0]); setInval(true); }}><Ban size={16} />Invalidar</Boton>}
          </Permiso>
          <Permiso roles={ESCRIBE}>
            {d.estado === "Generado" && <Boton v="pri" onClick={() => { cambiar(d.id, "Firmado"); avisar("Documento firmado"); }}><PenLine size={16} />Firmar</Boton>}
            {d.estado === "Firmado" && <Boton v="pri" onClick={() => { cambiar(d.id, "Con sello", { sello: `2026${hex(d.id.length * 31 + 7, 36)}` }); avisar("Sello de recepción simulado recibido"); }}><Send size={16} />Transmitir y recibir sello</Boton>}
          </Permiso>
        </>}>
        {d && <>
          <div className="flex items-center gap-2 flex-wrap"><Etiqueta t={etq(d.estado)}>{d.estado}</Etiqueta>{d.motivoInvalidacion && <span className="text-sm text-texto2">Motivo: {d.motivoInvalidacion}</span>}</div>
          <Representacion d={d} />
        </>}
      </Dialogo>

      {/* Invalidación */}
      <Dialogo abierto={inval} onCerrar={() => setInval(false)} titulo="Invalidar documento" sub={d?.numero}
        pie={<><Boton v="fan" onClick={() => setInval(false)}>Cancelar</Boton><Boton v="pri" onClick={() => { cambiar(d!.id, "Invalidado", { motivoInvalidacion: motivo }); setInval(false); avisar("Documento invalidado"); }}>Invalidar documento</Boton></>}>
        <Aviso mal>La invalidación no se puede deshacer. Queda registrada en la bitácora con el motivo y el usuario.</Aviso>
        <Campo label="Motivo"><Selector value={motivo} onChange={(e) => setMotivo(e.target.value)}>{MOTIVOS_INVALIDACION.map((m) => <option key={m}>{m}</option>)}</Selector></Campo>
      </Dialogo>

      {/* Emisión */}
      <Dialogo lateral abierto={emitir} onCerrar={() => setEmitir(false)} titulo="Emitir documento" sub="Datos, firma y sello de recepción."
        pie={paso === 0 ? <><Boton v="fan" onClick={() => setEmitir(false)}>Cancelar</Boton><Boton v="pri" disabled={!okDatos} onClick={() => setPaso(1)}>Continuar</Boton></>
          : paso === 1 ? <><Boton v="fan" disabled={trabajando} onClick={() => setPaso(0)}>Atrás</Boton><Boton v="pri" disabled={trabajando} onClick={() => avanzar(() => { setNuevo(crear()); setPaso(2); })}>{trabajando ? <><Loader2 size={16} className="animate-spin" />Firmando…</> : <><PenLine size={16} />Firmar documento</>}</Boton></>
          : paso === 2 ? <><Boton v="fan" disabled={trabajando} onClick={() => { setLista([nuevo!, ...lista]); setEmitir(false); avisar("Documento guardado como firmado, sin sello"); setNuevo(null); }}>Dejar para después</Boton>
            <Boton v="pri" disabled={trabajando} onClick={() => avanzar(() => { setNuevo({ ...nuevo!, estado: "Con sello", sello: `2026${hex(nuevo!.id.length * 17 + lista.length, 36)}` }); setPaso(3); })}>{trabajando ? <><Loader2 size={16} className="animate-spin" />Transmitiendo…</> : <><Send size={16} />Transmitir y recibir sello</>}</Boton></>
          : <Boton v="pri" onClick={() => { setLista([nuevo!, ...lista]); setEmitir(false); avisar("Documento emitido con sello"); setNuevo(null); }}>Listo</Boton>}>
        <Pasos pasos={["Datos", "Firma", "Sello"]} actual={Math.min(paso, 2)} />
        {paso === 0 && <>
          <Campo label="Tipo de documento"><Selector value={f.tipo} onChange={(e) => { const t = e.target.value as TipoDte; setF({ ...f, tipo: t, receptor: t === "01" ? "Consumidor final" : LIBRO_CONTRIBUYENTES[0].cliente }); }}>{(Object.keys(TIPOS_DTE) as TipoDte[]).map((t) => <option key={t} value={t}>{t} · {TIPOS_DTE[t]}</option>)}</Selector></Campo>
          <Campo label="Receptor"><Selector value={f.receptor} onChange={(e) => setF({ ...f, receptor: e.target.value })} disabled={f.tipo === "01"}>{receptores.map((r) => <option key={r}>{r}</option>)}</Selector></Campo>
          {(f.tipo === "05" || f.tipo === "06") && <Campo label="Documento relacionado" ayuda="Las notas siempre se emiten sobre un documento anterior."><Selector value={f.ref} onChange={(e) => setF({ ...f, ref: e.target.value })}>{LIBRO_CONTRIBUYENTES.map((c) => <option key={c.doc}>{c.doc}</option>)}</Selector></Campo>}
          <Campo label="Concepto"><Entrada value={f.concepto} onChange={(e) => setF({ ...f, concepto: e.target.value })} placeholder="Ej. Venta de teléfonos" /></Campo>
          <Campo label="Valor gravado (US$)"><Entrada value={f.gravado} onChange={(e) => setF({ ...f, gravado: e.target.value })} inputMode="decimal" className="cifra" /></Campo>
          <p className="text-sm text-texto2">IVA 13 %: <b className="cifra">{dinero(iva)}</b> · total <b className="cifra">{dinero(redondear(gr + iva))}</b></p>
        </>}
        {paso === 1 && <>
          <Aviso>Se firma con el certificado de prueba de la empresa. Al firmar, el contenido ya no se puede cambiar.</Aviso>
          <dl className="grid gap-2 text-sm">{[["Tipo", `${f.tipo} · ${TIPOS_DTE[f.tipo]}`], ["Receptor", f.tipo === "01" ? "Consumidor final" : f.receptor], ["Concepto", f.concepto], ["Total", `US$ ${dinero(redondear(gr + iva))}`]].map(([k, v]) => <div key={k} className="flex justify-between gap-4 border-b border-borde pb-2 last:border-0"><dt className="text-texto2">{k}</dt><dd className="font-semibold text-right">{v}</dd></div>)}</dl>
        </>}
        {paso === 2 && nuevo && <><Etiqueta t="abierto"><CircleCheck size={13} />Firmado</Etiqueta><Representacion d={nuevo} /></>}
        {paso === 3 && nuevo && <><Etiqueta t="contab"><CircleCheck size={13} />Con sello de recepción</Etiqueta><Representacion d={nuevo} /></>}
      </Dialogo>
    </Marco>
  );
}
