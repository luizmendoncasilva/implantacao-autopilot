/*
  Fluxo de Nova Implantação (Telas 2 a 6 do handoff) — upload dos relatórios
  do Domínio (Ficha de Registro, Ficha Financeira, Programação de Férias,
  Relatório de Médias, Extrato Mensal — RF-DP-501/503), não só Ficha
  Financeira. Upload em
  tela cheia (não modal) → modal de confirmação → processamento assíncrono →
  resultado, com o caminho de exceção "CNPJ não identificado" resolvido pelo
  Modal de Inconsistência. Mesma arquitetura de estado único + `irPara()` já
  usada em empresas/js/importar.js, sem o stepper de wizard daquele fluxo
  (esta importação não tem etapas de revisão navegáveis — só 3 telas).

  Convenção de nomenclatura (handoff, seção 9): sufixo "Concil"/"Implant" para
  evitar colisão com o core — aqui só usamos nomes locais de arquivo (sem
  função global exportada), então não colide com nada.
*/
(function () {
  const D = window.ImplantacaoData;
  const E = window.EmpresasData;
  const EI = window.EmpresasImplantacaoData;

  const state = {
    step: "upload",
    arquivos: JSON.parse(JSON.stringify(D.ARQUIVOS_LOTE_INICIAL)),
    procIndex: 0,
    resultado: null, // { processados, semDivergencia, comDivergencia } — só existe a partir da etapa "Gerando resultado"
    // "novo" | "migracao" — Jeniffer (10/09/2026): "querendo dizer que nova
    // implantação, novo cliente ou cliente antigo — migração de sistemas ou
    // implantação de nova empresa". Sem isso marcado, empresa já em operação
    // no Autopilot fica bloqueada (ver empresaJaEmOperacao) — "vai que
    // alguém sobe de uma empresa que já está rodando... ele vai atualizar
    // os cálculos que já existem?" (Andressa).
    tipoImplantacao: "novo",
    relatorioPersonalizado: false,
  };

  // Fila de arquivos-mock disponíveis para "simular" um novo drop/seleção —
  // deriva sempre do lote inicial (determinístico, sem Math.random), então
  // arrastar mais de uma vez sempre produz o mesmo próximo arquivo.
  const POOL_ARQUIVOS_MOCK = D.ARQUIVOS_LOTE_INICIAL;

  function empresaNome(codigo) {
    const empresa = E.findEmpresaByCodigo(codigo);
    return empresa ? empresa.nome : codigo;
  }
  function formatarKb(kb) {
    return kb >= 1024 ? (kb / 1024).toFixed(1) + " MB" : kb + " KB";
  }

  // "Se já tiver rodado qualquer cálculo pelo Autopilot, ele não deixa
  // implantar mais depois" (Andressa/Jeniffer, 10/09/2026) — aqui
  // simplificado como status "implantada" em EmpresasImplantacaoData.
  function empresaJaEmOperacao(empresaCodigo) {
    if (!empresaCodigo) return false;
    const impl = EI.empresaImplantacao(empresaCodigo);
    return !!impl && impl.status === "implantada";
  }
  function arquivoBloqueadoPorOperacao(arquivo) {
    return arquivo.status === "identificado" && state.tipoImplantacao !== "migracao" && empresaJaEmOperacao(arquivo.empresaCodigo);
  }

  function arquivosIdentificados() {
    return state.arquivos.filter((a) => a.status === "identificado");
  }
  function arquivosNaoIdentificados() {
    return state.arquivos.filter((a) => a.status === "nao_identificado");
  }
  function arquivosSemCockpit() {
    return state.arquivos.filter((a) => a.status === "cnpj_nao_cadastrado");
  }
  function arquivosBloqueadosPorOperacao() {
    return arquivosIdentificados().filter(arquivoBloqueadoPorOperacao);
  }
  // Só estes de fato entram no processamento — identificados, sem bloqueio
  // de operação (RF-DP-504 já filtra "não identificado" e "sem Cockpit").
  function arquivosProntosParaProcessar() {
    return arquivosIdentificados().filter((a) => !arquivoBloqueadoPorOperacao(a));
  }
  function colaboradoresEstimados() {
    return arquivosProntosParaProcessar().reduce((soma, a) => soma + (a.colaboradoresDetectados || 0), 0);
  }

  function mount(html) {
    document.getElementById("importacao-step-mount").innerHTML = html;
  }

  function irPara(step) {
    state.step = step;
    RENDERERS[step]();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ===== Toast (mesmo padrão de empresas/js/importar.js) =====
  function ensureToast() {
    if (document.getElementById("toast")) return;
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.id = "toast";
    toast.innerHTML =
      '<span class="toast-icon"></span><div class="flex flex-col gap-0-5"><span class="toast-title"></span><span class="toast-desc"></span></div>';
    document.body.appendChild(toast);
  }

  // ===== Etapa — Upload (Tela 2) =====
  function fileItemHtml(arquivo, indice) {
    const identificado = arquivo.status === "identificado";
    const semCockpit = arquivo.status === "cnpj_nao_cadastrado";
    const bloqueadoPorOperacao = identificado && arquivoBloqueadoPorOperacao(arquivo);
    const emAlerta = !identificado || bloqueadoPorOperacao;

    let detalheHtml;
    if (bloqueadoPorOperacao) {
      detalheHtml = '<span class="text-xs" style="color:var(--destructive-text);">' + empresaNome(arquivo.empresaCodigo) + " já está em operação no Autopilot — marque \"Migração\" acima para prosseguir, ou remova este arquivo</span>";
    } else if (identificado) {
      detalheHtml = '<span class="text-xs text-muted truncate">' + formatarKb(arquivo.tamanhoKb) + " · CNPJ identificado: <span class=\"font-mono\">" + arquivo.cnpj + "</span> — " + empresaNome(arquivo.empresaCodigo) + " (" + arquivo.colaboradoresDetectados + (arquivo.colaboradoresDetectados === 1 ? " colaborador" : " colaboradores") + ")</span>";
    } else if (semCockpit) {
      detalheHtml = '<span class="text-xs" style="color:var(--destructive-text);">CNPJ <span class="font-mono">' + arquivo.cnpj + '</span> identificado, mas a empresa não está cadastrada no Cockpit com a tag Autopilot DP</span>';
    } else {
      detalheHtml = '<span class="text-xs" style="color:var(--warning-text);">CNPJ não identificado automaticamente — será perguntado na revisão</span>';
    }

    return (
      '<div class="upload-file-row">' +
      '<span class="upload-file-icon"' + (emAlerta ? ' style="color:var(--warning-text);"' : "") + '">' + Icon("file-text", "size-5") + "</span>" +
      '<div class="flex flex-col min-w-0 flex-1 gap-0-5">' +
      '<span class="text-sm font-medium truncate">' + arquivo.nomeArquivo + "</span>" +
      detalheHtml +
      "</div>" +
      '<button type="button" class="btn btn-ghost btn-sm" data-remover-arquivo="' + indice + '" aria-label="Remover arquivo">' + Icon("x", "size-4") + "</button>" +
      "</div>"
    );
  }

  function proximoArquivoMock() {
    const nomesJaNaLista = new Set(state.arquivos.map((a) => a.nomeArquivo));
    const disponivel = POOL_ARQUIVOS_MOCK.find((a) => !nomesJaNaLista.has(a.nomeArquivo));
    if (disponivel) return JSON.parse(JSON.stringify(disponivel));
    // Pool esgotado (usuário já adicionou os 3 arquivos de exemplo) — gera
    // mais um identificado, só para a dropzone continuar demonstrável.
    return {
      nomeArquivo: "Ficha_Financeira_Extra_" + (state.arquivos.length + 1) + ".pdf",
      tamanhoKb: 1450, cnpj: "45.112.887/0001-30", empresaCodigo: null, status: "cnpj_nao_cadastrado", colaboradoresDetectados: 0,
    };
  }

  function renderUpload() {
    Shell.updateBreadcrumb({ crumbs: [{ label: "implantação de empresas", href: "implantacao-geral.html" }, { label: "DP", href: "implantacao-empresas.html" }, { label: "nova implantação" }] });

    const temArquivos = state.arquivos.length > 0;
    const bloqueados = arquivosBloqueadosPorOperacao();
    mount(
      '<div class="flex flex-col gap-2">' +
        '<h1 class="text-xl font-semibold mb-1">Nova Implantação</h1>' +
        '<p class="text-sm text-muted max-w-2xl">Arraste o lote de relatórios do Domínio — Ficha de Registro, Ficha Financeira, Programação de Férias, Relatório de Médias e Extrato Mensal — em PDF ou Excel. O sistema identifica a empresa de cada arquivo automaticamente pelo CNPJ. Não é preciso selecionar uma empresa por vez: solte arquivos de várias empresas juntos.</p>' +
        "</div>" +
        '<div class="flex flex-col gap-1">' +
        '<label class="field-label">Tipo de implantação</label>' +
        '<div class="toggle-group" data-toggle-group="tipo-implantacao" style="width:fit-content;">' +
        '<button type="button" class="toggle-item' + (state.tipoImplantacao === "novo" ? " is-on" : "") + '" data-value="novo">Novo cliente</button>' +
        '<button type="button" class="toggle-item' + (state.tipoImplantacao === "migracao" ? " is-on" : "") + '" data-value="migracao">Migração de empresa já em operação</button>' +
        "</div>" +
        '<p class="text-xs text-muted">"Novo cliente" bloqueia empresas que já operam no Autopilot — RN, alinhamento Andressa/Jeniffer 10/09/2026.</p>' +
        "</div>" +
        (bloqueados.length
          ? '<div class="alert alert-destructive">' + Icon("alert-triangle", "size-4") +
            '<div class="alert-desc">' + bloqueados.length + (bloqueados.length === 1 ? " arquivo é de uma empresa que já opera" : " arquivos são de empresas que já operam") + " no Autopilot. Marque \"Migração\" acima se for intencional, ou remova " + (bloqueados.length === 1 ? "o arquivo" : "os arquivos") + ".</div></div>"
          : "") +
        '<div class="card">' +
        '<div class="card-content flex flex-col gap-4">' +
        '<div class="upload-dropzone" id="upload-dropzone" tabindex="0" role="button" aria-label="Selecionar arquivos PDF">' +
        '<div class="upload-dropzone-icon">' + Icon("upload", "size-5") + "</div>" +
        '<div class="text-sm font-medium">Arraste os arquivos aqui ou clique para selecionar</div>' +
        '<div class="text-xs text-muted">Apenas PDF · até 100 arquivos por lote · máx. 15MB por arquivo</div>' +
        "</div>" +
        '<input type="file" id="upload-input" accept=".pdf" multiple style="display:none;" />' +
        (temArquivos ? '<div class="flex flex-col gap-2" id="upload-file-list">' + state.arquivos.map(fileItemHtml).join("") + "</div>" : "") +
        "</div>" +
        "</div>" +
        (temArquivos
          ? '<div class="flex items-center justify-between gap-3 flex-wrap" style="padding-top:4px;">' +
            '<div class="text-sm text-muted">' + state.arquivos.length + (state.arquivos.length === 1 ? " arquivo selecionado" : " arquivos selecionados") + " · " + colaboradoresEstimados() + " colaboradores estimados</div>" +
            '<div class="flex gap-2">' +
            '<a href="implantacao-empresas.html" class="btn btn-outline">Cancelar</a>' +
            '<button type="button" class="btn" id="btn-importar-lote"' + (arquivosProntosParaProcessar().length === 0 ? " disabled" : "") + ">Importar lote</button>" +
            "</div></div>"
          : "")
    );

    wireDropzone();
    document.querySelectorAll("[data-remover-arquivo]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.arquivos.splice(Number(btn.getAttribute("data-remover-arquivo")), 1);
        renderUpload();
      });
    });
    document.querySelectorAll('[data-toggle-group="tipo-implantacao"] .toggle-item').forEach((item) => {
      item.addEventListener("click", () => {
        state.tipoImplantacao = item.getAttribute("data-value");
        renderUpload();
      });
    });
    if (temArquivos) document.getElementById("btn-importar-lote").addEventListener("click", abrirConfirmacaoImportacao);
  }

  function wireDropzone() {
    const dropzone = document.getElementById("upload-dropzone");
    const input = document.getElementById("upload-input");

    function adicionarArquivo() {
      state.arquivos.push(proximoArquivoMock());
      renderUpload();
    }

    dropzone.addEventListener("click", () => input.click());
    dropzone.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        input.click();
      }
    });
    ["dragenter", "dragover"].forEach((evt) =>
      dropzone.addEventListener(evt, (e) => {
        e.preventDefault();
        dropzone.classList.add("is-dragover");
      })
    );
    ["dragleave", "drop"].forEach((evt) =>
      dropzone.addEventListener(evt, (e) => {
        e.preventDefault();
        dropzone.classList.remove("is-dragover");
      })
    );
    dropzone.addEventListener("drop", adicionarArquivo);
    input.addEventListener("change", adicionarArquivo);
  }

  // ===== Modal — Confirmar importação (Tela 3) =====
  function abrirConfirmacaoImportacao() {
    const prontos = arquivosProntosParaProcessar();
    const naoIdentificados = arquivosNaoIdentificados();
    const semCockpit = arquivosSemCockpit();
    const bloqueados = arquivosBloqueadosPorOperacao();
    document.getElementById("dialog-confirmar-titulo").textContent = "Importar " + state.arquivos.length + (state.arquivos.length === 1 ? " arquivo?" : " arquivos?");
    document.getElementById("dialog-confirmar-desc").innerHTML =
      "Serão processados <b>" + colaboradoresEstimados() + " colaboradores</b> em <b>" + prontos.length + (prontos.length === 1 ? " empresa</b> identificada automaticamente." : " empresas</b> identificadas automaticamente.") +
      (naoIdentificados.length ? " " + naoIdentificados.length + (naoIdentificados.length === 1 ? " arquivo não teve" : " arquivos não tiveram") + " o CNPJ identificado e não será processado agora — dá para associar manualmente depois da importação." : "") +
      (semCockpit.length ? " " + semCockpit.length + (semCockpit.length === 1 ? " arquivo é de empresa" : " arquivos são de empresas") + " sem cadastro no Cockpit e não " + (semCockpit.length === 1 ? "será processado" : "serão processados") + "." : "") +
      (bloqueados.length ? " " + bloqueados.length + (bloqueados.length === 1 ? " arquivo é de empresa" : " arquivos são de empresas") + " já em operação e não " + (bloqueados.length === 1 ? "será processado" : "serão processados") + " (marque \"Migração\" para incluir)." : "");
    // "Tem relatório personalizado? Não, beleza; sim, aí abre as
    // possibilidades" (Jeniffer, 10/09/2026) — pergunta simples aqui;
    // fluxo de anexar/abrir chamado fica para quando essa aba existir.
    document.getElementById("dialog-confirmar-extra").innerHTML =
      '<div class="flex flex-col gap-1" style="margin-top:8px;">' +
      '<label class="field-label">Esta empresa usa relatório personalizado (fora do layout padrão Domínio)?</label>' +
      '<div class="toggle-group" data-toggle-group="relatorio-personalizado" style="width:fit-content;">' +
      '<button type="button" class="toggle-item' + (!state.relatorioPersonalizado ? " is-on" : "") + '" data-value="nao">Não</button>' +
      '<button type="button" class="toggle-item' + (state.relatorioPersonalizado ? " is-on" : "") + '" data-value="sim">Sim</button>' +
      "</div></div>";
    document.querySelectorAll('[data-toggle-group="relatorio-personalizado"] .toggle-item').forEach((item) => {
      item.addEventListener("click", () => {
        state.relatorioPersonalizado = item.getAttribute("data-value") === "sim";
        document.querySelectorAll('[data-toggle-group="relatorio-personalizado"] .toggle-item').forEach((i) => i.classList.remove("is-on"));
        item.classList.add("is-on");
      });
    });
    UI.openDialog(document.getElementById("dialog-confirmar-importacao"));
  }

  // ===== Etapa — Processamento (Tela 4) =====
  const PROC_STEPS = [
    { key: "lendo", label: "Lendo arquivos", icon: "file-text", sub: () => state.arquivos.length + " de " + state.arquivos.length + " arquivos lidos" },
    { key: "extraindo", label: "Extraindo campos", icon: "list-checks", sub: () => colaboradoresEstimados() + " de " + colaboradoresEstimados() + " colaboradores processados" },
    { key: "conciliando", label: "Conciliando com o Lake (Domínio)", icon: "git-compare", sub: () => null },
    { key: "gerando", label: "Gerando resultado", icon: "list-checks", sub: () => null },
  ];

  function renderProcSteps() {
    return (
      '<div class="proc-steps">' +
      PROC_STEPS.map((s, i) => {
        const estado = i < state.procIndex ? "is-done" : i === state.procIndex ? "is-active" : "";
        const icone = i < state.procIndex ? Icon("check", "size-3-5") : i === state.procIndex ? '<div class="spinner"></div>' : Icon(s.icon, "size-3-5");
        const sub = i <= state.procIndex ? s.sub() : null;
        return (
          '<div class="proc-step ' + estado + '">' +
          '<div class="proc-step-icon">' + icone + "</div>" +
          '<div><div class="proc-step-label">' + s.label + "</div>" +
          (sub ? '<div class="proc-step-sub">' + sub + "</div>" : "") +
          "</div></div>"
        );
      }).join("") +
      "</div>"
    );
  }

  function renderProcessing() {
    Shell.updateBreadcrumb({ crumb: "processando o lote" });
    state.procIndex = 0;

    mount(
      '<div class="card" style="max-width:640px; margin:40px auto;">' +
        '<div class="card-content flex flex-col items-center gap-2 text-center">' +
        '<div class="spinner spinner-lg" style="margin-bottom:8px;"></div>' +
        '<h2 class="text-base font-semibold">Processando o lote</h2>' +
        '<p class="text-sm text-muted mb-1">' + state.arquivos.length + (state.arquivos.length === 1 ? " arquivo · " : " arquivos · ") + colaboradoresEstimados() + " colaboradores estimados. Isso pode levar alguns minutos — não é preciso ficar nesta tela.</p>" +
        '<div id="proc-steps-mount" style="width:100%; text-align:left;">' + renderProcSteps() + "</div>" +
        "</div></div>"
    );

    avancarProcessamento();
  }

  function avancarProcessamento() {
    setTimeout(() => {
      state.procIndex++;
      const mountEl = document.getElementById("proc-steps-mount");
      if (mountEl) mountEl.innerHTML = renderProcSteps();
      if (state.procIndex < PROC_STEPS.length) {
        avancarProcessamento();
      } else {
        gerarResultado();
        setTimeout(() => irPara("result"), 300);
      }
    }, 900);
  }

  // ===== Geração do resultado (adiciona colaboradores reais ao mock da
  // listagem, para "Ver os N com divergência" ter dados de verdade) =====
  function gerarResultado() {
    const prontos = arquivosProntosParaProcessar();
    let semDivergencia = 0;
    let comDivergencia = 0;
    prontos.forEach((arquivo) => {
      const qtdDivergencia = Math.max(1, Math.round(arquivo.colaboradoresDetectados * 0.22));
      const qtdSemDivergencia = arquivo.colaboradoresDetectados - qtdDivergencia;
      const gerados = D.gerarColaboradoresLote(arquivo.empresaCodigo, qtdSemDivergencia, qtdDivergencia, 1000 + semDivergencia + comDivergencia);
      D.adicionarColaboradoresImportados(gerados);
      semDivergencia += qtdSemDivergencia;
      comDivergencia += qtdDivergencia;
    });
    state.resultado = {
      processados: semDivergencia + comDivergencia,
      semDivergencia: semDivergencia,
      comDivergencia: comDivergencia,
    };
  }

  // ===== Etapa — Resultado (Tela 5) =====
  function renderResult() {
    Shell.updateBreadcrumb({ crumbs: [{ label: "implantação de empresas", href: "implantacao-geral.html" }, { label: "DP", href: "implantacao-empresas.html" }, { label: "resultado da importação" }] });

    const naoIdentificados = arquivosNaoIdentificados();
    const semCockpit = arquivosSemCockpit();
    const bloqueados = arquivosBloqueadosPorOperacao();
    const prontos = arquivosProntosParaProcessar();
    const r = state.resultado;

    mount(
      '<div class="flex flex-col gap-4">' +
        '<div>' +
        '<h1 class="text-xl font-semibold mb-1">Importação concluída</h1>' +
        '<p class="text-sm text-muted">' + state.arquivos.length + (state.arquivos.length === 1 ? " arquivo processado · " : " arquivos processados · ") + prontos.length + (prontos.length === 1 ? " empresa identificada automaticamente" : " empresas identificadas automaticamente") +
        (naoIdentificados.length ? ", " + naoIdentificados.length + (naoIdentificados.length === 1 ? " pendente" : " pendentes") + " de confirmação manual" : "") +
        (state.relatorioPersonalizado ? ". Relatório personalizado sinalizado para esta empresa." : ".") +
        "</p></div>" +
        '<div class="flex flex-wrap gap-3">' +
        '<div class="stat-card"><span class="stat-card-value">' + r.processados + '</span><span class="stat-card-label">Colaboradores processados</span></div>' +
        '<div class="stat-card stat-card-success"><span class="stat-card-value">' + r.semDivergencia + '</span><span class="stat-card-label">Conciliados sem divergência</span></div>' +
        '<div class="stat-card stat-card-warning"><span class="stat-card-value">' + r.comDivergencia + '</span><span class="stat-card-label">Com divergência ou campo ausente</span></div>' +
        '<div class="stat-card stat-card-danger"><span class="stat-card-value">' + naoIdentificados.length + '</span><span class="stat-card-label">Não importado (CNPJ não identificado)</span></div>' +
        '<div class="stat-card stat-card-danger"><span class="stat-card-value">' + semCockpit.length + '</span><span class="stat-card-label">Não importado (fora do Cockpit)</span></div>' +
        (bloqueados.length ? '<div class="stat-card stat-card-warning"><span class="stat-card-value">' + bloqueados.length + '</span><span class="stat-card-label">Bloqueado — empresa já em operação</span></div>' : "") +
        "</div>" +
        (naoIdentificados.length
          ? naoIdentificados.map((a) =>
              '<div class="alert alert-destructive">' + Icon("alert-triangle", "size-4") +
              '<div class="alert-desc"><b>' + a.nomeArquivo + " não foi importado.</b><br/>O CNPJ não pôde ser identificado automaticamente no arquivo. Associe manualmente a uma empresa para reprocessar.</div></div>"
            ).join("")
          : "") +
        (semCockpit.length
          ? semCockpit.map((a) =>
              '<div class="alert alert-destructive">' + Icon("alert-triangle", "size-4") +
              '<div class="alert-desc"><b>' + a.nomeArquivo + " não foi importado.</b><br/>CNPJ <span class=\"font-mono\">" + a.cnpj + "</span> identificado, mas a empresa não está cadastrada no Cockpit com a tag Autopilot DP. Peça o cadastro e reenvie o arquivo.</div></div>"
            ).join("")
          : "") +
        (bloqueados.length
          ? bloqueados.map((a) =>
              '<div class="alert alert-warning">' + Icon("alert-triangle", "size-4") +
              '<div class="alert-desc"><b>' + a.nomeArquivo + " não foi importado.</b><br/>" + empresaNome(a.empresaCodigo) + " já está em operação no Autopilot. Se for mesmo uma migração, volte e marque \"Migração de empresa já em operação\".</div></div>"
            ).join("")
          : "") +
        (state.relatorioPersonalizado && prontos.length
          ? '<div class="alert alert-info">' + Icon("file-text", "size-4") +
            '<div class="alert-desc">Relatório personalizado sinalizado. Importe o(s) layout(s) usados (admissão, férias, rescisão) na aba <b>Relatórios</b> de cada empresa antes de considerar a implantação concluída.</div></div>'
          : "") +
        '<div class="flex gap-2 flex-wrap">' +
        '<a href="implantacao-empresas.html" class="btn">' + Icon("list", "size-3-5") + " Ver os " + r.comDivergencia + " com divergência</a>" +
        (state.relatorioPersonalizado && prontos.length
          ? '<a href="implantacao-console.html?empresa=' + encodeURIComponent(prontos[0].empresaCodigo) + '&tab=relatorios" class="btn btn-outline">' + Icon("upload", "size-3-5") + " Importar layouts de relatório</a>"
          : "") +
        (naoIdentificados.length
          ? '<button type="button" class="btn btn-outline" id="btn-associar-manualmente" data-arquivo="' + naoIdentificados[0].nomeArquivo + '">Associar ' + naoIdentificados[0].nomeArquivo + " manualmente</button>"
          : "") +
        "</div>" +
        "</div>"
    );

    const btnAssociar = document.getElementById("btn-associar-manualmente");
    if (btnAssociar) btnAssociar.addEventListener("click", () => abrirModalInconsistencia(btnAssociar.getAttribute("data-arquivo")));
  }

  // ===== Modal — Inconsistência / CNPJ não identificado (Tela 6) =====
  function opcoesEmpresas() {
    return E.EMPRESAS.filter((e) => e.codigo.indexOf("-F") === -1);
  }

  function abrirModalInconsistencia(nomeArquivo) {
    document.getElementById("dialog-inconsistencia-arquivo").textContent = nomeArquivo;
    const select = document.getElementById("dialog-inconsistencia-empresa");
    select.innerHTML = '<option value="">Selecione a empresa...</option>' + opcoesEmpresas().map((e) => '<option value="' + e.codigo + '">' + e.nome + "</option>").join("");
    select.value = "";
    document.getElementById("btn-reprocessar-arquivo").disabled = true;
    document.getElementById("btn-reprocessar-arquivo").setAttribute("data-arquivo", nomeArquivo);
    UI.openDialog(document.getElementById("dialog-inconsistencia"));
  }

  function reprocessarArquivo() {
    const nomeArquivo = document.getElementById("btn-reprocessar-arquivo").getAttribute("data-arquivo");
    const empresaCodigo = document.getElementById("dialog-inconsistencia-empresa").value;
    if (!empresaCodigo) return;
    const arquivo = state.arquivos.find((a) => a.nomeArquivo === nomeArquivo);
    if (!arquivo) return;

    const empresa = E.findEmpresaByCodigo(empresaCodigo);
    arquivo.status = "identificado";
    arquivo.empresaCodigo = empresaCodigo;
    arquivo.cnpj = (empresa && empresa.dadosGerais && empresa.dadosGerais.cnpj) || "—";
    arquivo.colaboradoresDetectados = 5;

    const gerados = D.gerarColaboradoresLote(empresaCodigo, 4, 1, 2000 + state.arquivos.length);
    D.adicionarColaboradoresImportados(gerados);
    state.resultado.processados += 5;
    state.resultado.semDivergencia += 4;
    state.resultado.comDivergencia += 1;

    UI.closeDialog(document.getElementById("dialog-inconsistencia"));
    renderResult();
    UI.showToast("Arquivo reprocessado", nomeArquivo + " foi associado a " + empresaNome(empresaCodigo) + ".");
  }

  const RENDERERS = { upload: renderUpload, processing: renderProcessing, result: renderResult };

  // ===== Dialogs genéricos =====
  document.querySelectorAll("[data-close-dialog]").forEach((el) => {
    el.addEventListener("click", () => UI.closeDialog(document.getElementById(el.getAttribute("data-close-dialog"))));
  });
  document.querySelectorAll(".dialog-overlay").forEach((overlay) => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) UI.closeDialog(overlay);
    });
  });
  document.getElementById("btn-confirmar-importacao").addEventListener("click", () => {
    UI.closeDialog(document.getElementById("dialog-confirmar-importacao"));
    irPara("processing");
  });
  document.getElementById("dialog-inconsistencia-empresa").addEventListener("change", (e) => {
    document.getElementById("btn-reprocessar-arquivo").disabled = !e.target.value;
  });
  document.getElementById("btn-reprocessar-arquivo").addEventListener("click", reprocessarArquivo);

  ensureToast();
  irPara("upload");
})();
