import { useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CircleCheck, Copy, FileUp, KeyRound, Loader2, PenLine, ShieldCheck, ShieldX } from "lucide-react";
import { useApp } from "../contexto";
import { EMPRESA_OFICIAL } from "../datos/caso";
import { DOCUMENTOS_FIRMABLES, FIRMADOS, hex, type Firmado } from "../datos/sprint4";
import { Marco, Permiso } from "../marco/Marco";
import { Aviso, Boton, Campo, Dialogo, Entrada, Etiqueta, Pagina, Selector, Tarjeta, CabTarjeta, Titulo } from "../ui";
import { Isologo } from "../ui/Logo";
import { Qr } from "../ui/Qr";
import { TablaCifras } from "../ui/reportes";

const huellaCorta = (h: string) => `${h.slice(0, 12)}…${h.slice(-8)}`;

/** HU-87: firma digital (PAdES) de los estados financieros, con código de verificación y QR. */
export function Firma() {
  const { avisar, usuario } = useApp();
  const [, forzar] = useState(0);
  const [doc, setDoc] = useState(DOCUMENTOS_FIRMABLES[0]);
  const [periodo, setPeriodo] = useState("Octubre 2026");
  const [dlg, setDlg] = useState(false);
  const [pin, setPin] = useState("");
  const [trabajando, setTrabajando] = useState(false);
  const [ultimo, setUltimo] = useState<Firmado | null>(null);
  const [revocar, setRevocar] = useState<Firmado | null>(null);
  const [det, setDet] = useState<Firmado | null>(null);

  const firmar = (e: FormEvent) => {
    e.preventDefault();
    setTrabajando(true);
    setTimeout(() => {
      const n = FIRMADOS.length + 1;
      const f: Firmado = { codigo: `EQ-${hex(n * 7, 4)}-${hex(n * 13, 4)}-${hex(n * 29, 4)}`, documento: doc, periodo, fecha: "01/11/2026 11:30", firmante: usuario.nombre, huella: hex(n + 1200, 64), estado: "Válida" };
      FIRMADOS.unshift(f); setUltimo(f); setTrabajando(false); setDlg(false); setPin(""); avisar("Documento firmado");
    }, 1100);
  };
  const enlace = (c: string) => `${location.origin}${location.pathname}#/verificar/${c}`;

  return (
    <Marco ruta={[{ t: "Libros y reportes" }, { t: "Firma digital" }]}>
      <Pagina ancho="max-w-[1000px]">
        <Titulo t="Firma digital" sub="Firma los estados financieros con el certificado de la empresa; cualquiera puede verificarlos con el código o el QR" />
        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-5 items-start">
          <Tarjeta className="overflow-hidden">
            <CabTarjeta titulo="Documento a firmar" />
            <div className="p-5 grid gap-4">
              <Campo label="Documento"><Selector value={doc} onChange={(e) => setDoc(e.target.value)}>{DOCUMENTOS_FIRMABLES.map((d) => <option key={d}>{d}</option>)}</Selector></Campo>
              <Campo label="Período"><Selector value={periodo} onChange={(e) => setPeriodo(e.target.value)}>{["Octubre 2026", "Septiembre 2026"].map((d) => <option key={d}>{d}</option>)}</Selector></Campo>
              <div className="rounded-2xl bg-fondo p-4 grid gap-1 text-sm">
                <b className="font-semibold flex items-center gap-2"><KeyRound size={15} />Certificado de prueba</b>
                <span className="text-texto2">Titular: {usuario.nombre}</span>
                <span className="text-texto2">Emisor: autoridad de pruebas EQUUS · vigente hasta 31/12/2027</span>
              </div>
              <Permiso roles={["admin", "contador"]}><Boton v="pri" onClick={() => setDlg(true)}><PenLine size={16} />Firmar documento</Boton></Permiso>
            </div>
          </Tarjeta>
          <Tarjeta className="overflow-hidden">
            <CabTarjeta titulo="Resultado" />
            {ultimo ? (
              <div className="p-5 grid gap-4">
                <Etiqueta t="contab"><CircleCheck size={13} />Firmado</Etiqueta>
                <div className="flex gap-4 items-center flex-wrap">
                  <span className="bg-pri text-prit p-2.5 rounded-xl"><Qr valor={ultimo.codigo} tam={104} /></span>
                  <div className="grid gap-1 min-w-0 text-sm"><span className="text-texto2">Código de verificación</span><b className="cifra text-base">{ultimo.codigo}</b><span className="text-texto2 mt-1">Huella SHA-256</span><span className="cifra text-xs break-all">{huellaCorta(ultimo.huella)}</span></div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Boton onClick={() => avisar("Enlace de verificación copiado")}><Copy size={15} />Copiar enlace</Boton>
                  <Link to={`/verificar/${ultimo.codigo}`} className="h-11 px-5 rounded-full border border-bordef font-semibold inline-flex items-center gap-2 hover:bg-tarjeta2">Abrir portal público</Link>
                </div>
                <p className="text-xs text-texto3 cifra break-all">{enlace(ultimo.codigo)}</p>
              </div>
            ) : <p className="p-10 text-center text-texto2">Elige un documento y fírmalo para ver aquí su código y su QR.</p>}
          </Tarjeta>
        </div>
        <Tarjeta className="overflow-hidden">
          <CabTarjeta titulo="Documentos firmados" sub={`${EMPRESA_OFICIAL} · elige uno para verlo, verificarlo o revocarlo`} />
          <TablaCifras<Firmado> clave={(f) => f.codigo} filas={[...FIRMADOS]} totales={false} onFila={setDet}
            tarjeta={(f) => ({ meta: `${f.fecha} · ${f.codigo}`, estado: <Etiqueta t={f.estado === "Válida" ? "contab" : "anulada"}>{f.estado}</Etiqueta>, titulo: f.documento, detalle: f.periodo })}
            cols={[
              { clave: "d", titulo: "Documento", ver: (f) => <span><b className="font-semibold block">{f.documento}</b><span className="text-xs text-texto2">{f.periodo}</span></span> },
              { clave: "c", titulo: "Código", ver: (f) => <span className="cifra">{f.codigo}</span> },
              { clave: "f", titulo: "Fecha", ver: (f) => <span className="cifra whitespace-nowrap">{f.fecha}</span> },
              { clave: "p", titulo: "Firmante", ver: (f) => <span className="block max-w-[190px] truncate">{f.firmante}</span> },
              { clave: "e", titulo: "Estado", ver: (f) => <Etiqueta t={f.estado === "Válida" ? "contab" : "anulada"}>{f.estado}</Etiqueta> },
            ]} />
        </Tarjeta>
      </Pagina>

      <Dialogo abierto={!!det} onCerrar={() => setDet(null)} titulo={det?.documento ?? ""} sub={det ? `${det.periodo} · firmado el ${det.fecha}` : undefined}
        pie={det && <>
          <Boton v="fan" onClick={() => setDet(null)}>Cerrar</Boton>
          <Permiso roles={["admin"]}>{det.estado === "Válida" && <Boton onClick={() => { setRevocar(det); setDet(null); }}>Revocar firma</Boton>}</Permiso>
          <Link to={`/verificar/${det.codigo}`} className="h-11 px-5 rounded-full bg-pri text-prit font-semibold inline-flex items-center gap-2"><ShieldCheck size={16} />Verificar</Link>
        </>}>
        {det && <>
          <div className="flex items-center gap-4 flex-wrap">
            <span className="bg-pri text-prit p-2.5 rounded-xl"><Qr valor={det.codigo} tam={96} /></span>
            <div className="grid gap-1.5 min-w-0"><Etiqueta t={det.estado === "Válida" ? "contab" : "anulada"}>{det.estado}</Etiqueta><b className="cifra text-base break-all">{det.codigo}</b></div>
          </div>
          <dl className="grid gap-2.5 text-sm">{[["Empresa", EMPRESA_OFICIAL], ["Firmante", det.firmante], ["Huella SHA-256", huellaCorta(det.huella)]].map(([k, v]) => <div key={k} className="flex justify-between gap-4 border-b border-borde pb-2 last:border-0"><dt className="text-texto2">{k}</dt><dd className="font-semibold text-right cifra">{v}</dd></div>)}</dl>
          <Boton onClick={() => avisar("Enlace de verificación copiado")}><Copy size={15} />Copiar enlace</Boton>
        </>}
      </Dialogo>
      <Dialogo abierto={dlg} onCerrar={() => !trabajando && setDlg(false)} titulo="Confirmar la firma" sub={`${doc} · ${periodo}`}>
        <form onSubmit={firmar} className="grid gap-4">
          <Aviso>Al firmar, el documento queda sellado: si alguien cambia una sola cifra, la verificación falla.</Aviso>
          <Campo label="Clave del certificado" ayuda="En el prototipo sirve cualquier clave."><Entrada type="password" value={pin} onChange={(e) => setPin(e.target.value)} autoFocus /></Campo>
          <div className="flex justify-end gap-2"><Boton v="fan" type="button" disabled={trabajando} onClick={() => setDlg(false)}>Cancelar</Boton>
            <Boton v="pri" type="submit" disabled={!pin || trabajando}>{trabajando ? <><Loader2 size={16} className="animate-spin" />Firmando…</> : "Firmar"}</Boton></div>
        </form>
      </Dialogo>
      <Dialogo abierto={!!revocar} onCerrar={() => setRevocar(null)} titulo="Revocar la firma" sub={revocar?.codigo}
        pie={<><Boton v="fan" onClick={() => setRevocar(null)}>Cancelar</Boton><Boton v="pri" onClick={() => { revocar!.estado = "Revocada"; setRevocar(null); forzar((x) => x + 1); avisar("Firma revocada"); }}>Revocar firma</Boton></>}>
        <Aviso mal>El portal público mostrará este documento como revocado. Queda registrado en la bitácora.</Aviso>
      </Dialogo>
    </Marco>
  );
}

/** HU-88: portal público de verificación; no pide iniciar sesión. */
export function Verificar() {
  const { codigo } = useParams();
  const ir = useNavigate();
  const [q, setQ] = useState(codigo ?? "");
  const [archivo, setArchivo] = useState<"" | "original" | "modificado">("");
  const f = codigo ? FIRMADOS.find((x) => x.codigo.toLowerCase() === codigo.trim().toLowerCase()) : undefined;
  const buscar = (e: FormEvent) => { e.preventDefault(); if (q.trim()) ir(`/verificar/${q.trim()}`); };
  const estado: "inicio" | "valida" | "revocada" | "nada" = !codigo ? "inicio" : !f ? "nada" : f.estado === "Válida" ? "valida" : "revocada";

  return (
    <div className="min-h-screen bg-fondo">
      <header className="bg-barra border-b border-borde"><div className="max-w-[720px] mx-auto px-4 h-16 flex items-center gap-3"><Isologo alto={32} /><b className="tracking-[.28em] text-sm text-texto2">EQUUS</b><span className="text-texto3 text-sm">· Verificación de documentos</span></div></header>
      <main className="max-w-[720px] mx-auto px-4 py-10 grid gap-6">
        <div><h1 className="text-[32px] font-normal tracking-tight">Verifica un documento</h1><p className="text-texto2 mt-1">Escribe el código que aparece junto al QR del documento firmado.</p></div>
        <form onSubmit={buscar} className="flex gap-2 flex-wrap">
          <Entrada value={q} onChange={(e) => setQ(e.target.value.toUpperCase())} placeholder="EQ-0000-0000-0000" className="cifra flex-1 min-w-[220px] !h-12" aria-label="Código de verificación" />
          <Boton v="pri" type="submit" className="!h-12">Verificar</Boton>
        </form>
        {estado === "valida" && f && (
          <Tarjeta className="p-6 grid gap-4">
            <div className="flex items-center gap-3"><span className="w-12 h-12 rounded-2xl bg-pri text-prit grid place-items-center"><ShieldCheck size={24} /></span><div><b className="text-lg block">Firma válida</b><span className="text-sm text-texto2">El documento no ha sido modificado desde que se firmó.</span></div></div>
            <dl className="grid gap-2.5 text-sm">{[["Empresa", EMPRESA_OFICIAL], ["Documento", f.documento], ["Período", f.periodo], ["Firmado el", f.fecha], ["Firmante", f.firmante], ["Huella SHA-256", huellaCorta(f.huella)]].map(([k, v]) => <div key={k} className="flex justify-between gap-4 border-b border-borde pb-2 last:border-0"><dt className="text-texto2">{k}</dt><dd className="font-semibold text-right cifra">{v}</dd></div>)}</dl>
            <div className="rounded-2xl bg-fondo p-4 grid gap-3">
              <b className="text-sm font-semibold flex items-center gap-2"><FileUp size={15} />¿Tiene el PDF? Compare su huella</b>
              <div className="flex gap-2 flex-wrap"><Boton onClick={() => setArchivo("original")}>Probar con el PDF original</Boton><Boton onClick={() => setArchivo("modificado")}>Probar con un PDF modificado</Boton></div>
              {archivo === "original" && <Etiqueta t="contab"><CircleCheck size={13} />La huella coincide</Etiqueta>}
              {archivo === "modificado" && <Aviso mal><b className="font-semibold">La huella no coincide.</b> El archivo fue alterado después de firmarse.</Aviso>}
            </div>
          </Tarjeta>
        )}
        {estado === "revocada" && f && (
          <Tarjeta className="p-6 grid gap-3 border-alertab"><div className="flex items-center gap-3"><span className="w-12 h-12 rounded-2xl bg-alertaf text-alerta grid place-items-center"><ShieldX size={24} /></span><div><b className="text-lg block text-alerta">Firma revocada</b><span className="text-sm text-texto2">La empresa retiró la validez de este documento. No lo use.</span></div></div>
            <p className="text-sm text-texto2">{f.documento} · {f.periodo} · firmado el {f.fecha}</p></Tarjeta>
        )}
        {estado === "nada" && <Aviso mal><b className="font-semibold">No encontramos ese código.</b> Revise que esté completo, con el formato EQ-0000-0000-0000.</Aviso>}
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <Link to="/firma" className="h-11 px-5 rounded-full border border-bordef font-semibold inline-flex items-center gap-2 hover:bg-tarjeta2 text-sm"><ArrowLeft size={15} />Volver a firma digital</Link>
          <Link to="/" className="text-sm text-texto3 hover:text-texto2 inline-flex items-center gap-1.5 h-11">Índice del prototipo</Link>
        </div>
      </main>
    </div>
  );
}
