import { useMemo, useState } from "react";
import { EMPRESA_OFICIAL, PRODUCTOS_CASO, RESULTADO, BALANCE_OCT } from "../datos/caso";
import { SEMANAS, porCategoria, proyectar, razones, topUtilidad, type Razon } from "../datos/sprint4";
import { Marco } from "../marco/Marco";
import { Aviso, Pagina, Pestanas, Segmento, Selector, Tarjeta, CabTarjeta, Titulo, dinero } from "../ui";
import { Barras, BarrasH, Cascada, Indicador, LineaBanda, Leyenda, TONOS } from "../ui/graficas";
import { BotonExportar, Cifra, EncabezadoLibro, TablaCifras } from "../ui/reportes";

const pct = (n: number) => `${n.toFixed(2)} %`;

/** HU-83: tablero con gráficas por mes y sucursal, con los datos del caso. */
export function Indicadores() {
  const [mes, setMes] = useState("Octubre 2026");
  const [suc, setSuc] = useState("Todas las sucursales");
  const cat = porCategoria();
  const hay = mes === "Octubre 2026" && suc === "Todas las sucursales";
  const cascada = [
    { t: "Ventas netas", v: RESULTADO.ventas, fuerte: true }, { t: "Costo de ventas", v: RESULTADO.costo }, { t: "Utilidad bruta", v: RESULTADO.bruta, fuerte: true },
    { t: "Gastos de venta", v: RESULTADO.venta }, { t: "Gastos de administración", v: RESULTADO.admin }, { t: "Costos financieros", v: RESULTADO.financieros },
    { t: "Utilidad del ejercicio", v: RESULTADO.neta, fuerte: true },
  ];

  return (
    <Marco ruta={[{ t: "General" }, { t: "Tablero con gráficas" }]}>
      <Pagina>
        <Titulo t="Tablero con gráficas" sub="Indicadores del mes por sucursal · caso CheroPhonex">
          <BotonExportar nombre="Tablero" formatos={["PDF"]} />
        </Titulo>
        <Tarjeta className="p-4 grid sm:grid-cols-2 gap-3">
          <label className="grid gap-1.5 text-sm font-semibold">Mes
            <Selector value={mes} onChange={(e) => setMes(e.target.value)} className="h-11">{["Octubre 2026", "Septiembre 2026"].map((m) => <option key={m}>{m}</option>)}</Selector></label>
          <label className="grid gap-1.5 text-sm font-semibold">Sucursal
            <Selector value={suc} onChange={(e) => setSuc(e.target.value)} className="h-11">{["Todas las sucursales", "Casa matriz", "Metrocentro"].map((m) => <option key={m}>{m}</option>)}</Selector></label>
        </Tarjeta>
        {!hay ? <Aviso>{mes !== "Octubre 2026" ? "Septiembre no tiene movimientos: la empresa inició operaciones en octubre." : "El caso oficial no separa las cifras por sucursal; el desglose aparece cuando las partidas llevan sucursal."}</Aviso> : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Indicador t="Ventas netas" v={dinero(RESULTADO.ventas)} sub="US$ · octubre 2026" />
              <Indicador t="Utilidad bruta" v={dinero(RESULTADO.bruta)} sub={`Margen ${pct((RESULTADO.bruta / RESULTADO.ventas) * 100)}`} />
              <Indicador t="Utilidad del ejercicio" v={dinero(RESULTADO.neta)} sub={`Margen neto ${pct((RESULTADO.neta / RESULTADO.ventas) * 100)}`} />
              <Indicador t="Efectivo y equivalentes" v={dinero(BALANCE_OCT.efectivo)} sub="Caja chica y bancos" />
            </div>
            <div className="grid lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-5">
              <Tarjeta className="overflow-hidden">
                <CabTarjeta titulo="Ventas por semana" sub="Contribuyentes y consumidor final, en US$" />
                <div className="p-5 grid gap-3">
                  <Barras apiladas alto={290} datos={SEMANAS.map((s) => ({ e: s.e, v: [s.ccf, s.cf] }))} series={[{ nombre: "Contribuyentes" }, { nombre: "Consumidor final" }]} descripcion="Ventas por semana de octubre, apiladas por tipo de cliente" />
                  <Leyenda items={[{ t: "Contribuyentes (CCF)", tono: TONOS[0] }, { t: "Consumidor final", tono: TONOS[1] }]} />
                </div>
              </Tarjeta>
              <Tarjeta className="overflow-hidden flex flex-col">
                <CabTarjeta titulo="De la venta a la utilidad" sub="Cada barra es un porcentaje de las ventas netas" />
                <div className="p-5 flex-1"><Cascada filas={cascada} base={RESULTADO.ventas} descripcion="Cómo las ventas se convierten en utilidad del ejercicio" /></div>
              </Tarjeta>
            </div>
            <div className="grid lg:grid-cols-2 gap-5">
              <Tarjeta className="overflow-hidden">
                <CabTarjeta titulo="Productos que más utilidad dejan" sub="Utilidad bruta en US$" />
                <div className="p-5"><BarrasH datos={topUtilidad().map((p) => ({ e: p.nombre, v: p.utilidad }))} descripcion="Los ocho productos con mayor utilidad bruta" /></div>
              </Tarjeta>
              <Tarjeta className="overflow-hidden">
                <CabTarjeta titulo="Teléfonos y accesorios" sub="Ventas netas y utilidad por categoría" />
                <div className="p-5 grid gap-4">
                  <Barras datos={cat.map((c) => ({ e: c.t, v: [c.ventas, c.utilidad] }))} series={[{ nombre: "Ventas netas" }, { nombre: "Utilidad bruta", tono: TONOS[2] }]} alto={190} descripcion="Ventas netas y utilidad bruta por categoría" />
                  <Leyenda items={[{ t: "Ventas netas", tono: TONOS[0] }, { t: "Utilidad bruta", tono: TONOS[2] }]} />
                  <p className="text-xs text-texto3">Los teléfonos son {((cat[0].ventas / RESULTADO.ventas) * 100).toFixed(0)} % de las ventas.</p>
                </div>
              </Tarjeta>
            </div>
          </>
        )}
      </Pagina>
    </Marco>
  );
}

/** HU-84 · HU-85: razones financieras y proyección de ventas con rango de confianza. */
export function Razones() {
  const [tab, setTab] = useState<"razones" | "proy">("razones");
  const [meses, setMeses] = useState<"3" | "6">("3");
  const [crec, setCrec] = useState("3");
  const [banda, setBanda] = useState("8");
  const lista = razones();
  const grupos = ["Liquidez", "Endeudamiento", "Rentabilidad", "Actividad"] as const;
  const c = Math.max(Math.min(parseFloat(crec) || 0, 30), -30), b = Math.max(Math.min(parseFloat(banda) || 0, 40), 1);
  const pts = useMemo(() => proyectar(+meses, c, b), [meses, c, b]);
  const margen = RESULTADO.neta / RESULTADO.ventas;
  const fmt = (r: Razon) => (r.unidad === "%" ? pct(r.valor) : r.unidad === "US$" ? `US$ ${dinero(r.valor)}` : `${r.valor.toFixed(2)} ${r.unidad}`);

  return (
    <Marco ruta={[{ t: "Libros y reportes" }, { t: "Razones y proyecciones" }]}>
      <Pagina ancho="max-w-[1100px]">
        <Titulo t="Razones y proyecciones" sub="Liquidez, endeudamiento, rentabilidad y actividad, y proyección de los meses siguientes">
          <BotonExportar nombre="Razones financieras" formatos={["PDF", "Excel"]} />
        </Titulo>
        <Pestanas valor={tab} onChange={setTab} opciones={[{ v: "razones", t: "Razones financieras" }, { v: "proy", t: "Proyecciones" }]} />
        {tab === "razones" ? (
          grupos.map((g) => (
            <Tarjeta key={g} className="overflow-hidden">
              <CabTarjeta titulo={g} sub={g === "Liquidez" ? "Al 31 de octubre de 2026" : undefined} />
              <TablaCifras<Razon> clave={(r) => r.id} filas={lista.filter((r) => r.grupo === g)} totales={false}
                tarjeta={(r) => ({ meta: r.formula, titulo: r.nombre, valor: fmt(r), detalle: r.lectura })}
                cols={[
                  { clave: "n", titulo: "Razón", ver: (r) => <span><b className="font-semibold block">{r.nombre}</b><span className="text-xs text-texto3">{r.formula}</span></span> },
                  { clave: "v", titulo: "Valor", tipo: "num", ver: (r) => <b className="cifra text-base">{fmt(r)}</b> },
                  { clave: "l", titulo: "Cómo leerla", ver: (r) => <span className="block max-w-[340px] text-texto2 text-sm">{r.lectura}</span> },
                ]} />
            </Tarjeta>
          ))
        ) : (
          <>
            <Tarjeta className="p-4 flex flex-wrap items-end gap-4">
              <div className="grid gap-1.5 text-sm font-semibold">Meses a proyectar<Segmento valor={meses} onChange={setMeses} opciones={[{ v: "3", t: "3 meses" }, { v: "6", t: "6 meses" }]} /></div>
              <label className="grid gap-1.5 text-sm font-semibold">Crecimiento mensual (%)<input value={crec} onChange={(e) => setCrec(e.target.value)} inputMode="decimal" className="h-10 w-[130px] px-3 rounded-xl border border-bordef bg-fondo outline-none focus:border-texto2 cifra font-normal" /></label>
              <label className="grid gap-1.5 text-sm font-semibold">Rango de confianza (± %)<input value={banda} onChange={(e) => setBanda(e.target.value)} inputMode="decimal" className="h-10 w-[130px] px-3 rounded-xl border border-bordef bg-fondo outline-none focus:border-texto2 cifra font-normal" /></label>
            </Tarjeta>
            <Aviso>Solo hay un mes de historia, por eso el crecimiento es un supuesto que usted fija y el rango se abre con cada mes. Con más meses el sistema calcula la tendencia por sí solo.</Aviso>
            <Tarjeta className="overflow-hidden">
              <CabTarjeta titulo="Ventas proyectadas" sub="Línea continua: real · línea punteada y banda: proyección" />
              <div className="p-5 grid gap-3">
                <LineaBanda puntos={pts} descripcion="Ventas reales de octubre y proyección de los meses siguientes con su rango" />
                <Leyenda items={[{ t: "Real", tono: TONOS[0] }, { t: "Proyección", tono: TONOS[1] }]} />
              </div>
            </Tarjeta>
            <Tarjeta className="overflow-hidden">
              <EncabezadoLibro empresa={EMPRESA_OFICIAL} titulo="Proyección por mes" periodo={`Crecimiento ${c} % mensual · rango ± ${b} %`} sucursal="Todas las sucursales" nota="Valores en US$" />
              <TablaCifras<(typeof pts)[number]> clave={(p) => p.e} filas={pts} totales={false}
                tarjeta={(p) => ({ meta: p.proy ? "Proyección" : "Real", titulo: p.e, valor: dinero(p.v), detalle: p.lo !== undefined ? `Rango ${dinero(p.lo)} a ${dinero(p.hi!)}` : undefined })}
                cols={[
                  { clave: "e", titulo: "Mes", ver: (p) => <span>{p.e}{!p.proy && <span className="text-xs text-texto3"> · real</span>}</span> },
                  { clave: "lo", titulo: "Mínimo", tipo: "num", ver: (p) => (p.lo !== undefined ? <Cifra v={p.lo} /> : <span className="cifra text-texto3">—</span>) },
                  { clave: "v", titulo: "Ventas esperadas", tipo: "num", ver: (p) => <Cifra v={p.v} className="font-semibold" /> },
                  { clave: "hi", titulo: "Máximo", tipo: "num", ver: (p) => (p.hi !== undefined ? <Cifra v={p.hi} /> : <span className="cifra text-texto3">—</span>) },
                  { clave: "u", titulo: "Utilidad neta esperada", tipo: "num", ver: (p) => <Cifra v={Math.round(p.v * margen * 100) / 100} /> },
                ]} />
            </Tarjeta>
            <p className="text-xs text-texto3">La utilidad neta esperada usa el margen neto de octubre ({pct(margen * 100)}). El inventario de {PRODUCTOS_CASO.length} productos y los gastos fijos no se proyectan por separado.</p>
          </>
        )}
      </Pagina>
    </Marco>
  );
}
