/**
 * Diccionario de strings de UI en español.
 * Único idioma inicial, pero la estructura queda lista para i18n futuro.
 * NUNCA escribir texto de UI literal dentro de un componente: importar desde aquí.
 */

export const es = {
  app: {
    name: 'Canectt',
    tagline:
      'Convertí cualquier documento en un horario editable y llevalo directo a tu calendario, sin copiar y pegar nada a mano.',
  },
  header: {
    nav: {
      home: 'Inicio',
      start: 'Comenzar',
    },
    theme: {
      toggle: 'Cambiar tema',
      dark: 'Oscuro',
      light: 'Claro',
      system: 'Sistema',
    },
  },
  landing: {
    hero: {
      title: 'Canectt',
      description:
        'Convertí cualquier documento en un horario editable y llevalo directo a tu calendario, sin copiar y pegar nada a mano.',
      cta: 'Comenzar',
    },
    footer: {
      github: 'GitHub',
      license: 'Licencia Apache 2.0',
      docs: 'Documentación',
    },
  },
  creation: {
    import: {
      title: 'Importar',
      description:
        'Subí un documento con tu horario y lo convertimos automáticamente en un horario editable.',
      acceptedFormats:
        'Formatos aceptados: Word (.docx), PDF (.pdf), Markdown (.md), Excel (.xlsx)',
      examples: 'Ejemplos',
      continue: 'Adelante',
      examplesModalTitle: 'Ejemplos de documentos válidos',
      examplesModalClose: 'Cerrar',
      uploadError: {
        invalidExtension: 'Formato no soportado. Aceptamos .docx, .pdf, .md y .xlsx.',
        tooLarge: 'El archivo es demasiado grande.',
        empty: 'El archivo está vacío.',
        generic: 'No pudimos procesar el archivo. Intentá de nuevo.',
      },
      /** Aviso mostrado cuando el reconocimiento devuelve confianza baja
       * o detecta un PDF escaneado. El usuario debe verlo antes de ir al editor. */
      recognitionWarning: 'Aviso de reconocimiento',
      continueAnyway: 'Continuar igual',
    },
    manual: {
      title: 'Manual',
      description:
        'Armá tu horario desde cero, arrastrando bloques de tiempo como si fueran notas adhesivas.',
      continue: 'Adelante',
    },
  },
  editor: {
    title: 'Editor de horario',
    untitled: 'Horario sin título',
    addBlock: 'Agregar bloque',
    block: {
      title: 'Título',
      startTime: 'Hora de inicio',
      endTime: 'Hora de fin',
      color: 'Color',
      notes: 'Notas',
      isSubEvent: 'Es un sub-evento dentro de otro bloque',
      parent: 'Bloque contenedor',
      delete: 'Eliminar',
      edit: 'Editar',
      save: 'Guardar',
      cancel: 'Cancelar',
      defaultTitle: 'Bloque',
    },
    dayRange: {
      start: 'Inicio del día',
      end: 'Fin del día',
    },
    recurrence: {
      label: 'Repetir',
      none: 'Nunca',
      daily: 'Diaria',
      weekdays: 'Días laborables',
      weekly: 'Semanal',
      custom: 'Personalizado',
      days: 'Días',
      weekdaysShort: {
        MO: 'Lun',
        TU: 'Mar',
        WE: 'Mié',
        TH: 'Jue',
        FR: 'Vie',
        SA: 'Sáb',
        SU: 'Dom',
      },
    },
    timezone: {
      label: 'Zona horaria',
      helper: 'Imprescindible para que la hora exportada al calendario sea correcta.',
    },
    empty: 'Tocá un espacio vacío para crear tu primer bloque.',
  },
  export: {
    calendar: {
      title: 'Exportar al calendario',
      connectGoogle: 'Conectar con Google Calendar',
      downloadIcs: 'Descargar archivo .ics (Apple, Outlook, Android y otros)',
      reviewTitle: 'Revisá antes de exportar',
      reviewDescription:
        'Estos bloques ocurren al mismo tiempo o uno dentro del otro. Elegí cómo se deben ver en tu calendario:',
      optionSeparate:
        'Crear como eventos separados que se superponen (se verán igual que en el editor, cada uno con su propio bloque en el calendario).',
      optionCombine:
        'Combinar en un solo evento, mencionando el/los sub-eventos en la descripción.',
      continue: 'Continuar',
      success: 'Eventos creados en tu calendario.',
      error: 'No pudimos crear los eventos. Intentá de nuevo.',
      creatingEvents: 'Creando eventos…',
      fileError: 'Error al exportar el archivo.',
      icsError: 'Error al generar el archivo .ics.',
    },
    files: {
      title: 'Exportar',
      pdf: 'PDF',
      word: 'Word (.docx)',
      excel: 'Excel (.xlsx)',
      markdown: 'Markdown (.md)',
    },
  },
  common: {
    loading: 'Cargando…',
    back: 'Volver',
    close: 'Cerrar',
    save: 'Guardar',
    cancel: 'Cancelar',
    delete: 'Eliminar',
    confirm: 'Confirmar',
    yes: 'Sí',
    no: 'No',
  },
  errors: {
    generic: 'Algo salió mal. Intentá de nuevo.',
    notFound: 'No encontramos lo que buscabas.',
  },
} as const;

export type Dictionary = typeof es;
