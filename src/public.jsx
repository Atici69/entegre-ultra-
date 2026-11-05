import React from 'react';
import { createRoot } from 'react-dom/client';
import Storefront from './Storefront.jsx';
import './style.css';
import './corporate.css';

createRoot(document.getElementById('public-root')).render(
  <React.StrictMode><Storefront /></React.StrictMode>
);