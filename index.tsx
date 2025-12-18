import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

/**
 * COMPATIBILIDADE COM URLs ANTIGAS (HashRouter)
 *
 * Exemplo:
 *   https://site.com/#/dashboard  →  https://site.com/dashboard
 *
 * Isso evita:
 * - Tela vazia (só header/footer)
 * - Não entrar no dashboard
 * - Confusão do BrowserRouter com hashes antigos
 */
if (window.location.hash && window.location.hash.startsWith('#/')) {
  const newPath = window.location.hash.slice(1); // "#/dashboard" -> "/dashboard"
  window.history.replaceState(
    null,
    '',
    newPath + window.location.search
  );
}

const container = document.getElementById('root');

if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.error('FATAL: Elemento root não encontrado no HTML.');
}
