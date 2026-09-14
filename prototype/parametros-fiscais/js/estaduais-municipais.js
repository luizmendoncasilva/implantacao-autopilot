/*
  Aba "Estaduais e Municipais" — implementação de conteúdo, exclusiva da
  trilha Fiscal. Escopo EXCLUSIVO do MVP (docs/parametros-fiscais-as-built.md):
  "Condição de contribuinte de ICMS" (Estaduais), "Forma de cálculo do ISS" e
  "ISS fixo por classe profissional" (Municipais). Os demais campos das
  seções 6 e 7 de docs/02-parametros-fiscais.md (substituto tributário,
  IE por UF, FCP/FECP, benefícios de ICMS, SPED Fiscal, DIFAL, alíquota de
  ISS etc.) são Desejável/Fase 2 e não têm representação nesta etapa.

  Estrutura em duas seções expansíveis (docs/parametros-fiscais-arquitetura.md,
  seção 4.4: "organizadas como duas seções expansíveis dentro da mesma aba"):
  reaproveita o mesmo scaffold de accordion já definido para esta aba em
  fiscal-page.js (TABS[].sections e wireAccordions) — Estaduais aberta,
  Municipais recolhida, sem alterar o componente .accordion compartilhado.

  Jornada de edição dos 2 campos Manual de "Municipais" (correção de
  arquitetura — rodada de "Jornada de Edição", revisada): Drawer lateral,
  não edição inline na seção. Mesmo padrão de referência usado em
  gerais.js (SindicatoFormSheet / drawer "Editar empresa" de Empresas):
  "Editar" no cabeçalho da seção "Municipais" (visível só na vigência
  atual) abre um sheet lateral preenchido; a seção em si permanece 100%
  somente leitura. "Estaduais" (Condição de contribuinte, Cockpit) não tem
  nenhum botão — não possui campo Manual.

  Pendências FUNCIONAIS preservadas (não resolvidas nesta etapa — ver
  relatório da tarefa e o mapeamento validado anteriormente):
  - Granularidade empresa × estabelecimento: os 3 campos são exibidos por
    empresa selecionada (mesmo cadastro/seleção já usado por toda a Fiscal),
    sem nenhum seletor novo de UF/município/estabelecimento. Isso não
    resolve a pendência documentada sobre se ICMS/ISS deveriam ser
    segregados por estabelecimento — apenas mantém o comportamento atual.
  - Relação sugerida entre "Forma de cálculo do ISS" (D18) e "ISS fixo por
    classe profissional" (D19): os dicionários sugerem que o segundo campo
    só faz sentido quando o primeiro é "ISS fixo por profissional
    habilitado", mas nenhuma regra condicional de exibir/ocultar/desabilitar
    foi implementada — os dois campos são sempre renderizados juntos.

  Reaproveita FiscalGerais.renderNaoAplicavel para o mesmo gate de "empresa
  não optante pelo Simples Nacional" já usado por Gerais e Federais.
*/
(function (global) {
  const ORIGENS = global.OrigemBadge.ORIGENS;

  function accordionItem(titulo, aberto, contentHtml) {
    return (
      '<div class="accordion-item' + (aberto ? " is-open" : "") + '" data-accordion-item>' +
      '<button type="button" class="accordion-trigger" data-accordion-trigger>' +
      '<span class="accordion-trigger-title">' + titulo + "</span>" +
      '<span class="accordion-trigger-chev">' + Icon("chevron-down", "size-4") + "</span>" +
      "</button>" +
      '<div class="accordion-content">' + contentHtml + "</div></div>"
    );
  }

  // indicadorCarregando força o estado "loading" do único indicador
  // calculado desta aba — mesma simulação de carregamento já usada em
  // Gerais/Federais (ver fiscal-page.js).
  function renderConteudo(empresa, isReadOnly, vigenciaId, indicadorCarregando) {
    if (!empresa.optanteSimples) return global.FiscalGerais.renderNaoAplicavel(empresa, "Estaduais e Municipais");

    const dados = global.FiscalEstaduaisMunicipaisData.getDados(empresa.codigo, vigenciaId);

    // Regra documentada (D14): com Inscrição Estadual → Contribuinte; sem
    // Inscrição Estadual → Não contribuinte. "Não contribuinte" é um valor
    // de negócio normal deste campo, não um estado de indisponibilidade —
    // por isso nunca usa state "unavailable"/"not-applicable" aqui. Deriva
    // de empresa.dadosGerais.ie (EmpresasData, trilha Empresas) sem alterar
    // esse cadastro. Nos 5 mocks atuais, todas as empresas têm IE
    // preenchida, então o cenário "Não contribuinte" não tem demonstração
    // real nesta etapa (registrado no as-built como limitação de mock, sem
    // alterar EmpresasData nem inventar dado só para forçar o cenário).
    let condicaoContribuinteHtml;
    if (indicadorCarregando) {
      condicaoContribuinteHtml = global.IndicadorCalculado.render({
        label: "Condição de contribuinte de ICMS",
        origem: ORIGENS.COCKPIT,
        state: "loading",
      });
    } else {
      const contribuinte = !!empresa.dadosGerais.ie;
      condicaoContribuinteHtml = global.IndicadorCalculado.render({
        label: "Condição de contribuinte de ICMS",
        value: contribuinte ? "Contribuinte" : "Não contribuinte",
        origem: ORIGENS.COCKPIT,
        state: "available",
      });
    }

    const estaduaisContent = '<div class="detail-grid">' + condicaoContribuinteHtml + "</div>";

    const municipaisContent =
      '<div class="detail-grid">' +
      global.CampoOrigem.campo({ label: "Forma de cálculo do ISS", value: dados.formaCalculoIss, origem: ORIGENS.MANUAL }) +
      global.CampoOrigem.campo({ label: "ISS fixo por classe profissional", value: dados.issFixoClasseProfissional, origem: ORIGENS.MANUAL }) +
      "</div>";

    return (
      '<div class="accordion">' +
      accordionItem("Estaduais", true, estaduaisContent) +
      accordionItem("Municipais", false, municipaisContent) +
      "</div>"
    );
  }

  // ===== Drawer "Editar parâmetros municipais" =====
  function sheetMarkupEM() {
    return (
      '<div class="sheet-overlay" id="em-manual-overlay"></div>' +
      '<div class="sheet-panel" id="em-manual-panel" role="dialog" aria-modal="true" aria-labelledby="em-manual-title">' +
      '<button type="button" class="sheet-close" id="em-manual-close">' + Icon("x", "size-4") + "</button>" +
      '<div class="sheet-header">' +
      '<div class="sheet-title" id="em-manual-title">Editar parâmetros municipais</div>' +
      '<div class="sheet-description">Altere os parâmetros de origem Manual de Municipais.</div>' +
      "</div>" +
      '<div class="sheet-body" id="em-manual-body" style="padding-bottom:16px;"></div>' +
      '<div class="sheet-footer">' +
      '<button type="button" class="btn btn-outline" id="em-manual-cancelar">Cancelar</button>' +
      '<button type="button" class="btn" id="em-manual-salvar">Salvar</button>' +
      "</div>" +
      "</div>"
    );
  }

  function ensureDrawerEM() {
    if (document.getElementById("em-manual-panel")) return;
    const wrapper = document.createElement("div");
    wrapper.innerHTML = sheetMarkupEM();
    while (wrapper.firstChild) document.body.appendChild(wrapper.firstChild);

    document.getElementById("em-manual-overlay").addEventListener("click", fecharDrawerEM);
    document.getElementById("em-manual-close").addEventListener("click", fecharDrawerEM);
    document.getElementById("em-manual-cancelar").addEventListener("click", fecharDrawerEM);
    document.getElementById("em-manual-salvar").addEventListener("click", salvarDrawerEM);
  }

  function selectEdit(id, valor, opcoes) {
    const optsHtml = opcoes.map((o) => '<option value="' + o + '"' + (valor === o ? " selected" : "") + ">" + o + "</option>").join("");
    return (
      '<div class="field-select-wrap"><select class="field-select" id="' + id + '">' + optsHtml + "</select>" +
      '<span class="chev">' + Icon("chevron-down", "size-4") + "</span></div>"
    );
  }

  function preencherDrawerEM(empresa, vigenciaId) {
    const dados = global.FiscalEstaduaisMunicipaisData.getDados(empresa.codigo, vigenciaId);
    document.getElementById("em-manual-body").innerHTML =
      '<div class="sheet-field"><label class="field-label" for="select-forma-calculo-iss">Forma de cálculo do ISS</label>' +
      selectEdit("select-forma-calculo-iss", dados.formaCalculoIss, global.FiscalEstaduaisMunicipaisData.OPCOES_FORMA_CALCULO_ISS) +
      "</div>" +
      '<div class="sheet-field"><label class="field-label" for="select-iss-fixo-classe">ISS fixo por classe profissional</label>' +
      selectEdit("select-iss-fixo-classe", dados.issFixoClasseProfissional, global.FiscalEstaduaisMunicipaisData.OPCOES_CLASSE_PROFISSIONAL) +
      "</div>";
  }

  let empresaDrawerEM = null;
  let vigenciaDrawerEM = null;
  let onSalvarDrawerEM = null;

  function abrirDrawerEM(empresa, vigenciaId, onSalvar) {
    ensureDrawerEM();
    empresaDrawerEM = empresa;
    vigenciaDrawerEM = vigenciaId;
    onSalvarDrawerEM = onSalvar;
    preencherDrawerEM(empresa, vigenciaId);
    UI.openSheet(document.getElementById("em-manual-overlay"), document.getElementById("em-manual-panel"));
  }

  function fecharDrawerEM() {
    UI.closeSheet(document.getElementById("em-manual-overlay"), document.getElementById("em-manual-panel"));
  }

  function salvarDrawerEM() {
    const novosValores = {
      formaCalculoIss: document.getElementById("select-forma-calculo-iss").value,
      issFixoClasseProfissional: document.getElementById("select-iss-fixo-classe").value,
    };
    global.FiscalEstaduaisMunicipaisData.setDadosManuais(empresaDrawerEM.codigo, vigenciaDrawerEM, novosValores);
    fecharDrawerEM();
    UI.showToast("Parâmetros salvos", "Os campos municipais de " + empresaDrawerEM.nome + " foram atualizados.");
    if (onSalvarDrawerEM) onSalvarDrawerEM();
  }

  // Chamada pelo shell (fiscal-page.js) a partir do botão "Editar" que vive
  // fora do accordion, na faixa de ação entre a barra de abas e o
  // conteúdo — o shell também cuida de preservar o accordion aberto após
  // salvar (ver rerenderTabPreservandoAccordion em fiscal-page.js).
  function abrirEdicao(empresa, vigenciaId, onSalvo) {
    abrirDrawerEM(empresa, vigenciaId, onSalvo);
  }

  global.FiscalEstaduaisMunicipais = { renderConteudo: renderConteudo, abrirEdicao: abrirEdicao };
})(window);
