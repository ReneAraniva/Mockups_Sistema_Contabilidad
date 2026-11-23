import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, Loader2, MailCheck } from "lucide-react";
import { useApp } from "../contexto";
import { Boton, Campo, Entrada, errorCorreo } from "../ui";
import { LogoAnimado } from "../ui/LogoAnimado";

const GRANDE = "!h-14 !px-4 !text-base !rounded-2xl";
const BOTON_GRANDE = "!h-14 !text-base";

const TITULAR = "Tu contabilidad, clara y al centavo.";
const BAJADA = "Partidas, libros, IVA y estados financieros de todas tus empresas y sucursales en un mismo lugar.";
/** La introducción se anima la primera vez que se entra; al pasar entre acceso y recuperar ya no se repite. */
let introVista = false;

/** Escribe los textos uno tras otro, como una máquina de escribir, cuando termina el logotipo animado.
 *  Devuelve cuántas letras lleva cada texto y cuál se está escribiendo (para el cursor). */
function useMaquina(textos: string[], inicio: number, ms: number[], animar: boolean) {
  const [n, setN] = useState<number[]>(() => textos.map((t) => (animar ? 0 : t.length)));
  const [fin, setFin] = useState(!animar);
  const [ini, setIni] = useState(false);
  useEffect(() => {
    if (!animar) return;
    let linea = 0, car = 0, cancelado = false;
    let t: ReturnType<typeof setTimeout>;
    const paso = () => {
      if (cancelado) return;
      car++;
      setIni(true);
      const l = linea, c = car;
      setN((prev) => prev.map((x, i) => (i === l ? c : x)));
      if (car >= textos[linea].length) {
        linea++; car = 0;
        if (linea >= textos.length) { t = setTimeout(() => !cancelado && setFin(true), 2500); return; }
        t = setTimeout(paso, 450);
      } else t = setTimeout(paso, ms[linea]);
    };
    t = setTimeout(paso, inicio);
    return () => { cancelado = true; clearTimeout(t); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const activa = n.findIndex((x, i) => x < textos[i].length);
  return { n, cursor: fin || !ini ? -1 : activa === -1 ? textos.length - 1 : activa };
}

/** Texto a medio escribir: lo que falta se reserva invisible para que nada se mueva ni cambie de línea. */
function Escrito({ texto, n, cursor }: { texto: string; n: number; cursor: boolean }) {
  return (
    <span aria-hidden>
      {texto.slice(0, n)}{cursor && <i className="eq-cursor" />}<span className="invisible">{texto.slice(n)}</span>
    </span>
  );
}

function MarcoAcceso({ children }: { children: ReactNode }) {
  const reducir = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const animar = useRef(!introVista && !reducir).current;
  useEffect(() => { introVista = true; }, []);
  const { n, cursor } = useMaquina([TITULAR, BAJADA], 4100, [46, 14], animar);
  const quieto = animar ? "" : "eq-quieto";
  return (
    <div className="min-h-screen grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <aside className="hidden lg:flex flex-col justify-between bg-barra border-r border-borde p-12 xl:p-16">
        <span aria-hidden />
        {/* El logotipo completo aparece; el nombre se desvanece y el titular se escribe en su lugar, junto al caballo. */}
        <div className="max-w-[472px]">
          <div className="flex items-center gap-7">
            <LogoAnimado parte="caballo" escala={0.62} className={quieto} />
            <div className="relative flex-1 min-w-0">
              <h2 aria-label={TITULAR} className="text-[34px] xl:text-[38px] leading-[1.12] font-light tracking-tight"><Escrito texto={TITULAR} n={n[0]} cursor={cursor === 0} /></h2>
              <div className={`eq-sale ${quieto} absolute inset-0 flex items-center`}><LogoAnimado parte="nombre" escala={0.94} className={quieto} /></div>
            </div>
          </div>
          <p aria-label={BAJADA} className="text-texto2 mt-9 text-lg"><Escrito texto={BAJADA} n={n[1]} cursor={cursor === 1} /></p>
        </div>
        <div className="flex items-center gap-6 text-texto3 text-sm">
          <b className="font-semibold tracking-[.28em] text-texto2 text-xs">EQUUS</b>
          <span className="w-px h-3.5 bg-bordef" />
          <span>Multiempresa</span><span>Multisucursal</span><span>US$ · dd/mm/aaaa</span>
        </div>
      </aside>
      <main className="flex flex-col items-center justify-center px-4 py-10 sm:px-8">
        <div className="lg:hidden mb-10 flex items-center justify-center gap-3"><LogoAnimado parte="caballo" escala={0.46} className={quieto} /><LogoAnimado parte="nombre" escala={0.68} className={quieto} /></div>
        <div className="w-full max-w-[520px]">{children}</div>
        <Link to="/" className="mt-10 text-sm text-texto3 hover:text-texto2">Índice del prototipo</Link>
      </main>
    </div>
  );
}

/** HU-05: inicio de sesión con correo y contraseña. En el prototipo entra con cualquier correo y contraseña. */
export function Login() {
  const ir = useNavigate();
  const { setCorreo: guardarCorreo } = useApp();
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [ver, setVer] = useState(false);
  const [intento, setIntento] = useState(false);
  const [tocado, setTocado] = useState(false);
  const [cargando, setCargando] = useState(false);
  const errCorreo = errorCorreo(correo);
  const verErrCorreo = (intento || (tocado && !!correo.trim())) && !!errCorreo;
  const errClave = !clave ? "Escribe tu contraseña." : "";

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    setIntento(true);
    if (errCorreo || errClave) return;
    setCargando(true);
    guardarCorreo(correo);
    setTimeout(() => ir("/tablero"), 700);
  };

  return (
    <MarcoAcceso>
      <h1 className="text-[40px] leading-tight font-normal tracking-tight">Inicia sesión</h1>
      <p className="text-texto2 mt-2 text-lg">Ingresa tu correo y contraseña para continuar.</p>
      <form onSubmit={enviar} className="grid gap-5 mt-10" noValidate>
        <Campo grande label="Correo electrónico" error={verErrCorreo ? errCorreo : undefined}>
          <Entrada type="email" autoComplete="email" autoFocus value={correo} onChange={(e) => setCorreo(e.target.value)}
            onBlur={() => setTocado(true)} aria-invalid={verErrCorreo}
            placeholder="Ej: chero@gmail.com" mal={verErrCorreo} className={GRANDE} />
        </Campo>
        <Campo grande label="Contraseña" error={intento ? errClave : undefined}>
          <div className="relative">
            <Entrada type={ver ? "text" : "password"} autoComplete="current-password" value={clave} onChange={(e) => setClave(e.target.value)}
              placeholder="Escribe tu contraseña" mal={intento && !!errClave} className={GRANDE + " pr-14"} />
            <button type="button" onClick={() => setVer(!ver)} aria-label={ver ? "Ocultar contraseña" : "Mostrar contraseña"}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full grid place-items-center text-texto3 hover:text-texto">
              {ver ? <EyeOff size={19} /> : <Eye size={19} />}
            </button>
          </div>
        </Campo>
        <div className="flex justify-end -mt-1">
          <Link to="/recuperar" className="text-base text-texto2 hover:text-texto underline underline-offset-4 decoration-bordef">¿Olvidaste tu contraseña?</Link>
        </div>
        <Boton v="pri" type="submit" disabled={cargando} className={"w-full mt-2 " + BOTON_GRANDE}>
          {cargando ? <><Loader2 size={18} className="animate-spin" />Entrando…</> : "Entrar"}
        </Boton>
        <p className="text-center text-sm text-texto3">Prototipo: entra con cualquier correo y contraseña.</p>
      </form>
    </MarcoAcceso>
  );
}

/** HU-05: recuperación de contraseña por correo. */
export function Recuperar() {
  const ir = useNavigate();
  const { avisar } = useApp();
  const [paso, setPaso] = useState<1 | 2 | 3>(1);
  const [correo, setCorreo] = useState("");
  const [tocado, setTocado] = useState(false);
  const errC = errorCorreo(correo);
  const [c1, setC1] = useState(""), [c2, setC2] = useState("");
  const corto = c1.length > 0 && c1.length < 8;
  const distinta = c2.length > 0 && c1 !== c2;

  return (
    <MarcoAcceso>
      <Link to="/login" className="inline-flex items-center gap-2 text-sm text-texto2 hover:text-texto mb-8"><ArrowLeft size={15} />Volver a iniciar sesión</Link>
      {paso === 1 && (
        <>
          <h1 className="text-[40px] leading-tight font-normal tracking-tight">Recupera tu contraseña</h1>
          <p className="text-texto2 mt-2 text-lg">Te enviaremos un enlace para crear una nueva.</p>
          <form className="grid gap-4 mt-8" onSubmit={(e) => { e.preventDefault(); setTocado(true); if (!errC) setPaso(2); }} noValidate>
            <Campo grande label="Correo electrónico" error={tocado && errC ? errC : undefined}><Entrada type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} onBlur={() => correo && setTocado(true)} mal={tocado && !!errC} placeholder="Ej: chero@gmail.com" className={GRANDE} /></Campo>
            <Boton v="pri" type="submit" className={"w-full " + BOTON_GRANDE}>Enviar enlace</Boton>
          </form>
        </>
      )}
      {paso === 2 && (
        <div className="grid gap-4">
          <span className="w-14 h-14 rounded-2xl bg-tarjeta border border-borde grid place-items-center"><MailCheck size={24} /></span>
          <h1 className="text-[40px] leading-tight font-normal tracking-tight">Revisa tu correo</h1>
          <p className="text-texto2 text-lg">Si <b className="text-texto">{correo}</b> tiene una cuenta, recibirás el enlace en unos minutos. Vence en una hora.</p>
          <Boton v="pri" onClick={() => setPaso(3)} className={"w-full mt-4 " + BOTON_GRANDE}>Abrir el enlace del correo (simulación)</Boton>
          <Boton v="fan" onClick={() => avisar("Enlace reenviado")} className={"w-full " + BOTON_GRANDE}>Reenviar</Boton>
        </div>
      )}
      {paso === 3 && (
        <>
          <h1 className="text-[40px] leading-tight font-normal tracking-tight">Crea una contraseña nueva</h1>
          <p className="text-texto2 mt-2 text-lg">Al menos 8 caracteres.</p>
          <form className="grid gap-4 mt-8" onSubmit={(e) => { e.preventDefault(); avisar("Contraseña actualizada"); ir("/login"); }}>
            <Campo grande label="Nueva contraseña" error={corto ? "Faltan caracteres: mínimo 8." : undefined}><Entrada type="password" value={c1} onChange={(e) => setC1(e.target.value)} mal={corto} className={GRANDE} placeholder="Escribe tu nueva contraseña" /></Campo>
            <Campo grande label="Repite la contraseña" error={distinta ? "Las contraseñas no coinciden." : undefined}><Entrada type="password" value={c2} onChange={(e) => setC2(e.target.value)} mal={distinta} className={GRANDE} placeholder="Escríbela otra vez" /></Campo>
            <Boton v="pri" type="submit" disabled={c1.length < 8 || c1 !== c2} className={"w-full mt-2 " + BOTON_GRANDE}>Guardar contraseña</Boton>
          </form>
        </>
      )}
    </MarcoAcceso>
  );
}
