# CONTRACT-PROFILE-UPDATER

> Actualizador de perfiles: aplicar un cambio declarado a cualquier expediente
> Versión 1.3.0 — 2026-11-24
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
   la nueva (`CONTRACT-PROFILE-PRODUCTION-AND-CUSTODY`).
2. Es una transformación declarada: cada tipo de cambio tiene reglas fijas, iguales
   en todos los expedientes. La revisión registra los cambios aplicados en su
   historial de revisión, que COMPÁS conserva y muestra en «Gestión y versiones», y
   en sus limitaciones. El historial no forma parte del texto del Perfil: el
   documento no habla de cómo se generó. En el texto solo cambian el número y la
   fecha de la revisión. Las notas que versiones anteriores del actualizador
   escribieron en el texto pasan al historial en la siguiente revisión generada.
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

## 6. Capa 2 · Cifras enlazadas de las conclusiones

1. Una revisión puede declarar **vínculos**: cada uno une una cifra o un año de una
   conclusión («C14») o de la lectura de conjunto («LECTURA») con un indicador del
   catálogo y un ámbito. Con cada descarga, el cambio «Cifras enlazadas de las
   conclusiones» sustituye esa cifra por la publicada, solo como número completo y
   solo en su párrafo.
2. Una revisión puede declarar **condiciones**: el enunciado que sostiene una
   conclusión, expresado como comparación entre dos valores («el Gini municipal es
   inferior al provincial»). Si una condición deja de cumplirse, o falta un valor, o
   la cifra enlazada ya no está en el texto, la conclusión se **marca para revisar**,
   y con ella las recomendaciones cuyo «Fundamento» la cita.
3. COMPÁS no reescribe el razonamiento de una conclusión marcada. Las marcas se
   muestran con la revisión y no forman parte del texto publicado.

## 7. Capa 3 · Paquete de texto redactado fuera de COMPÁS

1. La redacción nueva (conclusiones, lectura de conjunto, fundamentos, referencias,
   vínculos y condiciones) llega en un paquete `compas-profile-text-package/v1` con
   una entrada por expediente: municipio, título exacto de la revisión sobre la que
   se redactó y operaciones.
2. Operaciones: `replace-section` (cuerpo de una sección por su rótulo),
   `upsert-conclusion` (sustituye o añade «Cn.»), `set-fundamento` (de «Rn.»),
   `replace-paragraph` (por su comienzo, si es único), `add-references` (sin
   duplicar etiquetas) y `set-links` (vínculos y condiciones).
3. Si la revisión vigente no es aquella sobre la que se redactó el paquete, o una
   operación no encuentra su sitio, el paquete no se aplica a ese expediente.
4. El paquete se aplica con el actualizador, como cualquier otro cambio, y produce
   una revisión en revisión.

## 8. Campos del paquete derivados del texto

1. El resumen, las conclusiones y las recomendaciones del paquete del Perfil
   (`summary`, `findings`, `areas`) se derivan del texto: el resumen es la lectura de
   conjunto; las conclusiones, los párrafos «Cn.»; las recomendaciones, los bloques
   «Rn.» con su tipo y su «Fundamento». Se conserva la forma del título de las
   recomendaciones del Perfil de partida.
2. Cada vez que un cambio modifica el texto, el actualizador rehace esos campos en la
   misma revisión. Un paquete cuyo texto y cuyos campos describen revisiones
   distintas no es un estado válido.
3. El cambio «Resumen, conclusiones y recomendaciones del paquete a partir del texto»
   corrige un Perfil cuyos campos no siguen a su texto. Como el texto no cambia,
   produce una revisión de corrección: sube solo el último número («0.9.0» → «0.9.1»).
4. La nota de limitaciones de cada revisión generada nombra los archivos originales
   adjuntos por su nombre de archivo, no por un número de revisión: una revisión
   generada hereda los originales de la última que se incorporó con PDF, que no es
   necesariamente la inmediatamente anterior. Solo menciona la estadística territorial
   cuando el cambio la usa. La corrección del punto 3 reescribe en ese sentido las
   notas anteriores que nombraban el PDF por número de revisión.

## Registro de revisiones

| Fecha | Versión | Cambio | Responsable |
|---|---|---|---|
| 2026-11-24 | 1.3.0 | §2.2: el registro de cambios sale del texto del Perfil y pasa al historial de la revisión (`revisionLog`); las notas anteriores se trasladan en la siguiente revisión. Decisión del responsable del 2026-11-24, a propuesta de COMPÁS, tras la lectura completa de los cuatro Perfiles vigentes | COMPÁS |
| 2026-11-18 | 1.2.1 | §8.4 la nota de limitaciones nombra los archivos adjuntos. Origen: las correcciones 0.9.1, 0.8.1, 0.6.1 y 0.4.1 decían que el PDF adjunto correspondía a 0.9.0, 0.8.0, 0.6.0 y 0.4.0, que no tienen PDF propio | COMPÁS NG |
| 2026-11-18 | 1.2.0 | §8 campos del paquete derivados del texto y revisión de corrección. Origen: las revisiones de Atarfe, Loja y Zagra del 18/11/2026 conservaban el resumen, las conclusiones y las recomendaciones de la revisión anterior | COMPÁS NG |
| 2026-11-18 | 1.1.0 | §6 cifras enlazadas y condiciones de las conclusiones (capa 2); §7 paquete de texto redactado fuera de COMPÁS (capa 3). Decisión del autor: «de momento capas 2 y 3» | COMPÁS NG |
| 2026-11-18 | 1.0.0 | Creación. Encargo del autor: «necesito poder aplicar cualquier cambio a cualquier expediente»; actualizador dentro de COMPÁS | COMPÁS NG |
