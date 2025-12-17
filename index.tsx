import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const container = document.getElementById('root');

if (container) {
  const root = createRoot(container);
  // StrictMode removido para estabilidade de autenticação em ambiente de desenvolvimento
  root.render(
      <App />
  );
} else {
  console.error("FATAL: Elemento root não encontrado no HTML.");
}