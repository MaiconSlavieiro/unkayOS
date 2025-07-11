// apps/about/main.js - menu dinâmico para docs markdown (corrigido para contexto do app)

const DOCS_PATH = '/docs/';

window.addEventListener('DOMContentLoaded', async () => {
  const appRoot = document.currentScript.closest('.app__content') || document.body;
  const docsList = appRoot.querySelector('#about-docs-list');
  const mainContent = appRoot.querySelector('#about-main-content');

  // Busca dinâmica dos arquivos .html na pasta docs
  let DOCS = [];
  try {
    const resp = await fetch(DOCS_PATH); // Tenta listar o diretório (requer suporte do servidor)
    if (resp.ok) {
      const html = await resp.text();
      // Extrai links para arquivos .html
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      const links = Array.from(tempDiv.querySelectorAll('a'));
      DOCS = links
        .map(a => a.getAttribute('href'))
        .filter(href => href && href.endsWith('.html'))
        .map(href => ({ file: href, label: href.replace('.html', '').replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) }));
    } else {
      throw new Error('Não foi possível listar os arquivos de documentação.');
    }
  } catch (e) {
    // Fallback: lista manual (caso o servidor não permita listar diretórios)
    DOCS = [
      { file: 'info.html', label: 'Informações' },
      { file: 'desktop-apps-guide.html', label: 'Guia Desktop Apps' },
      { file: 'refatoracao-shadow-dom.html', label: 'Refatoração Shadow DOM' },
      { file: 'CHANGELOG.html', label: 'Changelog' },
      { file: 'FAQ.html', label: 'FAQ' },
      { file: 'CONTRIBUTING.html', label: 'Contribuição' }
    ];
  }

  let selectedIdx = 0;

  function renderMenu() {
    docsList.innerHTML = '';
    DOCS.forEach((doc, idx) => {
      const li = document.createElement('li');
      li.textContent = doc.label;
      li.classList.add('about-doc-link');
      li.tabIndex = 0;
      if (idx === selectedIdx) li.classList.add('active');
      li.setAttribute('role', 'button');
      li.setAttribute('aria-current', idx === selectedIdx ? 'page' : 'false');
      li.addEventListener('click', () => selectDoc(idx));
      li.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          selectDoc(idx);
        }
      });
      docsList.appendChild(li);
    });
  }

  async function loadDoc(doc) {
    mainContent.innerHTML = '<p>Carregando...</p>';
    try {
      const resp = await fetch(DOCS_PATH + doc.file);
      if (!resp.ok) throw new Error('Erro ao carregar documento');
      const html = await resp.text();
      mainContent.innerHTML = html;
      mainContent.scrollTop = 0;
    } catch (err) {
      mainContent.innerHTML = `<p style="color:var(--color-error)">Erro ao carregar: ${doc.label}</p>`;
    }
  }

  function selectDoc(idx) {
    selectedIdx = idx;
    renderMenu();
    loadDoc(DOCS[selectedIdx]);
  }

  renderMenu();
  if (DOCS.length > 0) loadDoc(DOCS[0]);
});

// Estilo dinâmico para item ativo
document.addEventListener('DOMContentLoaded', () => {
  const style = document.createElement('style');
  style.innerHTML = `.about-doc-link.active { background: var(--color-primary-base); color: var(--color-dark-primary); font-weight: var(--font-weight-semibold); }`;
  document.head.appendChild(style);
});
