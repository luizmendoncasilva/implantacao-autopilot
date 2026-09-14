/*
  Tela de detalhe do Cadastro de Rubricas — Fase 1 (Fundação).

  Segue o precedente de prototype/sindicatos/js/convencao-detail.js: registro
  único (não um formulário por área independente como em Folha de Pagamento),
  então "Editar"/"Gravar"/"Cancelar" agem sobre TODO o registro de uma vez,
  com um único snapshot — não um snapshot por aba. As 5 abas da especificação
  são só seções de exibição do mesmo `form`; trocar de aba não muda `mode`.

  Nesta fase só a Aba Geral tem conteúdo funcional. As demais (Configurações,
  Soma na Base de Cálculo, Rescisão, e-Social) ficam com um placeholder "Em
  construção" — mesmo padrão/marcação já usado em Folha de Pagamento
  (renderPlaceholderArea(), prototype/folha-pagamento/js/folha-page.js) para
  áreas reservadas na navegação antes de sua fase de implementação.

  Escopo desta fase (ver relatório da tarefa): os botões "Fórmulas...",
  "eSocial", "Enviar eSocial", "Replicar" e "Conteúdo" da especificação
  (seção 10) dependem de infraestrutura que não existe no protótipo (editor
  de fórmulas, integração eSocial, replicação entre empresas) e por isso não
  foram adicionados nem como placeholders — evita UI morta sem função
  nenhuma nesta etapa. Ficam para quando a fase correspondente justificar
  sua existência. "Listagem >>" já existe como link "voltar para a lista" no
  topo (mesmo padrão de Sindicato/Convenção); "Histórico" ganhou um Sheet
  próprio, mas sem gravação real de eventos (ver ensureHistoricoSheet()).
*/
(function () {
  const D = window.RubricasData;
  const O = D.O;

  const codigoParam = D.getQueryParam("rubrica");
  const rubricaExistente = codigoParam ? D.findRubricaByCodigo(codigoParam) : null;

  if (codigoParam && !rubricaExistente) {
    window.location.replace("index.html");
    return;
  }

  const isNovo = !rubricaExistente;

  const TABS = [
    { key: "geral", label: "Geral" },
    { key: "configuracoes", label: "Configurações" },
    { key: "soma-base-calculo", label: "Soma na Base de Cálculo" },
    { key: "rescisao", label: "Rescisão" },
    { key: "esocial", label: "e-Social" },
  ];

  let form = isNovo ? D.blankRubrica() : JSON.parse(JSON.stringify(rubricaExistente));
  // accordionOpen fica fora do snapshot de edição — é estado de navegação da
  // tela, não dado do formulário (mesmo critério já usado em Folha de
  // Pagamento e em Convenção Coletiva: abrir/fechar um grupo não é uma
  // alteração que "Cancelar" deva desfazer).
  const state = {
    mode: isNovo ? "edit" : "view",
    activeTab: "geral",
    snapshot: null,
    accordionOpen: { adicional: false, medias: false, relatorios: false, lancamentosFixos: false, opcoes: false },
    // Fase 4 — Vigência: refletem a seleção feita no VigenciaSelector do
    // cabeçalho (ver render()/wireVigenciaOnChange()). `vigenciaAtual` só é
    // false quando o usuário está navegando um período histórico pelo painel
    // "Ver histórico" do próprio componente — nunca durante edição (Editar
    // fica indisponível nesse caso, ver headerHtml()).
    vigenciaAtual: true,
    vigenciaSelecionada: null,
  };

  // ===== Snapshot de Cancelar — mesmo conceito da correção transversal de
  // Folha de Pagamento (docs/folha-pagamento-correcao-transversal-cancelar-snapshot.md):
  // o snapshot é criado só ao entrar em edição, nunca a cada alteração, e
  // descartado assim que a edição é confirmada ou cancelada. =====
  function deepClone(obj) {
    return obj == null ? obj : JSON.parse(JSON.stringify(obj));
  }
  function iniciarEdicao() {
    state.snapshot = deepClone(form);
    state.mode = "edit";
  }
  function cancelarEdicao() {
    if (state.snapshot) form = state.snapshot;
    state.snapshot = null;
    state.mode = "view";
  }
  function confirmarSalvamento() {
    state.snapshot = null;
    state.mode = "view";
  }

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

  // ===== Helpers de campo (view + edit) — mesmo padrão de
  // prototype/sindicatos/js/convencao-detail.js =====
  function vazio() {
    return '<span class="italic text-muted">—</span>';
  }
  function campoView(label, valueHtml, wide) {
    return '<div class="detail-field' + (wide ? " detail-field-wide" : "") + '"><span class="detail-field-label">' + label + '</span><div class="detail-field-value">' + valueHtml + "</div></div>";
  }
  // hint = nota curta exibida abaixo do controle em modo edição — usada nos
  // campos condicionais "Base de cálculo"/"Taxa" para explicar por que estão
  // desabilitados no momento (ver tabGeral()).
  function campoEdit(label, inputHtml, wide, obrigatorio, hint) {
    return (
      '<div class="detail-field' + (wide ? " detail-field-wide" : "") + '"><span class="detail-field-label">' + label + (obrigatorio ? ' <span class="text-muted">*</span>' : "") + "</span>" +
      inputHtml +
      (hint ? '<span class="text-xs text-muted">' + hint + "</span>" : "") +
      "</div>"
    );
  }
  function optLabel(options, value) {
    const found = options.find((o) => o.value === value);
    return found ? found.label : value;
  }
  function textField(label, path, opts) {
    opts = opts || {};
    const value = getPath(form, path);
    if (state.mode === "view") {
      if (opts.naoAplicavel) return campoView(label, '<span class="detail-field-not-applicable">Não aplicável</span>', opts.wide);
      return campoView(label, value ? value : vazio(), opts.wide);
    }
    return campoEdit(
      label,
      '<input class="field-input" data-path="' + path + '" value="' + (value || "").toString().replace(/"/g, "&quot;") + '" placeholder="' + (opts.placeholder || "") + '"' + (opts.naoAplicavel ? " disabled" : "") + " />",
      opts.wide,
      opts.obrigatorio && !opts.naoAplicavel,
      opts.hint
    );
  }
  function selectField(label, path, options, opts) {
    opts = opts || {};
    const value = getPath(form, path);
    if (state.mode === "view") {
      if (opts.naoAplicavel) return campoView(label, '<span class="detail-field-not-applicable">Não aplicável</span>', opts.wide);
      return campoView(label, value ? optLabel(options, value) : vazio(), opts.wide);
    }
    const optsHtml = options.map((o) => '<option value="' + o.value + '"' + (value === o.value ? " selected" : "") + ">" + o.label + "</option>").join("");
    return campoEdit(
      label,
      '<div class="field-select-wrap"><select class="field-select" data-path="' +
        path +
        '"' +
        (opts.naoAplicavel ? " disabled" : "") +
        '><option value="">Selecione...</option>' +
        optsHtml +
        "</select><span class=\"chev\">" +
        Icon("chevron-down", "size-4") +
        "</span></div>",
      opts.wide,
      opts.obrigatorio && !opts.naoAplicavel,
      opts.hint
    );
  }
  // Campo de data (granularity "day" do Date Picker compartilhado —
  // shared/js/ui.js). Mesma estrutura de trigger/painel/grade já usada em
  // Sócios (prototype/empresas/socios.html), só reconstruída via template
  // string por viver dentro de um render() que já concatena tudo em string
  // (mesmo critério do monthField() de Folha de Pagamento).
  function dateField(label, path, opts) {
    opts = opts || {};
    const value = getPath(form, path);
    if (state.mode === "view") return campoView(label, value ? value : vazio(), opts.wide);
    return campoEdit(
      label,
      '<div class="date-picker" data-path="' + path + '">' +
        '<button type="button" class="date-picker-trigger' + (value ? "" : " is-empty") + '">' +
        '<span class="date-picker-icon">' + Icon("calendar", "size-4") + "</span>" +
        '<span class="date-picker-label">' + (value || "Selecione a data") + "</span>" +
        "</button>" +
        '<div class="date-picker-panel">' +
        '<div class="date-picker-header">' +
        '<button type="button" class="date-picker-nav-btn" data-nav="prev" aria-label="Mês anterior">' + Icon("chevron-left", "size-4") + "</button>" +
        '<span class="date-picker-caption"></span>' +
        '<button type="button" class="date-picker-nav-btn" data-nav="next" aria-label="Próximo mês">' + Icon("chevron-right", "size-4") + "</button>" +
        "</div>" +
        '<div class="date-picker-weekdays"><span>D</span><span>S</span><span>T</span><span>Q</span><span>Q</span><span>S</span><span>S</span></div>' +
        '<div class="date-picker-grid"></div>' +
        "</div></div>",
      opts.wide,
      opts.obrigatorio
    );
  }
  function secao(titulo, camposHtml) {
    return '<div class="detail-section"><h3 class="detail-section-title">' + titulo + '</h3><div class="detail-grid">' + camposHtml + "</div></div>";
  }
  // Checkbox (view + edit) — mesmo padrão/markup já usado em
  // prototype/folha-pagamento/js/folha-page.js e em convencao-detail.js
  // (ícone circle-check/circle-x em view, .ucheckbox em edit). opts.disabled
  // usa a mesma classe já existente `.ucheckbox.is-disabled`
  // (shared/css/components.css) — reaproveitada aqui pela primeira vez no
  // projeto, sem criar CSS novo — e opts.hint mostra por que o campo está
  // desabilitado no momento (mesmo critério de textField/selectField).
  function checkboxField(path, label, opts) {
    opts = opts || {};
    const checked = !!getPath(form, path);
    if (state.mode === "view") {
      if (opts.disabled) return '<div class="flex items-center gap-2 text-sm"><span class="text-muted">' + Icon("circle-x", "size-4") + "</span><span class=\"text-muted\">" + label + " <span class=\"detail-field-not-applicable\">(não aplicável)</span></span></div>";
      return (
        '<div class="flex items-center gap-2 text-sm">' +
        (checked ? '<span style="color:var(--success-text);display:flex;">' + Icon("circle-check", "size-4") + "</span>" : '<span class="text-muted">' + Icon("circle-x", "size-4") + "</span>") +
        "<span" + (checked ? "" : ' class="text-muted"') + ">" + label + "</span></div>"
      );
    }
    return (
      '<label class="ucheckbox' + (opts.disabled ? " is-disabled" : "") + '"' + (opts.disabled ? "" : ' data-path="' + path + '"') + ">" +
      '<span class="ucheckbox-box' + (checked ? " is-checked" : "") + '">' + Icon("check", "size-4") + "</span>" +
      '<span class="ucheckbox-label">' + label + (opts.hint ? '<span class="ucheckbox-hint">' + opts.hint + "</span>" : "") + "</span>" +
      "</label>"
    );
  }
  // Agrupa um campo-gatilho com o campo dependente que ele habilita — mesmo
  // componente/critério visual já usado em Folha de Pagamento e em
  // Convenção Coletiva (`.condrule`/`.condrule-dependent`). Usado pela Aba
  // Rescisão (Fase 3) — nunca aninhar um `.condrule` dentro de outro (ver
  // nota em tabRescisao(): o Campo 23 tem 2 níveis de dependência, mas o
  // segundo nível fica achatado dentro do mesmo `.condrule-dependent` do
  // primeiro, não em um `.condrule` próprio).
  function condRule(triggerHtml, dependentHtml) {
    const ativo = !!dependentHtml;
    return '<div class="condrule' + (ativo ? " is-active" : "") + '">' + triggerHtml + (dependentHtml ? '<div class="condrule-dependent">' + dependentHtml + "</div>" : "") + "</div>";
  }
  // Radio group (view + edit) — mesmo padrão `.uradio-group`/`.uradio`/
  // `.uradio-dot` já usado em Folha de Pagamento. Sem classe CSS nova para o
  // estado desabilitado: segue o mesmo critério já usado em checkboxField()
  // (remove `data-path`/`data-value`, então o clique não faz nada) e some
  // apenas com uma opacidade inline — evita registrar um `.uradio.is-disabled`
  // novo em components.css para um único consumidor até agora.
  function radioField(label, path, options, opts) {
    opts = opts || {};
    const value = getPath(form, path);
    if (state.mode === "view") {
      if (opts.naoAplicavel) return campoView(label, '<span class="detail-field-not-applicable">Não aplicável</span>', opts.wide);
      return campoView(label, value ? optLabel(options, value) : vazio(), opts.wide);
    }
    const itemsHtml = options
      .map(
        (o) =>
          '<label class="uradio"' +
          (opts.naoAplicavel ? "" : ' data-path="' + path + '" data-value="' + o.value + '"') +
          '><span class="uradio-dot' + (value === o.value ? " is-checked" : "") + '"></span><span class="uradio-label">' + o.label + "</span></label>"
      )
      .join("");
    return campoEdit(
      label,
      '<div class="uradio-group"' + (opts.naoAplicavel ? ' style="opacity:0.55;"' : "") + ">" + itemsHtml + "</div>",
      opts.wide,
      opts.obrigatorio && !opts.naoAplicavel,
      opts.hint
    );
  }
  // Combobox de referência a outra rubrica (view usa texto resolvido; edit
  // usa o Combobox compartilhado — shared/js/ui.js, UI.initCombobox() — já
  // usado em Folha de Pagamento para selecionar empresa e em Sócios para
  // selecionar sócio/entrada. Reaproveitado aqui tal como está, sem alterar
  // sua API, para os 3 pontos da especificação que referenciam outra
  // rubrica: Soma na Base de Cálculo (tabela dinâmica), "Rubrica" do
  // Homolognet e "Rubrica destino" do saldo de salário de rescisão.
  //
  // Correção de conformidade: "Rubricas Inativas não podem ser selecionadas
  // em novos lançamentos, mas permanecem disponíveis historicamente" (seção
  // 12 da especificação). `valorAtual` é o código já referenciado por este
  // campo específico (se houver) — mantido na lista mesmo se a rubrica
  // referenciada tiver ficado Inativa depois, para que uma referência já
  // existente continue aparecendo normalmente (código/nome resolvidos) e
  // não pareça "sumir" ou virar inválida. Só uma NOVA seleção fica restrita
  // a rubricas Ativas. Nenhuma rubrica é removida do cadastro nem alterada.
  function rubricasParaCombobox(excludeCodigo, valorAtual) {
    return D.getRubricas()
      .filter((r) => r.codigo !== excludeCodigo)
      .filter((r) => r.situacao === "Ativo" || (valorAtual && r.codigo === valorAtual))
      .sort((a, b) => a.codigo.localeCompare(b.codigo, "pt-BR", { numeric: true }))
      .map((r) => ({ value: r.codigo, label: r.codigo + " — " + r.nome, sublabel: optLabel(O.tipoRubrica, r.geral.tipoRubrica) }));
  }
  function comboboxHtml(id, placeholder) {
    return (
      '<div class="combobox" id="' + id + '" data-empty-text="Nenhuma rubrica encontrada.">' +
      '<button type="button" class="combobox-trigger"><span class="combobox-label truncate">' + placeholder + '</span><span class="chev">' + Icon("chevron-down", "size-4") + "</span></button>" +
      '<div class="combobox-panel"><div class="combobox-search"><span class="search-icon">' + Icon("search", "size-4") + '</span><input type="text" placeholder="Buscar por código ou nome..." /></div><div class="combobox-list"></div></div>' +
      "</div>"
    );
  }
  // Campo de referência a rubrica para uso fora de tabela (Homolognet/Saldo
  // de salário) — view + edit, mesmo contrato de campoView/campoEdit.
  function rubricaReferenceField(label, path, comboId, opts) {
    opts = opts || {};
    const value = getPath(form, path);
    const referenciada = value ? D.findRubricaByCodigo(value) : null;
    if (state.mode === "view") {
      if (opts.naoAplicavel) return campoView(label, '<span class="detail-field-not-applicable">Não aplicável</span>', opts.wide);
      return campoView(label, referenciada ? referenciada.codigo + " — " + referenciada.nome : vazio(), opts.wide);
    }
    const placeholderTxt = referenciada ? referenciada.codigo + " — " + referenciada.nome : "Selecione uma rubrica";
    return campoEdit(label, comboboxHtml(comboId, placeholderTxt), opts.wide, opts.obrigatorio, opts.hint);
  }
  // Grupo do Accordion — mesmo markup/comportamento de
  // prototype/folha-pagamento/js/folha-page.js (accordionItem()).
  function accordionItem(key, titulo, contentHtml) {
    const aberto = state.accordionOpen[key];
    return (
      '<div class="accordion-item' + (aberto ? " is-open" : "") + '">' +
      '<button type="button" class="accordion-trigger" data-accordion-toggle="' + key + '">' +
      '<span class="accordion-trigger-title">' + titulo + "</span>" +
      '<span class="accordion-trigger-chev">' + Icon("chevron-down", "size-4") + "</span>" +
      "</button>" +
      '<div class="accordion-content">' + contentHtml + "</div></div>"
    );
  }

  // ===== Gatilhos condicionais da Aba Geral =====
  // A especificação não define com exatidão qual campo dispara "Base de
  // cálculo" e "Taxa" (ambos descritos como "Condicional", sem a regra
  // explícita — ver seção 5 de docs/Especificacao_Cadastro_Rubricas.md e o
  // diagnóstico desta tarefa). Decisão provisória adotada aqui, registrada
  // para revisão futura caso uma fonte mais precisa apareça:
  //   - Base de cálculo fica relevante quando o Tipo de Cálculo não é
  //     "Lançado" (Fórmula/Automático dependem de uma base de referência;
  //     um valor Lançado é informado manualmente, sem base).
  //   - Taxa fica relevante quando o cálculo envolve um fator percentual —
  //     Tipo de Cálculo "Automático" ou Unidade "Percentual" — conforme a
  //     própria descrição do campo ("percentual ou valor de referência").
  function baseCalculoAtiva() {
    return !!form.geral.tipoCalculo && form.geral.tipoCalculo !== "lancado";
  }
  function taxaAtiva() {
    return form.geral.tipoCalculo === "automatico" || form.geral.unidade === "percentual";
  }

  // Envolvida em .card/.card-content — mesmo critério de composição visual
  // já usado por cada área de prototype/folha-pagamento/js/folha-page.js
  // (cada aba é um card autocontido); aqui sem card-footer próprio, porque
  // Editar/Cancelar/Gravar vivem no cabeçalho comum (seção acima), não por
  // aba — Rubrica é um registro único, não um formulário por aba.
  // Nota da vigência histórica selecionada (Fase 4) — a única resposta
  // honesta a "os dados exibidos devem corresponder à vigência selecionada"
  // dentro do que a arquitetura atual suporta: mostra os metadados que
  // aquela vigência específica registra (mesmo dado usado na timeline do
  // VigenciaSelector e no Sheet de Histórico), deixando claro que os DEMAIS
  // campos do formulário abaixo continuam refletindo o registro atual, não
  // um snapshot reconstruído daquele período (que não existe).
  function notaVigenciaHistoricaHtml() {
    if (state.vigenciaAtual || !state.vigenciaSelecionada) return "";
    const v = state.vigenciaSelecionada;
    const periodo = v.dataFim ? v.dataInicio + " – " + v.dataFim : "desde " + v.dataInicio;
    return (
      '<div class="alert alert-warning gap-2">' +
      Icon("alert-triangle", "size-4") +
      '<div class="alert-desc">Vigência histórica selecionada (' + periodo + "): Tipo de Cálculo " +
      (v.tipoCalculo ? optLabel(O.tipoCalculo, v.tipoCalculo) : "—") +
      ", Classificação " +
      (v.classificacao ? optLabel(O.classificacao, v.classificacao) : "—") +
      ", Taxa " +
      (v.taxa || "—") +
      ". Os demais campos desta tela continuam exibindo o registro ATUAL — este protótipo não reconstrói o formulário completo por vigência histórica.</div>" +
      "</div>"
    );
  }

  function tabGeral() {
    const baseAtiva = baseCalculoAtiva();
    const taxaAtivaFlag = taxaAtiva();
    return (
      '<div class="card"><div class="card-content flex flex-col gap-6">' +
      notaVigenciaHistoricaHtml() +
      secao(
        "Natureza e cálculo",
        selectField("Tipo de Rubrica", "geral.tipoRubrica", O.tipoRubrica, { obrigatorio: true }) +
          selectField("Tipo de Cálculo", "geral.tipoCalculo", O.tipoCalculo, { obrigatorio: true }) +
          selectField("Unidade do cálculo", "geral.unidade", O.unidade, { obrigatorio: true }) +
          selectField("Classificação", "geral.classificacao", O.classificacao, { obrigatorio: true })
      ) +
      secao(
        "Base de cálculo e taxa",
        selectField("Base de cálculo", "geral.baseCalculo", O.baseCalculo, {
          obrigatorio: baseAtiva,
          naoAplicavel: !baseAtiva,
          hint: !baseAtiva ? "Relevante quando o Tipo de Cálculo é Fórmula ou Automático." : "",
        }) +
          textField("Taxa", "geral.taxa", {
            obrigatorio: taxaAtivaFlag,
            naoAplicavel: !taxaAtivaFlag,
            placeholder: "Ex.: 50 (percentual) ou 120,00 (valor)",
            hint: !taxaAtivaFlag ? "Relevante quando o cálculo depende de um fator percentual ou de um valor de referência." : "",
          })
      ) +
      "</div></div>"
    );
  }

  // ===== Aba Configurações (Fase 2, seção 6 da especificação) =====
  // Única regra de dependência explícita na especificação (seção 6.5 +
  // seção 12): as 4 opções "Não considerar para faltas..." só ficam
  // habilitadas quando "Paga proporcional" está marcado. Demais campos
  // classificados como "Condicional" no documento (ex.: Desconta DSR,
  // Compõe o adiantamento salarial, Detalhar lançamentos por serviço,
  // Calcula diferença piso/rubrica) NÃO têm um gatilho explícito definido
  // pela fonte — nenhuma regra de dependência foi inventada para eles;
  // ficam como checkboxes independentes, exatamente como um campo Opcional,
  // até que uma fonte mais precisa defina a condição real (mesmo critério
  // de "não inventar regra de negócio silenciosa" já usado na Fase 1 para
  // Base de cálculo/Taxa).
  function pagaProporcionalAtivo() {
    return !!form.configuracoes.opcoes.pagaProporcional;
  }
  // "Corrige média" e "Sobre" (grupo Médias) também são "Condicional" sem
  // gatilho explícito próprio — a especificação só diz que "Sobre" "torna-se
  // relevante quando algum reflexo em média está marcado", então essa frase
  // (a única pista textual disponível) foi adotada como gatilho para os
  // dois campos, já que ambos descrevem o mesmo tipo de refinamento da
  // média. Decisão provisória, documentada aqui como tal.
  function algumReflexoMediaMarcado() {
    const m = form.configuracoes.medias;
    return !!(m.avisoPrevio || m.decimoTerceiro || m.ferias || m.licencaPremio || m.afastamentos || m.saldoSalario);
  }

  function tabConfiguracoes() {
    const naoFaltasDisabled = !pagaProporcionalAtivo();
    const naoFaltasHint = naoFaltasDisabled ? "Disponível quando \"Paga proporcional\" estiver marcado." : "";
    const mediaAtiva = algumReflexoMediaMarcado();

    // Lista de checkboxes independentes dentro de um grupo — mesmo padrão
    // `checklist()` já usado em prototype/folha-pagamento/js/folha-page.js
    // (sem título próprio: o título do grupo já vem do accordion-trigger).
    function checklist(itemsHtml) {
      return '<div class="flex flex-col gap-2">' + itemsHtml + "</div>";
    }

    const grupoAdicional = checklist(
      checkboxField("configuracoes.adicional.avisoPrevio", "Aviso prévio") +
        checkboxField("configuracoes.adicional.decimoTerceiroFerias", "13º salário / férias") +
        checkboxField("configuracoes.adicional.licencaPremio", "Licença prêmio") +
        checkboxField("configuracoes.adicional.afastamentos", "Afastamentos")
    );

    const grupoMedias =
      checklist(
        checkboxField("configuracoes.medias.avisoPrevio", "Aviso prévio") +
          checkboxField("configuracoes.medias.decimoTerceiro", "13º salário") +
          checkboxField("configuracoes.medias.ferias", "Férias") +
          checkboxField("configuracoes.medias.licencaPremio", "Licença prêmio") +
          checkboxField("configuracoes.medias.afastamentos", "Afastamentos") +
          checkboxField("configuracoes.medias.saldoSalario", "Saldo salário") +
          checkboxField("configuracoes.medias.corrigeMedia", "Corrige média", { disabled: !mediaAtiva, hint: !mediaAtiva ? "Disponível quando algum reflexo em média estiver marcado." : "" })
      ) +
      '<div class="detail-grid" style="margin-top:14px;">' +
      selectField("Sobre", "configuracoes.medias.sobre", O.baseCalculo, {
        naoAplicavel: !mediaAtiva,
        hint: !mediaAtiva ? "Disponível quando algum reflexo em média estiver marcado." : "",
      }) +
      "</div>";

    const grupoRelatorios = checklist(
      checkboxField("configuracoes.relatorios.fichaFinanceira", "Ficha financeira") +
        checkboxField("configuracoes.relatorios.dirfComprovante", "DIRF / Comprovante de rendimentos") +
        checkboxField("configuracoes.relatorios.rais", "RAIS")
    );

    const grupoLancamentosFixos = checklist(
      checkboxField("configuracoes.lancamentosFixos.calcularFerias", "Calcular nas férias") +
        checkboxField("configuracoes.lancamentosFixos.calcular13", "Calcular no 13º salário")
    );

    const grupoOpcoes =
      '<div class="flex flex-col gap-2">' +
      checkboxField("configuracoes.opcoes.componeHorasMes", "Compõe horas mês") +
      checkboxField("configuracoes.opcoes.refleteDSR", "Reflete no DSR") +
      checkboxField("configuracoes.opcoes.descontaDSR", "Desconta DSR") +
      checkboxField("configuracoes.opcoes.calculaDuranteAfastamento", "Calcula durante o afastamento") +
      checkboxField("configuracoes.opcoes.componeLiquido", "Compõe o líquido") +
      checkboxField("configuracoes.opcoes.apareceRelatorios", "Aparece nos relatórios") +
      checkboxField("configuracoes.opcoes.apareceRecibos", "Aparece nos recibos") +
      checkboxField("configuracoes.opcoes.componeAdiantamentoSalarial", "Compõe o adiantamento salarial") +
      checkboxField("configuracoes.opcoes.detalharLancamentosPorServico", "Detalhar lançamentos por serviço") +
      checkboxField("configuracoes.opcoes.calculaDiferencaPiso", "Calcula diferença devido alteração piso salarial") +
      checkboxField("configuracoes.opcoes.calculaDiferencaRubrica", "Calcula diferença da rubrica") +
      checkboxField("configuracoes.opcoes.pagaProporcional", "Paga proporcional") +
      "</div>" +
      '<div class="subcard">' +
      '<div class="subcard-title">Tratamento de faltas (com "Paga proporcional")</div>' +
      '<div class="flex flex-col gap-2">' +
      checkboxField("configuracoes.opcoes.naoConsiderarFaltasFerias", "Não considerar para faltas em férias", { disabled: naoFaltasDisabled, hint: naoFaltasHint }) +
      checkboxField("configuracoes.opcoes.naoConsiderarFaltasRescisao", "Não considerar para faltas em rescisão", { disabled: naoFaltasDisabled, hint: naoFaltasHint }) +
      checkboxField("configuracoes.opcoes.naoConsiderarFaltasAfastamento", "Não considerar para faltas em afastamento", { disabled: naoFaltasDisabled, hint: naoFaltasHint }) +
      checkboxField("configuracoes.opcoes.naoConsiderarFaltasOutras", "Não considerar para faltas em outras situações", { disabled: naoFaltasDisabled, hint: naoFaltasHint }) +
      "</div></div>";

    return (
      '<div class="card"><div class="card-content flex flex-col gap-3">' +
      '<div class="accordion">' +
      accordionItem("adicional", "Adicional", grupoAdicional) +
      accordionItem("medias", "Médias", grupoMedias) +
      accordionItem("relatorios", "Relatórios", grupoRelatorios) +
      accordionItem("lancamentosFixos", "Lançamentos fixos", grupoLancamentosFixos) +
      accordionItem("opcoes", "Opções", grupoOpcoes) +
      "</div>" +
      "</div></div>"
    );
  }

  // ===== Aba Soma na Base de Cálculo (Fase 3, seção 7 da especificação) =====
  // Tabela dinâmica (incluir/excluir linha) — mesmo padrão já usado na
  // tabela de rubricas de Honorários da Folha de Pagamento (Fase 6), só que
  // aqui o "Código" é um Combobox de seleção (não texto livre), porque a
  // especificação exige "referenciar uma rubrica válida e existente" — a
  // única forma de impedir referência inexistente sem validação assíncrona é
  // restringir a própria entrada às rubricas que já existem. A rubrica atual
  // (form.codigo) é excluída das opções, para impedir autorreferência.
  function tabSomaBaseCalculo() {
    const linhas = form.somaBaseCalculo;
    const editing = state.mode === "edit";

    function descricaoDe(codigo) {
      const r = codigo ? D.findRubricaByCodigo(codigo) : null;
      return r ? r.nome : "";
    }

    let corpoHtml;
    if (linhas.length === 0) {
      corpoHtml = '<tr><td colspan="' + (editing ? 3 : 2) + '" class="row-empty-state">Nenhuma rubrica somada à base de cálculo.</td></tr>';
    } else {
      corpoHtml = linhas
        .map((linha, i) => {
          if (!editing) {
            return "<tr><td>" + (linha.codigoRubrica || vazio()) + "</td><td>" + (descricaoDe(linha.codigoRubrica) || vazio()) + "</td></tr>";
          }
          const placeholderTxt = linha.codigoRubrica ? linha.codigoRubrica + " — " + descricaoDe(linha.codigoRubrica) : "Selecione uma rubrica";
          return (
            "<tr>" +
            "<td>" + comboboxHtml("combo-soma-" + i, placeholderTxt) + "</td>" +
            '<td class="text-sm">' + (descricaoDe(linha.codigoRubrica) || vazio()) + "</td>" +
            '<td class="col-pad-end"><button type="button" class="btn btn-ghost btn-sm" data-remove-soma="' + i + '" aria-label="Remover">' + Icon("x", "size-3-5") + "</button></td>" +
            "</tr>"
          );
        })
        .join("");
    }

    return (
      '<div class="card"><div class="card-content flex flex-col gap-4">' +
      '<div class="detail-section">' +
      '<h3 class="detail-section-title">Rubricas somadas à base de cálculo</h3>' +
      '<div class="table-wrap"><table class="dtable' + (editing ? " dtable-fixed" : "") + '">' +
      (editing ? '<colgroup><col style="width:280px" /><col /><col style="width:40px" /></colgroup>' : "") +
      "<thead><tr><th>Código</th><th>Descrição</th>" + (editing ? "<th></th>" : "") + "</tr></thead>" +
      "<tbody>" + corpoHtml + "</tbody>" +
      "</table></div>" +
      (editing ? '<button type="button" class="btn btn-outline btn-sm w-fit" id="btn-incluir-soma">' + Icon("plus", "size-3-5") + " Incluir rubrica</button>" : "") +
      "</div>" +
      "</div></div>"
    );
  }

  // ===== Aba Rescisão (Fase 3, seção 8 da especificação) =====
  // Única regra de dependência explícita e com 2 níveis: "Emitir no Termo de
  // Rescisão" habilita "Campo" e "Campo 23"; "Campo 23", por sua vez,
  // habilita as 3 opções de tratamento. Os 2 níveis ficam dentro do MESMO
  // `.condrule-dependent` do gatilho principal (sem aninhar um `.condrule`
  // dentro do outro — proibido por precedente de Folha de Pagamento); o
  // segundo nível usa o mesmo critério de campo desabilitado + hint já usado
  // em Base de cálculo/Taxa (Fase 1) e nas opções de faltas (Fase 2).
  //
  // Integridade ao desativar um gatilho: seguindo o mesmo critério da Fase 2
  // (Paga proporcional → faltas), desativar qualquer um dos 3 gatilhos desta
  // aba também limpa os campos dependentes (não só os desabilita) — evita
  // gravar, por exemplo, "Emitir no Termo de Rescisão" desligado com um
  // "Campo" antigo ainda preenchido por baixo. Ver wireEvents().
  const CAMPO23_OPCOES = [
    { value: "mesAnteriorEProjecao", label: "Considerar para remuneração do mês anterior ao da rescisão e para projeção de 30 dias" },
    { value: "somenteMesAnterior", label: "Considerar somente para remuneração do mês anterior ao da rescisão" },
    { value: "somenteProjecao", label: "Considerar somente para remuneração da projeção de 30 dias" },
  ];

  function tabRescisao() {
    const r = form.rescisao;
    const emitirAtivo = !!r.emitirTermoRescisao;
    const campo23Ativo = emitirAtivo && !!r.campo23;

    const grupoEmitir = condRule(
      checkboxField("rescisao.emitirTermoRescisao", "Emitir no Termo de Rescisão"),
      emitirAtivo
        ? '<div class="detail-grid">' +
          textField("Campo", "rescisao.campo", { obrigatorio: true, placeholder: "Identificação do campo no TRCT" }) +
          "</div>" +
          '<div style="margin-top:14px;">' +
          checkboxField("rescisao.campo23", "Campo 23 – Remuneração mês anterior") +
          "</div>" +
          '<div class="detail-grid" style="margin-top:14px;">' +
          radioField("Tratamento do Campo 23", "rescisao.campo23Opcao", CAMPO23_OPCOES, {
            wide: true,
            naoAplicavel: !campo23Ativo,
            obrigatorio: campo23Ativo,
            hint: !campo23Ativo ? 'Disponível quando "Campo 23" estiver marcado.' : "",
          }) +
          "</div>"
        : null
    );

    const grupoHomolognet = condRule(
      checkboxField("rescisao.gerarHomolognet", "Gerar para o Homolognet"),
      r.gerarHomolognet
        ? '<div class="detail-grid">' +
          rubricaReferenceField("Rubrica", "rescisao.homolognetRubricaCodigo", "combo-homolognet-rubrica", { obrigatorio: true }) +
          textField("Código da rubrica externa", "rescisao.homolognetCodigoExterno", { placeholder: "Código exigido pelo layout do Homolognet" }) +
          "</div>"
        : null
    );

    const grupoSaldo = condRule(
      checkboxField("rescisao.gerarSaldoSalarioRescisao", "Gerar a rubrica como saldo de salário de rescisão"),
      r.gerarSaldoSalarioRescisao
        ? '<div class="detail-grid">' +
          rubricaReferenceField("Rubrica destino", "rescisao.saldoSalarioRubricaCodigo", "combo-saldo-rubrica", { obrigatorio: true }) +
          "</div>"
        : null
    );

    return (
      '<div class="card"><div class="card-content flex flex-col gap-6">' +
      '<div class="detail-section"><h3 class="detail-section-title">Emitir no Termo de Rescisão</h3>' + grupoEmitir + "</div>" +
      '<div class="detail-section"><h3 class="detail-section-title">Gerar para o Homolognet</h3>' + grupoHomolognet + "</div>" +
      '<div class="detail-section"><h3 class="detail-section-title">Gerar a rubrica como saldo de salário de rescisão</h3>' + grupoSaldo + "</div>" +
      "</div></div>"
    );
  }

  // ===== Aba e-Social (Fase 3, seção 9 da especificação) =====
  // Não há catálogo oficial (nem mock) da Tabela 3 do eSocial nem de
  // códigos de incidência de IRRF/INSS/FGTS/PIS em nenhum outro lugar do
  // projeto (busca feita antes da Fase 3 — ver relatório da tarefa). Os
  // campos de código/descrição ficam como texto livre, sem select e sem
  // validação contra tabela oficial — mesmo critério de "não fabricar
  // catálogo sem fonte" já usado em outras trilhas do projeto (ex.:
  // catálogo de rubricas de Honorários na Folha).
  //
  // Correção pós-Fase 3: a ausência de catálogo oficial não elimina a
  // OBRIGATORIEDADE DE PREENCHIMENTO já definida pela especificação (seção
  // 11) para Natureza (código) e para as 4 Incidências (código) — só elimina
  // a validação do VALOR contra a tabela oficial, que continua fora de
  // escopo (ver aviso `.alert-info` abaixo, mantido). Os 5 campos de código
  // (natureza + irrf/inss/fgts/pis) agora entram em
  // camposObrigatoriosPreenchidos() como validação de presença — Gravar
  // bloqueia se qualquer um estiver vazio, sem exigir nenhum valor
  // específico. As 4 descrições continuam opcionais (a especificação só
  // lista os códigos como mínimos obrigatórios, seção 11); o eSocial
  // Doméstico não muda (continua fora da obrigatoriedade geral, só seu
  // próprio código fica obrigatório quando o toggle está marcado).
  function tabEsocial() {
    const domesticoAtivo = !!form.esocial.domestico.ativo;

    const grupoDomestico = condRule(
      checkboxField("esocial.domestico.ativo", "Utiliza para o eSocial Doméstico"),
      domesticoAtivo ? '<div class="detail-grid">' + textField("Código eSocial", "esocial.domestico.codigo", { obrigatorio: true, placeholder: "Código no eSocial Doméstico" }) + "</div>" : null
    );

    return (
      '<div class="card"><div class="card-content flex flex-col gap-6">' +
      '<div class="alert alert-info gap-2">' +
      Icon("info", "size-4") +
      '<div class="alert-desc">Nenhum catálogo oficial da Tabela 3 do eSocial ou de códigos de incidência está disponível neste projeto. Os campos abaixo aceitam preenchimento livre; a validação contra a tabela oficial fica para uma etapa futura.</div>' +
      "</div>" +
      secao(
        "Natureza das rubricas",
        textField("Código", "esocial.natureza.codigo", { obrigatorio: true, placeholder: "Código da Tabela 3 do eSocial" }) +
          textField("Descrição", "esocial.natureza.descricao", { wide: true, placeholder: "Preenchimento manual — sem catálogo oficial disponível" })
      ) +
      // Correção de UX (achado I-1 da revisão final): cada incidência ganha
      // seu PRÓPRIO `detail-grid` de 2 campos (código + descrição, este
      // último com `wide: true` — o mesmo `.detail-field-wide` já usado em
      // "Descrição" de "Natureza das rubricas" logo acima, e em "Nome" no
      // cabeçalho). Isolar cada par em seu próprio grid — em vez de um único
      // grid com os 8 campos, como antes — garante código e descrição da
      // MESMA incidência sempre lado a lado na mesma linha (2 colunas),
      // independentemente de quantas colunas o `detail-grid` decidir criar
      // para a largura da tela. Sem CSS novo, sem mudar dado/obrigatoriedade/
      // catálogo — só a distribuição visual. Resolve o truncamento do texto
      // de exemplo ("Código de exemplo (sem catálogo oficial)") observado
      // com a densidade anterior (4 campos por linha, todos do mesmo tamanho).
      '<div class="detail-section">' +
      '<h3 class="detail-section-title">Incidências</h3>' +
      '<div class="flex flex-col gap-4">' +
      '<div class="detail-grid">' + textField("IRRF — código", "esocial.incidencias.irrf.codigo", { obrigatorio: true }) + textField("IRRF — descrição", "esocial.incidencias.irrf.descricao", { wide: true }) + "</div>" +
      '<div class="detail-grid">' + textField("INSS — código", "esocial.incidencias.inss.codigo", { obrigatorio: true }) + textField("INSS — descrição", "esocial.incidencias.inss.descricao", { wide: true }) + "</div>" +
      '<div class="detail-grid">' + textField("FGTS — código", "esocial.incidencias.fgts.codigo", { obrigatorio: true }) + textField("FGTS — descrição", "esocial.incidencias.fgts.descricao", { wide: true }) + "</div>" +
      '<div class="detail-grid">' + textField("PIS — código", "esocial.incidencias.pis.codigo", { obrigatorio: true }) + textField("PIS — descrição", "esocial.incidencias.pis.descricao", { wide: true }) + "</div>" +
      "</div>" +
      "</div>" +
      '<div class="detail-section"><h3 class="detail-section-title">eSocial Doméstico</h3>' + grupoDomestico + "</div>" +
      "</div></div>"
    );
  }

  // Mesmo padrão de renderPlaceholderArea() em
  // prototype/folha-pagamento/js/folha-page.js — área reservada na
  // navegação, sem inventar conteúdo antes da fase correspondente.
  function tabEmConstrucao(label) {
    return (
      '<div class="card">' +
      '<div class="card-content flex flex-col items-center gap-3" style="text-align:center; padding:32px 24px;">' +
      '<div class="flex items-center justify-center size-12 rounded-full" style="background:var(--muted); color:var(--muted-foreground);">' +
      Icon("clock", "size-6") +
      "</div>" +
      '<div class="flex flex-col items-center gap-1">' +
      '<div class="flex items-center gap-2"><h3 class="text-base font-semibold">' + label + "</h3>" +
      '<span class="badge badge-warning">Em construção</span></div>' +
      '<p class="text-sm text-muted max-w-md">Estrutura reservada na navegação do Cadastro de Rubricas — conteúdo funcional entra em uma fase futura.</p>' +
      "</div></div></div>"
    );
  }

  function renderTab() {
    if (state.activeTab === "geral") return tabGeral();
    if (state.activeTab === "configuracoes") return tabConfiguracoes();
    if (state.activeTab === "soma-base-calculo") return tabSomaBaseCalculo();
    if (state.activeTab === "rescisao") return tabRescisao();
    if (state.activeTab === "esocial") return tabEsocial();
    return tabEmConstrucao(TABS.find((t) => t.key === state.activeTab).label);
  }

  function renderTabsBar() {
    return (
      '<div class="tabs-list" style="overflow-x:auto; max-width:100%;">' +
      TABS.map((t) => '<button type="button" class="tabs-trigger' + (t.key === state.activeTab ? " is-active" : "") + '" data-tab="' + t.key + '">' + t.label + "</button>").join("") +
      "</div>"
    );
  }

  // ===== Vigência (Fase 4) — reaproveita shared/js/vigencia.js sem alterar
  // sua API. Sem onCriarNovaVigencia: "Iniciar nova vigência" fica
  // desabilitado, mesmo estado de todas as demais trilhas do projeto hoje —
  // o diagnóstico confirmou que não existe, em lugar nenhum do protótipo
  // (incluindo Regime da Folha), uma fonte real de "esta rubrica já foi
  // usada em folha calculada" que permitisse decidir quando abrir uma nova
  // vigência automaticamente. Fabricar essa detecção com um mock arbitrário
  // criaria uma regra de negócio que não existe — por isso a criação de
  // vigência continua fora desta fase, registrada como pendência (ver
  // relatório da tarefa), e não como uma simulação.
  //
  // Só existe para rubricas já existentes — uma rubrica nova ainda não tem
  // vigência para navegar (mesmo critério do próprio VigenciaSelector, que
  // espera ao menos um item em `vigencias`). O nó é criado uma única vez e
  // reencaixado a cada render() (não recriado), para não acumular listeners
  // no painel-singleton de histórico — mesma técnica usada em
  // prototype/folha-pagamento/js/folha-page.js para Regime.
  //
  // `onChange` — o que a integração cobre e o que não cobre: o
  // VigenciaSelector já resolve sozinho, sem nenhum código nosso, o
  // indicador "Vigência atual/histórica" e o badge "Somente leitura" do
  // cabeçalho. O que fica por nossa conta é: (1) guardar qual vigência está
  // selecionada (`state.vigenciaSelecionada`/`vigenciaAtual`), (2)
  // desabilitar "Editar" enquanto uma vigência histórica estiver selecionada
  // (ver headerHtml()) e (3) mostrar, na Aba Geral, os METADADOS que aquela
  // vigência específica registra (tipoCalculo/classificacao/taxa — ver
  // tabGeral()). Não existe, e não foi fabricada aqui, uma reconstrução
  // completa de todos os campos do formulário por vigência histórica — isso
  // exigiria um snapshot inteiro do registro por vigência, que não existe em
  // nenhuma outra trilha do projeto (nem a própria Regime da Folha, único
  // outro consumidor real do componente, faz isso). Ver relatório da tarefa.
  const vigenciaIndicatorNode = document.createElement("div");
  vigenciaIndicatorNode.id = "rubrica-vigencia-indicator-mount";
  let vigenciaMontada = false;
  // VigenciaSelector.mount() chama onChange uma vez, de forma síncrona, já
  // durante o próprio mount() — que por sua vez acontece dentro de um
  // render() em andamento. Chamar render() de novo nesse instante seria
  // reentrante (render() chamando render() antes de terminar). Este guard
  // absorve só essa primeira chamada automática; qualquer seleção real do
  // usuário depois disso passa a re-renderizar normalmente.
  let vigenciaOnChangeInicial = true;
  function onVigenciaChange(vigenciaSelecionada, isAtual) {
    state.vigenciaSelecionada = vigenciaSelecionada;
    state.vigenciaAtual = isAtual;
    if (vigenciaOnChangeInicial) {
      vigenciaOnChangeInicial = false;
      return;
    }
    render();
  }

  // ===== Histórico (Fase 4) — lista as VIGÊNCIAS reais do modelo de dados
  // (dado que já existe, não inventado), não um log de auditoria por campo.
  // O projeto não tem, em nenhuma trilha, uma auditoria persistente de
  // alterações (quem alterou, quando, valor anterior/novo) — só o Sheet
  // visual (.sheet-*) e o padrão de bloco de evento (.history-event/
  // .history-event-header, já usado em Empresas) foram reaproveitados,
  // preenchidos com o que de fato existe: o período de cada vigência e os
  // metadados registrados nela. Nenhum usuário, timestamp ou "campo
  // alterado" é fabricado — mesma restrição já aplicada ao aviso de
  // catálogo ausente do eSocial (Fase 3). O conteúdo é recalculado a cada
  // abertura (não fixado na criação do Sheet), para refletir o estado atual
  // se a rubrica tiver sido salva entretanto.
  function blocoVigenciaHtml(v, isAtual) {
    const periodo = v.dataFim ? v.dataInicio + " – " + v.dataFim : "desde " + v.dataInicio;
    const metaHtml =
      v.tipoCalculo || v.classificacao || v.taxa
        ? '<div class="table-wrap"><table class="dtable dtable-compact">' +
          "<thead><tr><th>Tipo de Cálculo</th><th>Classificação</th><th>Taxa</th></tr></thead>" +
          "<tbody><tr><td>" +
          (v.tipoCalculo ? optLabel(O.tipoCalculo, v.tipoCalculo) : "—") +
          "</td><td>" +
          (v.classificacao ? optLabel(O.classificacao, v.classificacao) : "—") +
          "</td><td>" +
          (v.taxa || "—") +
          "</td></tr></tbody></table></div>"
        : "";
    return (
      '<div class="history-event">' +
      '<div class="history-event-header">' +
      '<span class="flex items-center gap-1 text-sm font-medium">' + Icon("calendar", "size-3-5") + periodo + "</span>" +
      '<span class="badge ' + (isAtual ? "badge-success" : "badge-outline") + '">' + (isAtual ? "Atual" : "Encerrada") + "</span>" +
      "</div>" +
      metaHtml +
      "</div>"
    );
  }
  function renderHistoricoConteudo() {
    const vigencias = (rubricaExistente && rubricaExistente.vigencias) || [];
    const corpo = vigencias.length
      ? vigencias.map((v, i) => blocoVigenciaHtml(v, i === 0)).join('<hr style="border:none;border-top:1px solid var(--border);margin:0;" />')
      : '<div class="row-empty-state">Nenhuma vigência registrada até o momento.</div>';
    return (
      corpo +
      '<div class="flex items-start gap-2" style="margin-top:4px;">' +
      '<span style="color:var(--muted-foreground);flex-shrink:0;margin-top:1px;">' + Icon("info", "size-3-5") + "</span>" +
      '<span class="text-xs text-muted">Este histórico lista as vigências registradas no cadastro. Este protótipo ainda não possui um registro de auditoria por alteração de campo (quem alterou, quando, valor anterior e novo).</span>' +
      "</div>"
    );
  }
  function ensureHistoricoSheet() {
    if (document.getElementById("rubrica-historico-overlay")) return;
    const overlay = document.createElement("div");
    overlay.className = "sheet-overlay";
    overlay.id = "rubrica-historico-overlay";
    const panel = document.createElement("div");
    panel.className = "sheet-panel";
    panel.id = "rubrica-historico-panel";
    panel.innerHTML =
      '<button type="button" class="sheet-close" id="rubrica-historico-close">' + Icon("x", "size-4") + "</button>" +
      '<div class="sheet-header">' +
      '<div class="sheet-title">Histórico</div>' +
      '<div class="sheet-description">Vigências registradas nesta rubrica ao longo do tempo.</div>' +
      "</div>" +
      '<div class="sheet-body flex flex-col gap-4" id="rubrica-historico-body"></div>' +
      '<div class="sheet-footer"><button type="button" class="btn btn-outline" id="rubrica-historico-fechar">Fechar</button></div>';
    document.body.appendChild(overlay);
    document.body.appendChild(panel);

    document.getElementById("rubrica-historico-close").addEventListener("click", fecharHistorico);
    document.getElementById("rubrica-historico-fechar").addEventListener("click", fecharHistorico);
    overlay.addEventListener("click", fecharHistorico);
  }
  function abrirHistorico() {
    ensureHistoricoSheet();
    document.getElementById("rubrica-historico-body").innerHTML = renderHistoricoConteudo();
    UI.openSheet(document.getElementById("rubrica-historico-overlay"), document.getElementById("rubrica-historico-panel"));
  }
  function fecharHistorico() {
    UI.closeSheet(document.getElementById("rubrica-historico-overlay"), document.getElementById("rubrica-historico-panel"));
  }

  // ===== Validação =====
  function codigoValido() {
    return /^[0-9]+$/.test((form.codigo || "").trim());
  }
  // Correção de conformidade: "Código eSocial" é Numérico na especificação
  // (cabeçalho, seção 4) — mesma regra de formato já aplicada a "Código",
  // sem validação contra a Tabela 3 do eSocial (isso continua fora de
  // escopo enquanto não houver catálogo oficial no projeto).
  function codigoEsocialValido() {
    return /^[0-9]+$/.test((form.codigoEsocial || "").trim());
  }
  function codigoDuplicado() {
    return D.codigoDuplicado(form.codigo, isNovo ? null : rubricaExistente.codigo);
  }
  // Soma na Base de Cálculo: toda linha precisa referenciar uma rubrica
  // existente, diferente da própria rubrica em edição — mesma regra dupla
  // pedida na especificação ("deve referenciar uma rubrica válida e
  // existente") e nesta fase ("não permitir autorreferência"). Como o
  // Combobox só lista rubricas reais e exclui a própria (rubricasParaCombobox),
  // isto na prática só falha para uma linha recém-incluída ainda sem seleção.
  function somaBaseCalculoValida() {
    return form.somaBaseCalculo.every((linha) => {
      if (!linha.codigoRubrica || linha.codigoRubrica === form.codigo) return false;
      return !!D.findRubricaByCodigo(linha.codigoRubrica);
    });
  }
  // Rescisão: os campos dependentes só são exigidos quando seu gatilho
  // correspondente está marcado (mesmo critério de obrigatoriedade
  // condicional já usado em Base de cálculo/Taxa e nas opções de faltas).
  function rescisaoValida() {
    const r = form.rescisao;
    if (r.emitirTermoRescisao && !(r.campo || "").trim()) return false;
    if (r.emitirTermoRescisao && r.campo23 && !r.campo23Opcao) return false;
    if (r.gerarHomolognet && !r.homolognetRubricaCodigo) return false;
    if (r.gerarSaldoSalarioRescisao && !r.saldoSalarioRubricaCodigo) return false;
    return true;
  }
  // e-Social: Natureza (código) e as 4 Incidências (código) são mínimos
  // obrigatórios pela especificação (seção 11), independentemente de existir
  // catálogo oficial — a ausência de catálogo só dispensa a validação do
  // VALOR contra a tabela oficial, não a obrigatoriedade de preenchimento
  // (correção pós-Fase 3). Validação apenas de presença (string não vazia),
  // nenhum valor específico é exigido nem fabricado.
  function esocialValido() {
    const e = form.esocial;
    if (!(e.natureza.codigo || "").trim()) return false;
    if (!(e.incidencias.irrf.codigo || "").trim()) return false;
    if (!(e.incidencias.inss.codigo || "").trim()) return false;
    if (!(e.incidencias.fgts.codigo || "").trim()) return false;
    if (!(e.incidencias.pis.codigo || "").trim()) return false;
    return true;
  }
  function camposObrigatoriosPreenchidos() {
    if (!(form.codigo || "").trim() || !codigoValido() || codigoDuplicado()) return false;
    if (!(form.codigoEsocial || "").trim() || !codigoEsocialValido()) return false;
    if (!(form.nome || "").trim()) return false;
    if (!(form.dataInicio || "").trim()) return false;
    if (!(form.situacao || "").trim()) return false;
    if (!form.geral.tipoRubrica || !form.geral.tipoCalculo || !form.geral.unidade || !form.geral.classificacao) return false;
    if (baseCalculoAtiva() && !form.geral.baseCalculo) return false;
    if (taxaAtiva() && !(form.geral.taxa || "").toString().trim()) return false;
    if (!somaBaseCalculoValida()) return false;
    if (!rescisaoValida()) return false;
    if (!esocialValido()) return false;
    return true;
  }

  function hojeBr() {
    const d = new Date();
    return String(d.getDate()).padStart(2, "0") + "/" + String(d.getMonth() + 1).padStart(2, "0") + "/" + d.getFullYear();
  }

  // ===== Cabeçalho comum (Código, Código eSocial, Nome, Data de Início,
  // Situação, Data fim) — permanece visível independentemente da aba
  // selecionada, conforme a especificação (seção 4). =====
  function headerHtml() {
    const titulo = isNovo ? "Nova rubrica" : form.nome;
    const tipoBadge = !isNovo && form.geral.tipoRubrica ? '<span class="badge badge-secondary">' + optLabel(O.tipoRubrica, form.geral.tipoRubrica) + "</span>" : "";
    const situacaoBadge = !isNovo ? '<span class="badge ' + (form.situacao === "Ativo" ? "badge-success" : "badge-outline") + '">' + form.situacao + "</span>" : "";

    // "Editar" fica indisponível enquanto uma vigência histórica está
    // selecionada no VigenciaSelector do cabeçalho (Fase 4) — o próprio
    // componente já marca esse período como "Somente leitura"; editar o
    // registro nesse estado editaria sempre o registro ATUAL por baixo
    // (não existe reconstrução de dados por vigência histórica neste
    // protótipo — ver comentário em onVigenciaChange()), o que confundiria
    // qual vigência está de fato sendo alterada. O usuário usa "Voltar para
    // vigência atual" (já existente no próprio painel de histórico) para
    // voltar a poder editar.
    const editarBloqueadoPorVigencia = !isNovo && !state.vigenciaAtual;
    const acoesHtml =
      state.mode === "view"
        ? '<div class="flex gap-2">' +
          '<button type="button" class="btn btn-outline btn-sm" id="btn-historico">' + Icon("clock", "size-3-5") + " Histórico</button>" +
          '<button type="button" class="btn btn-outline btn-sm" id="btn-editar"' +
          (editarBloqueadoPorVigencia ? ' disabled title="Volte para a vigência atual para editar."' : "") +
          ">" + Icon("pencil", "size-3-5") + " Editar</button>" +
          "</div>"
        : '<div class="flex gap-2">' +
          '<button type="button" class="btn btn-outline btn-sm" id="btn-cancelar">Cancelar</button>' +
          '<button type="button" class="btn btn-sm" id="btn-gravar"' + (camposObrigatoriosPreenchidos() ? "" : " disabled") + ">Gravar</button>" +
          "</div>";

    const camposHtml =
      textField("Código", "codigo", { obrigatorio: true, placeholder: "Ex.: 1000" }) +
      textField("Código eSocial", "codigoEsocial", { obrigatorio: true, placeholder: "Tabela 3 do eSocial" }) +
      textField("Nome", "nome", { obrigatorio: true, wide: true, placeholder: "Nome completo da rubrica" }) +
      dateField("Data de Início", "dataInicio", { obrigatorio: true }) +
      selectField("Situação", "situacao", O.situacao, { obrigatorio: true }) +
      campoView("Data fim", form.dataFim ? form.dataFim : vazio());

    const erroCodigoHtml =
      state.mode === "edit" && (form.codigo || "").trim() && (!codigoValido() || codigoDuplicado())
        ? '<span class="text-xs" style="color:var(--destructive);">' + (!codigoValido() ? "Código deve conter apenas números." : "Já existe uma rubrica com este código.") + "</span>"
        : "";
    // Mesmo padrão do erro de "Código" acima — correção de conformidade
    // (Código eSocial é Numérico na especificação).
    const erroCodigoEsocialHtml =
      state.mode === "edit" && (form.codigoEsocial || "").trim() && !codigoEsocialValido()
        ? '<span class="text-xs" style="color:var(--destructive);">Código eSocial deve conter apenas números.</span>'
        : "";

    return (
      '<div class="flex flex-col gap-2">' +
      '<a href="index.html" class="flex items-center gap-1 text-sm font-medium link-info w-fit">' + Icon("chevron-left", "size-3-5") + " voltar para a lista</a>" +
      '<div class="flex items-center justify-between gap-3 flex-wrap" style="min-height:32px;">' +
      '<div class="flex items-center gap-2 flex-wrap"><h2 class="text-lg font-semibold">' + titulo + "</h2>" + tipoBadge + situacaoBadge + "</div>" +
      acoesHtml +
      "</div></div>" +
      '<div class="card"><div class="card-content flex flex-col gap-4">' +
      '<div class="detail-grid">' + camposHtml + "</div>" +
      erroCodigoHtml +
      erroCodigoEsocialHtml +
      '<div id="rubrica-vigencia-slot"></div>' +
      "</div></div>"
    );
  }

  function render() {
    document.getElementById("rubrica-root").innerHTML = headerHtml() + renderTabsBar() + '<div id="rubrica-tab-content"></div>';
    document.getElementById("rubrica-tab-content").innerHTML = renderTab();

    if (!isNovo) {
      const slot = document.getElementById("rubrica-vigencia-slot");
      if (slot) slot.replaceWith(vigenciaIndicatorNode);
      if (!vigenciaMontada) {
        vigenciaMontada = true;
        VigenciaSelector.mount({
          indicatorMount: vigenciaIndicatorNode,
          vigencias: rubricaExistente.vigencias && rubricaExistente.vigencias.length ? rubricaExistente.vigencias : [{ id: "rub-" + rubricaExistente.codigo + "-fallback", dataInicio: rubricaExistente.dataInicio, dataFim: null }],
          onChange: onVigenciaChange,
        });
      }
    }

    wireEvents();
  }

  function wireEvents() {
    document.querySelectorAll("[data-tab]").forEach((el) => {
      el.addEventListener("click", () => {
        state.activeTab = el.getAttribute("data-tab");
        render();
      });
    });

    const btnHistorico = document.getElementById("btn-historico");
    if (btnHistorico) btnHistorico.addEventListener("click", abrirHistorico);

    const btnEditar = document.getElementById("btn-editar");
    if (btnEditar) btnEditar.addEventListener("click", () => { iniciarEdicao(); render(); });

    const btnCancelar = document.getElementById("btn-cancelar");
    if (btnCancelar) {
      btnCancelar.addEventListener("click", () => {
        if (isNovo) { window.location.href = "index.html"; return; }
        cancelarEdicao();
        render();
      });
    }

    const btnGravar = document.getElementById("btn-gravar");
    if (btnGravar) btnGravar.addEventListener("click", salvar);

    document.querySelectorAll("input[data-path], select[data-path]").forEach((el) => {
      el.addEventListener("change", () => {
        const path = el.getAttribute("data-path");
        setPath(form, path, el.value);
        // Regra do próprio cabeçalho (seção 4 da especificação): "Data fim"
        // é a data em que o sistema inativou a rubrica — não um campo
        // digitável. Ao marcar Inativo, o sistema registra a data corrente;
        // ao voltar para Ativo, a rubrica deixa de estar encerrada.
        if (path === "situacao") {
          if (form.situacao === "Inativo" && !form.dataFim) form.dataFim = hojeBr();
          else if (form.situacao === "Ativo") form.dataFim = null;
        }
        render();
      });
    });

    document.querySelectorAll(".date-picker[data-path]").forEach((el) => {
      const path = el.getAttribute("data-path");
      const picker = UI.initDatePicker(el, (valor) => {
        setPath(form, path, valor || "");
        render();
      });
      picker.setValue(getPath(form, path) || "");
    });

    // Checkboxes da Aba Configurações — mesmo padrão de convencao-detail.js
    // (".ucheckbox[data-path]"). Checkboxes desabilitados (opts.disabled em
    // checkboxField()) não recebem o atributo data-path, então este seletor
    // já os ignora sem precisar de uma checagem extra aqui.
    document.querySelectorAll(".ucheckbox[data-path]").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        const path = el.getAttribute("data-path");
        const novoValor = !getPath(form, path);
        setPath(form, path, novoValor);
        // Ao desmarcar "Paga proporcional", as 4 opções de faltas não só
        // ficam desabilitadas (checkboxField() já cuida disso) como também
        // são zeradas — evita um estado de dados incoerente (rubrica com
        // "Paga proporcional" desligado mas guardando exceções de falta
        // "ligadas" por baixo). Mesmo princípio já usado na Fase 1 para
        // Situação → Data fim: desligar o gatilho também limpa o campo
        // dependente, não só esconde/desabilita o controle.
        if (path === "configuracoes.opcoes.pagaProporcional" && !novoValor) {
          const o = form.configuracoes.opcoes;
          o.naoConsiderarFaltasFerias = false;
          o.naoConsiderarFaltasRescisao = false;
          o.naoConsiderarFaltasAfastamento = false;
          o.naoConsiderarFaltasOutras = false;
        }
        // Aba Rescisão (Fase 3) — desligar qualquer um dos 3 gatilhos também
        // limpa os campos dependentes, mesmo critério acima (evita dado
        // incoerente escondido atrás de um controle desabilitado).
        if (path === "rescisao.emitirTermoRescisao" && !novoValor) {
          form.rescisao.campo = "";
          form.rescisao.campo23 = false;
          form.rescisao.campo23Opcao = "";
        }
        if (path === "rescisao.campo23" && !novoValor) {
          form.rescisao.campo23Opcao = "";
        }
        if (path === "rescisao.gerarHomolognet" && !novoValor) {
          form.rescisao.homolognetRubricaCodigo = "";
          form.rescisao.homolognetCodigoExterno = "";
        }
        if (path === "rescisao.gerarSaldoSalarioRescisao" && !novoValor) {
          form.rescisao.saldoSalarioRubricaCodigo = "";
        }
        // Aba e-Social (Fase 3) — mesmo critério para eSocial Doméstico.
        if (path === "esocial.domestico.ativo" && !novoValor) {
          form.esocial.domestico.codigo = "";
        }
        render();
      });
    });

    // Radio group da Aba Rescisão (Campo 23) — mesmo padrão `.uradio[data-path]`
    // já usado em Folha de Pagamento. Opções desabilitadas (radioField() com
    // naoAplicavel) não recebem data-path/data-value, então este seletor já
    // as ignora.
    document.querySelectorAll(".uradio[data-path]").forEach((el) => {
      el.addEventListener("click", () => {
        setPath(form, el.getAttribute("data-path"), el.getAttribute("data-value"));
        render();
      });
    });

    // Combobox de referência a rubrica (Soma na Base, Homolognet, Saldo de
    // salário de rescisão) — UI.initCombobox() reaproveitado tal como está.
    document.querySelectorAll('[id^="combo-soma-"]').forEach((el) => {
      const i = Number(el.id.replace("combo-soma-", ""));
      UI.initCombobox(el, rubricasParaCombobox(form.codigo, form.somaBaseCalculo[i].codigoRubrica), form.somaBaseCalculo[i].codigoRubrica, (value) => {
        form.somaBaseCalculo[i].codigoRubrica = value;
        render();
      });
    });
    const comboHomolognet = document.getElementById("combo-homolognet-rubrica");
    if (comboHomolognet) {
      UI.initCombobox(comboHomolognet, rubricasParaCombobox(form.codigo, form.rescisao.homolognetRubricaCodigo), form.rescisao.homolognetRubricaCodigo, (value) => {
        form.rescisao.homolognetRubricaCodigo = value;
        render();
      });
    }
    const comboSaldo = document.getElementById("combo-saldo-rubrica");
    if (comboSaldo) {
      UI.initCombobox(comboSaldo, rubricasParaCombobox(form.codigo, form.rescisao.saldoSalarioRubricaCodigo), form.rescisao.saldoSalarioRubricaCodigo, (value) => {
        form.rescisao.saldoSalarioRubricaCodigo = value;
        render();
      });
    }

    // Tabela dinâmica de Soma na Base de Cálculo — mesmo princípio de
    // Incluir/Excluir já usado na tabela de rubricas de Honorários da Folha
    // de Pagamento (Fase 6): cada ação re-renderiza a área inteira.
    const btnIncluirSoma = document.getElementById("btn-incluir-soma");
    if (btnIncluirSoma) {
      btnIncluirSoma.addEventListener("click", () => {
        form.somaBaseCalculo.push({ codigoRubrica: "" });
        render();
      });
    }
    document.querySelectorAll("[data-remove-soma]").forEach((el) => {
      el.addEventListener("click", () => {
        form.somaBaseCalculo.splice(Number(el.getAttribute("data-remove-soma")), 1);
        render();
      });
    });

    document.querySelectorAll("[data-accordion-toggle]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const key = btn.getAttribute("data-accordion-toggle");
        state.accordionOpen[key] = !state.accordionOpen[key];
        render();
      });
    });
  }

  function salvar() {
    if (!camposObrigatoriosPreenchidos()) return;
    const lista = D.getRubricas();
    if (isNovo) {
      // Metadados capturados na 1ª vigência a partir do próprio formulário —
      // mesmo dado exibido depois na timeline do VigenciaSelector e no
      // Histórico (ver blocoVigenciaHtml()). Nenhuma vigência adicional é
      // criada aqui: a rubrica nasce com exatamente 1 vigência (a atual).
      form.vigencias = [
        { id: "rub-" + form.codigo + "-v1", dataInicio: form.dataInicio, dataFim: null, tipoCalculo: form.geral.tipoCalculo, classificacao: form.geral.classificacao, taxa: form.geral.taxa },
      ];
      D.setRubricas(lista.concat([JSON.parse(JSON.stringify(form))]));
      window.location.href = "rubrica.html?rubrica=" + encodeURIComponent(form.codigo) + "&criado=1";
      return;
    }
    // Mantém os metadados de exibição da VIGÊNCIA ATUAL (dataFim vazio)
    // sincronizados com a Aba Geral ao gravar — não cria nem altera nenhuma
    // outra vigência (as históricas são preservadas como estão), só evita
    // que a própria vigência atual mostre, na timeline/Histórico, um
    // Tipo de Cálculo/Classificação/Taxa desatualizados em relação ao que
    // acabou de ser salvo.
    if (form.vigencias && form.vigencias.length && !form.vigencias[0].dataFim) {
      form.vigencias[0].tipoCalculo = form.geral.tipoCalculo;
      form.vigencias[0].classificacao = form.geral.classificacao;
      form.vigencias[0].taxa = form.geral.taxa;
    }
    const atualizados = lista.map((r) => (r.codigo === rubricaExistente.codigo ? JSON.parse(JSON.stringify(form)) : r));
    D.setRubricas(atualizados);
    Object.assign(rubricaExistente, JSON.parse(JSON.stringify(form)));
    confirmarSalvamento();
    render();
    UI.showToast("Rubrica salva", form.nome + " foi atualizada com sucesso.");
  }

  Shell.mount(document.getElementById("shell-root"), {
    base: "../",
    active: "rubricas",
    crumbs: isNovo ? [{ label: "rubricas", href: "index.html" }, { label: "nova rubrica" }] : [{ label: "rubricas", href: "index.html" }, { label: form.nome }],
  });

  ensureToast();
  render();

  if (D.getQueryParam("criado")) {
    UI.showToast("Rubrica criada", form.nome + " foi cadastrada com sucesso.");
  }
})();
