import { Router } from '@vaadin/router';

/** Singleton router handle set by the app shell; lets views navigate programmatically. */
let routerInstance: Router | null = null;

/** Bind the router to the app-shell shadow outlet. Idempotent. */
export function initRouter(outlet: HTMLElement): void {
  if (routerInstance) return;
  routerInstance = new Router(outlet);
  routerInstance.setRoutes([
    { path: '/', component: 'home-view' },
    { path: '/about', component: 'about-view' },
    { path: '/login', component: 'login-view' },
    { path: '/register', component: 'register-view' },
    { path: '/profile', component: 'profile-view' },
    { path: '/admin', component: 'admin-view' },
    { path: '/install', component: 'install-view' },
    { path: '/groups/:id', component: 'group-view' },
    { path: '/threads/:id', component: 'thread-view' },
    { path: '(.*)', component: 'not-found-view' },
  ]);
}

/** Navigate to a client-side route. */
export function navigate(url: string): void {
  if (routerInstance) {
    void routerInstance.render(url, false);
  } else {
    window.location.href = url;
  }
}