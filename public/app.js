const authScreen = document.getElementById('auth-screen');
const appScreen = document.getElementById('app-screen');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const noteForm = document.getElementById('note-form');
const notesList = document.getElementById('notes-list');
const userNameEl = document.getElementById('user-name');
const loginError = document.getElementById('login-error');
const registerError = document.getElementById('register-error');

// ── Tabs ──
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const tab = btn.dataset.tab;
    loginForm.classList.toggle('hidden', tab !== 'login');
    registerForm.classList.toggle('hidden', tab !== 'register');
    loginError.classList.add('hidden');
    registerError.classList.add('hidden');
  });
});

// ── Telas ──
function showApp(user) {
  userNameEl.textContent = user.name;
  authScreen.classList.add('hidden');
  appScreen.classList.remove('hidden');
  loadNotes();
}

function showAuth() {
  appScreen.classList.add('hidden');
  authScreen.classList.remove('hidden');
}

function showError(el, message) {
  el.textContent = message;
  el.classList.remove('hidden');
}

// ── Auth ──
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.classList.add('hidden');
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  if (res.ok) {
    showApp(await res.json());
  } else {
    const err = await res.json();
    showError(loginError, err.error || 'Erro ao entrar.');
  }
});

registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  registerError.classList.add('hidden');
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;

  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password })
  });

  if (res.ok) {
    showApp(await res.json());
  } else {
    const err = await res.json();
    showError(registerError, err.error || 'Erro ao criar conta.');
  }
});

document.getElementById('logout-btn').addEventListener('click', async () => {
  await fetch('/api/auth/logout', { method: 'POST' });
  showAuth();
});

// ── Anotações ──
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function renderNotes(notes) {
  if (!notes.length) {
    notesList.innerHTML = '<p class="empty">Nenhuma anotação ainda. Adicione uma acima.</p>';
    return;
  }

  notesList.innerHTML = '';
  notes.forEach(note => {
    const card = document.createElement('div');
    card.className = 'note-card';
    card.innerHTML = `
      <div class="note-card-header">
        <h3>${escapeHtml(note.title)}</h3>
        <button class="btn-delete" data-id="${note.id}">Excluir</button>
      </div>
      <p>${escapeHtml(note.content)}</p>
      <div class="meta">Criada em ${formatDate(note.createdAt)}</div>
    `;
    card.querySelector('.btn-delete').addEventListener('click', () => deleteNote(note.id));
    notesList.appendChild(card);
  });
}

async function loadNotes() {
  const res = await fetch('/api/notes');
  if (res.ok) renderNotes(await res.json());
}

noteForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = document.getElementById('title').value.trim();
  const content = document.getElementById('content').value.trim();

  const res = await fetch('/api/notes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, content })
  });

  if (res.ok) {
    noteForm.reset();
    loadNotes();
  } else {
    const err = await res.json();
    alert(err.error || 'Erro ao salvar a anotação.');
  }
});

async function deleteNote(id) {
  if (!confirm('Deseja realmente excluir esta anotação?')) return;
  const res = await fetch(`/api/notes/${id}`, { method: 'DELETE' });
  if (res.ok) loadNotes();
  else alert('Erro ao excluir a anotação.');
}

// ── Init: verifica sessão ──
(async () => {
  const res = await fetch('/api/auth/me');
  if (res.ok) {
    const user = await res.json();
    if (user) { showApp(user); return; }
  }
  showAuth();
})();
