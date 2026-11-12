import { Link } from "react-router-dom";
import { ArrowRight, FileText, Inbox, ListTree, Plus, Upload } from "lucide-react";
import { EMPRESAS, useApp } from "../contexto";
import { PARTIDAS } from "../datos/ejemplo";
import { Marco, Permiso } from "../marco/Marco";
import { CabTarjeta, Etiqueta, Pagina, Tarjeta, Titulo, cx, dinero } from "../ui";

/** HU-04 y HU-09: pantalla de inicio con la empresa y el período activos. */
export function Tablero() {
  const { empresa, sucursal, periodo, rol, usuario } = useApp();
  const borradores = PARTIDAS.filter((p) => p.estado === "Borrador");
  const recientes = PARTIDAS.filter((p) => p.estado !== "Borrador").slice(0, 5);

  const kpis = [
    { t: "Partidas contabilizadas", v: "6", s: "en " + periodo.split(" ")[0].toLowerCase() },
    { t: "Borradores pendientes", v: String(borradores.length), s: "1 descuadrado", mal: true },
    { t: "Movimiento del mes", v: "US$ 7,717.30", s: "debe = haber" },
    { t: "Cuentas imputables", v: "34", s: "2 inactivas" },
  ];
  const accesos = [
    { t: "Nueva partida", d: "Registrar una operación", a: "/partidas/nueva", I: Plus, roles: ["admin", "contador", "auxiliar"] },
    { t: "Pendientes", d: "Revisar y contabilizar", a: "/pendientes", I: Inbox, roles: ["admin", "contador", "auxiliar"] },
    { t: "Catálogo", d: "Buscar o crear cuentas", a: "/catalogo", I: ListTree, roles: ["admin", "contador", "auxiliar", "consulta"] },
    { t: "Importar", d: "Catálogo y saldos desde Excel", a: "/importar", I: Upload, roles: ["admin", "contador"] },
  ] as const;

  return (
    <Marco ruta={[{ t: "Tablero" }]}>
      <Pagina>
        <Titulo t={`Bienvenido, ${usuario.nombre}`} sub={<>{EMPRESAS[empresa].n} · {sucursal} · {periodo}</>}>
          <Permiso roles={["admin", "contador", "auxiliar"]}>
            <Link to="/partidas/nueva" className="h-11 px-5 rounded-full bg-pri text-prit font-semibold inline-flex items-center justify-center gap-2"><Plus size={17} />Nueva partida</Link>
          </Permiso>
        </Titulo>

        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {kpis.map((k) => (
            <Tarjeta key={k.t} className="p-4 sm:p-5 flex flex-col gap-1.5 min-w-0">
              <span className="text-sm text-texto2">{k.t}</span>
              <span className="text-[24px] sm:text-[32px] font-light cifra whitespace-nowrap truncate">
                {k.v.startsWith("US$ ") ? <><span className="text-sm sm:text-base text-texto2 mr-1">US$</span>{k.v.slice(4)}</> : k.v}
              </span>
              <span className={cx("text-xs", k.mal ? "text-alerta" : "text-texto3")}>{k.s}</span>
            </Tarjeta>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
          <Tarjeta>
            <CabTarjeta titulo="Pendientes de contabilizar" sub="Borradores del período, del más antiguo al más reciente">
              <Link to="/pendientes" className="text-sm font-semibold inline-flex items-center gap-1.5 text-texto2 hover:text-texto">Ver bandeja<ArrowRight size={15} /></Link>
            </CabTarjeta>
            <ul>
              {borradores.map((p) => {
                const dif = p.debe - p.haber;
                return (
                  <li key={p.id} className="border-b border-borde last:border-0">
                    <Link to={`/partidas/${p.id}`} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[.02]">
                      <span className="hidden sm:block text-xs text-texto3 cifra w-20 shrink-0">{p.fecha}</span>
                      <span className="flex-1 min-w-0"><span className="block truncate">{p.concepto}</span><span className="text-xs text-texto3"><span className="sm:hidden cifra">{p.fecha} · </span>{p.tipo} · {p.autor}</span></span>
                      {dif ? <Etiqueta t="desc">Dif. {dinero(Math.abs(dif))}</Etiqueta> : <Etiqueta t="borrador">Cuadrada</Etiqueta>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Tarjeta>

          <div className="grid grid-cols-1 gap-4 content-start min-w-0">
            <div className="grid grid-cols-2 gap-3">
              {accesos.filter((a) => (a.roles as readonly string[]).includes(rol)).map(({ t, d, a, I }) => (
                <Link key={t} to={a} className="bg-tarjeta border border-borde rounded-2xl p-4 hover:border-bordef transition-colors flex flex-col gap-3">
                  <span className="w-9 h-9 rounded-xl bg-tarjeta2 grid place-items-center"><I size={18} /></span>
                  <span><b className="block font-semibold">{t}</b><span className="text-xs text-texto2">{d}</span></span>
                </Link>
              ))}
            </div>
            <Tarjeta>
              <CabTarjeta titulo="Últimas contabilizadas" />
              <ul>
                {recientes.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 px-5 py-3 border-b border-borde last:border-0 text-sm">
                    <FileText size={16} className="text-texto3 shrink-0" />
                    <span className="flex-1 min-w-0 truncate">N.º {p.num} · {p.concepto}</span>
                    <span className={cx("cifra", p.estado === "Anulada" && "line-through text-texto3")}>{dinero(p.debe)}</span>
                  </li>
                ))}
              </ul>
            </Tarjeta>
          </div>
        </div>
      </Pagina>
    </Marco>
  );
}
