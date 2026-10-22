/*
  Seção "Responsável legal" da aba "Sócios/Resp. legal" (socios.html) — dado
  cadastrado e gerenciado no Autopilot, não vem do Cockpit. A pessoa é
  selecionada no registro de Cadastros Auxiliares → Sócios/Resp. legal (só
  quem tem o tipo "Resp. legal"), com o mesmo sheet + combobox de "Contador
  responsável"; Nome e CPF vêm desse registro e o Cargo/Qualificação é
  informado aqui, por ser próprio desta empresa. Tem sua própria ação no
  título da seção, em vez do "Editar" do cabeçalho do cadastro.
*/
(function () {
  const D = window.EmpresasData;
  const S = window.SociosData;
  const ORIGENS = window.CampoOrigem.ORIGENS;
  let empresaAtual = null;
  let mountAtual = null;
  let drawerWired = false;
  let pessoaSelecionadaId = "";

  function opcoesResponsavelLegal() {
    return S.getSocios()
      .filter((p) => S.temTipo(p, S.TIPOS.RESPONSAVEL_LEGAL))
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" }))
      .map((p) => ({ value: String(p.id), label: p.nome + " — " + p.cpf }));
  }

  function atualizarBotaoSalvar() {
    document.getElementById("rl-salvar").disabled = !pessoaSelecionadaId;
  }

  function abrirEdicao(focusId) {
    const atual = D.getResponsavelLegal(empresaAtual.codigo);
    pessoaSelecionadaId = atual ? String(atual.pessoa.id) : "";
    document.getElementById("edit-rl-cargo").value = atual ? atual.cargo : "";
    UI.initCombobox(document.getElementById("rl-combobox"), opcoesResponsavelLegal(), pessoaSelecionadaId, (value) => {
      pessoaSelecionadaId = value;
      atualizarBotaoSalvar();
    });
    atualizarBotaoSalvar();
    UI.openSheet(document.getElementById("rl-overlay"), document.getElementById("rl-panel"));
    if (focusId === "edit-rl-cargo") document.getElementById("edit-rl-cargo").focus();
  }

  function fecharDrawerEdicao() {
    UI.closeSheet(document.getElementById("rl-overlay"), document.getElementById("rl-panel"));
  }

  function salvarEdicao() {
    if (!pessoaSelecionadaId) return;
    D.setResponsavelLegalEmpresa(empresaAtual.codigo, {
      pessoaId: pessoaSelecionadaId,
      cargo: document.getElementById("edit-rl-cargo").value.trim(),
    });
    fecharDrawerEdicao();
    render(empresaAtual, mountAtual);
    UI.showToast("Responsável legal atualizado", "O responsável legal de " + empresaAtual.nome + " foi atualizado.");
  }

  function wireDrawerEdicao() {
    if (drawerWired) return;
    drawerWired = true;
    document.getElementById("rl-close").innerHTML = Icon("x", "size-4");
    document.querySelector("#rl-combobox .chev").innerHTML = Icon("chevron-down", "size-4");
    document.querySelector("#rl-combobox .search-icon").innerHTML = Icon("search", "size-4");
    document.getElementById("rl-overlay").addEventListener("click", fecharDrawerEdicao);
    document.getElementById("rl-close").addEventListener("click", fecharDrawerEdicao);
    document.getElementById("rl-cancelar").addEventListener("click", fecharDrawerEdicao);
    document.getElementById("rl-salvar").addEventListener("click", salvarEdicao);
  }

  function campo(label, value, campoKey, wide) {
    return window.CampoOrigem.campo({
      label: label,
      value: value || '<span class="italic text-muted">Não informado</span>',
      wide: wide,
      origem: ORIGENS.MANUAL,
      origemEditavel: true,
      origemCampoKey: campoKey,
    });
  }

  function render(empresa, mountEl) {
    empresaAtual = empresa;
    mountAtual = mountEl;
    wireDrawerEdicao();
    const rl = D.getResponsavelLegal(empresa.codigo);

    const conteudo = rl
      ? campo("Nome", rl.pessoa.nome, "rl-combobox", true) + campo("CPF", rl.pessoa.cpf, "rl-combobox") + campo("Cargo / Qualificação", rl.cargo, "edit-rl-cargo")
      : '<div class="detail-field-wide"><span class="text-sm italic text-muted">Nenhum responsável legal definido.</span></div>';

    mountEl.innerHTML =
      '<h3 class="detail-section-title"><span>Responsável legal</span>' +
      '<button type="button" class="btn btn-outline btn-sm detail-section-action" id="btn-editar-responsavel-legal">' +
      (rl ? Icon("pencil", "size-3-5") + " Editar" : Icon("plus", "size-3-5") + " Selecionar responsável legal") +
      "</button>" +
      "</h3>" +
      '<div class="detail-grid">' + conteudo + "</div>";

    document.getElementById("btn-editar-responsavel-legal").addEventListener("click", () => abrirEdicao());
    mountEl.querySelectorAll("[data-origem-editar-campo]").forEach((btn) =>
      btn.addEventListener("click", () => abrirEdicao(btn.getAttribute("data-origem-editar-campo")))
    );
  }

  window.ResponsavelLegalSecao = { render: render };
})();
