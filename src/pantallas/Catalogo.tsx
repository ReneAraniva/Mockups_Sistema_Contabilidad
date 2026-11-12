import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, CornerDownRight, EllipsisVertical, Pencil, Plus, Power, Search, Upload } from "lucide-react";
import { useApp } from "../contexto";
import { CATALOGO, NIVEL, type Cuenta } from "../datos/ejemplo";
import { Marco, Permiso } from "../marco/Marco";
import { Aviso, Boton, BotonIcono, Campo, Dialogo, Entrada, Etiqueta, Flotante, Interruptor, OpcionFlot, Pagina, Segmento, Selector, Tarjeta, Titulo, cx } from "../ui";

const todosCodigos = (l: Cuenta[], out: string[] = []) => { l.forEach((c) => { if (c.h) { out.push(c.c); todosCodigos(c.h, out); } }); return out; };
const coincide = (c: Cuenta, q: string): boolean => c.c.startsWith(q) || c.n.toLowerCase().includes(q.toLowerCase()) || !!c.h?.some((x) => coincide(x, q));

/** HU-15, HU-16 y HU-18: catálogo de cuentas en árbol con búsqueda y mantenimiento. */
export function Catalogo() {
  const { puede, avisar } = useApp();
  const [abiertos, setAbiertos] = useState<string[]>(["1", "11", "1101", "2", "21"]);
  const [q, setQ] = useState("");
  const [inactivas, setInactivas] = useState(false);
  const [form, setForm] = useState<{ modo: "nueva" | "editar"; cuenta?: Cuenta; padre?: Cuenta } | null>(null);
  const [inactivar, setInactivar] = useState<Cuenta | null>(null);
  const [menuDe, setMenuDe] = useState<Cuenta | null>(null);
  const ancla = useRef<HTMLButtonElement | null>(null);
  const edita = puede("admin", "contador");

  const expandirNivel = (n: number) => setAbiertos(todosCodigos(CATALOGO).filter((c) => c.length < n));
  const visibles = useMemo(() => q ? todosCodigos(CATALOGO) : abiertos, [q, abiertos]);

  const fila = (c: Cuenta, prof: number): JSX.Element | null => {
    if (q && !coincide(c, q)) return null;
    if (!inactivas && c.activa === false) return null;
    const tieneHijos = !!c.h?.length;
    const abierto = visibles.includes(c.c);
    return (
      <div key={c.c}>
        <div className={cx("grid grid-cols-[minmax(0,1fr)_auto_40px] md:grid-cols-[minmax(0,1fr)_110px_140px_120px_40px] items-center gap-2 min-h-[52px] px-4 border-b border-borde hover:bg-white/[.02]",
          c.activa === false && "opacity-50")}>
          <div className="flex items-center gap-1.5 min-w-0 pl-[calc(var(--p)*10px)] sm:pl-[calc(var(--p)*20px)]" style={{ ["--p" as string]: prof }}>
            <button type="button" aria-label={abierto ? "Contraer" : "Expandir"} aria-expanded={abierto}
              onClick={() => setAbiertos(abierto ? abiertos.filter((x) => x !== c.c && !x.startsWith(c.c)) : [...abiertos, c.c])}
              className={cx("w-6 h-6 rounded-md grid place-items-center text-texto3 hover:bg-tarjeta2 shrink-0 transition-transform", abierto && "rotate-90", !tieneHijos && "invisible")}>
              <ChevronRight size={15} />
            </button>
            <span className="cifra text-texto2 sm:min-w-[86px]">{c.c}</span>
            <span className={cx("truncate", c.c.length <= 2 && "font-semibold")}>{c.n}</span>
          </div>
          <span className="hidden md:block text-sm text-texto2">{c.nat === "D" ? "Deudora" : "Acreedora"}</span>
          <span className="hidden md:block text-sm text-texto3">{NIVEL[c.c.length]}</span>
          <span className="justify-self-end md:justify-self-start">
            {c.activa === false ? <Etiqueta t="neutra">Inactiva</Etiqueta> : !tieneHijos ? <Etiqueta t="abierto">Imputable</Etiqueta> : null}
          </span>
          {edita ? (
            <BotonIcono aria-label={`Acciones de ${c.n}`} onClick={(e) => { ancla.current = e.currentTarget; setMenuDe(menuDe === c ? null : c); }}><EllipsisVertical size={16} /></BotonIcono>
          ) : <span />}
        </div>
        {tieneHijos && abierto && c.h!.map((h) => fila(h, prof + 1))}
      </div>
    );
  };

  return (
    <Marco ruta={[{ t: "Contabilidad" }, { t: "Catálogo de cuentas" }]}>
      <Pagina>
        <Titulo t="Catálogo de cuentas" sub="Catálogo empresarial para sociedad · 52 cuentas, 34 imputables">
          <Permiso roles={["admin", "contador"]}>
            <Link to="/importar" className="h-11 px-5 rounded-full border border-bordef font-semibold inline-flex items-center justify-center gap-2 hover:bg-tarjeta2"><Upload size={16} />Importar</Link>
            <Boton v="pri" onClick={() => setForm({ modo: "nueva" })}><Plus size={17} />Nueva cuenta</Boton>
          </Permiso>
        </Titulo>

        <Tarjeta className="overflow-hidden">
          <div className="flex gap-3 p-4 flex-wrap items-center border-b border-borde">
            <div className="relative flex-1 min-w-[220px]">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-texto3" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por código o nombre" aria-label="Buscar cuenta"
                className="w-full h-10 pl-10 pr-3 rounded-full border border-bordef bg-fondo outline-none focus:border-texto2 placeholder:text-texto3" />
            </div>
            <div className="flex items-center gap-2 text-sm text-texto2">Ver hasta
              <Segmento valor="" onChange={(v) => expandirNivel(+v)} opciones={[{ v: "2", t: "Clase" }, { v: "3", t: "Rubro" }, { v: "5", t: "Mayor" }, { v: "11", t: "Todo" }]} />
            </div>
            <label className="flex items-center gap-2 text-sm text-texto2"><Interruptor on={inactivas} onChange={setInactivas} label="Mostrar inactivas" />Inactivas</label>
          </div>
          <div className="hidden md:grid grid-cols-[minmax(0,1fr)_110px_140px_120px_40px] gap-2 px-4 py-2.5 border-b border-borde text-xs font-bold tracking-[.08em] uppercase text-texto3">
            <span className="pl-8">Cuenta</span><span>Naturaleza</span><span>Nivel</span><span>Tipo</span><span />
          </div>
          <div role="tree">{CATALOGO.map((c) => fila(c, 0))}</div>
          {q && !CATALOGO.some((c) => coincide(c, q)) && <p className="p-10 text-center text-texto2">Ninguna cuenta coincide con «{q}».</p>}
        </Tarjeta>
      </Pagina>

      <Flotante abierto={!!menuDe} onCerrar={() => setMenuDe(null)} ancla={ancla as React.RefObject<HTMLElement>} ancho={230}>
        <OpcionFlot icono={<Pencil size={16} />} onClick={() => { setForm({ modo: "editar", cuenta: menuDe! }); setMenuDe(null); }}>Editar</OpcionFlot>
        <OpcionFlot icono={<CornerDownRight size={16} />} onClick={() => { setForm({ modo: "nueva", padre: menuDe! }); setMenuDe(null); }}>Agregar subcuenta</OpcionFlot>
        <OpcionFlot icono={<Power size={16} />} onClick={() => { setInactivar(menuDe); setMenuDe(null); }}>{menuDe?.activa === false ? "Activar" : "Inactivar"}</OpcionFlot>
      </Flotante>

      <FormCuenta datos={form} onCerrar={() => setForm(null)} onGuardar={(m) => { setForm(null); avisar(m); }} />

      <Dialogo abierto={!!inactivar} onCerrar={() => setInactivar(null)} titulo={`¿Inactivar ${inactivar?.c} ${inactivar?.n}?`}
        sub="Tiene movimientos, por eso no se elimina: deja de aparecer al registrar partidas, pero conserva su historial."
        pie={<><Boton v="fan" onClick={() => setInactivar(null)}>Cancelar</Boton><Boton v="pel" onClick={() => { avisar("Cuenta inactivada"); setInactivar(null); }}>Inactivar</Boton></>}>
        <Aviso>Puedes activarla de nuevo cuando quieras con «Mostrar inactivas».</Aviso>
      </Dialogo>
    </Marco>
  );
}

function FormCuenta({ datos, onCerrar, onGuardar }: { datos: { modo: "nueva" | "editar"; cuenta?: Cuenta; padre?: Cuenta } | null; onCerrar: () => void; onGuardar: (m: string) => void }) {
  const c = datos?.cuenta, p = datos?.padre;
  const [codigo, setCodigo] = useState("");
  const [abiertoPara, setAbiertoPara] = useState<unknown>(null);
  if (datos !== abiertoPara) { setAbiertoPara(datos); setCodigo(c?.c ?? p?.c ?? ""); }
  const padre = c ? c.c.slice(0, c.c.length <= 2 ? c.c.length - 1 : c.c.length - 2) : p?.c ?? "";
  const malPadre = !!padre && !codigo.startsWith(padre);
  const malLargo = codigo.length > 0 && !NIVEL[codigo.length];

  return (
    <Dialogo lateral abierto={!!datos} onCerrar={onCerrar} titulo={datos?.modo === "editar" ? "Editar cuenta" : "Nueva cuenta"}
      sub={p ? `Subcuenta de ${p.c} ${p.n}` : c ? `${c.c} · ${c.n}` : "El código define su nivel en el árbol."}
      pie={<><Boton v="fan" onClick={onCerrar}>Cancelar</Boton><Boton v="pri" disabled={malPadre || malLargo || !codigo} onClick={() => onGuardar(datos?.modo === "editar" ? "Cuenta actualizada" : "Cuenta creada")}>Guardar</Boton></>}>
      <Campo label="Código" ayuda="1 clase · 2 rubro · 4 mayor · 6 subcuenta · 8 detalle · 10 analítica"
        error={malPadre ? `Debe empezar con ${padre}, el código de su cuenta padre.` : malLargo ? "Usa 1, 2, 4, 6, 8 o 10 dígitos." : undefined}>
        <Entrada value={codigo} onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))} mal={malPadre || malLargo} disabled={!!c} inputMode="numeric" className="cifra" />
      </Campo>
      {codigo && NIVEL[codigo.length] && <p className="text-sm text-texto2 -mt-2">Nivel: <b className="text-texto">{NIVEL[codigo.length]}</b></p>}
      <Campo label="Nombre"><Entrada defaultValue={c?.n} placeholder="Ej. Banco Agrícola · cuenta corriente" /></Campo>
      <Campo label="Naturaleza">
        <Selector defaultValue={c?.nat ?? p?.nat ?? "D"}><option value="D">Deudora</option><option value="A">Acreedora</option></Selector>
      </Campo>
      <Campo label="Cuenta padre"><Entrada value={padre ? `${padre}` : "Ninguna (clase)"} disabled className="cifra" /></Campo>
      {c && <Aviso>Esta cuenta tiene movimientos: el código y la naturaleza no se pueden cambiar.</Aviso>}
    </Dialogo>
  );
}
