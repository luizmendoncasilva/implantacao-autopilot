/*
  Drawer de cadastro de Sindicato — compartilhado entre a Listagem ("Novo
  sindicato") e a Tela do Sindicato ("Editar"). Mesmo princípio já aplicado a
  dados editáveis a partir do próprio contexto em Empresas (ex.: Quadro
  Societário): o Drawer é injetado uma única vez no <body> (mesmo padrão de
  "ensureToast" já usado no protótipo) e reaproveitado nos dois fluxos —
  criação com formulário vazio, edição com o formulário preenchido — para que
  o usuário reconheça que está trabalhando com o mesmo cadastro, só que em
  estados diferentes. Largura, campos e composição são os do Drawer de "Novo
  sindicato" já refinado (.sheet-panel-wide + .sheet-row).
*/
(function (global) {
  const D = window.SindicatosData;

  // CEP, Cidade e UF ficam com o componente de endereço (shared/js/endereco-cep.js).
  const CAMPOS_OBRIGATORIOS = ["sind-nome", "sind-endereco", "sind-numero", "sind-bairro", "sind-cnpj", "sind-tipo", "sind-cnes"];
  const CAMPOS_TEXTO = ["sind-nome", "sind-endereco", "sind-numero", "sind-complemento", "sind-bairro", "sind-telefone", "sind-fax", "sind-site", "sind-email", "sind-cnpj", "sind-cnes"];

  let editandoCodigo = null; // null = modo criação
  let onSalvoCallback = null;
  let endereco = null;

  function ensureToast() {
    if (document.getElementById("toast")) return;
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.id = "toast";
    toast.innerHTML = '<span class="toast-icon"></span><div class="flex flex-col gap-0-5"><span class="toast-title"></span><span class="toast-desc"></span></div>';
    document.body.appendChild(toast);
  }

  function sheetMarkup() {
    return (
      '<div class="sheet-overlay" id="sind-overlay"></div>' +
      '<div class="sheet-panel sheet-panel-wide" id="sind-panel" role="dialog" aria-modal="true" aria-labelledby="sind-title">' +
      '<button type="button" class="sheet-close" id="sind-close"></button>' +
      '<div class="sheet-header">' +
      '<div class="sheet-title" id="sind-title">Novo sindicato</div>' +
      '<div class="sheet-description" id="sind-description">Cadastro-base da entidade sindical à qual as convenções coletivas ficarão vinculadas.</div>' +
      "</div>" +
      '<div class="sheet-body">' +
      '<div class="sheet-field"><label class="field-label" for="sind-nome">Nome (Razão Social) <span class="text-muted">*</span></label><input id="sind-nome" class="field-input" placeholder="Nome completo do sindicato" /></div>' +
      '<div class="sheet-field"><label class="field-label" for="sind-cep">CEP <span class="text-muted">*</span></label><input id="sind-cep" class="field-input" placeholder="00.000-000" inputmode="numeric" /><span class="text-xs text-muted" id="sind-cep-status"></span></div>' +
      '<div class="sheet-row">' +
      '<div class="sheet-field"><label class="field-label">Cidade <span class="text-muted">*</span></label>' +
      '<div class="combobox" id="sind-cidade" data-empty-text="Nenhum município encontrado para esta UF.">' +
      '<button type="button" class="combobox-trigger"><span class="combobox-label truncate">Selecione o município</span><span class="chev"></span></button>' +
      '<div class="combobox-panel"><div class="combobox-search"><span class="search-icon"></span><input type="text" placeholder="Buscar município..." /></div><div class="combobox-list"></div></div>' +
      "</div></div>" +
      '<div class="sheet-field sheet-field-fixed" style="width:100px;"><label class="field-label" for="sind-uf">Estado (UF) <span class="text-muted">*</span></label><div class="field-select-wrap"><select id="sind-uf" class="field-select"></select><span class="chev"></span></div></div>' +
      "</div>" +
      '<div class="sheet-field"><label class="field-label" for="sind-endereco">Endereço <span class="text-muted">*</span></label><input id="sind-endereco" class="field-input" placeholder="Rua/avenida" /></div>' +
      '<div class="sheet-row">' +
      '<div class="sheet-field"><label class="field-label" for="sind-numero">Número <span class="text-muted">*</span></label><input id="sind-numero" class="field-input" /></div>' +
      '<div class="sheet-field"><label class="field-label" for="sind-complemento">Complemento</label><input id="sind-complemento" class="field-input" /></div>' +
      "</div>" +
      '<div class="sheet-field"><label class="field-label" for="sind-bairro">Bairro <span class="text-muted">*</span></label><input id="sind-bairro" class="field-input" /></div>' +
      '<div class="sheet-row">' +
      '<div class="sheet-field"><label class="field-label" for="sind-telefone">Telefone</label><input id="sind-telefone" class="field-input" /></div>' +
      '<div class="sheet-field"><label class="field-label" for="sind-fax">Fax</label><input id="sind-fax" class="field-input" /></div>' +
      "</div>" +
      '<div class="sheet-row">' +
      '<div class="sheet-field"><label class="field-label" for="sind-site">Página na internet</label><input id="sind-site" class="field-input" /></div>' +
      '<div class="sheet-field"><label class="field-label" for="sind-email">E-mail</label><input id="sind-email" class="field-input" type="email" /></div>' +
      "</div>" +
      '<div class="sheet-field"><label class="field-label" for="sind-cnpj">CNPJ <span class="text-muted">*</span></label><input id="sind-cnpj" class="field-input" placeholder="00.000.000/0000-00" /></div>' +
      '<div class="sheet-field"><label class="field-label" for="sind-tipo">Tipo da entidade <span class="text-muted">*</span></label><div class="field-select-wrap"><select id="sind-tipo" class="field-select"><option value="">Selecione...</option></select><span class="chev"></span></div></div>' +
      '<div class="sheet-field"><label class="field-label" for="sind-cnes">Código da entidade (CNES) <span class="text-muted">*</span></label><input id="sind-cnes" class="field-input" /></div>' +
      "</div>" +
      '<div class="sheet-footer">' +
      '<button type="button" class="btn btn-outline" id="sind-cancelar">Cancelar</button>' +
      '<button type="button" class="btn" id="sind-salvar" disabled></button>' +
      "</div>" +
      "</div>"
    );
  }

  function ensureSheet() {
    if (document.getElementById("sind-panel")) return;
    ensureToast();
    const wrapper = document.createElement("div");
    wrapper.innerHTML = sheetMarkup();
    while (wrapper.firstChild) document.body.appendChild(wrapper.firstChild);

    document.getElementById("sind-close").innerHTML = Icon("x", "size-4");
    document.querySelectorAll("#sind-panel .chev").forEach((el) => (el.innerHTML = Icon("chevron-down", "size-4")));
    document.querySelector("#sind-cidade .search-icon").innerHTML = Icon("search", "size-4");
    endereco = EnderecoCep.init({
      cep: document.getElementById("sind-cep"),
      uf: document.getElementById("sind-uf"),
      municipio: document.getElementById("sind-cidade"),
      logradouro: document.getElementById("sind-endereco"),
      bairro: document.getElementById("sind-bairro"),
      status: document.getElementById("sind-cep-status"),
      onChange: atualizarBotaoSalvar,
    });
    document.getElementById("sind-tipo").innerHTML = '<option value="">Selecione...</option>' + D.TIPO_ENTIDADE_OPCOES.map((t) => '<option value="' + t + '">' + t + "</option>").join("");

    document.getElementById("sind-overlay").addEventListener("click", fechar);
    document.getElementById("sind-close").addEventListener("click", fechar);
    document.getElementById("sind-cancelar").addEventListener("click", fechar);
    document.getElementById("sind-salvar").addEventListener("click", salvar);
    document.getElementById("sind-panel").querySelectorAll("input, select").forEach((el) => {
      el.addEventListener("input", atualizarBotaoSalvar);
      el.addEventListener("change", atualizarBotaoSalvar);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && document.getElementById("sind-overlay").classList.contains("is-open")) fechar();
    });
  }

  function preencherFormulario(sindicato) {
    CAMPOS_TEXTO.forEach((id) => {
      const campo = id.replace("sind-", "");
      document.getElementById(id).value = sindicato ? sindicato[campo] || "" : "";
    });
    endereco.setValores(sindicato ? { cep: sindicato.cep, municipio: sindicato.cidade, uf: sindicato.uf } : {});
    document.getElementById("sind-tipo").value = sindicato ? sindicato.tipoEntidade || "" : "";
  }

  function formularioCompleto() {
    const end = endereco.getValores();
    return (
      CAMPOS_OBRIGATORIOS.every((id) => document.getElementById(id).value.trim() !== "") &&
      end.cep.replace(/\D/g, "").length === 8 && !!end.municipio && !!end.uf && !endereco.estaBuscando()
    );
  }

  function atualizarBotaoSalvar() {
    document.getElementById("sind-salvar").disabled = !formularioCompleto();
  }

  function abrir(sindicatoOuNull, onSalvo) {
    ensureSheet();
    editandoCodigo = sindicatoOuNull ? sindicatoOuNull.codigo : null;
    onSalvoCallback = onSalvo;

    document.getElementById("sind-title").textContent = editandoCodigo ? "Editar sindicato" : "Novo sindicato";
    document.getElementById("sind-description").textContent = editandoCodigo
      ? "Atualize os dados cadastrais desta entidade sindical."
      : "Cadastro-base da entidade sindical à qual as convenções coletivas ficarão vinculadas.";
    document.getElementById("sind-salvar").textContent = editandoCodigo ? "Gravar" : "Salvar";

    preencherFormulario(sindicatoOuNull);
    atualizarBotaoSalvar();
    UI.openSheet(document.getElementById("sind-overlay"), document.getElementById("sind-panel"));
    document.getElementById("sind-nome").focus();
  }

  function fechar() {
    UI.closeSheet(document.getElementById("sind-overlay"), document.getElementById("sind-panel"));
  }

  function salvar() {
    if (!formularioCompleto()) return;
    const end = endereco.getValores();

    const dados = {
      codigo: editandoCodigo || "",
      nome: document.getElementById("sind-nome").value.trim(),
      cep: end.cep,
      endereco: document.getElementById("sind-endereco").value.trim(),
      numero: document.getElementById("sind-numero").value.trim(),
      complemento: document.getElementById("sind-complemento").value.trim(),
      bairro: document.getElementById("sind-bairro").value.trim(),
      cidade: end.municipio,
      uf: end.uf,
      cnpj: document.getElementById("sind-cnpj").value.trim(),
      telefone: document.getElementById("sind-telefone").value.trim(),
      fax: document.getElementById("sind-fax").value.trim(),
      site: document.getElementById("sind-site").value.trim(),
      email: document.getElementById("sind-email").value.trim(),
      tipoEntidade: document.getElementById("sind-tipo").value,
      cnes: document.getElementById("sind-cnes").value.trim(),
    };

    const lista = D.getSindicatos();
    if (editandoCodigo) {
      const atualizados = lista.map((s) => (s.codigo === editandoCodigo ? dados : s));
      D.setSindicatos(atualizados);
    } else {
      dados.codigo = D.proximoCodigo(lista, "SIND");
      D.setSindicatos(lista.concat([dados]));
    }

    fechar();
    const callback = onSalvoCallback;
    onSalvoCallback = null;
    if (callback) callback(dados);
    UI.showToast(editandoCodigo ? "Sindicato salvo" : "Sindicato criado", dados.nome + (editandoCodigo ? " foi atualizado com sucesso." : " foi cadastrado com sucesso."));
  }

  global.SindicatoFormSheet = {
    abrirNovo: (onSalvo) => abrir(null, onSalvo),
    abrirEditar: (sindicato, onSalvo) => abrir(sindicato, onSalvo),
  };
})(window);
