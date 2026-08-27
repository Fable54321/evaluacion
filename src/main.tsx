import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App/App.tsx'
import { AuthProvider } from './Contexts/AuthContext.tsx'
import { ForeignWorkersProvider } from './Contexts/ForeignWorkersContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider><ForeignWorkersProvider><App /></ForeignWorkersProvider></AuthProvider>
  </StrictMode>,
)
