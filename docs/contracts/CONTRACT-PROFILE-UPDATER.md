# CONTRACT-PROFILE-UPDATER

> Actualizador de perfiles: aplicar un cambio declarado a cualquier expediente
> Versión 1.0.0 — 2026-11-18
> Estado: VIGENTE
>
> Implementación: `src/application/health-profile/profileUpdater.ts`,
> `src/application/territorial-statistics/compiledDataPages.ts`, pestaña
> «Actualizador de perfiles» del Perfil de Salud Local.

---

## 1. Problema

Los Perfiles se elaboran fuera de COMPÁS y se cargan en cada expediente. Un cambio
del modelo (por ejemplo, las seis páginas del contrato metodológico 2.5.0) o de los
datos (una descarga nueva de estadística territorial) obligaba a rehacer y cargar
cada Perfil a mano. El autor necesita aplicar cualquier cambio a cualquier
expediente de forma reproducible.

## 2. Estatuto

1. El actualizador produce, en cada expediente elegido, una **revisión nueva en
   revisión** del Perfil vigente. La vigente no cambia hasta que el usuario valida
   la nueva (`CONTRACT-EXTERNAL-PSL-FIDELITY-AND-PUBLICATION`).
2. Es una transformación declarada: cada tipo de cambio tiene reglas fijas, iguales
   en todos los expedientes, y la revisión registra los cambios aplicados en
   «Autoría y revisión» y en sus limitaciones.
3. No redacta conclusiones ni recomendaciones. El texto de autoría del equipo
   (cuerpo, recomendaciones, anexos) se conserva literalmente.

## 3. Cambios disponibles

| Cambio | Regla |
|---|---|
| Rótulos y temas del modelo | Las páginas «Quién vive aquí», «Desigualdad» y «Panel de salud» pasan a «Contexto y población», «Ejes de desigualdad» y «Salud y bienestar»; los indicadores con temas anteriores pasan al tema de su página (Art. 17 ter, compatibilidad). |
| Páginas de datos compiladas | Con la última descarga guardada del expediente: se ordenan las seis páginas; «Ejes de desigualdad», «Condiciones de vida» y «Servicios» se compilan enteras; «Contexto y población» conserva el texto del equipo y añade un bloque de datos que empieza por «Datos de la estadística territorial.»; «Salud y bienestar» no cambia. Las referencias citadas se añaden a «Referencias» sin duplicar etiquetas. |
| Indicadores de la descarga | Reglas de `CONTRACT-TERRITORIAL-STATISTICS` §10 bis: añadir lo ausente, sustituir lo desactualizado o distinto de la fuente, conservar lo demás. |

## 4. Texto compilado

1. Cada frase se construye con valores publicados y cita su tabla o consulta
   («[T31025]», «[B120971]»). Si falta un valor, la frase se omite.
2. Las frases describen y comparan con la fórmula «frente a»; no valoran ni
   concluyen (Art. 17 ter).
3. Con una sola sección censal se declara que no hay análisis interno.
4. Aplicar dos veces el mismo cambio con la misma descarga da el mismo texto.

## 5. Ejecución

1. Vista previa: para cada expediente, la revisión que se crearía y su lista de
   cambios, o el motivo por el que no se puede actualizar (sin Perfil vigente, sin
   descarga, sin cambios).
2. Aplicación: se lee cada expediente compartido, se añade la revisión y se guarda
   en Firebase solo si el expediente no ha cambiado desde la lectura.
3. Cada revisión puede descargarse como paquete `compas-profile-package/v1`.
4. El PDF de la revisión se exporta desde el propio Perfil una vez validada; el PDF
   original adjunto corresponde a la revisión anterior y así se declara.

## Registro de revisiones

| Fecha | Versión | Cambio | Responsable |
|---|---|---|---|
| 2026-11-18 | 1.0.0 | Creación. Encargo del autor: «necesito poder aplicar cualquier cambio a cualquier expediente»; actualizador dentro de COMPÁS | COMPÁS NG |
