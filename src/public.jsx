import React from 'react';
import { createRoot } from 'react-dom/client';
import Storefront from './Storefront.jsx';
import AuthGate from './AuthGate.jsx';
import './style.css';
import './corporate.css';

const showMarketingSite = new URLSearchParams(window.location.search).get('view') === 'site';

createRoot(document.getElementById('public-root')).render(
  <React.StrictMode>{showMarketingSite ? <Storefront /> : <AuthGate />}</React.StrictMode>
);