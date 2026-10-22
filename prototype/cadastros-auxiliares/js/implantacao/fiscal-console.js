/*
  Frente Fiscal do console da empresa — implantação dos saldos mensais de
  CPP do DAS para o Fator R (protótipo CTB-534, épico CTB-532). Mesmo
  esqueleto da frente DP (console.js): cabeçalho da frente com status e ação
  de concluir, cards de resumo, abas internas e drawers/modais da página.

  Regras ainda abertas no doc CTB-533 e como a tela trata cada uma:
  - folha implantada pela DP NÃO dispensa a CPP (texto do épico);
  - coluna "Pagamento do DAS" só vale se a regra for o valor recolhido;
  - fonte do extrato do DAS ainda indefinida (o drawer só simula a leitura).
*/
(function (global) {
  const FI = global.FiscalImplantacaoData;

  const ABAS = [
    { key: "saldos", label: "Saldos de CPP" },
    { key: "historico", label: "Histórico" },
  ];

  let ctx = null; // { mountEl, codigo, aba, onAbaChange, onChange, irParaDp }
  let competenciaParaFocar = null;

  function abaLabel(key) {
    return ABAS.find((a) => a.key === key).label;
  }

  function moedaSemPrefixo(valor) {
    return valor === null || valor === undefined ? "" : valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function statusBadge(status) {
    if (status === "implantada") return '<span class="badge badge-success">' + Icon("check", "size-3") + " Implantada</span>";
    if (status === "pronta") return '<span class="badge badge-info">' + Icon("circle-check", "size-3") + " Pronta para concluir</span>";
    if (status === "em_andamento") return '<span class="badge badge-warning">' + Icon("clock", "size-3") + " Em andamento</span>";
    return '<span class="badge badge-warning">' + Icon("clock", "size-3") + " Pendente</span>";
  }

  function origemBadge(m) {
    const rotulo = FI.ROTULO_ORIGEM[m.origem];
    if (m.origem === "pendente") return '<span class="badge badge-warning">' + Icon("clock", "size-3") + " " + rotulo + "</span>";
    if (m.origem === "implantada" || m.origem === "extrato") return '<span class="badge badge-success">' + Icon("check", "size-3") + " " + rotulo + "</span>";
    if (m.origem === "zero") return '<span class="badge badge-secondary">' + Icon("circle-slash", "size-3") + " Sem CPP</span>";
    if (m.origem === "rolagem") return '<span class="badge badge-outline">' + Icon("lock", "size-3") + " " + rotulo + "</span>";
    return '<span class="badge badge-outline">' + rotulo + "</span>";
  }

  function trilha(m) {
    if (!m.editadoPor) return "";
    const nome = m.editadoPor.split(" ")[0];
    return '<span class="text-xs text-muted" title="' + m.editadoPor + " em " + m.editadoEm + '">por ' + nome + " · " + m.editadoEm.split(" ")[0].slice(0, 5) + "</span>";
  }

  function pagamentoHtml(m) {
    if (!m.pagamento || m.origem === "nao_compoe") return '<span class="text-muted">—</span>';
    if (m.pagamento.status === "pago") return '<span class="text-sm">Pago em ' + m.pagamento.data + "</span>";
    if (m.pagamento.status === "atraso") return '<span class="badge badge-warning">' + Icon("alert-triangle", "size-3") + " Pago em atraso · " + m.pagamento.data + "</span>";
    return '<span class="badge badge-destructive">' + Icon("circle-x", "size-3") + " Não pago</span>";
  }

  function folhaHtml(m, enq) {
    if (m.origem === "nao_compoe") return '<span class="text-muted">—</span>';
    if (enq.origemFolha === "dp") return '<span class="tabular-nums">' + FI.formatarMoeda(m.folhaDp) + "</span>";
    if (enq.origemFolha === "sem_folha") return '<span class="text-muted">Sem folha</span>';
    return '<span class="text-muted">Sem relatório na BHub</span>';
  }

  function editavel(m, imp) {
    return !imp.concluida && ["pendente", "implantada", "extrato", "zero"].indexOf(m.origem) !== -1;
  }

  function cppHtml(m, imp) {
    if (m.origem === "nao_compoe") return '<span class="text-muted">—</span>';
    if (!editavel(m, imp)) return '<span class="tabular-nums">' + FI.formatarMoeda(m.cpp) + "</span>";
    return (
      '<div class="money-input' + (m.origem === "pendente" ? " is-pendente" : "") + '">' +
      '<span class="money-input-prefix">R$</span>' +
      '<input type="text" inputmode="decimal" class="field-input" data-cpp-competencia="' + m.competencia + '"' +
      ' value="' + moedaSemPrefixo(m.cpp) + '" placeholder="0,00" aria-label="CPP do DAS em ' + m.competencia + '" />' +
      "</div>"
    );
  }

  function acoesHtml(m, imp) {
    if (!editavel(m, imp)) return "";
    if (m.origem === "pendente") {
      return '<button type="button" class="btn btn-outline btn-xs" data-cpp-zero="' + m.competencia + '" title="Registrar que não houve CPP nesta competência">Sem CPP</button>';
    }
    return '<button type="button" class="btn btn-outline btn-xs" data-cpp-limpar="' + m.competencia + '" title="Voltar a competência para pendente">Limpar</button>';
  }

  function fs12Mes(m) {
    if (m.origem === "nao_compoe" || m.origem === "pendente") return '<span class="text-muted">—</span>';
    return '<span class="tabular-nums font-medium">' + FI.formatarMoeda((m.folhaDp || 0) + (m.cpp || 0)) + "</span>";
  }

  function rowHtml(m, enq, imp) {
    return (
      '<tr class="' + (m.origem === "nao_compoe" ? "row-muted" : "") + '"' + (m.origem === "nao_compoe" ? ' title="Antes do início de atividade (' + enq.inicioAtividade + ')"' : "") + ">" +
      '<td class="cell-mono">' + m.competencia + "</td>" +
      '<td class="col-pad-md">' + folhaHtml(m, enq) + "</td>" +
      '<td class="col-pad-md">' + cppHtml(m, imp) + "</td>" +
      '<td class="col-pad-md"><div class="flex flex-col gap-0-5 items-start">' + origemBadge(m) + trilha(m) + "</div></td>" +
      '<td class="col-pad-md">' + pagamentoHtml(m) + "</td>" +
      '<td class="col-pad-md text-right">' + fs12Mes(m) + "</td>" +
      '<td class="col-pad-end text-right">' + acoesHtml(m, imp) + "</td>" +
      "</tr>"
    );
  }

  // Mais recente no topo, como no histórico de folha da frente DP.
  function renderSaldos(enq, imp, r) {
    const meses = imp.meses.slice().reverse();
    const pendentes = r.pendentes;
    return (
      '<div class="flex items-center justify-between gap-3 flex-wrap">' +
      '<p class="text-sm text-muted">' +
      (imp.concluida
        ? "Saldos implantados, somente leitura."
        : pendentes
        ? "Digite a CPP paga no DAS de cada competência pendente, ou preencha pelo extrato. Vazio não vira zero: use <b>Sem CPP</b> quando não houve CPP no mês."
        : "Todas as competências estão resolvidas.") +
      "</p>" +
      '<button type="button" class="btn btn-outline btn-sm w-fit" id="btn-abrir-extrato"' + (imp.concluida || !pendentes ? " disabled" : "") + ">" +
      Icon("file-text", "size-3-5") + " Preencher pelo extrato do DAS</button>" +
      "</div>" +
      '<div class="table-wrap"><table class="dtable dtable-fixed cpp-table" style="min-width:920px;">' +
      '<colgroup><col style="width:110px" /><col style="width:160px" /><col style="width:170px" /><col style="width:170px" /><col /><col style="width:140px" /><col style="width:90px" /></colgroup>' +
      "<thead><tr>" +
      "<th>Competência</th>" +
      '<th class="col-pad-md">Folha + 13º + FGTS</th>' +
      '<th class="col-pad-md">CPP do DAS</th>' +
      '<th class="col-pad-md">Origem da CPP</th>' +
      '<th class="col-pad-md">Pagamento do DAS</th>' +
      '<th class="col-pad-md text-right">FS12 do mês</th>' +
      '<th class="col-pad-end"><span class="sr-only">Ações</span></th>' +
      "</tr></thead>" +
      "<tbody>" + meses.map((m) => rowHtml(m, enq, imp)).join("") + "</tbody>" +
      "<tfoot><tr>" +
      "<td>Total</td>" +
      '<td class="col-pad-md tabular-nums">' + (enq.origemFolha === "dp" ? FI.formatarMoeda(r.folhaTotal) : "—") + "</td>" +
      '<td class="col-pad-md tabular-nums">' + FI.formatarMoeda(r.cppTotal) + "</td>" +
      '<td class="col-pad-md" colspan="2"><span class="text-muted">' + r.resolvidos + " de " + r.janela + " competências resolvidas</span></td>" +
      '<td class="col-pad-md text-right tabular-nums">' + FI.formatarMoeda(r.fs12) + "</td>" +
      '<td class="col-pad-end"></td>' +
      "</tr></tfoot>" +
      "</table></div>" +
      '<p class="text-xs text-muted flex items-center gap-1-5">' + Icon("info", "size-3-5") +
      " A coluna Pagamento do DAS depende do doc de regras (CTB-533) confirmar que vale o valor recolhido (regime de caixa), e não o apurado.</p>"
    );
  }

  function renderHistorico(imp) {
    const linhas = imp.logs
      .slice()
      .reverse()
      .map(
        (l) =>
          '<tr><td class="col-pad-sm cell-mono text-xs">' + l.dataHora + "</td>" +
          "<td>" + UI.truncatedCell(l.operador, null, "text-sm font-medium") + "</td>" +
          '<td class="col-pad-md">' + l.acao + "</td>" +
          "<td>" + UI.truncatedCell(l.detalhe, null, "text-sm text-muted") + "</td>" +
          '<td class="col-pad-md">' + (l.aprovadoPor || "—") + "</td></tr>"
      )
      .join("");
    return (
      '<p class="text-sm text-muted">Quem implantou, alterou, preencheu pelo extrato ou concluiu, com data e hora.</p>' +
      '<div class="table-wrap"><table class="dtable dtable-fixed">' +
      '<colgroup><col style="width:140px" /><col style="width:180px" /><col style="width:220px" /><col /><col style="width:150px" /></colgroup>' +
      '<thead><tr><th class="col-pad-sm">Data/hora</th><th>Operador</th><th class="col-pad-md">Ação</th><th>Detalhe</th><th class="col-pad-md">Aprovado por</th></tr></thead>' +
      "<tbody>" + (linhas || '<tr><td colspan="5" class="row-empty-state">Sem eventos registrados.</td></tr>') + "</tbody></table></div>"
    );
  }

  function alertaHtml(enq, imp, r, status) {
    if (status === "implantada") {
      return (
        '<div class="alert alert-success">' + Icon("circle-check", "size-4") +
        '<div class="alert-title">Implantação concluída em ' + imp.concluidaEm + " por " + imp.concluidaPor + "</div>" +
        '<div class="alert-desc">Os saldos ficam só para consulta e já entram na FS12 do PGDAS-D. Para corrigir um valor, reabra a implantação.</div></div>'
      );
    }
    if (status === "pronta") {
      return (
        '<div class="alert alert-info">' + Icon("info", "size-4") +
        '<div class="alert-title">Todas as competências estão resolvidas</div>' +
        '<div class="alert-desc">Confira os valores e conclua a implantação. Fator R prévio: ' + FI.formatarPercentual(r.fatorR) + " (" + r.anexo + ").</div></div>"
      );
    }
    const linkDp =
      enq.origemFolha === "dp"
        ? ' <button type="button" class="btn-link link-info" id="link-ir-dp" style="display:inline;">Ver Implantação DP</button>'
        : "";
    const contexto =
      enq.origemFolha === "dp"
        ? "A folha, o 13º e o FGTS já vêm da Implantação DP, mas a CPP paga no DAS não está nessa base." + linkDp
        : enq.origemFolha === "dp_fora"
        ? "A empresa não opera DP na BHub: sem relatórios de folha, a FS12 fica só com a CPP do DAS."
        : "Sem empregados e sem pró-labore, a FS12 é composta só pela CPP do DAS.";
    const fatorR =
      r.fatorR < FI.LIMITE_FATOR_R
        ? " Com o que está implantado hoje, o Fator R prévio fica em " + FI.formatarPercentual(r.fatorR) + " e a empresa cairia no " + r.anexo + "."
        : "";
    return (
      '<div class="alert alert-warning">' + Icon("alert-triangle", "size-4") +
      '<div class="alert-title">Faltam ' + r.pendentes + " competência" + (r.pendentes === 1 ? "" : "s") + " de CPP para o PA " + FI.PA_REFERENCIA + "</div>" +
      '<div class="alert-desc">Sem esse histórico, o PGDAS-D é rejeitado (MSG_ISN_029) e o DAS não é gerado.' + fatorR + " " + contexto + "</div></div>"
    );
  }

  function statCards(r) {
    const abaixo = r.fatorR < FI.LIMITE_FATOR_R;
    return (
      '<div class="flex flex-wrap gap-3">' +
      '<div class="stat-card' + (r.pendentes ? " stat-card-warning" : " stat-card-success") + '"><span class="stat-card-value">' + r.resolvidos + "/" + r.janela + '</span><span class="stat-card-label">Competências resolvidas</span></div>' +
      '<div class="stat-card"><span class="stat-card-value">' + FI.formatarMoeda(r.cppTotal) + '</span><span class="stat-card-label">CPP na janela</span></div>' +
      '<div class="stat-card"><span class="stat-card-value">' + FI.formatarMoeda(r.fs12) + '</span><span class="stat-card-label">FS12 prévia</span></div>' +
      '<div class="stat-card' + (abaixo ? " stat-card-warning" : "") + '"><span class="stat-card-value">' + FI.formatarPercentual(r.fatorR) + '</span><span class="stat-card-label">Fator R prévio · ' + r.anexo + " (limite 28%)</span></div>" +
      "</div>"
    );
  }

  function detalhesHtml(enq, r) {
    const campos = [
      { label: "Atividade sujeita ao Fator R", value: enq.atividade },
      { label: "PA de referência", value: FI.PA_REFERENCIA },
      { label: "Janela", value: FI.JANELA[0] + " a " + FI.JANELA[FI.JANELA.length - 1] + " · " + r.janela + " competências" },
      { label: "Início do motor", value: enq.inicioMotor + (r.rolagem ? " · " + r.rolagem + " pela rolagem" : "") },
      { label: "Origem da folha", value: FI.ORIGEM_FOLHA[enq.origemFolha].label },
      { label: "Início de atividade", value: enq.inicioAtividade + (r.naoCompoe ? " · " + r.naoCompoe + " fora da janela" : "") },
    ];
    return (
      '<div class="detail-grid">' +
      campos.map((c) => '<div class="detail-field"><span class="detail-field-label">' + c.label + '</span><span class="detail-field-value">' + c.value + "</span></div>").join("") +
      "</div>"
    );
  }

  function naoAplicaHtml(enq) {
    return (
      '<div class="empty-state">' +
      '<span class="empty-state-icon">' + Icon("receipt", "size-5") + "</span>" +
      '<p class="empty-state-title">Nada a implantar no Fiscal</p>' +
      '<p class="empty-state-desc">' + (enq ? enq.motivo : "Empresa fora do escopo da Implantação Fiscal.") + " Os saldos de CPP só são exigidos de empresas com atividade sujeita ao Fator R.</p>" +
      "</div>"
    );
  }

  function render(mountEl, opts) {
    ctx = Object.assign({}, opts, { mountEl });
    if (!ctx.aba || !ABAS.some((a) => a.key === ctx.aba)) ctx.aba = "saldos";
    renderTudo();
  }

  function renderTudo() {
    const enq = FI.enquadramento(ctx.codigo);
    const imp = FI.getImplantacao(ctx.codigo);
    const status = FI.status(ctx.codigo);
    if (status === "nao_aplica") {
      ctx.mountEl.innerHTML = naoAplicaHtml(enq);
      ctx.onAbaChange(null, null);
      return;
    }
    const r = FI.resumo(ctx.codigo);
    const acao =
      status === "implantada"
        ? '<button type="button" class="btn btn-outline" id="btn-reabrir-fiscal">' + Icon("rotate-ccw", "size-3-5") + " Reabrir implantação</button>"
        : '<div class="flex flex-col items-end gap-1">' +
          '<button type="button" class="btn" id="btn-concluir-fiscal"' + (status === "pronta" ? "" : " disabled") + ">" + Icon("check", "size-3-5") + " Concluir implantação</button>" +
          (status === "pronta" ? "" : '<span class="text-xs text-muted">Resolva as ' + r.pendentes + " competências pendentes para concluir.</span>") +
          "</div>";

    ctx.mountEl.innerHTML =
      '<div class="flex items-start justify-between gap-3 flex-wrap">' +
      '<div class="flex flex-col gap-1">' +
      '<div class="flex items-center gap-2 flex-wrap"><h2 class="text-lg font-semibold">Saldos de CPP para o Fator R</h2>' + statusBadge(status) + "</div>" +
      '<p class="text-sm text-muted max-w-2xl">CPP paga no DAS nas 12 competências anteriores ao PA. Compõe a folha de salários (FS12) que o PGDAS-D exige mês a mês de quem tem atividade sujeita ao Fator R.</p>' +
      "</div>" + acao + "</div>" +
      detalhesHtml(enq, r) +
      alertaHtml(enq, imp, r, status) +
      statCards(r) +
      '<div class="tabs-list" role="tablist" aria-label="Abas da Implantação Fiscal">' +
      ABAS.map((a) => '<button type="button" role="tab" class="tabs-trigger' + (a.key === ctx.aba ? " is-active" : "") + '" aria-selected="' + (a.key === ctx.aba) + '" data-fiscal-aba="' + a.key + '">' + a.label + "</button>").join("") +
      "</div>" +
      '<div class="flex flex-col gap-3">' + (ctx.aba === "saldos" ? renderSaldos(enq, imp, r) : renderHistorico(imp)) + "</div>";

    ctx.onAbaChange(ctx.aba, abaLabel(ctx.aba));
    wire();
  }

  function aposMudanca() {
    renderTudo();
    ctx.onChange();
  }

  function proximaPendente(depoisDe) {
    const meses = FI.getImplantacao(ctx.codigo).meses.slice().reverse();
    const idx = meses.findIndex((m) => m.competencia === depoisDe);
    const seguinte = meses.slice(idx + 1).find((m) => m.origem === "pendente");
    return seguinte ? seguinte.competencia : null;
  }

  function salvarCpp(input) {
    const competencia = input.getAttribute("data-cpp-competencia");
    const m = FI.getImplantacao(ctx.codigo).meses.find((x) => x.competencia === competencia);
    const valor = FI.parseMoeda(input.value);
    if (valor === null) {
      if (m.origem !== "pendente") FI.limpar(ctx.codigo, competencia);
      else return;
    } else if (valor === m.cpp && m.origem !== "pendente") {
      return;
    } else {
      FI.implantarCpp(ctx.codigo, competencia, valor);
    }
    competenciaParaFocar = proximaPendente(competencia);
    aposMudanca();
  }

  function wire() {
    const el = ctx.mountEl;
    el.querySelectorAll("[data-fiscal-aba]").forEach((btn) => {
      btn.addEventListener("click", () => {
        ctx.aba = btn.getAttribute("data-fiscal-aba");
        renderTudo();
      });
    });
    el.querySelectorAll("[data-cpp-competencia]").forEach((input) => {
      input.addEventListener("change", () => salvarCpp(input));
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          input.blur();
        }
      });
    });
    el.querySelectorAll("[data-cpp-zero]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const competencia = btn.getAttribute("data-cpp-zero");
        FI.confirmarZero(ctx.codigo, competencia);
        UI.showToast("Competência sem CPP", competencia + " registrada como zero confirmado.", "info");
        aposMudanca();
      });
    });
    el.querySelectorAll("[data-cpp-limpar]").forEach((btn) => {
      btn.addEventListener("click", () => {
        FI.limpar(ctx.codigo, btn.getAttribute("data-cpp-limpar"));
        aposMudanca();
      });
    });
    const linkDp = el.querySelector("#link-ir-dp");
    if (linkDp) linkDp.addEventListener("click", ctx.irParaDp);
    const btnExtrato = el.querySelector("#btn-abrir-extrato");
    if (btnExtrato) btnExtrato.addEventListener("click", abrirExtrato);
    const btnConcluir = el.querySelector("#btn-concluir-fiscal");
    if (btnConcluir) btnConcluir.addEventListener("click", abrirConcluir);
    const btnReabrir = el.querySelector("#btn-reabrir-fiscal");
    if (btnReabrir) {
      btnReabrir.addEventListener("click", () => {
        FI.reabrir(ctx.codigo);
        UI.showToast("Implantação reaberta", "Os saldos de CPP voltaram a ficar editáveis.", "info");
        aposMudanca();
      });
    }
    if (competenciaParaFocar) {
      const proximo = el.querySelector('[data-cpp-competencia="' + competenciaParaFocar + '"]');
      if (proximo) proximo.focus();
      competenciaParaFocar = null;
    }
  }

  // ===== Drawer "Preencher pelo extrato do DAS" =====
  let extratoArquivo = null;

  function nomeExtrato() {
    const slug = global.EmpresasImplantacaoData.infoEmpresa(ctx.codigo)
      .nome.normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "");
    return "Extrato_PGDAS-D_" + slug + ".pdf";
  }

  function renderExtratoBody() {
    const body = document.getElementById("extrato-das-body");
    if (!extratoArquivo) {
      body.innerHTML =
        '<div class="alert alert-info">' + Icon("info", "size-4") +
        '<div class="alert-desc">A fonte do extrato (SERPRO/Integra Contador, PGDAS-D anteriores ou Domínio) ainda depende do doc de regras (CTB-533). Aqui a leitura é simulada.</div></div>' +
        '<div class="upload-dropzone" id="extrato-dropzone" tabindex="0" role="button" aria-label="Selecionar extrato do DAS">' +
        '<div class="upload-dropzone-icon">' + Icon("upload", "size-5") + "</div>" +
        '<div class="text-sm font-medium">Arraste o extrato do DAS aqui ou clique para selecionar</div>' +
        '<div class="text-xs text-muted">PDF do PGDAS-D · até 15MB</div></div>';
      const dz = document.getElementById("extrato-dropzone");
      const selecionar = () => {
        extratoArquivo = nomeExtrato();
        renderExtratoBody();
      };
      dz.addEventListener("click", selecionar);
      dz.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          selecionar();
        }
      });
      document.getElementById("btn-extrato-aplicar").disabled = true;
      return;
    }
    const sugestoes = FI.sugestoesExtrato(ctx.codigo);
    body.innerHTML =
      '<div class="upload-file-row">' +
      '<span class="upload-file-icon">' + Icon("file-text", "size-4") + "</span>" +
      '<div class="flex flex-col min-w-0 flex-1 gap-0-5"><span class="text-sm font-medium truncate">' + extratoArquivo + '</span><span class="text-xs text-muted">' + sugestoes.length + " competências pendentes encontradas no extrato</span></div>" +
      '<button type="button" class="btn btn-ghost btn-sm" id="extrato-remover" aria-label="Remover arquivo">' + Icon("x", "size-4") + "</button>" +
      "</div>" +
      '<p class="text-sm text-muted">Confira a CPP lida em cada competência antes de aplicar. Os valores entram como <b>Extrato do DAS</b> e continuam editáveis na tabela.</p>' +
      '<div class="table-wrap"><table class="dtable dtable-compact">' +
      '<thead><tr><th>Competência</th><th class="text-right">CPP lida</th><th class="col-pad-md">Pagamento</th></tr></thead><tbody>' +
      sugestoes
        .map((s) => '<tr><td class="cell-mono">' + s.competencia + '</td><td class="text-right tabular-nums">' + FI.formatarMoeda(s.valor) + '</td><td class="col-pad-md">' + pagamentoHtml({ pagamento: s.pagamento, origem: "pendente" }) + "</td></tr>")
        .join("") +
      "</tbody></table></div>";
    document.getElementById("extrato-remover").addEventListener("click", () => {
      extratoArquivo = null;
      renderExtratoBody();
    });
    document.getElementById("btn-extrato-aplicar").disabled = sugestoes.length === 0;
  }

  function abrirExtrato() {
    extratoArquivo = null;
    document.getElementById("extrato-das-sub").textContent = global.EmpresasImplantacaoData.infoEmpresa(ctx.codigo).nome + " · janela " + FI.JANELA[0] + " a " + FI.JANELA[FI.JANELA.length - 1];
    renderExtratoBody();
    UI.openSheet(document.getElementById("extrato-das-overlay"), document.getElementById("extrato-das-panel"));
  }

  function fecharExtrato() {
    UI.closeSheet(document.getElementById("extrato-das-overlay"), document.getElementById("extrato-das-panel"));
  }

  // ===== Modal de conclusão =====
  function abrirConcluir() {
    const r = FI.resumo(ctx.codigo);
    document.getElementById("dialog-concluir-fiscal-desc").textContent =
      "Os saldos passam a valer na FS12 do PGDAS-D e ficam só para consulta. Dá para reabrir depois, se precisar corrigir.";
    document.getElementById("dialog-concluir-fiscal-resumo").innerHTML = [
      { label: "Competências resolvidas", value: r.resolvidos + " de " + r.janela },
      { label: "CPP na janela", value: FI.formatarMoeda(r.cppTotal) },
      { label: "FS12 prévia", value: FI.formatarMoeda(r.fs12) },
      { label: "Fator R prévio", value: FI.formatarPercentual(r.fatorR) + " · " + r.anexo },
    ]
      .map((c) => '<div class="detail-field"><span class="detail-field-label">' + c.label + '</span><span class="detail-field-value">' + c.value + "</span></div>")
      .join("");
    UI.openDialog(document.getElementById("dialog-concluir-fiscal"));
  }

  function setup() {
    document.getElementById("extrato-das-close").innerHTML = Icon("x", "size-4");
    document.getElementById("icon-close-concluir-fiscal").innerHTML = Icon("x", "size-4");
    document.getElementById("icon-confirmar-concluir-fiscal").innerHTML = Icon("check", "size-3-5");
    const overlay = document.getElementById("extrato-das-overlay");
    const panel = document.getElementById("extrato-das-panel");
    document.getElementById("extrato-das-close").addEventListener("click", fecharExtrato);
    document.getElementById("btn-extrato-cancelar").addEventListener("click", fecharExtrato);
    overlay.addEventListener("click", fecharExtrato);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && panel.classList.contains("is-open")) fecharExtrato();
    });
    document.getElementById("btn-extrato-aplicar").addEventListener("click", () => {
      const n = FI.aplicarExtrato(ctx.codigo, extratoArquivo);
      fecharExtrato();
      UI.showToast("Valores aplicados", n + " competência(s) preenchida(s) pelo extrato do DAS.");
      aposMudanca();
    });
    document.getElementById("btn-confirmar-concluir-fiscal").addEventListener("click", () => {
      FI.concluir(ctx.codigo);
      UI.closeDialog(document.getElementById("dialog-concluir-fiscal"));
      UI.showToast("Implantação Fiscal concluída", "Os saldos de CPP passam a compor a FS12 do PGDAS-D.");
      aposMudanca();
    });
  }

  global.FiscalConsole = { setup, render };
})(window);
