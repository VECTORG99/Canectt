import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { dictionary } from '../i18n/index';
import { useScheduleStore } from '../store/scheduleStore';
import { createEmptySchedule } from '@canectt/schema';
import { scheduleDefaults } from '@canectt/config';

const ACCEPTED_EXTENSIONS = scheduleDefaults.upload.acceptedExtensions;
const MAX_BYTES = scheduleDefaults.upload.maxBytes;

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: [0.2, 0, 0, 1] as const },
};

function formatChips() {
  return [
    { ext: '.docx', label: 'Word' },
    { ext: '.pdf', label: 'PDF' },
    { ext: '.md', label: 'Markdown' },
    { ext: '.xlsx', label: 'Excel' },
  ];
}

export default function CreationHubPage() {
  const navigate = useNavigate();
  const load = useScheduleStore((s) => s.load);
  const reset = useScheduleStore((s) => s.reset);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [showExamples, setShowExamples] = useState(false);
  const [importing, setImporting] = useState(false);
  // Horario reconocido pendiente de confirmación cuando hay un aviso
  // (confianza baja o PDF escaneado). Lo guardamos y mostramos un diálogo
  // antes de navegar al editor, en vez de fallar en silencio.
  const [pendingImport, setPendingImport] = useState<{
    schedule: Parameters<typeof load>[0];
    warning: string;
  } | null>(null);

  function handleManual() {
    reset();
    const schedule = createEmptySchedule({
      title: 'Mi horario',
      dayRange: { ...scheduleDefaults.editor.defaultDayRange },
      timezone: scheduleDefaults.export.defaultTimezone,
    });
    load(schedule);
    navigate(`/horario/${schedule.id}`);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      setError(dictionary.creation.import.uploadError.invalidExtension);
      return;
    }
    if (file.size === 0) {
      setError(dictionary.creation.import.uploadError.empty);
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(dictionary.creation.import.uploadError.tooLarge);
      return;
    }

    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/recognize', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setError(body.error ?? dictionary.creation.import.uploadError.generic);
        return;
      }
      const body = (await res.json()) as {
        schedule: Parameters<typeof load>[0];
        warning?: string | null;
      };
      // Si el backend devolvió un aviso (confianza baja / PDF escaneado),
      // mostramos el horario parcial + el aviso y dejamos que el usuario
      // decida continuar al editor. No navegamos en silencio.
      if (body.warning) {
        setPendingImport({ schedule: body.schedule, warning: body.warning });
      } else {
        load(body.schedule);
        navigate(`/horario/${body.schedule.id}`);
      }
    } catch {
      setError('Error de conexión al procesar el archivo.');
    } finally {
      setImporting(false);
      // Limpiar el input para permitir re-subir el mismo archivo si hace falta.
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function confirmPendingImport() {
    if (!pendingImport) return;
    load(pendingImport.schedule);
    const id = pendingImport.schedule.id;
    setPendingImport(null);
    navigate(`/horario/${id}`);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <motion.h1
        {...fadeUp}
        className="mb-8 text-center font-primary text-3xl font-bold tablet:text-4xl"
      >
        {dictionary.creation.import.title} · {dictionary.creation.manual.title}
      </motion.h1>

      <div className="grid gap-6 tablet:grid-cols-2">
        {/* Container Importar */}
        <motion.section
          {...fadeUp}
          className="card flex flex-col gap-4 p-6"
          aria-labelledby="import-title"
        >
          <h2 id="import-title" className="font-primary text-2xl font-bold">
            {dictionary.creation.import.title}
          </h2>
          <p className="text-text-secondary">{dictionary.creation.import.description}</p>

          <div
            className="flex flex-wrap gap-2"
            aria-label={dictionary.creation.import.acceptedFormats}
          >
            {formatChips().map((f) => (
              <span key={f.ext} className="chip">
                {f.label} {f.ext}
              </span>
            ))}
          </div>

          <button
            type="button"
            className="btn btn-ghost self-start"
            onClick={() => setShowExamples(true)}
          >
            {dictionary.creation.import.examples}
          </button>

          <button
            type="button"
            className="btn btn-primary btn-shine mt-2 self-start"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
          >
            {importing ? 'Procesando…' : dictionary.creation.import.continue}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_EXTENSIONS.join(',')}
            className="hidden"
            onChange={handleFileChange}
            aria-label={dictionary.creation.import.continue}
          />
          {error && (
            <p role="alert" className="text-sm" style={{ color: 'var(--color-block-coral-on-bg)' }}>
              {error}
            </p>
          )}
        </motion.section>

        {/* Container Manual */}
        <motion.section
          {...fadeUp}
          className="card flex flex-col gap-4 p-6"
          aria-labelledby="manual-title"
        >
          <h2 id="manual-title" className="font-primary text-2xl font-bold">
            {dictionary.creation.manual.title}
          </h2>
          <p className="text-text-secondary">{dictionary.creation.manual.description}</p>
          <button
            type="button"
            className="btn btn-primary btn-shine mt-2 self-start"
            onClick={handleManual}
          >
            {dictionary.creation.manual.continue}
          </button>
        </motion.section>
      </div>

      {showExamples && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="examples-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setShowExamples(false)}
        >
          <div
            className="max-h-[80vh] w-full max-w-2xl overflow-auto rounded-xl border bg-surface p-6 shadow-e3"
            style={{ borderColor: 'var(--color-border)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="examples-title" className="mb-4 font-primary text-2xl font-bold">
              {dictionary.creation.import.examplesModalTitle}
            </h2>
            <p className="mb-4 text-text-secondary">{dictionary.creation.import.acceptedFormats}</p>
            {/* TODO: insertar capturas reales de examples/templates cuando existan. */}
            <div className="grid gap-4 tablet:grid-cols-2">
              {formatChips().map((f) => (
                <div key={f.ext} className="card p-4">
                  <h3 className="font-medium">
                    {f.label} {f.ext}
                  </h3>
                  <p className="mt-2 text-sm text-text-secondary">
                    Tabla con columnas "Hora" y "Actividad".
                  </p>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="btn btn-ghost mt-6"
              onClick={() => setShowExamples(false)}
            >
              {dictionary.creation.import.examplesModalClose}
            </button>
          </div>
        </div>
      )}

      {pendingImport && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="warning-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        >
          <div
            className="w-full max-w-lg rounded-xl border bg-surface p-6 shadow-e3"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <h2 id="warning-title" className="mb-3 font-primary text-xl font-bold">
              {dictionary.creation.import.recognitionWarning}
            </h2>
            <p className="mb-5 text-text-secondary">{pendingImport.warning}</p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setPendingImport(null)}
              >
                {dictionary.common.cancel}
              </button>
              <button
                type="button"
                className="btn btn-primary btn-shine"
                onClick={confirmPendingImport}
              >
                {dictionary.creation.import.continueAnyway}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
