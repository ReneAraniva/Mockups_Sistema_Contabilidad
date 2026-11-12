import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { Check, CircleAlert } from "lucide-react";
import type { Rol } from "./datos/navegacion";

export const EMPRESAS = [
  { n: "Comercial Oriente, S.A. de C.V.", c: "Comercial Oriente", suc: ["Casa matriz", "San Miguel Centro", "Usulután"] },
  { n: "Ferretería El Progreso", c: "Ferretería El Progreso", suc: ["Casa matriz"] },
  { n: "CheroPhonex (caso de clase)", c: "CheroPhonex", suc: ["Casa matriz", "Metrocentro"] },
];
export const PERIODOS = [
  { n: "Noviembre 2026", abierto: true },
  { n: "Octubre 2026", abierto: true },
  { n: "Septiembre 2026", abierto: false },
  { n: "Agosto 2026", abierto: false },
];

const leer = (k: string, d: string) => { try { return localStorage.getItem("proto-" + k) ?? d; } catch { return d; } };
const poner = (k: string, v: string) => { try { localStorage.setItem("proto-" + k, v); } catch { /* sin almacenamiento */ } };

/** Nombre a partir del correo: "maria.rivas@…" → "Maria Rivas", "chero@gmail.com" → "Chero". */
export function nombreDeCorreo(correo: string) {
  const local = correo.split("@")[0] || "usuario";
  return local.split(/[._\-]+/).filter(Boolean).map((p) => p.replace(/\d+/g, "")).filter(Boolean)
    .map((p) => p[0].toUpperCase() + p.slice(1).toLowerCase()).join(" ") || "Usuario";
}
const iniciales = (n: string) => n.split(" ").slice(0, 2).map((p) => p[0]).join("").toUpperCase();

type Aviso = { id: number; msg: string; mal?: boolean };
type Ctx = {
  rol: Rol; setRol: (r: Rol) => void;
  usuario: { correo: string; nombre: string; iniciales: string }; setCorreo: (c: string) => void;
  empresa: number; setEmpresa: (i: number) => void;
  sucursal: string; setSucursal: (s: string) => void;
  periodo: string; setPeriodo: (p: string) => void;
  avisar: (msg: string, mal?: boolean) => void;
  puede: (...roles: Rol[]) => boolean;
};
const C = createContext<Ctx>(null!);
export const useApp = () => useContext(C);

export function Proveedor({ children }: { children: ReactNode }) {
  const [rol, setRolE] = useState<Rol>(leer("rol", "contador") as Rol);
  const [empresa, setEmpresaE] = useState(+leer("empresa", "0"));
  const [sucursal, setSucursalE] = useState(leer("sucursal", "San Miguel Centro"));
  const [periodo, setPeriodoE] = useState(leer("periodo", "Noviembre 2026"));
  const [correo, setCorreoE] = useState(leer("correo", "maria.rivas@comercialoriente.sv"));
  const [avisos, setAvisos] = useState<Aviso[]>([]);

  const avisar = useCallback((msg: string, mal?: boolean) => {
    const id = Date.now() + Math.random();
    setAvisos((a) => [...a, { id, msg, mal }]);
    setTimeout(() => setAvisos((a) => a.filter((x) => x.id !== id)), 3200);
  }, []);

  const v: Ctx = {
    rol, setRol: (r) => { poner("rol", r); setRolE(r); },
    usuario: { correo, nombre: nombreDeCorreo(correo), iniciales: iniciales(nombreDeCorreo(correo)) },
    setCorreo: (c) => { poner("correo", c.trim().toLowerCase()); setCorreoE(c.trim().toLowerCase()); },
    empresa, setEmpresa: (i) => {
      poner("empresa", String(i)); setEmpresaE(i);
      const s = EMPRESAS[i].suc[0]; poner("sucursal", s); setSucursalE(s);
    },
    sucursal, setSucursal: (s) => { poner("sucursal", s); setSucursalE(s); },
    periodo, setPeriodo: (p) => { poner("periodo", p); setPeriodoE(p); },
    avisar,
    puede: (...roles) => roles.includes(rol),
  };

  return (
    <C.Provider value={v}>
      {children}
      <div className="fixed bottom-5 right-5 left-5 sm:left-auto z-[90] flex flex-col gap-2 items-end" aria-live="polite">
        {avisos.map((a) => (
          <div key={a.id} role="status"
            className={`entra flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-flota text-sm font-semibold max-w-sm ${a.mal ? "bg-alertaf text-alerta border border-alertab" : "bg-pri text-prit"}`}>
            {a.mal ? <CircleAlert size={16} /> : <Check size={16} />}<span>{a.msg}</span>
          </div>
        ))}
      </div>
    </C.Provider>
  );
}
