import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Building2, Check, ChevronRight, Globe, LayoutGrid, LogOut, Menu, MapPin, Search, Settings, User, X } from "lucide-react";
import { EMPRESAS, PERIODOS, useApp } from "../contexto";
import { MENU, ROLES, TODOS, type Rol } from "../datos/navegacion";
import { Flotante, OpcionFlot, Segmento, TitFlot, cx } from "../ui";
import { Isologo } from "../ui/Logo";

const esMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
export const ATAJO = esMac ? "⌘ K" : "Ctrl K";
const Tecla = ({ children }: { children: ReactNode }) => (
  <kbd className="inline-grid place-items-center min-w-[22px] h-[22px] px-1.5 rounded-md border border-bordef bg-tarjeta2 text-[11px] font-sans font-semibold text-texto2">{children}</kbd>
);
const sinAcentos = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/** Estructura común: solo header arriba; el menú se despliega flotando sobre el contenido. */
export function Marco({ ruta, children }: { ruta: { t: string; a?: string }[]; children: ReactNode }) {
  const { rol, setRol, usuario, empresa, setEmpresa, sucursal, setSucursal, periodo, setPeriodo, avisar } = useApp();
  const [menu, setMenu] = useState(false);
  const [pop, setPop] = useState<"" | "empresa" | "periodo" | "usuario">("");
  const [q, setQ] = useState("");
  const [foco, setFoco] = useState(0);
  const lista = useRef<HTMLDivElement>(null);
  const buscar = useRef<HTMLInputElement>(null);
  const aEmp = useRef<HTMLButtonElement>(null), aPer = useRef<HTMLButtonElement>(null), aUsu = useRef<HTMLButtonElement>(null);
  const loc = useLocation();
  const ir = useNavigate();
  const emp = EMPRESAS[empresa] ?? EMPRESAS[0];
  const per = PERIODOS.find((p) => p.n === periodo) ?? PERIODOS[0];

  useEffect(() => { setMenu(false); setQ(""); window.scrollTo(0, 0); }, [loc.pathname]);
  useEffect(() => {
    if (!menu) {
      // al cerrar, el foco sale del buscador oculto para que los atajos sigan funcionando
      if (document.activeElement === buscar.current) buscar.current?.blur();
      return;
    }
    setTimeout(() => buscar.current?.focus(), 60);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setMenu(false);
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [menu]);
  // Atajos: Ctrl K (⌘ K en Mac) abre o cierra el menú; "/" lo abre si no estás escribiendo
  useEffect(() => {
    const atajo = (e: KeyboardEvent) => {
      const escribiendo = (e.target as HTMLElement).closest("input, textarea, select, [contenteditable]");
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setPop(""); setMenu((m) => !m); }
      else if (e.key === "/" && !escribiendo && !document.querySelector("dialog[open]")) { e.preventDefault(); setPop(""); setMenu(true); }
    };
    document.addEventListener("keydown", atajo);
    return () => document.removeEventListener("keydown", atajo);
  }, []);
  useEffect(() => setFoco(0), [q, menu]);
  useEffect(() => { lista.current?.querySelector('[data-foco="true"]')?.scrollIntoView({ block: "nearest" }); }, [foco]);

  const grupos = MENU.map((g) => ({
    ...g,
    items: g.items.filter((it) => (it.roles ?? TODOS).includes(rol) && sinAcentos(it.n).includes(sinAcentos(q))),
  })).filter((g) => g.items.length);

  const planos = grupos.flatMap((g) => g.items);
  const teclas = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setFoco((f) => (f + 1) % planos.length); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setFoco((f) => (f - 1 + planos.length) % planos.length); }
    else if (e.key === "Enter" && planos[foco]) { e.preventDefault(); elegir(planos[foco]); }
  };
  const elegir = (it: (typeof MENU)[number]["items"][number]) => {
    if (it.ruta) ir(it.ruta);
    else { setMenu(false); avisar(`«${it.n}» se diseña en el Sprint ${it.s}`); }
  };

  return (
    <>
      <header className={cx("sticky top-0 h-[60px]", menu ? "z-[61]" : "z-40", " sm:h-16 px-3 sm:px-5 flex items-center gap-2 sm:gap-3 bg-barra border-b border-borde")}>
        <button type="button" onClick={() => setMenu(!menu)} aria-label={menu ? "Cerrar menú" : "Abrir menú"} aria-expanded={menu}
          title={`${menu ? "Cerrar" : "Abrir"} menú (${ATAJO})`} aria-keyshortcuts={esMac ? "Meta+K" : "Control+K"}
          className={cx("w-10 h-10 rounded-full border grid place-items-center shrink-0 transition-colors relative z-[61]",
            menu ? "bg-pri text-prit border-pri" : "bg-tarjeta border-borde hover:bg-tarjeta2")}>
          {menu ? <X size={18} /> : <Menu size={18} />}
        </button>
        <Link to="/tablero" aria-label="EQUUS · Ir al tablero" className="shrink-0 px-1 hidden min-[380px]:block"><Isologo alto={30} /></Link>
        <nav aria-label="Ubicación" className="flex items-center gap-1.5 text-sm text-texto2 min-w-0">
          {ruta.map((r, i) => i < ruta.length - 1 ? (
            <span key={r.t} className="hidden sm:flex items-center gap-1.5">
              {r.a ? <Link to={r.a} className="hover:text-texto">{r.t}</Link> : <span>{r.t}</span>}
              <ChevronRight size={14} className="text-texto3" />
            </span>
          ) : <b key={r.t} className="text-texto font-semibold truncate">{r.t}</b>)}
        </nav>
        <div className="flex-1" />
        <button ref={aEmp} type="button" onClick={() => setPop(pop === "empresa" ? "" : "empresa")} aria-haspopup="true" aria-expanded={pop === "empresa"}
          className="h-9 px-3.5 rounded-full border border-borde bg-tarjeta hover:border-bordef inline-flex items-center gap-2 text-xs whitespace-nowrap min-w-0">
          <Building2 size={14} className="shrink-0" /><span className="hidden md:inline">{emp.c} ·</span><span className="truncate">{sucursal}</span>
        </button>
        <button ref={aPer} type="button" onClick={() => setPop(pop === "periodo" ? "" : "periodo")} aria-haspopup="true" aria-expanded={pop === "periodo"}
          className="hidden sm:inline-flex h-9 px-3.5 rounded-full border border-borde bg-tarjeta hover:border-bordef items-center gap-2 text-xs whitespace-nowrap">
          <span className={cx("w-[7px] h-[7px] rounded-full", per.abierto ? "bg-texto" : "border-[1.5px] border-texto2")} />
          {per.n} · {per.abierto ? "abierto" : "cerrado"}
        </button>
        <button ref={aUsu} type="button" onClick={() => setPop(pop === "usuario" ? "" : "usuario")} aria-label="Cuenta de usuario"
          className="w-9 h-9 rounded-full bg-pri text-prit font-bold text-xs shrink-0">{usuario.iniciales}</button>
      </header>

      {/* Menú flotante */}
      <div onClick={() => setMenu(false)}
        className={cx("fixed inset-0 z-50 bg-black/55 backdrop-blur-[2px] transition-opacity", menu ? "opacity-100" : "opacity-0 pointer-events-none")} />
      <div role="dialog" aria-label="Menú principal" aria-hidden={!menu}
        className={cx("fixed z-[60] top-[68px] sm:top-[72px] left-2 sm:left-4 w-[calc(100vw-16px)] sm:w-[min(1040px,calc(100vw-32px))] max-h-[calc(100vh-84px)]",
          "bg-tarjeta border border-borde rounded-[20px] sm:rounded-3xl shadow-flota flex flex-col overflow-hidden origin-top-left transition-all duration-200",
          menu ? "opacity-100 scale-100" : "opacity-0 scale-[.98] -translate-y-2 pointer-events-none")}>
        <div className="flex gap-3 items-center p-4 pb-3 border-b border-borde">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-texto3" />
            <input ref={buscar} value={q} onChange={(e) => setQ(e.target.value)} type="search" placeholder="Buscar pantalla…" aria-label="Buscar pantalla"
              onKeyDown={teclas} aria-controls="menu-lista" aria-activedescendant={planos[foco] ? `op-${foco}` : undefined}
              className="w-full h-10 pl-10 pr-3.5 rounded-full border border-bordef bg-fondo outline-none focus:border-texto2 placeholder:text-texto3" />
          </div>
          <span className="hidden sm:flex items-center gap-1.5 text-xs text-texto3"><Tecla>Esc</Tecla>cerrar</span>
        </div>
        <div ref={lista} id="menu-lista" role="listbox" className="overflow-y-auto p-3 columns-1 sm:columns-2 lg:columns-3 gap-3">
          {grupos.map((g) => (
            <div key={g.t} className="py-2 px-1 break-inside-avoid">
              <div className="text-xs font-bold tracking-[.08em] uppercase text-texto3 px-2.5 pb-1.5">{g.t}</div>
              {g.items.map((it) => {
                const activa = it.ruta === loc.pathname;
                const idx = planos.indexOf(it);
                const enfocada = idx === foco;
                const I = it.ico;
                return (
                  <button key={it.n} id={`op-${idx}`} role="option" aria-selected={enfocada} data-foco={enfocada} type="button"
                    onClick={() => elegir(it)} onMouseMove={() => setFoco(idx)}
                    className={cx("flex items-center gap-2.5 w-full h-10 px-2.5 rounded-xl text-sm text-left transition-colors",
                      activa ? "bg-pri text-prit font-semibold" : enfocada ? "bg-tarjeta2 text-texto ring-1 ring-bordef" : "text-texto2",
                      !it.ruta && !enfocada && "opacity-55")}>
                    <I size={17} /><span className="flex-1 truncate">{it.n}</span>
                    {enfocada && <span className="hidden sm:inline-flex"><Tecla>↵</Tecla></span>}
                    {it.badge ? <span className="min-w-5 h-5 px-1.5 rounded-full bg-alertaf text-alerta text-xs font-bold grid place-items-center">{it.badge}</span>
                      : !it.ruta && <span className="text-xs text-texto3">S{it.s}</span>}
                  </button>
                );
              })}
            </div>
          ))}
          {!grupos.length && <p className="text-texto2 p-6 text-center">No hay pantallas con «{q}».</p>}
        </div>
        <div className="hidden sm:flex items-center gap-4 px-5 py-2 border-t border-borde text-xs text-texto3 bg-fondo/40">
          <span className="flex items-center gap-1.5"><Tecla>↑</Tecla><Tecla>↓</Tecla>moverse</span>
          <span className="flex items-center gap-1.5"><Tecla>↵</Tecla>abrir</span>
          <span className="flex items-center gap-1.5"><Tecla>{esMac ? "⌘" : "Ctrl"}</Tecla><Tecla>K</Tecla>abrir o cerrar el menú</span>
          <span className="flex items-center gap-1.5"><Tecla>/</Tecla>buscar desde cualquier pantalla</span>
        </div>
        <div className="flex items-center gap-3 px-4 py-3 border-t border-borde text-sm">
          <span className="w-9 h-9 rounded-full bg-pri text-prit font-bold text-xs grid place-items-center shrink-0">{usuario.iniciales}</span>
          <div className="flex-1 min-w-0"><b className="block font-semibold truncate">{usuario.nombre}</b><span className="text-texto2 text-xs">{ROLES[rol]} · {emp.c}</span></div>
          <Link to="/" className="h-9 px-3.5 rounded-full border border-bordef hover:bg-tarjeta2 inline-flex items-center gap-2 font-semibold whitespace-nowrap">
            <LayoutGrid size={15} /><span className="sm:hidden">Índice</span><span className="hidden sm:inline">Índice del prototipo</span>
          </Link>
          <Link to="/login" aria-label="Cerrar sesión" className="h-9 px-3 rounded-full hover:bg-tarjeta2 inline-flex items-center gap-2 font-semibold">
            <LogOut size={15} /><span className="hidden sm:inline">Salir</span>
          </Link>
        </div>
      </div>

      {/* Selectores del header */}
      <Flotante abierto={pop === "empresa"} onCerrar={() => setPop("")} ancla={aEmp} ancho={320}>
        <TitFlot>Empresa</TitFlot>
        {EMPRESAS.map((e, i) => (
          <OpcionFlot key={e.n} sel={i === empresa} icono={<Building2 size={16} />} extra={i === empresa && <Check size={16} />}
            onClick={() => { setEmpresa(i); avisar(`Trabajando en ${e.c}`); }}>{e.n}</OpcionFlot>
        ))}
        <div className="h-px bg-borde my-1.5" />
        <TitFlot>Sucursal</TitFlot>
        {emp.suc.map((s) => (
          <OpcionFlot key={s} sel={s === sucursal} icono={<MapPin size={16} />} extra={s === sucursal && <Check size={16} />}
            onClick={() => { setSucursal(s); setPop(""); }}>{s}</OpcionFlot>
        ))}
        <p className="text-xs text-texto3 px-2.5 py-2">Se recuerda tu última selección.</p>
      </Flotante>

      <Flotante abierto={pop === "periodo"} onCerrar={() => setPop("")} ancla={aPer} ancho={260}>
        <TitFlot>Período de trabajo</TitFlot>
        {PERIODOS.map((p) => (
          <OpcionFlot key={p.n} sel={p.n === periodo} onClick={() => { setPeriodo(p.n); setPop(""); }}
            icono={<span className={cx("w-[7px] h-[7px] rounded-full", p.abierto ? "bg-texto" : "border-[1.5px] border-texto2")} />}
            extra={<span className="text-xs text-texto3">{p.abierto ? "abierto" : "cerrado"}</span>}>{p.n}</OpcionFlot>
        ))}
        <div className="h-px bg-borde my-1.5" />
        <OpcionFlot onClick={() => ir("/periodos")} icono={<Settings size={16} />}>Administrar períodos</OpcionFlot>
      </Flotante>

      <Flotante abierto={pop === "usuario"} onCerrar={() => setPop("")} ancla={aUsu} ancho={290}>
        <div className="px-2.5 pt-2 pb-1.5"><b>{usuario.nombre}</b><div className="text-texto2 text-xs truncate">{usuario.correo}</div></div>
        <div className="h-px bg-borde my-1.5" />
        <TitFlot>Ver como (solo prototipo)</TitFlot>
        {(Object.keys(ROLES) as Rol[]).map((k) => (
          <OpcionFlot key={k} sel={k === rol} icono={<User size={16} />} extra={k === rol && <Check size={16} />}
            onClick={() => { setRol(k); setPop(""); avisar(`Viendo como ${ROLES[k]}`); }}>{ROLES[k]}</OpcionFlot>
        ))}
        <div className="h-px bg-borde my-1.5" />
        <div className="flex items-center justify-between px-2.5 py-1.5">
          <span className="flex items-center gap-2 text-texto2 text-sm"><Globe size={16} />Idioma</span>
          <Segmento valor="es" opciones={[{ v: "es", t: "ES" }, { v: "en", t: "EN" }]}
            onChange={(v) => v === "en" && ir("/perfil")} />
        </div>
        <div className="h-px bg-borde my-1.5" />
        <OpcionFlot icono={<Settings size={16} />} onClick={() => ir("/perfil")}>Mi perfil</OpcionFlot>
        <OpcionFlot icono={<LogOut size={16} />} onClick={() => ir("/login")}>Cerrar sesión</OpcionFlot>
      </Flotante>

      {children}
      <footer className="text-center text-texto3 text-xs pb-6">EQUUS · Tu mejor movimiento contable · UNIVO · v0.1.0</footer>
    </>
  );
}

/** Oculta su contenido si el rol activo no tiene permiso (HU-10: la interfaz oculta lo no permitido). */
export function Permiso({ roles, children }: { roles: Rol[]; children: ReactNode }) {
  const { rol } = useApp();
  return roles.includes(rol) ? <>{children}</> : null;
}
