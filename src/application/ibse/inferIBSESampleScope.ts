import type { IBSESampleScope, IBSEStrataCounts } from "../../domain/ibse/IBSEStudy";

/** La muestra se declara solo a partir de participantes válidos con edad conocida.
 * Una edad desconocida no elimina la evidencia de que participaron ambos estratos.
 */
export function inferIBSESampleScope(strata?: IBSEStrataCounts): IBSESampleScope {
  const minors = strata?.under16?.nValid ?? 0;
  const adults = strata?.plus16?.nValid ?? 0;
  if (minors > 0 && adults > 0) return "mixed";
  if (minors > 0 && adults === 0 && (strata?.noAge?.nValid ?? 0) === 0) return "under-16";
  if (adults > 0 && minors === 0 && (strata?.noAge?.nValid ?? 0) === 0) return "16-plus";
  return "unknown";
}
