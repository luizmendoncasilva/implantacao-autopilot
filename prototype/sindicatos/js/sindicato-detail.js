/*
  Tela do Sindicato — cadastro nativo e editável (Novo/Editar/Gravar, conforme
  a própria especificação — Parte I), diferente do padrão "somente leitura"
  de Empresas. Sem abas: os ~17 campos da Parte I cabem em uma única página
  organizada em seções, seguida da lista de Convenções vinculadas.
*/
(function () {
  const D = window.SindicatosData;

  const CAMPOS_OBRIGATORIOS = ["nome", "cep", "endereco", "numero", "bairro", "cidade", "uf", "cnpj", "tipoEntidade", "cnes"];

  const codigoExistente = D.getQueryParam("sindicato");
  const sindicatoExistente = codigoExistente ? D.findSindicatoByCodigo(codigoExistente) : null;

  if (codigoExistente && !sindicatoExistente) {
    window.location.replace("index.html");
    return;
  }

  const isNovo = !sindicatoExistente;
  let mode = isNovo ? "create" : "view";
  let form = isNovo
    ? { codigo: "", nome: "", cep: "", endereco: "", numero: "", complemento: "", bairro: "", cidade: "", uf: "", cnpj: "", telefone: "", fax: "", site: "", email: "", tipoEntidade: "", cnes: "" }
    : Object.assign({}, sindicatoExistente);

  function ensureToast() {
    if (document.getElementById("toast")) return;
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.id = "toast";
    toast.innerHTML = '<span class="toast-icon"></span><div class="flex flex-col gap-0-5"><span class="toast-title"></span><span class="toast-desc"></span></div>';
    document.body.appendChild(toast);
  }

  function campoView(label, value, wide) {
    return (
      '<div class="detail-field' + (wide ? " detail-field-wide" : "") + '">' +
      '<span class="detail-field-label">' + label + "</span>" +
      '<div class="detail-field-value">' + (value || '<span class="italic text-muted">—</span>') + "</div>" +
      "</div>"
    );
  }
  function campoEdit(label, inputHtml, wide, obrigatorio) {
    return (
      '<div class="detail-field' + (wide ? " detail-field-wide" : "") + '">' +
      '<span class="detail-field-label">' + label + (obrigatorio ? ' <span class="text-muted">*</span>' : "") + "</span>" +
      inputHtml +
      "</div>"
    );
  }
  function inputEdit(campo, placeholder) {
    return '<input class="field-input" data-campo="' + campo + '" value="' + (form[campo] || "").replace(/"/g, "&quot;") + '" placeholder="' + (placeholder || "") + '" />';
  }
  function selectEdit(campo, opcoes) {
    return (
      '<div class="field-select-wrap"><select class="field-select" data-campo="' + campo + '">' +
      '<option value="">Selecione...</option>' +
      opcoes.map((o) => '<option value="' + o + '"' + (form[campo] === o ? " selected" : "") + ">" + o + "</option>").join("") +
      '</select><span class="chev">' + Icon("chevron-down", "size-4") + "</span></div>"
    );
  }
  function secao(titulo, camposHtml) {
    return '<div class="detail-section"><h3 class="detail-section-title">' + titulo + '</h3><div class="detail-grid">' + camposHtml + "</div></div>";
  }
  // Seção com linhas explícitas em vez do grid auto-fit — usada só em
  // Endereço, onde o número de campos (7, um deles "largo") produzia linhas
  // desbalanceadas no detail-grid padrão (ex.: Estado (UF) sozinho numa
  // linha, com grande espaço vazio ao lado). Cada linha agrupa campos que
  // pertencem ao mesmo contexto (CEP+Endereço, Número+Complemento,
  // Bairro+Cidade+UF), com o campo que precisa de mais espaço em flex:1 e os
  // campos curtos com largura fixa — mesma lógica de composição já usada no
  // Drawer de Novo Sindicato (.sheet-row), aplicada aqui à leitura/edição em
  // página cheia.
  function secaoLinhas(titulo, linhas) {
    const linhasHtml = linhas
      .map(
        (itens) =>
          '<div class="flex flex-wrap" style="gap:18px 32px;">' +
          itens.map(([html, flex]) => '<div style="flex:' + flex + '">' + html + "</div>").join("") +
          "</div>"
      )
      .join("");
    return '<div class="detail-section"><h3 class="detail-section-title">' + titulo + '</h3><div class="flex flex-col" style="gap:18px;">' + linhasHtml + "</div></div>";
  }

  function renderSecoesView() {
    return (
      secao("Identificação", campoView("Código", form.codigo) + campoView("Nome (Razão Social)", form.nome, true)) +
      secaoLinhas("Endereço", [
        [[campoView("CEP", form.cep), "0 1 160px"], [campoView("Endereço", form.endereco), "1 1 220px"]],
        [[campoView("Número", form.numero), "0 1 140px"], [campoView("Complemento", form.complemento), "1 1 180px"]],
        [[campoView("Bairro", form.bairro), "0 1 260px"], [campoView("Cidade", form.cidade), "0 1 220px"], [campoView("Estado (UF)", form.uf), "0 1 100px"]],
      ]) +
      secao(
        "Contato",
        campoView("Telefone", form.telefone) + campoView("Fax", form.fax) + campoView("Página na internet", form.site) + campoView("E-mail", form.email)
      ) +
      secao(
        "Documentação e Enquadramento",
        campoView("CNPJ", form.cnpj) + campoView("Tipo da entidade", form.tipoEntidade) + campoView("Código da entidade (CNES)", form.cnes)
      )
    );
  }

  function renderSecoesEdit() {
    return (
      secao(
        "Identificação",
        campoView("Código", form.codigo || '<span class="italic text-muted">gerado automaticamente ao gravar</span>') +
          campoEdit("Nome (Razão Social)", inputEdit("nome", "Nome completo do sindicato"), true, true)
      ) +
      secaoLinhas("Endereço", [
        [[campoEdit("CEP", inputEdit("cep", "00.000-000"), false, true), "0 1 160px"], [campoEdit("Endereço", inputEdit("endereco", "Rua/avenida"), false, true), "1 1 220px"]],
        [[campoEdit("Número", inputEdit("numero"), false, true), "0 1 140px"], [campoEdit("Complemento", inputEdit("complemento"), false, false), "1 1 180px"]],
        [
          [campoEdit("Bairro", inputEdit("bairro"), false, true), "0 1 260px"],
          [campoEdit("Cidade", inputEdit("cidade"), false, true), "0 1 220px"],
          [campoEdit("Estado (UF)", selectEdit("uf", D.UF_OPCOES), false, true), "0 1 100px"],
        ],
      ]) +
      secao(
        "Contato",
        campoEdit("Telefone", inputEdit("telefone"), false, false) +
          campoEdit("Fax", inputEdit("fax"), false, false) +
          campoEdit("Página na internet", inputEdit("site"), false, false) +
          campoEdit("E-mail", inputEdit("email"), false, false)
      ) +
      secao(
        "Documentação e Enquadramento",
        campoEdit("CNPJ", inputEdit("cnpj", "00.000.000/0000-00"), false, true) +
          campoEdit("Tipo da entidade", selectEdit("tipoEntidade", D.TIPO_ENTIDADE_OPCOES), false, true) +
          campoEdit("Código da entidade (CNES)", inputEdit("cnes"), false, true)
      )
    );
  }

  function convencoesSectionHtml() {
    if (isNovo) return "";
    const convencoes = D.convencoesDoSindicato(form.codigo);
    let bodyHtml;
    if (convencoes.length === 0) {
      // Estado vazio sem CTA duplicado: "Nova convenção" já vive no
      // cabeçalho da seção (fixo, junto do título), então aqui só o texto
      // de apoio — mesmo padrão de row-empty-state usado nas tabelas
      // relacionadas (ex.: Quadro Societário de Empresas), sem criar um
      // card novo dentro do card.
      bodyHtml =
        '<div class="row-empty-state"><div class="flex flex-col gap-1" style="align-items:center;">' +
        "<span>Você ainda não possui convenções cadastradas.</span>" +
        "<span>Cadastre uma convenção para começar a parametrizar as regras deste sindicato.</span>" +
        "</div></div>";
    } else {
      const rows = convencoes
        .map(
          (c) =>
            '<tr class="row-clickable" data-abrir-convencao="' + c.codigo + '">' +
            "<td>" + UI.truncatedCell(c.descricao, null, "text-sm font-medium") + "</td>" +
            '<td class="col-pad-md">' + (c.dataBasePrazos.dataBase || "—") + "</td>" +
            '<td class="col-pad-md">' + c.empresasVinculadas.length + (c.empresasVinculadas.length === 1 ? " empresa" : " empresas") + "</td>" +
            '<td class="col-pad-end">' + Icon("arrow-right", "size-4") + "</td>" +
            "</tr>"
        )
        .join("");
      bodyHtml =
        '<div class="table-wrap"><table class="dtable">' +
        "<thead><tr><th>Descrição</th><th class=\"col-pad-md\">Data-base</th><th class=\"col-pad-md\">Empresas vinculadas</th><th class=\"col-pad-end\"></th></tr></thead>" +
        "<tbody>" + rows + "</tbody></table></div>";
    }
    // "Nova convenção" fica fixa no cabeçalho da seção (mesma posição nos
    // estados vazio e preenchido) — não deve mudar de lugar nem ficar
    // centralizada dentro do conteúdo quando não há convenções ainda.
    return (
      '<div class="card gap-4">' +
      '<div class="card-header"><div class="flex items-center justify-between gap-3 flex-wrap">' +
      '<div><div class="card-title">Convenções deste sindicato</div><div class="card-description">Parametrizações de convenção coletiva vinculadas a este sindicato.</div></div>' +
      '<button type="button" class="btn btn-outline btn-sm w-fit" id="btn-nova-convencao">' + Icon("plus", "size-3-5") + " Nova convenção</button>" +
      "</div></div>" +
      '<div class="card-content">' + bodyHtml + "</div>" +
      "</div>"
    );
  }

  function camposObrigatoriosPreenchidos() {
    return CAMPOS_OBRIGATORIOS.every((c) => (form[c] || "").trim() !== "");
  }

  function render() {
    const titulo = isNovo ? "Novo sindicato" : form.nome;
    const podeGravar = camposObrigatoriosPreenchidos();

    const acoesHtml =
      mode === "view"
        ? '<button type="button" class="btn btn-outline btn-sm" id="btn-editar">Editar</button>'
        : '<div class="flex gap-2"><button type="button" class="btn btn-outline btn-sm" id="btn-cancelar">Cancelar</button><button type="button" class="btn btn-sm" id="btn-gravar" ' + (podeGravar ? "" : "disabled") + ">Gravar</button></div>";

    document.getElementById("sindicato-root").innerHTML =
      '<div class="flex flex-col gap-2">' +
      '<a href="index.html" class="flex items-center gap-1 text-sm font-medium link-info w-fit">' + Icon("chevron-left", "size-3-5") + " voltar para a lista</a>" +
      '<div class="flex items-center justify-between gap-3 flex-wrap" style="min-height:32px;">' +
      '<div class="flex items-center gap-2 flex-wrap"><h2 class="text-lg font-semibold">' + titulo + "</h2>" +
      (!isNovo && form.tipoEntidade ? '<span class="badge badge-secondary">' + form.tipoEntidade + "</span>" : "") +
      "</div>" + acoesHtml + "</div></div>" +
      '<div class="card"><div class="card-content flex flex-col gap-6">' +
      (mode === "view" ? renderSecoesView() : renderSecoesEdit()) +
      "</div></div>" +
      convencoesSectionHtml();

    wireEvents();
  }

  function wireEvents() {
    // "Editar" abre o Drawer compartilhado (js/sindicato-form.js) com os
    // dados atuais — a tela de detalhe permanece aberta ao fundo, sem virar
    // formulário nem navegar para outra página (mesmo princípio já usado em
    // Empresas para dados editáveis a partir do próprio contexto).
    const btnEditar = document.getElementById("btn-editar");
    if (btnEditar) {
      btnEditar.addEventListener("click", () => {
        SindicatoFormSheet.abrirEditar(sindicatoExistente, (atualizado) => {
          Object.assign(sindicatoExistente, atualizado);
          form = Object.assign({}, sindicatoExistente);
          render();
        });
      });
    }

    const btnCancelar = document.getElementById("btn-cancelar");
    if (btnCancelar) {
      btnCancelar.addEventListener("click", () => {
        if (isNovo) { window.location.href = "index.html"; return; }
        form = Object.assign({}, sindicatoExistente);
        mode = "view";
        render();
      });
    }

    document.querySelectorAll("[data-campo]").forEach((el) => {
      el.addEventListener("input", () => {
        form[el.getAttribute("data-campo")] = el.value;
        const btnGravar = document.getElementById("btn-gravar");
        if (btnGravar) btnGravar.disabled = !camposObrigatoriosPreenchidos();
      });
    });

    const btnGravar = document.getElementById("btn-gravar");
    if (btnGravar) btnGravar.addEventListener("click", salvar);

    const btnNovaConv = document.getElementById("btn-nova-convencao");
    if (btnNovaConv) btnNovaConv.addEventListener("click", () => (window.location.href = "convencao.html?sindicato=" + encodeURIComponent(form.codigo)));

    document.querySelectorAll("[data-abrir-convencao]").forEach((el) => {
      el.addEventListener("click", () => (window.location.href = "convencao.html?convencao=" + encodeURIComponent(el.getAttribute("data-abrir-convencao")) + "&sindicato=" + encodeURIComponent(form.codigo)));
    });
  }

  function salvar() {
    const lista = D.getSindicatos();
    if (isNovo) {
      form.codigo = D.proximoCodigo(lista, "SIND");
      D.setSindicatos(lista.concat([form]));
      window.location.href = "sindicato.html?sindicato=" + encodeURIComponent(form.codigo) + "&criado=1";
      return;
    }
    const atualizados = lista.map((s) => (s.codigo === form.codigo ? Object.assign({}, form) : s));
    D.setSindicatos(atualizados);
    Object.assign(sindicatoExistente, form);
    mode = "view";
    render();
    UI.showToast("Sindicato salvo", form.nome + " foi atualizado com sucesso.");
  }

  Shell.mount(document.getElementById("shell-root"), {
    base: "../",
    active: "sindicato",
    crumbs: isNovo
      ? [{ label: "sindicatos", href: "index.html" }, { label: "novo sindicato" }]
      : [{ label: "sindicatos", href: "index.html" }, { label: form.nome }],
  });

  ensureToast();
  render();

  if (D.getQueryParam("criado")) {
    UI.showToast("Sindicato criado", form.nome + " foi cadastrado com sucesso.");
  }
})();
