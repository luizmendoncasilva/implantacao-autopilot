/*
  Dados mock da trilha Parâmetros Fiscais — alertas/pendências (área
  persistente do cabeçalho). As vigências passaram a ser por empresa e
  vivem em vigencias-data.js (FiscalVigenciasData) desde a etapa "Vigência
  Funcional" — este módulo não expõe mais FiscalData.VIGENCIAS.
*/
(function (global) {
  // severity: "destructive" (bloqueio crítico) | "warning" (pendência de ação
  // humana) | "info" (alerta sem bloqueio). Os três níveis descritos em
  // docs/parametros-fiscais-arquitetura.md, seção 2, item 5 — conteúdo aqui é
  // só ilustrativo para validar a estrutura visual, não uma regra real.
  const ALERTAS = [
    {
      id: "a1",
      severity: "destructive",
      titulo: "Exemplo técnico — bloqueio de apuração",
      descricao: "Ilustra o alerta crítico (ex.: alteração cadastral bloqueando a apuração). Regra real ainda não implementada.",
      acao: null,
    },
    {
      id: "a2",
      severity: "warning",
      titulo: "Exemplo técnico — pendência de ação humana",
      descricao: "Ilustra a pendência acionável (ex.: excesso de sublimite exigindo guias avulsas). Escopo ainda em definição.",
      acao: { label: "Gerar guias avulsas (exemplo)" },
    },
    {
      id: "a3",
      severity: "info",
      titulo: "Exemplo técnico — alerta informativo",
      descricao: "Ilustra o alerta sem bloqueio (ex.: cruzamento do Fator R). Regra real ainda não implementada.",
      acao: null,
    },
  ];

  global.FiscalData = { ALERTAS };
})(window);
