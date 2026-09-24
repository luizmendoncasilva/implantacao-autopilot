/*
  Console de Implantação DP por empresa (Épico 6, CTB-269) — amarra as 5
  frentes dos Épicos 1 a 5 numa tela só, com abas. Navegação por JS, sem
  reload (mesmo padrão de parametros-fiscais/js/fiscal-page.js), pra nunca
  perder o contexto da empresa ao trocar de aba.

  Aba "Dados do Colaborador" já resolve a conciliação aqui mesmo — mesmas
  linhas/drawers de js/implantacao/fila-colaborador.js. A antiga fila global
  (implantacao.html, todas as empresas juntas) foi removida — a implantacao-
  -empresas.html é a única porta de entrada agora, e o console por empresa
  cobre o que a fila global cobria, com filtro de status e busca próprios.
*/
(function () {
  const EI = window.EmpresasImplantacaoData;
  const CD = window.ImplantacaoData;
  const E = window.EmpresasData;

  function empresaNome(codigo) {
    const empresa = E.findEmpresaByCodigo(codigo);
    return empresa ? empresa.nome : codigo;
  }

  const codigoEmpresa = E.getQueryParam("empresa");
  const empresaImplant = codigoEmpresa ? EI.empresaImplantacao(codigoEmpresa) : null;
  if (!empresaImplant) {
    window.location.replace("implantacao-empresas.html");
    return;
  }

  const TABS = [
    { key: "colaborador", label: "Dados do Colaborador" },
    { key: "financeiro", label: "Dados Financeiros" },
    { key: "rubricas", label: "Rubricas" },
    { key: "calculo", label: "Cálculo em Paralelo" },
    { key: "parametros", label: "Parâmetros" },
    { key: "relatorios", label: "Relatórios" },
    { key: "historico", label: "Histórico" },
  ];
  let activeKey = "colaborador";
  // Deep link direto para uma aba (ex.: vindo do resultado da importação
  // quando "relatório personalizado" foi marcado — ver js/implantacao/
  // importar.js) — ?empresa=...&tab=relatorios.
  const tabInicial = E.getQueryParam("tab");
  if (tabInicial && TABS.some((t) => t.key === tabInicial)) activeKey = tabInicial;
  // Filtro por status na aba "Dados do Colaborador" — pedido de revisão
  // (Jaqueline/Thais, 09/09/2026): em empresa com muitos colaboradores,
  // poder ir direto no que tem pendência em vez de rolar a lista toda.
  let filtroStatusColaborador = "todos";
  let buscaColaboradorConsole = "";

  function tabLabel(key) {
    const t = TABS.find((x) => x.key === key);
    return t ? t.label : "";
  }

  Shell.mount(document.getElementById("shell-root"), {
    base: "../",
    active: "implantacao-dp",
    crumbs: [
      { label: "implantação de empresas", href: "implantacao-geral.html" },
      { label: "DP", href: "implantacao-empresas.html" },
      { label: empresaNome(codigoEmpresa) },
      { label: tabLabel(activeKey) },
    ],
  });

  // ===== Cabeçalho =====
  function statusBadgeEmpresa() {
    return empresaImplant.status === "implantada"
      ? '<span class="badge badge-success">' + Icon("check", "size-3-5") + " Implantada</span>"
      : '<span class="badge badge-info">' + Icon("clock", "size-3-5") + " Em andamento</span>";
  }

  function renderHeader() {
    const r = EI.resumoCompleto(empresaImplant);
    const percentual = EI.percentualConclusao(r);
    const parametrosOk = EI.parametrosConfirmados(codigoEmpresa);
    document.getElementById("console-header-mount").innerHTML =
      '<div class="flex items-start justify-between gap-3 flex-wrap">' +
      '<div class="flex flex-col gap-1">' +
      '<div class="flex items-center gap-2 flex-wrap"><h1 class="text-xl font-semibold">' + empresaNome(codigoEmpresa) + "</h1>" + statusBadgeEmpresa() + "</div>" +
      '<p class="text-sm text-muted">' + empresaImplant.etapaAtual + "</p>" +
      "</div>" +
      "</div>" +
      '<div class="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted" style="margin-top:4px;">' +
      "<span><b class=\"text-foreground\">Início:</b> " + empresaImplant.dataInicio + "</span>" +
      "<span><b class=\"text-foreground\">Competência inicial:</b> " + empresaImplant.competenciaInicial + "</span>" +
      (empresaImplant.dataConclusao ? "<span><b class=\"text-foreground\">Concluída em:</b> " + empresaImplant.dataConclusao + "</span>" : "") +
      "</div>" +
      (percentual === 100 && !parametrosOk
        ? '<div class="alert alert-warning" style="margin-top:12px;">' + Icon("alert-triangle", "size-4") +
          '<div class="alert-desc">As 3 frentes estão completas, mas os <button type="button" class="btn-link link-info" id="link-ir-parametros" style="display:inline;">parâmetros DP ainda não foram confirmados</button> — a implantação só conta como concluída depois disso.</div></div>'
        : "") +
      '<div class="flex flex-col gap-2" style="margin-top:12px;">' +
      '<div class="flex items-center gap-2">' + progressoHtml(r) + '<span class="text-sm font-medium">' + percentual + "%</span></div>" +
      '<p class="text-xs text-muted">Passe o mouse sobre cada trecho da barra para ver o detalhe da frente.</p></div>' +
      '<div class="flex flex-wrap gap-3" style="margin-top:12px;">' +
      '<div class="stat-card"><span class="stat-card-value">' + r.colaboradores.prontos + "/" + r.colaboradores.total + '</span><span class="stat-card-label">Colaboradores prontos</span></div>' +
      '<div class="stat-card"><span class="stat-card-value">' + r.financeiro.carregadas + "/" + r.financeiro.necessarias + '</span><span class="stat-card-label">Competências de folha carregadas</span></div>' +
      '<div class="stat-card"><span class="stat-card-value">' + r.rubricas.total + '</span><span class="stat-card-label">Rubricas utilizadas (12 meses)</span></div>' +
      '<div class="stat-card' + (r.calculoParalelo.comDivergencia > 0 ? " stat-card-warning" : " stat-card-success") + '"><span class="stat-card-value">' + r.calculoParalelo.validadas + "/" + r.calculoParalelo.total + '</span><span class="stat-card-label">Competências validadas em paralelo</span></div>' +
      "</div>";
    UI.initSegbarTooltips();
    const linkParametros = document.getElementById("link-ir-parametros");
    if (linkParametros) linkParametros.addEventListener("click", () => irParaAba("parametros"));
  }

  // ===== Drawer genérico "Visualizar" (somente leitura) =====
  function abrirVisualizar(titulo, subtitulo, campos) {
    document.getElementById("visualizar-generico-titulo").textContent = titulo;
    document.getElementById("visualizar-generico-sub").textContent = subtitulo || "";
    document.getElementById("visualizar-generico-corpo").innerHTML = campos
      .map((c) => '<div class="detail-field"><span class="detail-field-label">' + c.label + '</span><div class="detail-field-value">' + (c.value || '<span class="detail-field-unavailable">Não informado</span>') + "</div></div>")
      .join("");
    UI.openSheet(document.getElementById("visualizar-generico-overlay"), document.getElementById("visualizar-generico-panel"));
  }

  function fecharVisualizarGenerico() {
    UI.closeSheet(document.getElementById("visualizar-generico-overlay"), document.getElementById("visualizar-generico-panel"));
  }

  function setupVisualizarGenerico() {
    document.getElementById("icon-close-visualizar").innerHTML = Icon("x", "size-4");
    const overlay = document.getElementById("visualizar-generico-overlay");
    const panel = document.getElementById("visualizar-generico-panel");
    document.getElementById("visualizar-generico-close").addEventListener("click", fecharVisualizarGenerico);
    overlay.addEventListener("click", fecharVisualizarGenerico);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && panel.classList.contains("is-open")) fecharVisualizarGenerico();
    });
  }

  function wireVisualizarButtons(handler) {
    document.querySelectorAll("[data-visualizar]").forEach((btn) => {
      btn.addEventListener("click", () => handler(btn.getAttribute("data-visualizar")));
    });
  }

  function botaoVisualizar(chave) {
    return '<button type="button" class="btn-icon-chev" data-visualizar="' + chave + '" aria-label="Visualizar" title="Visualizar">' + Icon("arrow-up-right", "size-4") + "</button>";
  }

  // ===== Aba Geral =====
  // Mesma barra segmentada da lista de empresas (empresas-list.js) — um
  // segmento por frente, verde quando concluída, âmbar quando em andamento,
  // cinza (padrão) quando nada foi feito. Tooltip no hover com o número.
  function segmento(classe, tooltip) {
    return '<div class="segbar-segment' + (classe ? " " + classe : "") + '" data-tooltip="' + tooltip.replace(/"/g, "&quot;") + '"></div>';
  }

  // Só 3 frentes bloqueiam a implantação agora — colaboradores, histórico
  // de folha e cálculo em paralelo (Andressa, 10/09/2026). Rubricas saiu da
  // barra: sem de-para, virou aba informativa, não trava mais nada.
  function progressoHtml(r) {
    const col = r.colaboradores.total === 0 ? "" : r.colaboradores.prontos === r.colaboradores.total ? "is-success" : r.colaboradores.prontos === 0 ? "" : "is-warning";
    const fin = r.financeiro.necessarias === 0 ? "" : r.financeiro.carregadas === r.financeiro.necessarias ? "is-success" : r.financeiro.carregadas === 0 ? "" : "is-warning";
    const calc =
      r.calculoParalelo.total === 0
        ? ""
        : r.calculoParalelo.comDivergencia > 0
        ? "is-warning"
        : r.calculoParalelo.validadas === r.calculoParalelo.total
        ? "is-success"
        : "";
    return (
      '<div class="segbar" style="max-width:420px;">' +
      segmento(col, "Colaboradores: " + r.colaboradores.prontos + "/" + r.colaboradores.total + " prontos") +
      segmento(fin, "Competências de folha: " + r.financeiro.carregadas + "/" + r.financeiro.necessarias + " carregadas") +
      segmento(calc, "Cálculo em paralelo: " + r.calculoParalelo.validadas + "/" + r.calculoParalelo.total + " validadas" + (r.calculoParalelo.comDivergencia ? " · " + r.calculoParalelo.comDivergencia + " com divergência" : "")) +
      "</div>"
    );
  }

  // ===== Aba Dados do Colaborador (Épico 1) — mesmas linhas, drawers e
  // ações de js/implantacao/fila-colaborador.js usadas na antiga fila
  // separada: resolver uma divergência é a mesma coisa aqui, só que já
  // filtrado pra esta empresa (sem precisar sair do console). =====
  function colaboradoresDaEmpresa() {
    return CD.getColaboradoresAtivos().filter((c) => c.empresaCodigo === codigoEmpresa).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" }));
  }

  function filtroStatusOptionsHtml(todos) {
    const r = CD.contarPorStatus(todos);
    const opcoes = [
      ["todos", "Todos os status", todos.length],
      ["divergencia", "Divergência", r.divergencia],
      ["pendente_conciliacao", "Pendente conciliação", r.pendenteConciliacao],
      ["nao_encontrado_lake", "Não encontrado no Lake", r.naoEncontradoLake],
      ["rejeitado", "Rejeitado", r.rejeitado],
      ["aguardando_esocial", "Aguardando eSocial", r.aguardandoEsocial],
      ["pronto", "Pronto", r.pronto],
    ];
    return opcoes.map((o) => '<option value="' + o[0] + '">' + o[1] + " (" + o[2] + ")</option>").join("");
  }

  function apenasDigitosConsole(v) {
    return (v || "").replace(/\D/g, "");
  }

  function renderColaborador() {
    const todos = colaboradoresDaEmpresa();
    const buscaNormalizada = buscaColaboradorConsole.trim().toLowerCase();
    const buscaDigitos = apenasDigitosConsole(buscaNormalizada);
    const colaboradores = todos.filter((c) => {
      const statusOk = filtroStatusColaborador === "todos" || c.status === filtroStatusColaborador;
      const buscaOk =
        !buscaNormalizada ||
        c.nome.toLowerCase().includes(buscaNormalizada) ||
        (buscaDigitos !== "" && apenasDigitosConsole(c.cpf).includes(buscaDigitos));
      return statusOk && buscaOk;
    });
    const linhas = colaboradores.map(FilaColaborador.rowHtml).join("");
    return (
      '<div class="flex items-end justify-between gap-3 flex-wrap">' +
      '<div class="flex flex-col gap-1">' +
      '<label class="field-label" for="f-busca-colaborador-console">Colaborador</label>' +
      '<input id="f-busca-colaborador-console" class="field-input w-72" placeholder="Pesquisar por nome ou CPF" value="' + buscaColaboradorConsole.replace(/"/g, "&quot;") + '" />' +
      "</div>" +
      '<div class="flex flex-col gap-1">' +
      '<label class="field-label" for="f-status-colaborador-console">Status</label>' +
      '<div class="field-select-wrap w-64">' +
      '<select id="f-status-colaborador-console" class="field-select">' + filtroStatusOptionsHtml(todos) + "</select>" +
      '<span class="chev" id="icon-chev-status-colaborador-console"></span>' +
      "</div></div></div>" +
      '<div class="table-wrap"><table class="dtable dtable-fixed">' +
      '<colgroup><col /><col style="width:170px" /><col style="width:220px" /><col style="width:40px" /></colgroup>' +
      '<thead><tr><th>Colaborador</th><th class="col-pad-md">CPF</th><th class="col-pad-md">Status</th><th class="col-pad-end"></th></tr></thead>' +
      "<tbody>" +
      (linhas || '<tr><td colspan="4" class="row-empty-state">' + (todos.length === 0 ? "Nenhum colaborador carregado ainda." : "Nenhum colaborador encontrado para os filtros selecionados.") + "</td></tr>") +
      "</tbody>" +
      "</table></div>"
    );
  }

  // ===== Aba Dados Financeiros (Épico 2) =====
  function financeiroStatusBadge(f) {
    if (f.status === "carregada") return '<span class="badge badge-success">' + Icon("check", "size-3-5") + " Carregada</span>";
    if (f.status === "divergencia_total") return '<span class="badge badge-destructive">' + Icon("alert-triangle", "size-3-5") + " Divergência de total</span>";
    return '<span class="badge badge-secondary">Ausente</span>';
  }

  let FINANCEIRO_CACHE = [];
  function visualizarFinanceiro(competencia) {
    const f = FINANCEIRO_CACHE.find((x) => x.competencia === competencia);
    if (!f) return;
    abrirVisualizar(
      "Competência " + f.competencia,
      empresaNome(codigoEmpresa),
      [
        { label: "Proventos", value: f.proventos },
        { label: "Descontos", value: f.descontos },
        { label: "Líquido (Autopilot)", value: f.liquido },
        { label: "Total no relatório de origem", value: f.totalOrigem || f.liquido },
      ]
    );
  }

  function renderFinanceiro() {
    FINANCEIRO_CACHE = EI.gerarFinanceiro(codigoEmpresa, empresaImplant.resumo.financeiro.carregadas);
    const linhas = FINANCEIRO_CACHE
      .map(
        (f) =>
          "<tr><td class=\"font-mono\">" + f.competencia + "</td>" +
          '<td class="col-pad-md">' + financeiroStatusBadge(f) + "</td>" +
          '<td class="col-pad-md">' + (f.liquido || "—") + "</td>" +
          '<td class="col-pad-end">' + (f.status !== "ausente" ? botaoVisualizar(f.competencia) : "") + "</td></tr>"
      )
      .join("");
    return (
      '<p class="text-sm text-muted">Competências de folha (não apenas financeiras). Janela necessária: dezembro/2025 até a última competência fechada — mínimo 12 competências (RF-DP-509 reporta as ausentes, nunca estima).</p>' +
      '<div class="table-wrap"><table class="dtable dtable-fixed">' +
      '<colgroup><col style="width:140px" /><col /><col style="width:170px" /><col style="width:56px" /></colgroup>' +
      '<thead><tr><th>Competência</th><th class="col-pad-md">Status</th><th class="col-pad-md">Líquido</th><th class="col-pad-end"></th></tr></thead>' +
      "<tbody>" + linhas + "</tbody></table></div>"
    );
  }

  // ===== Aba Rubricas (Épico 3) — SEM de-para (alinhamento 10/09/2026) =====
  // Puramente informativa: mostra o que a empresa usou nos últimos 12
  // meses, com natureza e incidências vindas prontas do Lake. Nenhuma
  // rubrica bloqueia competência nem precisa de ação do operador aqui —
  // por isso a tabela não tem coluna de status nem botão de ação.
  function simNao(v) {
    return v ? "Sim" : "Não";
  }

  function renderRubricas() {
    const rubricas = EI.gerarRubricas();
    const linhas = rubricas
      .map(
        (r) =>
          "<tr><td class=\"font-mono\">" + r.codigoEmpresa + "</td>" +
          "<td>" + UI.truncatedCell(r.descricao, null, "text-sm") + "</td>" +
          '<td class="col-pad-md">' + (r.rubricaPadrao ? r.rubricaPadrao : '<span class="text-muted">Específica da empresa</span>') + "</td>" +
          '<td class="col-pad-md">' + r.natureza + "</td>" +
          '<td class="col-pad-sm">' + simNao(r.incIrrf) + "</td>" +
          '<td class="col-pad-sm">' + simNao(r.incInss) + "</td>" +
          '<td class="col-pad-sm">' + simNao(r.incFgts) + "</td>" +
          '<td class="col-pad-sm">' + simNao(r.incPis) + "</td></tr>"
      )
      .join("");
    return (
      '<p class="text-sm text-muted">Rubricas utilizadas por esta empresa nos últimos 12 meses — informativo, sem de-para: a natureza e as incidências já vêm do Lake, sem ação do operador aqui.</p>' +
      '<div class="table-wrap"><table class="dtable dtable-fixed">' +
      '<colgroup><col style="width:100px" /><col /><col style="width:200px" /><col style="width:100px" /><col style="width:80px" /><col style="width:80px" /><col style="width:80px" /><col style="width:80px" /></colgroup>' +
      '<thead><tr><th>Código</th><th>Descrição</th><th class="col-pad-md">Rubrica padrão</th><th class="col-pad-md">Natureza</th><th class="col-pad-sm">Inc. IRRF</th><th class="col-pad-sm">Inc. INSS</th><th class="col-pad-sm">Inc. FGTS</th><th class="col-pad-sm">Inc. PIS</th></tr></thead>' +
      "<tbody>" + linhas + "</tbody></table></div>"
    );
  }

  // ===== Aba Cálculo em Paralelo (Épico 4) =====
  // Só roda depois de colaboradores + histórico carregados (Andressa,
  // 10/09/2026): aciona o motor pra recalcular a folha de cada competência
  // com as regras atuais e concilia contra o relatório da Domínio já
  // importado — não devolve nenhum pacote de relatório, só diz se bateu ou
  // não (Jeniffer). Divergência aponta campo + colaborador + rubrica, mesma
  // lógica da conciliação de colaborador contra o Lake.
  function calculoStatusBadge(c) {
    if (c.status === "sem_divergencia") return '<span class="badge badge-success">' + Icon("check", "size-3-5") + " Bate com o Domínio</span>";
    if (c.status === "com_divergencia") return '<span class="badge badge-warning">' + Icon("alert-triangle", "size-3-5") + " Com divergência</span>";
    return '<span class="badge badge-secondary">Não executado</span>';
  }

  let CALCULO_CACHE = [];
  function visualizarCalculo(competencia) {
    const c = CALCULO_CACHE.find((x) => x.competencia === competencia);
    if (!c) return;
    const camposDivergencia = (c.divergencias || []).map((d, i) => ({
      label: "Divergência " + (i + 1),
      value: d.colaborador + " · " + d.rubrica + " · " + d.campo + " — motor: " + d.valorMotor + ", relatório de origem: " + d.valorOrigem,
    }));
    abrirVisualizar(
      "Cálculo em paralelo — " + c.competencia,
      empresaNome(codigoEmpresa),
      [
        { label: "Executado por", value: c.executor },
        { label: "Data de execução", value: c.dataExecucao },
        { label: "Resultado", value: c.status === "com_divergencia" ? c.divergencias.length + " divergência(s) contra o relatório da Domínio — conferir campo a campo" : "Bate com o relatório da Domínio" },
        { label: "Efeito externo", value: "Nenhum — modo paralelo não transmite nem envia e-mail (RN-DP-31)" },
      ].concat(camposDivergencia)
    );
  }

  function renderCalculo() {
    const financeiro = EI.gerarFinanceiro(codigoEmpresa, empresaImplant.resumo.financeiro.carregadas);
    CALCULO_CACHE = EI.gerarCalculoParalelo(empresaImplant.resumo.calculoParalelo.validadas, empresaImplant.resumo.calculoParalelo.comDivergencia, financeiro);
    const linhas = CALCULO_CACHE
      .map(
        (c) =>
          "<tr><td class=\"font-mono\">" + c.competencia + "</td>" +
          '<td class="col-pad-md">' + (c.executor || "—") + "</td>" +
          '<td class="col-pad-md">' + calculoStatusBadge(c) + "</td>" +
          '<td class="col-pad-end">' + (c.status !== "nao_executado" ? botaoVisualizar(c.competencia) : "") + "</td></tr>"
      )
      .join("");
    return (
      '<div class="flex items-center justify-between gap-3 flex-wrap">' +
      '<p class="text-sm text-muted">Recalcula a folha de cada competência com as regras atuais do motor e concilia contra o relatório da Domínio já importado — sem gerar pacote de relatório, sem efeito externo (RF-DP-702/703).</p>' +
      '<button type="button" class="btn btn-sm w-fit" id="btn-calcular-paralelo">' + Icon("rotate-ccw", "size-3-5") + " Calcular e conciliar</button>" +
      "</div>" +
      '<div class="table-wrap"><table class="dtable dtable-fixed">' +
      '<colgroup><col style="width:140px" /><col /><col style="width:180px" /><col style="width:56px" /></colgroup>' +
      '<thead><tr><th>Competência</th><th class="col-pad-md">Executor</th><th class="col-pad-md">Status</th><th class="col-pad-end"></th></tr></thead>' +
      "<tbody>" + linhas + "</tbody></table></div>"
    );
  }

  // ===== Aba Parâmetros — link pra tela real de Parâmetros DP, com
  // checklist dos campos obrigatórios e confirmação manual do operador
  // (Andressa/Jeniffer, 10/09/2026). Não conta pra % de conclusão (isso
  // fica só nas 3 frentes já validadas), mas é exigido pra empresa poder
  // ser considerada implantada de fato — "a pessoa obrigatoriamente vai
  // ter que clicar em parâmetro e analisar" (Jeniffer). =====
  function renderParametros() {
    const pendentes = EI.camposPendentesParametros(codigoEmpresa);
    const confirmado = EI.parametrosConfirmados(codigoEmpresa);
    const linhasCampos = EI.TODOS_CAMPOS_PARAMETROS_DP
      .map((campo) => {
        const falta = pendentes.includes(campo);
        return (
          '<div class="list-row">' +
          '<span class="text-sm">' + campo + "</span>" +
          (falta
            ? '<span class="badge badge-warning">' + Icon("alert-triangle", "size-3-5") + " Pendente</span>"
            : '<span class="badge badge-success">' + Icon("check", "size-3-5") + " Preenchido</span>") +
          "</div>"
        );
      })
      .join("");

    return (
      '<p class="text-sm text-muted">Configuração específica desta empresa — sindicato, regime, FAP, adiantamento e afins. Vive na tela de Parâmetros DP; aqui é só o checklist do que falta antes de considerar a implantação concluída.</p>' +
      '<div class="flex items-center justify-between gap-3 flex-wrap">' +
      '<a href="../parametros/dp.html" target="_blank" rel="noopener" class="btn btn-outline btn-sm w-fit">' + Icon("arrow-up-right", "size-3-5") + " Abrir Parâmetros DP</a>" +
      (confirmado
        ? '<span class="badge badge-success">' + Icon("check", "size-3-5") + " Parâmetros confirmados</span>"
        : '<button type="button" class="btn btn-sm w-fit" id="btn-confirmar-parametros"' + (pendentes.length ? " disabled" : "") + ">" + Icon("check", "size-3-5") + " Confirmar parâmetros</button>") +
      "</div>" +
      '<div class="flex flex-col gap-2">' + linhasCampos + "</div>" +
      (pendentes.length && !confirmado
        ? '<p class="text-xs text-muted">Preencha os campos pendentes na tela de Parâmetros DP antes de confirmar.</p>'
        : "")
    );
  }

  // ===== Aba Relatórios — layouts personalizados de admissão/férias/
  // rescisão (alinhamento Andressa/Jeniffer, 10/09/2026): "não
  // necessariamente são esses relatórios que ele subiu [na Ficha
  // Financeira]... pode ter outro, de admissão, que é específico, de
  // rescisão, que é específico" (Andressa) — por isso é aba própria, não
  // só a pergunta de sim/não do fluxo de importação. Sem layout salvo, a
  // empresa usa o padrão Domínio — não bloqueia nada, é só informativo
  // para a operação saber o que essa empresa usa em cada processo. =====
  let layoutAtual = null;

  function abrirImportarLayout(tipo) {
    layoutAtual = tipo;
    document.getElementById("layout-relatorio-title").textContent = "Importar layout — " + tipo;
    document.getElementById("layout-relatorio-sub").textContent = empresaNome(codigoEmpresa);
    document.getElementById("layout-relatorio-dropzone").style.display = "";
    document.getElementById("layout-relatorio-arquivo-row").style.display = "none";
    document.getElementById("btn-salvar-layout-relatorio").disabled = true;
    UI.openSheet(document.getElementById("layout-relatorio-overlay"), document.getElementById("layout-relatorio-panel"));
  }

  function fecharImportarLayout() {
    UI.closeSheet(document.getElementById("layout-relatorio-overlay"), document.getElementById("layout-relatorio-panel"));
  }

  function nomeArquivoMockLayout(tipo) {
    const slug = empresaNome(codigoEmpresa)
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "");
    return tipo + "_" + slug + ".pdf";
  }

  function selecionarArquivoMockLayout() {
    document.getElementById("layout-relatorio-dropzone").style.display = "none";
    document.getElementById("layout-relatorio-arquivo-row").style.display = "";
    document.getElementById("layout-relatorio-arquivo-nome").textContent = nomeArquivoMockLayout(layoutAtual);
    document.getElementById("btn-salvar-layout-relatorio").disabled = false;
  }

  function removerArquivoMockLayout() {
    document.getElementById("layout-relatorio-arquivo-row").style.display = "none";
    document.getElementById("layout-relatorio-dropzone").style.display = "";
    document.getElementById("btn-salvar-layout-relatorio").disabled = true;
  }

  function dataHojeBr() {
    const hoje = new Date();
    return String(hoje.getDate()).padStart(2, "0") + "/" + String(hoje.getMonth() + 1).padStart(2, "0") + "/" + hoje.getFullYear();
  }

  function salvarLayoutRelatorio() {
    const nomeArquivo = document.getElementById("layout-relatorio-arquivo-nome").textContent;
    EI.importarLayoutRelatorio(codigoEmpresa, layoutAtual, nomeArquivo, dataHojeBr());
    fecharImportarLayout();
    renderContent();
    UI.showToast("Layout importado", nomeArquivo + " salvo como layout de " + layoutAtual.toLowerCase() + " desta empresa.");
  }

  function removerPersonalizacaoLayout(tipo) {
    EI.removerLayoutRelatorio(codigoEmpresa, tipo);
    renderContent();
    UI.showToast("Layout removido", "Voltou a usar o layout padrão Domínio para " + tipo.toLowerCase() + ".", "info");
  }

  function renderRelatorios() {
    const layouts = EI.layoutsRelatorios(codigoEmpresa);
    const linhas = layouts
      .map(
        (l) =>
          "<tr><td>" + l.tipo + "</td>" +
          '<td class="col-pad-md">' +
          (l.personalizado
            ? '<span class="badge badge-info">' + Icon("file-text", "size-3-5") + " Personalizado</span>"
            : '<span class="badge badge-secondary">Padrão Domínio</span>') +
          "</td>" +
          "<td>" + (l.arquivo ? UI.truncatedCell(l.arquivo + " · importado em " + l.importadoEm, null, "text-sm") : '<span class="text-muted text-sm">—</span>') + "</td>" +
          '<td class="col-pad-end"><div class="flex gap-2 justify-end">' +
          (l.personalizado ? '<button type="button" class="btn-link link-info" data-remover-layout="' + l.tipo + '">Voltar ao padrão</button>' : "") +
          '<button type="button" class="btn btn-outline btn-sm w-fit" data-importar-layout="' + l.tipo + '">' + Icon("upload", "size-3-5") + (l.personalizado ? " Substituir" : " Importar layout") + "</button>" +
          "</div></td></tr>"
      )
      .join("");
    return (
      '<p class="text-sm text-muted">Layout de cada processo usado por esta empresa — sem personalização, o Autopilot segue o padrão Domínio. Não bloqueia a implantação; é informativo para a operação saber o que gerar em cada processo (alinhamento 10/09/2026).</p>' +
      '<div class="table-wrap"><table class="dtable dtable-fixed">' +
      '<colgroup><col style="width:140px" /><col style="width:180px" /><col /><col style="width:260px" /></colgroup>' +
      '<thead><tr><th>Processo</th><th class="col-pad-md">Layout</th><th>Arquivo</th><th class="col-pad-end"></th></tr></thead>' +
      "<tbody>" + linhas + "</tbody></table></div>"
    );
  }

  function setupLayoutRelatorio() {
    document.getElementById("icon-upload-layout").innerHTML = Icon("upload", "size-5");
    document.getElementById("layout-relatorio-close").innerHTML = Icon("x", "size-4");
    document.getElementById("layout-relatorio-arquivo-remover").innerHTML = Icon("x", "size-4");
    const overlay = document.getElementById("layout-relatorio-overlay");
    const panel = document.getElementById("layout-relatorio-panel");
    document.getElementById("layout-relatorio-close").addEventListener("click", fecharImportarLayout);
    overlay.addEventListener("click", fecharImportarLayout);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && panel.classList.contains("is-open")) fecharImportarLayout();
    });
    const dropzone = document.getElementById("layout-relatorio-dropzone");
    dropzone.addEventListener("click", selecionarArquivoMockLayout);
    dropzone.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        selecionarArquivoMockLayout();
      }
    });
    document.getElementById("layout-relatorio-arquivo-remover").addEventListener("click", removerArquivoMockLayout);
    document.getElementById("btn-salvar-layout-relatorio").addEventListener("click", salvarLayoutRelatorio);
  }

  // ===== Aba Histórico (Épico 5 — RT-DP-02) =====
  function renderHistoricoTabela(logs) {
    const linhas = logs
      .map(
        (l) =>
          '<tr><td class="col-pad-sm font-mono text-xs">' + l.dataHora + "</td>" +
          "<td>" + UI.truncatedCell(l.operador, null, "text-sm font-medium") + "</td>" +
          '<td class="col-pad-md">' + l.acao + "</td>" +
          "<td>" + UI.truncatedCell(l.detalhe, null, "text-xs text-muted") + "</td>" +
          '<td class="col-pad-md">' + (l.aprovadoPor || "—") + "</td></tr>"
      )
      .join("");
    return (
      '<div class="table-wrap"><table class="dtable dtable-fixed">' +
      '<colgroup><col style="width:130px" /><col style="width:170px" /><col style="width:190px" /><col /><col style="width:160px" /></colgroup>' +
      '<thead><tr><th class="col-pad-sm">Data/hora</th><th>Operador</th><th class="col-pad-md">Ação</th><th>Detalhe</th><th class="col-pad-md">Aprovado por</th></tr></thead>' +
      "<tbody>" + (linhas || '<tr><td colspan="5" class="row-empty-state">Sem eventos registrados.</td></tr>') + "</tbody></table></div>"
    );
  }

  function renderHistorico() {
    return (
      '<p class="text-sm text-muted">Cada etapa registra executor, horário e desfecho (RT-DP-02) — inclui quem aprovou, quando aplicável.</p>' +
      renderHistoricoTabela(empresaImplant.logs.slice().reverse())
    );
  }

  // ===== Troca de aba =====
  function irParaAba(key) {
    activeKey = key;
    renderTabsBar();
    renderContent();
    Shell.updateBreadcrumb({
      crumbs: [
        { label: "implantação de empresas", href: "implantacao-geral.html" },
        { label: "DP", href: "implantacao-empresas.html" },
        { label: empresaNome(codigoEmpresa) },
        { label: tabLabel(activeKey) },
      ],
    });
  }

  function renderTabsBar() {
    document.getElementById("console-tabs-mount").innerHTML =
      '<div class="tabs-list" style="overflow-x:auto; max-width:100%;">' +
      TABS.map((t) => '<button type="button" class="tabs-trigger' + (t.key === activeKey ? " is-active" : "") + '" data-tab-key="' + t.key + '">' + t.label + "</button>").join("") +
      "</div>";
    document.querySelectorAll("[data-tab-key]").forEach((btn) => {
      btn.addEventListener("click", () => irParaAba(btn.getAttribute("data-tab-key")));
    });
  }

  function renderContent() {
    const mountEl = document.getElementById("console-content-mount");
    if (activeKey === "colaborador") {
      const colaboradores = colaboradoresDaEmpresa();
      mountEl.innerHTML = renderColaborador();
      FilaColaborador.setFilaAtual(colaboradores.filter(FilaColaborador.colaboradorPrecisaDeAcao).map((c) => c.id));
      FilaColaborador.wireRowEvents();
      const selectStatus = document.getElementById("f-status-colaborador-console");
      selectStatus.value = filtroStatusColaborador;
      document.getElementById("icon-chev-status-colaborador-console").innerHTML = Icon("chevron-down", "size-4");
      selectStatus.addEventListener("change", (e) => {
        filtroStatusColaborador = e.target.value;
        renderContent();
      });
      const inputBusca = document.getElementById("f-busca-colaborador-console");
      inputBusca.addEventListener("input", (e) => {
        buscaColaboradorConsole = e.target.value;
        const posicaoCursor = e.target.selectionStart;
        renderContent();
        const inputNovo = document.getElementById("f-busca-colaborador-console");
        inputNovo.focus();
        inputNovo.setSelectionRange(posicaoCursor, posicaoCursor);
      });
    } else if (activeKey === "financeiro") {
      mountEl.innerHTML = renderFinanceiro();
      wireVisualizarButtons(visualizarFinanceiro);
    } else if (activeKey === "rubricas") {
      mountEl.innerHTML = renderRubricas();
    } else if (activeKey === "calculo") {
      mountEl.innerHTML = renderCalculo();
      wireVisualizarButtons(visualizarCalculo);
      document.getElementById("btn-calcular-paralelo").addEventListener("click", () => {
        UI.showToast("Cálculo em paralelo iniciado", "Recalculando com as regras atuais do motor e conciliando contra os relatórios importados — sem efeito externo.", "info");
      });
    } else if (activeKey === "parametros") {
      mountEl.innerHTML = renderParametros();
      const btnConfirmar = document.getElementById("btn-confirmar-parametros");
      if (btnConfirmar) {
        btnConfirmar.addEventListener("click", () => {
          EI.confirmarParametros(codigoEmpresa);
          renderHeader();
          renderContent();
          UI.showToast("Parâmetros confirmados", "Registrado que " + empresaNome(codigoEmpresa) + " está com os parâmetros de DP configurados.");
        });
      }
    } else if (activeKey === "relatorios") {
      mountEl.innerHTML = renderRelatorios();
      document.querySelectorAll("[data-importar-layout]").forEach((btn) => {
        btn.addEventListener("click", () => abrirImportarLayout(btn.getAttribute("data-importar-layout")));
      });
      document.querySelectorAll("[data-remover-layout]").forEach((btn) => {
        btn.addEventListener("click", () => removerPersonalizacaoLayout(btn.getAttribute("data-remover-layout")));
      });
    } else if (activeKey === "historico") {
      mountEl.innerHTML = renderHistorico();
    }
  }

  document.getElementById("icon-voltar").innerHTML = Icon("chevron-left", "size-3-5");
  CD.ensureToast();
  VisualizarColaborador.setup();
  FilaColaborador.setup();
  setupVisualizarGenerico();
  setupLayoutRelatorio();
  FilaColaborador.setOnChange(() => {
    renderHeader();
    renderContent();
  });
  renderHeader();
  renderTabsBar();
  renderContent();
})();
