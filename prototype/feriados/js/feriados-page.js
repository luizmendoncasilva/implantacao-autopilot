/*
  Tabela de Feriados — listagem por abrangência (Federal | Estadual |
  Municipal), com filtros de Ano, descrição, Tipo, Status, UF e Município.
  O ano calcula a ocorrência dos fixos e mostra só os móveis daquele ano. Abas
  e filtros ficam em memória (sem querystring), como a trilha Fiscal.
*/
(function () {
  const D = window.FeriadosData;

  const state = { aba: "federal", ano: D.ANO_PADRAO, busca: "", tipo: "", status: "", uf: "", ibge: "" };

  const TIPO_BADGE = { fixo: "badge-secondary", movel: "badge-warning" };
  const COLUNAS_FIXAS = {
    antes: ["Data", "Dia da semana", "Descrição"],
    depois: ["Tipo", "Origem", "Status", "Última alteração", ""],
  };
  const COLUNA_LOCAL = { estadual: "UF", municipal: "Município" };

  const comboMunicipio = document.getElementById("f-municipio");
  const selectAno = document.getElementById("f-ano");
  const selectUf = document.getElementById("f-uf");

  function ensureToast() {
    if (document.getElementById("toast")) return;
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.id = "toast";
    toast.innerHTML = '<span class="toast-icon"></span><div class="flex flex-col gap-0-5"><span class="toast-title"></span><span class="toast-desc"></span></div>';
    document.body.appendChild(toast);
  }

  // ===== Filtros =====

  function passaFiltros(f) {
    if (f.abrangencia !== state.aba) return false;
    if (state.busca.trim() && !D.normalizar(f.descricao).includes(D.normalizar(state.busca.trim()))) return false;
    if (state.tipo && f.tipo !== state.tipo) return false;
    if (state.status && (state.status === "ativo") !== f.ativo) return false;
    if (state.aba !== "federal" && state.uf && f.uf !== state.uf) return false;
    if (state.aba === "municipal" && state.ibge && f.ibge !== state.ibge) return false;
    return true;
  }

  function filtrosAtivos() {
    return !!(state.busca.trim() || state.tipo || state.status || (state.aba !== "federal" && state.uf) || (state.aba === "municipal" && state.ibge));
  }

  function listaDoAno() {
    return D.getFeriados()
      .filter((f) => passaFiltros(f) && D.dataNoAno(f, state.ano))
      .sort((a, b) => D.dataNoAno(a, state.ano) - D.dataNoAno(b, state.ano) || a.descricao.localeCompare(b.descricao, "pt-BR"));
  }

  function limparFiltros() {
    state.busca = "";
    state.tipo = "";
    state.status = "";
    state.uf = "";
    state.ibge = "";
    document.getElementById("f-busca").value = "";
    selectUf.value = "";
    setToggle("f-tipo", "");
    setToggle("f-status", "");
    atualizarComboMunicipio();
  }

  function setToggle(id, valor) {
    document.querySelectorAll("#" + id + " .toggle-item").forEach((item) => item.classList.toggle("is-on", item.getAttribute("data-value") === valor));
  }

  function atualizarComboMunicipio() {
    const opcoes = [{ value: "", label: "Todos os municípios" }].concat(D.municipiosDaUf(state.uf).map((m) => ({ value: m.ibge, label: m.ibge + " – " + m.nome, sublabel: state.uf ? "" : m.uf })));
    UI.initCombobox(comboMunicipio, opcoes, state.ibge, (valor) => {
      state.ibge = valor;
      const m = valor ? D.municipio(valor) : null;
      if (m && state.uf !== m.uf) {
        state.uf = m.uf;
        selectUf.value = m.uf;
        atualizarComboMunicipio();
      }
      render();
    });
  }

  // ===== Renderização =====

  // Com um município filtrado, a coluna Município seria redundante (o resumo já o identifica).
  function colunaLocal() {
    if (state.aba === "municipal" && state.ibge) return null;
    return COLUNA_LOCAL[state.aba] || null;
  }

  function cabecalho() {
    const colunas = COLUNAS_FIXAS.antes.concat(colunaLocal() ? [colunaLocal()] : [], COLUNAS_FIXAS.depois);
    return (
      "<tr>" +
      colunas
        .map((nome, i) => {
          if (i === 0) return "<th>" + nome + "</th>";
          if (i === colunas.length - 1) return '<th class="col-pad-end"></th>';
          return '<th class="col-pad-sm">' + nome + "</th>";
        })
        .join("") +
      "</tr>"
    );
  }

  function botaoAcao(acao, id, icone, rotulo) {
    return (
      '<button type="button" class="btn btn-ghost" style="height:32px; padding:0 8px;" data-acao="' + acao + '" data-id="' + id + '" title="' + rotulo + '" aria-label="' + rotulo + '">' +
      Icon(icone, "size-4") +
      "</button>"
    );
  }

  function celulaLocal(f) {
    if (!colunaLocal()) return "";
    if (f.abrangencia === "estadual") return '<td class="col-pad-sm">' + f.uf + "</td>";
    if (f.abrangencia === "municipal") return '<td class="col-pad-sm">' + UI.truncatedCell(D.esc(D.rotuloMunicipio(f.ibge) + "/" + f.uf), 200) + "</td>";
    return "";
  }

  function linha(f) {
    const data = D.dataNoAno(f, state.ano);
    const ult = D.ultimoEvento(f.id);
    return (
      '<tr style="' + (f.ativo ? "" : "opacity:.6;") + '">' +
      '<td class="cell-mono">' + D.formatarDataFeriado(f) + "</td>" +
      '<td class="col-pad-sm whitespace-nowrap">' + D.diaDaSemana(data) + "</td>" +
      '<td class="col-pad-sm">' + UI.truncatedCell(D.esc(f.descricao), 220, "text-sm font-medium") + "</td>" +
      celulaLocal(f) +
      '<td class="col-pad-sm"><span class="badge ' + TIPO_BADGE[f.tipo] + '">' + D.TIPOS[f.tipo] + "</span></td>" +
      '<td class="col-pad-sm"><span class="badge badge-outline">' + D.ORIGENS[f.origem] + "</span></td>" +
      '<td class="col-pad-sm"><span class="badge ' + (f.ativo ? "badge-success" : "badge-secondary") + '">' + (f.ativo ? "Ativo" : "Inativo") + "</span></td>" +
      '<td class="col-pad-sm">' +
      (ult
        ? '<div class="flex flex-col"><span class="text-sm">' + D.esc(ult.usuario) + '</span><span class="text-xs text-muted">' + D.formatarDataIso(ult.em) + "</span></div>"
        : "—") +
      "</td>" +
      '<td class="col-pad-end"><div class="flex items-center justify-end">' +
      botaoAcao("editar", f.id, "pencil", "Editar") +
      botaoAcao("historico", f.id, "clock", "Histórico") +
      (f.ativo ? botaoAcao("status", f.id, "circle-x", "Inativar") : botaoAcao("status", f.id, "rotate-ccw", "Reativar")) +
      "</div></td>" +
      "</tr>"
    );
  }

  function estadoVazio(colunas, resumo) {
    if (state.aba === "municipal" && state.ibge && resumo.totalCadastrados === 0) {
      return (
        '<tr><td colspan="' + colunas + '" class="row-empty-state"><div class="flex flex-col items-center gap-2">' +
        "<span>Nenhum feriado municipal cadastrado para " + D.esc(D.rotuloMunicipio(state.ibge)) + ".</span>" +
        '<span>Os feriados federais e estaduais (' + resumo.municipio.uf + ") continuam valendo para as empresas vinculadas a este município.</span>" +
        '<button type="button" class="btn-link link-info" id="btn-cadastrar-municipal">Cadastrar feriado municipal</button>' +
        "</div></td></tr>"
      );
    }
    return (
      '<tr><td colspan="' + colunas + '" class="row-empty-state"><div class="flex flex-col items-center gap-2">' +
      "<span>Nenhum feriado encontrado para os filtros selecionados em " + state.ano + ".</span>" +
      (filtrosAtivos() ? '<button type="button" id="btn-limpar-filtros" class="btn-link link-info">Limpar filtros</button>' : "") +
      "</div></td></tr>"
    );
  }

  function renderResumoMunicipio() {
    const alvo = document.getElementById("resumo-municipio");
    if (state.aba !== "municipal" || !state.ibge) {
      alvo.innerHTML = "";
      return null;
    }
    const r = D.resumoMunicipio(state.ibge, state.ano);
    const plural = (n, s, p) => n + " " + (n === 1 ? s : p);
    alvo.innerHTML =
      '<div class="card"><div class="card-content"><div class="detail-grid">' +
      '<div class="detail-field"><span class="detail-field-label">Município</span><span class="detail-field-value">' + D.esc(D.rotuloMunicipio(state.ibge)) + " / " + r.municipio.uf + "</span></div>" +
      '<div class="detail-field"><span class="detail-field-label">Feriados municipais em ' + state.ano + '</span><span class="detail-field-value">' + plural(r.municipais, "ativo", "ativos") + "</span></div>" +
      '<div class="detail-field"><span class="detail-field-label">Também se aplicam</span><span class="detail-field-value">' + plural(r.federais, "federal", "federais") + " · " + plural(r.estaduais, "estadual", "estaduais") + " (" + r.municipio.uf + ")</span></div>" +
      '<div class="detail-field"><span class="detail-field-label">Empresas vinculadas</span><span class="detail-field-value">' + r.empresas +
      '</span><span class="text-xs text-muted">Vínculo automático pelo código IBGE</span></div>' +
      "</div></div></div>";
    return r;
  }

  function renderAvisoAno() {
    const alvo = document.getElementById("aviso-ano");
    const escopo = D.getFeriados().filter((f) => f.abrangencia === state.aba && f.tipo === "movel" && (state.aba === "federal" || !state.uf || f.uf === state.uf) && (state.aba !== "municipal" || !state.ibge || f.ibge === state.ibge));
    const noAno = escopo.filter((f) => f.ano === state.ano).length;
    const emOutros = escopo.length - noAno;
    if (state.ano > D.ANO_PADRAO && noAno === 0 && emOutros > 0) {
      alvo.innerHTML =
        '<div class="alert alert-info">' + Icon("info", "size-4") +
        '<div class="alert-desc">Ainda não há feriados móveis cadastrados para ' + state.ano + ' neste filtro. Os fixos já aparecem automaticamente; use <b>Preparar ano seguinte</b> a partir de ' + (state.ano - 1) + " para informar as datas dos móveis.</div></div>";
    } else {
      alvo.innerHTML = "";
    }
  }

  function render() {
    document.querySelectorAll("#feriados-abas .tabs-trigger").forEach((t) => t.classList.toggle("is-active", t.getAttribute("data-aba") === state.aba));
    document.getElementById("grupo-f-uf").style.display = state.aba === "federal" ? "none" : "";
    document.getElementById("grupo-f-municipio").style.display = state.aba === "municipal" ? "" : "none";

    const lista = listaDoAno();
    const resumo = renderResumoMunicipio();
    renderAvisoAno();

    document.getElementById("tabela-feriados-head").innerHTML = cabecalho();
    const colunas = COLUNAS_FIXAS.antes.length + COLUNAS_FIXAS.depois.length + (colunaLocal() ? 1 : 0);
    document.getElementById("tabela-feriados-body").innerHTML = lista.length ? lista.map(linha).join("") : estadoVazio(colunas, resumo);
    document.getElementById("contagem-feriados").textContent = lista.length + (lista.length === 1 ? " feriado" : " feriados") + " em " + state.ano;

    const btnProximo = document.getElementById("btn-proximo-ano");
    const temProximo = state.ano < D.ANOS[D.ANOS.length - 1];
    btnProximo.innerHTML = Icon("calendar", "size-3-5") + " Preparar ano seguinte (" + (state.ano + 1) + ")";
    btnProximo.disabled = !temProximo;
    btnProximo.title = temProximo ? "" : "Não há ano seguinte disponível no protótipo";
  }

  // ===== Ações =====

  function toastAcao(f, acao) {
    const titulos = { criado: "Feriado criado", editado: "Feriado atualizado", inativado: "Feriado inativado", reativado: "Feriado reativado" };
    const complementos = {
      criado: " foi adicionado à Tabela de Feriados.",
      editado: " foi atualizado e a alteração ficou registrada no histórico.",
      inativado: " deixou de ser considerado pelos motores.",
      reativado: " voltou a ser considerado pelos motores.",
    };
    UI.showToast(titulos[acao], f.descricao + complementos[acao]);
  }

  function aposSalvar(f, acao) {
    state.aba = f.abrangencia;
    if (f.tipo === "movel" && f.ano !== state.ano) {
      state.ano = f.ano;
      selectAno.value = String(f.ano);
    }
    if (!passaFiltros(f)) limparFiltros();
    render();
    toastAcao(f, acao);
  }

  function aoClicarNaTabela(e) {
    const botao = e.target.closest("[data-acao]");
    if (botao) {
      const f = D.encontrar(Number(botao.getAttribute("data-id")));
      const acao = botao.getAttribute("data-acao");
      if (acao === "editar") FeriadoForm.abrir(f);
      else if (acao === "historico") FeriadoHistorico.abrir(f);
      else FeriadoForm.abrirStatus(f, (alterado, resultado) => {
        render();
        toastAcao(alterado, resultado);
      });
      return;
    }
    if (e.target.closest("#btn-limpar-filtros")) {
      limparFiltros();
      render();
    } else if (e.target.closest("#btn-cadastrar-municipal")) {
      abrirNovo();
    }
  }

  function abrirNovo() {
    FeriadoForm.abrir(null, state.aba, { uf: state.uf, ibge: state.aba === "municipal" ? state.ibge : "" });
  }

  // ===== Setup =====

  function init() {
    ensureToast();
    document.getElementById("icon-plus").innerHTML = Icon("plus", "size-3-5");
    document.querySelectorAll(".field-select-wrap .chev").forEach((el) => {
      if (!el.innerHTML) el.innerHTML = Icon("chevron-down", "size-4");
    });
    comboMunicipio.querySelector(".chev").innerHTML = Icon("chevron-down", "size-4");
    comboMunicipio.querySelector(".search-icon").innerHTML = Icon("search", "size-4");

    selectAno.innerHTML = D.ANOS.map((a) => '<option value="' + a + '">' + a + "</option>").join("");
    selectAno.value = String(state.ano);
    selectUf.innerHTML = '<option value="">Todas</option>' + D.UFS.map((uf) => '<option value="' + uf + '">' + uf + "</option>").join("");
    atualizarComboMunicipio();

    FeriadoForm.init({ onSalvo: aposSalvar });
    FeriadoHistorico.init();
    FeriadoProximoAno.init();

    document.querySelectorAll("#feriados-abas .tabs-trigger").forEach((t) =>
      t.addEventListener("click", () => {
        state.aba = t.getAttribute("data-aba");
        render();
      })
    );
    selectAno.addEventListener("change", (e) => {
      state.ano = Number(e.target.value);
      render();
    });
    document.getElementById("f-busca").addEventListener("input", (e) => {
      state.busca = e.target.value;
      render();
    });
    selectUf.addEventListener("change", (e) => {
      state.uf = e.target.value;
      const m = state.ibge ? D.municipio(state.ibge) : null;
      if (m && state.uf && m.uf !== state.uf) state.ibge = "";
      atualizarComboMunicipio();
      render();
    });
    UI.initToggleGroup(document.getElementById("f-tipo"), (valor) => {
      state.tipo = valor;
      render();
    });
    UI.initToggleGroup(document.getElementById("f-status"), (valor) => {
      state.status = valor;
      render();
    });
    document.getElementById("btn-novo-feriado").addEventListener("click", abrirNovo);
    document.getElementById("btn-proximo-ano").addEventListener("click", () =>
      FeriadoProximoAno.abrir({ aba: state.aba, ano: state.ano, uf: state.aba === "federal" ? "" : state.uf, ibge: state.aba === "municipal" ? state.ibge : "" }, (criados, ano) => {
        state.ano = ano;
        selectAno.value = String(ano);
        render();
        UI.showToast("Datas de " + ano + " salvas", criados + (criados === 1 ? " feriado móvel cadastrado" : " feriados móveis cadastrados") + " para " + ano + ".");
      })
    );
    document.getElementById("tabela-feriados").addEventListener("click", aoClicarNaTabela);

    render();
  }

  init();
})();
