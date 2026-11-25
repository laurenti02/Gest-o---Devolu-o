const express = require('express');
const prisma = require('../lib/db');
const { requireAuth } = require('../lib/auth');
const { defaultPlannerData } = require('./auth');

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  try {
    let record = await prisma.plannerData.findUnique({ where: { userId: req.userId } });
    if (!record) {
      record = await prisma.plannerData.create({
        data: { userId: req.userId, data: defaultPlannerData() },
      });
    }
    res.json(record.data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao carregar dados.' });
  }
});

router.put('/', requireAuth, async (req, res) => {
  try {
    const data = req.body;
    if (!data || typeof data !== 'object') {
      return res.status(400).json({ error: 'Dados inválidos.' });
    }
    await prisma.plannerData.upsert({
      where: { userId: req.userId },
      update: { data },
      create: { userId: req.userId, data },
    });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao salvar dados.' });
  }
});

module.exports = router;
