/**
 * Exportador PDF: usa @react-pdf/renderer para describir el PDF como
 * componentes de React (Document, Page, View, Text), coherente con el
 * resto del stack, sin depender de un navegador headless (Puppeteer).
 */
import { Document, Page, View, Text, StyleSheet, pdf } from '@react-pdf/renderer';
import { tokens } from '@canectt/design-tokens';
import type { Schedule } from '@canectt/schema';

// Colores del tema claro (los PDFs se imprimen sobre papel blanco).
const light = tokens.color.light;

// Estilos del documento PDF.
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: 'Helvetica',
    color: light.textPrimary,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
  },
  meta: {
    fontSize: 9,
    color: light.textSecondary,
    marginBottom: 2,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: light.surfaceVariant,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginTop: 16,
    borderBottomWidth: 1,
    borderBottomColor: light.border,
  },
  tableHeaderCell: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: light.border,
  },
  colTime: {
    width: '22%',
  },
  colActivity: {
    width: '33%',
  },
  colNotes: {
    width: '45%',
    color: light.textSecondary,
    fontSize: 10,
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 8,
    color: light.textSecondary,
  },
});

/** Componente del documento PDF para un Schedule. */
function ScheduleDocument({ schedule }: { schedule: Schedule }) {
  const sorted = [...schedule.blocks].sort((a, b) => a.startTime.localeCompare(b.startTime));
  const generated = new Date().toLocaleString('es');

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{schedule.title}</Text>
        <Text style={styles.meta}>Zona horaria: {schedule.timezone}</Text>
        <Text style={styles.meta}>Generado: {generated}</Text>

        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, styles.colTime]}>Hora</Text>
          <Text style={[styles.tableHeaderCell, styles.colActivity]}>Actividad</Text>
          <Text style={[styles.tableHeaderCell, styles.colNotes]}>Notas</Text>
        </View>

        {sorted.map((block) => (
          <View key={block.id} style={styles.row} wrap={false}>
            <Text style={styles.colTime}>
              {block.startTime} – {block.endTime}
            </Text>
            <Text style={styles.colActivity}>{block.title || 'Bloque'}</Text>
            <Text style={styles.colNotes}>{block.notes ?? ''}</Text>
          </View>
        ))}

        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) => `Canectt — Página ${pageNumber}/${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  );
}

/** Genera un PDF (como Uint8Array) a partir de un Schedule. */
export async function toPdf(schedule: Schedule): Promise<Uint8Array> {
  const renderer = pdf(<ScheduleDocument schedule={schedule} />);
  const buffer = await renderer.toBuffer();

  // Caso 1: ya es un Buffer de Node (algunas versiones de @react-pdf).
  if (Buffer.isBuffer(buffer)) {
    return new Uint8Array(buffer);
  }

  // Caso 2: ReadableStream web (navegador / runtimes modernos).
  if (typeof (buffer as unknown as { getReader?: unknown }).getReader === 'function') {
    const stream = buffer as unknown as ReadableStream<Uint8Array>;
    const chunks: Uint8Array[] = [];
    const reader = stream.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) chunks.push(value);
    }
    return concatUint8Arrays(chunks);
  }

  // Caso 3: Readable de Node (lo que realmente devuelve toBuffer() en Node).
  // Recolectamos los chunks via eventos 'data'/'end'.
  const nodeStream = buffer as unknown as {
    on?: (ev: string, cb: (chunk?: Buffer) => void) => void;
  };
  if (typeof nodeStream.on === 'function') {
    const chunks: Buffer[] = [];
    return new Promise<Uint8Array>((resolve, reject) => {
      nodeStream.on!('data', (chunk?: Buffer) => chunks.push(chunk ?? Buffer.alloc(0)));
      nodeStream.on!('end', () => resolve(concatUint8Arrays(chunks.map((c) => new Uint8Array(c)))));
      nodeStream.on!('error', reject);
    });
  }

  // Último recurso: intentar ArrayBuffer.
  if (buffer instanceof ArrayBuffer) {
    return new Uint8Array(buffer);
  }
  throw new Error('Formato de buffer de PDF no soportado por toPdf().');
}

function concatUint8Arrays(chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((sum, c) => sum + c.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}
