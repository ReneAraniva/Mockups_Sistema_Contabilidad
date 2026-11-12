import { useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, Loader2, MailCheck } from "lucide-react";
import { useApp } from "../contexto";
import { Boton, Campo, Entrada, errorCorreo } from "../ui";

const GRANDE = "!h-14 !px-4 !text-base !rounded-2xl";
const BOTON_GRANDE = "!h-14 !text-base";

function MarcoAcceso({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <aside className="hidden lg:flex flex-col justify-between bg-barra border-r border-borde p-12">
        <div className="flex items-center gap-3">
          <span className="w-12 h-12 rounded-2xl bg-pri text-prit grid place-items-center font-bold text-lg">SC</span>
          <b className="font-semibold text-lg">Sistema Contable</b>
        </div>
        <div className="max-w-md">
          <h2 className="text-[52px] leading-[1.08] font-light tracking-tight">Tu contabilidad, clara y al centavo.</h2>
          <p className="text-texto2 mt-5 text-lg">Partidas, libros, IVA y estados financieros de todas tus empresas y sucursales en un mismo lugar.</p>
        </div>
        <div className="flex gap-6 text-texto3 text-sm"><span>Multiempresa</span><span>Multisucursal</span><span>US$ · dd/mm/aaaa</span></div>
      </aside>
      <main className="flex flex-col items-center justify-center px-4 py-10 sm:px-8">
        <div className="lg:hidden flex items-center gap-3 mb-10">
          <span className="w-12 h-12 rounded-2xl bg-pri text-prit grid place-items-center font-bold text-lg">SC</span>
          <b className="font-semibold text-lg">Sistema Contable</b>
        </div>
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
