import { lazy } from "react";

export function lazyWithPreload(factory) {
  let loadedModulePromise = null;

  const load = () => {
    if (!loadedModulePromise) {
      loadedModulePromise = factory();
    }
    return loadedModulePromise;
  };

  const Component = lazy(load);
  Component.preload = load;

  return Component;
}

// Précharge des composants lazy quand le navigateur est idle.
// Appeler au boot pour Today + Chat sans bloquer le rendu initial.
// Fallback setTimeout pour Safari qui ne supporte pas requestIdleCallback.
export function preloadWhenIdle(components = []) {
  const run = () => components.forEach((c) => c?.preload?.());
  if (typeof requestIdleCallback !== "undefined") {
    requestIdleCallback(run, { timeout: 2000 });
  } else {
    setTimeout(run, 300);
  }
}
