/**
 * CRUD de horarios con persistencia en PostgreSQL via Prisma.
 *
 * Endpoints:
 *   POST   /api/schedules      — crear horario
 *   GET    /api/schedules/:id  — leer horario
 *   PUT    /api/schedules/:id  — actualizar horario
 *   DELETE /api/schedules/:id  — eliminar horario
 *
 * Si DATABASE_URL no está configurada, responde 503 (servicio no disponible).
 */
import { Router, type Router as RouterType, type Request, type Response } from 'express';
import { ScheduleSchema, type Schedule } from '@canectt/schema';
import { prisma } from '../db.js';
import { asyncHandler } from '../asyncHandler.js';

export const schedulesRouter: RouterType = Router();

/** Middleware: 503 si no hay DB configurada. */
schedulesRouter.use((req: Request, res: Response, next) => {
  if (!prisma) {
    res.status(503).json({
      error: 'Persistencia no disponible. DATABASE_URL no configurada.',
    });
    return;
  }
  next();
});

// POST /api/schedules — crear horario
schedulesRouter.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as { schedule: Schedule; sessionId?: string };
    const parsed = ScheduleSchema.safeParse(body.schedule);
    if (!parsed.success) {
      res.status(400).json({ error: 'Horario inválido.' });
      return;
    }

    const created = await prisma!.schedule.create({
      data: {
        id: parsed.data.id,
        title: parsed.data.title,
        timezone: parsed.data.timezone,
        data: parsed.data,
        sessionId: body.sessionId ?? null,
      },
    });

    res.status(201).json({
      id: created.id,
      schedule: parsed.data,
    });
  }),
);

// GET /api/schedules/:id — leer horario
schedulesRouter.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const found = await prisma!.schedule.findUnique({
      where: { id: req.params.id },
    });
    if (!found) {
      res.status(404).json({ error: 'Horario no encontrado.' });
      return;
    }
    res.json({
      id: found.id,
      schedule: found.data as Schedule,
    });
  }),
);

// PUT /api/schedules/:id — actualizar horario
schedulesRouter.put(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as { schedule: Schedule };
    const parsed = ScheduleSchema.safeParse(body.schedule);
    if (!parsed.success) {
      res.status(400).json({ error: 'Horario inválido.' });
      return;
    }

    const updated = await prisma!.schedule.update({
      where: { id: req.params.id },
      data: {
        title: parsed.data.title,
        timezone: parsed.data.timezone,
        data: parsed.data,
      },
    });

    res.json({
      id: updated.id,
      schedule: parsed.data,
    });
  }),
);

// DELETE /api/schedules/:id — eliminar horario
schedulesRouter.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    try {
      await prisma!.schedule.delete({ where: { id: req.params.id } });
      res.status(204).send();
    } catch {
      res.status(404).json({ error: 'Horario no encontrado.' });
    }
  }),
);
