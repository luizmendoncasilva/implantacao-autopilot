/*
  Painel lateral de novo/editar feriado (o mesmo para incluir e editar) e
  dialog de inativar/reativar. A abrangência vem da aba atual e fica
  bloqueada na edição; o motivo da alteração só existe na edição e vai para o
  histórico. Duplicidade: mesma data + mesma abrangência + mesmo local.
*/
(function (global) {
  const D = global.FeriadosData;

  const overlay = document.getElementById("fer-overlay");
  const panel = document.getElementById("fer-panel");
  const campoUf = document.getElementById("fer-uf");
  const campoDescricao = document.getElementById("fer-descricao");
  const campoDia = document.getElementById("fer-dia");
  const campoMes = document.getElementById("fer-mes");
  const campoObs = document.getElementById("fer-obs");
  const campoMotivo = document.getElementById("fer-motivo");
  const erroEl = document.getElementById("fer-duplicidade");
  const btnSalvar = document.getElementById("fer-salvar");
  const comboMunicipio = document.getElementById("fer-municipio");
  const grupoAbrangencia = document.getElementById("fer-abrangencia");
  const grupoTipo = document.getElementById("fer-tipo");

  const TIPO_HINT = {
    fixo: "Só dia e mês — vale para todos os anos (ex.: 21/04).",
    movel: "Data completa, com ano — precisa ser mantido a cada ano (Carnaval, Corpus Christi, feriado decretado).",
  };

  let onSalvo = function () {};
  let editando = null;
  let picker = null;
  const valores = { abrangencia: "federal", tipo: "fixo", ibge: "", dataMovel: null };

  function setToggle(root, valor) {
    root.querySelectorAll(".toggle-item").forEach((item) => item.classList.toggle("is-on", item.getAttribute("data-value") === valor));
  }

  function opcoesSelect(placeholder, itens) {
    return '<option value="">' + placeholder + "</option>" + itens.map((i) => '<option value="' + i.value + '">' + i.label + "</option>").join("");
  }

  function atualizarMunicipios(uf, selecionado) {
    valores.ibge = selecionado || "";
    const opcoes = D.municipiosDaUf(uf).map((m) => ({ value: m.ibge, label: m.ibge + " – " + m.nome }));
    UI.initCombobox(comboMunicipio, opcoes, valores.ibge, (valor) => {
      valores.ibge = valor;
      validar();
    });
    comboMunicipio.querySelector(".combobox-trigger").disabled = !uf;
  }

  function atualizarVisibilidade() {
    document.getElementById("fer-grupo-uf").style.display = valores.abrangencia === "federal" ? "none" : "";
    document.getElementById("fer-grupo-municipio").style.display = valores.abrangencia === "municipal" ? "" : "none";
    document.getElementById("fer-grupo-fixo").style.display = valores.tipo === "fixo" ? "" : "none";
    document.getElementById("fer-grupo-movel").style.display = valores.tipo === "movel" ? "" : "none";
    document.getElementById("fer-grupo-motivo").style.display = editando ? "" : "none";
    document.getElementById("fer-tipo-hint").textContent = TIPO_HINT[valores.tipo];
  }

  function coletar() {
    let dia = null;
    let mes = null;
    let ano = null;
    if (valores.tipo === "fixo") {
      dia = Number(campoDia.value) || null;
      mes = Number(campoMes.value) || null;
    } else {
      const partes = D.dataBrParaPartes(valores.dataMovel);
      if (partes) {
        dia = partes.dia;
        mes = partes.mes;
        ano = partes.ano;
      }
    }
    return {
      abrangencia: valores.abrangencia,
      uf: campoUf.value || null,
      ibge: valores.ibge || null,
      descricao: campoDescricao.value,
      tipo: valores.tipo,
      dia,
      mes,
      ano,
      obs: campoObs.value,
    };
  }

  function descricaoLocal(f) {
    if (f.abrangencia === "federal") return "a abrangência Federal";
    if (f.abrangencia === "estadual") return "a UF " + f.uf;
    return D.rotuloMunicipio(f.ibge);
  }

  function validar() {
    const d = coletar();
    const localOk = d.abrangencia === "federal" || (!!d.uf && (d.abrangencia === "estadual" || !!d.ibge));
    const dataOk = !!d.dia && !!d.mes && (d.tipo === "fixo" || !!d.ano);
    let erro = "";
    if (d.tipo === "fixo" && d.dia && d.mes && d.dia > D.DIAS_NO_MES[d.mes - 1]) {
      erro = "O dia informado não existe nesse mês.";
    } else if (localOk && dataOk) {
      const dup = D.buscarDuplicidade(d, editando ? editando.id : null);
      if (dup) {
        erro =
          "Já existe um feriado nesta data para " + descricaoLocal(dup) + ": " + dup.descricao + " (" + D.formatarDataFeriado(dup) + ")." +
          (dup.ativo ? "" : " Ele está inativo — reative-o em vez de cadastrar de novo.");
      }
    }
    erroEl.textContent = erro;
    erroEl.style.display = erro ? "" : "none";

    let pronto = d.descricao.trim().length > 0 && localOk && dataOk && !erro;
    if (pronto && editando) {
      const candidato = Object.assign({}, editando, D.normalizarDados(d));
      pronto = D.diferencas(editando, candidato).length > 0 && campoMotivo.value.trim().length > 0;
    }
    btnSalvar.disabled = !pronto;
  }

  // contexto (só no novo): UF / município já filtrados na tela, para pré-selecionar.
  function abrir(feriado, abrangenciaPadrao, contexto) {
    editando = feriado || null;
    valores.abrangencia = feriado ? feriado.abrangencia : abrangenciaPadrao || "federal";
    valores.tipo = feriado ? feriado.tipo : "fixo";
    valores.dataMovel = feriado && feriado.tipo === "movel" ? D.formatarDataFeriado(feriado) : null;

    document.getElementById("fer-title").textContent = feriado ? "Editar feriado" : "Novo feriado";
    document.getElementById("fer-description").textContent = feriado
      ? "Toda alteração fica registrada no histórico com o motivo informado."
      : "Cadastro manual na Tabela de Feriados. A empresa é vinculada automaticamente pelo código IBGE do município.";

    setToggle(grupoAbrangencia, valores.abrangencia);
    grupoAbrangencia.style.display = feriado ? "none" : "";
    const travada = document.getElementById("fer-abrangencia-travada");
    travada.style.display = feriado ? "" : "none";
    travada.innerHTML = Icon("lock", "size-4") + "<span>" + D.ABRANGENCIAS[valores.abrangencia] + " — não pode ser alterada na edição.</span>";

    const ctx = !feriado && contexto ? contexto : {};
    campoUf.value = feriado ? feriado.uf || "" : ctx.uf || "";
    atualizarMunicipios(campoUf.value, feriado ? feriado.ibge : ctx.ibge || "");
    campoDescricao.value = feriado ? feriado.descricao : "";
    setToggle(grupoTipo, valores.tipo);
    campoDia.value = feriado ? String(feriado.dia) : "";
    campoMes.value = feriado ? String(feriado.mes) : "";
    picker.setValue(valores.dataMovel);
    campoObs.value = feriado ? feriado.obs : "";
    campoMotivo.value = "";

    atualizarVisibilidade();
    validar();
    UI.openSheet(overlay, panel);
  }

  function fechar() {
    UI.closeSheet(overlay, panel);
  }

  function salvar() {
    const dados = coletar();
    const salvo = editando ? D.editar(editando.id, dados, campoMotivo.value.trim()) : D.criar(dados, "Cadastro manual");
    const acao = editando ? "editado" : "criado";
    fechar();
    onSalvo(salvo, acao);
  }

  // ===== Dialog de inativar/reativar =====

  const statusOverlay = document.getElementById("status-overlay");
  const statusMotivo = document.getElementById("status-motivo");
  const statusConfirmar = document.getElementById("status-confirmar");
  let statusAlvo = null;
  let statusCallback = function () {};

  function abrirStatus(feriado, callback) {
    statusAlvo = feriado;
    statusCallback = callback;
    const reativar = !feriado.ativo;
    document.getElementById("status-title").textContent = reativar ? "Reativar feriado?" : "Inativar feriado?";
    document.getElementById("status-description").textContent = reativar
      ? feriado.descricao + " (" + D.formatarDataFeriado(feriado) + ") volta a ser considerado pelos motores de DP, Fiscal e Contábil."
      : feriado.descricao + " (" + D.formatarDataFeriado(feriado) + ") deixa de ser considerado pelos motores de DP, Fiscal e Contábil. O histórico é preservado e o feriado pode ser reativado.";
    statusConfirmar.textContent = reativar ? "Reativar" : "Inativar";
    statusConfirmar.classList.toggle("btn-destructive", !reativar);
    statusMotivo.value = "";
    statusConfirmar.disabled = true;
    UI.openDialog(statusOverlay);
    statusMotivo.focus();
  }

  function fecharStatus() {
    UI.closeDialog(statusOverlay);
  }

  function confirmarStatus() {
    const reativar = !statusAlvo.ativo;
    const f = D.alterarStatus(statusAlvo.id, reativar, statusMotivo.value.trim());
    fecharStatus();
    statusCallback(f, reativar ? "reativado" : "inativado");
  }

  // ===== Setup =====

  function init(callbacks) {
    onSalvo = callbacks.onSalvo;

    campoUf.innerHTML = opcoesSelect("Selecione a UF", D.UFS.map((uf) => ({ value: uf, label: uf })));
    campoDia.innerHTML = opcoesSelect("Dia", Array.from({ length: 31 }, (_, i) => ({ value: i + 1, label: i + 1 })));
    campoMes.innerHTML = opcoesSelect("Mês", D.MESES.map((nome, i) => ({ value: i + 1, label: nome })));

    document.getElementById("fer-close").innerHTML = Icon("x", "size-4");
    document.getElementById("status-close").innerHTML = Icon("x", "size-4");
    panel.querySelectorAll(".field-select-wrap .chev").forEach((el) => (el.innerHTML = Icon("chevron-down", "size-4")));
    comboMunicipio.querySelector(".chev").innerHTML = Icon("chevron-down", "size-4");
    comboMunicipio.querySelector(".search-icon").innerHTML = Icon("search", "size-4");
    panel.querySelector(".date-picker-icon").innerHTML = Icon("calendar", "size-4");
    panel.querySelector('.date-picker-nav-btn[data-nav="prev"]').innerHTML = Icon("chevron-left", "size-4");
    panel.querySelector('.date-picker-nav-btn[data-nav="next"]').innerHTML = Icon("chevron-right", "size-4");

    UI.initToggleGroup(grupoAbrangencia, (valor) => {
      valores.abrangencia = valor;
      if (valor === "municipal") atualizarMunicipios(campoUf.value, "");
      atualizarVisibilidade();
      validar();
    });
    UI.initToggleGroup(grupoTipo, (valor) => {
      valores.tipo = valor;
      atualizarVisibilidade();
      validar();
    });
    picker = UI.initDatePicker(document.getElementById("fer-data-picker"), (dataBr) => {
      valores.dataMovel = dataBr;
      validar();
    });

    campoUf.addEventListener("change", () => {
      atualizarMunicipios(campoUf.value, "");
      validar();
    });
    [campoDescricao, campoObs, campoMotivo].forEach((el) => el.addEventListener("input", validar));
    [campoDia, campoMes].forEach((el) => el.addEventListener("change", validar));

    document.getElementById("fer-close").addEventListener("click", fechar);
    document.getElementById("fer-cancelar").addEventListener("click", fechar);
    overlay.addEventListener("click", fechar);
    btnSalvar.addEventListener("click", salvar);

    statusMotivo.addEventListener("input", () => (statusConfirmar.disabled = statusMotivo.value.trim().length === 0));
    document.getElementById("status-close").addEventListener("click", fecharStatus);
    document.getElementById("status-cancelar").addEventListener("click", fecharStatus);
    statusConfirmar.addEventListener("click", confirmarStatus);
    statusOverlay.addEventListener("click", (e) => {
      if (e.target === statusOverlay) fecharStatus();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      if (statusOverlay.classList.contains("is-open")) fecharStatus();
      else if (panel.classList.contains("is-open")) fechar();
    });
  }

  global.FeriadoForm = { init, abrir, abrirStatus };
})(window);
