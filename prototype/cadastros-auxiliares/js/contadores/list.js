/*
  Listagem de contadores + drawer de novo/editar — mesmo padrão de
  js/socios/list.js (linha inteira clicável, drawer sempre editável, sem
  alternância visualizar/editar).
*/
(function () {
  const D = window.ContadoresData;
  const E = window.EmpresasData;

  const state = { nome: "", cpf: "" };
  let contadorAtualId = null;

  function apenasDigitos(v) {
    return (v || "").replace(/\D/g, "");
  }

  // ===== Listagem =====

  function contadorCorrespondeAosFiltros(contador) {
    const nome = state.nome.trim().toLowerCase();
    const cpf = apenasDigitos(state.cpf);
    const nomeOk = !nome || contador.nome.toLowerCase().includes(nome);
    const cpfOk = !cpf || apenasDigitos(contador.cpf).includes(cpf);
    return nomeOk && cpfOk;
  }

  function empresasVinculadasHtml(contador) {
    const qtd = (contador.empresasAtendidas || []).length;
    if (qtd === 0) return '<span class="text-sm text-muted">Nenhuma empresa</span>';
    return '<span class="badge badge-secondary">' + qtd + (qtd === 1 ? " empresa" : " empresas") + "</span>";
  }

  function rowHtml(contador) {
    return (
      '<tr class="row-clickable" data-abrir="' + contador.id + '">' +
      "<td>" + UI.truncatedCell(contador.nome, null, "text-sm font-medium") + "</td>" +
      '<td class="col-pad-md">' + contador.cpf + "</td>" +
      '<td class="col-pad-md">' + contador.crc + "</td>" +
      '<td class="col-pad-md">' + empresasVinculadasHtml(contador) + "</td>" +
      '<td class="col-pad-end">' + Icon("arrow-right", "size-4") + "</td>" +
      "</tr>"
    );
  }

  function render() {
    const contadores = D.getContadores();
    const filtrados = contadores.filter(contadorCorrespondeAosFiltros).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" }));
    const filtrosAtivos = state.nome.trim() !== "" || state.cpf.trim() !== "";

    let html;
    if (filtrados.length === 0) {
      html =
        '<tr><td colspan="5" class="row-empty-state"><div class="flex flex-col items-center gap-2">' +
        "<span>Nenhum contador encontrado para os filtros selecionados.</span>" +
        (filtrosAtivos ? '<button type="button" id="btn-limpar-filtros" class="btn-link link-info">Limpar filtros</button>' : "") +
        "</div></td></tr>";
    } else {
      html = filtrados.map(rowHtml).join("");
    }

    document.getElementById("tabela-contadores-body").innerHTML = html;
    wireRowEvents();
  }

  function wireRowEvents() {
    document.querySelectorAll("[data-abrir]").forEach((el) => {
      el.addEventListener("click", () => abrirDrawer(encontrarContador(el.getAttribute("data-abrir"))));
      el.setAttribute("tabindex", "0");
      el.setAttribute("role", "button");
      el.addEventListener("keydown", (e) => {
        if (e.target !== el) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          abrirDrawer(encontrarContador(el.getAttribute("data-abrir")));
        }
      });
    });
    const btnLimpar = document.getElementById("btn-limpar-filtros");
    if (btnLimpar) {
      btnLimpar.addEventListener("click", () => {
        state.nome = "";
        state.cpf = "";
        document.getElementById("f-nome").value = "";
        document.getElementById("f-cpf").value = "";
        render();
      });
    }
  }

  function encontrarContador(id) {
    return D.getContadores().find((c) => c.id === Number(id));
  }

  // ===== Drawer (novo / editar-e-visualizar) =====

  const campoNome = document.getElementById("contador-nome");
  const campoCpf = document.getElementById("contador-cpf");
  const campoCrc = document.getElementById("contador-crc");
  const cpfErro = document.getElementById("contador-cpf-erro");
  const btnSalvar = document.getElementById("contador-salvar");
  const overlay = document.getElementById("contador-overlay");
  const panel = document.getElementById("contador-panel");

  function preencherCampos(contador) {
    campoNome.value = contador ? contador.nome : "";
    campoCpf.value = contador ? contador.cpf : "";
    campoCrc.value = contador ? contador.crc : "";
  }

  // Cada empresa atendida vira um link real para o cadastro da empresa (aba
  // Dados gerais, de onde as demais abas ficam a um clique) — mesmo padrão
  // usado em "Empresas vinculadas" do Cadastro de Sócios.
  function empresaVinculoRowHtml(codigoEmpresa) {
    const empresa = E.findEmpresaByCodigo(codigoEmpresa);
    const nomeEmpresa = empresa ? empresa.nome : codigoEmpresa;
    return (
      '<div class="list-row">' +
      '<div class="flex flex-col gap-0-5 min-w-0">' +
      '<span class="text-sm font-medium truncate">' + nomeEmpresa + "</span>" +
      "</div>" +
      (empresa
        ? '<a href="../empresas/dados-gerais.html?empresa=' + encodeURIComponent(empresa.codigo) + '" class="flex items-center gap-1 text-xs font-medium link-info shrink-0">Abrir cadastro ' + Icon("arrow-up-right", "size-3-5") + "</a>"
        : "") +
      "</div>"
    );
  }

  function mostrarEmpresasVinculadas(contador) {
    const grupo = document.getElementById("contador-grupo-empresas");
    if (!contador) {
      grupo.style.display = "none";
      return;
    }
    grupo.style.display = "";
    const empresas = contador.empresasAtendidas || [];
    document.getElementById("contador-empresas-lista").innerHTML =
      empresas.length === 0 ? '<span class="text-sm text-muted">Nenhuma empresa vinculada</span>' : empresas.map(empresaVinculoRowHtml).join("");
  }

  function validar() {
    const nomeOk = campoNome.value.trim().length > 0;
    const digitosCpf = campoCpf.value.replace(/\D/g, "");
    const cpfCompleto = digitosCpf.length === 11;
    const cpfDuplicado = cpfCompleto && D.cpfJaCadastrado(campoCpf.value, contadorAtualId);
    const crcOk = campoCrc.value.trim().length > 0;
    cpfErro.style.display = cpfDuplicado ? "" : "none";
    btnSalvar.disabled = !(nomeOk && cpfCompleto && !cpfDuplicado && crcOk);
  }

  function abrirDrawer(contador) {
    contadorAtualId = contador ? contador.id : null;
    document.getElementById("contador-title").textContent = contador ? contador.nome : "Novo contador";
    preencherCampos(contador);
    mostrarEmpresasVinculadas(contador);
    cpfErro.style.display = "none";
    validar();
    UI.openSheet(overlay, panel);
  }

  function fecharDrawer() {
    UI.closeSheet(overlay, panel);
  }

  function salvar() {
    const contadores = D.getContadores();
    if (contadorAtualId) {
      const atualizados = contadores.map((c) =>
        c.id !== contadorAtualId
          ? c
          : Object.assign({}, c, {
              nome: campoNome.value.trim(),
              cpf: campoCpf.value,
              crc: campoCrc.value.trim(),
            })
      );
      D.setContadores(atualizados);
      fecharDrawer();
      render();
      UI.showToast("Contador atualizado", campoNome.value.trim() + " foi atualizado com sucesso.");
    } else {
      const novoId = contadores.reduce((max, c) => Math.max(max, c.id), 0) + 1;
      contadores.push({
        id: novoId,
        nome: campoNome.value.trim(),
        cpf: campoCpf.value,
        crc: campoCrc.value.trim(),
        empresasAtendidas: [],
      });
      D.setContadores(contadores);
      fecharDrawer();
      render();
      UI.showToast("Contador cadastrado", campoNome.value.trim() + " foi adicionado ao Registro de Contadores.");
    }
  }

  // ===== Setup =====

  D.ensureToast();
  document.getElementById("icon-plus").innerHTML = Icon("plus", "size-3-5");
  document.getElementById("contador-close").innerHTML = Icon("x", "size-4");

  document.getElementById("btn-novo-contador").addEventListener("click", () => abrirDrawer(null));
  document.getElementById("contador-close").addEventListener("click", fecharDrawer);
  document.getElementById("contador-cancelar").addEventListener("click", fecharDrawer);
  overlay.addEventListener("click", fecharDrawer);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && panel.classList.contains("is-open")) fecharDrawer();
  });
  document.getElementById("contador-salvar").addEventListener("click", salvar);
  campoNome.addEventListener("input", validar);
  campoCrc.addEventListener("input", validar);
  campoCpf.addEventListener("input", (e) => {
    e.target.value = D.formatarCpfInput(e.target.value);
    validar();
  });

  document.getElementById("f-nome").addEventListener("input", (e) => {
    state.nome = e.target.value;
    render();
  });
  document.getElementById("f-cpf").addEventListener("input", (e) => {
    e.target.value = D.formatarCpfInput(e.target.value);
    state.cpf = e.target.value;
    render();
  });

  render();
})();
