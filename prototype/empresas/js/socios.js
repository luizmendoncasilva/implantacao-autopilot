/*
  Aba "Quadro societário" — portado de QuadroSocietarioCard.jsx + QuadroSocietarioDrawer.jsx
  + trecho de useEmpresas.js relativo a sócios (abrir/editar/desvincular participação).
*/
(function () {
  // Registro mestre de sócios (pessoa + participações) mora em
  // cadastros-auxiliares/js/socios/data.js — reutilizado aqui em vez de uma
  // cópia local.
  const D = window.SociosData;
  let empresaAtual = null;
  let editandoSocioId = null;
  let socioParaDesvincularId = null;
  let currentDataEntrada = "";
  let currentDataSaida = "";
  let entradaPicker = null;
  let saidaPicker = null;

  function participacoesDaEmpresa() {
    const socios = D.getSocios();
    return socios.flatMap((s) => s.participacoes.filter((p) => p.empresaCodigo === empresaAtual.codigo).map((p) => Object.assign({ socio: s }, p)));
  }

  // Junta entrada/saída num só rótulo de vínculo — consolida colunas sem
  // perder informação (decisão de UX).
  function vinculoLabel(part) {
    if (!part.dataEntrada) return "—";
    return part.dataSaida ? part.dataEntrada + " – " + part.dataSaida : "desde " + part.dataEntrada;
  }

  // Soma das participações ATIVAS (sem data de saída) — sinaliza visualmente
  // quando o quadro societário não fecha em 100%, sem impedir o cadastro
  // (apenas um alerta). Participações encerradas continuam aparecendo na
  // tabela (com o range de datas), mas não entram nesta soma — mesmo critério
  // de "vínculo ativo" usado em SociosData.participacoesAtivas().
  function participacaoTotal(linhas) {
    const soma = linhas.filter((part) => !part.dataSaida).reduce((total, part) => total + (Number(part.percentual) || 0), 0);
    return Math.round(soma * 100) / 100;
  }

  function formatarMoeda(valor) {
    return "R$ " + (Number(valor) || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // Campos da participação (vínculo sócio-empresa) rastreados no Histórico de
  // alterações — mesmos atributos editáveis no drawer de Adicionar/Editar
  // sócio (ver abrirDrawer/salvarParticipacao). "Sócio" em si fica de fora
  // porque, ao editar, não pode ser trocado (ver comentário em abrirDrawer);
  // a troca de sócio só acontece via desvincular + vincular, cada uma já
  // com seu próprio evento no histórico.
  const CAMPOS_PARTICIPACAO = [
    { key: "tipoSocio", label: "Tipo de sócio" },
    { key: "percentual", label: "Participação (%)", format: (v) => (v || v === 0 ? v + "%" : "—") },
    { key: "capitalIntegralizado", label: "Capital integralizado", format: formatarMoeda },
    { key: "capitalAIntegralizar", label: "Capital a integralizar", format: formatarMoeda },
    { key: "quotasIntegralizadas", label: "Quotas integralizadas", format: (v) => String(v || 0) },
    { key: "quotasAIntegralizar", label: "Quotas a integralizar", format: (v) => String(v || 0) },
    { key: "dataEntrada", label: "Data de entrada" },
    { key: "dataSaida", label: "Data de saída" },
  ];
  function normalizarValorCampo(v) {
    return v === undefined || v === null || v === "" ? null : v;
  }
  function formatarValorCampo(campo, valor) {
    if (campo.format) return campo.format(valor);
    return valor || valor === 0 ? String(valor) : "—";
  }
  // Compara a participação antes/depois do salvamento e devolve só os campos
  // que de fato mudaram — usado tanto para "Editar participação" (antes =
  // participação existente) quanto para "Adicionar sócio" (antes = null, ou
  // seja, todo campo preenchido conta como alteração).
  function diffParticipacao(antes, depois) {
    return CAMPOS_PARTICIPACAO.map((campo) => {
      const valorAntes = normalizarValorCampo(antes ? antes[campo.key] : null);
      const valorDepois = normalizarValorCampo(depois[campo.key]);
      if (valorAntes === valorDepois) return null;
      return { campo: campo.label, de: formatarValorCampo(campo, valorAntes), para: formatarValorCampo(campo, valorDepois) };
    }).filter(Boolean);
  }
  function registrarHistoricoSocio(alteracoes) {
    if (alteracoes.length) window.EmpresasData.registrarEventoHistorico(empresaAtual.codigo, alteracoes);
  }

  // "Total do capital" e "Total de quotas" são derivados (integralizado + a
  // integralizar) — não são campos próprios, para não duplicar dado que pode
  // ficar inconsistente. Mesmo conceito para capital e para quotas.
  function capitalTotal(part) {
    return (Number(part.capitalIntegralizado) || 0) + (Number(part.capitalAIntegralizar) || 0);
  }
  function quotasTotal(part) {
    return (Number(part.quotasIntegralizadas) || 0) + (Number(part.quotasAIntegralizar) || 0);
  }

  function renderTabela() {
    const linhas = participacoesDaEmpresa();
    const rows =
      linhas.length === 0
        ? '<tr><td colspan="8" class="row-empty-state">Nenhum sócio vinculado a esta empresa ainda.</td></tr>'
        : linhas
            .map(
              (part) =>
                "<tr>" +
                '<td><div class="flex flex-col gap-0-5 min-w-0">' + UI.truncatedCell(part.socio.nome, 170) + '<span class="text-xs text-muted">' + part.socio.cpf + "</span></div></td>" +
                '<td><div class="flex flex-col gap-0-5 min-w-0"><span>' + part.socio.telefone + "</span>" + UI.truncatedCell(part.socio.email, 200, "text-xs text-muted") + "</div></td>" +
                "<td>" + (part.tipoSocio || "—") + "</td>" +
                "<td>" + part.percentual + "%</td>" +
                '<td><div class="flex flex-col gap-0-5"><span>' + formatarMoeda(capitalTotal(part)) + '</span><span class="text-xs text-muted">' + formatarMoeda(part.capitalIntegralizado) + ' integralizado</span><span class="text-xs text-muted">' + formatarMoeda(part.capitalAIntegralizar) + " a integralizar</span></div></td>" +
                '<td><div class="flex flex-col gap-0-5"><span>' + quotasTotal(part) + '</span><span class="text-xs text-muted">' + (Number(part.quotasIntegralizadas) || 0) + ' integralizadas</span><span class="text-xs text-muted">' + (Number(part.quotasAIntegralizar) || 0) + " a integralizar</span></div></td>" +
                "<td>" + vinculoLabel(part) + "</td>" +
                '<td><div class="flex gap-3">' +
                '<button type="button" class="btn-link" data-editar="' + part.socio.id + '" style="color:var(--info-text);">editar</button>' +
                '<button type="button" class="btn-link" data-desvincular="' + part.socio.id + '" style="color:var(--destructive);">desvincular</button>' +
                "</div></td>" +
                "</tr>"
            )
            .join("");

    const total = participacaoTotal(linhas);
    const totalHtml =
      linhas.length === 0
        ? ""
        : total === 100
        ? '<div class="flex items-center justify-between text-xs text-muted" style="padding:0 4px;">' +
          "<span>Total de participação ativa vinculada</span><span>" + total + "%</span></div>"
        : '<div class="alert alert-warning gap-2">' +
          Icon("alert-triangle", "size-4") +
          '<div class="alert-desc">A soma das participações ativas é <b>' + total + "%</b> — revise os percentuais para totalizar 100%.</div></div>";

    document.getElementById("tab-content").innerHTML =
      '<div class="card gap-4">' +
      '<div class="card-header"><div class="flex items-center justify-between">' +
      '<div><div class="card-title">Quadro societário</div><div class="card-description">Participações vinculadas a esta empresa — referencia o registro unificado de sócios.</div></div>' +
      '<button type="button" class="btn btn-outline btn-sm" id="btn-add-socio">' + Icon("plus", "size-3-5") + " Adicionar sócio</button>" +
      "</div></div>" +
      '<div class="card-content flex flex-col gap-3"><div class="table-wrap"><table class="dtable">' +
      "<thead><tr><th>Sócio</th><th>Contato</th><th>Tipo de sócio</th><th>Participação</th><th>Capital</th><th>Quotas</th><th>Vínculo</th><th></th></tr></thead>" +
      "<tbody>" + rows + "</tbody></table></div>" + totalHtml + "</div>" +
      "</div>";

    document.getElementById("btn-add-socio").addEventListener("click", abrirAdicionar);
    document.querySelectorAll("[data-editar]").forEach((btn) =>
      btn.addEventListener("click", () => abrirEditar(Number(btn.getAttribute("data-editar"))))
    );
    document.querySelectorAll("[data-desvincular]").forEach((btn) =>
      btn.addEventListener("click", () => abrirConfirmacaoDesvinculo(Number(btn.getAttribute("data-desvincular"))))
    );
  }

  // "Desvincular" (não "excluir"): remove só a participação com a empresa
  // aberta. Excluir o cadastro do sócio em si é responsabilidade do Cadastro
  // de Sócios (ainda não implementado lá) — ver docs/03-cadastro-socios.md,
  // seção "Notas de implementação do protótipo".
  function abrirConfirmacaoDesvinculo(socioId) {
    const socio = D.getSocios().find((s) => s.id === socioId);
    socioParaDesvincularId = socioId;
    document.getElementById("qs-delete-description").textContent =
      "O vínculo de " + socio.nome + " com " + empresaAtual.nome + " será removido. O sócio continua cadastrado no registro unificado e mantém suas participações em outras empresas.";
    UI.openDialog(document.getElementById("qs-delete-overlay"));
  }

  function fecharConfirmacaoDesvinculo() {
    UI.closeDialog(document.getElementById("qs-delete-overlay"));
    socioParaDesvincularId = null;
  }

  function confirmarDesvinculo() {
    if (!socioParaDesvincularId) return;
    const socios = D.getSocios();
    const socio = socios.find((s) => s.id === socioParaDesvincularId);
    const atualizados = socios.map((s) =>
      s.id !== socioParaDesvincularId ? s : Object.assign({}, s, { participacoes: s.participacoes.filter((p) => p.empresaCodigo !== empresaAtual.codigo) })
    );
    D.setSocios(atualizados);
    registrarHistoricoSocio([{ campo: "Sócio desvinculado", de: socio.nome + " — " + socio.cpf, para: "—" }]);
    fecharConfirmacaoDesvinculo();
    renderTabela();
    UI.showToast("Vínculo removido", "A participação foi desvinculada de " + empresaAtual.nome + ".", "info");
  }

  function socioOptions() {
    const socios = D.getSocios();
    const disponiveis = socios.filter(
      (s) => !s.participacoes.some((p) => p.empresaCodigo === empresaAtual.codigo) || s.id === editandoSocioId
    );
    return disponiveis.map((s) => ({ value: String(s.id), label: s.nome + " — " + s.cpf }));
  }

  let currentSocioId = "";

  function atualizarBotaoSalvar() {
    const percentual = document.getElementById("qs-percentual").value;
    document.getElementById("qs-salvar").disabled = !(currentSocioId && percentual);
  }

  // Mantém "Total do capital"/"Total de quotas" (somas derivadas, sem input
  // próprio) sincronizados enquanto o usuário digita integralizado/a
  // integralizar — mesmo conceito de capitalTotal()/quotasTotal() da tabela.
  function atualizarTotaisDrawer() {
    const capitalIntegralizado = Number(document.getElementById("qs-capital-integralizado").value) || 0;
    const capitalAIntegralizar = Number(document.getElementById("qs-capital-a-integralizar").value) || 0;
    const quotasIntegralizadas = Number(document.getElementById("qs-quotas").value) || 0;
    const quotasAIntegralizar = Number(document.getElementById("qs-quotas-a-integralizar").value) || 0;
    document.getElementById("qs-capital-total").textContent = formatarMoeda(capitalIntegralizado + capitalAIntegralizar);
    document.getElementById("qs-quotas-total").textContent = String(quotasIntegralizadas + quotasAIntegralizar);
  }

  function abrirDrawer(titulo, form) {
    document.getElementById("qs-title").textContent = titulo;
    currentSocioId = form.socioId || "";
    document.getElementById("qs-percentual").value = form.percentual || "";
    document.getElementById("qs-capital-integralizado").value = form.capitalIntegralizado || "";
    document.getElementById("qs-capital-a-integralizar").value = form.capitalAIntegralizar || "";
    document.getElementById("qs-quotas").value = form.quotasIntegralizadas || "";
    document.getElementById("qs-quotas-a-integralizar").value = form.quotasAIntegralizar || "";
    document.getElementById("qs-tipo").value = form.tipoSocio || "";
    atualizarTotaisDrawer();
    currentDataEntrada = form.dataEntrada || "";
    currentDataSaida = form.dataSaida || "";
    entradaPicker.setValue(currentDataEntrada);
    saidaPicker.setValue(currentDataSaida);

    // Ao editar uma participação existente, o sócio não pode ser trocado —
    // só os atributos do vínculo (percentual, quotas, tipo, datas). Trocar de
    // pessoa é desvincular + adicionar o sócio correto, não "editar".
    const socioBloqueado = editandoSocioId !== null;
    document.querySelector("#qs-combobox .combobox-trigger").disabled = socioBloqueado;
    document.getElementById("qs-socio-lock-hint").style.display = socioBloqueado ? "" : "none";

    UI.initCombobox(document.getElementById("qs-combobox"), socioOptions(), currentSocioId, (value) => {
      currentSocioId = value;
      atualizarBotaoSalvar();
    });
    atualizarBotaoSalvar();
    UI.openSheet(document.getElementById("qs-overlay"), document.getElementById("qs-panel"));
  }

  function abrirAdicionar() {
    editandoSocioId = null;
    abrirDrawer("Adicionar sócio", {
      socioId: "", percentual: "",
      capitalIntegralizado: "", capitalAIntegralizar: "",
      quotasIntegralizadas: "", quotasAIntegralizar: "",
      tipoSocio: "", dataEntrada: "", dataSaida: "",
    });
  }

  function abrirEditar(socioId) {
    const socios = D.getSocios();
    const socio = socios.find((s) => s.id === socioId);
    const part = socio.participacoes.find((p) => p.empresaCodigo === empresaAtual.codigo);
    editandoSocioId = socioId;
    abrirDrawer("Editar participação", {
      socioId: String(socioId),
      percentual: String(part.percentual),
      capitalIntegralizado: String(part.capitalIntegralizado || 0),
      capitalAIntegralizar: String(part.capitalAIntegralizar || 0),
      quotasIntegralizadas: String(part.quotasIntegralizadas),
      quotasAIntegralizar: String(part.quotasAIntegralizar || 0),
      tipoSocio: part.tipoSocio || "",
      dataEntrada: part.dataEntrada || "",
      dataSaida: part.dataSaida || "",
    });
  }

  function fecharDrawer() {
    UI.closeSheet(document.getElementById("qs-overlay"), document.getElementById("qs-panel"));
  }

  function salvarParticipacao() {
    if (!currentSocioId) return;
    const percentual = Number(document.getElementById("qs-percentual").value) || 0;
    const capitalIntegralizado = Number(document.getElementById("qs-capital-integralizado").value) || 0;
    const capitalAIntegralizar = Number(document.getElementById("qs-capital-a-integralizar").value) || 0;
    const quotasIntegralizadas = Number(document.getElementById("qs-quotas").value) || 0;
    const quotasAIntegralizar = Number(document.getElementById("qs-quotas-a-integralizar").value) || 0;
    const tipoSocio = document.getElementById("qs-tipo").value || null;
    const dataEntrada = currentDataEntrada || null;
    const dataSaida = currentDataSaida || null;

    const socios = D.getSocios();
    const socioSelecionado = socios.find((s) => String(s.id) === currentSocioId);
    const participacaoAnterior = editandoSocioId
      ? socioSelecionado.participacoes.find((p) => p.empresaCodigo === empresaAtual.codigo)
      : null;
    const atualizados = socios.map((s) => {
      const participaDestaEmpresa = s.participacoes.some((p) => p.empresaCodigo === empresaAtual.codigo);
      if (String(s.id) === currentSocioId) {
        const outras = s.participacoes.filter((p) => p.empresaCodigo !== empresaAtual.codigo);
        return Object.assign({}, s, {
          participacoes: outras.concat([{
            empresaCodigo: empresaAtual.codigo, percentual,
            capitalIntegralizado, capitalAIntegralizar,
            quotasIntegralizadas, quotasAIntegralizar,
            tipoSocio, dataEntrada, dataSaida,
          }]),
        });
      }
      if (editandoSocioId && s.id === editandoSocioId && participaDestaEmpresa) {
        return Object.assign({}, s, { participacoes: s.participacoes.filter((p) => p.empresaCodigo !== empresaAtual.codigo) });
      }
      return s;
    });
    D.setSocios(atualizados);

    const participacaoNova = { tipoSocio, percentual, capitalIntegralizado, capitalAIntegralizar, quotasIntegralizadas, quotasAIntegralizar, dataEntrada, dataSaida };
    const alteracoes = editandoSocioId
      ? diffParticipacao(participacaoAnterior, participacaoNova)
      : [{ campo: "Sócio vinculado", de: "—", para: socioSelecionado.nome + " — " + socioSelecionado.cpf }].concat(diffParticipacao(null, participacaoNova));
    registrarHistoricoSocio(alteracoes);

    fecharDrawer();
    renderTabela();
    UI.showToast("Sócio salvo", "A participação foi atualizada para " + empresaAtual.nome + ".");
  }

  window.renderTabContent = function (empresa) {
    empresaAtual = empresa;
    renderTabela();

    document.getElementById("qs-close").innerHTML = Icon("x", "size-4");
    document.querySelector("#qs-combobox .chev").innerHTML = Icon("chevron-down", "size-4");
    document.querySelector("#qs-combobox .search-icon").innerHTML = Icon("search", "size-4");
    document.querySelectorAll("#qs-panel .field-select-wrap .chev").forEach((el) => (el.innerHTML = Icon("chevron-down", "size-4")));
    document.getElementById("qs-delete-close").innerHTML = Icon("x", "size-4");
    document.querySelectorAll("#qs-panel .date-picker-icon").forEach((el) => (el.innerHTML = Icon("calendar", "size-4")));
    document.querySelectorAll('#qs-panel .date-picker-nav-btn[data-nav="prev"]').forEach((el) => (el.innerHTML = Icon("chevron-left", "size-4")));
    document.querySelectorAll('#qs-panel .date-picker-nav-btn[data-nav="next"]').forEach((el) => (el.innerHTML = Icon("chevron-right", "size-4")));

    document.getElementById("qs-overlay").addEventListener("click", fecharDrawer);
    document.getElementById("qs-close").addEventListener("click", fecharDrawer);
    document.getElementById("qs-cancelar").addEventListener("click", fecharDrawer);
    document.getElementById("qs-salvar").addEventListener("click", salvarParticipacao);
    document.getElementById("qs-percentual").addEventListener("input", atualizarBotaoSalvar);
    document.getElementById("qs-capital-integralizado").addEventListener("input", atualizarTotaisDrawer);
    document.getElementById("qs-capital-a-integralizar").addEventListener("input", atualizarTotaisDrawer);
    document.getElementById("qs-quotas").addEventListener("input", atualizarTotaisDrawer);
    document.getElementById("qs-quotas-a-integralizar").addEventListener("input", atualizarTotaisDrawer);

    entradaPicker = UI.initDatePicker(document.getElementById("qs-entrada-picker"), (valor) => {
      currentDataEntrada = valor || "";
    });
    saidaPicker = UI.initDatePicker(document.getElementById("qs-saida-picker"), (valor) => {
      currentDataSaida = valor || "";
    });

    const deleteOverlay = document.getElementById("qs-delete-overlay");
    document.getElementById("qs-delete-close").addEventListener("click", fecharConfirmacaoDesvinculo);
    document.getElementById("qs-delete-cancel").addEventListener("click", fecharConfirmacaoDesvinculo);
    document.getElementById("qs-delete-confirm").addEventListener("click", confirmarDesvinculo);
    deleteOverlay.addEventListener("click", (e) => {
      if (e.target === deleteOverlay) fecharConfirmacaoDesvinculo();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && deleteOverlay.classList.contains("is-open")) fecharConfirmacaoDesvinculo();
    });
  };
})();
