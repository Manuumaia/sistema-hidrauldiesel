function toggleDetalhe(btn) {
  const row = btn.closest('tr');
  const detalheRow = row.nextElementSibling;
  const aberto = detalheRow.classList.toggle('hidden') === false;
  btn.classList.toggle('aberto', aberto);
  btn.textContent = aberto ? 'Fechar' : 'Detalhes';
}

const allRows = () => [...document.querySelectorAll('#hist-tbody tr:not(.detalhe-row)')];

function filtrar() {
  const acao    = document.getElementById('filter-acao').value;
  const usuario = document.getElementById('filter-usuario').value;
  const de      = document.getElementById('filter-de').value;
  const ate     = document.getElementById('filter-ate').value;
  const termo   = document.getElementById('search-input').value.toLowerCase().trim();

  let visiveis = 0;

  allRows().forEach(tr => {
    const detalheRow = tr.nextElementSibling;
    const trAcao     = tr.dataset.acao;
    const trUsuario  = tr.dataset.usuario;
    const trData     = tr.dataset.data;
    const texto      = tr.textContent.toLowerCase();

    const passaAcao     = !acao    || trAcao === acao;
    const passaUsuario  = !usuario || trUsuario === usuario;
    const passaDe       = !de      || trData >= de;
    const passaAte      = !ate     || trData <= ate;
    const passaBusca    = !termo   || texto.includes(termo);

    const visivel = passaAcao && passaUsuario && passaDe && passaAte && passaBusca;

    tr.style.display = visivel ? '' : 'none';

    // esconde também a linha de detalhe se o pai sumir
    if (!visivel && detalheRow) {
      detalheRow.classList.add('hidden');
      const btn = tr.querySelector('.btn-detalhe');
      if (btn) { btn.classList.remove('aberto'); btn.textContent = 'Detalhes'; }
    }
    if (detalheRow) detalheRow.style.display = visivel ? '' : 'none';

    if (visivel) visiveis++;
  });

  const total = allRows().length;
  document.getElementById('hist-count').textContent =
    visiveis === total
      ? `Mostrando ${total} de ${total} registros`
      : `${visiveis} resultado${visiveis !== 1 ? 's' : ''} encontrado${visiveis !== 1 ? 's' : ''}`;
}

document.getElementById('filter-acao').addEventListener('change', filtrar);
document.getElementById('filter-usuario').addEventListener('change', filtrar);
document.getElementById('filter-de').addEventListener('change', filtrar);
document.getElementById('filter-ate').addEventListener('change', filtrar);
document.getElementById('search-input').addEventListener('input', filtrar);

document.getElementById('btn-limpar').addEventListener('click', () => {
  document.getElementById('filter-acao').value    = '';
  document.getElementById('filter-usuario').value = '';
  document.getElementById('filter-de').value      = '';
  document.getElementById('filter-ate').value     = '';
  document.getElementById('search-input').value   = '';
  filtrar();
});

function sincronizarBling() {
  alert('Sincronização com Bling em breve!');
}
