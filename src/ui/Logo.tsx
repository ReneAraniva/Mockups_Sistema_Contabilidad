import logotipo from "../assets/equus-logotipo.svg";
import isologo from "../assets/equus-isologo.svg";

/** Marca EQUUS (hub/Identidad-Visual-EQUUS.md). Solo versión clara sobre fondo oscuro; no deformar ni recolorear. */
export function Isologo({ alto = 28, className = "" }: { alto?: number; className?: string }) {
  return <img src={isologo} alt="EQUUS" height={alto} style={{ height: alto, width: "auto" }} className={className} draggable={false} />;
}

/** Logotipo horizontal completo (isologo, nombre y eslogan). Ancho mínimo 120 px; por debajo, usar `Isologo`. */
export function Logotipo({ ancho = 220, className = "" }: { ancho?: number; className?: string }) {
  return <img src={logotipo} alt="EQUUS · Tu mejor movimiento contable" width={ancho} style={{ width: ancho, height: "auto" }} className={className} draggable={false} />;
}
