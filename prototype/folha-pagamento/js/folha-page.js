/*
  Página "Folha de Pagamento" — Fase 1, área "Geral" (ver
  docs/folha-pagamento-fase1-analise-arquitetura-geral.md).

  Estrutura: SPA de Tabs (10 áreas da Folha, mesma técnica de navegação sem
  reload já usada em Parâmetros Fiscais) — só a Tab "Geral" tem conteúdo
  funcional nesta fase. Dentro de "Geral": um único Card com Accordion para
  eSocial / Cálculo / Unidade de Cálculo / Personaliza (decisão 2: Unidade de
  Cálculo é grupo irmão de Cálculo, não subgrupo) e uma seção simples para
  Informações.

  Refinamento UX pós-auditoria (ver relatório "Auditoria UX — Fase 1"): tanto
  "Personaliza" quanto "eSocial" contêm um Accordion aninhado (classe
  `.accordion-nested` em components.css) para reduzir a densidade quando
  abertos — a auditoria apontou que o nível 1 e o nível 2 tinham peso visual
  idêntico (lendo como lista plana) e que eSocial, aberto por padrão, ficava
  muito longo sem nenhum recolhimento interno. A composição dos dois NÃO é
  idêntica: Personaliza tem 11 itens de tamanho comparável (um por subgrupo
  da especificação); eSocial tem só 3 itens (Faseamento, SST, "Dados
  Cadastrais e Tributários"), porque seus dois subgrupos menores da
  especificação — Contratações (PCD), 2 campos, e Órgãos Públicos, 1 campo —
  foram reunidos dentro do terceiro item em vez de ganharem Accordion
  próprio (replicar Personaliza mecanicamente criaria itens de 1-2 campos,
  o que a decisão 6 da arquitetura já veda). "Configurações de Envio ·
  Geral" (com o gatilho-mãe "Gerar eSocial") permanece sempre visível, fora
  do Accordion aninhado, como conteúdo de entrada do grupo.

  Visualização × edição segue o padrão de Sindicato/Convenção (variável
  `mode` de página + campoView/campoEdit) — não o padrão de Empresas
  (drawer), porque "Geral" é uma tela de parametrização extensa, não um
  cadastro com poucos campos pontuais.

  Nenhuma regra de bloqueio de salvamento ou de conclusão de área é
  implementada (decisões 4 e 5 da análise) — os campos Base/Condicional são
  apenas indicados visualmente (asterisco), nunca bloqueantes.
*/
(function () {
  const D = window.FolhaData;
  const O = D.OPCOES;

  function resolveEmpresa() {
    const ED = window.EmpresasData;
    const codigo = D.getQueryParam("empresa");
    return (codigo && ED.findEmpresaByCodigo(codigo)) || null;
  }

  function renderEmpresaPreview(empresa) {
    const dg = empresa.dadosGerais;
    return (
      '<div class="list-row">' +
      '<div class="flex flex-col gap-0-5 min-w-0">' +
      '<span class="text-sm font-medium truncate">' + dg.razaoSocial + "</span>" +
      '<span class="text-xs text-muted truncate">CNPJ ' + dg.cnpj + " · " + dg.regimeTributarioFederal + "</span>" +
      "</div></div>"
    );
  }

  function comboboxHtml(id, placeholder) {
    return (
      '<div class="combobox" id="' + id + '" data-empty-text="Nenhuma empresa encontrada.">' +
      '<button type="button" class="combobox-trigger"><span class="combobox-label truncate">' + placeholder + '</span><span class="chev"></span></button>' +
      '<div class="combobox-panel"><div class="combobox-search"><span class="search-icon"></span><input type="text" placeholder="Buscar por nome, código ou CNPJ..." /></div><div class="combobox-list"></div></div>' +
      "</div>"
    );
  }

  // Skeleton antecipando a estrutura real da tela da Folha (cabeçalho, barra
  // de abas, blocos de Accordion de "Geral" e seção de Informações) — usa o
  // primitivo .skeleton (shared/css/components.css, portado de
  // docs/design-system/components/ui/skeleton.tsx). Composição exclusiva da
  // Folha: não reaproveita a composição da Fiscal (fiscal-page.js), que
  // representa vigência/alertas — estrutura que não existe nesta trilha.
  function skeletonBar(width, height) {
    return '<span class="skeleton" style="width:' + width + "; height:" + height + ';"></span>';
  }

  function renderFolhaSkeleton() {
    return (
      '<div class="card" role="status" aria-live="polite" aria-busy="true">' +
      '<span class="sr-only">Carregando dados da Folha de Pagamento da empresa selecionada…</span>' +
      '<div class="card-content flex flex-col gap-4">' +
      '<div class="flex items-start justify-between gap-3 flex-wrap">' +
      '<div class="flex flex-col gap-2">' + skeletonBar("200px", "24px") + skeletonBar("260px", "14px") + "</div>" +
      skeletonBar("90px", "30px") +
      "</div>" +
      skeletonBar("100%", "36px") +
      '<div class="flex flex-col gap-2">' +
      skeletonBar("100%", "44px") + skeletonBar("100%", "44px") + skeletonBar("100%", "44px") + skeletonBar("100%", "44px") +
      "</div>" +
      '<div class="flex flex-col gap-2" style="padding-top:8px; border-top:1px solid var(--border);">' +
      skeletonBar("120px", "16px") + skeletonBar("92%", "13px") + skeletonBar("70%", "13px") +
      "</div>" +
      "</div></div>"
    );
  }

  // Tempo de exibição do skeleton antes de navegar. Simulação — o carregamento
  // do contexto da empresa aqui é síncrono (dados mockados) — só para o estado
  // de carregamento ser perceptível; mesmo princípio de FISCAL_LOADING_DELAY_MS
  // em prototype/parametros-fiscais/js/fiscal-page.js. Remover este delay
  // artificial quando houver uma origem de dados real e assíncrona.
  const FOLHA_LOADING_DELAY_MS = 400;

  function irParaEmpresa(codigo) {
    const mountEl = document.getElementById("folha-page-mount");
    if (mountEl) mountEl.innerHTML = renderFolhaSkeleton();
    window.setTimeout(() => {
      window.location.href = "index.html?empresa=" + encodeURIComponent(codigo);
    }, FOLHA_LOADING_DELAY_MS);
  }

  // Estado inicial da trilha quando nenhuma empresa foi definida — mesma
  // decisão de fluxo da Fiscal (nenhum parâmetro é carregado antes da
  // seleção de empresa).
  function mountSelecaoEmpresa() {
    document.getElementById("folha-page-mount").innerHTML =
      '<div class="flex flex-col gap-4" style="max-width:440px; margin:64px auto 0;">' +
      '<div class="flex flex-col gap-1" style="text-align:center;">' +
      '<h1 class="text-xl font-semibold">Folha de Pagamento</h1>' +
      '<p class="text-sm text-muted">Selecione uma empresa para continuar.</p>' +
      "</div>" +
      '<div class="card">' +
      '<div class="card-content flex flex-col gap-4">' +
      '<div class="flex flex-col gap-1"><label class="field-label">Empresa</label>' +
      comboboxHtml("folha-empresa-combobox", "Buscar empresa") +
      "</div>" +
      '<div id="folha-empresa-preview"></div>' +
      '<button type="button" class="btn w-full" id="btn-selecionar-empresa" disabled>Selecionar empresa</button>' +
      "</div></div></div>";

    let escolhida = null;
    const btn = document.getElementById("btn-selecionar-empresa");

    FolhaEmpresaSelector.mountCombobox(document.getElementById("folha-empresa-combobox"), null, (codigo) => {
      escolhida = window.EmpresasData.findEmpresaByCodigo(codigo);
      document.getElementById("folha-empresa-preview").innerHTML = escolhida ? renderEmpresaPreview(escolhida) : "";
      btn.disabled = !escolhida;
    });

    btn.addEventListener("click", () => {
      if (escolhida) irParaEmpresa(escolhida.codigo);
    });
  }

  // Garante o markup do toast no <body> uma vez por página (README.md,
  // seção Toast) — nenhum HTML declara <div class="toast"> manualmente.
  function ensureToast() {
    if (document.getElementById("toast")) return;
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.id = "toast";
    toast.innerHTML = '<span class="toast-icon"></span><div class="flex flex-col gap-0-5"><span class="toast-title"></span><span class="toast-desc"></span></div>';
    document.body.appendChild(toast);
  }

  function mount(empresa) {
    ensureToast();
    let activeArea = "geral";
    let mode = "view";
    let form = D.defaultGeralForm(empresa);
    // Snapshot de edição de Geral (correção transversal do Cancelar — ver
    // deepClone()/iniciarEdicaoCtx()/cancelarEdicaoCtx()/confirmarSalvamentoCtx()
    // abaixo). Geral não usa um objeto `ctx` como as demais 8 áreas (é
    // anterior a esse padrão), por isso guarda o snapshot em uma variável
    // solta própria, em vez de `ctx.snapshot` — mesmo mecanismo central de
    // clone, aplicado à sua própria forma de estado.
    let formSnapshot = null;

    // ===== Regime (Fase 2 — docs/folha-pagamento-fase2-analise-arquitetura-regime.md) =====
    // Estado independente do de "Geral": mesma mecânica (mode/obrigatórios/
    // inválidos/accordion), mas sem compartilhar as variáveis de Geral —
    // decisão desta tarefa (item 11, paridade visualização×edição por área),
    // para que editar Regime não interfira em Geral e vice-versa. Agrupado
    // num único objeto (`regimeCtx`) porque os helpers de campo de Regime
    // (`makeCamposHelpers`, abaixo) precisam enxergar sempre o valor atual
    // de `mode`/`obrigatorios`/`invalidos` — usar um objeto evita duplicar
    // três variáveis soltas que precisariam ser reatribuídas em uníssono.
    const regimeInit = D.defaultRegimeForm(empresa);
    const regimeVigencias = regimeInit.vigencias;
    const regimeCtx = {
      form: regimeInit.form,
      mode: "view",
      obrigatorios: [],
      invalidos: new Set(),
      accordionOpen: { regime: true },
      snapshot: null,
    };
    // Nó do indicador de vigência (VigenciaSelector) — criado uma única vez
    // e nunca recriado por innerHTML. Diferente de todo o resto desta tela
    // (que reconstrói a árvore inteira a cada render()), VigenciaSelector.mount()
    // liga listeners permanentes no painel singleton de histórico (shared/js/
    // vigencia.js, sem remoção prévia) — chamá-lo a cada render() acumularia
    // um listener novo por edição de campo. Por isso o nó vive fora do ciclo
    // de innerHTML (mesma técnica já usada para o toast/ensureToast() e para
    // o sheet "Trocar empresa"/ensureTrocarEmpresaSheet(), abaixo) e é apenas
    // reencaixado (reparented) no placeholder correto a cada render() da aba
    // Regime — ver render(). VigenciaSelector.mount() em si só roda uma vez
    // (regimeVigenciaMontada).
    const regimeVigenciaIndicatorNode = document.createElement("div");
    regimeVigenciaIndicatorNode.id = "regime-vigencia-indicator-mount";
    let regimeVigenciaMontada = false;

    // ===== Arredondamento (Fase 3 —
    // docs/folha-pagamento-fase3-analise-arquitetura-arredondamento.md) =====
    // Mesmo princípio de estado independente já usado para Regime: `arredCtx`
    // agrupa form/mode/obrigatorios/invalidos próprios, sem tocar em Geral
    // ou Regime. Sem `accordionOpen` própria (decisão de arquitetura, seção
    // 4 — Card único, sem Accordion, pelo mesmo critério da decisão 6 da
    // Fase 1: escopo pequeno demais para justificar agrupamento).
    const arredCtx = { form: D.defaultArredondamentoForm(empresa), mode: "view", obrigatorios: [], invalidos: new Set(), accordionOpen: {}, snapshot: null };

    // ===== Adiantamento e 13º Salário (Fase 4 —
    // docs/folha-pagamento-fase4-analise-arquitetura-adiantamento-decimo-terceiro.md)
    // ===== Mesmo princípio de estado isolado por área já usado para Regime/
    // Arredondamento. Sem `accordionOpen` própria (decisão de arquitetura,
    // seção 7 — só 2 subgrupos por Tab, mesmo critério que já dispensou
    // Accordion em Regime).
    const adiantamentoCtx = { form: D.defaultAdiantamentoForm(empresa), mode: "view", obrigatorios: [], invalidos: new Set(), accordionOpen: {}, snapshot: null };
    const decimoTerceiroCtx = { form: D.defaultDecimoTerceiroForm(empresa), mode: "view", obrigatorios: [], invalidos: new Set(), accordionOpen: {}, snapshot: null };

    // ===== Férias (Fase 5 —
    // docs/folha-pagamento-fase5-analise-arquitetura-ferias.md) =====
    // Mesmo princípio de estado isolado por área já usado para as demais
    // Tabs. Sem `accordionOpen` própria — decisão de arquitetura (seção 8):
    // 3 `secao()`/`.detail-section` (Geral/Opções/Rescisão) dentro de 1 Card
    // único, sem Accordion, mesmo critério que já dispensou Accordion em
    // Regime/Adiantamento/13º Salário.
    const feriasCtx = { form: D.defaultFeriasForm(empresa), mode: "view", obrigatorios: [], invalidos: new Set(), accordionOpen: {}, snapshot: null };

    // ===== Contabilidade e Honorários (Fase 6 —
    // docs/folha-pagamento-fase6-analise-arquitetura-contabilidade-honorarios.md)
    // ===== Duas Tabs distintas (não sub-abas de uma só — seção 1.2 da
    // arquitetura), cada uma com estado isolado, mesmo princípio já usado
    // pelas demais áreas. Sem `accordionOpen` própria em nenhuma das duas —
    // Contabilidade tem 3 `secao()` (Geral/Opções/Filial Ativa) dentro de 1
    // Card, mesmo critério que já dispensou Accordion em Férias (3
    // subgrupos); Honorários tem só 3 campos, sem nenhum subgrupo nomeado
    // pela fonte (seção 12.1 da arquitetura).
    const contabilidadeCtx = { form: D.defaultContabilidadeForm(empresa), mode: "view", obrigatorios: [], invalidos: new Set(), accordionOpen: {}, snapshot: null };
    const honorariosCtx = { form: D.defaultHonorariosForm(empresa), mode: "view", obrigatorios: [], invalidos: new Set(), accordionOpen: {}, snapshot: null };

    // ===== Cronograma de Pagamento (Fase 7 —
    // docs/folha-pagamento-fase7-analise-arquitetura-cronograma.md) =====
    // 1 única Tab (D.AREAS já reservava a chave "cronograma" desde a Fase 1
    // — seção 1.2 da arquitetura) com um seletor interno de categoria
    // (Empregados/Estagiários/Contribuintes Individuais — seção 4 da
    // arquitetura), não 3 Tabs nem 3 blocos empilhados. `categoriaAtiva` é
    // estado de navegação local (qual categoria está visível agora), não um
    // dado do formulário — mesmo princípio de `accordionOpen` (não é
    // persistido, só controla o que é exibido). `cronogramaCtx.form` guarda
    // os 3 conjuntos de dados INDEPENDENTES (`empregados`/`estagiarios`/
    // `contribuintes`), cada um com sua própria tabela de 6 eventos fixos —
    // trocar a categoria ativa nunca lê nem escreve o form de outra
    // categoria (isolamento de estado, seção 12 do relatório desta tarefa).
    const cronogramaCtx = { form: D.defaultCronogramaForm(empresa), mode: "view", obrigatorios: [], invalidos: new Set(), accordionOpen: {}, categoriaAtiva: "empregados", snapshot: null };

    // Obrigatoriedade (decisões 4/5 da análise revistas nesta tarefa): a
    // regra de bloqueio agora é real, mas segue a mesma matriz Base/
    // Condicional já aprovada — nenhum campo novo se torna obrigatório.
    // `obrigatoriosRenderizados` é reconstruído a cada render() com apenas
    // os campos que a árvore de condRule realmente tornou aplicáveis nesse
    // momento (um campo dependente de um gatilho desligado nunca entra
    // nesta lista, porque a função de campo correspondente nem é chamada).
    // `camposInvalidos` só é populado depois de uma tentativa de
    // salvamento com pendências — nunca antes disso, para não mostrar erro
    // antes do usuário tentar salvar.
    let obrigatoriosRenderizados = [];
    let camposInvalidos = new Set();

    // Mapeia o prefixo do path para as chaves de accordion (nível 1 e,
    // quando existir, nível 2) que precisam estar abertas para revelar
    // aquele campo — usado só para abrir automaticamente os grupos com
    // pendência ao tentar salvar (mesmo princípio já usado em Convenção).
    function accordionKeysParaCampo(path) {
      if (path.indexOf("esocial.envioGeral") === 0) return ["esocial"];
      if (path.indexOf("esocial.faseamento") === 0) return ["esocial", "esFaseamento"];
      if (path.indexOf("esocial.sst") === 0) return ["esocial", "esSst"];
      if (path.indexOf("esocial.dadosCadastraisTributarios") === 0 || path.indexOf("esocial.contratacoesPCD") === 0 || path.indexOf("esocial.orgaosPublicos") === 0) return ["esocial", "esDadosCadastrais"];
      if (path.indexOf("calculo.") === 0) return ["calculo"];
      if (path.indexOf("unidadeCalculo.") === 0) return ["unidadeCalculo"];
      if (path.indexOf("personaliza.opcoesGeral") === 0) return ["personaliza", "pzOpcoesGeral"];
      if (path.indexOf("personaliza.dsr") === 0) return ["personaliza", "pzDsr"];
      if (path.indexOf("personaliza.salarioFamilia") === 0) return ["personaliza", "pzSalarioFamilia"];
      if (path.indexOf("personaliza.encargos") === 0) return ["personaliza", "pzEncargos"];
      if (path.indexOf("personaliza.rescisaoGeral") === 0 || path.indexOf("personaliza.rescisaoDataPagamento") === 0) return ["personaliza", "pzRescisao"];
      if (path.indexOf("personaliza.avisoPrevio") === 0) return ["personaliza", "pzAvisoPrevio"];
      if (path.indexOf("personaliza.covid19") === 0) return ["personaliza", "pzCovid19"];
      if (path.indexOf("personaliza.afastamentos") === 0) return ["personaliza", "pzAfastamentos"];
      if (path.indexOf("personaliza.horaNoturna") === 0) return ["personaliza", "pzHoraNoturna"];
      if (path.indexOf("personaliza.contribuicoesSindicato") === 0) return ["personaliza", "pzContribuicoesSindicato"];
      if (path.indexOf("personaliza.outrosApi") === 0) return ["personaliza", "pzOutrosApi"];
      return [];
    }

    // eSocial aberto por padrão (1º grupo relevante — decisão 6); demais
    // Accordions (de primeiro nível e os aninhados de Personaliza) começam
    // fechados. O estado é preservado durante toda a interação porque vive
    // neste objeto, não é recalculado a cada render().
    const accordionOpen = {
      esocial: true,
      esFaseamento: false,
      esSst: false,
      esDadosCadastrais: false,
      calculo: false,
      unidadeCalculo: false,
      personaliza: false,
      pzOpcoesGeral: false,
      pzDsr: false,
      pzSalarioFamilia: false,
      pzEncargos: false,
      pzRescisao: false,
      pzAvisoPrevio: false,
      pzCovid19: false,
      pzAfastamentos: false,
      pzHoraNoturna: false,
      pzContribuicoesSindicato: false,
      pzOutrosApi: false,
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

    // ===== Snapshot de edição — correção transversal do comportamento de
    // "Cancelar" (diagnóstico prévio: Cancelar limpava só `invalidos`/`mode`,
    // sem nunca restaurar `ctx.form`). Opção A do diagnóstico: o snapshot é
    // capturado uma única vez, no momento em que o usuário entra em modo de
    // edição — nunca a cada alteração de campo, nunca a cada render(), nunca
    // ao cancelar. `ctx.form` é sempre um objeto de dados serializável (sem
    // funções/DOM/Date — confirmado em todos os defaultXxxForm() de
    // data.js), por isso um round-trip JSON é um deep clone real e
    // suficiente, sem precisar de uma lib externa.
    //
    // Ponto central único, reaproveitado pelas 8 áreas que usam o padrão de
    // objeto `ctx` (Regime/Arredondamento/Adiantamento/13º Salário/Férias/
    // Contabilidade/Honorários/Cronograma). Geral não usa `ctx` (é anterior a
    // esse padrão — variáveis soltas `form`/`mode`/`camposInvalidos`), por
    // isso seus 3 handlers (linhas em wireEvents()) chamam `deepClone`
    // diretamente sobre `formSnapshot`, em vez destes 3 helpers — mesmo
    // mecanismo de clone, sem forçar Geral a adotar um objeto `ctx` só para
    // esta correção (fora do escopo desta tarefa).
    //
    // Nenhum destes helpers cria lógica especial para condicionais: restaurar
    // `ctx.form` e chamar render() é suficiente — condRule()/os ternários de
    // cada montaXxx() já reavaliam a árvore inteira a partir do `ctx.form`
    // atual a cada render() (mesma conclusão do diagnóstico, seção 6).
    function deepClone(obj) {
      return obj == null ? obj : JSON.parse(JSON.stringify(obj));
    }
    // Chamado pelo handler de "Editar" de cada área — captura o estado
    // existente ANTES de qualquer mutação decorrente da edição.
    function iniciarEdicaoCtx(ctx) {
      ctx.snapshot = deepClone(ctx.form);
      ctx.invalidos = new Set();
      ctx.mode = "edit";
    }
    // Chamado pelo handler de "Cancelar" de cada área — restaura exatamente
    // o estado capturado por iniciarEdicaoCtx(), depois descarta o snapshot
    // (não deve sobrar nenhum snapshot "velho" restaurável após este ponto).
    function cancelarEdicaoCtx(ctx) {
      if (ctx.snapshot) ctx.form = ctx.snapshot;
      ctx.snapshot = null;
      ctx.invalidos = new Set();
      ctx.mode = "view";
    }
    // Chamado pelo handler de "Salvar" de cada área, só no ramo de sucesso
    // (sem pendências) — o estado recém-salvo passa a ser a nova referência;
    // o snapshot da sessão de edição que acabou de ser confirmada não deve
    // permanecer disponível para um Cancelar futuro.
    //
    // Integração do Histórico Real (P24, Pacote 5 —
    // docs/folha-pagamento-fase8-p24-projeto-tecnico-historico-real.md,
    // exceção D-8): `area`/`schema`/`ctxExtra` são opcionais e só usados
    // para calcular e registrar o evento de Histórico — nenhuma linha
    // abaixo desta adição foi tocada. O diff é calculado ANTES de
    // `ctx.snapshot` ser zerado (ANTES = ctx.snapshot, DEPOIS = ctx.form,
    // exatamente como já validado no Pacote 4), e só gera evento real
    // quando há ao menos 1 alteração — nenhum evento é criado quando não
    // há `ctx.snapshot` (nunca esteve em edição) ou quando o diff é vazio.
    function confirmarSalvamentoCtx(ctx, area, schema, ctxExtra) {
      if (ctx.snapshot && schema) {
        const alteracoes = FolhaHistoricoDiff.diffArea(ctx.snapshot, ctx.form, schema, ctxExtra);
        if (alteracoes.length) FolhaHistoricoEventos.registrarEventoHistoricoFolha(empresa.codigo, area, alteracoes);
      }
      ctx.snapshot = null;
      ctx.invalidos = new Set();
      ctx.mode = "view";
    }

    // ===== Helpers de campo (view + edit) — mesmo padrão de
    // prototype/sindicatos/js/convencao-detail.js =====
    function campoView(label, valueHtml, wide) {
      return '<div class="detail-field' + (wide ? " detail-field-wide" : "") + '"><span class="detail-field-label">' + label + '</span><div class="detail-field-value">' + valueHtml + "</div></div>";
    }
    function campoEdit(label, inputHtml, wide, obrigatorio, erroTexto) {
      return (
        '<div class="detail-field' + (wide ? " detail-field-wide" : "") + '"><span class="detail-field-label">' + label + (obrigatorio ? ' <span class="text-muted">*</span>' : "") + "</span>" +
        inputHtml +
        (erroTexto ? '<span class="text-xs" style="color:var(--destructive-text);">' + erroTexto + "</span>" : "") +
        "</div>"
      );
    }
    function vazio() {
      return '<span class="italic text-muted">—</span>';
    }
    function formatMonth(v) {
      if (!v) return "";
      const parts = v.split("-");
      return parts.length === 2 ? parts[1] + "/" + parts[0] : v;
    }
    // Registra este campo como obrigatório-aplicável-agora (só chamado
    // quando a própria função de campo é chamada, ou seja, só quando o
    // condRule que o envolve — se houver — já deixou o campo visível) e
    // devolve a mensagem de erro, se esse campo específico falhou numa
    // tentativa de salvamento anterior.
    function registrarObrigatorio(path, label, opts) {
      if (opts.obrigatorio) obrigatoriosRenderizados.push({ path, label });
      return camposInvalidos.has(path) ? "Campo obrigatório." : "";
    }
    function textField(label, path, opts) {
      opts = opts || {};
      const value = getPath(form, path);
      if (mode === "view") return campoView(label, value ? value : vazio(), opts.wide);
      const erro = registrarObrigatorio(path, label, opts);
      return campoEdit(
        label,
        '<input class="field-input"' + (erro ? ' aria-invalid="true"' : "") + ' data-path="' + path + '" value="' + (value || "").toString().replace(/"/g, "&quot;") + '" placeholder="' + (opts.placeholder || "") + '" />',
        opts.wide,
        opts.obrigatorio,
        erro
      );
    }
    function selectField(label, path, options, opts) {
      opts = opts || {};
      const value = getPath(form, path);
      if (mode === "view") return campoView(label, value ? value : vazio(), opts.wide);
      const erro = registrarObrigatorio(path, label, opts);
      const optsHtml = options.map((o) => '<option value="' + o + '"' + (value === o ? " selected" : "") + ">" + o + "</option>").join("");
      return campoEdit(
        label,
        '<div class="field-select-wrap"><select class="field-select"' + (erro ? ' aria-invalid="true"' : "") + ' data-path="' + path + '"><option value="">Selecione...</option>' + optsHtml + "</select><span class=\"chev\">" + Icon("chevron-down", "size-4") + "</span></div>",
        opts.wide,
        opts.obrigatorio,
        erro
      );
    }
    function radioField(label, path, options, opts) {
      opts = opts || {};
      const value = getPath(form, path);
      if (mode === "view") return campoView(label, value ? value : vazio(), opts.wide);
      const erro = registrarObrigatorio(path, label, opts);
      const itemsHtml = options
        .map((o) => '<label class="uradio" data-path="' + path + '" data-value="' + o + '"><span class="uradio-dot' + (value === o ? " is-checked" : "") + '"></span><span class="uradio-label">' + o + "</span></label>")
        .join("");
      return campoEdit(label, '<div class="uradio-group' + (opts.row ? " is-row" : "") + '">' + itemsHtml + "</div>", opts.wide, opts.obrigatorio, erro);
    }
    // Campos "(MM/AAAA)" da especificação usam o Date Picker padrão do
    // Design System (shared/js/ui.js — UI.initDatePicker), na variação
    // granularity:"month" (evoluída para esta trilha; ver ui.js), em vez de
    // um <input type="month"> nativo — mesmo componente/trigger/painel já
    // usado em Sócios e no Histórico da Convenção, só trocando a grade de
    // dias por uma grade de meses. Ver relatório desta tarefa para a
    // justificativa completa dessa evolução do componente compartilhado.
    function monthField(label, path, opts) {
      opts = opts || {};
      const value = getPath(form, path);
      if (mode === "view") return campoView(label, value ? formatMonth(value) : vazio(), opts.wide);
      const erro = registrarObrigatorio(path, label, opts);
      return campoEdit(
        label,
        '<div class="date-picker" data-path="' + path + '">' +
          '<button type="button" class="date-picker-trigger' + (value ? "" : " is-empty") + '"' + (erro ? ' aria-invalid="true"' : "") + ">" +
          '<span class="date-picker-icon"></span>' +
          '<span class="date-picker-label">' + (value ? formatMonth(value) : "Selecione o mês") + "</span>" +
          "</button>" +
          '<div class="date-picker-panel">' +
          '<div class="date-picker-header">' +
          '<button type="button" class="date-picker-nav-btn" data-nav="prev" aria-label="Ano anterior"></button>' +
          '<span class="date-picker-caption"></span>' +
          '<button type="button" class="date-picker-nav-btn" data-nav="next" aria-label="Próximo ano"></button>' +
          "</div>" +
          '<div class="date-picker-grid"></div>' +
          "</div></div>",
        opts.wide,
        opts.obrigatorio,
        erro
      );
    }
    function horaField(label, path, opts) {
      opts = opts || {};
      const value = getPath(form, path);
      if (mode === "view") return campoView(label, value ? value : vazio(), opts.wide);
      const erro = registrarObrigatorio(path, label, opts);
      return campoEdit(label, '<input type="time" class="field-input"' + (erro ? ' aria-invalid="true"' : "") + ' data-path="' + path + '" value="' + (value || "") + '" />', opts.wide, opts.obrigatorio, erro);
    }
    function checkboxField(path, label, hint) {
      const checked = !!getPath(form, path);
      if (mode === "view") {
        return (
          '<div class="flex items-center gap-2 text-sm">' +
          (checked ? '<span style="color:var(--success-text);display:flex;">' + Icon("circle-check", "size-4") + "</span>" : '<span class="text-muted">' + Icon("circle-x", "size-4") + "</span>") +
          "<span" + (checked ? "" : ' class="text-muted"') + ">" + label + "</span></div>"
        );
      }
      return '<label class="ucheckbox" data-path="' + path + '"><span class="ucheckbox-box' + (checked ? " is-checked" : "") + '">' + Icon("check", "size-4") + '</span><span class="ucheckbox-label">' + label + (hint ? '<span class="ucheckbox-hint">' + hint + "</span>" : "") + "</span></label>";
    }
    // Agrupa uma regra-mãe com o(s) campo(s) que ela habilita — mesmo padrão
    // já consolidado em Sindicato/Convenção (prototype/sindicatos/js/convencao-detail.js).
    function condRule(triggerHtml, dependentHtml) {
      const ativo = !!dependentHtml;
      return '<div class="condrule' + (ativo ? " is-active" : "") + '">' + triggerHtml + (dependentHtml ? '<div class="condrule-dependent">' + dependentHtml + "</div>" : "") + "</div>";
    }
    // Lista de checkboxes independentes (sem dependente) — usada nos
    // subgrupos majoritariamente opcionais/informativos (DSR, Salário
    // Família, Contribuições ao Sindicato etc.), sem envolver cada um em um
    // condRule que não teria nenhuma configuração dependente para mostrar.
    function checklist(items) {
      return '<div class="flex flex-col gap-2">' + items.map(([p, l]) => checkboxField(p, l)).join("") + "</div>";
    }
    function secao(titulo, camposHtml) {
      return '<div class="detail-section"><h3 class="detail-section-title">' + titulo + '</h3><div class="detail-grid">' + camposHtml + "</div></div>";
    }
    // Grid de campos sem título de seção próprio — usada dentro de um item de
    // Accordion aninhado (o título já vem do próprio accordion-trigger; repetir
    // o nome como .detail-section-title logo abaixo seria redundante).
    function campoGrid(camposHtml) {
      return '<div class="detail-grid">' + camposHtml + "</div>";
    }
    // Botão de ação prevista na especificação (tipo "Botão") sem fluxo
    // funcional nesta fase — mesmo tratamento de ação-exemplo já usado em
    // prototype/parametros-fiscais/js/fiscal-page.js (renderAlertaCard).
    function botaoForaDeEscopo(label, motivo) {
      if (mode === "view") return "";
      return '<button type="button" class="btn btn-outline btn-sm" disabled title="' + motivo + '" style="align-self:flex-start;">' + label + "</button>";
    }
    function accordionItem(key, titulo, contentHtml, badgeHtml) {
      const aberto = accordionOpen[key];
      return (
        '<div class="accordion-item' + (aberto ? " is-open" : "") + '">' +
        '<button type="button" class="accordion-trigger" data-accordion-toggle="' + key + '">' +
        '<span class="accordion-trigger-title">' + titulo + (badgeHtml || "") + "</span>" +
        '<span class="accordion-trigger-chev">' + Icon("chevron-down", "size-4") + "</span>" +
        "</button>" +
        '<div class="accordion-content">' + contentHtml + "</div></div>"
      );
    }

    // ===== Fábrica de helpers de campo para Regime =====
    // Mesma lógica/regras/markup dos helpers de "Geral" acima (campoView,
    // campoEdit, textField, selectField, checkboxField, condRule, checklist,
    // secao, accordionItem) — reproduzida aqui via fábrica, parametrizada por
    // um `ctx` (form/mode/obrigatorios/invalidos/accordionOpen) em vez de
    // fechar sobre `form`/`mode` fixos do módulo. É a mesma implementação de
    // validação (nenhuma regra nova — decisão 1 da arquitetura de Regime:
    // decisão 7 da Fase 1 estendida sem alteração), só generalizada para que
    // Regime tenha estado próprio sem tocar em nenhuma das funções de Geral
    // acima (que continuam fechando sobre `form`/`mode` exatamente como
    // antes — zero risco de regressão em Geral). `monthField`/`radioField`/
    // `horaField`/`botaoForaDeEscopo` não têm equivalente aqui porque nenhum
    // campo do inventário de Regime (seção 2 da arquitetura) usa esses tipos.
    function makeCamposHelpers(ctx) {
      function getPath(obj, path) {
        return path.split(".").reduce((o, k) => (o == null ? o : o[k]), obj);
      }
      function setPath(obj, path, value) {
        const keys = path.split(".");
        let o = obj;
        for (let i = 0; i < keys.length - 1; i++) o = o[keys[i]];
        o[keys[keys.length - 1]] = value;
      }
      function campoView(label, valueHtml, wide) {
        return '<div class="detail-field' + (wide ? " detail-field-wide" : "") + '"><span class="detail-field-label">' + label + '</span><div class="detail-field-value">' + valueHtml + "</div></div>";
      }
      function campoEdit(label, inputHtml, wide, obrigatorio, erroTexto) {
        return (
          '<div class="detail-field' + (wide ? " detail-field-wide" : "") + '"><span class="detail-field-label">' + label + (obrigatorio ? ' <span class="text-muted">*</span>' : "") + "</span>" +
          inputHtml +
          (erroTexto ? '<span class="text-xs" style="color:var(--destructive-text);">' + erroTexto + "</span>" : "") +
          "</div>"
        );
      }
      function vazio() {
        return '<span class="italic text-muted">—</span>';
      }
      function registrarObrigatorio(path, label, opts) {
        if (opts.obrigatorio) ctx.obrigatorios.push({ path, label });
        return ctx.invalidos.has(path) ? "Campo obrigatório." : "";
      }
      function textField(label, path, opts) {
        opts = opts || {};
        const value = getPath(ctx.form, path);
        if (ctx.mode === "view") return campoView(label, value ? value : vazio(), opts.wide);
        const erro = registrarObrigatorio(path, label, opts);
        return campoEdit(
          label,
          '<input class="field-input"' + (erro ? ' aria-invalid="true"' : "") + ' data-path="' + path + '" value="' + (value || "").toString().replace(/"/g, "&quot;") + '" placeholder="' + (opts.placeholder || "") + '" />',
          opts.wide,
          opts.obrigatorio,
          erro
        );
      }
      function selectField(label, path, options, opts) {
        opts = opts || {};
        const value = getPath(ctx.form, path);
        if (ctx.mode === "view") return campoView(label, value ? value : vazio(), opts.wide);
        const erro = registrarObrigatorio(path, label, opts);
        const optsHtml = options.map((o) => '<option value="' + o + '"' + (value === o ? " selected" : "") + ">" + o + "</option>").join("");
        return campoEdit(
          label,
          '<div class="field-select-wrap"><select class="field-select"' + (erro ? ' aria-invalid="true"' : "") + ' data-path="' + path + '"><option value="">Selecione...</option>' + optsHtml + "</select><span class=\"chev\">" + Icon("chevron-down", "size-4") + "</span></div>",
          opts.wide,
          opts.obrigatorio,
          erro
        );
      }
      function checkboxField(path, label, hint) {
        const checked = !!getPath(ctx.form, path);
        if (ctx.mode === "view") {
          return (
            '<div class="flex items-center gap-2 text-sm">' +
            (checked ? '<span style="color:var(--success-text);display:flex;">' + Icon("circle-check", "size-4") + "</span>" : '<span class="text-muted">' + Icon("circle-x", "size-4") + "</span>") +
            "<span" + (checked ? "" : ' class="text-muted"') + ">" + label + "</span></div>"
          );
        }
        return '<label class="ucheckbox" data-path="' + path + '"><span class="ucheckbox-box' + (checked ? " is-checked" : "") + '">' + Icon("check", "size-4") + '</span><span class="ucheckbox-label">' + label + (hint ? '<span class="ucheckbox-hint">' + hint + "</span>" : "") + "</span></label>";
      }
      // Adicionado nesta fábrica pela Fase 4 (Adiantamento > "Base de
      // Cálculo") — mesmo markup/comportamento do `radioField` de nível de
      // módulo já usado por Geral, só parametrizado por `ctx` como os
      // demais helpers acima. Nenhum campo de Regime/Arredondamento
      // precisava de radio, por isso a fábrica não tinha esse helper até
      // agora — evolução aditiva, não uma reescrita do padrão existente.
      function radioField(label, path, options, opts) {
        opts = opts || {};
        const value = getPath(ctx.form, path);
        if (ctx.mode === "view") return campoView(label, value ? value : vazio(), opts.wide);
        const erro = registrarObrigatorio(path, label, opts);
        const itemsHtml = options
          .map((o) => '<label class="uradio" data-path="' + path + '" data-value="' + o + '"><span class="uradio-dot' + (value === o ? " is-checked" : "") + '"></span><span class="uradio-label">' + o + "</span></label>")
          .join("");
        return campoEdit(label, '<div class="uradio-group' + (opts.row ? " is-row" : "") + '">' + itemsHtml + "</div>", opts.wide, opts.obrigatorio, erro);
      }
      // Idem — mesmo padrão de `botaoForaDeEscopo()` de nível de módulo
      // (Geral > Personaliza > "Configurar rubricas..."), parametrizado por
      // `ctx`. Usado pelos campos "Checkbox + Botão" de 13º Salário > Geral
      // (ex.: "Desconsiderar os afastamentos para o cálculo dos dias de
      // direito") — mesmo tratamento de ação-exemplo sem fluxo funcional
      // nesta fase.
      function botaoForaDeEscopo(label, motivo) {
        if (ctx.mode === "view") return "";
        return '<button type="button" class="btn btn-outline btn-sm" disabled title="' + motivo + '" style="align-self:flex-start;">' + label + "</button>";
      }
      function condRule(triggerHtml, dependentHtml) {
        const ativo = !!dependentHtml;
        return '<div class="condrule' + (ativo ? " is-active" : "") + '">' + triggerHtml + (dependentHtml ? '<div class="condrule-dependent">' + dependentHtml + "</div>" : "") + "</div>";
      }
      function checklist(items) {
        return '<div class="flex flex-col gap-2">' + items.map(([p, l]) => checkboxField(p, l)).join("") + "</div>";
      }
      function secao(titulo, camposHtml) {
        return '<div class="detail-section"><h3 class="detail-section-title">' + titulo + '</h3><div class="detail-grid">' + camposHtml + "</div></div>";
      }
      function campoGrid(camposHtml) {
        return '<div class="detail-grid">' + camposHtml + "</div>";
      }
      function accordionItem(key, titulo, contentHtml, badgeHtml) {
        const aberto = ctx.accordionOpen[key];
        return (
          '<div class="accordion-item' + (aberto ? " is-open" : "") + '">' +
          '<button type="button" class="accordion-trigger" data-accordion-toggle="' + key + '">' +
          '<span class="accordion-trigger-title">' + titulo + (badgeHtml || "") + "</span>" +
          '<span class="accordion-trigger-chev">' + Icon("chevron-down", "size-4") + "</span>" +
          "</button>" +
          '<div class="accordion-content">' + contentHtml + "</div></div>"
        );
      }
      return { getPath, setPath, textField, selectField, checkboxField, radioField, botaoForaDeEscopo, condRule, checklist, secao, campoGrid, accordionItem };
    }

    const RH = makeCamposHelpers(regimeCtx);
    // Reaproveita a mesma fábrica de Regime para Arredondamento — só o
    // `checkboxField` é usado diretamente (grupo "Calcula arredondamento
    // para"); a tabela em si (montaTabelaArredondamento(), abaixo) tem
    // markup próprio de célula, fora do padrão campoView/campoEdit (decisão
    // 6 da arquitetura: composição local, evoluindo o padrão de
    // `convencao-detail.js`, não uma reconstrução via helpers de campo
    // único).
    const AH = makeCamposHelpers(arredCtx);
    const AD = makeCamposHelpers(adiantamentoCtx);
    const DT = makeCamposHelpers(decimoTerceiroCtx);
    const FH = makeCamposHelpers(feriasCtx);
    const CH = makeCamposHelpers(contabilidadeCtx);
    const HH = makeCamposHelpers(honorariosCtx);
    const CRH = makeCamposHelpers(cronogramaCtx);

    // Dependentes puramente booleanos dos 3 pares condicionais de Férias em
    // que a arquitetura (seção 5) classifica o próprio checkbox dependente
    // como a obrigatoriedade, sem nenhum campo numérico/texto adicional
    // (#11, #13, #23) — diferente de todos os pares Condicional já
    // implementados nas 4 fases anteriores, que sempre tinham um campo
    // numérico/texto/select como dependente. `checkboxField()` (fábrica
    // `makeCamposHelpers()`, compartilhada com regimeCtx/arredCtx/
    // adiantamentoCtx/decimoTerceiroCtx) não tem parâmetro de obrigatoriedade
    // porque nenhuma área anterior precisou disso — alterar a fábrica
    // compartilhada para acrescentar esse parâmetro arriscaria regressão nas
    // 4 áreas já congeladas, o que está fora do escopo desta tarefa. Em vez
    // disso, este helper LOCAL (só usado por Férias) reaproveita
    // `FH.checkboxField()` tal como já existe e apenas acrescenta (a) o
    // registro em `feriasCtx.obrigatorios` (mesmo mecanismo de bloqueio já
    // usado por todos os outros campos obrigatórios) e (b) um texto de erro
    // com a mesma classe/token de cor já usados por `campoEdit()` — nenhum
    // componente novo, nenhuma alteração ao Design System.
    function checkboxCondicional(path, label) {
      if (feriasCtx.mode === "edit") feriasCtx.obrigatorios.push({ path, label });
      const erro = feriasCtx.invalidos.has(path);
      let html = FH.checkboxField(path, label);
      if (erro) {
        // Pós-processamento aditivo do HTML já retornado por
        // FH.checkboxField() — não altera a fábrica compartilhada
        // (checkboxField() em si, usada por todas as demais áreas,
        // permanece intocada). Marca o controle como inválido
        // semanticamente (aria-invalid no <label> que atua como o
        // controle interativo) e acrescenta a classe local `.is-invalid`
        // só ao `.ucheckbox-box`, para acionar o realce visual definido em
        // components.css sem afetar `.ucheckbox`/`.ucheckbox-box` normais.
        html = html.replace('<label class="ucheckbox" data-path="' + path + '">', '<label class="ucheckbox" data-path="' + path + '" aria-invalid="true">').replace('class="ucheckbox-box', 'class="ucheckbox-box is-invalid');
      }
      return html + (erro ? '<span class="text-xs" style="color:var(--destructive-text); display:block; margin-left:28px;">Campo obrigatório.</span>' : "");
    }

    // ===== eSocial =====
    function montaEsocial() {
      const e = form.esocial;
      // "Gerar eSocial" é o gatilho-mãe de toda a aba (matriz de dependências,
      // seção 5 da análise): quando desmarcado, os demais campos ficam
      // bloqueados — aqui representado ocultando-os e explicando o motivo,
      // em vez de exibi-los desabilitados.
      const habilitado = e.envioGeral.gerarESocial;

      const envioGeralHtml = secao(
        "Configurações de Envio · Geral",
        checkboxField("esocial.envioGeral.gerarESocial", "Gerar eSocial") +
          (habilitado
            ? radioField("Tipo de ambiente", "esocial.envioGeral.tipoAmbiente", O.tipoAmbiente, { obrigatorio: true }) +
              selectField("Certificado digital", "esocial.envioGeral.certificadoDigital", O.certificadoDigital, { obrigatorio: true }) +
              selectField("Tipo de centralização", "esocial.envioGeral.tipoCentralizacao", O.tipoCentralizacao, { obrigatorio: true }) +
              selectField("Inscrição do transmissor — tipo", "esocial.envioGeral.inscricaoTransmissorTipo", O.tipoInscricaoTransmissor, { obrigatorio: true }) +
              textField("Inscrição do transmissor — número", "esocial.envioGeral.inscricaoTransmissorNumero", { obrigatorio: true })
            : "")
      );

      // "Contador (código/nome)" e "Empresa centralizadora (código)" são
      // condicionais ao VALOR de outro campo (Certificado digital / Tipo de
      // centralização), não a um checkbox próprio — por isso são exibidos
      // diretamente (sem envolver num condRule, que pressupõe um gatilho
      // próprio) só quando a condição correspondente é satisfeita.
      const camposCondicionaisPorValor =
        (e.envioGeral.certificadoDigital === "Contador" ? textField("Contador (código/nome)", "esocial.envioGeral.contadorCodigoNome", { obrigatorio: true }) : "") +
        (e.envioGeral.tipoCentralizacao === "Centralizada" ? textField("Empresa centralizadora (código)", "esocial.envioGeral.empresaCentralizadoraCodigo", { obrigatorio: true }) : "");

      const dependentesGerais = !habilitado
        ? ""
        : condRule(
            selectField("Empresa já enviada anteriormente", "esocial.envioGeral.empresaJaEnviada", O.simNao, {}),
            e.envioGeral.empresaJaEnviada === "Sim" ? monthField("Competência de início da utilização nesse banco de dados", "esocial.envioGeral.competenciaInicioUso", { obrigatorio: true }) : ""
          ) +
          (camposCondicionaisPorValor ? '<div class="detail-grid">' + camposCondicionaisPorValor + "</div>" : "") +
          condRule(
            checkboxField("esocial.envioGeral.naoEnviarEventos.ativo", "Não enviar eventos ao eSocial a partir de"),
            e.envioGeral.naoEnviarEventos.ativo ? monthField("A partir de", "esocial.envioGeral.naoEnviarEventos.data", { obrigatorio: true }) : ""
          ) +
          checklist([["esocial.envioGeral.possuiCentralizadoraOutroBanco", "Possui a empresa centralizadora em outro banco de dados"]]);

      if (!habilitado) {
        return (
          envioGeralHtml +
          '<div class="flex items-start gap-2" style="margin-top:4px;">' +
          '<span style="color:var(--muted-foreground);flex-shrink:0;margin-top:1px;">' + Icon("info", "size-3-5") + "</span>" +
          '<span class="text-xs text-muted">Habilite "Gerar eSocial" para configurar Faseamento, SST, dados cadastrais/tributários, Contratações (PCD) e Órgãos Públicos.</span>' +
          "</div>"
        );
      }

      // A partir daqui, os subgrupos restantes de eSocial vivem num Accordion
      // aninhado (mesmo princípio visual de Personaliza — ver .accordion-nested
      // em components.css), reduzindo a densidade inicial: só "Configurações de
      // Envio · Geral" (acima, com o gatilho-mãe "Gerar eSocial") permanece
      // sempre visível como conteúdo de entrada da aba.
      //
      // Diferente de Personaliza (11 itens de tamanho comparável), aqui os
      // dois subgrupos menores da especificação — "Contratações (PCD)" (2
      // campos) e "Órgãos Públicos" (1 campo) — foram reunidos dentro do
      // item "Dados Cadastrais e Tributários" em vez de ganharem um item de
      // Accordion próprio: mecanicamente replicar o padrão de Personaliza
      // aqui criaria dois itens de accordion de 1-2 campos, o que a própria
      // decisão 6 da arquitetura já veda ("não criar Accordion para
      // agrupamentos excessivamente pequenos"). Cada subgrupo original
      // preserva seu próprio título (`secao()`) dentro do item combinado —
      // nenhum campo, nome ou dependência foi alterado, apenas o container
      // visual que os agrupa.
      const faseamentoNested = accordionItem(
        "esFaseamento",
        "Faseamento",
        campoGrid(
          selectField("Faseamento", "esocial.faseamento.faseamento", O.faseamento, { obrigatorio: true }) +
            monthField("Tabela (data)", "esocial.faseamento.tabelaData", { obrigatorio: true }) +
            monthField("Não periódicos (data)", "esocial.faseamento.naoPeriodicosData", { obrigatorio: true }) +
            monthField("Periódicos (data)", "esocial.faseamento.periodicosData", { obrigatorio: true }) +
            monthField("Saúde e Segurança no Trabalho — SST (data)", "esocial.faseamento.sstData", { obrigatorio: true })
        ) +
          condRule(
            checkboxField("esocial.faseamento.possuiRPPS", "Possui empregado com Regime Próprio de Previdência Social — RPPS"),
            e.faseamento.possuiRPPS ? monthField("Periódicos — RPPS (data)", "esocial.faseamento.periodicosRPPSData", { obrigatorio: true }) : ""
          ) +
          condRule(
            checkboxField("esocial.faseamento.naoEnviarNaoPeriodicosAuto.ativo", "Não enviar automaticamente os eventos não periódicos a partir de"),
            e.faseamento.naoEnviarNaoPeriodicosAuto.ativo ? monthField("A partir de", "esocial.faseamento.naoEnviarNaoPeriodicosAuto.data", { obrigatorio: true }) : ""
          )
      );

      const sstNested = accordionItem(
        "esSst",
        "SST",
        condRule(
          checkboxField("esocial.sst.naoEnviarSST.ativo", "Não enviar eventos de SST ao eSocial pelo módulo folha a partir de"),
          e.sst.naoEnviarSST.ativo ? monthField("A partir de", "esocial.sst.naoEnviarSST.data", { obrigatorio: true }) : ""
        ) +
          condRule(
            checkboxField("esocial.sst.vincularOutroResponsavel", "Vincular outro responsável para o envio dos eventos de SST"),
            e.sst.vincularOutroResponsavel
              ? radioField("Certificado do Responsável de SST / Certificado da Empresa", "esocial.sst.certificadoResponsavel", O.certificadoResponsavelSst, { obrigatorio: true }) +
                textField("Código do Responsável", "esocial.sst.codigoResponsavel", { obrigatorio: true }) +
                checklist([
                  ["esocial.sst.eventos.s2210", "S-2210 — Comunicação de Acidente de Trabalho"],
                  ["esocial.sst.eventos.s2220", "S-2220 — Monitoramento da Saúde do Trabalhador"],
                  ["esocial.sst.eventos.s2221", "S-2221 — Exame Toxicológico do Motorista Profissional"],
                  ["esocial.sst.eventos.s2240", "S-2240 — Condições Ambientais do Trabalho (Agentes Nocivos)"],
                ])
              : ""
          )
      );

      const dadosCadastraisNested = accordionItem(
        "esDadosCadastrais",
        "Dados Cadastrais e Tributários",
        secao(
          "Dados cadastrais/tributários",
          selectField("Classificação tributária", "esocial.dadosCadastraisTributarios.classificacaoTributaria", O.classificacaoTributaria, { obrigatorio: true }) +
            selectField("Cooperativa", "esocial.dadosCadastraisTributarios.cooperativa", O.simNao, { obrigatorio: true }) +
            selectField("Produtor rural", "esocial.dadosCadastraisTributarios.produtorRural", O.simNao, { obrigatorio: true }) +
            selectField("Entidade sem fins lucrativos", "esocial.dadosCadastraisTributarios.entidadeSemFins", O.simNao, { obrigatorio: true }) +
            selectField("Empresa de trabalho temporário", "esocial.dadosCadastraisTributarios.empresaTrabalhoTemporario", O.simNao, { obrigatorio: true }) +
            selectField("Calcula FUNRURAL sobre a folha de pagamento", "esocial.dadosCadastraisTributarios.calculaFunrural", O.simNao, { obrigatorio: true }) +
            textField("Construtora", "esocial.dadosCadastraisTributarios.construtora") +
            textField("Entidade Educativa/Prática Desportiva (Aprendiz)", "esocial.dadosCadastraisTributarios.entidadeEducativa") +
            textField("Número de registro no Ministério do Trabalho", "esocial.dadosCadastraisTributarios.numeroRegistroMTE") +
            textField("Optou pelo registro eletrônico de empregados", "esocial.dadosCadastraisTributarios.optouRegistroEletronico") +
            textField("Possui acordo internacional para isenção de multa", "esocial.dadosCadastraisTributarios.possuiAcordoInternacional") +
            textField("Utiliza Módulo Web Simplificado ME e EPP", "esocial.dadosCadastraisTributarios.utilizaModuloWebSimplificado")
        ) +
          condRule(
            checkboxField("esocial.dadosCadastraisTributarios.geraESocialDomestico", "Gera eSocial doméstico"),
            e.dadosCadastraisTributarios.geraESocialDomestico
              ? textField("Tipo de acesso", "esocial.dadosCadastraisTributarios.tipoAcesso", { obrigatorio: true }) +
                textField("Código de acesso", "esocial.dadosCadastraisTributarios.codigoAcesso", { obrigatorio: true }) +
                textField("Senha", "esocial.dadosCadastraisTributarios.senha", { obrigatorio: true })
              : ""
          ) +
          condRule(
            checkboxField("esocial.dadosCadastraisTributarios.possuiSituacaoEspecial", "Possui situação especial"),
            e.dadosCadastraisTributarios.possuiSituacaoEspecial ? textField("Situação", "esocial.dadosCadastraisTributarios.situacao", { obrigatorio: true }) : ""
          ) +
          secao(
            "Contratações (PCD)",
            selectField("Contratação de pessoa com deficiência", "esocial.contratacoesPCD.contratacaoPCD", O.contratacaoPcd, { obrigatorio: true }) + textField("Número do processo", "esocial.contratacoesPCD.numeroProcesso")
          ) +
          secao("Órgãos Públicos", textField("CNPJ Ente Federativo Responsável", "esocial.orgaosPublicos.cnpjEnteFederativo"))
      );

      const subgruposNested = '<div class="accordion accordion-nested">' + faseamentoNested + sstNested + dadosCadastraisNested + "</div>";

      return envioGeralHtml + dependentesGerais + subgruposNested;
    }

    // ===== Cálculo =====
    function montaCalculo() {
      const c = form.calculo;
      return (
        secao(
          "Dados Gerais",
          monthField("Competência atual", "calculo.competenciaAtual", { obrigatorio: true }) +
            selectField("Tipo folha atual", "calculo.tipoFolhaAtual", O.tipoFolhaAtual, { obrigatorio: true }) +
            selectField("Discriminar DSR", "calculo.discriminarDSR", O.simNao, { obrigatorio: true }) +
            selectField("Lançamento de horas", "calculo.lancamentoHoras", O.lancamentoHoras, { obrigatorio: true }) +
            selectField("Cálculo proporcionalidade", "calculo.calculoProporcionalidade", O.calculoProporcionalidade, { obrigatorio: true }) +
            selectField("Folha de professores", "calculo.folhaProfessores", O.simNao, { obrigatorio: true }) +
            selectField("Folha semanal", "calculo.folhaSemanal", O.simNao, { obrigatorio: true }) +
            textField("Agente Público", "calculo.agentePublico")
        ) +
        condRule(
          checkboxField("calculo.usaRubricasEmpresa.ativo", "Usa rubricas da empresa (código/nome)"),
          c.usaRubricasEmpresa.ativo ? textField("Empresa de referência (código/nome)", "calculo.usaRubricasEmpresa.codigoNome", { obrigatorio: true }) : ""
        ) +
        condRule(
          checkboxField("calculo.permitirProporcionalizarCarga.ativo", "Permitir proporcionalizar a carga horária conforme alterações do cadastro do empregado a partir de"),
          c.permitirProporcionalizarCarga.ativo ? monthField("A partir de", "calculo.permitirProporcionalizarCarga.data", { obrigatorio: true }) : ""
        ) +
        condRule(
          checkboxField("calculo.efetuarCalculoDCTFWeb.ativo", "Efetuar cálculo de Tributos federais conforme DCTFWeb a partir de"),
          c.efetuarCalculoDCTFWeb.ativo ? monthField("A partir de", "calculo.efetuarCalculoDCTFWeb.data", { obrigatorio: true }) : ""
        ) +
        condRule(
          selectField("Rateio por serviço", "calculo.rateioPorServico.ativo", O.simNao, {}),
          c.rateioPorServico.ativo === "Sim" ? monthField("A partir de", "calculo.rateioPorServico.data", { obrigatorio: true }) + textField("Tipo de rateio", "calculo.rateioPorServico.tipoRateio", { obrigatorio: true }) : ""
        ) +
        checklist([
          ["calculo.calcularSalarioProporcionalAlteracao", "Calcular salário no mês da alteração salarial de forma proporcional à data da alteração"],
          ["calculo.calcularINSSMultiplosVinculos", "Calcular INSS para colaboradores com múltiplos vínculos conforme eSocial em competências anteriores a 02/2020"],
        ])
      );
    }

    // ===== Unidade de Cálculo (grupo irmão de Cálculo — decisão 2) =====
    function montaUnidadeCalculo() {
      const u = form.unidadeCalculo;
      const categorias = [
        ["mensalistas", "Mensalistas"],
        ["semanalistas", "Semanalistas"],
        ["comissionados", "Comissionados"],
        ["diaristas", "Diaristas"],
        ["tarefeiros", "Tarefeiros"],
        ["contribuintes", "Contribuintes"],
      ];
      return (
        secao("Vigência", monthField("Vigência", "unidadeCalculo.vigencia", { obrigatorio: true }) + textField("Descrição", "unidadeCalculo.descricao")) +
        condRule(
          radioField("Opções para unidade do cálculo", "unidadeCalculo.opcaoUnidade", O.opcaoUnidadeCalculo, { obrigatorio: true }),
          u.opcaoUnidade === "Conforme categoria"
            ? categorias.map(([k, l]) => textField("Unidade — " + l, "unidadeCalculo.unidadePorCategoria." + k, { obrigatorio: true })).join("")
            : ""
        )
      );
    }

    // ===== Personaliza (Accordion aninhado — único grupo com volume que justifica) =====
    function montaPersonaliza() {
      const p = form.personaliza;

      const opcoesGeral = accordionItem(
        "pzOpcoesGeral",
        "Opções Gerais",
        condRule(
          checkboxField("personaliza.opcoesGeral.limiteEstagiariosSupervisor.ativo", "Não permitir mais de [N] estagiários vinculados a um mesmo Supervisor de Estágio"),
          p.opcoesGeral.limiteEstagiariosSupervisor.ativo ? textField("Número máximo de estagiários", "personaliza.opcoesGeral.limiteEstagiariosSupervisor.numero", { obrigatorio: true }) : ""
        ) +
          condRule(
            checkboxField("personaliza.opcoesGeral.calcularDiarias.ativo", "Calcular diárias"),
            p.opcoesGeral.calcularDiarias.ativo ? textField("Considerar como remuneração", "personaliza.opcoesGeral.calcularDiarias.consideraComoRemuneracao", { obrigatorio: true, placeholder: "Ex.: Salário contratual" }) : ""
          ) +
          condRule(
            checkboxField("personaliza.opcoesGeral.naoCalcularDiariasTributaveis.ativo", "Não calcular diárias tributáveis a partir de"),
            p.opcoesGeral.naoCalcularDiariasTributaveis.ativo ? monthField("A partir de", "personaliza.opcoesGeral.naoCalcularDiariasTributaveis.data", { obrigatorio: true }) : ""
          ) +
          condRule(
            checkboxField("personaliza.opcoesGeral.configurarRubricasDescontoCompulsorio", "Configurar rubricas para serem consideradas como desconto compulsório (Empréstimo Crédito do Trabalhador)"),
            p.opcoesGeral.configurarRubricasDescontoCompulsorio ? botaoForaDeEscopo("Configurar rubricas", "Fluxo de seleção de rubricas fora do escopo desta fase") : ""
          ) +
          checklist([
            ["personaliza.opcoesGeral.naoPermitirSalarioAbaixoPiso", "Não permitir salário contratual abaixo do piso salarial"],
            ["personaliza.opcoesGeral.efetuarLancamentoRubricasPorServico", "Efetuar lançamento de rubricas por serviço"],
            ["personaliza.opcoesGeral.permitirInformarDatasFaltasParciais", "Permitir informar datas nos lançamentos de faltas parciais"],
            ["personaliza.opcoesGeral.considerarPeriodoSindicatoAlteracaoSalarial", "Considerar o período vinculado a cada sindicato para o cálculo de alteração salarial conforme CCT"],
            ["personaliza.opcoesGeral.considerarDiasMesCompetenciaInicioEstagio", "Considerar os dias do mês para cálculo da competência de início do estágio"],
            ["personaliza.opcoesGeral.permitirTipoAnaliticoSinteticoCentroCustos", "Permitir informar o tipo Analítico ou Sintético para os Centros de Custos"],
            ["personaliza.opcoesGeral.discriminarHorasCompensacaoSabado", "Discriminar as horas referentes à compensação do sábado na jornada diária"],
            ["personaliza.opcoesGeral.naoCalcularPLRDemitido", "Não calcular a folha de Participação de Lucros quando o colaborador estiver demitido"],
            ["personaliza.opcoesGeral.calcularRemuneracaoIntegralAfastamentoContribuintes", "Calcular remuneração integralmente nos meses de início e retorno do afastamento para contribuintes"],
          ])
      );

      const dsr = accordionItem(
        "pzDsr",
        "DSR (Descanso Semanal Remunerado)",
        checklist([
          ["personaliza.dsr.descontarFaltasDSRCompetenciaFalta", "Descontar as faltas de DSR na competência da data da falta"],
          ["personaliza.dsr.descontarDSRMesmaSemanaFalta", "Descontar o DSR na mesma semana da falta"],
          ["personaliza.dsr.descontarFaltasDSRDiaFolga", "Descontar as faltas de DSR conforme o dia de folga da jornada do empregado"],
          ["personaliza.dsr.naoDescontarDSRFeriados", "Não descontar o DSR quando este recai em feriados"],
          ["personaliza.dsr.considerarDSRAfastadoDoencaDireitosIntegrais", "Considerar os DSRs durante o período afastado por doença com direitos integrais"],
          ["personaliza.dsr.calcularDSRUmSextoHoristaVariavel", "Calcular para DSR o valor de 1/6 sobre a base quando horista que possui carga horária variável"],
          ["personaliza.dsr.calcularDSRUmSextoDiaristaVariavel", "Calcular para DSR o valor de 1/6 sobre a base quando diarista que possui carga horária variável"],
          ["personaliza.dsr.calcularDSRUmSextoIntermitente", "Calcular para DSR o valor de 1/6 sobre a base quando empregado com vínculo celetista intermitente"],
        ])
      );

      const salarioFamilia = accordionItem(
        "pzSalarioFamilia",
        "Salário Família",
        checklist([
          ["personaliza.salarioFamilia.naoCalcularDomesticoLicencaMaternidade", "Não calcular salário família para empregados domésticos durante o período de licença maternidade"],
          ["personaliza.salarioFamilia.calcularMesmoDescontosMaioresProventos", "Calcular salário família mesmo que os descontos sejam maiores que os proventos"],
          ["personaliza.salarioFamilia.calcularDuranteAfastamentoAusenciaJustificada", "Calcular salário família durante o afastamento por ausência justificada"],
          ["personaliza.salarioFamilia.pagarDiferenca", "Pagar diferença de Salário Família"],
          ["personaliza.salarioFamilia.naoConsiderarRetroativoCompensacao", "Não considerar Salário Família Retroativo para compensação"],
          ["personaliza.salarioFamilia.naoCalcularIntermitenteSemCalculoCompetencia", "Não calcular salário família para empregado intermitente quando na competência não possuir cálculo"],
          ["personaliza.salarioFamilia.naoCalcularDomesticoRetornoAfastamentoAte15Dias", "Não calcular salário família para empregado doméstico na competência que retornar de afastamento por Acidente/Doença igual ou inferior a 15 dias"],
          ["personaliza.salarioFamilia.naoCalcularHoristaVariavelSemCalculoCompetencia", "Não calcular salário família para empregado horista variável quando na competência não possuir cálculo"],
        ])
      );

      const encargos = accordionItem(
        "pzEncargos",
        "Encargos",
        secao("Alíquota", textField("Alíquota INSS Autônomo Cooperado conforme Ato Declaratório RFB nº 1/2017 (%)", "personaliza.encargos.aliquotaInssAutonomoCooperado", { obrigatorio: true, placeholder: "20,00" })) +
          condRule(
            selectField("Limitar o pagamento da contribuição de Terceiros a 20 salários mínimos", "personaliza.encargos.limitarContribTerceiros20SalariosMinimos.ativo", O.simNao, {}),
            p.encargos.limitarContribTerceiros20SalariosMinimos.ativo === "Sim" ? monthField("A partir de", "personaliza.encargos.limitarContribTerceiros20SalariosMinimos.data", { obrigatorio: true }) : ""
          ) +
          condRule(
            checkboxField("personaliza.encargos.calcularInss8RuralPrazoDeterminado.ativo", "Calcular INSS 8% para Trab. Rural Contrato Prazo Determinado — Lei 11.718/2008 a partir de"),
            p.encargos.calcularInss8RuralPrazoDeterminado.ativo ? monthField("A partir de", "personaliza.encargos.calcularInss8RuralPrazoDeterminado.data", { obrigatorio: true }) : ""
          ) +
          checklist([
            ["personaliza.encargos.calculaCarneLeao", "Calcula Carnê-Leão"],
            ["personaliza.encargos.naoConsiderarReducaoTerceirosMP932", "Não considerar a redução das alíquotas de terceiros do sistema S criada na MP 932"],
            ["personaliza.encargos.utilizarCpfResponsavelCarneLeaoCEI", "Utilizar o CPF do responsável legal da empresa para o Carnê-Leão quando o tipo de inscrição for CEI"],
            ["personaliza.encargos.somarEncargosComplementarNaMensalMinimo", "Somar os encargos da folha complementar na folha mensal quando forem inferiores ao mínimo de recolhimento"],
            ["personaliza.encargos.somarEncargosInssCCTMensalMinimo", "Somar os encargos de INSS CCT na folha mensal do mês do aumento quando valor a recolher for inferior ao mínimo de recolhimento"],
            ["personaliza.encargos.naoCalcularIrrfRpaMei", "Não calcular IRRF no RPA para microempreendedor individual"],
            ["personaliza.encargos.calcularIrrfAutonomoCondominio", "Calcular IRRF para contribuinte autônomo de condomínio edilício"],
            ["personaliza.encargos.ratearEncargosProporcionalServico", "Realizar o rateio dos encargos proporcionalmente ao valor de cada serviço"],
            ["personaliza.encargos.calculaEncargosHorasRepousoIndenizado", "Calcula encargos sobre horas de repouso indenizado"],
            ["personaliza.encargos.calcularEncargosIntegralAfastamentoContribuintes", "Calcular encargos de INSS integralmente nos meses de início e retorno do afastamento para contribuintes"],
            ["personaliza.encargos.calculaEncargosMultaEstabilidade", "Calcula encargos sobre multa estabilidade"],
            ["personaliza.encargos.calcularInssFeriasOutrasBases", "Calcular o INSS das férias utilizando os valores de Outras Bases de INSS"],
            ["personaliza.encargos.naoCalcularInssEmpresaCategoriasSefip", "Não calcular INSS Empresa para as categorias SEFIP 17, 18, 24 e 25"],
            ["personaliza.encargos.calcularInss13ProporcionalDesoneracao", "Calcular INSS Empresa sobre 13º salário proporcionalmente aos meses com desoneração e sem desoneração quando a empresa não for mais enquadrada na desoneração"],
            ["personaliza.encargos.calcularInss13ProporcionalSimplesNacional", "Calcular INSS sobre o 13º proporcional ao período em que a empresa era Simples Nacional no ano-calendário"],
            ["personaliza.encargos.calcularInss13SemProporcionalidadeTransferenciaDesoneracao", "Calcular INSS Empresa correspondente ao 13º salário sem a proporcionalidade da data de transferência do empregado quando a empresa for enquadrada na desoneração"],
          ])
      );

      const rescisao = accordionItem(
        "pzRescisao",
        "Rescisão",
        secao(
          "Geral",
          condRule(
            checkboxField("personaliza.rescisaoGeral.calcularFgtsAvisoPrevioSegregadoESocial.ativo", "Calcular rescisão considerando a base de cálculo de FGTS sobre o Aviso Prévio Indenizado separado das demais bases de FGTS conforme eSocial", "Vigente desde 04/2023"),
            p.rescisaoGeral.calcularFgtsAvisoPrevioSegregadoESocial.ativo ? monthField("A partir de", "personaliza.rescisaoGeral.calcularFgtsAvisoPrevioSegregadoESocial.data", { obrigatorio: true }) : ""
          ) + ""
        ) +
          condRule(
            checkboxField("personaliza.rescisaoGeral.naoDeduzirBaseFgtsNegativa.ativo", "Não deduzir a base de cálculo de FGTS negativa de outras bases de FGTS", "Vigente desde 04/2023"),
            p.rescisaoGeral.naoDeduzirBaseFgtsNegativa.ativo ? monthField("A partir de", "personaliza.rescisaoGeral.naoDeduzirBaseFgtsNegativa.data", { obrigatorio: true }) : ""
          ) +
          checklist([
            ["personaliza.rescisaoGeral.calculoProporcionalidadeDiasMes", "Cálculo proporcionalidade na rescisão conforme dias mês"],
            ["personaliza.rescisaoGeral.calculoProporcionalidadeSempre30Dias", "Cálculo proporcionalidade na rescisão sempre 30 dias"],
            ["personaliza.rescisaoGeral.naoCalcularMediaAdicionalMultaArt477", "Não calcular média e adicional na multa atraso pagamento Art. 477, §8º/CLT"],
            ["personaliza.rescisaoGeral.naoConsiderarAvisoIndenizadoSalarioFamilia", "Não considerar o valor de aviso prévio indenizado para o cálculo do salário família"],
            ["personaliza.rescisaoGeral.gerarDataRescisaoMotivos6e27Caged", "Gerar a data da rescisão pelos motivos 6 e 27 como data de transferência de saída para o CAGED"],
            ["personaliza.rescisaoGeral.calcularMultaEstabilidadeAcidenteTrabalho", "Calcular multa estabilidade para colaboradores que pediram demissão em período de estabilidade por acidente de trabalho"],
            ["personaliza.rescisaoGeral.gerarAvisoIndenizadoSefipRescisao", "Gerar valores de aviso prévio indenizado na SEFIP da competência da rescisão"],
            ["personaliza.rescisaoGeral.calcularMultaEstabilidadeArt479480Proporcional", "Calcular multa estabilidade Art. 479 e 480 proporcionalmente aos dias de cada mês"],
            ["personaliza.rescisaoGeral.calcularIndenizacaoAdicionalTemporario", "Calcular Indenização Adicional na rescisão do trabalhador temporário"],
            ["personaliza.rescisaoGeral.calcularAvisoAcordoDiasMetade", "Calcular o aviso prévio na rescisão por acordo entre as partes considerando os dias pela metade"],
            ["personaliza.rescisaoGeral.naoCalcular13FeriasIndenizadoAvisoAposentadoria", "Não calcular 13º salário e férias indenizados sobre aviso indenizado para rescisão com motivo aposentadoria"],
            ["personaliza.rescisaoGeral.naoConsiderarFerias13IntermitenteAvisoPrevio", "Não considerar os valores de férias e 13º salário pagos mensalmente para a categoria Celetista Intermitente no cálculo do aviso prévio"],
            ["personaliza.rescisaoGeral.calcularAvisoIntermitenteVerbasPagas", "Calcular o aviso prévio para a categoria Celetista Intermitente considerando as verbas pagas durante o curso do contrato de trabalho"],
          ]) +
          '<div class="detail-section"><h3 class="detail-section-title">Data de Pagamento</h3>' +
          checklist([
            ["personaliza.rescisaoDataPagamento.utilizarSabadoDiaUtilPagamentoRescisao", "Utilizar sábado como dia útil para o pagamento de rescisão"],
            ["personaliza.rescisaoDataPagamento.anteciparPagamentoRescisaoContratoAntecipadoEmpregador", "Antecipar data de pagamento da rescisão de contrato antecipado pelo empregador"],
            ["personaliza.rescisaoDataPagamento.gerarDataPagamentoRescisaoMotivo43", "Gerar a data de pagamento da rescisão pelo motivo 43 no décimo dia útil contado a partir da data de demissão"],
            ["personaliza.rescisaoDataPagamento.prorrogarDataPagamentoRescisaoDiaNaoUtil", "Prorrogar a data de pagamento da rescisão para o próximo dia útil quando essa recair em sábado, domingo ou feriado"],
          ]) +
          "</div>"
      );

      const avisoPrevio = accordionItem(
        "pzAvisoPrevio",
        "Aviso Prévio — Lei 12.506/2011",
        secao("Regras estruturais", textField("Início do cálculo proporcional", "personaliza.avisoPrevio.inicioCalculoProporcional", { obrigatorio: true, placeholder: "Ex.: a partir do primeiro ano trabalhado completo" }) + textField("Motivos de demissão", "personaliza.avisoPrevio.motivosDemissao", { obrigatorio: true, placeholder: "Ex.: somente motivo 2 — demissão sem justa causa" })) +
          checklist([
            ["personaliza.avisoPrevio.considerarProjecaoAvisoIndenizadoDiasTrabalhados", "Considerar projeção do aviso prévio indenizado como dias trabalhados"],
            ["personaliza.avisoPrevio.naoConsiderarDiasAcrescidosLei12506Avos", "Não considerar os dias de aviso prévio acrescidos pela Lei 12.506/2011 para projeção do aviso prévio na contagem de avos indenizados de 13º e Férias"],
            ["personaliza.avisoPrevio.considerarDiasAfastadosDilatarAcrescimoLei12506", "Considerar os dias afastados para dilatar a contagem do acréscimo do Aviso Prévio — Lei 12.506/2011"],
          ])
      );

      const covid19 = accordionItem(
        "pzCovid19",
        "Covid-19",
        condRule(
          checkboxField("personaliza.covid19.naoRealizarCompensacaoPrevidenciariaAfastamentoCovid.ativo", "Para afastamento decorrente de contaminação pelo coronavírus Covid-19, não realizar a compensação de valores previdenciários a partir de"),
          p.covid19.naoRealizarCompensacaoPrevidenciariaAfastamentoCovid.ativo ? monthField("A partir de", "personaliza.covid19.naoRealizarCompensacaoPrevidenciariaAfastamentoCovid.data", { obrigatorio: true }) : ""
        ) +
          checklist([
            ["personaliza.covid19.efetuarCalculoHorasNormaisSalarioDia", "Efetuar o cálculo das horas normais e dos afastamentos com base no salário de cada dia da competência"],
            ["personaliza.covid19.calcularIndenizacaoGarantiaProvisoriaMotivos10e23", "Calcular indenização de garantia provisória na rescisão pelos motivos 10 e 23"],
            ["personaliza.covid19.naoCalcularSalarioFamiliaSemDireitoAntesReducao", "Não calcular salário família para empregados que antes do processo de redução salarial não possuíam o direito"],
            ["personaliza.covid19.considerarAdicionaisIndenizacaoGarantiaProvisoria", "Considerar os adicionais para o cálculo da Indenização de Garantia Provisória — Lei 14.020/2020 e MP 1.045/2021"],
            ["personaliza.covid19.considerarAdicionaisAjudaCompensatoria30", "Considerar os adicionais para o cálculo da ajuda compensatória 30% — Lei 14.020/2020 e MP 1.045/2021"],
            ["personaliza.covid19.postergarDiasEstabilidadeGarantiaProvisoria", "Postergar os dias restantes de estabilidade por garantia provisória quando houver Medida de Proteção do Emprego Covid-19 cadastrada no período"],
            ["personaliza.covid19.calcularRubricasInsalubridadeReducaoSalarial", "Calcular as rubricas com classificação Insalubridade e base de cálculo Salário Mínimo, Salário Mínimo Estadual ou Piso Salarial para a redução salarial de Medida de Proteção do Emprego — Covid-19"],
            ["personaliza.covid19.calcularAntecipacaoSalarialReduzidaCompetenciaReducao", "Calcular a antecipação salarial de forma reduzida na competência com Redução"],
            ["personaliza.covid19.considerarAntecipacaoSalarialAjudaCompensatoria", "Considerar a antecipação salarial para o cálculo da ajuda compensatória"],
            ["personaliza.covid19.calcularGratificacaoReduzidaCompetenciaReducao", "Calcular de forma reduzida a gratificação lançada na competência com Redução"],
            ["personaliza.covid19.considerarDiasAfastadosSuspensaoDilatarPeriodoAquisitivo", "Considerar os dias afastados por Suspensão do Contrato para dilatar o período aquisitivo de férias"],
            ["personaliza.covid19.calcularSalarioFamiliaAfastadoIntegralSuspensao", "Calcular Salário Família quando o empregado estiver integralmente afastado por suspensão"],
            ["personaliza.covid19.considerarDiasIndenizacaoGarantiaProvisoriaAvos", "Considerar os dias de indenização de garantia provisória para o cálculo dos avos de férias e 13º salário indenizados"],
            ["personaliza.covid19.considerarSalarioReduzidoCalculo13", "Considerar o salário reduzido da competência para o cálculo do 13º salário"],
          ])
      );

      const afastamentos = accordionItem(
        "pzAfastamentos",
        "Afastamentos",
        condRule(
          checkboxField("personaliza.afastamentos.calcularAfastamentosPagamentoEmpresaIntermitente.ativo", "Calcular os afastamentos com pagamento pela empresa para empregados com vínculo celetista intermitente a partir de"),
          p.afastamentos.calcularAfastamentosPagamentoEmpresaIntermitente.ativo ? monthField("A partir de", "personaliza.afastamentos.calcularAfastamentosPagamentoEmpresaIntermitente.data", { obrigatorio: true }) : ""
        ) +
          checklist([
            ["personaliza.afastamentos.considerarDiasAfastadosExperienciaDilatarLimite", "Considerar os dias afastados durante o contrato de experiência para dilatar o limite do término do contrato"],
            ["personaliza.afastamentos.considerarMediasPrimeiroAfastamentoMesmaDoenca", "Considerar para um novo afastamento mesma doença/acidente as médias utilizadas para o primeiro afastamento"],
            ["personaliza.afastamentos.naoCalcularDiferencaRubricasAlteracaoRetroativaAfastadoDoenca", "Não calcular a diferença de rubricas com base de cálculo salário quando houver alteração salarial retroativa a período em que o empregado esteve afastado por doença"],
            ["personaliza.afastamentos.pagarPrimeiros90DiasServicoMilitar", "Pagar os primeiros 90 dias de afastamento por serviço militar"],
            ["personaliza.afastamentos.permitirMotivosAfastamento3_6_17_18QualquerData", "Permitir utilizar os motivos de afastamentos 3, 6, 17 e 18 em qualquer data"],
            ["personaliza.afastamentos.considerar5MesesEstabilidadeLicencaMaternidade", "Considerar 5 meses de estabilidade para empregados afastados por licença maternidade"],
            ["personaliza.afastamentos.naoAlterarPagamentoLicencaMaternidadeMeiTrocaRegime", "Não alterar a forma de pagamento da Licença Maternidade para empresa MEI que realiza troca da classificação tributária/regime durante o período do afastamento"],
            ["personaliza.afastamentos.considerarSomenteDiasUteisLicencaPaternidade", "Considerar somente os dias úteis para o afastamento de licença paternidade"],
          ])
      );

      const horaNoturna = accordionItem(
        "pzHoraNoturna",
        "Hora Noturna",
        condRule(
          checkboxField("personaliza.horaNoturna.calcularHoraNoturnaHorarioEmpregado.ativo", "Calcular Hora Noturna de acordo com o horário do empregado a partir de"),
          p.horaNoturna.calcularHoraNoturnaHorarioEmpregado.ativo
            ? monthField("A partir de", "personaliza.horaNoturna.calcularHoraNoturnaHorarioEmpregado.data", { obrigatorio: true }) +
              horaField("Início Hora Noturna", "personaliza.horaNoturna.inicioHoraNoturna", { obrigatorio: true }) +
              horaField("Fim Hora Noturna", "personaliza.horaNoturna.fimHoraNoturna", { obrigatorio: true })
            : ""
        ) +
          condRule(
            checkboxField("personaliza.horaNoturna.calcularIntegralmenteJornadaExclusivamenteNoturna.ativo", "Calcular integralmente Horas Noturnas para empregado que possui jornada exclusivamente noturna a partir de"),
            p.horaNoturna.calcularIntegralmenteJornadaExclusivamenteNoturna.ativo ? monthField("A partir de", "personaliza.horaNoturna.calcularIntegralmenteJornadaExclusivamenteNoturna.data", { obrigatorio: true }) : ""
          ) +
          checklist([["personaliza.horaNoturna.calcularHoraDiurnaComAdicionalNoturnoSumula60", "Calcular Hora Diurna com adicional noturno quando o empregado possui horário integralmente noturno e esse se estende ao horário diurno, conforme Súmula nº 60 TST"]])
      );

      const contribuicoesSindicato = accordionItem(
        "pzContribuicoesSindicato",
        "Contribuições ao Sindicato",
        checklist([
          ["personaliza.contribuicoesSindicato.calcularDiferencaContribSindicalAlteracaoSalarial", "Calcular diferença de Contribuição Sindical devido a alteração salarial"],
          ["personaliza.contribuicoesSindicato.calcularDiferencaContribSindicalAntecipacaoSalarial", "Calcular diferença de Contribuição Sindical devido a antecipação salarial"],
          ["personaliza.contribuicoesSindicato.calcularContribSindicalMesAnteriorComissionado", "Calcular contribuição sindical com base na remuneração do mês anterior para comissionado"],
          ["personaliza.contribuicoesSindicato.calcularContribSindicalMediasFeriasComissionado", "Calcular a contribuição sindical sobre as médias de férias do empregado comissionado"],
          ["personaliza.contribuicoesSindicato.calcularContribSindicalMesAnteriorProfessorAulista", "Calcular contribuição sindical com base na remuneração do mês anterior para professor aulista variável"],
          ["personaliza.contribuicoesSindicato.calcularContribSindicalHoristas30Dias", "Calcular contribuições ao sindicato para empregados horistas com base em 30 dias"],
        ])
      );

      // Decisão 6 (arquitetura aprovada): "Outros (Integrações API)" tem só 2
      // campos — candidato natural a incorporação, conforme registrado na
      // análise. Optou-se por mantê-lo como item próprio (em vez de fundir
      // com um subgrupo tematicamente distinto, como Encargos ou
      // Contribuições ao Sindicato, o que reduziria mais a clareza do que
      // economiza cliques) — ponto a revisar na próxima fase, se necessário.
      const outrosApi = accordionItem(
        "pzOutrosApi",
        "Outros (Integrações API)",
        checklist([
          ["personaliza.outrosApi.gerarGuiaDarfDctfwebApiIntegraContador", "Gerar guia DARF DCTFWeb pela API Integra Contador com certificado do contador (Por procuração)"],
          ["personaliza.outrosApi.gerarLancamentoRubricasFolhaViaApi", "Gerar lançamento de rubricas na folha via API"],
        ])
      );

      return (
        '<div class="accordion accordion-nested">' +
        [opcoesGeral, dsr, salarioFamilia, encargos, rescisao, avisoPrevio, covid19, afastamentos, horaNoturna, contribuicoesSindicato, outrosApi].join("") +
        "</div>"
      );
    }

    // ===== Informações (seção simples, sem Accordion) =====
    function montaInformacoes() {
      const i = form.informacoes;
      function blocoNotaFiscal(campo, label) {
        const dado = i[campo];
        return condRule(
          checkboxField("informacoes." + campo + ".ativo", label),
          dado.ativo ? textField("Lançamento das notas fiscais", "informacoes." + campo + ".lancamentoNotasFiscais", { obrigatorio: true }) + monthField("A partir de", "informacoes." + campo + ".data", { obrigatorio: true }) : ""
        );
      }
      return (
        blocoNotaFiscal("adquireProducaoRural", "Adquire Produção Rural") +
        blocoNotaFiscal("comercializaProducaoRural", "Comercializa Produção Rural") +
        blocoNotaFiscal("tomadorServicos", "Tomador de Serviços") +
        blocoNotaFiscal("prestadorServicos", "Prestador de Serviços") +
        condRule(
          checkboxField("informacoes.recursosClubeFutebol.ativo", "Recursos de Clube de Futebol"),
          i.recursosClubeFutebol.ativo ? textField("Tipo", "informacoes.recursosClubeFutebol.tipo", { obrigatorio: true }) : ""
        ) +
        checklist([["informacoes.permiteImportarNotasFiscaisCpfProducaoRural", "Permite importar notas fiscais com CPF na Comercialização de Produção Rural PJ para SEFIP"]])
      );
    }

    function renderGeral() {
      obrigatoriosRenderizados = [];
      return (
        '<div class="card">' +
        '<div class="card-header"><div class="card-title">Geral</div></div>' +
        '<div class="card-content flex flex-col gap-3">' +
        '<div class="accordion">' +
        accordionItem("esocial", "eSocial", montaEsocial()) +
        accordionItem("calculo", "Cálculo", montaCalculo()) +
        accordionItem("unidadeCalculo", "Unidade de Cálculo", montaUnidadeCalculo()) +
        accordionItem("personaliza", "Personaliza", montaPersonaliza()) +
        "</div>" +
        '<div class="detail-section"><h3 class="detail-section-title">Informações</h3><div class="flex flex-col gap-3">' + montaInformacoes() + "</div></div>" +
        "</div>" +
        (mode === "view"
          ? ""
          : '<div class="card-footer justify-end">' +
            '<button type="button" class="btn btn-outline" id="btn-cancelar-geral">Cancelar</button>' +
            '<button type="button" class="btn" id="btn-salvar-geral">Salvar parâmetros</button>' +
            "</div>") +
        "</div>"
      );
    }

    // ===== Regime (Fase 2 — Regime > Geral + Regime > INSS Receita Bruta/CPRB) =====
    function montaRegime() {
      const r = regimeCtx.form;

      // CPRB (4.2 da fonte): "Atividades", "TI/TIC", "Atividades
      // relacionadas" e a Alíquota dependem todas do MESMO gatilho — "Possui
      // INSS Empresa sobre a receita bruta" = Sim (matriz de dependências,
      // seção 4 da arquitetura) — nenhuma é condicional às demais. Decisão
      // funcional fechada: a antiga hipótese provisória que só exibia a
      // Alíquota quando "Empresa possui exclusivamente atividades
      // relacionadas" = Não (proxy entre "atividades" e "receitas", dois
      // conceitos que a fonte nunca declarou equivalentes) foi descartada —
      // não existe parâmetro que determine diretamente a existência de
      // receitas não relacionadas, então a Alíquota segue a mesma árvore de
      // aplicabilidade do CPRB ativo (Opção A do documento de arquitetura,
      // seção 9), sem gatilho adicional.
      //
      // Construída como FUNÇÃO, não como `const` avaliada de imediato: os
      // helpers de campo (`RH.textField`/`RH.selectField`) registram
      // obrigatoriedade como efeito colateral só de serem chamados — se o
      // bloco fosse montado incondicionalmente e só o HTML resultante fosse
      // descartado quando CPRB está inativo, os 3 campos (e a alíquota)
      // seriam registrados como pendentes mesmo ocultos, bloqueando o
      // salvamento sem que o usuário tenha como corrigir (bug encontrado na
      // auditoria pós-implementação). Chamar `montaCprb()` só dentro do
      // ternário abaixo garante que os helpers só rodem quando o gatilho
      // realmente libera os campos — mesmo padrão já usado em `dependentesGerais`
      // (eSocial) e em "Rateio por serviço" (Cálculo).
      //
      // Composição visual (refinamento UX pós-auditoria): o trigger
      // "Possui INSS Empresa sobre a receita bruta" NÃO envolve mais este
      // bloco num `RH.condRule()` — a auditoria apontou que a combinação de
      // `.condrule.is-active` (fundo tintado + borda + barra lateral) com
      // `.condrule-dependent` (2ª indentação/borda) e um `secao()` com título
      // de peso igual a "REGIME TRIBUTÁRIO"/"VIGÊNCIA" fazia o CPRB ler como
      // um segundo card dentro do card de Regime, e escondia o
      // campo-gatilho dentro da mesma superfície tintada que ele controla.
      // Aqui o CPRB usa só UMA camada de indicação de dependência —
      // `.condrule-dependent` sozinho (reaproveitado, não modificado; sua
      // regra em components.css não depende de estar dentro de `.condrule`)
      // — e o título vira um rótulo no peso de `.detail-field-label` (mesmo
      // usado em "Descrição"/"Regime"/etc.), não de `.detail-section-title`.
      // Nenhum `condRule` existente (Contribui PIS, e todo o restante de
      // Geral) foi tocado — eles continuam usando `RH.condRule()` e as
      // classes `.condrule`/`.condrule.is-active` exatamente como antes.
      function montaCprb() {
        return (
          '<div class="condrule-dependent">' +
          '<span class="detail-field-label">INSS Receita Bruta — CPRB</span>' +
          RH.campoGrid(
            RH.textField("Atividades", "cprb.atividades", { obrigatorio: true, placeholder: "Ex.: Indústria/Comércio" }) +
              RH.selectField("Empresa exclusivamente prestadora de serviços de TI e TIC", "cprb.exclusivamenteTiTic", O.simNao, { obrigatorio: true }) +
              RH.selectField("Empresa possui exclusivamente atividades relacionadas", "cprb.exclusivamenteAtividadesRelacionadas", O.simNao, { obrigatorio: true }) +
              RH.textField("Alíquota para receitas não relacionadas quando inferior a 5% da receita (%)", "cprb.aliquotaReceitasNaoRelacionadas", { obrigatorio: true, wide: true, placeholder: "Ex.: 3,00" })
          ) +
          RH.checklist([
            ["cprb.calcularInss13IntegralSemProporcionalidade", "Calcular INSS Empresa sobre o valor de 13º integral sem considerar a proporcionalidade no ano-base"],
            ["cprb.utilizarPercentualReceitaBrutaNovembro13Integral", "Utilizar o percentual de receita bruta acumulado na competência de novembro para o cálculo do INSS Empresa sobre o 13º quando calculado em novembro"],
            ["cprb.calcularInss13RescisaoSemProporcionalidade", "Calcular INSS Empresa sobre valor do 13º pago em rescisão sem considerar a proporcionalidade no ano-base"],
            ["cprb.calcularInss13RescisaoUltimoServicoAlocado", "Calcular INSS Empresa sobre valor de 13º pago em rescisão conforme último serviço alocado"],
            ["cprb.calcularInss13ProporcionalDesoneracaoServico", "Calcular INSS Empresa sobre 13º salário proporcionalmente aos meses com e sem desoneração quando o serviço não for mais enquadrado na desoneração"],
          ]) +
          "</div>"
        );
      }

      return (
        // Indicador de vigência (VigenciaSelector) fora do .detail-grid — o
        // slot abaixo é só o ponto de ancoragem (recriado a cada render());
        // ver render() para o reencaixe do nó persistente. Descrição
        // continua num .detail-grid próprio, como qualquer outro campo.
        '<div class="detail-section"><h3 class="detail-section-title">Vigência</h3>' +
        '<div id="regime-vigencia-slot"></div>' +
        RH.campoGrid(RH.textField("Descrição", "descricao", { wide: true, placeholder: "Identificação livre da vigência" })) +
        "</div>" +
        RH.secao(
          "Regime tributário",
          RH.textField("Regime", "regime", { obrigatorio: true, placeholder: "Ex.: Normal" }) +
            RH.textField("Simples Federal até 06/2007", "simplesFederalAte2007", { obrigatorio: true, placeholder: "Ex.: Não se aplica" }) +
            RH.selectField("Simples Nacional", "simplesNacional", O.simplesNacionalSituacao, { obrigatorio: true })
        ) +
        RH.condRule(
          RH.checkboxField("contribuiPis.ativo", "Contribui PIS"),
          r.contribuiPis.ativo ? RH.textField("Percentual (%)", "contribuiPis.percentual", { obrigatorio: true, placeholder: "Ex.: 1,00" }) : ""
        ) +
        // "Possui INSS Empresa sobre a receita bruta" é um campo Base normal
        // de Regime tributário (mesmo tratamento de "Regime"/"Simples
        // Federal"/"Simples Nacional" acima) — não fica mais dentro do
        // `.condrule` que ele próprio controla (refinamento UX pós-
        // auditoria). A indicação de dependência recai só sobre `montaCprb()`
        // (ver comentário acima), chamado apenas quando o valor libera CPRB.
        RH.campoGrid(RH.selectField("Possui INSS Empresa sobre a receita bruta", "possuiInssReceitaBruta", O.simNao, { obrigatorio: true })) +
        (r.possuiInssReceitaBruta === "Sim" ? montaCprb() : "") +
        RH.checklist([["calcularPisCompetenciaFerias", "Calcular o valor de PIS na competência da data de pagamento das férias"]])
      );
    }

    function renderRegime() {
      regimeCtx.obrigatorios = [];
      return (
        '<div class="card">' +
        '<div class="card-header"><div class="card-title">Regime</div></div>' +
        '<div class="card-content flex flex-col gap-3">' +
        '<div class="accordion">' +
        RH.accordionItem("regime", "Regime", montaRegime()) +
        "</div>" +
        "</div>" +
        (regimeCtx.mode === "view"
          ? ""
          : '<div class="card-footer justify-end">' +
            '<button type="button" class="btn btn-outline" id="btn-cancelar-regime">Cancelar</button>' +
            '<button type="button" class="btn" id="btn-salvar-regime">Salvar parâmetros</button>' +
            "</div>") +
        "</div>"
      );
    }

    // ===== Arredondamento (Fase 3 — 2 itens, seção 2 da arquitetura:
    // checkbox de grupo "Calcula arredondamento para" + Tabela de
    // Configurações com 11 linhas fixas por Tipo de Folha) =====
    function montaCalculaPara() {
      const c = arredCtx.form.calculaPara;
      const editing = arredCtx.mode === "edit";
      const algumMarcado = c.empregados || c.estagiarios || c.contribuintes;
      // Decisão 3 do documento de arquitetura — solução neutra/provisória:
      // o grupo é considerado Base vazio somente quando NENHUMA das 3
      // opções está marcada. A documentação funcional (seção 5 do
      // Mapeamento) não define a condição real de preenchimento de um
      // checkbox-group Base — este comportamento é substituível por outra
      // regra (ex.: exigir uma opção específica) sem alterar a estrutura de
      // dados nem o markup.
      if (editing) arredCtx.obrigatorios.push({ path: "calculaPara.__grupo", vazio: () => !algumMarcado });
      const erro = editing && arredCtx.invalidos.has("calculaPara.__grupo");
      // Correção da auditoria visual (achado P2 — hierarquia): este bloco
      // usa a mesma composição `.detail-section`/`.detail-section-title` já
      // usada por "Tabela de Configurações" logo abaixo (e por Vigência/
      // Regime tributário em Regime), em vez de um `.detail-field` solto —
      // os dois blocos da área precisam ler com o mesmo peso hierárquico.
      // Nenhuma regra de obrigatoriedade/estado mudou, só a composição visual.
      return (
        '<div class="detail-section">' +
        '<h3 class="detail-section-title">Calcula arredondamento para' + (editing ? ' <span class="text-muted">*</span>' : "") + "</h3>" +
        '<div class="flex flex-col gap-2">' +
        AH.checkboxField("calculaPara.empregados", "Empregados") +
        AH.checkboxField("calculaPara.estagiarios", "Estagiários") +
        AH.checkboxField("calculaPara.contribuintes", "Contribuintes") +
        "</div>" +
        (erro ? '<span class="text-xs" style="color:var(--destructive-text);">Selecione ao menos uma opção.</span>' : "") +
        "</div>"
      );
    }

    // Tabela editável — evolui o padrão de
    // prototype/sindicatos/js/convencao-detail.js (`.table-wrap > table.dtable.
    // dtable-compact`, células com <input data-path>), adaptado para 11
    // linhas FIXAS (decisão 1 da arquitetura — sem "Adicionar linha"/
    // "remover", diferente do precedente de Sindicato) e com a integração de
    // obrigatoriedade que faltava naquele precedente (decisão 2 — "Calcula"
    // como gatilho de linha, "Valor"/"Forma de Desconto" como dependentes
    // condicionais, mesma arquitetura de condRule/decisão 7 da Fase 1,
    // generalizada célula a célula em vez de campo único).
    //
    // `data-path="<linhasPath>.<índice>.<campo>"` é lido pelos MESMOS
    // handlers genéricos de wireEvents() (input/select[data-path], sem
    // handler novo) — getPath/setPath já suportam índice de array porque
    // acessam por chave (`o[k]`), e um índice numérico em string funciona
    // igual num array JS.
    //
    // ===== Extração compartilhada (Fase 6 —
    // docs/folha-pagamento-fase6-analise-arquitetura-contabilidade-honorarios.md,
    // seção 9.1) =====
    // Generaliza o padrão "N linhas fixas + validação condicional por
    // célula" desta função (Arredondamento, Fase 3) para um 2º consumidor
    // real dentro da MESMA trilha/arquivo: a tabela "Configurações — Tipo
    // de Cálculo × Data" de Contabilidade > Opções (mesmas 11 linhas fixas
    // de "Tipo", só o rótulo do Tipo e as colunas mudam). Os dois critérios
    // de promoção já registrados na arquitetura de Arredondamento (2º
    // consumidor real; diferenças de parametrização, não de arquitetura)
    // estão atendidos — ver arquitetura da Fase 6, seção 9.1.
    //
    // Mantida DENTRO deste arquivo (não movida para prototype/shared/js/):
    // os dois consumidores vivem na mesma trilha (Folha de Pagamento) e no
    // mesmo arquivo; mover para shared/js/ exigiria alterar a ordem de
    // carregamento de scripts em index.html e exporia o helper a outras
    // trilhas sem necessidade real hoje — escopo maior do que o necessário
    // para esta fase (ver relatório da tarefa).
    //
    // `ctx` — contexto isolado da área (arredCtx/contabilidadeCtx etc.).
    // `linhasPath` — caminho do array de linhas dentro de `ctx.form`.
    // `rowLabelKey`/`rowLabelHeader` — chave do rótulo de cada linha (ex.:
    // "tipoFolha"/"tipoCalculo") e o texto do cabeçalho da 1ª coluna.
    // `colunas` — array de `{ key, label, control: "select"|"text",
    // options?, placeholder?, dependsOn?, ativoValue?, obrigatorio?,
    // obrigatorioQuandoAtivo? }`. Uma coluna SEM `dependsOn` é sempre
    // avaliada conforme `obrigatorio` (equivalente à coluna "Data" de
    // Contabilidade — sempre exigida, sem gatilho de linha). Uma coluna COM
    // `dependsOn` só fica habilitada/obrigatória quando a coluna apontada
    // tiver o valor de `ativoValue` (default "Sim") — equivalente a
    // "Valor"/"Forma de Desconto" dependendo de "Calcula" em Arredondamento.
    // Evolução aditiva (Fase 7 — Cronograma, seção 5.3 da arquitetura): até
    // aqui `dependsOn` só suportava (a) igualdade a `ativoValue` e (b)
    // aplicação uniforme a TODAS as linhas da tabela — suficiente para os 2
    // consumidores existentes (Arredondamento: "Calcula" = "Sim" habilita
    // "Valor"/"Forma de Desconto" em todas as 11 linhas; Contabilidade: sem
    // `dependsOn`). A única dependência condicional do Cronograma é
    // diferente nos 2 sentidos: (1) é uma DESIGUALDADE ("Total de dias"
    // fica inativo quando "Forma de vencimento" = "Último dia útil", não
    // quando é igual a um valor); (2) é local a 1 única linha ("13º
    // Adiantamento" — Anexo B, linhas 852-855/2692-2695), não generalizável
    // às outras 5 linhas do evento (que continuam Base/Sim sem exceção).
    // Os 2 parâmetros novos são opcionais e não usados por nenhum consumidor
    // existente — `ativoQuandoDiferente`/`dependsOnSomenteLinhas` ausentes
    // preservam exatamente o comportamento anterior (igualdade, todas as
    // linhas), portanto Arredondamento e Contabilidade permanecem intocados.
    //
    // Evolução aditiva (pendência P14, docs/folha-pagamento-pendencias-fases1-8.md
    // — correção pós-congelamento localizada em Contabilidade > Opções):
    // `dependsOn` só compara colunas DENTRO da própria linha, mas os campos 9/10
    // de Contabilidade ("Usar a mesma configuração da folha normal para:
    // Rescisão/Férias") ficam FORA da tabela. `col.dependsOnExterno`, quando
    // presente, é um array de `{ somenteLinhas?: string[], get: (form) => bool }`
    // — a linha fica desabilitada (mesmo tratamento visual/`disabled` já usado
    // por `dependsOn`) quando alguma regra cujo `somenteLinhas` inclui o rótulo
    // da linha (ou que não restringe linhas) retornar true a partir de
    // `ctx.form`. Parâmetro ausente preserva exatamente o comportamento
    // anterior — Arredondamento e Cronograma, que não o usam, permanecem
    // intocados.
    function montaTabelaLinhasFixas(ctx, linhasPath, rowLabelKey, rowLabelHeader, colunas) {
      const editing = ctx.mode === "edit";
      const linhas = getPath(ctx.form, linhasPath);
      const linhasHtml = linhas
        .map((linha, i) => {
          const cells = colunas
            .map((col) => {
              const path = linhasPath + "." + i + "." + col.key;
              const dependsOnAplicavel = !col.dependsOnSomenteLinhas || col.dependsOnSomenteLinhas.indexOf(linha[rowLabelKey]) !== -1;
              const ativoPorDependsOn =
                col.dependsOn && dependsOnAplicavel
                  ? col.ativoQuandoDiferente
                    ? linha[col.dependsOn] !== (col.ativoValue || "Sim")
                    : linha[col.dependsOn] === (col.ativoValue || "Sim")
                  : true;
              const desabilitadaPorExterno =
                Array.isArray(col.dependsOnExterno) &&
                col.dependsOnExterno.some(
                  (regra) =>
                    (!regra.somenteLinhas || regra.somenteLinhas.indexOf(linha[rowLabelKey]) !== -1) && !!regra.get(ctx.form)
                );
              const ativo = ativoPorDependsOn && !desabilitadaPorExterno;
              const obrigatorio = col.dependsOn && dependsOnAplicavel ? ativo && !!col.obrigatorioQuandoAtivo : !!col.obrigatorio && !desabilitadaPorExterno;
              if (editing && obrigatorio) ctx.obrigatorios.push({ path });
              const erro = editing && obrigatorio && ctx.invalidos.has(path);

              if (!editing) {
                const valorExibido = col.dependsOn ? (ativo && linha[col.key] ? linha[col.key] : "—") : linha[col.key] || "—";
                return "<td>" + valorExibido + "</td>";
              }

              let inputHtml;
              if (col.control === "select") {
                const optsHtml = (col.options || [])
                  .map((o) => '<option value="' + o + '"' + (linha[col.key] === o ? " selected" : "") + ">" + o + "</option>")
                  .join("");
                inputHtml =
                  '<div class="field-select-wrap"><select class="field-select"' + (erro ? ' aria-invalid="true"' : "") + (!ativo ? " disabled" : "") +
                  ' data-path="' + path + '"><option value="">Selecione...</option>' + optsHtml + '</select><span class="chev">' + Icon("chevron-down", "size-4") + "</span></div>";
              } else {
                inputHtml =
                  '<input class="field-input"' + (erro ? ' aria-invalid="true"' : "") + ' data-path="' + path + '" value="' + (linha[col.key] || "").replace(/"/g, "&quot;") + '"' +
                  (!ativo ? " disabled" : "") + ' placeholder="' + (col.placeholder || "") + '" />';
              }
              // Correção da auditoria visual de Arredondamento (achado P2 —
              // feedback de erro): além da borda vermelha (aria-invalid),
              // cada célula inválida ganha o mesmo texto compacto "Campo
              // obrigatório." já usado por campoEdit() em Geral/Regime — só
              // quando aquela célula específica está inválida.
              return '<td><div class="flex flex-col gap-1">' + inputHtml + (erro ? '<span class="text-xs" style="color:var(--destructive-text);">Campo obrigatório.</span>' : "") + "</div></td>";
            })
            .join("");
          return "<tr><td>" + linha[rowLabelKey] + "</td>" + cells + "</tr>";
        })
        .join("");

      const headerCols = colunas.map((c) => "<th>" + c.label + "</th>").join("");
      return (
        '<div class="table-wrap"><table class="dtable dtable-compact"><thead><tr><th>' + rowLabelHeader + "</th>" + headerCols + "</tr></thead><tbody>" +
        linhasHtml +
        "</tbody></table></div>"
      );
    }

    // "Calcula" (trigger) / "Valor" + "Forma de Desconto" (dependentes) —
    // decisão 4 da arquitetura de Arredondamento (Fase 3): "Valor"/"Forma
    // de Desconto" são texto livre, sem máscara nem catálogo fechado (a
    // fonte não define o formato de "Valor" nem a lista completa de "Forma
    // de Desconto"). Comportamento, markup e classes preservados
    // integralmente pela extração acima — ver docs/folha-pagamento-fase6-...,
    // seção 9.1, sobre por que esta tabela foi escolhida como o 2º
    // consumidor que justifica a extração.
    function montaTabelaArredondamento() {
      return montaTabelaLinhasFixas(arredCtx, "linhas", "tipoFolha", "Tipo de Folha", [
        { key: "calcula", label: "Calcula", control: "select", options: ["Sim", "Não"] },
        { key: "valor", label: "Valor", control: "text", placeholder: "Ex.: 0,01", dependsOn: "calcula", obrigatorioQuandoAtivo: true },
        { key: "formaDesconto", label: "Forma de Desconto", control: "text", placeholder: "Ex.: Não descontar", dependsOn: "calcula", obrigatorioQuandoAtivo: true },
      ]);
    }

    function renderArredondamento() {
      arredCtx.obrigatorios = [];
      return (
        '<div class="card">' +
        '<div class="card-header"><div class="card-title">Arredondamento</div></div>' +
        // gap-3, não gap-4 (correção da auditoria visual, achado P3) — mesmo
        // espaçamento de card-content já usado por Geral e Regime.
        '<div class="card-content flex flex-col gap-3">' +
        montaCalculaPara() +
        '<div class="detail-section"><h3 class="detail-section-title">Tabela de Configurações</h3>' +
        montaTabelaArredondamento() +
        "</div>" +
        "</div>" +
        (arredCtx.mode === "view"
          ? ""
          : '<div class="card-footer justify-end">' +
            '<button type="button" class="btn btn-outline" id="btn-cancelar-arredondamento">Cancelar</button>' +
            '<button type="button" class="btn" id="btn-salvar-arredondamento">Salvar parâmetros</button>' +
            "</div>") +
        "</div>"
      );
    }

    // ===== Adiantamento (Fase 4 —
    // docs/folha-pagamento-fase4-analise-arquitetura-adiantamento-decimo-terceiro.md)
    // ===== 2 subgrupos da fonte: Definições + Proporcionalidade. Sem
    // Accordion (seção 7 da arquitetura — só 2 subgrupos, mesmo critério que
    // já dispensou Accordion em Regime).
    function montaAdiantamentoDefinicoes() {
      const d = adiantamentoCtx.form.definicoes;
      // "Calcular para" — decisão da arquitetura (seções 5 e 9): apesar de
      // classificado Base pela fonte, o próprio texto ("além dos
      // empregados, padrão") prova que nenhuma opção marcada é um estado
      // funcional válido (só empregados recebem adiantamento) — por isso,
      // diferente de Arredondamento, NENHUM item deste grupo é registrado
      // em `adiantamentoCtx.obrigatorios`, e não há mensagem de "grupo
      // vazio" aqui.
      const calcularParaHtml =
        '<div class="detail-field detail-field-wide">' +
        '<span class="detail-field-label">Calcular para (além de Empregados, padrão)</span>' +
        '<div class="flex flex-col gap-2">' +
        AD.checkboxField("definicoes.calcularPara.estagiarios", "Estagiários") +
        AD.checkboxField("definicoes.calcularPara.contribuintes", "Contribuintes") +
        AD.checkboxField("definicoes.calcularPara.aprendiz", "Aprendiz") +
        "</div></div>";
      return (
        calcularParaHtml +
        AD.campoGrid(
          AD.radioField("Base de Cálculo", "definicoes.baseCalculo", O.baseCalculoAdiantamento, { obrigatorio: true, wide: true }) +
            AD.textField("Percentual (%)", "definicoes.percentual", { obrigatorio: true, placeholder: "Ex.: 40" })
        ) +
        AD.condRule(
          AD.checkboxField("definicoes.percentualDiferenciadoEstagiarios.ativo", "Utilizar percentual diferenciado para estagiários"),
          d.percentualDiferenciadoEstagiarios.ativo ? AD.textField("Percentual diferenciado para estagiários (%)", "definicoes.percentualDiferenciadoEstagiarios.percentual", { obrigatorio: true, placeholder: "Ex.: 35" }) : ""
        ) +
        AD.checklist([
          ["definicoes.considerarComissaoCompetenciaAnterior", "Considerar para empregado comissionado o valor pago de comissão na competência anterior ao cálculo da folha de adiantamento"],
          ["definicoes.considerarGarantiaMinima", "Considerar para empregado comissionado o valor pago de garantia mínima"],
          ["definicoes.considerarApenasGarantiaMinimaComSalario", "Considerar para empregado comissionado com salário apenas o valor pago de garantia mínima"],
          ["definicoes.naoCalcularAntecipacaoComAdiantamentoLancado", "Não calcular antecipação salarial na folha de adiantamento para quem tem adiantamento lançado"],
        ]) +
        AD.condRule(
          AD.checkboxField("definicoes.permitirMaisDeUmAdiantamento.ativo", "Permitir mais de um adiantamento"),
          d.permitirMaisDeUmAdiantamento.ativo ? AD.textField("Limitar o total das parcelas em (%)", "definicoes.permitirMaisDeUmAdiantamento.limitarPercentual", { obrigatorio: true, placeholder: "Ex.: 30" }) : ""
        )
      );
    }

    // Um bloco por gatilho de proporcionalidade (férias/licença-maternidade/
    // outros afastamentos/admissão) — os 4 são paralelos e independentes
    // (seção 6.1 da arquitetura: nenhum depende dos demais). Sub-opções
    // tratadas como checkboxes independentes, não radio (decisão 9.2 — a
    // fonte já declara "Checkbox (grupo)", sem exclusão mútua definida).
    // `montaDependente` só é invocada dentro do ternário (mesma técnica de
    // lazy evaluation já corrigida em Regime — `montaCprb()`): nenhum campo
    // do bloco é registrado como obrigatório-pendente quando o gatilho do
    // bloco está desligado.
    function montaBlocoProporcionalidade(pathPrefix, label, obj, extraHtmlFn) {
      // Correção da auditoria visual (achado P2): o gatilho "Se estiver
      // trabalhando no mínimo [N] dias" e seu campo numérico dependente NÃO
      // usam mais um segundo `condRule()` (2ª caixa `.condrule` cheia
      // aninhada dentro da 1ª) — passam a viver como conteúdo comum dentro
      // do MESMO `.condrule-dependent` do nível superior (mesmo princípio já
      // usado pelo CPRB em Regime: campos dependentes soltos dentro de um
      // único `.condrule-dependent`, sem caixa própria). O checkbox entrou
      // na mesma `checklist()` dos outros 3 itens irmãos; o campo numérico
      // continua sendo construído SÓ dentro do ternário (mesma lazy
      // evaluation de antes — nada muda em obrigatoriedade/gatilho).
      function montaDependente() {
        return (
          (extraHtmlFn ? extraHtmlFn() : "") +
          AD.checklist([
            [pathPrefix + ".considerarProporcionalmenteDiasTrabalhados", "Considerar proporcionalmente aos dias trabalhados"],
            [pathPrefix + ".seEstiverTrabalhandoNaDataPagamento", "Se estiver trabalhando na data do pagamento"],
            [pathPrefix + ".naoConsiderarLicencaRemuneradaComoTrabalhado", "Não considerar a licença remunerada como dias trabalhados"],
            [pathPrefix + ".seEstiverTrabalhandoMinimoDias.ativo", "Se estiver trabalhando no mínimo [N] dias"],
          ]) +
          (obj.seEstiverTrabalhandoMinimoDias.ativo ? AD.textField("Número mínimo de dias", pathPrefix + ".seEstiverTrabalhandoMinimoDias.dias", { obrigatorio: true, placeholder: "Ex.: 15" }) : "")
        );
      }
      return AD.condRule(AD.checkboxField(pathPrefix + ".ativo", label), obj.ativo ? montaDependente() : "");
    }

    function montaAdiantamentoProporcionalidade() {
      const p = adiantamentoCtx.form.proporcionalidade;
      return (
        montaBlocoProporcionalidade("proporcionalidade.ferias", "Calcular adiantamento na competência de férias", p.ferias) +
        montaBlocoProporcionalidade("proporcionalidade.licencaMaternidade", "Calcular adiantamento na competência que houver afastamento por licença-maternidade", p.licencaMaternidade) +
        // "Motivo" — solução neutra/provisória (seção 10.1 da arquitetura):
        // texto livre, não um <select> com opções fabricadas — nenhum
        // catálogo de motivos de afastamento existe em nenhuma trilha do
        // protótipo.
        montaBlocoProporcionalidade("proporcionalidade.outrosAfastamentos", "Calcular adiantamento na competência que houver outros afastamentos", p.outrosAfastamentos, () =>
          AD.textField("Motivo do afastamento", "proporcionalidade.outrosAfastamentos.motivo", { obrigatorio: true, wide: true, placeholder: "Ex.: Acidente de trabalho" })
        ) +
        montaBlocoProporcionalidade("proporcionalidade.admissao", "Calcular adiantamento na competência da admissão", p.admissao)
      );
    }

    function renderAdiantamento() {
      adiantamentoCtx.obrigatorios = [];
      return (
        '<div class="card">' +
        '<div class="card-header"><div class="card-title">Adiantamento</div></div>' +
        '<div class="card-content flex flex-col gap-3">' +
        '<div class="detail-section"><h3 class="detail-section-title">Definições</h3>' + montaAdiantamentoDefinicoes() + "</div>" +
        '<div class="detail-section"><h3 class="detail-section-title">Proporcionalidade</h3>' + montaAdiantamentoProporcionalidade() + "</div>" +
        "</div>" +
        (adiantamentoCtx.mode === "view"
          ? ""
          : '<div class="card-footer justify-end">' +
            '<button type="button" class="btn btn-outline" id="btn-cancelar-adiantamento">Cancelar</button>' +
            '<button type="button" class="btn" id="btn-salvar-adiantamento">Salvar parâmetros</button>' +
            "</div>") +
        "</div>"
      );
    }

    // ===== 13º Salário (Fase 4) — 2 subgrupos: Geral + 13º Adiantamento.
    // Sem Accordion (mesmo critério de Adiantamento acima). "13º Salário >
    // Geral" tem ~21 campos majoritariamente Opcionais — lista única de
    // checklist, sem agrupamento adicional (decisão de arquitetura, seção
    // 7 — risco de densidade registrado para avaliação na auditoria visual,
    // não bloqueante). =====
    function montaDecimoTerceiroGeral() {
      const g = decimoTerceiroCtx.form.geral;
      return (
        DT.checklist([
          ["geral.descontarFaltasAutomaticamente", "Descontar faltas automaticamente"],
          ["geral.descontarFaltasNoturnas", "Descontar faltas noturnas"],
          ["geral.pagarAdicionais", "Pagar adicionais"],
          ["geral.pagarMedias", "Pagar médias (Horas/Valor)"],
          ["geral.considerarMesAdmissaoMediasSemAvo", "Considerar o mês da admissão no cálculo de médias mesmo que não tenha direito ao avo correspondente"],
          ["geral.ajustarDezembroFavorEmpregado", "Ajustar cálculo do 13º salário em dezembro favorável ao empregado"],
          ["geral.ajustarDezembroFavorEmpregador", "Ajustar cálculo do 13º salário em dezembro favorável ao empregador"],
          ["geral.pagarParaEstagiarios", "Pagar para estagiários"],
          ["geral.calcularParaRescisaoJustaCausa", "Calcular 13º salário para rescisão com justa causa"],
          ["geral.naoCalcularProporcionalRescisaoMotivoAntecipado", "Não calcular 13º salário proporcional para rescisão com motivo antecipado pelo empregador por falta disciplinar grave do aprendiz"],
        ]) +
        // 3 campos "Checkbox + Botão" — mesmo padrão de "Configurar rubricas
        // para desconto compulsório" (Geral > Personaliza, Fase 1):
        // checkbox marcado revela um botão desabilitado ("fluxo fora do
        // escopo desta fase"), via condRule.
        DT.condRule(
          DT.checkboxField("geral.desconsiderarAfastamentosDiasDireito", "Desconsiderar os afastamentos para o cálculo dos dias de direito"),
          g.desconsiderarAfastamentosDiasDireito ? DT.botaoForaDeEscopo("Selecionar motivos", "Fluxo de seleção de motivos de afastamento fora do escopo desta fase") : ""
        ) +
        DT.condRule(
          DT.checkboxField("geral.considerarMesAfastamentoMediasSemAvo", "Considerar o mês do afastamento no cálculo de médias mesmo que não tenha direito ao avo no mês"),
          g.considerarMesAfastamentoMediasSemAvo ? DT.botaoForaDeEscopo("Selecionar motivos", "Fluxo de seleção de motivos de afastamento fora do escopo desta fase") : ""
        ) +
        DT.checklist([["geral.naoCalcularMediasComissaoAposMudancaMensalista", "Não calcular médias de 13º salário sobre comissões do período em que o empregado era comissionado, quando alterada a categoria de Comissionado para Mensalista"]]) +
        DT.condRule(
          DT.checkboxField("geral.considerarMesAfastamentoDivisorMedias", "Considerar o mês do afastamento como divisor no cálculo de médias mesmo que não tenha direito ao avo no mês"),
          g.considerarMesAfastamentoDivisorMedias ? DT.botaoForaDeEscopo("Selecionar motivos", "Fluxo de seleção de motivos de afastamento fora do escopo desta fase") : ""
        ) +
        DT.checklist([
          ["geral.considerarAvoSomenteDiasTrabalhados", "Considerar para o avo de 13º salário somente a quantidade de dias efetivamente trabalhados no mês"],
          ["geral.utilizarRubricasDescontoDiferencaComEncargos", "Utilizar na rescisão as rubricas de desconto diferença 13º com incidência de encargos"],
        ]) +
        // Condicional AUTOCONTIDO (decisão 9.3/10.2 da arquitetura): não lê
        // `regimeCtx` nem qualquer estado de Regime/CPRB — nenhuma
        // integração cross-tab foi criada. O texto já explica a condição
        // de aplicabilidade (empresa com desoneração parcial da folha) sem
        // depender de um gatilho técnico desta tela.
        DT.checklist([["geral.calcularInssEmpresaRescisaoConformeReducao", "Calcular o INSS Empresa correspondente ao 13º salário pago na rescisão conforme o percentual de redução obtido pelo resultado das receitas dos últimos 12 meses (aplicável a empresas com desoneração parcial da folha)"]]) +
        DT.condRule(
          DT.checkboxField("geral.desconsiderarMesDivisorMedias.ativo", "Desconsiderar o mês como divisor no cálculo de médias de 13º, se o empregado ficou [N] dias ou mais com redução salarial"),
          g.desconsiderarMesDivisorMedias.ativo ? DT.textField("Número de dias", "geral.desconsiderarMesDivisorMedias.dias", { obrigatorio: true, placeholder: "Ex.: 15" }) : ""
        ) +
        DT.checklist([
          ["geral.considerarAusenciaJustificadaAvoDomestico", "Considerar o afastamento por ausência justificada para cálculo do avo de 13º salário para empregado doméstico"],
          ["geral.considerarAvoCompetenciasComCalculoTrocaIntermitente", "Considerar para o avo de 13º salário somente as competências do ano-calendário que possuem cálculo, quando houve troca de categoria Intermitente para outros vínculos"],
          ["geral.pagarProporcionalMensalistaHoristaTrocaCategoria", "Pagar 13º salário proporcionalmente aos meses como Mensalista e Horista Variável quando houver troca de categoria"],
        ])
      );
    }

    function montaDecimoTerceiro13Adiantamento() {
      const a = decimoTerceiroCtx.form.decimoAdiantamento;
      return (
        DT.campoGrid(DT.textField("Percentual de adiantamento (%)", "decimoAdiantamento.percentual", { obrigatorio: true, placeholder: "Ex.: 50" })) +
        DT.condRule(
          DT.checkboxField("decimoAdiantamento.permiteMaisDeUmAdiantamento.ativo", "Permite mais de um adiantamento"),
          a.permiteMaisDeUmAdiantamento.ativo ? DT.textField("Limitar o total das parcelas em (%) do 13º integral", "decimoAdiantamento.permiteMaisDeUmAdiantamento.limitarPercentual", { obrigatorio: true, placeholder: "Ex.: 30" }) : ""
        ) +
        // Decisão 9.1 da arquitetura: os dois checkboxes de prazo-limite
        // abaixo são mantidos INDEPENDENTES (fiéis ao tipo de campo
        // literal da fonte, "Checkbox", não "Radio") — nenhuma exclusão
        // mútua foi inventada entre eles.
        DT.checklist([
          ["decimoAdiantamento.pagarAteDezembroAdmitidosNoAno", "Pagar adiantamento até dezembro para empregados admitidos no ano"],
          ["decimoAdiantamento.pagarAteMesAnteriorAdmitidosNoAno", "Pagar adiantamento até o mês anterior para empregados admitidos no ano"],
          ["decimoAdiantamento.calcularComBaseSalarioMesAnterior", "Calcular adiantamento com base no salário do mês anterior ao cálculo"],
          ["decimoAdiantamento.pagarAdicionais", "Pagar adicionais"],
          ["decimoAdiantamento.pagarMedias", "Pagar médias (Horas/Valor)"],
          ["decimoAdiantamento.calcularNaFolhaMensal", "Calcular adiantamento de 13º salário na folha mensal"],
          ["decimoAdiantamento.descontarValorJaAdiantadoComAlteracaoSalarial", "Descontar do cálculo de 13º Adiantamento o valor de 13º já adiantado em competências anteriores se possuir alteração salarial"],
        ])
      );
    }

    function renderDecimoTerceiro() {
      decimoTerceiroCtx.obrigatorios = [];
      return (
        '<div class="card">' +
        '<div class="card-header"><div class="card-title">13º Salário</div></div>' +
        '<div class="card-content flex flex-col gap-3">' +
        '<div class="detail-section"><h3 class="detail-section-title">Geral</h3>' + montaDecimoTerceiroGeral() + "</div>" +
        '<div class="detail-section"><h3 class="detail-section-title">13º Adiantamento</h3>' + montaDecimoTerceiro13Adiantamento() + "</div>" +
        "</div>" +
        (decimoTerceiroCtx.mode === "view"
          ? ""
          : '<div class="card-footer justify-end">' +
            '<button type="button" class="btn btn-outline" id="btn-cancelar-decimo-terceiro">Cancelar</button>' +
            '<button type="button" class="btn" id="btn-salvar-decimo-terceiro">Salvar parâmetros</button>' +
            "</div>") +
        "</div>"
      );
    }

    // ===== Férias (Fase 5) — 3 subgrupos: Geral (21) + Opções (13) +
    // Rescisão (5). Sem Accordion (decisão de arquitetura, seção 8) — cada
    // subgrupo é um `.detail-section` manual (mesmo padrão de Adiantamento/
    // 13º Salário: `checklist()`/`condRule()` concatenados diretamente,
    // sem `campoGrid()`, porque a maioria dos 39 campos é checkbox solto,
    // não campo de formulário lado a lado). =====
    function montaFeriasGeral() {
      const g = feriasCtx.form.geral;
      return (
        FH.checklist([
          ["geral.descontarFaltas", "Descontar faltas"],
          ["geral.descontarFaltasNoturnas", "Descontar faltas noturnas"],
          ["geral.descontarFaltasSuspensas", "Descontar faltas suspensas"],
          ["geral.informarDataLancamentoFaltas", "Informar data no lançamento de faltas"],
          ["geral.usarFaltasParciais", "Usar faltas parciais para o desconto de dias de férias"],
          // Campo 6 — checkbox simples, sem "+Botão" (decisão 9.1 da
          // arquitetura: fidelidade literal ao tipo de campo documentado).
          ["geral.desconsiderarAfastamentosDiasDireito", "Desconsiderar os afastamentos para o cálculo dos dias de direito"],
          ["geral.pagarAdicionais", "Pagar adicionais"],
          ["geral.pagarMedias", "Pagar médias"],
          // Menção lateral a 13º Salário — autocontido, sem cross-tab (seção 12 da arquitetura).
          ["geral.adiantarPrimeiraParcela13", "Adiantar 1ª parcela do 13º"],
        ]) +
        // Par #10→#11 — checkbox dependente puramente booleano (seção 5 da
        // arquitetura): "Calcular 1/3 de férias para Estagiários" só entra
        // em `feriasCtx.obrigatorios` quando "Pagar para estagiários" está
        // marcado (lazy evaluation — mesmo padrão já validado em Regime/
        // Adiantamento/13º Salário: o dependente só é construído dentro do
        // ternário abaixo).
        FH.condRule(
          FH.checkboxField("geral.pagarParaEstagiarios", "Pagar para estagiários"),
          g.pagarParaEstagiarios ? checkboxCondicional("geral.calcular1_3Estagiarios", "Calcular 1/3 de férias para Estagiários") : ""
        ) +
        // Campo 12 é, ao mesmo tempo, "Checkbox + Botão" (próprio) e gatilho
        // do par #12→#13 — o botão (`botaoForaDeEscopo`) e o dependente #13
        // vivem dentro do mesmo `.condrule-dependent`, sem `condRule`
        // aninhado (mesmo princípio já corrigido em Adiantamento > Proporcionalidade, achado P2 da Fase 4).
        FH.condRule(
          FH.checkboxField("geral.considerarDiasAfastadosDilatarLimiteGozo", "Considerar os dias afastados no período concessivo para dilatar o limite de gozo"),
          g.considerarDiasAfastadosDilatarLimiteGozo
            ? FH.botaoForaDeEscopo("Selecionar motivos", "Fluxo de seleção de motivos de afastamento fora do escopo desta fase") +
              checkboxCondicional("geral.limitarDilatacaoLimiteGozo12Meses", "Limitar a dilatação do limite de gozo para 12 meses posteriores ao retorno do afastamento")
            : ""
        ) +
        FH.checklist([
          ["geral.incluirMovimentoFeriasFolhaMensal", "Incluir movimento de férias na folha mensal"],
          ["geral.mediasAdicionaisLicencaRemunerada", "Médias e adicionais na licença remunerada"],
          ["geral.naoCalcularSalarioFamilia", "Não calcular salário família no cálculo de férias"],
          // Campo 17 — mantido independente do campo 18 (decisão 9.2 da
          // arquitetura: nenhuma validação cruzada inventada).
          ["geral.naoCalcularContribuicaoSindical", "Não calcular contribuição sindical no cálculo de férias"],
        ]) +
        // Campo 18 — condRule autocontido (checkbox + numérico do próprio
        // campo composto), mesmo padrão já usado em 13º Salário > Geral
        // ("Desconsiderar o mês como divisor...").
        FH.condRule(
          FH.checkboxField("geral.calcularContribuicaoSindicalMinimoDias.ativo", "Calcular contribuição sindical nas férias se o empregado gozou no mínimo [N] dias de férias na competência do desconto"),
          g.calcularContribuicaoSindicalMinimoDias.ativo ? FH.textField("Número mínimo de dias", "geral.calcularContribuicaoSindicalMinimoDias.dias", { obrigatorio: true, placeholder: "Ex.: 15" }) : ""
        ) +
        FH.checklist([["geral.naoConsiderarAfastadosLicencaSemVencimento", "Não considerar os dias afastados por licença sem vencimento para dilatar o período aquisitivo"]]) +
        // Campos 20/21 — "Checkbox + Botão" soltos (não gatilhos de nenhum
        // outro campo) — mesmo tratamento de "Selecionar motivos" já usado
        // em 13º Salário > Geral.
        FH.condRule(
          FH.checkboxField("geral.considerarMesesContagemAfastamento", "Considerar em meses a contagem do período de afastamento"),
          g.considerarMesesContagemAfastamento ? FH.botaoForaDeEscopo("Selecionar motivos", "Fluxo de seleção de motivos de afastamento fora do escopo desta fase") : ""
        ) +
        FH.condRule(
          FH.checkboxField("geral.naoConsiderarDiasAfastadosDilatarPeriodoAquisitivoAprendiz", "Não considerar os dias afastados para dilatar o período aquisitivo do aprendiz"),
          g.naoConsiderarDiasAfastadosDilatarPeriodoAquisitivoAprendiz ? FH.botaoForaDeEscopo("Selecionar motivos", "Fluxo de seleção de motivos de afastamento fora do escopo desta fase") : ""
        )
      );
    }

    function montaFeriasOpcoes() {
      const o = feriasCtx.form.opcoes;
      return (
        // Par #22→#23 — mesmo tratamento booleano do par #10→#11 acima.
        FH.condRule(
          FH.checkboxField("opcoes.calcular1_3LicencaRemunerada", "Calcular 1/3 de férias na licença remunerada"),
          o.calcular1_3LicencaRemunerada ? checkboxCondicional("opcoes.calcular1_3SalarioContratual", "Calcular 1/3 de férias sobre o valor do salário contratual") : ""
        ) +
        // Campo 24 — "Checkbox + Botão" solto.
        FH.condRule(
          FH.checkboxField("opcoes.calcularLicencaRemuneradaMenor18", "Calcular licença remunerada para empregado menor de 18 anos quando as férias coletivas não coincidem com seu período"),
          o.calcularLicencaRemuneradaMenor18 ? FH.botaoForaDeEscopo("Selecionar motivos", "Fluxo de seleção de motivos de afastamento fora do escopo desta fase") : ""
        ) +
        // Campos 25-31 + trio 32/33/34 (decisão 9.3 da arquitetura: 3
        // checkboxes independentes, não radio — notação "Radio/Checkbox" da
        // fonte tratada como ambígua, não resolvida aqui).
        FH.checklist([
          ["opcoes.pagarDiasGozoExcedentesLicencaRemunerada", "Pagar dias de gozo excedentes aos dias de direito como licença remunerada quando há perda de dias por faltas"],
          ["opcoes.informarDataSolicitacaoAbonoPecuniario", "Informar data da solicitação do abono pecuniário 15 dias antes do fim do período aquisitivo"],
          ["opcoes.calcularFeriasSalarioMedioReducaoSalarial", "Calcular as férias com valor do salário médio do período aquisitivo quando houver redução de salário"],
          ["opcoes.naoCalcularMediasComissoesMudancaMensalista", "Não calcular médias de férias sobre comissões do período que o empregado era comissionado quando alterada a categoria de Comissionado para Mensalista"],
          ["opcoes.gerarValorLicencaRemuneradaCalculoFerias", "Gerar o valor da licença remunerada no cálculo das férias"],
          ["opcoes.calcularPeriodoCompletoFeriasDobro", "Calcular o período completo de férias em dobro quando ultrapassar a data do limite para gozo"],
          ["opcoes.naoCalcularFeriasGozoInferior10Dias", "Não calcular férias com dias de gozo inferior a 10 dias"],
          ["opcoes.considerarDiasContagemAvosConformeDiasMes", "Considerar os dias para contagem dos avos de férias conforme dias mês"],
          ["opcoes.calculoProporcionalidadeSempre30Dias", "Cálculo proporcionalidade nas férias sempre 30 dias"],
          ["opcoes.calcularSalarioProporcionalDiasMes", "Calcular salário proporcional ao número de dias de cada mês na competência de cálculo das férias"],
        ])
      );
    }

    function montaFeriasRescisao() {
      // 5 campos, todos Opcionais e independentes (inclusive o par 37/38 —
      // decisão 9.4 da arquitetura: ambos classificados Opcional pela
      // fonte, não Condicional, logo sem `condRule` entre eles).
      return FH.checklist([
        ["rescisao.calcularFeriasProporcionalJustaCausa", "Calcular férias proporcional para rescisão com justa causa"],
        ["rescisao.naoDescontarFaltasAvosIndenizado", "Não descontar faltas sobre os avos de férias indenizado"],
        ["rescisao.pagarIntegralFeriasProporcionalPeriodoAquisitivoIncompleto", "Pagar integral férias proporcional na rescisão para período aquisitivo incompleto já gozado"],
        ["rescisao.pagarFeriasIndenizadasPeriodoAquisitivoIncompleto", "Pagar férias indenizadas na rescisão quando o período aquisitivo incompleto já foi gozado"],
        ["rescisao.considerarDiasAvisoPrevioIndenizadoFeriasDobro", "Considerar os dias de aviso prévio indenizado para o cálculo das férias em dobro"],
      ]);
    }

    function renderFerias() {
      feriasCtx.obrigatorios = [];
      return (
        '<div class="card">' +
        '<div class="card-header"><div class="card-title">Férias</div></div>' +
        '<div class="card-content flex flex-col gap-3">' +
        '<div class="detail-section"><h3 class="detail-section-title">Geral</h3>' + montaFeriasGeral() + "</div>" +
        '<div class="detail-section"><h3 class="detail-section-title">Opções</h3>' + montaFeriasOpcoes() + "</div>" +
        '<div class="detail-section"><h3 class="detail-section-title">Rescisão</h3>' + montaFeriasRescisao() + "</div>" +
        "</div>" +
        (feriasCtx.mode === "view"
          ? ""
          : '<div class="card-footer justify-end">' +
            '<button type="button" class="btn btn-outline" id="btn-cancelar-ferias">Cancelar</button>' +
            '<button type="button" class="btn" id="btn-salvar-ferias">Salvar parâmetros</button>' +
            "</div>") +
        "</div>"
      );
    }

    // ===== Contabilidade (Fase 6) — 3 sub-abas: Geral (8 campos) + Opções
    // (6 campos) + Filial Ativa (pendência). Sem Accordion (seção 12.1 da
    // arquitetura — mesmo critério que já dispensou Accordion em Férias,
    // 3 subgrupos). =====
    function montaContabilidadeGeral() {
      const g = contabilidadeCtx.form.geral;
      const habilitado = g.geraLancamentosContabeis;
      const gatilhoHtml = CH.checkboxField("geral.geraLancamentosContabeis", "Gera lançamentos contábeis");

      // ESCOPO PROVISÓRIO (decisão aberta 7.1 da arquitetura da Fase 6): a
      // fonte declara que, desmarcado, "os demais campos DESTA ABA ficam
      // bloqueados" — lido aqui, pela posição do texto na subseção 9.1, como
      // restrito aos campos 2-8 de "Geral". NÃO estende o bloqueio a
      // "Opções"/"Filial Ativa" (sub-abas numeradas separadamente, 9.2/9.3,
      // não mencionadas nessa frase) — se uma confirmação futura (novo
      // levantamento) mostrar que o bloqueio deveria alcançar as demais
      // sub-abas, ajustar aqui e em montaContabilidadeOpcoes()/
      // montaContabilidadeFilialAtiva() (mudança aditiva e isolada).
      if (!habilitado) {
        return (
          gatilhoHtml +
          '<div class="flex items-start gap-2" style="margin-top:4px;">' +
          '<span style="color:var(--muted-foreground);flex-shrink:0;margin-top:1px;">' + Icon("info", "size-3-5") + "</span>" +
          '<span class="text-xs text-muted">Habilite "Gera lançamentos contábeis" para configurar os demais campos de Contabilidade &gt; Geral.</span>' +
          "</div>"
        );
      }

      return (
        gatilhoHtml +
        // Campo 2 — Checkbox + Combo, mas a fonte só dá 1 exemplo do Combo
        // ("conforme percentual definido na Contabilidade") — mesmo
        // critério documentado no topo de data.js: 1 exemplo isolado vira
        // texto livre, não um <select> com opções inventadas.
        CH.condRule(
          CH.checkboxField("geral.contabilidadePorCentroCusto.ativo", "Contabilidade por centro de custo"),
          g.contabilidadePorCentroCusto.ativo
            ? CH.textField("Rateio de lançamentos", "geral.contabilidadePorCentroCusto.rateio", { obrigatorio: true, placeholder: "Ex.: Conforme percentual definido na Contabilidade" })
            : ""
        ) +
        CH.campoGrid(
          CH.selectField("Separar lançamentos por", "geral.separarLancamentosPor", O.separarLancamentosPor, { obrigatorio: true }) +
            CH.textField("Gera lançamentos na empresa (código/nome)", "geral.geraLancamentosEmpresa", { obrigatorio: true }) +
            // "Possui SCP" — Combo sem nenhum exemplo de valor na fonte (só
            // "Combo", sem "ex.:") — mesmo critério acima, texto livre.
            CH.textField("Possui Sociedade em Conta de Participação — SCP", "geral.possuiScp", { obrigatorio: true })
        ) +
        // Campo 5 — "Texto/Botão" (Opcional), sem fluxo/layout de exportação
        // detalhado pela fonte — mesmo tratamento de "Botão" já usado em
        // Geral/13º Salário/Férias (botaoForaDeEscopo).
        CH.botaoForaDeEscopo("Configurar exportação", "Fluxo de configuração de layout/arquivo de exportação fora do escopo desta fase") +
        // Campo 7 — checkbox-grupo Condicional com 5 sub-eventos, sem
        // obrigatoriedade de seleção mínima (decisão 7.2 da arquitetura —
        // vazio é válido dentro do grupo habilitado, mesmo padrão de
        // "Calcular para" em Adiantamento/Fase 4: nenhum item entra em
        // `contabilidadeCtx.obrigatorios`).
        CH.condRule(
          CH.checkboxField("geral.integracaoPorColaborador.ativo", "Gerar integração contábil por colaborador"),
          g.integracaoPorColaborador.ativo
            ? CH.checklist([
                ["geral.integracaoPorColaborador.folhaMensal", "Folha Mensal"],
                ["geral.integracaoPorColaborador.ferias", "Férias"],
                ["geral.integracaoPorColaborador.rescisao", "Rescisão"],
                ["geral.integracaoPorColaborador.provisaoFerias", "Provisão de Férias"],
                ["geral.integracaoPorColaborador.provisaoDecimoTerceiro", "Provisão de 13º"],
              ])
            : ""
        ) +
        CH.campoGrid(
          CH.radioField(
            "Configuração do relatório de provisão das férias calculadas no mês",
            "geral.configuracaoRelatorioProvisaoFerias",
            O.configuracaoRelatorioProvisaoFerias,
            { obrigatorio: true, wide: true }
          )
        )
      );
    }

    function montaContabilidadeOpcoes() {
      return (
        // Campos 9/10 — checkboxes Opcionais independentes. A decisão
        // aberta 7.2 da arquitetura (a fonte não declara explicitamente
        // esta dependência) foi resolvida como pendência P14 do diagnóstico
        // pós-congelamento (docs/folha-pagamento-pendencias-fases1-8.md):
        // quando marcado, a linha correspondente ("Rescisão"/"Férias") da
        // tabela abaixo fica desabilitada (mesmo tratamento visual/
        // `disabled` de Arredondamento), via `dependsOnExterno` — evolução
        // aditiva de `montaTabelaLinhasFixas()`. Nenhuma obrigatoriedade
        // nova foi criada: a linha desabilitada apenas deixa de ser exigida
        // no salvamento, e o valor eventualmente já preenchido é preservado
        // (não é limpo por este checkbox).
        CH.checklist([
          ["opcoes.usarMesmaConfigRescisao", "Usar a mesma configuração da folha normal para: Rescisão"],
          ["opcoes.usarMesmaConfigFerias", "Usar a mesma configuração da folha normal para: Férias"],
        ]) +
        '<div class="detail-section"><h3 class="detail-section-title">Configurações — Tipo de Cálculo × Data' +
        (contabilidadeCtx.mode === "edit" ? ' <span class="text-muted">*</span>' : "") +
        "</h3>" +
        montaTabelaLinhasFixas(contabilidadeCtx, "opcoes.linhasTipoCalculo", "tipoCalculo", "Tipo de Cálculo", [
          {
            key: "data",
            label: "Data",
            control: "select",
            options: O.dataReferenciaContabil,
            obrigatorio: true,
            dependsOnExterno: [
              { somenteLinhas: ["Rescisão"], get: (form) => !!form.opcoes.usarMesmaConfigRescisao },
              { somenteLinhas: ["Férias"], get: (form) => !!form.opcoes.usarMesmaConfigFerias },
            ],
          },
        ]) +
        "</div>" +
        CH.checklist([
          ["opcoes.integrarIrrfFeriasDataPagamento", "Integrar IRRF Férias na data do pagamento das férias"],
          ["opcoes.gerarProvisaoSefipPagamentoEncargos", "Gerar o valor da provisão do ajuste SEFIP no momento do pagamento dos encargos de INSS, FGTS e GRRF"],
          ["opcoes.considerarUltimoDiaMesNaoUtil", "Considerar o último dia do mês, independente se cair em dia não útil, para data de lançamento como Final do Mês e para provisões"],
        ])
      );
    }

    // Solução provisória (seção 9.3 da arquitetura): a fonte confirma a
    // existência da sub-aba, mas não capturou nenhuma coluna/botão/regra da
    // grade — nenhum campo é fabricado aqui. Mesmo componente `.alert`/
    // `.alert-warning` já usado em prototype/empresas/js/importar.js para
    // comunicar limite de escopo de uma funcionalidade.
    function montaContabilidadeFilialAtiva() {
      return (
        '<div class="alert alert-warning gap-2">' +
        Icon("alert-triangle", "size-4") +
        '<div class="alert-desc"><b>Conteúdo pendente de levantamento complementar.</b> A existência desta sub-aba é confirmada pela documentação funcional, mas o detalhamento das colunas, botões e regras de seleção da grade de filiais ativas não foi capturado na fonte disponível — nenhum campo foi criado aqui até que uma nova captura de tela do sistema (com a sub-aba aberta) esteja disponível.</div></div>'
      );
    }

    function renderContabilidade() {
      contabilidadeCtx.obrigatorios = [];
      return (
        '<div class="card">' +
        '<div class="card-header"><div class="card-title">Contabilidade</div></div>' +
        '<div class="card-content flex flex-col gap-3">' +
        '<div class="detail-section"><h3 class="detail-section-title">Geral</h3>' + montaContabilidadeGeral() + "</div>" +
        '<div class="detail-section"><h3 class="detail-section-title">Opções</h3>' + montaContabilidadeOpcoes() + "</div>" +
        '<div class="detail-section"><h3 class="detail-section-title">Filial Ativa</h3>' + montaContabilidadeFilialAtiva() + "</div>" +
        "</div>" +
        (contabilidadeCtx.mode === "view"
          ? ""
          : '<div class="card-footer justify-end">' +
            '<button type="button" class="btn btn-outline" id="btn-cancelar-contabilidade">Cancelar</button>' +
            '<button type="button" class="btn" id="btn-salvar-contabilidade">Salvar parâmetros</button>' +
            "</div>") +
        "</div>"
      );
    }

    // ===== Honorários (Fase 6) — 3 campos, sem sub-agrupamento nomeado
    // pela fonte (seção 5/12.1 da arquitetura) — cabem diretamente no Card,
    // sem Accordion nem `secao()` adicional. =====
    // Tabela de rubricas — linhas DINÂMICAS (incluir/excluir), estrutura
    // diferente da tabela de linhas fixas de Contabilidade/Arredondamento
    // (seção 9.2 da arquitetura) — inspirada no padrão de tabela dinâmica já
    // usado em prototype/sindicatos/js/convencao-detail.js (coluna de ação
    // na última posição, botão "Incluir"/"excluir" no cabeçalho/linha), mas
    // composta localmente aqui: não reaproveita montaTabelaLinhasFixas()
    // (linhas fixas) nem o fluxo completo de drawer de Convenção (fora do
    // escopo desta fase). Nenhuma obrigatoriedade por célula é imposta — a
    // fonte exige que a tabela exista/seja operável quando o campo 16 está
    // ativo, não que cada linha tenha todas as células preenchidas.
    function montaTabelaRubricasHonorarios() {
      const editing = honorariosCtx.mode === "edit";
      const rubricas = honorariosCtx.form.rubricas;
      const rowsHtml = rubricas
        .map((r, i) => {
          if (!editing) {
            return "<tr><td>" + (r.rubrica || "—") + "</td><td>" + (r.descricao || "—") + "</td><td>" + (r.encargo || "—") + "</td><td>" + (r.faturaComContrato || "—") + "</td></tr>";
          }
          const optsHtml = O.simNao.map((o) => '<option value="' + o + '"' + (r.faturaComContrato === o ? " selected" : "") + ">" + o + "</option>").join("");
          return (
            "<tr>" +
            '<td><input class="field-input" data-path="rubricas.' + i + '.rubrica" value="' + (r.rubrica || "").replace(/"/g, "&quot;") + '" placeholder="Ex.: INSS Patronal" /></td>' +
            '<td><input class="field-input" data-path="rubricas.' + i + '.descricao" value="' + (r.descricao || "").replace(/"/g, "&quot;") + '" /></td>' +
            '<td><input class="field-input" data-path="rubricas.' + i + '.encargo" value="' + (r.encargo || "").replace(/"/g, "&quot;") + '" placeholder="Ex.: 20%" /></td>' +
            '<td><div class="field-select-wrap"><select class="field-select" data-path="rubricas.' + i + '.faturaComContrato"><option value="">Selecione...</option>' + optsHtml + '</select><span class="chev">' + Icon("chevron-down", "size-4") + "</span></div></td>" +
            '<td class="col-pad-end"><button type="button" class="btn-link" style="color:var(--destructive);" data-remove-rubrica="' + i + '">excluir</button></td>' +
            "</tr>"
          );
        })
        .join("");

      return (
        '<div class="detail-section">' +
        '<div class="flex items-center justify-between gap-3 flex-wrap"><h3 class="detail-section-title">Rubricas de encargos</h3>' +
        (editing ? '<button type="button" class="btn btn-outline btn-sm w-fit" id="btn-incluir-rubrica-honorarios">' + Icon("plus", "size-3-5") + " Incluir rubrica</button>" : "") +
        "</div>" +
        (rubricas.length === 0
          ? '<div class="row-empty-state">Nenhuma rubrica cadastrada.</div>'
          : '<div class="table-wrap"><table class="dtable"><thead><tr><th>Rubrica</th><th>Descrição</th><th>Encargo</th><th>Fatura com contrato</th>' +
            (editing ? '<th class="col-pad-end"></th>' : "") +
            "</tr></thead><tbody>" + rowsHtml + "</tbody></table></div>") +
        "</div>"
      );
    }

    function montaHonorarios() {
      const h = honorariosCtx.form;
      const habilitado = h.gerarVariaveisHonorarios;
      const gatilhoHtml = HH.checkboxField("gerarVariaveisHonorarios", "Gerar variáveis de honorários com o valor dos encargos");

      if (!habilitado) {
        return (
          gatilhoHtml +
          '<div class="flex items-start gap-2" style="margin-top:4px;">' +
          '<span style="color:var(--muted-foreground);flex-shrink:0;margin-top:1px;">' + Icon("info", "size-3-5") + "</span>" +
          '<span class="text-xs text-muted">Habilite "Gerar variáveis de honorários..." para configurar o escritório responsável e as rubricas de encargos.</span>' +
          "</div>"
        );
      }

      return (
        gatilhoHtml +
        HH.campoGrid(HH.textField("Escritório", "escritorio", { obrigatorio: true, wide: true })) +
        montaTabelaRubricasHonorarios()
      );
    }

    function renderHonorarios() {
      honorariosCtx.obrigatorios = [];
      return (
        '<div class="card">' +
        '<div class="card-header"><div class="card-title">Honorários</div></div>' +
        '<div class="card-content flex flex-col gap-3">' + montaHonorarios() + "</div>" +
        (honorariosCtx.mode === "view"
          ? ""
          : '<div class="card-footer justify-end">' +
            '<button type="button" class="btn btn-outline" id="btn-cancelar-honorarios">Cancelar</button>' +
            '<button type="button" class="btn" id="btn-salvar-honorarios">Salvar parâmetros</button>' +
            "</div>") +
        "</div>"
      );
    }

    // ===== Cronograma de Pagamento (Fase 7 — seção 5 da arquitetura) =====
    // 3º consumidor de montaTabelaLinhasFixas() (após Arredondamento e
    // Contabilidade, Fase 6) — 6 linhas fixas (eventos) × 3 colunas. Nomes
    // de evento exatamente como a fonte nomeia (Anexo B/Quadro-Resumo,
    // seção 6/7 do Mapeamento) — "Folha Mensal" é a leitura estrutural da
    // subseção "11.1 Geral" da fonte (decisão provisória 1 da arquitetura,
    // seção 17: a fonte não nomeia esse evento literalmente); "Adiantamento"
    // e "Participação de Lucros" são replicados por analogia estrutural ao
    // mesmo trio de campos (decisão provisória 2 — a fonte só os cita em
    // texto corrido, sem linha própria de detalhamento, seção 3.2 da
    // arquitetura).

    // "Mês do pagamento"/"Forma de vencimento" sem catálogo fechado na fonte
    // (só exemplos "ex.:") — texto livre, mesmo critério já usado desde a
    // Fase 2 (Regime) para não fabricar opções de combo (seção 11 da
    // arquitetura). "Total de dias" é a única coluna condicional: Base(Sim)
    // em todas as 6 linhas, EXCETO na linha "13º Adiantamento", onde fica
    // inativa quando "Forma de vencimento" = "Último dia útil" (único par
    // condicional confirmado pela fonte, seção 6.1/7.1 da arquitetura — não
    // generalizado às demais 5 linhas: `dependsOnSomenteLinhas` restringe a
    // exceção a essa única linha, `obrigatorio: true` mantém as demais
    // sempre Base). `ativoQuandoDiferente` inverte a comparação padrão de
    // `dependsOn` (igualdade) para desigualdade — ver comentário da
    // evolução de montaTabelaLinhasFixas() acima.
    const COLUNAS_CRONOGRAMA = [
      { key: "mesPagamento", label: "Mês do pagamento", control: "text", obrigatorio: true, placeholder: "Ex.: No mesmo mês" },
      { key: "formaVencimento", label: "Forma de vencimento", control: "text", obrigatorio: true, placeholder: "Ex.: Dias corridos antecipados" },
      {
        key: "totalDias",
        label: "Total de dias",
        control: "text",
        obrigatorio: true,
        dependsOn: "formaVencimento",
        ativoValue: "Último dia útil",
        ativoQuandoDiferente: true,
        obrigatorioQuandoAtivo: true,
        dependsOnSomenteLinhas: ["13º Adiantamento"],
        placeholder: "Ex.: 20",
      },
    ];

    const CATEGORIAS_CRONOGRAMA = [
      { key: "empregados", label: "Empregados" },
      { key: "estagiarios", label: "Estagiários" },
      { key: "contribuintes", label: "Contribuintes Individuais" },
    ];

    // Seletor interno de categoria — reaproveita a composição visual já
    // usada para a barra de Tabs de D.AREAS (`.tabs-list`/`.tabs-trigger`,
    // já definidas em components.css), em escopo LOCAL ao Card (não uma Tab
    // de D.AREAS — seção 4.2/9 da arquitetura). `data-categoria-key` é um
    // atributo próprio (distinto de `data-area-key`) para não colidir com o
    // handler de navegação entre Tabs em wireEvents().
    function montaSeletorCategoriaCronograma() {
      return (
        '<div class="tabs-list" style="max-width:fit-content;">' +
        CATEGORIAS_CRONOGRAMA.map(
          (c) => '<button type="button" class="tabs-trigger' + (c.key === cronogramaCtx.categoriaAtiva ? " is-active" : "") + '" data-categoria-key="' + c.key + '">' + c.label + "</button>"
        ).join("") +
        "</div>"
      );
    }

    // Só a categoria ativa é renderizada/validada (decisão de UX 3 da
    // arquitetura, seção 16) — `cronogramaCtx.obrigatorios` é reconstruído a
    // cada render() (ver renderCronograma()) só com os campos da tabela
    // efetivamente chamada aqui; trocar de categoria não valida nem grava
    // nada nas outras 2.
    function montaCronograma() {
      const categoria = cronogramaCtx.categoriaAtiva;
      const editing = cronogramaCtx.mode === "edit";
      return (
        montaSeletorCategoriaCronograma() +
        '<div class="detail-section">' +
        '<h3 class="detail-section-title">Cronograma de pagamento' + (editing ? ' <span class="text-muted">*</span>' : "") + "</h3>" +
        montaTabelaLinhasFixas(cronogramaCtx, categoria + ".linhas", "evento", "Evento", COLUNAS_CRONOGRAMA) +
        "</div>" +
        // "Antecipar pagamento quando a data do pagamento cair no sábado" —
        // único campo Opcional da área (Anexo B, linha 2680-2682),
        // associado ao evento "Folha Mensal" (11.1 "Geral"); campo único,
        // não uma coluna repetida por evento, por isso fica fora da tabela.
        CRH.checklist([[categoria + ".antecipacaoSabado", "Antecipar pagamento quando a data do pagamento cair no sábado"]])
      );
    }

    function renderCronograma() {
      cronogramaCtx.obrigatorios = [];
      return (
        '<div class="card">' +
        '<div class="card-header"><div class="card-title">Cronograma</div></div>' +
        '<div class="card-content flex flex-col gap-3">' + montaCronograma() + "</div>" +
        (cronogramaCtx.mode === "view"
          ? ""
          : '<div class="card-footer justify-end">' +
            '<button type="button" class="btn btn-outline" id="btn-cancelar-cronograma">Cancelar</button>' +
            '<button type="button" class="btn" id="btn-salvar-cronograma">Salvar parâmetros</button>' +
            "</div>") +
        "</div>"
      );
    }

    // ===== Histórico (Fase 8) — log de alterações, somente leitura. =====
    // Reaproveita a composição visual e o modelo de dados já validados em
    // prototype/empresas/js/historico.js (.history-event/.history-event-header,
    // tabela campo/de/para) — ver docs/folha-pagamento-fase8-analise-
    // arquitetura-historico.md, seções 5 e 10. Sem Editar/Salvar/Cancelar:
    // a área é somente leitura (renderHeaderActions não lista "historico").
    // Eventos mockados/estáticos (FolhaData.getHistoricoEventos) — nenhuma
    // instrumentação real dos handlers de "Salvar" das Fases 1-7 (decisão
    // registrada na arquitetura, não tomada nesta implementação). NÃO
    // confundir com o histórico de vigência do Regime (VigenciaSelector,
    // Fase 2) — são componentes e conceitos distintos, este não substitui
    // aquele.
    function linhaAlteracaoHistorico(alt) {
      return (
        "<tr>" +
        "<td>" + alt.campo + "</td>" +
        "<td>" + (alt.de || "—") + "</td>" +
        "<td>" + (alt.para || "—") + "</td>" +
        "</tr>"
      );
    }

    function blocoEventoHistorico(evento) {
      return (
        '<div class="history-event">' +
        '<div class="history-event-header">' +
        '<span class="flex items-center gap-1 text-sm font-medium">' + Icon("clock", "size-3-5") + evento.data + " às " + evento.hora + "</span>" +
        '<span class="badge badge-outline flex items-center gap-1">' + Icon("users", "size-3-5") + evento.usuario + "</span>" +
        "</div>" +
        '<div class="flex items-center gap-2 flex-wrap text-xs text-muted">' +
        '<span class="badge badge-outline">' + evento.area + "</span>" +
        "<span>" + evento.acao + "</span>" +
        "</div>" +
        (evento.alteracoes && evento.alteracoes.length
          ? '<div class="table-wrap"><table class="dtable dtable-compact">' +
            "<thead><tr><th>Campo alterado</th><th>Valor anterior</th><th>Novo valor</th></tr></thead>" +
            "<tbody>" + evento.alteracoes.map(linhaAlteracaoHistorico).join("") + "</tbody>" +
            "</table></div>"
          : '<p class="text-sm text-muted">' + evento.descricao + "</p>") +
        "</div>"
      );
    }

    function renderHistorico() {
      const eventos = D.getHistoricoEventos(empresa);
      const conteudo = eventos.length
        ? eventos.map(blocoEventoHistorico).join('<hr style="border:none;border-top:1px solid var(--border);margin:0;" />')
        : '<div class="row-empty-state">Nenhuma alteração registrada até o momento.</div>';
      return (
        '<div class="card">' +
        '<div class="card-header">' +
        '<div class="card-title">Histórico de alterações</div>' +
        '<div class="card-description">Quem alterou, o que foi alterado, de qual valor para qual valor, e quando — agrupado por evento, do mais recente para o mais antigo.</div>' +
        "</div>" +
        '<div class="card-content flex flex-col gap-4">' + conteudo + "</div>" +
        "</div>"
      );
    }

    // ===== Placeholder da área restante (nenhuma no momento) —
    // mesmo padrão já usado em prototype/parametros-fiscais/js/fiscal-page.js
    // (renderTabContent, ramo `emConstrucao`), sem inventar conteúdo. =====
    function renderPlaceholderArea(area) {
      return (
        '<div class="card">' +
        '<div class="card-content flex flex-col items-center gap-3" style="text-align:center; padding:32px 24px;">' +
        '<div class="flex items-center justify-center size-12 rounded-full" style="background:var(--muted); color:var(--muted-foreground);">' +
        Icon("clock", "size-6") +
        "</div>" +
        '<div class="flex flex-col items-center gap-1">' +
        '<div class="flex items-center gap-2"><h3 class="text-base font-semibold">' + area.label + "</h3>" +
        '<span class="badge badge-warning">Em construção</span></div>' +
        '<p class="text-sm text-muted max-w-md">Área reservada na navegação da Folha de Pagamento — conteúdo funcional entra em uma fase futura (ver docs/folha-pagamento-fase1-analise-arquitetura-geral.md).</p>' +
        "</div></div></div>"
      );
    }

    // Teste de composição visual (tarefa "Auditoria e Correção — item 4"):
    // badges "Em construção" removidos SÓ das Tabs desta tela (Folha de
    // Pagamento → Geral). Nenhum outro lugar do produto usa esta função —
    // Fiscal tem sua própria renderTabsBar em fiscal-page.js, inalterada.
    // O status em si não é armazenado em nenhum dado (D.AREAS não tem um
    // campo de badge/status — a badge sempre foi derivada aqui, só pela
    // comparação `a.key === "geral"`), então não há texto/status para
    // "preservar" além desta própria renderização.
    function renderTabsBar() {
      return (
        '<div class="tabs-list" style="overflow-x:auto; max-width:100%;">' +
        D.AREAS.map(
          (a) => '<button type="button" class="tabs-trigger' + (a.key === activeArea ? " is-active" : "") + '" data-area-key="' + a.key + '">' + a.label + "</button>"
        ).join("") +
        "</div>"
      );
    }

    function renderHeaderActions() {
      if (activeArea === "geral") return mode === "view" ? '<button type="button" class="btn btn-outline btn-sm" id="btn-editar-geral">Editar</button>' : "";
      if (activeArea === "regime") return regimeCtx.mode === "view" ? '<button type="button" class="btn btn-outline btn-sm" id="btn-editar-regime">Editar</button>' : "";
      if (activeArea === "arredondamento") return arredCtx.mode === "view" ? '<button type="button" class="btn btn-outline btn-sm" id="btn-editar-arredondamento">Editar</button>' : "";
      if (activeArea === "adiantamento") return adiantamentoCtx.mode === "view" ? '<button type="button" class="btn btn-outline btn-sm" id="btn-editar-adiantamento">Editar</button>' : "";
      if (activeArea === "decimo-terceiro") return decimoTerceiroCtx.mode === "view" ? '<button type="button" class="btn btn-outline btn-sm" id="btn-editar-decimo-terceiro">Editar</button>' : "";
      if (activeArea === "ferias") return feriasCtx.mode === "view" ? '<button type="button" class="btn btn-outline btn-sm" id="btn-editar-ferias">Editar</button>' : "";
      if (activeArea === "contabilidade") return contabilidadeCtx.mode === "view" ? '<button type="button" class="btn btn-outline btn-sm" id="btn-editar-contabilidade">Editar</button>' : "";
      if (activeArea === "honorarios") return honorariosCtx.mode === "view" ? '<button type="button" class="btn btn-outline btn-sm" id="btn-editar-honorarios">Editar</button>' : "";
      if (activeArea === "cronograma") return cronogramaCtx.mode === "view" ? '<button type="button" class="btn btn-outline btn-sm" id="btn-editar-cronograma">Editar</button>' : "";
      return "";
    }

    function render() {
      const dg = empresa.dadosGerais;
      document.getElementById("folha-page-mount").innerHTML =
        '<div class="flex flex-col gap-4">' +
        '<div class="flex flex-col gap-1">' +
        '<div class="flex items-start justify-between gap-3 flex-wrap">' +
        '<div class="flex flex-col gap-1">' +
        '<h1 class="text-xl font-semibold mb-1">Folha de Pagamento</h1>' +
        '<div class="flex items-center gap-2 flex-wrap text-sm text-muted">' +
        "<span>" + dg.razaoSocial + " — " + dg.cnpj + "</span>" +
        '<button type="button" class="btn-link" id="btn-trocar-empresa" style="color:var(--info-text);">Trocar empresa</button>' +
        "</div></div>" +
        (activeArea === "geral" || activeArea === "regime" || activeArea === "arredondamento" || activeArea === "adiantamento" || activeArea === "decimo-terceiro" || activeArea === "ferias" || activeArea === "contabilidade" || activeArea === "honorarios" || activeArea === "cronograma" ? renderHeaderActions() : "") +
        "</div></div>" +
        '<div class="flex flex-col gap-3">' +
        '<div id="folha-tabs-mount"></div>' +
        '<div id="folha-tab-content-mount"></div>' +
        "</div></div>";

      document.getElementById("folha-tabs-mount").innerHTML = renderTabsBar();
      document.querySelectorAll("[data-area-key]").forEach((btn) => {
        btn.addEventListener("click", () => {
          activeArea = btn.getAttribute("data-area-key");
          render();
        });
      });

      const area = D.AREAS.find((a) => a.key === activeArea);
      const contentMount = document.getElementById("folha-tab-content-mount");
      if (activeArea === "geral") contentMount.innerHTML = renderGeral();
      else if (activeArea === "regime") contentMount.innerHTML = renderRegime();
      else if (activeArea === "arredondamento") contentMount.innerHTML = renderArredondamento();
      else if (activeArea === "adiantamento") contentMount.innerHTML = renderAdiantamento();
      else if (activeArea === "decimo-terceiro") contentMount.innerHTML = renderDecimoTerceiro();
      else if (activeArea === "ferias") contentMount.innerHTML = renderFerias();
      else if (activeArea === "contabilidade") contentMount.innerHTML = renderContabilidade();
      else if (activeArea === "honorarios") contentMount.innerHTML = renderHonorarios();
      else if (activeArea === "cronograma") contentMount.innerHTML = renderCronograma();
      else if (activeArea === "historico") contentMount.innerHTML = renderHistorico();
      else contentMount.innerHTML = renderPlaceholderArea(area);

      // Vigência de Regime (VigenciaSelector) — ver comentário no topo de
      // mount() sobre por que este nó não é reconstruído por innerHTML. O
      // placeholder <div id="regime-vigencia-slot"> acabou de ser criado do
      // zero dentro do innerHTML acima; aqui ele é substituído pelo nó
      // persistente (reencaixe, não recriação). VigenciaSelector.mount() só
      // é chamado uma vez (regimeVigenciaMontada) — chamadas seguintes só
      // reencaixam o mesmo nó, já populado, sem religar listeners.
      if (activeArea === "regime") {
        const slot = document.getElementById("regime-vigencia-slot");
        if (slot) slot.replaceWith(regimeVigenciaIndicatorNode);
        if (!regimeVigenciaMontada) {
          VigenciaSelector.mount({
            indicatorMount: regimeVigenciaIndicatorNode,
            vigencias: regimeVigencias,
            onChange: function () {
              // Somente leitura ao navegar o histórico (mesma limitação já
              // registrada no próprio componente — "Iniciar nova vigência"
              // desabilitado, regra de abertura ainda não definida em
              // nenhuma trilha). Nenhuma regra de bloqueio de edição dos
              // campos de Regime conforme a vigência histórica selecionada
              // foi pedida nesta tarefa — não inventada aqui.
            },
          });
          regimeVigenciaMontada = true;
        }
      }

      Shell.updateBreadcrumb({
        crumbs: [
          { label: dg.razaoSocial, href: "../empresas/dados-gerais.html?empresa=" + encodeURIComponent(empresa.codigo) },
          { label: "folha de pagamento", href: "index.html?empresa=" + encodeURIComponent(empresa.codigo) },
          { label: area.label },
        ],
      });

      wireEvents(contentMount);
    }

    // Sheet "Trocar empresa" — mesmo padrão de interação já validado em
    // Parâmetros Fiscais (prototype/parametros-fiscais/js/fiscal-page.js:
    // ensureTrocarEmpresaSheet/wireTrocarEmpresa): combobox de busca, preview
    // da empresa escolhida e confirmação habilitada só quando há uma empresa
    // válida diferente da atual. Criado uma única vez (o cabeçalho, ao
    // contrário do da Fiscal, é reconstruído a cada render() de área/campo —
    // por isso o botão que abre o sheet é religado em wireEvents(), mas o
    // sheet em si e sua combobox são montados uma única vez aqui). Ao
    // confirmar, recarrega a página inteira para a nova empresa — mesma
    // decisão da Fiscal: garante que o novo carregamento parte do mesmo
    // estado inicial (aba "Geral", accordions no estado padrão), sem herdar
    // estado da empresa anterior.
    function ensureTrocarEmpresaSheet() {
      if (document.getElementById("folha-trocar-empresa-overlay")) return;
      const overlay = document.createElement("div");
      overlay.className = "sheet-overlay";
      overlay.id = "folha-trocar-empresa-overlay";
      const panel = document.createElement("div");
      panel.className = "sheet-panel";
      panel.id = "folha-trocar-empresa-panel";
      panel.innerHTML =
        '<button type="button" class="sheet-close" id="folha-trocar-empresa-close">' + Icon("x", "size-4") + "</button>" +
        '<div class="sheet-header">' +
        '<div class="sheet-title">Trocar empresa</div>' +
        '<div class="sheet-description">Os parâmetros da Folha de Pagamento exibidos são recarregados para a empresa selecionada.</div>' +
        "</div>" +
        '<div class="sheet-body">' +
        '<div class="sheet-field"><label class="field-label">Empresa</label>' +
        comboboxHtml("folha-trocar-empresa-combobox", "Buscar empresa") +
        "</div>" +
        '<div id="folha-trocar-empresa-preview"></div>' +
        "</div>" +
        '<div class="sheet-footer">' +
        '<button type="button" class="btn btn-outline" id="folha-trocar-empresa-cancelar">Cancelar</button>' +
        '<button type="button" class="btn" id="folha-trocar-empresa-confirmar" disabled>Trocar empresa</button>' +
        "</div>";
      document.body.appendChild(overlay);
      document.body.appendChild(panel);
    }

    function wireTrocarEmpresaSheet() {
      ensureTrocarEmpresaSheet();
      const overlay = document.getElementById("folha-trocar-empresa-overlay");
      const panel = document.getElementById("folha-trocar-empresa-panel");
      const btnConfirmar = document.getElementById("folha-trocar-empresa-confirmar");
      let escolhida = null;

      FolhaEmpresaSelector.mountCombobox(document.getElementById("folha-trocar-empresa-combobox"), empresa.codigo, (codigo) => {
        escolhida = window.EmpresasData.findEmpresaByCodigo(codigo);
        document.getElementById("folha-trocar-empresa-preview").innerHTML = escolhida ? renderEmpresaPreview(escolhida) : "";
        btnConfirmar.disabled = !escolhida || escolhida.codigo === empresa.codigo;
      });

      function fechar() {
        UI.closeSheet(overlay, panel);
      }

      document.getElementById("folha-trocar-empresa-close").addEventListener("click", fechar);
      document.getElementById("folha-trocar-empresa-cancelar").addEventListener("click", fechar);
      overlay.addEventListener("click", fechar);
      btnConfirmar.addEventListener("click", () => {
        if (escolhida && escolhida.codigo !== empresa.codigo) {
          fechar();
          irParaEmpresa(escolhida.codigo);
        }
      });
    }

    function wireEvents(root) {
      // Botão "Trocar empresa" é recriado a cada render() (o cabeçalho faz
      // parte do innerHTML reconstruído em render()) — por isso é religado
      // aqui, junto dos demais controles; o Sheet em si já foi montado e
      // ligado uma única vez por wireTrocarEmpresaSheet(), no fim de mount().
      const btnTrocarEmpresa = document.getElementById("btn-trocar-empresa");
      if (btnTrocarEmpresa) {
        btnTrocarEmpresa.addEventListener("click", () => {
          UI.openSheet(document.getElementById("folha-trocar-empresa-overlay"), document.getElementById("folha-trocar-empresa-panel"));
        });
      }

      const btnEditar = document.getElementById("btn-editar-geral");
      if (btnEditar) btnEditar.addEventListener("click", () => { formSnapshot = deepClone(form); camposInvalidos = new Set(); mode = "edit"; render(); });

      const btnCancelar = document.getElementById("btn-cancelar-geral");
      if (btnCancelar) btnCancelar.addEventListener("click", () => { if (formSnapshot) form = formSnapshot; formSnapshot = null; camposInvalidos = new Set(); mode = "view"; render(); });

      const btnSalvar = document.getElementById("btn-salvar-geral");
      if (btnSalvar) {
        btnSalvar.addEventListener("click", () => {
          // Obrigatoriedade real (seção 3 desta tarefa): só os campos que a
          // árvore de condRule tornou aplicáveis nesta renderização entram
          // em `obrigatoriosRenderizados` — a mesma matriz Base/Condicional
          // já aprovada na análise da Fase 1, sem nenhuma regra nova.
          const pendentes = obrigatoriosRenderizados.filter((c) => !getPath(form, c.path));
          if (pendentes.length > 0) {
            camposInvalidos = new Set(pendentes.map((c) => c.path));
            const chaves = new Set();
            pendentes.forEach((c) => accordionKeysParaCampo(c.path).forEach((k) => chaves.add(k)));
            chaves.forEach((k) => { accordionOpen[k] = true; });
            render();
            UI.showToast(
              "Não foi possível salvar",
              pendentes.length === 1 ? "1 campo obrigatório está pendente. Revise o campo destacado." : pendentes.length + " campos obrigatórios estão pendentes. Revise os campos destacados.",
              "info"
            );
            const primeiro = document.querySelector('[data-path="' + pendentes[0].path + '"]');
            if (primeiro) primeiro.scrollIntoView({ behavior: "smooth", block: "center" });
            return;
          }
          // Integração do Histórico Real (P24, Pacote 5 — exceção D-8): diff
          // calculado ANTES de `formSnapshot` ser zerado (ANTES =
          // formSnapshot, DEPOIS = form), só gera evento quando há ao menos
          // 1 alteração — mesma regra aplicada em `confirmarSalvamentoCtx`.
          if (formSnapshot) {
            const alteracoes = FolhaHistoricoDiff.diffArea(formSnapshot, form, window.FolhaHistoricoSchemas.SCHEMA_GERAL);
            if (alteracoes.length) FolhaHistoricoEventos.registrarEventoHistoricoFolha(empresa.codigo, "Geral", alteracoes);
          }
          formSnapshot = null;
          camposInvalidos = new Set();
          mode = "view";
          render();
          UI.showToast("Parâmetros salvos", "As alterações da área Geral foram salvas para esta sessão.");
        });
      }

      const btnEditarRegime = document.getElementById("btn-editar-regime");
      if (btnEditarRegime) btnEditarRegime.addEventListener("click", () => { iniciarEdicaoCtx(regimeCtx); render(); });

      // Restaura só regimeCtx.form (snapshot da edição) — regimeVigencias,
      // regimeVigenciaIndicatorNode e o estado interno do VigenciaSelector
      // (seleção de vigência no painel de histórico) não são tocados aqui,
      // por decisão explícita desta correção (ver diagnóstico, seção 7).
      const btnCancelarRegime = document.getElementById("btn-cancelar-regime");
      if (btnCancelarRegime) btnCancelarRegime.addEventListener("click", () => { cancelarEdicaoCtx(regimeCtx); render(); });

      const btnSalvarRegime = document.getElementById("btn-salvar-regime");
      if (btnSalvarRegime) {
        btnSalvarRegime.addEventListener("click", () => {
          // Mesma regra de obrigatoriedade de Geral (decisão 1 da
          // arquitetura de Regime — decisão 7 da Fase 1 estendida sem
          // alteração): só os campos que a árvore de condRule tornou
          // aplicáveis nesta renderização entram em `regimeCtx.obrigatorios`.
          const pendentes = regimeCtx.obrigatorios.filter((c) => !RH.getPath(regimeCtx.form, c.path));
          if (pendentes.length > 0) {
            regimeCtx.invalidos = new Set(pendentes.map((c) => c.path));
            // Único Accordion Item em Regime (decisão de arquitetura,
            // seção 5) — diferente de Geral, não há necessidade de um mapa
            // path→chaves de accordion: qualquer pendência abre o único
            // item existente.
            regimeCtx.accordionOpen.regime = true;
            render();
            UI.showToast(
              "Não foi possível salvar",
              pendentes.length === 1 ? "1 campo obrigatório está pendente. Revise o campo destacado." : pendentes.length + " campos obrigatórios estão pendentes. Revise os campos destacados.",
              "info"
            );
            const primeiro = document.querySelector('[data-path="' + pendentes[0].path + '"]');
            if (primeiro) primeiro.scrollIntoView({ behavior: "smooth", block: "center" });
            return;
          }
          confirmarSalvamentoCtx(regimeCtx, "Regime", window.FolhaHistoricoSchemas.SCHEMA_REGIME);
          render();
          UI.showToast("Parâmetros salvos", "As alterações da área Regime foram salvas para esta sessão.");
        });
      }

      const btnEditarArred = document.getElementById("btn-editar-arredondamento");
      if (btnEditarArred) btnEditarArred.addEventListener("click", () => { iniciarEdicaoCtx(arredCtx); render(); });

      const btnCancelarArred = document.getElementById("btn-cancelar-arredondamento");
      if (btnCancelarArred) btnCancelarArred.addEventListener("click", () => { cancelarEdicaoCtx(arredCtx); render(); });

      const btnSalvarArred = document.getElementById("btn-salvar-arredondamento");
      if (btnSalvarArred) {
        btnSalvarArred.addEventListener("click", () => {
          // Mesma arquitetura de obrigatoriedade de Geral/Regime (decisão 7
          // da Fase 1) — só que aqui cada item de `arredCtx.obrigatorios`
          // pode trazer seu próprio critério de vazio (`vazio()`), usado
          // pelo grupo "Calcula arredondamento para" (decisão 3 da
          // arquitetura — não tem `path` real em `arredCtx.form`, é uma
          // checagem composta sobre as 3 opções). Os itens da tabela usam o
          // mesmo critério padrão de Geral/Regime (getPath vazio).
          const pendentes = arredCtx.obrigatorios.filter((c) => (c.vazio ? c.vazio() : !getPath(arredCtx.form, c.path)));
          if (pendentes.length > 0) {
            arredCtx.invalidos = new Set(pendentes.map((c) => c.path));
            render();
            UI.showToast(
              "Não foi possível salvar",
              pendentes.length === 1 ? "1 campo obrigatório está pendente. Revise o campo destacado." : pendentes.length + " campos obrigatórios estão pendentes. Revise os campos destacados.",
              "info"
            );
            const primeiro = document.querySelector('[data-path="' + pendentes[0].path + '"]');
            if (primeiro) primeiro.scrollIntoView({ behavior: "smooth", block: "center" });
            return;
          }
          confirmarSalvamentoCtx(arredCtx, "Arredondamento", window.FolhaHistoricoSchemas.SCHEMA_ARREDONDAMENTO);
          render();
          UI.showToast("Parâmetros salvos", "As alterações da área Arredondamento foram salvas para esta sessão.");
        });
      }

      const btnEditarAdiantamento = document.getElementById("btn-editar-adiantamento");
      if (btnEditarAdiantamento) btnEditarAdiantamento.addEventListener("click", () => { iniciarEdicaoCtx(adiantamentoCtx); render(); });

      const btnCancelarAdiantamento = document.getElementById("btn-cancelar-adiantamento");
      if (btnCancelarAdiantamento) btnCancelarAdiantamento.addEventListener("click", () => { cancelarEdicaoCtx(adiantamentoCtx); render(); });

      const btnSalvarAdiantamento = document.getElementById("btn-salvar-adiantamento");
      if (btnSalvarAdiantamento) {
        btnSalvarAdiantamento.addEventListener("click", () => {
          const pendentes = adiantamentoCtx.obrigatorios.filter((c) => (c.vazio ? c.vazio() : !getPath(adiantamentoCtx.form, c.path)));
          if (pendentes.length > 0) {
            adiantamentoCtx.invalidos = new Set(pendentes.map((c) => c.path));
            render();
            UI.showToast(
              "Não foi possível salvar",
              pendentes.length === 1 ? "1 campo obrigatório está pendente. Revise o campo destacado." : pendentes.length + " campos obrigatórios estão pendentes. Revise os campos destacados.",
              "info"
            );
            const primeiro = document.querySelector('[data-path="' + pendentes[0].path + '"]');
            if (primeiro) primeiro.scrollIntoView({ behavior: "smooth", block: "center" });
            return;
          }
          confirmarSalvamentoCtx(adiantamentoCtx, "Adiantamento", window.FolhaHistoricoSchemas.SCHEMA_ADIANTAMENTO);
          render();
          UI.showToast("Parâmetros salvos", "As alterações da área Adiantamento foram salvas para esta sessão.");
        });
      }

      const btnEditarDecimoTerceiro = document.getElementById("btn-editar-decimo-terceiro");
      if (btnEditarDecimoTerceiro) btnEditarDecimoTerceiro.addEventListener("click", () => { iniciarEdicaoCtx(decimoTerceiroCtx); render(); });

      const btnCancelarDecimoTerceiro = document.getElementById("btn-cancelar-decimo-terceiro");
      if (btnCancelarDecimoTerceiro) btnCancelarDecimoTerceiro.addEventListener("click", () => { cancelarEdicaoCtx(decimoTerceiroCtx); render(); });

      const btnSalvarDecimoTerceiro = document.getElementById("btn-salvar-decimo-terceiro");
      if (btnSalvarDecimoTerceiro) {
        btnSalvarDecimoTerceiro.addEventListener("click", () => {
          const pendentes = decimoTerceiroCtx.obrigatorios.filter((c) => (c.vazio ? c.vazio() : !getPath(decimoTerceiroCtx.form, c.path)));
          if (pendentes.length > 0) {
            decimoTerceiroCtx.invalidos = new Set(pendentes.map((c) => c.path));
            render();
            UI.showToast(
              "Não foi possível salvar",
              pendentes.length === 1 ? "1 campo obrigatório está pendente. Revise o campo destacado." : pendentes.length + " campos obrigatórios estão pendentes. Revise os campos destacados.",
              "info"
            );
            const primeiro = document.querySelector('[data-path="' + pendentes[0].path + '"]');
            if (primeiro) primeiro.scrollIntoView({ behavior: "smooth", block: "center" });
            return;
          }
          confirmarSalvamentoCtx(decimoTerceiroCtx, "13º Salário", window.FolhaHistoricoSchemas.SCHEMA_DECIMO_TERCEIRO);
          render();
          UI.showToast("Parâmetros salvos", "As alterações da área 13º Salário foram salvas para esta sessão.");
        });
      }

      const btnEditarFerias = document.getElementById("btn-editar-ferias");
      if (btnEditarFerias) btnEditarFerias.addEventListener("click", () => { iniciarEdicaoCtx(feriasCtx); render(); });

      const btnCancelarFerias = document.getElementById("btn-cancelar-ferias");
      if (btnCancelarFerias) btnCancelarFerias.addEventListener("click", () => { cancelarEdicaoCtx(feriasCtx); render(); });

      const btnSalvarFerias = document.getElementById("btn-salvar-ferias");
      if (btnSalvarFerias) {
        btnSalvarFerias.addEventListener("click", () => {
          const pendentes = feriasCtx.obrigatorios.filter((c) => (c.vazio ? c.vazio() : !getPath(feriasCtx.form, c.path)));
          if (pendentes.length > 0) {
            feriasCtx.invalidos = new Set(pendentes.map((c) => c.path));
            render();
            UI.showToast(
              "Não foi possível salvar",
              pendentes.length === 1 ? "1 campo obrigatório está pendente. Revise o campo destacado." : pendentes.length + " campos obrigatórios estão pendentes. Revise os campos destacados.",
              "info"
            );
            const primeiro = document.querySelector('[data-path="' + pendentes[0].path + '"]');
            if (primeiro) primeiro.scrollIntoView({ behavior: "smooth", block: "center" });
            return;
          }
          confirmarSalvamentoCtx(feriasCtx, "Férias", window.FolhaHistoricoSchemas.SCHEMA_FERIAS);
          render();
          UI.showToast("Parâmetros salvos", "As alterações da área Férias foram salvas para esta sessão.");
        });
      }

      const btnEditarContabilidade = document.getElementById("btn-editar-contabilidade");
      if (btnEditarContabilidade) btnEditarContabilidade.addEventListener("click", () => { iniciarEdicaoCtx(contabilidadeCtx); render(); });

      const btnCancelarContabilidade = document.getElementById("btn-cancelar-contabilidade");
      if (btnCancelarContabilidade) btnCancelarContabilidade.addEventListener("click", () => { cancelarEdicaoCtx(contabilidadeCtx); render(); });

      const btnSalvarContabilidade = document.getElementById("btn-salvar-contabilidade");
      if (btnSalvarContabilidade) {
        btnSalvarContabilidade.addEventListener("click", () => {
          const pendentes = contabilidadeCtx.obrigatorios.filter((c) => (c.vazio ? c.vazio() : !getPath(contabilidadeCtx.form, c.path)));
          if (pendentes.length > 0) {
            contabilidadeCtx.invalidos = new Set(pendentes.map((c) => c.path));
            render();
            UI.showToast(
              "Não foi possível salvar",
              pendentes.length === 1 ? "1 campo obrigatório está pendente. Revise o campo destacado." : pendentes.length + " campos obrigatórios estão pendentes. Revise os campos destacados.",
              "info"
            );
            const primeiro = document.querySelector('[data-path="' + pendentes[0].path + '"]');
            if (primeiro) primeiro.scrollIntoView({ behavior: "smooth", block: "center" });
            return;
          }
          confirmarSalvamentoCtx(contabilidadeCtx, "Contabilidade", window.FolhaHistoricoSchemas.SCHEMA_CONTABILIDADE);
          render();
          UI.showToast("Parâmetros salvos", "As alterações da área Contabilidade foram salvas para esta sessão.");
        });
      }

      const btnEditarHonorarios = document.getElementById("btn-editar-honorarios");
      if (btnEditarHonorarios) btnEditarHonorarios.addEventListener("click", () => { iniciarEdicaoCtx(honorariosCtx); render(); });

      const btnCancelarHonorarios = document.getElementById("btn-cancelar-honorarios");
      if (btnCancelarHonorarios) btnCancelarHonorarios.addEventListener("click", () => { cancelarEdicaoCtx(honorariosCtx); render(); });

      const btnSalvarHonorarios = document.getElementById("btn-salvar-honorarios");
      if (btnSalvarHonorarios) {
        btnSalvarHonorarios.addEventListener("click", () => {
          const pendentes = honorariosCtx.obrigatorios.filter((c) => (c.vazio ? c.vazio() : !getPath(honorariosCtx.form, c.path)));
          if (pendentes.length > 0) {
            honorariosCtx.invalidos = new Set(pendentes.map((c) => c.path));
            render();
            UI.showToast(
              "Não foi possível salvar",
              pendentes.length === 1 ? "1 campo obrigatório está pendente. Revise o campo destacado." : pendentes.length + " campos obrigatórios estão pendentes. Revise os campos destacados.",
              "info"
            );
            const primeiro = document.querySelector('[data-path="' + pendentes[0].path + '"]');
            if (primeiro) primeiro.scrollIntoView({ behavior: "smooth", block: "center" });
            return;
          }
          confirmarSalvamentoCtx(honorariosCtx, "Honorários", window.FolhaHistoricoSchemas.SCHEMA_HONORARIOS);
          render();
          UI.showToast("Parâmetros salvos", "As alterações da área Honorários foram salvas para esta sessão.");
        });
      }

      // Tabela de rubricas de Honorários — linhas dinâmicas (seção 9.2 da
      // arquitetura da Fase 6): "Incluir rubrica" empilha uma linha em
      // branco; "excluir" (por índice, delegado via data-remove-rubrica)
      // remove a linha correspondente. Ambos re-renderizam a área, mesmo
      // princípio de re-render completo já usado por todo o restante desta
      // tela — nenhum handler genérico precisou mudar para isso.
      const btnIncluirRubrica = document.getElementById("btn-incluir-rubrica-honorarios");
      if (btnIncluirRubrica) {
        btnIncluirRubrica.addEventListener("click", () => {
          honorariosCtx.form.rubricas.push({ rubrica: "", descricao: "", encargo: "", faturaComContrato: "" });
          render();
        });
      }
      root.querySelectorAll("[data-remove-rubrica]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const idx = parseInt(btn.getAttribute("data-remove-rubrica"), 10);
          honorariosCtx.form.rubricas.splice(idx, 1);
          render();
        });
      });

      const btnEditarCronograma = document.getElementById("btn-editar-cronograma");
      if (btnEditarCronograma) btnEditarCronograma.addEventListener("click", () => { iniciarEdicaoCtx(cronogramaCtx); render(); });

      // cronogramaCtx.categoriaAtiva (seletor Empregados/Estagiários/
      // Contribuintes) é estado de navegação, não de formulário — não é
      // capturado nem restaurado pelo snapshot, mesmo critério já usado para
      // accordionOpen em todas as áreas (ver diagnóstico, seção 6).
      const btnCancelarCronograma = document.getElementById("btn-cancelar-cronograma");
      if (btnCancelarCronograma) btnCancelarCronograma.addEventListener("click", () => { cancelarEdicaoCtx(cronogramaCtx); render(); });

      const btnSalvarCronograma = document.getElementById("btn-salvar-cronograma");
      if (btnSalvarCronograma) {
        btnSalvarCronograma.addEventListener("click", () => {
          // Só a categoria ativa é validada — `cronogramaCtx.obrigatorios`
          // é reconstruído a cada render() só com os campos da tabela da
          // categoria em exibição (decisão de UX 3 da arquitetura, seção
          // 16). `c.vazio` cobre a mesma forma de pendência custom já usada
          // por Arredondamento (grupo "Calcula arredondamento para");
          // nenhum campo desta área usa essa forma, mas o filtro é mantido
          // pelo mesmo padrão genérico já usado em Contabilidade/Honorários.
          const pendentes = cronogramaCtx.obrigatorios.filter((c) => (c.vazio ? c.vazio() : !getPath(cronogramaCtx.form, c.path)));
          if (pendentes.length > 0) {
            cronogramaCtx.invalidos = new Set(pendentes.map((c) => c.path));
            render();
            UI.showToast(
              "Não foi possível salvar",
              pendentes.length === 1 ? "1 campo obrigatório está pendente. Revise o campo destacado." : pendentes.length + " campos obrigatórios estão pendentes. Revise os campos destacados.",
              "info"
            );
            const primeiro = document.querySelector('[data-path="' + pendentes[0].path + '"]');
            if (primeiro) primeiro.scrollIntoView({ behavior: "smooth", block: "center" });
            return;
          }
          confirmarSalvamentoCtx(cronogramaCtx, "Cronograma", window.FolhaHistoricoSchemas.SCHEMA_CRONOGRAMA, { categoriaAtiva: cronogramaCtx.categoriaAtiva });
          render();
          UI.showToast("Parâmetros salvos", "As alterações da área Cronograma foram salvas para esta sessão.");
        });
      }

      // Seletor interno de categoria (Empregados/Estagiários/Contribuintes
      // Individuais) — troca só `cronogramaCtx.categoriaAtiva` (estado de
      // navegação local, não grava/perde nenhum dado das outras 2
      // categorias, que permanecem em `cronogramaCtx.form` intocadas).
      root.querySelectorAll("[data-categoria-key]").forEach((btn) => {
        btn.addEventListener("click", () => {
          cronogramaCtx.categoriaAtiva = btn.getAttribute("data-categoria-key");
          render();
        });
      });

      // `formAtivo`/`accordionOpenAtivo`: `root` só contém os campos da área
      // ativa no momento (o innerHTML da OUTRA área nem existe no DOM), mas
      // os paths de Regime ("regime", "cprb.atividades" etc.), Arredondamento
      // ("calculaPara.*", "linhas.<i>.*"), Adiantamento ("definicoes.*",
      // "proporcionalidade.*") e 13º Salário ("geral.*", "decimoAdiantamento.*")
      // não têm correspondência em `form` (Geral) — por isso os 4 blocos
      // genéricos abaixo (input cru, checkbox, radio, date-picker) e o
      // toggle de accordion, que já existiam antes só para Geral, precisam
      // escolher o objeto correto. Quando activeArea === "geral" o valor é
      // literalmente `form`/`accordionOpen` — comportamento idêntico ao
      // anterior, sem nenhuma mudança para Geral.
      const formAtivo =
        activeArea === "regime" ? regimeCtx.form :
        activeArea === "arredondamento" ? arredCtx.form :
        activeArea === "adiantamento" ? adiantamentoCtx.form :
        activeArea === "decimo-terceiro" ? decimoTerceiroCtx.form :
        activeArea === "ferias" ? feriasCtx.form :
        activeArea === "contabilidade" ? contabilidadeCtx.form :
        activeArea === "honorarios" ? honorariosCtx.form :
        activeArea === "cronograma" ? cronogramaCtx.form :
        form;
      const accordionOpenAtivo = activeArea === "regime" ? regimeCtx.accordionOpen : accordionOpen;

      root.querySelectorAll("input[data-path], select[data-path]").forEach((el) => {
        el.addEventListener("change", () => {
          setPath(formAtivo, el.getAttribute("data-path"), el.value);
          render();
        });
      });
      root.querySelectorAll(".ucheckbox[data-path]").forEach((el) => {
        el.addEventListener("click", (e) => {
          e.preventDefault();
          const p = el.getAttribute("data-path");
          setPath(formAtivo, p, !getPath(formAtivo, p));
          render();
        });
      });
      root.querySelectorAll(".uradio[data-path]").forEach((el) => {
        el.addEventListener("click", () => {
          setPath(formAtivo, el.getAttribute("data-path"), el.getAttribute("data-value"));
          render();
        });
      });
      // Date Picker (granularity:"month") — ver monthField(). Reatribuído a
      // cada render() porque toda a árvore é reconstruída via innerHTML,
      // seguindo o mesmo padrão já usado acima para os demais controles.
      root.querySelectorAll(".date-picker[data-path]").forEach((el) => {
        el.querySelector(".date-picker-icon").innerHTML = Icon("calendar", "size-4");
        el.querySelectorAll('.date-picker-nav-btn[data-nav="prev"]').forEach((b) => (b.innerHTML = Icon("chevron-left", "size-4")));
        el.querySelectorAll('.date-picker-nav-btn[data-nav="next"]').forEach((b) => (b.innerHTML = Icon("chevron-right", "size-4")));
        const path = el.getAttribute("data-path");
        const picker = UI.initDatePicker(
          el,
          (valor) => {
            setPath(formAtivo, path, valor || "");
            render();
          },
          { granularity: "month" }
        );
        picker.setValue(getPath(formAtivo, path) || "");
      });
      root.querySelectorAll("[data-accordion-toggle]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const k = btn.getAttribute("data-accordion-toggle");
          accordionOpenAtivo[k] = !accordionOpenAtivo[k];
          render();
        });
      });
    }

    wireTrocarEmpresaSheet();
    render();
  }

  window.FolhaPage = { resolveEmpresa, mountSelecaoEmpresa, mount };
})();
