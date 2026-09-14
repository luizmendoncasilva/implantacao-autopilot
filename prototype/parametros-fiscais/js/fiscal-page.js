/*
  Página "Parâmetros Fiscais" — shell estrutural (docs/parametros-fiscais-arquitetura.md,
  seção 13.3): cabeçalho de contexto (empresa + vigência) + barra de abas +
  área de conteúdo + área de alertas/pendências persistente.

  A aba Gerais tem conteúdo real (ver prototype/parametros-fiscais/js/gerais.js
  e gerais-data.js). As demais 5 abas continuam com placeholder — regras
  fiscais completas, onboarding SERPRO, guias avulsas e demais fluxos de
  negócio seguem fora do escopo desta etapa.

  Todas as abas ficam no mesmo documento (navegação por JS, sem reload) para
  que trocar de aba nunca reinicie o contexto de vigência selecionado — é o
  comportamento exigido pela arquitetura (seção 2, item 2) e é mais simples
  de garantir numa SPA de abas do que replicando ?vigencia= em várias páginas
  HTML (padrão usado por Empresas, que não tem esse requisito de contexto
  persistente entre abas).
*/
(function () {
  const D = window.FiscalData;

  const TABS = [
    {
      key: "gerais",
      label: "Gerais",
      objetivo: "Classifica a base da empresa dentro da vigência — Anexo, RBT12, RBA/RBAA e Fator R aqui exibidos alimentam a leitura das demais abas.",
    },
    {
      key: "federais",
      label: "Federais",
      objetivo: "Registra o pouco que tem efeito de apuração ou relatório fora do DAS, já que no Simples Nacional a maior parte dos tributos federais está dentro do DAS.",
    },
    {
      key: "estaduais-municipais",
      label: "Estaduais e Municipais",
      objetivo: "Cadastro estadual, exceções à regra geral do DAS e atributos estáveis da empresa em relação ao ISS.",
      sections: [
        { key: "estaduais", label: "Estaduais" },
        { key: "municipais", label: "Municipais" },
      ],
    },
    {
      key: "contabil-fiscal",
      label: "Contábil × Fiscal",
      objetivo: "Parâmetro fiscal que impacta como o contábil lança as operações — bloco transversal, mantido em Parâmetros Fiscais por decisão de produto.",
    },
    {
      key: "obrigacoes-documentos",
      label: "Obrigações e Documentos Fiscais",
      objetivo: "O que a empresa precisa entregar ao Fisco (obrigações acessórias) e quais documentos fiscais emite, com que periodicidade.",
      sections: [
        { key: "documentos-fiscais", label: "Documentos Fiscais" },
        { key: "obrigacoes-acessorias", label: "Obrigações Acessórias" },
      ],
    },
    {
      key: "reforma-tributaria",
      label: "Reforma Tributária",
      objetivo: "Levantamento de campos de IBS/CBS/Imposto Seletivo, preservado sem desenvolvimento nesta rodada.",
      emConstrucao: true,
    },
  ];

  // Sem fallback para "primeira empresa do mock": Fiscal só considera a
  // empresa definida quando ?empresa= aponta para um código válido — caso
  // contrário, o estado inicial é "nenhuma empresa selecionada"
  // (mountSelecaoEmpresa), não uma empresa qualquer carregada por default.
  function resolveEmpresa() {
    const ED = window.EmpresasData;
    const codigo = ED.getQueryParam("empresa");
    return (codigo && ED.findEmpresaByCodigo(codigo)) || null;
  }

  // Skeleton antecipando a estrutura real do shell (título/contexto da
  // empresa, vigência, alertas, abas, primeiro bloco de conteúdo) — usa o
  // primitivo .skeleton (shared/css/components.css, portado de
  // docs/design-system/components/ui/skeleton.tsx). A composição abaixo é
  // exclusiva da Fiscal: nenhuma outra trilha tem esse fluxo de seleção de
  // empresa, então não faz sentido promovê-la a shared/js.
  function skeletonBar(width, height) {
    return '<span class="skeleton" style="width:' + width + "; height:" + height + ';"></span>';
  }

  // A página real não embrulha cabeçalho/vigência/alertas num card (eles
  // vivem direto sobre o fundo --muted da página — ver mount() acima); mas
  // o preenchimento do skeleton também usa --muted, então precisa de um
  // fundo branco por trás para não desaparecer contra o fundo da página.
  // Um único card envolvendo todo o skeleton resolve o contraste sem
  // inventar uma cor nova só para isso.
  function renderFiscalSkeleton() {
    return (
      '<div class="card" role="status" aria-live="polite" aria-busy="true">' +
      '<span class="sr-only">Carregando parâmetros fiscais da empresa selecionada…</span>' +
      '<div class="card-content flex flex-col gap-4">' +
      '<div class="flex items-start justify-between gap-3 flex-wrap">' +
      '<div class="flex flex-col gap-2">' + skeletonBar("220px", "24px") + skeletonBar("280px", "14px") + "</div>" +
      skeletonBar("190px", "34px") +
      "</div>" +
      '<div class="flex flex-col gap-1-5">' + skeletonBar("100%", "46px") + skeletonBar("100%", "46px") + skeletonBar("100%", "46px") + "</div>" +
      '<div class="flex flex-col gap-3">' +
      skeletonBar("560px", "36px") +
      '<div class="flex flex-col gap-3" style="padding-top:8px; border-top:1px solid var(--border);">' +
      skeletonBar("160px", "16px") + skeletonBar("92%", "13px") + skeletonBar("70%", "13px") +
      "</div>" +
      "</div>" +
      "</div></div>"
    );
  }

  // Tempo de exibição do skeleton antes de navegar. É uma simulação —
  // carregar o contexto da empresa aqui é síncrono (dados mockados) — só para
  // o estado de carregamento ser de fato perceptível ao usuário; quando
  // houver uma origem de dados real e assíncrona, este delay artificial sai e
  // o skeleton passa a durar o tempo real da requisição.
  const FISCAL_LOADING_DELAY_MS = 450;

  function irParaEmpresa(codigo) {
    const mountEl = document.getElementById("fiscal-page-mount");
    if (mountEl) mountEl.innerHTML = renderFiscalSkeleton();
    window.setTimeout(() => {
      window.location.href = "index.html?empresa=" + encodeURIComponent(codigo);
    }, FISCAL_LOADING_DELAY_MS);
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

  // Estado inicial da trilha quando nenhuma empresa foi definida ainda —
  // nenhum parâmetro, vigência ou alerta é carregado antes da seleção
  // (docs/parametros-fiscais-arquitetura.md não cobre este fluxo porque é
  // uma decisão de entrada específica da Fiscal, não uma regra do produto).
  function mountSelecaoEmpresa() {
    document.getElementById("fiscal-page-mount").innerHTML =
      '<div class="flex flex-col gap-4" style="max-width:440px; margin:64px auto 0;">' +
      '<div class="flex flex-col gap-1" style="text-align:center;">' +
      '<h1 class="text-xl font-semibold">Parâmetros Fiscais</h1>' +
      '<p class="text-sm text-muted">Selecione uma empresa para continuar.</p>' +
      "</div>" +
      '<div class="card">' +
      '<div class="card-content flex flex-col gap-4">' +
      '<div class="flex flex-col gap-1"><label class="field-label">Empresa</label>' +
      comboboxHtml("fiscal-empresa-combobox", "Buscar empresa") +
      "</div>" +
      '<div id="fiscal-empresa-preview"></div>' +
      '<button type="button" class="btn w-full" id="btn-selecionar-empresa" disabled>Selecionar empresa</button>' +
      "</div></div></div>";

    let escolhida = null;
    const btn = document.getElementById("btn-selecionar-empresa");

    FiscalEmpresaSelector.mountCombobox(document.getElementById("fiscal-empresa-combobox"), null, (codigo) => {
      escolhida = window.EmpresasData.findEmpresaByCodigo(codigo);
      document.getElementById("fiscal-empresa-preview").innerHTML = escolhida ? renderEmpresaPreview(escolhida) : "";
      btn.disabled = !escolhida;
    });

    btn.addEventListener("click", () => {
      if (escolhida) irParaEmpresa(escolhida.codigo);
    });
  }

  function renderAlertaCard(alerta) {
    const alertClass = "alert alert-" + alerta.severity;
    const iconName = alerta.severity === "destructive" ? "circle-x" : alerta.severity === "warning" ? "alert-triangle" : "info";
    return (
      '<div class="' + alertClass + '">' +
      Icon(iconName, "size-4") +
      '<div class="alert-desc">' +
      "<b>" + alerta.titulo + ".</b> " + alerta.descricao +
      (alerta.acao
        ? ' <button type="button" class="btn-link" disabled style="opacity:.65; cursor:not-allowed; color:inherit; text-decoration:underline;" title="Ação de exemplo — sem regra de negócio implementada nesta etapa">' + alerta.acao.label + "</button>"
        : "") +
      "</div>" +
      "</div>"
    );
  }

  function renderAlertasArea() {
    return (
      '<div class="flex flex-col gap-1-5">' +
      '<span class="text-xs text-muted">Alertas e pendências — exemplos ilustrativos para validar o componente</span>' +
      '<div class="flex flex-col gap-1-5">' + D.ALERTAS.map(renderAlertaCard).join("") + "</div>" +
      "</div>"
    );
  }

  function renderTabsBar(activeKey) {
    return (
      '<div class="tabs-list" style="overflow-x:auto; max-width:100%;">' +
      TABS.map(
        (t) =>
          '<button type="button" class="tabs-trigger' +
          (t.key === activeKey ? " is-active" : "") +
          '" data-tab-key="' + t.key + '">' +
          t.label +
          (t.emConstrucao ? '<span class="badge badge-warning" style="margin-left:4px;">Em construção</span>' : "") +
          "</button>"
      ).join("") +
      "</div>"
    );
  }

  function renderTabContent(tab) {
    if (tab.emConstrucao) {
      return (
        '<div class="card">' +
        '<div class="card-content flex flex-col items-center gap-3" style="text-align:center; padding:32px 24px;">' +
        '<div class="flex items-center justify-center size-12 rounded-full" style="background:var(--muted); color:var(--muted-foreground);">' +
        Icon("clock", "size-6") +
        "</div>" +
        '<div class="flex flex-col items-center gap-1">' +
        '<div class="flex items-center gap-2"><h3 class="text-base font-semibold">' + tab.label + "</h3>" +
        '<span class="badge badge-warning">Em construção</span></div>' +
        '<p class="text-sm text-muted max-w-md">' + tab.objetivo + " A estrutura desta aba é preservada para não perder o levantamento — sem controles funcionais nesta etapa." + "</p>" +
        "</div></div></div>"
      );
    }
    if (tab.sections) {
      return (
        '<div class="accordion">' +
        tab.sections
          .map(
            (s, i) =>
              '<div class="accordion-item' + (i === 0 ? " is-open" : "") + '" data-accordion-item>' +
              '<button type="button" class="accordion-trigger" data-accordion-trigger>' +
              '<span class="accordion-trigger-title">' + s.label + "</span>" +
              '<span class="accordion-trigger-chev">' + Icon("chevron-down", "size-4") + "</span>" +
              "</button>" +
              '<div class="accordion-content">' +
              '<p class="text-sm text-muted">Estrutura validada nesta etapa. Os campos de ' + s.label.toLowerCase() + " entram na próxima etapa de implementação (ver docs/02-parametros-fiscais.md)." + "</p>" +
              "</div></div>"
          )
          .join("") +
        "</div>"
      );
    }
    return (
      '<div class="card">' +
      '<div class="card-header">' +
      '<div class="card-title">' + tab.label + "</div>" +
      '<div class="card-description">' + tab.objetivo + "</div>" +
      "</div>" +
      '<div class="card-content">' +
      '<div class="row-empty-state">Conteúdo desta aba entra na próxima etapa de implementação (ver docs/02-parametros-fiscais.md e docs/parametros-fiscais-arquitetura.md).</div>' +
      "</div></div>"
    );
  }

  function wireAccordions(root) {
    root.querySelectorAll("[data-accordion-trigger]").forEach((trigger) => {
      trigger.addEventListener("click", () => {
        trigger.closest("[data-accordion-item]").classList.toggle("is-open");
      });
    });
  }

  // Duração do skeleton dos indicadores calculados de Gerais ao entrar na
  // aba — mesma simulação de carregamento já usada em FISCAL_LOADING_DELAY_MS
  // (dados mockados são síncronos; o delay só torna o estado perceptível).
  const GERAIS_INDICADORES_DELAY_MS = 500;

  // Toast compartilhado pelas abas com jornada de edição (Gerais, Estaduais
  // e Municipais, Contábil × Fiscal, Obrigações e Documentos Fiscais) —
  // mesmo elemento/markup já usado em Empresas e Sindicatos
  // (detail-common.js/convencao-detail.js), criado uma única vez aqui
  // porque a Fiscal não tinha, até esta rodada, nenhum campo editável com
  // feedback de salvamento.
  function ensureToast() {
    if (document.getElementById("toast")) return;
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.id = "toast";
    toast.innerHTML =
      '<span class="toast-icon"></span>' +
      '<div class="flex flex-col gap-0-5">' +
      '<span class="toast-title"></span>' +
      '<span class="toast-desc"></span>' +
      "</div>";
    document.body.appendChild(toast);
  }

  function mount(empresa) {
    ensureToast();
    let activeKey = TABS[0].key;
    let historicoAtivo = false;
    let ultimaAbaRenderizada = null;
    let vigenciaJaInicializada = false;
    let vigenciaSelecionadaId = null;

    const dg = empresa.dadosGerais;

    document.getElementById("fiscal-page-mount").innerHTML =
      '<div class="flex flex-col gap-4">' +
      '<div class="flex flex-col gap-2">' +
      '<div class="flex items-start justify-between gap-3 flex-wrap">' +
      '<div class="flex flex-col gap-1">' +
      '<h1 class="text-xl font-semibold mb-1">Parâmetros Fiscais</h1>' +
      '<div class="flex items-center gap-2 flex-wrap text-sm text-muted">' +
      "<span>" + dg.razaoSocial + " — " + dg.cnpj + "</span>" +
      '<span class="badge badge-outline">' + dg.regimeTributarioFederal + "</span>" +
      '<span class="text-xs text-muted">Definido no Cadastro de Empresas</span>' +
      '<button type="button" class="btn-link" id="btn-trocar-empresa" style="color:var(--info-text);">Trocar empresa</button>' +
      "</div>" +
      "</div>" +
      '<div id="vigencia-indicator-mount"></div>' +
      "</div>" +
      '<div id="vigencia-readonly-banner"></div>' +
      "</div>" +
      '<div id="fiscal-alertas-mount"></div>' +
      '<div class="flex flex-col gap-3">' +
      '<div id="fiscal-tabs-mount"></div>' +
      '<div id="fiscal-acao-editar-mount" class="flex justify-end"></div>' +
      '<div id="fiscal-tab-content-mount"></div>' +
      "</div>" +
      "</div>";

    // Alertas de exemplo removidos da renderização principal (rodada de
    // refinamento visual — poluíam a experiência com "Exemplo técnico"/
    // "regra real ainda não implementada"). A infraestrutura
    // (renderAlertasArea/renderAlertaCard/FiscalData.ALERTAS) foi
    // preservada, sem uso, para reaproveitamento quando houver um alerta
    // real a exibir — #fiscal-alertas-mount permanece no layout, vazio.

    function renderReadonlyBanner(vigencia, isAtual) {
      const el = document.getElementById("vigencia-readonly-banner");
      if (isAtual) {
        el.innerHTML = "";
        return;
      }
      el.innerHTML =
        '<div class="alert alert-warning">' +
        Icon("alert-triangle", "size-4") +
        '<div class="alert-desc">' +
        "<b>Vigência histórica</b> — encerrada em " + vigencia.dataFim + ". Os valores exibidos são os desta vigência; " +
        "nenhum campo pode ser editado enquanto uma vigência histórica estiver selecionada." +
        "</div></div>";
    }

    // Sheet "Trocar empresa" — mesma mecânica do sheet de histórico (criado
    // uma única vez, reaberto por referência). Ao confirmar, recarrega a
    // página inteira para a nova empresa: mais simples e mais robusto do que
    // tentar re-hidratar vigência/alertas/abas em memória, e garante que o
    // novo carregamento parte do mesmo estado inicial (sem herdar aba/vigência
    // selecionada da empresa anterior).
    function ensureTrocarEmpresaSheet() {
      if (document.getElementById("trocar-empresa-overlay")) return;
      const overlay = document.createElement("div");
      overlay.className = "sheet-overlay";
      overlay.id = "trocar-empresa-overlay";
      const panel = document.createElement("div");
      panel.className = "sheet-panel";
      panel.id = "trocar-empresa-panel";
      panel.innerHTML =
        '<button type="button" class="sheet-close" id="trocar-empresa-close">' + Icon("x", "size-4") + "</button>" +
        '<div class="sheet-header">' +
        '<div class="sheet-title">Trocar empresa</div>' +
        '<div class="sheet-description">Os parâmetros fiscais, a vigência e os alertas exibidos são recarregados para a empresa selecionada.</div>' +
        "</div>" +
        '<div class="sheet-body">' +
        '<div class="sheet-field"><label class="field-label">Empresa</label>' +
        comboboxHtml("trocar-empresa-combobox", "Buscar empresa") +
        "</div>" +
        '<div id="trocar-empresa-preview"></div>' +
        "</div>" +
        '<div class="sheet-footer">' +
        '<button type="button" class="btn btn-outline" id="trocar-empresa-cancelar">Cancelar</button>' +
        '<button type="button" class="btn" id="trocar-empresa-confirmar" disabled>Trocar empresa</button>' +
        "</div>";
      document.body.appendChild(overlay);
      document.body.appendChild(panel);
    }

    function wireTrocarEmpresa() {
      ensureTrocarEmpresaSheet();
      const overlay = document.getElementById("trocar-empresa-overlay");
      const panel = document.getElementById("trocar-empresa-panel");
      const btnConfirmar = document.getElementById("trocar-empresa-confirmar");
      let escolhida = null;

      FiscalEmpresaSelector.mountCombobox(document.getElementById("trocar-empresa-combobox"), empresa.codigo, (codigo) => {
        escolhida = window.EmpresasData.findEmpresaByCodigo(codigo);
        document.getElementById("trocar-empresa-preview").innerHTML = escolhida ? renderEmpresaPreview(escolhida) : "";
        btnConfirmar.disabled = !escolhida || escolhida.codigo === empresa.codigo;
      });

      function fechar() {
        UI.closeSheet(overlay, panel);
      }

      document.getElementById("btn-trocar-empresa").addEventListener("click", () => UI.openSheet(overlay, panel));
      document.getElementById("trocar-empresa-close").addEventListener("click", fechar);
      document.getElementById("trocar-empresa-cancelar").addEventListener("click", fechar);
      overlay.addEventListener("click", fechar);
      btnConfirmar.addEventListener("click", () => {
        if (escolhida && escolhida.codigo !== empresa.codigo) {
          fechar();
          irParaEmpresa(escolhida.codigo);
        }
      });
    }

    function renderTabs() {
      document.getElementById("fiscal-tabs-mount").innerHTML = renderTabsBar(activeKey);
      document.querySelectorAll("[data-tab-key]").forEach((btn) => {
        btn.addEventListener("click", () => {
          activeKey = btn.getAttribute("data-tab-key");
          renderTabs();
          renderContent();
        });
      });
    }

    // Mapa de abas com jornada de edição (drawer) — cada módulo expõe
    // `abrirEdicao(empresa, onSalvo)`. Abas sem campo Manual (Federais,
    // Contábil × Fiscal e Obrigações e Documentos Fiscais parcialmente já
    // cobertas acima; placeholders) simplesmente não entram neste mapa.
    const ABAS_COM_EDICAO = {
      gerais: () => window.FiscalGerais,
      "estaduais-municipais": () => window.FiscalEstaduaisMunicipais,
      "contabil-fiscal": () => window.FiscalContabilFiscal,
      "obrigacoes-documentos": () => window.FiscalObrigacoesDocumentos,
    };

    // Ação "Editar" — vive numa faixa própria entre a barra de abas e o
    // conteúdo da aba (#fiscal-acao-editar-mount), nunca dentro do
    // card/accordion de conteúdo. Mesma hierarquia já usada em DP
    // (renderHeaderActions, folha-page.js) e em Sindicato (o botão "Editar"
    // fica no cabeçalho da página/registro, não dentro do card) — a ação
    // pertence ao bloco/seção, não a um campo específico dentro dele.
    function renderAcaoEditar(tab, mountEl) {
      const acaoMount = document.getElementById("fiscal-acao-editar-mount");
      const getModulo = ABAS_COM_EDICAO[tab.key];
      const modulo = getModulo ? getModulo() : null;
      if (!modulo || historicoAtivo || !empresa.optanteSimples) {
        acaoMount.innerHTML = "";
        return;
      }
      acaoMount.innerHTML = '<button type="button" class="btn btn-outline btn-sm" id="btn-editar-aba">Editar</button>';
      document.getElementById("btn-editar-aba").addEventListener("click", () => {
        modulo.abrirEdicao(empresa, vigenciaSelecionadaId, () => rerenderTabPreservandoAccordion(tab, mountEl));
      });
    }

    // Re-renderiza só o conteúdo da aba ativa após Salvar no drawer,
    // preservando o estado aberto/fechado do accordion (quando a aba usa
    // um) — mesmo princípio já usado nas abas com accordion antes desta
    // correção, agora centralizado aqui porque o botão que dispara o
    // re-render deixou de viver dentro do módulo de cada aba.
    function rerenderTabPreservandoAccordion(tab, mountEl) {
      const abertos = Array.from(mountEl.querySelectorAll("[data-accordion-item]")).map((el) => el.classList.contains("is-open"));
      if (tab.key === "gerais") mountEl.innerHTML = FiscalGerais.renderConteudo(empresa, historicoAtivo, vigenciaSelecionadaId, false);
      else if (tab.key === "estaduais-municipais") mountEl.innerHTML = FiscalEstaduaisMunicipais.renderConteudo(empresa, historicoAtivo, vigenciaSelecionadaId, false);
      else if (tab.key === "contabil-fiscal") mountEl.innerHTML = FiscalContabilFiscal.renderConteudo(empresa, historicoAtivo, vigenciaSelecionadaId);
      else if (tab.key === "obrigacoes-documentos") mountEl.innerHTML = FiscalObrigacoesDocumentos.renderConteudo(empresa, historicoAtivo, vigenciaSelecionadaId, false);
      const itens = mountEl.querySelectorAll("[data-accordion-item]");
      itens.forEach((el, i) => el.classList.toggle("is-open", !!abertos[i]));
      wireAccordions(mountEl);
      renderAcaoEditar(tab, mountEl);
    }

    function renderContent() {
      const tab = TABS.find((t) => t.key === activeKey);
      const mountEl = document.getElementById("fiscal-tab-content-mount");

      // Compartilhada por qualquer aba cujo conteúdo tenha Indicador
      // Calculado com estado "loading" (hoje Gerais e Federais): ao entrar
      // na aba (não a cada re-render, ex.: troca de vigência), mostra os
      // indicadores em "loading" e troca para o conteúdo real depois do
      // delay simulado — ver GERAIS_INDICADORES_DELAY_MS.
      function montarComIndicadoresCarregando(renderFn, wireFn) {
        const entrandoAgora = ultimaAbaRenderizada !== tab.key;
        if (entrandoAgora) {
          mountEl.innerHTML = renderFn(true);
          const chaveNoMomento = activeKey;
          window.setTimeout(() => {
            if (activeKey === chaveNoMomento) {
              mountEl.innerHTML = renderFn(false);
              if (wireFn) wireFn(mountEl);
            }
          }, GERAIS_INDICADORES_DELAY_MS);
        } else {
          mountEl.innerHTML = renderFn(false);
          if (wireFn) wireFn(mountEl);
        }
      }

      if (tab.key === "gerais") {
        montarComIndicadoresCarregando(
          (carregando) => FiscalGerais.renderConteudo(empresa, historicoAtivo, vigenciaSelecionadaId, carregando),
          null
        );
      } else if (tab.key === "federais") {
        montarComIndicadoresCarregando(
          (carregando) => FiscalFederais.renderConteudo(empresa, historicoAtivo, carregando),
          null
        );
      } else if (tab.key === "estaduais-municipais") {
        montarComIndicadoresCarregando(
          (carregando) => FiscalEstaduaisMunicipais.renderConteudo(empresa, historicoAtivo, vigenciaSelecionadaId, carregando),
          (root) => wireAccordions(root)
        );
      } else if (tab.key === "contabil-fiscal") {
        // Sem Indicador Calculado nesta aba (todos os 5 campos do MVP são
        // Manual ou Sistema/regra fixa, sem espera perceptível) — nenhum
        // skeleton é necessário (docs/CLAUDE.md, "Estados de Carregamento").
        mountEl.innerHTML = FiscalContabilFiscal.renderConteudo(empresa, historicoAtivo, vigenciaSelecionadaId);
      } else if (tab.key === "obrigacoes-documentos") {
        montarComIndicadoresCarregando(
          (carregando) => FiscalObrigacoesDocumentos.renderConteudo(empresa, historicoAtivo, vigenciaSelecionadaId, carregando),
          (root) => wireAccordions(root)
        );
      } else {
        mountEl.innerHTML = renderTabContent(tab);
        wireAccordions(mountEl);
      }
      ultimaAbaRenderizada = tab.key;

      // Ação "Editar" — posicionada fora do card/accordion de conteúdo,
      // numa faixa própria entre a barra de abas e o conteúdo da aba
      // (mesma hierarquia já usada em DP/Sindicato: a ação de edição é do
      // bloco/seção, não um controle dentro do card — ver relatório da
      // tarefa de refinamento visual). Cada módulo de aba expõe
      // `abrirEdicao(empresa, onSalvo)`; este shell só decide QUANDO mostrar
      // o botão (vigência atual + aba com campo Manual) e delega o clique.
      renderAcaoEditar(tab, mountEl);

      Shell.updateBreadcrumb({
        crumbs: [
          { label: empresa.nome, href: "../empresas/dados-gerais.html?empresa=" + encodeURIComponent(empresa.codigo) },
          { label: "parâmetros fiscais", href: "index.html?empresa=" + encodeURIComponent(empresa.codigo) },
          { label: tab.label },
        ],
      });
    }

    // Módulos de aba com campo Manual — usados aqui para copiar ("herdar")
    // os valores da vigência que está deixando de ser atual para a nova
    // vigência recém-criada. Mesmo mapa de módulos de ABAS_COM_EDICAO, mas
    // como getters/setters de dados em vez de UI — a herança é sempre dos
    // 9 campos Manual das 4 abas de uma vez (uma vigência é da empresa
    // inteira, não de uma aba isolada).
    const MODULOS_DADOS_COM_MANUAL = [
      { get: (id) => FiscalGeraisData.getDadosGerais(empresa.codigo, id), set: (id, v) => FiscalGeraisData.setDadosManuais(empresa.codigo, id, v) },
      { get: (id) => FiscalEstaduaisMunicipaisData.getDados(empresa.codigo, id), set: (id, v) => FiscalEstaduaisMunicipaisData.setDadosManuais(empresa.codigo, id, v) },
      { get: (id) => FiscalContabilFiscalData.getDados(empresa.codigo, id), set: (id, v) => FiscalContabilFiscalData.setDadosManuais(empresa.codigo, id, v) },
      { get: (id) => FiscalObrigacoesDocumentosData.getDados(empresa.codigo, id), set: (id, v) => FiscalObrigacoesDocumentosData.setDadosManuais(empresa.codigo, id, v) },
    ];

    VigenciaSelector.mount({
      indicatorMount: document.getElementById("vigencia-indicator-mount"),
      vigencias: FiscalVigenciasData.getVigencias(empresa.codigo),
      onChange: function (vigencia, isAtual) {
        historicoAtivo = !isAtual;
        vigenciaSelecionadaId = vigencia.id;
        document.getElementById("fiscal-page-mount").classList.toggle("is-vigencia-historica", historicoAtivo);
        renderReadonlyBanner(vigencia, isAtual);
        // A primeira chamada acontece durante o próprio VigenciaSelector.mount()
        // (antes de renderTabs()/renderContent() rodarem pela primeira vez, no
        // fim de mount()) — ignorá-la evita renderizar a aba duas vezes. Nas
        // trocas de vigência seguintes (ação real do usuário), re-renderiza a
        // aba ativa para que o modo somente leitura passe a valer e os
        // valores exibidos passem a ser os da vigência selecionada.
        if (vigenciaJaInicializada) renderContent();
        vigenciaJaInicializada = true;
      },
      // "Iniciar nova vigência" — única regra de abertura definida nesta
      // etapa (validação de data em FiscalVigenciasData.criarNovaVigencia).
      // Após validar e criar a vigência, herda os valores da vigência que
      // acabou de virar histórica para a nova vigência atual, nas 4 abas
      // com campo Manual — "a nova vigência deve iniciar com uma cópia dos
      // parâmetros da vigência anterior" (decisão de protótipo registrada
      // no as-built; não há regra documentada para isso, e copiar foi o
      // comportamento explicitamente definido para esta etapa). Os demais
      // campos (Cockpit/API gov./Motor de cálculo/BHules/Legislação/
      // Sistema/regra fixa) não têm persistência própria — continuam vindo
      // do mesmo mock por empresa de sempre, sem cópia nenhuma.
      onCriarNovaVigencia: function (dataInicio) {
        const vigenciaAnteriorId = vigenciaSelecionadaId;
        const resultado = FiscalVigenciasData.criarNovaVigencia(empresa.codigo, dataInicio);
        MODULOS_DADOS_COM_MANUAL.forEach((modulo) => {
          modulo.set(resultado.novaVigencia.id, modulo.get(vigenciaAnteriorId));
        });
        return resultado;
      },
    });

    wireTrocarEmpresa();
    renderTabs();
    renderContent();
  }

  window.FiscalPage = { mount, mountSelecaoEmpresa, resolveEmpresa };
})();
