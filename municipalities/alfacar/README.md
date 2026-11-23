# Expediente canonico de Alfacar

Expediente municipal de Alfacar (INE **18011**, provincia de Granada) para
COMPAS NG. Se incorpora al repositorio el 2026-10-06 a partir del expediente
real ya persistido en el navegador de trabajo, despues de comprobar que Alfacar
estaba cargado localmente pero no existia como seed versionado.

## Artefactos

| Fichero | Uso |
|---|---|
| `exports/compas-ng-workspace-alfacar.json` | Export canonico (`MunicipalityWorkspace` serializado, `schemaVersion 1.0.0`). |
| `../../public/seeds/compas-ng-workspace-alfacar.json` | Seed desplegable (byte a byte identico al export; Vite lo publica en `dist/seeds/`). |

## Recuentos

| Elemento | Valor |
|---|---|
| Identidad | `alfacar` · Alfacar · Granada · INE 18011 |
| Documentos del repositorio | **2** (`INFORME SALUD ALFACAR 2026` + `Localiza Salud Alfacar`) |
| Activos para la salud | **7** (`EvidenceAtom` de tipo `asset`, origen `localiza-salud`) |
| Informe de Salud | **Presente** |
| PSL validado | **Presente** |
| Perfiles compilados | **1** |

## Procedencia

El fichero procede del workspace `compas-ng:workspace:alfacar` conservado por la
instancia local de COMPAS NG. No fabrica contenido: materializa en el repo lo
que ya habia sido cargado, validado y compilado en la sesion local, para que el
expediente pueda rehidratarse desde el despliegue igual que Atarfe.
