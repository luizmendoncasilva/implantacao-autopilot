/*
  Aba "Estaduais e Municipais" — implementação de conteúdo, exclusiva da
  trilha Fiscal. Arquivo renomeado em 2026-09-09 (de estaduais-municipais.js/
  estaduais-municipais-data.js) para nomenclatura explícita — as duas
  seções internas passaram a se chamar "Parâmetros Estaduais" e
  "Parâmetros Municipais" (ver accordionItem/subcard-title abaixo). O nome
  da aba em si (`fiscal-page.js`, TABS[].label = "Estaduais e Municipais")
  e a `tab.key` de roteamento NÃO mudaram — fora do escopo deste ajuste.

  MVP (docs/parametros-fiscais-as-built.md): "Condição de contribuinte de
  ICMS" (Estaduais), "Forma de cálculo do ISS" e "ISS fixo por classe
  profissional" (Municipais).

  Rodada de complementação de conteúdo (docs/02-parametros-fiscais.md,
  seção 6, campos Desejável) adiciona a "Estaduais": "Inscrição Estadual
  de substituto por UF" (Cockpit, somente leitura — sempre "sem valor
  disponível", ver parametros-estaduais-municipais-data.js), "Substituto
  tributário" e "Recolher ICMS/ISS com valor fixo" (Checkbox, Manual —
  reclassificados de Manual nesta rodada após conflito reportado e
  validado contra a SPEC, ver relatório da tarefa), "Base de cálculo do
  FCP/FECP" (D15, Lista suspensa, Manual), "Reduções e deduções da base do
  Simples Nacional" (D16, Lista múltipla, Manual) e "Perfil do SPED
  Fiscal" (D17, Lista suspensa, Manual). "Benefícios e convênios de ICMS"
  (Cadastro repetível, Manual) NÃO é implementado — a documentação não
  define a estrutura de colunas do cadastro (lacuna registrada no
  relatório da tarefa).

  "Aproveitar créditos de ICMS pelas entradas" e "Regime especial de
  apuração do ICMS (RPA)" (Estaduais) e "Empresa designada substituta de
  ISS" (Municipais) passaram por duas rodadas em 2026-09-09: primeiro
  adicionados como representação puramente visual do status Fase 2
  documentado (`docs/02-parametros-fiscais.md`, seção 6/7 — badge "Fase 2"
  + checkbox desabilitado, sem interação); depois, no "Ajuste funcional —
  Checkboxes de Estaduais e Municipais" (mesmo dia), tornados **funcionais**
  por decisão de produto — badge "Fase 2" e legenda explicativa removidos,
  os três passaram a ser Manual/Checkbox/editável no drawer, com o mesmo
  tratamento de persistência e Histórico dos demais campos Manual desta
  aba (ver LABELS_HISTORICO_EM/FORMATADORES_HISTORICO_EM abaixo). A
  prioridade documentada (Fase 2) não mudou — só a representação/
  interatividade na interface, por decisão explícita desta rodada.

  Estrutura em duas seções expansíveis preservada (Municipais aberta por
  padrão, Estaduais recolhida — regra de implementação nº 17). Como
  "Estaduais" passa a ter campos Manual nesta rodada, o drawer único desta
  aba ("Editar" no cabeçalho, fora do accordion) passa a cobrir os campos
  Manual das DUAS seções — mesmo padrão já usado em contabil-fiscal.js
  (um só drawer por aba, campos não-Manual exibidos bloqueados para
  contexto), em vez de introduzir um segundo botão "Editar" por seção
  (a shell, fiscal-page.js, expõe só uma ação de edição por aba).

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

  function badgesLista(lista) {
    return lista.length
      ? lista.map((d) => '<span class="badge badge-secondary">' + d + "</span>").join("")
      : '<span class="italic text-muted">Nenhuma.</span>';
  }

  // indicadorCarregando força o estado "loading" dos indicadores calculados
  // desta aba — mesma simulação de carregamento já usada em Gerais/Federais
  // (ver fiscal-page.js).
  function renderConteudo(empresa, isReadOnly, vigenciaId, indicadorCarregando) {
    if (!empresa.optanteSimples) return global.FiscalGerais.renderNaoAplicavel(empresa, "Estaduais e Municipais");

    const dados = global.FiscalParametrosEstaduaisMunicipaisData.getDados(empresa.codigo, vigenciaId);

    // Regra documentada (D14): com Inscrição Estadual → Contribuinte; sem
    // Inscrição Estadual → Não contribuinte. Deriva de
    // empresa.dadosGerais.ie (EmpresasData, trilha Empresas) sem alterar
    // esse cadastro.
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

    // "Inscrição Estadual de substituto por UF" — o Cockpit ainda não tem a
    // melhoria que permitiria manter uma inscrição por UF (docs/02-
    // parametros-fiscais.md, seção 13); por isso sempre "sem valor
    // disponível", em qualquer empresa/vigência — sem inventar dado nem
    // criar cadastro manual paralelo.
    const inscricaoSubstitutoUfHtml = indicadorCarregando
      ? global.IndicadorCalculado.render({ label: "Inscrição Estadual de substituto por UF", origem: ORIGENS.COCKPIT, state: "loading" })
      : global.IndicadorCalculado.render({ label: "Inscrição Estadual de substituto por UF", origem: ORIGENS.COCKPIT, state: "unavailable" });

    const substitutoTributarioHtml = global.CampoOrigem.campo({
      label: "Substituto tributário",
      value: dados.substitutoTributario ? "Ativo" : "Inativo",
      origem: ORIGENS.MANUAL,
      origemEditavel: !isReadOnly,
      origemCampoKey: "checkbox-substituto-tributario",
    });

    const recolherValorFixoHtml = global.CampoOrigem.campo({
      label: "Recolher ICMS/ISS com valor fixo",
      value: dados.recolherIcmsIssValorFixo ? "Ativo" : "Inativo",
      origem: ORIGENS.MANUAL,
      origemEditavel: !isReadOnly,
      origemCampoKey: "checkbox-icms-iss-valor-fixo",
    });

    const baseCalculoFcpFecpHtml = global.CampoOrigem.campo({
      label: "Base de cálculo do FCP/FECP",
      value: dados.baseCalculoFcpFecp,
      origem: ORIGENS.MANUAL,
      origemEditavel: !isReadOnly,
      origemCampoKey: "select-fcp-fecp",
    });

    const reducoesDeducoesHtml = global.CampoOrigem.campo({
      label: "Reduções e deduções da base do Simples Nacional",
      value: badgesLista(dados.reducoesDeducoesBaseSn),
      origem: ORIGENS.MANUAL,
      origemEditavel: !isReadOnly,
      origemCampoKey: "reducoes-sn-checklist",
      wide: true,
    });

    const perfilSpedFiscalHtml = global.CampoOrigem.campo({
      label: "Perfil do SPED Fiscal",
      value: dados.perfilSpedFiscal,
      origem: ORIGENS.MANUAL,
      origemEditavel: !isReadOnly,
      origemCampoKey: "select-perfil-sped",
    });

    // "Aproveitar créditos de ICMS pelas entradas" e "Regime especial de
    // apuração do ICMS (RPA)" — Fase 2 na documentação (docs/02-parametros-
    // fiscais.md, seção 6), mas tornados funcionais nesta rodada (Ajuste
    // funcional — Checkboxes de Estaduais e Municipais, 2026-09-09): mesmo
    // padrão Manual/checkbox/drawer dos demais campos desta seção, sem
    // badge nem legenda explicativa na tela.
    const aproveitarCreditosIcmsHtml = global.CampoOrigem.campo({
      label: "Aproveitar créditos de ICMS pelas entradas",
      value: dados.aproveitarCreditosIcms ? "Habilitado" : "Inativo",
      origem: ORIGENS.MANUAL,
      origemEditavel: !isReadOnly,
      origemCampoKey: "checkbox-aproveitar-creditos-icms",
    });

    const regimeEspecialApuracaoIcmsHtml = global.CampoOrigem.campo({
      label: "Regime especial de apuração do ICMS (RPA)",
      value: dados.regimeEspecialApuracaoIcms ? "Habilitado" : "Inativo",
      origem: ORIGENS.MANUAL,
      origemEditavel: !isReadOnly,
      origemCampoKey: "checkbox-regime-especial-rpa",
    });

    const estaduaisContent =
      '<div class="detail-grid">' +
      condicaoContribuinteHtml + inscricaoSubstitutoUfHtml + substitutoTributarioHtml + recolherValorFixoHtml +
      baseCalculoFcpFecpHtml + perfilSpedFiscalHtml + reducoesDeducoesHtml +
      aproveitarCreditosIcmsHtml + regimeEspecialApuracaoIcmsHtml +
      "</div>";

    // "Empresa designada substituta de ISS" — Fase 2 na documentação
    // (docs/02-parametros-fiscais.md, seção 7), tornado funcional nesta
    // rodada, mesmo critério de "Aproveitar créditos de ICMS pelas
    // entradas"/RPA acima.
    const empresaSubstitutaIssHtml = global.CampoOrigem.campo({
      label: "Empresa designada substituta de ISS",
      value: dados.empresaSubstitutaIss ? "Habilitado" : "Inativo",
      origem: ORIGENS.MANUAL,
      origemEditavel: !isReadOnly,
      origemCampoKey: "checkbox-empresa-substituta-iss",
    });

    const municipaisContent =
      '<div class="detail-grid">' +
      global.CampoOrigem.campo({ label: "Forma de cálculo do ISS", value: dados.formaCalculoIss, origem: ORIGENS.MANUAL, origemEditavel: !isReadOnly, origemCampoKey: "select-forma-calculo-iss" }) +
      global.CampoOrigem.campo({ label: "ISS fixo por classe profissional", value: dados.issFixoClasseProfissional, origem: ORIGENS.MANUAL, origemEditavel: !isReadOnly, origemCampoKey: "select-iss-fixo-classe" }) +
      empresaSubstitutaIssHtml +
      "</div>";

    // "Parâmetros Municipais" aberta por padrão (regra de implementação
    // nº 17): continua sendo a seção mais compacta; "Parâmetros Estaduais",
    // agora com mais campos Manual, continua recolhida por padrão — só o
    // estado inicial, ambas continuam plenamente acessíveis. Nomenclatura
    // das seções atualizada em 2026-09-09 (ver topo do arquivo); nenhuma
    // outra regra do accordion mudou.
    return (
      '<div class="accordion">' +
      accordionItem("Parâmetros Estaduais", false, estaduaisContent) +
      accordionItem("Parâmetros Municipais", true, municipaisContent) +
      "</div>"
    );
  }

  // ===== Drawer "Editar parâmetros estaduais e municipais" =====
  function sheetMarkupEM() {
    return (
      '<div class="sheet-overlay" id="em-manual-overlay"></div>' +
      '<div class="sheet-panel" id="em-manual-panel" role="dialog" aria-modal="true" aria-labelledby="em-manual-title">' +
      '<button type="button" class="sheet-close" id="em-manual-close">' + Icon("x", "size-4") + "</button>" +
      '<div class="sheet-header">' +
      '<div class="sheet-title" id="em-manual-title">Editar parâmetros estaduais e municipais</div>' +
      '<div class="sheet-description">Altere os parâmetros de origem Manual desta aba. Os demais campos são exibidos apenas para contexto e não podem ser alterados por aqui.</div>' +
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

  function campoBloqueado(label, valor) {
    return (
      '<div class="sheet-field">' +
      '<label class="field-label">' + label + "</label>" +
      '<div class="sheet-field-locked-value">' + Icon("lock", "size-3-5") + "<span>" + valor + "</span></div>" +
      "</div>"
    );
  }

  function checkboxEdit(id, label, checked) {
    return '<label class="ucheckbox" id="' + id + '"><span class="ucheckbox-box' + (checked ? " is-checked" : "") + '">' + Icon("check", "size-4") + '</span><span class="ucheckbox-label">' + label + "</span></label>";
  }

  // Checklist de D16 (Lista múltipla) — "Nenhuma" é mutuamente exclusiva
  // com as demais opções (mesmo princípio de UX já usado para "Nenhum" em
  // dicionários fechados de múltipla escolha; nenhuma regra condicional
  // nova além da exclusividade textual do próprio dicionário).
  function checklistReducoesHtml(selecionadas) {
    const opcoes = global.FiscalParametrosEstaduaisMunicipaisData.OPCOES_REDUCOES_DEDUCOES_BASE_SN;
    return (
      '<div class="sheet-field"><label class="field-label">Reduções e deduções da base do Simples Nacional</label>' +
      '<div class="flex flex-col gap-2" id="reducoes-sn-checklist">' +
      opcoes
        .map((o, i) => '<label class="ucheckbox" data-reducao-opcao="' + o.replace(/"/g, "&quot;") + '"><span class="ucheckbox-box' + (selecionadas.indexOf(o) !== -1 ? " is-checked" : "") + '">' + Icon("check", "size-4") + '</span><span class="ucheckbox-label">' + o + "</span></label>")
        .join("") +
      "</div></div>"
    );
  }

  function wireChecklistReducoes() {
    const NENHUMA = "Nenhuma";
    const container = document.getElementById("reducoes-sn-checklist");
    container.querySelectorAll("[data-reducao-opcao]").forEach((label) => {
      label.addEventListener("click", (e) => {
        e.preventDefault();
        const opcao = label.getAttribute("data-reducao-opcao");
        const box = label.querySelector(".ucheckbox-box");
        const ligar = !box.classList.contains("is-checked");
        if (opcao === NENHUMA) {
          container.querySelectorAll("[data-reducao-opcao] .ucheckbox-box").forEach((b) => b.classList.remove("is-checked"));
          if (ligar) box.classList.add("is-checked");
        } else {
          box.classList.toggle("is-checked", ligar);
          if (ligar) {
            const boxNenhuma = container.querySelector('[data-reducao-opcao="' + NENHUMA + '"] .ucheckbox-box');
            if (boxNenhuma) boxNenhuma.classList.remove("is-checked");
          }
        }
      });
    });
  }

  function lerChecklistReducoes() {
    const container = document.getElementById("reducoes-sn-checklist");
    const selecionadas = [];
    container.querySelectorAll("[data-reducao-opcao]").forEach((label) => {
      if (label.querySelector(".ucheckbox-box").classList.contains("is-checked")) {
        selecionadas.push(label.getAttribute("data-reducao-opcao"));
      }
    });
    return selecionadas;
  }

  function preencherDrawerEM(empresa, vigenciaId) {
    const dados = global.FiscalParametrosEstaduaisMunicipaisData.getDados(empresa.codigo, vigenciaId);
    const contribuinte = !!empresa.dadosGerais.ie;
    document.getElementById("em-manual-body").innerHTML =
      '<div class="subcard">' +
      '<div class="subcard-title">Parâmetros Estaduais</div>' +
      campoBloqueado("Condição de contribuinte de ICMS", contribuinte ? "Contribuinte" : "Não contribuinte") +
      campoBloqueado("Inscrição Estadual de substituto por UF", "Sem valor disponível") +
      '<div class="sheet-field">' + checkboxEdit("checkbox-substituto-tributario", "Substituto tributário", dados.substitutoTributario) + "</div>" +
      '<div class="sheet-field">' + checkboxEdit("checkbox-icms-iss-valor-fixo", "Recolher ICMS/ISS com valor fixo", dados.recolherIcmsIssValorFixo) + "</div>" +
      '<div class="sheet-field"><label class="field-label" for="select-fcp-fecp">Base de cálculo do FCP/FECP</label>' +
      selectEdit("select-fcp-fecp", dados.baseCalculoFcpFecp, global.FiscalParametrosEstaduaisMunicipaisData.OPCOES_BASE_CALCULO_FCP_FECP) +
      "</div>" +
      '<div class="sheet-field"><label class="field-label" for="select-perfil-sped">Perfil do SPED Fiscal</label>' +
      selectEdit("select-perfil-sped", dados.perfilSpedFiscal, global.FiscalParametrosEstaduaisMunicipaisData.OPCOES_PERFIL_SPED_FISCAL) +
      "</div>" +
      checklistReducoesHtml(dados.reducoesDeducoesBaseSn) +
      '<div class="sheet-field">' + checkboxEdit("checkbox-aproveitar-creditos-icms", "Aproveitar créditos de ICMS pelas entradas", dados.aproveitarCreditosIcms) + "</div>" +
      '<div class="sheet-field">' + checkboxEdit("checkbox-regime-especial-rpa", "Regime especial de apuração do ICMS (RPA)", dados.regimeEspecialApuracaoIcms) + "</div>" +
      "</div>" +
      '<div class="subcard">' +
      '<div class="subcard-title">Parâmetros Municipais</div>' +
      '<div class="sheet-field"><label class="field-label" for="select-forma-calculo-iss">Forma de cálculo do ISS</label>' +
      selectEdit("select-forma-calculo-iss", dados.formaCalculoIss, global.FiscalParametrosEstaduaisMunicipaisData.OPCOES_FORMA_CALCULO_ISS) +
      "</div>" +
      '<div class="sheet-field"><label class="field-label" for="select-iss-fixo-classe">ISS fixo por classe profissional</label>' +
      selectEdit("select-iss-fixo-classe", dados.issFixoClasseProfissional, global.FiscalParametrosEstaduaisMunicipaisData.OPCOES_CLASSE_PROFISSIONAL) +
      "</div>" +
      '<div class="sheet-field">' + checkboxEdit("checkbox-empresa-substituta-iss", "Empresa designada substituta de ISS", dados.empresaSubstitutaIss) + "</div>" +
      "</div>";

    document.getElementById("checkbox-substituto-tributario").addEventListener("click", (e) => {
      e.preventDefault();
      document.querySelector("#checkbox-substituto-tributario .ucheckbox-box").classList.toggle("is-checked");
    });
    document.getElementById("checkbox-icms-iss-valor-fixo").addEventListener("click", (e) => {
      e.preventDefault();
      document.querySelector("#checkbox-icms-iss-valor-fixo .ucheckbox-box").classList.toggle("is-checked");
    });
    document.getElementById("checkbox-aproveitar-creditos-icms").addEventListener("click", (e) => {
      e.preventDefault();
      document.querySelector("#checkbox-aproveitar-creditos-icms .ucheckbox-box").classList.toggle("is-checked");
    });
    document.getElementById("checkbox-regime-especial-rpa").addEventListener("click", (e) => {
      e.preventDefault();
      document.querySelector("#checkbox-regime-especial-rpa .ucheckbox-box").classList.toggle("is-checked");
    });
    document.getElementById("checkbox-empresa-substituta-iss").addEventListener("click", (e) => {
      e.preventDefault();
      document.querySelector("#checkbox-empresa-substituta-iss .ucheckbox-box").classList.toggle("is-checked");
    });
    wireChecklistReducoes();
  }

  let empresaDrawerEM = null;
  let vigenciaDrawerEM = null;
  let onSalvarDrawerEM = null;

  // Ver equivalente comentado em gerais.js — mesmo critério, sem função
  // compartilhada entre os 4 módulos (mesma decisão de duplicação local já
  // registrada no as-built para os demais helpers desta aba).
  function focarCampoDrawer(focusId) {
    if (!focusId) return;
    const el = document.getElementById(focusId);
    if (!el) return;
    if (typeof el.scrollIntoView === "function") el.scrollIntoView({ block: "center" });
    if (typeof el.focus === "function") el.focus();
  }

  function abrirDrawerEM(empresa, vigenciaId, onSalvar, focusId) {
    ensureDrawerEM();
    empresaDrawerEM = empresa;
    vigenciaDrawerEM = vigenciaId;
    onSalvarDrawerEM = onSalvar;
    preencherDrawerEM(empresa, vigenciaId);
    UI.openSheet(document.getElementById("em-manual-overlay"), document.getElementById("em-manual-panel"));
    focarCampoDrawer(focusId);
  }

  function fecharDrawerEM() {
    UI.closeSheet(document.getElementById("em-manual-overlay"), document.getElementById("em-manual-panel"));
  }

  // Rótulos dos campos Manual desta aba, para o Histórico de Alterações —
  // só para o diff do evento, sem relação com a renderização do
  // card/drawer.
  const LABELS_HISTORICO_EM = {
    substitutoTributario: "Substituto tributário",
    recolherIcmsIssValorFixo: "Recolher ICMS/ISS com valor fixo",
    baseCalculoFcpFecp: "Base de cálculo do FCP/FECP",
    perfilSpedFiscal: "Perfil do SPED Fiscal",
    reducoesDeducoesBaseSn: "Reduções e deduções da base do Simples Nacional",
    aproveitarCreditosIcms: "Aproveitar créditos de ICMS pelas entradas",
    regimeEspecialApuracaoIcms: "Regime especial de apuração do ICMS (RPA)",
    formaCalculoIss: "Forma de cálculo do ISS",
    issFixoClasseProfissional: "ISS fixo por classe profissional",
    empresaSubstitutaIss: "Empresa designada substituta de ISS",
  };

  const FORMATADORES_HISTORICO_EM = {
    substitutoTributario: (v) => (v ? "Ativo" : "Inativo"),
    recolherIcmsIssValorFixo: (v) => (v ? "Ativo" : "Inativo"),
    aproveitarCreditosIcms: (v) => (v ? "Habilitado" : "Inativo"),
    regimeEspecialApuracaoIcms: (v) => (v ? "Habilitado" : "Inativo"),
    empresaSubstitutaIss: (v) => (v ? "Habilitado" : "Inativo"),
  };

  // reducoesDeducoesBaseSn é array — convertida para texto (join) ANTES do
  // diff, porque diffCampos compara "antes[chave] === depois[chave]" por
  // igualdade estrita (historico-eventos.js): dois arrays com o mesmo
  // conteúdo nunca são === entre si. Por isso esta chave NÃO entra em
  // FORMATADORES_HISTORICO_EM (que só formata o valor DEPOIS do diff) — se
  // entrasse, receberia a string já convertida e tentaria Array.isArray
  // sobre uma string, sempre falhando.
  function formatarReducoesParaDiff(v) {
    return Array.isArray(v) && v.length ? v.join(", ") : "—";
  }

  function salvarDrawerEM() {
    const anterior = global.FiscalParametrosEstaduaisMunicipaisData.getDados(empresaDrawerEM.codigo, vigenciaDrawerEM);
    const novosValores = {
      substitutoTributario: document.querySelector("#checkbox-substituto-tributario .ucheckbox-box").classList.contains("is-checked"),
      recolherIcmsIssValorFixo: document.querySelector("#checkbox-icms-iss-valor-fixo .ucheckbox-box").classList.contains("is-checked"),
      baseCalculoFcpFecp: document.getElementById("select-fcp-fecp").value,
      perfilSpedFiscal: document.getElementById("select-perfil-sped").value,
      reducoesDeducoesBaseSn: lerChecklistReducoes(),
      aproveitarCreditosIcms: document.querySelector("#checkbox-aproveitar-creditos-icms .ucheckbox-box").classList.contains("is-checked"),
      regimeEspecialApuracaoIcms: document.querySelector("#checkbox-regime-especial-rpa .ucheckbox-box").classList.contains("is-checked"),
      formaCalculoIss: document.getElementById("select-forma-calculo-iss").value,
      issFixoClasseProfissional: document.getElementById("select-iss-fixo-classe").value,
      empresaSubstitutaIss: document.querySelector("#checkbox-empresa-substituta-iss .ucheckbox-box").classList.contains("is-checked"),
    };
    global.FiscalParametrosEstaduaisMunicipaisData.setDadosManuais(empresaDrawerEM.codigo, vigenciaDrawerEM, novosValores);
    const anteriorParaDiff = Object.assign({}, anterior, { reducoesDeducoesBaseSn: formatarReducoesParaDiff(anterior.reducoesDeducoesBaseSn) });
    const novosValoresParaDiff = Object.assign({}, novosValores, { reducoesDeducoesBaseSn: formatarReducoesParaDiff(novosValores.reducoesDeducoesBaseSn) });
    const alteracoes = global.FiscalHistoricoEventos.diffCampos(LABELS_HISTORICO_EM, anteriorParaDiff, novosValoresParaDiff, FORMATADORES_HISTORICO_EM);
    if (alteracoes.length) {
      global.FiscalHistoricoEventos.registrarEventoHistoricoFiscal(empresaDrawerEM.codigo, "Estaduais e Municipais", vigenciaDrawerEM, alteracoes);
    }
    fecharDrawerEM();
    UI.showToast("Parâmetros salvos", "Os campos estaduais e municipais de " + empresaDrawerEM.nome + " foram atualizados.");
    if (onSalvarDrawerEM) onSalvarDrawerEM();
  }

  // Chamada pelo shell (fiscal-page.js) a partir do botão "Editar" que vive
  // fora do accordion, na faixa de ação entre a barra de abas e o
  // conteúdo — o shell também cuida de preservar o accordion aberto após
  // salvar (ver rerenderTabPreservandoAccordion em fiscal-page.js).
  function abrirEdicao(empresa, vigenciaId, onSalvo, focusId) {
    abrirDrawerEM(empresa, vigenciaId, onSalvo, focusId);
  }

  global.FiscalParametrosEstaduaisMunicipais = { renderConteudo: renderConteudo, abrirEdicao: abrirEdicao };
})(window);
