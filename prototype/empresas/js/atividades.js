/* Aba "Atividades" — portado de CnaesCard.jsx. */
(function () {
  const D = window.EmpresasData;
  let empresaAtual = null;
  let drawerWired = false;

  function abrirEdicaoEmpresa(empresa) {
    empresaAtual = empresa;
    const a = empresa.atividades;
    document.getElementById("edit-cnae-principal").value = a.cnaePrincipal || "";
    document.getElementById("edit-cnaes-secundarios").value = (a.cnaeSecundarios || []).join(", ");
    UI.openSheet(document.getElementById("edit-empresa-overlay"), document.getElementById("edit-empresa-panel"));
  }

  function fecharDrawerEdicao() {
    UI.closeSheet(document.getElementById("edit-empresa-overlay"), document.getElementById("edit-empresa-panel"));
  }

  function salvarEdicaoEmpresa() {
    const novosValores = {
      cnaePrincipal: document.getElementById("edit-cnae-principal").value.trim(),
      cnaeSecundarios: document
        .getElementById("edit-cnaes-secundarios")
        .value.split(",")
        .map((v) => v.trim())
        .filter(Boolean),
    };
    EmpresaDetailShell.confirmarReflexoCockpit(
      () => {
        D.setAtividadesEmpresa(empresaAtual.codigo, novosValores);
        fecharDrawerEdicao();
        window.renderTabContent(empresaAtual);
        UI.showToast("Alterações salvas e sincronizadas com o Cockpit", "As atividades de " + empresaAtual.nome + " foram atualizadas.");
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

  window.renderTabContent = function (empresa) {
    wireDrawerEdicao();
    const a = empresa.atividades;
    document.getElementById("tab-content").innerHTML =
      '<div class="card gap-4">' +
      '<div class="card-header"><div class="card-title">Atividades</div></div>' +
      '<div class="card-content detail-grid">' +
      '<div class="detail-field"><span class="detail-field-label">CNAE principal</span>' +
      (a.cnaePrincipal
        ? '<span class="detail-field-value">' + a.cnaePrincipal + "</span>"
        : '<span class="detail-field-value italic text-muted">Nenhum CNAE principal informado.</span>') +
      "</div>" +
      '<div class="detail-field detail-field-wide"><span class="detail-field-label">CNAEs secundários</span>' +
      (a.cnaeSecundarios.length > 0
        ? '<span class="detail-field-value">' + a.cnaeSecundarios.join(", ") + "</span>"
        : '<span class="detail-field-value italic text-muted">Nenhum CNAE secundário cadastrado.</span>') +
      "</div>" +
      "</div>" +
      "</div>";
  };
})();
