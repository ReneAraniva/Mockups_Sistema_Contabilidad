import { cx, dinero } from "./index";

/* Gráficas del prototipo (Sprint 4): SVG propio, sin librerías. La marca es monocromática, así que las series se
 * distinguen por tono de gris; el rojo se reserva para alertas. Cada marca lleva su <title> con el valor. */
export const TONOS = ["#FAFAFA", "#A3A3A3", "#6B6B6B", "#404040", "#2E2E2E"];
const EJE = "#737373", REJILLA = "#262626";

const corto = (n: number) => (Math.abs(n) >= 1000 ? `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)} k` : String(Math.round(n)));
const techo = (max: number) => { const p = Math.pow(10, Math.floor(Math.log10(max || 1))); return Math.ceil(max / p / 2) * p * 2 || 1; };

export type Serie = { nombre: string; tono?: string };
export function Leyenda({ items }: { items: { t: string; tono: string }[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-texto2">
      {items.map((i) => <li key={i.t} className="flex items-center gap-1.5"><i className="w-2.5 h-2.5 rounded-sm" style={{ background: i.tono }} />{i.t}</li>)}
    </ul>
  );
}

/** Barras verticales, agrupadas o apiladas. */
export function Barras({ datos, series, apiladas, alto = 220, descripcion }: {
  datos: { e: string; v: number[] }[]; series: Serie[]; apiladas?: boolean; alto?: number; descripcion: string;
}) {
  const W = 560, H = alto, m = { l: 44, r: 8, t: 10, b: 28 };
  const max = techo(Math.max(...datos.map((d) => (apiladas ? d.v.reduce((a, b) => a + b, 0) : Math.max(...d.v)))));
  const iw = W - m.l - m.r, ih = H - m.t - m.b, paso = iw / datos.length;
  const bw = Math.min(apiladas ? paso * 0.55 : (paso * 0.7) / series.length, 38);
  const y = (v: number) => m.t + ih - (v / max) * ih;
  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={descripcion} className="w-full h-auto">
        {[0, 0.25, 0.5, 0.75, 1].map((f) => (
          <g key={f}><line x1={m.l} x2={W - m.r} y1={y(max * f)} y2={y(max * f)} stroke={REJILLA} /><text x={m.l - 6} y={y(max * f) + 3} textAnchor="end" fontSize="10" fill={EJE}>{corto(max * f)}</text></g>
        ))}
        {datos.map((d, i) => {
          const cx0 = m.l + paso * i + paso / 2;
          let acum = 0;
          return (
            <g key={d.e}>
              {d.v.map((v, j) => {
                const x = apiladas ? cx0 - bw / 2 : cx0 - (bw * series.length) / 2 + bw * j + (j * 2);
                const base = apiladas ? acum : 0; acum += v;
                return <rect key={j} x={x} y={y(base + v)} width={bw} height={Math.max((v / max) * ih, 0)} rx="3" fill={series[j].tono ?? TONOS[j]}><title>{`${d.e} · ${series[j].nombre}: US$ ${dinero(v)}`}</title></rect>;
              })}
              <text x={cx0} y={H - 10} textAnchor="middle" fontSize="10.5" fill={EJE}>{d.e}</text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}

/** Barras horizontales ordenadas, con la cifra al final de cada barra. */
export function BarrasH({ datos, formato = (n: number) => dinero(n), descripcion }: { datos: { e: string; v: number }[]; formato?: (n: number) => string; descripcion: string }) {
  const max = Math.max(...datos.map((d) => d.v), 1);
  return (
    <ul className="grid gap-2.5" aria-label={descripcion}>
      {datos.map((d) => (
        <li key={d.e} className="grid grid-cols-[minmax(0,11.5rem)_1fr_auto] items-center gap-3 text-sm">
          <span className="truncate text-texto2">{d.e}</span>
          <span className="h-2.5 rounded-full bg-tarjeta2 overflow-hidden"><i className="block h-full rounded-full bg-pri" style={{ width: `${(d.v / max) * 100}%` }} /></span>
          <span className="cifra text-right min-w-[5.5rem]">{formato(d.v)}</span>
        </li>
      ))}
    </ul>
  );
}

/** Anillo con el total al centro y su leyenda. */
export function Anillo({ partes, centro, sub, descripcion }: { partes: { t: string; v: number }[]; centro: string; sub: string; descripcion: string }) {
  const total = partes.reduce((a, b) => a + b.v, 0) || 1;
  const R = 52, C = 2 * Math.PI * R;
  let off = 0;
  return (
    <div className="flex flex-wrap items-center gap-6">
      <svg viewBox="0 0 140 140" className="w-[150px] h-[150px] shrink-0" role="img" aria-label={descripcion}>
        <circle cx="70" cy="70" r={R} fill="none" stroke={REJILLA} strokeWidth="16" />
        {partes.map((p, i) => {
          const len = (p.v / total) * C;
          const el = <circle key={p.t} cx="70" cy="70" r={R} fill="none" stroke={TONOS[i]} strokeWidth="16" strokeDasharray={`${Math.max(len - 2, 0)} ${C}`} strokeDashoffset={-off} transform="rotate(-90 70 70)"><title>{`${p.t}: US$ ${dinero(p.v)} (${((p.v / total) * 100).toFixed(1)} %)`}</title></circle>;
          off += len; return el;
        })}
        <text x="70" y="68" textAnchor="middle" fontSize="15" fontWeight="600" fill="#F5F5F5" style={{ fontVariantNumeric: "tabular-nums" }}>{centro}</text>
        <text x="70" y="84" textAnchor="middle" fontSize="9" fill={EJE}>{sub}</text>
      </svg>
      <ul className="grid gap-2 text-sm flex-1 min-w-[180px]">
        {partes.map((p, i) => (
          <li key={p.t} className="flex items-center gap-2"><i className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: TONOS[i] }} /><span className="flex-1 text-texto2 truncate">{p.t}</span><span className="cifra">{dinero(p.v)}</span><span className="cifra text-texto3 w-12 text-right">{((p.v / total) * 100).toFixed(1)} %</span></li>
        ))}
      </ul>
    </div>
  );
}

/** Línea con banda de confianza para las proyecciones; los puntos proyectados se dibujan huecos y con trazo discontinuo. */
export function LineaBanda({ puntos, alto = 240, descripcion }: { puntos: { e: string; v: number; lo?: number; hi?: number; proy?: boolean }[]; alto?: number; descripcion: string }) {
  const W = 560, H = alto, m = { l: 48, r: 14, t: 12, b: 28 };
  const max = techo(Math.max(...puntos.map((p) => p.hi ?? p.v)));
  const iw = W - m.l - m.r, ih = H - m.t - m.b;
  const x = (i: number) => m.l + (puntos.length === 1 ? iw / 2 : (iw / (puntos.length - 1)) * i);
  const y = (v: number) => m.t + ih - (v / max) * ih;
  const conBanda = puntos.map((p, i) => ({ ...p, i })).filter((p) => p.hi !== undefined);
  const banda = conBanda.length ? `M${conBanda.map((p) => `${x(p.i)},${y(p.hi!)}`).join(" L")} L${[...conBanda].reverse().map((p) => `${x(p.i)},${y(p.lo!)}`).join(" L")} Z` : "";
  const real = puntos.map((p, i) => ({ ...p, i })).filter((p) => !p.proy);
  const proy = puntos.map((p, i) => ({ ...p, i })).filter((p, k, a) => p.proy || (a[k + 1]?.proy));
  const traza = (l: { i: number; v: number }[]) => l.map((p, k) => `${k ? "L" : "M"}${x(p.i)},${y(p.v)}`).join(" ");
  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={descripcion} className="w-full h-auto">
        {[0, 0.25, 0.5, 0.75, 1].map((f) => <g key={f}><line x1={m.l} x2={W - m.r} y1={y(max * f)} y2={y(max * f)} stroke={REJILLA} /><text x={m.l - 6} y={y(max * f) + 3} textAnchor="end" fontSize="10" fill={EJE}>{corto(max * f)}</text></g>)}
        {banda && <path d={banda} fill="#A3A3A3" opacity=".16" />}
        {real.length > 1 && <path d={traza(real)} fill="none" stroke={TONOS[0]} strokeWidth="2.5" strokeLinejoin="round" />}
        <path d={traza(proy)} fill="none" stroke={TONOS[0]} strokeWidth="2.5" strokeDasharray="6 5" strokeLinejoin="round" />
        {puntos.map((p, i) => (
          <g key={p.e}>
            <circle cx={x(i)} cy={y(p.v)} r="4.5" fill={p.proy ? "#171717" : TONOS[0]} stroke={TONOS[0]} strokeWidth="2"><title>{`${p.e}: US$ ${dinero(p.v)}${p.lo !== undefined ? ` (rango ${dinero(p.lo)} a ${dinero(p.hi!)})` : ""}`}</title></circle>
            <text x={x(i)} y={H - 10} textAnchor="middle" fontSize="10.5" fill={EJE}>{p.e}</text>
          </g>
        ))}
      </svg>
    </figure>
  );
}

/** Indicador con su valor grande, una línea de contexto y, si se pide, un estado. */
export function Indicador({ t, v, sub, tono, className }: { t: string; v: string; sub?: string; tono?: "alerta"; className?: string }) {
  return (
    <div className={cx("bg-tarjeta border border-borde rounded-2xl p-4", className)}>
      <span className="text-xs text-texto2">{t}</span>
      <b className={cx("cifra block text-2xl mt-1 font-semibold", tono === "alerta" && "text-alerta")}>{v}</b>
      {sub && <span className="text-xs text-texto3 block mt-1">{sub}</span>}
    </div>
  );
}

/** De la venta a la utilidad: cada fila es una barra proporcional a las ventas; los totales van en blanco y las deducciones en gris. */
export function Cascada({ filas, base, descripcion }: { filas: { t: string; v: number; fuerte?: boolean }[]; base: number; descripcion: string }) {
  return (
    <ul className="grid gap-4 content-between h-full" aria-label={descripcion}>
      {filas.map((f) => {
        const p = (f.v / base) * 100;
        return (
          <li key={f.t} className="grid gap-1.5">
            <div className="flex justify-between gap-3 text-sm"><span className={f.fuerte ? "font-semibold" : "text-texto2"}>{f.t}</span><span className={cx("cifra", f.fuerte && "font-semibold")}>{f.fuerte ? "" : "− "}{dinero(f.v)}</span></div>
            <div className="flex items-center gap-3">
              <span className="flex-1 h-2 rounded-full bg-tarjeta2 overflow-hidden"><i className="block h-full rounded-full" style={{ width: `${Math.max(p, 0.6)}%`, background: f.fuerte ? TONOS[0] : TONOS[2] }} /></span>
              <span className="cifra text-xs text-texto3 w-14 text-right">{p.toFixed(1)} %</span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
