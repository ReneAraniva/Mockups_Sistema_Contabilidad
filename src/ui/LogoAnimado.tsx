import { useId, type CSSProperties } from "react";

/** Logotipo EQUUS animado: el caballo se dibuja de un trazo, entra el nombre y se descubre el eslogan (~2.9 s).
 *  `parte` permite separar el isologo (caballo) del nombre con eslogan: ambos usan la misma escala y altura,
 *  así que puestos en fila se ven como el logotipo completo. Los estilos `eq-*` están en index.css. */
const CABALLO = "M359.0 390.1 309.0 390.1 305.8 389.0 303.6 386.0 302.7 373.0 302.7 356.0 303.9 338.0 305.7 324.0 308.9 308.0 311.9 297.0 314.9 288.0 321.9 272.0 330.8 257.0 336.8 249.0 343.0 242.0 348.9 236.0 356.0 229.8 366.0 222.8 374.0 218.0 389.0 210.9 397.3 208.0 408.0 205.0 419.0 202.9 432.0 201.3 445.0 200.8 450.0 201.8 452.4 204.0 453.2 207.0 452.3 210.0 450.0 212.1 448.0 212.7 441.0 212.7 428.0 213.6 415.0 215.8 403.0 218.8 397.0 220.7 385.0 225.7 374.0 231.7 368.0 235.6 363.9 239.0 363.9 240.0 365.5 242.0 366.2 244.0 366.1 247.0 365.0 248.7 362.0 250.6 352.0 250.8 350.0 251.7 341.7 262.0 336.5 270.0 334.6 274.0 335.6 275.0 339.0 275.8 341.0 277.5 342.2 281.0 341.3 284.0 339.3 286.0 338.0 286.5 330.0 286.7 329.0 286.9 327.7 288.0 323.6 299.0 321.7 307.0 323.0 307.7 334.0 307.8 336.0 308.4 337.1 309.0 338.7 311.0 339.3 313.0 339.3 315.0 338.0 317.5 335.0 319.4 321.0 319.6 319.0 320.0 318.3 321.0 316.6 331.0 315.7 340.0 316.0 341.0 318.0 341.7 350.0 341.9 352.0 342.9 353.1 344.0 354.1 346.0 354.2 349.0 353.0 351.4 350.0 353.3 317.0 353.5 315.4 354.0 314.6 356.0 314.8 376.0 316.0 377.7 318.0 378.3 358.0 378.4 361.0 378.7 363.0 380.0 364.0 381.4 364.7 385.0 364.0 387.0 363.0 388.2 361.0 389.6ZM467.0 390.1 392.0 390.1 390.0 389.9 388.3 389.0 384.9 385.0 381.6 379.0 378.6 371.0 376.7 363.0 375.5 355.0 374.9 343.0 376.2 320.0 375.0 319.4 358.6 319.0 356.4 318.0 354.0 316.0 352.7 314.0 351.7 310.0 352.9 304.0 356.7 292.0 363.0 278.0 367.0 271.0 371.8 264.0 379.0 255.2 385.0 248.8 393.0 241.9 400.0 236.9 408.1 232.0 417.0 227.8 428.3 224.0 434.0 222.8 444.0 221.4 448.0 222.3 449.7 224.0 450.6 227.0 450.0 229.8 447.9 232.0 445.0 233.1 439.0 233.8 431.0 235.6 424.0 237.8 417.0 240.8 404.0 248.5 399.0 252.3 391.5 259.0 383.4 268.0 374.7 281.0 368.6 294.0 365.4 303.0 365.1 305.0 365.3 306.0 367.0 307.4 386.0 307.8 388.1 309.0 389.5 311.0 390.0 314.0 388.4 325.0 387.5 337.0 387.7 353.0 388.6 361.0 390.4 369.0 392.8 375.0 395.0 377.8 398.0 378.4 452.0 378.4 455.0 377.8 456.4 376.0 456.3 373.0 452.4 366.0 446.5 358.0 443.0 354.6 439.0 351.6 435.0 349.5 426.2 346.0 423.0 344.1 417.9 339.0 414.8 333.0 413.0 326.7 412.4 321.0 412.5 312.0 414.6 300.0 416.8 295.0 419.6 292.0 422.0 290.6 425.0 289.5 429.0 289.2 433.0 290.0 436.7 292.0 440.5 295.0 447.0 301.5 453.2 310.0 456.1 316.0 458.6 324.0 460.0 325.5 467.0 324.4 472.0 323.1 478.9 320.0 482.0 317.4 482.0 316.0 475.6 302.0 468.8 283.0 464.8 269.0 462.3 255.0 461.4 241.0 462.8 228.0 465.4 220.0 467.5 218.0 470.0 217.4 472.0 217.7 474.0 219.0 475.4 221.0 475.8 223.0 473.4 235.0 473.0 244.0 474.1 256.0 476.6 268.0 479.5 278.0 483.6 290.0 488.4 302.0 495.1 316.0 495.2 318.0 494.6 320.0 492.2 324.0 489.0 327.1 484.9 330.0 478.9 333.0 473.5 335.0 464.5 337.0 454.0 338.1 451.0 337.3 448.9 335.0 446.4 324.0 443.4 317.0 438.0 309.0 432.0 303.5 429.0 303.2 426.3 305.0 425.3 308.0 424.3 318.0 424.5 323.0 425.4 328.0 428.3 333.0 431.0 335.3 440.0 338.8 448.6 344.0 452.2 347.0 456.0 351.1 463.0 360.7 468.0 370.3 472.5 383.0 472.2 386.0 471.1 388.0 469.0 389.5Z";
const VISTA = { completo: { vb: "40 185 680 250", w: 680, h: 250 }, caballo: { vb: "62 205 208 205", w: 208, h: 205 }, nombre: { vb: "300 205 330 205", w: 330, h: 205 } };

export function LogoAnimado({ parte = "completo", ancho = 340, escala, className = "" }: { parte?: "completo" | "caballo" | "nombre"; ancho?: number; escala?: number; className?: string }) {
  const id = useId().replace(/:/g, "");
  const v = VISTA[parte];
  const w = escala ? v.w * escala : ancho;
  return (
    <svg viewBox={v.vb} width={w} height={escala ? v.h * escala : undefined} style={{ width: w, maxWidth: "100%", height: escala ? v.h * escala : "auto" }} className={`eq-logo ${className}`} role="img" aria-label={parte === "completo" ? "EQUUS · Tu mejor movimiento contable" : parte === "caballo" ? "Isologo de EQUUS" : "EQUUS · Tu mejor movimiento contable"}>
      <defs>
        <mask id={`r${id}`} maskUnits="userSpaceOnUse" x="250" y="150" width="300" height="300">
          <path className="eq-mk" pathLength={1} style={{ "--d": "0s", "--t": "0.8s" } as CSSProperties} d="M308 386 L308 340 L310 310 L320 280 L335 255 L355 235 L385 218 L420 209 L452 207" />
          <path className="eq-mk" pathLength={1} style={{ "--d": "0.5s", "--t": "0.25s" } as CSSProperties} d="M308 386 L362 386" />
          <path className="eq-mk" pathLength={1} style={{ "--d": "0.55s", "--t": "0.25s" } as CSSProperties} d="M308 349 L354 349" />
          <path className="eq-mk" pathLength={1} style={{ "--d": "0.6s", "--t": "0.2s" } as CSSProperties} d="M322 314 L342 314" />
          <path className="eq-mk" pathLength={1} style={{ "--d": "0.65s", "--t": "0.2s" } as CSSProperties} d="M322 281 L340 281" />
          <path className="eq-mk" pathLength={1} style={{ "--d": "0.7s", "--t": "0.2s" } as CSSProperties} d="M345 243 L362 243" />
          <path className="eq-mk" pathLength={1} style={{ "--d": "0.25s", "--t": "0.7s" } as CSSProperties} d="M452 229 L415 232 L390 245 L372 270 L360 298 L372 312 L384 345 L390 386 L468 386" />
          <path className="eq-mk" pathLength={1} style={{ "--d": "0.7s", "--t": "0.5s" } as CSSProperties} d="M471 386 L470 372 L455 350 L435 335 L422 315 L430 296 L442 296 L448 312 L450 330 L462 335" />
          <path className="eq-mk" pathLength={1} style={{ "--d": "0.75s", "--t": "0.45s" } as CSSProperties} d="M473 216 L472 250 L480 285 L493 315 L485 327 L460 335" />
        </mask>
        <linearGradient id={`g${id}`} x1="0" y1="0" x2="1" y2="0"><stop offset="0.88" stopColor="#fff" /><stop offset="1" stopColor="#000" /></linearGradient>
        <mask id={`w${id}`} maskUnits="userSpaceOnUse" x="290" y="322" width="420" height="36"><rect className="eq-wipe" x="-200" y="320" width="500" height="40" fill={`url(#g${id})`} /></mask>
      </defs>
      {parte !== "nombre" && <g transform="translate(-233 12)"><g mask={`url(#r${id})`}><path className="eq-caballo" d={CABALLO} /></g></g>}
      {parte !== "caballo" && (
        <>
          <text className="eq-nombre" x="310" y="316" textLength="300" lengthAdjust="spacing">EQUUS</text>
          <g mask={`url(#w${id})`}><text className="eq-eslogan" x="311" y="346" textLength="300" lengthAdjust="spacing">TU MEJOR MOVIMIENTO CONTABLE</text></g>
        </>
      )}
    </svg>
  );
}
