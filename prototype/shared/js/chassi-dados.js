/*
  Mock do chassi do Cockpit (novo-chassi-v1, prototype-cockpit-evolucoes):
  clientes com ficha, tarefas, solicitações, documentos e atividades do sino.
  Os clientes são as mesmas empresas do resto do protótipo (mesmo nome e
  CNPJ); os valores da ficha são inventados. Acrescentar campo à ficha é
  escrever mais um item em DEFINICOES.
*/
(function (global) {
  const OPERADORA = { nome: "Elaine Calazans", papel: "Operadora · Departamento Pessoal" };

  const CLIENTES = [
    { id: "CV-0058", nome: "Clínica Vitalis Serviços Médicos Ltda", cnpj: "31.452.118/0001-07", situacao: "implantacao", codDominio: "4821", origem: "BHub", plano: "Completo", mensalidade: "R$ 1.890,00", regime: "Simples Nacional", grupo: "Grupo Vitalis" },
    { id: "CH-0042", nome: "Comércio Horizonte Ltda", cnpj: "22.333.444/0001-55", situacao: "implantacao", codDominio: "3310", origem: "Contabilizei", plano: "Essencial", mensalidade: "R$ 690,00", regime: "Simples Nacional", grupo: null },
    { id: "EL-0073", nome: "Estúdio Lumen Arquitetura Ltda", cnpj: "28.907.334/0001-62", situacao: "implantacao", codDominio: "5102", origem: "BHub", plano: "Fiscal + Contábil", mensalidade: "R$ 980,00", regime: "Simples Nacional", grupo: null },
    { id: "MS-0027", nome: "Metalúrgica Sigma Ltda", cnpj: "06.265.226/0001-09", situacao: "ativo", codDominio: "1187", origem: "BHub", plano: "Completo", mensalidade: "R$ 3.450,00", regime: "Lucro Presumido", grupo: "Grupo Sigma" },
    { id: "NC-0091", nome: "Nexo Consultoria em TI Ltda", cnpj: "45.118.270/0001-33", situacao: "ativo", codDominio: "5390", origem: "Parceiro Contábil Sul", plano: "Fiscal + Contábil", mensalidade: "R$ 540,00", regime: "Simples Nacional", grupo: null },
    { id: "PA-0011", nome: "Padaria Aurora Ltda", cnpj: "12.345.678/0001-90", situacao: "ativo", codDominio: "0912", origem: "BHub", plano: "Completo", mensalidade: "R$ 1.240,00", regime: "Simples Nacional", grupo: null },
  ];

  const SITUACAO_CLIENTE = {
    ativo: { rotulo: "Ativo", tom: "success" },
    implantacao: { rotulo: "Em implantação", tom: "warning" },
  };

  // Estado do campo da ficha (enum do produto): atualizado | revisar | desatualizado | nao_informado.
  const STATUS_CAMPO = {
    atualizado: { rotulo: "Atualizado", icone: "circle-check", tom: "success" },
    revisar: { rotulo: "Precisa de revisão", icone: "alert-triangle", tom: "warning" },
    desatualizado: { rotulo: "Desatualizado", icone: "circle-x", tom: "destructive" },
    nao_informado: { rotulo: "Não informado", icone: "info", tom: "muted" },
  };

  function semente(texto) {
    return texto.split("").reduce((s, c) => (s * 31 + c.charCodeAt(0)) % 9973, 7);
  }

  function escolhe(cliente, chave, opcoes) {
    return opcoes[semente(cliente.id + chave) % opcoes.length];
  }

  // { aba, rotulo, valor(cliente), sinonimos? }
  const DEFINICOES = [
    { aba: "Cadastro", rotulo: "Inscrição estadual", valor: (c) => "10." + c.codDominio.slice(0, 3) + ".55" + c.codDominio.slice(-1) + "-2", sinonimos: ["ie"] },
    { aba: "Cadastro", rotulo: "Inscrição municipal", valor: (c) => c.codDominio + "05-1", sinonimos: ["im"] },
    { aba: "Cadastro", rotulo: "Cód. Domínio", valor: (c) => c.codDominio },
    { aba: "Cadastro", rotulo: "Origem", valor: (c) => c.origem },
    { aba: "Cadastro", rotulo: "Grupo econômico", valor: (c) => c.grupo },
    { aba: "Fiscal", rotulo: "Regime tributário", valor: (c) => c.regime },
    { aba: "Fiscal", rotulo: "Analista", valor: (c) => escolhe(c, "af", ["Elizandra Souza", "Wender Jonathan", "Thais Moreira"]) },
    { aba: "Fiscal", rotulo: "Dia de fechamento fiscal", valor: (c) => "Dia " + escolhe(c, "ff", ["5", "8", "10"]) + " do mês seguinte", sinonimos: ["fechamento"] },
    { aba: "Fiscal", rotulo: "Certificado digital", valor: (c) => "e-CNPJ A1 · vence em " + escolhe(c, "cd", ["14/02/2027", "03/12/2026", "28/08/2027"]) },
    { aba: "Fiscal", rotulo: "Responsável pela entrega da DCTFWeb", valor: (c) => escolhe(c, "dw", ["BHub", "Cliente"]) },
    { aba: "Contábil", rotulo: "Analista", valor: (c) => escolhe(c, "ac", ["Andressa Lima", "Jeniffer Dauricio", "Luiz Felipe Mendonça Silva"]) },
    { aba: "Contábil", rotulo: "Dia de fechamento contábil", valor: (c) => "Dia " + escolhe(c, "fc", ["15", "20"]) + " do mês seguinte", sinonimos: ["fechamento"] },
    { aba: "Contábil", rotulo: "Plano de contas", valor: (c) => escolhe(c, "pc", ["Padrão BHub", "Referencial SPED"]) },
    { aba: "DP", rotulo: "Analista", valor: (c) => (c.plano === "Completo" || c.plano === "Essencial" ? escolhe(c, "ad", ["Jaqueline Rocha", "Andressa Teles Rodrigues"]) : null) },
    { aba: "DP", rotulo: "Dia de pagamento da folha", valor: (c) => (c.plano === "Completo" || c.plano === "Essencial" ? "5º dia útil" : null), sinonimos: ["fechamento", "folha"] },
    { aba: "DP", rotulo: "Sindicato", valor: (c) => (c.plano === "Completo" || c.plano === "Essencial" ? escolhe(c, "sd", ["SINDICOM-GO", "SEAAC Goiânia"]) : null) },
    { aba: "Financeiro", rotulo: "Plano", valor: (c) => c.plano },
    { aba: "Financeiro", rotulo: "Mensalidade", valor: (c) => c.mensalidade },
    { aba: "Financeiro", rotulo: "Dia de vencimento", valor: (c) => "Dia " + escolhe(c, "dv", ["5", "10", "15"]) },
    { aba: "Contatos", rotulo: "Responsável financeiro", valor: (c) => escolhe(c, "rf", ["Marina Teles", "Paulo Ribeiro", "Carla Nunes"]) + " · (62) 9" + c.codDominio + "-22" + c.codDominio.slice(-2), sinonimos: ["contatos", "telefone"] },
    { aba: "Contatos", rotulo: "E-mail para documentos", valor: (c) => "financeiro@" + c.nome.split(" ")[0].toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "") + ".com.br", sinonimos: ["contatos", "email"] },
  ];

  function camposDaFicha(cliente) {
    return DEFINICOES.map((d, i) => {
      const valor = d.valor(cliente);
      const status = valor === null ? "nao_informado" : escolhe(cliente, "st" + i, ["atualizado", "atualizado", "atualizado", "atualizado", "revisar", "desatualizado"]);
      return { aba: d.aba, rotulo: d.rotulo, valor, status, sinonimos: d.sinonimos || [] };
    });
  }

  const SITUACAO_TAREFA = {
    atrasada: { rotulo: "Atrasada", tom: "destructive" },
    hoje: { rotulo: "Vence hoje", tom: "warning" },
    andamento: { rotulo: "Em andamento", tom: "secondary" },
    esperando: { rotulo: "Esperando cliente", tom: "secondary" },
  };

  const TAREFAS = [
    { id: "T-9101", clienteId: "CV-0058", titulo: "Implantar saldos de CPP do Fator R", area: "Fiscal", prazo: "22/10", situacao: "hoje" },
    { id: "T-9102", clienteId: "CV-0058", titulo: "Conciliar divergência de salário — Thiago Queiroz", area: "DP", prazo: "21/10", situacao: "atrasada" },
    { id: "T-9103", clienteId: "CV-0058", titulo: "Folha de pagamento 10/2026", area: "DP", prazo: "05/11", situacao: "andamento" },
    { id: "T-9104", clienteId: "EL-0073", titulo: "Solicitar extratos do DAS dos últimos 12 meses", area: "Fiscal", prazo: "24/10", situacao: "esperando" },
    { id: "T-9105", clienteId: "EL-0073", titulo: "Apuração do Simples Nacional 10/2026", area: "Fiscal", prazo: "20/11", situacao: "andamento" },
    { id: "T-9106", clienteId: "MS-0027", titulo: "Resolver colaboradores aguardando eSocial", area: "DP", prazo: "20/10", situacao: "atrasada" },
    { id: "T-9107", clienteId: "MS-0027", titulo: "Fechamento contábil 09/2026", area: "Contábil", prazo: "20/10", situacao: "andamento" },
    { id: "T-9108", clienteId: "CH-0042", titulo: "Carregar competências de folha ausentes", area: "DP", prazo: "22/10", situacao: "hoje" },
    { id: "T-9109", clienteId: "CH-0042", titulo: "Confirmar sindicato vinculado", area: "DP", prazo: "25/10", situacao: "esperando" },
    { id: "T-9110", clienteId: "PA-0011", titulo: "Folha de pagamento 10/2026", area: "DP", prazo: "05/11", situacao: "andamento" },
    { id: "T-9111", clienteId: "NC-0091", titulo: "Apuração do Simples Nacional 10/2026", area: "Fiscal", prazo: "20/11", situacao: "andamento" },
  ];

  const SOLICITACOES = [
    { id: "S-4410", clienteId: "CV-0058", titulo: "Inclusão de nova médica na folha", detalhe: "Aberta há 2 dias · DP" },
    { id: "S-4415", clienteId: "MS-0027", titulo: "Segunda via da guia de FGTS", detalhe: "Aberta hoje · DP" },
    { id: "S-4420", clienteId: "EL-0073", titulo: "Dúvida sobre o Fator R", detalhe: "Aberta ontem · Fiscal" },
  ];

  const DOCUMENTOS = [
    { id: "D-771", clienteId: "NC-0091", titulo: "Extrato_PGDAS-D_NexoConsultoria.pdf", detalhe: "Fiscal · enviado em 14/10/2026" },
    { id: "D-772", clienteId: "CV-0058", titulo: "Ficha_Registro_Clinica_Vitalis.pdf", detalhe: "DP · enviado em 02/07/2026" },
    { id: "D-773", clienteId: "MS-0027", titulo: "Balancete_09-2026_MetalurgicaSigma.pdf", detalhe: "Contábil · gerado em 15/10/2026" },
  ];

  const BUSCAS_RECENTES = ["Clínica Vitalis", "06.265.226", "extrato do DAS"];

  // Atividades do sino. `carteira`: é de um cliente da carteira da operadora.
  const ATIVIDADES = [
    { id: 1, titulo: "Nexo Consultoria concluiu a implantação Fiscal", descricao: "Saldos de CPP implantados por Andressa Teles Rodrigues.", quando: "há 12 min", lida: false, carteira: true },
    { id: 2, titulo: "Nova solicitação de Clínica Vitalis", descricao: "Inclusão de nova médica na folha.", quando: "há 40 min", lida: false, carteira: true },
    { id: 3, titulo: "Prazo vence hoje: CPP do Fator R", descricao: "Clínica Vitalis · 4 competências pendentes.", quando: "há 1 h", lida: false, carteira: true },
    { id: 4, titulo: "Divergência resolvida em Metalúrgica Sigma", descricao: "Daniel Marques Porfiro — salário da Ficha de Registro mantido.", quando: "há 2 h", lida: true, carteira: true },
    { id: 5, titulo: "Cálculo em paralelo concluído", descricao: "Clínica Vitalis · 9 de 12 competências validadas.", quando: "há 3 h", lida: true, carteira: true },
    { id: 6, titulo: "Certificado digital vence em 30 dias", descricao: "Padaria Aurora · e-CNPJ A1.", quando: "ontem", lida: true, carteira: false },
    { id: 7, titulo: "Estúdio Lumen enviou documentos", descricao: "3 arquivos na pasta Fiscal.", quando: "ontem", lida: true, carteira: false },
  ];
  for (let i = 8; i <= 46; i++) {
    const c = CLIENTES[i % CLIENTES.length];
    ATIVIDADES.push({
      id: i,
      titulo: ["Tarefa atribuída a você", "Documento recebido", "Comentário em tarefa", "Guia gerada"][i % 4] + " · " + c.nome.split(" ").slice(0, 2).join(" "),
      descricao: ["Revisar a conciliação do mês.", "Arquivo enviado pelo cliente.", "Andressa comentou na tarefa.", "DAS 09/2026 disponível."][i % 4],
      quando: "há " + Math.ceil(i / 6) + " dias",
      lida: true,
      carteira: i % 3 !== 0,
    });
  }

  function cliente(id) {
    return CLIENTES.find((c) => c.id === id) || null;
  }

  global.ChassiDados = {
    OPERADORA,
    CLIENTES,
    SITUACAO_CLIENTE,
    STATUS_CAMPO,
    SITUACAO_TAREFA,
    TAREFAS,
    SOLICITACOES,
    DOCUMENTOS,
    BUSCAS_RECENTES,
    ATIVIDADES,
    cliente,
    camposDaFicha,
  };
})(window);
