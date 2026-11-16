import { useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Lock, Plus, Search, Upload } from "lucide-react";
import { useApp } from "../contexto";
import {
  ACTIVOS, CATEGORIAS, EMPLEADOS, PRODUCTOS, TASAS, TERCEROS, TESORERIA,
  type ActivoFijo, type Clasificacion, type Empleado, type Producto, type Tercero,
} from "../datos/ejemplo";
import { enDinero, mayorDe } from "../datos/libros";
import { Marco, Permiso } from "../marco/Marco";
import { Aviso, Boton, Campo, Dialogo, Entrada, Etiqueta, Pagina, Pestanas, Selector, Tarjeta, Titulo, cx, dinero } from "../ui";
import { Cifra, TablaCifras } from "../ui/reportes";
import type { Rol } from "../datos/navegacion";

const ESCRIBE: Rol[] = ["admin", "contador", "auxiliar"];
const SUCURSALES = ["Casa matriz", "Metrocentro"];
const reNIT = /^\d{4}-\d{6}-\d{3}-\d$/, reNRC = /^\d{1,7}-\d$/, reDUI = /^\d{8}-\d$/;
const num = (v: string) => parseFloat(v.replace(/,/g, ""));

/** Panel lateral de alta o edición; "Guardar" se habilita cuando no quedan errores. */
function Formulario({ abierto, onCerrar, titulo, sub, ok, onGuardar, children }: { abierto: boolean; onCerrar: () => void; titulo: string; sub?: string; ok: boolean; onGuardar: () => void; children: ReactNode }) {
  return (
    <Dialogo lateral abierto={abierto} onCerrar={onCerrar} titulo={titulo} sub={sub}
      pie={<><Boton v="fan" onClick={onCerrar}>Cancelar</Boton><Boton v="pri" disabled={!ok} onClick={onGuardar}>Guardar</Boton></>}>{children}</Dialogo>
  );
}
function Buscador({ q, setQ, ph }: { q: string; setQ: (v: string) => void; ph: string }) {
  return (
    <div className="relative flex-1 min-w-[220px]">
      <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-texto3" />
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={ph} aria-label={ph}
        className="w-full h-10 pl-10 pr-3 rounded-full border border-bordef bg-fondo outline-none focus:border-texto2 placeholder:text-texto3" />
    </div>
  );
}
const coincide = (q: string, ...campos: string[]) => campos.join(" ").toLowerCase().includes(q.toLowerCase());
/** Texto en una celda con tope, para que la tabla no se ensanche. */
const Corto = ({ children }: { children: ReactNode }) => <span className="block max-w-[260px] truncate">{children}</span>;

/* ======================= HU-58 Clientes y proveedores ======================= */
export function Terceros() {
  const { avisar } = useApp();
  const [tab, setTab] = useState<"Cliente" | "Proveedor">("Cliente");
  const [q, setQ] = useState("");
  const [form, setForm] = useState<(Tercero & { nuevo?: boolean }) | null>(null);
  const lista = TERCEROS.filter((t) => t.tipo === tab && coincide(q, t.nombre, t.nit, t.nrc));
  const f = form;
  const eNit = f && f.nit && !reNIT.test(f.nit) ? "Formato 0000-000000-000-0 (14 dígitos)." : "";
  const eNrc = f && f.nrc && !reNRC.test(f.nrc) ? "Formato 123456-7." : "";
  const ok = !!f && f.nombre.trim().length > 2 && reNIT.test(f.nit) && reNRC.test(f.nrc) && f.actividad.trim().length > 2;
  const set = (k: keyof Tercero, v: string) => setForm({ ...f!, [k]: v });

  return (
    <Marco ruta={[{ t: "Comercial" }, { t: "Clientes y proveedores" }]}>
      <Pagina>
        <Titulo t="Clientes y proveedores" sub="Los usan las compras, las ventas y los libros de IVA">
          <Permiso roles={["admin", "contador"]}><Link to="/importar" className="h-11 px-5 rounded-full border border-bordef font-semibold inline-flex items-center justify-center gap-2 hover:bg-tarjeta2"><Upload size={16} />Importar desde Excel</Link></Permiso>
          <Permiso roles={ESCRIBE}><Boton v="pri" onClick={() => setForm({ id: "", tipo: tab, nombre: "", nit: "", nrc: "", actividad: "", clase: "Otro contribuyente", nuevo: true })}><Plus size={17} />Nuevo {tab.toLowerCase()}</Boton></Permiso>
        </Titulo>
        <Tarjeta className="overflow-hidden">
          <div className="px-3 sm:px-5"><Pestanas valor={tab} onChange={setTab} opciones={[{ v: "Cliente", t: "Clientes", n: TERCEROS.filter((t) => t.tipo === "Cliente").length }, { v: "Proveedor", t: "Proveedores", n: TERCEROS.filter((t) => t.tipo === "Proveedor").length }]} /></div>
          <div className="p-4 sm:px-5 border-b border-borde flex"><Buscador q={q} setQ={setQ} ph="Buscar por nombre, NIT o NRC" /></div>
          <TablaCifras<Tercero> clave={(t) => t.id} filas={lista} vacio="Ningún registro coincide con la búsqueda." onFila={(t) => setForm({ ...t })}
            tarjeta={(t) => ({ meta: `NIT ${t.nit}`, estado: <Etiqueta t={t.clase === "Gran contribuyente" ? "contab" : "neutra"}>{t.clase}</Etiqueta>, titulo: t.nombre, detalle: `NRC ${t.nrc} · ${t.actividad}` })}
            cols={[
              { clave: "n", titulo: "Nombre", ver: (t) => <Corto>{t.nombre}</Corto> },
              { clave: "nit", titulo: "NIT", ver: (t) => <span className="cifra whitespace-nowrap">{t.nit}</span> },
              { clave: "nrc", titulo: "NRC", ver: (t) => <span className="cifra">{t.nrc}</span> },
              { clave: "a", titulo: "Actividad económica", ver: (t) => <Corto>{t.actividad}</Corto> },
              { clave: "c", titulo: "Clasificación", ver: (t) => <Etiqueta t={t.clase === "Gran contribuyente" ? "contab" : "neutra"}>{t.clase}</Etiqueta> },
            ]} />
        </Tarjeta>
      </Pagina>
      <Formulario abierto={!!f} onCerrar={() => setForm(null)} titulo={f?.nuevo ? `Nuevo ${f.tipo.toLowerCase()}` : `Editar ${f?.tipo.toLowerCase()}`} sub="El NIT y el NRC se validan al escribir." ok={ok}
        onGuardar={() => { avisar(`${f!.tipo} guardado`); setForm(null); }}>
        {f && <>
          <Campo label="Nombre o razón social"><Entrada value={f.nombre} onChange={(e) => set("nombre", e.target.value)} /></Campo>
          <div className="grid grid-cols-2 gap-3">
            <Campo label="NIT" error={eNit || undefined}><Entrada value={f.nit} onChange={(e) => set("nit", e.target.value)} mal={!!eNit} placeholder="0614-150392-101-3" className="cifra" /></Campo>
            <Campo label="NRC" error={eNrc || undefined}><Entrada value={f.nrc} onChange={(e) => set("nrc", e.target.value)} mal={!!eNrc} placeholder="245871-4" className="cifra" /></Campo>
          </div>
          <Campo label="Actividad económica"><Entrada value={f.actividad} onChange={(e) => set("actividad", e.target.value)} /></Campo>
          <Campo label="Clasificación" ayuda="Determina si se le retiene el IVA.">
            <Selector value={f.clase} onChange={(e) => set("clase", e.target.value as Clasificacion)}>{["Gran contribuyente", "Mediano contribuyente", "Otro contribuyente"].map((c) => <option key={c}>{c}</option>)}</Selector>
          </Campo>
        </>}
      </Formulario>
    </Marco>
  );
}

/* ======================= HU-64 Productos y categorías ======================= */
export function Productos() {
  const { avisar } = useApp();
  const [tab, setTab] = useState<"productos" | "categorias">("productos");
  const [q, setQ] = useState("");
  const [form, setForm] = useState<(Producto & { nuevo?: boolean }) | null>(null);
  const [cat, setCat] = useState<string | null>(null);
  const [nombreCat, setNombreCat] = useState("");
  const lista = PRODUCTOS.filter((p) => coincide(q, p.codigo, p.nombre, p.categoria));
  const f = form;
  const ok = !!f && /^[A-Z]{3}-\d{3}$/.test(f.codigo) && f.nombre.trim().length > 2 && f.minimo >= 0;
  const set = (k: keyof Producto, v: string | number) => setForm({ ...f!, [k]: v } as Producto);

  return (
    <Marco ruta={[{ t: "Inventario" }, { t: "Productos" }]}>
      <Pagina>
        <Titulo t="Productos y categorías" sub="Código, categoría, existencia mínima y método de valuación">
          <Permiso roles={["admin", "contador"]}><Link to="/importar" className="h-11 px-5 rounded-full border border-bordef font-semibold inline-flex items-center justify-center gap-2 hover:bg-tarjeta2"><Upload size={16} />Importar desde Excel</Link></Permiso>
          <Permiso roles={ESCRIBE}>{tab === "productos"
            ? <Boton v="pri" onClick={() => setForm({ id: "", codigo: "", nombre: "", categoria: CATEGORIAS[0], unidad: "Unidad", minimo: 0, metodo: "Costo promedio", existencia: 0, movimientos: false, nuevo: true })}><Plus size={17} />Nuevo producto</Boton>
            : <Boton v="pri" onClick={() => { setCat(""); setNombreCat(""); }}><Plus size={17} />Nueva categoría</Boton>}</Permiso>
        </Titulo>
        <Tarjeta className="overflow-hidden">
          <div className="px-3 sm:px-5"><Pestanas valor={tab} onChange={setTab} opciones={[{ v: "productos", t: "Productos", n: PRODUCTOS.length }, { v: "categorias", t: "Categorías", n: CATEGORIAS.length }]} /></div>
          {tab === "productos" ? (
            <>
              <div className="p-4 sm:px-5 border-b border-borde flex"><Buscador q={q} setQ={setQ} ph="Buscar por código, nombre o categoría" /></div>
              <TablaCifras<Producto> clave={(p) => p.id} filas={lista} totales={false} onFila={(p) => setForm({ ...p })} vacio="Ningún producto coincide con la búsqueda."
                tarjeta={(p) => ({ meta: `${p.codigo} · ${p.categoria}`, estado: p.existencia < p.minimo ? <Etiqueta t="desc">Bajo mínimo</Etiqueta> : undefined, titulo: p.nombre, valor: `${p.existencia} en existencia`, detalle: `Mínimo ${p.minimo} · ${p.metodo}${p.movimientos ? " · método bloqueado" : ""}` })}
                cols={[
                  { clave: "c", titulo: "Código", ver: (p) => <span className="cifra text-texto2">{p.codigo}</span> },
                  { clave: "n", titulo: "Producto", ver: (p) => <Corto>{p.nombre}</Corto> },
                  { clave: "k", titulo: "Categoría", ver: (p) => p.categoria },
                  { clave: "m", titulo: "Método", ver: (p) => <span className="inline-flex items-center gap-1.5">{p.metodo}{p.movimientos && <Lock size={12} className="text-texto3" aria-label="Bloqueado por movimientos" />}</span> },
                  { clave: "min", titulo: "Mínimo", tipo: "num", ver: (p) => <span className="cifra">{p.minimo}</span> },
                  { clave: "e", titulo: "Existencia", tipo: "num", ver: (p) => <span className={cx("cifra inline-flex items-center gap-2", p.existencia < p.minimo && "text-alerta font-semibold")}>{p.existencia < p.minimo && <Etiqueta t="desc">Bajo mínimo</Etiqueta>}{p.existencia}</span> },
                ]} />
            </>
          ) : (
            <TablaCifras<string> clave={(c) => c} filas={CATEGORIAS} totales={false} onFila={(c) => { setCat(c); setNombreCat(c); }}
              tarjeta={(c) => ({ meta: "Categoría", titulo: c, valor: `${PRODUCTOS.filter((p) => p.categoria === c).length} productos` })}
              cols={[{ clave: "c", titulo: "Categoría", ver: (c) => c }, { clave: "n", titulo: "Productos", tipo: "num", ver: (c) => <span className="cifra">{PRODUCTOS.filter((p) => p.categoria === c).length}</span> }]} />
          )}
        </Tarjeta>
      </Pagina>
      <Formulario abierto={!!f} onCerrar={() => setForm(null)} titulo={f?.nuevo ? "Nuevo producto" : `Editar ${f?.codigo}`} ok={ok} onGuardar={() => { avisar("Producto guardado"); setForm(null); }}>
        {f && <>
          <div className="grid grid-cols-2 gap-3">
            <Campo label="Código" ayuda="Tres letras y tres dígitos" error={f.codigo && !/^[A-Z]{3}-\d{3}$/.test(f.codigo) ? "Ej. TEL-001" : undefined}><Entrada value={f.codigo} onChange={(e) => set("codigo", e.target.value.toUpperCase())} className="cifra" /></Campo>
            <Campo label="Unidad"><Selector value={f.unidad} onChange={(e) => set("unidad", e.target.value)}>{["Unidad", "Caja", "Par", "Juego"].map((u) => <option key={u}>{u}</option>)}</Selector></Campo>
          </div>
          <Campo label="Nombre"><Entrada value={f.nombre} onChange={(e) => set("nombre", e.target.value)} /></Campo>
          <div className="grid grid-cols-2 gap-3">
            <Campo label="Categoría"><Selector value={f.categoria} onChange={(e) => set("categoria", e.target.value)}>{CATEGORIAS.map((c) => <option key={c}>{c}</option>)}</Selector></Campo>
            <Campo label="Existencia mínima"><Entrada value={f.minimo} onChange={(e) => set("minimo", Math.max(0, parseInt(e.target.value) || 0))} inputMode="numeric" className="cifra text-right" /></Campo>
          </div>
          <Campo label="Método de valuación" ayuda={f.movimientos ? "Bloqueado: el producto ya tiene movimientos." : "Se bloquea cuando el producto tenga movimientos."}>
            <Selector value={f.metodo} disabled={f.movimientos} onChange={(e) => set("metodo", e.target.value)}><option>Costo promedio</option><option>PEPS</option></Selector>
          </Campo>
          {f.movimientos && <Aviso><Lock size={14} className="inline mr-1.5 -mt-0.5" />Cambiar el método de un producto con movimientos descuadraría el kardex.</Aviso>}
        </>}
      </Formulario>
      <Dialogo abierto={cat !== null} onCerrar={() => setCat(null)} titulo={cat ? `Editar ${cat}` : "Nueva categoría"}
        pie={<><Boton v="fan" onClick={() => setCat(null)}>Cancelar</Boton><Boton v="pri" disabled={nombreCat.trim().length < 3} onClick={() => { avisar("Categoría guardada"); setCat(null); }}>Guardar</Boton></>}>
        <Campo label="Nombre de la categoría"><Entrada value={nombreCat} onChange={(e) => setNombreCat(e.target.value)} /></Campo>
      </Dialogo>
    </Marco>
  );
}

/* ======================= HU-70 · HU-71 Empleados y tasas ======================= */
export function Empleados() {
  const { avisar, puede } = useApp();
  const [tab, setTab] = useState<"empleados" | "tasas">("empleados");
  const [q, setQ] = useState("");
  const [form, setForm] = useState<(Empleado & { nuevo?: boolean; salarioTxt: string }) | null>(null);
  const [vig, setVig] = useState(false);
  const [fechaVig, setFechaVig] = useState("");
  const t = TASAS[0];
  const lista = EMPLEADOS.filter((e) => coincide(q, e.nombre, e.dui, e.cargo));
  const f = form;
  const eDui = f && f.dui && !reDUI.test(f.dui) ? "Formato 00000000-0." : "";
  const eNit = f && f.nit && !reNIT.test(f.nit) ? "Formato 0000-000000-000-0." : "";
  const sal = f ? num(f.salarioTxt) : NaN;
  const ok = !!f && f.nombre.trim().length > 4 && reDUI.test(f.dui) && reNIT.test(f.nit) && /^\d{6,}$/.test(f.isss) && /^\d{6,}$/.test(f.nup) && sal > 0 && /^\d{2}\/\d{2}\/\d{4}$/.test(f.ingreso);
  const set = (k: string, v: string) => setForm({ ...f!, [k]: v });

  return (
    <Marco ruta={[{ t: "Planilla" }, { t: "Empleados y tasas" }]}>
      <Pagina>
        <Titulo t="Empleados y tasas" sub="Datos para calcular la planilla: ISSS, AFP y retención de renta">
          {tab === "empleados"
            ? <Boton v="pri" onClick={() => setForm({ id: "", nombre: "", dui: "", nit: "", isss: "", nup: "", cargo: "", salario: 0, ingreso: "", suc: SUCURSALES[0], nuevo: true, salarioTxt: "" })}><Plus size={17} />Nuevo empleado</Boton>
            : puede("admin") && <Boton v="pri" onClick={() => { setFechaVig(""); setVig(true); }}><Plus size={17} />Nueva vigencia</Boton>}
        </Titulo>
        <Tarjeta className="overflow-hidden">
          <div className="px-3 sm:px-5"><Pestanas valor={tab} onChange={setTab} opciones={[{ v: "empleados", t: "Empleados", n: EMPLEADOS.length }, { v: "tasas", t: "Tasas y tabla de retención" }]} /></div>
          {tab === "empleados" ? (
            <>
              <div className="p-4 sm:px-5 border-b border-borde flex"><Buscador q={q} setQ={setQ} ph="Buscar por nombre, DUI o cargo" /></div>
              <TablaCifras<Empleado> clave={(e) => e.id} filas={lista} totales={false} onFila={(e) => setForm({ ...e, salarioTxt: dinero(e.salario) })}
                tarjeta={(e) => ({ meta: `${e.cargo} · ${e.suc}`, titulo: e.nombre, valor: dinero(e.salario), detalle: `DUI ${e.dui} · ingreso ${e.ingreso}` })}
                cols={[
                  { clave: "n", titulo: "Empleado", ver: (e) => <Corto>{e.nombre}</Corto> },
                  { clave: "d", titulo: "DUI", ver: (e) => <span className="cifra">{e.dui}</span> },
                  { clave: "c", titulo: "Cargo", ver: (e) => e.cargo },
                  { clave: "s", titulo: "Sucursal", ver: (e) => e.suc },
                  { clave: "i", titulo: "Ingreso", ver: (e) => <span className="cifra">{e.ingreso}</span> },
                  { clave: "sal", titulo: "Salario", tipo: "num", ver: (e) => <Cifra v={e.salario} /> },
                ]} />
            </>
          ) : (
            <div className="p-5 grid gap-5">
              <Aviso>Vigentes desde <b className="font-semibold cifra">{t.desde}</b>. Son valores de muestra del diseño; la carga inicial usa la normativa vigente. Al cambiar la ley se agrega una vigencia nueva y la anterior se conserva.</Aviso>
              <TablaCifras<{ c: string; l: string; p: string; t: string }> clave={(r) => r.c} totales={false}
                filas={[{ c: "ISSS", l: `${t.isssLab}%`, p: `${t.isssPat}%`, t: `US$ ${dinero(t.isssTecho)}` }, { c: "AFP", l: `${t.afpLab}%`, p: `${t.afpPat}%`, t: "Según tabla de la AFP" }]}
                cols={[{ clave: "c", titulo: "Concepto", ver: (r) => r.c }, { clave: "l", titulo: "Laboral", tipo: "num", ver: (r) => <span className="cifra">{r.l}</span> },
                  { clave: "p", titulo: "Patronal", tipo: "num", ver: (r) => <span className="cifra">{r.p}</span> }, { clave: "t", titulo: "Techo salarial", tipo: "num", ver: (r) => <span className="cifra">{r.t}</span> }]} />
              <div>
                <h3 className="font-semibold mb-2">Tabla de retención de renta (mensual)</h3>
                <TablaCifras<(typeof t.tramos)[number]> clave={(r) => String(r.desde)} filas={t.tramos} totales={false}
                  cols={[{ clave: "d", titulo: "Desde", tipo: "num", ver: (r) => <span className="cifra">{dinero(r.desde)}</span> },
                    { clave: "h", titulo: "Hasta", tipo: "num", ver: (r) => <span className="cifra">{r.hasta === null ? "En adelante" : dinero(r.hasta)}</span> },
                    { clave: "p", titulo: "% sobre el exceso", tipo: "num", ver: (r) => <span className="cifra">{r.pct}%</span> },
                    { clave: "c", titulo: "Cuota fija", tipo: "num", ver: (r) => <Cifra v={r.cuota} /> }]} />
              </div>
              {!puede("admin") && <p className="text-xs text-texto3">Solo el administrador puede agregar vigencias.</p>}
            </div>
          )}
        </Tarjeta>
      </Pagina>
      <Formulario abierto={!!f} onCerrar={() => setForm(null)} titulo={f?.nuevo ? "Nuevo empleado" : "Editar empleado"} sub="Los datos de ISSS y AFP se usan en la planilla." ok={ok} onGuardar={() => { avisar("Empleado guardado"); setForm(null); }}>
        {f && <>
          <Campo label="Nombre completo"><Entrada value={f.nombre} onChange={(e) => set("nombre", e.target.value)} /></Campo>
          <div className="grid grid-cols-2 gap-3">
            <Campo label="DUI" error={eDui || undefined}><Entrada value={f.dui} onChange={(e) => set("dui", e.target.value)} mal={!!eDui} placeholder="04512398-7" className="cifra" /></Campo>
            <Campo label="NIT" error={eNit || undefined}><Entrada value={f.nit} onChange={(e) => set("nit", e.target.value)} mal={!!eNit} className="cifra" /></Campo>
            <Campo label="N.º de ISSS"><Entrada value={f.isss} onChange={(e) => set("isss", e.target.value.replace(/\D/g, ""))} inputMode="numeric" className="cifra" /></Campo>
            <Campo label="NUP de AFP"><Entrada value={f.nup} onChange={(e) => set("nup", e.target.value.replace(/\D/g, ""))} inputMode="numeric" className="cifra" /></Campo>
          </div>
          <Campo label="Cargo"><Entrada value={f.cargo} onChange={(e) => set("cargo", e.target.value)} /></Campo>
          <div className="grid grid-cols-2 gap-3">
            <Campo label="Salario mensual (US$)"><Entrada value={f.salarioTxt} onChange={(e) => set("salarioTxt", e.target.value.replace(/[^\d.,]/g, ""))} inputMode="decimal" className="cifra text-right" /></Campo>
            <Campo label="Fecha de ingreso"><Entrada value={f.ingreso} onChange={(e) => set("ingreso", e.target.value)} placeholder="dd/mm/aaaa" className="cifra" /></Campo>
          </div>
          <Campo label="Sucursal"><Selector value={f.suc} onChange={(e) => set("suc", e.target.value)}>{SUCURSALES.map((s) => <option key={s}>{s}</option>)}</Selector></Campo>
        </>}
      </Formulario>
      <Formulario abierto={vig} onCerrar={() => setVig(false)} titulo="Nueva vigencia de tasas" sub="Se aplica desde la fecha indicada; la vigencia anterior se conserva." ok={/^\d{2}\/\d{2}\/\d{4}$/.test(fechaVig)} onGuardar={() => { avisar("Vigencia agregada"); setVig(false); }}>
        <Campo label="Vigente desde" error={fechaVig && !/^\d{2}\/\d{2}\/\d{4}$/.test(fechaVig) ? "Usa dd/mm/aaaa." : undefined}><Entrada value={fechaVig} onChange={(e) => setFechaVig(e.target.value)} placeholder="01/01/2027" className="cifra" /></Campo>
        <div className="grid grid-cols-2 gap-3">
          {([["ISSS laboral %", t.isssLab], ["ISSS patronal %", t.isssPat], ["Techo ISSS (US$)", t.isssTecho], ["AFP laboral %", t.afpLab], ["AFP patronal %", t.afpPat]] as const).map(([l, v]) => (
            <Campo key={l} label={l}><Entrada defaultValue={v} inputMode="decimal" className="cifra text-right" /></Campo>
          ))}
        </div>
        <p className="text-sm font-semibold">Tramos de retención</p>
        {t.tramos.map((r, i) => (
          <div key={i} className="grid grid-cols-4 gap-2">
            {[r.desde, r.hasta ?? "", r.pct, r.cuota].map((v, j) => <Entrada key={j} aria-label={["Desde", "Hasta", "Porcentaje", "Cuota"][j] + ` del tramo ${i + 1}`} defaultValue={v} placeholder={j === 1 ? "En adelante" : ""} inputMode="decimal" className="cifra text-right h-10 px-2" />)}
          </div>
        ))}
        <p className="text-xs text-texto3">Columnas: desde, hasta, % sobre el exceso y cuota fija.</p>
      </Formulario>
    </Marco>
  );
}

/* ======================= HU-76 Caja general y cuentas bancarias ======================= */
export function CajaBancos() {
  const { avisar } = useApp();
  const [form, setForm] = useState<{ tipo: string; nombre: string; cuenta: string; banco: string } | null>(null);
  const filas = useMemo(() => TESORERIA.map((c) => ({ ...c, saldo: enDinero(mayorDe(c.cuenta).movs.length ? mayorDe(c.cuenta).saldo : 0) })), []);
  const total = filas.reduce((t, f) => t + f.saldo, 0);
  const f = form;
  const ok = !!f && f.nombre.trim().length > 3 && /^\d{6,8}$/.test(f.cuenta) && (f.tipo !== "Cuenta bancaria" || f.banco.trim().length > 2);
  return (
    <Marco ruta={[{ t: "Tesorería" }, { t: "Caja y bancos" }]}>
      <Pagina ancho="max-w-[1000px]">
        <Titulo t="Caja y bancos" sub="Cada una vinculada a su cuenta contable; el saldo sale del libro mayor">
          <Permiso roles={["admin", "contador"]}><Boton v="pri" onClick={() => setForm({ tipo: "Cuenta bancaria", nombre: "", cuenta: "", banco: "" })}><Plus size={17} />Nueva cuenta</Boton></Permiso>
        </Titulo>
        <Tarjeta className="overflow-hidden">
          <TablaCifras<(typeof filas)[number]> clave={(c) => c.id} filas={filas} totales="Efectivo total"
            tarjeta={(c) => ({ meta: `${c.cuenta}${c.numero ? " · " + c.numero : ""}`, estado: <Etiqueta t="neutra">{c.tipo}</Etiqueta>, titulo: c.nombre, valor: dinero(c.saldo) })}
            cols={[
              { clave: "t", titulo: "Tipo", ver: (c) => <Etiqueta t="neutra">{c.tipo}</Etiqueta> },
              { clave: "n", titulo: "Nombre", ver: (c) => <><Corto>{c.nombre}</Corto>{c.numero && <span className="text-xs text-texto3 cifra">{c.numero}</span>}</> },
              { clave: "c", titulo: "Cuenta contable", ver: (c) => <span className="cifra text-texto2">{c.cuenta}</span> },
              { clave: "s", titulo: "Saldo actual", tipo: "num", ver: (c) => <Cifra v={c.saldo} vacio="0.00" />, total },
            ]} />
        </Tarjeta>
        <p className="text-xs text-texto3">Saldos del caso CheroPhonex al 16/11/2026 (cifras ilustrativas).</p>
      </Pagina>
      <Formulario abierto={!!f} onCerrar={() => setForm(null)} titulo="Nueva caja o cuenta bancaria" ok={ok} onGuardar={() => { avisar("Cuenta registrada"); setForm(null); }}>
        {f && <>
          <Campo label="Tipo"><Selector value={f.tipo} onChange={(e) => setForm({ ...f, tipo: e.target.value })}><option>Cuenta bancaria</option><option>Caja general</option><option>Caja chica</option></Selector></Campo>
          <Campo label="Nombre"><Entrada value={f.nombre} onChange={(e) => setForm({ ...f, nombre: e.target.value })} /></Campo>
          {f.tipo === "Cuenta bancaria" && <Campo label="Banco"><Entrada value={f.banco} onChange={(e) => setForm({ ...f, banco: e.target.value })} /></Campo>}
          <Campo label="Cuenta contable vinculada" ayuda="Código de una cuenta imputable del catálogo"><Entrada value={f.cuenta} onChange={(e) => setForm({ ...f, cuenta: e.target.value.replace(/\D/g, "") })} inputMode="numeric" className="cifra" /></Campo>
        </>}
      </Formulario>
    </Marco>
  );
}

/* ======================= HU-81 Activos fijos ======================= */
export function Activos() {
  const { avisar } = useApp();
  const [form, setForm] = useState<(ActivoFijo & { nuevo?: boolean; costoTxt: string; resTxt: string }) | null>(null);
  const [baja, setBaja] = useState<ActivoFijo | null>(null);
  const [fechaBaja, setFechaBaja] = useState("");
  const costo = ACTIVOS.reduce((t, a) => t + a.costo, 0);
  const f = form;
  const c = f ? num(f.costoTxt) : NaN, r = f ? num(f.resTxt || "0") : NaN;
  const ok = !!f && f.nombre.trim().length > 3 && c > 0 && r >= 0 && r < c && f.vida > 0 && /^\d{2}\/\d{2}\/\d{4}$/.test(f.fecha);
  const set = (k: string, v: string | number) => setForm({ ...f!, [k]: v } as never);

  return (
    <Marco ruta={[{ t: "Activo fijo" }, { t: "Activos fijos" }]}>
      <Pagina>
        <Titulo t="Activos fijos" sub="Costo, vida útil y valor residual; la depreciación mensual llega en el Sprint 3">
          <Permiso roles={["admin", "contador"]}><Boton v="pri" onClick={() => setForm({ id: "", codigo: "", nombre: "", categoria: "Mobiliario y equipo", costo: 0, fecha: "", residual: 0, vida: 5, suc: SUCURSALES[0], cuenta: "120101", nuevo: true, costoTxt: "", resTxt: "" })}><Plus size={17} />Nuevo activo</Boton></Permiso>
        </Titulo>
        <Tarjeta className="overflow-hidden">
          <TablaCifras<ActivoFijo> clave={(a) => a.id} filas={ACTIVOS} totales="Costo total" onFila={(a) => setForm({ ...a, costoTxt: dinero(a.costo), resTxt: dinero(a.residual) })}
            tarjeta={(a) => ({ meta: `${a.codigo} · ${a.suc}`, estado: a.baja ? <Etiqueta t="anulada">De baja</Etiqueta> : undefined, titulo: a.nombre, valor: dinero(a.costo), detalle: `Adquirido ${a.fecha} · ${a.vida} años · residual ${dinero(a.residual)}` })}
            cols={[
              { clave: "c", titulo: "Código", ver: (a) => <span className="cifra text-texto2">{a.codigo}</span> },
              { clave: "n", titulo: "Activo", ver: (a) => <span className="flex items-center gap-2"><Corto>{a.nombre}</Corto>{a.baja && <Etiqueta t="anulada">De baja</Etiqueta>}</span> },
              { clave: "s", titulo: "Sucursal", ver: (a) => a.suc },
              { clave: "f", titulo: "Adquisición", ver: (a) => <span className="cifra">{a.fecha}</span> },
              { clave: "v", titulo: "Vida útil", tipo: "num", ver: (a) => <span className="cifra">{a.vida} años</span> },
              { clave: "r", titulo: "Residual", tipo: "num", ver: (a) => <Cifra v={a.residual} /> },
              { clave: "k", titulo: "Costo", tipo: "num", ver: (a) => <Cifra v={a.costo} />, total: costo },
              { clave: "x", titulo: "", ver: (a) => <Permiso roles={["admin", "contador"]}><button type="button" className="font-semibold text-texto2 hover:text-texto" onClick={(e) => { e.stopPropagation(); setBaja(a); setFechaBaja(""); }}>Dar de baja</button></Permiso> },
            ]} />
        </Tarjeta>
      </Pagina>
      <Formulario abierto={!!f} onCerrar={() => setForm(null)} titulo={f?.nuevo ? "Nuevo activo fijo" : `Editar ${f?.codigo}`} ok={ok} onGuardar={() => { avisar("Activo guardado"); setForm(null); }}>
        {f && <>
          <Campo label="Nombre"><Entrada value={f.nombre} onChange={(e) => set("nombre", e.target.value)} /></Campo>
          <Campo label="Categoría"><Selector value={f.categoria} onChange={(e) => set("categoria", e.target.value)}><option>Mobiliario y equipo</option><option>Equipo de transporte</option><option>Edificaciones</option></Selector></Campo>
          <div className="grid grid-cols-2 gap-3">
            <Campo label="Costo (US$)"><Entrada value={f.costoTxt} onChange={(e) => set("costoTxt", e.target.value.replace(/[^\d.,]/g, ""))} inputMode="decimal" className="cifra text-right" /></Campo>
            <Campo label="Valor residual (US$)" error={r >= c && c > 0 ? "Debe ser menor al costo." : undefined}><Entrada value={f.resTxt} onChange={(e) => set("resTxt", e.target.value.replace(/[^\d.,]/g, ""))} inputMode="decimal" className="cifra text-right" /></Campo>
            <Campo label="Fecha de adquisición"><Entrada value={f.fecha} onChange={(e) => set("fecha", e.target.value)} placeholder="dd/mm/aaaa" className="cifra" /></Campo>
            <Campo label="Vida útil (años)"><Entrada value={f.vida} onChange={(e) => set("vida", Math.max(0, parseInt(e.target.value) || 0))} inputMode="numeric" className="cifra text-right" /></Campo>
          </div>
          <Campo label="Sucursal"><Selector value={f.suc} onChange={(e) => set("suc", e.target.value)}>{SUCURSALES.map((s) => <option key={s}>{s}</option>)}</Selector></Campo>
          <Campo label="Método de depreciación"><Selector disabled><option>Línea recta</option></Selector></Campo>
          {!f.nuevo && !f.baja && <Permiso roles={["admin", "contador"]}><Boton v="pel" onClick={() => { const a = ACTIVOS.find((x) => x.id === f.id)!; setForm(null); setBaja(a); setFechaBaja(""); }}>Dar de baja este activo</Boton></Permiso>}
        </>}
      </Formulario>
      <Dialogo abierto={!!baja} onCerrar={() => setBaja(null)} titulo={`Dar de baja ${baja?.codigo ?? ""}`} sub="Se genera la partida de baja: se retira el costo y se registra la pérdida."
        pie={<><Boton v="fan" onClick={() => setBaja(null)}>Cancelar</Boton><Boton v="pel" disabled={!/^\d{2}\/\d{2}\/\d{4}$/.test(fechaBaja)} onClick={() => { setBaja(null); avisar("Activo dado de baja con su partida"); }}>Dar de baja</Boton></>}>
        <Campo label="Fecha de la baja" error={fechaBaja && !/^\d{2}\/\d{2}\/\d{4}$/.test(fechaBaja) ? "Usa dd/mm/aaaa." : undefined}><Entrada value={fechaBaja} onChange={(e) => setFechaBaja(e.target.value)} placeholder="dd/mm/aaaa" className="cifra" /></Campo>
        {baja && (
          <div className="bg-fondo rounded-2xl text-sm overflow-hidden">
            {[["Pérdida por baja de activo", baja.costo, 0], ["Activo fijo · " + baja.nombre, 0, baja.costo]].map(([t, d, h]) => (
              <div key={t as string} className="grid grid-cols-[minmax(0,1fr)_90px_90px] gap-2 px-4 py-2.5 border-b border-borde last:border-0"><span className="truncate">{t}</span><span className="text-right"><Cifra v={d as number} /></span><span className="text-right"><Cifra v={h as number} /></span></div>
            ))}
            <p className="px-4 py-2.5 text-xs text-texto3">Si el activo ya tuviera depreciación acumulada, esta se retira primero y la pérdida es solo el valor en libros.</p>
          </div>
        )}
      </Dialogo>
    </Marco>
  );
}
