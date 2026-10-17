import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/compas-ng-renovado/',
  // Puerto fijo: si 5173 está ocupado, `npm run dev` falla en lugar de saltar
  // a 5174. localStorage se aísla por origen (puerto incluido); un salto
  // silencioso de puerto hace que el expediente municipal "desaparezca"
  // (incidente de persistencia del 2026-07-07).
  server: { port: 5173, strictPort: true },
  preview: { port: 4173, strictPort: true },
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    exclude: [
      '**/node_modules/**',
      '**/.git/**',
      'tests/admin-accounts.integration.test.ts',
      'tests/granada-zaidin-reconstruction.test.ts',
      'tests/badea-municipal-context.test.ts',
      'tests/complementary-indicator-references.test.ts',
      'tests/complementary-studies-reading.test.ts',
      'tests/diagnostic-answers.test.ts',
      'tests/informe-cobertura-prioritaria.test.ts',
      'tests/informe-hilo-sanitario.test.ts',
      'tests/integrated-profile-signals.test.ts',
      'tests/perfil-fuentes-enriquecimiento.test.tsx',
      'tests/perfil-interpretacion-integrada.test.ts',
      'tests/perfil-lote-d.test.ts',
      'tests/perfil-salud-en-sintesis.test.tsx',
      'tests/perfil-senales-locales.test.ts',
      'tests/perfil-vista-editorial-integrada.test.tsx',
      'tests/perfil-visualizaciones.test.tsx',
      'tests/profile-writing-contract.test.ts',
      'tests/psl-c-documento-visual.test.tsx',
      'tests/ugc-assistance-questions.test.ts',
    ],
  },
})
