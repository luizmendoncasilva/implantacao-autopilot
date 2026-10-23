/*
  Situação de cada frente (DP, Fiscal, Contábil) por empresa — usada pelo
  console geral (geral-list.js) e pelas abas do console da empresa
  (console.js), para os dois mostrarem sempre o mesmo estado.

  Status da implantação (RF-102): não iniciada, em andamento, implantada.
  "Não opera DP" (hr_status do Cockpit) conta o DP como concluído; a
  Fiscal é sob demanda (RN-01), então Fiscal não iniciada não segura a
  empresa. A empresa só volta para o motor com DP e Fiscal concluídos
  (RN-12), mesmo com o DP "sem movimento" ou "não opera DP".
*/
(function (global) {
  const EI = global.EmpresasImplantacaoData;
  const FI = global.FiscalImplantacaoData;

  const FRENTES = [
    { key: "dp", label: "DP" },
    { key: "fiscal", label: "Fiscal" },
    { key: "contabil", label: "Contábil", emBreve: true },
  ];

  function empresasNaImplantacao() {
    return EI.codigosDoCockpit();
  }

  // status: "nao_opera" | "nao_iniciada" | "em_andamento" | "implantada"
  function situacaoDp(codigo) {
    if (!EI.dpContratado(codigo)) return { aplica: false, status: "nao_opera", percentual: null };
    const e = EI.empresaImplantacao(codigo);
    if (!e) return { aplica: true, status: "nao_iniciada", percentual: 0 };
    return { aplica: true, status: e.status, percentual: EI.percentualConclusao(EI.resumoCompleto(e)), semMovimento: !!EI.semMovimento(codigo) };
  }

  // status: "nao_opera" | "nao_aplica" | "nao_iniciada" | "em_andamento" | "pronta" | "implantada"
  function situacaoFiscal(codigo) {
    const status = EI.statusCockpit(codigo).tax !== "OPERATING" ? "nao_opera" : FI.status(codigo);
    return { aplica: status !== "nao_aplica" && status !== "nao_opera", status, percentual: FI.percentual(codigo), resumo: FI.resumo(codigo) };
  }

  function dpConcluido(s) {
    return s.status === "nao_opera" || s.status === "implantada";
  }
  function fiscalConcluida(s) {
    return s.status === "implantada" || s.status === "nao_aplica" || s.status === "nao_opera";
  }

  function statusGeral(codigo) {
    const dp = situacaoDp(codigo);
    const fiscal = situacaoFiscal(codigo);
    const iniciada = ["em_andamento", "implantada"].indexOf(dp.status) !== -1 || ["em_andamento", "pronta", "implantada"].indexOf(fiscal.status) !== -1;
    if (!iniciada) return "nao_iniciada";
    const fiscalOk = fiscalConcluida(fiscal) || fiscal.status === "nao_iniciada";
    return dpConcluido(dp) && fiscalOk ? "implantada" : "em_andamento";
  }

  // RN-12: só volta para o motor com DP e Fiscal concluídos.
  function envioMotor(codigo) {
    const dp = situacaoDp(codigo);
    const fiscal = situacaoFiscal(codigo);
    const faltam = [];
    if (!dpConcluido(dp)) faltam.push("DP");
    if (fiscal.aplica && fiscal.status !== "implantada") faltam.push("Fiscal");
    return { liberado: faltam.length === 0, faltam };
  }

  function temPendencia(codigo, frente) {
    if (frente === "dp") return !dpConcluido(situacaoDp(codigo));
    if (frente === "fiscal") {
      const s = situacaoFiscal(codigo);
      return s.status === "em_andamento" || s.status === "pronta";
    }
    return statusGeral(codigo) !== "implantada";
  }

  // Frente aberta por padrão: a primeira com implantação em curso, senão DP (ou Fiscal, se a empresa não opera DP).
  function frentePadrao(codigo) {
    const dp = situacaoDp(codigo);
    const fiscal = situacaoFiscal(codigo);
    if (dp.status === "em_andamento") return "dp";
    if (fiscal.status === "em_andamento" || fiscal.status === "pronta") return "fiscal";
    return dp.status === "nao_opera" ? "fiscal" : "dp";
  }

  const ROTULO_STATUS_GERAL = { nao_iniciada: "Não iniciada", em_andamento: "Em andamento", implantada: "Implantada" };

  function badgeStatusGeral(status) {
    if (status === "implantada") return '<span class="badge badge-success">' + Icon("check", "size-3") + " Implantada</span>";
    if (status === "nao_iniciada") return '<span class="badge badge-outline">Não iniciada</span>';
    return '<span class="badge badge-warning">' + Icon("clock", "size-3") + " Em andamento</span>";
  }

  // Rótulo curto de status para a aba da frente e para a célula do console geral.
  function rotuloFrente(frente, codigo) {
    if (frente === "dp") {
      const s = situacaoDp(codigo);
      if (s.status === "nao_opera") return "Não opera DP";
      if (s.status === "nao_iniciada") return "Não iniciada";
      return s.status === "implantada" ? "Implantada" : s.percentual + "%";
    }
    if (frente === "fiscal") {
      const s = situacaoFiscal(codigo);
      return { nao_opera: "Não opera Fiscal", nao_aplica: "Não se aplica", nao_iniciada: "Não iniciada", em_andamento: s.percentual + "%", pronta: "Pronta", implantada: "Implantada" }[s.status];
    }
    return "Em breve";
  }

  // Tom do indicador da aba: "success" | "warning" | "neutral".
  function tomFrente(frente, codigo) {
    if (frente === "dp") {
      const s = situacaoDp(codigo);
      return s.status === "implantada" || s.status === "nao_opera" ? "success" : s.status === "em_andamento" ? "warning" : "neutral";
    }
    if (frente === "fiscal") {
      const s = situacaoFiscal(codigo);
      return s.status === "implantada" ? "success" : s.status === "em_andamento" || s.status === "pronta" ? "warning" : "neutral";
    }
    return "neutral";
  }

  // Status que vêm do Cockpit, como badge de status (cor, ícone e rótulo).
  // campo: "cliente" | "hr" (hr_status, DP) | "folha" (tipo da folha) | "tax" (tax_status, Fiscal).
  const CAMPO_COCKPIT = { cliente: "Situação no Cockpit", hr: "hr_status", folha: "Tipo da folha", tax: "tax_status" };
  function badgeCockpit(campo, valor) {
    const titulo = ' title="' + CAMPO_COCKPIT[campo] + ' no Cockpit"';
    if (campo === "cliente") {
      if (valor === "Ativo") return '<span class="badge badge-success"' + titulo + ">" + Icon("check", "size-3") + " Ativo</span>";
      return '<span class="badge badge-info"' + titulo + ">" + Icon("clock", "size-3") + " " + valor + "</span>";
    }
    if (valor === "OPERATING") return '<span class="badge badge-success"' + titulo + ">" + Icon("check", "size-3") + " Opera</span>";
    if (valor === "NOT_OPERATING") return '<span class="badge badge-secondary"' + titulo + ">" + Icon("circle-x", "size-3") + " Não opera</span>";
    if (valor === "SEM_MOVIMENTO") return '<span class="badge badge-secondary"' + titulo + ">" + Icon("info", "size-3") + " Sem movimento</span>";
    return '<span class="badge badge-outline"' + titulo + ">Com movimento</span>";
  }

  function segmento(classe, tooltip) {
    return '<div class="segbar-segment' + (classe ? " " + classe : "") + '" data-tooltip="' + tooltip.replace(/"/g, "&quot;") + '"></div>';
  }

  // Os 3 marcos que bloqueiam a implantação DP (Andressa, 10/09/2026):
  // colaboradores, histórico de folha e cálculo em paralelo.
  function marcosDpHtml(codigo) {
    const r = EI.resumoCompleto(EI.empresaImplantacao(codigo));
    const sem = !!EI.semMovimento(codigo);
    const tom = (feito, total) => (total === 0 || feito === total ? "is-success" : feito === 0 ? "" : "is-warning");
    const calc = r.calculoParalelo.comDivergencia > 0 ? "is-warning" : tom(r.calculoParalelo.validadas, r.calculoParalelo.total);
    return (
      '<div class="segbar">' +
      segmento(tom(r.colaboradores.prontos, r.colaboradores.total), "Colaboradores: " + r.colaboradores.prontos + "/" + r.colaboradores.total + " prontos") +
      segmento(tom(r.financeiro.carregadas, r.financeiro.necessarias), sem ? "Histórico de folha: sem movimento" : "Histórico de folha: " + r.financeiro.carregadas + "/" + r.financeiro.necessarias + " competências") +
      segmento(calc, sem ? "Cálculo em paralelo: sem movimento" : "Cálculo em paralelo: " + r.calculoParalelo.validadas + "/" + r.calculoParalelo.total + " validadas" + (r.calculoParalelo.comDivergencia ? " · " + r.calculoParalelo.comDivergencia + " com divergência" : "")) +
      "</div>"
    );
  }

  global.ImplantacaoFrentes = {
    FRENTES,
    ROTULO_STATUS_GERAL,
    badgeCockpit,
    marcosDpHtml,
    empresasNaImplantacao,
    situacaoDp,
    situacaoFiscal,
    statusGeral,
    envioMotor,
    temPendencia,
    frentePadrao,
    badgeStatusGeral,
    rotuloFrente,
    tomFrente,
  };
})(window);
