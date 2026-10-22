/*
  Aba "Histórico de Alterações" — Parâmetros Fiscais.

  Réplica fiel do padrão visual já validado em
  `prototype/empresas/js/historico.js` e em `prototype/folha-pagamento/js/
  folha-page.js` (`blocoEventoHistorico`/`renderHistorico`, Fase 8/P24):
  1 card, eventos agrupados por evento de salvamento (mais recente
  primeiro), cabeçalho com data/hora + usuário, tabela de campo/valor
  anterior/novo valor por evento, estado vazio quando não há eventos.
  Nenhuma classe CSS nova — reaproveita integralmente `.history-event`,
  `.history-event-header`, `.dtable`/`.dtable-compact`/`.table-wrap`,
  `.row-empty-state` e o badge `.badge-outline` já usados nos dois
  precedentes.

  Aba somente leitura — nunca escreve no cadastro fiscal, apenas exibe o
  registro de eventos já gravados por `FiscalHistoricoEventos`. Como a
  Fiscal tem 4 áreas com campo Manual (Gerais, Estaduais e Municipais,
  Contábil × Fiscal, Obrigações e Documentos Fiscais) contribuindo para a
  mesma lista, cada evento exibe também um badge de área — mesmo padrão já
  usado em DP (`evento.area`, `folha-page.js`), necessário ali pelo mesmo
  motivo (múltiplas áreas, uma lista só).

  `evento.vigenciaId` existe no dado (ver historico-eventos.js) mas não é
  exibido nesta implementação — nenhuma coluna de vigência, nenhum filtro:
  decisão explícita desta tarefa para manter a interface visualmente
  equivalente ao histórico existente em Empresas/DP.
*/
(function () {
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
      '<div class="flex items-center gap-2 flex-wrap text-xs text-muted">' +
      '<span class="badge badge-outline">' + evento.area + "</span>" +
      "</div>" +
      '<div class="table-wrap"><table class="dtable dtable-compact">' +
      "<thead><tr><th>Campo alterado</th><th>Valor anterior</th><th>Novo valor</th></tr></thead>" +
      "<tbody>" + evento.alteracoes.map(linhaAlteracao).join("") + "</tbody>" +
      "</table></div>" +
      "</div>"
    );
  }

  function renderConteudo(empresa) {
    const eventos = window.FiscalHistoricoEventos.getEventosHistoricoFiscal(empresa.codigo);
    const conteudo = eventos.length
      ? eventos.map(blocoEvento).join('<hr style="border:none;border-top:1px solid var(--border);margin:0;" />')
      : '<div class="row-empty-state">Nenhuma alteração registrada até o momento.</div>';

    return (
      '<div class="card">' +
      '<div class="card-header">' +
      '<div class="card-title">Histórico de alterações</div>' +
      '<div class="card-description">Quem alterou, o que foi alterado, de qual valor para qual valor, e quando — agrupado por evento, do mais recente para o mais antigo.</div>' +
      "</div>" +
      '<div class="card-content flex flex-col gap-4">' + conteudo + "</div>" +
      "</div>"
    );
  }

  window.FiscalHistorico = { renderConteudo: renderConteudo };
})();
