// hd-login.js

// ── Redirecionamento se já estiver logado ──
if (sessionStorage.getItem('hd_token')) {
  window.location.replace('../dashboard/');
}

// ── Referências DOM ──
const form        = document.getElementById('loginForm');
const inputUser   = document.getElementById('username');
const inputPass   = document.getElementById('password');
const errorBox    = document.getElementById('loginError');
const btnLogin    = document.getElementById('btnLogin');
const btnText     = document.getElementById('btnText');
const btnLoader   = document.getElementById('btnLoader');
const toggleBtn   = document.getElementById('togglePassword');
const eyeIcon     = document.getElementById('eyeIcon');

// ── Mostrar/ocultar senha ──
toggleBtn.addEventListener('click', function () {
  const isPassword = inputPass.type === 'password';
  inputPass.type = isPassword ? 'text' : 'password';
  eyeIcon.innerHTML = isPassword
    ? '<path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>'
    : '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
});

// ── Submit ──
form.addEventListener('submit', async function (e) {
  e.preventDefault();
  errorBox.textContent = '';

  const username = inputUser.value.trim();
  const password = inputPass.value;

  if (!username || !password) {
    errorBox.textContent = 'Preencha usuário e senha.';
    return;
  }

  console.log('Tentando login com:', username);
  setLoading(true);

  try {
    const resultado = await api.login(username, password);
    console.log('Login OK:', resultado);

    sessionStorage.setItem('hd_token', resultado.token);
    sessionStorage.setItem('hd_usuario', JSON.stringify(resultado.usuario));

    const redirect = sessionStorage.getItem('hd_redirect') || '../dashboard/';
    sessionStorage.removeItem('hd_redirect');
    window.location.replace(redirect);

  } catch (err) {
    console.error('Erro no login:', err.message);
    errorBox.textContent = 'Email ou senha inválidos: ' + err.message;
    inputPass.value = '';
    inputPass.focus();
    setLoading(false);
  }
});

function setLoading(on) {
  btnLogin.disabled = on;
  btnText.style.display = on ? 'none' : 'inline';
  btnLoader.style.display = on ? 'inline-block' : 'none';
}

// ── Limpa erro ao digitar ──
[inputUser, inputPass].forEach(function (el) {
  el.addEventListener('input', function () { errorBox.textContent = ''; });
});
