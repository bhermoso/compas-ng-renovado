# COMPÁS NG — Contrato de SAM para cualquier muestra con sexo y edad

> Estado: VIGENTE para la entrada genérica (`assessSample`, implementada y con tests). La vinculación de cada productor de muestras figura en el apartado 6, con su estado.
> Fecha: 2026-10-19. Complementa `CONTRACT-DYNAMIC-TRIPYRAMID`, que define el motor y la representación.

## 1. Regla

Toda muestra que COMPÁS produzca o importe y que incluya sexo y edad de las personas se evalúa con `assessSample` (`src/application/sam/assessSample.ts`). No hay excepción por herramienta: encuesta, priorización, Gestor de Encuestas o CSV cargado a mano reciben el mismo procedimiento. Una herramienta que muestre representatividad sin pasar por `assessSample` incumple este contrato.

## 2. Qué evalúa SAM

1. Tamaño frente a la muestra teórica (Cochran con corrección por población finita).
2. Representatividad por celda de edad y sexo frente al padrón, con la afijación de Hamilton como referencia.

## 3. Condiciones de evaluabilidad

1. Sin referencia poblacional verificada, la muestra no es evaluable. SAM no estima la población.
2. Sin tamaño de muestra, no es evaluable.
3. Sin padrón por edad y sexo, o sin edad y sexo en los registros, se emite el dictamen de tamaño y la representatividad queda como no evaluable, con el motivo.
4. Los registros sin sexo o edad reconocibles no se imputan ni se corrigen: se cuentan y se declaran. Una edad por encima de la cota de validez no es una edad y se declara fuera de banda.

## 4. Lo que aporta cada productor

- `instrumentId` y `municipalityId`.
- Registros con sexo y edad (o año de nacimiento con `referenceYear`), o el recuento ya agregado por banda de edad y sexo.
- El universo con el que se compara. Lo elige la persona usuaria (todas las edades, adultos, menores o un rango de bandas completas). SAM no lo decide. Si el rango corta una banda, no es evaluable.

## 5. Padrón de referencia

Un municipio entra en el registro (`populationReferenceRegistry`) solo con una fuente verificada: tabla, fecha y suma auditada contra el total publicado. Hoy: Atarfe y Fuente Vaqueros (padrón INE 2025). La ausencia de entrada significa que SAM no puede ejecutarse para ese municipio, y así se declara.

## 6. Estado de la vinculación (verificado en el código el 2026-10-19)

| Productor | Estado |
|---|---|
| IBSE | ✓ vinculado (`IBSEPanel` → `SamObservedAssessment` → `assessSample`) |
| Priorización ciudadana | ✓ vinculado (`CitizenParticipationSummary` → `SamObservedAssessment`) |
| AUDIT-C | ~ el parser conserva sexo y edad; sin consumidor visible verificado |
| DUKE, PREDIMED, SF-12, Sueño, CAGE | ~ solo dictamen de tamaño (`assessStudies`), sin edad y sexo |
| Gestor de Encuestas (CSV REDCap del proyecto) | ○ la importación no identifica las variables de sexo y edad |
| CSV cargado a mano | ○ sin entrada de usuario |

## 7. Límites

1. SAM informa. No modifica los resultados del estudio ni sus átomos.
2. Sin semáforo ni umbrales de aceptación. La etiqueta de representatividad es una convención parametrizable.
3. El dictamen requiere validación humana.
4. SAM no recoge datos en vivo. Eso queda fuera de este contrato.
