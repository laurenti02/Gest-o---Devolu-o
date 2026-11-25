require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const { router: authRouter } = require('./routes/auth');
const plannerRouter = require('./routes/planner');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.APP_URL || true,
    credentials: true,
  })
);

app.use('/api/auth', authRouter);
app.use('/api/planner', plannerRouter);

app.use(express.static(path.join(__dirname, 'public')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Planner Nautika rodando na porta ${PORT}`);
});
