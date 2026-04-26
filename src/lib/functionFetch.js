function normalizePath(path) {
  return path.startsWith("/") ? path : `/${path}`;
}

function buildCandidates(path) {
  const normalizedPath = normalizePath(path);

  if (typeof window === "undefined") {
    return [normalizedPath];
  }

  const sameOriginUrl = new URL(normalizedPath, window.location.origin);
  const candidates = [sameOriginUrl.toString()];

  const isLocalDev = import.meta.env.DEV && ["localhost", "127.0.0.1"].includes(window.location.hostname);
  if (!isLocalDev) return candidates;

  const localHosts = ["localhost", "127.0.0.1"];
  const localPorts = ["8888", "9999"];

  localHosts.forEach((host) => {
    localPorts.forEach((port) => {
      candidates.push(`${window.location.protocol}//${host}:${port}${sameOriginUrl.pathname}${sameOriginUrl.search}`);
    });
  });

  return [...new Set(candidates)];
}

function buildDevError(path, lastError) {
  const suffix = lastError?.message ? ` (${lastError.message})` : "";
  return new Error(
    `Fonction locale introuvable pour ${path}. Lance \`npm run dev:functions\` ou \`npm run dev:netlify\` puis recharge.${suffix}`
  );
}

export async function fetchFunction(path, init) {
  const candidates = buildCandidates(path);
  let saw404 = false;
  let lastError = null;

  for (const candidate of candidates) {
    try {
      const response = await fetch(candidate, init);
      if (response.status !== 404) {
        return response;
      }
      saw404 = true;
    } catch (error) {
      lastError = error;
    }
  }

  if (import.meta.env.DEV && saw404) {
    throw buildDevError(path, lastError);
  }

  if (lastError) throw buildDevError(path, lastError);

  throw new Error(`Requete fonction impossible pour ${path}.`);
}
