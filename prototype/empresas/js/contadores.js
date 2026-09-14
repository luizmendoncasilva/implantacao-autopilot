/*
  Aba "Contadores" — vínculo com o Registro de Contadores (Cadastros
  Auxiliares), mesmo conceito já usado no Quadro Societário: a empresa só
  vincula/desvincula um contador já cadastrado, nunca cadastra ou edita o
  contador em si (ver empresas/js/socios.js).
*/
(function () {
  const D = window.ContadoresData;
  let empresaAtual = null;
  let contadorParaDesvincularId = null;

  function contadoresDaEmpresa() {
    return D.getContadores().filter((c) => c.empresasAtendidas.includes(empresaAtual.codigo));
  }

  function renderTabela() {
    const contadores = contadoresDaEmpresa();
    const rows =
      contadores.length === 0
        ? '<tr><td colspan="4" class="row-empty-state">Nenhum contador vinculado a esta empresa ainda.</td></tr>'
        : contadores
            .map(
              (c) =>
                "<tr>" +
                "<td>" + UI.truncatedCell(c.nome, 220) + "</td>" +
                "<td>" + c.cpf + "</td>" +
                "<td>" + c.crc + "</td>" +
                '<td><button type="button" class="btn-link" data-desvincular="' + c.id + '" style="color:var(--destructive);">desvincular</button></td>' +
                "</tr>"
            )
            .join("");

    document.getElementById("tab-content").innerHTML =
      '<div class="card gap-4">' +
      '<div class="card-header"><div class="flex items-center justify-between">' +
      '<div><div class="card-title">Contadores</div><div class="card-description">Contadores habilitados a assinar demonstrativos desta empresa — referencia o Registro de Contadores.</div></div>' +
      '<button type="button" class="btn btn-outline btn-sm" id="btn-add-contador">' + Icon("plus", "size-3-5") + " Vincular contador</button>" +
      "</div></div>" +
      '<div class="card-content"><div class="table-wrap"><table class="dtable">' +
      "<thead><tr><th>Nome</th><th>CPF</th><th>CRC</th><th></th></tr></thead>" +
      "<tbody>" + rows + "</tbody></table></div></div>" +
      "</div>";

    document.getElementById("btn-add-contador").addEventListener("click", abrirVincular);
    document.querySelectorAll("[data-desvincular]").forEach((btn) =>
      btn.addEventListener("click", () => abrirConfirmacaoDesvinculo(Number(btn.getAttribute("data-desvincular"))))
    );
  }

  // "Desvincular" (não "excluir"): remove só o vínculo com a empresa aberta.
  // Excluir o cadastro do contador em si é responsabilidade do Registro de
  // Contadores (Cadastros Auxiliares) — mesma distinção já aplicada a
  // Sócios/Quadro Societário.
  function abrirConfirmacaoDesvinculo(contadorId) {
    const contador = D.getContadores().find((c) => c.id === contadorId);
    contadorParaDesvincularId = contadorId;
    document.getElementById("ct-delete-description").textContent =
      "O vínculo de " + contador.nome + " com " + empresaAtual.nome + " será removido. O contador continua cadastrado no Registro de Contadores e mantém seus vínculos com outras empresas.";
    UI.openDialog(document.getElementById("ct-delete-overlay"));
  }

  function fecharConfirmacaoDesvinculo() {
    UI.closeDialog(document.getElementById("ct-delete-overlay"));
    contadorParaDesvincularId = null;
  }

  function confirmarDesvinculo() {
    if (!contadorParaDesvincularId) return;
    const contador = D.getContadores().find((c) => c.id === contadorParaDesvincularId);
    const atualizados = D.getContadores().map((c) =>
      c.id !== contadorParaDesvincularId ? c : Object.assign({}, c, { empresasAtendidas: c.empresasAtendidas.filter((codigo) => codigo !== empresaAtual.codigo) })
    );
    D.setContadores(atualizados);
    window.EmpresasData.registrarEventoHistorico(empresaAtual.codigo, [
      { campo: "Contador desvinculado", de: contador.nome + " — " + contador.crc, para: "—" },
    ]);
    fecharConfirmacaoDesvinculo();
    renderTabela();
    UI.showToast("Vínculo removido", "O contador foi desvinculado de " + empresaAtual.nome + ".", "info");
  }

  function contadorOptions() {
    return D.getContadores()
      .filter((c) => !c.empresasAtendidas.includes(empresaAtual.codigo))
      .map((c) => ({ value: String(c.id), label: c.nome + " — " + c.cpf }));
  }

  let currentContadorId = "";

  function abrirVincular() {
    currentContadorId = "";
    document.getElementById("ct-salvar").disabled = true;
    UI.initCombobox(document.getElementById("ct-combobox"), contadorOptions(), "", (value) => {
      currentContadorId = value;
      document.getElementById("ct-salvar").disabled = !value;
    });
    UI.openSheet(document.getElementById("ct-overlay"), document.getElementById("ct-panel"));
  }

  function fecharVincular() {
    UI.closeSheet(document.getElementById("ct-overlay"), document.getElementById("ct-panel"));
  }

  function salvarVinculo() {
    if (!currentContadorId) return;
    const contador = D.getContadores().find((c) => String(c.id) === currentContadorId);
    const atualizados = D.getContadores().map((c) =>
      String(c.id) === currentContadorId ? Object.assign({}, c, { empresasAtendidas: c.empresasAtendidas.concat([empresaAtual.codigo]) }) : c
    );
    D.setContadores(atualizados);
    window.EmpresasData.registrarEventoHistorico(empresaAtual.codigo, [
      { campo: "Contador vinculado", de: "—", para: contador.nome + " — " + contador.crc },
    ]);
    fecharVincular();
    renderTabela();
    UI.showToast("Contador vinculado", "O contador foi vinculado a " + empresaAtual.nome + ".");
  }

  window.renderTabContent = function (empresa) {
    empresaAtual = empresa;
    renderTabela();

    document.getElementById("ct-close").innerHTML = Icon("x", "size-4");
    document.querySelector("#ct-combobox .chev").innerHTML = Icon("chevron-down", "size-4");
    document.querySelector("#ct-combobox .search-icon").innerHTML = Icon("search", "size-4");
    document.getElementById("ct-delete-close").innerHTML = Icon("x", "size-4");

    document.getElementById("ct-overlay").addEventListener("click", fecharVincular);
    document.getElementById("ct-close").addEventListener("click", fecharVincular);
    document.getElementById("ct-cancelar").addEventListener("click", fecharVincular);
    document.getElementById("ct-salvar").addEventListener("click", salvarVinculo);

    const deleteOverlay = document.getElementById("ct-delete-overlay");
    document.getElementById("ct-delete-close").addEventListener("click", fecharConfirmacaoDesvinculo);
    document.getElementById("ct-delete-cancel").addEventListener("click", fecharConfirmacaoDesvinculo);
    document.getElementById("ct-delete-confirm").addEventListener("click", confirmarDesvinculo);
    deleteOverlay.addEventListener("click", (e) => {
      if (e.target === deleteOverlay) fecharConfirmacaoDesvinculo();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && deleteOverlay.classList.contains("is-open")) fecharConfirmacaoDesvinculo();
    });
  };
})();
