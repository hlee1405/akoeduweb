// Ensure window.fetch is writable and prevent sandboxed iframe fetch getter errors
try {
  let _f = window.fetch;
  Object.defineProperty(window, 'fetch', {
    configurable: true,
    enumerable: true,
    get() {
      return _f;
    },
    set(fn) {
      _f = fn;
    }
  });
} catch {
  // Silent fallback
}

window.addEventListener('error', (event) => {
  if (event?.message && event.message.includes('Cannot set property fetch of')) {
    event.preventDefault();
  }
});

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
