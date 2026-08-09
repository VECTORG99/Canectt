/**
 * Tests del módulo OCR.
 *
 * Mockeamos tesseract.js para no depender de la descarga de datos
 * de entrenamiento (eng.traineddata) en CI.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock de tesseract.js
const mockRecognize = vi.fn();
const mockTerminate = vi.fn();
const mockCreateWorker = vi.fn();

vi.mock('tesseract.js', () => ({
  createWorker: (...args: unknown[]): unknown => mockCreateWorker(...args),
}));

describe('ocrImage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRecognize.mockResolvedValue({
      data: { text: '07:00 Rutina de mañana\n08:00 Desayuno' },
    });
    mockTerminate.mockResolvedValue(undefined);
    mockCreateWorker.mockResolvedValue({
      recognize: mockRecognize,
      terminate: mockTerminate,
    });
  });

  it('extrae texto de una imagen via tesseract.js', async () => {
    const { ocrImage } = await import('../ocr.js');
    const imageData = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
    const text = await ocrImage(imageData);
    expect(text).toContain('Rutina de mañana');
    expect(mockCreateWorker).toHaveBeenCalledOnce();
    expect(mockRecognize).toHaveBeenCalledOnce();
    expect(mockTerminate).toHaveBeenCalledOnce();
  });

  it('llama al callback de progreso', async () => {
    const { ocrImage } = await import('../ocr.js');
    const imageData = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
    const onProgress = vi.fn();
    await ocrImage(imageData, { onProgress });
    // El logger se pasa a createWorker; lo invocamos manualmente para test.
    const loggerArg = mockCreateWorker.mock.calls[0]?.[2] as
      { logger?: (m: { status: string; progress: number }) => void } | undefined;
    if (loggerArg?.logger) {
      loggerArg.logger({ status: 'recognizing text', progress: 0.5 });
      expect(onProgress).toHaveBeenCalledWith(50, 'recognizing text');
    }
  });

  it('termina el worker incluso si recognize falla', async () => {
    const { ocrImage } = await import('../ocr.js');
    mockRecognize.mockRejectedValue(new Error('OCR failed'));
    const imageData = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
    await expect(ocrImage(imageData)).rejects.toThrow('OCR failed');
    expect(mockTerminate).toHaveBeenCalledOnce();
  });
});

describe('ocrImages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRecognize.mockResolvedValue({
      data: { text: 'Texto de página' },
    });
    mockTerminate.mockResolvedValue(undefined);
    mockCreateWorker.mockResolvedValue({
      recognize: mockRecognize,
      terminate: mockTerminate,
    });
  });

  it('procesa múltiples imágenes y combina el texto', async () => {
    const { ocrImages } = await import('../ocr.js');
    const images = [new Uint8Array([1]), new Uint8Array([2]), new Uint8Array([3])];
    const text = await ocrImages(images);
    expect(text).toBe('Texto de página\n\nTexto de página\n\nTexto de página');
    expect(mockRecognize).toHaveBeenCalledTimes(3);
  });

  it('reporta progreso global considerando todas las páginas', async () => {
    const { ocrImages } = await import('../ocr.js');
    const images = [new Uint8Array([1]), new Uint8Array([2])];
    const onProgress = vi.fn();
    await ocrImages(images, { onProgress });

    // Simular progreso de la primera página
    const loggerArg = mockCreateWorker.mock.calls[0]?.[2] as
      { logger?: (m: { status: string; progress: number }) => void } | undefined;
    if (loggerArg?.logger) {
      loggerArg.logger({ status: 'recognizing', progress: 0.5 });
      // Progreso global = (0 + 0.5) / 2 * 100 = 25
      expect(onProgress).toHaveBeenCalledWith(25, expect.stringContaining('Página 1/2'));
    }
  });
});
