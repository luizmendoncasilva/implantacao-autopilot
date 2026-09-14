/*
  Página de Documentação (prototype/docs/index.html) — lista os documentos de
  prototype/docs/content.js (window.DocsContent) e renderiza o markdown
  escolhido do lado direito, na mesma tela (opção "a" do enunciado: view
  interna lista+leitura, mais simples de manter do que uma página por
  documento dado que são poucos documentos hoje).
*/
(function () {
  const params = new URLSearchParams(window.location.search);
  const listEl = document.getElementById("docs-list");
  const readerEl = document.getElementById("docs-reader");
  // Chaves de window.DocsContent que não devem aparecer na lista — o conteúdo
// continua em content.js, só fica fora do card na tela. Edite este array
// para ocultar/reexibir um doc, sem precisar tocar em content.js.
const HIDDEN_DOCS = ["02-parametros-fiscais", "parametros-fiscais-arquitetura","cadastro-empresas-spec"];

const entries = Object.keys(window.DocsContent || {})
  .filter((key) => !HIDDEN_DOCS.includes(key))
  .map((key) => ({ key, ...window.DocsContent[key] }));
  function renderList(activeKey) {
    listEl.innerHTML = entries
      .map(
        (doc) => `
        <button type="button" class="list-row docs-list-row${doc.key === activeKey ? " is-active" : ""}" data-doc-key="${doc.key}">
          <span class="docs-list-icon">${Icon("file-text", "size-4")}</span>
          <span class="docs-list-text">
            <span class="docs-list-title">${doc.title}</span>
            <span class="docs-list-source">${doc.source}</span>
          </span>
        </button>`
      )
      .join("");

    listEl.querySelectorAll("[data-doc-key]").forEach((btn) => {
      btn.addEventListener("click", () => selectDoc(btn.getAttribute("data-doc-key")));
    });
  }

  function renderEmpty() {
    readerEl.innerHTML = `<div class="card"><div class="docs-reader-empty">Selecione um documento na lista ao lado para ler o conteúdo aqui.</div></div>`;
  }

  function renderDoc(doc) {
    const dirty = marked.parse(doc.markdown);
    const clean = DOMPurify.sanitize(dirty);
    readerEl.innerHTML = `
      <div class="card">
        <div class="card-header docs-reader-header">
          <div>
            <div class="card-title">${doc.title}</div>
            <div class="card-description">fonte: ${doc.source}</div>
          </div>
        </div>
        <div class="card-content docs-markdown">${clean}</div>
      </div>`;
  }

  function selectDoc(key) {
    const doc = window.DocsContent[key];
    if (!doc) return;
    const url = new URL(window.location.href);
    url.searchParams.set("doc", key);
    window.history.replaceState(null, "", url);
    renderList(key);
    renderDoc(doc);
    readerEl.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  renderList(params.get("doc"));
  if (params.get("doc") && window.DocsContent[params.get("doc")]) {
    renderDoc(window.DocsContent[params.get("doc")]);
  } else {
    renderEmpty();
  }
})();
