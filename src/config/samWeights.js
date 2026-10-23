export const SAM_WEIGHTS_ATARFE_2025 = {
  "15-19": { h: 0.465, m: 0.436 },
  "20-24": { h: 1.540, m: 1.363 },
  "25-29": { h: 1.822, m: 1.141 },
  "30-34": { h: 1.362, m: 1.094 },
  "35-39": { h: 1.192, m: 1.080 },
  "40-44": { h: 1.467, m: 0.975 },
  "45-49": { h: 1.274, m: 0.931 },
  "50-54": { h: 1.319, m: 1.037 },
  "55-59": { h: 1.372, m: 1.107 },
  "60-64": { h: 1.065, m: 0.781 },
  "65-69": { h: 1.330, m: 0.628 },
  "70-74": { h: 1.592, m: 0.576 },
  "75-79": { h: 1.039, m: 0.733 },
  "80-84": { h: 1.734, m: 1.048 },
  "85-89": { h: 1.000, m: 1.422 },
  "90-94": { h: 3.716, m: 2.154 }
};

export function getSamWeight(edadRange, genero) {
  const group = SAM_WEIGHTS_ATARFE_2025[edadRange];
  if (!group) return 1.0;
  
  const upperGenero = genero?.toUpperCase();
  if (upperGenero === 'H' || upperGenero === 'HOMBRE') return group.h;
  if (upperGenero === 'M' || upperGenero === 'MUJER') return group.m;
  
  return 1.0;
}
