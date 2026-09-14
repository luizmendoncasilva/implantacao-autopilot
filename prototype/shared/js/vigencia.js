/*
  Seletor de Vigência + Linha do Tempo/Histórico — componente compartilhado
  (docs/parametros-fiscais-arquitetura.md, seção 14: "Biblioteca de
  Componentes"). Fiscal é a primeira trilha a consumi-lo, mas o componente é
  agnóstico ao domínio: recebe uma lista de vigências e devolve, via
  callback, qual está selecionada — nenhuma regra de negócio (abertura,
  encerramento, bloqueio) vive aqui. DP e Contábil devem reaproveitar este
  módulo quando adotarem versionamento (seção 13.8), em vez de reimplementar.

  Cada vigência = { id, dataInicio, dataFim (null = vigência atual),
  regimeTributario, anexo, tipoEstabelecimento }. A lista deve vir ordenada
  da mais recente para a mais antiga (vigencias[0] = vigência atual).

  Uso:
    VigenciaSelector.mount({
      indicatorMount: document.getElementById("vigencia-indicator-mount"),
      vigencias: [...],
      onChange: function (vigenciaSelecionada, isAtual) { ... },
      // Opcional (implementado na etapa "Vigência Funcional" da trilha
      // Fiscal): quando informado, habilita a ação "Iniciar nova vigência"
      // (só enquanto a vigência atual está selecionada) e abre um diálogo
      // pedindo a data de início. onCriarNovaVigencia(dataInicio) deve
      // devolver { vigencias, novaVigencia } (a nova lista completa já
      // ordenada da mais recente para a mais antiga) ou lançar um Error com
      // mensagem amigável em caso de validação — o componente exibe essa
      // mensagem no próprio diálogo. Quem NÃO informar este callback (ex.:
      // DP > Regime, folha-page.js) mantém o botão permanentemente
      // desabilitado, exatamente como antes desta etapa — nenhuma trilha
      // que ainda não definiu suas próprias regras de abertura é afetada.
      onCriarNovaVigencia: function (dataInicio) { ... },
    });
*/
(function (global) {
  function fmtPeriodo(v) {
    return v.dataFim ? v.dataInicio + " – " + v.dataFim : "desde " + v.dataInicio;
  }

  function renderTimelineItem(v, isSelected) {
    const atual = !v.dataFim;
    // regimeTributario/anexo/tipoEstabelecimento são opcionais — só DP >
    // Regime os informa hoje (metadado de exibição da linha do tempo).
    // Fiscal (etapa "Vigência Funcional") não os utiliza; nenhuma origem
    // real existiria para reconstruí-los por vigência, então o item some
    // do rodapé quando ausentes em vez de exibir "undefined".
    const metaHtml = v.regimeTributario ? '<div class="vigencia-timeline-meta">' + v.regimeTributario + " · " + v.anexo + " · " + v.tipoEstabelecimento + "</div>" : "";
    return (
      '<button type="button" class="vigencia-timeline-item' +
      (atual ? " is-current" : "") +
      (isSelected ? " is-selected" : "") +
      '" data-vigencia-id="' + v.id + '">' +
      '<span class="vigencia-timeline-dot"></span>' +
      '<div class="vigencia-timeline-body">' +
      '<div class="vigencia-timeline-header">' +
      '<span class="vigencia-timeline-period">' + fmtPeriodo(v) + "</span>" +
      (atual ? '<span class="badge badge-success">Atual</span>' : '<span class="badge badge-outline">Encerrada</span>') +
      "</div>" +
      metaHtml +
      "</div>" +
      "</button>"
    );
  }

  function ensurePanel() {
    if (document.getElementById("vigencia-historico-overlay")) return;
    const overlay = document.createElement("div");
    overlay.className = "sheet-overlay";
    overlay.id = "vigencia-historico-overlay";
    const panel = document.createElement("div");
    panel.className = "sheet-panel";
    panel.id = "vigencia-historico-panel";
    panel.innerHTML =
      '<button type="button" class="sheet-close" id="vigencia-historico-close">' + Icon("x", "size-4") + "</button>" +
      '<div class="sheet-header">' +
      '<div class="sheet-title">Histórico de vigências</div>' +
      '<div class="sheet-description">Selecione um período para consultar em modo somente leitura. Regras de abertura, encerramento e critérios automáticos de nova vigência ainda não estão implementadas nesta etapa.</div>' +
      "</div>" +
      '<div class="sheet-body">' +
      '<div class="vigencia-timeline" id="vigencia-timeline"></div>' +
      "</div>" +
      '<div class="sheet-footer">' +
      '<button type="button" class="btn btn-outline" id="btn-voltar-vigencia-atual">Voltar para vigência atual</button>' +
      '<button type="button" class="btn" id="btn-iniciar-nova-vigencia" disabled title="Regras de abertura de nova vigência ainda não definidas nesta etapa">Iniciar nova vigência</button>' +
      "</div>";
    document.body.appendChild(overlay);
    document.body.appendChild(panel);
  }

  // Diálogo "Iniciar nova vigência" — só existe quando o chamador informa
  // opts.onCriarNovaVigencia. Usa o padrão .dialog-overlay/.dialog-content já
  // usado no projeto para formulários curtos de confirmação (ex.:
  // prototype/empresas/contadores.html), deliberadamente distinto do sheet
  // de histórico e do drawer de edição de parâmetros de cada aba.
  function ensureNovaVigenciaDialog() {
    if (document.getElementById("vigencia-nova-overlay")) return;
    const overlay = document.createElement("div");
    overlay.className = "dialog-overlay";
    overlay.id = "vigencia-nova-overlay";
    overlay.innerHTML =
      '<div class="dialog-content" role="dialog" aria-modal="true" aria-labelledby="vigencia-nova-title">' +
      '<button type="button" class="dialog-close" id="vigencia-nova-close" aria-label="Fechar">' + Icon("x", "size-4") + "</button>" +
      '<div class="flex flex-col gap-1">' +
      '<h2 class="dialog-title" id="vigencia-nova-title">Iniciar nova vigência</h2>' +
      '<p class="dialog-description">Informe a data de início da nova vigência. Ela passa a ser a vigência atual e recebe uma cópia dos parâmetros da vigência vigente até então; a vigência atual é encerrada no dia anterior e passa para o histórico, sem alteração retroativa nela.</p>' +
      "</div>" +
      '<div class="flex flex-col gap-1" style="margin-top:4px;">' +
      '<label class="field-label" for="input-nova-vigencia-data">Data de início</label>' +
      '<input class="field-input" type="text" id="input-nova-vigencia-data" placeholder="dd/mm/aaaa" />' +
      '<span class="text-xs" id="vigencia-nova-erro" style="color:var(--destructive); display:none;"></span>' +
      "</div>" +
      '<div class="dialog-footer">' +
      '<button type="button" class="btn btn-outline" id="vigencia-nova-cancelar">Cancelar</button>' +
      '<button type="button" class="btn" id="vigencia-nova-salvar">Salvar</button>' +
      "</div>" +
      "</div>";
    document.body.appendChild(overlay);
  }

  function mount(opts) {
    let vigencias = opts.vigencias;
    let selectedId = vigencias[0].id;

    ensurePanel();
    const overlay = document.getElementById("vigencia-historico-overlay");
    const panel = document.getElementById("vigencia-historico-panel");

    function selecionada() {
      return vigencias.find((v) => v.id === selectedId) || vigencias[0];
    }
    function isAtual() {
      return !selecionada().dataFim;
    }

    function renderIndicator() {
      const v = selecionada();
      const atual = isAtual();
      opts.indicatorMount.innerHTML =
        '<div class="vigencia-indicator">' +
        Icon("calendar", "size-4") +
        '<div class="vigencia-indicator-text">' +
        '<span class="vigencia-indicator-label">' + (atual ? "Vigência atual" : "Vigência histórica") + "</span>" +
        '<span class="vigencia-indicator-period">' + fmtPeriodo(v) + "</span>" +
        "</div>" +
        (atual ? '<span class="badge badge-success">Atual</span>' : '<span class="badge badge-outline">Somente leitura</span>') +
        '<button type="button" class="btn btn-outline btn-sm" id="btn-ver-historico-vigencia">' +
        Icon("clock", "size-3-5") +
        " Ver histórico</button>" +
        "</div>";
      document.getElementById("btn-ver-historico-vigencia").addEventListener("click", abrirHistorico);
    }

    function renderTimeline() {
      document.getElementById("vigencia-timeline").innerHTML = vigencias.map((v) => renderTimelineItem(v, v.id === selectedId)).join("");
      panel.querySelectorAll("[data-vigencia-id]").forEach((btn) => {
        btn.addEventListener("click", () => {
          selectedId = btn.getAttribute("data-vigencia-id");
          renderTimeline();
          renderIndicator();
          fecharHistorico();
          if (opts.onChange) opts.onChange(selecionada(), isAtual());
        });
      });
      document.getElementById("btn-voltar-vigencia-atual").disabled = isAtual();

      // "Iniciar nova vigência" só fica habilitado com a vigência atual
      // selecionada no histórico — abrir uma nova vigência a partir de um
      // período histórico não faz sentido (a nova sempre parte da atual).
      // Sem opts.onCriarNovaVigencia (ex.: DP > Regime) o botão permanece
      // exatamente como antes: desabilitado, com o título original.
      const btnIniciar = document.getElementById("btn-iniciar-nova-vigencia");
      if (opts.onCriarNovaVigencia) {
        btnIniciar.disabled = !isAtual();
        btnIniciar.title = isAtual() ? "" : "Só é possível iniciar uma nova vigência a partir da vigência atual.";
      }
    }

    function abrirHistorico() {
      renderTimeline();
      UI.openSheet(overlay, panel);
    }
    function fecharHistorico() {
      UI.closeSheet(overlay, panel);
    }

    document.getElementById("vigencia-historico-close").addEventListener("click", fecharHistorico);
    overlay.addEventListener("click", fecharHistorico);
    document.getElementById("btn-voltar-vigencia-atual").addEventListener("click", () => {
      selectedId = vigencias[0].id;
      renderTimeline();
      renderIndicator();
      if (opts.onChange) opts.onChange(selecionada(), true);
    });

    if (opts.onCriarNovaVigencia) {
      ensureNovaVigenciaDialog();
      const novaOverlay = document.getElementById("vigencia-nova-overlay");
      const inputData = document.getElementById("input-nova-vigencia-data");
      const erroEl = document.getElementById("vigencia-nova-erro");

      function fecharNovaVigenciaDialog() {
        UI.closeDialog(novaOverlay);
        inputData.value = "";
        erroEl.style.display = "none";
      }

      document.getElementById("btn-iniciar-nova-vigencia").addEventListener("click", () => {
        if (document.getElementById("btn-iniciar-nova-vigencia").disabled) return;
        fecharHistorico();
        erroEl.style.display = "none";
        inputData.value = "";
        UI.openDialog(novaOverlay);
        inputData.focus();
      });
      document.getElementById("vigencia-nova-close").addEventListener("click", fecharNovaVigenciaDialog);
      document.getElementById("vigencia-nova-cancelar").addEventListener("click", fecharNovaVigenciaDialog);
      novaOverlay.addEventListener("click", (e) => {
        if (e.target === novaOverlay) fecharNovaVigenciaDialog();
      });
      document.getElementById("vigencia-nova-salvar").addEventListener("click", () => {
        try {
          const resultado = opts.onCriarNovaVigencia(inputData.value.trim());
          vigencias = resultado.vigencias;
          selectedId = resultado.novaVigencia.id;
          fecharNovaVigenciaDialog();
          renderIndicator();
          renderTimeline();
          if (opts.onChange) opts.onChange(selecionada(), true);
          UI.showToast("Nova vigência iniciada", "A vigência atual passou a valer a partir de " + resultado.novaVigencia.dataInicio + ".");
        } catch (e) {
          erroEl.textContent = e.message;
          erroEl.style.display = "";
        }
      });
    }

    renderIndicator();
    renderTimeline();
    if (opts.onChange) opts.onChange(selecionada(), isAtual());
  }

  global.VigenciaSelector = { mount };
})(window);
