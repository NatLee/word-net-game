import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.tsx';
import { packs } from './data/index.ts';
import './index.css';

const root = document.getElementById('root');
if (!root) throw new Error('index.html needs a <div id="root"></div>');

createRoot(root).render(
  <StrictMode>
    <App packs={packs} />
  </StrictMode>,
);
