import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowUpRight, Eye, Lock, Monitor, Smartphone, Tablet } from "lucide-react";
import { useApp } from "../contexto";
import { MENU, ROLES, SPRINTS, TODOS, type Rol } from "../datos/navegacion";
import { Etiqueta, Segmento, cx } from "../ui";

/** Qué cambia en la interfaz según el rol (matriz de permisos). */
const RESUMEN: Record<Rol, string> = {
  admin: "Ve todo el menú: usuarios, respaldos y reapertura de períodos. Puede contabilizar y editar la empresa.",
  contador: "Contabiliza, mantiene el catálogo, importa y cierra períodos. No administra usuarios ni edita la empresa.",
  auxiliar: "Registra partidas en borrador. No contabiliza, no importa ni ve la bitácora ni los usuarios.",
  consulta: "Solo ve: sin botones de crear ni contabilizar, sin bandeja de pendientes ni usuarios.",
};
type Acceso = "total" | "lectura" | "no";
function acceso(ruta: string | undefined, rol: Rol): Acceso {
  if (!ruta || ruta === "/login" || ruta === "/recuperar") return "total";
  if (ruta === "/partidas/nueva") return rol === "consulta" ? "no" : "total";
  const op = MENU.flatMap((g) => g.items).find((i) => i.ruta === ruta);
  if (!(op?.roles ?? TODOS).includes(rol)) return "no";
  const soloLectura: Record<string, Rol[]> = { "/empresa": ["contador", "auxiliar", "consulta"], "/sucursales": ["contador", "auxiliar", "consulta"], "/catalogo": ["auxiliar", "consulta"], "/partidas": ["consulta"], "/periodos": ["auxiliar", "consulta"], "/tablero": [] };
  return soloLectura[ruta]?.includes(rol) ? "lectura" : "total";
}

const leer = () => { try { return +(localStorage.getItem("proto-sprint") ?? "1"); } catch { return 1; } };

/** Índice del prototipo: pantallas agrupadas por sprint. */
export function Indice() {
  const [s, setS] = useState(leer());
  const { rol, setRol, avisar } = useApp();
  const ir = useNavigate();
  const sprint = SPRINTS.find((x) => x.s === s)!;
  const listas = sprint.pantallas.filter((p) => p.ruta).length;
  const elegir = (n: number) => { setS(n); try { localStorage.setItem("proto-sprint", String(n)); } catch { /* */ } };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 bg-barra/95 backdrop-blur border-b border-borde">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">
          <span className="w-9 h-9 rounded-xl bg-pri text-prit grid place-items-center font-bold text-sm">SC</span>
          <div className="min-w-0">
            <b className="block font-semibold leading-tight">Sistema Contable UNIVO</b>
            <span className="text-xs text-texto2">Prototipo de interfaz · solo diseño, nada se guarda</span>
          </div>
        </div>
        <nav className="max-w-[1320px] mx-auto px-4 sm:px-6 flex gap-1 overflow-x-auto overflow-y-hidden sin-barra" aria-label="Sprints">
          {SPRINTS.map((x) => {
            const n = x.pantallas.filter((p) => p.ruta).length;
            return (
              <button key={x.s} type="button" onClick={() => elegir(x.s)} aria-current={x.s === s}
                className={cx("h-12 px-4 -mb-px border-b-2 font-semibold whitespace-nowrap flex items-center gap-2 transition-colors",
                  x.s === s ? "border-texto text-texto" : "border-transparent text-texto2 hover:text-texto")}>
                Sprint {x.s}
                <span className={cx("text-xs h-5 px-2 rounded-full grid place-items-center", n ? "bg-pri text-prit" : "bg-tarjeta2 text-texto3")}>
                  {n ? `${n}/${x.pantallas.length}` : x.pantallas.length}
                </span>
              </button>
            );
          })}
        </nav>
      </header>

      <main className="max-w-[1320px] mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-xs font-bold tracking-[.08em] uppercase text-texto3">Sprint {s} · {sprint.fechas}</p>
            <h1 className="text-[32px] font-normal tracking-tight mt-1">{sprint.meta}</h1>
            <p className="text-texto2 mt-2">{listas ? `${listas} de ${sprint.pantallas.length} pantallas listas para probar.` : "Pantallas planificadas; se diseñan en las siguientes tandas."}</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-texto2">Ver las pantallas como</span>
            <Segmento<Rol> valor={rol} onChange={(r) => { setRol(r); avisar(`Viendo como ${ROLES[r]}`); }}
              opciones={(Object.keys(ROLES) as Rol[]).map((k) => ({ v: k, t: k === "admin" ? "Admin." : ROLES[k].split(" ")[0] }))} />
            <p key={rol} className="pantalla text-xs text-texto2 max-w-[360px]">{RESUMEN[rol]}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sprint.pantallas.map((p) => { const ac = acceso(p.ruta, rol); return (
            <article key={p.n + rol}
              className={cx("pantalla bg-tarjeta border rounded-2xl p-5 flex flex-col gap-3 transition-colors", !p.ruta ? "opacity-60 border-borde" : ac === "no" ? "border-borde opacity-70" : "border-borde hover:border-bordef")}>
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-lg font-semibold">{p.n}</h2>
                {!p.ruta ? <Etiqueta t="borrador">En diseño</Etiqueta>
                  : ac === "no" ? <Etiqueta t="neutra"><Lock size={12} />Sin acceso</Etiqueta>
                  : ac === "lectura" ? <Etiqueta t="abierto"><Eye size={12} />Solo lectura</Etiqueta>
                  : <Etiqueta t="contab">Lista</Etiqueta>}
              </div>
              <p className="text-texto2 text-sm flex-1">{p.desc}</p>
              <p className="text-xs text-texto3 cifra">{p.hu}</p>
              {p.ruta && (
                <div className="flex gap-2 pt-1">
                  <Link to={p.ruta} className="flex-1 h-10 rounded-full bg-pri text-prit font-semibold inline-flex items-center justify-center gap-2 text-sm">
                    Abrir <ArrowUpRight size={15} />
                  </Link>
                  <button type="button" aria-label="Ver en tableta" title="Tableta" onClick={() => ir(`/visor/tableta?p=${p.ruta}`)}
                    className="w-10 h-10 rounded-full border border-bordef grid place-items-center hover:bg-tarjeta2"><Tablet size={16} /></button>
                  <button type="button" aria-label="Ver en celular" title="Celular" onClick={() => ir(`/visor/celular?p=${p.ruta}`)}
                    className="w-10 h-10 rounded-full border border-bordef grid place-items-center hover:bg-tarjeta2"><Smartphone size={16} /></button>
                </div>
              )}
            </article>
          ); })}
        </div>

        <p className="text-xs text-texto3 flex items-center gap-2"><Monitor size={14} />Dentro de cada pantalla, el menú de hamburguesa lleva a las demás y su pie tiene «Índice del prototipo» para volver aquí.</p>
      </main>
    </div>
  );
}
