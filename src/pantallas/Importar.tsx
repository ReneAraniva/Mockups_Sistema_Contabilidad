import { useState } from "react";
import { Link } from "react-router-dom";
import { CircleCheck, Download, FileSpreadsheet, ListTree, Scale, Upload, X } from "lucide-react";
import { Marco } from "../marco/Marco";
import { Aviso, Boton, Etiqueta, Pagina, Pasos, Segmento, Tarjeta, Titulo, cx, td, th } from "../ui";

const ERRORES = [
  { f: 14, col: "Código", v: "11030", msg: "Tiene 5 dígitos; usa 1, 2, 4, 6, 8 o 10." },
  { f: 22, col: "Código", v: "210301", msg: "Su cuenta padre 2103 no existe en el archivo ni en el catálogo." },
  { f: 37, col: "Naturaleza", v: "Debe", msg: "Escribe Deudora o Acreedora." },
];

/** HU-17: importación del catálogo y de los saldos iniciales desde Excel (todo o nada). */
export function Importar() {
  const [paso, setPaso] = useState(0);
  const [tipo, setTipo] = useState<"catalogo" | "saldos">("catalogo");
  const [archivo, setArchivo] = useState("");
  const [conErrores, setConErrores] = useState(true);
  const filas = tipo === "catalogo" ? 128 : 34;

  return (
    <Marco ruta={[{ t: "Contabilidad" }, { t: "Importar desde Excel" }]}>
      <Pagina ancho="max-w-[1000px]">
        <Titulo t="Importar desde Excel" sub="Si alguna fila tiene errores no se carga nada; corrige el archivo y vuelve a subirlo." />
        <Pasos pasos={["Qué importar", "Subir archivo", "Validación", "Listo"]} actual={paso} />

        {paso === 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {([["catalogo", ListTree, "Catálogo de cuentas", "Código, nombre y naturaleza. Se agregan al catálogo precargado."], ["saldos", Scale, "Saldos iniciales", "Saldo de cada cuenta imputable. Genera la partida de apertura en borrador."]] as const).map(([v, I, t, d]) => (
              <button key={v} type="button" onClick={() => setTipo(v)} aria-pressed={tipo === v}
                className={cx("text-left bg-tarjeta border rounded-2xl p-5 grid gap-3 transition-colors", tipo === v ? "border-texto" : "border-borde hover:border-bordef")}>
                <span className="flex justify-between items-start"><span className="w-10 h-10 rounded-xl bg-tarjeta2 grid place-items-center"><I size={19} /></span>
                  <span className={cx("w-5 h-5 rounded-full border-2 grid place-items-center", tipo === v ? "border-texto" : "border-bordef")}>{tipo === v && <span className="w-2.5 h-2.5 rounded-full bg-texto" />}</span></span>
                <b className="font-semibold text-base">{t}</b><span className="text-texto2 text-sm">{d}</span>
              </button>
            ))}
            <Tarjeta className="sm:col-span-2 p-5 flex items-center gap-4 flex-wrap">
              <FileSpreadsheet size={22} className="text-texto2" />
              <div className="flex-1 min-w-[200px]"><b className="font-semibold">Plantilla de {tipo === "catalogo" ? "catálogo" : "saldos iniciales"}</b><p className="text-sm text-texto2">Usa siempre la plantilla: las columnas deben quedar en el mismo orden.</p></div>
              <Boton peq><Download size={15} />Descargar .xlsx</Boton>
            </Tarjeta>
            <div className="sm:col-span-2 flex justify-end"><Boton v="pri" onClick={() => setPaso(1)}>Continuar</Boton></div>
          </div>
        )}

        {paso === 1 && (
          <div className="grid gap-4">
            {!archivo ? (
              <button type="button" onClick={() => setArchivo(tipo === "catalogo" ? "catalogo_comercial_oriente.xlsx" : "saldos_iniciales_2026.xlsx")}
                className="border-[1.5px] border-dashed border-bordef hover:border-texto2 rounded-2xl py-14 px-5 grid justify-items-center gap-2 text-center transition-colors">
                <span className="w-12 h-12 rounded-2xl bg-tarjeta grid place-items-center"><Upload size={22} /></span>
                <b className="font-semibold text-base">Arrastra el archivo o haz clic para elegirlo</b>
                <span className="text-texto2 text-sm">Excel .xlsx · hasta 5 MB</span>
              </button>
            ) : (
              <Tarjeta className="p-4 flex items-center gap-4">
                <span className="w-10 h-10 rounded-xl bg-tarjeta2 grid place-items-center"><FileSpreadsheet size={19} /></span>
                <div className="flex-1 min-w-0"><b className="font-semibold block truncate">{archivo}</b><span className="text-xs text-texto3">{filas} filas · 48 KB</span></div>
                <button type="button" aria-label="Quitar archivo" onClick={() => setArchivo("")} className="w-9 h-9 rounded-full grid place-items-center text-texto3 hover:bg-tarjeta2"><X size={17} /></button>
              </Tarjeta>
            )}
            <div className="flex items-center gap-3 text-sm text-texto2 flex-wrap">Simular un archivo
              <Segmento valor={conErrores ? "si" : "no"} onChange={(v) => setConErrores(v === "si")} opciones={[{ v: "si", t: "con errores" }, { v: "no", t: "correcto" }]} />
            </div>
            <div className="flex justify-between gap-2"><Boton v="fan" onClick={() => setPaso(0)}>Atrás</Boton><Boton v="pri" disabled={!archivo} onClick={() => setPaso(2)}>Validar archivo</Boton></div>
          </div>
        )}

        {paso === 2 && (
          <div className="grid gap-4">
            {conErrores ? (
              <>
                <Aviso mal><b>{ERRORES.length} filas con errores.</b> No se importó nada. Corrige estas filas en el archivo y vuelve a subirlo.</Aviso>
                <Tarjeta className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead><tr><th className={th}>Fila</th><th className={th}>Columna</th><th className={th}>Valor</th><th className={th}>Qué corregir</th></tr></thead>
                    <tbody>{ERRORES.map((e) => (
                      <tr key={e.f}><td className={cx(td, "cifra text-texto2")}>{e.f}</td><td className={td}>{e.col}</td><td className={cx(td, "cifra")}>{e.v}</td><td className={cx(td, "text-alerta text-sm")}>{e.msg}</td></tr>
                    ))}</tbody>
                  </table>
                </Tarjeta>
                <div className="flex justify-between gap-2 flex-wrap"><Boton peq><Download size={15} />Descargar reporte de errores</Boton>
                  <Boton v="pri" onClick={() => { setArchivo(""); setPaso(1); }}>Subir archivo corregido</Boton></div>
              </>
            ) : (
              <>
                <Tarjeta className="p-5 grid gap-1"><span className="flex items-center gap-2 font-semibold text-base"><CircleCheck size={19} />Las {filas} filas son válidas</span>
                  <p className="text-texto2 text-sm">{tipo === "catalogo" ? "Se agregarán 96 cuentas nuevas y se actualizarán 32 nombres." : "Debe y haber suman US$ 98,450.20. Se generará la partida de apertura en borrador."}</p></Tarjeta>
                <div className="flex justify-between gap-2"><Boton v="fan" onClick={() => setPaso(1)}>Atrás</Boton><Boton v="pri" onClick={() => setPaso(3)}>Importar {filas} filas</Boton></div>
              </>
            )}
          </div>
        )}

        {paso === 3 && (
          <Tarjeta className="p-10 grid justify-items-center gap-3 text-center">
            <span className="w-14 h-14 rounded-2xl bg-pri text-prit grid place-items-center"><CircleCheck size={26} /></span>
            <h2 className="text-xl">Importación completa</h2>
            <p className="text-texto2 max-w-md">{tipo === "catalogo" ? "El catálogo ya tiene las cuentas nuevas." : "La partida de apertura quedó en borrador en la bandeja de pendientes para que el contador la revise."}</p>
            <div className="flex gap-2 mt-2 flex-wrap justify-center">
              <Boton onClick={() => { setPaso(0); setArchivo(""); }}>Importar otro archivo</Boton>
              <Link to={tipo === "catalogo" ? "/catalogo" : "/pendientes"} className="h-11 px-5 rounded-full bg-pri text-prit font-semibold inline-flex items-center">
                {tipo === "catalogo" ? "Ver catálogo" : "Ir a pendientes"}</Link>
            </div>
            <Etiqueta t="neutra">Registrado en la bitácora</Etiqueta>
          </Tarjeta>
        )}
      </Pagina>
    </Marco>
  );
}
