import type { Router } from '@vaadin/router';

/** Singleton router handle set by index.ts; lets views navigate programmatically. */
let routerInstance: Router | null = null;

export function setRouter(router: Router): void {
  routerInstance = router;
}

/** Navigate to a client-side route. */
export function navigate(url: string): void {
  if (routerInstance) {
    void routerInstance.render(url, false);
  } else {
    window.location.href = url;
  }
}