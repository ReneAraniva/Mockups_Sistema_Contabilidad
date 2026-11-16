import { useRef, useState, type ReactNode } from "react";
import { CalendarDays, Download, FileSpreadsheet, FileText } from "lucide-react";
import { useApp } from "../contexto";
import { Boton, Entrada, Flotante, OpcionFlot, Tarjeta, cx, dinero, td, th } from "./index";

/* Componentes compartidos de los libros y reportes (Sprint 2). Solo diseño: nada se genera. */

/** Cifra de dinero: alineada a la derecha, con cero en gris y negativos entre paréntesis. */
export function Cifra({ v, vacio = "—", className }: { v: number; vacio?: string; className?: string }) {
  if (!v) return <span className={cx("cifra text-texto3", className)}>{vacio}</span>;
  return <span className={cx("cifra", className)}>{v < 0 ? `(${dinero(-v)})` : dinero(v)}</span>;
}

/* ---------- Encabezado de libro ---------- */
/** Cabecera formal de un libro o estado: empresa, nombre del reporte, período, sucursal y folio. */
export function EncabezadoLibro({ empresa, titulo, periodo, sucursal, folio, nota }: {
  empresa: string; titulo: string; periodo: string; sucursal: string; folio?: string; nota?: string;
}) {
  return (
    <div className="px-5 py-5 border-b border-borde grid gap-1 text-center sm:text-left sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
      <div className="min-w-0">
        <p className="text-xs font-bold tracking-[.08em] uppercase text-texto3">{empresa}</p>
        <h2 className="text-xl font-medium mt-0.5">{titulo}</h2>
        <p className="text-sm text-texto2 mt-0.5">{periodo} · {sucursal}{nota && <> · {nota}</>}</p>
      </div>
      {folio && <p className="text-sm text-texto2 sm:text-right">Folio <b className="cifra text-texto font-semibold">{folio}</b></p>}
    </div>
  );
}

/* ---------- Tabla de cifras ---------- */
export type ColCifras<T> = {
  clave: string;
  titulo: string;
  /** "num" alinea a la derecha con cifras tabulares; "texto" a la izquierda. */
  tipo?: "texto" | "num";
  ver: (fila: T) => ReactNode;
  /** Total de la columna; si se omite no se suma. */
  total?: number;
  ancho?: string;
};

/**
 * Tabla con cifras alineadas, encabezado fijo y fila de totales.
 * `fijarPrimera` deja la primera columna fija al desplazar horizontalmente (hoja de trabajo en celular).
 */
export function TablaCifras<T>({ cols, filas, clave, fijarPrimera, totales = "Totales", vacio = "Sin movimientos en el período.", onFila, resaltar }: {
  cols: ColCifras<T>[]; filas: T[]; clave: (f: T) => string; fijarPrimera?: boolean; totales?: string | false;
  vacio?: string; onFila?: (f: T) => void; resaltar?: (f: T) => boolean;
}) {
  const hayTotales = totales !== false && cols.some((c) => c.total !== undefined);
  const fija = (i: number, fondo: string) => (fijarPrimera && i === 0 ? cx("sticky left-0 z-[1] border-r border-borde", fondo) : "");
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {cols.map((c, i) => (
              <th key={c.clave} className={cx(th, c.tipo === "num" && "text-right", c.ancho, fija(i, "bg-tarjeta"))}>{c.titulo}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map((f) => (
            <tr key={clave(f)} onClick={onFila ? () => onFila(f) : undefined}
              className={cx(onFila && "cursor-pointer hover:bg-white/[.02]", resaltar?.(f) && "bg-alertaf/40")}>
              {cols.map((c, i) => (
                <td key={c.clave} className={cx(td, c.tipo === "num" && "text-right whitespace-nowrap", fija(i, "bg-tarjeta"))}>{c.ver(f)}</td>
              ))}
            </tr>
          ))}
          {!filas.length && <tr><td colSpan={cols.length} className="px-4 py-10 text-center text-texto2">{vacio}</td></tr>}
        </tbody>
        {hayTotales && filas.length > 0 && (
          <tfoot>
            <tr>
              {cols.map((c, i) => (
                <td key={c.clave} className={cx("px-4 py-3.5 border-t border-bordef font-bold", c.tipo === "num" && "text-right whitespace-nowrap", fija(i, "bg-tarjeta"))}>
                  {i === 0 && c.total === undefined ? totales : c.total !== undefined ? <span className="cifra">{dinero(c.total)}</span> : null}
                </td>
              ))}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}

/* ---------- Exportar ---------- */
/** Botón con menú para exportar el reporte abierto. En el prototipo solo muestra el aviso. */
export function BotonExportar({ nombre, formatos = ["PDF", "Excel", "CSV"] }: { nombre: string; formatos?: ("PDF" | "Excel" | "CSV")[] }) {
  const { avisar } = useApp();
  const [abierto, setAbierto] = useState(false);
  const ancla = useRef<HTMLSpanElement>(null);
  const ico = (f: string) => (f === "PDF" ? <FileText size={16} /> : <FileSpreadsheet size={16} />);
  return (
    <>
      <span ref={ancla} className="inline-block">
        <Boton onClick={() => setAbierto(!abierto)} aria-haspopup="menu" aria-expanded={abierto}><Download size={16} />Exportar</Boton>
      </span>
      <Flotante abierto={abierto} onCerrar={() => setAbierto(false)} ancla={ancla} ancho={220}>
        {formatos.map((f) => (
          <OpcionFlot key={f} icono={ico(f)} onClick={() => { setAbierto(false); avisar(`${nombre} exportado en ${f}`); }}>{f}</OpcionFlot>
        ))}
      </Flotante>
    </>
  );
}

/* ---------- Barra de filtros ---------- */
/** Rango de fechas (desde / hasta), filtros propios del reporte y el botón de exportar. */
export function BarraFiltros({ desde, hasta, onDesde, onHasta, children, exportar }: {
  desde: string; hasta: string; onDesde: (v: string) => void; onHasta: (v: string) => void; children?: ReactNode; exportar?: ReactNode;
}) {
  return (
    <Tarjeta className="p-4 flex flex-wrap items-end gap-3">
      <div className="flex items-end gap-2 flex-wrap">
        <label className="grid gap-1.5 text-sm font-semibold">Desde
          <span className="relative"><CalendarDays size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-texto3" />
            <Entrada value={desde} onChange={(e) => onDesde(e.target.value)} inputMode="numeric" placeholder="dd/mm/aaaa" className="pl-9 w-[150px] cifra h-10" /></span>
        </label>
        <label className="grid gap-1.5 text-sm font-semibold">Hasta
          <span className="relative"><CalendarDays size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-texto3" />
            <Entrada value={hasta} onChange={(e) => onHasta(e.target.value)} inputMode="numeric" placeholder="dd/mm/aaaa" className="pl-9 w-[150px] cifra h-10" /></span>
        </label>
      </div>
      {children}
      {exportar && <div className="ml-auto">{exportar}</div>}
    </Tarjeta>
  );
}
