const express = require('express');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const session = require('express-session');

const app = express();
const port = process.env.PORT || 3000;
const dataDir = path.join(__dirname, 'data');
const notesFile = path.join(dataDir, 'notes.json');
const usersFile = path.join(dataDir, 'users.json');

app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'anotes-up-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 }
}));
app.use(express.static(path.join(__dirname, 'public')));

function loadFile(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return [];
  }
}

function saveFile(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

function requireAuth(req, res, next) {
  if (!req.session.userId) return res.status(401).json({ error: 'Não autenticado.' });
  next();
}

// ── Auth ──
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: 'Nome, email e senha são obrigatórios.' });

  const users = loadFile(usersFile);
  if (users.find(u => u.email === email))
    return res.status(409).json({ error: 'Email já cadastrado.' });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = { id: Date.now().toString(), name, email, passwordHash, createdAt: new Date().toISOString() };
  users.push(user);
  saveFile(usersFile, users);

  req.session.userId = user.id;
  res.status(201).json({ id: user.id, name: user.name, email: user.email });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Email e senha são obrigatórios.' });

  const users = loadFile(usersFile);
  const user = users.find(u => u.email === email);
  if (!user || !(await bcrypt.compare(password, user.passwordHash)))
    return res.status(401).json({ error: 'Email ou senha incorretos.' });

  req.session.userId = user.id;
  res.json({ id: user.id, name: user.name, email: user.email });
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy();
  res.json({ ok: true });
});

app.get('/api/auth/me', (req, res) => {
  if (!req.session.userId) return res.status(401).json(null);
  const users = loadFile(usersFile);
  const user = users.find(u => u.id === req.session.userId);
  if (!user) return res.status(401).json(null);
  res.json({ id: user.id, name: user.name, email: user.email });
});

// ── Notes ──
app.get('/api/notes', requireAuth, (req, res) => {
  const notes = loadFile(notesFile);
  res.json(notes.filter(n => n.userId === req.session.userId));
});

app.post('/api/notes', requireAuth, (req, res) => {
  const { title, content } = req.body;
  if (!title || !content)
    return res.status(400).json({ error: 'Título e conteúdo são obrigatórios.' });

  const notes = loadFile(notesFile);
  const note = {
    id: Date.now().toString(),
    userId: req.session.userId,
    title,
    content,
    createdAt: new Date().toISOString()
  };
  notes.unshift(note);
  saveFile(notesFile, notes);
  res.status(201).json(note);
});

app.delete('/api/notes/:id', requireAuth, (req, res) => {
  const notes = loadFile(notesFile);
  const note = notes.find(n => n.id === req.params.id);
  if (!note) return res.status(404).json({ error: 'Nota não encontrada.' });
  if (note.userId !== req.session.userId) return res.status(403).json({ error: 'Sem permissão.' });
  saveFile(notesFile, notes.filter(n => n.id !== req.params.id));
  res.status(204).send();
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Anotes.Up rodando em http://localhost:${port}`);
});
