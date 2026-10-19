import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { BackupPanel } from './ui/components/BackupPanel'
import CoordinatorPreview from './ui/components/CoordinatorPreview.tsx'
import BrowserRelasAccess from './ui/components/BrowserRelasAccess.tsx'

const params = new URLSearchParams(window.location.search)
const view = params.get('vista')
const recovery = view === 'recuperacion'
const coordinatorPreview = view === 'coordinacion-zaidin'
// Toda entrada ordinaria exige sesión: los expedientes viven en Firebase y el
// navegador solo es caché de trabajo, de modo que el resultado no depende del equipo.

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {recovery
      ? <main className="backup-recovery"><BackupPanel recovery /></main>
      : coordinatorPreview
        ? <CoordinatorPreview />
        : <BrowserRelasAccess />}
  </StrictMode>,
)
