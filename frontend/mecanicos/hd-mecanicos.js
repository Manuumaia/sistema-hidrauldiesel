// ── Data no header ──────────────────────────────────────────
(function () {
  const el = document.getElementById('page-date');
  if (!el) return;
  el.textContent = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  });
})();

// ── Helpers ─────────────────────────────────────────────────
const AVATAR_COLORS = [
  '#1B5FBF','#7C3AED','#0E7490','#92400E',
  '#1B2D5B','#DC2626','#16A34A','#D97706',
];

function avatarColor(nome) {
  let h = 0;
  for (const c of nome) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function iniciais(nome) {
  return nome.trim().split(/\s+/).slice(0, 2).map(p => p[0].toUpperCase()).join('');
}

function fmtValor(v) {
  return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// ── Renderização ────────────────────────────────────────────
function renderMecanicos(lista) {
  const grid = document.getElementById('mec-grid');

  if (lista.length === 0) {
    grid.innerHTML = '<div class="mec-empty">Nenhum mecânico cadastrado.</div>';
    return;
  }

  const maxComissao = Math.max(...lista.map(m => Number(m.total_comissoes || 0)), 1);

  grid.innerHTML = lista.map(m => {
    const cor  = avatarColor(m.nome);
    const incs = iniciais(m.nome);
    const pct  = Math.round(Number(m.total_comissoes || 0) / maxComissao * 100);
    const ativo = m.ativo !== false;

    return `
      <div class="mec-card${ativo ? '' : ' mec-card--inactive'}">
        <div class="mec-card-top">
          <div class="mec-avatar" style="background:${cor}">${incs}</div>
          <div class="mec-info">
            <div class="mec-name">${m.nome}</div>
            <span class="mec-tag">${m.telefone || '—'}</span>
          </div>
          <span class="badge ${ativo ? 'badge-ativo' : 'badge-ferias'}">${ativo ? 'Ativo' : 'Inativo'}</span>
        </div>

        <div class="mec-stats" style="grid-template-columns:1fr 1fr">
          <div class="mec-stat">
            <span class="mec-stat-value" style="font-family:var(--mono)">${Number(m.percentual_comissao || 0)}%</span>
            <span class="mec-stat-label">Comissão</span>
          </div>
          <div class="mec-stat">
            <span class="mec-stat-value" style="font-family:var(--mono);font-size:13px">${fmtValor(m.total_comissoes)}</span>
            <span class="mec-stat-label">Total comissões</span>
          </div>
        </div>

        <div class="mec-perf">
          <div class="mec-perf-label">
            <span>Participação nas comissões</span>
            <span class="mec-perf-pct">${pct}%</span>
          </div>
          <div class="mec-perf-bar">
            <div class="mec-perf-fill" style="width:${pct}%;background:${cor}"></div>
          </div>
        </div>

        <div class="mec-card-footer">
          <button class="btn btn-ghost" style="font-size:12.5px;padding:5px 12px" onclick="abrirModal(${m.id})">
            Editar
          </button>
        </div>
      </div>`;
  }).join('');
}

function atualizarKPIs(lista) {
  const total = lista.length;
  const ativos = lista.filter(m => m.ativo !== false).length;
  const totalComissoes = lista.reduce((a, m) => a + Number(m.total_comissoes || 0), 0);

  document.getElementById('kpi-total').textContent = total;
  document.getElementById('kpi-total-sub').textContent =
    `${ativos} ativo${ativos !== 1 ? 's' : ''} · ${total - ativos} inativo${(total - ativos) !== 1 ? 's' : ''}`;
  document.getElementById('kpi-comissoes').textContent = fmtValor(totalComissoes);
}

// ── Carregamento ────────────────────────────────────────────
async function carregarMecanicos() {
  const grid = document.getElementById('mec-grid');
  grid.innerHTML = '<div class="mec-empty">Carregando…</div>';

  try {
    const lista = await api.listarMecanicos();
    atualizarKPIs(lista);
    renderMecanicos(lista);
  } catch (err) {
    console.error('Erro ao carregar mecânicos:', err.message);
    grid.innerHTML = `<div class="mec-empty" style="color:var(--red)">Erro ao carregar: ${err.message}</div>`;
  }
}

// ── Modal ───────────────────────────────────────────────────
function abrirModal(id = null) {
  document.getElementById('modal-id').value = id || '';
  document.getElementById('modal-nome').value = '';
  document.getElementById('modal-telefone').value = '';
  document.getElementById('modal-comissao').value = '';
  document.getElementById('modal-error').textContent = '';
  document.getElementById('modal-salvar-btn').disabled = false;

  if (id) {
    document.getElementById('modal-title').textContent = 'Editar mecânico';
    // Preenche com dados já na tela (sem nova chamada à API)
    const card = [...document.querySelectorAll('.mec-card')]
      .find(c => c.querySelector('.mec-card-footer button')?.getAttribute('onclick') === `abrirModal(${id})`);
    if (card) {
      document.getElementById('modal-nome').value      = card.querySelector('.mec-name').textContent.trim();
      document.getElementById('modal-telefone').value  = card.querySelector('.mec-tag').textContent.trim() === '—'
        ? '' : card.querySelector('.mec-tag').textContent.trim();
      const pctText = card.querySelector('.mec-stat-value')?.textContent.replace('%', '').trim();
      document.getElementById('modal-comissao').value = pctText || '';
    }
  } else {
    document.getElementById('modal-title').textContent = 'Novo mecânico';
  }

  document.getElementById('modal-overlay').style.display = 'flex';
  document.getElementById('modal-nome').focus();
}

function fecharModal() {
  document.getElementById('modal-overlay').style.display = 'none';
}

function fecharModalFora(e) {
  if (e.target === document.getElementById('modal-overlay')) fecharModal();
}

async function salvarMecanico() {
  const id    = document.getElementById('modal-id').value;
  const nome  = document.getElementById('modal-nome').value.trim();
  const tel   = document.getElementById('modal-telefone').value.trim();
  const comis = document.getElementById('modal-comissao').value;
  const errEl = document.getElementById('modal-error');
  const btn   = document.getElementById('modal-salvar-btn');

  if (!nome) {
    errEl.textContent = 'O nome é obrigatório.';
    return;
  }

  const dados = {
    nome,
    telefone: tel || null,
    percentual_comissao: comis !== '' ? Number(comis) : 0,
  };

  btn.disabled = true;
  btn.textContent = 'Salvando…';
  errEl.textContent = '';

  try {
    if (id) {
      await api.atualizarMecanico(id, dados);
    } else {
      await api.criarMecanico(dados);
    }
    fecharModal();
    await carregarMecanicos();
  } catch (err) {
    console.error('Erro ao salvar mecânico:', err.message);
    errEl.textContent = 'Erro: ' + err.message;
    btn.disabled = false;
    btn.textContent = 'Salvar';
  }
}

// ── Fechar modal com Esc ────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') fecharModal();
});

// ── Init ────────────────────────────────────────────────────
carregarMecanicos();
