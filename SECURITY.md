# SECURITY.md — Política de seguridad de Canectt

## Reportar una vulnerabilidad

Si crees que has encontrado una vulnerabilidad de seguridad en Canectt, **por favor no abras un Issue público**. Repórtala de forma responsable a través de canal privado:

- Email: `security@<dominio-del-proyecto>` (reemplazar cuando exista un dominio).
- Alternativa: usa las "Security Advisories" privadas de GitHub en la pestaña Security del repositorio.

Incluye en lo posible:

- Descripción del problema y su impacto.
- Pasos para reproducirlo.
- Versión/commit afectado.
- Cualquier mitigación temporal que hayas identificado.

## Compromiso del equipo

- Acusaremos recibo del reporte en un plazo razonable.
- Trabajaremos contigo para entender y resolver el problema.
- Te daremos crédito (si lo deseas) en el aviso público una vez solucionado.
- No tomaremos represalias contra reportes de buena fe.

## Áreas particularmente sensibles en Canectt

- **OAuth de Google**: el `GOOGLE_CLIENT_SECRET` debe vivir **solo en el backend**. Nunca enviarlo al navegador. Si encuentras que el secret se expone al cliente, es una vulnerabilidad crítica.
- **Subida de archivos**: los archivos se validan por contenido real (magic bytes), no solo por extensión, y se procesan con límites de tamaño y tiempo. Un bypass de estos límites es una vulnerabilidad.
- **Sesiones**: la cookie de sesión es `httpOnly`, firmada con `SESSION_SECRET`, de corta duración. Un secreto débil o una cookie sin `httpOnly` son vulnerabilidades.
- **CSP**: el frontend debe tener Content Security Policy configurada. Un CSP ausente o demasiado permisivo es una vulnerabilidad.

## Escaneo automático

- **gitleaks** corre en cada PR y cada push (`.github/workflows/secret-scan.yml`): bloquea el merge si detecta credenciales.
- **Dependencias**: auditoría de licencias y vulnerabilidades conocidas en `pr-quality-suite.yml`.

## Divulgación coordinada

Mientras trabajamos en la solución, te pedimos no divulgar públicamente la vulnerabilidad. Publicaremos un aviso de seguridad una vez que la corrección esté disponible, dándote crédito si lo deseas.
