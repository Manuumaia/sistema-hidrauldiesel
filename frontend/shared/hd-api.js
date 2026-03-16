const API_URL = 'http://localhost:3000/api';

const getToken = () => sessionStorage.getItem('hd_token');

const request = async (method, endpoint, body = null) => {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`
  };

  const config = { method, headers };
  if (body) config.body = JSON.stringify(body);

  const response = await fetch(`${API_URL}${endpoint}`, config);

  if (response.status === 401) {
    sessionStorage.clear();
    window.location.href = '/login/hd-login.html';
    return;
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.erro || 'Erro na requisição');
  }

  return data;
};

const api = {
  // Auth
  login: (email, senha) => request('POST', '/auth/login', { email, senha }),

  // Dashboard
  dashboard: () => request('GET', '/dashboard'),

  // OS
  listarOS: () => request('GET', '/os'),
  buscarOS: (id) => request('GET', `/os/${id}`),
  criarOS: (dados) => request('POST', '/os', dados),
  atualizarStatusOS: (id, status) => request('PATCH', `/os/${id}/status`, { status }),

  // Mecânicos
  listarMecanicos: () => request('GET', '/mecanicos'),
  buscarMecanico: (id) => request('GET', `/mecanicos/${id}`),
  criarMecanico: (dados) => request('POST', '/mecanicos', dados),
  atualizarMecanico: (id, dados) => request('PATCH', `/mecanicos/${id}`, dados),
};

window.api = api;
