/*
  Mock da Importação Massiva de Empresas — redesenho RN-11/RF-301-305
  (docs/RN-RF_CadastroEmpresasAuxiliares.md, seção 4-A): a planilha só traz o
  CNPJ; o AutoPilot consulta o Cockpit e só reconhece o vínculo se a empresa
  já existir lá, completamente cadastrada. Não há mais criação de empresa a
  partir de dados de planilha, nem um caminho alternativo de planilha
  completa quando a consulta está indisponível (RF-302 — só "Tentar
  novamente"/"Voltar"). Gera sempre o mesmo lote (determinístico, sem
  Math.random) para a demonstração ser reproduzível — nada aqui lê um
  arquivo real do usuário nem chama um serviço real.
*/
(function (global) {
  // Único campo que a planilha traz — a consulta ao Cockpit preenche todo o
  // resto do Cadastro Geral quando o CNPJ é reconhecido (RF-301).
  const PLANILHA_COLUNAS_SIMPLIFICADA = [{ key: "cnpj", label: "CNPJ" }];

  const CNPJ_REGEX = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/;

  const RAMOS = ["Comércio", "Serviços", "Indústria", "Distribuidora", "Transportes", "Confecções", "Papelaria", "Farmácia", "Restaurante", "Construtora", "Auto Peças", "Consultoria", "Gráfica", "Móveis", "Informática", "Cosméticos", "Materiais Elétricos", "Alimentos", "Bebidas", "Calçados", "Livraria", "Vidraçaria", "Serralheria", "Pet Shop", "Ótica"];
  const SUFIXOS = ["Nacional", "Central", "Popular", "Moderna", "Prime", "União", "Estrela", "Horizonte", "Progresso", "Aliança"];
  const LOCAIS = [
    { municipio: "Goiânia", uf: "GO", bairro: "Setor Bueno", logradouro: "Rua T-40" },
    { municipio: "Anápolis", uf: "GO", bairro: "Jundiaí", logradouro: "Av. Brasil Norte" },
    { municipio: "Trindade", uf: "GO", bairro: "Centro", logradouro: "Rua Padre Wendel" },
    { municipio: "Aparecida de Goiânia", uf: "GO", bairro: "Jardim Novo Mundo", logradouro: "Av. Independência" },
    { municipio: "Senador Canedo", uf: "GO", bairro: "Distrito Agroindustrial", logradouro: "Rod. BR-060" },
  ];
  const REGIMES = ["Simples Nacional", "Lucro Presumido", "Lucro Real"];
  const RESPONSAVEIS = [
    { nome: "Bruno Cardoso Teixeira", cpf: "111.222.333-44" },
    { nome: "Camila Ferreira Duarte", cpf: "222.333.444-55" },
    { nome: "Diego Martins Salgado", cpf: "333.444.555-66" },
    { nome: "Fabiana Rezende Costa", cpf: "444.555.666-77" },
    { nome: "Gustavo Henrique Barros", cpf: "555.666.777-88" },
    { nome: "Larissa Nunes Pimentel", cpf: "666.777.888-99" },
    { nome: "Rodrigo Alves Siqueira", cpf: "777.888.999-00" },
  ];

  function pad2(n) {
    return String(n).padStart(2, "0");
  }
  function formatCnpj(indice) {
    const digitos8 = String(20000001 + indice * 137).slice(0, 8).padStart(8, "0");
    const dv = pad2(((indice * 7 + 11) % 90) + 10);
    return digitos8.slice(0, 2) + "." + digitos8.slice(2, 5) + "." + digitos8.slice(5, 8) + "/0001-" + dv;
  }
  function slug(texto) {
    return texto.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "");
  }

  // Registro "tal como existe no Cockpit" para um CNPJ (índice → registro
  // determinístico) — o que a consulta cadastral devolve quando reconhece a
  // empresa. Nada disso é preenchido pelo usuário: é sempre origem Cockpit
  // (RN-01), igual a qualquer outra empresa já existente no Autopilot.
  function gerarRegistroCockpit(indice) {
    const ramo = RAMOS[indice % RAMOS.length];
    const sufixo = SUFIXOS[(indice + 3) % SUFIXOS.length];
    const local = LOCAIS[indice % LOCAIS.length];
    const resp = RESPONSAVEIS[indice % RESPONSAVEIS.length];
    const nomeFantasia = ramo + " " + sufixo;
    const dominio = slug(nomeFantasia) + ".com.br";

    return {
      razaoSocial: nomeFantasia + " Ltda",
      nomeFantasia: nomeFantasia,
      cnpj: formatCnpj(indice),
      ie: "10." + String(300000 + indice * 11).slice(0, 6) + "-" + (indice % 10),
      im: String(100000 + indice * 23).slice(0, 6) + "-" + (indice % 10),
      logradouro: local.logradouro,
      numero: String(50 + indice * 3),
      complemento: indice % 4 === 0 ? "Sala " + (1 + (indice % 9)) : "",
      bairro: local.bairro,
      municipio: local.municipio,
      uf: local.uf,
      cep: "74." + String(200 + indice).slice(0, 3) + "-0" + (indice % 10) + "0",
      telefone: "(62) 3" + String(200 + indice * 7).slice(0, 3) + "-" + String(1000 + indice * 13).slice(0, 4),
      email: "contato@" + dominio,
      naturezaJuridica: "206-2 — Sociedade Empresária Limitada",
      regimeTributarioFederal: REGIMES[indice % REGIMES.length],
      inicioAtividade: pad2(1 + (indice % 28)) + "/" + pad2(1 + (indice % 12)) + "/" + (2010 + (indice % 14)),
      responsavelNome: resp.nome,
      responsavelCpf: resp.cpf,
      responsavelCargo: "Sócio-administrador",
    };
  }

  // Índices fixos reservados para os cenários de inconsistência exigidos pela
  // especificação (RF-303) — os demais índices geram linhas reconhecidas
  // normalmente no Cockpit.
  const INDICE_CNPJ_INVALIDO = 12;
  const INDICE_CNPJ_NAO_ENCONTRADO = 27; // CNPJ com formato válido, mas empresa não cadastrada no Cockpit (RN-09)
  const INDICE_CNPJ_JA_IMPORTADO = 33; // empresa já reconhecida no Autopilot — RN-07 bloqueia a linha

  function gerarLinhas() {
    const linhas = [];
    for (let indice = 0; indice < 50; indice++) {
      const cockpit = gerarRegistroCockpit(indice);
      let cnpj = cockpit.cnpj;
      let cnpjValido = true;
      let encontradoNoCockpit = true;
      let jaImportado = false;

      if (indice === INDICE_CNPJ_INVALIDO) {
        cnpj = "11.222.333/0001-4"; // formato inválido — nem chega a ser consultado
        cnpjValido = false;
      } else if (indice === INDICE_CNPJ_NAO_ENCONTRADO) {
        encontradoNoCockpit = false;
      } else if (indice === INDICE_CNPJ_JA_IMPORTADO) {
        cnpj = global.EmpresasData.EMPRESAS[0].dadosGerais.cnpj; // já existe no Autopilot (Padaria Aurora)
        jaImportado = true;
      }

      const erros = [];
      let motivo = null;
      let campos = { cnpj: cnpj };

      if (!cnpjValido) {
        erros.push("CNPJ em formato inválido — use o padrão 00.000.000/0000-00.");
        motivo = "cnpj_invalido";
      } else if (!encontradoNoCockpit) {
        erros.push("Empresa não encontrada no Cockpit. Cadastre-a no Cockpit antes de importar novamente — o Autopilot não cria empresas pela planilha.");
        motivo = "empresa_nao_encontrada";
      } else if (jaImportado) {
        erros.push("CNPJ já importado anteriormente no Autopilot.");
        motivo = "cnpj_ja_importado";
      } else {
        campos = cockpit;
      }

      linhas.push({
        linha: indice + 2, // linha 1 da planilha = cabeçalho
        campos: campos,
        reconhecidoNoCockpit: cnpjValido && encontradoNoCockpit && !jaImportado,
        erros: erros,
        motivo: motivo,
        status: erros.length ? "invalida" : "valida",
      });
    }
    return linhas;
  }

  // Empresa (linha reconhecida no Cockpit) → mesmo shape de
  // EmpresasData.EMPRESAS[]. O código gerado (IMP-00xx) evita colidir com os
  // códigos das empresas-semente (ex.: PA-0011, MS-0027) — ordem de chegada
  // define o número sequencial. Contador Responsável, Sócios e Contadores
  // nunca fazem parte do lote (RN-11) — ficam vazios até vínculo manual,
  // mesmo fluxo do cadastro individual.
  function converterParaEmpresa(linha, ordem) {
    const c = linha.campos;
    const codigo = "IMP-" + String(ordem).padStart(4, "0");
    return {
      nome: c.nomeFantasia,
      codigo: codigo,
      resp: c.responsavelNome,
      optanteSimples: c.regimeTributarioFederal === "Simples Nacional",
      dadosGerais: {
        razaoSocial: c.razaoSocial, nomeFantasia: c.nomeFantasia, tipoInscricao: "CNPJ",
        cnpj: c.cnpj, ie: c.ie, im: c.im,
        logradouro: c.logradouro, numero: c.numero, complemento: c.complemento, bairro: c.bairro,
        municipio: c.municipio, uf: c.uf, cep: c.cep,
        telefone: c.telefone, email: c.email,
        naturezaJuridica: c.naturezaJuridica, regimeTributarioFederal: c.regimeTributarioFederal,
        inicioAtividade: c.inicioAtividade, statusCliente: "ativo", clienteDesde: c.inicioAtividade, dataInativacao: null,
        duracaoContrato: "Indeterminado", certificadoDigital: "Pendente de emissão",
        observacoesGerais: "Empresa reconhecida via Importação massiva — CNPJ localizado no Cockpit, linha " + linha.linha + " da planilha.",
      },
      atividades: { cnaePrincipal: "", cnaeSecundarios: [] },
      responsavelLegal: { nome: c.responsavelNome, cpf: c.responsavelCpf, cargo: c.responsavelCargo },
      modulosHabilitados: [],
    };
  }

  // Modelo de planilha — só a coluna de CNPJ, marcada como obrigatória. É o
  // único modelo oferecido (não há mais um modelo completo de fallback).
  function gerarModeloSimplificadoCsv() {
    const exemplo = gerarRegistroCockpit(0);
    return "CNPJ *\n" + exemplo.cnpj + "\n\n* Campo de preenchimento obrigatório — único dado necessário para o Autopilot reconhecer a empresa no Cockpit.\n";
  }

  global.ImportarEmpresasData = {
    PLANILHA_COLUNAS_SIMPLIFICADA,
    CNPJ_REGEX,
    gerarLinhas,
    converterParaEmpresa,
    gerarModeloSimplificadoCsv,
  };
})(window);
