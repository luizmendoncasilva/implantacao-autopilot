/*
  Aba "Federais" — implementação de conteúdo, exclusiva da trilha Fiscal.
  Escopo EXCLUSIVO do MVP (docs/parametros-fiscais-arquitetura.md, seção 5):
  apenas "INSS patronal fora do DAS (Anexo IV)". Retenção de INSS sobre
  prestados, tributação monofásica/ST e a opção pela CPRB são Desejável —
  não implementados nesta etapa.

  Bloco pequeno por definição documentada (arquitetura, seção 3: "mantido
  como aba própria mesmo sendo fino hoje — cresce quando Lucro Presumido/
  Lucro Real entrarem em escopo") — por isso nenhum agrupamento artificial,
  nenhum accordion: uma única .detail-section com um único campo, do mesmo
  jeito que Gerais organiza cada um dos seus grupos.

  A aplicabilidade usa o Anexo já mockado para Gerais
  (FiscalGeraisData.getDadosGerais(codigo).anexoCodigo) — nenhuma regra nova
  de Anexo é criada aqui, e nenhum cálculo real de INSS é feito
  (ver federais-data.js).
*/
(function (global) {
  const ORIGENS = global.OrigemBadge.ORIGENS;

  // indicadorCarregando força o estado "loading" — mesma simulação de
  // carregamento já usada nos indicadores de Gerais (ver fiscal-page.js).
  function renderConteudo(empresa, isReadOnly, indicadorCarregando) {
    if (!empresa.optanteSimples) return global.FiscalGerais.renderNaoAplicavel(empresa, "Federais");

    const dadosGerais = global.FiscalGeraisData.getDadosGerais(empresa.codigo);
    const anexoIV = dadosGerais.anexoCodigo === "IV";

    let indicadorHtml;
    if (indicadorCarregando) {
      indicadorHtml = global.IndicadorCalculado.render({ label: "INSS patronal fora do DAS", origem: ORIGENS.MOTOR_CALCULO, state: "loading" });
    } else if (!anexoIV) {
      indicadorHtml = global.IndicadorCalculado.render({
        label: "INSS patronal fora do DAS",
        origem: ORIGENS.MOTOR_CALCULO,
        state: "not-applicable",
      });
    } else {
      const valor = global.FiscalFederaisData.getInssPatronalForaDoDas(empresa.codigo);
      indicadorHtml =
        valor != null
          ? global.IndicadorCalculado.render({ label: "INSS patronal fora do DAS", value: valor, origem: ORIGENS.MOTOR_CALCULO, state: "available" })
          : global.IndicadorCalculado.render({ label: "INSS patronal fora do DAS", origem: ORIGENS.MOTOR_CALCULO, state: "unavailable" });
    }

    return (
      '<div class="card">' +
      '<div class="card-header">' +
      '<div class="card-title">Federais</div>' +
      '<div class="card-description">Registra o pouco que tem efeito de apuração ou relatório fora do DAS, já que no Simples Nacional a maior parte dos tributos federais está dentro do DAS.</div>' +
      "</div>" +
      '<div class="card-content">' +
      '<div class="detail-section">' +
      '<h3 class="detail-section-title">Federais</h3>' +
      '<div class="detail-grid">' + indicadorHtml + "</div>" +
      "</div></div></div>"
    );
  }

  global.FiscalFederais = { renderConteudo: renderConteudo };
})(window);
