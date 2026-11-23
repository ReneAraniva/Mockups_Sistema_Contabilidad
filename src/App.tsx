import { useEffect, type ReactNode } from "react";
import { HashRouter, Link, Route, Routes, useLocation, useParams } from "react-router-dom";
import { ShieldOff } from "lucide-react";
import { Proveedor, useApp } from "./contexto";
import { MENU, ROLES, TODOS } from "./datos/navegacion";
import { Indice } from "./marco/Indice";
import { Marco } from "./marco/Marco";
import { Visor } from "./marco/Visor";
import { Login, Recuperar } from "./pantallas/Acceso";
import { Balanzas, HojaTrabajo } from "./pantallas/Balanzas";
import { Estados } from "./pantallas/Estados";
import { Activos, CajaBancos, Empleados, Productos, Terceros } from "./pantallas/Maestros";
import { Parametros } from "./pantallas/Parametros";
import { Catalogo } from "./pantallas/Catalogo";
import { Cierre } from "./pantallas/Cierre";
import { LibroDiario, LibroMayor } from "./pantallas/Libros";
import { Importar } from "./pantallas/Importar";
import { Bitacora, Empresa, Periodos, Sucursales, Usuarios } from "./pantallas/Organizacion";
import { PartidaDetalle } from "./pantallas/PartidaDetalle";
import { PartidaEditor } from "./pantallas/PartidaEditor";
import { PARTIDAS } from "./datos/ejemplo";
import { Partidas, Pendientes } from "./pantallas/Partidas";
import { Tablero } from "./pantallas/Tablero";
import { CobrosPagos, Compras, Ventas } from "./pantallas/Comercial";
import { Kardex } from "./pantallas/Inventario";
import { Planilla, Prestaciones } from "./pantallas/Personal";
import { Conciliacion, Depreciacion } from "./pantallas/Tesoreria";
import { EstadosAdicionales } from "./pantallas/EstadosExtra";
import { Respaldos } from "./pantallas/Respaldos";
import { Declaraciones, LibrosIva } from "./pantallas/Tributario";
import { Pagina } from "./ui";

/** Si el rol no tiene la pantalla en su menú, muestra el aviso de acceso denegado. */
function Protegida({ ruta, children }: { ruta: string; children: ReactNode }) {
  const { rol } = useApp();
  const op = MENU.flatMap((g) => g.items).find((i) => i.ruta === ruta);
  if ((op?.roles ?? TODOS).includes(rol)) return <>{children}</>;
  return (
    <Marco ruta={[{ t: op?.n ?? "Sin acceso" }]}>
      <Pagina ancho="max-w-[560px]">
        <div className="bg-tarjeta border border-borde rounded-2xl p-10 grid justify-items-center gap-3 text-center mt-10">
          <span className="w-14 h-14 rounded-2xl bg-tarjeta2 grid place-items-center"><ShieldOff size={24} /></span>
          <h1 className="text-xl">No tienes acceso a esta pantalla</h1>
          <p className="text-texto2">Tu rol es {ROLES[rol]}. Pide al administrador de la empresa que revise tus permisos.</p>
          <Link to="/tablero" className="h-11 px-5 rounded-full bg-pri text-prit font-semibold inline-flex items-center mt-2">Ir al tablero</Link>
        </div>
      </Pagina>
    </Marco>
  );
}

/** Dentro del marco de celular o tableta, el índice y el visor se abren en la ventana principal
 *  (así no se anida un visor dentro de otro). */
export const enMarco = window.self !== window.top;
function VentanaPrincipal({ children }: { children: ReactNode }) {
  const loc = useLocation();
  useEffect(() => {
    if (!enMarco) return;
    const ruta = loc.pathname + loc.search;
    window.parent.postMessage({ proto: "ir", ruta }, "*");
  }, [loc]);
  return enMarco ? null : <>{children}</>;
}

/** Los borradores se editan; las contabilizadas y anuladas se consultan en su detalle (HU-23 · HU-24). */
function PartidaPorId() {
  const { id } = useParams();
  const base = PARTIDAS.find((x) => x.id === id);
  return !base || base.estado !== "Borrador" ? <PartidaDetalle key={id} /> : <PartidaEditor key={id} />;
}
function EditarPorId() { const { id } = useParams(); return <PartidaEditor key={"v" + id} />; }

const p = (ruta: string, el: ReactNode) => <Route key={ruta} path={ruta} element={<Protegida ruta={ruta}>{el}</Protegida>} />;

export default function App() {
  return (
    <HashRouter>
      <Proveedor>
        <Routes>
          <Route path="/" element={<VentanaPrincipal><Indice /></VentanaPrincipal>} />
          <Route path="/visor/:tipo" element={<VentanaPrincipal><Visor /></VentanaPrincipal>} />
          <Route path="/login" element={<Login />} />
          <Route path="/recuperar" element={<Recuperar />} />
          {p("/tablero", <Tablero />)}
          {p("/catalogo", <Catalogo />)}
          {p("/importar", <Importar />)}
          {p("/partidas", <Partidas />)}
          <Route path="/partidas/nueva" element={<PartidaEditor key="nueva" />} />
          <Route path="/partidas/:id" element={<PartidaPorId />} />
          <Route path="/partidas/:id/editar" element={<EditarPorId />} />
          {p("/pendientes", <Pendientes />)}
          {p("/periodos", <Periodos />)}
          {p("/cierre", <Cierre />)}
          {p("/libro-diario", <LibroDiario />)}
          {p("/libro-mayor", <LibroMayor />)}
          {p("/balanzas", <Balanzas />)}
          {p("/hoja-trabajo", <HojaTrabajo />)}
          {p("/estados", <Estados />)}
          {p("/parametros", <Parametros />)}
          {p("/clientes", <Terceros />)}
          {p("/productos", <Productos />)}
          {p("/empleados", <Empleados />)}
          {p("/caja-bancos", <CajaBancos />)}
          {p("/activos", <Activos />)}
          {p("/libros-iva", <LibrosIva />)}
          {p("/declaraciones", <Declaraciones />)}
          {p("/compras", <Compras />)}
          {p("/ventas", <Ventas />)}
          {p("/cobros-pagos", <CobrosPagos />)}
          {p("/kardex", <Kardex />)}
          {p("/planilla", <Planilla />)}
          {p("/prestaciones", <Prestaciones />)}
          {p("/conciliacion", <Conciliacion />)}
          {p("/depreciacion", <Depreciacion />)}
          {p("/estados-adicionales", <EstadosAdicionales />)}
          {p("/respaldos", <Respaldos />)}
          {p("/empresa", <Empresa />)}
          {p("/sucursales", <Sucursales />)}
          {p("/usuarios", <Usuarios />)}
          {p("/bitacora", <Bitacora />)}
          <Route path="*" element={<VentanaPrincipal><Indice /></VentanaPrincipal>} />
        </Routes>
      </Proveedor>
    </HashRouter>
  );
}
