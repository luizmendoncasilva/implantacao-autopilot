/*
  Fluxo interativo da Importação Massiva de Empresas (Fase 1) — estados
  simulados de ponta a ponta (introdução → upload → processamento → consulta
  cadastral → validação → revisão → confirmação → importação → resultado).
  Dados vêm de ImportarEmpresasData (js/importar-data.js); a persistência do
  lote importado usa EmpresasData.salvarEmpresasImportadas (js/data.js), para
  as empresas aparecerem na listagem ao voltar para index.html.

  A consulta cadastral é sempre simulada como indisponível na primeira
  tentativa (determinístico, sem Math.random — mesmo padrão do resto do
  mock) para que os dois caminhos (retomar a consulta / continuar sem ela)
  fiquem sempre navegáveis na demonstração. "Tentar novamente" na 2ª
  tentativa sempre funciona.
*/
(function () {
  const D = window.EmpresasData;
  const I = window.ImportarEmpresasData;

  const STEP_DEFS = [
    { key: "intro", label: "Introdução" },
    { key: "upload", label: "Upload" },
    { key: "processing", label: "Processamento" },
    { key: "consulta", label: "Consulta cadastral" },
    { key: "validation", label: "Validação" },
    { key: "review", label: "Revisão" },
    { key: "importing", label: "Importação" },
    { key: "result", label: "Resultado" },
  ];

  const state = {
    step: "intro",
    arquivoNome: null,
    arquivoTamanhoKb: null,
    arquivoCompletoNome: null, // planilha completa (fallback), enviada separadamente da planilha simplificada
    arquivoCompletoTamanhoKb: null,
    linhas: [],
    filtroValidacao: "todas",
    empresasImportadas: [],
    consultaTentativas: 0,
    consultaDisponivel: null, // null = ainda não determinado nesta rodada
  };

  function contarPorStatus(linhas) {
    const validas = linhas.filter((l) => l.status === "valida").length;
    return { total: linhas.length, validas: validas, invalidas: linhas.length - validas };
  }

  // ===== Stepper =====
  function renderStepper() {
    const indiceAtual = STEP_DEFS.findIndex((s) => s.key === state.step);
    let html = "";
    STEP_DEFS.forEach((s, i) => {
      const done = i < indiceAtual;
      const active = i === indiceAtual;
      if (i > 0) html += '<div class="stepper-connector' + (done || active ? " is-done" : "") + '"></div>';
      html +=
        '<div class="stepper-step' + (active ? " is-active" : "") + (done ? " is-done" : "") + '">' +
        '<div class="stepper-step-circle">' + (done ? Icon("check", "size-3-5") : i + 1) + "</div>" +
        '<div class="stepper-step-label">' + s.label + "</div>" +
        "</div>";
    });
    document.getElementById("import-stepper").innerHTML = html;
  }

  function mount(html) {
    document.getElementById("import-step-mount").innerHTML = html;
    renderStepper();
  }

  function irPara(step) {
    state.step = step;
    RENDERERS[step]();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Seção com título + divisor dentro de um único card — mesmo padrão de
  // empresas/js/dados-gerais.js (secao/campo), para agrupar conteúdo sem
  // empilhar vários cards por etapa.
  function secao(titulo, conteudoHtml) {
    return '<div class="detail-section"><h3 class="detail-section-title">' + titulo + "</h3>" + conteudoHtml + "</div>";
  }

  // ===== Toast (mesmo padrão de empresas/js/detail-common.js) =====
  function ensureToast() {
    if (document.getElementById("toast")) return;
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.id = "toast";
    toast.innerHTML =
      '<span class="toast-icon"></span><div class="flex flex-col gap-0-5"><span class="toast-title"></span><span class="toast-desc"></span></div>';
    document.body.appendChild(toast);
  }

  // ===== Tabela de linhas da planilha (reaproveitada em Validação e Revisão) =====
  function statusBadge(linha) {
    return linha.status === "valida"
      ? '<span class="badge badge-success">' + Icon("check", "size-3-5") + " Pronta para importação</span>"
      : '<span class="badge badge-warning">' + Icon("alert-triangle", "size-3-5") + " Com inconsistência</span>";
  }

  function renderTabelaLinhas(linhas, filtro) {
    const filtradas = linhas.filter((l) => filtro === "todas" || (filtro === "validas" ? l.status === "valida" : l.status === "invalida"));
    let rows = "";
    if (filtradas.length === 0) {
      rows = '<tr><td colspan="5" class="row-empty-state">Nenhum registro encontrado para este filtro.</td></tr>';
    } else {
      rows = filtradas
        .map(
          (l) =>
            "<tr>" +
            '<td class="col-pad-sm">' + l.linha + "</td>" +
            "<td>" + UI.truncatedCell(l.campos.razaoSocial || "(sem razão social)", null, "text-sm font-medium") + "</td>" +
            '<td class="col-pad-md">' + (l.campos.cnpj || "—") + "</td>" +
            '<td class="col-pad-sm">' + statusBadge(l) + "</td>" +
            '<td class="col-pad-end">' +
            (l.status === "invalida" ? '<button type="button" class="btn-link link-info" data-ver-detalhe="' + l.linha + '">Ver detalhe</button>' : "") +
            "</td>" +
            "</tr>"
        )
        .join("");
    }
    return (
      '<div class="table-wrap"><table class="dtable dtable-fixed">' +
      '<colgroup><col style="width:72px" /><col /><col style="width:190px" /><col style="width:190px" /><col style="width:120px" /></colgroup>' +
      "<thead><tr>" +
      '<th class="col-pad-sm">Linha</th><th>Razão social</th><th class="col-pad-md">CNPJ</th><th class="col-pad-sm">Status</th><th class="col-pad-end"></th>' +
      "</tr></thead><tbody>" + rows + "</tbody></table></div>"
    );
  }

  function wireTabelaLinhasEvents() {
    document.querySelectorAll("[data-ver-detalhe]").forEach((btn) => {
      btn.addEventListener("click", () => abrirDetalheErro(Number(btn.getAttribute("data-ver-detalhe"))));
    });
  }

  function abrirDetalheErro(numeroLinha) {
    const linha = state.linhas.find((l) => l.linha === numeroLinha);
    if (!linha) return;
    const c = linha.campos;
    document.getElementById("dialog-detalhe-erro-content").innerHTML =
      '<div class="alert alert-warning">' +
      Icon("alert-triangle", "size-4") +
      '<div class="alert-desc"><ul style="margin:0; padding-left:18px;">' +
      linha.erros.map((e) => "<li>" + e + "</li>").join("") +
      "</ul></div></div>" +
      '<div class="detail-grid">' +
      '<div class="detail-field"><span class="detail-field-label">Linha da planilha</span><div class="detail-field-value">' + linha.linha + "</div></div>" +
      '<div class="detail-field"><span class="detail-field-label">Razão social</span><div class="detail-field-value">' + (c.razaoSocial || '<span class="italic text-muted">Não informado</span>') + "</div></div>" +
      '<div class="detail-field"><span class="detail-field-label">CNPJ</span><div class="detail-field-value">' + (c.cnpj || '<span class="italic text-muted">Não informado</span>') + "</div></div>" +
      '<div class="detail-field"><span class="detail-field-label">Nome fantasia</span><div class="detail-field-value">' + (c.nomeFantasia || "—") + "</div></div>" +
      '<div class="detail-field"><span class="detail-field-label">Município/UF</span><div class="detail-field-value">' + c.municipio + "/" + c.uf + "</div></div>" +
      "</div>";
    UI.openDialog(document.getElementById("dialog-detalhe-erro"));
  }

  // ===== Etapa 1 — Introdução =====
  function renderIntro() {
    mount(
      '<div class="card">' +
        '<div class="card-header"><div class="card-title">Como funciona</div><div class="card-description">Antes de importar, entenda o que a importação massiva faz — e o que não faz.</div></div>' +
        '<div class="card-content flex flex-col gap-6">' +
        secao(
          "O que será importado",
          '<p class="text-sm">Importa em massa os dados do <b>Cadastro Geral</b> de várias empresas, a partir de uma planilha.</p>' +
            '<p class="text-sm">Os dados do Cadastro Geral importados serão <b>refletidos e sincronizados no Cockpit</b>.</p>'
        ) +
        secao(
          "Você só precisa informar os CNPJs",
          '<p class="text-sm">Informe os CNPJs das empresas que deseja importar. O AutoPilot consultará os dados cadastrais disponíveis e preencherá automaticamente as informações correspondentes do Cadastro Geral — você não precisa digitá-las.</p>' +
            '<div class="alert alert-info">' +
            Icon("circle-check", "size-4") +
            '<div class="alert-desc">Se a consulta cadastral estiver indisponível para algum CNPJ, você ainda pode continuar: basta usar a planilha completa para informar manualmente os dados necessários para o cadastro.</div>' +
            "</div>"
        ) +
        secao(
          "O que não faz parte desta importação",
          '<div class="alert alert-warning">' +
            Icon("alert-triangle", "size-4") +
            '<div class="alert-desc"><b>Limite desta primeira versão.</b> A importação massiva contempla somente os dados do Cadastro Geral. Informações das demais abas da empresa (Sócios, Contadores, Atividades, Empresa centralizadora) <b>não fazem parte desta importação</b> e deverão ser preenchidas ou vinculadas manualmente no cadastro da empresa.</div>' +
            "</div>"
        ) +
        secao(
          "Modelo de planilha",
          '<div class="flex items-center justify-between gap-3 flex-wrap">' +
            '<p class="text-sm text-muted" style="max-width:520px;">O modelo simplificado traz apenas a coluna de CNPJ, campo obrigatório para iniciar a consulta cadastral de cada empresa.</p>' +
            '<button type="button" class="btn btn-outline btn-sm w-fit" id="btn-baixar-modelo">' + Icon("download", "size-4") + " Baixar modelo</button>" +
            "</div>"
        ) +
        "</div>" +
        '<div class="card-footer justify-end">' +
        '<a href="index.html" class="btn btn-outline">Cancelar</a>' +
        '<button type="button" class="btn" id="btn-intro-continuar">Continuar</button>' +
        "</div>" +
        "</div>"
    );

    document.getElementById("btn-baixar-modelo").addEventListener("click", baixarModelo);
    document.getElementById("btn-intro-continuar").addEventListener("click", () => irPara("upload"));
  }

  function baixarCsv(csv, nomeArquivo) {
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nomeArquivo;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function baixarModelo() {
    baixarCsv(I.gerarModeloSimplificadoCsv(), "modelo-importacao-cnpj.csv");
  }

  function baixarModeloCompleto() {
    baixarCsv(I.gerarModeloCompletoCsv(), "planilha-completa-importacao-empresas.csv");
  }

  // ===== Etapa 2 — Upload =====
  function renderUpload() {
    mount(
      '<div class="card">' +
        '<div class="card-header"><div class="card-title">Envie sua planilha</div><div class="card-description">Utilize o modelo disponibilizado para garantir que os dados estejam no formato esperado.</div></div>' +
        '<div class="card-content">' +
        '<div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(320px, 1fr)); gap:24px; align-items:start;">' +
        '<div class="flex flex-col gap-3" id="upload-area"></div>' +
        '<div class="flex flex-col gap-3">' +
        '<h3 class="detail-section-title">O que esperar</h3>' +
        '<ul class="flex flex-col gap-2 text-sm" style="margin:0; padding-left:18px;">' +
        "<li>Cada linha da planilha representa uma empresa do Cadastro Geral.</li>" +
        "<li>Utilize o modelo disponibilizado na etapa anterior para garantir o formato esperado.</li>" +
        "<li>Depois do envio, o sistema identifica os registros e valida os dados antes da importação.</li>" +
        "</ul>" +
        "</div>" +
        "</div>" +
        "</div>" +
        '<div class="card-footer justify-end">' +
        '<button type="button" class="btn btn-outline" id="btn-upload-voltar">Voltar</button>' +
        '<button type="button" class="btn" id="btn-upload-processar"' + (state.arquivoNome ? "" : " disabled") + ">Processar planilha</button>" +
        "</div>" +
        "</div>"
    );

    renderUploadArea();
    document.getElementById("btn-upload-voltar").addEventListener("click", () => irPara("intro"));
    document.getElementById("btn-upload-processar").addEventListener("click", () => irPara("processing"));
  }

  function renderUploadArea() {
    const area = document.getElementById("upload-area");
    if (!state.arquivoNome) {
      area.innerHTML =
        '<div class="upload-dropzone" id="upload-dropzone" tabindex="0" role="button" aria-label="Selecionar planilha">' +
        '<div class="upload-dropzone-icon">' + Icon("upload", "size-5") + "</div>" +
        '<div class="text-sm font-medium">Arraste sua planilha aqui ou clique para selecionar</div>' +
        '<div class="text-xs text-muted">Formatos aceitos: .xlsx, .csv</div>' +
        "</div>" +
        '<input type="file" id="upload-input" accept=".xlsx,.csv" style="display:none;" />' +
        '<button type="button" class="btn-link link-info w-fit" id="btn-usar-exemplo">Não tem uma planilha em mãos? Usar planilha de exemplo</button>';
      wireUploadDropzone();
    } else {
      area.innerHTML =
        '<div class="upload-file-row">' +
        '<span class="upload-file-icon">' + Icon("file-text", "size-5") + "</span>" +
        '<div class="flex flex-col min-w-0 flex-1"><span class="text-sm font-medium truncate">' + state.arquivoNome + '</span><span class="text-xs text-muted">' + state.arquivoTamanhoKb + " KB</span></div>" +
        '<button type="button" class="btn btn-ghost btn-sm" id="btn-remover-arquivo" aria-label="Remover arquivo">' + Icon("x", "size-4") + "</button>" +
        "</div>";
      document.getElementById("btn-remover-arquivo").addEventListener("click", () => {
        state.arquivoNome = null;
        state.arquivoTamanhoKb = null;
        renderUploadArea();
        document.getElementById("btn-upload-processar").setAttribute("disabled", "true");
      });
    }
  }

  function selecionarArquivo(nome, tamanhoKb) {
    state.arquivoNome = nome;
    state.arquivoTamanhoKb = tamanhoKb;
    renderUploadArea();
    document.getElementById("btn-upload-processar").removeAttribute("disabled");
  }

  function wireUploadDropzone() {
    const dropzone = document.getElementById("upload-dropzone");
    const input = document.getElementById("upload-input");

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
    dropzone.addEventListener("drop", (e) => {
      const arquivo = e.dataTransfer.files && e.dataTransfer.files[0];
      if (arquivo) selecionarArquivo(arquivo.name, Math.max(1, Math.round(arquivo.size / 1024)));
      else selecionarArquivo("empresas_importacao_modelo.xlsx", 38);
    });
    input.addEventListener("change", (e) => {
      const arquivo = e.target.files && e.target.files[0];
      if (arquivo) selecionarArquivo(arquivo.name, Math.max(1, Math.round(arquivo.size / 1024)));
    });
    document.getElementById("btn-usar-exemplo").addEventListener("click", () => selecionarArquivo("empresas_importacao_modelo.xlsx", 38));
  }

  // ===== Etapa 3 — Processamento =====
  function renderProcessing() {
    state.consultaTentativas = 0;
    state.consultaDisponivel = null;
    mount(
      '<div class="card">' +
        '<div class="card-header"><div class="card-title">Processando planilha</div><div class="card-description">Estamos lendo o arquivo e identificando os CNPJs informados.</div></div>' +
        '<div class="card-content flex items-center gap-4" style="padding-top:8px; padding-bottom:8px;" role="status" aria-live="polite" aria-busy="true">' +
        '<div class="spinner spinner-lg"></div>' +
        '<div class="flex flex-col gap-1">' +
        '<div class="text-sm font-medium">Lendo planilha...</div>' +
        '<div class="text-xs text-muted">Identificando os CNPJs informados antes de consultar os dados cadastrais.</div>' +
        "</div>" +
        "</div>" +
        "</div>"
    );
    setTimeout(() => irPara("consulta"), 1400);
  }

  // ===== Etapa 4 — Consulta cadastral =====
  function renderConsulta() {
    mount(
      '<div class="card">' +
        '<div class="card-header"><div class="card-title">Consultando dados cadastrais</div><div class="card-description">Buscando automaticamente os dados de registro de cada CNPJ para preencher o Cadastro Geral.</div></div>' +
        '<div class="card-content flex items-center gap-4" style="padding-top:8px; padding-bottom:8px;" role="status" aria-live="polite" aria-busy="true">' +
        '<div class="spinner spinner-lg"></div>' +
        '<div class="flex flex-col gap-1">' +
        '<div class="text-sm font-medium">Consultando dados cadastrais...</div>' +
        '<div class="text-xs text-muted">Preenchendo automaticamente razão social, endereço e demais dados de registro.</div>' +
        "</div>" +
        "</div>" +
        "</div>"
    );
    setTimeout(() => {
      state.consultaTentativas++;
      if (state.consultaTentativas === 1) {
        renderConsultaIndisponivel();
      } else {
        state.consultaDisponivel = true;
        state.linhas = I.gerarLinhasComConsulta();
        irPara("validation");
      }
    }, 1400);
  }

  function renderConsultaIndisponivel() {
    mount(
      '<div class="card">' +
        '<div class="card-header"><div class="card-title">Consulta cadastral indisponível</div></div>' +
        '<div class="card-content">' +
        '<div class="alert alert-warning">' +
        Icon("alert-triangle", "size-4") +
        '<div class="alert-desc">Não foi possível consultar os dados cadastrais neste momento. Você pode tentar novamente ou continuar utilizando uma planilha completa para informar manualmente os dados necessários para o cadastro.</div>' +
        "</div>" +
        "</div>" +
        '<div class="card-footer justify-end">' +
        '<button type="button" class="btn btn-outline" id="btn-consulta-voltar">Voltar</button>' +
        '<button type="button" class="btn btn-outline" id="btn-consulta-usar-completa">Usar planilha completa</button>' +
        '<button type="button" class="btn" id="btn-consulta-tentar-novamente">' + Icon("rotate-ccw", "size-3-5") + " Tentar novamente</button>" +
        "</div>" +
        "</div>"
    );
    document.getElementById("btn-consulta-voltar").addEventListener("click", () => irPara("upload"));
    document.getElementById("btn-consulta-tentar-novamente").addEventListener("click", renderConsulta);
    document.getElementById("btn-consulta-usar-completa").addEventListener("click", renderFallbackUpload);
  }

  // ===== Cenário alternativo — consulta indisponível: planilha completa =====
  // Etapa própria (não faz parte do STEP_DEFS — assim como a tela de consulta
  // indisponível, é renderizada sem mudar state.step, mantendo "Consulta
  // cadastral" ativa no stepper) para deixar explícito que este é um caminho
  // de fallback manual, distinto do modelo simplificado inicial.
  function renderFallbackUpload() {
    mount(
      '<div class="card">' +
        '<div class="card-header"><div class="card-title">Cadastro manual por planilha</div>' +
        '<div class="card-description">A consulta cadastral está temporariamente indisponível. Para continuar a importação, utilize a planilha completa e informe os dados necessários para o cadastro das empresas.</div></div>' +
        '<div class="card-content">' +
        '<div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(320px, 1fr)); gap:24px; align-items:start;">' +
        '<div class="flex flex-col gap-3" id="fallback-upload-area"></div>' +
        '<div class="flex flex-col gap-3">' +
        '<h3 class="detail-section-title">O que esperar</h3>' +
        '<ul class="flex flex-col gap-2 text-sm" style="margin:0; padding-left:18px;">' +
        "<li>A planilha completa traz todos os campos do Cadastro Geral, para preenchimento manual.</li>" +
        "<li>Os mesmos campos obrigatórios do cadastro individual de uma empresa precisam estar preenchidos.</li>" +
        "<li>Registros sem os campos obrigatórios não são importados — o motivo é indicado na validação.</li>" +
        "</ul>" +
        '<button type="button" class="btn btn-outline btn-sm w-fit" id="btn-baixar-modelo-completo">' + Icon("download", "size-4") + " Baixar planilha completa</button>" +
        "</div>" +
        "</div>" +
        "</div>" +
        '<div class="card-footer justify-end">' +
        '<button type="button" class="btn btn-outline" id="btn-fallback-voltar">Voltar</button>' +
        '<button type="button" class="btn" id="btn-fallback-processar"' + (state.arquivoCompletoNome ? "" : " disabled") + ">Enviar planilha completa</button>" +
        "</div>" +
        "</div>"
    );

    renderFallbackUploadArea();
    document.getElementById("btn-baixar-modelo-completo").addEventListener("click", baixarModeloCompleto);
    document.getElementById("btn-fallback-voltar").addEventListener("click", renderConsultaIndisponivel);
    document.getElementById("btn-fallback-processar").addEventListener("click", () => {
      state.consultaDisponivel = false;
      state.linhas = I.gerarLinhasFallback();
      irPara("validation");
    });
  }

  function renderFallbackUploadArea() {
    const area = document.getElementById("fallback-upload-area");
    if (!state.arquivoCompletoNome) {
      area.innerHTML =
        '<div class="upload-dropzone" id="fallback-upload-dropzone" tabindex="0" role="button" aria-label="Selecionar planilha completa">' +
        '<div class="upload-dropzone-icon">' + Icon("upload", "size-5") + "</div>" +
        '<div class="text-sm font-medium">Arraste a planilha completa aqui ou clique para selecionar</div>' +
        '<div class="text-xs text-muted">Formatos aceitos: .xlsx, .csv</div>' +
        "</div>" +
        '<input type="file" id="fallback-upload-input" accept=".xlsx,.csv" style="display:none;" />' +
        '<button type="button" class="btn-link link-info w-fit" id="btn-fallback-usar-exemplo">Não tem uma planilha em mãos? Usar planilha de exemplo</button>';
      wireFallbackUploadDropzone();
    } else {
      area.innerHTML =
        '<div class="upload-file-row">' +
        '<span class="upload-file-icon">' + Icon("file-text", "size-5") + "</span>" +
        '<div class="flex flex-col min-w-0 flex-1"><span class="text-sm font-medium truncate">' + state.arquivoCompletoNome + '</span><span class="text-xs text-muted">' + state.arquivoCompletoTamanhoKb + " KB</span></div>" +
        '<button type="button" class="btn btn-ghost btn-sm" id="btn-fallback-remover-arquivo" aria-label="Remover arquivo">' + Icon("x", "size-4") + "</button>" +
        "</div>";
      document.getElementById("btn-fallback-remover-arquivo").addEventListener("click", () => {
        state.arquivoCompletoNome = null;
        state.arquivoCompletoTamanhoKb = null;
        renderFallbackUploadArea();
        document.getElementById("btn-fallback-processar").setAttribute("disabled", "true");
      });
    }
  }

  function selecionarArquivoCompleto(nome, tamanhoKb) {
    state.arquivoCompletoNome = nome;
    state.arquivoCompletoTamanhoKb = tamanhoKb;
    renderFallbackUploadArea();
    document.getElementById("btn-fallback-processar").removeAttribute("disabled");
  }

  function wireFallbackUploadDropzone() {
    const dropzone = document.getElementById("fallback-upload-dropzone");
    const input = document.getElementById("fallback-upload-input");

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
    dropzone.addEventListener("drop", (e) => {
      const arquivo = e.dataTransfer.files && e.dataTransfer.files[0];
      if (arquivo) selecionarArquivoCompleto(arquivo.name, Math.max(1, Math.round(arquivo.size / 1024)));
      else selecionarArquivoCompleto("planilha-completa-importacao-empresas.xlsx", 52);
    });
    input.addEventListener("change", (e) => {
      const arquivo = e.target.files && e.target.files[0];
      if (arquivo) selecionarArquivoCompleto(arquivo.name, Math.max(1, Math.round(arquivo.size / 1024)));
    });
    document.getElementById("btn-fallback-usar-exemplo").addEventListener("click", () => selecionarArquivoCompleto("planilha-completa-importacao-empresas.xlsx", 52));
  }

  // ===== Etapa 5 — Validação =====
  function bannerConsulta() {
    return state.consultaDisponivel
      ? '<div class="alert alert-info">' +
          Icon("circle-check", "size-4") +
          '<div class="alert-desc"><b>Consulta cadastral concluída.</b> Os dados encontrados foram usados para preencher automaticamente o Cadastro Geral das empresas prontas para importação.</div>' +
          "</div>"
      : '<div class="alert alert-warning">' +
          Icon("alert-triangle", "size-4") +
          '<div class="alert-desc"><b>Dados informados pela planilha completa.</b> Como a consulta cadastral não estava disponível, os dados informados na planilha completa foram utilizados para preencher o Cadastro Geral — só é possível importar registros com todos os campos obrigatórios preenchidos.</div>' +
          "</div>";
  }

  function renderValidation() {
    const resumo = contarPorStatus(state.linhas);
    mount(
      '<div class="flex flex-col gap-4">' +
        bannerConsulta() +
        '<div class="flex flex-wrap gap-3">' +
        '<div class="stat-card"><span class="stat-card-value">' + resumo.total + '</span><span class="stat-card-label">Empresas encontradas</span></div>' +
        '<div class="stat-card stat-card-success"><span class="stat-card-value">' + resumo.validas + '</span><span class="stat-card-label">Prontas para importação</span></div>' +
        '<div class="stat-card stat-card-warning"><span class="stat-card-value">' + resumo.invalidas + '</span><span class="stat-card-label">Com inconsistência</span></div>' +
        "</div>" +
        '<div class="card">' +
        '<div class="card-header"><div class="flex items-center justify-between flex-wrap gap-3">' +
        '<div><div class="card-title">Lista de empresas</div><div class="card-description">Revise o status de cada registro identificado na planilha.</div></div>' +
        '<div class="toggle-group" id="f-validacao">' +
        '<button type="button" class="toggle-item is-on" data-value="todas">Todas</button>' +
        '<button type="button" class="toggle-item" data-value="validas">Prontas</button>' +
        '<button type="button" class="toggle-item" data-value="invalidas">Com inconsistência</button>' +
        "</div>" +
        "</div></div>" +
        '<div class="card-content"><div id="validation-table"></div></div>' +
        '<div class="card-footer justify-end">' +
        '<button type="button" class="btn btn-outline" id="btn-validation-voltar">Voltar</button>' +
        '<button type="button" class="btn" id="btn-validation-continuar">Continuar</button>' +
        "</div>" +
        "</div>" +
        "</div>"
    );

    function renderTable() {
      document.getElementById("validation-table").innerHTML = renderTabelaLinhas(state.linhas, state.filtroValidacao);
      wireTabelaLinhasEvents();
    }
    renderTable();

    UI.initToggleGroup(document.getElementById("f-validacao"), (v) => {
      state.filtroValidacao = v;
      renderTable();
    });
    document.getElementById("btn-validation-voltar").addEventListener("click", () => irPara("upload"));
    document.getElementById("btn-validation-continuar").addEventListener("click", () => irPara("review"));
  }

  // ===== Revisão =====
  function renderReview() {
    const resumo = contarPorStatus(state.linhas);
    mount(
      '<div class="flex flex-col gap-4">' +
        bannerConsulta() +
        '<div class="flex flex-col gap-1">' +
        '<h2 class="text-base font-semibold">Revise os dados antes de importar</h2>' +
        '<p class="text-sm text-muted"><b>' + resumo.validas + " " + (resumo.validas === 1 ? "empresa está" : "empresas estão") + '</b> prontas para importação · <b>' +
        resumo.invalidas + " " + (resumo.invalidas === 1 ? "empresa possui" : "empresas possuem") + "</b> inconsistências e não serão importadas até que sejam corrigidas.</p>" +
        "</div>" +
        '<div class="card">' +
        '<div class="card-content"><div id="review-table">' + renderTabelaLinhas(state.linhas, "todas") + "</div></div>" +
        '<div class="card-footer justify-end">' +
        '<button type="button" class="btn btn-outline" id="btn-review-voltar">Voltar</button>' +
        '<button type="button" class="btn" id="btn-review-importar">Importar empresas</button>' +
        "</div>" +
        "</div>" +
        "</div>"
    );

    wireTabelaLinhasEvents();
    document.getElementById("btn-review-voltar").addEventListener("click", () => irPara("validation"));
    document.getElementById("btn-review-importar").addEventListener("click", abrirConfirmacaoImportacao);
  }

  function abrirConfirmacaoImportacao() {
    const resumo = contarPorStatus(state.linhas);
    document.getElementById("dialog-confirmar-title").textContent = "Importar " + resumo.validas + " empresas" + (state.consultaDisponivel ? "?" : " sem consulta cadastral?");
    document.getElementById("dialog-confirmar-desc").textContent = state.consultaDisponivel
      ? "Os dados cadastrais encontrados na consulta serão utilizados para preencher o Cadastro Geral das empresas. Informações complementares das demais abas não fazem parte desta importação."
      : "Os dados informados na planilha completa serão utilizados para preencher o Cadastro Geral. Somente empresas com os campos obrigatórios preenchidos poderão ser importadas.";
    UI.openDialog(document.getElementById("dialog-confirmar-importacao"));
  }

  // ===== Etapa 5 — Importação =====
  function renderImporting() {
    mount(
      '<div class="card">' +
        '<div class="card-header"><div class="card-title">Importando empresas</div><div class="card-description">Cadastrando os registros prontos e sincronizando os dados com o Cockpit.</div></div>' +
        '<div class="card-content flex flex-col gap-3" style="padding-top:8px; padding-bottom:8px;">' +
        '<div class="flex items-center gap-4">' +
        '<div class="upload-dropzone-icon">' + Icon("building-2", "size-5") + "</div>" +
        '<div class="flex flex-col gap-1 flex-1">' +
        '<div class="text-sm font-medium">Importando empresas...</div>' +
        '<div class="progress-bar"><div class="progress-bar-fill" id="import-progress-fill" style="width:0%;"></div></div>' +
        "</div>" +
        "</div>" +
        '<div class="text-xs text-muted" id="import-progress-label">Cadastrando empresas e sincronizando os dados com o Cockpit...</div>' +
        "</div>" +
        "</div>"
    );

    const linhasValidas = state.linhas.filter((l) => l.status === "valida");
    const fill = document.getElementById("import-progress-fill");
    const label = document.getElementById("import-progress-label");
    let progresso = 0;
    const intervalo = setInterval(() => {
      progresso += 12;
      fill.style.width = Math.min(progresso, 100) + "%";
      label.textContent = "Cadastrando empresas e sincronizando os dados com o Cockpit... (" + Math.min(progresso, 100) + "%)";
      if (progresso >= 100) {
        clearInterval(intervalo);
        setTimeout(() => {
          state.empresasImportadas = linhasValidas.map((linha, i) => I.converterParaEmpresa(linha, i + 1));
          D.salvarEmpresasImportadas(state.empresasImportadas);
          irPara("result");
        }, 300);
      }
    }, 180);
  }

  // ===== Etapa 6 — Resultado =====
  function renderResult() {
    const resumo = contarPorStatus(state.linhas);
    const invalidas = state.linhas.filter((l) => l.status === "invalida");
    const primeiraImportada = state.empresasImportadas[0];

    mount(
      '<div class="flex flex-col gap-4">' +
        '<div class="alert alert-info gap-2">' +
        Icon("circle-check", "size-4") +
        '<div class="alert-desc"><b>Importação concluída.</b> As empresas foram cadastradas com sucesso.</div>' +
        "</div>" +
        '<div class="flex flex-wrap gap-3">' +
        '<div class="stat-card stat-card-success"><span class="stat-card-value">' + resumo.validas + '</span><span class="stat-card-label">Empresas importadas</span></div>' +
        '<div class="stat-card stat-card-warning"><span class="stat-card-value">' + resumo.invalidas + '</span><span class="stat-card-label">Empresas não importadas</span></div>' +
        "</div>" +
        '<div class="card">' +
        '<div class="card-header"><div class="card-title">Dados sincronizados</div></div>' +
        '<div class="card-content">' +
        '<div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(320px, 1fr)); gap:24px; align-items:center;">' +
        '<div class="flex flex-col gap-3">' +
        '<p class="text-sm">Os dados do Cadastro Geral das empresas importadas foram refletidos e sincronizados no <b>Cockpit</b>.</p>' +
        '<p class="text-xs text-muted">' +
        (state.consultaDisponivel
          ? "Dados obtidos por consulta cadastral, combinados com os campos informados na planilha."
          : "A consulta cadastral não estava disponível nesta rodada — os dados informados na planilha completa foram utilizados.") +
        "</p>" +
        (primeiraImportada
          ? '<a href="dados-gerais.html?empresa=' + encodeURIComponent(primeiraImportada.codigo) + '" class="btn btn-outline btn-sm w-fit">Ver exemplo importado no Cockpit ' + Icon("arrow-up-right", "size-3-5") + "</a>"
          : "") +
        "</div>" +
        '<div class="flow-diagram">' +
        flowNode("file-text", "Planilha") + flowArrow() + flowNode("building-2", "Empresas") + flowArrow() + flowNode("landmark", "Cockpit") +
        "</div>" +
        "</div>" +
        "</div>" +
        "</div>" +
        '<div class="alert alert-warning">' +
        Icon("alert-triangle", "size-4") +
        '<div class="alert-desc"><b>Complete o cadastro das empresas.</b><br/>' +
        "A importação massiva desta versão contempla somente os dados do Cadastro Geral.<br/>" +
        "Informações complementares, como sócios, contadores e demais configurações das outras abas, não fazem parte da importação massiva.<br/>" +
        "Para completar o cadastro, acesse a empresa em <b>Empresas → Cadastro da empresa</b> e preencha ou vincule manualmente as informações restantes.</div>" +
        "</div>" +
        (invalidas.length
          ? '<div class="card">' +
            '<div class="card-header"><div class="card-title">Empresas não importadas</div><div class="card-description">Corrija estes registros na planilha e importe novamente.</div></div>' +
            '<div class="card-content">' + renderTabelaLinhas(invalidas, "todas") + "</div>" +
            "</div>"
          : "") +
        '<div class="flex justify-end gap-2">' +
        '<a href="index.html" class="btn">Ver empresas importadas</a>' +
        "</div>" +
        "</div>"
    );
    wireTabelaLinhasEvents();
  }

  function flowNode(iconName, label) {
    return '<div class="flow-diagram-node"><span class="flow-diagram-node-icon">' + Icon(iconName, "size-4") + "</span>" + label + "</div>";
  }
  function flowArrow() {
    return '<span class="flow-diagram-arrow">' + Icon("arrow-right", "size-4") + "</span>";
  }

  const RENDERERS = {
    intro: renderIntro,
    upload: renderUpload,
    processing: renderProcessing,
    consulta: renderConsulta,
    validation: renderValidation,
    review: renderReview,
    importing: renderImporting,
    result: renderResult,
  };

  // ===== Dialogs genéricos (fechar por data-close-dialog) =====
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
    irPara("importing");
  });

  ensureToast();
  irPara("intro");
})();
