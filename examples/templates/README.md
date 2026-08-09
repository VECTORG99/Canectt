# examples/templates — Plantillas de ejemplo descargables

Esta carpeta contiene plantillas reales y descargables, una por formato soportado, que sirven dos propósitos:

1. **Fuente de las capturas** que se muestran en el botón "Ejemplos" del container "Importar" de la pantalla `/crear`.
2. **Punto de partida descargable** para que el usuario comience con un horario bien estructurado en vez de empezar de cero.

## Plantillas requeridas

| Archivo                  | Formato | Contenido esperado                                            |
| ------------------------ | ------- | ------------------------------------------------------------- |
| `rutina-gimnasio.docx`   | Word    | Tabla con columnas "Hora" y "Actividad", 5-8 filas.           |
| `rutina-gimnasio.pdf`    | PDF     | Mismo contenido que el .docx, exportado a PDF con capa de texto. |
| `rutina-gimnasio.md`     | Markdown| Tabla GFM con columnas "Hora" y "Actividad".                  |
| `rutina-gimnasio.xlsx`   | Excel   | Hoja con columnas "Hora inicio", "Hora fin", "Actividad".     |

## Estructura de ejemplo (Markdown)

```markdown
| Hora       | Actividad          |
| ---------- | ------------------ |
| 07:00-08:00| Rutina de mañana   |
| 08:00-08:30| Desayuno           |
| 09:00-10:30| Trabajo profundo   |
| 12:30-13:30| Almuerzo           |
| 18:00-19:00| Gimnasio           |
```

## Nota

Estas plantillas deben ser preparadas por el equipo (la especificación no puede generar los binarios .docx/.pdf/.xlsx por sí sola). El contenido debe ser un horario realista y re-importable por el propio motor de reconocimiento de Canectt (round-trip).
