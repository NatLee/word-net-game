import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.tsx';
import './index.css';

const root = document.getElementById('root');
if (!root) throw new Error('index.html needs a <div id="root"></div>');

// Keep the growing sentence library in its own asset instead of inflating the game code.
const { packs } = await import('./data/index.ts');

createRoot(root).render(
  <StrictMode>
    <App packs={packs} />
  </StrictMode>,
);
