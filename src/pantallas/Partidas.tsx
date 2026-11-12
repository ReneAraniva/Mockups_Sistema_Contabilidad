import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FileSpreadsheet, Inbox, Plus, Search } from "lucide-react";
import { useApp } from "../contexto";
import { PARTIDAS, TIPOS_PARTIDA, type Partida } from "../datos/ejemplo";
import { Marco, Permiso } from "../marco/Marco";
import { Boton, Casilla, Dialogo, Etiqueta, Pagina, Pestanas, Selector, Tarjeta, Titulo, cx, dinero, td, th } from "../ui";

function EstadoPartida({ p }: { p: Partida }) {
  if (p.estado === "Contabilizada") return <Etiqueta t="contab">Contabilizada</Etiqueta>;
  if (p.estado === "Anulada") return <Etiqueta t="anulada">Anulada</Etiqueta>;
  return p.debe !== p.haber ? <Etiqueta t="desc">Descuadrada</Etiqueta> : <Etiqueta t="borrador">Borrador</Etiqueta>;
}

/** HU-20 y HU-22: listado de partidas del período. */
export function Partidas() {
  const ir = useNavigate();
  const [tab, setTab] = useState<"todas" | "Borrador" | "Contabilizada" | "Anulada">("todas");
  const [tipo, setTipo] = useState("");
  const [q, setQ] = useState("");
  const lista = PARTIDAS.filter((p) => (tab === "todas" || p.estado === tab) && (!tipo || p.tipo === tipo)
    && (p.concepto.toLowerCase().includes(q.toLowerCase()) || String(p.num ?? "").includes(q)));
  const n = (e: string) => PARTIDAS.filter((p) => p.estado === e).length;

  return (
    <Marco ruta={[{ t: "Contabilidad" }, { t: "Partidas" }]}>
      <Pagina>
        <Titulo t="Partidas" sub="Noviembre 2026 · los borradores no afectan libros ni estados">
          <Permiso roles={["admin", "contador", "auxiliar"]}>
            <Link to="/partidas/nueva" className="h-11 px-5 rounded-full bg-pri text-prit font-semibold inline-flex items-center justify-center gap-2"><Plus size={17} />Nueva partida</Link>
          </Permiso>
        </Titulo>

        <Tarjeta className="overflow-hidden">
          <div className="px-3 sm:px-5">
            <Pestanas valor={tab} onChange={setTab} opciones={[
              { v: "todas", t: "Todas", n: PARTIDAS.length }, { v: "Borrador", t: "Borradores", n: n("Borrador") },
              { v: "Contabilizada", t: "Contabilizadas", n: n("Contabilizada") }, { v: "Anulada", t: "Anuladas", n: n("Anulada") },
            ]} />
          </div>
          <div className="flex gap-3 p-4 sm:px-5 flex-wrap border-b border-borde">
            <div className="relative flex-1 min-w-[220px]">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-texto3" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por número o concepto"
                className="w-full h-10 pl-10 pr-3 rounded-full border border-bordef bg-fondo outline-none focus:border-texto2 placeholder:text-texto3" />
            </div>
            <Selector value={tipo} onChange={(e) => setTipo(e.target.value)} className="h-10 w-auto rounded-full" aria-label="Tipo de partida">
              <option value="">Todos los tipos</option>{TIPOS_PARTIDA.map((t) => <option key={t}>{t}</option>)}
            </Selector>
            <Selector className="h-10 w-auto rounded-full" aria-label="Rango de fechas"><option>01/11/2026 – 30/11/2026</option><option>Octubre 2026</option></Selector>
          </div>

          {/* Escritorio: tabla */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full border-collapse">
              <thead><tr>
                <th className={th}>N.º</th><th className={th}>Fecha</th><th className={th}>Tipo</th><th className={th}>Concepto</th>
                <th className={th}>Sucursal</th><th className={cx(th, "text-right")}>Total</th><th className={th}>Estado</th>
              </tr></thead>
              <tbody>
                {lista.map((p) => (
                  <tr key={p.id} onClick={() => ir(`/partidas/${p.id}`)} className="cursor-pointer hover:bg-white/[.02]">
                    <td className={cx(td, "cifra text-texto2 w-14")}>{p.num ?? "—"}</td>
                    <td className={cx(td, "cifra whitespace-nowrap")}>{p.fecha}</td>
                    <td className={td}>{p.tipo}</td>
                    <td className={cx(td, "max-w-[320px]")}><span className="block truncate">{p.concepto}</span>{p.doc && <span className="text-xs text-texto3">{p.doc}</span>}</td>
                    <td className={cx(td, "text-texto2 whitespace-nowrap")}>{p.suc}</td>
                    <td className={cx(td, "text-right cifra font-semibold", p.estado === "Anulada" && "line-through text-texto3")}>{dinero(p.debe)}</td>
                    <td className={td}><EstadoPartida p={p} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Celular: tarjetas */}
          <ul className="md:hidden">
            {lista.map((p) => (
              <li key={p.id} className="border-b border-borde last:border-0">
                <Link to={`/partidas/${p.id}`} className="block px-4 py-3.5">
                  <div className="flex justify-between items-center gap-2"><span className="text-xs text-texto3 cifra">{p.num ? `N.º ${p.num} · ` : ""}{p.fecha} · {p.tipo}</span><EstadoPartida p={p} /></div>
                  <div className="flex justify-between gap-3 mt-1.5"><span className="truncate">{p.concepto}</span><span className="cifra font-semibold">{dinero(p.debe)}</span></div>
                </Link>
              </li>
            ))}
          </ul>
          {!lista.length && <div className="p-12 text-center text-texto2">No hay partidas con esos filtros.</div>}
          <div className="flex justify-between items-center px-5 py-3 border-t border-borde text-xs text-texto3">
            <span>{lista.length} partidas</span><span>Exportar el libro diario llega en el Sprint 2</span>
          </div>
        </Tarjeta>
      </Pagina>
    </Marco>
  );
}

/** HU-21 y HU-22: bandeja de borradores con contabilización por lote. */
export function Pendientes() {
  const { avisar, puede } = useApp();
  const [lista, setLista] = useState(PARTIDAS.filter((p) => p.estado === "Borrador"));
  const [sel, setSel] = useState<string[]>([]);
  const [confirmar, setConfirmar] = useState(false);
  const cuadradas = lista.filter((p) => p.debe === p.haber);
  const elegibles = sel.filter((id) => cuadradas.some((p) => p.id === id));
  const total = lista.filter((p) => elegibles.includes(p.id)).reduce((s, p) => s + p.debe, 0);
  const contador = puede("admin", "contador");
  const alternar = (id: string, v: boolean) => setSel(v ? [...sel, id] : sel.filter((x) => x !== id));

  return (
    <Marco ruta={[{ t: "Contabilidad" }, { t: "Pendientes" }]}>
      <Pagina ancho="max-w-[1120px]">
        <Titulo t="Bandeja de pendientes" sub={contador ? "Revisa los borradores y contabiliza los que cuadran." : "Tus borradores esperan la revisión del contador."}>
          <Link to="/partidas/nueva" className="h-11 px-5 rounded-full border border-bordef font-semibold inline-flex items-center justify-center gap-2 hover:bg-tarjeta2"><Plus size={17} />Nueva partida</Link>
        </Titulo>

        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {[["Borradores", lista.length], ["Cuadrados", cuadradas.length], ["Descuadrados", lista.length - cuadradas.length]].map(([t, v], i) => (
            <Tarjeta key={t} className="p-3 sm:p-4 min-w-0"><span className="block truncate text-xs sm:text-sm text-texto2">{t}</span><span className={cx("block text-2xl font-light cifra mt-1", i === 2 && v ? "text-alerta" : "")}>{v}</span></Tarjeta>
          ))}
        </div>

        {lista.length ? (
          <Tarjeta className="overflow-hidden">
            {contador && (
              <div className="flex items-center gap-3 px-5 py-3 border-b border-borde text-sm text-texto2">
                <Casilla label="Seleccionar todas las cuadradas" checked={cuadradas.length > 0 && elegibles.length === cuadradas.length}
                  indeterminado={elegibles.length > 0 && elegibles.length < cuadradas.length}
                  onChange={(v) => setSel(v ? cuadradas.map((p) => p.id) : [])} />
                Seleccionar las {cuadradas.length} cuadradas
              </div>
            )}
            <ul>
              {lista.map((p) => {
                const dif = p.debe - p.haber;
                return (
                  <li key={p.id} className={cx("flex gap-4 px-5 py-4 border-b border-borde last:border-0 items-start sm:items-center", sel.includes(p.id) && "bg-white/[.03]")}>
                    {contador && (dif ? <span className="w-[18px] shrink-0" title="Corrige la diferencia para contabilizarla" />
                      : <Casilla label={`Seleccionar ${p.concepto}`} checked={sel.includes(p.id)} onChange={(v) => alternar(p.id, v)} />)}
                    <Link to={`/partidas/${p.id}`} className="flex-1 min-w-0 grid sm:grid-cols-[minmax(0,1fr)_auto] gap-x-6 gap-y-1.5 items-center group">
                      <span className="min-w-0">
                        <span className="text-xs text-texto3 cifra">{p.fecha} · {p.tipo} · {p.autor}</span>
                        <span className="block font-semibold truncate group-hover:underline underline-offset-4 decoration-bordef">{p.concepto}</span>
                        {dif !== 0 && <span className="text-sm text-alerta font-semibold cifra">Diferencia US$ {dinero(Math.abs(dif))}</span>}
                      </span>
                      <span className="flex flex-wrap gap-x-4 gap-y-1.5 items-center text-sm text-texto2 cifra">
                        <span className="whitespace-nowrap">Debe {dinero(p.debe)}</span><span className="whitespace-nowrap">Haber {dinero(p.haber)}</span>
                        {dif ? <Etiqueta t="desc">Descuadrada</Etiqueta> : <Etiqueta t="borrador">Cuadrada</Etiqueta>}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Tarjeta>
        ) : (
          <Tarjeta className="p-14 grid justify-items-center gap-3 text-center">
            <span className="w-14 h-14 rounded-2xl bg-tarjeta2 grid place-items-center"><Inbox size={24} /></span>
            <h2 className="text-lg">Todo al día</h2><p className="text-texto2">No hay borradores pendientes en este período.</p>
          </Tarjeta>
        )}

        {contador && elegibles.length > 0 && (
          <div className="sticky bottom-4 flex items-center gap-3 pl-5 pr-2 py-2 rounded-full bg-pri text-prit shadow-flota font-semibold entra">
            <span className="flex-1 text-sm sm:text-sm">{elegibles.length} seleccionadas · US$ {dinero(total)}</span>
            <button type="button" onClick={() => setSel([])} className="h-10 px-4 rounded-full hover:bg-black/5 hidden sm:block">Quitar selección</button>
            <button type="button" onClick={() => setConfirmar(true)} className="h-10 px-5 rounded-full bg-prit text-pri">Contabilizar {elegibles.length}</button>
          </div>
        )}
        {!contador && lista.length > 0 && <p className="text-xs text-texto3 text-center">Solo el contador o el administrador pueden contabilizar.</p>}
      </Pagina>

      <Dialogo abierto={confirmar} onCerrar={() => setConfirmar(false)} titulo={`¿Contabilizar ${elegibles.length} partidas?`}
        sub="Recibirán los números correlativos 8 en adelante, en orden de fecha."
        pie={<><Boton v="fan" onClick={() => setConfirmar(false)}>Cancelar</Boton>
          <Boton v="pri" onClick={() => { setLista(lista.filter((p) => !elegibles.includes(p.id))); setSel([]); setConfirmar(false); avisar(`${elegibles.length} partidas contabilizadas`); }}>Contabilizar</Boton></>}>
        <ul className="bg-fondo rounded-2xl text-sm">
          {lista.filter((p) => elegibles.includes(p.id)).map((p, i) => (
            <li key={p.id} className="flex gap-3 px-4 py-2.5 border-b border-borde last:border-0"><span className="text-texto3 cifra">N.º {8 + i}</span><span className="flex-1 truncate">{p.concepto}</span><span className="cifra">{dinero(p.debe)}</span></li>
          ))}
        </ul>
        <p className="text-xs text-texto3 flex items-center gap-1.5"><FileSpreadsheet size={14} />Los descuadrados se quedan en la bandeja.</p>
      </Dialogo>
    </Marco>
  );
}
