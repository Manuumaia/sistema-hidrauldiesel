// ── Constantes de status ────────────────────────────────────
const coresStatus = {
  orcamento:          '#7C3AED',
  aprovado:           '#22C55E',
  em_execucao:        '#EAB308',
  servico_finalizado: '#F97316',
  faturada:           '#1D4ED8',
  encerrada:          '#DC2626',
  cancelada:          '#6B7280'
};

const nomesStatus = {
  orcamento:          'Orçamento',
  aprovado:           'Aprovado pelo Cliente',
  em_execucao:        'Em Execução',
  servico_finalizado: 'Serviço Finalizado',
  faturada:           'Faturada',
  encerrada:          'Encerrada',
  cancelada:          'Cancelada'
};

// ── Estado ──────────────────────────────────────────────────
let todasOS = [];
let filtroAtivo = 'todas';

// ── Formatadores ────────────────────────────────────────────
function formatarData(isoDate) {
  if (!isoDate) return '—';
  return new Date(isoDate).toLocaleDateString('pt-BR');
}

function formatarValor(valor) {
  return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// ── Renderização ────────────────────────────────────────────
function renderizarOS(lista) {
  const tbody = document.getElementById('os-tbody');

  if (lista.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center;padding:40px;color:var(--muted)">
          Nenhuma OS encontrada
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = lista.map(os => {
    const cor   = coresStatus[os.status] || '#6B7280';
    const nome  = nomesStatus[os.status] || os.status;
    const veiculo = [os.modelo, os.ano, os.placa].filter(Boolean).join(' — ');

    return `
      <tr data-status="${os.status}">
        <td><span class="os-num">#${os.numero}</span></td>
        <td>
          <div class="cliente-nome">${os.cliente_nome || '—'}</div>
          <div class="cliente-veiculo">${veiculo || '—'}</div>
        </td>
        <td>
          <span class="badge" style="background:${cor}22;color:${cor};border:1px solid ${cor}55;white-space:nowrap">
            ${nome}
          </span>
        </td>
        <td class="date-cell">${formatarData(os.criado_em)}</td>
        <td class="valor" style="color:${cor}">${formatarValor(os.valor_total)}</td>
        <td style="text-align:right">
          <button class="action-btn" onclick="verOS(${os.id})">Ver</button>
        </td>
      </tr>`;
  }).join('');
}

// ── Filtro combinado ────────────────────────────────────────
function filtrar() {
  const termo = document.getElementById('search-input').value.toLowerCase().trim();
  // Botões usam hifens (ex: "em-execucao"), API retorna underscores ("em_execucao")
  const statusFiltro = filtroAtivo.replace(/-/g, '_');

  const lista = todasOS.filter(os => {
    const passaFiltro = filtroAtivo === 'todas' || os.status === statusFiltro;
    const texto = [os.numero, os.cliente_nome, os.modelo, os.placa].join(' ').toLowerCase();
    const passaBusca = termo === '' || texto.includes(termo);
    return passaFiltro && passaBusca;
  });

  renderizarOS(lista);

  const total    = todasOS.length;
  const visiveis = lista.length;
  document.getElementById('os-count').textContent =
    visiveis === total
      ? `Mostrando ${total} de ${total} ordens`
      : `${visiveis} resultado${visiveis !== 1 ? 's' : ''} encontrado${visiveis !== 1 ? 's' : ''}`;
}

// ── Cards de resumo ─────────────────────────────────────────
function atualizarCards(lista) {
  const hoje = new Date().toDateString();

  const aprovados   = lista.filter(os => os.status === 'aprovado').length;
  const emExecucao  = lista.filter(os => os.status === 'em_execucao').length;
  const finalizadas = lista.filter(os => {
    return os.status === 'encerrada' && new Date(os.criado_em).toDateString() === hoje;
  }).length;
  const faturadoHoje = lista
    .filter(os => os.status === 'encerrada' && new Date(os.criado_em).toDateString() === hoje)
    .reduce((acc, os) => acc + Number(os.valor_total), 0);

  document.getElementById('stat-aprovados').textContent       = aprovados;
  document.getElementById('stat-em-execucao').textContent     = emExecucao;
  document.getElementById('stat-finalizadas-hoje').textContent = finalizadas;
  document.getElementById('stat-faturado-hoje').textContent   = formatarValor(faturadoHoje);
}

// ── Carregamento da API ─────────────────────────────────────
async function carregarOS() {
  const tbody = document.getElementById('os-tbody');
  tbody.innerHTML = `
    <tr>
      <td colspan="6" style="text-align:center;padding:40px;color:var(--muted)">
        Carregando…
      </td>
    </tr>`;

  try {
    todasOS = await api.listarOS();
    atualizarCards(todasOS);
    filtrar();
  } catch (err) {
    console.error('Erro ao carregar OS:', err.message);
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center;padding:40px;color:#DC2626">
          Erro ao carregar ordens de serviço: ${err.message}
        </td>
      </tr>`;
  }
}

// ── Ação "Ver" ──────────────────────────────────────────────
window.verOS = function (id) {
  window.location.href = `../orcamento/?id=${id}`;
};

// ── Filtros por status ──────────────────────────────────────
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    filtroAtivo = btn.dataset.filter;
    filtrar();
  });
});

// ── Busca por texto ─────────────────────────────────────────
document.getElementById('search-input').addEventListener('input', filtrar);

// ── Init ────────────────────────────────────────────────────
carregarOS();
