/*
  Situação de cada frente (DP, Fiscal, Contábil) por empresa — usada pelo
  console geral (geral-list.js) e pelas abas do console da empresa
  (console.js), para os dois mostrarem sempre o mesmo estado.
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
    const codigos = EI.EMPRESAS_IMPLANTACAO.map((e) => e.empresaCodigo);
    FI.codigosNoEscopo().forEach((c) => {
      if (codigos.indexOf(c) === -1) codigos.push(c);
    });
    return codigos;
  }

  // { aplica, status: "nao_contratado" | "em_andamento" | "implantada", percentual }
  function situacaoDp(codigo) {
    const e = EI.empresaImplantacao(codigo);
    if (!e) return { aplica: false, status: "nao_contratado", percentual: null };
    return { aplica: true, status: e.status, percentual: EI.percentualConclusao(EI.resumoCompleto(e)) };
  }

  // { aplica, status: "nao_aplica" | "pendente" | "em_andamento" | "pronta" | "implantada", percentual, resumo }
  function situacaoFiscal(codigo) {
    const status = FI.status(codigo);
    return { aplica: status !== "nao_aplica", status, percentual: FI.percentual(codigo), resumo: FI.resumo(codigo) };
  }

  function dpConcluida(s) {
    return !s.aplica || s.status === "implantada";
  }
  function fiscalConcluida(s) {
    return !s.aplica || s.status === "implantada";
  }

  function statusGeral(codigo) {
    return dpConcluida(situacaoDp(codigo)) && fiscalConcluida(situacaoFiscal(codigo)) ? "implantada" : "em_andamento";
  }

  function temPendencia(codigo, frente) {
    if (frente === "dp") return !dpConcluida(situacaoDp(codigo));
    if (frente === "fiscal") return !fiscalConcluida(situacaoFiscal(codigo));
    return statusGeral(codigo) !== "implantada";
  }

  // Frente aberta por padrão: a primeira com pendência, senão DP (ou Fiscal, se não houver DP).
  function frentePadrao(codigo) {
    if (temPendencia(codigo, "dp")) return "dp";
    if (temPendencia(codigo, "fiscal")) return "fiscal";
    return situacaoDp(codigo).aplica ? "dp" : "fiscal";
  }

  function badgeStatusGeral(status) {
    return status === "implantada"
      ? '<span class="badge badge-success">' + Icon("check", "size-3") + " Implantada</span>"
      : '<span class="badge badge-warning">' + Icon("clock", "size-3") + " Em andamento</span>";
  }

  // Rótulo curto de status para a aba da frente e para a célula do console geral.
  function rotuloFrente(frente, codigo) {
    if (frente === "dp") {
      const s = situacaoDp(codigo);
      if (!s.aplica) return "Não contratado";
      return s.status === "implantada" ? "Implantada" : s.percentual + "%";
    }
    if (frente === "fiscal") {
      const s = situacaoFiscal(codigo);
      return { nao_aplica: "Não se aplica", pendente: "Pendente", em_andamento: s.percentual + "%", pronta: "Pronta", implantada: "Implantada" }[s.status];
    }
    return "Em breve";
  }

  // Tom do indicador da aba: "success" | "warning" | "neutral".
  function tomFrente(frente, codigo) {
    if (frente === "dp") {
      const s = situacaoDp(codigo);
      return !s.aplica ? "neutral" : s.status === "implantada" ? "success" : "warning";
    }
    if (frente === "fiscal") {
      const s = situacaoFiscal(codigo);
      return !s.aplica ? "neutral" : s.status === "implantada" ? "success" : "warning";
    }
    return "neutral";
  }

  function segmento(classe, tooltip) {
    return '<div class="segbar-segment' + (classe ? " " + classe : "") + '" data-tooltip="' + tooltip.replace(/"/g, "&quot;") + '"></div>';
  }

  // Os 3 marcos que bloqueiam a implantação DP (Andressa, 10/09/2026):
  // colaboradores, histórico de folha e cálculo em paralelo.
  function marcosDpHtml(codigo) {
    const r = EI.resumoCompleto(EI.empresaImplantacao(codigo));
    const tom = (feito, total) => (total === 0 || feito === total ? "is-success" : feito === 0 ? "" : "is-warning");
    const calc = r.calculoParalelo.comDivergencia > 0 ? "is-warning" : tom(r.calculoParalelo.validadas, r.calculoParalelo.total);
    return (
      '<div class="segbar">' +
      segmento(tom(r.colaboradores.prontos, r.colaboradores.total), "Colaboradores: " + r.colaboradores.prontos + "/" + r.colaboradores.total + " prontos") +
      segmento(tom(r.financeiro.carregadas, r.financeiro.necessarias), "Histórico de folha: " + r.financeiro.carregadas + "/" + r.financeiro.necessarias + " competências") +
      segmento(calc, "Cálculo em paralelo: " + r.calculoParalelo.validadas + "/" + r.calculoParalelo.total + " validadas" + (r.calculoParalelo.comDivergencia ? " · " + r.calculoParalelo.comDivergencia + " com divergência" : "")) +
      "</div>"
    );
  }

  global.ImplantacaoFrentes = {
    marcosDpHtml,
    FRENTES,
    empresasNaImplantacao,
    situacaoDp,
    situacaoFiscal,
    statusGeral,
    temPendencia,
    frentePadrao,
    badgeStatusGeral,
    rotuloFrente,
    tomFrente,
  };
})(window);
