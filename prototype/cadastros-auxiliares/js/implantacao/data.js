/*
  Mock da Implantação de Empresas — fila de conciliação de colaboradores
  entre o Lake (Domínio) e a Ficha Financeira enviada pela empresa. Handoff:
  CTB-278 (RF-DP-411 a 416) / CDSG-33 / épico CTB-263.

  `empresaCodigo` referencia códigos reais de EmpresasData.EMPRESAS (mesmas
  três empresas usadas nas demais trilhas: Padaria Aurora, Metalúrgica Sigma,
  Comércio Horizonte), para os links "Abrir cadastro" funcionarem de verdade.

  Convenção de nomenclatura desta trilha (evitar colisão com o core):
  sufixo "Concil" para as funções de conciliação (abrirDrawerConcil/
  fecharDrawerConcil, em js/implantacao/list.js).

  `campo.valorEscolhido` aceita "lake" | "ficha" | "manual" — o terceiro
  caminho cobre o caso em que nem o Lake nem a Ficha Financeira têm o valor
  correto (os dois desatualizados, por exemplo); nesse caso `valorManual`
  guarda o texto digitado pela pessoa que está conciliando.

  `status` aceita um quarto valor além dos três do handoff original —
  "nao_encontrado_lake": a Ficha Financeira trouxe o colaborador, mas ele não
  existe no Lake para esta empresa (ex.: admissão recente, ainda não
  sincronizada pela Domínio). Levantado na reunião de discovery
  (Jaqueline, ~11:32 — "e se eu importei uma ficha e não achei o
  colaborador?"), sem resolução definida por eles ali; a resolução aqui é uma
  proposta: mostrar os dados extraídos da Ficha (sem contraparte do Lake para
  comparar) e deixar o operador decidir entre criar o cadastro ou ignorar por
  enquanto. `dadosFicha` guarda esses campos.

  `situacao` ("ativo" | "desligado") — a reunião definiu que a fila de
  implantação olha só colaboradores ativos (Andressa, ~11:26). getColaboradores()
  já filtra desligados por padrão; getColaboradoresTodos() dá acesso ao
  conjunto completo quando necessário (ex.: ferramentas internas).

  Mapeamento completo dos status possíveis, com a fonte de cada um (épico
  CTB-263 no Linear + doc "O que precisamos para implantar no Autopilot",
  Jeniffer Dauricio):
  - "pendente_conciliacao": no Lake, Ficha Financeira ainda não chegou/lida.
  - "divergencia": campo com valor diferente ou ausente em uma das duas
    fontes (RF-DP-414/415) — resolvido no drawer de conferência.
  - "nao_encontrado_lake": CPF da Ficha não existe no Lake para esta empresa
    ("CPF do relatório não existe na empresa", doc de pré-requisitos §6).
  - "rejeitado": a linha nem chegou a ser conciliada — falhou na validação
    antes de gravar (CPF inválido, categoria inexistente na tabela do
    eSocial, caractere especial/acento — RF-DP-402/403, RN-DP-21). Fica com
    motivo + nº da linha; RF-DP-408 prevê reprocessar só essa linha, sem
    duplicar, depois de corrigida na origem.
  - "pronto": conciliado nos dois lados, sem pendência bloqueante — só então
    é considerado implantado (RF-DP-417).

  `pendenciasCadastrais` (opcional, em qualquer status) — campos que a
  ORIGEM não traz de jeito nenhum (nem Lake, nem Ficha): PIS, título de
  eleitor, RG, nome dos pais, horário, cidade de nascimento (RF-DP-405).
  Diferente de `camposDivergentes`: aqui não há dois valores para escolher,
  é preenchimento manual mesmo. RN-DP-20 é explícito — não bloqueia a carga
  (por isso convive com status "pronto"), mas fica registrado como pendência.

  `status: "aguardando_esocial"` — quinto status, escopo RF-DP-401/409: a
  base Domínio não trouxe a categoria do trabalhador (ou não cobre a
  empresa) — o eSocial só é acionado nesse caminho de exceção, nunca como
  origem padrão. `motivoEsocial` guarda o porquê; `categoriaEsocial` é o
  valor que o eSocial devolve, revelado ao "simular retorno" (mesmo padrão
  de simularConciliacaoFicha em list.js) — depois disso o colaborador volta
  ao fluxo normal como "pendente_conciliacao".

  `dependentes` (opcional, em qualquer status) — RF-DP-406: carregados da
  mesma origem que o colaborador, cada um com sua própria lista de
  `pendencias` (delta a completar) — não bloqueia o colaborador principal,
  é conferido à parte (drawer próprio, "Concil" também, ver
  abrirDrawerDependentes em list.js).

  `esocialDelta` (opcional, só em "divergencia") — RF-DP-410: conferência
  contra o eSocial é um terceiro cruzamento, só para checagem — mostra
  divergência mas nunca sobrescreve o cadastro (diferente de
  `camposDivergentes`, que o operador resolve de fato).
*/
(function (global) {
  const COLABORADORES_INICIAL = [
    {
      id: 1, nome: "Daniel Marques Porfiro", cargo: "Recepcionista", cpf: "441.875.858-50",
      empresaCodigo: "MS-0027", status: "divergencia", situacao: "ativo",
      camposDivergentes: [
        { campo: "Salário", valorLake: "R$ 2.000,00", valorFicha: "R$ 2.104,00", valorEscolhido: null, resolvido: false },
        { campo: "Data de nascimento", valorLake: "22/07/1998", valorFicha: "22/07/1994", valorEscolhido: null, resolvido: false },
        { campo: "Número da CTPS", valorLake: null, valorFicha: "41.505.845-4", valorEscolhido: null, resolvido: false },
      ],
      // RF-DP-410 — conferência extra contra o eSocial, só como checagem: o
      // eSocial já tem outro salário registrado, mas isso não é resolvido
      // aqui (não sobrescreve) — só sinaliza pra a Implantação tratar à parte.
      esocialDelta: { campo: "Salário", valorAutopilot: "R$ 2.104,00", valorEsocial: "R$ 2.050,00" },
    },
    {
      id: 2, nome: "Ana Beatriz Souza", cargo: "Auxiliar Administrativo", cpf: "512.334.221-09",
      empresaCodigo: "MS-0027", status: "pronto", situacao: "ativo", camposDivergentes: [],
      // Campos que nem o Lake nem a Ficha Financeira trazem (RF-DP-405) —
      // não bloqueiam a carga (RN-DP-20), mas ficam como pendência de
      // preenchimento manual mesmo com o colaborador já "Pronto".
      pendenciasCadastrais: ["Título de eleitor", "Cidade de nascimento"],
      // RF-DP-406 — dependentes vêm da mesma origem do colaborador, com
      // pendência própria (delta a completar), sem travar o colaborador.
      dependentes: [
        { nome: "Lívia Souza Pereira", parentesco: "Filha", cpf: "—", dataNascimento: "14/03/2019", pendencias: ["CPF ainda não emitido"] },
      ],
      // Ficha completa (RF-DP-417) — todo colaborador "pronto" carrega os
      // campos da Ficha de Registro + resumo financeiro do ano vindos do
      // Lake/Ficha Financeira, pra visualização mesmo sem edição aqui.
      // Dados fictícios, no formato real desses dois documentos.
      fichaCompleta: {
        dadosPessoais: {
          dataNascimento: "14/05/1992", sexo: "Feminino", estadoCivil: "Solteira", nacionalidade: "Brasileira",
          naturalidade: "Manaus - AM", corRaca: "Parda", grauInstrucao: "Ensino Médio Completo",
          nomePai: "José Ricardo Souza", nomeMae: "Marta Aparecida Souza",
          telefone: "(92) 98765-4321", endereco: "Rua das Palmeiras, 245, Vila Nova, Manaus, AM — CEP 69000-000",
        },
        documentos: {
          rg: "32.556.789-1 SSP/AM", ctps: "Nº 45221, Série 00312-SP", dataExpedicaoCtps: "10/02/2015",
          pis: "120.5566.778-3", tituloEleitor: "3456 7890 1234 — Zona 015 Seção 0210",
        },
        admissao: {
          matricula: "000042", dataAdmissao: "03/03/2021", funcao: "Auxiliar Administrativo",
          cbo: "411005", salario: "R$ 2.450,00", horarioTrabalho: "das 08:00 às 17:00", horarioIntervalo: "das 12:00 às 13:00",
        },
        bancario: { banco: "341 — Itaú", agencia: "0921", conta: "05521-6", fgtsOpcaoEm: "03/03/2021" },
        historico: {
          alteracoesSalario: ["01/03/2023 — de R$ 2.200,00 para R$ 2.450,00 (mérito)"],
          ferias: [{ periodoAquisitivo: "03/03/2024 a 02/03/2025", periodoGozo: "10/06/2025 a 24/06/2025" }],
        },
        resumoFinanceiroAno: {
          competencias: [
            { competencia: "06/2026", proventos: "R$ 2.450,00", descontos: "R$ 410,32", liquido: "R$ 2.039,68" },
            { competencia: "07/2026", proventos: "R$ 2.450,00", descontos: "R$ 410,32", liquido: "R$ 2.039,68" },
            { competencia: "08/2026", proventos: "R$ 2.450,00", descontos: "R$ 410,32", liquido: "R$ 2.039,68" },
          ],
          totalAno: "R$ 14.700,00",
        },
      },
    },
    {
      id: 3, nome: "Carlos Eduardo Lima", cargo: "Operador de Produção", cpf: "309.887.654-21",
      empresaCodigo: "CH-0042", status: "divergencia", situacao: "ativo",
      camposDivergentes: [
        { campo: "PIS/PASEP", valorLake: null, valorFicha: "120.4455.667-8", valorEscolhido: null, resolvido: false },
      ],
    },
    { id: 4, nome: "Fernanda Rocha Alves", cargo: "Vendedora", cpf: "678.112.990-33", empresaCodigo: "CH-0042", status: "pendente_conciliacao", situacao: "ativo", camposDivergentes: [] },
    {
      // Padaria Aurora (PA-0011) é a empresa usada como exemplo de
      // implantação já CONCLUÍDA (ver EmpresasImplantacaoData) — por isso
      // seus colaboradores precisam estar todos "pronto", sem pendência de
      // nenhum tipo (cadastral, divergência, eSocial). Exemplos de
      // divergência/pendência ficam nas empresas "em_andamento" (MS-0027,
      // CH-0042).
      id: 5, nome: "João Pedro Martins", cargo: "Padeiro", cpf: "225.443.876-10",
      empresaCodigo: "PA-0011", status: "pronto", situacao: "ativo", camposDivergentes: [],
      fichaCompleta: {
        dadosPessoais: {
          dataNascimento: "22/09/1988", sexo: "Masculino", estadoCivil: "Casado", nacionalidade: "Brasileira",
          naturalidade: "Goiânia - GO", corRaca: "Branca", grauInstrucao: "Ensino Fundamental Completo",
          nomePai: "Antônio Martins Filho", nomeMae: "Rosana Pedro Martins",
          telefone: "(62) 99871-2233", endereco: "Rua dos Ipês, 88, Setor Central, Goiânia, GO — CEP 74000-000",
        },
        documentos: {
          rg: "4.887.220 SSP/GO", ctps: "Nº 78542, Série 00187-GO", dataExpedicaoCtps: "05/06/2010",
          pis: "138.2244.556-0", tituloEleitor: "1122 3344 5566 — Zona 032 Seção 0088",
        },
        admissao: {
          matricula: "000015", dataAdmissao: "15/03/2026", funcao: "Padeiro",
          cbo: "834110", salario: "R$ 2.100,00", horarioTrabalho: "das 05:00 às 14:00", horarioIntervalo: "das 09:00 às 10:00",
        },
        bancario: { banco: "104 — Caixa Econômica Federal", agencia: "1355", conta: "00982-1", fgtsOpcaoEm: "15/03/2026" },
        historico: {
          alteracoesSalario: [],
          ferias: [{ periodoAquisitivo: "15/03/2026 a 14/03/2027", periodoGozo: "Ainda não vencido" }],
        },
        resumoFinanceiroAno: {
          competencias: [
            { competencia: "06/2026", proventos: "R$ 2.100,00", descontos: "R$ 231,00", liquido: "R$ 1.869,00" },
            { competencia: "07/2026", proventos: "R$ 2.100,00", descontos: "R$ 231,00", liquido: "R$ 1.869,00" },
            { competencia: "08/2026", proventos: "R$ 2.100,00", descontos: "R$ 231,00", liquido: "R$ 1.869,00" },
          ],
          totalAno: "R$ 12.600,00",
        },
      },
    },
    {
      // Movida de PA-0011 (implantada) para CH-0042 (em andamento) — ver
      // comentário acima. Continua o mesmo caso de nome de solteira × nome
      // de casada, só que agora numa empresa cuja implantação ainda não
      // terminou, onde faz sentido ter campo em aberto.
      id: 6, nome: "Renata Cristina Dias", cargo: "Caixa", cpf: "890.221.345-67",
      empresaCodigo: "CH-0042", status: "divergencia", situacao: "ativo",
      camposDivergentes: [
        // Nome de solteira no Lake (ainda não atualizado desde o casamento)
        // × nome de casada na Ficha Financeira — mesma pessoa, mesmo CPF,
        // só o sobrenome mudou. Caso real de divergência de nome que a
        // conciliação por campo precisa cobrir, não só erro de digitação.
        { campo: "Nome completo", valorLake: "Renata Cristina Ferreira", valorFicha: "Renata Cristina Dias", valorEscolhido: null, resolvido: false },
        { campo: "Endereço", valorLake: "Rua das Acácias, 120", valorFicha: "Rua das Acácias, 122", valorEscolhido: null, resolvido: false },
        { campo: "Telefone", valorLake: "(62) 99870-1122", valorFicha: "(62) 99870-1199", valorEscolhido: null, resolvido: false },
      ],
      dependentes: [
        { nome: "Pedro Henrique Dias", parentesco: "Filho", cpf: "071.223.445-90", dataNascimento: "02/05/2012", pendencias: [] },
        { nome: "Maria Eduarda Dias", parentesco: "Filha", cpf: "—", dataNascimento: "—", pendencias: ["CPF ausente", "Data de nascimento ausente"] },
      ],
    },
    {
      id: 7, nome: "Wender Jonathan Silva", cargo: "Supervisor de Produção", cpf: "108.442.556-30",
      empresaCodigo: "MS-0027", status: "pendente_conciliacao", situacao: "ativo",
      // Só é revelado quando a Ficha Financeira "chega" — ver
      // simularConciliacaoFicha() em list.js.
      camposDivergentes: [
        { campo: "Cargo", valorLake: "Supervisor de Produção I", valorFicha: "Supervisor de Produção", valorEscolhido: null, resolvido: false },
      ],
    },
    {
      id: 8, nome: "Patrícia Nogueira Alves", cargo: "Assistente Fiscal", cpf: "233.998.112-44",
      empresaCodigo: "MS-0027", status: "pronto", situacao: "ativo", camposDivergentes: [],
      fichaCompleta: {
        dadosPessoais: {
          dataNascimento: "03/11/1990", sexo: "Feminino", estadoCivil: "Divorciada", nacionalidade: "Brasileira",
          naturalidade: "Anápolis - GO", corRaca: "Parda", grauInstrucao: "Superior Completo",
          nomePai: "Carlos Alberto Nogueira", nomeMae: "Sueli Alves Nogueira",
          telefone: "(62) 98123-4455", endereco: "Av. Brasil, 512, Apto 302, Centro, Anápolis, GO — CEP 75000-000",
        },
        documentos: {
          rg: "5.221.008 SSP/GO", ctps: "Nº 34129, Série 00098-GO", dataExpedicaoCtps: "22/01/2012",
          pis: "145.7788.990-2", tituloEleitor: "9988 7766 5544 — Zona 041 Seção 0155",
        },
        admissao: {
          matricula: "000027", dataAdmissao: "10/07/2020", funcao: "Assistente Fiscal",
          cbo: "413110", salario: "R$ 3.200,00", horarioTrabalho: "das 08:00 às 17:00", horarioIntervalo: "das 12:00 às 13:00",
        },
        bancario: { banco: "237 — Bradesco", agencia: "0455", conta: "12345-9", fgtsOpcaoEm: "10/07/2020" },
        historico: {
          alteracoesSalario: ["01/07/2024 — de R$ 2.900,00 para R$ 3.200,00 (promoção)"],
          ferias: [{ periodoAquisitivo: "10/07/2025 a 09/07/2026", periodoGozo: "Ainda não vencido" }],
        },
        resumoFinanceiroAno: {
          competencias: [
            { competencia: "06/2026", proventos: "R$ 3.200,00", descontos: "R$ 588,90", liquido: "R$ 2.611,10" },
            { competencia: "07/2026", proventos: "R$ 3.200,00", descontos: "R$ 588,90", liquido: "R$ 2.611,10" },
            { competencia: "08/2026", proventos: "R$ 3.200,00", descontos: "R$ 588,90", liquido: "R$ 2.611,10" },
          ],
          totalAno: "R$ 19.200,00",
        },
      },
    },
    {
      id: 9, nome: "Bruno Henrique Castro", cargo: "Motorista", cpf: "344.221.887-55",
      empresaCodigo: "CH-0042", status: "pronto", situacao: "ativo", camposDivergentes: [],
      fichaCompleta: {
        dadosPessoais: {
          dataNascimento: "18/06/1985", sexo: "Masculino", estadoCivil: "Casado", nacionalidade: "Brasileira",
          naturalidade: "São Paulo - SP", corRaca: "Preta", grauInstrucao: "Ensino Médio Completo",
          nomePai: "Henrique Castro Souza", nomeMae: "Vera Lúcia Castro",
          telefone: "(11) 97654-3322", endereco: "Rua Bento de Andrade, 340, Vila Clementino, São Paulo, SP — CEP 04037-000",
        },
        documentos: {
          rg: "28.774.115-2 SSP/SP", ctps: "Nº 25541, Série 00432-SP", dataExpedicaoCtps: "14/09/2005",
          pis: "112.3344.556-7", tituloEleitor: "4455 6677 8899 — Zona 227 Seção 0312", cnh: "Categoria B — validade 20/05/2029",
        },
        admissao: {
          matricula: "000009", dataAdmissao: "01/02/2019", funcao: "Motorista",
          cbo: "782310", salario: "R$ 2.680,00", horarioTrabalho: "das 07:00 às 16:00", horarioIntervalo: "das 12:00 às 13:00",
        },
        bancario: { banco: "001 — Banco do Brasil", agencia: "3312", conta: "07741-5", fgtsOpcaoEm: "01/02/2019" },
        historico: {
          alteracoesSalario: ["01/02/2025 — de R$ 2.450,00 para R$ 2.680,00 (dissídio)"],
          ferias: [{ periodoAquisitivo: "01/02/2025 a 31/01/2026", periodoGozo: "05/01/2026 a 19/01/2026" }],
        },
        resumoFinanceiroAno: {
          competencias: [
            { competencia: "06/2026", proventos: "R$ 2.680,00", descontos: "R$ 452,10", liquido: "R$ 2.227,90" },
            { competencia: "07/2026", proventos: "R$ 2.680,00", descontos: "R$ 452,10", liquido: "R$ 2.227,90" },
            { competencia: "08/2026", proventos: "R$ 2.680,00", descontos: "R$ 452,10", liquido: "R$ 2.227,90" },
          ],
          totalAno: "R$ 16.080,00",
        },
      },
    },
    {
      id: 10, nome: "Camila Ferreira Duarte", cargo: "Estoquista", cpf: "455.667.223-66",
      empresaCodigo: "CH-0042", status: "divergencia", situacao: "ativo",
      camposDivergentes: [
        { campo: "Cargo", valorLake: "Auxiliar de Estoque", valorFicha: "Estoquista", valorEscolhido: null, resolvido: false },
      ],
    },
    // Movido de PA-0011 (implantada) para CH-0042 (em andamento) — mesmo
    // motivo do comentário em Renata Cristina Dias, acima.
    { id: 11, nome: "Lucas Almeida Rezende", cargo: "Confeiteiro", cpf: "566.778.334-77", empresaCodigo: "CH-0042", status: "pendente_conciliacao", situacao: "ativo", camposDivergentes: [] },
    {
      id: 12, nome: "Juliana Prado Martins", cargo: "Atendente", cpf: "677.889.445-88",
      empresaCodigo: "PA-0011", status: "pronto", situacao: "ativo", camposDivergentes: [],
      fichaCompleta: {
        dadosPessoais: {
          dataNascimento: "27/02/1998", sexo: "Feminino", estadoCivil: "Solteira", nacionalidade: "Brasileira",
          naturalidade: "Goiânia - GO", corRaca: "Branca", grauInstrucao: "Ensino Médio Completo",
          nomePai: "Marcelo Prado Martins", nomeMae: "Ivone Cardoso Martins",
          telefone: "(62) 99456-7788", endereco: "Rua T-34, 210, Setor Bueno, Goiânia, GO — CEP 74210-000",
        },
        documentos: {
          rg: "6.112.887 SSP/GO", ctps: "Nº 91223, Série 00301-GO", dataExpedicaoCtps: "12/03/2016",
          pis: "156.9911.223-5", tituloEleitor: "2233 4455 6677 — Zona 018 Seção 0044",
        },
        admissao: {
          matricula: "000031", dataAdmissao: "20/09/2025", funcao: "Atendente",
          cbo: "521110", salario: "R$ 1.850,00", horarioTrabalho: "das 06:00 às 15:00", horarioIntervalo: "das 10:00 às 11:00",
        },
        bancario: { banco: "260 — Nu Pagamentos", agencia: "0001", conta: "88452-3", fgtsOpcaoEm: "20/09/2025" },
        historico: {
          alteracoesSalario: [],
          ferias: [{ periodoAquisitivo: "20/09/2025 a 19/09/2026", periodoGozo: "Ainda não vencido" }],
        },
        resumoFinanceiroAno: {
          competencias: [
            { competencia: "06/2026", proventos: "R$ 1.850,00", descontos: "R$ 203,50", liquido: "R$ 1.646,50" },
            { competencia: "07/2026", proventos: "R$ 1.850,00", descontos: "R$ 203,50", liquido: "R$ 1.646,50" },
            { competencia: "08/2026", proventos: "R$ 1.850,00", descontos: "R$ 203,50", liquido: "R$ 1.646,50" },
          ],
          totalAno: "R$ 11.100,00",
        },
      },
    },
    {
      id: 13, nome: "Marcos Vinícius Tavares", cargo: "Auxiliar de Produção", cpf: "788.990.556-99",
      empresaCodigo: "MS-0027", status: "divergencia", situacao: "ativo",
      camposDivergentes: [
        { campo: "Número da CTPS", valorLake: null, valorFicha: "38.220.114-2", valorEscolhido: null, resolvido: false },
        // RG e nome da mãe — outros dois campos que a Ficha Financeira traz
        // e o Lake às vezes não tem/tem desatualizado (Jaqueline, ~19:03).
        { campo: "RG", valorLake: null, valorFicha: "4.552.881 SSP/GO", valorEscolhido: null, resolvido: false },
      ],
    },
    {
      id: 14, nome: "Elisângela Costa Farias", cargo: "Auxiliar de Limpeza", cpf: "899.001.667-00",
      empresaCodigo: "CH-0042", status: "pronto", situacao: "ativo", camposDivergentes: [],
      fichaCompleta: {
        dadosPessoais: {
          dataNascimento: "09/12/1979", sexo: "Feminino", estadoCivil: "União Estável", nacionalidade: "Brasileira",
          naturalidade: "Salvador - BA", corRaca: "Preta", grauInstrucao: "Ensino Fundamental Incompleto",
          nomePai: "Não informado", nomeMae: "Maria da Conceição Farias",
          telefone: "(71) 98877-6655", endereco: "Rua da Paz, 55, Liberdade, Salvador, BA — CEP 40320-000",
        },
        documentos: {
          rg: "9.887.221 SSP/BA", ctps: "Nº 66120, Série 00212-BA", dataExpedicaoCtps: "03/04/2001",
          pis: "109.4433.221-6", tituloEleitor: "5566 7788 9900 — Zona 003 Seção 0511",
        },
        admissao: {
          matricula: "000021", dataAdmissao: "12/05/2022", funcao: "Auxiliar de Limpeza",
          cbo: "513425", salario: "R$ 1.650,00", horarioTrabalho: "das 07:00 às 16:00", horarioIntervalo: "das 11:00 às 12:00",
        },
        bancario: { banco: "341 — Itaú", agencia: "6621", conta: "03392-8", fgtsOpcaoEm: "12/05/2022" },
        historico: {
          alteracoesSalario: ["01/05/2025 — de R$ 1.500,00 para R$ 1.650,00 (dissídio)"],
          ferias: [{ periodoAquisitivo: "12/05/2025 a 11/05/2026", periodoGozo: "Ainda não vencido" }],
        },
        resumoFinanceiroAno: {
          competencias: [
            { competencia: "06/2026", proventos: "R$ 1.650,00", descontos: "R$ 181,50", liquido: "R$ 1.468,50" },
            { competencia: "07/2026", proventos: "R$ 1.650,00", descontos: "R$ 181,50", liquido: "R$ 1.468,50" },
            { competencia: "08/2026", proventos: "R$ 1.650,00", descontos: "R$ 181,50", liquido: "R$ 1.468,50" },
          ],
          totalAno: "R$ 9.900,00",
        },
      },
    },
    // ===== status "nao_encontrado_lake" — ver comentário do bloco acima =====
    {
      id: 15, nome: "Beatriz Nunes Andrade", cargo: "Auxiliar de Produção", cpf: "923.445.110-22",
      empresaCodigo: "MS-0027", status: "nao_encontrado_lake", situacao: "ativo", camposDivergentes: [],
      dadosFicha: {
        "Nome da mãe": "Aparecida Nunes Andrade", "RG": "5.887.221 SSP/GO", "PIS/PASEP": "185.2231.900-4",
        "Data de admissão": "12/08/2026", "Salário de admissão": "R$ 1.850,00", "Último salário efetivo": "R$ 1.850,00",
      },
    },
    {
      id: 16, nome: "Rodrigo Almeida Teixeira", cargo: "Vendedor", cpf: "734.221.556-89",
      empresaCodigo: "CH-0042", status: "nao_encontrado_lake", situacao: "ativo", camposDivergentes: [],
      dadosFicha: {
        "Nome da mãe": "Sônia Almeida Teixeira", "RG": "3.221.874 SSP/GO", "PIS/PASEP": "170.9982.334-1",
        "Data de admissão": "03/08/2026", "Salário de admissão": "R$ 1.700,00", "Último salário efetivo": "R$ 1.700,00",
      },
    },
    // ===== status "rejeitado" — RF-DP-402/403: validação antes de gravar
    // (CPF válido, data coerente, categoria existente na tabela do eSocial,
    // sem duplicidade/acento/caractere especial). Linha inválida é rejeitada
    // com motivo e número, sem derrubar o lote inteiro.
    //
    // Corrigível ali mesmo no Modal de Rejeição, sem precisar reenviar o
    // arquivo inteiro (RF-DP-408 — "reprocessamento parcial só da linha
    // rejeitada, sem duplicar" — reprocessar a LINHA, não necessariamente o
    // arquivo). O operador já está vendo a Ficha original; um typo de CPF ou
    // um artefato de extração de PDF no nome dá pra corrigir na hora, mesmo
    // padrão de correção pontual já usado no Modal de Inconsistência (CNPJ
    // não identificado). `campoInvalido` diz qual campo tem o valor
    // rejeitado; `valorExtraido` é o que veio (com o erro), pré-preenchido
    // no input de correção. =====
    {
      id: 19, nome: "Roberto Carlos Nascimento", cargo: "Auxiliar de Produção", cpf: "111.222.333-4X",
      empresaCodigo: "MS-0027", status: "rejeitado", situacao: "ativo", camposDivergentes: [],
      campoInvalido: "cpf", valorExtraido: "111.222.333-4X",
      motivoRejeicao: "CPF inválido — dígito verificador não confere. Confira o número na Ficha original e corrija abaixo.",
      linhaFicha: 14,
    },
    {
      // Artefato de extração do PDF (marcador de nota de rodapé "¹" colado
      // no fim do nome) — não é acentuação legítima do português (isso seria
      // rejeitar quase todo nome brasileiro). RN-DP-21 é sobre símbolo/
      // espaço indevido vindo de erro de leitura, não sobre "ã"/"ô"/"é".
      id: 20, nome: "José Antônio da Conceição", cargo: "Vendedor", cpf: "245.667.889-30",
      empresaCodigo: "CH-0042", status: "rejeitado", situacao: "ativo",
      campoInvalido: "nome", valorExtraido: "José Antônio da Conceição¹",
      motivoRejeicao: "Nome com caractere não suportado — provável artefato da extração do PDF (marcador de nota de rodapé). Corrija abaixo.",
      linhaFicha: 7,
      // Só aparece depois que o nome for corrigido e a linha reprocessada
      // (enquanto "rejeitado", a linha nem chega a ser conciliada contra o
      // Lake) — ver salvarCorrecaoRejeitado() em list.js.
      camposDivergentes: [
        { campo: "Endereço", valorLake: "Rua Barão do Rio Branco, 88", valorFicha: "Rua Barão do Rio Branco, 90", valorEscolhido: null, resolvido: false },
      ],
    },
    // ===== status "aguardando_esocial" — RF-DP-401/409: a base Domínio não
    // trouxe a categoria do trabalhador (ou não cobre a empresa) — eSocial
    // só é acionado nesse caminho de exceção, com o motivo registrado. =====
    {
      // Movida de PA-0011 (implantada) para CH-0042 (em andamento) — mesmo
      // motivo do comentário em Renata Cristina Dias.
      id: 21, nome: "Simone Aparecida Ribeiro", cargo: "Auxiliar de Cozinha", cpf: "356.789.112-40",
      empresaCodigo: "CH-0042", status: "aguardando_esocial", situacao: "ativo", camposDivergentes: [],
      motivoEsocial: "Categoria do trabalhador não informada pela base Domínio para esta empresa.",
      categoriaEsocial: "Empregado — CLT",
    },
    {
      id: 22, nome: "Anderson Luiz Farias", cargo: "Auxiliar de Produção", cpf: "467.890.223-51",
      empresaCodigo: "MS-0027", status: "aguardando_esocial", situacao: "ativo", camposDivergentes: [],
      motivoEsocial: "Empresa ainda não coberta pela base Domínio — consultando o eSocial como caminho de exceção.",
      categoriaEsocial: "Empregado — CLT",
    },
    // Desligados — fora da fila de implantação por padrão (getColaboradores()
    // já filtra por situacao:"ativo"; ver comentário do bloco acima).
    { id: 17, nome: "Vitor Hugo Campos", cargo: "Auxiliar de Produção", cpf: "556.771.883-40", empresaCodigo: "MS-0027", status: "pronto", situacao: "desligado", camposDivergentes: [] },
    { id: 18, nome: "Sandra Regina Oliveira", cargo: "Vendedora", cpf: "667.882.994-51", empresaCodigo: "CH-0042", status: "divergencia", situacao: "desligado", camposDivergentes: [{ campo: "Salário", valorLake: "R$ 1.900,00", valorFicha: "R$ 1.950,00", valorEscolhido: null, resolvido: false }] },
  ];

  // Lote de importação pendente na tela de upload — mesmas três empresas do
  // mock acima; a Padaria Aurora chega com CNPJ não identificado de
  // propósito, para exercitar o caminho de associação manual (Modal de
  // Inconsistência).
  // CNPJs iguais aos de EmpresasData.EMPRESAS (dadosGerais.cnpj) — é contra
  // eles que a validação de Cockpit (RN, alinhamento 10/09/2026) compara.
  const ARQUIVOS_LOTE_INICIAL = [
    { nomeArquivo: "Ficha_Financeira_Metalurgica_Sigma.pdf", tamanhoKb: 2380, cnpj: "06.265.226/0001-09", empresaCodigo: "MS-0027", status: "identificado", colaboradoresDetectados: 18 },
    { nomeArquivo: "Ficha_Financeira_Comercio_Horizonte.pdf", tamanhoKb: 1790, cnpj: "22.333.444/0001-55", empresaCodigo: "CH-0042", status: "identificado", colaboradoresDetectados: 9 },
    { nomeArquivo: "Ficha_Padaria_Aurora_v2.pdf", tamanhoKb: 1120, cnpj: null, empresaCodigo: null, status: "nao_identificado", colaboradoresDetectados: 0 },
    // CNPJ lido normalmente do arquivo, mas não existe no Cockpit com a tag
    // Autopilot DP — "se não estiver no cockpit com a tag, não entra aqui
    // pra gente, não fica disponível" (Jeniffer). Caminho de exceção
    // diferente de "não identificado": aqui o CNPJ foi lido com sucesso, só
    // não está habilitado.
    { nomeArquivo: "Ficha_Financeira_Industria_Nova.pdf", tamanhoKb: 980, cnpj: "88.554.221/0001-77", empresaCodigo: null, status: "cnpj_nao_cadastrado", colaboradoresDetectados: 0 },
    // Padaria Aurora já está "implantada" (EmpresasImplantacaoData) — exemplo
    // pronto pra exercitar o bloqueio de empresa já em operação sem precisar
    // esgotar o pool de arquivos-mock primeiro.
    { nomeArquivo: "Ficha_Financeira_Padaria_Aurora.pdf", tamanhoKb: 1340, cnpj: "12.345.678/0001-90", empresaCodigo: "PA-0011", status: "identificado", colaboradoresDetectados: 6 },
  ];

  // Pools para gerar os colaboradores "processados" no resultado da
  // importação (determinístico — por índice, sem Math.random, mesmo padrão
  // do restante do protótipo) — não há necessidade de nomear individualmente
  // os ~27 colaboradores de um lote grande.
  const NOMES_POOL = ["Gabriel", "Larissa", "Rafael", "Beatriz", "Thiago", "Camila", "Diego", "Aline", "Rodrigo", "Vanessa", "Felipe", "Priscila", "Eduardo", "Tatiane", "Vinícius", "Débora", "Leonardo", "Simone", "André", "Cristiane"];
  const SOBRENOMES_POOL = ["Souza", "Lima", "Ferreira", "Barbosa", "Ribeiro", "Carvalho", "Gomes", "Martins", "Araújo", "Teixeira"];
  const CARGOS_POOL = ["Auxiliar de Produção", "Operador de Máquinas", "Assistente Administrativo", "Vendedor", "Auxiliar de Estoque", "Técnico de Manutenção"];

  function gerarNomeMock(indice) {
    const nome = NOMES_POOL[indice % NOMES_POOL.length];
    const sobrenome = SOBRENOMES_POOL[Math.floor(indice / NOMES_POOL.length) % SOBRENOMES_POOL.length];
    return nome + " " + sobrenome;
  }
  function gerarCpfMock(seed) {
    const p = (n) => String(n).padStart(3, "0").slice(-3);
    return p(100 + seed * 7) + "." + p(200 + seed * 11) + "." + p(300 + seed * 13) + "-" + String(10 + (seed % 90)).padStart(2, "0");
  }

  // Ficha completa (RF-DP-417) para colaborador "pronto" gerado em lote —
  // mesma estrutura usada nos colaboradores nomeados acima, só que
  // determinística por seed (sem Math.random), pra "Visualizar" também
  // mostrar dados completos em quem veio de uma importação, não só nos
  // colaboradores cadastrados à mão.
  const CIDADES_UF_POOL = ["São Paulo - SP", "Goiânia - GO", "Salvador - BA", "Belo Horizonte - MG", "Curitiba - PR", "Recife - PE", "Manaus - AM", "Porto Alegre - RS"];
  const BANCOS_POOL = ["341 — Itaú", "001 — Banco do Brasil", "104 — Caixa Econômica Federal", "237 — Bradesco", "260 — Nu Pagamentos", "033 — Santander"];
  const ESCOLARIDADE_POOL = ["Ensino Fundamental Completo", "Ensino Médio Completo", "Superior Completo", "Ensino Médio Incompleto"];
  const COR_RACA_POOL = ["Branca", "Parda", "Preta", "Amarela"];
  const NOMES_MAE_POOL = ["Maria", "Ana", "Sandra", "Rosana", "Vera", "Ivone", "Conceição", "Aparecida"];

  const CARGOS_CBO_POOL = ["848405", "784205", "411005", "521110", "414140", "999999"];

  function gerarFichaCompletaMock(seed, cargo, cargoCbo, matricula) {
    const dia = String(1 + (seed % 28)).padStart(2, "0");
    const mes = String(1 + (seed % 12)).padStart(2, "0");
    const anoNasc = 1975 + (seed % 30);
    const anoAdmissao = 2023 + (seed % 3);
    const salario = 1700 + (seed % 12) * 150;
    const salarioFmt = "R$ " + salario.toLocaleString("pt-BR") + ",00";
    const descontos = Math.round(salario * 0.11);
    const liquido = salario - descontos;
    const cidade = CIDADES_UF_POOL[seed % CIDADES_UF_POOL.length];
    return {
      dadosPessoais: {
        dataNascimento: dia + "/" + mes + "/" + anoNasc,
        sexo: seed % 2 === 0 ? "Feminino" : "Masculino",
        estadoCivil: ["Solteiro(a)", "Casado(a)", "União Estável", "Divorciado(a)"][seed % 4],
        nacionalidade: "Brasileira",
        naturalidade: cidade,
        corRaca: COR_RACA_POOL[seed % COR_RACA_POOL.length],
        grauInstrucao: ESCOLARIDADE_POOL[seed % ESCOLARIDADE_POOL.length],
        nomePai: "Não informado",
        nomeMae: NOMES_MAE_POOL[seed % NOMES_MAE_POOL.length] + " " + SOBRENOMES_POOL[(seed + 3) % SOBRENOMES_POOL.length],
        telefone: "(11) 9" + String(6000 + seed * 37).slice(-4) + "-" + String(1000 + seed * 91).slice(-4),
        endereco: "Rua " + SOBRENOMES_POOL[seed % SOBRENOMES_POOL.length] + ", " + (100 + seed * 3) + ", " + cidade + " — CEP " + String(10000 + seed * 113).slice(-5) + "-000",
      },
      documentos: {
        rg: (seed * 137 + 1000000).toString().slice(0, 8).replace(/(\d{1,2})(\d{3})(\d{3})/, "$1.$2.$3") + " SSP/SP",
        ctps: "Nº " + (10000 + seed * 41) + ", Série 00" + (100 + (seed % 400)) + "-SP",
        dataExpedicaoCtps: dia + "/" + mes + "/" + (anoNasc + 18),
        pis: "1" + String(20000000000 + seed * 9973).slice(0, 10).replace(/(\d{3})(\d{5})(\d{2})/, "$1.$2$3-") + (seed % 10),
        tituloEleitor: String(1000 + seed * 7).padStart(4, "0") + " " + String(2000 + seed * 11).padStart(4, "0") + " " + String(3000 + seed * 13).padStart(4, "0") + " — Zona 0" + (10 + (seed % 80)) + " Seção 0" + (100 + (seed % 400)),
      },
      admissao: {
        matricula: String(matricula).padStart(6, "0"),
        dataAdmissao: dia + "/" + mes + "/" + anoAdmissao,
        funcao: cargo,
        cbo: cargoCbo,
        salario: salarioFmt,
        horarioTrabalho: "das 08:00 às 17:00",
        horarioIntervalo: "das 12:00 às 13:00",
      },
      bancario: {
        banco: BANCOS_POOL[seed % BANCOS_POOL.length],
        agencia: String(1000 + seed * 3).slice(0, 4),
        conta: String(10000 + seed * 71).slice(0, 5) + "-" + (seed % 10),
        fgtsOpcaoEm: dia + "/" + mes + "/" + anoAdmissao,
      },
      historico: {
        alteracoesSalario: [],
        ferias: [{ periodoAquisitivo: dia + "/" + mes + "/" + (anoAdmissao + 1) + " a " + dia + "/" + mes + "/" + (anoAdmissao + 2), periodoGozo: "Ainda não vencido" }],
      },
      resumoFinanceiroAno: {
        competencias: [
          { competencia: "06/2026", proventos: salarioFmt, descontos: "R$ " + descontos.toLocaleString("pt-BR") + ",00", liquido: "R$ " + liquido.toLocaleString("pt-BR") + ",00" },
          { competencia: "07/2026", proventos: salarioFmt, descontos: "R$ " + descontos.toLocaleString("pt-BR") + ",00", liquido: "R$ " + liquido.toLocaleString("pt-BR") + ",00" },
          { competencia: "08/2026", proventos: salarioFmt, descontos: "R$ " + descontos.toLocaleString("pt-BR") + ",00", liquido: "R$ " + liquido.toLocaleString("pt-BR") + ",00" },
        ],
        totalAno: "R$ " + (liquido * 3).toLocaleString("pt-BR") + ",00",
      },
    };
  }

  // Todo colaborador que chega a "pronto" precisa da ficha completa (RF-DP-417),
  // não só os que já nasceram prontos no mock — usada quando um colaborador
  // "divergencia"/"pendente_conciliacao"/"nao_encontrado_lake" é conciliado
  // (ver salvarConciliacaoConcil/simularConciliacaoFichaConcil/
  // criarColaboradorSemLakeConcil em implantacao-console.html) e ainda não
  // tem fichaCompleta gerada. Seed pelo id do colaborador — determinístico.
  function gerarFichaCompletaParaColaborador(colaborador) {
    return gerarFichaCompletaMock(colaborador.id, colaborador.cargo, CARGOS_CBO_POOL[colaborador.id % CARGOS_CBO_POOL.length], colaborador.id);
  }

  // Gera `qtdSemDivergencia` colaboradores "pronto" + `qtdDivergencia`
  // colaboradores "divergencia" (com 1 campo mock divergente cada) para uma
  // empresa do lote — usado por js/implantacao/importar.js ao concluir a
  // importação, para que "Ver os N com divergência" na listagem tenha dados
  // reais para mostrar.
  function gerarColaboradoresLote(empresaCodigo, qtdSemDivergencia, qtdDivergencia, idInicial) {
    const gerados = [];
    let id = idInicial;
    let seed = idInicial;
    for (let i = 0; i < qtdSemDivergencia; i++) {
      const cargoIndice = seed % CARGOS_POOL.length;
      const cargo = CARGOS_POOL[cargoIndice];
      gerados.push({
        id: id++, nome: gerarNomeMock(seed), cargo: cargo, cpf: gerarCpfMock(seed),
        empresaCodigo: empresaCodigo, status: "pronto", camposDivergentes: [],
        fichaCompleta: gerarFichaCompletaMock(seed, cargo, CARGOS_CBO_POOL[cargoIndice], id - 1),
      });
      seed++;
    }
    for (let i = 0; i < qtdDivergencia; i++) {
      gerados.push({
        id: id++, nome: gerarNomeMock(seed), cargo: CARGOS_POOL[seed % CARGOS_POOL.length], cpf: gerarCpfMock(seed),
        empresaCodigo: empresaCodigo, status: "divergencia",
        camposDivergentes: [
          { campo: "Salário", valorLake: "R$ " + (1800 + (seed % 6) * 150) + ",00", valorFicha: "R$ " + (1850 + (seed % 6) * 150) + ",00", valorEscolhido: null, resolvido: false },
        ],
      });
      seed++;
    }
    return gerados;
  }

  function loadStore(key, fallback) {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : JSON.parse(JSON.stringify(fallback));
    } catch (e) {
      return JSON.parse(JSON.stringify(fallback));
    }
  }
  function saveStore(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      /* localStorage indisponível — segue só em memória nesta renderização */
    }
  }

  const COLABORADORES_KEY = "autopilot_prototype_implantacao_colaboradores_v1";

  // Acesso "cru" (todas as situações) — usado para persistência
  // (leitura-modificação-escrita por id) em list.js/importar.js, nunca para
  // montar a listagem em tela. Para isso, use getColaboradoresAtivos().
  function getColaboradores() {
    return loadStore(COLABORADORES_KEY, COLABORADORES_INICIAL);
  }
  function setColaboradores(colaboradores) {
    saveStore(COLABORADORES_KEY, colaboradores);
  }
  // A fila de implantação só considera colaboradores ativos (reunião de
  // discovery, Andressa ~11:26) — desligados nunca aparecem na Tela 1, mas
  // continuam gravados (getColaboradores() ainda os retorna) para não perder
  // dado ao salvar uma conciliação de outro colaborador.
  function getColaboradoresAtivos() {
    return getColaboradores().filter((c) => c.situacao !== "desligado");
  }
  function adicionarColaboradoresImportados(novos) {
    const atuais = getColaboradores();
    const maiorId = atuais.reduce((max, c) => Math.max(max, c.id), 0);
    const comIdsAjustados = novos.map((c, i) => Object.assign({}, c, { id: maiorId + i + 1 }));
    setColaboradores(atuais.concat(comIdsAjustados));
    return comIdsAjustados;
  }

  function contarPorStatus(colaboradores) {
    return {
      total: colaboradores.length,
      divergencia: colaboradores.filter((c) => c.status === "divergencia").length,
      pendenteConciliacao: colaboradores.filter((c) => c.status === "pendente_conciliacao").length,
      pronto: colaboradores.filter((c) => c.status === "pronto").length,
      naoEncontradoLake: colaboradores.filter((c) => c.status === "nao_encontrado_lake").length,
      rejeitado: colaboradores.filter((c) => c.status === "rejeitado").length,
      aguardandoEsocial: colaboradores.filter((c) => c.status === "aguardando_esocial").length,
    };
  }

  function camposNaoResolvidos(colaborador) {
    return (colaborador.camposDivergentes || []).filter((c) => !c.resolvido);
  }

  function iniciais(nome) {
    const partes = nome.trim().split(/\s+/);
    const primeira = partes[0] ? partes[0][0] : "";
    const ultima = partes.length > 1 ? partes[partes.length - 1][0] : "";
    return (primeira + ultima).toUpperCase();
  }

  // ===== Validadores da correção inline de linha rejeitada (RF-DP-402) =====
  // Cálculo padrão dos dígitos verificadores do CPF — mesma regra que a
  // Ficha Financeira precisa passar antes de gravar.
  function validarCpf(valor) {
    const d = (valor || "").replace(/\D/g, "");
    if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
    function digitoVerificador(base) {
      let soma = 0;
      for (let i = 0; i < base.length; i++) soma += Number(base[i]) * (base.length + 1 - i);
      const resto = (soma * 10) % 11;
      return resto === 10 ? 0 : resto;
    }
    const d1 = digitoVerificador(d.slice(0, 9));
    const d2 = digitoVerificador(d.slice(0, 9) + d1);
    return d === d.slice(0, 9) + String(d1) + String(d2);
  }

  // Nome só com letras (com acentuação legítima do português), espaço,
  // hífen e apóstrofo — barra artefato de extração de PDF (símbolo, dígito
  // solto, marcador de nota) sem barrar acentuação normal (RN-DP-21).
  function validarNome(valor) {
    const v = (valor || "").trim();
    return v.length > 1 && /^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/.test(v);
  }

  // Toast compartilhado pela página, replicado como em SociosData/ContadoresData
  // (esta trilha não usa o shell de abas de detalhe de empresa).
  function ensureToast() {
    if (document.getElementById("toast")) return;
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.id = "toast";
    toast.innerHTML =
      '<span class="toast-icon"></span><div class="flex flex-col gap-0-5"><span class="toast-title"></span><span class="toast-desc"></span></div>';
    document.body.appendChild(toast);
  }

  global.ImplantacaoData = {
    COLABORADORES_INICIAL,
    ARQUIVOS_LOTE_INICIAL,
    getColaboradores,
    getColaboradoresAtivos,
    setColaboradores,
    adicionarColaboradoresImportados,
    gerarColaboradoresLote,
    gerarFichaCompletaParaColaborador,
    contarPorStatus,
    camposNaoResolvidos,
    iniciais,
    validarCpf,
    validarNome,
    ensureToast,
  };
})(window);
