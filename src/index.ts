import { Router } from '@vaadin/router';

import './theme/base.css';
import './api/api-status.js';
import './app/app-shell.js';
import './icons/icon.js';
import './views/home-view.js';
import './views/group-view.js';
import './views/thread-view.js';
import './views/login-view.js';
import './views/register-view.js';
import './views/profile-view.js';
import './views/about-view.js';
import './views/not-found-view.js';
import { setRouter } from './router.js';

const outlet = document.getElementById('outlet');

if (outlet) {
  const router = new Router(outlet);
  setRouter(router);
  router.setRoutes([
    { path: '/', component: 'home-view' },
    { path: '/about', component: 'about-view' },
    { path: '/login', component: 'login-view' },
    { path: '/register', component: 'register-view' },
    { path: '/profile', component: 'profile-view' },
    { path: '/groups/:id', component: 'group-view' },
    { path: '/threads/:id', component: 'thread-view' },
    { path: '(.*)', component: 'not-found-view' },
  ]);
}