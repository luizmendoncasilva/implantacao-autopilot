/*
  Mapa estático de labels — Folha de Pagamento (P24, Pacote 2:
  docs/folha-pagamento-fase8-p24-projeto-tecnico-historico-real.md, D-4).

  Extração assistida dos literais já usados como argumento de label nas
  chamadas de campo em prototype/folha-pagamento/js/folha-page.js
  (textField/selectField/checkboxField/radioField/monthField/horaField/
  checklist/condRule/montaTabelaLinhasFixas), área por área, seguida de
  revisão manual. NENHUM texto foi criado, traduzido, resumido ou
  "melhorado" — cada valor é uma cópia literal do texto já exibido ao
  usuário na interface atual.

  Este arquivo não é consumido por nenhuma tela ainda — é um catálogo
  estático, sem efeito visual ou funcional, destinado a ser usado pelos
  schemas do Pacote 3 (historico-schemas.js) para compor `campo` nos itens
  de `alteracoes: [{campo, de, para}]` do Histórico Real.

  Estrutura por área:
  - `LABELS_<AREA>`: mapa "path.tecnico" -> "Label exibido ao usuário",
    para campos simples, folhas de objetos aninhados e campos condicionais
    (sem nenhuma regra de aplicabilidade — isso pertence ao Pacote 3/D-2/E3).
  - Quando a área tem tabela(s) de linhas fixas ou dinâmicas, um objeto
    `TABELA_<...>` separado, com `linhas` (rótulos de linha, na ordem real
    do array em data.js) e `colunas` (path da coluna -> label da coluna) —
    nunca uma entrada por índice de linha (seção 8 do Pacote 2).

  Nenhuma regra de vigência, categoria ativa ou aplicabilidade condicional
  foi criada aqui — apenas nomenclatura (seções 10-12 do Pacote 2).
*/
(function (global) {
  // ===========================================================================
  // GERAL (Fase 1) — eSocial, Cálculo, Unidade de Cálculo, Personaliza,
  // Informações. Paths conforme montaEsocial()/montaCalculo()/
  // montaUnidadeCalculo()/montaPersonaliza()/montaInformacoes().
  // ===========================================================================
  const LABELS_GERAL = {
    // --- eSocial > Configurações de Envio > Geral ---
    "esocial.envioGeral.gerarESocial": "Gerar eSocial",
    "esocial.envioGeral.tipoAmbiente": "Tipo de ambiente",
    "esocial.envioGeral.certificadoDigital": "Certificado digital",
    "esocial.envioGeral.tipoCentralizacao": "Tipo de centralização",
    "esocial.envioGeral.inscricaoTransmissorTipo": "Inscrição do transmissor — tipo",
    "esocial.envioGeral.inscricaoTransmissorNumero": "Inscrição do transmissor — número",
    "esocial.envioGeral.contadorCodigoNome": "Contador (código/nome)",
    "esocial.envioGeral.empresaCentralizadoraCodigo": "Empresa centralizadora (código)",
    "esocial.envioGeral.empresaJaEnviada": "Empresa já enviada anteriormente",
    "esocial.envioGeral.competenciaInicioUso": "Competência de início da utilização nesse banco de dados",
    "esocial.envioGeral.naoEnviarEventos.ativo": "Não enviar eventos ao eSocial a partir de",
    "esocial.envioGeral.naoEnviarEventos.data": "A partir de",
    "esocial.envioGeral.possuiCentralizadoraOutroBanco": "Possui a empresa centralizadora em outro banco de dados",
    // --- eSocial > Faseamento ---
    "esocial.faseamento.faseamento": "Faseamento",
    "esocial.faseamento.tabelaData": "Tabela (data)",
    "esocial.faseamento.naoPeriodicosData": "Não periódicos (data)",
    "esocial.faseamento.periodicosData": "Periódicos (data)",
    "esocial.faseamento.sstData": "Saúde e Segurança no Trabalho — SST (data)",
    "esocial.faseamento.possuiRPPS": "Possui empregado com Regime Próprio de Previdência Social — RPPS",
    "esocial.faseamento.periodicosRPPSData": "Periódicos — RPPS (data)",
    "esocial.faseamento.naoEnviarNaoPeriodicosAuto.ativo": "Não enviar automaticamente os eventos não periódicos a partir de",
    "esocial.faseamento.naoEnviarNaoPeriodicosAuto.data": "A partir de",
    // --- eSocial > SST ---
    "esocial.sst.naoEnviarSST.ativo": "Não enviar eventos de SST ao eSocial pelo módulo folha a partir de",
    "esocial.sst.naoEnviarSST.data": "A partir de",
    "esocial.sst.vincularOutroResponsavel": "Vincular outro responsável para o envio dos eventos de SST",
    "esocial.sst.certificadoResponsavel": "Certificado do Responsável de SST / Certificado da Empresa",
    "esocial.sst.codigoResponsavel": "Código do Responsável",
    "esocial.sst.eventos.s2210": "S-2210 — Comunicação de Acidente de Trabalho",
    "esocial.sst.eventos.s2220": "S-2220 — Monitoramento da Saúde do Trabalhador",
    "esocial.sst.eventos.s2221": "S-2221 — Exame Toxicológico do Motorista Profissional",
    "esocial.sst.eventos.s2240": "S-2240 — Condições Ambientais do Trabalho (Agentes Nocivos)",
    // --- eSocial > Dados Cadastrais e Tributários / Contratações PCD / Órgãos Públicos ---
    "esocial.dadosCadastraisTributarios.classificacaoTributaria": "Classificação tributária",
    "esocial.dadosCadastraisTributarios.cooperativa": "Cooperativa",
    "esocial.dadosCadastraisTributarios.produtorRural": "Produtor rural",
    "esocial.dadosCadastraisTributarios.entidadeSemFins": "Entidade sem fins lucrativos",
    "esocial.dadosCadastraisTributarios.empresaTrabalhoTemporario": "Empresa de trabalho temporário",
    "esocial.dadosCadastraisTributarios.calculaFunrural": "Calcula FUNRURAL sobre a folha de pagamento",
    "esocial.dadosCadastraisTributarios.construtora": "Construtora",
    "esocial.dadosCadastraisTributarios.entidadeEducativa": "Entidade Educativa/Prática Desportiva (Aprendiz)",
    "esocial.dadosCadastraisTributarios.numeroRegistroMTE": "Número de registro no Ministério do Trabalho",
    "esocial.dadosCadastraisTributarios.optouRegistroEletronico": "Optou pelo registro eletrônico de empregados",
    "esocial.dadosCadastraisTributarios.possuiAcordoInternacional": "Possui acordo internacional para isenção de multa",
    "esocial.dadosCadastraisTributarios.utilizaModuloWebSimplificado": "Utiliza Módulo Web Simplificado ME e EPP",
    "esocial.dadosCadastraisTributarios.geraESocialDomestico": "Gera eSocial doméstico",
    "esocial.dadosCadastraisTributarios.tipoAcesso": "Tipo de acesso",
    "esocial.dadosCadastraisTributarios.codigoAcesso": "Código de acesso",
    "esocial.dadosCadastraisTributarios.senha": "Senha",
    "esocial.dadosCadastraisTributarios.possuiSituacaoEspecial": "Possui situação especial",
    "esocial.dadosCadastraisTributarios.situacao": "Situação",
    "esocial.contratacoesPCD.contratacaoPCD": "Contratação de pessoa com deficiência",
    "esocial.contratacoesPCD.numeroProcesso": "Número do processo",
    "esocial.orgaosPublicos.cnpjEnteFederativo": "CNPJ Ente Federativo Responsável",

    // --- Cálculo ---
    "calculo.competenciaAtual": "Competência atual",
    "calculo.tipoFolhaAtual": "Tipo folha atual",
    "calculo.discriminarDSR": "Discriminar DSR",
    "calculo.lancamentoHoras": "Lançamento de horas",
    "calculo.calculoProporcionalidade": "Cálculo proporcionalidade",
    "calculo.folhaProfessores": "Folha de professores",
    "calculo.folhaSemanal": "Folha semanal",
    "calculo.agentePublico": "Agente Público",
    "calculo.usaRubricasEmpresa.ativo": "Usa rubricas da empresa (código/nome)",
    "calculo.usaRubricasEmpresa.codigoNome": "Empresa de referência (código/nome)",
    "calculo.permitirProporcionalizarCarga.ativo": "Permitir proporcionalizar a carga horária conforme alterações do cadastro do empregado a partir de",
    "calculo.permitirProporcionalizarCarga.data": "A partir de",
    "calculo.efetuarCalculoDCTFWeb.ativo": "Efetuar cálculo de Tributos federais conforme DCTFWeb a partir de",
    "calculo.efetuarCalculoDCTFWeb.data": "A partir de",
    "calculo.rateioPorServico.ativo": "Rateio por serviço",
    "calculo.rateioPorServico.data": "A partir de",
    "calculo.rateioPorServico.tipoRateio": "Tipo de rateio",
    "calculo.calcularSalarioProporcionalAlteracao": "Calcular salário no mês da alteração salarial de forma proporcional à data da alteração",
    "calculo.calcularINSSMultiplosVinculos": "Calcular INSS para colaboradores com múltiplos vínculos conforme eSocial em competências anteriores a 02/2020",

    // --- Unidade de Cálculo ---
    "unidadeCalculo.vigencia": "Vigência",
    "unidadeCalculo.descricao": "Descrição",
    "unidadeCalculo.opcaoUnidade": "Opções para unidade do cálculo",
    "unidadeCalculo.unidadePorCategoria.mensalistas": "Unidade — Mensalistas",
    "unidadeCalculo.unidadePorCategoria.semanalistas": "Unidade — Semanalistas",
    "unidadeCalculo.unidadePorCategoria.comissionados": "Unidade — Comissionados",
    "unidadeCalculo.unidadePorCategoria.diaristas": "Unidade — Diaristas",
    "unidadeCalculo.unidadePorCategoria.tarefeiros": "Unidade — Tarefeiros",
    "unidadeCalculo.unidadePorCategoria.contribuintes": "Unidade — Contribuintes",

    // --- Personaliza > Opções Gerais ---
    "personaliza.opcoesGeral.limiteEstagiariosSupervisor.ativo": "Não permitir mais de [N] estagiários vinculados a um mesmo Supervisor de Estágio",
    "personaliza.opcoesGeral.limiteEstagiariosSupervisor.numero": "Número máximo de estagiários",
    "personaliza.opcoesGeral.calcularDiarias.ativo": "Calcular diárias",
    "personaliza.opcoesGeral.calcularDiarias.consideraComoRemuneracao": "Considerar como remuneração",
    "personaliza.opcoesGeral.naoCalcularDiariasTributaveis.ativo": "Não calcular diárias tributáveis a partir de",
    "personaliza.opcoesGeral.naoCalcularDiariasTributaveis.data": "A partir de",
    "personaliza.opcoesGeral.configurarRubricasDescontoCompulsorio": "Configurar rubricas para serem consideradas como desconto compulsório (Empréstimo Crédito do Trabalhador)",
    "personaliza.opcoesGeral.naoPermitirSalarioAbaixoPiso": "Não permitir salário contratual abaixo do piso salarial",
    "personaliza.opcoesGeral.efetuarLancamentoRubricasPorServico": "Efetuar lançamento de rubricas por serviço",
    "personaliza.opcoesGeral.permitirInformarDatasFaltasParciais": "Permitir informar datas nos lançamentos de faltas parciais",
    "personaliza.opcoesGeral.considerarPeriodoSindicatoAlteracaoSalarial": "Considerar o período vinculado a cada sindicato para o cálculo de alteração salarial conforme CCT",
    "personaliza.opcoesGeral.considerarDiasMesCompetenciaInicioEstagio": "Considerar os dias do mês para cálculo da competência de início do estágio",
    "personaliza.opcoesGeral.permitirTipoAnaliticoSinteticoCentroCustos": "Permitir informar o tipo Analítico ou Sintético para os Centros de Custos",
    "personaliza.opcoesGeral.discriminarHorasCompensacaoSabado": "Discriminar as horas referentes à compensação do sábado na jornada diária",
    "personaliza.opcoesGeral.naoCalcularPLRDemitido": "Não calcular a folha de Participação de Lucros quando o colaborador estiver demitido",
    "personaliza.opcoesGeral.calcularRemuneracaoIntegralAfastamentoContribuintes": "Calcular remuneração integralmente nos meses de início e retorno do afastamento para contribuintes",

    // --- Personaliza > DSR ---
    "personaliza.dsr.descontarFaltasDSRCompetenciaFalta": "Descontar as faltas de DSR na competência da data da falta",
    "personaliza.dsr.descontarDSRMesmaSemanaFalta": "Descontar o DSR na mesma semana da falta",
    "personaliza.dsr.descontarFaltasDSRDiaFolga": "Descontar as faltas de DSR conforme o dia de folga da jornada do empregado",
    "personaliza.dsr.naoDescontarDSRFeriados": "Não descontar o DSR quando este recai em feriados",
    "personaliza.dsr.considerarDSRAfastadoDoencaDireitosIntegrais": "Considerar os DSRs durante o período afastado por doença com direitos integrais",
    "personaliza.dsr.calcularDSRUmSextoHoristaVariavel": "Calcular para DSR o valor de 1/6 sobre a base quando horista que possui carga horária variável",
    "personaliza.dsr.calcularDSRUmSextoDiaristaVariavel": "Calcular para DSR o valor de 1/6 sobre a base quando diarista que possui carga horária variável",
    "personaliza.dsr.calcularDSRUmSextoIntermitente": "Calcular para DSR o valor de 1/6 sobre a base quando empregado com vínculo celetista intermitente",

    // --- Personaliza > Salário Família ---
    "personaliza.salarioFamilia.naoCalcularDomesticoLicencaMaternidade": "Não calcular salário família para empregados domésticos durante o período de licença maternidade",
    "personaliza.salarioFamilia.calcularMesmoDescontosMaioresProventos": "Calcular salário família mesmo que os descontos sejam maiores que os proventos",
    "personaliza.salarioFamilia.calcularDuranteAfastamentoAusenciaJustificada": "Calcular salário família durante o afastamento por ausência justificada",
    "personaliza.salarioFamilia.pagarDiferenca": "Pagar diferença de Salário Família",
    "personaliza.salarioFamilia.naoConsiderarRetroativoCompensacao": "Não considerar Salário Família Retroativo para compensação",
    "personaliza.salarioFamilia.naoCalcularIntermitenteSemCalculoCompetencia": "Não calcular salário família para empregado intermitente quando na competência não possuir cálculo",
    "personaliza.salarioFamilia.naoCalcularDomesticoRetornoAfastamentoAte15Dias": "Não calcular salário família para empregado doméstico na competência que retornar de afastamento por Acidente/Doença igual ou inferior a 15 dias",
    "personaliza.salarioFamilia.naoCalcularHoristaVariavelSemCalculoCompetencia": "Não calcular salário família para empregado horista variável quando na competência não possuir cálculo",

    // --- Personaliza > Encargos ---
    "personaliza.encargos.aliquotaInssAutonomoCooperado": "Alíquota INSS Autônomo Cooperado conforme Ato Declaratório RFB nº 1/2017 (%)",
    "personaliza.encargos.limitarContribTerceiros20SalariosMinimos.ativo": "Limitar o pagamento da contribuição de Terceiros a 20 salários mínimos",
    "personaliza.encargos.limitarContribTerceiros20SalariosMinimos.data": "A partir de",
    "personaliza.encargos.calcularInss8RuralPrazoDeterminado.ativo": "Calcular INSS 8% para Trab. Rural Contrato Prazo Determinado — Lei 11.718/2008 a partir de",
    "personaliza.encargos.calcularInss8RuralPrazoDeterminado.data": "A partir de",
    "personaliza.encargos.calculaCarneLeao": "Calcula Carnê-Leão",
    "personaliza.encargos.naoConsiderarReducaoTerceirosMP932": "Não considerar a redução das alíquotas de terceiros do sistema S criada na MP 932",
    "personaliza.encargos.utilizarCpfResponsavelCarneLeaoCEI": "Utilizar o CPF do responsável legal da empresa para o Carnê-Leão quando o tipo de inscrição for CEI",
    "personaliza.encargos.somarEncargosComplementarNaMensalMinimo": "Somar os encargos da folha complementar na folha mensal quando forem inferiores ao mínimo de recolhimento",
    "personaliza.encargos.somarEncargosInssCCTMensalMinimo": "Somar os encargos de INSS CCT na folha mensal do mês do aumento quando valor a recolher for inferior ao mínimo de recolhimento",
    "personaliza.encargos.naoCalcularIrrfRpaMei": "Não calcular IRRF no RPA para microempreendedor individual",
    "personaliza.encargos.calcularIrrfAutonomoCondominio": "Calcular IRRF para contribuinte autônomo de condomínio edilício",
    "personaliza.encargos.ratearEncargosProporcionalServico": "Realizar o rateio dos encargos proporcionalmente ao valor de cada serviço",
    "personaliza.encargos.calculaEncargosHorasRepousoIndenizado": "Calcula encargos sobre horas de repouso indenizado",
    "personaliza.encargos.calcularEncargosIntegralAfastamentoContribuintes": "Calcular encargos de INSS integralmente nos meses de início e retorno do afastamento para contribuintes",
    "personaliza.encargos.calculaEncargosMultaEstabilidade": "Calcula encargos sobre multa estabilidade",
    "personaliza.encargos.calcularInssFeriasOutrasBases": "Calcular o INSS das férias utilizando os valores de Outras Bases de INSS",
    "personaliza.encargos.naoCalcularInssEmpresaCategoriasSefip": "Não calcular INSS Empresa para as categorias SEFIP 17, 18, 24 e 25",
    "personaliza.encargos.calcularInss13ProporcionalDesoneracao": "Calcular INSS Empresa sobre 13º salário proporcionalmente aos meses com desoneração e sem desoneração quando a empresa não for mais enquadrada na desoneração",
    "personaliza.encargos.calcularInss13ProporcionalSimplesNacional": "Calcular INSS sobre o 13º proporcional ao período em que a empresa era Simples Nacional no ano-calendário",
    "personaliza.encargos.calcularInss13SemProporcionalidadeTransferenciaDesoneracao": "Calcular INSS Empresa correspondente ao 13º salário sem a proporcionalidade da data de transferência do empregado quando a empresa for enquadrada na desoneração",

    // --- Personaliza > Rescisão (Geral + Data de Pagamento) ---
    "personaliza.rescisaoGeral.calcularFgtsAvisoPrevioSegregadoESocial.ativo": "Calcular rescisão considerando a base de cálculo de FGTS sobre o Aviso Prévio Indenizado separado das demais bases de FGTS conforme eSocial",
    "personaliza.rescisaoGeral.calcularFgtsAvisoPrevioSegregadoESocial.data": "A partir de",
    "personaliza.rescisaoGeral.naoDeduzirBaseFgtsNegativa.ativo": "Não deduzir a base de cálculo de FGTS negativa de outras bases de FGTS",
    "personaliza.rescisaoGeral.naoDeduzirBaseFgtsNegativa.data": "A partir de",
    "personaliza.rescisaoGeral.calculoProporcionalidadeDiasMes": "Cálculo proporcionalidade na rescisão conforme dias mês",
    "personaliza.rescisaoGeral.calculoProporcionalidadeSempre30Dias": "Cálculo proporcionalidade na rescisão sempre 30 dias",
    "personaliza.rescisaoGeral.naoCalcularMediaAdicionalMultaArt477": "Não calcular média e adicional na multa atraso pagamento Art. 477, §8º/CLT",
    "personaliza.rescisaoGeral.naoConsiderarAvisoIndenizadoSalarioFamilia": "Não considerar o valor de aviso prévio indenizado para o cálculo do salário família",
    "personaliza.rescisaoGeral.gerarDataRescisaoMotivos6e27Caged": "Gerar a data da rescisão pelos motivos 6 e 27 como data de transferência de saída para o CAGED",
    "personaliza.rescisaoGeral.calcularMultaEstabilidadeAcidenteTrabalho": "Calcular multa estabilidade para colaboradores que pediram demissão em período de estabilidade por acidente de trabalho",
    "personaliza.rescisaoGeral.gerarAvisoIndenizadoSefipRescisao": "Gerar valores de aviso prévio indenizado na SEFIP da competência da rescisão",
    "personaliza.rescisaoGeral.calcularMultaEstabilidadeArt479480Proporcional": "Calcular multa estabilidade Art. 479 e 480 proporcionalmente aos dias de cada mês",
    "personaliza.rescisaoGeral.calcularIndenizacaoAdicionalTemporario": "Calcular Indenização Adicional na rescisão do trabalhador temporário",
    "personaliza.rescisaoGeral.calcularAvisoAcordoDiasMetade": "Calcular o aviso prévio na rescisão por acordo entre as partes considerando os dias pela metade",
    "personaliza.rescisaoGeral.naoCalcular13FeriasIndenizadoAvisoAposentadoria": "Não calcular 13º salário e férias indenizados sobre aviso indenizado para rescisão com motivo aposentadoria",
    "personaliza.rescisaoGeral.naoConsiderarFerias13IntermitenteAvisoPrevio": "Não considerar os valores de férias e 13º salário pagos mensalmente para a categoria Celetista Intermitente no cálculo do aviso prévio",
    "personaliza.rescisaoGeral.calcularAvisoIntermitenteVerbasPagas": "Calcular o aviso prévio para a categoria Celetista Intermitente considerando as verbas pagas durante o curso do contrato de trabalho",
    "personaliza.rescisaoDataPagamento.utilizarSabadoDiaUtilPagamentoRescisao": "Utilizar sábado como dia útil para o pagamento de rescisão",
    "personaliza.rescisaoDataPagamento.anteciparPagamentoRescisaoContratoAntecipadoEmpregador": "Antecipar data de pagamento da rescisão de contrato antecipado pelo empregador",
    "personaliza.rescisaoDataPagamento.gerarDataPagamentoRescisaoMotivo43": "Gerar a data de pagamento da rescisão pelo motivo 43 no décimo dia útil contado a partir da data de demissão",
    "personaliza.rescisaoDataPagamento.prorrogarDataPagamentoRescisaoDiaNaoUtil": "Prorrogar a data de pagamento da rescisão para o próximo dia útil quando essa recair em sábado, domingo ou feriado",

    // --- Personaliza > Aviso Prévio — Lei 12.506/2011 ---
    "personaliza.avisoPrevio.inicioCalculoProporcional": "Início do cálculo proporcional",
    "personaliza.avisoPrevio.motivosDemissao": "Motivos de demissão",
    "personaliza.avisoPrevio.considerarProjecaoAvisoIndenizadoDiasTrabalhados": "Considerar projeção do aviso prévio indenizado como dias trabalhados",
    "personaliza.avisoPrevio.naoConsiderarDiasAcrescidosLei12506Avos": "Não considerar os dias de aviso prévio acrescidos pela Lei 12.506/2011 para projeção do aviso prévio na contagem de avos indenizados de 13º e Férias",
    "personaliza.avisoPrevio.considerarDiasAfastadosDilatarAcrescimoLei12506": "Considerar os dias afastados para dilatar a contagem do acréscimo do Aviso Prévio — Lei 12.506/2011",

    // --- Personaliza > Covid-19 ---
    "personaliza.covid19.naoRealizarCompensacaoPrevidenciariaAfastamentoCovid.ativo": "Para afastamento decorrente de contaminação pelo coronavírus Covid-19, não realizar a compensação de valores previdenciários a partir de",
    "personaliza.covid19.naoRealizarCompensacaoPrevidenciariaAfastamentoCovid.data": "A partir de",
    "personaliza.covid19.efetuarCalculoHorasNormaisSalarioDia": "Efetuar o cálculo das horas normais e dos afastamentos com base no salário de cada dia da competência",
    "personaliza.covid19.calcularIndenizacaoGarantiaProvisoriaMotivos10e23": "Calcular indenização de garantia provisória na rescisão pelos motivos 10 e 23",
    "personaliza.covid19.naoCalcularSalarioFamiliaSemDireitoAntesReducao": "Não calcular salário família para empregados que antes do processo de redução salarial não possuíam o direito",
    "personaliza.covid19.considerarAdicionaisIndenizacaoGarantiaProvisoria": "Considerar os adicionais para o cálculo da Indenização de Garantia Provisória — Lei 14.020/2020 e MP 1.045/2021",
    "personaliza.covid19.considerarAdicionaisAjudaCompensatoria30": "Considerar os adicionais para o cálculo da ajuda compensatória 30% — Lei 14.020/2020 e MP 1.045/2021",
    "personaliza.covid19.postergarDiasEstabilidadeGarantiaProvisoria": "Postergar os dias restantes de estabilidade por garantia provisória quando houver Medida de Proteção do Emprego Covid-19 cadastrada no período",
    "personaliza.covid19.calcularRubricasInsalubridadeReducaoSalarial": "Calcular as rubricas com classificação Insalubridade e base de cálculo Salário Mínimo, Salário Mínimo Estadual ou Piso Salarial para a redução salarial de Medida de Proteção do Emprego — Covid-19",
    "personaliza.covid19.calcularAntecipacaoSalarialReduzidaCompetenciaReducao": "Calcular a antecipação salarial de forma reduzida na competência com Redução",
    "personaliza.covid19.considerarAntecipacaoSalarialAjudaCompensatoria": "Considerar a antecipação salarial para o cálculo da ajuda compensatória",
    "personaliza.covid19.calcularGratificacaoReduzidaCompetenciaReducao": "Calcular de forma reduzida a gratificação lançada na competência com Redução",
    "personaliza.covid19.considerarDiasAfastadosSuspensaoDilatarPeriodoAquisitivo": "Considerar os dias afastados por Suspensão do Contrato para dilatar o período aquisitivo de férias",
    "personaliza.covid19.calcularSalarioFamiliaAfastadoIntegralSuspensao": "Calcular Salário Família quando o empregado estiver integralmente afastado por suspensão",
    "personaliza.covid19.considerarDiasIndenizacaoGarantiaProvisoriaAvos": "Considerar os dias de indenização de garantia provisória para o cálculo dos avos de férias e 13º salário indenizados",
    "personaliza.covid19.considerarSalarioReduzidoCalculo13": "Considerar o salário reduzido da competência para o cálculo do 13º salário",

    // --- Personaliza > Afastamentos ---
    "personaliza.afastamentos.calcularAfastamentosPagamentoEmpresaIntermitente.ativo": "Calcular os afastamentos com pagamento pela empresa para empregados com vínculo celetista intermitente a partir de",
    "personaliza.afastamentos.calcularAfastamentosPagamentoEmpresaIntermitente.data": "A partir de",
    "personaliza.afastamentos.considerarDiasAfastadosExperienciaDilatarLimite": "Considerar os dias afastados durante o contrato de experiência para dilatar o limite do término do contrato",
    "personaliza.afastamentos.considerarMediasPrimeiroAfastamentoMesmaDoenca": "Considerar para um novo afastamento mesma doença/acidente as médias utilizadas para o primeiro afastamento",
    "personaliza.afastamentos.naoCalcularDiferencaRubricasAlteracaoRetroativaAfastadoDoenca": "Não calcular a diferença de rubricas com base de cálculo salário quando houver alteração salarial retroativa a período em que o empregado esteve afastado por doença",
    "personaliza.afastamentos.pagarPrimeiros90DiasServicoMilitar": "Pagar os primeiros 90 dias de afastamento por serviço militar",
    "personaliza.afastamentos.permitirMotivosAfastamento3_6_17_18QualquerData": "Permitir utilizar os motivos de afastamentos 3, 6, 17 e 18 em qualquer data",
    "personaliza.afastamentos.considerar5MesesEstabilidadeLicencaMaternidade": "Considerar 5 meses de estabilidade para empregados afastados por licença maternidade",
    "personaliza.afastamentos.naoAlterarPagamentoLicencaMaternidadeMeiTrocaRegime": "Não alterar a forma de pagamento da Licença Maternidade para empresa MEI que realiza troca da classificação tributária/regime durante o período do afastamento",
    "personaliza.afastamentos.considerarSomenteDiasUteisLicencaPaternidade": "Considerar somente os dias úteis para o afastamento de licença paternidade",

    // --- Personaliza > Hora Noturna ---
    "personaliza.horaNoturna.calcularHoraNoturnaHorarioEmpregado.ativo": "Calcular Hora Noturna de acordo com o horário do empregado a partir de",
    "personaliza.horaNoturna.calcularHoraNoturnaHorarioEmpregado.data": "A partir de",
    "personaliza.horaNoturna.inicioHoraNoturna": "Início Hora Noturna",
    "personaliza.horaNoturna.fimHoraNoturna": "Fim Hora Noturna",
    "personaliza.horaNoturna.calcularIntegralmenteJornadaExclusivamenteNoturna.ativo": "Calcular integralmente Horas Noturnas para empregado que possui jornada exclusivamente noturna a partir de",
    "personaliza.horaNoturna.calcularIntegralmenteJornadaExclusivamenteNoturna.data": "A partir de",
    "personaliza.horaNoturna.calcularHoraDiurnaComAdicionalNoturnoSumula60": "Calcular Hora Diurna com adicional noturno quando o empregado possui horário integralmente noturno e esse se estende ao horário diurno, conforme Súmula nº 60 TST",

    // --- Personaliza > Contribuições ao Sindicato ---
    "personaliza.contribuicoesSindicato.calcularDiferencaContribSindicalAlteracaoSalarial": "Calcular diferença de Contribuição Sindical devido a alteração salarial",
    "personaliza.contribuicoesSindicato.calcularDiferencaContribSindicalAntecipacaoSalarial": "Calcular diferença de Contribuição Sindical devido a antecipação salarial",
    "personaliza.contribuicoesSindicato.calcularContribSindicalMesAnteriorComissionado": "Calcular contribuição sindical com base na remuneração do mês anterior para comissionado",
    "personaliza.contribuicoesSindicato.calcularContribSindicalMediasFeriasComissionado": "Calcular a contribuição sindical sobre as médias de férias do empregado comissionado",
    "personaliza.contribuicoesSindicato.calcularContribSindicalMesAnteriorProfessorAulista": "Calcular contribuição sindical com base na remuneração do mês anterior para professor aulista variável",
    "personaliza.contribuicoesSindicato.calcularContribSindicalHoristas30Dias": "Calcular contribuições ao sindicato para empregados horistas com base em 30 dias",

    // --- Personaliza > Outros (Integrações API) ---
    "personaliza.outrosApi.gerarGuiaDarfDctfwebApiIntegraContador": "Gerar guia DARF DCTFWeb pela API Integra Contador com certificado do contador (Por procuração)",
    "personaliza.outrosApi.gerarLancamentoRubricasFolhaViaApi": "Gerar lançamento de rubricas na folha via API",

    // --- Informações ---
    "informacoes.adquireProducaoRural.ativo": "Adquire Produção Rural",
    "informacoes.adquireProducaoRural.lancamentoNotasFiscais": "Lançamento das notas fiscais",
    "informacoes.adquireProducaoRural.data": "A partir de",
    "informacoes.comercializaProducaoRural.ativo": "Comercializa Produção Rural",
    "informacoes.comercializaProducaoRural.lancamentoNotasFiscais": "Lançamento das notas fiscais",
    "informacoes.comercializaProducaoRural.data": "A partir de",
    "informacoes.tomadorServicos.ativo": "Tomador de Serviços",
    "informacoes.tomadorServicos.lancamentoNotasFiscais": "Lançamento das notas fiscais",
    "informacoes.tomadorServicos.data": "A partir de",
    "informacoes.prestadorServicos.ativo": "Prestador de Serviços",
    "informacoes.prestadorServicos.lancamentoNotasFiscais": "Lançamento das notas fiscais",
    "informacoes.prestadorServicos.data": "A partir de",
    "informacoes.recursosClubeFutebol.ativo": "Recursos de Clube de Futebol",
    "informacoes.recursosClubeFutebol.tipo": "Tipo",
    "informacoes.permiteImportarNotasFiscaisCpfProducaoRural": "Permite importar notas fiscais com CPF na Comercialização de Produção Rural PJ para SEFIP",
  };

  // ===========================================================================
  // REGIME (Fase 2) — paths conforme montaRegime()/montaCprb(). "Vigência"
  // (VigenciaSelector) NÃO tem entrada aqui — fora de escopo por decisão
  // (D-3/Decisão 1 da Rev. 3 do projeto técnico P24): não é um path de
  // regimeCtx.form, vive inteiramente fora dele.
  // ===========================================================================
  const LABELS_REGIME = {
    descricao: "Descrição",
    regime: "Regime",
    simplesFederalAte2007: "Simples Federal até 06/2007",
    simplesNacional: "Simples Nacional",
    "contribuiPis.ativo": "Contribui PIS",
    "contribuiPis.percentual": "Percentual (%)",
    possuiInssReceitaBruta: "Possui INSS Empresa sobre a receita bruta",
    "cprb.atividades": "Atividades",
    "cprb.exclusivamenteTiTic": "Empresa exclusivamente prestadora de serviços de TI e TIC",
    "cprb.exclusivamenteAtividadesRelacionadas": "Empresa possui exclusivamente atividades relacionadas",
    "cprb.aliquotaReceitasNaoRelacionadas": "Alíquota para receitas não relacionadas quando inferior a 5% da receita (%)",
    "cprb.calcularInss13IntegralSemProporcionalidade": "Calcular INSS Empresa sobre o valor de 13º integral sem considerar a proporcionalidade no ano-base",
    "cprb.utilizarPercentualReceitaBrutaNovembro13Integral": "Utilizar o percentual de receita bruta acumulado na competência de novembro para o cálculo do INSS Empresa sobre o 13º quando calculado em novembro",
    "cprb.calcularInss13RescisaoSemProporcionalidade": "Calcular INSS Empresa sobre valor do 13º pago em rescisão sem considerar a proporcionalidade no ano-base",
    "cprb.calcularInss13RescisaoUltimoServicoAlocado": "Calcular INSS Empresa sobre valor de 13º pago em rescisão conforme último serviço alocado",
    "cprb.calcularInss13ProporcionalDesoneracaoServico": "Calcular INSS Empresa sobre 13º salário proporcionalmente aos meses com e sem desoneração quando o serviço não for mais enquadrado na desoneração",
    calcularPisCompetenciaFerias: "Calcular o valor de PIS na competência da data de pagamento das férias",
  };

  // ===========================================================================
  // ARREDONDAMENTO (Fase 3) — checkbox-group + tabela de linhas fixas
  // (montaCalculaPara()/montaTabelaArredondamento()). Rótulos de linha na
  // ordem real de TIPOS_FOLHA_ARREDONDAMENTO (data.js).
  // ===========================================================================
  const LABELS_ARREDONDAMENTO = {
    "calculaPara.empregados": "Empregados",
    "calculaPara.estagiarios": "Estagiários",
    "calculaPara.contribuintes": "Contribuintes",
  };
  const TABELA_ARREDONDAMENTO = {
    linhas: ["Mensal", "Semanal", "Complementar", "Adiantamento", "Participação de Lucros", "Férias", "Tabela Rescisão", "Rescisão Complementar", "Rescisão Professor", "13º", "Adiantamento 13º Integral"],
    colunas: { calcula: "Calcula", valor: "Valor", formaDesconto: "Forma de Desconto" },
  };

  // ===========================================================================
  // ADIANTAMENTO (Fase 4) — Definições (montaAdiantamentoDefinicoes()) +
  // Proporcionalidade (montaBlocoProporcionalidade(), 4 blocos paralelos:
  // férias, licença-maternidade, outros afastamentos, admissão — mesma
  // estrutura de sub-labels em cada bloco, path prefixado por área).
  // ===========================================================================
  const LABELS_ADIANTAMENTO = {
    "definicoes.calcularPara.estagiarios": "Estagiários",
    "definicoes.calcularPara.contribuintes": "Contribuintes",
    "definicoes.calcularPara.aprendiz": "Aprendiz",
    "definicoes.baseCalculo": "Base de Cálculo",
    "definicoes.percentual": "Percentual (%)",
    "definicoes.percentualDiferenciadoEstagiarios.ativo": "Utilizar percentual diferenciado para estagiários",
    "definicoes.percentualDiferenciadoEstagiarios.percentual": "Percentual diferenciado para estagiários (%)",
    "definicoes.considerarComissaoCompetenciaAnterior": "Considerar para empregado comissionado o valor pago de comissão na competência anterior ao cálculo da folha de adiantamento",
    "definicoes.considerarGarantiaMinima": "Considerar para empregado comissionado o valor pago de garantia mínima",
    "definicoes.considerarApenasGarantiaMinimaComSalario": "Considerar para empregado comissionado com salário apenas o valor pago de garantia mínima",
    "definicoes.naoCalcularAntecipacaoComAdiantamentoLancado": "Não calcular antecipação salarial na folha de adiantamento para quem tem adiantamento lançado",
    "definicoes.permitirMaisDeUmAdiantamento.ativo": "Permitir mais de um adiantamento",
    "definicoes.permitirMaisDeUmAdiantamento.limitarPercentual": "Limitar o total das parcelas em (%)",

    "proporcionalidade.ferias.ativo": "Calcular adiantamento na competência de férias",
    "proporcionalidade.ferias.considerarProporcionalmenteDiasTrabalhados": "Considerar proporcionalmente aos dias trabalhados",
    "proporcionalidade.ferias.seEstiverTrabalhandoNaDataPagamento": "Se estiver trabalhando na data do pagamento",
    "proporcionalidade.ferias.naoConsiderarLicencaRemuneradaComoTrabalhado": "Não considerar a licença remunerada como dias trabalhados",
    "proporcionalidade.ferias.seEstiverTrabalhandoMinimoDias.ativo": "Se estiver trabalhando no mínimo [N] dias",
    "proporcionalidade.ferias.seEstiverTrabalhandoMinimoDias.dias": "Número mínimo de dias",

    "proporcionalidade.licencaMaternidade.ativo": "Calcular adiantamento na competência que houver afastamento por licença-maternidade",
    "proporcionalidade.licencaMaternidade.considerarProporcionalmenteDiasTrabalhados": "Considerar proporcionalmente aos dias trabalhados",
    "proporcionalidade.licencaMaternidade.seEstiverTrabalhandoNaDataPagamento": "Se estiver trabalhando na data do pagamento",
    "proporcionalidade.licencaMaternidade.naoConsiderarLicencaRemuneradaComoTrabalhado": "Não considerar a licença remunerada como dias trabalhados",
    "proporcionalidade.licencaMaternidade.seEstiverTrabalhandoMinimoDias.ativo": "Se estiver trabalhando no mínimo [N] dias",
    "proporcionalidade.licencaMaternidade.seEstiverTrabalhandoMinimoDias.dias": "Número mínimo de dias",

    "proporcionalidade.outrosAfastamentos.ativo": "Calcular adiantamento na competência que houver outros afastamentos",
    "proporcionalidade.outrosAfastamentos.motivo": "Motivo do afastamento",
    "proporcionalidade.outrosAfastamentos.considerarProporcionalmenteDiasTrabalhados": "Considerar proporcionalmente aos dias trabalhados",
    "proporcionalidade.outrosAfastamentos.seEstiverTrabalhandoNaDataPagamento": "Se estiver trabalhando na data do pagamento",
    "proporcionalidade.outrosAfastamentos.naoConsiderarLicencaRemuneradaComoTrabalhado": "Não considerar a licença remunerada como dias trabalhados",
    "proporcionalidade.outrosAfastamentos.seEstiverTrabalhandoMinimoDias.ativo": "Se estiver trabalhando no mínimo [N] dias",
    "proporcionalidade.outrosAfastamentos.seEstiverTrabalhandoMinimoDias.dias": "Número mínimo de dias",

    "proporcionalidade.admissao.ativo": "Calcular adiantamento na competência da admissão",
    "proporcionalidade.admissao.considerarProporcionalmenteDiasTrabalhados": "Considerar proporcionalmente aos dias trabalhados",
    "proporcionalidade.admissao.seEstiverTrabalhandoNaDataPagamento": "Se estiver trabalhando na data do pagamento",
    "proporcionalidade.admissao.naoConsiderarLicencaRemuneradaComoTrabalhado": "Não considerar a licença remunerada como dias trabalhados",
    "proporcionalidade.admissao.seEstiverTrabalhandoMinimoDias.ativo": "Se estiver trabalhando no mínimo [N] dias",
    "proporcionalidade.admissao.seEstiverTrabalhandoMinimoDias.dias": "Número mínimo de dias",
  };

  // ===========================================================================
  // 13º SALÁRIO (Fase 4) — Geral (montaDecimoTerceiroGeral()) + 13º
  // Adiantamento (montaDecimoTerceiro13Adiantamento()).
  // ===========================================================================
  const LABELS_DECIMO_TERCEIRO = {
    "geral.descontarFaltasAutomaticamente": "Descontar faltas automaticamente",
    "geral.descontarFaltasNoturnas": "Descontar faltas noturnas",
    "geral.pagarAdicionais": "Pagar adicionais",
    "geral.pagarMedias": "Pagar médias (Horas/Valor)",
    "geral.considerarMesAdmissaoMediasSemAvo": "Considerar o mês da admissão no cálculo de médias mesmo que não tenha direito ao avo correspondente",
    "geral.ajustarDezembroFavorEmpregado": "Ajustar cálculo do 13º salário em dezembro favorável ao empregado",
    "geral.ajustarDezembroFavorEmpregador": "Ajustar cálculo do 13º salário em dezembro favorável ao empregador",
    "geral.pagarParaEstagiarios": "Pagar para estagiários",
    "geral.calcularParaRescisaoJustaCausa": "Calcular 13º salário para rescisão com justa causa",
    "geral.naoCalcularProporcionalRescisaoMotivoAntecipado": "Não calcular 13º salário proporcional para rescisão com motivo antecipado pelo empregador por falta disciplinar grave do aprendiz",
    "geral.desconsiderarAfastamentosDiasDireito": "Desconsiderar os afastamentos para o cálculo dos dias de direito",
    "geral.considerarMesAfastamentoMediasSemAvo": "Considerar o mês do afastamento no cálculo de médias mesmo que não tenha direito ao avo no mês",
    "geral.naoCalcularMediasComissaoAposMudancaMensalista": "Não calcular médias de 13º salário sobre comissões do período em que o empregado era comissionado, quando alterada a categoria de Comissionado para Mensalista",
    "geral.considerarMesAfastamentoDivisorMedias": "Considerar o mês do afastamento como divisor no cálculo de médias mesmo que não tenha direito ao avo no mês",
    "geral.considerarAvoSomenteDiasTrabalhados": "Considerar para o avo de 13º salário somente a quantidade de dias efetivamente trabalhados no mês",
    "geral.utilizarRubricasDescontoDiferencaComEncargos": "Utilizar na rescisão as rubricas de desconto diferença 13º com incidência de encargos",
    "geral.calcularInssEmpresaRescisaoConformeReducao": "Calcular o INSS Empresa correspondente ao 13º salário pago na rescisão conforme o percentual de redução obtido pelo resultado das receitas dos últimos 12 meses (aplicável a empresas com desoneração parcial da folha)",
    "geral.desconsiderarMesDivisorMedias.ativo": "Desconsiderar o mês como divisor no cálculo de médias de 13º, se o empregado ficou [N] dias ou mais com redução salarial",
    "geral.desconsiderarMesDivisorMedias.dias": "Número de dias",
    "geral.considerarAusenciaJustificadaAvoDomestico": "Considerar o afastamento por ausência justificada para cálculo do avo de 13º salário para empregado doméstico",
    "geral.considerarAvoCompetenciasComCalculoTrocaIntermitente": "Considerar para o avo de 13º salário somente as competências do ano-calendário que possuem cálculo, quando houve troca de categoria Intermitente para outros vínculos",
    "geral.pagarProporcionalMensalistaHoristaTrocaCategoria": "Pagar 13º salário proporcionalmente aos meses como Mensalista e Horista Variável quando houver troca de categoria",

    "decimoAdiantamento.percentual": "Percentual de adiantamento (%)",
    "decimoAdiantamento.permiteMaisDeUmAdiantamento.ativo": "Permite mais de um adiantamento",
    "decimoAdiantamento.permiteMaisDeUmAdiantamento.limitarPercentual": "Limitar o total das parcelas em (%) do 13º integral",
    "decimoAdiantamento.pagarAteDezembroAdmitidosNoAno": "Pagar adiantamento até dezembro para empregados admitidos no ano",
    "decimoAdiantamento.pagarAteMesAnteriorAdmitidosNoAno": "Pagar adiantamento até o mês anterior para empregados admitidos no ano",
    "decimoAdiantamento.calcularComBaseSalarioMesAnterior": "Calcular adiantamento com base no salário do mês anterior ao cálculo",
    "decimoAdiantamento.pagarAdicionais": "Pagar adicionais",
    "decimoAdiantamento.pagarMedias": "Pagar médias (Horas/Valor)",
    "decimoAdiantamento.calcularNaFolhaMensal": "Calcular adiantamento de 13º salário na folha mensal",
    "decimoAdiantamento.descontarValorJaAdiantadoComAlteracaoSalarial": "Descontar do cálculo de 13º Adiantamento o valor de 13º já adiantado em competências anteriores se possuir alteração salarial",
  };

  // ===========================================================================
  // FÉRIAS (Fase 5) — Geral (montaFeriasGeral()) + Opções
  // (montaFeriasOpcoes()) + Rescisão (montaFeriasRescisao()).
  // ===========================================================================
  const LABELS_FERIAS = {
    "geral.descontarFaltas": "Descontar faltas",
    "geral.descontarFaltasNoturnas": "Descontar faltas noturnas",
    "geral.descontarFaltasSuspensas": "Descontar faltas suspensas",
    "geral.informarDataLancamentoFaltas": "Informar data no lançamento de faltas",
    "geral.usarFaltasParciais": "Usar faltas parciais para o desconto de dias de férias",
    "geral.desconsiderarAfastamentosDiasDireito": "Desconsiderar os afastamentos para o cálculo dos dias de direito",
    "geral.pagarAdicionais": "Pagar adicionais",
    "geral.pagarMedias": "Pagar médias",
    "geral.adiantarPrimeiraParcela13": "Adiantar 1ª parcela do 13º",
    "geral.pagarParaEstagiarios": "Pagar para estagiários",
    "geral.calcular1_3Estagiarios": "Calcular 1/3 de férias para Estagiários",
    "geral.considerarDiasAfastadosDilatarLimiteGozo": "Considerar os dias afastados no período concessivo para dilatar o limite de gozo",
    "geral.limitarDilatacaoLimiteGozo12Meses": "Limitar a dilatação do limite de gozo para 12 meses posteriores ao retorno do afastamento",
    "geral.incluirMovimentoFeriasFolhaMensal": "Incluir movimento de férias na folha mensal",
    "geral.mediasAdicionaisLicencaRemunerada": "Médias e adicionais na licença remunerada",
    "geral.naoCalcularSalarioFamilia": "Não calcular salário família no cálculo de férias",
    "geral.naoCalcularContribuicaoSindical": "Não calcular contribuição sindical no cálculo de férias",
    "geral.calcularContribuicaoSindicalMinimoDias.ativo": "Calcular contribuição sindical nas férias se o empregado gozou no mínimo [N] dias de férias na competência do desconto",
    "geral.calcularContribuicaoSindicalMinimoDias.dias": "Número mínimo de dias",
    "geral.naoConsiderarAfastadosLicencaSemVencimento": "Não considerar os dias afastados por licença sem vencimento para dilatar o período aquisitivo",
    "geral.considerarMesesContagemAfastamento": "Considerar em meses a contagem do período de afastamento",
    "geral.naoConsiderarDiasAfastadosDilatarPeriodoAquisitivoAprendiz": "Não considerar os dias afastados para dilatar o período aquisitivo do aprendiz",

    "opcoes.calcular1_3LicencaRemunerada": "Calcular 1/3 de férias na licença remunerada",
    "opcoes.calcular1_3SalarioContratual": "Calcular 1/3 de férias sobre o valor do salário contratual",
    "opcoes.calcularLicencaRemuneradaMenor18": "Calcular licença remunerada para empregado menor de 18 anos quando as férias coletivas não coincidem com seu período",
    "opcoes.pagarDiasGozoExcedentesLicencaRemunerada": "Pagar dias de gozo excedentes aos dias de direito como licença remunerada quando há perda de dias por faltas",
    "opcoes.informarDataSolicitacaoAbonoPecuniario": "Informar data da solicitação do abono pecuniário 15 dias antes do fim do período aquisitivo",
    "opcoes.calcularFeriasSalarioMedioReducaoSalarial": "Calcular as férias com valor do salário médio do período aquisitivo quando houver redução de salário",
    "opcoes.naoCalcularMediasComissoesMudancaMensalista": "Não calcular médias de férias sobre comissões do período que o empregado era comissionado quando alterada a categoria de Comissionado para Mensalista",
    "opcoes.gerarValorLicencaRemuneradaCalculoFerias": "Gerar o valor da licença remunerada no cálculo das férias",
    "opcoes.calcularPeriodoCompletoFeriasDobro": "Calcular o período completo de férias em dobro quando ultrapassar a data do limite para gozo",
    "opcoes.naoCalcularFeriasGozoInferior10Dias": "Não calcular férias com dias de gozo inferior a 10 dias",
    "opcoes.considerarDiasContagemAvosConformeDiasMes": "Considerar os dias para contagem dos avos de férias conforme dias mês",
    "opcoes.calculoProporcionalidadeSempre30Dias": "Cálculo proporcionalidade nas férias sempre 30 dias",
    "opcoes.calcularSalarioProporcionalDiasMes": "Calcular salário proporcional ao número de dias de cada mês na competência de cálculo das férias",

    "rescisao.calcularFeriasProporcionalJustaCausa": "Calcular férias proporcional para rescisão com justa causa",
    "rescisao.naoDescontarFaltasAvosIndenizado": "Não descontar faltas sobre os avos de férias indenizado",
    "rescisao.pagarIntegralFeriasProporcionalPeriodoAquisitivoIncompleto": "Pagar integral férias proporcional na rescisão para período aquisitivo incompleto já gozado",
    "rescisao.pagarFeriasIndenizadasPeriodoAquisitivoIncompleto": "Pagar férias indenizadas na rescisão quando o período aquisitivo incompleto já foi gozado",
    "rescisao.considerarDiasAvisoPrevioIndenizadoFeriasDobro": "Considerar os dias de aviso prévio indenizado para o cálculo das férias em dobro",
  };

  // ===========================================================================
  // CONTABILIDADE (Fase 6) — Geral (montaContabilidadeGeral()) + Opções
  // (montaContabilidadeOpcoes()). "Filial Ativa" não tem entrada — sem
  // modelo de dados (P18, pendência de levantamento complementar).
  // ===========================================================================
  const LABELS_CONTABILIDADE = {
    "geral.geraLancamentosContabeis": "Gera lançamentos contábeis",
    "geral.contabilidadePorCentroCusto.ativo": "Contabilidade por centro de custo",
    "geral.contabilidadePorCentroCusto.rateio": "Rateio de lançamentos",
    "geral.separarLancamentosPor": "Separar lançamentos por",
    "geral.geraLancamentosEmpresa": "Gera lançamentos na empresa (código/nome)",
    "geral.possuiScp": "Possui Sociedade em Conta de Participação — SCP",
    "geral.integracaoPorColaborador.ativo": "Gerar integração contábil por colaborador",
    "geral.integracaoPorColaborador.folhaMensal": "Folha Mensal",
    "geral.integracaoPorColaborador.ferias": "Férias",
    "geral.integracaoPorColaborador.rescisao": "Rescisão",
    "geral.integracaoPorColaborador.provisaoFerias": "Provisão de Férias",
    "geral.integracaoPorColaborador.provisaoDecimoTerceiro": "Provisão de 13º",
    "geral.configuracaoRelatorioProvisaoFerias": "Configuração do relatório de provisão das férias calculadas no mês",

    "opcoes.usarMesmaConfigRescisao": "Usar a mesma configuração da folha normal para: Rescisão",
    "opcoes.usarMesmaConfigFerias": "Usar a mesma configuração da folha normal para: Férias",
    "opcoes.integrarIrrfFeriasDataPagamento": "Integrar IRRF Férias na data do pagamento das férias",
    "opcoes.gerarProvisaoSefipPagamentoEncargos": "Gerar o valor da provisão do ajuste SEFIP no momento do pagamento dos encargos de INSS, FGTS e GRRF",
    "opcoes.considerarUltimoDiaMesNaoUtil": "Considerar o último dia do mês, independente se cair em dia não útil, para data de lançamento como Final do Mês e para provisões",
  };
  // Tabela "Configurações — Tipo de Cálculo × Data" (opcoes.linhasTipoCalculo)
  const TABELA_CONTABILIDADE_OPCOES = {
    linhas: ["Folha mensal", "Complementar", "RPA", "Convocação Intermitente", "Rescisão", "Férias", "Adiantamento", "Participação de Lucros", "Resilição Professor", "13º Adiantamento", "13º Integral"],
    colunas: { data: "Data" },
  };

  // ===========================================================================
  // HONORÁRIOS (Fase 6) — montaHonorarios(). Tabela de rubricas é array
  // DINÂMICO — resumo de inclusão/exclusão por D-1/D3 (Pacote 3), sem
  // identificador técnico novo (nenhum `id` em honorariosCtx.form.rubricas).
  // ===========================================================================
  const LABELS_HONORARIOS = {
    gerarVariaveisHonorarios: "Gerar variáveis de honorários com o valor dos encargos",
    escritorio: "Escritório",
  };
  const TABELA_HONORARIOS_RUBRICAS = {
    // Label usado no item de resumo de inclusão/exclusão (D-1/D3) quando o
    // comprimento do array muda — não há rótulo de linha estável (linhas
    // dinâmicas, sem identificador), por isso não há `linhas` aqui.
    resumoLabel: "Rubricas de encargos",
    colunas: { rubrica: "Rubrica", descricao: "Descrição", encargo: "Encargo", faturaComContrato: "Fatura com contrato" },
  };

  // ===========================================================================
  // CRONOGRAMA (Fase 7) — montaCronograma(), 1 tabela de linhas fixas por
  // categoria (Empregados/Estagiários/Contribuintes Individuais), mesma
  // estrutura de colunas nas 3. `antecipacaoSabado` é campo único por
  // categoria, fora da tabela.
  // ===========================================================================
  const CATEGORIAS_CRONOGRAMA = {
    empregados: "Empregados",
    estagiarios: "Estagiários",
    contribuintes: "Contribuintes Individuais",
  };
  const LABELS_CRONOGRAMA = {
    "empregados.antecipacaoSabado": "Antecipar pagamento quando a data do pagamento cair no sábado",
    "estagiarios.antecipacaoSabado": "Antecipar pagamento quando a data do pagamento cair no sábado",
    "contribuintes.antecipacaoSabado": "Antecipar pagamento quando a data do pagamento cair no sábado",
  };
  // Tabela de eventos — mesma estrutura de colunas para as 3 categorias
  // (empregados.linhas / estagiarios.linhas / contribuintes.linhas).
  const TABELA_CRONOGRAMA_EVENTOS = {
    linhas: ["Folha Mensal", "Adiantamento", "Participação de Lucros", "13º Adiantamento", "13º Integral — dezembro", "13º Integral — competências diferentes de dezembro"],
    colunas: { mesPagamento: "Mês do pagamento", formaVencimento: "Forma de vencimento", totalDias: "Total de dias" },
  };

  global.FolhaHistoricoLabels = {
    LABELS_GERAL,
    LABELS_REGIME,
    LABELS_ARREDONDAMENTO,
    TABELA_ARREDONDAMENTO,
    LABELS_ADIANTAMENTO,
    LABELS_DECIMO_TERCEIRO,
    LABELS_FERIAS,
    LABELS_CONTABILIDADE,
    TABELA_CONTABILIDADE_OPCOES,
    LABELS_HONORARIOS,
    TABELA_HONORARIOS_RUBRICAS,
    LABELS_CRONOGRAMA,
    TABELA_CRONOGRAMA_EVENTOS,
    CATEGORIAS_CRONOGRAMA,
  };
})(window);
