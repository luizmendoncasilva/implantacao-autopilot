/*
  Tela da Convenção Coletiva — parametrização vinculada obrigatoriamente a um
  Sindicato (Partes II e III da especificação). Página única com 6 áreas de
  parametrização (client-side, sem navegar de arquivo). "Editar" abre todas
  as áreas para edição de uma vez.

  Fase 1 da "Decisão de fluxo — Progressão por etapas" (ver
  docs/06-sindicato-convencao-spec.md): a navegação por abas foi substituída
  por um stepper (mesmo componente .stepper já usado na importação em massa
  de Empresas), com uma faixa de Voltar/Próxima etapa/Salvar Convenção
  abaixo do conteúdo de cada etapa. Todas as 6 etapas continuam acessíveis
  livremente pelo stepper, só para consulta — "Próxima etapa" e "Salvar
  Convenção" ainda funcionam sem nenhum gate de obrigatoriedade nesta fase
  (isso fica para uma fase posterior). O conteúdo interno de cada uma das 6
  áreas (Card/Subcard/condRule/Accordion/Empty States/Drawers) não foi
  alterado.
*/
(function () {
  const D = window.SindicatosData;
  const E = window.EmpresasData;

  const codigoConvencao = D.getQueryParam("convencao");
  const codigoSindicatoParam = D.getQueryParam("sindicato");
  const convencaoExistente = codigoConvencao ? D.findConvencaoByCodigo(codigoConvencao) : null;

  if (codigoConvencao && !convencaoExistente) {
    window.location.replace("index.html");
    return;
  }

  const sindicatoVinculado = convencaoExistente
    ? D.findSindicatoByCodigo(convencaoExistente.sindicatoCodigo)
    : D.findSindicatoByCodigo(codigoSindicatoParam);

  if (!sindicatoVinculado) {
    window.location.replace("index.html");
    return;
  }

  const isNovo = !convencaoExistente;

  function blankConvencao() {
    return {
      codigo: "", sindicatoCodigo: sindicatoVinculado.codigo, descricao: "",
      configGerais: {
        salarioMesAdmissao: "", calcProporcionalidadeHorista: "", adicionalNoturno: "", horaExtra: "",
        mesesFeriasProporcionais: "", indenizar13FeriasAvisoReavido: "",
        descontarDSRFaltaIntegral: { ativo: false, proporcao: "" }, calcularDSRProfessorMensalista: false,
        calcularSalarioProporcionalDias: "", regrasDiasReais: { semEventos: false, comAfastamento: false, comFerias: false, rescisao: false, admissao: false, divisor: false },
      },
      dataBasePrazos: {
        dataBase: "", calcularDiferencaContribAssistencial: false, diasAusenciaAbonados: { ativo: false, dias: "" },
        percentualMaxVT: "", limiteCargaHoraria: { ativo: false, min: "", max: "" }, diasIndenizacaoDataBase: "",
        naoPagarIndenizacaoAposDataLimite: "", diasAssistenciaHomologacao: "", diasPagamentoRescisao: "", formaApuracaoDias: "", regrasContratoExperiencia: false,
      },
      contribuicoes: {
        assistencial: { ativa: false, mesFolha: "", formaFolha: "", diasFolha: "", mes13: "", forma13: "", dias13: "", descontoAdmissaoPercentual: "", semDescontarEmpregado: false },
        associativa: { ativa: false, mesFolha: "", formaFolha: "", diasFolha: "", mes13: "", forma13: "", dias13: "" },
        confederativa: { ativa: false, mesFolha: "", formaFolha: "", diasFolha: "", mes13: "", forma13: "", dias13: "", naoCumular: false },
        sindical: { ativa: false, mes: "", forma: "", diasTotal: "" },
        mesContribuicaoSindicalAnual: "", gradeConfiguracaoContribAssistencial: [],
      },
      empresasVinculadas: [], pisoSalarial: [], historico: [],
      condicionais: {
        calculos: {
          ferias: { pagarAvosAfastamento180: false, novoPeriodoAquisitivoColetivas: false, adiantar13Ferias: false, fracaoMinimaAvos: { ativo: false, dias: "" }, gratificacaoFerias: { ativo: false } },
          decimoTerceiro: { avosLimitadosAfastamento: { ativo: false, dias: "" }, maiorGradeProfessor: false, reaproveitarUltimoValorAdicional: false },
          avisoPrevio: { avisoMisto: false, tratamentoLei12506: "", liminarInssAvisoIndenizado: false, suspensaoFeriasColetivas: false },
          garantiaSemestral: { aplicacaoProfessorAulista: false },
          licencaPremio: { possui: false, pagarMediaAdicional: false, indenizarNaoGozados: false },
          resilicaoProfessor: { calcular13ReducaoGrade: false, calcularFeriasReducaoGrade: false },
          adicionalTempoServico: { possuiGrade: false, grade: [] },
        },
        comissionado: { pagar13ProporcionalEntreRegimes: false, possuiGarantiaMinima: false },
        medias: { considerarMaisFavoravel: false, mediasDiferenciadasModalidade13: false, reaproveitamentoMediaFerias: false, mediaDiferenciadaComissoes: false, formaCalculoMedia: "" },
        estabilidade: { extensaoAposFerias: false, projecaoAvisoPrevioIndenizado: false, dilatacaoFeriasGozadas: false },
        indenizacaoEspecial: { possuiRescisao: false, possuiAfastamento: false },
        plr: { proporcionalidadeMesesTrabalhados: false, regraMesCheio: false, plrNaRescisao: false, projecaoAvisoPrevio: false },
        observacoes: "",
      },
    };
  }

  let mode = isNovo ? "create" : "view";
  let form = isNovo ? blankConvencao() : JSON.parse(JSON.stringify(convencaoExistente));
  const state = {
    tab: "geral",
    accordionOpen: { calculos: false, comissionado: false, medias: false, estabilidade: false, indenizacaoEspecial: false, plr: false, observacoes: false },
  };

  function getPath(obj, path) {
    return path.split(".").reduce((o, k) => (o == null ? o : o[k]), obj);
  }
  function setPath(obj, path, value) {
    const keys = path.split(".");
    let o = obj;
    for (let i = 0; i < keys.length - 1; i++) o = o[keys[i]];
    o[keys[keys.length - 1]] = value;
  }

  function ensureToast() {
    if (document.getElementById("toast")) return;
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.id = "toast";
    toast.innerHTML = '<span class="toast-icon"></span><div class="flex flex-col gap-0-5"><span class="toast-title"></span><span class="toast-desc"></span></div>';
    document.body.appendChild(toast);
  }

  // ===== Helpers de campo (view + edit) =====
  function campoView(label, valueHtml, wide) {
    return '<div class="detail-field' + (wide ? " detail-field-wide" : "") + '"><span class="detail-field-label">' + label + '</span><div class="detail-field-value">' + valueHtml + "</div></div>";
  }
  function campoEdit(label, inputHtml, wide, obrigatorio) {
    return '<div class="detail-field' + (wide ? " detail-field-wide" : "") + '"><span class="detail-field-label">' + label + (obrigatorio ? ' <span class="text-muted">*</span>' : "") + "</span>" + inputHtml + "</div>";
  }
  function vazio() { return '<span class="italic text-muted">—</span>'; }

  function optLabel(options, value) {
    const found = (options || []).find((o) => (o.value || o) === value);
    return found ? found.label || found : value;
  }
  function textField(label, path, opts) {
    opts = opts || {};
    const value = getPath(form, path);
    if (mode === "view") return campoView(label, value ? value : vazio(), opts.wide);
    return campoEdit(label, '<input class="field-input" data-path="' + path + '" value="' + (value || "").replace(/"/g, "&quot;") + '" placeholder="' + (opts.placeholder || "") + '" />', opts.wide, opts.obrigatorio);
  }
  function selectField(label, path, options, opts) {
    opts = opts || {};
    const value = getPath(form, path);
    if (mode === "view") return campoView(label, value ? optLabel(options, value) : vazio(), opts.wide);
    const optsHtml = options
      .map((o) => {
        const v = o.value !== undefined ? o.value : o;
        const l = o.label !== undefined ? o.label : o;
        return '<option value="' + v + '"' + (value === v ? " selected" : "") + ">" + l + "</option>";
      })
      .join("");
    return campoEdit(
      label,
      '<div class="field-select-wrap"><select class="field-select" data-path="' + path + '"><option value="">Selecione...</option>' + optsHtml + "</select><span class=\"chev\">" + Icon("chevron-down", "size-4") + "</span></div>",
      opts.wide,
      opts.obrigatorio
    );
  }
  function checkboxField(path, label, hint) {
    const checked = !!getPath(form, path);
    if (mode === "view") {
      return '<div class="flex items-center gap-2 text-sm">' + (checked ? '<span style="color:var(--success-text);display:flex;">' + Icon("circle-check", "size-4") + "</span>" : '<span class="text-muted">' + Icon("circle-x", "size-4") + "</span>") + "<span" + (checked ? "" : ' class="text-muted"') + ">" + label + "</span></div>";
    }
    return '<label class="ucheckbox" data-path="' + path + '"><span class="ucheckbox-box' + (checked ? " is-checked" : "") + '">' + Icon("check", "size-4") + '</span><span class="ucheckbox-label">' + label + (hint ? '<span class="ucheckbox-hint">' + hint + "</span>" : "") + "</span></label>";
  }
  // Agrupa uma regra-mãe (checkbox) com o(s) campo(s) que ela habilita, com
  // borda própria — deixa visível qual regra está ativa e o que depende
  // dela, em vez de checkbox e campo dependente soltos na mesma lista.
  // `ativoOverride` é opcional: por padrão, a caixa fica destacada sempre
  // que houver algo em dependentHtml (comportamento original, inalterado em
  // todos os usos existentes). Só é usado hoje pela Contribuição Sindical,
  // cujo dependente (o campo "Mês de contribuição anual") continua sempre
  // visível independente do checkbox — sem esse parâmetro, o destaque
  // ficaria sempre ativo mesmo com a contribuição desmarcada.
  function condRule(checkboxHtml, dependentHtml, ativoOverride) {
    const ativo = ativoOverride !== undefined ? ativoOverride : !!dependentHtml;
    return '<div class="condrule' + (ativo ? " is-active" : "") + '">' + checkboxHtml + (dependentHtml ? '<div class="condrule-dependent">' + dependentHtml + "</div>" : "") + "</div>";
  }
  // Nota discreta para mensagens de "decisão pendente" — ícone pequeno +
  // texto mudo, sem aparência de alerta funcional. Único idioma visual para
  // as ocorrências desse tipo de mensagem na Convenção (antes cada uma
  // usava um tratamento diferente: alert-info cheio, texto solto sem ícone,
  // ou esta mesma nota, já usada no Histórico).
  function notaPendente(textoHtml) {
    return (
      '<div class="flex items-start gap-2">' +
      '<span style="color:var(--muted-foreground);flex-shrink:0;margin-top:1px;">' + Icon("info", "size-3-5") + "</span>" +
      '<span class="text-xs text-muted">' + textoHtml + "</span>" +
      "</div>"
    );
  }
  // Campos previstos na especificação sem controle interativo nesta versão do
  // protótipo (ver nota de cada subcard) — etiquetas soltas, não linhas
  // empilhadas, para não competir com os campos já interativos.
  function refList(items) {
    if (!items.length) return "";
    return (
      '<div class="flex flex-col gap-2" style="margin-top:2px;"><span class="text-xs text-muted">Demais parâmetros desta categoria (referência da especificação):</span>' +
      '<div class="ref-taglist">' +
      items.map(([label, tipo]) => '<span class="ref-tag" title="Tipo de campo: ' + tipo + '">' + label + "</span>").join("") +
      "</div></div>"
    );
  }
  function secao(titulo, camposHtml) {
    return '<div class="detail-section"><h3 class="detail-section-title">' + titulo + '</h3><div class="detail-grid">' + camposHtml + "</div></div>";
  }

  // ===== Aba 1: Configurações Gerais de Cálculo =====
  function tabConfigGerais() {
    const cg = form.configGerais;
    const O = D.CONFIG_GERAIS_OPCOES;
    let html = secao(
      "Cálculo do salário e proporcionalidade",
      selectField("Salário mês admissão", "configGerais.salarioMesAdmissao", O.salarioMesAdmissao, { obrigatorio: true }) +
        selectField("Cálculo proporcionalidade para Horista", "configGerais.calcProporcionalidadeHorista", O.calcProporcionalidadeHorista, {}) +
        textField("Adicional noturno (%)", "configGerais.adicionalNoturno", { placeholder: "20,00", obrigatorio: true }) +
        textField("Hora extra (%)", "configGerais.horaExtra", { placeholder: "50,00", obrigatorio: true }) +
        selectField("Meses férias proporcionais", "configGerais.mesesFeriasProporcionais", O.mesesFeriasProporcionais, { obrigatorio: true }) +
        selectField("Indenizar 13º/férias no aviso reavido", "configGerais.indenizar13FeriasAvisoReavido", O.simNao, { obrigatorio: true })
    );

    const dsrHtml = condRule(
      checkboxField("configGerais.descontarDSRFaltaIntegral.ativo", "Descontar DSR por falta integral"),
      cg.descontarDSRFaltaIntegral.ativo ? '<div style="max-width:220px;">' + selectField("Proporção", "configGerais.descontarDSRFaltaIntegral.proporcao", O.proporcaoDSR, { obrigatorio: true }) + "</div>" : ""
    );
    const dsrProfessorHtml = condRule(checkboxField("configGerais.calcularDSRProfessorMensalista", "Calcular DSR professor mensalista (1/6)"), "");

    // "Calcular salário proporcional aos dias do mês" é a regra principal
    // que habilita as 6 checkboxes de "Regras de aplicação dos dias reais do
    // mês" — por isso saiu do grid-base e passou a viver no mesmo condRule
    // que já usamos para DSR, deixando explícita a relação regra → configu-
    // rações dependentes (antes a regra ficava no grid-base e as 6 checkboxes
    // apareciam soltas, numa seção própria, sem nenhuma ligação visual entre
    // as duas). Campo, opções e comportamento permanecem exatamente os
    // mesmos — só a posição/composição mudou.
    const diasReaisOpcoes = [
      ["semEventos", "Competências sem eventos"],
      ["comAfastamento", "Competências com afastamento"],
      ["comFerias", "Competências com férias"],
      ["rescisao", "Rescisão"],
      ["admissao", "Admissão"],
      ["divisor", "Divisor"],
    ];
    const diasReaisHtml = condRule(
      selectField("Calcular salário proporcional aos dias do mês", "configGerais.calcularSalarioProporcionalDias", O.simNao, { obrigatorio: true }),
      cg.calcularSalarioProporcionalDias === "sim"
        ? '<div class="flex flex-col gap-2"><span class="text-xs text-muted">Regras de aplicação dos dias reais do mês:</span>' +
          diasReaisOpcoes.map(([k, l]) => checkboxField("configGerais.regrasDiasReais." + k, l)).join("") +
          "</div>"
        : ""
    );

    html +=
      '<div class="detail-section"><h3 class="detail-section-title">Regras condicionais</h3><div class="flex flex-col gap-3">' +
      dsrHtml + dsrProfessorHtml + diasReaisHtml +
      "</div></div>";
    // Superfície .card equivalente à já usada na Tela do Sindicato e nas
    // Abas 3/4/5 — só o envoltório externo; a composição interna (secao,
    // condRule) permanece exatamente a mesma.
    return '<div class="card"><div class="card-content flex flex-col gap-6">' + html + "</div></div>";
  }

  // ===== Aba 2: Data-base, Prazos e Regras Gerais =====
  function tabDataBasePrazos() {
    const p = form.dataBasePrazos;
    let html = secao(
      "Data-base e prazos",
      textField("Data-base", "dataBasePrazos.dataBase", { placeholder: "01/12", obrigatorio: true }) +
        textField("Dias para indenização data-base", "dataBasePrazos.diasIndenizacaoDataBase", { obrigatorio: true }) +
        // Refinamento pontual — item 3 (alinhamento): reaproveita
        // `detail-field-wide` (já usado para campos com texto maior em
        // outras trilhas) — a coluna mais larga evita que este label
        // quebre em 2 linhas, que é o que empurrava o input para baixo em
        // relação aos demais campos da mesma linha do grid.
        textField("Não pagar indenização data-base após data-limite", "dataBasePrazos.naoPagarIndenizacaoAposDataLimite", { placeholder: "01/12", wide: true }) +
        textField("Dias para assistência na homologação", "dataBasePrazos.diasAssistenciaHomologacao", {}) +
        textField("Dias para pagamento da rescisão", "dataBasePrazos.diasPagamentoRescisao", {}) +
        selectField("Forma de apuração dos dias (rescisão)", "dataBasePrazos.formaApuracaoDias", D.FORMA_APURACAO_DIAS_OPCOES, {
          obrigatorio: !!(p.diasAssistenciaHomologacao || p.diasPagamentoRescisao),
        })
    );

    const contribAssistHtml = condRule(checkboxField("dataBasePrazos.calcularDiferencaContribAssistencial", "Calcular diferença de Contribuição Assistencial por alteração salarial"), "");
    const experienciaHtml = condRule(checkboxField("dataBasePrazos.regrasContratoExperiencia", "Regras para contrato de experiência (art. 479/480 CLT)"), "");

    const ausenciaHtml = condRule(
      checkboxField("dataBasePrazos.diasAusenciaAbonados.ativo", "Dias de ausência justificada abonados pelo sindicato"),
      p.diasAusenciaAbonados.ativo ? '<div style="max-width:160px;">' + textField("Quantidade de dias", "dataBasePrazos.diasAusenciaAbonados.dias", { obrigatorio: true }) + "</div>" : ""
    );

    const cargaHtml = condRule(
      checkboxField("dataBasePrazos.limiteCargaHoraria.ativo", "Limite de carga horária mínima/máxima mensal"),
      p.limiteCargaHoraria.ativo
        ? '<div class="flex gap-4" style="max-width:340px;">' +
          textField("Mínima (horas)", "dataBasePrazos.limiteCargaHoraria.min", { obrigatorio: true }) +
          textField("Máxima (horas)", "dataBasePrazos.limiteCargaHoraria.max", { obrigatorio: true }) +
          "</div>"
        : ""
    );

    html +=
      '<div class="detail-section"><h3 class="detail-section-title">Regras condicionais</h3><div class="flex flex-col gap-3">' +
      contribAssistHtml + ausenciaHtml + cargaHtml + experienciaHtml +
      "</div></div>" +
      secao("Vale-transporte", textField("Percentual máximo para desconto de VT", "dataBasePrazos.percentualMaxVT", { placeholder: "Preencher só se diferente do padrão geral (6%)" }));
    // Mesma superfície .card aplicada na Aba 1 — mesmo motivo (ver Aba 1).
    return '<div class="card"><div class="card-content flex flex-col gap-6">' + html + "</div></div>";
  }

  // ===== Aba 3: Contribuições Sindicais =====
  // Cada tipo de contribuição segue o mesmo formato: título do tipo + uma
  // única regra condicional ("é cobrada?") cujo dependente é o bloco de
  // mês/forma/dias — por isso usa condRule, igual às demais relações
  // mãe/dependente da Convenção, em vez de uma seção solta.
  function contribuicaoCard(titulo, path, temNaoCumular) {
    const c = getPath(form, path);
    let dependente = "";
    if (c.ativa) {
      dependente =
        '<div class="detail-grid">' +
        selectField("Mês (folha mensal)", path + ".mesFolha", D.MESES_OPCOES) +
        selectField("Forma (folha mensal)", path + ".formaFolha", D.FORMA_CONTRIBUICAO_OPCOES) +
        textField("Dias (folha mensal)", path + ".diasFolha", {}) +
        selectField("Mês (13º salário)", path + ".mes13", D.MESES_OPCOES) +
        selectField("Forma (13º salário)", path + ".forma13", D.FORMA_CONTRIBUICAO_OPCOES) +
        textField("Dias (13º salário)", path + ".dias13", {}) +
        "</div>" +
        (temNaoCumular ? checkboxField(path + ".naoCumular", "Não cumular desconto com Assistencial/Sindical na mesma competência") : "");
    }
    return '<div class="subcard"><div class="subcard-title">' + titulo + "</div>" + condRule(checkboxField(path + ".ativa", "Esta contribuição é cobrada por este sindicato"), dependente) + "</div>";
  }

  function tabContribuicoes() {
    const c = form.contribuicoes;
    let assistDependente = "";
    if (c.assistencial.ativa) {
      assistDependente =
        '<div class="detail-grid">' +
        selectField("Mês (folha mensal)", "contribuicoes.assistencial.mesFolha", D.MESES_OPCOES) +
        selectField("Forma (folha mensal)", "contribuicoes.assistencial.formaFolha", D.FORMA_CONTRIBUICAO_OPCOES) +
        textField("Dias (folha mensal)", "contribuicoes.assistencial.diasFolha", {}) +
        selectField("Mês (13º salário)", "contribuicoes.assistencial.mes13", D.MESES_OPCOES) +
        selectField("Forma (13º salário)", "contribuicoes.assistencial.forma13", D.FORMA_CONTRIBUICAO_OPCOES) +
        textField("Dias (13º salário)", "contribuicoes.assistencial.dias13", {}) +
        textField("Desconto (%) na competência de admissão", "contribuicoes.assistencial.descontoAdmissaoPercentual", {}) +
        "</div>" +
        checkboxField("contribuicoes.assistencial.semDescontarEmpregado", "Calcular sem descontar do empregado (empresa arca com o valor)");
    }

    // Grade movida para dentro do subcard "Contribuição Assistencial" (era
    // uma seção solta no fim da aba, longe do bloco a que pertence) — mesmo
    // texto, colunas, ação e dados; só a proximidade com a contribuição à
    // qual se refere foi corrigida.
    const gradeRows = c.gradeConfiguracaoContribAssistencial;
    let gradeHtml =
      '<div class="subcard"><div class="flex items-center justify-between gap-3"><div class="subcard-title">Grade de configuração de Contribuição Assistencial</div>' +
      (mode !== "view" ? '<button type="button" class="btn btn-outline btn-sm" id="btn-add-grade-contrib">' + Icon("plus", "size-3-5") + " Adicionar linha</button>" : "") +
      "</div>";
    if (gradeRows.length === 0) {
      gradeHtml +=
        '<div class="row-empty-state"><div class="flex flex-col gap-1" style="align-items:center;">' +
        "<span>Nenhuma linha configurada.</span>" +
        "<span>Adicione uma linha para detalhar faixas salariais, percentuais ou valores fixos desta contribuição.</span>" +
        "</div></div>";
    } else {
      gradeHtml +=
        '<div class="table-wrap"><table class="dtable dtable-compact"><thead><tr><th>Faixa salarial</th><th>Percentual</th><th>Valor fixo</th>' + (mode !== "view" ? "<th></th>" : "") + "</tr></thead><tbody>" +
        gradeRows
          .map((r, i) =>
            mode === "view"
              ? "<tr><td>" + r.faixa + "</td><td>" + (r.percentual || "—") + "</td><td>" + (r.valorFixo || "—") + "</td></tr>"
              : "<tr>" +
                '<td><input class="field-input" data-grade-contrib="' + i + '" data-campo="faixa" value="' + r.faixa.replace(/"/g, "&quot;") + '" /></td>' +
                '<td><input class="field-input" data-grade-contrib="' + i + '" data-campo="percentual" value="' + r.percentual + '" /></td>' +
                '<td><input class="field-input" data-grade-contrib="' + i + '" data-campo="valorFixo" value="' + r.valorFixo + '" /></td>' +
                '<td><button type="button" class="btn-link" style="color:var(--destructive);" data-remove-grade-contrib="' + i + '">remover</button></td>' +
                "</tr>"
          )
          .join("") +
        "</tbody></table></div>";
    }
    gradeHtml += "</div>";

    const assistencialHtml =
      '<div class="subcard"><div class="subcard-title">Contribuição Assistencial</div>' +
      condRule(checkboxField("contribuicoes.assistencial.ativa", "Esta contribuição é cobrada por este sindicato"), assistDependente) +
      gradeHtml +
      "</div>";

    // "Mês de contribuição (Contribuição Sindical anual)" e a observação
    // legal do art. 580 da CLT passam a viver dentro do MESMO condRule do
    // checkbox "Esta contribuição é cobrada por este sindicato" — a relação
    // pedida é Contribuição Sindical → checkbox → Mês de contribuição, não
    // um bloco à parte depois do checkbox. O campo continua sempre visível e
    // editável (nada foi tornado condicional ao checkbox): ele só passou a
    // aparecer dentro da mesma caixa da regra, em vez de num subcard próprio.
    const sindicalDependente =
      (form.contribuicoes.sindical.ativa
        ? '<div class="detail-grid">' +
          selectField("Mês", "contribuicoes.sindical.mes", D.MESES_OPCOES) +
          selectField("Forma", "contribuicoes.sindical.forma", D.FORMA_CONTRIBUICAO_OPCOES) +
          textField("Total de dias", "contribuicoes.sindical.diasTotal", {}) +
          "</div>"
        : "") +
      '<div style="max-width:280px;">' + selectField("Mês de contribuição (Contribuição Sindical anual)", "contribuicoes.mesContribuicaoSindicalAnual", D.MESES_OPCOES) + "</div>" +
      '<span class="text-xs text-muted">Referência ao art. 580 da CLT — observada a exigência de autorização prévia e expressa do empregado.</span>';

    // O destaque visual da caixa (fundo/borda de "ativo") segue o estado
    // real do checkbox "ativa" — não a mera presença de conteúdo dependente
    // (que aqui é sempre truthy, já que o Mês de contribuição continua
    // visível mesmo com a contribuição desmarcada). Sem esse terceiro
    // parâmetro, a caixa pareceria sempre ativa mesmo desligada.
    const sindicalHtml =
      '<div class="subcard"><div class="subcard-title">Contribuição Sindical</div>' +
      condRule(checkboxField("contribuicoes.sindical.ativa", "Esta contribuição é cobrada por este sindicato"), sindicalDependente, form.contribuicoes.sindical.ativa) +
      "</div>";

    // As quatro contribuições passam a viver dentro do mesmo Card usado em
    // Empresas Vinculadas e Piso Salarial/Histórico — mesma moldura
    // (card-header com título/descrição + card-content), para que a aba
    // pareça parte da mesma experiência de coleção/configuração da
    // Convenção, e não conteúdo solto direto na página.
    return (
      '<div class="card gap-4">' +
      '<div class="card-header"><div class="card-title">Contribuições Sindicais</div><div class="card-description">Contribuições cobradas da categoria e o vencimento de cada uma, na folha mensal e no 13º salário.</div></div>' +
      '<div class="card-content flex flex-col gap-3">' +
      assistencialHtml +
      contribuicaoCard("Contribuição Associativa", "contribuicoes.associativa", false) +
      contribuicaoCard("Contribuição Confederativa", "contribuicoes.confederativa", true) +
      sindicalHtml +
      "</div>" +
      "</div>"
    );
  }

  // ===== Aba 4: Empresas Vinculadas =====
  function tabEmpresas() {
    const selecionadas = form.empresasVinculadas;
    const alertaHtml =
      selecionadas.length === 0
        ? '<div class="alert alert-warning gap-2">' + Icon("alert-triangle", "size-4") + '<div class="alert-desc">Esta convenção ainda não produz efeito na folha — <b>nenhuma empresa vinculada</b>.</div></div>'
        : '<div class="flex items-center gap-2 text-sm text-muted">' + selecionadas.length + (selecionadas.length === 1 ? " empresa vinculada" : " empresas vinculadas") + "</div>";

    const acoesHtml = mode !== "view"
      ? '<div class="flex gap-2"><button type="button" class="btn btn-outline btn-sm" id="btn-emp-todas">Todas</button><button type="button" class="btn btn-outline btn-sm" id="btn-emp-nenhuma">Nenhuma</button><button type="button" class="btn btn-outline btn-sm" id="btn-emp-inverter">Inverter</button></div>'
      : "";

    const listaEmpresas = mode === "view" ? E.EMPRESAS.filter((e) => selecionadas.includes(e.codigo)) : E.EMPRESAS;

    let tabelaHtml;
    if (listaEmpresas.length === 0) {
      tabelaHtml = '<div class="row-empty-state">Nenhuma empresa vinculada a esta convenção.</div>';
    } else {
      const rows = listaEmpresas
        .map((e) => {
          const marcada = selecionadas.includes(e.codigo);
          return (
            "<tr>" +
            (mode !== "view"
              ? '<td style="width:36px;"><label class="ucheckbox" data-empresa-check="' + e.codigo + '"><span class="ucheckbox-box' + (marcada ? " is-checked" : "") + '">' + Icon("check", "size-4") + "</span></label></td>"
              : "") +
            "<td>" + e.nome + "</td>" +
            '<td class="col-pad-md">' + e.dadosGerais.cnpj + "</td>" +
            "</tr>"
          );
        })
        .join("");
      tabelaHtml =
        '<div class="table-wrap"><table class="dtable"><thead><tr>' +
        (mode !== "view" ? "<th></th>" : "") +
        "<th>Empresa</th><th class=\"col-pad-md\">CNPJ</th></tr></thead><tbody>" + rows + "</tbody></table></div>";
    }

    return (
      '<div class="card gap-4"><div class="card-header"><div class="card-title">Empresas vinculadas</div><div class="card-description">Empresas cadastradas no sistema às quais esta convenção se aplica.</div></div>' +
      '<div class="card-content flex flex-col gap-3">' + alertaHtml +
      acoesHtml +
      tabelaHtml +
      "</div></div>"
    );
  }

  // ===== Aba 5: Piso Salarial e Histórico =====
  function tabPisoHistorico() {
    const pisos = form.pisoSalarial;
    let pisoHtml =
      '<div class="card gap-4"><div class="card-header"><div class="flex items-center justify-between gap-3 flex-wrap">' +
      '<div><div class="card-title">Piso Salarial</div><div class="card-description">Valor mínimo garantido pela convenção, quando houver piso normativo para a categoria.</div></div>' +
      (mode !== "view" ? '<button type="button" class="btn btn-outline btn-sm w-fit" id="btn-add-piso">' + Icon("plus", "size-3-5") + " Adicionar piso</button>" : "") +
      "</div></div><div class=\"card-content\">";
    if (pisos.length === 0) {
      // Mesma estrutura do empty state de "Convenções deste sindicato": duas
      // linhas (mensagem + orientação), centralizadas, sem repetir a ação —
      // "Adicionar piso" já está fixo no cabeçalho do card, acima.
      pisoHtml +=
        '<div class="row-empty-state"><div class="flex flex-col gap-1" style="align-items:center;">' +
        "<span>Nenhum piso salarial cadastrado.</span>" +
        "<span>Cadastre um piso para registrar o valor mínimo garantido pela convenção.</span>" +
        "</div></div>";
    } else {
      pisoHtml +=
        '<div class="table-wrap"><table class="dtable"><thead><tr><th>Descrição</th><th class="col-pad-md">Valor</th>' + (mode !== "view" ? '<th class="col-pad-end"></th>' : "") + "</tr></thead><tbody>" +
        pisos
          .map(
            (p) =>
              "<tr><td>" + p.descricao + '</td><td class="col-pad-md">R$ ' + p.valor + "</td>" +
              (mode !== "view"
                ? '<td class="col-pad-end"><div class="flex gap-3"><button type="button" class="btn-link" style="color:var(--info-text);" data-editar-piso="' + p.codigo + '">editar</button><button type="button" class="btn-link" style="color:var(--destructive);" data-remover-piso="' + p.codigo + '">remover</button></div></td>'
                : "") +
              "</tr>"
          )
          .join("") +
        "</tbody></table></div>";
    }
    pisoHtml += "</div></div>";

    const historico = form.historico.slice().sort((a, b) => (a.data < b.data ? 1 : -1));
    let histHtml =
      '<div class="card gap-4"><div class="card-header"><div class="flex items-center justify-between gap-3 flex-wrap">' +
      '<div><div class="card-title">Histórico de Alteração Salarial</div><div class="card-description">Registro cronológico de convenções aplicadas à categoria — origem e percentual de reajuste.</div></div>' +
      (mode !== "view" ? '<button type="button" class="btn btn-outline btn-sm w-fit" id="btn-add-historico">' + Icon("plus", "size-3-5") + " Registrar alteração</button>" : "") +
      "</div></div><div class=\"card-content\">";
    if (historico.length === 0) {
      histHtml +=
        '<div class="row-empty-state"><div class="flex flex-col gap-1" style="align-items:center;">' +
        "<span>Nenhum histórico de alteração salarial registrado.</span>" +
        "<span>Registre uma alteração salarial para começar o histórico desta convenção.</span>" +
        "</div></div>";
    } else {
      histHtml +=
        '<div class="table-wrap"><table class="dtable"><thead><tr><th>Data</th><th>Descrição</th><th class="col-pad-md">Tipo</th><th class="col-pad-md">Nº processo</th><th class="col-pad-md">% CCT</th>' + (mode !== "view" ? '<th class="col-pad-end"></th>' : "") + "</tr></thead><tbody>" +
        historico
          .map(
            (h) =>
              "<tr><td>" + h.data + "</td><td>" + UI.truncatedCell(h.descricao, 220) + '</td><td class="col-pad-md">' + h.tipo + '</td><td class="col-pad-md">' + (h.numeroProcesso || "—") + '</td><td class="col-pad-md">' + (h.percentualCCT ? h.percentualCCT + "%" : "—") + "</td>" +
              (mode !== "view"
                ? '<td class="col-pad-end"><div class="flex gap-3"><button type="button" class="btn-link" style="color:var(--info-text);" data-editar-historico="' + h.data + '|' + h.descricao.replace(/"/g, "") + '">editar</button><button type="button" class="btn-link" style="color:var(--destructive);" data-remover-historico="' + h.data + '|' + h.descricao.replace(/"/g, "") + '">remover</button></div></td>'
                : "") +
              "</tr>"
          )
          .join("") +
        "</tbody></table></div>";
    }
    // Nota de produto/protótipo, não uma comunicação funcional para o
    // usuário do ERP — por isso não usa o mesmo peso visual de um alerta
    // real (ex.: "nenhuma empresa vinculada", na aba Empresas Vinculadas).
    // A decisão de negócio em si (se o histórico deve versionar os demais
    // blocos da Convenção) continua sem solução — não foi resolvida aqui.
    histHtml +=
      '<div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border);">' +
      notaPendente('A especificação chama este registro de "nova vigência da convenção", mas não define se isso deve versionar os demais blocos da parametrização. Neste protótipo, o histórico funciona apenas como um registro cronológico — sem esse efeito. <b>Decisão pendente.</b>') +
      "</div></div>";

    return pisoHtml + histHtml;
  }

  // ===== Aba 6: Parâmetros Condicionais =====
  function accordionItem(key, titulo, contentHtml) {
    const aberto = state.accordionOpen[key];
    return (
      '<div class="accordion-item' + (aberto ? " is-open" : "") + '">' +
      '<button type="button" class="accordion-trigger" data-accordion-toggle="' + key + '">' +
      '<span class="accordion-trigger-title">' + titulo + "</span>" +
      '<span class="accordion-trigger-chev">' + Icon("chevron-down", "size-4") + "</span>" +
      "</button>" +
      '<div class="accordion-content">' + contentHtml + "</div>" +
      "</div>"
    );
  }

  function subcardFerias() {
    const f = form.condicionais.calculos.ferias;
    let html =
      '<div class="subcard"><div class="subcard-title">Férias</div>' +
      '<div class="flex flex-col gap-2">' +
      checkboxField("condicionais.calculos.ferias.pagarAvosAfastamento180", "Pagar avos com mais de 180 dias de afastamento previdenciário") +
      checkboxField("condicionais.calculos.ferias.novoPeriodoAquisitivoColetivas", "Regras de novo período aquisitivo em férias coletivas") +
      checkboxField("condicionais.calculos.ferias.adiantar13Ferias", "Adiantar 1ª parcela do 13º proporcional nas férias") +
      "</div>" +
      '<div class="flex flex-col gap-3">' +
      condRule(
        checkboxField("condicionais.calculos.ferias.fracaoMinimaAvos.ativo", "Definir fração mínima de dias para avos de férias (demissão/rescisão)"),
        f.fracaoMinimaAvos.ativo ? '<div style="max-width:160px;">' + textField("Fração mínima (dias)", "condicionais.calculos.ferias.fracaoMinimaAvos.dias", { placeholder: "15", obrigatorio: true }) + "</div>" : ""
      ) +
      condRule(
        checkboxField("condicionais.calculos.ferias.gratificacaoFerias.ativo", "Gratificação de férias"),
        f.gratificacaoFerias.ativo
          ? notaPendente("Detalhamento previsto na especificação: gozadas/indenizadas, exceções em férias coletivas, não cumulação com 1/3, exclusões por motivo de rescisão. <b>Estrutura de grade pendente de decisão.</b>")
          : ""
      ) +
      "</div>";

    html += refList([
      ["Datas de não início de gozo de férias", "Grade/Tabela"],
      ["Adiantamento do 13º nas férias por mês", "Grade/Tabela"],
      ["Maior grade salarial dos últimos meses (professor)", "Checkbox"],
      ["Calcular férias proporcionais para rescisão com justa causa", "Checkbox"],
      ["Definir data de pagamento das férias (dias antes do gozo)", "Número"],
      ["Dias a não considerar nas férias (feriados/pontos facultativos)", "Grade/Tabela"],
      ["Percentual de adicional sobre férias além do 1/3", "Grade/Tabela"],
      ["Dias de gozo diferenciados por condição", "Grade/Tabela"],
    ]);
    html += "</div>";
    return html;
  }

  function subcardDecimoTerceiro() {
    const dt = form.condicionais.calculos.decimoTerceiro;
    return (
      '<div class="subcard"><div class="subcard-title">13º Salário</div>' +
      condRule(
        checkboxField("condicionais.calculos.decimoTerceiro.avosLimitadosAfastamento.ativo", "Limitar avos pagos durante afastamento previdenciário"),
        dt.avosLimitadosAfastamento.ativo ? '<div style="max-width:160px;">' + textField("Dias-limite / avos", "condicionais.calculos.decimoTerceiro.avosLimitadosAfastamento.dias", { placeholder: "180", obrigatorio: true }) + "</div>" : ""
      ) +
      '<div class="flex flex-col gap-2">' +
      checkboxField("condicionais.calculos.decimoTerceiro.maiorGradeProfessor", "Maior grade salarial dos últimos meses (professor)") +
      checkboxField("condicionais.calculos.decimoTerceiro.reaproveitarUltimoValorAdicional", "Reaproveitar último valor de rubricas de adicional no 13º") +
      "</div></div>"
    );
  }

  function subcardAvisoPrevio() {
    const ap = form.condicionais.calculos.avisoPrevio;
    let html =
      '<div class="subcard"><div class="subcard-title">Aviso Prévio</div><div class="flex flex-col gap-2">' +
      checkboxField("condicionais.calculos.avisoPrevio.avisoMisto", "Aviso prévio misto (trabalhado/indenizado)") +
      checkboxField("condicionais.calculos.avisoPrevio.liminarInssAvisoIndenizado", "Liminar para não recolhimento de INSS sobre aviso indenizado") +
      checkboxField("condicionais.calculos.avisoPrevio.suspensaoFeriasColetivas", "Suspensão do aviso prévio em férias coletivas") +
      "</div>";
    // Sem margin-top próprio: o subcard já é flex-col com gap entre seus
    // filhos diretos (mesmo ajuste já aplicado em Médias, Fase 2) — o
    // margin-top:10px anterior duplicava esse espaçamento.
    html += '<div style="max-width:340px;">' + selectField("Tratamento dos dias da Lei 12.506/2011", "condicionais.calculos.avisoPrevio.tratamentoLei12506", D.TRATAMENTO_LEI_OPCOES) + "</div>";
    html += refList([
      ["Datas restritas para início do aviso prévio", "Grade/Tabela"],
      ["Base de cálculo do aviso prévio para avos indenizados", "Checkbox"],
      ["Regras de contagem de prazo (notificação, mês completo, sábado/domingo/feriado)", "Seleção múltipla"],
      ["Modalidade padrão de aviso prévio para demissão sem justa causa", "Seleção (lista)"],
      ["Proporcionalidade de dias do aviso (Lei 12.506/2011 ou regra própria)", "Grade/Tabela"],
      ["Redução de jornada/dias durante o aviso trabalhado", "Grade/Tabela"],
      ["Aviso prévio especial", "Grade/Tabela"],
    ]);
    html += "</div>";
    return html;
  }

  function subcardGarantiaSemestral() {
    return (
      '<div class="subcard"><div class="subcard-title">Garantia Semestral</div>' +
      checkboxField("condicionais.calculos.garantiaSemestral.aplicacaoProfessorAulista", "Aplicação a professores aulista variável") +
      refList([["Grade de vigências e condições da garantia semestral", "Grade/Tabela"]]) +
      "</div>"
    );
  }

  function subcardLicencaPremio() {
    const lp = form.condicionais.calculos.licencaPremio;
    return (
      '<div class="subcard"><div class="subcard-title">Licença Prêmio</div>' +
      condRule(
        checkboxField("condicionais.calculos.licencaPremio.possui", "Possui licença prêmio"),
        lp.possui
          ? '<div class="flex flex-col gap-2">' +
            checkboxField("condicionais.calculos.licencaPremio.pagarMediaAdicional", "Pagar média/adicional na licença prêmio") +
            checkboxField("condicionais.calculos.licencaPremio.indenizarNaoGozados", "Indenizar na rescisão dias não gozados") +
            "</div>"
          : ""
      ) +
      "</div>"
    );
  }

  function subcardResilicaoProfessor() {
    return (
      '<div class="subcard"><div class="subcard-title">Resilição Professor</div><div class="flex flex-col gap-2">' +
      checkboxField("condicionais.calculos.resilicaoProfessor.calcular13ReducaoGrade", "Calcular 13º proporcional à redução de grade") +
      checkboxField("condicionais.calculos.resilicaoProfessor.calcularFeriasReducaoGrade", "Calcular férias referente à redução de grade") +
      "</div></div>"
    );
  }

  function subcardAdicionalTempoServico() {
    const grade = form.condicionais.calculos.adicionalTempoServico.grade;
    let html =
      '<div class="subcard"><div class="flex items-center justify-between gap-3"><div class="subcard-title">Adicional por Tempo de Serviço</div>' +
      (mode !== "view" ? '<button type="button" class="btn btn-outline btn-sm" id="btn-add-grade-tempo-servico">' + Icon("plus", "size-3-5") + " Adicionar linha</button>" : "") +
      "</div>";
    if (grade.length === 0) {
      html +=
        '<div class="row-empty-state"><div class="flex flex-col gap-1" style="align-items:center;">' +
        "<span>Nenhuma linha configurada.</span>" +
        "<span>Adicione uma linha para detalhar a periodicidade e o percentual do adicional por tempo de serviço.</span>" +
        "</div></div>";
    } else {
      html +=
        '<div class="table-wrap"><table class="dtable dtable-compact"><thead><tr><th>Periodicidade</th><th>Percentual</th><th>Base de cálculo</th>' + (mode !== "view" ? "<th></th>" : "") + "</tr></thead><tbody>" +
        grade
          .map((r, i) =>
            mode === "view"
              ? "<tr><td>" + r.periodicidade + "</td><td>" + r.percentual + "%</td><td>" + r.base + "</td></tr>"
              : "<tr>" +
                '<td><input class="field-input" data-grade-tempo-servico="' + i + '" data-campo="periodicidade" value="' + r.periodicidade.replace(/"/g, "&quot;") + '" /></td>' +
                '<td><input class="field-input" data-grade-tempo-servico="' + i + '" data-campo="percentual" value="' + r.percentual + '" /></td>' +
                '<td><input class="field-input" data-grade-tempo-servico="' + i + '" data-campo="base" value="' + r.base.replace(/"/g, "&quot;") + '" /></td>' +
                '<td><button type="button" class="btn-link" style="color:var(--destructive);" data-remove-grade-tempo-servico="' + i + '">remover</button></td>' +
                "</tr>"
          )
          .join("") +
        "</tbody></table></div>";
    }
    html += "</div>";
    return html;
  }

  function accordionCalculos() {
    return subcardFerias() + subcardDecimoTerceiro() + subcardAvisoPrevio() + subcardGarantiaSemestral() + subcardLicencaPremio() + subcardResilicaoProfessor() + subcardAdicionalTempoServico();
  }

  // Comissionado tem só 2 parâmetros, sem subtema próprio — não é caso para
  // subcard (regra da Fase 2: consistência semântica, não mecânica). O
  // ajuste é só agrupá-los com o mesmo espaçamento (gap-3) já usado em
  // outras listas de regras da Convenção, em vez de deixá-los como dois
  // filhos soltos do accordion (que herdavam o espaçamento largo entre
  // grupos, de 22px, como se fossem dois assuntos diferentes).
  function accordionComissionado() {
    return (
      '<div class="flex flex-col gap-3">' +
      checkboxField("condicionais.comissionado.pagar13ProporcionalEntreRegimes", "Pagar 13º proporcional entre regimes (Mensalista/Comissionado)") +
      condRule(
        checkboxField("condicionais.comissionado.possuiGarantiaMinima", "Possui garantia mínima"),
        form.condicionais.comissionado.possuiGarantiaMinima
          ? notaPendente("A especificação não detalha os campos do piso de remuneração garantido. <b>Decisão pendente.</b>")
          : ""
      ) +
      "</div>"
    );
  }

  // Os checkboxes gerais e a "Forma de cálculo da média" pertencem ao mesmo
  // conjunto de parâmetros de Médias (não são subtemas distintos) — por
  // isso ficam num único agrupamento (gap-4), em vez de dois blocos com
  // espaçamento avulso (o antigo margin-top:10px duplicava o espaçamento já
  // dado pelo accordion, criando um respiro maior que o necessário entre
  // duas partes do mesmo assunto).
  function accordionMedias() {
    return (
      '<div class="flex flex-col gap-4">' +
      '<div class="flex flex-col gap-2">' +
      checkboxField("condicionais.medias.considerarMaisFavoravel", "Considerar a média mais favorável ao empregado") +
      checkboxField("condicionais.medias.mediasDiferenciadasModalidade13", "Médias diferenciadas por modalidade de 13º") +
      checkboxField("condicionais.medias.reaproveitamentoMediaFerias", "Reaproveitamento da média de férias para cálculos seguintes") +
      checkboxField("condicionais.medias.mediaDiferenciadaComissoes", "Média diferenciada para Comissões") +
      "</div>" +
      '<div class="detail-grid" style="max-width:340px;">' +
      selectField("Forma de cálculo da média", "condicionais.medias.formaCalculoMedia", D.FORMA_CALCULO_MEDIA_OPCOES, { obrigatorio: true }) +
      "</div>" +
      "</div>" +
      refList([
        ["Médias diferentes para férias gozadas x pagas em rescisão", "Checkbox"],
        ["Cálculo individual por rubrica", "Checkbox"],
        ["Regras de exclusão do mês de gozo de férias no cálculo de médias", "Checkbox"],
        ["Correção monetária das médias (índice de correção)", "Checkbox + Seleção"],
        ["Regras de médias na rescisão", "Seleção múltipla"],
        ["Regras de médias em afastamento", "Seleção múltipla"],
      ])
    );
  }

  function accordionEstabilidade() {
    return (
      '<div class="flex flex-col gap-2">' +
      checkboxField("condicionais.estabilidade.extensaoAposFerias", "Extensão da estabilidade após retorno de férias") +
      checkboxField("condicionais.estabilidade.projecaoAvisoPrevioIndenizado", "Projeção do aviso prévio indenizado no cálculo da estabilidade") +
      checkboxField("condicionais.estabilidade.dilatacaoFeriasGozadas", "Dilatação da estabilidade por férias gozadas dentro do período") +
      "</div>" +
      refList([
        ["Vínculo de regras de estabilidade a motivo de rescisão", "Grade/Tabela"],
        ["Grade de hipóteses de estabilidade por afastamento", "Grade/Tabela"],
        ["Multa por estabilidade decorrente de dissídio coletivo", "Grade/Tabela"],
        ["Demais estabilidades (CIPA, pré-aposentadoria etc.)", "Grade/Tabela"],
      ])
    );
  }

  // As duas regras (rescisão/afastamento) pertencem ao mesmo assunto
  // ("Indenização Especial") — agrupadas com gap-3, mesmo espaçamento usado
  // para múltiplos condRule dentro de uma mesma seção nas abas 1 e 2, em vez
  // de ficarem soltas como dois filhos diretos do accordion.
  function accordionIndenizacaoEspecial() {
    const ie = form.condicionais.indenizacaoEspecial;
    return (
      '<div class="flex flex-col gap-3">' +
      condRule(
        checkboxField("condicionais.indenizacaoEspecial.possuiRescisao", "Indenização especial na rescisão"),
        ie.possuiRescisao ? notaPendente("Grade de indenizações por tempo de casa, faixa salarial ou vínculo — estrutura de colunas pendente de decisão.") : ""
      ) +
      condRule(
        checkboxField("condicionais.indenizacaoEspecial.possuiAfastamento", "Indenização especial em afastamento"),
        ie.possuiAfastamento ? notaPendente("Grade de indenizações por faixa salarial e tipo de folha — estrutura de colunas pendente de decisão.") : ""
      ) +
      "</div>"
    );
  }

  function accordionPlr() {
    return (
      '<div class="flex flex-col gap-2">' +
      checkboxField("condicionais.plr.proporcionalidadeMesesTrabalhados", "Proporcionalidade dos meses trabalhados entre vigências") +
      checkboxField("condicionais.plr.regraMesCheio", "Regra de mês cheio (mínimo 15 dias)") +
      checkboxField("condicionais.plr.plrNaRescisao", "PLR na rescisão (antes ou dentro da vigência)") +
      checkboxField("condicionais.plr.projecaoAvisoPrevio", "Projeção do aviso prévio indenizado no cálculo do PLR") +
      "</div>" +
      refList([
        ["Tratamento de afastamentos como tempo trabalhado", "Grade/Tabela"],
        ["Exclusão por motivo de rescisão", "Seleção múltipla"],
        ["Grade de pagamentos do PLR", "Grade/Tabela"],
        ["Grade de descontos sobre o PLR", "Grade/Tabela"],
      ])
    );
  }

  function accordionObservacoes() {
    const valor = form.condicionais.observacoes;
    if (mode === "view") return campoView("Observações", valor || vazio(), true);
    return campoEdit("Observações", '<textarea class="field-textarea" data-path="condicionais.observacoes" placeholder="Particularidades da convenção, contatos, ressalvas...">' + (valor || "") + "</textarea>", true, false);
  }

  function tabCondicionais() {
    return (
      '<div class="accordion">' +
      accordionItem("calculos", "Cálculos", accordionCalculos()) +
      accordionItem("comissionado", "Comissionado", accordionComissionado()) +
      accordionItem("medias", "Médias", accordionMedias()) +
      accordionItem("estabilidade", "Estabilidade", accordionEstabilidade()) +
      accordionItem("indenizacaoEspecial", "Indenização Especial", accordionIndenizacaoEspecial()) +
      accordionItem("plr", "P.L.R.", accordionPlr()) +
      accordionItem("observacoes", "Observações", accordionObservacoes()) +
      "</div>"
    );
  }

  // `label` é o título completo (usado no cabeçalho da etapa atual);
  // `shortLabel` é exclusivo do rótulo do stepper, para caber nas 6 etapas
  // lado a lado sem comprimir/truncar em telas menores (ver Fase 1 da
  // Decisão de fluxo — Progressão por etapas).
  const TABS = [
    { key: "geral", label: "Configurações Gerais de Cálculo", shortLabel: "Configurações Gerais", render: tabConfigGerais },
    { key: "databaseprazos", label: "Data-base, Prazos e Regras Gerais", shortLabel: "Data-base e Prazos", render: tabDataBasePrazos },
    { key: "contribuicoes", label: "Contribuições Sindicais", shortLabel: "Contribuições", render: tabContribuicoes },
    { key: "empresas", label: "Empresas Vinculadas", shortLabel: "Empresas Vinculadas", render: tabEmpresas },
    { key: "pisohistorico", label: "Piso Salarial e Histórico", shortLabel: "Piso e Histórico", render: tabPisoHistorico },
    { key: "condicionais", label: "Parâmetros Condicionais", shortLabel: "Parâmetros Condicionais", render: tabCondicionais },
  ];

  // Fase 2 da "Decisão de fluxo — Progressão por etapas" (docs/06-sindicato-
  // convencao-spec.md): estado calculado de conclusão por etapa (.is-done).
  // Fase 3 reaproveita exatamente os mesmos critérios como gate real de
  // "Próxima etapa"/"Salvar Convenção" (ver podeAvancarEtapa/
  // podeSalvarConvencao, abaixo) — nenhum critério novo foi adicionado aqui.
  //
  // Cada critério usa exatamente os mesmos campos já marcados com
  // `obrigatorio: true` (asterisco) no conteúdo de cada aba, que por sua vez
  // refletem a classificação Obrigatório/Condicional da especificação
  // original — nenhum critério novo foi inventado aqui. Campos condicionais
  // só entram na conta quando a regra que os habilita está ativa.
  //
  // Etapas 3 (Contribuições Sindicais) e 5 (Piso Salarial e Histórico) não
  // têm hoje nenhum campo classificado como Obrigatório na tela principal
  // (ver Matriz de Decisão da auditoria anterior) — por instrução explícita,
  // ficam com lista de critérios vazia. `etapaConcluida` continua tratando
  // isso como "sem pendência" para fins de gate (não bloqueiam nada), mas a
  // Fase 4A separa esse conceito do `.is-done` exibido no stepper (ver
  // `etapaTemCriterios`, abaixo) — evita comunicar "concluída" quando, na
  // verdade, não existe nenhum critério a verificar.
  //
  // Cada critério é um objeto `{ ok, grupo }`: `ok(form)` é a checagem em si
  // (idêntica à da Fase 2/3, nenhuma regra nova); `grupo` é opcional e só é
  // usado pela Etapa 6 (única com conteúdo dentro de accordions) para saber
  // qual accordion abrir automaticamente quando a pendência estiver nele
  // (ver `gruposComPendencia`, abaixo).
  const CRITERIOS_ETAPA = {
    // Fase 4B (docs/06-sindicato-convencao-spec.md, "Decisão de fluxo", item
    // 10): a Descrição deixa de ser um requisito paralelo ao sistema de
    // etapas e passa a integrar o critério da própria Etapa 1 — ela
    // continua vivendo no cabeçalho da tela (não faz parte do conteúdo
    // renderizado da Aba 1), mas conta para a conclusão desta etapa.
    geral: [
      { ok: (f) => !!(f.descricao || "").trim() },
      { ok: (f) => !!f.configGerais.salarioMesAdmissao },
      { ok: (f) => !!f.configGerais.adicionalNoturno },
      { ok: (f) => !!f.configGerais.horaExtra },
      { ok: (f) => !!f.configGerais.mesesFeriasProporcionais },
      { ok: (f) => !!f.configGerais.indenizar13FeriasAvisoReavido },
      { ok: (f) => !!f.configGerais.calcularSalarioProporcionalDias },
      { ok: (f) => !f.configGerais.descontarDSRFaltaIntegral.ativo || !!f.configGerais.descontarDSRFaltaIntegral.proporcao },
    ],
    databaseprazos: [
      { ok: (f) => !!f.dataBasePrazos.dataBase },
      { ok: (f) => !!f.dataBasePrazos.diasIndenizacaoDataBase },
      { ok: (f) => !f.dataBasePrazos.diasAusenciaAbonados.ativo || !!f.dataBasePrazos.diasAusenciaAbonados.dias },
      { ok: (f) => !f.dataBasePrazos.limiteCargaHoraria.ativo || (!!f.dataBasePrazos.limiteCargaHoraria.min && !!f.dataBasePrazos.limiteCargaHoraria.max) },
      { ok: (f) => !(f.dataBasePrazos.diasAssistenciaHomologacao || f.dataBasePrazos.diasPagamentoRescisao) || !!f.dataBasePrazos.formaApuracaoDias },
    ],
    // Nenhum campo classificado como Obrigatório nesta aba hoje — ver nota
    // acima. Sem pendência (gate) e sem `.is-done` (exibição — ver
    // `etapaTemCriterios`).
    contribuicoes: [],
    // Único critério já aprovado explicitamente na "Decisão de fluxo"
    // (item 8): ao menos uma empresa vinculada.
    empresas: [{ ok: (f) => f.empresasVinculadas.length > 0 }],
    // Nenhum campo classificado como Obrigatório nesta aba hoje (os
    // critérios dos Sheets de Piso/Histórico são locais, para adicionar uma
    // linha — não um requisito da etapa em si). Mesma observação acima.
    pisohistorico: [],
    condicionais: [
      { ok: (f) => !!f.condicionais.medias.formaCalculoMedia, grupo: "medias" },
      { ok: (f) => !f.condicionais.calculos.ferias.fracaoMinimaAvos.ativo || !!f.condicionais.calculos.ferias.fracaoMinimaAvos.dias, grupo: "calculos" },
      { ok: (f) => !f.condicionais.calculos.decimoTerceiro.avosLimitadosAfastamento.ativo || !!f.condicionais.calculos.decimoTerceiro.avosLimitadosAfastamento.dias, grupo: "calculos" },
    ],
  };

  function etapaConcluida(key) {
    return (CRITERIOS_ETAPA[key] || []).every((criterio) => criterio.ok(form));
  }

  // Fase 4A — Parte 1: uma etapa só deve exibir `.is-done` quando de fato
  // possui algum critério e ele está satisfeito. Etapas sem critério (3 e 5)
  // usam isso para permanecer visualmente neutras (estado padrão do
  // `.stepper-step`, já existente) em vez de aparentar "concluída" sem
  // nenhum trabalho ter sido feito — não altera o gate, só a exibição.
  function etapaTemCriterios(key) {
    return (CRITERIOS_ETAPA[key] || []).length > 0;
  }

  // Fase 4A — Parte 2: quais accordions da Etapa 6 contêm algum critério
  // ainda não satisfeito — usado só para abrir automaticamente o(s)
  // grupo(s) certo(s) quando o usuário tenta avançar/salvar estando
  // bloqueado (ver wireEvents/btn-salvar-convencao). Critérios sem `grupo`
  // (nenhum hoje fora de "condicionais") são ignorados aqui.
  function gruposComPendencia(key) {
    const grupos = new Set();
    (CRITERIOS_ETAPA[key] || []).forEach((c) => {
      if (c.grupo && !c.ok(form)) grupos.add(c.grupo);
    });
    return grupos;
  }

  // Fase 3 — gate real. "Próxima etapa" só depende da etapa ATUAL estar
  // concluída (navegação livre pelo stepper continua sem essa checagem —
  // o bloqueio é só da ação de avançar, não do acesso). "Salvar Convenção"
  // exige a soma de todas as 6 etapas — a partir da Fase 4B, a Descrição já
  // está embutida no critério da Etapa 1 (ver CRITERIOS_ETAPA.geral, acima),
  // então não há mais nenhuma condição separada para ela aqui.
  function podeAvancarEtapa(key) {
    return etapaConcluida(key);
  }
  function podeSalvarConvencao() {
    return TABS.every((t) => etapaConcluida(t.key));
  }

  // Fase 1+2+3 da "Decisão de fluxo — Progressão por etapas" (docs/06-
  // sindicato-convencao-spec.md): navegação por stepper + faixa de Voltar/
  // Próxima etapa/Salvar Convenção (Fase 1); estado de conclusão calculado
  // por etapa exibido via .is-done (Fase 2); gate real de "Próxima etapa" e
  // "Salvar Convenção", com comunicação de bloqueio (Fase 3). O acesso a
  // qualquer etapa pelo stepper permanece livre — só a ação de avançar/
  // salvar é bloqueada.
  function render() {
    const indiceEtapaAtual = TABS.findIndex((t) => t.key === state.tab);
    const etapaAtual = TABS[indiceEtapaAtual];

    // Em modo de visualização, o cabeçalho mantém só "Editar" (mesmo
    // comportamento de hoje). Em modo de criação/edição, Cancelar/Próxima
    // etapa/Salvar Convenção passam a viver na faixa de navegação abaixo do
    // conteúdo da etapa (ver rodapeEtapaHtml) — o cabeçalho não repete ações.
    const acoesHtml = mode === "view" ? '<button type="button" class="btn btn-outline btn-sm" id="btn-editar">Editar</button>' : "";

    // O título permanece estático (mesmo comportamento da Tela do Sindicato:
    // o h2 não se torna um input) — a edição do nome acontece num campo com
    // rótulo próprio abaixo, não num input gigante disfarçado de título
    // (evita truncar o texto e mantém a mesma linguagem de formulário usada
    // em todo o resto do protótipo).
    const tituloTexto = form.descricao || '<span class="text-muted">Nova convenção</span>';
    // Único campo que identifica a convenção fora da própria tela (título,
    // breadcrumb e a tabela "Convenções deste sindicato") — por isso ganhou
    // destaque próprio (caixa com borda/fundo, label maior, texto de apoio),
    // em vez do tratamento igual a qualquer outro campo comum da tela, que
    // fazia com que passasse despercebido entre o cabeçalho e o stepper. O
    // asterisco já usado no label (abaixo) reflete a mesma indicação visual
    // de obrigatoriedade dos demais campos da Convenção — desde a Fase 4B, a
    // Descrição é parte do critério de conclusão da Etapa 1, não mais um
    // requisito isolado do sistema de etapas (ver CRITERIOS_ETAPA.geral).
    const campoDescricaoHtml =
      mode === "view"
        ? ""
        : '<div class="flex flex-col gap-1-5" style="max-width:560px;margin-top:6px;padding:14px 16px;border:1px solid var(--border);border-radius:var(--radius-lg);background:var(--muted);">' +
          '<label for="input-descricao" class="text-sm font-semibold">Descrição da convenção <span class="text-muted">*</span></label>' +
          '<input class="field-input" id="input-descricao" style="height:40px;font-size:14px;background:var(--card);" value="' + form.descricao.replace(/"/g, "&quot;") + '" placeholder="Ex.: Convenção Coletiva 2026 — Comerciários de Goiânia" />' +
          '<span class="text-xs text-muted">Esse nome identifica a convenção em toda a experiência, inclusive na lista de convenções deste sindicato. Só é salvo ao concluir "Salvar Convenção", na Etapa 6.</span>' +
          "</div>";

    // Stepper reaproveitado de prototype/empresas/js/importar.js (mesmo
    // componente .stepper/.stepper-step/.stepper-step-circle/.stepper-
    // connector, sem alteração de CSS). Cada step corresponde a uma das 6
    // áreas já existentes; o clique continua reaproveitando o mesmo
    // mecanismo de troca de aba de hoje (atributo data-tab). `.is-done`
    // (Fase 2) é só exibição — não afeta se o step pode ser clicado.
    //
    // Fase 4A: `.is-done` só aparece quando a etapa TEM critério e ele está
    // satisfeito — etapas sem critério definido (3 e 5, hoje) permanecem no
    // estado padrão do `.stepper-step` (círculo numerado neutro, já
    // existente), em vez de aparentar "concluída" sem nenhum critério
    // verificado. O gate (podeAvancarEtapa/podeSalvarConvencao) continua
    // usando `etapaConcluida` sem essa distinção — nada mudou no bloqueio.
    const concluidasVisual = TABS.map((t) => etapaTemCriterios(t.key) && etapaConcluida(t.key));
    const stepperHtml =
      '<div class="stepper">' +
      TABS.map((t, i) => {
        const ativo = i === indiceEtapaAtual;
        const concluida = concluidasVisual[i];
        return (
          (i > 0 ? '<div class="stepper-connector' + (concluidasVisual[i - 1] ? " is-done" : "") + '"></div>' : "") +
          '<div class="stepper-step' + (ativo ? " is-active" : "") + (concluida ? " is-done" : "") + '" data-tab="' + t.key + '" style="cursor:pointer;">' +
          '<div class="stepper-step-circle">' + (concluida ? Icon("check", "size-3-5") : i + 1) + "</div>" +
          '<div class="stepper-step-label">' + t.shortLabel + "</div>" +
          "</div>"
        );
      }).join("") +
      "</div>";

    // Título completo da etapa atual, acima do conteúdo — garante que o
    // nome completo (ex.: "Data-base, Prazos e Regras Gerais") continue
    // sempre visível em algum lugar, já que o stepper usa só o rótulo curto.
    const etapaHeadingHtml =
      '<div class="flex flex-col gap-0-5" style="margin-top:4px;">' +
      '<span class="text-xs text-muted">Etapa ' + (indiceEtapaAtual + 1) + " de " + TABS.length + "</span>" +
      '<h3 class="text-base font-semibold">' + etapaAtual.label + "</h3>" +
      "</div>";

    // Faixa única de navegação, fora dos Cards/Accordions internos de cada
    // etapa — mesma faixa para as 6 áreas, independente de cada uma usar
    // .card (com ou sem header) ou .accordion (Aba 6). Só aparece em modo de
    // criação/edição; em visualização, o stepper serve só para consulta.
    const ehPrimeiraEtapa = indiceEtapaAtual === 0;
    const ehUltimaEtapa = indiceEtapaAtual === TABS.length - 1;
    // Fase 2: "Cancelar" disponível em todas as etapas — "Voltar" continua
    // exclusivo das Etapas 2-6, ao lado de "Cancelar". Comportamento do
    // Cancelar inalterado.
    //
    // Fase 3: gate real. Etapas 3 e 5 nunca bloqueiam "Próxima etapa" porque
    // `CRITERIOS_ETAPA` está vazio para elas (concluídas por ausência de
    // pendência, não por uma regra inventada — ver nota acima). A mensagem
    // de bloqueio é uma única linha discreta, reaproveitando o mesmo
    // tratamento (`text-xs text-muted`) já usado no campo de Descrição —
    // aparece só quando há pendência real e some assim que ela é resolvida.
    const podeAvancar = podeAvancarEtapa(state.tab);
    const podeSalvar = podeSalvarConvencao();
    const acaoBloqueada = ehUltimaEtapa ? !podeSalvar : !podeAvancar;
    const mensagemBloqueioHtml = acaoBloqueada
      ? '<span class="text-xs text-muted">' +
        (ehUltimaEtapa ? "Preencha os campos obrigatórios pendentes em alguma das etapas para concluir." : "Preencha os campos obrigatórios desta etapa para continuar.") +
        "</span>"
      : "";
    const rodapeEtapaHtml =
      mode === "view"
        ? ""
        : '<div class="flex flex-col gap-1-5 convencao-etapa-footer" style="margin-top:4px;padding-top:16px;border-top:1px solid var(--border);">' +
          mensagemBloqueioHtml +
          '<div class="flex items-center justify-between gap-3">' +
          '<div class="flex gap-2">' +
          '<button type="button" class="btn btn-outline btn-sm" id="btn-cancelar">Cancelar</button>' +
          (ehPrimeiraEtapa ? "" : '<button type="button" class="btn btn-outline btn-sm" id="btn-etapa-voltar">Voltar</button>') +
          "</div>" +
          // "Salvar Convenção" (Etapa 6) NÃO usa o atributo `disabled` nativo
          // como as demais etapas — precisa continuar recebendo cliques
          // mesmo bloqueado, para poder abrir automaticamente o(s)
          // accordion(s) com pendência (Fase 4A, Parte 2). A aparência de
          // desabilitado é replicada via estilo inline com os mesmos valores
          // de `.btn:disabled` (components.css) — sem CSS novo.
          // Refinamento pontual — item 2 (tooltip em ações bloqueadas):
          // reaproveita o único padrão de tooltip já usado no protótipo,
          // o atributo nativo `title` (ver truncatedCell/ref-tag em
          // ui.js e convencao-detail.js) — sem componente novo. Some
          // assim que a ação deixa de estar bloqueada; não substitui a
          // mensagem já exibida na faixa de navegação (mensagemBloqueioHtml).
          // "Próxima etapa" usa `disabled` nativo, que em navegadores
          // baseados em Chromium suprime os eventos de mouse do próprio
          // botão (o hover não dispara e o `title` nele não aparece) — por
          // isso o `title` fica num `<span>` envolvendo o botão só quando
          // bloqueado, em vez de no botão em si.
          (ehUltimaEtapa
            ? '<button type="button" class="btn btn-sm" id="btn-salvar-convencao"' +
              (podeSalvar ? "" : ' style="cursor:not-allowed;opacity:0.55;" title="Conclua os campos obrigatórios das etapas pendentes para salvar."') +
              ">Salvar Convenção</button>"
            : podeAvancar
            ? '<button type="button" class="btn btn-sm" id="btn-proxima-etapa">Próxima etapa</button>'
            : '<span title="Preencha os campos obrigatórios desta etapa para continuar."><button type="button" class="btn btn-sm" id="btn-proxima-etapa" disabled>Próxima etapa</button></span>') +
          "</div>" +
          "</div>";

    document.getElementById("convencao-root").innerHTML =
      '<div class="flex flex-col gap-3">' +
      '<a href="sindicato.html?sindicato=' + encodeURIComponent(sindicatoVinculado.codigo) + '" class="flex items-center gap-1 text-sm font-medium link-info w-fit">' + Icon("chevron-left", "size-3-5") + " voltar para o sindicato</a>" +
      '<div class="flex items-center justify-between gap-3 flex-wrap" style="min-height:32px;">' +
      '<div class="flex flex-col gap-1">' +
      '<h2 class="text-lg font-semibold">' + tituloTexto + "</h2>" +
      // Nome do sindicato aparece aqui só como contexto (texto, não link): o
      // breadcrumb já leva de volta a ele, e o link "voltar para o sindicato"
      // acima já é o mecanismo de retorno — repetir como link criaria um
      // terceiro caminho para o mesmo destino.
      '<span class="text-xs text-muted">Sindicato: ' + sindicatoVinculado.nome + (form.codigo ? " · Código " + form.codigo : "") + "</span>" +
      "</div>" + acoesHtml + "</div>" +
      campoDescricaoHtml +
      "</div>" +
      '<div class="convencao-stepper-sticky">' + stepperHtml + "</div>" +
      etapaHeadingHtml +
      '<div id="tab-panel" class="flex flex-col gap-3">' + etapaAtual.render() + "</div>" +
      rodapeEtapaHtml;

    wireEvents();
  }

  function wireEvents() {
    document.querySelectorAll("[data-tab]").forEach((el) => el.addEventListener("click", () => { state.tab = el.getAttribute("data-tab"); render(); }));

    const btnEditar = document.getElementById("btn-editar");
    if (btnEditar) btnEditar.addEventListener("click", () => { mode = "edit"; render(); });

    const btnCancelar = document.getElementById("btn-cancelar");
    if (btnCancelar) {
      btnCancelar.addEventListener("click", () => {
        // Refinamento pontual — item 4: só uma NOVA Convenção passa pelo
        // Dialog de confirmação (risco de perda de preenchimento). Edição de
        // Convenção existente mantém o comportamento de hoje — descarta as
        // alterações em memória e volta para "view" sem sair da tela,
        // porque nada foi perdido de fato (o registro já está salvo).
        if (isNovo) { UI.openDialog(document.getElementById("cancelar-convencao-overlay")); return; }
        form = JSON.parse(JSON.stringify(convencaoExistente));
        mode = "view";
        render();
      });
    }

    // Fase 1: "Próxima etapa"/"Voltar" só trocam state.tab para o vizinho
    // correspondente (sem checar obrigatoriedade — isso fica para uma fase
    // posterior). "Salvar Convenção" (só existe na última etapa) reaproveita
    // a mesma função salvar() já usada pelo antigo "Gravar".
    const btnEtapaVoltar = document.getElementById("btn-etapa-voltar");
    if (btnEtapaVoltar) {
      btnEtapaVoltar.addEventListener("click", () => {
        const idx = TABS.findIndex((t) => t.key === state.tab);
        if (idx > 0) state.tab = TABS[idx - 1].key;
        render();
      });
    }
    const btnProximaEtapa = document.getElementById("btn-proxima-etapa");
    if (btnProximaEtapa) {
      btnProximaEtapa.addEventListener("click", () => {
        const idx = TABS.findIndex((t) => t.key === state.tab);
        if (idx < TABS.length - 1) state.tab = TABS[idx + 1].key;
        render();
      });
    }
    // Fase 4A, Parte 2: como o botão não é mais `disabled` nativamente
    // (ver render()), o guard de bloqueio passa a viver aqui. Se estiver
    // bloqueado, não salva e não navega — só abre o(s) accordion(s) que
    // contêm a pendência (se houver), mantendo o usuário na Etapa 6 com
    // todos os dados já preenchidos preservados.
    const btnSalvarConvencao = document.getElementById("btn-salvar-convencao");
    if (btnSalvarConvencao) {
      btnSalvarConvencao.addEventListener("click", () => {
        if (podeSalvarConvencao()) {
          salvar();
          return;
        }
        gruposComPendencia("condicionais").forEach((grupo) => { state.accordionOpen[grupo] = true; });
        render();
      });
    }

    // Fase 4B: a Descrição agora integra o critério de conclusão da Etapa 1
    // (CRITERIOS_ETAPA.geral), então precisa recalcular `.is-done`/o gate de
    // "Próxima etapa" assim que o valor muda — mesmo evento ("change", no
    // blur) já usado por todos os outros campos do formulário (`data-path`,
    // logo abaixo), em vez do "input" sem re-render usado até aqui (que
    // deixaria o botão com o estado desatualizado até alguma outra interação
    // disparar um render()).
    const inputDescricao = document.getElementById("input-descricao");
    if (inputDescricao) {
      inputDescricao.addEventListener("change", () => { form.descricao = inputDescricao.value; render(); });
    }

    document.querySelectorAll("input[data-path], textarea[data-path], select[data-path]").forEach((el) => {
      const evt = el.tagName === "SELECT" ? "change" : "change";
      el.addEventListener(evt, () => { setPath(form, el.getAttribute("data-path"), el.value); render(); });
    });
    document.querySelectorAll(".ucheckbox[data-path]").forEach((el) => {
      el.addEventListener("click", (e) => { e.preventDefault(); const p = el.getAttribute("data-path"); setPath(form, p, !getPath(form, p)); render(); });
    });
    document.querySelectorAll("[data-accordion-toggle]").forEach((btn) => {
      btn.addEventListener("click", () => { const k = btn.getAttribute("data-accordion-toggle"); state.accordionOpen[k] = !state.accordionOpen[k]; render(); });
    });

    // Empresas Vinculadas
    document.querySelectorAll("[data-empresa-check]").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        const codigo = el.getAttribute("data-empresa-check");
        const idx = form.empresasVinculadas.indexOf(codigo);
        if (idx === -1) form.empresasVinculadas.push(codigo);
        else form.empresasVinculadas.splice(idx, 1);
        render();
      });
    });
    const btnTodas = document.getElementById("btn-emp-todas");
    if (btnTodas) btnTodas.addEventListener("click", () => { form.empresasVinculadas = E.EMPRESAS.map((e) => e.codigo); render(); });
    const btnNenhuma = document.getElementById("btn-emp-nenhuma");
    if (btnNenhuma) btnNenhuma.addEventListener("click", () => { form.empresasVinculadas = []; render(); });
    const btnInverter = document.getElementById("btn-emp-inverter");
    if (btnInverter) btnInverter.addEventListener("click", () => {
      const todas = E.EMPRESAS.map((e) => e.codigo);
      form.empresasVinculadas = todas.filter((c) => !form.empresasVinculadas.includes(c));
      render();
    });

    // Grade de configuração de Contribuição Assistencial (inline)
    const btnAddGradeContrib = document.getElementById("btn-add-grade-contrib");
    if (btnAddGradeContrib) btnAddGradeContrib.addEventListener("click", () => { form.contribuicoes.gradeConfiguracaoContribAssistencial.push({ faixa: "", percentual: "", valorFixo: "" }); render(); });
    document.querySelectorAll("[data-grade-contrib]").forEach((el) => {
      el.addEventListener("change", () => {
        const i = Number(el.getAttribute("data-grade-contrib"));
        form.contribuicoes.gradeConfiguracaoContribAssistencial[i][el.getAttribute("data-campo")] = el.value;
      });
    });
    document.querySelectorAll("[data-remove-grade-contrib]").forEach((el) => {
      el.addEventListener("click", () => { form.contribuicoes.gradeConfiguracaoContribAssistencial.splice(Number(el.getAttribute("data-remove-grade-contrib")), 1); render(); });
    });

    // Grade de Adicional por Tempo de Serviço (inline)
    const btnAddGradeTempo = document.getElementById("btn-add-grade-tempo-servico");
    if (btnAddGradeTempo) btnAddGradeTempo.addEventListener("click", () => { form.condicionais.calculos.adicionalTempoServico.grade.push({ periodicidade: "", percentual: "", base: "" }); render(); });
    document.querySelectorAll("[data-grade-tempo-servico]").forEach((el) => {
      el.addEventListener("change", () => {
        const i = Number(el.getAttribute("data-grade-tempo-servico"));
        form.condicionais.calculos.adicionalTempoServico.grade[i][el.getAttribute("data-campo")] = el.value;
      });
    });
    document.querySelectorAll("[data-remove-grade-tempo-servico]").forEach((el) => {
      el.addEventListener("click", () => { form.condicionais.calculos.adicionalTempoServico.grade.splice(Number(el.getAttribute("data-remove-grade-tempo-servico")), 1); render(); });
    });

    // Piso Salarial
    const btnAddPiso = document.getElementById("btn-add-piso");
    if (btnAddPiso) btnAddPiso.addEventListener("click", () => abrirPiso(null));
    document.querySelectorAll("[data-editar-piso]").forEach((el) => el.addEventListener("click", () => abrirPiso(el.getAttribute("data-editar-piso"))));
    document.querySelectorAll("[data-remover-piso]").forEach((el) => el.addEventListener("click", () => confirmarRemoverPiso(el.getAttribute("data-remover-piso"))));

    // Histórico
    const btnAddHist = document.getElementById("btn-add-historico");
    if (btnAddHist) btnAddHist.addEventListener("click", () => abrirHistorico(null));
    document.querySelectorAll("[data-editar-historico]").forEach((el) => el.addEventListener("click", () => abrirHistorico(el.getAttribute("data-editar-historico"))));
    document.querySelectorAll("[data-remover-historico]").forEach((el) => el.addEventListener("click", () => confirmarRemoverHistorico(el.getAttribute("data-remover-historico"))));
  }

  function salvar() {
    const lista = D.getConvencoes();
    if (isNovo) {
      form.codigo = D.proximoCodigo(lista, "CONV");
      D.setConvencoes(lista.concat([form]));
      window.location.href = "convencao.html?convencao=" + encodeURIComponent(form.codigo) + "&sindicato=" + encodeURIComponent(sindicatoVinculado.codigo) + "&criado=1";
      return;
    }
    const atualizados = lista.map((c) => (c.codigo === form.codigo ? JSON.parse(JSON.stringify(form)) : c));
    D.setConvencoes(atualizados);
    Object.assign(convencaoExistente, JSON.parse(JSON.stringify(form)));
    mode = "view";
    render();
    UI.showToast("Convenção salva", form.descricao + " foi atualizada com sucesso.");
  }

  // ===== Sheet: Piso Salarial =====
  let pisoEditandoCodigo = null;
  function abrirPiso(codigo) {
    pisoEditandoCodigo = codigo;
    const piso = codigo ? form.pisoSalarial.find((p) => p.codigo === codigo) : null;
    document.getElementById("piso-title").textContent = piso ? "Editar piso salarial" : "Adicionar piso salarial";
    document.getElementById("piso-descricao").value = piso ? piso.descricao : "";
    document.getElementById("piso-valor").value = piso ? piso.valor : "";
    atualizarBotaoPiso();
    UI.openSheet(document.getElementById("piso-overlay"), document.getElementById("piso-panel"));
  }
  function atualizarBotaoPiso() {
    const ok = document.getElementById("piso-descricao").value.trim() && document.getElementById("piso-valor").value.trim();
    document.getElementById("piso-salvar").disabled = !ok;
  }
  function fecharPiso() { UI.closeSheet(document.getElementById("piso-overlay"), document.getElementById("piso-panel")); }
  function salvarPiso() {
    const descricao = document.getElementById("piso-descricao").value.trim();
    const valor = document.getElementById("piso-valor").value.trim();
    if (!descricao || !valor) return;
    if (pisoEditandoCodigo) {
      form.pisoSalarial = form.pisoSalarial.map((p) => (p.codigo === pisoEditandoCodigo ? { codigo: p.codigo, descricao, valor } : p));
    } else {
      form.pisoSalarial.push({ codigo: D.proximoCodigo(form.pisoSalarial, "PISO"), descricao, valor });
    }
    fecharPiso();
    render();
  }
  let pisoRemovendoCodigo = null;
  function confirmarRemoverPiso(codigo) {
    pisoRemovendoCodigo = codigo;
    const piso = form.pisoSalarial.find((p) => p.codigo === codigo);
    document.getElementById("piso-delete-description").textContent = 'O piso "' + piso.descricao + '" será removido desta convenção.';
    UI.openDialog(document.getElementById("piso-delete-overlay"));
  }
  function removerPiso() {
    form.pisoSalarial = form.pisoSalarial.filter((p) => p.codigo !== pisoRemovendoCodigo);
    UI.closeDialog(document.getElementById("piso-delete-overlay"));
    render();
  }

  // ===== Sheet: Histórico de Alteração Salarial =====
  let histPicker = null;
  let histDataAtual = "";
  let histEditandoChave = null;
  function chaveHistorico(h) { return h.data + "|" + h.descricao.replace(/"/g, ""); }
  function abrirHistorico(chave) {
    histEditandoChave = chave;
    const h = chave ? form.historico.find((x) => chaveHistorico(x) === chave) : null;
    document.getElementById("hist-title").textContent = h ? "Editar registro do histórico" : "Registrar alteração salarial";
    document.getElementById("hist-descricao").value = h ? h.descricao : "";
    document.getElementById("hist-tipo").value = h ? h.tipo : "";
    document.getElementById("hist-processo").value = h ? h.numeroProcesso || "" : "";
    document.getElementById("hist-percentual").value = h ? h.percentualCCT || "" : "";
    histDataAtual = h ? h.data : "";
    histPicker.setValue(histDataAtual);
    atualizarCampoProcesso();
    atualizarBotaoHistorico();
    UI.openSheet(document.getElementById("hist-overlay"), document.getElementById("hist-panel"));
  }
  function atualizarCampoProcesso() {
    const tipo = document.getElementById("hist-tipo").value;
    document.getElementById("hist-processo-field").style.display = tipo && tipo !== "Convenção Coletiva" ? "" : "none";
  }
  function atualizarBotaoHistorico() {
    const ok = histDataAtual && document.getElementById("hist-descricao").value.trim() && document.getElementById("hist-tipo").value;
    document.getElementById("hist-salvar").disabled = !ok;
  }
  function fecharHistorico() { UI.closeSheet(document.getElementById("hist-overlay"), document.getElementById("hist-panel")); }
  function salvarHistorico() {
    const descricao = document.getElementById("hist-descricao").value.trim();
    const tipo = document.getElementById("hist-tipo").value;
    if (!histDataAtual || !descricao || !tipo) return;
    const registro = { data: histDataAtual, descricao, tipo, numeroProcesso: document.getElementById("hist-processo").value.trim(), percentualCCT: document.getElementById("hist-percentual").value.trim() };
    if (histEditandoChave) {
      form.historico = form.historico.map((h) => (chaveHistorico(h) === histEditandoChave ? registro : h));
    } else {
      form.historico.push(registro);
    }
    fecharHistorico();
    render();
  }
  let histRemovendoChave = null;
  function confirmarRemoverHistorico(chave) {
    histRemovendoChave = chave;
    const h = form.historico.find((x) => chaveHistorico(x) === chave);
    document.getElementById("hist-delete-description").textContent = 'O registro "' + h.descricao + '" (' + h.data + ") será removido do histórico.";
    UI.openDialog(document.getElementById("hist-delete-overlay"));
  }
  function removerHistorico() {
    form.historico = form.historico.filter((h) => chaveHistorico(h) !== histRemovendoChave);
    UI.closeDialog(document.getElementById("hist-delete-overlay"));
    render();
  }

  Shell.mount(document.getElementById("shell-root"), {
    base: "../",
    active: "sindicato",
    crumbs: isNovo
      ? [{ label: "sindicatos", href: "index.html" }, { label: sindicatoVinculado.nome, href: "sindicato.html?sindicato=" + encodeURIComponent(sindicatoVinculado.codigo) }, { label: "nova convenção" }]
      : [{ label: "sindicatos", href: "index.html" }, { label: sindicatoVinculado.nome, href: "sindicato.html?sindicato=" + encodeURIComponent(sindicatoVinculado.codigo) }, { label: form.descricao }],
  });

  ensureToast();

  document.getElementById("piso-close").innerHTML = Icon("x", "size-4");
  document.getElementById("piso-delete-close").innerHTML = Icon("x", "size-4");
  document.getElementById("hist-close").innerHTML = Icon("x", "size-4");
  document.getElementById("hist-delete-close").innerHTML = Icon("x", "size-4");
  document.getElementById("cancelar-convencao-close").innerHTML = Icon("x", "size-4");
  document.querySelector("#hist-data-picker .date-picker-icon").innerHTML = Icon("calendar", "size-4");
  document.querySelectorAll('#hist-data-picker .date-picker-nav-btn[data-nav="prev"]').forEach((el) => (el.innerHTML = Icon("chevron-left", "size-4")));
  document.querySelectorAll('#hist-data-picker .date-picker-nav-btn[data-nav="next"]').forEach((el) => (el.innerHTML = Icon("chevron-right", "size-4")));
  document.getElementById("hist-tipo").innerHTML = '<option value="">Selecione...</option>' + D.TIPO_HISTORICO_OPCOES.map((t) => '<option value="' + t + '">' + t + "</option>").join("");

  document.getElementById("piso-overlay").addEventListener("click", fecharPiso);
  document.getElementById("piso-close").addEventListener("click", fecharPiso);
  document.getElementById("piso-cancelar").addEventListener("click", fecharPiso);
  document.getElementById("piso-salvar").addEventListener("click", salvarPiso);
  document.getElementById("piso-descricao").addEventListener("input", atualizarBotaoPiso);
  document.getElementById("piso-valor").addEventListener("input", atualizarBotaoPiso);
  document.getElementById("piso-delete-close").addEventListener("click", () => UI.closeDialog(document.getElementById("piso-delete-overlay")));
  document.getElementById("piso-delete-cancel").addEventListener("click", () => UI.closeDialog(document.getElementById("piso-delete-overlay")));
  document.getElementById("piso-delete-confirm").addEventListener("click", removerPiso);

  document.getElementById("hist-overlay").addEventListener("click", fecharHistorico);
  document.getElementById("hist-close").addEventListener("click", fecharHistorico);
  document.getElementById("hist-cancelar").addEventListener("click", fecharHistorico);
  document.getElementById("hist-salvar").addEventListener("click", salvarHistorico);
  document.getElementById("hist-descricao").addEventListener("input", atualizarBotaoHistorico);
  document.getElementById("hist-tipo").addEventListener("change", () => { atualizarCampoProcesso(); atualizarBotaoHistorico(); });
  document.getElementById("hist-delete-close").addEventListener("click", () => UI.closeDialog(document.getElementById("hist-delete-overlay")));
  document.getElementById("hist-delete-cancel").addEventListener("click", () => UI.closeDialog(document.getElementById("hist-delete-overlay")));
  document.getElementById("hist-delete-confirm").addEventListener("click", removerHistorico);
  histPicker = UI.initDatePicker(document.getElementById("hist-data-picker"), (valor) => { histDataAtual = valor || ""; atualizarBotaoHistorico(); });

  // Refinamento pontual — item 4: "Continuar editando" e o "x"/overlay só
  // fecham o Dialog (nenhum dado é alterado, etapa atual é preservada — não
  // há nenhum re-render aqui). "Cancelar cadastro" reproduz exatamente o
  // comportamento que existia antes desta tarefa para uma nova Convenção:
  // navega para a tela do Sindicato sem persistir nada (a nova Convenção só
  // existia em memória, em `form`; nunca foi gravada em `D`/localStorage).
  document.getElementById("cancelar-convencao-close").addEventListener("click", () => UI.closeDialog(document.getElementById("cancelar-convencao-overlay")));
  document.getElementById("cancelar-convencao-continuar").addEventListener("click", () => UI.closeDialog(document.getElementById("cancelar-convencao-overlay")));
  document.getElementById("cancelar-convencao-confirmar").addEventListener("click", () => {
    window.location.href = "sindicato.html?sindicato=" + encodeURIComponent(sindicatoVinculado.codigo);
  });

  render();

  if (D.getQueryParam("criado")) UI.showToast("Convenção criada", form.descricao + " foi cadastrada com sucesso.");
})();
