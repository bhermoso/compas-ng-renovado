# Fixtures de workspaces

`municipio-ensayo-synthetic-test.json` («Municipio de ensayo») es el expediente
de ensayo para probar compiladores, visualizaciones y contratos del Perfil y de
los trece instrumentos metodológicos. No representa a ningún municipio real:

- Los 13 estudios complementarios conservan agregados de ensayo: los de la
  Encuesta Andaluza de Salud son agregados provinciales públicos de Granada
  («proxy piloto»); los demás proceden de las fixtures municipales sintéticas de
  `fixtures/*.csv`. No se atribuyen a ningún municipio.
- El Informe de Salud es un texto de ensayo escrito para las pruebas; sus cifras
  no proceden de ninguna fuente.
- Los 10 activos de Localiza son de ensayo, con el formato y el vocabulario de
  temáticas de Localiza Salud.

Se genera con `scripts/demo/build-municipio-ensayo.gen.ts`. Sustituye desde el
21/11/2026 al antiguo expediente sintético de Granada-Zaidín, retirado de COMPÁS.

No es un expediente municipal, no acredita aplicaciones realizadas y no puede
copiarse a `municipalities/`, `public/seeds/` ni a ninguna salida institucional.
Los tests que lo usan deben mantener explícita esta condición.
