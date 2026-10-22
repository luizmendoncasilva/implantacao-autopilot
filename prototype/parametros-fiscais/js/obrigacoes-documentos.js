/*
  Aba "Obrigações e Documentos Fiscais" — implementação de conteúdo,
  exclusiva da trilha Fiscal. MVP (docs/02-parametros-fiscais.md, seções 9
  e 11, campos Essenciais): "Documentos fiscais emitidos" e "Série e
  numeração" (seção "Documentos Fiscais") + "PGDAS-D e DAS", "Guias
  avulsas de ICMS e ISS", "DEFIS", "DASN-SIMEI" e "eSocial —
  parametrização básica" (seção "Obrigações Acessórias").

  Rodada de complementação de conteúdo (docs/02-parametros-fiscais.md,
  seção 11, campos Desejável) adiciona a "Obrigações Acessórias": "DeSTDA"
  (Regra fixa/Sistema, somente leitura — mesma nota documentada de
  habilitação automática de DEFIS/DASN-SIMEI, aqui condicionada à
  inscrição estadual), "DTE-SN" (Checkbox, Manual), "Procuração eletrônica
  / Integra Contador" (D23, Lista suspensa, Manual), "EFD-Reinf e
  DCTFWeb" (Checkbox, Manual), "EFD-ICMS/IPI (SPED Fiscal)" (Checkbox,
  Manual) e "MIT" (Checkbox, Manual). EFD-Contribuições/ECF-e-LALUR/SPED
  Contábil (Fora de escopo) NÃO são implementados.

  "SINTEGRA" (rodada "Ajuste — Obrigações e Documentos Fiscais",
  2026-09-09): documentado como Fase 2, mas tornado **funcional** por
  decisão explícita de produto desta rodada — Checkbox/Manual/drawer, sem
  nenhuma indicação visual de Fase 2 (mesmo critério já aplicado aos 3
  campos de Estaduais e Municipais na rodada anterior). A prioridade
  documentada não mudou — só a representação/interatividade na interface.

  "Documentos fiscais emitidos" (rodada "Correção visual/funcional — D22",
  2026-09-09, terceira rodada do dia): revertida a tentativa anterior de
  checklist somente leitura no card (que expunha os 9 itens permanentemente
  na tela principal) — o padrão correto, confirmado pela decisão de
  produto, é o mesmo já usado por D08 (Segmento de atividade especial,
  gerais.js): no card, badges só dos itens selecionados; a seleção dos 9
  itens do catálogo (`OPCOES_DOCUMENTOS_FISCAIS`) acontece dentro do
  drawer, como checklist múltiplo editável. **D22 passou a ser Manual**
  (não mais BHules) — mesma resolução já aplicada a "Regime de
  reconhecimento de receita"/D06 (`docs/parametros-fiscais-as-built.md`,
  seção 13: quando o Tipo documentado implica edição mas a Origem
  documentada implica somente leitura, e o produto decide que o campo é de
  fato editável pelo usuário, a origem exibida passa a ser Manual — não se
  mantém uma origem externa contraditória com um campo que o usuário
  edita). Drawer, persistência (mesma chave já existente) e Histórico
  (mesmo tratamento de array pré-formatado já usado por
  "Reduções e deduções da base do SN"/D16 e por "Segmento de atividade
  especial"/D08) seguem exatamente os padrões já estabelecidos nesta
  trilha — nenhum mecanismo paralelo foi criado.

  Estrutura em duas seções expansíveis (docs/parametros-fiscais-
  arquitetura.md, seção 4.6: "organizadas como duas seções dentro da mesma
  aba"): reaproveita o mesmo scaffold de accordion já reservado para esta
  aba em fiscal-page.js (TABS[].sections) — "Obrigações Acessórias" aberta
  por padrão (seção com os campos Manual, ver renderConteudo), "Documentos
  Fiscais" recolhida (ordem das seções na tela inalterada — só o estado
  aberto/fechado inicial mudou), sem alterar o componente .accordion
  compartilhado.

  Decisão de arquitetura registrada (seção 4.6): "distinguir visualmente o
  que é auto-habilitado e somente leitura (DEFIS, DASN-SIMEI, DeSTDA,
  PGDAS-D/DAS) do que exige configuração manual (eSocial e os demais
  campos Manual desta rodada)" — refletida abaixo por origem
  (Sistema/Motor de cálculo vs. Manual), não por uma seção visual à parte.

  "Cadastro Repetível" (docs/parametros-fiscais-arquitetura.md, seção
  "Componentes que devem ser desenhados desde já") ainda NÃO foi construído
  como componente compartilhado genérico — "Série e numeração" é 100%
  somente leitura nesta fase (origem BHules), então usa uma tabela simples
  já padrão no protótipo (`.table-wrap`/`.dtable`), em vez de antecipar um
  componente de grade editável (adicionar/editar/remover linha) que nenhum
  campo desta etapa realmente precisa ainda.

  Jornada de edição dos campos Manual (correção de arquitetura — rodada de
  "Jornada de Edição", revisada): Drawer lateral, não edição inline na
  seção. Mesmo padrão de referência usado em gerais.js/estaduais-
  municipais.js/contabil-fiscal.js (SindicatoFormSheet / drawer "Editar
  empresa" de Empresas): "Editar" no cabeçalho da seção "Obrigações
  Acessórias" (visível só na vigência atual) abre um sheet lateral
  preenchido com os campos Manual editáveis e os campos Sistema/Motor de
  cálculo da mesma seção bloqueados, para contexto. "Documentos Fiscais"
  não tem nenhum botão — não possui campo Manual.

  Reaproveita FiscalGerais.renderNaoAplicavel para o mesmo gate de "empresa
  não optante pelo Simples Nacional" já usado pelas demais abas.
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

  // "Documentos fiscais emitidos" (D22) — exibição no card: badges só dos
  // itens selecionados, mesmo padrão de "Segmento de atividade especial"
  // (D08, `badgesSegmento`, gerais.js) e de "Reduções e deduções da base
  // do SN" (D16, `badgesLista`, parametros-estaduais-municipais.js) — os 9
  // itens do catálogo não ficam expostos permanentemente na tela
  // principal; a seleção completa só aparece no drawer (ver
  // checklistDocumentosFiscaisHtml, abaixo).
  function badgesDocumentos(lista) {
    return lista.length
      ? lista.map((d) => '<span class="badge badge-secondary">' + d + "</span>").join("")
      : '<span class="italic text-muted">Nenhum item selecionado.</span>';
  }

  // "Série e numeração" não cabe no formato de linha única de CampoOrigem —
  // monta o mesmo par label+badge de origem usado por CampoOrigem, seguido
  // de uma tabela somente leitura (.table-wrap/.dtable, já padrão no
  // protótipo — ver Empresas > Contadores/Sócios).
  //
  // Fora do .detail-grid (rodada "Última Refinação — Parâmetros Fiscais",
  // ajuste P1): como campo direto de .detail-grid com `detail-field-wide`
  // (span de só 2 das N colunas de auto-fit), a tabela de 4 colunas ficava
  // mais estreita que seu conteúdo em 1280px (451px de área x 517px de
  // conteúdo), cortando visualmente a coluna "Estabelecimento" sem nenhuma
  // pista de que a tabela rolava (.table-wrap já tinha overflow-x:auto,
  // mas isso não bastava). Passou a ser renderizada como irmã do
  // .detail-grid, ocupando a largura total da seção — resolve o corte sem
  // remover coluna, sem alterar dado, sem criar tabela nova e sem tocar
  // .table-wrap/.dtable (componentes compartilhados intocados).
  function tabelaSerieNumeracao(linhas) {
    const rows = linhas.length
      ? linhas
          .map(
            (l) =>
              "<tr><td>" + l.tipoDocumento + "</td><td>" + l.serie + "</td><td>" + l.numeracao + "</td><td>" + l.estabelecimento + "</td></tr>"
          )
          .join("")
      : '<tr><td colspan="4" class="row-empty-state">Nenhuma série cadastrada no BHules.</td></tr>';
    return (
      '<div class="detail-field">' +
      '<span class="detail-field-label">Série e numeração</span>' +
      '<div class="flex items-center gap-2" style="margin-bottom:8px;">' + global.OrigemBadge.render(ORIGENS.BHULES) + "</div>" +
      '<div class="table-wrap"><table class="dtable dtable-compact">' +
      "<thead><tr><th>Tipo de documento</th><th>Série</th><th>Numeração</th><th>Estabelecimento</th></tr></thead>" +
      "<tbody>" + rows + "</tbody></table></div>" +
      "</div>"
    );
  }

  function renderConteudo(empresa, isReadOnly, vigenciaId, indicadorCarregando) {
    if (!empresa.optanteSimples) return global.FiscalGerais.renderNaoAplicavel(empresa, "Obrigações e Documentos Fiscais");

    const dadosGerais = global.FiscalGeraisData.getDadosGerais(empresa.codigo, vigenciaId);
    const dados = global.FiscalObrigacoesDocumentosData.getDados(empresa.codigo, vigenciaId);

    const documentosFiscaisContent =
      '<div class="flex flex-col gap-4">' +
      '<div class="detail-grid">' +
      global.CampoOrigem.campo({
        label: "Documentos fiscais emitidos",
        value: badgesDocumentos(dados.documentosFiscaisEmitidos),
        origem: ORIGENS.MANUAL,
        origemEditavel: !isReadOnly,
        origemCampoKey: "documentos-fiscais-checklist",
        wide: true,
      }) +
      "</div>" +
      tabelaSerieNumeracao(dados.serieNumeracao) +
      "</div>";

    // PGDAS-D e DAS: único campo desta aba com Indicador Calculado
    // (Motor de cálculo) — mesma simulação de carregamento já usada em
    // Gerais/Federais/Estaduais e Municipais.
    let pgdasHtml;
    if (indicadorCarregando) {
      pgdasHtml = global.IndicadorCalculado.render({ label: "PGDAS-D e DAS", origem: ORIGENS.MOTOR_CALCULO, state: "loading" });
    } else {
      pgdasHtml = global.IndicadorCalculado.render({
        label: "PGDAS-D e DAS",
        value: global.FiscalObrigacoesDocumentosData.PGDAS_DAS_STATUS,
        origem: ORIGENS.MOTOR_CALCULO,
        state: "available",
        wide: true,
      });
    }

    // DEFIS: dentro desta aba a empresa já é sempre optante do Simples
    // Nacional (gate acima) — por isso é sempre "Habilitada" aqui, sem
    // inventar uma condição adicional (docs/02-parametros-fiscais.md,
    // seção 11: "Habilitada automaticamente para optante do Simples
    // Nacional").
    const defisTexto = "Habilitada — optante do Simples Nacional.";
    const defisHtml = global.CampoOrigem.campo({ label: "DEFIS", value: defisTexto, origem: ORIGENS.SISTEMA, wide: true });

    // DASN-SIMEI: depende do campo MEI já existente em Gerais
    // (FiscalGeraisData) — "Habilitada automaticamente para MEI,
    // substituindo a DEFIS" (seção 11). Nenhum mock atual tem MEI = "Sim"
    // (ver as-built, limitação de mock já registrada para outros campos
    // condicionados a dados hoje ausentes nos mocks principais) — a lógica
    // foi verificada isoladamente (ver relatório da tarefa).
    const isMei = dadosGerais.mei === "Sim";
    const dasnSimeiTexto = isMei ? "Habilitada — substitui a DEFIS (MEI)." : "Não habilitada — empresa não é MEI.";
    const dasnSimeiHtml = global.CampoOrigem.campo({ label: "DASN-SIMEI", value: dasnSimeiTexto, origem: ORIGENS.SISTEMA, wide: true });

    // Guias avulsas de ICMS e ISS: regra fixa documentada ("habilitadas
    // automaticamente com excesso de sublimite... geradas por ação humana a
    // partir da pendência da seção 3"). Nenhum mock desta trilha modela uma
    // flag de "empresa acima do sublimite" por empresa — o texto exibido é
    // a regra geral, não uma habilitação condicional simulada (ver
    // comentário em obrigacoes-documentos-data.js e o as-built).
    const guiasAvulsasTexto = "Habilitadas automaticamente com excesso de sublimite; geradas por ação humana a partir da pendência de sublimite.";
    const guiasAvulsasHtml = global.CampoOrigem.campo({ label: "Guias avulsas de ICMS e ISS", value: guiasAvulsasTexto, origem: ORIGENS.SISTEMA, wide: true });

    const esocialHtml = global.CampoOrigem.campo({
      label: "eSocial — parametrização básica",
      value: dados.esocialParametrizacaoBasica ? "Ativo" : "Inativo",
      origem: ORIGENS.MANUAL,
      origemEditavel: !isReadOnly,
      origemCampoKey: "checkbox-esocial",
    });

    // DeSTDA: Regra fixa/Sistema, somente leitura — "habilitada
    // automaticamente para optante do SN com inscrição estadual" (docs/02-
    // parametros-fiscais.md, seção 11, nota). Mesmo critério de IE já usado
    // por "Condição de contribuinte de ICMS" (parametros-estaduais-municipais.js),
    // sem duplicar essa regra como um novo mock.
    const temIe = !!empresa.dadosGerais.ie;
    const destdaTexto = temIe ? "Habilitada — optante do Simples Nacional com inscrição estadual." : "Não habilitada — empresa sem inscrição estadual.";
    const destdaHtml = global.CampoOrigem.campo({ label: "DeSTDA", value: destdaTexto, origem: ORIGENS.SISTEMA, wide: true });

    const dteSnHtml = global.CampoOrigem.campo({
      label: "DTE-SN — Domicílio Tributário Eletrônico",
      value: dados.dteSnAtivo ? "Ativo" : "Inativo",
      origem: ORIGENS.MANUAL,
      origemEditavel: !isReadOnly,
      origemCampoKey: "checkbox-dte-sn",
    });

    const procuracaoHtml = global.CampoOrigem.campo({
      label: "Procuração eletrônica / Integra Contador",
      value: dados.procuracaoEletronicaIntegraContador,
      origem: ORIGENS.MANUAL,
      origemEditavel: !isReadOnly,
      origemCampoKey: "select-procuracao-integra-contador",
    });

    const efdReinfHtml = global.CampoOrigem.campo({
      label: "EFD-Reinf e DCTFWeb",
      value: dados.efdReinfDctfWebAtivo ? "Ativo" : "Inativo",
      origem: ORIGENS.MANUAL,
      origemEditavel: !isReadOnly,
      origemCampoKey: "checkbox-efd-reinf",
    });

    const efdIcmsIpiHtml = global.CampoOrigem.campo({
      label: "EFD-ICMS/IPI (SPED Fiscal)",
      value: dados.efdIcmsIpiAtivo ? "Ativo" : "Inativo",
      origem: ORIGENS.MANUAL,
      origemEditavel: !isReadOnly,
      origemCampoKey: "checkbox-efd-icms-ipi",
    });

    const mitHtml = global.CampoOrigem.campo({
      label: "MIT — Módulo de Inclusão de Tributos",
      value: dados.mitAtivo ? "Ativo" : "Inativo",
      origem: ORIGENS.MANUAL,
      origemEditavel: !isReadOnly,
      origemCampoKey: "checkbox-mit",
    });

    // SINTEGRA: documentado como Fase 2 (docs/02-parametros-fiscais.md,
    // seção 11), tornado funcional nesta rodada por decisão de produto —
    // mesmo padrão Manual/checkbox/drawer dos demais campos desta seção,
    // sem nenhuma indicação visual de Fase 2 (mesmo critério já aplicado
    // aos 3 campos de Estaduais e Municipais).
    const sintegraHtml = global.CampoOrigem.campo({
      label: "SINTEGRA",
      value: dados.sintegraAtivo ? "Ativo" : "Inativo",
      origem: ORIGENS.MANUAL,
      origemEditavel: !isReadOnly,
      origemCampoKey: "checkbox-sintegra",
    });

    const obrigacoesAcessoriasContent =
      '<div class="detail-grid">' +
      pgdasHtml + guiasAvulsasHtml + defisHtml + dasnSimeiHtml + destdaHtml + esocialHtml +
      dteSnHtml + procuracaoHtml + efdReinfHtml + efdIcmsIpiHtml + mitHtml + sintegraHtml +
      "</div>";

    // "Obrigações Acessórias" aberta por padrão (rodada "Última Refinação —
    // Parâmetros Fiscais", ajuste P2): é a seção com o único campo Manual
    // ("eSocial — parametrização básica") desta aba — mesmo raciocínio de
    // parametros-estaduais-municipais.js. "Documentos Fiscais" continua acessível
    // normalmente, só recolhida por padrão.
    return (
      '<div class="accordion">' +
      accordionItem("Documentos Fiscais", false, documentosFiscaisContent) +
      accordionItem("Obrigações Acessórias", true, obrigacoesAcessoriasContent) +
      "</div>"
    );
  }

  // ===== Drawer "Editar obrigações e documentos fiscais" =====
  // Título ampliado nesta rodada (2026-09-09) — o drawer passou a cobrir
  // campos Manual das DUAS seções da aba (Documentos Fiscais e Obrigações
  // Acessórias), não só Obrigações Acessórias — mesmo ajuste já feito em
  // parametros-estaduais-municipais.js quando "Estaduais" ganhou seus
  // primeiros campos Manual. Continua um único drawer (nenhum novo criado).
  function sheetMarkupOD() {
    return (
      '<div class="sheet-overlay" id="od-manual-overlay"></div>' +
      '<div class="sheet-panel" id="od-manual-panel" role="dialog" aria-modal="true" aria-labelledby="od-manual-title">' +
      '<button type="button" class="sheet-close" id="od-manual-close">' + Icon("x", "size-4") + "</button>" +
      '<div class="sheet-header">' +
      '<div class="sheet-title" id="od-manual-title">Editar obrigações e documentos fiscais</div>' +
      '<div class="sheet-description">Altere os parâmetros de origem Manual desta aba. Os demais campos são exibidos apenas para contexto e não podem ser alterados por aqui.</div>' +
      "</div>" +
      '<div class="sheet-body" id="od-manual-body" style="padding-bottom:16px;"></div>' +
      '<div class="sheet-footer">' +
      '<button type="button" class="btn btn-outline" id="od-manual-cancelar">Cancelar</button>' +
      '<button type="button" class="btn" id="od-manual-salvar">Salvar</button>' +
      "</div>" +
      "</div>"
    );
  }

  function ensureDrawerOD() {
    if (document.getElementById("od-manual-panel")) return;
    const wrapper = document.createElement("div");
    wrapper.innerHTML = sheetMarkupOD();
    while (wrapper.firstChild) document.body.appendChild(wrapper.firstChild);

    document.getElementById("od-manual-overlay").addEventListener("click", fecharDrawerOD);
    document.getElementById("od-manual-close").addEventListener("click", fecharDrawerOD);
    document.getElementById("od-manual-cancelar").addEventListener("click", fecharDrawerOD);
    document.getElementById("od-manual-salvar").addEventListener("click", salvarDrawerOD);
  }

  function campoBloqueado(label, valor) {
    return (
      '<div class="sheet-field">' +
      '<label class="field-label">' + label + "</label>" +
      '<div class="sheet-field-locked-value">' + Icon("lock", "size-3-5") + "<span>" + valor + "</span></div>" +
      "</div>"
    );
  }

  function checkboxEdit(id, label, checked) {
    return (
      '<div class="sheet-field">' +
      '<label class="ucheckbox" id="' + id + '"><span class="ucheckbox-box' + (checked ? " is-checked" : "") + '">' + Icon("check", "size-4") + '</span><span class="ucheckbox-label">' + label + "</span></label>" +
      "</div>"
    );
  }

  function wireCheckbox(id) {
    document.getElementById(id).addEventListener("click", (e) => {
      e.preventDefault();
      document.querySelector("#" + id + " .ucheckbox-box").classList.toggle("is-checked");
    });
  }

  function selectEdit(id, valor, opcoes) {
    const optsHtml = opcoes.map((o) => '<option value="' + o + '"' + (valor === o ? " selected" : "") + ">" + o + "</option>").join("");
    return (
      '<div class="field-select-wrap"><select class="field-select" id="' + id + '">' + optsHtml + "</select>" +
      '<span class="chev">' + Icon("chevron-down", "size-4") + "</span></div>"
    );
  }

  // Checklist de D22 (Lista múltipla) — mesmo padrão já usado para D08
  // (checklistSegmentoHtml/wireChecklistSegmento/lerChecklistSegmento,
  // gerais.js), replicado localmente aqui (nenhuma função compartilhada
  // entre módulos de aba, mesmo critério já adotado nesta trilha). Sem
  // opção "Nenhum"/exclusividade mútua — o dicionário D22 não tem uma.
  function checklistDocumentosFiscaisHtml(selecionados) {
    const opcoes = global.FiscalObrigacoesDocumentosData.OPCOES_DOCUMENTOS_FISCAIS;
    return (
      '<div class="sheet-field"><label class="field-label">Documentos fiscais emitidos</label>' +
      '<div class="flex flex-col gap-2" id="documentos-fiscais-checklist">' +
      opcoes
        .map(
          (o) =>
            '<label class="ucheckbox" data-documento-opcao="' + o.replace(/"/g, "&quot;") + '"><span class="ucheckbox-box' +
            (selecionados.indexOf(o) !== -1 ? " is-checked" : "") + '">' + Icon("check", "size-4") + '</span><span class="ucheckbox-label">' + o + "</span></label>"
        )
        .join("") +
      "</div></div>"
    );
  }

  function wireChecklistDocumentosFiscais() {
    const container = document.getElementById("documentos-fiscais-checklist");
    container.querySelectorAll("[data-documento-opcao]").forEach((label) => {
      label.addEventListener("click", (e) => {
        e.preventDefault();
        label.querySelector(".ucheckbox-box").classList.toggle("is-checked");
      });
    });
  }

  function lerChecklistDocumentosFiscais() {
    const container = document.getElementById("documentos-fiscais-checklist");
    const selecionados = [];
    container.querySelectorAll("[data-documento-opcao]").forEach((label) => {
      if (label.querySelector(".ucheckbox-box").classList.contains("is-checked")) {
        selecionados.push(label.getAttribute("data-documento-opcao"));
      }
    });
    return selecionados;
  }

  function preencherDrawerOD(empresa, vigenciaId) {
    const dadosGerais = global.FiscalGeraisData.getDadosGerais(empresa.codigo, vigenciaId);
    const dados = global.FiscalObrigacoesDocumentosData.getDados(empresa.codigo, vigenciaId);
    const isMei = dadosGerais.mei === "Sim";
    const temIe = !!empresa.dadosGerais.ie;
    document.getElementById("od-manual-body").innerHTML =
      '<div class="subcard">' +
      '<div class="subcard-title">Documentos Fiscais</div>' +
      checklistDocumentosFiscaisHtml(dados.documentosFiscaisEmitidos) +
      "</div>" +
      '<div class="subcard">' +
      '<div class="subcard-title">Obrigações Acessórias</div>' +
      campoBloqueado("PGDAS-D e DAS", global.FiscalObrigacoesDocumentosData.PGDAS_DAS_STATUS) +
      campoBloqueado("Guias avulsas de ICMS e ISS", "Habilitadas automaticamente com excesso de sublimite; geradas por ação humana a partir da pendência de sublimite.") +
      campoBloqueado("DEFIS", "Habilitada — optante do Simples Nacional.") +
      campoBloqueado("DASN-SIMEI", isMei ? "Habilitada — substitui a DEFIS (MEI)." : "Não habilitada — empresa não é MEI.") +
      campoBloqueado("DeSTDA", temIe ? "Habilitada — optante do Simples Nacional com inscrição estadual." : "Não habilitada — empresa sem inscrição estadual.") +
      checkboxEdit("checkbox-esocial", "eSocial — parametrização básica", dados.esocialParametrizacaoBasica) +
      checkboxEdit("checkbox-dte-sn", "DTE-SN — Domicílio Tributário Eletrônico", dados.dteSnAtivo) +
      '<div class="sheet-field"><label class="field-label" for="select-procuracao-integra-contador">Procuração eletrônica / Integra Contador</label>' +
      selectEdit("select-procuracao-integra-contador", dados.procuracaoEletronicaIntegraContador, global.FiscalObrigacoesDocumentosData.OPCOES_PROCURACAO_INTEGRA_CONTADOR) +
      "</div>" +
      checkboxEdit("checkbox-efd-reinf", "EFD-Reinf e DCTFWeb", dados.efdReinfDctfWebAtivo) +
      checkboxEdit("checkbox-efd-icms-ipi", "EFD-ICMS/IPI (SPED Fiscal)", dados.efdIcmsIpiAtivo) +
      checkboxEdit("checkbox-mit", "MIT — Módulo de Inclusão de Tributos", dados.mitAtivo) +
      checkboxEdit("checkbox-sintegra", "SINTEGRA", dados.sintegraAtivo) +
      "</div>";

    wireChecklistDocumentosFiscais();
    wireCheckbox("checkbox-esocial");
    wireCheckbox("checkbox-dte-sn");
    wireCheckbox("checkbox-efd-reinf");
    wireCheckbox("checkbox-efd-icms-ipi");
    wireCheckbox("checkbox-mit");
    wireCheckbox("checkbox-sintegra");
  }

  let empresaDrawerOD = null;
  let vigenciaDrawerOD = null;
  let onSalvarDrawerOD = null;

  // Ver equivalente comentado em gerais.js.
  function focarCampoDrawer(focusId) {
    if (!focusId) return;
    const el = document.getElementById(focusId);
    if (!el) return;
    if (typeof el.scrollIntoView === "function") el.scrollIntoView({ block: "center" });
    if (typeof el.focus === "function") el.focus();
  }

  function abrirDrawerOD(empresa, vigenciaId, onSalvar, focusId) {
    ensureDrawerOD();
    empresaDrawerOD = empresa;
    vigenciaDrawerOD = vigenciaId;
    onSalvarDrawerOD = onSalvar;
    preencherDrawerOD(empresa, vigenciaId);
    UI.openSheet(document.getElementById("od-manual-overlay"), document.getElementById("od-manual-panel"));
    focarCampoDrawer(focusId);
  }

  function fecharDrawerOD() {
    UI.closeSheet(document.getElementById("od-manual-overlay"), document.getElementById("od-manual-panel"));
  }

  // Rótulo do único campo Manual desta aba, para o Histórico de Alterações
  // (docs/parametros-fiscais-as-built.md, "Vigência Funcional") — só para
  // o diff do evento, sem relação com a renderização do card/drawer.
  const LABELS_HISTORICO_OD = {
    documentosFiscaisEmitidos: "Documentos fiscais emitidos",
    esocialParametrizacaoBasica: "eSocial — parametrização básica",
    dteSnAtivo: "DTE-SN — Domicílio Tributário Eletrônico",
    procuracaoEletronicaIntegraContador: "Procuração eletrônica / Integra Contador",
    efdReinfDctfWebAtivo: "EFD-Reinf e DCTFWeb",
    efdIcmsIpiAtivo: "EFD-ICMS/IPI (SPED Fiscal)",
    mitAtivo: "MIT — Módulo de Inclusão de Tributos",
    sintegraAtivo: "SINTEGRA",
  };

  const FORMATADORES_HISTORICO_OD = {
    esocialParametrizacaoBasica: (v) => (v ? "Ativo" : "Inativo"),
    dteSnAtivo: (v) => (v ? "Ativo" : "Inativo"),
    efdReinfDctfWebAtivo: (v) => (v ? "Ativo" : "Inativo"),
    efdIcmsIpiAtivo: (v) => (v ? "Ativo" : "Inativo"),
    mitAtivo: (v) => (v ? "Ativo" : "Inativo"),
    sintegraAtivo: (v) => (v ? "Ativo" : "Inativo"),
    // documentosFiscaisEmitidos (array) NÃO entra aqui — ver
    // formatarDocumentosParaDiff abaixo: precisa ser convertido para texto
    // ANTES do diff, não depois (mesmo motivo já registrado em gerais.js
    // para segmentoAtividadeEspecial/D08 e em parametros-estaduais-
    // municipais.js para reducoesDeducoesBaseSn/D16).
  };

  // diffCampos compara "antes[chave] === depois[chave]" por igualdade
  // estrita (historico-eventos.js) — dois arrays com o mesmo conteúdo
  // nunca são === entre si. Por isso o valor é convertido para texto
  // (join) antes de chamar diffCampos, não depois.
  function formatarDocumentosParaDiff(v) {
    return Array.isArray(v) && v.length ? v.join(", ") : "—";
  }

  function salvarDrawerOD() {
    const anterior = global.FiscalObrigacoesDocumentosData.getDados(empresaDrawerOD.codigo, vigenciaDrawerOD);
    const novosValores = {
      documentosFiscaisEmitidos: lerChecklistDocumentosFiscais(),
      esocialParametrizacaoBasica: document.querySelector("#checkbox-esocial .ucheckbox-box").classList.contains("is-checked"),
      dteSnAtivo: document.querySelector("#checkbox-dte-sn .ucheckbox-box").classList.contains("is-checked"),
      procuracaoEletronicaIntegraContador: document.getElementById("select-procuracao-integra-contador").value,
      efdReinfDctfWebAtivo: document.querySelector("#checkbox-efd-reinf .ucheckbox-box").classList.contains("is-checked"),
      efdIcmsIpiAtivo: document.querySelector("#checkbox-efd-icms-ipi .ucheckbox-box").classList.contains("is-checked"),
      mitAtivo: document.querySelector("#checkbox-mit .ucheckbox-box").classList.contains("is-checked"),
      sintegraAtivo: document.querySelector("#checkbox-sintegra .ucheckbox-box").classList.contains("is-checked"),
    };
    global.FiscalObrigacoesDocumentosData.setDadosManuais(empresaDrawerOD.codigo, vigenciaDrawerOD, novosValores);
    const anteriorParaDiff = Object.assign({}, anterior, { documentosFiscaisEmitidos: formatarDocumentosParaDiff(anterior.documentosFiscaisEmitidos) });
    const novosValoresParaDiff = Object.assign({}, novosValores, { documentosFiscaisEmitidos: formatarDocumentosParaDiff(novosValores.documentosFiscaisEmitidos) });
    const alteracoes = global.FiscalHistoricoEventos.diffCampos(LABELS_HISTORICO_OD, anteriorParaDiff, novosValoresParaDiff, FORMATADORES_HISTORICO_OD);
    if (alteracoes.length) {
      global.FiscalHistoricoEventos.registrarEventoHistoricoFiscal(empresaDrawerOD.codigo, "Obrigações e Documentos Fiscais", vigenciaDrawerOD, alteracoes);
    }
    fecharDrawerOD();
    UI.showToast("Parâmetros salvos", "As obrigações e documentos fiscais de " + empresaDrawerOD.nome + " foram atualizados.");
    if (onSalvarDrawerOD) onSalvarDrawerOD();
  }

  // Chamada pelo shell (fiscal-page.js) a partir do botão "Editar" que vive
  // fora do accordion, na faixa de ação entre a barra de abas e o
  // conteúdo — o shell também cuida de preservar o accordion aberto após
  // salvar (ver rerenderTabPreservandoAccordion em fiscal-page.js).
  function abrirEdicao(empresa, vigenciaId, onSalvo, focusId) {
    abrirDrawerOD(empresa, vigenciaId, onSalvo, focusId);
  }

  global.FiscalObrigacoesDocumentos = { renderConteudo: renderConteudo, abrirEdicao: abrirEdicao };
})(window);
