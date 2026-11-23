import { useState } from "react";
import { Ban, CircleCheck, FilePlus2, FileUp, Plus } from "lucide-react";
import { useApp } from "../contexto";
import {
  ACTIVO_CASO, CONCILIACION, EMPRESA_OFICIAL, FONDO_CAJA_CHICA, MOV_BANCOS, VALES, cuadroDepreciacion, redondear, suma, type Movimiento,
} from "../datos/caso";
import { Marco, Permiso } from "../marco/Marco";
import { Aviso, Boton, Campo, Casilla, Dialogo, Entrada, Etiqueta, Pagina, Pestanas, Selector, Tarjeta, Titulo, cx, dinero } from "../ui";
import { BotonExportar, Cifra, EncabezadoLibro, TablaCifras, VistaPartida } from "../ui/reportes";
import type { Rol } from "../datos/navegacion";

const ESCRIBE: Rol[] = ["admin", "contador", "auxiliar"];
const num = (v: string) => { const n = parseFloat(v.replace(/,/g, "")); return isNaN(n) ? 0 : n; };
const etq = (e: Movimiento["estado"]) => (e === "Anulado" ? "anulada" : e === "Cobrado" || e === "Acreditada" || e === "Aplicada" ? "contab" : e === "En tránsito" ? "desc" : "borrador");

type Vale = (typeof VALES)[number];

/* ========================= HU-77 · HU-78 · HU-79 ========================= */
export function Conciliacion() {
  const { avisar } = useApp();
  const [tab, setTab] = useState<"caja" | "mov" | "conc">("caja");
  const [vales, setVales] = useState<Vale[]>(VALES);
  const [movs, setMovs] = useState<Movimiento[]>(MOV_BANCOS);
  const [vale, setVale] = useState(false), [reint, setReint] = useState(false), [nuevo, setNuevo] = useState(false);
  const [mov, setMov] = useState<Movimiento | null>(null);
  const [cuenta, setCuenta] = useState(CONCILIACION.cuenta);
  const [marcados, setMarcados] = useState<Record<string, boolean>>({ m2: true, m4: true });
  const [guardada, setGuardada] = useState(false);
  const [imp, setImp] = useState<"" | "elegir" | "revisar">("");

  /* caja chica */
  const [vc, setVc] = useState({ concepto: "", doc: "", neto: "" });
  const pend = vales.filter((v) => v.estado === "Pendiente");
  const gastado = suma(pend.map((v) => v.total));
  const lineasReint = [
    { c: "4201", n: "Gastos de Administración · vales de caja chica", d: suma(pend.map((v) => v.neto)), h: 0 },
    { c: "1112", n: "Crédito Fiscal IVA", d: suma(pend.map((v) => v.iva)), h: 0 },
    { c: "11010301", n: "Banco Agrícola · cheque de reintegro", d: 0, h: gastado },
  ];
  const netoV = num(vc.neto), okVale = vc.concepto.trim().length > 2 && /^[A-Z]{2,4}-?[A-Z0-9]{3,10}$/.test(vc.doc) && netoV > 0 && netoV * 1.13 <= FONDO_CAJA_CHICA - gastado;

  /* movimientos */
  const [nm, setNm] = useState({ tipo: "Cheque" as Movimiento["tipo"], numero: "", detalle: "", monto: "" });
  const lineasMov: { c: string; n: string; d: number; h: number }[] = (() => {
    const m = num(nm.monto);
    switch (nm.tipo) {
      case "Cheque": return [{ c: "2102", n: "Cuentas por Pagar Comerciales", d: m, h: 0 }, { c: "11010301", n: "Banco Agrícola", d: 0, h: m }];
      case "Remesa": return [{ c: "11010301", n: "Banco Agrícola", d: m, h: 0 }, { c: "110101", n: "Caja general", d: 0, h: m }];
      case "Nota de cargo": return [{ c: "4203", n: "Costos Financieros", d: m, h: 0 }, { c: "11010301", n: "Banco Agrícola", d: 0, h: m }];
      default: return [{ c: "11010301", n: "Banco Agrícola", d: m, h: 0 }, { c: "5102", n: "Otros ingresos", d: 0, h: m }];
    }
  })();

  /* conciliación */
  const activa = cuenta === CONCILIACION.cuenta;
  const lista = activa ? movs.filter((m) => m.estado !== "Anulado") : [];
  const enTransito = lista.filter((m) => !marcados[m.id] && (m.tipo === "Cheque" || m.tipo === "Remesa"));
  const depositos = suma(enTransito.filter((m) => m.tipo === "Remesa").map((m) => m.monto));
  const cheques = suma(enTransito.filter((m) => m.tipo === "Cheque").map((m) => m.monto));
  const conciliado = redondear(CONCILIACION.saldoBanco + depositos - cheques);
  const dif = redondear(conciliado - CONCILIACION.saldoLibros);

  return (
    <Marco ruta={[{ t: "Tesorería" }, { t: "Caja chica y conciliación" }]}>
      <Pagina ancho="max-w-[1100px]">
        <Titulo t="Caja chica y conciliación" sub="Fondo fijo con sus reintegros, cheques, remesas y notas bancarias, y conciliación con el estado de cuenta" />
        <Pestanas valor={tab} onChange={setTab} opciones={[{ v: "caja", t: "Caja chica" }, { v: "mov", t: "Cheques, remesas y notas", n: movs.length }, { v: "conc", t: "Conciliación bancaria" }]} />

        {tab === "caja" && (
          <>
            <div className="grid grid-cols-3 gap-3">
              {[["Fondo fijo", FONDO_CAJA_CHICA], ["Vales por reintegrar", gastado], ["Efectivo disponible", redondear(FONDO_CAJA_CHICA - gastado)]].map(([k, v]) => (
                <Tarjeta key={k as string} className="p-4"><span className="text-xs text-texto2">{k}</span><b className="cifra block text-xl mt-1 font-semibold">{dinero(v as number)}</b></Tarjeta>
              ))}
            </div>
            <Tarjeta className="overflow-hidden">
              <div className="px-5 py-4 border-b border-borde flex items-center justify-between gap-3 flex-wrap">
                <div><h2 className="text-base font-semibold">Vales de caja chica</h2><p className="text-xs text-texto2 mt-0.5">Caja chica · Casa matriz · cada vale lleva su comprobante</p></div>
                <Permiso roles={ESCRIBE}><div className="flex gap-2"><Boton onClick={() => { setVc({ concepto: "", doc: "", neto: "" }); setVale(true); }}><Plus size={16} />Registrar vale</Boton>
                  <Boton v="pri" disabled={!pend.length} onClick={() => setReint(true)}><FilePlus2 size={16} />Reintegrar</Boton></div></Permiso>
              </div>
              <TablaCifras<Vale> clave={(v) => v.id} filas={vales} totales="Total de vales" tarjeta={(v) => ({ meta: `${v.fecha} · ${v.doc}`, estado: <Etiqueta t={v.estado === "Pendiente" ? "borrador" : "contab"}>{v.estado}</Etiqueta>, titulo: v.concepto, valor: dinero(v.total) })}
                cols={[
                  { clave: "f", titulo: "Fecha", ver: (v) => <span className="cifra">{v.fecha}</span> },
                  { clave: "d", titulo: "Comprobante", ver: (v) => <span className="cifra">{v.doc}</span> },
                  { clave: "c", titulo: "Concepto", ver: (v) => v.concepto },
                  { clave: "n", titulo: "Valor neto", tipo: "num", total: suma(vales.map((v) => v.neto)), ver: (v) => <Cifra v={v.neto} /> },
                  { clave: "i", titulo: "IVA", tipo: "num", total: suma(vales.map((v) => v.iva)), ver: (v) => <Cifra v={v.iva} /> },
                  { clave: "e", titulo: "Estado", ver: (v) => <Etiqueta t={v.estado === "Pendiente" ? "borrador" : "contab"}>{v.estado}</Etiqueta> },
                  { clave: "t", titulo: "Total", tipo: "num", total: suma(vales.map((v) => v.total)), ver: (v) => <Cifra v={v.total} /> },
                ]} />
            </Tarjeta>
          </>
        )}

        {tab === "mov" && (
          <Tarjeta className="overflow-hidden">
            <div className="px-5 py-4 border-b border-borde flex items-center justify-between gap-3 flex-wrap">
              <div><h2 className="text-base font-semibold">Movimientos bancarios</h2><p className="text-xs text-texto2 mt-0.5">Banco Agrícola · cuenta corriente · cheques, remesas y notas generan su partida. Los datos de cheques y remesas son ilustrativos.</p></div>
              <Permiso roles={ESCRIBE}><Boton v="pri" onClick={() => { setNm({ tipo: "Cheque", numero: "", detalle: "", monto: "" }); setNuevo(true); }}><Plus size={16} />Registrar movimiento</Boton></Permiso>
            </div>
            <TablaCifras<Movimiento> clave={(m) => m.id} filas={movs} totales={false} onFila={setMov}
              tarjeta={(m) => ({ meta: `${m.fecha} · ${m.tipo} ${m.numero}`, estado: <Etiqueta t={etq(m.estado)}>{m.estado}</Etiqueta>, titulo: m.detalle, valor: dinero(m.monto) })}
              cols={[
                { clave: "f", titulo: "Fecha", ver: (m) => <span className="cifra">{m.fecha}</span> },
                { clave: "t", titulo: "Tipo", ver: (m) => m.tipo },
                { clave: "n", titulo: "N.º", ver: (m) => <span className="cifra">{m.numero}</span> },
                { clave: "d", titulo: "Detalle", ver: (m) => <span className="block max-w-[300px] truncate">{m.detalle}</span> },
                { clave: "e", titulo: "Estado", ver: (m) => <Etiqueta t={etq(m.estado)}>{m.estado}</Etiqueta> },
                { clave: "m", titulo: "Monto", tipo: "num", ver: (m) => <Cifra v={m.monto} /> },
              ]} />
          </Tarjeta>
        )}

        {tab === "conc" && (
          <>
            <Tarjeta className="p-4 flex flex-wrap items-end gap-3">
              <label className="grid gap-1.5 text-sm font-semibold">Cuenta bancaria
                <Selector value={cuenta} onChange={(e) => { setCuenta(e.target.value); setGuardada(false); }} className="h-10 w-[280px]">{[CONCILIACION.cuenta, "Banco Cuscatlán · cuenta de ahorro"].map((c) => <option key={c}>{c}</option>)}</Selector></label>
              <span className="text-sm text-texto2 pb-2.5">Corte al {CONCILIACION.corte}</span>
              <div className="flex-1" />
              {guardada ? <Etiqueta t="contab"><CircleCheck size={13} />Conciliada</Etiqueta> : dif === 0 && activa ? <Etiqueta t="neutra">Sin diferencia</Etiqueta> : activa && <Etiqueta t="desc">Diferencia US$ {dinero(Math.abs(dif))}</Etiqueta>}
              <Permiso roles={["admin", "contador"]}><Boton onClick={() => setImp("elegir")}><FileUp size={16} />Importar estado de cuenta</Boton></Permiso>
              <BotonExportar nombre="Conciliación bancaria" formatos={["PDF"]} />
            </Tarjeta>
            {!activa ? <Aviso>Esta cuenta no tiene movimientos en octubre de 2026.</Aviso> : (
              <div className="grid lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-5 items-start">
                <Tarjeta className="overflow-hidden">
                  <div className="px-5 py-4 border-b border-borde"><h2 className="text-base font-semibold">Movimientos del mes</h2><p className="text-xs text-texto2 mt-0.5">Marca los que ya aparecen en el estado de cuenta.</p></div>
                  <TablaCifras<Movimiento> clave={(m) => m.id} filas={lista} totales={false}
                    cols={[
                      { clave: "c", titulo: "Banco", ver: (m) => <Casilla checked={!!marcados[m.id]} onChange={(v) => { setMarcados({ ...marcados, [m.id]: v }); setGuardada(false); }} label={`Conciliar ${m.numero}`} /> },
                      { clave: "t", titulo: "Movimiento", ver: (m) => <span><b className="font-semibold">{m.tipo} {m.numero}</b><span className="block text-xs text-texto2">{m.fecha} · {m.detalle}</span></span> },
                      { clave: "m", titulo: "Monto", tipo: "num", ver: (m) => <Cifra v={m.monto} /> },
                    ]} />
                </Tarjeta>
                <Tarjeta className="overflow-hidden">
                  <EncabezadoLibro empresa={EMPRESA_OFICIAL} titulo="Conciliación bancaria" periodo={`Al ${CONCILIACION.corte}`} sucursal={cuenta} />
                  <div className="p-5 grid gap-1 text-sm">
                    {[["Saldo según estado de cuenta", CONCILIACION.saldoBanco, false], ["(+) Depósitos en tránsito", depositos, false], ["(−) Cheques en circulación", -cheques, false], ["Saldo conciliado", conciliado, true], ["Saldo según libros (1101)", CONCILIACION.saldoLibros, false], ["Diferencia", dif, true]].map(([k, v, f]) => (
                      <div key={k as string} className={cx("flex justify-between py-1.5", !!f && "font-bold border-t border-bordef mt-1 pt-2.5", k === "Diferencia" && dif !== 0 && "text-alerta")}><span className={f ? "" : "text-texto2"}>{k as string}</span><span className="cifra">{(v as number) < 0 ? `(${dinero(-(v as number))})` : dinero(v as number)}</span></div>
                    ))}
                    <Permiso roles={["admin", "contador"]}>
                      <Boton v="pri" className="mt-4" disabled={dif !== 0 || guardada} onClick={() => { setGuardada(true); avisar("Conciliación guardada"); }}>Guardar conciliación</Boton>
                    </Permiso>
                  </div>
                </Tarjeta>
              </div>
            )}
          </>
        )}
      </Pagina>

      <Dialogo abierto={!!imp} onCerrar={() => setImp("")} ancho="max-w-[680px]" titulo="Importar el estado de cuenta" sub="Archivo CSV del banco; el sistema empareja cada línea con los movimientos del mes."
        pie={imp === "elegir" ? <><Boton v="fan" onClick={() => setImp("")}>Cancelar</Boton><Boton v="pri" onClick={() => setImp("revisar")}>Cargar archivo</Boton></>
          : <><Boton v="fan" onClick={() => setImp("elegir")}>Atrás</Boton><Boton v="pri" onClick={() => { setMarcados({ ...marcados, m2: true, m4: true }); setGuardada(false); setImp(""); avisar("2 movimientos conciliados; 1 línea sin coincidencia"); }}>Aplicar coincidencias</Boton></>}>
        {imp === "elegir" && (
          <div className="border border-dashed border-bordef rounded-2xl p-8 grid justify-items-center gap-2 text-center">
            <FileUp size={26} className="text-texto2" /><b className="font-semibold">estado_cuenta_octubre2026.csv</b><span className="text-sm text-texto2">Archivo de ejemplo · 3 líneas · fechas dd/mm/aaaa y montos con punto decimal</span>
          </div>
        )}
        {imp === "revisar" && (
          <div className="rounded-2xl border border-borde overflow-hidden">
            <TablaCifras<{ f: string; d: string; m: number; ok: string }> clave={(x) => x.d} totales={false}
              filas={[{ f: "29/10/2026", d: "Cheque 0013", m: -67.8, ok: "CK-0013" }, { f: "30/10/2026", d: "Comisiones bancarias", m: -15, ok: "NC-1178" }, { f: "31/10/2026", d: "Comisión por transferencia", m: -2.5, ok: "" }]}
              cols={[
                { clave: "f", titulo: "Fecha", ver: (x) => <span className="cifra">{x.f}</span> },
                { clave: "d", titulo: "Descripción del banco", ver: (x) => x.d },
                { clave: "m", titulo: "Monto", tipo: "num", ver: (x) => <Cifra v={x.m} /> },
                { clave: "e", titulo: "Coincidencia", ver: (x) => (x.ok ? <Etiqueta t="contab"><CircleCheck size={13} />{x.ok}</Etiqueta> : <Etiqueta t="desc">Sin coincidencia</Etiqueta>) },
              ]} />
          </div>
        )}
        {imp === "revisar" && <p className="text-xs text-texto3">La línea sin coincidencia necesita una nota de cargo en Cheques, remesas y notas.</p>}
      </Dialogo>

      <Dialogo lateral abierto={vale} onCerrar={() => setVale(false)} titulo="Registrar vale" sub={`El fondo fijo es de US$ ${dinero(FONDO_CAJA_CHICA)}; no se puede gastar más de lo disponible.`}
        pie={<><Boton v="fan" onClick={() => setVale(false)}>Cancelar</Boton><Boton v="pri" disabled={!okVale} onClick={() => { setVales([...vales, { id: "v" + (vales.length + 1), fecha: "31/10/2026", doc: vc.doc, concepto: vc.concepto, neto: netoV, iva: redondear(netoV * 0.13), total: redondear(netoV * 1.13), estado: "Pendiente" }]); setVale(false); avisar("Vale registrado"); }}>Guardar vale</Boton></>}>
        <Campo label="Concepto"><Entrada value={vc.concepto} onChange={(e) => setVc({ ...vc, concepto: e.target.value })} placeholder="Ej. Material de limpieza" /></Campo>
        <div className="grid grid-cols-2 gap-3">
          <Campo label="Comprobante"><Entrada value={vc.doc} onChange={(e) => setVc({ ...vc, doc: e.target.value.toUpperCase() })} placeholder="CCF-L0414" className="cifra" /></Campo>
          <Campo label="Valor neto (US$)" error={netoV * 1.13 > FONDO_CAJA_CHICA - gastado ? "Supera el efectivo disponible." : undefined}><Entrada value={vc.neto} onChange={(e) => setVc({ ...vc, neto: e.target.value })} inputMode="decimal" className="cifra" /></Campo>
        </div>
        <p className="text-sm text-texto2">IVA 13 %: <b className="cifra">{dinero(redondear(netoV * 0.13))}</b> · total del vale <b className="cifra">{dinero(redondear(netoV * 1.13))}</b></p>
      </Dialogo>

      <Dialogo lateral abierto={reint} onCerrar={() => setReint(false)} titulo="Reintegrar la caja chica" sub="Repone el fondo a US$ 200.00 con un cheque y registra los gastos."
        pie={<><Boton v="fan" onClick={() => setReint(false)}>Cancelar</Boton><Boton v="pri" onClick={() => { setVales(vales.map((v) => (v.estado === "Pendiente" ? { ...v, estado: "Reintegrado" } : v))); setReint(false); avisar("Reintegro registrado · partida en borrador"); }}>Confirmar reintegro</Boton></>}>
        <VistaPartida lineas={lineasReint} />
      </Dialogo>

      <Dialogo lateral abierto={nuevo} onCerrar={() => setNuevo(false)} titulo="Registrar movimiento bancario" sub="Banco Agrícola · cuenta corriente"
        pie={<><Boton v="fan" onClick={() => setNuevo(false)}>Cancelar</Boton><Boton v="pri" disabled={!nm.numero || !nm.detalle || num(nm.monto) <= 0} onClick={() => { setMovs([{ id: "m" + (movs.length + 1), fecha: "31/10/2026", tipo: nm.tipo, numero: nm.numero, detalle: nm.detalle, monto: num(nm.monto), estado: nm.tipo === "Cheque" ? "Emitido" : nm.tipo === "Remesa" ? "En tránsito" : nm.tipo === "Nota de cargo" ? "Aplicada" : "Acreditada" }, ...movs]); setNuevo(false); avisar("Movimiento registrado · partida en borrador"); }}>Guardar</Boton></>}>
        <Campo label="Tipo"><Selector value={nm.tipo} onChange={(e) => setNm({ ...nm, tipo: e.target.value as Movimiento["tipo"] })}>{["Cheque", "Remesa", "Nota de cargo", "Nota de abono"].map((t) => <option key={t}>{t}</option>)}</Selector></Campo>
        <div className="grid grid-cols-2 gap-3">
          <Campo label="Número"><Entrada value={nm.numero} onChange={(e) => setNm({ ...nm, numero: e.target.value.toUpperCase() })} placeholder="CK-0015" className="cifra" /></Campo>
          <Campo label="Monto (US$)"><Entrada value={nm.monto} onChange={(e) => setNm({ ...nm, monto: e.target.value })} inputMode="decimal" className="cifra" /></Campo>
        </div>
        <Campo label="Detalle"><Entrada value={nm.detalle} onChange={(e) => setNm({ ...nm, detalle: e.target.value })} /></Campo>
        <VistaPartida lineas={lineasMov} />
      </Dialogo>

      <Dialogo abierto={!!mov} onCerrar={() => setMov(null)} titulo={mov ? `${mov.tipo} ${mov.numero}` : ""} sub={mov?.detalle}
        pie={<>
          {mov?.tipo === "Cheque" && mov.estado === "Emitido" && <Permiso roles={ESCRIBE}><Boton onClick={() => { setMovs(movs.map((m) => (m.id === mov.id ? { ...m, estado: "Anulado" } : m))); setMov(null); avisar("Cheque anulado · se revierte su partida"); }}><Ban size={16} />Anular cheque</Boton>
            <Boton v="pri" onClick={() => { setMovs(movs.map((m) => (m.id === mov.id ? { ...m, estado: "Cobrado" } : m))); setMov(null); avisar("Cheque marcado como cobrado"); }}>Marcar como cobrado</Boton></Permiso>}
          <Boton v="fan" onClick={() => setMov(null)}>Cerrar</Boton></>}>
        {mov && <dl className="grid gap-2.5 text-sm">{[["Fecha", mov.fecha], ["Monto", `US$ ${dinero(mov.monto)}`], ["Estado", mov.estado]].map(([k, v]) => <div key={k} className="flex justify-between border-b border-borde pb-2 last:border-0"><dt className="text-texto2">{k}</dt><dd className="font-semibold">{v}</dd></div>)}</dl>}
      </Dialogo>
    </Marco>
  );
}

/* ========================= HU-82 Depreciación ========================= */
export function Depreciacion() {
  const { avisar } = useApp();
  const [tab, setTab] = useState<"mes" | "cuadro">("mes");
  const [mes, setMes] = useState("Octubre 2026");
  const [conf, setConf] = useState(false);
  const [hecha, setHecha] = useState<Record<string, boolean>>({});
  const cuadro = cuadroDepreciacion();
  const idx = mes === "Noviembre 2026" ? 1 : 0;
  const fila = cuadro[idx];
  const lineas = [{ c: ACTIVO_CASO.gasto, n: "Gastos de Administración · depreciación", d: fila.cuota, h: 0 }, { c: ACTIVO_CASO.acumulada, n: "(R) Depreciaciones", d: 0, h: fila.cuota }];

  return (
    <Marco ruta={[{ t: "Activo fijo" }, { t: "Depreciación" }]}>
      <Pagina ancho="max-w-[1000px]">
        <Titulo t="Depreciación" sub="Línea recta con los porcentajes del Art. 30 de la LISR · cuadro por activo y partida del mes">
          <Permiso roles={["admin", "contador"]}><Boton v="pri" disabled={!!hecha[mes]} onClick={() => setConf(true)}><FilePlus2 size={16} />Generar depreciación del mes</Boton></Permiso>
        </Titulo>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[["Costo del activo", ACTIVO_CASO.costo], ["Cuota del mes", fila.cuota], ["Depreciación acumulada", fila.acumulada], ["Valor en libros", fila.enLibros]].map(([k, v]) => (
            <Tarjeta key={k as string} className="p-4"><span className="text-xs text-texto2">{k}</span><b className="cifra block text-xl mt-1 font-semibold">{dinero(v as number)}</b></Tarjeta>
          ))}
        </div>
        <Pestanas valor={tab} onChange={setTab} opciones={[{ v: "mes", t: "Mes a depreciar" }, { v: "cuadro", t: "Cuadro del activo" }]} />
        {tab === "mes" ? (
          <Tarjeta className="overflow-hidden">
            <div className="p-4 sm:px-5 border-b border-borde flex flex-wrap items-end gap-3">
              <label className="grid gap-1.5 text-sm font-semibold">Mes
                <Selector value={mes} onChange={(e) => setMes(e.target.value)} className="h-10 w-[200px]">{["Octubre 2026", "Noviembre 2026"].map((m) => <option key={m}>{m}</option>)}</Selector></label>
              <div className="flex-1" />
              {hecha[mes] ? <Etiqueta t="contab"><CircleCheck size={13} />Partida generada</Etiqueta> : <Etiqueta t="borrador">Pendiente</Etiqueta>}
            </div>
            <TablaCifras<typeof ACTIVO_CASO> clave={(a) => a.codigo} filas={[ACTIVO_CASO]} totales={false}
              tarjeta={(a) => ({ meta: a.codigo, titulo: a.nombre, valor: dinero(fila.cuota), detalle: `Tasa ${a.tasa} % · valor en libros ${dinero(fila.enLibros)}` })}
              cols={[
                { clave: "c", titulo: "Código", ver: (a) => <span className="cifra">{a.codigo}</span> },
                { clave: "n", titulo: "Activo", ver: (a) => a.nombre },
                { clave: "co", titulo: "Costo", tipo: "num", ver: (a) => <Cifra v={a.costo} /> },
                { clave: "t", titulo: "Tasa anual", tipo: "num", ver: (a) => <span className="cifra">{a.tasa} %</span> },
                { clave: "q", titulo: "Cuota del mes", tipo: "num", ver: () => <Cifra v={fila.cuota} className="font-semibold" /> },
                { clave: "a", titulo: "Acumulada", tipo: "num", ver: () => <Cifra v={fila.acumulada} /> },
                { clave: "l", titulo: "Valor en libros", tipo: "num", ver: () => <Cifra v={fila.enLibros} /> },
              ]} />
            <div className="p-5 border-t border-borde grid gap-1.5 text-sm text-texto2">
              <b className="text-texto font-semibold">Porcentajes máximos del Art. 30 de la LISR</b>
              <span>Edificaciones 5 % · Maquinaria 20 % · Vehículos 25 % · Otros bienes muebles (mobiliario y equipo) 50 %.</span>
            </div>
          </Tarjeta>
        ) : (
          <Tarjeta className="overflow-hidden">
            <EncabezadoLibro empresa={EMPRESA_OFICIAL} titulo={`Cuadro de depreciación · ${ACTIVO_CASO.nombre}`} periodo={`Inicio ${ACTIVO_CASO.inicio} · ${ACTIVO_CASO.tasa} % anual · 24 meses`} sucursal="Casa matriz" />
            <TablaCifras<(typeof cuadro)[number]> clave={(c) => c.mes} filas={cuadro} totales={false} resaltar={(c) => c === fila}
              cols={[
                { clave: "m", titulo: "Mes", ver: (c) => c.mes },
                { clave: "c", titulo: "Cuota", tipo: "num", ver: (c) => <Cifra v={c.cuota} /> },
                { clave: "a", titulo: "Depreciación acumulada", tipo: "num", ver: (c) => <Cifra v={c.acumulada} /> },
                { clave: "l", titulo: "Valor en libros", tipo: "num", ver: (c) => <Cifra v={c.enLibros} vacio="0.00" /> },
              ]} />
          </Tarjeta>
        )}
        <p className="text-xs text-texto3">El último mes absorbe el redondeo para que el activo quede exactamente en cero. Mes {idx + 1} de 24.</p>
      </Pagina>
      <Dialogo lateral abierto={conf} onCerrar={() => setConf(false)} titulo="Generar la depreciación del mes" sub={`${mes} · se crea ya contabilizada. Revísala antes de confirmar.`}
        pie={<><Boton v="fan" onClick={() => setConf(false)}>Cancelar</Boton><Boton v="pri" onClick={() => { setHecha({ ...hecha, [mes]: true }); setConf(false); avisar("Depreciación generada y contabilizada"); }}>Confirmar y contabilizar</Boton></>}>
        <VistaPartida lineas={lineas} borrador={false} />
      </Dialogo>
    </Marco>
  );
}
