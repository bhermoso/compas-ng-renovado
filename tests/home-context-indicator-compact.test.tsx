import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { HomePortada } from "../src/ui/components/HomePortada";
import { ProfileResultsDashboard } from "../src/ui/components/ProfileResultsDashboard";
import type { ExternalHealthProfile } from "../src/domain/health-profile/ExternalHealthProfile";
import { readFileSync } from "node:fs";

describe("Portada municipal e indicadores compactos", () => {
  it("la navegación no oculta el municipio en Inicio", () => {
    const app=readFileSync(new URL("../src/App.tsx",import.meta.url),"utf8");
    expect(app).toContain('<div className="app-nav__municipality" aria-label="Expediente municipal seleccionado">');
    expect(app).not.toContain('{view !== "inicio" && <div className="app-nav__municipality">');
    expect(app).toContain("Expediente cargado:");
  });


  it("no duplica el expediente ni el selector municipal dentro de la portada", () => {
    const html = renderToStaticMarkup(<HomePortada onNavigate={()=>{}} municipality={{name:"Loja",province:"Granada",ineCode:"18122"}} onChangeMunicipality={()=>{}}/>);
    expect(html).toContain("El ciclo de planificación local en salud");
    expect(html).not.toContain("Expediente cargado");
    expect(html).not.toContain("Cambiar ámbito");
    expect(html).not.toContain("INE 18122");
  });
  it("muestra indicadores como filas con título, valor, periodo, fuente y detalle completo", () => {
    const profile = {
      id:"loja", municipalityId:"loja", status:"review", title:"Perfil Loja", summary:"",
      findings:[],areas:[],limitations:[],text:"",
      results:[{
        id:"renta", title:"Mediana de renta por unidad de consumo",
        value:"15.750",unit:"€/unidad de consumo/año",period:"2024",
        source:"INE",page:"tabla 31025; referentes provincial y autonómico: tabla 53689 · CUMUN 18122; https://www.ine.es/jaxiT3/Tabla.htm?t=31025",
        topic:"Determinantes sociales",caution:"Sexo total salvo hombres y mujeres"
      }],
    } as ExternalHealthProfile;
    const html=renderToStaticMarkup(<ProfileResultsDashboard profile={profile} municipalityName="Loja"/>);
    expect(html).toContain("epd-row__single");
    expect(html).toContain("Mediana de renta por unidad de consumo");
    expect(html).toContain("15.750");
    expect(html).toContain("2024");
    expect(html).toContain("INE");
    expect(html).toContain("tabla 53689");
    expect(html).toContain("Consultar fuente oficial");
    expect(html).toContain("https://www.ine.es/jaxiT3/Tabla.htm?t=31025");
  });
  it("conserva la fila única en escritorio y el reflujo sin perder detalles en móvil", () => {
    const css=readFileSync(new URL("../src/ui/components/ExternalProfileDashboard.css",import.meta.url),"utf8");
    expect(css).toContain("grid-template-columns: minmax(180px, 2fr)");
    expect(css).toContain(".epd-row__details[open]");
    expect(css).toContain("@media (max-width: 760px)");
  });
});
