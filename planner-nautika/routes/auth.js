const express = require('express');
const bcrypt = require('bcryptjs');
const prisma = require('../lib/db');
const { setSessionCookie, clearSessionCookie, requireAuth } = require('../lib/auth');

const router = express.Router();

function defaultPlannerData() {
  const today = new Date().toISOString().slice(0, 10);
  const addDays = (iso, n) => {
    const d = new Date(iso + 'T00:00:00');
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  };
  const mondayOf = (iso) => {
    const d = new Date(iso + 'T00:00:00');
    const day = d.getDay();
    const diff = (day === 0 ? -6 : 1) - day;
    d.setDate(d.getDate() + diff);
    return d.toISOString().slice(0, 10);
  };
  const uid = () => Math.random().toString(36).slice(2, 9);

  return {
    mesReferencia: today.slice(0, 7),
    metasComercial: [
      { id: uid(), label: 'Meta de vendas (R$)', meta: 50000, auto: 'vendasRealizadas' },
      { id: uid(), label: 'Novos clientes', meta: 5, auto: 'novosClientes' },
      { id: uid(), label: 'Reuniões comerciais', meta: 20, auto: null, realizado: 0 },
      { id: uid(), label: 'Propostas enviadas', meta: 10, auto: 'propostasEnviadas' },
    ],
    metasAdmin: [
      { id: uid(), label: 'Tarefas concluídas', meta: 30, auto: 'tarefasConcluidas' },
      { id: uid(), label: 'Prestações de contas em dia (%)', meta: 100, auto: 'contasEmDia' },
    ],
    agenda: {},
    semana: {
      inicio: mondayOf(today),
      grid: {},
      prioridades: [{ id: uid(), texto: '', responsavel: '', prazo: '', status: 'Não iniciado' }],
    },
    funil: [
      {
        id: uid(),
        cliente: 'Empresa Exemplo Ltda',
        contato: 'Fulano da Silva',
        info: '(11) 90000-0000',
        origem: 'Indicação',
        vendedor: 'Você',
        status: 'Em andamento',
        valor: 5000,
        data: addDays(today, 15),
        pedido: null,
        obs: 'Aguardando retorno da proposta',
      },
    ],
    clientes: [
      {
        id: uid(),
        cliente: 'Empresa Exemplo Ltda',
        contato: 'Fulano da Silva',
        info: 'contato@exemplo.com',
        ultimaCompra: addDays(today, -30),
        proximoContato: addDays(today, 7),
        status: 'Ativo',
        obs: 'Prefere contato por e-mail',
      },
    ],
    tarefas: [
      {
        id: uid(),
        tarefa: 'Emitir nota fiscal do pedido 1234',
        responsavel: 'Você',
        prioridade: 'Alta',
        prazo: addDays(today, 2),
        status: 'Pendente',
        obs: '',
      },
    ],
    financeiro: [
      {
        id: uid(),
        data: today,
        descricao: 'Almoço com cliente - Restaurante Sabor',
        categoria: 'Alimentação',
        portador: 'Você',
        valor: 180,
        status: 'Pendente de prestação de contas',
        comprovante: null,
        obs: '',
      },
    ],
  };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !name.trim()) return res.status(400).json({ error: 'Digite seu nome.' });
    if (!email || !EMAIL_RE.test(email.trim())) return res.status(400).json({ error: 'E-mail inválido.' });
    if (!password || password.length < 6) return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres.' });

    const emailNorm = email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: emailNorm } });
    if (existing) return res.status(409).json({ error: 'Já existe uma conta com esse e-mail.' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: emailNorm,
        passwordHash,
        planner: { create: { data: defaultPlannerData() } },
      },
    });

    setSessionCookie(res, user);
    res.json({ id: user.id, name: user.name, email: user.email });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao criar conta.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Informe e-mail e senha.' });

    const emailNorm = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: emailNorm } });
    if (!user) return res.status(401).json({ error: 'E-mail ou senha incorretos.' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'E-mail ou senha incorretos.' });

    setSessionCookie(res, user);
    res.json({ id: user.id, name: user.name, email: user.email });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao entrar.' });
  }
});

router.post('/logout', (req, res) => {
  clearSessionCookie(res);
  res.json({ ok: true });
});

router.get('/me', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) return res.status(401).json({ error: 'Não autenticado.' });
  res.json({ id: user.id, name: user.name, email: user.email });
});

router.post('/change-password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'A nova senha deve ter pelo menos 6 caracteres.' });
    }
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return res.status(401).json({ error: 'Não autenticado.' });

    const ok = await bcrypt.compare(currentPassword || '', user.passwordHash);
    if (!ok) return res.status(400).json({ error: 'Senha atual incorreta.' });

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao trocar senha.' });
  }
});

module.exports = { router, defaultPlannerData };
