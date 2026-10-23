/*
  Carga em lote dos saldos de CPP por planilha (RF-104 do doc CTB-533): CNPJ,
  período, CPP e nº da declaração. Upload mock (um clique "seleciona" a
  planilha), validação por linha com o motivo e o número da linha recusada, e
  carga idempotente: reenviar a mesma planilha não altera as contagens.
  Fica dentro da aba Fiscal da empresa, como todo botão de implantação
  (Discovery 23/10/2026), mesmo que a planilha cubra várias empresas.
*/
(function (global) {
  const FI = global.FiscalImplantacaoData;
  const EI = global.EmpresasImplantacaoData;

  let selecionada = false;
  let aoAplicar = null;

  function porCnpj(cnpj) {
    const codigo = EI.codigosDoCockpit().find((c) => EI.infoEmpresa(c).cnpj === cnpj);
    return codigo ? EI.infoEmpresa(codigo) : null;
  }

  const RESULTADO = {
    implanta: '<span class="badge badge-success">' + "Implanta</span>",
    sem_alteracao: '<span class="badge badge-secondary">Sem alteração</span>',
    ignorada: '<span class="badge badge-outline">Ignorada</span>',
    recusada: '<span class="badge badge-destructive">Recusada</span>',
  };

  function render() {
    const body = document.getElementById("lote-cpp-body");
    const aplicar = document.getElementById("btn-lote-aplicar");
    if (!selecionada) {
      body.innerHTML =
        '<p class="text-sm text-muted">Colunas da planilha: CNPJ, período (caixa), CPP e nº da declaração PGDAS-D. Cada linha entra como CPP manual com a declaração como evidência, e nunca sobrescreve o que veio do motor, da SERPRO ou do extrato.</p>' +
        '<div class="upload-dropzone" id="lote-dropzone" tabindex="0" role="button" aria-label="Selecionar planilha de carga">' +
        '<div class="upload-dropzone-icon">' + Icon("upload", "size-5") + "</div>" +
        '<div class="text-sm font-medium">Arraste a planilha aqui ou clique para selecionar</div>' +
        '<div class="text-xs text-muted">XLSX ou CSV · layout do RF-104</div></div>';
      const dz = document.getElementById("lote-dropzone");
      const escolher = () => {
        selecionada = true;
        render();
      };
      dz.addEventListener("click", escolher);
      dz.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          escolher();
        }
      });
      aplicar.disabled = true;
      return;
    }
    const linhas = FI.validarLote(porCnpj);
    const conta = (r) => linhas.filter((l) => l.resultado === r).length;
    body.innerHTML =
      '<div class="upload-file-row">' +
      '<span class="upload-file-icon">' + Icon("file-text", "size-4") + "</span>" +
      '<div class="flex flex-col min-w-0 flex-1 gap-0-5"><span class="text-sm font-medium truncate">' + FI.PLANILHA_LOTE + '</span><span class="text-xs text-muted">' + linhas.length + " linhas lidas</span></div>" +
      '<button type="button" class="btn btn-ghost btn-sm" id="lote-remover" aria-label="Remover planilha">' + Icon("x", "size-4") + "</button></div>" +
      '<div class="flex flex-wrap gap-2">' +
      '<span class="badge badge-success">' + conta("implanta") + " implantam</span>" +
      '<span class="badge badge-secondary">' + conta("sem_alteracao") + " sem alteração</span>" +
      '<span class="badge badge-outline">' + conta("ignorada") + " ignoradas</span>" +
      '<span class="badge badge-destructive">' + conta("recusada") + " recusadas</span></div>" +
      '<div class="table-wrap"><table class="dtable dtable-compact">' +
      '<thead><tr><th>Linha</th><th>Empresa</th><th>Período</th><th class="text-right">CPP</th><th class="col-pad-md">Resultado</th></tr></thead><tbody>' +
      linhas
        .map(
          (l) =>
            '<tr><td class="cell-mono">' + l.linha + "</td>" +
            '<td><div class="flex flex-col"><span class="text-sm">' + (l.empresa || "—") + '</span><span class="cell-mono text-xs text-muted">' + l.cnpj + "</span></div></td>" +
            '<td class="cell-mono">' + l.periodo + '</td><td class="text-right tabular-nums">' + l.cpp + "</td>" +
            '<td class="col-pad-md"><div class="flex flex-col gap-0-5 items-start">' + RESULTADO[l.resultado] + (l.motivo ? '<span class="text-xs text-muted">' + l.motivo + "</span>" : "") + "</div></td></tr>"
        )
        .join("") +
      "</tbody></table></div>";
    document.getElementById("lote-remover").addEventListener("click", () => {
      selecionada = false;
      render();
    });
    aplicar.disabled = conta("implanta") === 0;
  }

  function abrir() {
    selecionada = false;
    render();
    UI.openSheet(document.getElementById("lote-cpp-overlay"), document.getElementById("lote-cpp-panel"));
  }

  function fechar() {
    UI.closeSheet(document.getElementById("lote-cpp-overlay"), document.getElementById("lote-cpp-panel"));
  }

  function setup(opts) {
    aoAplicar = opts && opts.onAplicar;
    document.getElementById("lote-cpp-close").innerHTML = Icon("x", "size-4");
    document.getElementById("lote-cpp-close").addEventListener("click", fechar);
    document.getElementById("btn-lote-cancelar").addEventListener("click", fechar);
    document.getElementById("lote-cpp-overlay").addEventListener("click", fechar);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && document.getElementById("lote-cpp-panel").classList.contains("is-open")) fechar();
    });
    document.getElementById("btn-lote-aplicar").addEventListener("click", () => {
      const n = FI.aplicarLote(FI.validarLote(porCnpj));
      fechar();
      UI.showToast("Carga em lote aplicada", n + " período(s) implantado(s). Reenviar a mesma planilha não altera nada.");
      if (aoAplicar) aoAplicar();
    });
  }

  global.FiscalLote = { setup, abrir };
})(window);
