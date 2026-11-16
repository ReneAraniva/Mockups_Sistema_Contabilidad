import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowRight, Ban, History, Pencil, Undo2 } from "lucide-react";
import { PERIODOS, useApp } from "../contexto";
import { PARTIDAS, type Linea, type Partida, type Version } from "../datos/ejemplo";
import { Marco, Permiso } from "../marco/Marco";
import { Area, Aviso, Boton, CabTarjeta, Campo, Dialogo, Etiqueta, Pagina, Tarjeta, cx, dinero } from "../ui";
import { Cifra, TablaCifras } from "../ui/reportes";

const MOTIVO_MIN = 10;
const suma = (ls: Linea[], k: "d" | "h") => ls.reduce((s, l) => s + Math.round(l[k] * 100), 0) / 100;

/** Versiones de la partida; si nunca se editó, existe solo la original. */
const versionesDe = (p: Partida): Version[] =>
  p.versiones ?? [{ n: 1, fecha: p.fecha, autor: p.autor, motivo: "Contabilización original", lineas: p.lineas ?? [] }];

type Marca = "igual" | "nueva" | "cambio" | "quitada";
type FilaDif = Linea & { marca: Marca };
/** Compara una versión con la anterior, línea por línea y por cuenta. */
function comparar(actual: Linea[], previa?: Linea[]): FilaDif[] {
  if (!previa) return actual.map((l) => ({ ...l, marca: "igual" }));
  const filas: FilaDif[] = actual.map((l) => {
    const antes = previa.find((x) => x.c === l.c);
    return { ...l, marca: !antes ? "nueva" : antes.d !== l.d || antes.h !== l.h ? "cambio" : "igual" };
  });
  for (const x of previa) if (!actual.some((l) => l.c === x.c)) filas.push({ ...x, marca: "quitada" });
  return filas;
}
const MARCA: Record<Marca, { t: string; c: string } | null> = {
  igual: null,
  nueva: { t: "Nueva", c: "bg-pri text-prit" },
  cambio: { t: "Cambió", c: "bg-tarjeta2 text-texto border border-bordef" },
  quitada: { t: "Quitada", c: "bg-alertaf text-alerta" },
};

const Dato = ({ t, children }: { t: string; children: React.ReactNode }) => (
  <div className="min-w-0"><span className="block text-xs font-bold tracking-[.08em] uppercase text-texto3">{t}</span><span className="block mt-1 break-words">{children}</span></div>
);

/** HU-23 y HU-24: detalle de una partida contabilizada, con historial de versiones y anulación por reversión. */
export function PartidaDetalle() {
  const { id } = useParams();
  const ir = useNavigate();
  const { periodo, avisar } = useApp();
  const p = PARTIDAS.find((x) => x.id === id);
  const versiones = useMemo(() => (p ? versionesDe(p) : []), [p]);
  const [ver, setVer] = useState(versiones.length);
  const [anular, setAnular] = useState(false);
  const [motivo, setMotivo] = useState("");

  if (!p) {
    return (
      <Marco ruta={[{ t: "Partidas", a: "/partidas" }, { t: "No encontrada" }]}>
        <Pagina ancho="max-w-[560px]">
          <Aviso mal>No existe una partida con ese identificador.</Aviso>
          <Link to="/partidas" className="h-11 px-5 rounded-full bg-pri text-prit font-semibold inline-flex items-center justify-center">Volver a partidas</Link>
        </Pagina>
      </Marco>
    );
  }

  const abierto = PERIODOS.find((x) => x.n === periodo)?.abierto ?? true;
  const original = p.reversaDe ? PARTIDAS.find((x) => x.id === p.reversaDe) : undefined;
  const reversion = p.anuladaPor ? PARTIDAS.find((x) => x.id === p.anuladaPor!.id) : undefined;
  const contab = p.estado === "Contabilizada";
  const puedeActuar = contab && !p.reversaDe;
  const siguiente = Math.max(...PARTIDAS.map((x) => x.num ?? 0)) + 1;

  const vigente = versiones[versiones.length - 1];
  const sel = versiones[ver - 1];
  const filas = comparar(sel.lineas, versiones[ver - 2]?.lineas);
  const reversa: Linea[] = (p.lineas ?? []).map((l) => ({ ...l, d: l.h, h: l.d }));
  const motivoOk = motivo.trim().length >= MOTIVO_MIN;
  const cerrar = () => { setAnular(false); setMotivo(""); };

  return (
    <Marco ruta={[{ t: "Partidas", a: "/partidas" }, { t: `Partida n.º ${p.num ?? "—"}` }]}>
      <Pagina ancho="max-w-[1200px]">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-[28px] sm:text-[32px] font-normal tracking-tight">Partida n.º {p.num}</h1>
            <p className="text-texto2 mt-1">{p.tipo} · {p.fecha} · {p.suc}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            {contab ? <Etiqueta t="contab">Contabilizada</Etiqueta> : <Etiqueta t="anulada">Anulada</Etiqueta>}
            {puedeActuar && (
              <Permiso roles={["admin", "contador"]}>
                <Boton disabled={!abierto} onClick={() => ir(`/partidas/${p.id}/editar`)} className="flex-1 sm:flex-none"><Pencil size={16} />Editar</Boton>
                <Boton v="pel" disabled={!abierto} onClick={() => setAnular(true)} className="flex-1 sm:flex-none"><Ban size={16} />Anular</Boton>
              </Permiso>
            )}
          </div>
        </div>

        {!abierto && contab && <Aviso mal>{periodo} está cerrado. No se puede editar ni anular esta partida mientras el período siga cerrado.</Aviso>}
        {p.anuladaPor && (
          <Aviso mal>
            <b className="font-semibold">Anulada el {p.anuladaPor.fecha} por {p.anuladaPor.autor}.</b> {p.anuladaPor.motivo}{" "}
            {reversion && <Link to={`/partidas/${reversion.id}`} className="underline underline-offset-4 font-semibold inline-flex items-center gap-1">Ver reversión n.º {reversion.num}<ArrowRight size={14} /></Link>}
          </Aviso>
        )}
        {original && (
          <Aviso>
            <Undo2 size={14} className="inline mr-1.5 -mt-0.5" />Esta partida <b className="font-semibold">revierte</b> la n.º {original.num} «{original.concepto}».{" "}
            <Link to={`/partidas/${original.id}`} className="underline underline-offset-4 font-semibold inline-flex items-center gap-1">Ver original<ArrowRight size={14} /></Link>
          </Aviso>
        )}

        <Tarjeta className="p-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-4 min-w-0"><span className="block text-xs font-bold tracking-[.08em] uppercase text-texto3">Concepto</span><span className="block mt-1 text-lg">{p.concepto}</span></div>
          <Dato t="Documento de soporte">{p.doc ?? <span className="text-texto3">Sin documento</span>}</Dato>
          <Dato t="Registrada por">{p.autor}</Dato>
          <Dato t="Sucursal">{p.suc}</Dato>
          <Dato t="Versión vigente"><span className="cifra">{vigente.n}</span> de {versiones.length}</Dato>
        </Tarjeta>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px] items-start">
          <Tarjeta className="overflow-hidden">
            <CabTarjeta titulo={ver === versiones.length ? "Líneas de la partida" : `Líneas de la versión ${ver}`}
              sub={ver !== versiones.length ? "Versión anterior, solo lectura" : versiones.length > 1 ? `Se marcan los cambios respecto a la versión ${ver - 1}` : undefined}>
              {ver !== versiones.length && <Boton peq v="sec" onClick={() => setVer(versiones.length)}>Ver la vigente</Boton>}
            </CabTarjeta>
            <TablaCifras
              clave={(f: FilaDif) => f.c + f.marca}
              filas={filas}
              resaltar={(f) => f.marca === "quitada"}
              cols={[
                { clave: "c", titulo: "Código", ver: (f) => <span className={cx("cifra text-texto2", f.marca === "quitada" && "line-through")}>{f.c}</span> },
                { clave: "n", titulo: "Cuenta", ver: (f) => (
                  <span className={cx("flex items-center gap-2", f.marca === "quitada" && "line-through text-texto3")}>
                    {f.n}{MARCA[f.marca] && <i className={cx("not-italic text-[11px] font-bold h-5 px-2 rounded-full inline-flex items-center no-underline", MARCA[f.marca]!.c)}>{MARCA[f.marca]!.t}</i>}
                  </span>) },
                { clave: "d", titulo: "Debe", tipo: "num", ver: (f) => <Cifra v={f.d} className={f.marca === "quitada" ? "line-through" : ""} />, total: suma(sel.lineas, "d") },
                { clave: "h", titulo: "Haber", tipo: "num", ver: (f) => <Cifra v={f.h} className={f.marca === "quitada" ? "line-through" : ""} />, total: suma(sel.lineas, "h") },
              ]}
            />
          </Tarjeta>

          <Tarjeta className="overflow-hidden">
            <CabTarjeta titulo={<span className="inline-flex items-center gap-2"><History size={17} />Historial de versiones</span>} sub="Nada se sobrescribe: cada edición crea una versión" />
            <ol className="p-3 grid gap-1" aria-label="Versiones">
              {[...versiones].reverse().map((v) => (
                <li key={v.n}>
                  <button type="button" onClick={() => setVer(v.n)} aria-current={ver === v.n}
                    className={cx("w-full text-left rounded-2xl px-3.5 py-3 grid gap-1 border transition-colors", ver === v.n ? "border-bordef bg-tarjeta2" : "border-transparent hover:bg-tarjeta2")}>
                    <span className="flex items-center justify-between gap-2">
                      <b className="font-semibold">Versión {v.n}</b>
                      {v.n === versiones.length ? <Etiqueta t="contab">Vigente</Etiqueta> : <Etiqueta t="neutra">Anterior</Etiqueta>}
                    </span>
                    <span className="text-xs text-texto3 cifra">{v.fecha} · {v.autor}</span>
                    <span className="text-sm text-texto2">{v.motivo}</span>
                  </button>
                </li>
              ))}
            </ol>
            {versiones.length === 1 && <p className="px-5 pb-4 text-xs text-texto3">Esta partida no se ha editado desde que se contabilizó.</p>}
          </Tarjeta>
        </div>
      </Pagina>

      <Dialogo abierto={anular} onCerrar={cerrar} ancho="max-w-[640px]" titulo={`Anular la partida n.º ${p.num}`}
        sub="No se borra nada: se crea una partida de reversión con las líneas invertidas y la original queda marcada como anulada."
        pie={<><Boton v="fan" onClick={cerrar}>Cancelar</Boton>
          <Boton v="pel" disabled={!motivoOk} onClick={() => { cerrar(); avisar(`Partida n.º ${p.num} anulada · reversión n.º ${siguiente} contabilizada`); ir("/partidas"); }}>Anular y crear reversión</Boton></>}>
        <Campo label="Motivo de la anulación" ayuda={`Mínimo ${MOTIVO_MIN} caracteres · queda en la partida y en la bitácora`}
          error={motivo.length > 0 && !motivoOk ? `Faltan ${MOTIVO_MIN - motivo.trim().length} caracteres.` : undefined}>
          <Area rows={3} value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ej. La factura corresponde a otra sucursal." />
        </Campo>
        <div className="grid gap-2">
          <span className="text-xs font-bold tracking-[.08em] uppercase text-texto3">Vista previa · reversión n.º {siguiente}</span>
          <div className="bg-fondo rounded-2xl overflow-hidden">
            {reversa.map((l) => (
              <div key={l.c} className="grid grid-cols-[minmax(0,1fr)_96px_96px] gap-2 px-4 py-2.5 border-b border-borde last:border-0 text-sm items-center">
                <span className="truncate"><span className="text-texto3 cifra mr-2">{l.c}</span>{l.n}</span>
                <span className="text-right"><Cifra v={l.d} /></span><span className="text-right"><Cifra v={l.h} /></span>
              </div>
            ))}
            <div className="grid grid-cols-[minmax(0,1fr)_96px_96px] gap-2 px-4 py-3 border-t border-bordef font-bold text-sm">
              <span>Totales</span><span className="text-right cifra">{dinero(suma(reversa, "d"))}</span><span className="text-right cifra">{dinero(suma(reversa, "h"))}</span>
            </div>
          </div>
        </div>
      </Dialogo>
    </Marco>
  );
}
