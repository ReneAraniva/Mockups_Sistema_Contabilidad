import { useState } from "react";
import { ChevronLeft, ChevronRight, CircleCheck, FileDown } from "lucide-react";
import { useApp } from "../contexto";
import { liquidacion, suma } from "../datos/caso";
import { ANEXOS, VENCIMIENTOS, type Anexo, type Vencimiento } from "../datos/sprint4";
import { Marco, Permiso } from "../marco/Marco";
import { Aviso, Boton, Etiqueta, Pagina, Pestanas, Tarjeta, CabTarjeta, Titulo, cx, dinero } from "../ui";
import { TablaCifras } from "../ui/reportes";

const HOY = { d: 23, m: 11, a: 2026 };
const MESES = ["Noviembre 2026", "Diciembre 2026"];
const SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const partes = (f: string) => { const [d, m, a] = f.split("/").map(Number); return { d, m, a }; };
const tipoEtq = (e: Vencimiento["estado"]) => (e === "Presentada" ? "contab" : e === "Próxima" ? "desc" : "borrador");

/** HU-52 (calendario tributario) y HU-51 (anexos del F-07 en CSV). */
export function Calendario() {
  const { avisar } = useApp();
  const [tab, setTab] = useState<"cal" | "anexos">("cal");
  const [mi, setMi] = useState(0);
  const [dia, setDia] = useState<number | null>(null);
  const [ver, setVer] = useState<Anexo | null>(ANEXOS[0]);
  const mes = 11 + mi, nDias = mes === 11 ? 30 : 31, offset = mes === 11 ? 6 : 1; // 1/nov/2026 cae domingo; 1/dic cae martes
  const delMes = VENCIMIENTOS.filter((v) => partes(v.fecha).m === mes);
  const enDia = (d: number) => delMes.filter((v) => partes(v.fecha).d === d);
  const lista = dia ? enDia(dia) : delMes;
  const L = liquidacion();

  return (
    <Marco ruta={[{ t: "Tributario" }, { t: "Calendario tributario" }]}>
      <Pagina ancho="max-w-[1100px]">
        <Titulo t="Calendario y anexos" sub="Vencimientos de declaraciones y planillas, y anexos del F-07 en CSV para el portal de Hacienda" />
        <Pestanas valor={tab} onChange={setTab} opciones={[{ v: "cal", t: "Calendario tributario" }, { v: "anexos", t: "Anexos del F-07" }]} />
        {tab === "cal" ? (
          <>
            <Aviso>Las fechas son de ejemplo: los plazos reales se configuran en Parámetros según la normativa vigente.</Aviso>
            <div className="grid lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] gap-5 items-start">
              <Tarjeta className="overflow-hidden">
                <div className="px-5 py-4 border-b border-borde flex items-center justify-between">
                  <button type="button" aria-label="Mes anterior" disabled={mi === 0} onClick={() => { setMi(0); setDia(null); }} className="w-9 h-9 rounded-full border border-bordef grid place-items-center disabled:opacity-30"><ChevronLeft size={16} /></button>
                  <h2 className="text-base font-semibold">{MESES[mi]}</h2>
                  <button type="button" aria-label="Mes siguiente" disabled={mi === 1} onClick={() => { setMi(1); setDia(null); }} className="w-9 h-9 rounded-full border border-bordef grid place-items-center disabled:opacity-30"><ChevronRight size={16} /></button>
                </div>
                <div className="p-3 sm:p-4">
                  <div className="grid grid-cols-7 text-center text-xs font-bold tracking-[.08em] uppercase text-texto3 mb-1">{SEMANA.map((d) => <span key={d} className="py-2">{d}</span>)}</div>
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: offset }).map((_, i) => <span key={"v" + i} />)}
                    {Array.from({ length: nDias }).map((_, i) => {
                      const d = i + 1, ev = enDia(d), esHoy = mes === HOY.m && d === HOY.d;
                      return (
                        <button key={d} type="button" onClick={() => setDia(dia === d ? null : d)} aria-label={`${d} de ${MESES[mi]}${ev.length ? `, ${ev.length} vencimiento(s)` : ""}`}
                          className={cx("aspect-square sm:aspect-[4/3] rounded-xl border text-sm grid content-between justify-items-center py-1.5 transition-colors",
                            dia === d ? "bg-pri text-prit border-pri" : esHoy ? "border-texto2" : ev.length ? "border-bordef bg-tarjeta2/40 hover:bg-tarjeta2" : "border-transparent hover:bg-tarjeta2")}>
                          <span className={cx("cifra", esHoy && dia !== d && "font-bold")}>{d}</span>
                          <span className="flex gap-0.5 h-2">{ev.slice(0, 3).map((v) => <i key={v.id} className={cx("w-1.5 h-1.5 rounded-full", v.estado === "Presentada" ? (dia === d ? "bg-prit/40" : "bg-texto3") : (dia === d ? "bg-prit" : "bg-pri"))} />)}</span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-texto3 mt-3 flex gap-4 flex-wrap"><span className="flex items-center gap-1.5"><i className="w-1.5 h-1.5 rounded-full bg-pri" />Pendiente</span><span className="flex items-center gap-1.5"><i className="w-1.5 h-1.5 rounded-full bg-texto3" />Presentada</span><span>Hoy: 23/11/2026</span></p>
                </div>
              </Tarjeta>
              <Tarjeta className="overflow-hidden">
                <CabTarjeta titulo={dia ? `${dia} de ${MESES[mi].split(" ")[0].toLowerCase()}` : `Vencimientos de ${MESES[mi].split(" ")[0].toLowerCase()}`} sub={dia ? <button type="button" onClick={() => setDia(null)} className="underline underline-offset-4">Ver todo el mes</button> : undefined} />
                <ul>
                  {lista.map((v) => (
                    <li key={v.id} className="px-5 py-4 border-b border-borde last:border-0 flex items-start gap-3">
                      <span className="cifra text-sm text-texto2 w-12 shrink-0 pt-0.5">{v.fecha.slice(0, 5)}</span>
                      <div className="min-w-0 flex-1"><b className="font-semibold block">{v.titulo}</b>{v.nota && <span className="text-xs text-texto2">{v.nota}</span>}</div>
                      <Etiqueta t={tipoEtq(v.estado)}>{v.estado}</Etiqueta>
                    </li>
                  ))}
                  {!lista.length && <li className="p-10 text-center text-texto2">Sin vencimientos en esta fecha.</li>}
                </ul>
              </Tarjeta>
            </div>
          </>
        ) : (
          <>
            <Tarjeta className="p-4 flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[240px]"><b className="font-semibold block">Declaración F-07 · octubre 2026</b><span className="text-sm text-texto2">Débito fiscal US$ {dinero(L.debito)} · crédito fiscal US$ {dinero(L.credito)}</span></div>
              <Etiqueta t="contab"><CircleCheck size={13} />Anexos cuadran con la liquidación</Etiqueta>
              <Permiso roles={["admin", "contador"]}><Boton v="pri" onClick={() => avisar("Los tres anexos se descargaron en un archivo comprimido")}><FileDown size={16} />Generar todos</Boton></Permiso>
            </Tarjeta>
            <div className="grid sm:grid-cols-3 gap-3">
              {ANEXOS.map((a) => (
                <button key={a.id} type="button" onClick={() => setVer(a)} aria-pressed={ver?.id === a.id}
                  className={cx("text-left bg-tarjeta border rounded-2xl p-4 grid gap-1 transition-colors", ver?.id === a.id ? "border-texto2" : "border-borde hover:border-bordef")}>
                  <b className="font-semibold">{a.nombre}</b><span className="text-sm text-texto2">{a.filas} registros</span><span className="cifra text-lg font-semibold">{dinero(a.total)}</span>
                </button>
              ))}
            </div>
            {ver && (
              <Tarjeta className="overflow-hidden">
                <CabTarjeta titulo={ver.nombre} sub={`${ver.filas} registros · total US$ ${dinero(ver.total)} · vista previa de las primeras filas`}>
                  <Permiso roles={["admin", "contador"]}><Boton onClick={() => avisar(`${ver.nombre} generado en CSV`)}><FileDown size={16} />Generar CSV</Boton></Permiso>
                </CabTarjeta>
                <TablaCifras<string[]> clave={(f) => f.join("|")} filas={ver.muestra} totales={false}
                  cols={ver.columnas.map((c, i) => ({ clave: c, titulo: c, tipo: i >= 4 ? ("num" as const) : ("texto" as const), ver: (f: string[]) => <span className="cifra whitespace-nowrap">{f[i]}</span> }))} />
                <p className="px-5 py-3 text-xs text-texto3 border-t border-borde">El archivo usa punto y coma como separador y punto decimal, listo para cargarlo en el portal. Suma de los tres totales: US$ {dinero(suma(ANEXOS.map((a) => a.total)))}.</p>
              </Tarjeta>
            )}
          </>
        )}
      </Pagina>
    </Marco>
  );
}
