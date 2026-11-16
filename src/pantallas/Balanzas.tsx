import { useMemo, useState } from "react";
import { useApp } from "../contexto";
import { EMPRESA_CHERO, balanza, enDinero, hojaTrabajo, type FilaHoja, type TipoBalanza } from "../datos/libros";
import { Marco } from "../marco/Marco";
import { Aviso, Pagina, Pestanas, Tarjeta, Titulo, cx, dinero } from "../ui";
import { BotonExportar, Cifra, Cuadre, EncabezadoLibro, TablaCifras } from "../ui/reportes";

const NOTA = "Cifras ilustrativas del caso CheroPhonex";
const TIPOS: Record<TipoBalanza, { t: string; sub: string }> = {
  antes: { t: "Antes de ajustes", sub: "Saldos de las operaciones del período, sin ajustes." },
  ajustada: { t: "Ajustada", sub: "Incluye los ajustes del período y la provisión del impuesto sobre la renta." },
  posterior: { t: "Posterior al cierre", sub: "Solo cuentas de balance, ya liquidadas las de resultado." },
};

/* ======================= HU-30 Balanzas de comprobación ======================= */
export function Balanzas() {
  const { sucursal } = useApp();
  const [tipo, setTipo] = useState<TipoBalanza>("antes");
  const b = useMemo(() => balanza(tipo), [tipo]);
  return (
    <Marco ruta={[{ t: "Libros y reportes" }, { t: "Balanzas de comprobación" }]}>
      <Pagina ancho="max-w-[1000px]">
        <Titulo t="Balanzas de comprobación" sub="Saldos deudores y acreedores por cuenta; deben sumar lo mismo">
          <BotonExportar nombre={`Balanza ${TIPOS[tipo].t.toLowerCase()}`} />
        </Titulo>
        <Pestanas valor={tipo} onChange={setTipo} opciones={(Object.keys(TIPOS) as TipoBalanza[]).map((v) => ({ v, t: TIPOS[v].t }))} />
        <Cuadre d={b.d} h={b.h} etiqueta="Saldos deudores y acreedores" />
        <Tarjeta className="overflow-hidden">
          <EncabezadoLibro empresa={EMPRESA_CHERO} titulo={`Balanza de comprobación ${TIPOS[tipo].t.toLowerCase()}`} periodo="Noviembre 2026" sucursal={`Consolidado · ${sucursal}`} nota={NOTA} />
          <TablaCifras
            clave={(f) => f.c} filas={b.filas}
            cols={[
              { clave: "c", titulo: "Código", ver: (f) => <span className="cifra text-texto2">{f.c}</span> },
              { clave: "n", titulo: "Cuenta", ver: (f) => f.n },
              { clave: "d", titulo: "Saldo deudor", tipo: "num", ver: (f) => <Cifra v={enDinero(f.d)} />, total: enDinero(b.d) },
              { clave: "h", titulo: "Saldo acreedor", tipo: "num", ver: (f) => <Cifra v={enDinero(f.h)} />, total: enDinero(b.h) },
            ]}
          />
        </Tarjeta>
        <p className="text-xs text-texto3">{TIPOS[tipo].sub} Incluye partidas contabilizadas y anuladas, nunca borradores.</p>
      </Pagina>
    </Marco>
  );
}

/* ======================= HU-31 Hoja de trabajo ======================= */
export function HojaTrabajo() {
  const { sucursal } = useApp();
  const { filas, sub, fin, util } = useMemo(hojaTrabajo, []);
  const num = (k: keyof FilaHoja, titulo: string, total: number) => ({
    clave: k, titulo, tipo: "num" as const, ver: (f: FilaHoja) => <Cifra v={enDinero(f[k] as number)} />, total: enDinero(total), ancho: "min-w-[120px]",
  });
  const celda = (v: number, extra = "") => <td className={cx("px-4 py-3 text-right cifra whitespace-nowrap", extra)}>{v ? dinero(enDinero(v)) : ""}</td>;
  const fila = (t: string, v: typeof fin, fuerte = false, utilidad?: { er: number; bg: number }) => (
    <tr className={cx(fuerte ? "font-bold border-t border-bordef" : "text-texto2")}>
      <td className={cx("px-4 py-3 sticky left-0 z-[1] bg-tarjeta border-r border-borde", fuerte && "font-bold")}>{t}</td>
      {celda(v.bcD)}{celda(v.bcH)}{celda(v.ajD)}{celda(v.ajH)}{celda(v.baD)}{celda(v.baH)}
      {celda(utilidad ? utilidad.er * (util > 0 ? 1 : 0) : v.erD)}{celda(utilidad ? utilidad.er * (util < 0 ? 1 : 0) : v.erH)}
      {celda(utilidad ? utilidad.bg * (util < 0 ? 1 : 0) : v.bgD)}{celda(utilidad ? utilidad.bg * (util > 0 ? 1 : 0) : v.bgH)}
    </tr>
  );
  const cuadra = fin.erD === fin.erH && fin.bgD === fin.bgH && sub.bcD === sub.bcH && sub.baD === sub.baH;
  return (
    <Marco ruta={[{ t: "Libros y reportes" }, { t: "Hoja de trabajo" }]}>
      <Pagina>
        <Titulo t="Hoja de trabajo" sub="Diez columnas: comprobación, ajustes, balanza ajustada, estado de resultados y balance general">
          <BotonExportar nombre="Hoja de trabajo" />
        </Titulo>
        {cuadra ? <Aviso>La utilidad del período es <b className="font-semibold cifra">US$ {dinero(enDinero(Math.abs(util)))}</b>{util < 0 ? " (pérdida)" : ""}; con ella cuadran el estado de resultados y el balance general.</Aviso>
          : <Aviso mal>La hoja no cuadra. Revisa las partidas del período.</Aviso>}
        <Tarjeta className="overflow-hidden">
          <EncabezadoLibro empresa={EMPRESA_CHERO} titulo="Hoja de trabajo de diez columnas" periodo="Noviembre 2026" sucursal={`Consolidado · ${sucursal}`} nota={NOTA} />
          <TablaCifras<FilaHoja>
            fijarPrimera clave={(f) => f.c} filas={filas} totales="Sumas"
            grupos={[{ t: "Cuenta", n: 1 }, { t: "Balanza de comprobación", n: 2 }, { t: "Ajustes", n: 2 }, { t: "Balanza ajustada", n: 2 }, { t: "Estado de resultados", n: 2 }, { t: "Balance general", n: 2 }]}
            cols={[
              { clave: "n", titulo: "Código y cuenta", ancho: "min-w-[240px]", ver: (f) => <span className="flex gap-2 whitespace-nowrap"><span className="cifra text-texto3">{f.c}</span>{f.n}</span> },
              num("bcD", "Debe", sub.bcD), num("bcH", "Haber", sub.bcH), num("ajD", "Debe", sub.ajD), num("ajH", "Haber", sub.ajH),
              num("baD", "Debe", sub.baD), num("baH", "Haber", sub.baH), num("erD", "Debe", sub.erD), num("erH", "Haber", sub.erH),
              num("bgD", "Debe", sub.bgD), num("bgH", "Haber", sub.bgH),
            ]}
            pie={<tfoot>
              {fila(util >= 0 ? "Utilidad del ejercicio" : "Pérdida del ejercicio", { ...sub, bcD: 0, bcH: 0, ajD: 0, ajH: 0, baD: 0, baH: 0 }, false, { er: Math.abs(util), bg: Math.abs(util) })}
              {fila("Sumas iguales", fin, true)}
            </tfoot>}
          />
        </Tarjeta>
        <p className="text-xs text-texto3">Desliza hacia los lados: la columna de la cuenta queda fija. La utilidad se suma al lado menor del estado de resultados y se lleva al balance general.</p>
      </Pagina>
    </Marco>
  );
}
