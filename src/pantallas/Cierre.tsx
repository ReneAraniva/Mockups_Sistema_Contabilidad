import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, CircleAlert, CircleCheck, LockKeyholeOpen } from "lucide-react";
import { useApp } from "../contexto";
import { PARTIDAS_CHERO } from "../datos/ejemplo";
import { PARAMS } from "../datos/parametros";
import { EMPRESA_CHERO, calcularCierre, cent, enDinero } from "../datos/libros";
import { Marco, Permiso } from "../marco/Marco";
import { Area, Aviso, Boton, CabTarjeta, Campo, Dialogo, Etiqueta, Pagina, Pasos, Tarjeta, Titulo, cx, dinero } from "../ui";
import { Cifra, TablaCifras } from "../ui/reportes";
import type { Linea } from "../datos/ejemplo";

const PASOS = ["Validaciones", "Impuesto sobre la renta", "Partida de cierre", "Reapertura", "Confirmar"];
const MOTIVO_MIN = 10;
const sumaL = (ls: Linea[], k: "d" | "h") => ls.reduce((s, l) => s + cent(l[k]), 0);

/** Partida con líneas y su cuadre, para los pasos 2 a 4. */
function VistaPartida({ lineas }: { lineas: Linea[] }) {
  const d = sumaL(lineas, "d"), h = sumaL(lineas, "h");
  return (
    <>
      <TablaCifras
        clave={(l: Linea & { i?: number }) => l.c + l.d + l.h + lineas.indexOf(l)}
        filas={lineas}
        cols={[
          { clave: "c", titulo: "Código", ver: (l) => <span className="cifra text-texto2">{l.c}</span> },
          { clave: "n", titulo: "Cuenta", ver: (l) => l.n },
          { clave: "d", titulo: "Debe", tipo: "num", ver: (l) => <Cifra v={l.d} />, total: enDinero(d) },
          { clave: "h", titulo: "Haber", tipo: "num", ver: (l) => <Cifra v={l.h} />, total: enDinero(h) },
        ]}
      />
      <div className="px-5 py-3 border-t border-borde">
        {d === h
          ? <span className="inline-flex items-center gap-2 h-9 px-3.5 rounded-full bg-tarjeta2 text-sm font-semibold"><CircleCheck size={16} />La partida cuadra · US$ {dinero(enDinero(d))}</span>
          : <Aviso mal>La partida no cuadra: diferencia de US$ {dinero(Math.abs(enDinero(d - h)))}.</Aviso>}
      </div>
    </>
  );
}

/** HU-32 a HU-36: asistente de cierre del ejercicio (validaciones, ISR, partida de cierre, reapertura). */
export function Cierre() {
  const { avisar, puede } = useApp();
  const cierre = useMemo(calcularCierre, []);
  const [paso, setPaso] = useState(0);
  const [periodosCerrados, setPeriodosCerrados] = useState(false);
  const [hecho, setHecho] = useState(false);
  const [reabrir, setReabrir] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [reabierto, setReabierto] = useState(false);

  const borradores = PARTIDAS_CHERO.filter((p) => !p.estado).length;
  const sumaD = PARTIDAS_CHERO.reduce((t, p) => t + sumaL(p.lineas, "d"), 0);
  const sumaH = PARTIDAS_CHERO.reduce((t, p) => t + sumaL(p.lineas, "h"), 0);
  const validaciones = [
    { t: "No hay partidas en borrador", ok: borradores === 0, det: borradores ? `${borradores} borradores pendientes` : "Todas las partidas del ejercicio están contabilizadas o anuladas." },
    { t: "Los doce períodos del ejercicio están cerrados", ok: periodosCerrados, det: periodosCerrados ? "Enero a diciembre cerrados." : "Noviembre y diciembre siguen abiertos.",
      arreglo: () => { setPeriodosCerrados(true); avisar("Noviembre y diciembre cerrados"); }, accion: "Cerrar noviembre y diciembre" },
    { t: "Todas las partidas cuadran", ok: PARTIDAS_CHERO.every((p) => sumaL(p.lineas, "d") === sumaL(p.lineas, "h")), det: `${PARTIDAS_CHERO.length} partidas revisadas, debe y haber iguales.` },
    { t: "La balanza de comprobación cuadra", ok: sumaD === sumaH, det: `Debe y haber suman US$ ${dinero(enDinero(sumaD))}.` },
    { t: "Existe la cuenta liquidadora Pérdidas y Ganancias (6101)", ok: true, det: "Se usará para trasladar el resultado del ejercicio." },
  ];
  const todoOk = validaciones.every((v) => v.ok);
  const motivoOk = motivo.trim().length >= MOTIVO_MIN;
  const cerrarDialogo = () => { setReabrir(false); setMotivo(""); };

  const quien = puede("admin") ? "administrador" : "contador";
  const cuerpo = [
    /* 1 · Validaciones */
    <Tarjeta key="v" className="overflow-hidden">
      <CabTarjeta titulo="Antes de cerrar el ejercicio 2026" sub="Las cinco deben estar en orden para continuar" />
      <ul>
        {validaciones.map((v) => (
          <li key={v.t} className="flex items-start gap-3 px-5 py-4 border-b border-borde last:border-0">
            {v.ok ? <CircleCheck size={20} className="shrink-0 mt-0.5" /> : <CircleAlert size={20} className="shrink-0 mt-0.5 text-alerta" />}
            <div className="min-w-0 flex-1">
              <b className={cx("font-semibold", !v.ok && "text-alerta")}>{v.t}</b>
              <p className="text-sm text-texto2 mt-0.5">{v.det}</p>
            </div>
            {!v.ok && v.arreglo && <Boton peq onClick={v.arreglo}>{v.accion}</Boton>}
          </li>
        ))}
      </ul>
    </Tarjeta>,

    /* 2 · ISR */
    <div key="i" className="grid gap-5">
      <Tarjeta className="overflow-hidden">
        <CabTarjeta titulo="Cálculo del impuesto sobre la renta" sub={<>Tasa {PARAMS.isr}% · se define en <Link to="/parametros" className="underline underline-offset-4">Parámetros</Link></>} />
        <dl className="px-5 py-2 text-sm">
          {[
            ["Ingresos del ejercicio", cierre.totIng], ["(−) Costos y gastos", -cierre.totGas], ["Utilidad antes de impuesto", cierre.utilAntes],
            [`(−) Impuesto sobre la renta ${PARAMS.isr}%`, -cierre.isr], ["Utilidad neta", cierre.neta],
            [`(−) Reserva legal ${PARAMS.reserva}% de la utilidad neta`, -cierre.reserva], ["Utilidad que pasa a utilidades acumuladas", cierre.acumulada],
          ].map(([t, v], i) => (
            <div key={t as string} className={cx("flex justify-between gap-4 py-3 border-b border-borde last:border-0", [2, 4, 6].includes(i) && "font-bold")}>
              <dt>{t}</dt><dd><Cifra v={enDinero(v as number)} vacio="0.00" /></dd>
            </div>
          ))}
        </dl>
      </Tarjeta>
      <Tarjeta className="overflow-hidden">
        <CabTarjeta titulo="Partida de ajuste del impuesto" sub="Tipo Ajuste · se contabiliza al confirmar el cierre" />
        <VistaPartida lineas={cierre.lineasIsr} />
      </Tarjeta>
    </div>,

    /* 3 · Partida de cierre */
    <Tarjeta key="c" className="overflow-hidden">
      <CabTarjeta titulo="Partida de cierre" sub="Liquida ingresos, costos y gastos contra Pérdidas y Ganancias y traslada el resultado al patrimonio" />
      <VistaPartida lineas={cierre.lineasCierre} />
    </Tarjeta>,

    /* 4 · Reapertura */
    <div key="r" className="grid gap-5">
      <Aviso>Se crea el ejercicio 2027 con sus doce períodos abiertos y la partida de reapertura con los saldos de balance del 31/12/2026.</Aviso>
      <Tarjeta className="overflow-hidden">
        <CabTarjeta titulo="Partida de reapertura · 01/01/2027" sub="Solo cuentas de balance; las de resultado empiezan en cero" />
        <VistaPartida lineas={cierre.lineasReapertura} />
      </Tarjeta>
    </div>,

    /* 5 · Confirmar */
    <Tarjeta key="f" className="p-5 grid gap-4">
      {hecho ? (
        <>
          <div className="flex items-center gap-3"><CircleCheck size={28} /><div><h2 className="text-xl font-medium">Ejercicio 2026 cerrado</h2><p className="text-sm text-texto2">Quedó registrado en la bitácora.</p></div></div>
          <ul className="grid gap-2 text-sm">
            <li className="flex justify-between bg-fondo rounded-xl px-4 py-3"><span>Partida n.º 14 · Ajuste del impuesto</span><Cifra v={enDinero(cierre.isr)} /></li>
            <li className="flex justify-between bg-fondo rounded-xl px-4 py-3"><span>Partida n.º 15 · Cierre</span><Cifra v={enDinero(sumaL(cierre.lineasCierre, "d"))} /></li>
            <li className="flex justify-between bg-fondo rounded-xl px-4 py-3"><span>Partida n.º 1 del 2027 · Reapertura</span><Cifra v={enDinero(sumaL(cierre.lineasReapertura, "d"))} /></li>
          </ul>
          {reabierto ? <Aviso>El ejercicio 2026 se reabrió de forma excepcional. El motivo quedó en el ejercicio y en la bitácora.</Aviso> : (
            <Permiso roles={["admin"]}>
              <Aviso><b className="font-semibold">Reapertura excepcional.</b> Solo el administrador puede reabrir un ejercicio cerrado; el motivo es obligatorio.
                <button type="button" onClick={() => setReabrir(true)} className="ml-2 inline-flex items-center gap-1 font-semibold text-texto underline underline-offset-4"><LockKeyholeOpen size={14} />Reabrir ejercicio</button></Aviso>
            </Permiso>
          )}
          <Permiso roles={["contador"]}><p className="text-xs text-texto3">Si necesitas reabrir el ejercicio, pídeselo a un administrador.</p></Permiso>
          <Link to="/periodos" className="h-11 px-5 rounded-full bg-pri text-prit font-semibold inline-flex items-center justify-center w-fit">Ir a ejercicios y períodos</Link>
        </>
      ) : (
        <>
          <h2 className="text-xl font-medium">Resumen del cierre</h2>
          <ul className="grid gap-2 text-sm">
            {[["Utilidad antes de impuesto", cierre.utilAntes], ["Impuesto sobre la renta", cierre.isr], ["Utilidad neta", cierre.neta], ["Reserva legal", cierre.reserva]].map(([t, v]) => (
              <li key={t as string} className="flex justify-between bg-fondo rounded-xl px-4 py-3"><span>{t}</span><Cifra v={enDinero(v as number)} /></li>
            ))}
          </ul>
          <Aviso>Se contabilizarán tres partidas (ajuste del impuesto, cierre y reapertura) y el ejercicio 2026 quedará cerrado. Después solo un administrador puede reabrirlo.</Aviso>
        </>
      )}
    </Tarjeta>,
  ];

  const puedeSeguir = paso === 0 ? todoOk : true;
  return (
    <Marco ruta={[{ t: "Contabilidad" }, { t: "Cierre del ejercicio" }]}>
      <Pagina ancho="max-w-[1000px]">
        <Titulo t="Cierre del ejercicio 2026" sub={`${EMPRESA_CHERO} · cifras ilustrativas del caso CheroPhonex`} />
        <Pasos pasos={PASOS} actual={paso} />
        {cuerpo[paso]}
        {!hecho && (
          <div className="flex justify-between gap-3 flex-wrap">
            <Boton v="fan" disabled={paso === 0} onClick={() => setPaso(paso - 1)}><ArrowLeft size={16} />Atrás</Boton>
            {paso < 4
              ? <Boton v="pri" disabled={!puedeSeguir} onClick={() => setPaso(paso + 1)} title={!puedeSeguir ? "Resuelve las validaciones para continuar" : undefined}>Continuar<ArrowRight size={16} /></Boton>
              : <Boton v="pri" onClick={() => { setHecho(true); avisar(`Ejercicio 2026 cerrado por el ${quien}`); }}>Cerrar el ejercicio 2026</Boton>}
          </div>
        )}
      </Pagina>

      <Dialogo abierto={reabrir} onCerrar={cerrarDialogo} titulo="Reabrir el ejercicio 2026"
        sub="Es una acción excepcional: se anulan las partidas de cierre y reapertura y los doce períodos quedan abiertos."
        pie={<><Boton v="fan" onClick={cerrarDialogo}>Cancelar</Boton>
          <Boton v="pel" disabled={!motivoOk} onClick={() => { cerrarDialogo(); setReabierto(true); avisar("Ejercicio 2026 reabierto"); }}>Reabrir ejercicio</Boton></>}>
        <Campo label="Motivo" ayuda={`Mínimo ${MOTIVO_MIN} caracteres · queda en el ejercicio y en la bitácora`}
          error={motivo.length > 0 && !motivoOk ? `Faltan ${MOTIVO_MIN - motivo.trim().length} caracteres.` : undefined}>
          <Area rows={3} value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ej. Falta registrar una factura de diciembre." />
        </Campo>
        <Etiqueta t="desc">Solo administrador</Etiqueta>
      </Dialogo>
    </Marco>
  );
}
