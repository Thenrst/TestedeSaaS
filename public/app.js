const form = document.getElementById('note-form');
const notesList = document.getElementById('notes-list');

async function fetchNotes() {
  const response = await fetch('/api/notes');
  return response.ok ? response.json() : [];
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function renderNotes(notes) {
  notesList.innerHTML = '';

  if (!notes.length) {
    notesList.innerHTML = '<p class="empty">Nenhuma anotação ainda. Adicione uma acima.</p>';
    return;
  }

  notes.forEach((note) => {
    const noteCard = document.createElement('div');
    noteCard.className = 'note-card';

    noteCard.innerHTML = `
      <h3>${note.title}</h3>
      <div class="meta">Criada em ${formatDate(note.createdAt)}</div>
      <p>${note.content}</p>
      <button type="button" data-id="${note.id}">Excluir</button>
    `;

    const deleteButton = noteCard.querySelector('button');
    deleteButton.addEventListener('click', () => deleteNote(note.id));

    notesList.appendChild(noteCard);
  });
}

async function loadNotes() {
  const notes = await fetchNotes();
  renderNotes(notes);
}

async function addNote(title, content) {
  const response = await fetch('/api/notes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ title, content })
  });

  if (response.ok) {
    form.reset();
    loadNotes();
  } else {
    const error = await response.json();
    alert(error.error || 'Erro ao salvar a anotação.');
  }
}

async function deleteNote(id) {
  const confirmed = confirm('Deseja realmente excluir esta anotação?');
  if (!confirmed) return;

  const response = await fetch(`/api/notes/${id}`, {
    method: 'DELETE'
  });

  if (response.ok) {
    loadNotes();
  } else {
    alert('Erro ao excluir a anotação.');
  }
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const title = form.title.value.trim();
  const content = form.content.value.trim();
  if (title && content) {
    addNote(title, content);
  }
});

loadNotes();
