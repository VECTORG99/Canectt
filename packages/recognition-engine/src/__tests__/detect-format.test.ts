import { describe, it, expect } from 'vitest';
import { detectFormat } from '../detect-format.js';

describe('detectFormat', () => {
  it('detecta PDF por magic bytes %PDF-', () => {
    const buf = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);
    expect(detectFormat(buf)).toBe('pdf');
  });

  it('detecta Markdown por extensión y contenido de texto', () => {
    const buf = new TextEncoder().encode('# Título\n\nTexto plano sin bytes nulos.');
    expect(detectFormat(buf, 'rutina.md')).toBe('markdown');
  });

  it('detecta unknown para contenido binario no reconocido', () => {
    const buf = new Uint8Array([0x00, 0x01, 0x02, 0x03]);
    expect(detectFormat(buf, 'archivo.bin')).toBe('unknown');
  });

  it('detecta ZIP/OOXML por PK header', () => {
    const buf = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x00, 0x00]);
    expect(detectFormat(buf, 'doc.docx')).toBe('docx');
  });
});
