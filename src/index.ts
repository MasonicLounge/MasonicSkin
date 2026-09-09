import { Router } from '@vaadin/router';

import './theme/base.css';
import './api/api-status.js';
import './app/app-shell.js';
import './icons/icon.js';
import './views/home-view.js';
import './views/about-view.js';
import './views/not-found-view.js';

const outlet = document.getElementById('outlet');

if (outlet) {
  const router = new Router(outlet);
  router.setRoutes([
    { path: '/', component: 'home-view' },
    { path: '/about', component: 'about-view' },
    { path: '(.*)', component: 'not-found-view' },
  ]);
}