import { useState } from "react";
import { Link } from "react-router-dom";
import { Building2, CalendarPlus, Download, ImageUp, LockKeyhole, LockKeyholeOpen, MailPlus, MapPin, Pencil, Plus, Power, Search } from "lucide-react";
import { EMPRESAS, useApp } from "../contexto";
import { PARTIDAS } from "../datos/ejemplo";
import { ROLES, type Rol } from "../datos/navegacion";
import { Marco, Permiso } from "../marco/Marco";
import {
  Area, Aviso, Boton, BotonIcono, CabTarjeta, Campo, Casilla, Dialogo, Entrada, Etiqueta, Pagina, Pestanas, Selector, Tarjeta, Titulo, cx, errorCorreo, td, th,
} from "../ui";

const NIT_OK = /^\d{4}-\d{6}-\d{3}-\d$/;
const NRC_OK = /^\d{1,6}-\d$/;
const formatoNit = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 14);
  return [d.slice(0, 4), d.slice(4, 10), d.slice(10, 13), d.slice(13)].filter(Boolean).join("-");
};

/* ======================= HU-06 Empresa ======================= */
function CamposEmpresa({ editable, inicial }: { editable: boolean; inicial?: boolean }) {
  const [nit, setNit] = useState(inicial ? "" : "0614-150318-102-6");
  const [nrc, setNrc] = useState(inicial ? "" : "254871-3");
  const [tipo, setTipo] = useState("sociedad");
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Campo label="Razón social" className="sm:col-span-2"><Entrada disabled={!editable} defaultValue={inicial ? "" : "Comercial Oriente, S.A. de C.V."} placeholder="Nombre legal completo" /></Campo>
      <Campo label="Nombre comercial"><Entrada disabled={!editable} defaultValue={inicial ? "" : "Comercial Oriente"} /></Campo>
      <Campo label="Tipo de contribuyente">
        <Selector disabled={!editable} value={tipo} onChange={(e) => setTipo(e.target.value)}><option value="natural">Persona natural</option><option value="sociedad">Sociedad</option></Selector>
      </Campo>
      <Campo label="NIT" ayuda="0000-000000-000-0" error={nit && !NIT_OK.test(nit) ? "El NIT tiene 14 dígitos con el formato 0000-000000-000-0." : undefined}>
        <Entrada disabled={!editable} value={nit} onChange={(e) => setNit(formatoNit(e.target.value))} mal={!!nit && !NIT_OK.test(nit)} inputMode="numeric" className="cifra" />
      </Campo>
      <Campo label="NRC" ayuda="000000-0" error={nrc && !NRC_OK.test(nrc) ? "Escribe el NRC con su dígito verificador: 000000-0." : undefined}>
        <Entrada disabled={!editable} value={nrc} onChange={(e) => setNrc(e.target.value.replace(/[^\d-]/g, "").slice(0, 8))} mal={!!nrc && !NRC_OK.test(nrc)} className="cifra" />
      </Campo>
      <Campo label="Actividad económica" className="sm:col-span-2">
        <Selector disabled={!editable} defaultValue="46900"><option value="46900">46900 · Venta al por mayor de otros productos</option><option value="47190">47190 · Venta al por menor en comercios no especializados</option><option value="47521">47521 · Venta de artículos de ferretería</option></Selector>
      </Campo>
      <Campo label="Clasificación" ayuda="Define si aplica la retención o percepción del 1 %">
        <Selector disabled={!editable} defaultValue="mediano"><option value="grande">Gran contribuyente</option><option value="mediano">Mediano contribuyente</option><option value="otro">Otro contribuyente</option></Selector>
      </Campo>
      <Campo label="Teléfono"><Entrada disabled={!editable} defaultValue={inicial ? "" : "2661-4410"} inputMode="tel" /></Campo>
      <Campo label="Dirección" className="sm:col-span-2"><Area disabled={!editable} rows={2} defaultValue={inicial ? "" : "4.ª calle poniente n.º 12, barrio El Centro, San Miguel"} /></Campo>
      {tipo === "sociedad" && <p className="sm:col-span-2 text-xs text-texto3 -mt-1">Para sociedad, el catálogo incluye reserva legal y capital social; para persona natural, retiros del titular.</p>}
    </div>
  );
}

export function Empresa() {
  const { empresa, puede, avisar, rol } = useApp();
  const [nueva, setNueva] = useState(false);
  const editable = puede("admin");
  return (
    <Marco ruta={[{ t: "Administración" }, { t: "Empresa" }]}>
      <Pagina ancho="max-w-[1120px]">
        <Titulo t="Empresa" sub={editable ? "Datos fiscales que aparecen en la interfaz, los libros y los reportes." : "Solo el administrador puede modificar estos datos."}>
          <Permiso roles={["admin"]}><Boton onClick={() => setNueva(true)}><Plus size={17} />Registrar otra empresa</Boton></Permiso>
        </Titulo>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_minmax(0,1fr)] items-start">
          <Tarjeta className="p-5 grid gap-4 justify-items-center text-center">
            <span className="w-28 h-28 rounded-3xl bg-pri text-prit grid place-items-center text-3xl font-bold">CO</span>
            <div><b className="font-semibold block">{EMPRESAS[empresa].n}</b><span className="text-xs text-texto2">Sociedad · Mediano contribuyente</span></div>
            {editable && <Boton peq onClick={() => avisar("Logotipo actualizado")}><ImageUp size={15} />Cambiar logotipo</Boton>}
            <p className="text-xs text-texto3">PNG o SVG, fondo transparente. Se usa en la interfaz y en los reportes.</p>
            <div className="w-full h-px bg-borde" />
            <div className="w-full grid grid-cols-2 gap-3 text-left text-sm">
              <div><span className="block text-texto3 text-xs">Sucursales</span>3</div>
              <div><span className="block text-texto3 text-xs">Usuarios</span>5</div>
              <div><span className="block text-texto3 text-xs">Ejercicio</span>2026</div>
              <div><span className="block text-texto3 text-xs">Tu rol</span>{ROLES[rol]}</div>
            </div>
          </Tarjeta>
          <Tarjeta>
            <CabTarjeta titulo="Datos generales" />
            <div className="p-5"><CamposEmpresa editable={editable} /></div>
            {editable && <div className="flex justify-end gap-2 px-5 pb-5"><Boton v="fan">Descartar</Boton><Boton v="pri" onClick={() => avisar("Datos de la empresa guardados")}>Guardar cambios</Boton></div>}
          </Tarjeta>
        </div>
      </Pagina>
      <Dialogo abierto={nueva} onCerrar={() => setNueva(false)} titulo="Registrar empresa" ancho="max-w-[720px]"
        sub="Quedarás como su administrador. Recibirá el catálogo empresarial según su tipo de contribuyente."
        pie={<><Boton v="fan" onClick={() => setNueva(false)}>Cancelar</Boton><Boton v="pri" onClick={() => { setNueva(false); avisar("Empresa registrada con su casa matriz y catálogo"); }}>Registrar empresa</Boton></>}>
        <CamposEmpresa editable inicial />
      </Dialogo>
    </Marco>
  );
}

/* ======================= HU-07 Sucursales ======================= */
const SUCURSALES = [
  { cod: "M001", pv: "P001", n: "Casa matriz", dir: "4.ª calle poniente n.º 12, San Miguel", mov: true, activa: true, matriz: true },
  { cod: "S001", pv: "P001", n: "San Miguel Centro", dir: "Av. Roosevelt sur n.º 305, San Miguel", mov: true, activa: true },
  { cod: "S002", pv: "P001", n: "Usulután", dir: "Calle Grimaldi n.º 8, Usulután", mov: true, activa: true },
  { cod: "S003", pv: "P001", n: "La Unión", dir: "Barrio Concepción, La Unión", mov: false, activa: false },
];

export function Sucursales() {
  const { puede, avisar } = useApp();
  const [form, setForm] = useState<null | (typeof SUCURSALES)[number] | "nueva">(null);
  const [inactivar, setInactivar] = useState<(typeof SUCURSALES)[number] | null>(null);
  const admin = puede("admin");
  const s = form && form !== "nueva" ? form : null;
  return (
    <Marco ruta={[{ t: "Administración" }, { t: "Sucursales" }]}>
      <Pagina ancho="max-w-[1120px]">
        <Titulo t="Sucursales" sub="Cada registro indica a qué sucursal pertenece. Códigos según Hacienda.">
          <Permiso roles={["admin"]}><Boton v="pri" onClick={() => setForm("nueva")}><Plus size={17} />Nueva sucursal</Boton></Permiso>
        </Titulo>
        <div className="grid gap-3">
          {SUCURSALES.map((x) => (
            <Tarjeta key={x.cod} className={cx("p-4 sm:px-5 flex items-center gap-4 flex-wrap", !x.activa && "opacity-60")}>
              <span className="w-11 h-11 rounded-xl bg-tarjeta2 grid place-items-center shrink-0">{x.matriz ? <Building2 size={19} /> : <MapPin size={19} />}</span>
              <div className="flex-1 min-w-[180px]">
                <div className="flex items-center gap-2 flex-wrap"><b className="font-semibold">{x.n}</b>{x.matriz && <Etiqueta t="contab">Casa matriz</Etiqueta>}{!x.activa && <Etiqueta t="neutra">Inactiva</Etiqueta>}</div>
                <span className="text-sm text-texto2">{x.dir}</span>
              </div>
              <div className="flex gap-6 text-sm">
                <div><span className="block text-xs text-texto3">Establecimiento</span><span className="cifra">{x.cod}</span></div>
                <div><span className="block text-xs text-texto3">Punto de venta</span><span className="cifra">{x.pv}</span></div>
              </div>
              {admin && (
                <div className="flex gap-1">
                  <BotonIcono aria-label={`Editar ${x.n}`} onClick={() => setForm(x)}><Pencil size={16} /></BotonIcono>
                  {!x.matriz && <BotonIcono aria-label={`${x.activa ? "Inactivar" : "Activar"} ${x.n}`} onClick={() => x.activa ? setInactivar(x) : avisar("Sucursal activada")}><Power size={16} /></BotonIcono>}
                </div>
              )}
            </Tarjeta>
          ))}
        </div>
        <Aviso>La casa matriz no se puede inactivar: toda empresa necesita al menos una sucursal.</Aviso>
      </Pagina>
      <Dialogo lateral abierto={!!form} onCerrar={() => setForm(null)} titulo={s ? "Editar sucursal" : "Nueva sucursal"}
        pie={<><Boton v="fan" onClick={() => setForm(null)}>Cancelar</Boton><Boton v="pri" onClick={() => { setForm(null); avisar("Sucursal guardada"); }}>Guardar</Boton></>}>
        <Campo label="Nombre"><Entrada defaultValue={s?.n} placeholder="Ej. Santa Ana Centro" /></Campo>
        <div className="grid grid-cols-2 gap-4">
          <Campo label="Código de establecimiento" ayuda="Asignado por Hacienda"><Entrada defaultValue={s?.cod ?? "S004"} className="cifra" disabled={!!s?.mov} /></Campo>
          <Campo label="Punto de venta" ayuda="Para los DTE"><Entrada defaultValue={s?.pv ?? "P001"} className="cifra" /></Campo>
        </div>
        <Campo label="Dirección"><Area rows={2} defaultValue={s?.dir} /></Campo>
        <Campo label="Teléfono"><Entrada inputMode="tel" placeholder="0000-0000" /></Campo>
        {s?.mov && <Aviso>Tiene movimientos: su código ya no se puede cambiar.</Aviso>}
      </Dialogo>
      <Dialogo abierto={!!inactivar} onCerrar={() => setInactivar(null)} titulo={`¿Inactivar ${inactivar?.n}?`}
        sub="Tiene movimientos, por eso no se elimina. Dejará de aparecer en el selector y no aceptará registros nuevos."
        pie={<><Boton v="fan" onClick={() => setInactivar(null)}>Cancelar</Boton><Boton v="pel" onClick={() => { setInactivar(null); avisar("Sucursal inactivada"); }}>Inactivar</Boton></>}>
        <span className="text-sm text-texto2">Los usuarios asignados solo a esta sucursal perderán el acceso hasta que les asignes otra.</span>
      </Dialogo>
    </Marco>
  );
}

/* ======================= HU-08 y HU-10 Usuarios y roles ======================= */
const USUARIOS: { n: string; c: string; rol: Rol; suc: string; estado: "Activo" | "Invitación enviada" }[] = [
  { n: "María Rivas", c: "maria.rivas@comercialoriente.sv", rol: "admin", suc: "Todas", estado: "Activo" },
  { n: "Carlos Guandique", c: "carlos.g@comercialoriente.sv", rol: "contador", suc: "Todas", estado: "Activo" },
  { n: "Josué Martínez", c: "josue.m@comercialoriente.sv", rol: "auxiliar", suc: "San Miguel Centro, Usulután", estado: "Activo" },
  { n: "Ana Lemus", c: "ana.lemus@comercialoriente.sv", rol: "consulta", suc: "Casa matriz", estado: "Activo" },
  { n: "—", c: "kevin.g@comercialoriente.sv", rol: "auxiliar", suc: "Casa matriz", estado: "Invitación enviada" },
];
const MATRIZ: [string, string, string, string, string][] = [
  ["Datos de la empresa y configuración", "T", "V", "V", "V"],
  ["Sucursales", "T", "V", "V", "V"],
  ["Usuarios y asignación de roles", "T", "—", "—", "—"],
  ["Bitácora de auditoría", "VX", "VX", "—", "V"],
  ["Respaldo de datos", "T", "R", "—", "—"],
  ["Restauración de un respaldo", "T", "—", "—", "—"],
  ["Catálogo de cuentas", "T", "VRA", "V", "V"],
  ["Importación desde Excel", "T", "R", "—", "—"],
  ["Partidas manuales en borrador", "T", "VR", "VR", "V"],
  ["Contabilizar partidas", "C", "C", "—", "—"],
  ["Editar partidas contabilizadas", "R", "R", "—", "—"],
  ["Anular partidas (reversión)", "A", "A", "—", "—"],
  ["Cierre de período y de ejercicio", "C", "C", "—", "—"],
  ["Reabrir un período cerrado", "C", "—", "—", "—"],
  ["Libros, balanzas y hoja de trabajo", "VX", "VX", "VX", "VX"],
  ["Estados financieros", "VX", "VX", "V", "VX"],
  ["Firma digital de estados", "F", "F", "—", "—"],
];
const DESC_ROL: Record<Rol, string> = {
  admin: "Todo, incluidos usuarios, respaldos y reapertura de períodos.",
  contador: "Catálogo, contabilización, cierres, declaraciones y firma.",
  auxiliar: "Registro diario en borrador. Limitado a sus sucursales.",
  consulta: "Ve libros y reportes sin modificar nada. Limitado a sus sucursales.",
};

export function Usuarios() {
  const { avisar, usuario } = useApp();
  // la primera fila es quien inició sesión en el prototipo
  const usuarios = [{ ...USUARIOS[0], n: usuario.nombre, c: usuario.correo }, ...USUARIOS.slice(1)];
  const [tab, setTab] = useState<"usuarios" | "matriz">("usuarios");
  const [invitar, setInvitar] = useState(false);
  const [rolNuevo, setRolNuevo] = useState<Rol>("auxiliar");
  const [sucs, setSucs] = useState<string[]>(["Casa matriz"]);
  const [cambio, setCambio] = useState<(typeof USUARIOS)[number] | null>(null);
  const [correoInv, setCorreoInv] = useState("");
  const [tocadoInv, setTocadoInv] = useState(false);
  const errInv = errorCorreo(correoInv);
  const limitado = rolNuevo === "auxiliar" || rolNuevo === "consulta";

  return (
    <Marco ruta={[{ t: "Administración" }, { t: "Usuarios y roles" }]}>
      <Pagina>
        <Titulo t="Usuarios y roles" sub="Un usuario puede tener roles distintos en empresas distintas.">
          <Boton v="pri" onClick={() => setInvitar(true)}><MailPlus size={17} />Invitar usuario</Boton>
        </Titulo>
        <Pestanas valor={tab} onChange={setTab} opciones={[{ v: "usuarios", t: "Usuarios", n: usuarios.length }, { v: "matriz", t: "Matriz de permisos" }]} />

        {tab === "usuarios" ? (
          <Tarjeta className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[760px]">
              <thead><tr><th className={th}>Usuario</th><th className={th}>Rol</th><th className={th}>Sucursales</th><th className={th}>Estado</th><th className={th} /></tr></thead>
              <tbody>{usuarios.map((u) => (
                <tr key={u.c} className="hover:bg-white/[.02]">
                  <td className={td}><div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-full bg-tarjeta2 grid place-items-center text-xs font-bold shrink-0">{u.n === "—" ? "?" : u.n.split(" ").map((p) => p[0]).join("")}</span>
                    <span className="min-w-0"><b className="block font-semibold">{u.n === "—" ? "Pendiente de aceptar" : u.n}</b><span className="text-xs text-texto2">{u.c}</span></span></div></td>
                  <td className={td}>{ROLES[u.rol]}</td>
                  <td className={cx(td, "text-texto2 text-sm")}>{u.suc}</td>
                  <td className={td}>{u.estado === "Activo" ? <Etiqueta t="abierto">Activo</Etiqueta> : <Etiqueta t="borrador">Invitación enviada</Etiqueta>}</td>
                  <td className={cx(td, "text-right")}>
                    {u.estado === "Activo" ? (u.rol !== "admin" && <Boton peq v="fan" onClick={() => setCambio(u)}>Cambiar rol</Boton>)
                      : <Boton peq v="fan" onClick={() => avisar("Invitación reenviada")}>Reenviar</Boton>}
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </Tarjeta>
        ) : (
          <Tarjeta className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[640px]">
              <thead><tr><th className={th}>Función</th>{(Object.keys(ROLES) as Rol[]).map((r) => <th key={r} className={cx(th, "text-center")}>{ROLES[r].split(" ")[0]}</th>)}</tr></thead>
              <tbody>{MATRIZ.map(([f, ...v]) => (
                <tr key={f}><td className={td}>{f}</td>{v.map((x, i) => (
                  <td key={i} className={cx(td, "text-center cifra font-semibold", x === "—" ? "text-texto3" : "")}>{x}</td>
                ))}</tr>
              ))}</tbody>
            </table>
            <p className="px-5 py-3 text-xs text-texto3 border-t border-borde">V ver · R registrar y editar · C contabilizar, aprobar o generar · A anular o inactivar · X exportar · F firmar · T todas · — sin acceso. La interfaz oculta lo que el rol no permite.</p>
          </Tarjeta>
        )}
      </Pagina>

      <Dialogo lateral abierto={invitar} onCerrar={() => setInvitar(false)} titulo="Invitar usuario" sub="Recibirá un correo para crear su contraseña."
        pie={<><Boton v="fan" onClick={() => setInvitar(false)}>Cancelar</Boton><Boton v="pri" disabled={limitado && !sucs.length} onClick={() => { setTocadoInv(true); if (errInv) return; setInvitar(false); setCorreoInv(""); setTocadoInv(false); avisar(`Invitación enviada a ${correoInv.trim()}`); }}>Enviar invitación</Boton></>}>
        <Campo label="Correo electrónico" error={tocadoInv && errInv ? errInv.replace("tu correo", "el correo") : undefined}><Entrada type="email" value={correoInv} onChange={(e) => setCorreoInv(e.target.value)} onBlur={() => correoInv && setTocadoInv(true)} mal={tocadoInv && !!errInv} placeholder="Ej: chero@gmail.com" /></Campo>
        <fieldset className="grid gap-2">
          <legend className="text-xs font-semibold mb-1.5">Rol en Comercial Oriente</legend>
          {(Object.keys(ROLES) as Rol[]).map((r) => (
            <button key={r} type="button" onClick={() => setRolNuevo(r)} aria-pressed={rolNuevo === r}
              className={cx("text-left p-3.5 rounded-2xl border flex gap-3 items-start", rolNuevo === r ? "border-texto bg-tarjeta2" : "border-borde hover:border-bordef")}>
              <span className={cx("w-[18px] h-[18px] mt-0.5 rounded-full border-2 grid place-items-center shrink-0", rolNuevo === r ? "border-texto" : "border-bordef")}>{rolNuevo === r && <span className="w-2 h-2 rounded-full bg-texto" />}</span>
              <span><b className="font-semibold block">{ROLES[r]}</b><span className="text-sm text-texto2">{DESC_ROL[r]}</span></span>
            </button>
          ))}
        </fieldset>
        <fieldset className="grid gap-2">
          <legend className="text-xs font-semibold mb-1.5">Sucursales</legend>
          {limitado ? EMPRESAS[0].suc.map((s) => (
            <label key={s} className="flex items-center gap-3 h-9 text-sm"><Casilla label={s} checked={sucs.includes(s)} onChange={(v) => setSucs(v ? [...sucs, s] : sucs.filter((x) => x !== s))} />{s}</label>
          )) : <p className="text-sm text-texto2">Este rol trabaja con todas las sucursales.</p>}
          {limitado && !sucs.length && <span className="text-xs text-alerta">Elige al menos una sucursal.</span>}
        </fieldset>
      </Dialogo>

      <Dialogo abierto={!!cambio} onCerrar={() => setCambio(null)} titulo={`Cambiar el rol de ${cambio?.n}`} sub="El cambio queda registrado en la bitácora."
        pie={<><Boton v="fan" onClick={() => setCambio(null)}>Cancelar</Boton><Boton v="pri" onClick={() => { setCambio(null); avisar("Rol actualizado"); }}>Guardar</Boton></>}>
        <Campo label="Nuevo rol"><Selector defaultValue={cambio?.rol}>{(Object.keys(ROLES) as Rol[]).map((r) => <option key={r} value={r}>{ROLES[r]}</option>)}</Selector></Campo>
      </Dialogo>
    </Marco>
  );
}

/* ======================= HU-11 Bitácora ======================= */
const EVENTOS: { f: string; u: string; a: string; m: string; r: string; antes: Record<string, string>; despues: Record<string, string> }[] = [
  { f: "10/11/2026 16:42", u: "Carlos Guandique", a: "Contabilizar", m: "Partidas", r: "Partida n.º 7", antes: { estado: "Borrador", numero: "—" }, despues: { estado: "Contabilizada", numero: "7" } },
  { f: "10/11/2026 15:10", u: "María Rivas", a: "Cambiar rol", m: "Usuarios", r: "Josué Martínez", antes: { rol: "Solo consulta", sucursales: "Casa matriz" }, despues: { rol: "Auxiliar contable", sucursales: "San Miguel Centro, Usulután" } },
  { f: "10/11/2026 11:05", u: "Josué Martínez", a: "Crear", m: "Partidas", r: "Borrador del 10/11/2026", antes: {}, despues: { concepto: "Pago de energía eléctrica", total: "85.40" } },
  { f: "09/11/2026 17:31", u: "Carlos Guandique", a: "Inactivar", m: "Catálogo", r: "1113 IVA percibido", antes: { activa: "Sí" }, despues: { activa: "No" } },
  { f: "09/11/2026 09:12", u: "María Rivas", a: "Editar", m: "Empresa", r: "Comercial Oriente", antes: { telefono: "2661-4400" }, despues: { telefono: "2661-4410" } },
  { f: "08/11/2026 14:20", u: "Carlos Guandique", a: "Importar", m: "Catálogo", r: "catalogo_comercial_oriente.xlsx", antes: {}, despues: { cuentas_nuevas: "96", actualizadas: "32" } },
];

export function Bitacora() {
  const [q, setQ] = useState("");
  const [modulo, setModulo] = useState("");
  const [ver, setVer] = useState<(typeof EVENTOS)[number] | null>(null);
  const lista = EVENTOS.filter((e) => (!modulo || e.m === modulo) && (e.u + e.r + e.a).toLowerCase().includes(q.toLowerCase()));
  return (
    <Marco ruta={[{ t: "Administración" }, { t: "Bitácora" }]}>
      <Pagina>
        <Titulo t="Bitácora de auditoría" sub="Registro inmutable de cada cambio: nadie puede editarlo ni borrarlo.">
          <Permiso roles={["admin", "contador"]}><Boton><Download size={16} />Exportar a Excel</Boton></Permiso>
        </Titulo>
        <Tarjeta className="overflow-hidden">
          <div className="flex gap-3 p-4 flex-wrap border-b border-borde">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-texto3" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Usuario, acción o registro" aria-label="Buscar en la bitácora"
                className="w-full h-10 pl-10 pr-3 rounded-full border border-bordef bg-fondo outline-none focus:border-texto2 placeholder:text-texto3" />
            </div>
            <Selector value={modulo} onChange={(e) => setModulo(e.target.value)} className="h-10 w-auto rounded-full" aria-label="Módulo">
              <option value="">Todos los módulos</option>{[...new Set(EVENTOS.map((e) => e.m))].map((m) => <option key={m}>{m}</option>)}
            </Selector>
            <Selector className="h-10 w-auto rounded-full" aria-label="Acción"><option>Todas las acciones</option><option>Crear</option><option>Editar</option><option>Contabilizar</option></Selector>
            <Selector className="h-10 w-auto rounded-full" aria-label="Fechas"><option>Últimos 7 días</option><option>Este mes</option><option>Rango personalizado…</option></Selector>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[720px]">
              <thead><tr><th className={th}>Fecha y hora</th><th className={th}>Usuario</th><th className={th}>Acción</th><th className={th}>Módulo</th><th className={th}>Registro</th></tr></thead>
              <tbody>{lista.map((e) => (
                <tr key={e.f + e.r} onClick={() => setVer(e)} className="cursor-pointer hover:bg-white/[.02]">
                  <td className={cx(td, "cifra text-texto2 whitespace-nowrap")}>{e.f}</td><td className={td}>{e.u}</td>
                  <td className={td}><Etiqueta t="neutra">{e.a}</Etiqueta></td><td className={cx(td, "text-texto2")}>{e.m}</td><td className={td}>{e.r}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          {!lista.length && <p className="p-10 text-center text-texto2">Sin eventos con esos filtros.</p>}
        </Tarjeta>
      </Pagina>
      <Dialogo lateral abierto={!!ver} onCerrar={() => setVer(null)} titulo={`${ver?.a} · ${ver?.m}`} sub={`${ver?.f} · ${ver?.u}`}>
        <div className="text-sm"><span className="text-texto3 text-xs block">Registro afectado</span>{ver?.r}</div>
        <div className="rounded-2xl border border-borde overflow-hidden text-sm">
          <div className="grid grid-cols-[110px_1fr_1fr] bg-tarjeta2 text-xs font-bold tracking-[.08em] uppercase text-texto3"><span className="p-3">Campo</span><span className="p-3">Antes</span><span className="p-3">Después</span></div>
          {ver && [...new Set([...Object.keys(ver.antes), ...Object.keys(ver.despues)])].map((k) => (
            <div key={k} className="grid grid-cols-[110px_1fr_1fr] border-t border-borde">
              <span className="p-3 text-texto2">{k.replace("_", " ")}</span>
              <span className="p-3 text-texto3 line-through decoration-texto3/50">{ver.antes[k] ?? "—"}</span>
              <span className="p-3 font-semibold">{ver.despues[k] ?? "—"}</span>
            </div>
          ))}
        </div>
        <Aviso>Los eventos de la bitácora no se pueden editar ni eliminar.</Aviso>
      </Dialogo>
    </Marco>
  );
}

/* ======================= HU-19 Ejercicios y períodos ======================= */
const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

export function Periodos() {
  const { puede, avisar } = useApp();
  const [anio, setAnio] = useState("2026");
  const [crear, setCrear] = useState(false);
  const [cerrar, setCerrar] = useState<string | null>(null);
  const [reabrir, setReabrir] = useState<string | null>(null);
  const [motivo, setMotivo] = useState("");
  const borradores = PARTIDAS.filter((p) => p.estado === "Borrador");
  const estado = (i: number) => anio === "2025" ? "cerrado" : i < 9 ? "cerrado" : i < 11 ? "abierto" : "futuro";

  return (
    <Marco ruta={[{ t: "Contabilidad" }, { t: "Ejercicios y períodos" }]}>
      <Pagina>
        <Titulo t="Ejercicios y períodos" sub="Solo se registran partidas en períodos abiertos.">
          <Permiso roles={["admin"]}><Boton v="pri" onClick={() => setCrear(true)}><CalendarPlus size={17} />Crear ejercicio</Boton></Permiso>
        </Titulo>
        <Pestanas valor={anio} onChange={setAnio} opciones={[{ v: "2026", t: "Ejercicio 2026" }, { v: "2025", t: "Ejercicio 2025" }]} />
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {MESES.map((m, i) => {
            const e = estado(i);
            return (
              <Tarjeta key={m} className={cx("p-3 sm:p-4 grid gap-3 min-w-0", e === "abierto" && "border-bordef")}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div><b className="font-semibold block">{m}</b><span className="block text-xs text-texto3 cifra">01/{String(i + 1).padStart(2, "0")} – {[31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][i]}/{String(i + 1).padStart(2, "0")}/{anio}</span></div>
                  {e === "abierto" ? <Etiqueta t="abierto">Abierto</Etiqueta> : e === "cerrado" ? <Etiqueta t="cerrado">Cerrado</Etiqueta> : <Etiqueta t="borrador">Próximo</Etiqueta>}
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1 items-center justify-between text-xs text-texto2">
                  <span className="cifra">{e === "futuro" ? "Sin partidas" : `${e === "abierto" && i === 10 ? 7 : 40 + i * 3} partidas`}</span>
                  <Permiso roles={["admin", "contador"]}>
                    {e === "abierto" && <button type="button" onClick={() => setCerrar(m)} className="inline-flex items-center gap-1 font-semibold text-texto hover:underline underline-offset-4"><LockKeyhole size={13} />Cerrar</button>}
                  </Permiso>
                  {e === "cerrado" && puede("admin") && anio === "2026" && <button type="button" onClick={() => setReabrir(m)} className="inline-flex items-center gap-1 font-semibold text-texto2 hover:text-texto"><LockKeyholeOpen size={13} />Reabrir</button>}
                </div>
              </Tarjeta>
            );
          })}
        </div>
        <p className="text-xs text-texto3">El cierre de períodos y la reapertura se completan en el Sprint 2 (HU-32 y HU-33); aquí ya se ve su comportamiento.</p>
      </Pagina>

      <Dialogo abierto={crear} onCerrar={() => setCrear(false)} titulo="Crear ejercicio" sub="Se generan sus doce períodos mensuales, todos abiertos."
        pie={<><Boton v="fan" onClick={() => setCrear(false)}>Cancelar</Boton><Boton v="pri" onClick={() => { setCrear(false); avisar("Ejercicio 2027 creado con 12 períodos"); }}>Crear ejercicio 2027</Boton></>}>
        <Campo label="Año"><Entrada defaultValue="2027" inputMode="numeric" className="cifra" /></Campo>
        <div className="grid grid-cols-4 gap-1.5 text-xs">{MESES.map((m) => <span key={m} className="h-8 rounded-lg bg-fondo grid place-items-center text-texto2">{m.slice(0, 3)}</span>)}</div>
      </Dialogo>

      <Dialogo abierto={!!cerrar} onCerrar={() => setCerrar(null)} titulo={`Cerrar ${cerrar} 2026`}
        sub={cerrar === "Noviembre" ? "No se puede cerrar mientras tenga borradores." : "Nadie podrá registrar ni editar partidas en este período."}
        pie={<><Boton v="fan" onClick={() => setCerrar(null)}>Cancelar</Boton>
          {cerrar === "Noviembre" ? <Link to="/pendientes" className="h-11 px-5 rounded-full bg-pri text-prit font-semibold inline-flex items-center">Ir a pendientes</Link>
            : <Boton v="pri" onClick={() => { setCerrar(null); avisar("Período cerrado"); }}>Cerrar período</Boton>}</>}>
        {cerrar === "Noviembre" ? (
          <>
            <Aviso mal>{borradores.length} borradores impiden el cierre.</Aviso>
            <ul className="bg-fondo rounded-2xl text-sm">{borradores.map((p) => <li key={p.id} className="flex gap-3 px-4 py-2.5 border-b border-borde last:border-0"><span className="text-texto3 cifra">{p.fecha}</span><span className="truncate">{p.concepto}</span></li>)}</ul>
          </>
        ) : <Aviso>El cierre queda registrado en la bitácora.</Aviso>}
      </Dialogo>

      <Dialogo abierto={!!reabrir} onCerrar={() => { setReabrir(null); setMotivo(""); }} titulo={`Reabrir ${reabrir} 2026`} sub="Es una acción excepcional. El motivo queda en el período y en la bitácora."
        pie={<><Boton v="fan" onClick={() => { setReabrir(null); setMotivo(""); }}>Cancelar</Boton><Boton v="pel" disabled={motivo.trim().length < 10} onClick={() => { setReabrir(null); setMotivo(""); avisar("Período reabierto"); }}>Reabrir período</Boton></>}>
        <Campo label="Motivo" ayuda="Mínimo 10 caracteres"><Area rows={3} value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ej. Se omitió registrar la factura n.º 88 de septiembre." /></Campo>
      </Dialogo>
    </Marco>
  );
}
