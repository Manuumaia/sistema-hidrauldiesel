// ── STEPPER ──────────────────────────────────────────────
// Fluxo oficial: Orçamento → Aprovado → Em Execução → Serviço Finalizado → Faturada → Encerrada
// FATURADA pode ser pulada (servico_finalizado → encerrada diretamente) — aparece como "skipped"
const STEPS = [
  { key: 'orcamento',          label: 'Orçamento',             icon: '1' },
  { key: 'aprovado',           label: 'Aprovado pelo Cliente', icon: '2' },
  { key: 'em_execucao',        label: 'Em Execução',           icon: '3' },
  { key: 'servico_finalizado', label: 'Serviço Finalizado',    icon: '4' },
  { key: 'faturada',           label: 'Faturada',              icon: '5' },
  { key: 'encerrada',          label: 'Encerrada',             icon: '6' },
];
let currentStep = 0;
// true quando OS avança de Serviço Finalizado → Encerrada sem passar por Faturada
let faturadaSkipped = false;
// impede chamada à API enquanto a página está sendo populada com dados carregados
let _carregandoOS = false;
let osId = null;

function renderStepper() {
  const el = document.getElementById('stepper');
  el.innerHTML = '';

  STEPS.forEach((s, i) => {
    // faturada (idx 4) é "pulada" quando foi de servico_finalizado → encerrada
    const isSkipped = (s.key === 'faturada' && faturadaSkipped && currentStep >= 5);
    const isDone    = !isSkipped && i < currentStep;
    const isActive  = !isSkipped && i === currentStep;

    const inner = document.createElement('div');
    inner.className = 'step-inner';
    inner.title = s.label;
    if (!isSkipped) inner.addEventListener('click', () => setStep(i));

    const circle = document.createElement('div');
    circle.className = 'step-circle';
    circle.textContent = isSkipped ? '–' : (isDone ? '✓' : s.icon);

    const lbl = document.createElement('div');
    lbl.className = 'step-label';
    lbl.textContent = s.label;

    if      (isSkipped) inner.classList.add('skipped');
    else if (isDone)    inner.classList.add('done');
    else if (isActive)  inner.classList.add('active');

    inner.append(circle, lbl);

    const step = document.createElement('div');
    step.className = 'step';
    step.appendChild(inner);

    if (i < STEPS.length - 1) {
      const conn = document.createElement('div');
      // Conector verde só se a etapa está concluída normalmente (não pulada)
      conn.className = 'step-connector' + (isDone ? ' done' : '');
      step.appendChild(conn);
    }

    el.appendChild(step);
  });
}

function setStep(idx) {
  // Pular faturada: ir de servico_finalizado (3) ou anterior direto para encerrada (5)
  if (idx === 5 && currentStep < 4) {
    faturadaSkipped = true;
  } else {
    faturadaSkipped = false;
  }
  currentStep = idx;
  renderStepper();
  document.getElementById('status-select').value = String(idx);
  if (!_carregandoOS) atualizarStatus(STEPS[idx].key);
}

function setStepFromSelect(val) {
  const cancelEl = document.getElementById('cancel-step');
  if (val === 'cancelada') {
    cancelEl.classList.add('active');
    return; // cancelada não altera o stepper principal
  }
  cancelEl.classList.remove('active');
  setStep(parseInt(val));
}

function cancelarOS() {
  const cancelEl = document.getElementById('cancel-step');
  cancelEl.classList.toggle('active');
  const isActive = cancelEl.classList.contains('active');
  const sel = document.getElementById('status-select');
  sel.value = isActive ? 'cancelada' : String(currentStep);
}

renderStepper();

// ── TABS ─────────────────────────────────────────────────
document.querySelectorAll('.section-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.section-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
  });
});

// ── TIPO DE ITEM: VEÍCULO / EQUIPAMENTO ──────────────────
function switchItemType(tipo) {
  document.querySelectorAll('.item-tab').forEach(t => t.classList.toggle('active', t.dataset.type === tipo));
  document.getElementById('painel-veiculo').style.display    = tipo === 'veiculo'     ? '' : 'none';
  document.getElementById('painel-equipamento').style.display = tipo === 'equipamento' ? '' : 'none';
  document.getElementById('card-item-title').textContent = tipo === 'veiculo' ? 'Veículo' : 'Equipamento';
  document.getElementById('detran-badge').style.display = tipo === 'veiculo' ? '' : 'none';
}

// ── CHECKLIST DIAGNÓSTICO ─────────────────────────────────
const states = ['', 'ok', 'atencao', 'critico'];
const labels = ['—', 'OK', 'Atenção', 'Crítico'];
function getIdx(el) {
  for (let i = 1; i < states.length; i++) if (el.classList.contains(states[i])) return i;
  return 0;
}
document.querySelectorAll('.diag-item').forEach(item => {
  item.addEventListener('click', () => {
    let idx = (getIdx(item) + 1) % states.length;
    states.slice(1).forEach(s => item.classList.remove(s));
    if (states[idx]) item.classList.add(states[idx]);
    item.querySelector('.diag-status-btn').textContent = labels[idx] || '—';
    updateDiag();
  });
});
function updateDiag() {
  const ok = document.querySelectorAll('.diag-item.ok').length;
  const at = document.querySelectorAll('.diag-item.atencao').length;
  const cr = document.querySelectorAll('.diag-item.critico').length;
  document.getElementById('cnt-ok').textContent = ok;
  document.getElementById('cnt-atencao').textContent = at;
  document.getElementById('cnt-critico').textContent = cr;
  document.getElementById('diag-count').textContent = at + cr;
  const alerta = document.getElementById('alerta-critico');
  alerta.style.display = cr > 0 ? 'flex' : 'none';
  alerta.innerHTML = `<svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>${cr} ${cr===1?'item crítico':'itens críticos'}`;
}

// ── ADICIONAR SERVIÇO ─────────────────────────────────────
let servicoCount = 2;

function renumerarServicos() {
  document.querySelectorAll('#servicos-list .servico-card').forEach((card, i) => {
    const numEl = card.querySelector('.servico-num');
    if (numEl) numEl.textContent = `#${i + 1}`;
  });
}

document.getElementById('add-servico-btn').addEventListener('click', () => {
  const tipos = ['Revisão geral','Troca de óleo','Freios','Suspensão','Elétrica','Outro'];
  const mecanicos = ['João Silva','André Lima','Pedro Rocha'];
  const novoNum = document.querySelectorAll('#servicos-list .servico-card').length + 1;
  const div = document.createElement('div');
  div.className = 'servico-card';
  div.innerHTML = `
    <div class="servico-card-header">
      <span class="servico-num">#${novoNum}</span>
      <input class="servico-titulo-input" type="text" placeholder="Nome do serviço…"/>
      <button class="servico-del-btn">✕</button>
    </div>
    <div class="servico-card-body">
      <div class="field"><label>Tipo</label><select>${tipos.map(t=>`<option>${t}</option>`).join('')}</select></div>
      <div class="field"><label>Mecânico responsável</label><select>${mecanicos.map(m=>`<option>${m}</option>`).join('')}</select></div>
      <div class="field"><label>Quantidade</label><input type="number" class="servico-quantidade-input" value="1" min="1" step="1"/></div>
      <div class="field"><label>Valor do serviço (R$)</label><input type="number" class="servico-valor-input" placeholder="0,00" min="0" step="0.01"/></div>
    </div>`;
  document.getElementById('servicos-list').appendChild(div);
  div.querySelector('.servico-titulo-input').focus();
});
document.getElementById('servicos-list').addEventListener('click', e => {
  if (e.target.closest('.servico-del-btn')) {
    e.target.closest('.servico-card').remove();
    renumerarServicos();
    recalcularResumo();
  }
});
document.getElementById('servicos-list').addEventListener('input', e => {
  if (e.target.classList.contains('servico-valor-input') ||
      e.target.classList.contains('servico-quantidade-input')) recalcularResumo();
});

// ── ADICIONAR PEÇA ────────────────────────────────────────
document.getElementById('add-peca-btn').addEventListener('click', () => {
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td><input type="text" placeholder="Código ou nome da peça"/></td>
    <td class="td-qty"><input type="number" value="1" min="1"/></td>
    <td class="td-val peca-valor"><input type="text" placeholder="R$ 0,00"/></td>
    <td class="td-total peca-total" style="color:var(--muted)">—</td>
    <td class="td-del print-hide"><button>✕</button></td>`;
  document.getElementById('pecas-body').appendChild(tr);
  tr.querySelector('input').focus();
});
document.getElementById('pecas-body').addEventListener('click', e => {
  if (e.target.closest('.td-del button')) e.target.closest('tr').remove();
});

// ── APROVAR ───────────────────────────────────────────────
document.getElementById('aprovar-btn').addEventListener('click', function() {
  this.innerHTML = '✓ Aprovado pelo Cliente!';
  this.style.background = '#15803D';
  this.disabled = true;
  setStep(1); // avança para "Aprovado pelo Cliente"
});

// ── MENU IMPRIMIR ─────────────────────────────────────────
const btnToggle = document.getElementById('btn-print-toggle');
const dropdown  = document.getElementById('print-dropdown');
btnToggle.addEventListener('click', e => {
  e.stopPropagation();
  dropdown.classList.toggle('open');
});
document.addEventListener('click', () => dropdown.classList.remove('open'));

function doPrint(version) {
  dropdown.classList.remove('open');

  // Reset classes no body
  document.body.classList.remove('print-v-cliente','print-v-mecanico','print-v-estoque');
  document.body.classList.add('print-v-' + version);

  // Badge e título
  const badge = document.getElementById('print-version-badge');
  const configs = {
    cliente:  { text: 'Versão Cliente',  cls: 'badge-cliente',  title: '— Via do Cliente' },
    mecanico: { text: 'Versão Mecânico', cls: 'badge-mecanico', title: '— Via do Mecânico' },
    estoque:  { text: 'Versão Estoque',  cls: 'badge-estoque',  title: '— Via do Estoque'  },
  };
  const cfg = configs[version];
  badge.textContent = cfg.text;
  badge.className = 'print-version-badge ' + cfg.cls;
  document.getElementById('print-os-meta').textContent = 'Emitido em 12/03/2026 ' + cfg.title;

  setTimeout(() => {
    window.print();
    document.body.classList.remove('print-v-cliente','print-v-mecanico','print-v-estoque');
  }, 120);
}

// ── INTEGRAÇÃO COM API ────────────────────────────────────

// Lê ?id= da URL — redireciona se não houver
(function () {
  const params = new URLSearchParams(window.location.search);
  osId = params.get('id');
  if (!osId) window.location.replace('../lista-os/');
})();

function fmtValor(v) {
  return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function popularPagina(os) {
  _carregandoOS = true;

  // Header
  document.querySelector('.header-num').textContent = `#${os.numero}`;
  document.querySelector('.header-breadcrumb span').textContent = `/ OS #${os.numero}`;
  document.getElementById('print-os-num').textContent = `#${os.numero}`;
  document.title = `Hidrauldiesel — OS #${os.numero}`;

  // Cliente
  const pessoaNome = document.querySelector('.pessoa-nome');
  if (pessoaNome) pessoaNome.textContent = os.cliente_nome || '—';

  // Veículo — input de busca por placa
  const placaInput = document.querySelector('#painel-veiculo .input-with-action input');
  if (placaInput) placaInput.value = os.placa || '';

  // Veículo — resultado exibido
  const placaBadge = document.querySelector('.veiculo-header .placa');
  if (placaBadge) placaBadge.textContent = os.placa || '—';

  const veiculoTitulo = document.querySelector('.veiculo-titulo');
  if (veiculoTitulo) veiculoTitulo.textContent = os.modelo || '—';

  const veiculoSub2 = document.querySelector('.veiculo-sub2');
  if (veiculoSub2) veiculoSub2.textContent = [os.ano, os.cor].filter(Boolean).join(' · ') || '—';

  // Campos individuais — busca pela label dentro de .veiculo-dado
  const getDado = lbl => [...document.querySelectorAll('#painel-veiculo .veiculo-dado')]
    .find(d => d.querySelector('label')?.textContent.trim() === lbl);
  const setSpan  = (lbl, val) => { const d = getDado(lbl); if (d?.querySelector('span'))  d.querySelector('span').textContent = val || '—'; };
  const setInput = (lbl, val) => { const d = getDado(lbl); if (d?.querySelector('input')) d.querySelector('input').value    = val != null ? String(val) : ''; };

  setSpan('Chassi',   os.chassi);
  setSpan('Motor',    os.motor);
  setSpan('Cor',      os.cor);
  setInput('Km atual', os.km_atual);

  // Queixa e observações técnicas
  const queixaTA = document.getElementById('queixa-textarea');
  if (queixaTA) queixaTA.value = os.queixa || '';

  const obsTA = document.getElementById('obs-tecnica-textarea');
  if (obsTA) obsTA.value = os.obs_tecnica || '';

  // Serviços, peças e resumo financeiro
  renderServicos(os.servicos || []);
  renderPecas(os.pecas || []);
  atualizarResumo(os.servicos || [], os.pecas || []);

  // Stepper — sincronizar com status atual da OS
  const idx = STEPS.findIndex(s => s.key === os.status);
  if (idx >= 0) {
    currentStep = idx;
    renderStepper();
    document.getElementById('status-select').value = String(idx);
  }

  _carregandoOS = false;
}

function renderServicos(servicos) {
  const list = document.getElementById('servicos-list');
  servicoCount = servicos.length;
  if (servicos.length === 0) { list.innerHTML = ''; return; }

  list.innerHTML = servicos.map((s, i) => `
    <div class="servico-card">
      <div class="servico-card-header">
        <span class="servico-num">#${i + 1}</span>
        <input class="servico-titulo-input" type="text" value="${s.descricao || ''}"/>
        <button class="servico-del-btn">✕</button>
      </div>
      <div class="servico-card-body">
        <div class="field"><label>Quantidade</label>
          <input type="number" class="servico-quantidade-input" min="1" step="1" value="${Number(s.quantidade || 1)}"/>
        </div>
        <div class="field"><label>Valor do serviço (R$)</label>
          <input type="number" class="servico-valor-input" placeholder="0,00" min="0" step="0.01" value="${Number(s.valor || 0) || ''}"/>
        </div>
      </div>
    </div>`).join('');
}

function renderPecas(pecas) {
  const tbody = document.getElementById('pecas-body');
  if (pecas.length === 0) { tbody.innerHTML = ''; return; }

  tbody.innerHTML = pecas.map(p => {
    const total = Number(p.quantidade || 1) * Number(p.valor_unit || 0);
    return `
      <tr>
        <td><input type="text" value="${p.descricao || ''}"/></td>
        <td class="td-qty"><input type="number" value="${p.quantidade || 1}" min="1"/></td>
        <td class="td-val peca-valor"><input type="text" value="${fmtValor(p.valor_unit)}"/></td>
        <td class="td-total peca-total">${fmtValor(total)}</td>
        <td class="td-del print-hide"><button>✕</button></td>
      </tr>`;
  }).join('');
}

function atualizarResumo(servicos, pecas) {
  const totalServicos = servicos.reduce((a, s) => a + Number(s.quantidade || 1) * Number(s.valor || 0), 0);
  const totalPecas    = pecas.reduce((a, p) => a + Number(p.quantidade || 1) * Number(p.valor_unit || 0), 0);

  _setResumo(totalServicos, totalPecas, servicos.length);
}

// Recalcula o resumo lendo diretamente do DOM (chamado ao editar valores)
function recalcularResumo() {
  const totalServicos = [...document.querySelectorAll('#servicos-list .servico-card')]
    .reduce((a, card) => {
      const qty = Number(card.querySelector('.servico-quantidade-input')?.value || 1);
      const val = Number(card.querySelector('.servico-valor-input')?.value || 0);
      return a + qty * val;
    }, 0);

  // Lê os totais já calculados de cada linha de peça
  const parseBRL = s => Number((s || '0').replace(/[R$\s.]/g, '').replace(',', '.')) || 0;
  const totalPecas = [...document.querySelectorAll('#pecas-body .td-total.peca-total')]
    .reduce((a, td) => a + parseBRL(td.textContent), 0);

  const nServicos = document.querySelectorAll('#servicos-list .servico-card').length;
  _setResumo(totalServicos, totalPecas, nServicos);
}

function _setResumo(totalServicos, totalPecas, nServicos) {
  const total = totalServicos + totalPecas;

  const vals = document.querySelectorAll('.card .resumo-linha .rl-val');
  if (vals[0]) vals[0].textContent = fmtValor(totalPecas);
  if (vals[1]) vals[1].textContent = fmtValor(totalServicos);

  const lbls = document.querySelectorAll('.card .resumo-linha .rl-label');
  if (lbls[1]) lbls[1].textContent = `Serviços (${nServicos})`;

  const totalEl = document.querySelector('.card .resumo-total .rl-val');
  if (totalEl) totalEl.textContent = fmtValor(total);
}

async function atualizarStatus(novoStatus) {
  if (!osId) return;
  try {
    await api.atualizarStatusOS(osId, novoStatus);
    console.log('Status atualizado:', novoStatus);
  } catch (err) {
    console.error('Erro ao atualizar status:', err.message);
    alert('Erro ao atualizar status: ' + err.message);
  }
}

async function carregarOS() {
  try {
    const os = await api.buscarOS(osId);
    popularPagina(os);
  } catch (err) {
    console.error('Erro ao carregar OS:', err.message);
    alert('Erro ao carregar OS: ' + err.message);
  }
}

if (osId) carregarOS();