const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;
const dataFile = path.join(__dirname, 'data', 'notes.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function loadNotes() {
  try {
    const raw = fs.readFileSync(dataFile, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    return [];
  }
}

function saveNotes(notes) {
  fs.writeFileSync(dataFile, JSON.stringify(notes, null, 2), 'utf8');
}

app.get('/api/notes', (req, res) => {
  const notes = loadNotes();
  res.json(notes);
});

app.post('/api/notes', (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: 'Título e conteúdo são obrigatórios.' });
  }

  const notes = loadNotes();
  const note = {
    id: Date.now().toString(),
    title,
    content,
    createdAt: new Date().toISOString()
  };

  notes.unshift(note);
  saveNotes(notes);
  res.status(201).json(note);
});

app.delete('/api/notes/:id', (req, res) => {
  const id = req.params.id;
  const notes = loadNotes();
  const filtered = notes.filter((note) => note.id !== id);

  if (filtered.length === notes.length) {
    return res.status(404).json({ error: 'Nota não encontrada.' });
  }

  saveNotes(filtered);
  res.status(204).send();
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`SaaS de anotações rodando em http://localhost:${port}`);
});
