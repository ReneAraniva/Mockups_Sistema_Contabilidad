import { useState } from "react";
import { CircleCheck, FilePlus2, Send } from "lucide-react";
import { useApp } from "../contexto";
import {
  EMPRESA_OFICIAL, LIBRO_COMPRAS, LIBRO_CONSUMIDOR, LIBRO_CONTRIBUYENTES, NRC_EMPRESA, calcularPlanilla, liquidacion, redondear, suma,
  type Compra, type VentaCcf, type VentaCf,
} from "../datos/caso";
import { Marco, Permiso } from "../marco/Marco";
import { Aviso, Boton, Campo, Dialogo, Entrada, Etiqueta, Pagina, Pestanas, Selector, Tarjeta, Titulo, cx, dinero } from "../ui";
import { BotonExportar, Cifra, EncabezadoLibro, TablaCifras, VistaPartida } from "../ui/reportes";

const MESES = ["Octubre 2026", "Septiembre 2026"];
const NOTA = `Contribuyente ${EMPRESA_OFICIAL} · NRC ${NRC_EMPRESA}`;

/** Selector de mes para los libros fiscales: solo octubre tiene movimientos en el caso. */
function Mes({ valor, onChange }: { valor: string; onChange: (v: string) => void }) {
  return (
    <Tarjeta className="p-4 flex flex-wrap items-end gap-3">
      <label className="grid gap-1.5 text-sm font-semibold">Mes
        <Selector value={valor} onChange={(e) => onChange(e.target.value)} className="h-10 w-[200px]">{MESES.map((m) => <option key={m}>{m}</option>)}</Selector>
      </label>
      <Aviso className="flex-1 min-w-[260px]">Se llena solo con las compras y ventas registradas. Los documentos se registran en Compras y en Ventas.</Aviso>
    </Tarjeta>
  );
}

/** Detalle de un documento del libro, con la partida que lo contabilizó. */
function DetalleDoc({ abierto, onCerrar, titulo, filas }: { abierto: boolean; onCerrar: () => void; titulo: string; filas: [string, string][] }) {
  return (
    <Dialogo abierto={abierto} onCerrar={onCerrar} titulo={titulo} sub="El libro no se edita a mano: se corrige en el documento de origen." pie={<Boton v="fan" onClick={onCerrar}>Cerrar</Boton>}>
      <dl className="grid gap-2.5">
        {filas.map(([k, v]) => <div key={k} className="flex justify-between gap-4 text-sm border-b border-borde pb-2 last:border-0"><dt className="text-texto2">{k}</dt><dd className="font-semibold text-right">{v}</dd></div>)}
      </dl>
    </Dialogo>
  );
}

/** HU-45 · HU-46 · HU-47: libros de compras y de ventas, con el formato legal. */
export function LibrosIva() {
  const [tab, setTab] = useState<"compras" | "ccf" | "cf">("compras");
  const [mes, setMes] = useState(MESES[0]);
  const [det, setDet] = useState<{ t: string; f: [string, string][] } | null>(null);
  const hay = mes === MESES[0];
  const folio = tab === "compras" ? "5" : tab === "ccf" ? "6" : "7";
  const titulo = tab === "compras" ? "Libro de compras" : tab === "ccf" ? "Libro de ventas a contribuyentes" : "Libro de ventas a consumidor final";
  const C = hay ? LIBRO_COMPRAS : [], V = hay ? LIBRO_CONTRIBUYENTES : [], F = hay ? LIBRO_CONSUMIDOR : [];
  const vacio = "Sin documentos en este mes.";
  const s = <T,>(l: T[], f: (x: T) => number) => (l.length ? suma(l.map(f)) : undefined);

  return (
    <Marco ruta={[{ t: "Tributario" }, { t: "Libros de IVA" }]}>
      <Pagina>
        <Titulo t="Libros de IVA" sub="Compras, ventas a contribuyentes y a consumidor final (Art. 141 del Código Tributario)">
          <BotonExportar nombre={titulo} formatos={["PDF", "Excel"]} />
        </Titulo>
        <Pestanas valor={tab} onChange={setTab} opciones={[{ v: "compras", t: "Compras", n: C.length }, { v: "ccf", t: "Ventas a contribuyentes", n: V.length }, { v: "cf", t: "Ventas a consumidor final", n: F.length }]} />
        <Mes valor={mes} onChange={setMes} />
        <Tarjeta className="overflow-hidden">
          <EncabezadoLibro empresa={EMPRESA_OFICIAL} titulo={titulo} periodo={`Mes: ${mes}`} sucursal="Todas las sucursales" folio={folio} nota={NOTA} />
          {tab === "compras" && (
            <TablaCifras<Compra> clave={(c) => c.doc} filas={C} vacio={vacio}
              onFila={(c) => setDet({ t: `${c.tipo} ${c.doc}`, f: [["Proveedor", c.proveedor], ["NRC", c.nrc], ["Fecha de emisión", c.fecha], ["Concepto", c.concepto], ["Total", `US$ ${dinero(c.total)}`], ["Registrada en", "Compras"]] })}
              tarjeta={(c) => ({ meta: `${c.fecha} · ${c.doc}`, titulo: c.proveedor, valor: dinero(c.total), detalle: c.concepto })}
              cols={[
                { clave: "n", titulo: "N.º", ver: (c) => <span className="cifra text-texto2">{c.n}</span> },
                { clave: "f", titulo: "Fecha", ver: (c) => <span className="cifra whitespace-nowrap">{c.fecha}</span> },
                { clave: "t", titulo: "Tipo", ver: (c) => c.tipo },
                { clave: "d", titulo: "Documento", ver: (c) => <span className="cifra whitespace-nowrap">{c.doc}</span> },
                { clave: "r", titulo: "NRC", ver: (c) => <span className="cifra">{c.nrc}</span> },
                { clave: "p", titulo: "Proveedor", ver: (c) => <span className="block max-w-[240px] truncate">{c.proveedor}</span> },
                { clave: "c", titulo: "Concepto", ver: (c) => <span className="block max-w-[220px] truncate text-texto2">{c.concepto}</span> },
                { clave: "e", titulo: "Exentas", tipo: "num", total: s(C, (c) => c.exentas), ver: (c) => <Cifra v={c.exentas} /> },
                { clave: "g", titulo: "Gravadas internas", tipo: "num", total: s(C, (c) => c.gravadas), ver: (c) => <Cifra v={c.gravadas} /> },
                { clave: "i", titulo: "IVA crédito fiscal", tipo: "num", total: s(C, (c) => c.iva), ver: (c) => <Cifra v={c.iva} /> },
                { clave: "tt", titulo: "Total compras", tipo: "num", total: s(C, (c) => c.total), ver: (c) => <Cifra v={c.total} /> },
              ]} />
          )}
          {tab === "ccf" && (
            <TablaCifras<VentaCcf> clave={(v) => v.doc} filas={V} vacio={vacio}
              onFila={(v) => setDet({ t: `CCF ${v.doc}`, f: [["Cliente", v.cliente], ["NRC", v.nrc], ["Fecha", v.fecha], ["Débito fiscal", `US$ ${dinero(v.iva)}`], ["Total", `US$ ${dinero(v.total)}`], ["Registrado en", "Ventas"]] })}
              tarjeta={(v) => ({ meta: `${v.fecha} · ${v.doc}`, titulo: v.cliente, valor: dinero(v.total), detalle: `Débito fiscal ${dinero(v.iva)}` })}
              cols={[
                { clave: "n", titulo: "N.º", ver: (v) => <span className="cifra text-texto2">{v.n}</span> },
                { clave: "f", titulo: "Fecha", ver: (v) => <span className="cifra whitespace-nowrap">{v.fecha}</span> },
                { clave: "t", titulo: "Tipo", ver: () => "CCF" },
                { clave: "d", titulo: "Documento", ver: (v) => <span className="cifra">{v.doc}</span> },
                { clave: "r", titulo: "NRC del cliente", ver: (v) => <span className="cifra">{v.nrc}</span> },
                { clave: "p", titulo: "Contribuyente", ver: (v) => <span className="block max-w-[260px] truncate">{v.cliente}</span> },
                { clave: "g", titulo: "Ventas gravadas", tipo: "num", total: s(V, (v) => v.gravadas), ver: (v) => <Cifra v={v.gravadas} /> },
                { clave: "i", titulo: "Débito fiscal IVA", tipo: "num", total: s(V, (v) => v.iva), ver: (v) => <Cifra v={v.iva} /> },
                { clave: "re", titulo: "IVA retenido", tipo: "num", total: s(V, (v) => v.retenido), ver: (v) => <Cifra v={v.retenido} /> },
                { clave: "tt", titulo: "Venta total", tipo: "num", total: s(V, (v) => v.total), ver: (v) => <Cifra v={v.total} /> },
              ]} />
          )}
          {tab === "cf" && (
            <TablaCifras<VentaCf> clave={(v) => v.del} filas={F} vacio={vacio}
              onFila={(v) => setDet({ t: `Facturas ${v.del} a ${v.al}`, f: [["Fecha", v.fecha], ["Caja", v.caja], ["Rango de documentos", `${v.del} al ${v.al}`], ["IVA incluido", `US$ ${dinero(v.iva)}`], ["Total ventas", `US$ ${dinero(v.total)}`]] })}
              tarjeta={(v) => ({ meta: `${v.fecha} · ${v.caja}`, titulo: `${v.del} al ${v.al}`, valor: dinero(v.total), detalle: `IVA incluido ${dinero(v.iva)}` })}
              cols={[
                { clave: "n", titulo: "N.º", ver: (v) => <span className="cifra text-texto2">{v.n}</span> },
                { clave: "f", titulo: "Fecha", ver: (v) => <span className="cifra whitespace-nowrap">{v.fecha}</span> },
                { clave: "a", titulo: "Del N.º", ver: (v) => <span className="cifra">{v.del}</span> },
                { clave: "b", titulo: "Al N.º", ver: (v) => <span className="cifra">{v.al}</span> },
                { clave: "c", titulo: "Caja", ver: (v) => v.caja },
                { clave: "g", titulo: "Ventas gravadas", tipo: "num", total: s(F, (v) => v.gravadas), ver: (v) => <Cifra v={v.gravadas} /> },
                { clave: "i", titulo: "IVA incluido", tipo: "num", total: s(F, (v) => v.iva), ver: (v) => <Cifra v={v.iva} /> },
                { clave: "tt", titulo: "Total ventas", tipo: "num", total: s(F, (v) => v.total), ver: (v) => <Cifra v={v.total} /> },
              ]} />
          )}
        </Tarjeta>
      </Pagina>
      <DetalleDoc abierto={!!det} onCerrar={() => setDet(null)} titulo={det?.t ?? ""} filas={det?.f ?? []} />
    </Marco>
  );
}

/* ====================== Declaraciones: F-07, F-14 y retención del 1 % ====================== */
type Fila = { id: string; t: string; v: number; fuerte?: boolean; sub?: boolean };
const Resumen = ({ filas }: { filas: Fila[] }) => (
  <TablaCifras<Fila> clave={(f) => f.id} filas={filas} totales={false} claseFila={(f) => (f.fuerte ? "font-bold bg-tarjeta2/60" : undefined)}
    cols={[
      { clave: "t", titulo: "Concepto", ver: (f) => <span className={cx("block", f.sub && "pl-6 text-texto2")}>{f.t}</span> },
      { clave: "v", titulo: "US$", tipo: "num", ver: (f) => <Cifra v={f.v} vacio="0.00" /> },
    ]} />
);

type Regla = { resultado: string; monto: number; tipo: "retencion" | "percepcion" | "ninguna" };
/** Regla de diseño de HU-50; el umbral y la tasa se configuran en Parámetros. */
function reglaUnoPorCiento(empresa: string, tercero: string, operacion: string, base: number): Regla {
  if (base < 100) return { tipo: "ninguna", monto: 0, resultado: "No se aplica: la base es menor que US$ 100.00." };
  const mi = redondear(base * 0.01);
  if (operacion === "Compra" && empresa === "Gran contribuyente" && tercero !== "Gran contribuyente") return { tipo: "retencion", monto: mi, resultado: "La empresa retiene el 1 % al pagar al proveedor y lo declara en el F-07." };
  if (operacion === "Venta" && tercero === "Gran contribuyente" && empresa !== "Gran contribuyente") return { tipo: "retencion", monto: mi, resultado: "El cliente le retiene el 1 %; se registra como IVA retenido a favor de la empresa." };
  if (operacion === "Venta" && empresa === "Gran contribuyente" && tercero !== "Gran contribuyente") return { tipo: "percepcion", monto: mi, resultado: "La empresa percibe el 1 % sobre la venta y lo traslada a Hacienda." };
  return { tipo: "ninguna", monto: 0, resultado: "No se aplica con esta combinación de clasificaciones." };
}

/** HU-48 · HU-49 · HU-50: liquidación del IVA (F-07), pago a cuenta (F-14) y retención o percepción del 1 %. */
export function Declaraciones() {
  const { avisar } = useApp();
  const [tab, setTab] = useState<"f07" | "f14" | "uno">("f07");
  const [mes, setMes] = useState(MESES[0]);
  const [conf, setConf] = useState<"" | "f07" | "f14">("");
  const [hecha, setHecha] = useState<Record<string, boolean>>({});
  const [presentada, setPresentada] = useState<Record<string, boolean>>({});
  const [calc, setCalc] = useState(false);
  const [emp, setEmp] = useState("Otro contribuyente"), [ter, setTer] = useState("Gran contribuyente"), [op, setOp] = useState("Venta"), [base, setBase] = useState("250.00");
  const hay = mes === MESES[0];
  const L = liquidacion();
  const rentaPlanilla = suma(calcularPlanilla().map((p) => p.renta));
  const regla = reglaUnoPorCiento(emp, ter, op, parseFloat(base) || 0);

  const f07: Fila[] = [
    { id: "a", t: "Débito fiscal · ventas a contribuyentes", v: hay ? L.debitoCcf : 0, sub: true },
    { id: "b", t: "Débito fiscal · ventas a consumidor final", v: hay ? L.debitoCf : 0, sub: true },
    { id: "c", t: "Total débito fiscal", v: hay ? L.debito : 0, fuerte: true },
    { id: "d", t: "(−) Crédito fiscal · libro de compras", v: hay ? L.credito : 0 },
    { id: "e", t: "(−) IVA retenido por clientes (1 %)", v: L.retenido, sub: true },
    { id: "f", t: "(+) IVA percibido (1 %)", v: L.percibido, sub: true },
    { id: "g", t: "(−) Remanente del mes anterior", v: L.remanenteAnterior, sub: true },
    { id: "h", t: "IVA por pagar", v: hay ? L.porPagar : 0, fuerte: true },
    { id: "i", t: "Remanente de crédito fiscal para el mes siguiente", v: hay ? L.remanente : 0 },
  ];
  const f14: Fila[] = [
    { id: "a", t: "Ingresos brutos gravados del mes", v: hay ? L.ingresos : 0 },
    { id: "b", t: "Pago a cuenta del impuesto sobre la renta (1.75 %)", v: hay ? L.pagoCuenta : 0, fuerte: true },
    { id: "c", t: "Retenciones de renta a empleados (de la planilla)", v: hay ? rentaPlanilla : 0, sub: true },
    { id: "d", t: "Retenciones de renta por servicios", v: 0, sub: true },
    { id: "e", t: "Total a enterar con el F-14", v: hay ? redondear(L.pagoCuenta + rentaPlanilla) : 0, fuerte: true },
  ];
  const partidas = {
    f07: [{ c: "2109", n: "IVA Débito Fiscal", d: L.debito, h: 0 }, { c: "1112", n: "Crédito Fiscal IVA", d: 0, h: L.credito }, { c: "2111", n: "Impuestos por Pagar · IVA por pagar", d: 0, h: L.porPagar }],
    f14: [{ c: "1111", n: "Gastos Pagados por Anticipado · Pago a cuenta ISR", d: L.pagoCuenta, h: 0 }, { c: "2111", n: "Impuestos por Pagar · Pago a cuenta ISR", d: 0, h: L.pagoCuenta }],
  };
  const pie = (k: "f07" | "f14") => (
    <div className="px-5 py-4 border-t border-borde flex flex-wrap items-center gap-3">
      {hecha[k] ? <Etiqueta t="contab"><CircleCheck size={13} />Partida generada</Etiqueta> : <Etiqueta t="borrador">Sin partida</Etiqueta>}
      {presentada[k] && <Etiqueta t="neutra">Presentada</Etiqueta>}
      <div className="flex-1" />
      <Permiso roles={["admin", "contador"]}>
        <Boton disabled={!hay || hecha[k]} onClick={() => setConf(k)}><FilePlus2 size={16} />Generar partida de {k === "f07" ? "liquidación" : "pago a cuenta"}</Boton>
        <Boton v="pri" disabled={!hecha[k] || presentada[k]} onClick={() => { setPresentada({ ...presentada, [k]: true }); avisar(`${k === "f07" ? "F-07" : "F-14"} marcado como presentado`); }}><Send size={16} />Marcar como presentada</Boton>
      </Permiso>
    </div>
  );

  return (
    <Marco ruta={[{ t: "Tributario" }, { t: "Declaraciones F-07 y F-14" }]}>
      <Pagina ancho="max-w-[1000px]">
        <Titulo t="Declaraciones F-07 y F-14" sub="Liquidación del IVA, pago a cuenta y retenciones: la información sale de los libros y de la planilla">
          <BotonExportar nombre="Declaración" formatos={["PDF", "Excel"]} />
        </Titulo>
        <Pestanas valor={tab} onChange={setTab} opciones={[{ v: "f07", t: "F-07 · IVA" }, { v: "f14", t: "F-14 · Renta" }, { v: "uno", t: "Retención y percepción 1 %" }]} />
        {tab !== "uno" && <Mes valor={mes} onChange={setMes} />}

        {tab === "f07" && (
          <>
            {hay && L.remanente === 0 && L.porPagar > 0 && <Aviso>El mes cierra con IVA por pagar de US$ {dinero(L.porPagar)}. No queda remanente para noviembre.</Aviso>}
            <Tarjeta className="overflow-hidden">
              <EncabezadoLibro empresa={EMPRESA_OFICIAL} titulo="Liquidación del IVA · F-07" periodo={`Mes: ${mes}`} sucursal="Todas las sucursales" nota={NOTA} folio="32" />
              <Resumen filas={f07} />
              {pie("f07")}
            </Tarjeta>
          </>
        )}
        {tab === "f14" && (
          <Tarjeta className="overflow-hidden">
            <EncabezadoLibro empresa={EMPRESA_OFICIAL} titulo="Pago a cuenta y retenciones · F-14" periodo={`Mes: ${mes}`} sucursal="Todas las sucursales" nota={NOTA} />
            <Resumen filas={f14} />
            {pie("f14")}
          </Tarjeta>
        )}
        {tab === "uno" && (
          <>
            <Tarjeta className="overflow-hidden">
              <div className="px-5 py-4 border-b border-borde flex items-center justify-between gap-3 flex-wrap">
                <div><h2 className="text-base font-semibold">Retenciones y percepciones del mes</h2><p className="text-xs text-texto2 mt-0.5">Se reflejan en los libros de IVA y en la liquidación del F-07.</p></div>
                <Permiso roles={["admin", "contador"]}><Boton onClick={() => setCalc(true)}>Probar una operación</Boton></Permiso>
              </div>
              <TablaCifras<never> clave={() => ""} filas={[]} vacio="Octubre 2026 no tiene retenciones ni percepciones: ningún cliente ni proveedor es gran contribuyente." cols={[{ clave: "x", titulo: "Documento", ver: () => null }]} />
            </Tarjeta>
            <Aviso>La retención o percepción se aplica según la clasificación de la empresa y del cliente o proveedor (Clientes y proveedores), con un monto mínimo de US$ 100.00. La tasa y el mínimo se configuran en Parámetros.</Aviso>
          </>
        )}
      </Pagina>

      <Dialogo abierto={!!conf} onCerrar={() => setConf("")} ancho="max-w-[640px]" titulo={conf === "f07" ? "Generar la partida de liquidación" : "Generar la partida del pago a cuenta"}
        sub={`Se crea en ${mes} como partida de ajuste, ya contabilizada. Revísala antes de confirmar.`}
        pie={<><Boton v="fan" onClick={() => setConf("")}>Cancelar</Boton><Boton v="pri" onClick={() => { setHecha({ ...hecha, [conf]: true }); avisar("Partida generada y contabilizada"); setConf(""); }}>Confirmar y contabilizar</Boton></>}>
        {conf && <VistaPartida lineas={partidas[conf]} borrador={false} />}
      </Dialogo>

      <Dialogo abierto={calc} onCerrar={() => setCalc(false)} titulo="Probar una operación" sub="Muestra si aplica el 1 % y qué hace el sistema; no registra nada."
        pie={<Boton v="pri" onClick={() => setCalc(false)}>Listo</Boton>}>
        <div className="grid grid-cols-2 gap-3">
          <Campo label="Clasificación de la empresa"><Selector value={emp} onChange={(e) => setEmp(e.target.value)}>{["Gran contribuyente", "Mediano contribuyente", "Otro contribuyente"].map((c) => <option key={c}>{c}</option>)}</Selector></Campo>
          <Campo label="Clasificación del tercero"><Selector value={ter} onChange={(e) => setTer(e.target.value)}>{["Gran contribuyente", "Mediano contribuyente", "Otro contribuyente"].map((c) => <option key={c}>{c}</option>)}</Selector></Campo>
          <Campo label="Operación"><Selector value={op} onChange={(e) => setOp(e.target.value)}><option>Venta</option><option>Compra</option></Selector></Campo>
          <Campo label="Base gravada (US$)"><Entrada value={base} onChange={(e) => setBase(e.target.value)} inputMode="decimal" className="cifra" /></Campo>
        </div>
        <Aviso>
          <b className="font-semibold">{regla.tipo === "retencion" ? "Retención del 1 %" : regla.tipo === "percepcion" ? "Percepción del 1 %" : "Sin retención ni percepción"}</b>
          {regla.tipo !== "ninguna" && <> · US$ {dinero(regla.monto)}</>}
          <br />{regla.resultado}
        </Aviso>
      </Dialogo>
    </Marco>
  );
}
