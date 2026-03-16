Chart.defaults.font.family = "'DM Sans', sans-serif";
Chart.defaults.color = '#888680';

new Chart(document.getElementById('fatChart'), {
  type: 'bar',
  data: {
    labels: ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'],
    datasets: [{ data: [2100,3400,2800,4200,3100,2800,0],
      backgroundColor: ctx => ctx.dataIndex === 3 ? '#1B2D5B' : '#E3E1DA',
      borderRadius: 5, borderSkipped: false }]
  },
  options: { responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ' R$ ' + ctx.parsed.y.toLocaleString('pt-BR') } } },
    scales: { x: { grid: { display: false }, border: { display: false } }, y: { grid: { color: '#EDECEA' }, border: { display: false }, ticks: { callback: v => 'R$' + (v/1000).toFixed(0) + 'k' } } }
  }
});

new Chart(document.getElementById('tipoChart'), {
  type: 'doughnut',
  data: {
    labels: ['Revisão','Freios','Suspensão','Elétrica','Outros'],
    datasets: [{ data: [9,6,4,3,2],
      backgroundColor: ['#1B2D5B','#C0152A','#1B5FBF','#D97706','#D1CFC8'],
      borderWidth: 0, hoverOffset: 4 }]
  },
  options: { responsive: true, maintainAspectRatio: false, cutout: '68%',
    plugins: { legend: { position: 'right', labels: { boxWidth: 10, boxHeight: 10, borderRadius: 3, padding: 12, font: { size: 12 } } } }
  }
});

document.querySelectorAll('.period-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.period-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});

// ── Data no header ──────────────────────────────────────────
document.getElementById('page-date').textContent = new Date().toLocaleDateString('pt-BR', {
  weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
});

// ── Helpers ─────────────────────────────────────────────────
const STATUS_CORES = {
  orcamento: 'var(--orcamento)', aprovado: 'var(--concluida)',
  em_execucao: 'var(--andamento)', servico_finalizado: 'var(--aberta)',
  faturada: 'var(--navy)', encerrada: '#888680',
};

function fmtValor(v) {
  return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function fmtCompacto(v) {
  const n = Number(v || 0);
  if (n >= 1000000) return 'R$\u202F' + (n / 1000000).toFixed(1).replace('.', ',') + 'M';
  if (n >= 1000)    return 'R$\u202F' + (n / 1000).toFixed(1).replace('.', ',') + 'k';
  return fmtValor(n);
}

function contarStatus(osPorStatus, status) {
  const row = osPorStatus.find(r => r.status === status);
  return row ? Number(row.total) : 0;
}

// ── Popular KPIs ────────────────────────────────────────────
function popularKPIs(dados) {
  const { osPorStatus, faturamentoMes, osCriadasHoje, osConcluidasHoje } = dados;

  const emExecucao   = contarStatus(osPorStatus, 'em_execucao');
  const orcamentos   = contarStatus(osPorStatus, 'orcamento');
  const totalOS      = osPorStatus.reduce((a, r) => a + Number(r.total), 0) || 1;

  document.getElementById('kpi-faturamento').textContent   = fmtCompacto(faturamentoMes);
  document.getElementById('kpi-concluidas').textContent    = osConcluidasHoje;
  document.getElementById('kpi-execucao').textContent      = emExecucao;
  document.getElementById('kpi-orcamentos').textContent    = orcamentos;
  document.getElementById('kpi-criadas-hoje').textContent  = osCriadasHoje;

  document.getElementById('kpi-exec-sub').textContent =
    emExecucao === 1 ? '1 OS em andamento' : `${emExecucao} OS em andamento`;

  // Barras proporcionais ao total de OS
  document.getElementById('kpi-conc-bar').style.width  = Math.min(Number(osConcluidasHoje) / totalOS * 100, 100) + '%';
  document.getElementById('kpi-exec-bar').style.width  = Math.min(emExecucao / totalOS * 100, 100) + '%';
  document.getElementById('kpi-orc-bar').style.width   = Math.min(orcamentos  / totalOS * 100, 100) + '%';
}

// ── Últimas OS ──────────────────────────────────────────────
function popularUltimasOS(lista) {
  const el = document.getElementById('os-list');
  if (!lista.length) {
    el.innerHTML = '<div style="padding:16px;color:var(--muted);font-size:13px">Nenhuma OS encontrada.</div>';
    return;
  }
  el.innerHTML = lista.map(os => {
    const cls     = os.status.replace(/_/g, '-');
    const veiculo = [os.modelo, os.placa].filter(Boolean).join(' · ') || '—';
    return `
      <div class="os-item" style="cursor:pointer" onclick="window.location.href='../orcamento/?id=${os.id}'">
        <span class="os-dot ${cls}"></span>
        <div class="os-info">
          <div class="os-cliente">${os.cliente_nome || '—'}</div>
          <div class="os-detalhe">${veiculo}</div>
        </div>
        <span class="os-num">#${os.numero}</span>
      </div>`;
  }).join('');
}

// ── Ranking de mecânicos ────────────────────────────────────
function popularMecanicos(lista) {
  const el = document.getElementById('mec-list');
  if (!lista.length) {
    el.innerHTML = '<div style="padding:8px 0;color:var(--muted);font-size:13px">Sem dados de comissão.</div>';
    return;
  }
  const maxComissao = Math.max(...lista.map(m => Number(m.total_comissao)), 1);
  const cores = ['var(--navy)', 'var(--red)', 'var(--andamento)', 'var(--orcamento)', 'var(--aberta)'];

  el.innerHTML = lista.map((m, i) => {
    const pct = Math.round(Number(m.total_comissao) / maxComissao * 100);
    return `
      <div class="mec-item">
        <div class="mec-row">
          <span class="mec-nome">${m.nome}</span>
          <span class="mec-count">${m.total_os} OS · ${fmtCompacto(m.total_comissao)}</span>
        </div>
        <div class="mec-progress">
          <div class="mec-fill" style="width:${pct}%;background:${cores[i % cores.length]}"></div>
        </div>
      </div>`;
  }).join('');
}

// ── Carregar dashboard ──────────────────────────────────────
async function carregarDashboard() {
  try {
    const dados = await api.dashboard();
    popularKPIs(dados);
    popularUltimasOS(dados.ultimasOS);
    popularMecanicos(dados.topMecanicos);
  } catch (err) {
    console.error('Erro ao carregar dashboard:', err.message);
  }
}

carregarDashboard();
