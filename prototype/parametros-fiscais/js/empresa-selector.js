/*
  Busca/seleção de empresa — exclusivo da trilha Fiscal.

  Fiscal é a única trilha do protótipo em que a empresa precisa estar
  definida ANTES de carregar qualquer parâmetro (docs/parametros-fiscais-arquitetura.md
  não define isso explicitamente porque é uma decisão de fluxo desta trilha,
  não uma regra de navegação global do produto — por isso este módulo fica
  local a prototype/parametros-fiscais/js, e não em shared/js).

  Reaproveita o Combobox genérico já existente (shared/js/ui.js — o mesmo
  usado para buscar um sócio em Empresas > Quadro societário), só com a
  lista de opções sendo o cadastro de empresas (EmpresasData). Nenhum
  componente novo de busca foi criado — apenas os dados que alimentam o
  componente já existente.
*/
(function (global) {
  function empresaOptions() {
    return window.EmpresasData.EMPRESAS.map((e) => ({
      value: e.codigo,
      label: e.dadosGerais.razaoSocial,
      sublabel: "CNPJ " + e.dadosGerais.cnpj + " · " + e.dadosGerais.regimeTributarioFederal,
    }));
  }

  // root precisa ter a estrutura .combobox > .combobox-trigger + .combobox-panel
  // (.combobox-search > input + .combobox-list) — mesma exigida por UI.initCombobox.
  function mountCombobox(root, currentCodigo, onSelect) {
    root.querySelector(".chev").innerHTML = Icon("chevron-down", "size-4");
    root.querySelector(".search-icon").innerHTML = Icon("search", "size-4");
    UI.initCombobox(root, empresaOptions(), currentCodigo, onSelect);
  }

  global.FiscalEmpresaSelector = { empresaOptions, mountCombobox };
})(window);
