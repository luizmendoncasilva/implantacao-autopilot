/*
  Drawer "Visualizar" da ficha completa de um colaborador "pronto" — dados
  gerais + campos conciliados + pendências cadastrais + dependentes, cada
  bloco com sua própria ação de resolver. Informação + interação é sempre
  drawer, nunca dialog (regra do design system).

  Usado pelo console por empresa (implantacao-console.html) — a página só
  precisa incluir a marcação do drawer (#visualizar-overlay/#visualizar-panel)
  e chamar VisualizarColaborador.setup() uma vez.
*/
(function (global) {
  const D = global.ImplantacaoData;
  const E = global.EmpresasData;

  function escapeHtml(texto) {
    const div = document.createElement("div");
    div.textContent = texto;
    return div.innerHTML;
  }

  function empresaNome(codigo) {
    const empresa = E.findEmpresaByCodigo(codigo);
    return empresa ? empresa.nome : codigo;
  }

  function valorFinalCampo(campo) {
    if (campo.valorEscolhido === "lake") return campo.valorLake;
    if (campo.valorEscolhido === "ficha") return campo.valorFicha;
    if (campo.valorEscolhido === "manual") return campo.valorManual;
    return null;
  }

  function origemLabel(valorEscolhido) {
    if (valorEscolhido === "lake") return "Lake (Domínio)";
    if (valorEscolhido === "ficha") return "Ficha Financeira";
    if (valorEscolhido === "manual") return "digitado manualmente";
    return "";
  }

  function secaoVisualizar(titulo, conteudoHtml) {
    return '<div class="detail-section"><h3 class="detail-section-title">' + titulo + "</h3>" + conteudoHtml + "</div>";
  }

  function pendenciasCadastraisListHtml(colaborador) {
    return colaborador.pendenciasCadastrais
      .map(
        (p, i) =>
          '<div class="list-row"><span class="text-sm">' + escapeHtml(p) + "</span>" +
          '<button type="button" class="btn-link link-info shrink-0" data-resolver-pendencia-cadastral="' + i + '">Marcar como preenchido</button></div>'
      )
      .join("");
  }

  function dependenteRowHtml(dependente, indice) {
    const pendente = dependente.pendencias && dependente.pendencias.length > 0;
    return (
      '<div class="list-row" style="align-items:flex-start;">' +
      '<div class="flex flex-col gap-0-5 min-w-0">' +
      '<span class="text-sm font-medium truncate">' + escapeHtml(dependente.nome) + "</span>" +
      '<span class="text-xs text-muted">' + escapeHtml(dependente.parentesco) + " · CPF " + escapeHtml(dependente.cpf) + " · nasc. " + escapeHtml(dependente.dataNascimento) + "</span>" +
      (pendente
        ? '<span class="text-xs" style="color:var(--warning-text);">' + dependente.pendencias.map(escapeHtml).join(" · ") + "</span>"
        : '<span class="text-xs" style="color:var(--success-text);">Completo</span>') +
      "</div>" +
      (pendente
        ? '<button type="button" class="btn-link link-info shrink-0" data-resolver-dependente="' + indice + '">Marcar como completo</button>'
        : "") +
      "</div>"
    );
  }

  function campoFicha(label, valor, wide) {
    if (!valor) return "";
    return '<div class="detail-field' + (wide ? " detail-field-wide" : "") + '"><span class="detail-field-label">' + label + '</span><div class="detail-field-value">' + escapeHtml(String(valor)) + "</div></div>";
  }

  // ===== Ficha completa (RF-DP-417) — só colaborador "pronto" com
  // fichaCompleta carregada mostra os campos da Ficha de Registro + o
  // resumo financeiro do ano, tudo somente leitura. =====
  function renderFichaCompletaHtml(ficha) {
    const p = ficha.dadosPessoais || {};
    const d = ficha.documentos || {};
    const a = ficha.admissao || {};
    const b = ficha.bancario || {};
    const h = ficha.historico || {};
    const f = ficha.resumoFinanceiroAno || {};

    let html = secaoVisualizar(
      "Dados pessoais",
      '<div class="detail-grid">' +
        campoFicha("Data de nascimento", p.dataNascimento) +
        campoFicha("Sexo", p.sexo) +
        campoFicha("Estado civil", p.estadoCivil) +
        campoFicha("Nacionalidade", p.nacionalidade) +
        campoFicha("Naturalidade", p.naturalidade) +
        campoFicha("Cor/Raça", p.corRaca) +
        campoFicha("Grau de instrução", p.grauInstrucao) +
        campoFicha("Nome do pai", p.nomePai) +
        campoFicha("Nome da mãe", p.nomeMae) +
        campoFicha("Telefone", p.telefone) +
        campoFicha("Endereço", p.endereco, true) +
        "</div>"
    );

    html += secaoVisualizar(
      "Documentos",
      '<div class="detail-grid">' +
        campoFicha("RG", d.rg) +
        campoFicha("CTPS", d.ctps) +
        campoFicha("Data de expedição da CTPS", d.dataExpedicaoCtps) +
        campoFicha("PIS/PASEP", d.pis) +
        campoFicha("Título de eleitor", d.tituloEleitor, true) +
        campoFicha("CNH", d.cnh) +
        "</div>"
    );

    html += secaoVisualizar(
      "Admissão",
      '<div class="detail-grid">' +
        campoFicha("Matrícula", a.matricula) +
        campoFicha("Data de admissão", a.dataAdmissao) +
        campoFicha("Função", a.funcao) +
        campoFicha("CBO", a.cbo) +
        campoFicha("Salário", a.salario) +
        campoFicha("Horário de trabalho", a.horarioTrabalho) +
        campoFicha("Horário de intervalo", a.horarioIntervalo) +
        "</div>"
    );

    html += secaoVisualizar(
      "Dados bancários / FGTS",
      '<div class="detail-grid">' +
        campoFicha("Banco", b.banco) +
        campoFicha("Agência", b.agencia) +
        campoFicha("Conta", b.conta) +
        campoFicha("FGTS — opção em", b.fgtsOpcaoEm) +
        "</div>"
    );

    if ((h.alteracoesSalario && h.alteracoesSalario.length) || (h.ferias && h.ferias.length)) {
      html += secaoVisualizar(
        "Histórico",
        (h.alteracoesSalario && h.alteracoesSalario.length
          ? '<div class="flex flex-col gap-1"><span class="detail-field-label">Alterações de salário</span>' +
            h.alteracoesSalario.map((a2) => '<span class="text-sm">' + escapeHtml(a2) + "</span>").join("") +
            "</div>"
          : "") +
        (h.ferias && h.ferias.length
          ? '<div class="flex flex-col gap-1" style="margin-top:8px;"><span class="detail-field-label">Férias</span>' +
            h.ferias.map((v) => '<span class="text-sm">Aquisitivo ' + escapeHtml(v.periodoAquisitivo) + " · Gozo " + escapeHtml(v.periodoGozo) + "</span>").join("") +
            "</div>"
          : "")
      );
    }

    if (f.competencias && f.competencias.length) {
      html += secaoVisualizar(
        "Resumo financeiro do ano",
        '<div class="table-wrap"><table class="dtable dtable-fixed">' +
          '<colgroup><col style="width:110px" /><col /><col /><col /></colgroup>' +
          "<thead><tr><th>Competência</th><th class=\"col-pad-md\">Proventos</th><th class=\"col-pad-md\">Descontos</th><th class=\"col-pad-md\">Líquido</th></tr></thead>" +
          "<tbody>" +
          f.competencias
            .map((c) => "<tr><td class=\"font-mono\">" + c.competencia + '</td><td class="col-pad-md">' + c.proventos + '</td><td class="col-pad-md">' + c.descontos + '</td><td class="col-pad-md">' + c.liquido + "</td></tr>")
            .join("") +
          "</tbody></table></div>" +
          (f.totalAno ? '<p class="text-xs text-muted" style="margin-top:6px;">Total líquido no ano: <b class="text-foreground">' + f.totalAno + "</b></p>" : "")
      );
    }

    return html;
  }

  function renderVisualizarBody(colaborador) {
    let html = secaoVisualizar(
      "Dados gerais",
      '<div class="detail-grid">' +
        '<div class="detail-field"><span class="detail-field-label">Cargo</span><div class="detail-field-value">' + escapeHtml(colaborador.cargo) + "</div></div>" +
        '<div class="detail-field"><span class="detail-field-label">CPF</span><div class="detail-field-value">' + colaborador.cpf + "</div></div>" +
        '<div class="detail-field"><span class="detail-field-label">Empresa</span><div class="detail-field-value">' + empresaNome(colaborador.empresaCodigo) + "</div></div>" +
        '<div class="detail-field"><span class="detail-field-label">Status</span><div class="detail-field-value">Pronto</div></div>' +
        "</div>"
    );

    if (colaborador.status === "pronto" && colaborador.fichaCompleta) {
      html += renderFichaCompletaHtml(colaborador.fichaCompleta);
    }

    if (colaborador.camposDivergentes && colaborador.camposDivergentes.length) {
      html += secaoVisualizar(
        "Campos conciliados",
        '<div class="detail-grid">' +
          colaborador.camposDivergentes
            .map(
              (c) =>
                '<div class="detail-field"><span class="detail-field-label">' + c.campo + '</span><div class="detail-field-value">' +
                escapeHtml(String(valorFinalCampo(c))) + ' <span class="text-xs text-muted">(' + origemLabel(c.valorEscolhido) + ")</span></div></div>"
            )
            .join("") +
          "</div>"
      );
    }

    if (colaborador.pendenciasCadastrais && colaborador.pendenciasCadastrais.length) {
      html += secaoVisualizar("Pendências cadastrais", '<div class="flex flex-col gap-2">' + pendenciasCadastraisListHtml(colaborador) + "</div>");
    }

    if (colaborador.dependentes && colaborador.dependentes.length) {
      html += secaoVisualizar("Dependentes", '<div class="flex flex-col gap-2">' + colaborador.dependentes.map((d, i) => dependenteRowHtml(d, i)).join("") + "</div>");
    }

    return html;
  }

  function persistirColaborador(colaborador) {
    const colaboradores = D.getColaboradores().map((c) => (c.id === colaborador.id ? colaborador : c));
    D.setColaboradores(colaboradores);
  }

  function renderVisualizar(colaborador, onChange) {
    const corpo = document.getElementById("visualizar-body");
    corpo.innerHTML = renderVisualizarBody(colaborador);
    corpo.querySelectorAll("[data-resolver-pendencia-cadastral]").forEach((btn) => {
      btn.addEventListener("click", () => {
        colaborador.pendenciasCadastrais.splice(Number(btn.getAttribute("data-resolver-pendencia-cadastral")), 1);
        persistirColaborador(colaborador);
        renderVisualizar(colaborador, onChange);
        if (onChange) onChange();
      });
    });
    corpo.querySelectorAll("[data-resolver-dependente]").forEach((btn) => {
      btn.addEventListener("click", () => {
        colaborador.dependentes[Number(btn.getAttribute("data-resolver-dependente"))].pendencias = [];
        persistirColaborador(colaborador);
        renderVisualizar(colaborador, onChange);
        if (onChange) onChange();
      });
    });
  }

  function open(id, onChange) {
    const colaborador = D.getColaboradores().find((c) => c.id === Number(id));
    if (!colaborador) return;
    document.getElementById("visualizar-avatar").textContent = D.iniciais(colaborador.nome);
    document.getElementById("visualizar-title").textContent = colaborador.nome;
    document.getElementById("visualizar-sub").textContent = empresaNome(colaborador.empresaCodigo) + " · CPF " + colaborador.cpf;
    renderVisualizar(colaborador, onChange);
    UI.openSheet(document.getElementById("visualizar-overlay"), document.getElementById("visualizar-panel"));
  }

  function close() {
    UI.closeSheet(document.getElementById("visualizar-overlay"), document.getElementById("visualizar-panel"));
  }

  function setup() {
    document.getElementById("visualizar-close").innerHTML = Icon("x", "size-4");
    const overlay = document.getElementById("visualizar-overlay");
    const panel = document.getElementById("visualizar-panel");
    document.getElementById("visualizar-close").addEventListener("click", close);
    overlay.addEventListener("click", close);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && panel.classList.contains("is-open")) close();
    });
  }

  global.VisualizarColaborador = { open, close, setup };
})(window);
