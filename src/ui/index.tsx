import {
  forwardRef, useEffect, useLayoutEffect, useRef, useState,
  type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes,
} from "react";
import { CircleAlert, Info, X } from "lucide-react";

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

/** US$ con separador de miles y dos decimales (RNF-07). */
export const dinero = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Valida un correo y explica qué está mal. Devuelve "" si es válido. */
export function errorCorreo(valor: string): string {
  const c = valor.trim();
  if (!c) return "Escribe tu correo.";
  if (/\s/.test(c)) return "El correo no puede llevar espacios.";
  const arrobas = (c.match(/@/g) || []).length;
  if (arrobas === 0) return "Falta la @. Escríbelo así: chero@gmail.com";
  if (arrobas > 1) return "El correo solo puede llevar una @.";
  const [usuario, dominio] = c.split("@");
  if (!usuario) return "Falta tu usuario antes de la @. Ej: chero@gmail.com";
  if (!dominio) return "Falta el dominio después de la @. Ej: gmail.com";
  if (!dominio.includes(".")) return "Al dominio le falta la terminación, como .com o .sv";
  if (/^\.|\.$|\.\./.test(dominio) || /^\.|\.$|\.\./.test(usuario)) return "Revisa los puntos: no puede haber dos seguidos ni al inicio o al final.";
  if (!/^[A-Za-z0-9._%+-]+$/.test(usuario)) return "El usuario del correo tiene caracteres no válidos.";
  if (!/^[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/.test(dominio)) return "No es una dirección de correo válida. Revisa cómo está escrita.";
  return "";
}

/* ---------- Botones ---------- */
type Var = "pri" | "sec" | "fan" | "pel";
const VARIANTES: Record<Var, string> = {
  pri: "bg-pri text-prit border-pri hover:bg-[#E5E5E5]",
  sec: "border-bordef hover:bg-tarjeta2",
  fan: "border-transparent hover:bg-tarjeta2",
  pel: "text-alerta border-alertab hover:bg-alertaf",
};
export function Boton({ v = "sec", peq, className, children, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { v?: Var; peq?: boolean }) {
  return (
    <button type="button" {...p}
      className={cx("inline-flex items-center justify-center gap-2 rounded-full border font-semibold whitespace-nowrap transition-colors",
        peq ? "h-9 px-3.5 text-sm" : "h-11 px-5 text-sm",
        "disabled:bg-tarjeta2 disabled:text-texto3 disabled:border-borde disabled:cursor-not-allowed",
        VARIANTES[v], className)}>
      {children}
    </button>
  );
}
export function BotonIcono({ className, children, ...p }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" {...p} className={cx("inline-grid place-items-center w-9 h-9 rounded-full text-texto3 hover:bg-tarjeta2 hover:text-texto transition-colors", className)}>
      {children}
    </button>
  );
}

/* ---------- Formularios ---------- */
export function Campo({ label, ayuda, error, children, className, grande }: { label: string; ayuda?: string; error?: string; children: ReactNode; className?: string; grande?: boolean }) {
  return (
    <label className={cx("flex flex-col gap-1.5 min-w-0", className)}>
      <span className={cx("font-semibold", grande ? "text-[15px]" : "text-xs")}>{label}</span>
      {children}
      {ayuda && !error && <span className="text-xs text-texto3">{ayuda}</span>}
      {error && <span className={cx("text-alerta flex items-center gap-1", grande ? "text-sm" : "text-xs")}><CircleAlert size={13} />{error}</span>}
    </label>
  );
}
const baseEntrada = "h-11 w-full px-3.5 rounded-xl border bg-fondo outline-none transition-colors placeholder:text-texto3 focus:border-texto2";
export const Entrada = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { mal?: boolean }>(
  ({ mal, className, ...p }, ref) => <input ref={ref} {...p} className={cx(baseEntrada, mal ? "border-alerta" : "border-bordef", className)} />,
);
export function Selector({ className, children, ...p }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...p} className={cx(baseEntrada, className?.includes("w-auto") && "!w-auto", "border-bordef appearance-none pr-9 bg-no-repeat bg-[right_14px_center]", className)}
      style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23A3A3A3' stroke-width='2.5' stroke-linecap='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")" }}>
      {children}
    </select>
  );
}
export function Area({ className, ...p }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...p} className={cx(baseEntrada, "h-auto py-3 border-bordef resize-y", className)} />;
}
export function Interruptor({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)}
      className={cx("relative w-10 h-6 rounded-full shrink-0 transition-colors", on ? "bg-pri" : "bg-bordef")}>
      <span className={cx("absolute top-[3px] left-[3px] w-[18px] h-[18px] rounded-full transition-transform", on ? "translate-x-4 bg-prit" : "bg-texto")} />
    </button>
  );
}
export function Casilla({ checked, onChange, label, indeterminado }: { checked: boolean; onChange: (v: boolean) => void; label: string; indeterminado?: boolean }) {
  const r = useRef<HTMLInputElement>(null);
  useEffect(() => { if (r.current) r.current.indeterminate = !!indeterminado; }, [indeterminado]);
  return <input ref={r} type="checkbox" aria-label={label} checked={checked} onChange={(e) => onChange(e.target.checked)} className="w-[18px] h-[18px] accent-[#FAFAFA] cursor-pointer" />;
}

/* ---------- Segmento y pestañas ---------- */
export function Segmento<T extends string>({ valor, opciones, onChange }: { valor: T; opciones: { v: T; t: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex p-1 rounded-full bg-fondo border border-borde gap-0.5">
      {opciones.map((o) => (
        <button key={o.v} type="button" onClick={() => onChange(o.v)}
          className={cx("h-8 px-3.5 rounded-full text-sm font-semibold transition-colors", valor === o.v ? "bg-pri text-prit" : "text-texto2 hover:text-texto")}>
          {o.t}
        </button>
      ))}
    </div>
  );
}
export function Pestanas<T extends string>({ valor, opciones, onChange }: { valor: T; opciones: { v: T; t: string; n?: number }[]; onChange: (v: T) => void }) {
  return (
    <div className="flex gap-1 border-b border-borde overflow-x-auto overflow-y-hidden sin-barra" role="tablist">
      {opciones.map((o) => (
        <button key={o.v} role="tab" aria-selected={valor === o.v} type="button" onClick={() => onChange(o.v)}
          className={cx("h-11 px-4 -mb-px border-b-2 font-semibold whitespace-nowrap transition-colors flex items-center gap-2",
            valor === o.v ? "text-texto border-texto" : "text-texto2 border-transparent hover:text-texto")}>
          {o.t}{o.n !== undefined && <span className="text-xs text-texto3 cifra">{o.n}</span>}
        </button>
      ))}
    </div>
  );
}

/* ---------- Contenedores ---------- */
export function Tarjeta({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={cx("bg-tarjeta border border-borde rounded-2xl", className)}>{children}</section>;
}
export function CabTarjeta({ titulo, sub, children }: { titulo: ReactNode; sub?: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-borde flex-wrap">
      <div><h2 className="text-base font-semibold">{titulo}</h2>{sub && <p className="text-xs text-texto2 mt-0.5">{sub}</p>}</div>
      {children && <div className="flex gap-2 items-center flex-wrap">{children}</div>}
    </div>
  );
}
export function Pagina({ ancho = "max-w-[1320px]", children }: { ancho?: string; children: ReactNode }) {
  return <main className={cx("pantalla mx-auto px-4 sm:px-6 pt-6 sm:pt-8 pb-24 flex flex-col gap-5", ancho)}>{children}</main>;
}
export function Titulo({ t, sub, children }: { t: string; sub?: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-4 flex-wrap">
      <div><h1 className="text-[28px] sm:text-[32px] font-normal tracking-tight">{t}</h1>{sub && <p className="text-texto2 mt-1">{sub}</p>}</div>
      {children && <div className="flex gap-2 flex-wrap items-center w-full sm:w-auto [&>*]:flex-1 sm:[&>*]:flex-none">{children}</div>}
    </div>
  );
}

/* ---------- Estados ---------- */
export type TipoEtq = "borrador" | "contab" | "anulada" | "desc" | "neutra" | "abierto" | "cerrado";
const ETQ: Record<TipoEtq, string> = {
  borrador: "border border-dashed border-texto3 text-texto2",
  contab: "bg-pri text-prit",
  anulada: "bg-tarjeta2 text-texto3 line-through",
  desc: "bg-alertaf text-alerta",
  neutra: "bg-tarjeta2 text-texto2",
  abierto: "border border-bordef text-texto",
  cerrado: "bg-tarjeta2 text-texto3",
};
export function Etiqueta({ t, children }: { t: TipoEtq; children: ReactNode }) {
  return <span className={cx("inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-xs font-bold whitespace-nowrap", ETQ[t])}>{children}</span>;
}
export function Aviso({ mal, children, className }: { mal?: boolean; children: ReactNode; className?: string }) {
  return (
    <div role={mal ? "alert" : "note"} className={cx("flex gap-2.5 items-start px-4 py-3 rounded-2xl border text-sm",
      mal ? "bg-alertaf border-alertab text-alerta" : "bg-tarjeta2 border-borde text-texto2", className)}>
      {mal ? <CircleAlert size={16} className="shrink-0 mt-0.5" /> : <Info size={16} className="shrink-0 mt-0.5" />}
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/* ---------- Tablas ---------- */
export const th = "text-left text-xs font-bold tracking-[.08em] uppercase text-texto3 px-4 py-3 border-b border-borde whitespace-nowrap";
export const td = "px-4 py-3 border-b border-borde align-middle";

/* ---------- Diálogos ---------- */
export function Dialogo({ abierto, onCerrar, titulo, sub, children, pie, ancho = "max-w-[560px]", lateral }: {
  abierto: boolean; onCerrar: () => void; titulo: string; sub?: ReactNode; children: ReactNode; pie?: ReactNode; ancho?: string; lateral?: boolean;
}) {
  const r = useRef<HTMLDialogElement>(null);
  const [cerrando, setCerrando] = useState(false);
  useEffect(() => {
    const d = r.current; if (!d) return;
    if (abierto && !d.open) { setCerrando(false); d.showModal(); }
    if (!abierto && d.open) {
      // animación de salida antes de cerrar
      setCerrando(true);
      const t = setTimeout(() => { d.close(); setCerrando(false); }, 180);
      return () => clearTimeout(t);
    }
  }, [abierto]);
  return (
    <dialog ref={r} data-cerrando={cerrando || undefined} data-lateral={lateral || undefined}
      onCancel={(e) => { e.preventDefault(); onCerrar(); }}
      onClick={(e) => { if (e.target === r.current) onCerrar(); }}
      className={cx("dlg bg-tarjeta text-texto border border-borde shadow-flota p-0 w-[calc(100vw-32px)]",
        lateral ? "m-2 ml-auto h-[calc(100vh-16px)] max-h-none rounded-3xl max-w-[520px] open:flex flex-col" : "rounded-3xl " + ancho)}>
      <div className="px-6 pt-6 flex justify-between items-start gap-3">
        <div><h2 className="text-xl font-medium">{titulo}</h2>{sub && <p className="text-sm text-texto2 mt-1">{sub}</p>}</div>
        <BotonIcono aria-label="Cerrar" onClick={onCerrar}><X size={18} /></BotonIcono>
      </div>
      <div className={cx("px-6 py-5 grid gap-4 content-start", lateral && "flex-1 overflow-y-auto")}>{children}</div>
      {pie && <div className="px-6 pt-2 pb-6 flex justify-end gap-2 flex-wrap">{pie}</div>}
    </dialog>
  );
}

/** Panel flotante anclado a un botón (selectores del header, menús de fila). */
export function Flotante({ abierto, onCerrar, ancla, children, ancho = 280, alinear = "der" }: {
  abierto: boolean; onCerrar: () => void; ancla: React.RefObject<HTMLElement>; children: ReactNode; ancho?: number; alinear?: "der" | "izq";
}) {
  const r = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  useLayoutEffect(() => {
    if (!abierto || !ancla.current) return;
    const b = ancla.current.getBoundingClientRect();
    const w = Math.min(ancho, innerWidth - 16);
    const left = alinear === "der" ? b.right - w : b.left;
    setPos({ top: b.bottom + 8, left: Math.max(8, Math.min(left, innerWidth - w - 8)) });
  }, [abierto, ancla, ancho, alinear]);
  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: MouseEvent) => {
      if (!r.current?.contains(e.target as Node) && !ancla.current?.contains(e.target as Node)) onCerrar();
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onCerrar();
    document.addEventListener("mousedown", fuera); document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", fuera); document.removeEventListener("keydown", esc); };
  }, [abierto, onCerrar, ancla]);
  const [visible, setVisible] = useState(abierto);
  useEffect(() => {
    if (abierto) { setVisible(true); return; }
    const t = setTimeout(() => setVisible(false), 150);
    return () => clearTimeout(t);
  }, [abierto]);
  if (!abierto && !visible) return null;
  return (
    <div ref={r} style={{ ...pos, width: Math.min(ancho, innerWidth - 16) }}
      className={cx("fixed z-[70] bg-tarjeta border border-borde rounded-[20px] shadow-flota p-2 origin-top", abierto ? "pop-entra" : "pop-sale")}>
      {children}
    </div>
  );
}
export function OpcionFlot({ children, sel, onClick, icono, extra }: { children: ReactNode; sel?: boolean; onClick?: () => void; icono?: ReactNode; extra?: ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className={cx("flex items-center gap-2.5 w-full h-10 px-2.5 rounded-xl text-left text-sm transition-colors hover:bg-tarjeta2 hover:text-texto", sel ? "text-texto font-semibold" : "text-texto2")}>
      {icono}<span className="flex-1 truncate">{children}</span>{extra}
    </button>
  );
}
export const TitFlot = ({ children }: { children: ReactNode }) => (
  <div className="text-xs font-bold tracking-[.08em] uppercase text-texto3 px-2.5 pt-2 pb-1">{children}</div>
);

/* ---------- Pasos ---------- */
export function Pasos({ pasos, actual }: { pasos: string[]; actual: number }) {
  return (
    <ol className="flex gap-2 items-center flex-wrap">
      {pasos.map((p, i) => (
        <li key={p} className="flex items-center gap-2">
          {i > 0 && <span className="w-8 h-px bg-bordef" />}
          <span className={cx("flex items-center gap-2 text-sm font-semibold", i <= actual ? "text-texto" : "text-texto3")}>
            <i className={cx("not-italic w-[26px] h-[26px] rounded-full grid place-items-center text-xs border",
              i <= actual ? "bg-pri text-prit border-pri" : "border-bordef")}>{i + 1}</i>
            <span className={cx(i !== actual && "hidden sm:inline")}>{p}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}
