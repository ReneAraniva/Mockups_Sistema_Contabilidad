import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { EMPRESA_OFICIAL, PRODUCTOS_CASO, kardexDe, redondear, suma, type MovKardex, type ProductoCaso } from "../datos/caso";
import { Marco } from "../marco/Marco";
import { Aviso, Boton, Dialogo, Etiqueta, Pagina, Segmento, Selector, Tarjeta, Titulo, dinero } from "../ui";
import { BotonExportar, Cifra, EncabezadoLibro, TablaCifras } from "../ui/reportes";

/** HU-65: kardex con costo promedio y PEPS, por producto, con el resumen del inventario del mes. */
export function Kardex() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("Todas");
  const [metodo, setMetodo] = useState<"promedio" | "peps">("promedio");
  const [suc, setSuc] = useState("Todas las sucursales");
  const [p, setP] = useState<ProductoCaso | null>(null);

  const lista = useMemo(() => PRODUCTOS_CASO.filter((x) => (cat === "Todas" || x.categoria === cat) && x.nombre.toLowerCase().includes(q.toLowerCase())), [q, cat]);
  const tot = (f: (x: ProductoCaso) => number) => suma(lista.map(f));
  const todos = (f: (x: ProductoCaso) => number) => suma(PRODUCTOS_CASO.map(f));
  const margen = (todos((x) => x.utilidad) / todos((x) => x.ventasNetas)) * 100;
  const movs = p ? kardexDe(p) : [];

  return (
    <Marco ruta={[{ t: "Inventario" }, { t: "Kardex" }]}>
      <Pagina>
        <Titulo t="Kardex" sub="Entradas, salidas y saldo en unidades y valores · caso CheroPhonex, octubre de 2026">
          <BotonExportar nombre="Kardex" formatos={["PDF", "Excel"]} />
        </Titulo>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[["Inventario final", todos((x) => x.invFinal)], ["Compras del mes", todos((x) => x.compras)], ["Costo de ventas", todos((x) => x.costoVentas)], ["Utilidad bruta", todos((x) => x.utilidad)]].map(([k, v]) => (
            <Tarjeta key={k as string} className="p-4"><span className="text-xs text-texto2">{k}</span><b className="cifra block text-xl mt-1 font-semibold">{dinero(v as number)}</b></Tarjeta>
          ))}
        </div>
        <Tarjeta className="p-4 flex flex-wrap items-end gap-3">
          <label className="grid gap-1.5 text-sm font-semibold flex-1 min-w-[220px]">Buscar producto
            <span className="relative"><Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-texto3" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nombre del producto" className="w-full h-10 pl-10 pr-3 rounded-full border border-bordef bg-fondo outline-none focus:border-texto2 placeholder:text-texto3 font-normal" /></span>
          </label>
          <label className="grid gap-1.5 text-sm font-semibold">Categoría
            <Selector value={cat} onChange={(e) => setCat(e.target.value)} className="h-10 w-[160px]">{["Todas", "Teléfonos", "Accesorios"].map((c) => <option key={c}>{c}</option>)}</Selector></label>
          <label className="grid gap-1.5 text-sm font-semibold">Sucursal
            <Selector value={suc} onChange={(e) => setSuc(e.target.value)} className="h-10 w-[210px]">{["Todas las sucursales", "Casa matriz", "Metrocentro"].map((c) => <option key={c}>{c}</option>)}</Selector></label>
          <div className="grid gap-1.5 text-sm font-semibold">Método de costeo
            <Segmento valor={metodo} onChange={setMetodo} opciones={[{ v: "promedio", t: "Costo promedio" }, { v: "peps", t: "PEPS" }]} /></div>
        </Tarjeta>
        {metodo === "peps" && <Aviso>En octubre cada producto se compró una sola vez, por eso PEPS y costo promedio dan el mismo costo. Se separan cuando hay compras a precios distintos.</Aviso>}
        <Tarjeta className="overflow-hidden">
          <EncabezadoLibro empresa={EMPRESA_OFICIAL} titulo="Inventario y kardex resumido" periodo="Octubre 2026" sucursal={suc} folio="3" nota={`Margen bruto ${margen.toFixed(2)} %`} />
          <TablaCifras<ProductoCaso> clave={(x) => x.nombre} filas={lista} onFila={setP} vacio="Ningún producto coincide con la búsqueda."
            tarjeta={(x) => ({ meta: `${x.categoria} · ${x.marca}`, estado: x.finales === 0 ? <Etiqueta t="desc">Agotado</Etiqueta> : undefined, titulo: x.nombre, valor: `${x.finales} u.`, detalle: `Costo ${dinero(x.costo)} · inventario final ${dinero(x.invFinal)}` })}
            cols={[
              { clave: "k", titulo: "Categoría", ver: (x) => <span className="text-texto2">{x.categoria}</span> },
              { clave: "n", titulo: "Producto", ver: (x) => <span className="block max-w-[240px] truncate">{x.nombre}</span> },
              { clave: "c", titulo: "Costo unit.", tipo: "num", ver: (x) => <Cifra v={x.costo} /> },
              { clave: "pv", titulo: "Precio venta", tipo: "num", ver: (x) => <Cifra v={x.precio} /> },
              { clave: "co", titulo: "Compradas", tipo: "num", ver: (x) => <span className="cifra">{x.compradas}</span> },
              { clave: "v", titulo: "Vendidas", tipo: "num", ver: (x) => <span className="cifra">{x.vendidas}</span> },
              { clave: "f", titulo: "Finales", tipo: "num", ver: (x) => <span className="cifra inline-flex items-center gap-2">{x.finales === 0 && <Etiqueta t="desc">Agotado</Etiqueta>}{x.finales}</span> },
              { clave: "cm", titulo: "Compras $", tipo: "num", total: tot((x) => x.compras), ver: (x) => <Cifra v={x.compras} /> },
              { clave: "cv", titulo: "Costo de ventas $", tipo: "num", total: tot((x) => x.costoVentas), ver: (x) => <Cifra v={x.costoVentas} /> },
              { clave: "if", titulo: "Inventario final $", tipo: "num", total: tot((x) => x.invFinal), ver: (x) => <Cifra v={x.invFinal} /> },
              { clave: "vn", titulo: "Ventas netas $", tipo: "num", total: tot((x) => x.ventasNetas), ver: (x) => <Cifra v={x.ventasNetas} /> },
              { clave: "ub", titulo: "Utilidad bruta $", tipo: "num", total: tot((x) => x.utilidad), ver: (x) => <Cifra v={x.utilidad} /> },
            ]} />
        </Tarjeta>
      </Pagina>

      <Dialogo abierto={!!p} onCerrar={() => setP(null)} ancho="max-w-[900px]" titulo={p ? `Kardex · ${p.nombre}` : ""}
        sub={p ? `${metodo === "promedio" ? "Costo promedio" : "PEPS"} · ${suc} · octubre 2026` : undefined} pie={<><BotonExportar nombre="Kardex del producto" formatos={["PDF", "Excel"]} /><Boton v="pri" onClick={() => setP(null)}>Cerrar</Boton></>}>
        {p && (
          <div className="rounded-2xl border border-borde overflow-hidden">
            <TablaCifras<MovKardex> clave={(m) => m.fecha + m.doc} filas={movs} totales={false}
              grupos={[{ t: "Movimiento", n: 3 }, { t: "Entradas", n: 1 }, { t: "Salidas", n: 1 }, { t: "Costo", n: 1 }, { t: "Saldo", n: 2 }]}
              cols={[
                { clave: "f", titulo: "Fecha", ver: (m) => <span className="cifra whitespace-nowrap">{m.fecha}</span> },
                { clave: "d", titulo: "Documento", ver: (m) => <span className="cifra">{m.doc}</span> },
                { clave: "t", titulo: "Detalle", ver: (m) => <span className="block max-w-[230px] truncate">{m.detalle}</span> },
                { clave: "e", titulo: "Unidades", tipo: "num", ver: (m) => <span className="cifra">{m.entrada || "—"}</span> },
                { clave: "s", titulo: "Unidades", tipo: "num", ver: (m) => <span className="cifra">{m.salida || "—"}</span> },
                { clave: "c", titulo: "Unitario", tipo: "num", ver: (m) => <Cifra v={m.costo} /> },
                { clave: "su", titulo: "Unidades", tipo: "num", ver: (m) => <span className="cifra">{m.saldoUnid}</span> },
                { clave: "sv", titulo: "Valor", tipo: "num", ver: (m) => <Cifra v={redondear(m.saldoValor)} vacio="0.00" /> },
              ]} />
          </div>
        )}
      </Dialogo>
    </Marco>
  );
}
