import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Loader2, Monitor, RotateCw, Smartphone, Tablet } from "lucide-react";
import { SPRINTS } from "../datos/navegacion";
import { cx } from "../ui";

const TAMANOS = {
  celular: { w: 390, h: 844, borde: 12, radio: 48, ico: Smartphone, t: "Celular · 390 × 844" },
  tableta: { w: 820, h: 1180, borde: 16, radio: 36, ico: Tablet, t: "Tableta · 820 × 1180" },
} as const;

/** Muestra una pantalla dentro de un marco de celular o tableta, escalado para que quepa completo (RNF-03). */
export function Visor() {
  const { tipo = "celular" } = useParams();
  const [qs] = useSearchParams();
  const ir = useNavigate();
  const p = qs.get("p") ?? "/tablero";
  const t = TAMANOS[tipo as keyof typeof TAMANOS] ?? TAMANOS.celular;
  const nombre = SPRINTS.flatMap((s) => s.pantallas).find((x) => x.ruta === p)?.n ?? p;
  const src = `${location.pathname}${location.search}#${p}`;
  const area = useRef<HTMLDivElement>(null);
  const [escala, setEscala] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [version, setVersion] = useState(0);

  // Escala el dispositivo para que siempre quepa completo en la ventana
  useEffect(() => {
    const calcular = () => {
      const a = area.current; if (!a) return;
      const ancho = t.w + t.borde * 2, alto = t.h + t.borde * 2;
      setEscala(Math.min(1, (a.clientWidth - 48) / ancho, (a.clientHeight - 48) / alto));
    };
    calcular();
    const ro = new ResizeObserver(calcular);
    if (area.current) ro.observe(area.current);
    return () => ro.disconnect();
  }, [t]);
  useEffect(() => setCargando(true), [src, tipo, version]);
  // La pantalla dentro del marco pide ir al índice: se sale del modo de vista
  useEffect(() => {
    const oir = (e: MessageEvent) => { if (e.data?.proto === "ir") ir(e.data.ruta === "/" ? "/" : e.data.ruta); };
    window.addEventListener("message", oir);
    return () => window.removeEventListener("message", oir);
  }, [ir]);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <header className="h-16 shrink-0 px-4 sm:px-6 flex items-center gap-3 border-b border-borde bg-barra">
        <Link to="/" className="h-9 px-3.5 rounded-full border border-bordef hover:bg-tarjeta2 inline-flex items-center gap-2 text-sm font-semibold">
          <ArrowLeft size={16} />Índice
        </Link>
        <div className="min-w-0"><b className="font-semibold block truncate">{nombre}</b><span className="text-xs text-texto3">{t.t} · {Math.round(escala * 100)} %</span></div>
        <div className="flex-1" />
        <button type="button" onClick={() => setVersion(version + 1)} aria-label="Recargar" title="Recargar"
          className="w-9 h-9 rounded-full border border-bordef grid place-items-center hover:bg-tarjeta2"><RotateCw size={16} /></button>
        <div className="inline-flex p-1 rounded-full bg-fondo border border-borde gap-0.5">
          {(Object.keys(TAMANOS) as (keyof typeof TAMANOS)[]).map((k) => {
            const I = TAMANOS[k].ico;
            return (
              <button key={k} type="button" onClick={() => ir(`/visor/${k}?p=${p}`)} aria-label={k} title={TAMANOS[k].t}
                className={cx("h-9 w-11 rounded-full grid place-items-center transition-colors", k === tipo ? "bg-pri text-prit" : "text-texto2 hover:text-texto")}><I size={17} /></button>
            );
          })}
          <button type="button" onClick={() => ir(p)} aria-label="Escritorio" title="Escritorio"
            className="h-9 w-11 rounded-full grid place-items-center text-texto2 hover:text-texto"><Monitor size={17} /></button>
        </div>
      </header>
      <div ref={area} className="flex-1 min-h-0 grid place-items-center overflow-hidden bg-[radial-gradient(#262626_1px,transparent_1px)] [background-size:22px_22px]">
        <div style={{ width: (t.w + t.borde * 2) * escala, height: (t.h + t.borde * 2) * escala }}>
          <div key={tipo} className="pantalla origin-top-left bg-[#1F1F1F] shadow-flota relative"
            style={{ width: t.w + t.borde * 2, height: t.h + t.borde * 2, padding: t.borde, borderRadius: t.radio, transform: `scale(${escala})` }}>
            <div className="w-full h-full overflow-hidden bg-fondo relative" style={{ borderRadius: t.radio - t.borde }}>
              {cargando && <div className="absolute inset-0 grid place-items-center text-texto3"><Loader2 className="animate-spin" size={28} /></div>}
              <iframe key={src + version} title={nombre} src={src} onLoad={() => setCargando(false)}
                className={cx("w-full h-full block border-0 transition-opacity duration-300", cargando ? "opacity-0" : "opacity-100")} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
