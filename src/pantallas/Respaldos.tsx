import { useState } from "react";
import { Download, History, Plus, RotateCcw } from "lucide-react";
import { useApp } from "../contexto";
import { EMPRESA_OFICIAL, RESPALDOS, type Respaldo } from "../datos/caso";
import { Marco, Permiso } from "../marco/Marco";
import { Aviso, Boton, Campo, Dialogo, Entrada, Etiqueta, Pagina, Segmento, Selector, Tarjeta, Titulo } from "../ui";
import { TablaCifras } from "../ui/reportes";

/** HU-13: respaldo y restauración por empresa; se puede respaldar una sola sucursal, pero se restaura la empresa completa. */
export function Respaldos() {
  const { avisar, usuario } = useApp();
  const [lista, setLista] = useState<Respaldo[]>(RESPALDOS);
  const [crear, setCrear] = useState(false);
  const [alcance, setAlcance] = useState<"empresa" | "sucursal">("empresa");
  const [suc, setSuc] = useState("Metrocentro");
  const [rest, setRest] = useState<Respaldo | null>(null);
  const [texto, setTexto] = useState("");

  const generar = () => {
    const id = "r" + (lista.length + 1);
    const nuevo: Respaldo = { id, fecha: "01/11/2026 09:30", alcance: alcance === "empresa" ? "Empresa completa" : `Sucursal ${suc}`, tipo: "Manual", tamano: "—", autor: usuario.nombre, estado: "En proceso" };
    setLista([nuevo, ...lista]); setCrear(false);
    setTimeout(() => { setLista((l) => l.map((r) => (r.id === id ? { ...r, estado: "Listo", tamano: alcance === "empresa" ? "4.2 MB" : "1.3 MB" } : r))); avisar("Respaldo listo para descargar"); }, 1800);
  };
  const confirmado = texto.trim() === EMPRESA_OFICIAL;

  return (
    <Marco ruta={[{ t: "Administración" }, { t: "Respaldos" }]}>
      <Pagina ancho="max-w-[1000px]">
        <Titulo t="Respaldos" sub="Cada empresa se respalda y se restaura por separado, sin afectar a las demás">
          <Permiso roles={["admin", "contador"]}><Boton v="pri" onClick={() => setCrear(true)}><Plus size={17} />Crear respaldo</Boton></Permiso>
        </Titulo>
        <Aviso>Se hace un respaldo automático cada noche a las 2:00 y se conservan los últimos 30. El archivo descargable contiene todos los datos de {EMPRESA_OFICIAL}.</Aviso>
        <Tarjeta className="overflow-hidden">
          <TablaCifras<Respaldo> clave={(r) => r.id} filas={lista} totales={false}
            tarjeta={(r) => ({ meta: `${r.fecha} · ${r.tipo}`, estado: <Etiqueta t={r.estado === "Listo" ? "contab" : "borrador"}>{r.estado}</Etiqueta>, titulo: r.alcance, valor: r.tamano, detalle: `Por ${r.autor}` })}
            cols={[
              { clave: "f", titulo: "Fecha", ver: (r) => <span className="cifra whitespace-nowrap">{r.fecha}</span> },
              { clave: "a", titulo: "Alcance", ver: (r) => r.alcance },
              { clave: "t", titulo: "Tipo", ver: (r) => r.tipo },
              { clave: "au", titulo: "Autor", ver: (r) => r.autor },
              { clave: "s", titulo: "Tamaño", tipo: "num", ver: (r) => <span className="cifra">{r.tamano}</span> },
              { clave: "e", titulo: "Estado", ver: (r) => <Etiqueta t={r.estado === "Listo" ? "contab" : "borrador"}>{r.estado}</Etiqueta> },
              { clave: "x", titulo: "", ver: (r) => (
                <span className="inline-flex gap-2 justify-end w-full">
                  <Boton peq disabled={r.estado !== "Listo"} onClick={() => avisar("Respaldo descargado")}><Download size={14} />Descargar</Boton>
                  <Permiso roles={["admin"]}><Boton peq disabled={r.estado !== "Listo" || r.alcance !== "Empresa completa"} title={r.alcance !== "Empresa completa" ? "Solo se restaura la empresa completa" : undefined} onClick={() => { setRest(r); setTexto(""); }}><RotateCcw size={14} />Restaurar</Boton></Permiso>
                </span>) },
            ]} />
        </Tarjeta>
        <p className="text-xs text-texto3 inline-flex items-center gap-2"><History size={14} />Crear y restaurar respaldos queda registrado en la bitácora.</p>
      </Pagina>

      <Dialogo abierto={crear} onCerrar={() => setCrear(false)} titulo="Crear respaldo" sub="El archivo se genera y queda disponible para descargar."
        pie={<><Boton v="fan" onClick={() => setCrear(false)}>Cancelar</Boton><Boton v="pri" onClick={generar}>Crear respaldo</Boton></>}>
        <Segmento valor={alcance} onChange={setAlcance} opciones={[{ v: "empresa", t: "Empresa completa" }, { v: "sucursal", t: "Una sucursal" }]} />
        {alcance === "sucursal" && <Campo label="Sucursal"><Selector value={suc} onChange={(e) => setSuc(e.target.value)}>{["Casa matriz", "Metrocentro"].map((s) => <option key={s}>{s}</option>)}</Selector></Campo>}
        {alcance === "sucursal" && <p className="text-xs text-texto2">El respaldo de una sucursal sirve para exportar su información; no se puede restaurar por separado.</p>}
      </Dialogo>

      <Dialogo abierto={!!rest} onCerrar={() => setRest(null)} titulo="Restaurar la empresa" sub={rest ? `Respaldo del ${rest.fecha}` : undefined}
        pie={<><Boton v="fan" onClick={() => setRest(null)}>Cancelar</Boton><Boton v="pri" disabled={!confirmado} onClick={() => { setRest(null); avisar("Empresa restaurada · registrado en la bitácora"); }}>Restaurar empresa</Boton></>}>
        <Aviso mal><b className="font-semibold">Esta acción reemplaza todos los datos actuales de {EMPRESA_OFICIAL}.</b> Todo lo registrado después de esa fecha se pierde. Antes de restaurar, el sistema crea un respaldo automático del estado actual.</Aviso>
        <Campo label={`Para confirmar, escribe «${EMPRESA_OFICIAL}»`}><Entrada value={texto} onChange={(e) => setTexto(e.target.value)} mal={!!texto && !confirmado} autoComplete="off" /></Campo>
      </Dialogo>
    </Marco>
  );
}
