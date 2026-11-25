const { PrismaClient } = require('@prisma/client');

// Evita múltiplas instâncias em dev (hot-reload) e mantém 1 conexão em produção
const globalForPrisma = global;

const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

module.exports = prisma;
