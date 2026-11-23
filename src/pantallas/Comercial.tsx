import { useMemo, useState } from "react";
import { Plus, RotateCcw, Trash2 } from "lucide-react";
import { useApp } from "../contexto";
import {
  EMPRESA_OFICIAL, LIBRO_COMPRAS, LIBRO_CONSUMIDOR, LIBRO_CONTRIBUYENTES, POR_COBRAR, POR_PAGAR, PRODUCTOS_CASO, RANGOS, rangoDe, redondear, saldoDoc, suma, vencido,
  type DocSaldo, type Rango,
} from "../datos/caso";
import { Marco, Permiso } from "../marco/Marco";
import { Boton, Campo, Casilla, Dialogo, Entrada, Etiqueta, Pagina, Pestanas, Segmento, Selector, Tarjeta, Titulo, cx, dinero } from "../ui";
import { BotonExportar, Cifra, EncabezadoLibro, TablaCifras, VistaPartida, type LineaPartida } from "../ui/reportes";
import type { Rol } from "../datos/navegacion";

const ESCRIBE: Rol[] = ["admin", "contador", "auxiliar"];
const num = (v: string) => { const n = parseFloat(v.replace(/,/g, "")); return isNaN(n) ? 0 : n; };

type Linea = LineaPartida;
type L = { producto: string; unidades: string; unitario: string };
/* ============================= HU-59 · HU-60 · HU-61 Compras y ventas ============================= */
function Registro({ modo }: { modo: "compra" | "venta" }) {
  const { avisar } = useApp();
  const compra = modo === "compra";
  const [q, setQ] = useState("");
  const [form, setForm] = useState(false);
  const [nota, setNota] = useState(false);

  const filas = useMemo(() => compra
    ? LIBRO_COMPRAS.map((c, i) => ({ id: c.doc, fecha: c.fecha, doc: `${c.tipo} ${c.doc}`, tercero: c.proveedor, concepto: c.concepto, total: c.total, estado: i >= LIBRO_COMPRAS.length - 2 ? "Borrador" : "Contabilizada" }))
    : [...LIBRO_CONTRIBUYENTES.map((v) => ({ id: v.doc, fecha: v.fecha, doc: v.doc, tercero: v.cliente, concepto: "Venta a contribuyente", total: v.total, estado: "Contabilizada" })),
       ...LIBRO_CONSUMIDOR.map((v) => ({ id: v.del, fecha: v.fecha, doc: `${v.del} al ${v.al}`, tercero: "Consumidor final", concepto: `Ventas de ${v.caja}`, total: v.total, estado: "Contabilizada" }))],
  [compra]);
  const lista = filas.filter((f) => (f.doc + f.tercero + f.concepto).toLowerCase().includes(q.toLowerCase()));

  /* --- formulario --- */
  const [tipoDoc, setTipoDoc] = useState(compra ? "CCF" : "CCF");
  const [tercero, setTercero] = useState(compra ? "Totalynk El Salvador" : "Tecno Plaza San Miguel, S.A. de C.V.");
  const [doc, setDoc] = useState("");
  const [fecha, setFecha] = useState("31/10/2026");
  const [destino, setDestino] = useState("Mercadería para la venta");
  const [lineas, setLineas] = useState<L[]>([{ producto: PRODUCTOS_CASO[0].nombre, unidades: "1", unitario: compra ? "590.00" : "796.50" }]);
  const [base, setBase] = useState("");
  const [cond, setCond] = useState<"contado" | "credito">("contado");
  const [medio, setMedio] = useState("Banco Agrícola");

  const usaProductos = !compra || destino === "Mercadería para la venta";
  const productoPor = (n: string) => PRODUCTOS_CASO.find((p) => p.nombre === n)!;
  const baseCalc = usaProductos ? suma(lineas.map((l) => num(l.unidades) * num(l.unitario))) : num(base);
  const costoVenta = !compra ? suma(lineas.map((l) => num(l.unidades) * productoPor(l.producto).costo)) : 0;
  const iva = tipoDoc === "Sujeto excluido" ? 0 : redondear(baseCalc * 0.13);
  const total = redondear(baseCalc + iva);
  const contra = cond === "credito" ? (compra ? { c: "2102", n: "Cuentas por Pagar Comerciales" } : { c: "1103", n: "Cuentas por Cobrar Comerciales" }) : { c: medio.startsWith("Caja") ? "110101" : "11010301", n: medio };
  const cuentaGasto: Record<string, [string, string]> = { "Mercadería para la venta": ["1109", "Inventarios"], "Gasto de administración": ["4201", "Gastos de Administración"], "Gasto de venta": ["4202", "Gastos de Venta"], "Mobiliario y equipo": ["1201", "Propiedad, Planta y Equipo"] };
  const [cg, ng] = cuentaGasto[destino];
  const lineasPartida: Linea[] = compra
    ? [{ c: cg, n: ng, d: baseCalc, h: 0 }, { c: "1112", n: "Crédito Fiscal IVA", d: iva, h: 0 }, { c: contra.c, n: contra.n, d: 0, h: total }]
    : [{ c: contra.c, n: contra.n, d: total, h: 0 }, { c: "5101", n: "Ventas", d: 0, h: baseCalc }, { c: "2109", n: "IVA Débito Fiscal", d: 0, h: iva },
       { c: "4104", n: "Costo de Ventas", d: costoVenta, h: 0 }, { c: "1109", n: "Inventarios", d: 0, h: costoVenta }];
  const eDoc = doc && !/^[A-Z]{2,4}-?[A-Z0-9]{3,10}$/.test(doc) ? "Formato como CCF-P001." : "";
  const ok = !!doc && !eDoc && baseCalc > 0 && lineasPartida.length > 0 && (!usaProductos || lineas.every((l) => num(l.unidades) > 0 && num(l.unitario) > 0));
  const setL = (i: number, k: keyof L, v: string) => setLineas(lineas.map((l, j) => (j === i ? { ...l, [k]: v } : l)));
  const terceros = compra ? [...new Set(LIBRO_COMPRAS.map((c) => c.proveedor))] : [...new Set(LIBRO_CONTRIBUYENTES.map((c) => c.cliente)), "Consumidor final"];

  /* --- devolución o rebaja --- */
  const [nd, setNd] = useState(filas[0].id);
  const [ntipo, setNtipo] = useState<"Devolución" | "Rebaja">("Devolución");
  const [nbase, setNbase] = useState("100.00");
  const fnd = filas.find((f) => f.id === nd)!;
  const nB = num(nbase), nI = redondear(nB * 0.13), nT = redondear(nB + nI);
  const lineasNota: Linea[] = compra
    ? [{ c: "2102", n: "Cuentas por Pagar Comerciales", d: nT, h: 0 }, { c: ntipo === "Devolución" ? "1109" : "1109", n: "Inventarios", d: 0, h: nB }, { c: "1112", n: "Crédito Fiscal IVA", d: 0, h: nI }]
    : [{ c: "5101", n: ntipo === "Devolución" ? "Ventas · Devoluciones" : "Ventas · Rebajas", d: nB, h: 0 }, { c: "2109", n: "IVA Débito Fiscal", d: nI, h: 0 }, { c: "1103", n: "Cuentas por Cobrar Comerciales", d: 0, h: nT }];

  return (
    <Marco ruta={[{ t: "Comercial" }, { t: compra ? "Compras" : "Ventas" }]}>
      <Pagina>
        <Titulo t={compra ? "Compras" : "Ventas"} sub={compra ? "Registra el documento del proveedor: actualiza inventario, IVA, cuentas por pagar y contabilidad en un paso" : "Registra la venta: actualiza inventario, IVA, cuentas por cobrar y contabilidad en un paso"}>
          <Permiso roles={ESCRIBE}>
            <Boton onClick={() => setNota(true)}><RotateCcw size={16} />Devolución o rebaja</Boton>
            <Boton v="pri" onClick={() => setForm(true)}><Plus size={17} />Registrar {compra ? "compra" : "venta"}</Boton>
          </Permiso>
        </Titulo>
        <Tarjeta className="overflow-hidden">
          <div className="p-4 sm:px-5 border-b border-borde flex flex-wrap gap-3 items-center">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por documento o nombre" aria-label="Buscar"
              className="flex-1 min-w-[220px] h-10 px-4 rounded-full border border-bordef bg-fondo outline-none focus:border-texto2 placeholder:text-texto3" />
            <span className="text-sm text-texto2">Octubre 2026</span>
            <BotonExportar nombre={compra ? "Compras" : "Ventas"} formatos={["PDF", "Excel"]} />
          </div>
          <TablaCifras<(typeof filas)[number]> clave={(f) => f.id} filas={lista} vacio="Ningún documento coincide con la búsqueda." totales="Total del mes"
            tarjeta={(f) => ({ meta: `${f.fecha} · ${f.doc}`, estado: <Etiqueta t={f.estado === "Borrador" ? "borrador" : "contab"}>{f.estado}</Etiqueta>, titulo: f.tercero, valor: dinero(f.total), detalle: f.concepto })}
            cols={[
              { clave: "f", titulo: "Fecha", ver: (f) => <span className="cifra whitespace-nowrap">{f.fecha}</span> },
              { clave: "d", titulo: "Documento", ver: (f) => <span className="cifra whitespace-nowrap">{f.doc}</span> },
              { clave: "t", titulo: compra ? "Proveedor" : "Cliente", ver: (f) => <span className="block max-w-[280px] truncate">{f.tercero}</span> },
              { clave: "c", titulo: "Concepto", ver: (f) => <span className="block max-w-[220px] truncate text-texto2">{f.concepto}</span> },
              { clave: "e", titulo: "Partida", ver: (f) => <Etiqueta t={f.estado === "Borrador" ? "borrador" : "contab"}>{f.estado}</Etiqueta> },
              { clave: "tt", titulo: "Total", tipo: "num", total: suma(lista.map((f) => f.total)), ver: (f) => <Cifra v={f.total} /> },
            ]} />
        </Tarjeta>
      </Pagina>

      <Dialogo lateral abierto={form} onCerrar={() => setForm(false)} titulo={compra ? "Registrar compra" : "Registrar venta"}
        sub={compra ? "Los datos del CCF o la factura del proveedor son obligatorios." : "El costo de ventas sale del kardex."}
        pie={<><Boton v="fan" onClick={() => setForm(false)}>Cancelar</Boton><Boton v="pri" disabled={!ok} onClick={() => { setForm(false); avisar(`${compra ? "Compra" : "Venta"} registrada · partida en borrador`); }}>Guardar y generar partida</Boton></>}>
        <div className="grid grid-cols-2 gap-3">
          <Campo label="Tipo de documento"><Selector value={tipoDoc} onChange={(e) => setTipoDoc(e.target.value)}>{(compra ? ["CCF", "Factura", "Sujeto excluido"] : ["CCF", "Factura de consumidor final", "Exportación"]).map((t) => <option key={t}>{t}</option>)}</Selector></Campo>
          <Campo label="Número del documento" error={eDoc || undefined}><Entrada value={doc} onChange={(e) => setDoc(e.target.value.toUpperCase())} mal={!!eDoc} placeholder={compra ? "CCF-P001" : "CCF-0009"} className="cifra" /></Campo>
        </div>
        <Campo label={compra ? "Proveedor" : "Cliente"}><Selector value={tercero} onChange={(e) => setTercero(e.target.value)}>{terceros.map((t) => <option key={t}>{t}</option>)}</Selector></Campo>
        <div className="grid grid-cols-2 gap-3">
          <Campo label="Fecha"><Entrada value={fecha} onChange={(e) => setFecha(e.target.value)} className="cifra" /></Campo>
          {compra && <Campo label="Destino"><Selector value={destino} onChange={(e) => setDestino(e.target.value)}>{Object.keys(cuentaGasto).map((t) => <option key={t}>{t}</option>)}</Selector></Campo>}
        </div>
        {usaProductos ? (
          <div className="grid gap-2">
            <b className="text-sm font-semibold">Productos</b>
            {lineas.map((l, i) => (
              <div key={i} className="grid grid-cols-[minmax(0,1fr)_64px_90px_36px] gap-2 items-center">
                <Selector value={l.producto} aria-label="Producto" onChange={(e) => { setL(i, "producto", e.target.value); setL(i, "unitario", String(compra ? productoPor(e.target.value).costo : productoPor(e.target.value).precio)); }}>{PRODUCTOS_CASO.map((p) => <option key={p.nombre}>{p.nombre}</option>)}</Selector>
                <Entrada value={l.unidades} aria-label="Unidades" onChange={(e) => setL(i, "unidades", e.target.value)} inputMode="numeric" className="cifra text-right" />
                <Entrada value={l.unitario} aria-label="Precio unitario" onChange={(e) => setL(i, "unitario", e.target.value)} inputMode="decimal" className="cifra text-right" />
                <button type="button" aria-label="Quitar producto" disabled={lineas.length === 1} onClick={() => setLineas(lineas.filter((_, j) => j !== i))} className="w-9 h-9 rounded-full grid place-items-center text-texto3 hover:text-texto disabled:opacity-30"><Trash2 size={16} /></button>
              </div>
            ))}
            <button type="button" onClick={() => setLineas([...lineas, { producto: PRODUCTOS_CASO[1].nombre, unidades: "1", unitario: String(compra ? PRODUCTOS_CASO[1].costo : PRODUCTOS_CASO[1].precio) }])} className="justify-self-start text-sm font-semibold text-texto2 hover:text-texto inline-flex items-center gap-1.5"><Plus size={15} />Agregar producto</button>
          </div>
        ) : (
          <Campo label="Valor gravado (US$)"><Entrada value={base} onChange={(e) => setBase(e.target.value)} inputMode="decimal" className="cifra" placeholder="0.00" /></Campo>
        )}
        <div>
          <p className="text-sm font-semibold mb-2">Pago</p>
          <Segmento valor={cond} onChange={setCond} opciones={[{ v: "contado", t: "Al contado" }, { v: "credito", t: "Al crédito" }]} />
          {cond === "contado" && <Selector value={medio} onChange={(e) => setMedio(e.target.value)} className="mt-3" aria-label="Medio de pago">{["Banco Agrícola", "Caja general"].map((m) => <option key={m}>{m}</option>)}</Selector>}
          {cond === "credito" && <p className="text-xs text-texto2 mt-2">Queda en {compra ? "cuentas por pagar" : "cuentas por cobrar"} y se abona en Cobros y pagos.</p>}
        </div>
        <div className="grid grid-cols-3 gap-3 text-sm">
          {[["Subtotal", baseCalc], ["IVA 13 %", iva], ["Total", total]].map(([k, v]) => <div key={k as string} className="bg-fondo rounded-2xl p-3"><span className="text-texto2 text-xs">{k}</span><b className="cifra block text-base mt-0.5">{dinero(v as number)}</b></div>)}
        </div>
        <VistaPartida lineas={lineasPartida} />
        {!compra && <p className="text-xs text-texto3">Incluye el costo de ventas por US$ {dinero(costoVenta)} según el kardex ({"costo promedio"}).</p>}
      </Dialogo>

      <Dialogo lateral abierto={nota} onCerrar={() => setNota(false)} titulo="Devolución o rebaja" sub="Se registra con una nota de crédito o de débito y genera su partida."
        pie={<><Boton v="fan" onClick={() => setNota(false)}>Cancelar</Boton><Boton v="pri" disabled={nB <= 0} onClick={() => { setNota(false); avisar(`${ntipo} registrada · partida en borrador`); }}>Registrar</Boton></>}>
        <Campo label="Documento de origen"><Selector value={nd} onChange={(e) => setNd(e.target.value)}>{filas.map((f) => <option key={f.id} value={f.id}>{f.doc} · {f.tercero}</option>)}</Selector></Campo>
        <p className="text-xs text-texto2 -mt-2">Total del documento: US$ {dinero(fnd.total)}</p>
        <Segmento valor={ntipo} onChange={setNtipo} opciones={[{ v: "Devolución", t: "Devolución" }, { v: "Rebaja", t: "Rebaja" }]} />
        <Campo label="Valor gravado (US$)" error={nB * 1.13 > fnd.total + 0.005 ? "No puede superar el total del documento." : undefined}><Entrada value={nbase} onChange={(e) => setNbase(e.target.value)} inputMode="decimal" className="cifra" /></Campo>
        <VistaPartida lineas={lineasNota} />
      </Dialogo>
    </Marco>
  );
}
export const Compras = () => <Registro modo="compra" />;
export const Ventas = () => <Registro modo="venta" />;

/* ============================= HU-62 · HU-63 Cobros, pagos y antigüedad ============================= */
export function CobrosPagos() {
  const { avisar } = useApp();
  const [tab, setTab] = useState<"cobrar" | "pagar" | "antig">("cobrar");
  const [lado, setLado] = useState<"cobrar" | "pagar">("cobrar");
  const [sel, setSel] = useState<Record<string, boolean>>({});
  const [abono, setAbono] = useState(false);
  const [monto, setMonto] = useState("");
  const [medio, setMedio] = useState("Banco Agrícola");
  const fuente = tab === "pagar" ? POR_PAGAR : POR_COBRAR;
  const elegidos = fuente.filter((d) => sel[d.id]);
  const saldoSel = suma(elegidos.map(saldoDoc));
  const montoN = Math.min(num(monto), saldoSel);

  const abrir = () => { setMonto(String(saldoSel)); setAbono(true); };
  /* reparte el abono de lo más antiguo a lo más nuevo */
  const reparto = (() => { let r = montoN; return elegidos.map((d) => { const a = Math.min(saldoDoc(d), r); r = redondear(r - a); return { d, a }; }); })();
  const esCobro = tab === "cobrar";
  const partida: Linea[] = esCobro
    ? [{ c: medio.startsWith("Caja") ? "110101" : "11010301", n: medio, d: montoN, h: 0 }, { c: "1103", n: "Cuentas por Cobrar Comerciales", d: 0, h: montoN }]
    : [{ c: "2102", n: "Cuentas por Pagar Comerciales", d: montoN, h: 0 }, { c: medio.startsWith("Caja") ? "110101" : "11010301", n: medio, d: 0, h: montoN }];

  const Documentos = ({ docs }: { docs: DocSaldo[] }) => (
    <>
      <TablaCifras<DocSaldo> clave={(d) => d.id} filas={docs} totales="Saldo total" vacio="Sin documentos con saldo."
        tarjeta={(d) => ({ meta: `${d.doc} · vence ${d.vence}`, estado: vencido(d) ? <Etiqueta t="desc">Vencido</Etiqueta> : <Etiqueta t="neutra">{rangoDe(d)} días</Etiqueta>, titulo: d.tercero, valor: dinero(saldoDoc(d)) })}
        cols={[
          { clave: "s", titulo: "", ver: (d) => <Casilla checked={!!sel[d.id]} onChange={(v) => setSel({ ...sel, [d.id]: v })} label={`Elegir ${d.doc}`} /> },
          { clave: "t", titulo: tab === "pagar" ? "Proveedor" : "Cliente", ver: (d) => <span className="block max-w-[280px] truncate">{d.tercero}</span> },
          { clave: "d", titulo: "Documento", ver: (d) => <span className="cifra">{d.doc}</span> },
          { clave: "f", titulo: "Fecha", ver: (d) => <span className="cifra">{d.fecha}</span> },
          { clave: "v", titulo: "Vence", ver: (d) => <span className="inline-flex items-center gap-2"><span className="cifra">{d.vence}</span>{vencido(d) && <Etiqueta t="desc">Vencido</Etiqueta>}</span> },
          { clave: "m", titulo: "Monto", tipo: "num", ver: (d) => <Cifra v={d.monto} /> },
          { clave: "a", titulo: "Abonado", tipo: "num", ver: (d) => <Cifra v={d.abonado} /> },
          { clave: "sd", titulo: "Saldo", tipo: "num", total: suma(docs.map(saldoDoc)), ver: (d) => <Cifra v={saldoDoc(d)} className="font-semibold" /> },
        ]} />
      <Permiso roles={ESCRIBE}>
        <div className="px-5 py-4 border-t border-borde flex items-center gap-3 flex-wrap">
          <span className="text-sm text-texto2">{elegidos.length ? `${elegidos.length} documento(s) · saldo US$ ${dinero(saldoSel)}` : "Elige uno o varios documentos para abonar."}</span>
          <div className="flex-1" />
          <Boton v="pri" disabled={!elegidos.length} onClick={abrir}>{esCobro ? "Registrar cobro" : "Registrar pago"}</Boton>
        </div>
      </Permiso>
    </>
  );

  /* --- antigüedad --- */
  const docsA = lado === "cobrar" ? POR_COBRAR : POR_PAGAR;
  const terceros = [...new Set(docsA.map((d) => d.tercero))];
  const celda = (t: string, r: Rango) => suma(docsA.filter((d) => d.tercero === t && rangoDe(d) === r).map(saldoDoc));
  type FilaA = { t: string };
  const totalR = (r: Rango) => suma(docsA.filter((d) => rangoDe(d) === r).map(saldoDoc));
  const totalGen = suma(docsA.map(saldoDoc));

  return (
    <Marco ruta={[{ t: "Comercial" }, { t: "Cobros y pagos" }]}>
      <Pagina>
        <Titulo t="Cobros, pagos y antigüedad" sub="Saldos de clientes y proveedores al 31/10/2026 · datos ilustrativos: en el caso oficial todo se paga de contado" />
        <Pestanas valor={tab} onChange={(t) => { setTab(t); setSel({}); }} opciones={[{ v: "cobrar", t: "Por cobrar", n: POR_COBRAR.length }, { v: "pagar", t: "Por pagar", n: POR_PAGAR.length }, { v: "antig", t: "Antigüedad de saldos" }]} />
        {tab !== "antig" ? (
          <Tarjeta className="overflow-hidden"><Documentos docs={fuente} /></Tarjeta>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <Segmento valor={lado} onChange={setLado} opciones={[{ v: "cobrar", t: "Clientes" }, { v: "pagar", t: "Proveedores" }]} />
              <div className="flex-1" />
              <BotonExportar nombre="Antigüedad de saldos" formatos={["PDF", "Excel"]} />
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {RANGOS.map((r) => <Tarjeta key={r} className="p-4"><span className="text-xs text-texto2">{r} días</span><b className={cx("cifra block text-xl mt-1 font-semibold", r === "Más de 90" && totalR(r) > 0 && "text-alerta")}>{dinero(totalR(r))}</b></Tarjeta>)}
            </div>
            <Tarjeta className="overflow-hidden">
              <EncabezadoLibro empresa={EMPRESA_OFICIAL} titulo={`Antigüedad de saldos · ${lado === "cobrar" ? "clientes" : "proveedores"}`} periodo="Al 31 de octubre de 2026" sucursal="Todas las sucursales" />
              <TablaCifras<FilaA> clave={(f) => f.t} filas={terceros.map((t) => ({ t }))} totales="Totales"
                tarjeta={(f) => ({ meta: "Saldo total", titulo: f.t, valor: dinero(RANGOS.reduce((s, r) => s + celda(f.t, r), 0)) })}
                cols={[
                  { clave: "t", titulo: lado === "cobrar" ? "Cliente" : "Proveedor", ver: (f) => <span className="block max-w-[300px] truncate">{f.t}</span> },
                  ...RANGOS.map((r) => ({ clave: r, titulo: `${r} días`, tipo: "num" as const, total: totalR(r), ver: (f: FilaA) => <Cifra v={celda(f.t, r)} /> })),
                  { clave: "tot", titulo: "Total", tipo: "num" as const, total: totalGen, ver: (f: FilaA) => <Cifra v={RANGOS.reduce((s, r) => s + celda(f.t, r), 0)} className="font-semibold" /> },
                ]} />
            </Tarjeta>
          </>
        )}
      </Pagina>

      <Dialogo lateral abierto={abono} onCerrar={() => setAbono(false)} titulo={esCobro ? "Registrar cobro" : "Registrar pago"} sub="Abono parcial o total a uno o varios documentos."
        pie={<><Boton v="fan" onClick={() => setAbono(false)}>Cancelar</Boton><Boton v="pri" disabled={montoN <= 0} onClick={() => { setAbono(false); setSel({}); avisar(`${esCobro ? "Cobro" : "Pago"} de US$ ${dinero(montoN)} registrado · partida generada`); }}>Registrar</Boton></>}>
        <Campo label="Monto (US$)" ayuda={`Máximo ${dinero(saldoSel)}, el saldo de lo elegido.`} error={num(monto) > saldoSel ? "El monto supera el saldo; se aplicará solo el saldo." : undefined}>
          <Entrada value={monto} onChange={(e) => setMonto(e.target.value)} inputMode="decimal" className="cifra" />
        </Campo>
        <Campo label={esCobro ? "Se deposita en" : "Se paga con"}><Selector value={medio} onChange={(e) => setMedio(e.target.value)}>{["Banco Agrícola", "Caja general"].map((m) => <option key={m}>{m}</option>)}</Selector></Campo>
        <div className="grid gap-1.5">
          <b className="text-sm font-semibold">Cómo se aplica</b>
          {reparto.map(({ d, a }) => <div key={d.id} className="flex justify-between text-sm"><span className="text-texto2 truncate">{d.doc} · {d.tercero}</span><span className="cifra">{dinero(a)}</span></div>)}
        </div>
        <VistaPartida lineas={partida} borrador={false} />
      </Dialogo>
    </Marco>
  );
}
