/*
  Busca/seleção de empresa — exclusivo da trilha Folha de Pagamento.

  Mesma decisão de fluxo já tomada em Fiscal (ver
  prototype/parametros-fiscais/js/empresa-selector.js): a Folha é um cadastro
  de "Parâmetros de Empresa", então a empresa precisa estar definida antes de
  carregar qualquer parâmetro. Reaproveita o Combobox genérico já existente
  (shared/js/ui.js) com a lista de opções vinda do cadastro de empresas —
  nenhum componente novo de busca foi criado.
*/
(function (global) {
  function empresaOptions() {
    return window.EmpresasData.EMPRESAS.map((e) => ({
      value: e.codigo,
      label: e.dadosGerais.razaoSocial,
      sublabel: "CNPJ " + e.dadosGerais.cnpj + " · " + e.dadosGerais.regimeTributarioFederal,
    }));
  }

  function mountCombobox(root, currentCodigo, onSelect) {
    root.querySelector(".chev").innerHTML = Icon("chevron-down", "size-4");
    root.querySelector(".search-icon").innerHTML = Icon("search", "size-4");
    UI.initCombobox(root, empresaOptions(), currentCodigo, onSelect);
  }

  global.FolhaEmpresaSelector = { empresaOptions, mountCombobox };
})(window);
