/*
  Frente Fiscal do console da empresa — saldos de CPP do DAS para o Fator R
  (protótipo CTB-534; regras do doc CTB-533 v1.1; captura SERPRO CTB-537).
  Mesmo esqueleto da frente DP (console.js): cabeçalho da frente com status e
  ação principal, cards de resumo, abas internas e drawers/modais da página.

  Fluxo (Discovery de 23/10/2026): "Nova implantação" consulta a SERPRO e já
  traz o que o motor calculou; o que faltar entra pelo extrato do DAS ou,
  em último caso, à mão; a conclusão é sempre humana.
*/
(function (global) {
  const FI = global.FiscalImplantacaoData;
  const EI = global.EmpresasImplantacaoData;

  const ABAS = [
    { key: "saldos", label: "Saldos de CPP" },
    { key: "historico", label: "Histórico" },
  ];

  let ctx = null; // { mountEl, codigo, aba, onAbaChange, onChange, irParaDp }
  let periodoParaFocar = null;

  function esc(texto) {
    return String(texto === null || texto === undefined ? "" : texto).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
  }

  function abaLabel(key) {
    return ABAS.find((a) => a.key === key).label;
  }

  function moedaSemPrefixo(valor) {
    return valor === null || valor === undefined ? "" : valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // Como a folha entra na FS12 desta empresa, a partir do Cockpit e da Implantação DP (RN-06, RN-13).
  function contextoFolha(codigo) {
    const sc = EI.statusCockpit(codigo);
    if (sc.hr !== "OPERATING") return { modoFolha: sc.dpFora ? "dp_fora" : "nao_opera" };
    const dp = EI.empresaImplantacao(codigo);
    if (EI.semMovimento(codigo) || (!dp && sc.folha === "SEM_MOVIMENTO")) return { modoFolha: "sem_movimento" };
    if (dp && dp.resumo.financeiro.carregadas > 0) return { modoFolha: "dp", folhaDp: (i) => 18000 + i * 210 };
    return { modoFolha: "aguardando_dp" };
  }

  function statusBadge(status) {
    if (status === "implantada") return '<span class="badge badge-success">' + Icon("check", "size-3") + " Implantada</span>";
    if (status === "pronta") return '<span class="badge badge-info">' + Icon("circle-check", "size-3") + " Pronta para concluir</span>";
    return '<span class="badge badge-warning">' + Icon("clock", "size-3") + " Em andamento</span>";
  }

  function origemBadge(m) {
    const rotulo = FI.ROTULO_ORIGEM_CPP[m.origemCpp];
    if (m.origemCpp === "pendente") return '<span class="badge badge-warning">' + Icon("clock", "size-3") + " " + rotulo + "</span>";
    if (m.origemCpp === "motor") return '<span class="badge badge-outline">' + Icon("lock", "size-3") + " " + rotulo + "</span>";
    if (m.origemCpp === "serpro" || m.origemCpp === "extrato" || m.origemCpp === "manual") return '<span class="badge badge-success">' + Icon("check", "size-3") + " " + rotulo + "</span>";
    if (m.origemCpp === "zero") return '<span class="badge badge-secondary">' + Icon("circle-x", "size-3") + " " + rotulo + "</span>";
    return '<span class="badge badge-outline">' + rotulo + "</span>";
  }

  function detalheOrigem(m) {
    const linhas = [];
    const t = FI.transmitido(ctx.codigo);
    if (t && FI.consumido(ctx.codigo, m.periodo) && m.origemCpp !== "nao_compoe") linhas.push('<span class="badge badge-outline" title="RN-09: correção pela retificação do PGDAS-D (FIS-853)">' + Icon("lock", "size-3") + " Consumido no PA " + t.pa + "</span>");
    if (m.origemCpp === "pendente" && m.motivo) linhas.push('<span class="text-xs cpp-motivo">' + esc(FI.MOTIVO_SERPRO[m.motivo]) + "</span>");
    if (m.evidencia && m.origemCpp !== "manual") linhas.push('<span class="text-xs text-muted truncate" style="max-width:100%;" title="' + esc(m.evidencia) + '">' + esc(m.evidencia) + "</span>");
    if (m.editadoPor) linhas.push('<span class="text-xs text-muted" title="' + esc(m.editadoPor) + " em " + esc(m.editadoEm) + '">por ' + esc(m.editadoPor.split(" ")[0]) + " · " + esc(m.editadoEm.split(" ")[0].slice(0, 5)) + "</span>");
    return linhas.join("");
  }

  function campoMoeda(atributo, periodo, valor, rotulo, pendente) {
    return (
      '<div class="money-input' + (pendente ? " is-pendente" : "") + '">' +
      '<span class="money-input-prefix">R$</span>' +
      '<input type="text" inputmode="decimal" class="field-input" ' + atributo + '="' + periodo + '" value="' + moedaSemPrefixo(valor) + '" placeholder="0,00" aria-label="' + rotulo + " no período " + periodo + '" />' +
      "</div>"
    );
  }

  function folhaHtml(m, imp) {
    if (m.origemCpp === "nao_compoe") return '<span class="text-muted">—</span>';
    if (m.origemFolha === "dp_fora") {
      if (imp.concluida || FI.consumido(ctx.codigo, m.periodo)) return '<span class="tabular-nums">' + FI.formatarMoeda(m.folha) + '</span><span class="text-xs text-muted">Manual</span>';
      return campoMoeda("data-folha-periodo", m.periodo, m.folha, "Folha, 13º e FGTS", m.folha === null) + '<span class="text-xs text-muted">Manual (DP fora da BHub)</span>';
    }
    if (m.origemFolha === "dp") return '<span class="tabular-nums">' + FI.formatarMoeda(m.folha) + '</span><span class="text-xs text-muted">Implantação DP</span>';
    return '<span class="text-muted text-sm">' + FI.MODO_FOLHA[m.origemFolha].rotulo + "</span>";
  }

  function cppHtml(m, imp) {
    if (m.origemCpp === "nao_compoe") return '<span class="text-muted">—</span>';
    if (!FI.editavelCpp(m, imp, ctx.codigo)) return '<span class="tabular-nums">' + FI.formatarMoeda(m.cpp) + "</span>";
    const evidencia =
      m.origemCpp === "manual"
        ? '<input type="text" class="field-input cpp-evidencia" data-evidencia-periodo="' + m.periodo + '" value="' + esc(m.evidencia || "") + '" placeholder="Evidência: nº da declaração" aria-label="Evidência da CPP do período ' + m.periodo + '" />'
        : "";
    return campoMoeda("data-cpp-periodo", m.periodo, m.cpp, "CPP do DAS", m.origemCpp === "pendente") + evidencia;
  }

  function acoesHtml(m, imp) {
    if (!FI.editavelCpp(m, imp, ctx.codigo)) return "";
    if (m.origemCpp === "pendente") return '<button type="button" class="btn btn-outline btn-xs" data-cpp-zero="' + m.periodo + '" title="Registrar que o DAS deste período não teve CPP">Sem CPP</button>';
    return '<button type="button" class="btn btn-outline btn-xs" data-cpp-limpar="' + m.periodo + '" title="Voltar o período para pendente">Limpar</button>';
  }

  function fs12Periodo(m) {
    const folhaOk = m.origemFolha !== "dp_fora" || m.folha !== null;
    if (m.origemCpp === "nao_compoe" || m.origemCpp === "pendente" || !folhaOk) return '<span class="text-muted">—</span>';
    return '<span class="tabular-nums font-medium">' + FI.formatarMoeda((m.folha || 0) + (m.cpp || 0)) + "</span>";
  }

  function rowHtml(m, imp) {
    const naoCompoe = m.origemCpp === "nao_compoe";
    return (
      "<tr" + (naoCompoe ? ' class="row-muted" title="Antes do início de atividade (' + imp.enq.inicioAtividade + ')"' : "") + ">" +
      '<td><div class="flex flex-col gap-0-5"><span class="cell-mono">' + m.periodo + '</span><span class="text-xs text-muted">DAS do PA ' + m.pa + "</span></div></td>" +
      '<td class="col-pad-md"><div class="flex flex-col gap-0-5 items-start">' + folhaHtml(m, imp) + "</div></td>" +
      '<td class="col-pad-md"><div class="flex flex-col gap-1">' + cppHtml(m, imp) + "</div></td>" +
      '<td class="col-pad-md"><div class="flex flex-col gap-0-5 items-start min-w-0">' + origemBadge(m) + detalheOrigem(m) + "</div></td>" +
      '<td class="col-pad-md text-right">' + fs12Periodo(m) + "</td>" +
      '<td class="col-pad-end text-right">' + acoesHtml(m, imp) + "</td>" +
      "</tr>"
    );
  }

  function renderSaldos(imp, r) {
    const meses = imp.meses.slice().reverse();
    const pendentesCpp = imp.meses.filter((m) => m.origemCpp === "pendente").length;
    return (
      '<div class="flex items-center justify-between gap-3 flex-wrap">' +
      '<p class="text-sm text-muted max-w-2xl">' +
      (imp.concluida
        ? "Saldos implantados, só para consulta."
        : "Ordem das fontes: calculado pelo motor → SERPRO → extrato do DAS → manual. Uma fonte de menor prevalência não sobrescreve uma de maior, então só período pendente ou manual aceita digitação.") +
      "</p>" +
      '<div class="flex gap-2 flex-wrap">' +
      (imp.concluida ? "" : '<button type="button" class="btn btn-outline btn-sm w-fit" id="btn-abrir-lote-cpp" title="Planilha com CNPJ, período, CPP e nº da declaração (RF-104)">' + Icon("upload", "size-3-5") + " Carga em lote</button>") +
      '<button type="button" class="btn btn-outline btn-sm w-fit" id="btn-abrir-extrato"' + (imp.concluida || !pendentesCpp ? " disabled" : "") + ">" + Icon("upload", "size-3-5") + " Subir extrato do DAS</button>" +
      "</div></div>" +
      '<div class="table-wrap"><table class="dtable dtable-fixed cpp-table" style="min-width:900px;">' +
      '<colgroup><col style="width:130px" /><col style="width:190px" /><col style="width:190px" /><col /><col style="width:150px" /><col style="width:96px" /></colgroup>' +
      "<thead><tr>" +
      "<th>Período (caixa)</th>" +
      '<th class="col-pad-md">Folha + 13º + FGTS</th>' +
      '<th class="col-pad-md">CPP do DAS</th>' +
      '<th class="col-pad-md">Origem da CPP</th>' +
      '<th class="col-pad-md text-right">FS12 do período</th>' +
      '<th class="col-pad-end"><span class="sr-only">Ações</span></th>' +
      "</tr></thead>" +
      "<tbody>" + meses.map((m) => rowHtml(m, imp)).join("") + "</tbody>" +
      "<tfoot><tr>" +
      "<td>Total</td>" +
      '<td class="col-pad-md tabular-nums">' + FI.formatarMoeda(r.folhaTotal) + "</td>" +
      '<td class="col-pad-md tabular-nums">' + FI.formatarMoeda(r.cppTotal) + "</td>" +
      '<td class="col-pad-md"><span class="text-muted">' + r.resolvidos + " de " + r.exigidos + " períodos resolvidos</span></td>" +
      '<td class="col-pad-md text-right tabular-nums">' + FI.formatarMoeda(r.fs12) + "</td>" +
      '<td class="col-pad-end"></td>' +
      "</tr></tfoot>" +
      "</table></div>" +
      '<p class="text-xs text-muted flex items-center gap-1-5">' + Icon("info", "size-3-5") +
      " Regime de caixa pelo vencimento do DAS: a CPP do DAS do PA M entra no período M+1 (RN-05).</p>"
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
          "<td>" + UI.truncatedCell(l.detalhe, null, "text-sm text-muted") + "</td></tr>"
      )
      .join("");
    return (
      '<p class="text-sm text-muted">Quem iniciou, consultou, implantou, alterou ou concluiu, com data e hora.</p>' +
      '<div class="table-wrap"><table class="dtable dtable-fixed">' +
      '<colgroup><col style="width:140px" /><col style="width:190px" /><col style="width:230px" /><col /></colgroup>' +
      '<thead><tr><th class="col-pad-sm">Data/hora</th><th>Operador</th><th class="col-pad-md">Ação</th><th>Detalhe</th></tr></thead>' +
      "<tbody>" + (linhas || '<tr><td colspan="4" class="row-empty-state">Sem eventos registrados.</td></tr>') + "</tbody></table></div>"
    );
  }

  function listaPendencias(r) {
    const lista = r.pendencias.map((p) => p.periodo + " (" + p.faltam.join(" e ") + ")");
    return lista.length > 6 ? lista.slice(0, 6).join(", ") + " e mais " + (lista.length - 6) : lista.join(", ");
  }

  function alertaHtml(imp, r, status, modo) {
    const t = FI.transmitido(ctx.codigo);
    const travados = t ? imp.meses.filter((m) => m.origemCpp !== "nao_compoe" && FI.consumido(ctx.codigo, m.periodo)).length : 0;
    const trava = travados ? " " + travados + " período(s) já foram consumidos no PGDAS-D do PA " + t.pa + ", transmitido em " + t.em + ": mesmo reabrindo, a correção deles segue pela retificação (FIS-853)." : "";
    if (status === "implantada") {
      return (
        '<div class="alert alert-success">' + Icon("circle-check", "size-4") +
        '<div class="alert-title">Implantação Fiscal concluída em ' + imp.concluidaEm + " por " + imp.concluidaPor + "</div>" +
        '<div class="alert-desc">Os saldos ficam só para consulta. ' +
        (global.ImplantacaoFrentes.envioMotor(ctx.codigo).liberado ? "Com o DP também concluído, a empresa já voltou para o motor." : "A empresa volta para o motor quando a Implantação DP também estiver concluída.") +
        trava + "</div></div>"
      );
    }
    if (status === "pronta") {
      return (
        '<div class="alert alert-info">' + Icon("info", "size-4") +
        '<div class="alert-title">Os ' + r.exigidos + " períodos estão resolvidos</div>" +
        '<div class="alert-desc">Revise os valores e conclua a implantação. A conclusão é sempre humana.</div></div>'
      );
    }
    const linkDp = modo === "aguardando_dp" || modo === "dp" ? ' <button type="button" class="btn-link link-info" id="link-ir-dp" style="display:inline;">Ver Implantação DP</button>' : "";
    return (
      '<div class="alert alert-warning">' + Icon("alert-triangle", "size-4") +
      '<div class="alert-title">' + (r.pendencias.length === 1 ? "Falta 1 período" : "Faltam " + r.pendencias.length + " períodos") + " para o PA " + FI.PA_REFERENCIA + "</div>" +
      '<div class="alert-desc">' + listaPendencias(r) + ". Sem eles, a apuração do DAS para no HITL e o PGDAS-D não é transmitido. " + FI.MODO_FOLHA[modo].descricao + linkDp + "</div></div>"
    );
  }

  function statCards(r) {
    return (
      '<div class="flex flex-wrap gap-3">' +
      '<div class="stat-card' + (r.pendencias.length ? " stat-card-warning" : " stat-card-success") + '"><span class="stat-card-value">' + r.resolvidos + "/" + r.exigidos + '</span><span class="stat-card-label">Períodos resolvidos</span></div>' +
      '<div class="stat-card"><span class="stat-card-value">' + FI.formatarMoeda(r.cppTotal) + '</span><span class="stat-card-label">CPP na janela</span></div>' +
      '<div class="stat-card"><span class="stat-card-value">' + FI.formatarMoeda(r.fs12) + '</span><span class="stat-card-label">FS12 da tela</span></div>' +
      '<div class="stat-card' + (r.fatorR < FI.LIMITE_FATOR_R ? " stat-card-warning" : "") + '"><span class="stat-card-value">' + FI.formatarPercentual(r.fatorR) + '</span><span class="stat-card-label">Prévia do Fator R · ' + r.anexo + ". Informativa: o oficial é o do motor</span></div>" +
      "</div>"
    );
  }

  function detalhesHtml(imp, r, modo) {
    const campos = [
      { label: "Atividade", value: imp.enq.atividade },
      { label: "PA de referência", value: FI.PA_REFERENCIA },
      { label: "Janela", value: "Períodos " + FI.PERIODOS[0] + " a " + FI.PERIODOS[11] + " · DAS dos PAs " + FI.paDoPeriodo(FI.PERIODOS[0]) + " a " + FI.paDoPeriodo(FI.PERIODOS[11]) },
      { label: "Início do motor", value: imp.enq.inicioMotor + (r.motor ? " · " + r.motor + " período(s) calculado(s)" : "") },
      { label: "Origem da folha", value: FI.MODO_FOLHA[modo].rotulo },
      { label: "Início de atividade", value: imp.enq.inicioAtividade + (r.naoCompoe ? " · " + r.naoCompoe + " período(s) fora da janela" : "") },
    ];
    return (
      '<div class="detail-grid">' +
      campos.map((c) => '<div class="detail-field"><span class="detail-field-label">' + c.label + '</span><span class="detail-field-value">' + c.value + "</span></div>").join("") +
      "</div>"
    );
  }

  function render(mountEl, opts) {
    ctx = Object.assign({}, opts, { mountEl });
    if (!ctx.aba || !ABAS.some((a) => a.key === ctx.aba)) ctx.aba = "saldos";
    renderTudo();
  }

  function estadoVazio(icone, titulo, texto, botao) {
    return (
      '<div class="empty-state">' +
      '<span class="empty-state-icon">' + Icon(icone, "size-5") + "</span>" +
      '<p class="empty-state-title">' + titulo + "</p>" +
      '<p class="empty-state-desc">' + texto + "</p>" +
      (botao || "") +
      "</div>"
    );
  }

  function renderTudo() {
    const status = FI.status(ctx.codigo);
    if (EI.statusCockpit(ctx.codigo).tax !== "OPERATING") {
      ctx.mountEl.innerHTML = estadoVazio("receipt", "Empresa não opera Fiscal", 'No Cockpit, a empresa está como "Não opera" no Fiscal: não há saldo de CPP para implantar, e a frente Fiscal não segura a volta para o motor.');
      ctx.onAbaChange(null, null);
      return;
    }
    if (status === "nao_aplica") {
      ctx.mountEl.innerHTML = estadoVazio("receipt", "Nada a implantar no Fiscal", FI.foraDoSimples(ctx.codigo));
      ctx.onAbaChange(null, null);
      return;
    }
    if (status === "nao_iniciada") {
      ctx.mountEl.innerHTML = estadoVazio(
        "receipt",
        "Implantação Fiscal não iniciada",
        "Inicie quando a empresa tiver atividade sujeita ao Fator R (Anexo III/V, conferida no BHules). A Nova implantação consulta a SERPRO e já traz os DAS dos 12 PAs da janela do PA " + FI.PA_REFERENCIA + " e os períodos que o motor calculou.",
        '<button type="button" class="btn w-fit" id="btn-nova-implantacao-fiscal" style="margin-top:8px;">' + Icon("plus", "size-3-5") + " Nova implantação</button>"
      );
      ctx.onAbaChange(null, null);
      ctx.mountEl.querySelector("#btn-nova-implantacao-fiscal").addEventListener("click", () => {
        const r = FI.novaImplantacao(ctx.codigo, contextoFolha(ctx.codigo));
        UI.showToast("SERPRO consultada", r.resolvidos + " de " + r.exigidos + " períodos preenchidos. " + r.pendencias.length + " ficaram pendentes.");
        aposMudanca();
      });
      return;
    }
    const imp = FI.getImplantacao(ctx.codigo);
    const r = FI.resumo(ctx.codigo);
    const modo = imp.meses.find((m) => m.origemFolha !== "nao_compoe").origemFolha;
    // Discovery 23/10/2026: a Nova implantação fica no topo, junto do Concluir. Com a
    // implantação em curso, ela consulta a SERPRO de novo só para o que falhou (RF-205).
    const acao =
      status === "implantada"
        ? '<button type="button" class="btn btn-outline" id="btn-reabrir-fiscal">' + Icon("rotate-ccw", "size-3-5") + " Reabrir implantação</button>"
        : '<div class="flex flex-col items-end gap-1">' +
          '<div class="flex gap-2 flex-wrap justify-end">' +
          '<button type="button" class="btn btn-outline" id="btn-nova-implantacao-fiscal" title="Consulta a SERPRO para os períodos que falharam; PAs já capturados não são consultados de novo">' + Icon("plus", "size-3-5") + " Nova implantação</button>" +
          '<button type="button" class="btn" id="btn-concluir-fiscal"' + (status === "pronta" ? "" : " disabled") + ">" + Icon("check", "size-3-5") + " Concluir implantação</button>" +
          "</div>" +
          (status === "pronta" ? "" : '<span class="text-xs text-muted">Resolva os ' + r.pendencias.length + " períodos pendentes para concluir.</span>") +
          "</div>";

    ctx.mountEl.innerHTML =
      '<div class="flex items-start justify-between gap-3 flex-wrap">' +
      '<div class="flex flex-col gap-1">' +
      '<div class="flex items-center gap-2 flex-wrap"><h2 class="text-lg font-semibold">Saldos de CPP para o Fator R</h2>' + statusBadge(status) + "</div>" +
      '<p class="text-sm text-muted max-w-2xl">CPP do DAS nos 12 períodos de caixa anteriores ao PA. Compõe a folha de salários (FS12) que o PGDAS-D exige mês a mês de quem tem atividade sujeita ao Fator R, com ou sem folha implantada pelo DP.</p>' +
      "</div>" + acao + "</div>" +
      detalhesHtml(imp, r, modo) +
      alertaHtml(imp, r, status, modo) +
      statCards(r) +
      '<div class="tabs-list" role="tablist" aria-label="Abas da Implantação Fiscal">' +
      ABAS.map((a) => '<button type="button" role="tab" class="tabs-trigger' + (a.key === ctx.aba ? " is-active" : "") + '" aria-selected="' + (a.key === ctx.aba) + '" data-fiscal-aba="' + a.key + '">' + a.label + "</button>").join("") +
      "</div>" +
      '<div class="flex flex-col gap-3">' + (ctx.aba === "saldos" ? renderSaldos(imp, r) : renderHistorico(imp)) + "</div>";

    ctx.onAbaChange(ctx.aba, abaLabel(ctx.aba));
    wire();
  }

  function aposMudanca() {
    renderTudo();
    ctx.onChange();
  }

  function proximoCampo(depoisDe, atributo) {
    const campos = Array.from(ctx.mountEl.querySelectorAll("[" + atributo + "]"));
    const idx = campos.findIndex((c) => c.getAttribute(atributo) === depoisDe);
    const seguinte = campos.slice(idx + 1).find((c) => c.value === "");
    return seguinte ? seguinte.getAttribute(atributo) : null;
  }

  function salvarCpp(input) {
    const periodo = input.getAttribute("data-cpp-periodo");
    const m = FI.getImplantacao(ctx.codigo).meses.find((x) => x.periodo === periodo);
    const valor = FI.parseMoeda(input.value);
    if (valor === null) {
      if (input.value.trim() !== "") {
        UI.showToast("Valor inválido", "Informe um valor maior ou igual a zero, com até 2 casas decimais.", "info");
        input.value = moedaSemPrefixo(m.cpp);
        return;
      }
      if (m.origemCpp === "manual" || m.origemCpp === "zero") FI.limparCpp(ctx.codigo, periodo);
      else return;
    } else if (valor === m.cpp && m.origemCpp === "manual") {
      return;
    } else {
      FI.implantarCpp(ctx.codigo, periodo, valor);
    }
    periodoParaFocar = { atributo: "data-cpp-periodo", periodo: proximoCampo(periodo, "data-cpp-periodo") };
    aposMudanca();
  }

  function salvarFolha(input) {
    const periodo = input.getAttribute("data-folha-periodo");
    const valor = FI.parseMoeda(input.value);
    if (valor === null && input.value.trim() !== "") {
      UI.showToast("Valor inválido", "Informe um valor maior ou igual a zero, com até 2 casas decimais.", "info");
      return;
    }
    FI.implantarFolha(ctx.codigo, periodo, valor);
    periodoParaFocar = { atributo: "data-folha-periodo", periodo: proximoCampo(periodo, "data-folha-periodo") };
    aposMudanca();
  }

  function wireCampos(atributo, salvar) {
    ctx.mountEl.querySelectorAll("[" + atributo + "]").forEach((input) => {
      input.addEventListener("change", () => salvar(input));
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          input.blur();
        }
      });
    });
  }

  function wire() {
    const el = ctx.mountEl;
    el.querySelectorAll("[data-fiscal-aba]").forEach((btn) =>
      btn.addEventListener("click", () => {
        ctx.aba = btn.getAttribute("data-fiscal-aba");
        renderTudo();
      })
    );
    wireCampos("data-cpp-periodo", salvarCpp);
    wireCampos("data-folha-periodo", salvarFolha);
    el.querySelectorAll("[data-evidencia-periodo]").forEach((input) =>
      input.addEventListener("change", () => FI.definirEvidencia(ctx.codigo, input.getAttribute("data-evidencia-periodo"), input.value.trim()))
    );
    el.querySelectorAll("[data-cpp-zero]").forEach((btn) =>
      btn.addEventListener("click", () => {
        const periodo = btn.getAttribute("data-cpp-zero");
        FI.confirmarZero(ctx.codigo, periodo);
        UI.showToast("Período sem CPP", periodo + " registrado como sem CPP no DAS.", "info");
        aposMudanca();
      })
    );
    el.querySelectorAll("[data-cpp-limpar]").forEach((btn) =>
      btn.addEventListener("click", () => {
        FI.limparCpp(ctx.codigo, btn.getAttribute("data-cpp-limpar"));
        aposMudanca();
      })
    );
    const linkDp = el.querySelector("#link-ir-dp");
    if (linkDp) linkDp.addEventListener("click", ctx.irParaDp);
    const reconsultar = el.querySelector("#btn-nova-implantacao-fiscal");
    if (reconsultar) {
      reconsultar.addEventListener("click", () => {
        if (!FI.resumo(ctx.codigo).serproFalhas) {
          UI.showToast("Nada para consultar na SERPRO", "Os períodos pendentes não têm declaração na SERPRO. Suba o extrato do DAS ou digite a CPP.", "info");
          return;
        }
        const n = FI.reconsultarSerpro(ctx.codigo);
        UI.showToast("SERPRO consultada", n + " período(s) capturado(s). PAs já capturados não foram consultados de novo.");
        aposMudanca();
      });
    }
    const btnLote = el.querySelector("#btn-abrir-lote-cpp");
    if (btnLote) btnLote.addEventListener("click", global.FiscalLote.abrir);
    const btnExtrato = el.querySelector("#btn-abrir-extrato");
    if (btnExtrato) btnExtrato.addEventListener("click", abrirExtrato);
    const btnConcluir = el.querySelector("#btn-concluir-fiscal");
    if (btnConcluir) btnConcluir.addEventListener("click", abrirConcluir);
    const btnReabrir = el.querySelector("#btn-reabrir-fiscal");
    if (btnReabrir) {
      btnReabrir.addEventListener("click", () => {
        FI.reabrir(ctx.codigo);
        UI.showToast("Implantação reaberta", "Os saldos voltaram a ficar editáveis.", "info");
        aposMudanca();
      });
    }
    if (periodoParaFocar && periodoParaFocar.periodo) {
      const proximo = el.querySelector("[" + periodoParaFocar.atributo + '="' + periodoParaFocar.periodo + '"]');
      if (proximo) proximo.focus();
    }
    periodoParaFocar = null;
  }

  // ===== Drawer "Subir extrato do DAS" (RF-206) =====
  let extratoArquivo = null;

  function nomeExtrato() {
    const slug = EI.infoEmpresa(ctx.codigo).nome.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9]+/g, "");
    return "Extrato_PGDAS-D_" + slug + ".pdf";
  }

  function renderExtratoBody() {
    const body = document.getElementById("extrato-das-body");
    if (!extratoArquivo) {
      body.innerHTML =
        '<p class="text-sm text-muted">O extrato é lido por PA: a CPP (código 1006) de cada DAS preenche o período em que ele vence, com origem "Extrato do DAS". Extrato de outra empresa ou PA fora da janela é recusado.</p>' +
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
    const lidos = FI.leituraExtrato(ctx.codigo);
    const aceitos = lidos.filter((l) => l.aceito).length;
    body.innerHTML =
      '<div class="upload-file-row">' +
      '<span class="upload-file-icon">' + Icon("file-text", "size-4") + "</span>" +
      '<div class="flex flex-col min-w-0 flex-1 gap-0-5"><span class="text-sm font-medium truncate">' + extratoArquivo + '</span><span class="text-xs text-muted">' + lidos.length + " PAs lidos · " + aceitos + " preenchem períodos pendentes</span></div>" +
      '<button type="button" class="btn btn-ghost btn-sm" id="extrato-remover" aria-label="Remover arquivo">' + Icon("x", "size-4") + "</button>" +
      "</div>" +
      '<p class="text-sm text-muted">Confira a CPP lida antes de aplicar. Os valores entram como <b>Extrato do DAS</b> e não sobrescrevem o que veio do motor ou da SERPRO.</p>' +
      '<div class="table-wrap"><table class="dtable dtable-compact">' +
      '<thead><tr><th>PA do DAS</th><th>Período (caixa)</th><th class="text-right">CPP lida</th><th class="col-pad-md">Resultado</th></tr></thead><tbody>' +
      lidos
        .map(
          (l) =>
            '<tr><td class="cell-mono">' + l.pa + '</td><td class="cell-mono">' + (l.periodo || "—") + '</td><td class="text-right tabular-nums">' + FI.formatarMoeda(l.valor) + '</td><td class="col-pad-md">' +
            (l.aceito ? '<span class="badge badge-success">' + Icon("check", "size-3") + " Preenche</span>" : '<span class="badge badge-destructive">' + Icon("circle-x", "size-3") + ' Recusado</span><div class="text-xs text-muted">' + l.motivo + "</div>") +
            "</td></tr>"
        )
        .join("") +
      "</tbody></table></div>";
    document.getElementById("extrato-remover").addEventListener("click", () => {
      extratoArquivo = null;
      renderExtratoBody();
    });
    document.getElementById("btn-extrato-aplicar").disabled = aceitos === 0;
  }

  function abrirExtrato() {
    extratoArquivo = null;
    document.getElementById("extrato-das-sub").textContent = EI.infoEmpresa(ctx.codigo).nome + " · períodos " + FI.PERIODOS[0] + " a " + FI.PERIODOS[11];
    renderExtratoBody();
    UI.openSheet(document.getElementById("extrato-das-overlay"), document.getElementById("extrato-das-panel"));
  }

  function fecharExtrato() {
    UI.closeSheet(document.getElementById("extrato-das-overlay"), document.getElementById("extrato-das-panel"));
  }

  // ===== Modal de conclusão (RF-109) =====
  function abrirConcluir() {
    const r = FI.resumo(ctx.codigo);
    document.getElementById("dialog-concluir-fiscal-desc").textContent =
      "Você confirma que revisou os " + r.exigidos + " períodos. Os saldos ficam só para consulta, e a empresa volta para o motor quando a Implantação DP também estiver concluída.";
    document.getElementById("dialog-concluir-fiscal-resumo").innerHTML = [
      { label: "Períodos resolvidos", value: r.resolvidos + " de " + r.exigidos },
      { label: "CPP na janela", value: FI.formatarMoeda(r.cppTotal) },
      { label: "FS12 da tela", value: FI.formatarMoeda(r.fs12) },
      { label: "Prévia do Fator R", value: FI.formatarPercentual(r.fatorR) + " · " + r.anexo },
    ]
      .map((c) => '<div class="detail-field"><span class="detail-field-label">' + c.label + '</span><span class="detail-field-value">' + c.value + "</span></div>")
      .join("");
    UI.openDialog(document.getElementById("dialog-concluir-fiscal"));
  }

  function setup() {
    global.FiscalLote.setup({ onAplicar: () => ctx && aposMudanca() });
    document.getElementById("extrato-das-close").innerHTML = Icon("x", "size-4");
    document.getElementById("icon-close-concluir-fiscal").innerHTML = Icon("x", "size-4");
    document.getElementById("icon-confirmar-concluir-fiscal").innerHTML = Icon("check", "size-3-5");
    document.getElementById("extrato-das-title").textContent = "Subir extrato do DAS";
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
      UI.showToast("Extrato aplicado", n + " período(s) preenchido(s) pelo extrato do DAS.");
      aposMudanca();
    });
    document.getElementById("btn-confirmar-concluir-fiscal").addEventListener("click", () => {
      FI.concluir(ctx.codigo);
      UI.closeDialog(document.getElementById("dialog-concluir-fiscal"));
      UI.showToast("Implantação Fiscal concluída", "Revisada e concluída. A empresa volta para o motor com o DP também concluído.");
      aposMudanca();
    });
  }

  global.FiscalConsole = { setup, render };
})(window);
