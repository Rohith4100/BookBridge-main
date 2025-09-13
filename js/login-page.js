// js/login-page.js
import { onAuthStateChanged, auth } from './firebase-init.js';
import { signUp, signIn, signOut, sendReset, signInWithGoogle } from './auth.js';
import { qs, qsa } from './ui.js';

const state = { busy: false };

function setBusy(b) {
  state.busy = b;
  // disable/enable all actionable buttons
  qsa('button').forEach(btn => { btn.disabled = b && btn.id !== 'logoutBtn' ? true : btn.disabled && b; });
  const spinner = qs('#spinner');
  if (spinner) spinner.style.display = b ? 'block' : 'none';
}

function toast(msg, type = 'info') {
  const t = qs('#toast');
  t.textContent = msg;
  t.className = `toast ${type}`;
  t.style.opacity = '1';
  setTimeout(() => (t.style.opacity = '0'), 2400);
}

function showError(msg) {
  const box = qs('#errorBox');
  if (!box) { alert(msg); return; }
  box.textContent = msg;
  box.style.display = 'block';
}

function clearError() {
  const box = qs('#errorBox');
  if (box) { box.textContent = ''; box.style.display = 'none'; }
}

// Tab switching
qsa('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    qsa('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    qsa('form.auth-form').forEach(f => f.classList.remove('active'));
    qs(tab.dataset.target).classList.add('active');
    clearError();
  });
});

// LOGIN
qs('#loginForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearError();
  const email = qs('#loginEmail').value.trim();
  const password = qs('#loginPassword').value;
  if (!email || !password) { showError('Enter email and password'); return; }
  try {
    setBusy(true);
    await signIn(email, password);
    toast('Logged in ✅', 'ok');
    redirectNext();
  } catch (e2) {
    showError(parseFirebaseError(e2));
  } finally { setBusy(false); }
});

// SIGN UP
qs('#signupForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearError();
  const name = qs('#signupName').value.trim();
  const email = qs('#signupEmail').value.trim();
  const password = qs('#signupPassword').value;
  if (!name || !email || !password) { showError('Fill all fields'); return; }
  try {
    setBusy(true);
    await signUp({ name, email, password });
    toast('Account created! Check your email for verification.', 'ok');
    redirectNext();
  } catch (e2) {
    showError(parseFirebaseError(e2));
  } finally { setBusy(false); }
});

// RESET
qs('#resetLink')?.addEventListener('click', (e) => {
  e.preventDefault();
  qs('#resetRow').classList.toggle('hidden');
});
qs('#resetBtn')?.addEventListener('click', async () => {
  clearError();
  const email = qs('#resetEmail').value.trim();
  if (!email) { showError('Enter your email'); return; }
  try {
    setBusy(true);
    await sendReset(email);
    toast('Reset email sent ✅', 'ok');
    qs('#resetRow').classList.add('hidden');
    qs('#resetEmail').value = '';
  } catch (e2) {
    showError(parseFirebaseError(e2));
  } finally { setBusy(false); }
});

// GOOGLE
qs('#googleBtn')?.addEventListener('click', async () => {
  clearError();
  try {
    setBusy(true);
    await signInWithGoogle();
    toast('Signed in with Google ✅', 'ok');
    redirectNext();
  } catch (e2) {
    showError(parseFirebaseError(e2));
  } finally { setBusy(false); }
});

// LOGOUT
qs('#logoutBtn')?.addEventListener('click', async () => {
  clearError();
  try {
    setBusy(true);
    await signOut();
    toast('Logged out', 'ok');
  } catch (e2) {
    showError(parseFirebaseError(e2));
  } finally { setBusy(false); }
});

// State info
onAuthStateChanged(auth, (user) => {
  qs('#userBox').textContent = user
    ? `Logged in as ${user.displayName || user.email}`
    : 'Not logged in';
});

// Helpers
function parseFirebaseError(e) {
  const m = String(e?.message || e).replace('Firebase: ', '');
  if (m.includes('auth/operation-not-allowed')) return 'Email/Password sign-in is disabled in Firebase. Enable it in Authentication → Sign-in method.';
  if (m.includes('auth/invalid-credential')) return 'Invalid email or password';
  if (m.includes('auth/email-already-in-use')) return 'Email already in use';
  if (m.includes('auth/weak-password')) return 'Weak password (min 6 chars)';
  if (m.includes('auth/invalid-email')) return 'Invalid email address';
  if (m.includes('auth/network-request-failed')) return 'Network error. Check your internet or allow popups.';
  return m;
}

function redirectNext() {
  const next = new URLSearchParams(location.search).get('next') || 'index.html';
  location.href = next;
}
