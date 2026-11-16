/** Parámetros contables de la empresa (HU-12). Viven solo en memoria: el prototipo no guarda nada. */
export type Numeracion = "mes" | "ejercicio" | "tipo";
export type Formato = "clase" | "niif";
export type Metodo = "promedio" | "peps";
export type Sistema = "perpetuo" | "analitico";

export const PARAMS = {
  numeracion: "ejercicio" as Numeracion,
  formato: "clase" as Formato,
  metodo: "promedio" as Metodo,
  sistema: "perpetuo" as Sistema,
  /** Impuesto sobre la renta, % sobre la utilidad antes de impuesto (lo usa el cierre del ejercicio). */
  isr: 25,
  /** Reserva legal, % de la utilidad neta. */
  reserva: 7,
};
