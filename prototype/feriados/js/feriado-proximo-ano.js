/*
  "Preparar ano seguinte" (hipótese a validar com Produto/DP/Fiscal): lista os
  feriados móveis ativos do ano selecionado, no escopo da aba (e da UF /
  município filtrados), e deixa confirmar ou ajustar a data de cada um no ano
  seguinte. Fixos não precisam disso. Linha sem data é ignorada. Para
  Carnaval, Sexta-feira Santa e Corpus Christi a data vem sugerida pela
  Páscoa; os demais (ex.: decretados) ficam em branco.
*/
(function (global) {
  const D = global.FeriadosData;
  const overlay = document.getElementById("prox-overlay");
  const panel = document.getElementById("prox-panel");
  const corpo = document.getElementById("prox-body");
  const btnSalvar = document.getElementById("prox-salvar");

  let itens = [];
  let anoAlvo = 0;
  let anoBase = 0;
  let onSalvo = function () {};

  function pickerHtml(indice) {
    return (
      '<div class="date-picker" data-picker="' + indice + '">' +
      '<button type="button" class="date-picker-trigger">' +
      '<span class="date-picker-icon">' + Icon("calendar", "size-4") + "</span>" +
      '<span class="date-picker-label">Selecione uma data</span>' +
      "</button>" +
      '<div class="date-picker-panel">' +
      '<div class="date-picker-header">' +
      '<button type="button" class="date-picker-nav-btn" data-nav="prev" aria-label="Mês anterior">' + Icon("chevron-left", "size-4") + "</button>" +
      '<span class="date-picker-caption"></span>' +
      '<button type="button" class="date-picker-nav-btn" data-nav="next" aria-label="Próximo mês">' + Icon("chevron-right", "size-4") + "</button>" +
      "</div>" +
      '<div class="date-picker-weekdays"><span>D</span><span>S</span><span>T</span><span>Q</span><span>Q</span><span>S</span><span>S</span></div>' +
      '<div class="date-picker-grid"></div>' +
      "</div></div>"
    );
  }

  function itemHtml(item, indice) {
    const f = item.base;
    const local = f.abrangencia === "federal" ? "" : " · " + D.esc(D.rotuloLocal(f));
    const cabecalho =
      '<div class="flex items-center justify-between gap-2 flex-wrap">' +
      '<span class="text-sm font-medium">' + D.esc(f.descricao) + "</span>" +
      '<span class="text-xs text-muted">' + anoBase + ": " + D.formatarDataFeriado(f) + local + "</span>" +
      "</div>";
    if (item.existente) {
      return (
        '<div class="sheet-field">' + cabecalho +
        '<span class="text-xs text-muted">Já cadastrado em ' + anoAlvo + " (" + D.formatarDataFeriado(item.existente) + ") — nada a fazer.</span></div>"
      );
    }
    return (
      '<div class="sheet-field">' + cabecalho + pickerHtml(indice) +
      (item.sugestao ? '<span class="text-xs text-muted">Sugestão calculada pela data da Páscoa — confira antes de salvar.</span>' : "") +
      '<span class="text-xs" data-erro="' + indice + '" style="display:none; color:var(--destructive);"></span></div>'
    );
  }

  function candidato(item, partes) {
    const f = item.base;
    return { abrangencia: f.abrangencia, uf: f.uf, ibge: f.ibge, descricao: f.descricao, tipo: "movel", dia: partes.dia, mes: partes.mes, ano: partes.ano, obs: f.obs };
  }

  function validar() {
    let validas = 0;
    let comErro = false;
    itens.forEach((item, indice) => {
      if (item.existente) return;
      const erroEl = corpo.querySelector('[data-erro="' + indice + '"]');
      let erro = "";
      const partes = item.data ? D.dataBrParaPartes(item.data) : null;
      if (partes) {
        const dup = partes.ano !== anoAlvo ? null : D.buscarDuplicidade(candidato(item, partes), null);
        if (partes.ano !== anoAlvo) erro = "A data precisa estar em " + anoAlvo + ".";
        else if (dup) erro = "Já existe um feriado nesta data para o mesmo local: " + dup.descricao + ".";
        else validas++;
      }
      if (erro) comErro = true;
      erroEl.textContent = erro;
      erroEl.style.display = erro ? "" : "none";
    });
    btnSalvar.disabled = validas === 0 || comErro;
  }

  function abrir(escopo, callback) {
    onSalvo = callback;
    anoBase = escopo.ano;
    anoAlvo = escopo.ano + 1;

    const todos = D.getFeriados();
    const base = todos.filter(
      (f) =>
        f.ativo &&
        f.abrangencia === escopo.aba &&
        f.tipo === "movel" &&
        f.ano === anoBase &&
        (!escopo.uf || f.uf === escopo.uf) &&
        (!escopo.ibge || f.ibge === escopo.ibge)
    );
    itens = base.map((f) => ({
      base: f,
      existente: todos.find(
        (g) => g.abrangencia === f.abrangencia && D.chaveLocal(g) === D.chaveLocal(f) && g.tipo === "movel" && g.ano === anoAlvo && D.normalizar(g.descricao) === D.normalizar(f.descricao)
      ) || null,
      sugestao: D.sugerirDataMovel(f.descricao, anoAlvo),
      data: null,
    }));

    const partesEscopo = [D.ABRANGENCIAS[escopo.aba]];
    if (escopo.uf) partesEscopo.push(escopo.uf);
    if (escopo.ibge) partesEscopo.push(D.rotuloMunicipio(escopo.ibge));
    document.getElementById("prox-title").textContent = "Preparar " + anoAlvo;
    document.getElementById("prox-description").textContent =
      "Feriados móveis de " + anoBase + " (" + partesEscopo.join(" · ") + "). Confirme ou ajuste a data de cada um em " + anoAlvo + "; linhas sem data são ignoradas. Os fixos não precisam de preparação.";
    btnSalvar.textContent = "Salvar datas de " + anoAlvo;

    if (itens.length === 0) {
      corpo.innerHTML = '<div class="row-empty-state">Não há feriados móveis ativos de ' + anoBase + " neste escopo.</div>";
    } else {
      corpo.innerHTML = itens.map(itemHtml).join('<hr style="border:none;border-top:1px solid var(--border);margin:0;" />');
      itens.forEach((item, indice) => {
        if (item.existente) return;
        const picker = UI.initDatePicker(corpo.querySelector('[data-picker="' + indice + '"]'), (dataBr) => {
          item.data = dataBr;
          validar();
        });
        if (item.sugestao) {
          item.data = item.sugestao;
          picker.setValue(item.sugestao);
        }
      });
    }
    validar();
    UI.openSheet(overlay, panel);
  }

  function fechar() {
    UI.closeSheet(overlay, panel);
  }

  function salvar() {
    let criados = 0;
    itens.forEach((item) => {
      const partes = !item.existente && item.data ? D.dataBrParaPartes(item.data) : null;
      if (!partes) return;
      D.criar(candidato(item, partes), "Preparação de " + anoAlvo + " (a partir de " + item.base.descricao + " " + anoBase + ")");
      criados++;
    });
    fechar();
    onSalvo(criados, anoAlvo);
  }

  function init() {
    document.getElementById("prox-close").innerHTML = Icon("x", "size-4");
    document.getElementById("prox-close").addEventListener("click", fechar);
    document.getElementById("prox-cancelar").addEventListener("click", fechar);
    overlay.addEventListener("click", fechar);
    btnSalvar.addEventListener("click", salvar);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && panel.classList.contains("is-open")) fechar();
    });
  }

  global.FeriadoProximoAno = { init, abrir };
})(window);
