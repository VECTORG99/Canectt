/**
 * Cliente Prisma singleton.
 *
 * Evita crear múltiples instancias en desarrollo (hot reload).
 * Si DATABASE_URL no está configurada, exportamos null para que
 * las rutas de persistencia respondan 503 (servicio no disponible).
 */
import { PrismaClient } from '@prisma/client';
import { env } from './env.js';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma: PrismaClient | null = env.DATABASE_URL
  ? (globalForPrisma.prisma ?? (globalForPrisma.prisma = new PrismaClient()))
  : null;
