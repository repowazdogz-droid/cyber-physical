import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { runProofChainSelfTest, logProofChainSelfTest } from './dev/proofChainSelfTest'

if (import.meta.env.DEV) {
  const selfTest = runProofChainSelfTest()
  logProofChainSelfTest(selfTest)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
