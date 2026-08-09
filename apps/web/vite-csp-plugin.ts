/**
 * Plugin de Vite que inyecta la meta tag de Content-Security-Policy
 * únicamente en el build de producción. En desarrollo no se inyecta
 * porque Vite usa scripts inline / HMR que romperían una CSP estricta.
 *
 * La CSP permite:
 *  - scripts y estilos del propio origen (Tailwind genera CSS inline)
 *  - fuentes autohospedadas (self)
 *  - imágenes del propio origen y data: URIs (SVG inline)
 *  - conexiones (fetch/XHR) solo al propio origen (la API se sirve
 *    detrás del mismo host en producción vía proxy/docker)
 *  - bloquea frames externos, object/embed, base-uri y form-action externos
 */
import type { Plugin } from 'vite';

const CSP_MARKER = '<!-- CSP_META_INJECTED_AT_BUILD -->';
const CSP_CONTENT =
  "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'";
const CSP_META = `<meta http-equiv="Content-Security-Policy" content="${CSP_CONTENT}" />`;

export function cspPlugin(): Plugin {
  return {
    name: 'canectt-csp',
    apply: 'build',
    transformIndexHtml(html) {
      return html.replace(CSP_MARKER, CSP_META);
    },
  };
}
