import { useMemo, useState } from "react";
import { FileDown, FilePlus2, Pause, Play, Plus, RefreshCcw, ShoppingCart } from "lucide-react";
import { useApp } from "../contexto";
import { EMPRESA_OFICIAL, PRODUCTOS_CASO, redondear, suma } from "../datos/caso";
import { NOTAS, RECURRENTES, SERIES, conteoInicial, planillasOficiales, reabastecer, type Conteo, type Nota, type Recurrente, type Serie } from "../datos/sprint4";
import { Marco, Permiso } from "../marco/Marco";
import { Area, Aviso, Boton, Campo, CabTarjeta, Dialogo, Entrada, Etiqueta, Pagina, Pestanas, Selector, Tarjeta, Titulo, cx, dinero } from "../ui";
import { BotonExportar, Cifra, EncabezadoLibro, TablaCifras, VistaPartida } from "../ui/reportes";
import type { Rol } from "../datos/navegacion";

const ESCRIBE: Rol[] = ["admin", "contador", "auxiliar"];
const num = (v: string) => { const n = parseFloat(v.replace(/,/g, "")); return isNaN(n) ? 0 : n; };

/* ============================ HU-26 Partidas recurrentes ============================ */
export function PartidasRecurrentes() {
  const { avisar } = useApp();
  const [lista, setLista] = useState<Recurrente[]>(RECURRENTES);
  const [sel, setSel] = useState<Recurrente | null>(null);
  const [nueva, setNueva] = useState(false);
  const [f, setF] = useState({ nombre: "", frecuencia: "Mensual" as Recurrente["frecuencia"], dia: "1", monto: "", gasto: "4201", pago: "11010301" });
  const monto = num(f.monto);
  const CUENTAS: Record<string, string> = { "4201": "Gastos de Administración", "4202": "Gastos de Venta", "11010301": "Banco Agrícola", "110101": "Caja general", "2102": "Cuentas por Pagar Comerciales" };
  const okNueva = f.nombre.trim().length > 2 && monto > 0 && +f.dia >= 1 && +f.dia <= 31 && f.gasto !== f.pago;

  return (
    <Marco ruta={[{ t: "Contabilidad" }, { t: "Partidas recurrentes" }]}>
      <Pagina ancho="max-w-[1000px]">
        <Titulo t="Partidas recurrentes" sub="Plantillas que generan su partida cada mes, trimestre o año">
          <Permiso roles={["admin", "contador"]}><Boton v="pri" onClick={() => { setF({ nombre: "", frecuencia: "Mensual", dia: "1", monto: "", gasto: "4201", pago: "11010301" }); setNueva(true); }}><Plus size={17} />Nueva recurrente</Boton></Permiso>
        </Titulo>
        <Aviso>Las partidas se generan en borrador el día indicado para que el contador las revise y contabilice.</Aviso>
        <Tarjeta className="overflow-hidden">
          <TablaCifras<Recurrente> clave={(r) => r.id} filas={lista} totales={false} onFila={setSel}
            tarjeta={(r) => ({ meta: `${r.frecuencia} · día ${r.dia}`, estado: <Etiqueta t={r.estado === "Activa" ? "contab" : "borrador"}>{r.estado}</Etiqueta>, titulo: r.nombre, detalle: `Próxima: ${r.proxima}` })}
            cols={[
              { clave: "n", titulo: "Plantilla", ver: (r) => <b className="font-semibold">{r.nombre}</b> },
              { clave: "f", titulo: "Frecuencia", ver: (r) => `${r.frecuencia} · día ${r.dia}` },
              { clave: "p", titulo: "Próxima", ver: (r) => <span className="cifra">{r.proxima}</span> },
              { clave: "m", titulo: "Monto", tipo: "num", ver: (r) => <Cifra v={suma(r.lineas.map((l) => l.d))} /> },
              { clave: "e", titulo: "Estado", ver: (r) => <Etiqueta t={r.estado === "Activa" ? "contab" : "borrador"}>{r.estado}</Etiqueta> },
              { clave: "a", titulo: "", ver: (r) => (
                <Permiso roles={["admin", "contador"]}><span className="inline-flex gap-2 justify-end w-full" onClick={(e) => e.stopPropagation()}>
                  <Boton peq disabled={r.estado === "Pausada"} onClick={() => avisar(`«${r.nombre}» generada en borrador`)}><RefreshCcw size={14} />Generar ahora</Boton>
                  <Boton peq onClick={() => { setLista(lista.map((x) => (x.id === r.id ? { ...x, estado: r.estado === "Activa" ? "Pausada" : "Activa" } : x))); avisar(r.estado === "Activa" ? "Plantilla pausada" : "Plantilla reanudada"); }}>{r.estado === "Activa" ? <><Pause size={14} />Pausar</> : <><Play size={14} />Reanudar</>}</Boton>
                </span></Permiso>) },
            ]} />
        </Tarjeta>
      </Pagina>
      <Dialogo abierto={!!sel} onCerrar={() => setSel(null)} ancho="max-w-[640px]" titulo={sel?.nombre ?? ""} sub={sel ? `${sel.frecuencia} · día ${sel.dia} · próxima ${sel.proxima}` : undefined} pie={<Boton v="pri" onClick={() => setSel(null)}>Cerrar</Boton>}>
        {sel && <VistaPartida lineas={sel.lineas} />}
      </Dialogo>
      <Dialogo lateral abierto={nueva} onCerrar={() => setNueva(false)} titulo="Nueva partida recurrente" sub="Define la plantilla; el sistema la genera sola."
        pie={<><Boton v="fan" onClick={() => setNueva(false)}>Cancelar</Boton><Boton v="pri" disabled={!okNueva} onClick={() => { setLista([...lista, { id: "re" + (lista.length + 1), nombre: f.nombre, frecuencia: f.frecuencia, dia: +f.dia, proxima: "01/12/2026", estado: "Activa", lineas: [{ c: f.gasto, n: CUENTAS[f.gasto], d: monto, h: 0 }, { c: f.pago, n: CUENTAS[f.pago], d: 0, h: monto }] }]); setNueva(false); avisar("Plantilla creada"); }}>Crear plantilla</Boton></>}>
        <Campo label="Nombre"><Entrada value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} placeholder="Ej. Servicio de limpieza" /></Campo>
        <div className="grid grid-cols-2 gap-3">
          <Campo label="Frecuencia"><Selector value={f.frecuencia} onChange={(e) => setF({ ...f, frecuencia: e.target.value as Recurrente["frecuencia"] })}>{["Mensual", "Trimestral", "Anual"].map((x) => <option key={x}>{x}</option>)}</Selector></Campo>
          <Campo label="Día del mes" error={+f.dia < 1 || +f.dia > 31 ? "Entre 1 y 31." : undefined}><Entrada value={f.dia} onChange={(e) => setF({ ...f, dia: e.target.value })} inputMode="numeric" className="cifra" /></Campo>
        </div>
        <Campo label="Monto (US$)"><Entrada value={f.monto} onChange={(e) => setF({ ...f, monto: e.target.value })} inputMode="decimal" className="cifra" /></Campo>
        <div className="grid grid-cols-2 gap-3">
          <Campo label="Cargar a (Debe)"><Selector value={f.gasto} onChange={(e) => setF({ ...f, gasto: e.target.value })}>{Object.entries(CUENTAS).map(([c, n]) => <option key={c} value={c}>{c} · {n}</option>)}</Selector></Campo>
          <Campo label="Abonar a (Haber)" error={f.gasto === f.pago ? "Debe ser distinta." : undefined}><Selector value={f.pago} onChange={(e) => setF({ ...f, pago: e.target.value })}>{Object.entries(CUENTAS).map(([c, n]) => <option key={c} value={c}>{c} · {n}</option>)}</Selector></Campo>
        </div>
        <VistaPartida lineas={[{ c: f.gasto, n: CUENTAS[f.gasto], d: monto, h: 0 }, { c: f.pago, n: CUENTAS[f.pago], d: 0, h: monto }]} />
      </Dialogo>
    </Marco>
  );
}

/* ====================== HU-66 a HU-69 Toma física, series, reabastecimiento y sistema analítico ====================== */
export function TomaFisica() {
  const { avisar } = useApp();
  const [tab, setTab] = useState<"conteo" | "series" | "reab" | "analitico">("conteo");
  const [conteo, setConteo] = useState<Conteo[]>(conteoInicial());
  const [ajuste, setAjuste] = useState(false);
  const [hecho, setHecho] = useState(false);
  const [imei, setImei] = useState(false);
  const [nuevoImei, setNuevoImei] = useState("");
  const [series, setSeries] = useState<Serie[]>(SERIES);
  const reab = useMemo(() => reabastecer(), []);

  const dif = (c: Conteo) => c.contado - c.sistema;
  const valorDif = (c: Conteo) => redondear(dif(c) * c.p.costo);
  const conDif = conteo.filter((c) => dif(c) !== 0);
  const faltante = redondear(-suma(conDif.map(valorDif)));
  const final = suma(PRODUCTOS_CASO.map((p) => p.invFinal));
  const lineas = [{ c: "4202", n: "Gastos de Venta · faltantes de inventario", d: faltante, h: 0 }, { c: "1109", n: "Inventarios", d: 0, h: faltante }];
  const okImei = /^\d{15}$/.test(nuevoImei) && !series.some((s) => s.imei === nuevoImei);
  const analitico = [{ t: "Inventario inicial (1 oct)", v: 0 }, { t: "(+) Compras del mes", v: 40000 }, { t: "(−) Inventario final por conteo físico", v: -redondear(final - faltante) }, { t: "Costo de ventas", v: redondear(40000 - (final - faltante)) }];

  return (
    <Marco ruta={[{ t: "Inventario" }, { t: "Toma física" }]}>
      <Pagina ancho="max-w-[1100px]">
        <Titulo t="Toma física y control de inventario" sub="Conteo físico, series por IMEI, alertas de reabastecimiento y sistema analítico" />
        <Pestanas valor={tab} onChange={setTab} opciones={[{ v: "conteo", t: "Conteo físico", n: conDif.length || undefined }, { v: "series", t: "Series e IMEI" }, { v: "reab", t: "Reabastecimiento", n: reab.length }, { v: "analitico", t: "Sistema analítico" }]} />

        {tab === "conteo" && (
          <>
            <Tarjeta className="p-4 flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[220px]"><b className="font-semibold block">Toma física al 31/10/2026</b><span className="text-sm text-texto2">{conDif.length ? `${conDif.length} productos con diferencia · faltante US$ ${dinero(faltante)}` : "Todo coincide con el sistema."}</span></div>
              {hecho ? <Etiqueta t="contab">Ajuste generado</Etiqueta> : <Etiqueta t="borrador">En conteo</Etiqueta>}
              <Permiso roles={["admin", "contador"]}><Boton v="pri" disabled={!conDif.length || hecho} onClick={() => setAjuste(true)}><FilePlus2 size={16} />Generar ajuste</Boton></Permiso>
            </Tarjeta>
            <Tarjeta className="overflow-hidden">
              <TablaCifras<Conteo> clave={(c) => c.p.nombre} filas={conteo} totales={false} resaltar={(c) => dif(c) !== 0}
                tarjeta={(c) => ({ meta: `Sistema ${c.sistema}${dif(c) ? ` · diferencia ${dif(c)}` : ""}`, estado: dif(c) ? <Etiqueta t="desc">Diferencia</Etiqueta> : undefined, titulo: c.p.nombre, valor: <input value={c.contado} disabled={hecho} onChange={(e) => setConteo(conteo.map((x) => (x === c ? { ...x, contado: Math.max(parseInt(e.target.value) || 0, 0) } : x)))} inputMode="numeric" aria-label={`Contado de ${c.p.nombre}`} className="cifra w-16 h-9 px-2 text-right rounded-lg border border-bordef bg-fondo outline-none focus:border-texto2 disabled:opacity-50" /> })}
                cols={[
                  { clave: "n", titulo: "Producto", ver: (c) => <span className="block max-w-[260px] truncate">{c.p.nombre}</span> },
                  { clave: "s", titulo: "Sistema", tipo: "num", ver: (c) => <span className="cifra">{c.sistema}</span> },
                  { clave: "c", titulo: "Contado", tipo: "num", ver: (c) => (
                    <input value={c.contado} disabled={hecho} onChange={(e) => setConteo(conteo.map((x) => (x === c ? { ...x, contado: Math.max(parseInt(e.target.value) || 0, 0) } : x)))} inputMode="numeric" aria-label={`Contado de ${c.p.nombre}`}
                      className="cifra w-20 h-9 px-2 text-right rounded-lg border border-bordef bg-fondo outline-none focus:border-texto2 disabled:opacity-50" />) },
                  { clave: "d", titulo: "Diferencia", tipo: "num", ver: (c) => <span className={cx("cifra", dif(c) !== 0 && "text-alerta font-semibold")}>{dif(c) || "—"}</span> },
                  { clave: "v", titulo: "Valor US$", tipo: "num", ver: (c) => <Cifra v={valorDif(c)} /> },
                ]} />
            </Tarjeta>
          </>
        )}

        {tab === "series" && (
          <Tarjeta className="overflow-hidden">
            <CabTarjeta titulo="iPhone 13 · costo específico por IMEI" sub="Cada unidad lleva su propio costo; al venderla sale ese costo. IMEI de muestra.">
              <Permiso roles={ESCRIBE}><Boton v="pri" onClick={() => { setNuevoImei(""); setImei(true); }}><Plus size={16} />Registrar IMEI</Boton></Permiso>
            </CabTarjeta>
            <TablaCifras<Serie> clave={(s) => s.imei} filas={series} totales={false}
              tarjeta={(s) => ({ meta: s.imei, estado: <Etiqueta t={s.estado === "Vendido" ? "neutra" : "contab"}>{s.estado}</Etiqueta>, titulo: s.producto, valor: dinero(s.costo), detalle: s.doc ? `Vendido en ${s.doc}` : undefined })}
              cols={[
                { clave: "i", titulo: "IMEI", ver: (s) => <span className="cifra">{s.imei}</span> },
                { clave: "p", titulo: "Producto", ver: (s) => s.producto },
                { clave: "c", titulo: "Costo", tipo: "num", ver: (s) => <Cifra v={s.costo} /> },
                { clave: "e", titulo: "Estado", ver: (s) => <Etiqueta t={s.estado === "Vendido" ? "neutra" : "contab"}>{s.estado}</Etiqueta> },
                { clave: "d", titulo: "Documento", ver: (s) => <span className="cifra text-texto2">{s.doc ?? "—"}</span> },
              ]} />
          </Tarjeta>
        )}

        {tab === "reab" && (
          <>
            <Tarjeta className="p-4 flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[220px]"><b className="font-semibold block">{reab.length} productos bajo su mínimo</b><span className="text-sm text-texto2">El mínimo cubre una semana de ventas (ventas del mes ÷ 4). Se ajusta por producto en Productos.</span></div>
              <Permiso roles={ESCRIBE}><Boton v="pri" onClick={() => avisar("Pedidos generados: uno por proveedor")}><ShoppingCart size={16} />Generar pedidos</Boton></Permiso>
            </Tarjeta>
            <Tarjeta className="overflow-hidden">
              <TablaCifras<(typeof reab)[number]> clave={(r) => r.p.nombre} filas={reab} totales={false}
                tarjeta={(r) => ({ meta: r.p.proveedor, estado: r.p.finales === 0 ? <Etiqueta t="desc">Agotado</Etiqueta> : undefined, titulo: r.p.nombre, valor: `Pedir ${r.sugerido}`, detalle: `Existencia ${r.p.finales} · mínimo ${r.minimo}` })}
                cols={[
                  { clave: "n", titulo: "Producto", ver: (r) => <span className="block max-w-[240px] truncate">{r.p.nombre}</span> },
                  { clave: "pr", titulo: "Proveedor", ver: (r) => <span className="text-texto2">{r.p.proveedor}</span> },
                  { clave: "e", titulo: "Existencia", tipo: "num", ver: (r) => <span className={cx("cifra", r.p.finales === 0 && "text-alerta font-semibold")}>{r.p.finales}</span> },
                  { clave: "m", titulo: "Mínimo", tipo: "num", ver: (r) => <span className="cifra">{r.minimo}</span> },
                  { clave: "s", titulo: "Sugerido a pedir", tipo: "num", ver: (r) => <b className="cifra">{r.sugerido}</b> },
                  { clave: "v", titulo: "Costo estimado", tipo: "num", ver: (r) => <Cifra v={redondear(r.sugerido * r.p.costo)} /> },
                ]} />
            </Tarjeta>
          </>
        )}

        {tab === "analitico" && (
          <>
            <Aviso>En el sistema analítico no se lleva el kardex al día: el costo de ventas sale al final del mes con el conteo físico. Se elige en Parámetros.</Aviso>
            <Tarjeta className="overflow-hidden">
              <EncabezadoLibro empresa={EMPRESA_OFICIAL} titulo="Costo de ventas · sistema analítico" periodo="Octubre 2026" sucursal="Todas las sucursales" nota="Valores en US$" />
              <TablaCifras<(typeof analitico)[number]> clave={(f) => f.t} filas={analitico} totales={false} claseFila={(f) => (f.t === "Costo de ventas" ? "font-bold bg-tarjeta2/60" : undefined)}
                cols={[{ clave: "t", titulo: "Concepto", ver: (f) => f.t }, { clave: "v", titulo: "US$", tipo: "num", ver: (f) => <Cifra v={f.v} vacio="0.00" /> }]} />
            </Tarjeta>
            <p className="text-xs text-texto3">Con el sistema perpetuo el costo de ventas de octubre es US$ 34,112.00; el analítico da US$ {dinero(analitico[3].v)} porque incluye el faltante de US$ {dinero(faltante)} encontrado al contar.</p>
          </>
        )}
      </Pagina>
      <Dialogo lateral abierto={ajuste} onCerrar={() => setAjuste(false)} titulo="Generar el ajuste de inventario" sub="Registra los faltantes de la toma física."
        pie={<><Boton v="fan" onClick={() => setAjuste(false)}>Cancelar</Boton><Boton v="pri" onClick={() => { setHecho(true); setAjuste(false); avisar("Ajuste generado y contabilizado"); }}>Confirmar y contabilizar</Boton></>}>
        <VistaPartida lineas={lineas} borrador={false} />
      </Dialogo>
      <Dialogo abierto={imei} onCerrar={() => setImei(false)} titulo="Registrar IMEI" sub="Un IMEI por unidad, 15 dígitos."
        pie={<><Boton v="fan" onClick={() => setImei(false)}>Cancelar</Boton><Boton v="pri" disabled={!okImei} onClick={() => { setSeries([{ imei: nuevoImei, producto: "iPhone 13", costo: 400, estado: "En inventario" }, ...series]); setImei(false); avisar("IMEI registrado"); }}>Guardar</Boton></>}>
        <Campo label="IMEI" error={nuevoImei && !okImei ? (series.some((s) => s.imei === nuevoImei) ? "Ese IMEI ya existe." : "Deben ser 15 dígitos.") : undefined}><Entrada value={nuevoImei} onChange={(e) => setNuevoImei(e.target.value.replace(/\D/g, "").slice(0, 15))} inputMode="numeric" className="cifra" autoFocus /></Campo>
      </Dialogo>
    </Marco>
  );
}

/* ============================ HU-44 Notas a los estados financieros ============================ */
export function NotasEstados() {
  const { avisar } = useApp();
  const [textos, setTextos] = useState<Record<number, string>>(Object.fromEntries(NOTAS.map((n) => [n.n, n.texto])));
  const [act, setAct] = useState(1);
  const n: Nota = NOTAS.find((x) => x.n === act)!;
  const editada = textos[act] !== n.texto;

  return (
    <Marco ruta={[{ t: "Libros y reportes" }, { t: "Notas a los estados" }]}>
      <Pagina ancho="max-w-[1100px]">
        <Titulo t="Notas a los estados financieros" sub="El sistema llena las cifras; usted redacta el texto"><BotonExportar nombre="Notas a los estados financieros" formatos={["PDF", "Excel"]} /></Titulo>
        <div className="grid lg:grid-cols-[260px_minmax(0,1fr)] gap-5 items-start">
          <Tarjeta className="overflow-hidden"><ul role="listbox" aria-label="Notas">
            {NOTAS.map((x) => (
              <li key={x.n}><button type="button" role="option" aria-selected={act === x.n} onClick={() => setAct(x.n)}
                className={cx("w-full text-left px-4 py-3 flex items-center gap-3 border-b border-borde last:border-0 transition-colors", act === x.n ? "bg-pri text-prit font-semibold" : "hover:bg-tarjeta2 text-texto2")}>
                <span className="cifra w-5">{x.n}</span><span className="flex-1 truncate">{x.titulo}</span>{textos[x.n] !== x.texto && <i className={cx("w-1.5 h-1.5 rounded-full", act === x.n ? "bg-prit" : "bg-pri")} title="Editada" />}
              </button></li>
            ))}
          </ul></Tarjeta>
          <Tarjeta className="overflow-hidden">
            <CabTarjeta titulo={`Nota ${n.n} · ${n.titulo}`} sub={editada ? "Texto editado" : "Texto sugerido por el sistema"}>
              <Boton peq disabled={!editada} onClick={() => setTextos({ ...textos, [act]: n.texto })}><RefreshCcw size={14} />Restaurar</Boton>
            </CabTarjeta>
            <div className="p-5 grid gap-4">
              <Area value={textos[act]} onChange={(e) => setTextos({ ...textos, [act]: e.target.value })} rows={5} aria-label="Texto de la nota" />
              <div><b className="text-sm font-semibold">Datos que llena el sistema</b>
                <dl className="grid sm:grid-cols-3 gap-3 mt-2">{n.campos.map((c) => <div key={c.k} className="bg-fondo rounded-2xl p-3"><dt className="text-xs text-texto2">{c.k}</dt><dd className="cifra font-semibold mt-0.5">{c.v}</dd></div>)}</dl></div>
              <div className="bg-pri text-prit rounded-2xl p-5 text-[13px] grid gap-2">
                <b className="text-xs tracking-[.12em] uppercase">{EMPRESA_OFICIAL} · Notas a los estados financieros · 31 de octubre de 2026</b>
                <b>Nota {n.n}. {n.titulo}</b><p className="whitespace-pre-line">{textos[act]}</p>
                <p className="cifra text-prit/70">{n.campos.map((c) => `${c.k}: ${c.v}`).join(" · ")}</p>
              </div>
              <div className="flex justify-end"><Boton v="pri" onClick={() => avisar("Nota guardada")}>Guardar nota</Boton></div>
            </div>
          </Tarjeta>
        </div>
      </Pagina>
    </Marco>
  );
}

/* ============================ HU-75 Planillas de ISSS y AFP ============================ */
export function PlanillasOficiales() {
  const { avisar } = useApp();
  const [tab, setTab] = useState<"isss" | "afp">("isss");
  const [mes, setMes] = useState("Octubre 2026");
  const p = planillasOficiales();
  const filas = mes === "Octubre 2026" ? p[tab] : [];
  const t = (k: "base" | "lab" | "pat" | "total") => suma(filas.map((f) => f[k]));
  const nombre = tab === "isss" ? "ISSS" : "AFP";

  return (
    <Marco ruta={[{ t: "Planilla" }, { t: "Planillas de ISSS y AFP" }]}>
      <Pagina ancho="max-w-[1000px]">
        <Titulo t="Planillas de ISSS y AFP" sub="Archivos mensuales para presentar las cotizaciones de empleados y patrono">
          <Permiso roles={["admin", "contador"]}><Boton v="pri" disabled={!filas.length} onClick={() => avisar(`Planilla de ${nombre} generada`)}><FileDown size={16} />Generar planilla de {nombre}</Boton></Permiso>
        </Titulo>
        <Tarjeta className="p-4 flex flex-wrap items-end gap-x-3 gap-y-2">
          <div className="grid gap-1.5 flex-1 sm:flex-none sm:w-[220px]">
            <div className="flex items-center justify-between gap-3"><span className="text-sm font-semibold">Mes</span><span className="sm:hidden">{mes === "Octubre 2026" && <Etiqueta t="contab">Presentada · 12/11/2026</Etiqueta>}</span></div>
            <Selector value={mes} onChange={(e) => setMes(e.target.value)} aria-label="Mes" className="h-11">{["Octubre 2026", "Septiembre 2026"].map((m) => <option key={m}>{m}</option>)}</Selector>
          </div>
          <span className="hidden sm:block ml-auto pb-2">{mes === "Octubre 2026" && <Etiqueta t="contab">Presentada · 12/11/2026</Etiqueta>}</span>
        </Tarjeta>
        <Pestanas valor={tab} onChange={setTab} opciones={[{ v: "isss", t: "ISSS" }, { v: "afp", t: "AFP" }]} />
        <Tarjeta className="overflow-hidden">
          <EncabezadoLibro empresa={EMPRESA_OFICIAL} titulo={`Planilla de ${nombre}`} periodo={mes} sucursal="Todas las sucursales" nota="Valores en US$" />
          <TablaCifras<(typeof filas)[number]> clave={(f) => String(f.n)} filas={filas} vacio="Este mes no tiene planilla."
            tarjeta={(f) => ({ meta: `Base ${dinero(f.base)}`, titulo: f.nombre, valor: dinero(f.total), detalle: `Empleado ${dinero(f.lab)} · patrono ${dinero(f.pat)}` })}
            cols={[
              { clave: "n", titulo: "Empleado", ver: (f) => <span className="block max-w-[280px] truncate">{f.nombre}</span> },
              { clave: "b", titulo: tab === "isss" ? "Salario cotizable" : "Salario", tipo: "num", total: t("base"), ver: (f) => <Cifra v={f.base} /> },
              { clave: "l", titulo: tab === "isss" ? "Empleado 3 %" : "Empleado 7.25 %", tipo: "num", total: t("lab"), ver: (f) => <Cifra v={f.lab} /> },
              { clave: "p", titulo: tab === "isss" ? "Patrono 7.5 %" : "Patrono 8.75 %", tipo: "num", total: t("pat"), ver: (f) => <Cifra v={f.pat} /> },
              { clave: "t", titulo: "Total a pagar", tipo: "num", total: t("total"), ver: (f) => <Cifra v={f.total} className="font-semibold" /> },
            ]} />
        </Tarjeta>
        {tab === "isss" && <p className="text-xs text-texto3">El salario cotizable del ISSS tiene un techo de US$ 1,000.00 por empleado.</p>}
      </Pagina>
    </Marco>
  );
}
