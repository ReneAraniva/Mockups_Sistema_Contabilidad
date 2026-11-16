import { useState } from "react";
import { Lock } from "lucide-react";
import { useApp } from "../contexto";
import { PARTIDAS_CHERO } from "../datos/ejemplo";
import { PARAMS, type Formato, type Metodo, type Numeracion, type Sistema } from "../datos/parametros";
import { Marco } from "../marco/Marco";
import { Aviso, Boton, CabTarjeta, Campo, Entrada, Pagina, Segmento, Tarjeta, Titulo } from "../ui";

const pct = (v: string) => { const n = parseFloat(v.replace(",", ".")); return isNaN(n) ? NaN : n; };
const errPct = (v: string) => (isNaN(pct(v)) ? "Escribe un número." : pct(v) < 0 || pct(v) > 100 ? "Debe estar entre 0 y 100." : "");

/** HU-12: parámetros contables de la empresa. Los que afectan cálculos se bloquean cuando ya hay movimientos. */
export function Parametros() {
  const { avisar } = useApp();
  const [numeracion, setNumeracion] = useState<Numeracion>(PARAMS.numeracion);
  const [formato, setFormato] = useState<Formato>(PARAMS.formato);
  const [metodo, setMetodo] = useState<Metodo>(PARAMS.metodo);
  const [sistema, setSistema] = useState<Sistema>(PARAMS.sistema);
  const [isr, setIsr] = useState(String(PARAMS.isr));
  const [reserva, setReserva] = useState(String(PARAMS.reserva));
  const movimientos = PARTIDAS_CHERO.length; // hay partidas contabilizadas: se bloquean numeración, método y sistema
  const bloqueado = movimientos > 0;
  const mal = !!errPct(isr) || !!errPct(reserva);
  const Candado = () => <span className="inline-flex items-center gap-1.5 text-xs text-texto3"><Lock size={13} />Bloqueado: ya hay {movimientos} partidas</span>;

  return (
    <Marco ruta={[{ t: "Administración" }, { t: "Parámetros" }]}>
      <Pagina ancho="max-w-[820px]">
        <Titulo t="Parámetros de la empresa" sub="CheroPhonex · lo que afecta cálculos se bloquea cuando ya hay movimientos" />
        {bloqueado && <Aviso>Esta empresa ya tiene {movimientos} partidas. La numeración, el método de valuación y el sistema de inventario no se pueden cambiar.</Aviso>}

        <Tarjeta>
          <CabTarjeta titulo="Partidas" sub="Cómo se numeran al contabilizarse">{bloqueado && <Candado />}</CabTarjeta>
          <div className="p-5 grid gap-2">
            <Segmento valor={numeracion} onChange={(v) => !bloqueado && setNumeracion(v)} opciones={[{ v: "mes", t: "Por mes" }, { v: "ejercicio", t: "Por ejercicio" }, { v: "tipo", t: "Por tipo" }]} />
            <p className="text-sm text-texto2">{{ mes: "El correlativo vuelve a 1 cada mes.", ejercicio: "Un solo correlativo para todo el ejercicio.", tipo: "Un correlativo distinto para cada tipo de partida." }[numeracion]}</p>
          </div>
        </Tarjeta>

        <Tarjeta>
          <CabTarjeta titulo="Estados financieros" sub="Formato en que se presentan" />
          <div className="p-5"><Segmento valor={formato} onChange={setFormato} opciones={[{ v: "clase", t: "De clase" }, { v: "niif", t: "NIIF para las PYMES" }]} /></div>
        </Tarjeta>

        <Tarjeta>
          <CabTarjeta titulo="Inventario" sub="Valuación y sistema por defecto">{bloqueado && <Candado />}</CabTarjeta>
          <div className="p-5 grid gap-4 sm:grid-cols-2">
            <Campo label="Método de valuación"><Segmento valor={metodo} onChange={(v) => !bloqueado && setMetodo(v)} opciones={[{ v: "promedio", t: "Costo promedio" }, { v: "peps", t: "PEPS" }]} /></Campo>
            <Campo label="Sistema"><Segmento valor={sistema} onChange={(v) => !bloqueado && setSistema(v)} opciones={[{ v: "perpetuo", t: "Perpetuo" }, { v: "analitico", t: "Analítico" }]} /></Campo>
          </div>
        </Tarjeta>

        <Tarjeta>
          <CabTarjeta titulo="Impuesto y reserva" sub="Los usa el asistente de cierre del ejercicio" />
          <div className="p-5 grid gap-4 sm:grid-cols-2">
            <Campo label="Impuesto sobre la renta (%)" ayuda="Sobre la utilidad antes de impuesto. Verifica la tasa con la normativa vigente." error={errPct(isr) || undefined}>
              <Entrada value={isr} onChange={(e) => setIsr(e.target.value)} inputMode="decimal" mal={!!errPct(isr)} className="cifra text-right" />
            </Campo>
            <Campo label="Reserva legal (%)" ayuda="Sobre la utilidad neta." error={errPct(reserva) || undefined}>
              <Entrada value={reserva} onChange={(e) => setReserva(e.target.value)} inputMode="decimal" mal={!!errPct(reserva)} className="cifra text-right" />
            </Campo>
          </div>
        </Tarjeta>

        <div className="flex justify-end">
          <Boton v="pri" disabled={mal} onClick={() => {
            Object.assign(PARAMS, { numeracion, formato, metodo, sistema, isr: pct(isr), reserva: pct(reserva) });
            avisar("Parámetros guardados");
          }}>Guardar parámetros</Boton>
        </div>
      </Pagina>
    </Marco>
  );
}
