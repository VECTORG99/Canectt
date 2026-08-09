/**
 * OCR con tesseract.js para PDFs escaneados.
 *
 * Cuando un PDF no tiene capa de texto (escaneado), se renderizan las
 * páginas a imágenes y se pasan por tesseract.js para extraer texto.
 * El texto extraído se alimenta al reconocedor existente.
 *
 * Notas:
 * - tesseract.js usa WASM y descarga datos de entrenamiento (eng.traineddata)
 *   la primera vez. Se cachean en el sistema.
 * - El OCR es imperfecto: el reconocimiento de horarios puede tener errores.
 *   Se setea confidence baja.
 * - El progreso se reporta via callback para feedback en la UI.
 */

/** Callback de progreso OCR (0-100). */
export type OcrProgressCallback = (progress: number, status: string) => void;

export interface OcrOptions {
  /** Idioma para tesseract (default: 'eng'). */
  lang?: string;
  /** Callback de progreso. */
  onProgress?: OcrProgressCallback;
}

/**
 * Ejecuta OCR sobre una imagen (Uint8Array de PNG/JPEG) y devuelve el texto.
 */
export async function ocrImage(imageData: Uint8Array, options: OcrOptions = {}): Promise<string> {
  const { createWorker } = await import('tesseract.js');
  const lang = options.lang ?? 'eng';

  const worker = await createWorker(lang, 1, {
    logger: (m: { status: string; progress: number }) => {
      options.onProgress?.(m.progress * 100, m.status);
    },
  });

  try {
    const { data } = await worker.recognize(imageData);
    return data.text.trim();
  } finally {
    await worker.terminate();
  }
}

/**
 * Ejecuta OCR sobre múltiples imágenes y devuelve el texto combinado.
 * Reporta progreso global (0-100) considerando todas las imágenes.
 */
export async function ocrImages(images: Uint8Array[], options: OcrOptions = {}): Promise<string> {
  const results: string[] = [];
  const totalPages = images.length;

  for (let i = 0; i < images.length; i++) {
    const pageText = await ocrImage(images[i]!, {
      ...options,
      onProgress: (pageProgress, status) => {
        // Progreso global = (páginas completadas + progreso de página actual) / total
        const globalProgress = ((i + pageProgress / 100) / totalPages) * 100;
        options.onProgress?.(globalProgress, `Página ${i + 1}/${totalPages}: ${status}`);
      },
    });
    if (pageText) results.push(pageText);
  }

  return results.join('\n\n');
}
