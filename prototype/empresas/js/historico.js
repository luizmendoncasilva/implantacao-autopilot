/*
  Aba "Histórico de alterações" — mostra quem alterou os dados da empresa, o
  que foi alterado e quando, agrupado por evento de edição (uma mesma ação de
  salvar reúne todos os campos alterados naquele momento). Só leitura: esta
  aba nunca escreve no cadastro, apenas exibe o registro de auditoria.
  Dado mockado (EmpresasData.getHistoricoAlteracoes) — ver
  docs/cadastro-empresas-spec.md, seção "Histórico de Alterações", para o que
  falta conectar a uma auditoria real.
*/
(function () {
  const D = window.EmpresasData;

  function linhaAlteracao(alt) {
    return (
      "<tr>" +
      "<td>" + UI.truncatedCell(alt.campo, 220) + "</td>" +
      "<td>" + (alt.de || "—") + "</td>" +
      "<td>" + (alt.para || "—") + "</td>" +
      "</tr>"
    );
  }

  function blocoEvento(evento) {
    return (
      '<div class="history-event">' +
      '<div class="history-event-header">' +
      '<span class="flex items-center gap-1 text-sm font-medium">' + Icon("clock", "size-3-5") + evento.data + " às " + evento.hora + "</span>" +
      '<span class="badge badge-outline flex items-center gap-1">' + Icon("users", "size-3-5") + evento.usuario + "</span>" +
      "</div>" +
      '<div class="table-wrap"><table class="dtable dtable-compact">' +
      "<thead><tr><th>Campo alterado</th><th>Valor anterior</th><th>Novo valor</th></tr></thead>" +
      "<tbody>" + evento.alteracoes.map(linhaAlteracao).join("") + "</tbody>" +
      "</table></div>" +
      "</div>"
    );
  }

  window.renderTabContent = function (empresa) {
    const eventos = D.getHistoricoAlteracoes(empresa.codigo);
    const conteudo = eventos.length
      ? eventos.map(blocoEvento).join('<hr style="border:none;border-top:1px solid var(--border);margin:0;" />')
      : '<div class="row-empty-state">Nenhuma alteração registrada até o momento.</div>';

    document.getElementById("tab-content").innerHTML =
      '<div class="card">' +
      '<div class="card-header">' +
      '<div class="card-title">Histórico de alterações</div>' +
      '<div class="card-description">Quem alterou, o que foi alterado, de qual valor para qual valor, e quando — agrupado por evento de edição.</div>' +
      "</div>" +
      '<div class="card-content flex flex-col gap-4">' + conteudo + "</div>" +
      "</div>";
  };
})();
