import { hex } from "../datos/sprint4";

/** Código QR ilustrativo: tiene la forma de un QR (tres esquinas de posición y módulos al azar fijados por el valor),
 *  pero no se puede escanear. En el sistema real lo genera la librería de QR con la URL de consulta. */
export function Qr({ valor, tam = 112 }: { valor: string; tam?: number }) {
  const N = 25;
  let semilla = 0; for (const c of valor) semilla = (semilla * 31 + c.charCodeAt(0)) >>> 0;
  const bits = hex(semilla, 160).split("").map((h) => parseInt(h, 16));
  const finder = (x: number, y: number) => (x < 7 && y < 7) || (x >= N - 7 && y < 7) || (x < 7 && y >= N - 7);
  const celdas: [number, number][] = [];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    if (finder(x, y)) {
      const ex = x >= N - 7 ? x - (N - 7) : x, ey = y >= N - 7 ? y - (N - 7) : y;
      const borde = ex === 0 || ex === 6 || ey === 0 || ey === 6, centro = ex >= 2 && ex <= 4 && ey >= 2 && ey <= 4;
      if (borde || centro) celdas.push([x, y]);
    } else if (bits[(y * N + x) % bits.length] % 2 === (x + y) % 2) celdas.push([x, y]);
  }
  return (
    <svg viewBox={`-1 -1 ${N + 2} ${N + 2}`} width={tam} height={tam} role="img" aria-label="Código QR de consulta (ilustrativo)" shapeRendering="crispEdges" fill="currentColor">
      {celdas.map(([x, y]) => <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" />)}
    </svg>
  );
}
