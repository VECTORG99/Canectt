import { describe, it, expect } from 'vitest';
import { dictionary } from '../i18n/index';

describe('diccionario i18n', () => {
  it('tiene todas las claves principales', () => {
    expect(dictionary.app.name).toBe('Canectt');
    expect(dictionary.header.nav.start).toBeTruthy();
    expect(dictionary.landing.hero.cta).toBeTruthy();
    expect(dictionary.creation.import.continue).toBeTruthy();
    expect(dictionary.creation.manual.continue).toBeTruthy();
    expect(dictionary.editor.addBlock).toBeTruthy();
    expect(dictionary.export.calendar.title).toBeTruthy();
    expect(dictionary.export.files.title).toBeTruthy();
  });

  it('el copy del hero menciona documento y calendario', () => {
    const desc = dictionary.landing.hero.description.toLowerCase();
    expect(desc).toContain('documento');
    expect(desc).toContain('calendario');
  });
});
