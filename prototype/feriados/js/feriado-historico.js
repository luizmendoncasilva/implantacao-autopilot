/*
  Painel lateral de histórico de um feriado — somente leitura. Reaproveita o
  padrão de evento do histórico de Empresas/Fiscal (.history-event): quem,
  quando, a ação e, quando houve mudança de campo, antes → depois.
*/
(function (global) {
  const D = global.FeriadosData;
  const overlay = document.getElementById("hist-overlay");
  const panel = document.getElementById("hist-panel");

  const ACAO_BADGE = {
    criado: "badge-success",
    editado: "badge-info",
    inativado: "badge-secondary",
    reativado: "badge-success",
  };

  function valor(v) {
    return v ? D.esc(v) : "—";
  }

  function linhaAlteracao(alt) {
    return "<tr><td>" + D.esc(alt.campo) + "</td><td>" + valor(alt.de) + "</td><td>" + valor(alt.para) + "</td></tr>";
  }

  function blocoEvento(evento) {
    const tabela = evento.alteracoes.length
      ? '<div class="table-wrap"><table class="dtable dtable-compact">' +
        "<thead><tr><th>Campo</th><th>Antes</th><th>Depois</th></tr></thead>" +
        "<tbody>" + evento.alteracoes.map(linhaAlteracao).join("") + "</tbody></table></div>"
      : "";
    return (
      '<div class="history-event">' +
      '<div class="history-event-header">' +
      '<span class="flex items-center gap-1 text-sm font-medium">' + Icon("clock", "size-3-5") + D.formatarDataHora(evento.em) + "</span>" +
      '<span class="badge badge-outline flex items-center gap-1">' + Icon("users", "size-3-5") + D.esc(evento.usuario) + "</span>" +
      "</div>" +
      '<div class="flex items-center gap-2 flex-wrap text-xs text-muted">' +
      '<span class="badge ' + ACAO_BADGE[evento.acao] + '">' + D.ACOES[evento.acao] + "</span>" +
      (evento.motivo ? "<span>Motivo: " + D.esc(evento.motivo) + "</span>" : "") +
      "</div>" +
      tabela +
      "</div>"
    );
  }

  function abrir(feriado) {
    document.getElementById("hist-title").textContent = "Histórico — " + feriado.descricao;
    document.getElementById("hist-description").textContent =
      D.ABRANGENCIAS[feriado.abrangencia] + " · " + D.rotuloLocal(feriado) + " · " + D.formatarDataFeriado(feriado) + " (" + D.TIPOS[feriado.tipo].toLowerCase() + ")";
    const eventos = D.eventosDoFeriado(feriado.id);
    document.getElementById("hist-body").innerHTML = eventos.length
      ? eventos.map(blocoEvento).join('<hr style="border:none;border-top:1px solid var(--border);margin:0;" />')
      : '<div class="row-empty-state">Nenhuma alteração registrada até o momento.</div>';
    UI.openSheet(overlay, panel);
  }

  function fechar() {
    UI.closeSheet(overlay, panel);
  }

  function init() {
    document.getElementById("hist-close").innerHTML = Icon("x", "size-4");
    document.getElementById("hist-close").addEventListener("click", fechar);
    document.getElementById("hist-fechar").addEventListener("click", fechar);
    overlay.addEventListener("click", fechar);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && panel.classList.contains("is-open")) fechar();
    });
  }

  global.FeriadoHistorico = { init, abrir };
})(window);
