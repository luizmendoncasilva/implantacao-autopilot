/* Aba "Responsável legal" — dado de origem Cockpit, editável via drawer no Autopilot (mesmo padrão de Dados gerais/Atividades). */
(function () {
  const D = window.EmpresasData;
  let empresaAtual = null;
  let drawerWired = false;

  function abrirEdicaoEmpresa(empresa) {
    empresaAtual = empresa;
    const rl = empresa.responsavelLegal || {};
    document.getElementById("edit-rl-nome").value = rl.nome || "";
    document.getElementById("edit-rl-cpf").value = rl.cpf || "";
    document.getElementById("edit-rl-cargo").value = rl.cargo || "";
    UI.openSheet(document.getElementById("edit-empresa-overlay"), document.getElementById("edit-empresa-panel"));
  }

  function fecharDrawerEdicao() {
    UI.closeSheet(document.getElementById("edit-empresa-overlay"), document.getElementById("edit-empresa-panel"));
  }

  function salvarEdicaoEmpresa() {
    const novosValores = {
      nome: document.getElementById("edit-rl-nome").value.trim(),
      cpf: document.getElementById("edit-rl-cpf").value.trim(),
      cargo: document.getElementById("edit-rl-cargo").value.trim(),
    };
    EmpresaDetailShell.confirmarReflexoCockpit(
      () => {
        D.setResponsavelLegalEmpresa(empresaAtual.codigo, novosValores);
        fecharDrawerEdicao();
        window.renderTabContent(empresaAtual);
        UI.showToast("Alterações salvas e sincronizadas com o Cockpit", "O responsável legal de " + empresaAtual.nome + " foi atualizado.");
      },
      () => {
        fecharDrawerEdicao();
        UI.showToast("Alterações descartadas", "Nenhuma alteração foi salva para " + empresaAtual.nome + ".", "info");
      }
    );
  }

  function wireDrawerEdicao() {
    if (drawerWired) return;
    drawerWired = true;
    document.getElementById("edit-empresa-close").innerHTML = Icon("x", "size-4");
    document.getElementById("edit-empresa-overlay").addEventListener("click", fecharDrawerEdicao);
    document.getElementById("edit-empresa-close").addEventListener("click", fecharDrawerEdicao);
    document.getElementById("edit-empresa-cancelar").addEventListener("click", fecharDrawerEdicao);
    document.getElementById("edit-empresa-salvar").addEventListener("click", salvarEdicaoEmpresa);
  }

  window.abrirEdicaoEmpresa = abrirEdicaoEmpresa;

  function campo(label, value, wide) {
    return (
      '<div class="detail-field' + (wide ? " detail-field-wide" : "") + '">' +
      '<span class="detail-field-label">' + label + "</span>" +
      '<div class="detail-field-value">' + value + "</div>" +
      "</div>"
    );
  }

  window.renderTabContent = function (empresa) {
    wireDrawerEdicao();
    const rl = empresa.responsavelLegal;

    const conteudo = rl
      ? campo("Nome", rl.nome, true) + campo("CPF", rl.cpf) + campo("Cargo / Qualificação", rl.cargo)
      : '<div class="detail-field-wide"><span class="text-sm italic text-muted">Nenhum responsável legal cadastrado.</span></div>';

    document.getElementById("tab-content").innerHTML =
      '<div class="card gap-4">' +
      '<div class="card-header"><div class="card-title">Responsável legal</div></div>' +
      '<div class="card-content detail-grid">' + conteudo + "</div>" +
      "</div>";
  };
})();
