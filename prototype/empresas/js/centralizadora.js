/*
  Aba "Empresa centralizadora" — somente leitura, dado de origem Cockpit
  (mesmo padrão de Dados gerais/Atividades/Responsável legal). O papel de
  cada empresa (Matriz/Filial) já é controlado no Cockpit; esta aba apenas
  exibe essa classificação, sem seletor editável — decisão de produto de
  2026-08-10 (ver docs/cadastro-empresas-spec.md, seção "Empresa Centralizadora").
*/
(function () {
  const D = window.EmpresasData;
  let empresaAtual = null;

  function classificacaoBadge(tipo) {
    if (tipo === "matriz") return '<span class="badge badge-info">Matriz</span>';
    if (tipo === "filial") return '<span class="badge badge-secondary">Filial</span>';
    return '<span class="badge badge-outline">Não se aplica</span>';
  }

  function render() {
    const mapa = D.getCentralizacao();
    const infoAtual = mapa[empresaAtual.codigo] || { tipo: "não se aplica", vinculoCodigo: null };
    const matrizCodigo = infoAtual.tipo === "matriz" ? empresaAtual.codigo : infoAtual.vinculoCodigo;
    const grupo = matrizCodigo
      ? D.EMPRESAS.filter((e) => e.codigo === matrizCodigo || (mapa[e.codigo] || {}).vinculoCodigo === matrizCodigo)
      : [empresaAtual];

    const rows = grupo
      .map((e) => {
        const info = mapa[e.codigo] || { tipo: "não se aplica" };
        const destacada = e.codigo === empresaAtual.codigo;
        return (
          "<tr" + (destacada ? ' style="background:var(--accent);"' : "") + ">" +
          "<td>" + e.codigo + "</td>" +
          "<td><div class=\"flex items-center gap-2 min-w-0\">" +
          '<span class="truncate" style="max-width:240px;" title="' + e.dadosGerais.razaoSocial + '">' + e.dadosGerais.razaoSocial + "</span>" +
          (destacada ? '<span class="badge badge-outline shrink-0">Empresa atual</span>' : "") +
          "</div></td>" +
          "<td>" + e.dadosGerais.tipoInscricao + " " + e.dadosGerais.cnpj + "</td>" +
          "<td>" + D.situacaoBadge(e.dadosGerais) + "</td>" +
          "<td>" + classificacaoBadge(info.tipo) + "</td>" +
          "</tr>"
        );
      })
      .join("");

    const descricao =
      infoAtual.tipo === "não se aplica"
        ? "Esta empresa não tem relação de matriz/filial cadastrada."
        : "Grupo de " + ((D.findEmpresaByCodigo(matrizCodigo) || {}).nome || "") + " — indica qual empresa centraliza as informações consolidadas das filiais.";

    document.getElementById("tab-content").innerHTML =
      '<div class="card gap-4">' +
      '<div class="card-header">' +
      '<div class="card-title">Empresa centralizadora</div>' +
      '<div class="card-description">' + descricao + "</div>" +
      "</div>" +
      '<div class="card-content"><div class="table-wrap"><table class="dtable">' +
      "<thead><tr><th>Código</th><th>Razão social</th><th>Inscrição</th><th>Status</th><th>Classificação</th></tr></thead>" +
      "<tbody>" + rows + "</tbody></table></div></div>" +
      "</div>";
  }

  window.renderTabContent = function (empresa) {
    empresaAtual = empresa;
    render();
  };
})();
