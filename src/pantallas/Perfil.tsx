import { useState } from "react";
import { Check, Laptop, Smartphone } from "lucide-react";
import { useApp } from "../contexto";
import { ROLES } from "../datos/navegacion";
import { Marco } from "../marco/Marco";
import { Aviso, Boton, Campo, CabTarjeta, Entrada, Etiqueta, Interruptor, Pagina, Segmento, Tarjeta, Titulo, cx } from "../ui";
import { VistaPartida } from "../ui/reportes";

type Idioma = "es" | "en";
const leer = (k: string, d: string) => { try { return localStorage.getItem("proto-" + k) ?? d; } catch { return d; } };
const poner = (k: string, v: string) => { try { localStorage.setItem("proto-" + k, v); } catch { /* sin almacenamiento */ } };

/** Textos de esta pantalla en los dos idiomas: muestra cómo se verá la interfaz al cambiar (HU-14). */
const T = {
  es: {
    t: "Mi perfil", sub: "Tus datos, el idioma de la interfaz y el modo didáctico", datos: "Datos personales", nombre: "Nombre", correo: "Correo electrónico", cargo: "Cargo", tel: "Teléfono",
    idioma: "Idioma", idiomaAyuda: "Cambia los menús, botones y mensajes. Los reportes y documentos oficiales se mantienen en español.", previo: "Así se ven los menús",
    didactico: "Modo didáctico", didacticoAyuda: "Explica cada partida con su porqué contable. Sirve para estudiar o capacitar a alguien nuevo.", ejemplo: "Ejemplo: venta al contado de US$ 6,780.00",
    seguridad: "Seguridad", actual: "Contraseña actual", nueva: "Contraseña nueva", repetir: "Repite la contraseña nueva", reglas: "Mínimo 8 caracteres, con una letra y un número.", guardar: "Guardar cambios", cambiar: "Cambiar contraseña",
    sesiones: "Sesiones abiertas", esta: "Esta sesión", cerrar: "Cerrar", menu: ["Tablero", "Partidas", "Libros de IVA", "Planilla", "Respaldos"],
  },
  en: {
    t: "My profile", sub: "Your details, the interface language and teaching mode", datos: "Personal details", nombre: "Name", correo: "Email", cargo: "Position", tel: "Phone",
    idioma: "Language", idiomaAyuda: "Changes menus, buttons and messages. Official reports and documents stay in Spanish.", previo: "How the menus look",
    didactico: "Teaching mode", didacticoAyuda: "Explains each journal entry with its accounting reason. Useful for studying or training someone new.", ejemplo: "Example: cash sale of US$ 6,780.00",
    seguridad: "Security", actual: "Current password", nueva: "New password", repetir: "Repeat the new password", reglas: "At least 8 characters, with a letter and a number.", guardar: "Save changes", cambiar: "Change password",
    sesiones: "Open sessions", esta: "This session", cerrar: "Sign out", menu: ["Dashboard", "Journal entries", "VAT books", "Payroll", "Backups"],
  },
} as const;

const PORQUE: Record<string, { es: string; en: string }> = {
  "110101": { es: "Entra dinero a la caja: el activo aumenta, y los activos aumentan por el Debe.", en: "Cash comes in: the asset grows, and assets grow on the debit side." },
  "5101": { es: "Es un ingreso por la venta: los ingresos aumentan por el Haber.", en: "It is sales revenue: revenue grows on the credit side." },
  "2109": { es: "El IVA cobrado se debe a Hacienda: un pasivo, que aumenta por el Haber.", en: "VAT collected is owed to the tax office: a liability, which grows on the credit side." },
};

export function Perfil() {
  const { usuario, rol, avisar } = useApp();
  const [idioma, setIdioma] = useState<Idioma>(leer("idioma", "es") as Idioma);
  const [did, setDid] = useState(leer("didactico", "1") === "1");
  const [tel, setTel] = useState("7123-4567");
  const [act, setAct] = useState(""), [nue, setNue] = useState(""), [rep, setRep] = useState("");
  const t = T[idioma];
  const okClave = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(nue);
  const eRep = rep && rep !== nue ? (idioma === "es" ? "Las contraseñas no coinciden." : "Passwords do not match.") : undefined;

  const lineas = [{ c: "110101", n: idioma === "es" ? "Caja general" : "Cash", d: 6780, h: 0 }, { c: "5101", n: idioma === "es" ? "Ventas" : "Sales", d: 0, h: 6000 }, { c: "2109", n: idioma === "es" ? "IVA Débito Fiscal" : "VAT payable", d: 0, h: 780 }];
  return (
    <Marco ruta={[{ t: t.t }]}>
      <Pagina ancho="max-w-[900px]">
        <Titulo t={t.t} sub={t.sub} />
        <Tarjeta className="overflow-hidden">
          <CabTarjeta titulo={t.datos} />
          <div className="p-5 grid sm:grid-cols-2 gap-4">
            <Campo label={t.nombre}><Entrada value={usuario.nombre} readOnly /></Campo>
            <Campo label={t.correo}><Entrada value={usuario.correo} readOnly /></Campo>
            <Campo label={t.cargo}><Entrada value={ROLES[rol]} readOnly /></Campo>
            <Campo label={t.tel}><Entrada value={tel} onChange={(e) => setTel(e.target.value)} inputMode="tel" className="cifra" /></Campo>
            <div className="sm:col-span-2 flex justify-end"><Boton v="pri" onClick={() => avisar(idioma === "es" ? "Cambios guardados" : "Changes saved")}>{t.guardar}</Boton></div>
          </div>
        </Tarjeta>

        <Tarjeta className="overflow-hidden">
          <CabTarjeta titulo={t.idioma} sub={t.idiomaAyuda} />
          <div className="p-5 grid gap-4">
            <Segmento valor={idioma} onChange={(v) => { setIdioma(v); poner("idioma", v); avisar(v === "es" ? "Interfaz en español" : "Interface in English"); }} opciones={[{ v: "es", t: "Español" }, { v: "en", t: "English" }]} />
            <div className="rounded-2xl bg-fondo p-4 grid gap-2.5"><span className="text-xs text-texto3">{t.previo}</span>
              <div className="flex flex-wrap gap-2">{t.menu.map((m) => <span key={m} className="h-9 px-3.5 rounded-full border border-borde inline-flex items-center text-sm text-texto2">{m}</span>)}</div></div>
          </div>
        </Tarjeta>

        <Tarjeta className="overflow-hidden">
          <CabTarjeta titulo={t.didactico} sub={t.didacticoAyuda}><Interruptor on={did} onChange={(v) => { setDid(v); poner("didactico", v ? "1" : "0"); }} label={t.didactico} /></CabTarjeta>
          <div className="p-5 grid gap-4">
            <b className="text-sm font-semibold">{t.ejemplo}</b>
            <VistaPartida lineas={lineas} borrador={false} />
            {did ? (
              <ul className="grid gap-2.5">{lineas.map((l) => (
                <li key={l.c} className="flex gap-3 text-sm"><span className="w-7 h-7 rounded-full bg-pri text-prit grid place-items-center shrink-0"><Check size={14} /></span><span><b className="font-semibold cifra">{l.c} · {l.n}</b><span className="block text-texto2">{PORQUE[l.c][idioma]}</span></span></li>
              ))}</ul>
            ) : <Aviso>{idioma === "es" ? "El modo didáctico está apagado: las partidas se muestran sin explicaciones." : "Teaching mode is off: entries are shown without explanations."}</Aviso>}
          </div>
        </Tarjeta>

        <Tarjeta className="overflow-hidden">
          <CabTarjeta titulo={t.seguridad} />
          <div className="p-5 grid gap-4 max-w-[520px]">
            <Campo label={t.actual}><Entrada type="password" value={act} onChange={(e) => setAct(e.target.value)} autoComplete="current-password" /></Campo>
            <Campo label={t.nueva} ayuda={t.reglas} error={nue && !okClave ? t.reglas : undefined}><Entrada type="password" value={nue} onChange={(e) => setNue(e.target.value)} mal={!!nue && !okClave} autoComplete="new-password" /></Campo>
            <Campo label={t.repetir} error={eRep}><Entrada type="password" value={rep} onChange={(e) => setRep(e.target.value)} mal={!!eRep} autoComplete="new-password" /></Campo>
            <div><Boton v="pri" disabled={!act || !okClave || nue !== rep} onClick={() => { setAct(""); setNue(""); setRep(""); avisar(idioma === "es" ? "Contraseña actualizada" : "Password updated"); }}>{t.cambiar}</Boton></div>
          </div>
        </Tarjeta>

        <Tarjeta className="overflow-hidden">
          <CabTarjeta titulo={t.sesiones} />
          <ul>{[[Laptop, "Firefox · Linux · San Miguel", true], [Smartphone, "Navegador móvil · Android · San Miguel", false]].map(([I, d, es], i) => {
            const Ico = I as typeof Laptop;
            return <li key={i} className={cx("flex items-center gap-3 px-5 py-4", i > 0 && "border-t border-borde")}><Ico size={20} className="text-texto2 shrink-0" /><span className="flex-1 min-w-0 truncate">{d as string}</span>{es ? <Etiqueta t="contab">{t.esta}</Etiqueta> : <Boton peq onClick={() => avisar(idioma === "es" ? "Sesión cerrada" : "Session closed")}>{t.cerrar}</Boton>}</li>;
          })}</ul>
        </Tarjeta>
      </Pagina>
    </Marco>
  );
}
