import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import * as tf from '@tensorflow/tfjs'
import '@tensorflow/tfjs-backend-webgl'

async function bootstrap() {
  try {
    await tf.setBackend('webgl')
  } catch (_) {
    try { await tf.setBackend('cpu') } catch (_) {}
  }
  await tf.ready()
  createRoot(document.getElementById('root')).render(
    
        <App />
      
  )
}

bootstrap()

