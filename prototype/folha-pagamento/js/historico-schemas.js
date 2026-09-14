/*
  Schemas de aplicabilidade — Folha de Pagamento (P24, Pacote 3:
  docs/folha-pagamento-fase8-p24-projeto-tecnico-historico-real.md).

  Um schema por área — LISTA PLANA de descritores (adaptação da forma
  conceitual "objeto com filhos" pedida na tarefa: como os labels em
  historico-labels.js já são um mapa plano por path completo, manter o
  schema também plano evita duas representações que precisariam ser
  mantidas em sincronia. Cada folha de um objeto aninhado é 1 descritor
  "scalar" com path completo — o resultado é idêntico ao pedido (1
  alteração por folha, nunca uma alteração genérica de "objeto") — ver
  nota de adaptação no relatório do Pacote 3).

  Cada `aplicavelEm` reproduz EXATAMENTE a condição que já decide a
  renderização em folha-page.js (mesmos campos/valores comparados pelos
  `condRule()`/ternários existentes) — nenhuma condição nova foi inventada.
  Onde não há gatilho (campo Base/Opcional sempre visível), `aplicavelEm`
  é omitido (equivale a "sempre aplicável").

  Labels vêm exclusivamente de historico-labels.js (`FolhaHistoricoLabels`)
  — nenhum texto é duplicado ou reescrito aqui. `campo()`/`campoTabela()`
  abaixo buscam o label pelo path e travam (throw) se não encontrarem —
  nenhuma lacuna é preenchida por invenção (ver seção 20 do Pacote 3).
*/
(function (global) {
  const L = global.FolhaHistoricoLabels;
  if (!L) throw new Error("historico-schemas.js requer historico-labels.js carregado antes.");

  function obterLabel(mapa, nomeMapa, path) {
    const label = mapa[path];
    if (label === undefined) throw new Error('historico-schemas.js: path "' + path + '" não possui label em FolhaHistoricoLabels.' + nomeMapa + " — lacuna real, não preenchida por invenção.");
    return label;
  }

  function campo(mapa, nomeMapa, path, aplicavelEm) {
    return { path: path, tipo: "scalar", label: obterLabel(mapa, nomeMapa, path), aplicavelEm: aplicavelEm };
  }

  // ===========================================================================
  // GERAL (Fase 1) — sem `ctx` (variáveis soltas `form`/`formSnapshot`); o
  // schema descreve o MESMO objeto `form` usado por montaEsocial()/
  // montaCalculo()/montaUnidadeCalculo()/montaPersonaliza()/
  // montaInformacoes(). Não integrado nesta tarefa (Pacote 5).
  // ===========================================================================
  const SCHEMA_GERAL = (function () {
    const M = L.LABELS_GERAL;
    const c = (path, gate) => campo(M, "LABELS_GERAL", path, gate);

    // Gatilhos reaproveitados por vários campos — cada função reproduz
    // literalmente a condição já usada em folha-page.js.
    const gerarESocial = (f) => f.esocial.envioGeral.gerarESocial === true;
    const certificadoContador = (f) => gerarESocial(f) && f.esocial.envioGeral.certificadoDigital === "Contador";
    const centralizacaoCentralizada = (f) => gerarESocial(f) && f.esocial.envioGeral.tipoCentralizacao === "Centralizada";
    const empresaJaEnviadaSim = (f) => gerarESocial(f) && f.esocial.envioGeral.empresaJaEnviada === "Sim";
    const naoEnviarEventosAtivo = (f) => gerarESocial(f) && f.esocial.envioGeral.naoEnviarEventos.ativo === true;
    const possuiRPPS = (f) => gerarESocial(f) && f.esocial.faseamento.possuiRPPS === true;
    const naoEnviarNaoPeriodicosAtivo = (f) => gerarESocial(f) && f.esocial.faseamento.naoEnviarNaoPeriodicosAuto.ativo === true;
    const sstNaoEnviarAtivo = (f) => gerarESocial(f) && f.esocial.sst.naoEnviarSST.ativo === true;
    const sstVincularOutro = (f) => gerarESocial(f) && f.esocial.sst.vincularOutroResponsavel === true;
    const geraESocialDomestico = (f) => gerarESocial(f) && f.esocial.dadosCadastraisTributarios.geraESocialDomestico === true;
    const possuiSituacaoEspecial = (f) => gerarESocial(f) && f.esocial.dadosCadastraisTributarios.possuiSituacaoEspecial === true;

    const usaRubricasEmpresaAtivo = (f) => f.calculo.usaRubricasEmpresa.ativo === true;
    const permitirProporcionalizarAtivo = (f) => f.calculo.permitirProporcionalizarCarga.ativo === true;
    const efetuarDCTFWebAtivo = (f) => f.calculo.efetuarCalculoDCTFWeb.ativo === true;
    const rateioPorServicoSim = (f) => f.calculo.rateioPorServico.ativo === "Sim";

    const opcaoUnidadeConformeCategoria = (f) => f.unidadeCalculo.opcaoUnidade === "Conforme categoria";

    const limiteEstagiariosAtivo = (f) => f.personaliza.opcoesGeral.limiteEstagiariosSupervisor.ativo === true;
    const calcularDiariasAtivo = (f) => f.personaliza.opcoesGeral.calcularDiarias.ativo === true;
    const naoCalcularDiariasTributaveisAtivo = (f) => f.personaliza.opcoesGeral.naoCalcularDiariasTributaveis.ativo === true;

    const limitarContribTerceirosSim = (f) => f.personaliza.encargos.limitarContribTerceiros20SalariosMinimos.ativo === "Sim";
    const calcularInss8RuralAtivo = (f) => f.personaliza.encargos.calcularInss8RuralPrazoDeterminado.ativo === true;

    const calcularFgtsSegregadoAtivo = (f) => f.personaliza.rescisaoGeral.calcularFgtsAvisoPrevioSegregadoESocial.ativo === true;
    const naoDeduzirFgtsNegativaAtivo = (f) => f.personaliza.rescisaoGeral.naoDeduzirBaseFgtsNegativa.ativo === true;

    const naoRealizarCompensacaoCovidAtivo = (f) => f.personaliza.covid19.naoRealizarCompensacaoPrevidenciariaAfastamentoCovid.ativo === true;

    const calcularAfastamentosIntermitenteAtivo = (f) => f.personaliza.afastamentos.calcularAfastamentosPagamentoEmpresaIntermitente.ativo === true;

    const calcularHoraNoturnaHorarioAtivo = (f) => f.personaliza.horaNoturna.calcularHoraNoturnaHorarioEmpregado.ativo === true;
    const calcularIntegralJornadaNoturnaAtivo = (f) => f.personaliza.horaNoturna.calcularIntegralmenteJornadaExclusivamenteNoturna.ativo === true;

    function gateNotaFiscal(campoPrefixo) {
      return (f) => f.informacoes[campoPrefixo].ativo === true;
    }

    return [
      // eSocial > Configurações de Envio > Geral
      c("esocial.envioGeral.gerarESocial"),
      c("esocial.envioGeral.tipoAmbiente", gerarESocial),
      c("esocial.envioGeral.certificadoDigital", gerarESocial),
      c("esocial.envioGeral.tipoCentralizacao", gerarESocial),
      c("esocial.envioGeral.inscricaoTransmissorTipo", gerarESocial),
      c("esocial.envioGeral.inscricaoTransmissorNumero", gerarESocial),
      c("esocial.envioGeral.contadorCodigoNome", certificadoContador),
      c("esocial.envioGeral.empresaCentralizadoraCodigo", centralizacaoCentralizada),
      c("esocial.envioGeral.empresaJaEnviada", gerarESocial),
      c("esocial.envioGeral.competenciaInicioUso", empresaJaEnviadaSim),
      c("esocial.envioGeral.naoEnviarEventos.ativo", gerarESocial),
      c("esocial.envioGeral.naoEnviarEventos.data", naoEnviarEventosAtivo),
      c("esocial.envioGeral.possuiCentralizadoraOutroBanco", gerarESocial),
      // eSocial > Faseamento (só existe na árvore quando eSocial habilitado)
      c("esocial.faseamento.faseamento", gerarESocial),
      c("esocial.faseamento.tabelaData", gerarESocial),
      c("esocial.faseamento.naoPeriodicosData", gerarESocial),
      c("esocial.faseamento.periodicosData", gerarESocial),
      c("esocial.faseamento.sstData", gerarESocial),
      c("esocial.faseamento.possuiRPPS", gerarESocial),
      c("esocial.faseamento.periodicosRPPSData", possuiRPPS),
      c("esocial.faseamento.naoEnviarNaoPeriodicosAuto.ativo", gerarESocial),
      c("esocial.faseamento.naoEnviarNaoPeriodicosAuto.data", naoEnviarNaoPeriodicosAtivo),
      // eSocial > SST
      c("esocial.sst.naoEnviarSST.ativo", gerarESocial),
      c("esocial.sst.naoEnviarSST.data", sstNaoEnviarAtivo),
      c("esocial.sst.vincularOutroResponsavel", gerarESocial),
      c("esocial.sst.certificadoResponsavel", sstVincularOutro),
      c("esocial.sst.codigoResponsavel", sstVincularOutro),
      c("esocial.sst.eventos.s2210", sstVincularOutro),
      c("esocial.sst.eventos.s2220", sstVincularOutro),
      c("esocial.sst.eventos.s2221", sstVincularOutro),
      c("esocial.sst.eventos.s2240", sstVincularOutro),
      // eSocial > Dados Cadastrais e Tributários / Contratações PCD / Órgãos Públicos
      c("esocial.dadosCadastraisTributarios.classificacaoTributaria", gerarESocial),
      c("esocial.dadosCadastraisTributarios.cooperativa", gerarESocial),
      c("esocial.dadosCadastraisTributarios.produtorRural", gerarESocial),
      c("esocial.dadosCadastraisTributarios.entidadeSemFins", gerarESocial),
      c("esocial.dadosCadastraisTributarios.empresaTrabalhoTemporario", gerarESocial),
      c("esocial.dadosCadastraisTributarios.calculaFunrural", gerarESocial),
      c("esocial.dadosCadastraisTributarios.construtora", gerarESocial),
      c("esocial.dadosCadastraisTributarios.entidadeEducativa", gerarESocial),
      c("esocial.dadosCadastraisTributarios.numeroRegistroMTE", gerarESocial),
      c("esocial.dadosCadastraisTributarios.optouRegistroEletronico", gerarESocial),
      c("esocial.dadosCadastraisTributarios.possuiAcordoInternacional", gerarESocial),
      c("esocial.dadosCadastraisTributarios.utilizaModuloWebSimplificado", gerarESocial),
      c("esocial.dadosCadastraisTributarios.geraESocialDomestico", gerarESocial),
      c("esocial.dadosCadastraisTributarios.tipoAcesso", geraESocialDomestico),
      c("esocial.dadosCadastraisTributarios.codigoAcesso", geraESocialDomestico),
      c("esocial.dadosCadastraisTributarios.senha", geraESocialDomestico),
      c("esocial.dadosCadastraisTributarios.possuiSituacaoEspecial", gerarESocial),
      c("esocial.dadosCadastraisTributarios.situacao", possuiSituacaoEspecial),
      c("esocial.contratacoesPCD.contratacaoPCD", gerarESocial),
      c("esocial.contratacoesPCD.numeroProcesso", gerarESocial),
      c("esocial.orgaosPublicos.cnpjEnteFederativo", gerarESocial),

      // Cálculo (sem gatilho de topo — sempre visível)
      c("calculo.competenciaAtual"),
      c("calculo.tipoFolhaAtual"),
      c("calculo.discriminarDSR"),
      c("calculo.lancamentoHoras"),
      c("calculo.calculoProporcionalidade"),
      c("calculo.folhaProfessores"),
      c("calculo.folhaSemanal"),
      c("calculo.agentePublico"),
      c("calculo.usaRubricasEmpresa.ativo"),
      c("calculo.usaRubricasEmpresa.codigoNome", usaRubricasEmpresaAtivo),
      c("calculo.permitirProporcionalizarCarga.ativo"),
      c("calculo.permitirProporcionalizarCarga.data", permitirProporcionalizarAtivo),
      c("calculo.efetuarCalculoDCTFWeb.ativo"),
      c("calculo.efetuarCalculoDCTFWeb.data", efetuarDCTFWebAtivo),
      c("calculo.rateioPorServico.ativo"),
      c("calculo.rateioPorServico.data", rateioPorServicoSim),
      c("calculo.rateioPorServico.tipoRateio", rateioPorServicoSim),
      c("calculo.calcularSalarioProporcionalAlteracao"),
      c("calculo.calcularINSSMultiplosVinculos"),

      // Unidade de Cálculo
      c("unidadeCalculo.vigencia"),
      c("unidadeCalculo.descricao"),
      c("unidadeCalculo.opcaoUnidade"),
      c("unidadeCalculo.unidadePorCategoria.mensalistas", opcaoUnidadeConformeCategoria),
      c("unidadeCalculo.unidadePorCategoria.semanalistas", opcaoUnidadeConformeCategoria),
      c("unidadeCalculo.unidadePorCategoria.comissionados", opcaoUnidadeConformeCategoria),
      c("unidadeCalculo.unidadePorCategoria.diaristas", opcaoUnidadeConformeCategoria),
      c("unidadeCalculo.unidadePorCategoria.tarefeiros", opcaoUnidadeConformeCategoria),
      c("unidadeCalculo.unidadePorCategoria.contribuintes", opcaoUnidadeConformeCategoria),

      // Personaliza > Opções Gerais
      c("personaliza.opcoesGeral.limiteEstagiariosSupervisor.ativo"),
      c("personaliza.opcoesGeral.limiteEstagiariosSupervisor.numero", limiteEstagiariosAtivo),
      c("personaliza.opcoesGeral.calcularDiarias.ativo"),
      c("personaliza.opcoesGeral.calcularDiarias.consideraComoRemuneracao", calcularDiariasAtivo),
      c("personaliza.opcoesGeral.naoCalcularDiariasTributaveis.ativo"),
      c("personaliza.opcoesGeral.naoCalcularDiariasTributaveis.data", naoCalcularDiariasTributaveisAtivo),
      c("personaliza.opcoesGeral.configurarRubricasDescontoCompulsorio"),
      c("personaliza.opcoesGeral.naoPermitirSalarioAbaixoPiso"),
      c("personaliza.opcoesGeral.efetuarLancamentoRubricasPorServico"),
      c("personaliza.opcoesGeral.permitirInformarDatasFaltasParciais"),
      c("personaliza.opcoesGeral.considerarPeriodoSindicatoAlteracaoSalarial"),
      c("personaliza.opcoesGeral.considerarDiasMesCompetenciaInicioEstagio"),
      c("personaliza.opcoesGeral.permitirTipoAnaliticoSinteticoCentroCustos"),
      c("personaliza.opcoesGeral.discriminarHorasCompensacaoSabado"),
      c("personaliza.opcoesGeral.naoCalcularPLRDemitido"),
      c("personaliza.opcoesGeral.calcularRemuneracaoIntegralAfastamentoContribuintes"),

      // Personaliza > DSR
      c("personaliza.dsr.descontarFaltasDSRCompetenciaFalta"),
      c("personaliza.dsr.descontarDSRMesmaSemanaFalta"),
      c("personaliza.dsr.descontarFaltasDSRDiaFolga"),
      c("personaliza.dsr.naoDescontarDSRFeriados"),
      c("personaliza.dsr.considerarDSRAfastadoDoencaDireitosIntegrais"),
      c("personaliza.dsr.calcularDSRUmSextoHoristaVariavel"),
      c("personaliza.dsr.calcularDSRUmSextoDiaristaVariavel"),
      c("personaliza.dsr.calcularDSRUmSextoIntermitente"),

      // Personaliza > Salário Família
      c("personaliza.salarioFamilia.naoCalcularDomesticoLicencaMaternidade"),
      c("personaliza.salarioFamilia.calcularMesmoDescontosMaioresProventos"),
      c("personaliza.salarioFamilia.calcularDuranteAfastamentoAusenciaJustificada"),
      c("personaliza.salarioFamilia.pagarDiferenca"),
      c("personaliza.salarioFamilia.naoConsiderarRetroativoCompensacao"),
      c("personaliza.salarioFamilia.naoCalcularIntermitenteSemCalculoCompetencia"),
      c("personaliza.salarioFamilia.naoCalcularDomesticoRetornoAfastamentoAte15Dias"),
      c("personaliza.salarioFamilia.naoCalcularHoristaVariavelSemCalculoCompetencia"),

      // Personaliza > Encargos
      c("personaliza.encargos.aliquotaInssAutonomoCooperado"),
      c("personaliza.encargos.limitarContribTerceiros20SalariosMinimos.ativo"),
      c("personaliza.encargos.limitarContribTerceiros20SalariosMinimos.data", limitarContribTerceirosSim),
      c("personaliza.encargos.calcularInss8RuralPrazoDeterminado.ativo"),
      c("personaliza.encargos.calcularInss8RuralPrazoDeterminado.data", calcularInss8RuralAtivo),
      c("personaliza.encargos.calculaCarneLeao"),
      c("personaliza.encargos.naoConsiderarReducaoTerceirosMP932"),
      c("personaliza.encargos.utilizarCpfResponsavelCarneLeaoCEI"),
      c("personaliza.encargos.somarEncargosComplementarNaMensalMinimo"),
      c("personaliza.encargos.somarEncargosInssCCTMensalMinimo"),
      c("personaliza.encargos.naoCalcularIrrfRpaMei"),
      c("personaliza.encargos.calcularIrrfAutonomoCondominio"),
      c("personaliza.encargos.ratearEncargosProporcionalServico"),
      c("personaliza.encargos.calculaEncargosHorasRepousoIndenizado"),
      c("personaliza.encargos.calcularEncargosIntegralAfastamentoContribuintes"),
      c("personaliza.encargos.calculaEncargosMultaEstabilidade"),
      c("personaliza.encargos.calcularInssFeriasOutrasBases"),
      c("personaliza.encargos.naoCalcularInssEmpresaCategoriasSefip"),
      c("personaliza.encargos.calcularInss13ProporcionalDesoneracao"),
      c("personaliza.encargos.calcularInss13ProporcionalSimplesNacional"),
      c("personaliza.encargos.calcularInss13SemProporcionalidadeTransferenciaDesoneracao"),

      // Personaliza > Rescisão (Geral + Data de Pagamento)
      c("personaliza.rescisaoGeral.calcularFgtsAvisoPrevioSegregadoESocial.ativo"),
      c("personaliza.rescisaoGeral.calcularFgtsAvisoPrevioSegregadoESocial.data", calcularFgtsSegregadoAtivo),
      c("personaliza.rescisaoGeral.naoDeduzirBaseFgtsNegativa.ativo"),
      c("personaliza.rescisaoGeral.naoDeduzirBaseFgtsNegativa.data", naoDeduzirFgtsNegativaAtivo),
      c("personaliza.rescisaoGeral.calculoProporcionalidadeDiasMes"),
      c("personaliza.rescisaoGeral.calculoProporcionalidadeSempre30Dias"),
      c("personaliza.rescisaoGeral.naoCalcularMediaAdicionalMultaArt477"),
      c("personaliza.rescisaoGeral.naoConsiderarAvisoIndenizadoSalarioFamilia"),
      c("personaliza.rescisaoGeral.gerarDataRescisaoMotivos6e27Caged"),
      c("personaliza.rescisaoGeral.calcularMultaEstabilidadeAcidenteTrabalho"),
      c("personaliza.rescisaoGeral.gerarAvisoIndenizadoSefipRescisao"),
      c("personaliza.rescisaoGeral.calcularMultaEstabilidadeArt479480Proporcional"),
      c("personaliza.rescisaoGeral.calcularIndenizacaoAdicionalTemporario"),
      c("personaliza.rescisaoGeral.calcularAvisoAcordoDiasMetade"),
      c("personaliza.rescisaoGeral.naoCalcular13FeriasIndenizadoAvisoAposentadoria"),
      c("personaliza.rescisaoGeral.naoConsiderarFerias13IntermitenteAvisoPrevio"),
      c("personaliza.rescisaoGeral.calcularAvisoIntermitenteVerbasPagas"),
      c("personaliza.rescisaoDataPagamento.utilizarSabadoDiaUtilPagamentoRescisao"),
      c("personaliza.rescisaoDataPagamento.anteciparPagamentoRescisaoContratoAntecipadoEmpregador"),
      c("personaliza.rescisaoDataPagamento.gerarDataPagamentoRescisaoMotivo43"),
      c("personaliza.rescisaoDataPagamento.prorrogarDataPagamentoRescisaoDiaNaoUtil"),

      // Personaliza > Aviso Prévio — Lei 12.506/2011 (sem gatilhos)
      c("personaliza.avisoPrevio.inicioCalculoProporcional"),
      c("personaliza.avisoPrevio.motivosDemissao"),
      c("personaliza.avisoPrevio.considerarProjecaoAvisoIndenizadoDiasTrabalhados"),
      c("personaliza.avisoPrevio.naoConsiderarDiasAcrescidosLei12506Avos"),
      c("personaliza.avisoPrevio.considerarDiasAfastadosDilatarAcrescimoLei12506"),

      // Personaliza > Covid-19
      c("personaliza.covid19.naoRealizarCompensacaoPrevidenciariaAfastamentoCovid.ativo"),
      c("personaliza.covid19.naoRealizarCompensacaoPrevidenciariaAfastamentoCovid.data", naoRealizarCompensacaoCovidAtivo),
      c("personaliza.covid19.efetuarCalculoHorasNormaisSalarioDia"),
      c("personaliza.covid19.calcularIndenizacaoGarantiaProvisoriaMotivos10e23"),
      c("personaliza.covid19.naoCalcularSalarioFamiliaSemDireitoAntesReducao"),
      c("personaliza.covid19.considerarAdicionaisIndenizacaoGarantiaProvisoria"),
      c("personaliza.covid19.considerarAdicionaisAjudaCompensatoria30"),
      c("personaliza.covid19.postergarDiasEstabilidadeGarantiaProvisoria"),
      c("personaliza.covid19.calcularRubricasInsalubridadeReducaoSalarial"),
      c("personaliza.covid19.calcularAntecipacaoSalarialReduzidaCompetenciaReducao"),
      c("personaliza.covid19.considerarAntecipacaoSalarialAjudaCompensatoria"),
      c("personaliza.covid19.calcularGratificacaoReduzidaCompetenciaReducao"),
      c("personaliza.covid19.considerarDiasAfastadosSuspensaoDilatarPeriodoAquisitivo"),
      c("personaliza.covid19.calcularSalarioFamiliaAfastadoIntegralSuspensao"),
      c("personaliza.covid19.considerarDiasIndenizacaoGarantiaProvisoriaAvos"),
      c("personaliza.covid19.considerarSalarioReduzidoCalculo13"),

      // Personaliza > Afastamentos
      c("personaliza.afastamentos.calcularAfastamentosPagamentoEmpresaIntermitente.ativo"),
      c("personaliza.afastamentos.calcularAfastamentosPagamentoEmpresaIntermitente.data", calcularAfastamentosIntermitenteAtivo),
      c("personaliza.afastamentos.considerarDiasAfastadosExperienciaDilatarLimite"),
      c("personaliza.afastamentos.considerarMediasPrimeiroAfastamentoMesmaDoenca"),
      c("personaliza.afastamentos.naoCalcularDiferencaRubricasAlteracaoRetroativaAfastadoDoenca"),
      c("personaliza.afastamentos.pagarPrimeiros90DiasServicoMilitar"),
      c("personaliza.afastamentos.permitirMotivosAfastamento3_6_17_18QualquerData"),
      c("personaliza.afastamentos.considerar5MesesEstabilidadeLicencaMaternidade"),
      c("personaliza.afastamentos.naoAlterarPagamentoLicencaMaternidadeMeiTrocaRegime"),
      c("personaliza.afastamentos.considerarSomenteDiasUteisLicencaPaternidade"),

      // Personaliza > Hora Noturna
      c("personaliza.horaNoturna.calcularHoraNoturnaHorarioEmpregado.ativo"),
      c("personaliza.horaNoturna.calcularHoraNoturnaHorarioEmpregado.data", calcularHoraNoturnaHorarioAtivo),
      c("personaliza.horaNoturna.inicioHoraNoturna", calcularHoraNoturnaHorarioAtivo),
      c("personaliza.horaNoturna.fimHoraNoturna", calcularHoraNoturnaHorarioAtivo),
      c("personaliza.horaNoturna.calcularIntegralmenteJornadaExclusivamenteNoturna.ativo"),
      c("personaliza.horaNoturna.calcularIntegralmenteJornadaExclusivamenteNoturna.data", calcularIntegralJornadaNoturnaAtivo),
      c("personaliza.horaNoturna.calcularHoraDiurnaComAdicionalNoturnoSumula60"),

      // Personaliza > Contribuições ao Sindicato (sem gatilhos)
      c("personaliza.contribuicoesSindicato.calcularDiferencaContribSindicalAlteracaoSalarial"),
      c("personaliza.contribuicoesSindicato.calcularDiferencaContribSindicalAntecipacaoSalarial"),
      c("personaliza.contribuicoesSindicato.calcularContribSindicalMesAnteriorComissionado"),
      c("personaliza.contribuicoesSindicato.calcularContribSindicalMediasFeriasComissionado"),
      c("personaliza.contribuicoesSindicato.calcularContribSindicalMesAnteriorProfessorAulista"),
      c("personaliza.contribuicoesSindicato.calcularContribSindicalHoristas30Dias"),

      // Personaliza > Outros (Integrações API) — sem gatilhos
      c("personaliza.outrosApi.gerarGuiaDarfDctfwebApiIntegraContador"),
      c("personaliza.outrosApi.gerarLancamentoRubricasFolhaViaApi"),

      // Informações
      c("informacoes.adquireProducaoRural.ativo"),
      c("informacoes.adquireProducaoRural.lancamentoNotasFiscais", gateNotaFiscal("adquireProducaoRural")),
      c("informacoes.adquireProducaoRural.data", gateNotaFiscal("adquireProducaoRural")),
      c("informacoes.comercializaProducaoRural.ativo"),
      c("informacoes.comercializaProducaoRural.lancamentoNotasFiscais", gateNotaFiscal("comercializaProducaoRural")),
      c("informacoes.comercializaProducaoRural.data", gateNotaFiscal("comercializaProducaoRural")),
      c("informacoes.tomadorServicos.ativo"),
      c("informacoes.tomadorServicos.lancamentoNotasFiscais", gateNotaFiscal("tomadorServicos")),
      c("informacoes.tomadorServicos.data", gateNotaFiscal("tomadorServicos")),
      c("informacoes.prestadorServicos.ativo"),
      c("informacoes.prestadorServicos.lancamentoNotasFiscais", gateNotaFiscal("prestadorServicos")),
      c("informacoes.prestadorServicos.data", gateNotaFiscal("prestadorServicos")),
      c("informacoes.recursosClubeFutebol.ativo"),
      c("informacoes.recursosClubeFutebol.tipo", (f) => f.informacoes.recursosClubeFutebol.ativo === true),
      c("informacoes.permiteImportarNotasFiscaisCpfProducaoRural"),
    ];
  })();

  // ===========================================================================
  // REGIME (Fase 2) — regimeCtx.form. CPRB gated por
  // "possuiInssReceitaBruta" === "Sim" (mesma condição de montaCprb()).
  // Vigência (VigenciaSelector) FORA de escopo — Decisão 1/D-3 da Rev. 3:
  // regimeCtx.form nunca contém dados de mais de uma vigência (única
  // editável, por construção — "Iniciar nova vigência" desabilitado), então
  // nenhum filtro adicional de vigência é necessário nem foi criado aqui.
  // ===========================================================================
  const SCHEMA_REGIME = (function () {
    const M = L.LABELS_REGIME;
    const c = (path, gate) => campo(M, "LABELS_REGIME", path, gate);
    const contribuiPisAtivo = (f) => f.contribuiPis.ativo === true;
    const cprbAtivo = (f) => f.possuiInssReceitaBruta === "Sim";
    return [
      c("descricao"),
      c("regime"),
      c("simplesFederalAte2007"),
      c("simplesNacional"),
      c("contribuiPis.ativo"),
      c("contribuiPis.percentual", contribuiPisAtivo),
      c("possuiInssReceitaBruta"),
      c("cprb.atividades", cprbAtivo),
      c("cprb.exclusivamenteTiTic", cprbAtivo),
      c("cprb.exclusivamenteAtividadesRelacionadas", cprbAtivo),
      c("cprb.aliquotaReceitasNaoRelacionadas", cprbAtivo),
      c("cprb.calcularInss13IntegralSemProporcionalidade", cprbAtivo),
      c("cprb.utilizarPercentualReceitaBrutaNovembro13Integral", cprbAtivo),
      c("cprb.calcularInss13RescisaoSemProporcionalidade", cprbAtivo),
      c("cprb.calcularInss13RescisaoUltimoServicoAlocado", cprbAtivo),
      c("cprb.calcularInss13ProporcionalDesoneracaoServico", cprbAtivo),
      c("calcularPisCompetenciaFerias"),
    ];
  })();

  // ===========================================================================
  // ARREDONDAMENTO (Fase 3) — checkbox-group + tabela de 11 linhas fixas.
  // "Valor"/"Forma de Desconto" só aplicáveis quando "Calcula" === "Sim" na
  // LINHA final (mesma condição de dependsOn em montaTabelaArredondamento()).
  // ===========================================================================
  const SCHEMA_ARREDONDAMENTO = (function () {
    const M = L.LABELS_ARREDONDAMENTO;
    const c = (path) => campo(M, "LABELS_ARREDONDAMENTO", path);
    const linhaCalculaSim = (linha) => linha.calcula === "Sim";
    return [
      c("calculaPara.empregados"),
      c("calculaPara.estagiarios"),
      c("calculaPara.contribuintes"),
      {
        path: "linhas",
        tipo: "array-fixo",
        rowLabelKey: "tipoFolha",
        colunas: {
          calcula: { label: L.TABELA_ARREDONDAMENTO.colunas.calcula },
          valor: { label: L.TABELA_ARREDONDAMENTO.colunas.valor, aplicavelEm: linhaCalculaSim },
          formaDesconto: { label: L.TABELA_ARREDONDAMENTO.colunas.formaDesconto, aplicavelEm: linhaCalculaSim },
        },
      },
    ];
  })();

  // ===========================================================================
  // ADIANTAMENTO (Fase 4) — Definições + 4 blocos paralelos de
  // Proporcionalidade (férias/licença-maternidade/outros afastamentos/
  // admissão), mesma estrutura de gatilhos em cada bloco.
  // ===========================================================================
  const SCHEMA_ADIANTAMENTO = (function () {
    const M = L.LABELS_ADIANTAMENTO;
    const c = (path, gate) => campo(M, "LABELS_ADIANTAMENTO", path, gate);
    const percentualDiferenciadoAtivo = (f) => f.definicoes.percentualDiferenciadoEstagiarios.ativo === true;
    const permitirMaisDeUmAtivo = (f) => f.definicoes.permitirMaisDeUmAdiantamento.ativo === true;

    function blocoProporcionalidade(prefixo) {
      const gateBloco = (f) => getPath(f, "proporcionalidade." + prefixo + ".ativo") === true;
      const gateMinimoDias = (f) => gateBloco(f) && getPath(f, "proporcionalidade." + prefixo + ".seEstiverTrabalhandoMinimoDias.ativo") === true;
      const entradas = [
        c("proporcionalidade." + prefixo + ".ativo"),
        c("proporcionalidade." + prefixo + ".considerarProporcionalmenteDiasTrabalhados", gateBloco),
        c("proporcionalidade." + prefixo + ".seEstiverTrabalhandoNaDataPagamento", gateBloco),
        c("proporcionalidade." + prefixo + ".naoConsiderarLicencaRemuneradaComoTrabalhado", gateBloco),
        c("proporcionalidade." + prefixo + ".seEstiverTrabalhandoMinimoDias.ativo", gateBloco),
        c("proporcionalidade." + prefixo + ".seEstiverTrabalhandoMinimoDias.dias", gateMinimoDias),
      ];
      if (prefixo === "outrosAfastamentos") entradas.push(c("proporcionalidade.outrosAfastamentos.motivo", gateBloco));
      return entradas;
    }
    function getPath(obj, path) {
      return path.split(".").reduce((o, k) => (o == null ? o : o[k]), obj);
    }

    return [
      c("definicoes.calcularPara.estagiarios"),
      c("definicoes.calcularPara.contribuintes"),
      c("definicoes.calcularPara.aprendiz"),
      c("definicoes.baseCalculo"),
      c("definicoes.percentual"),
      c("definicoes.percentualDiferenciadoEstagiarios.ativo"),
      c("definicoes.percentualDiferenciadoEstagiarios.percentual", percentualDiferenciadoAtivo),
      c("definicoes.considerarComissaoCompetenciaAnterior"),
      c("definicoes.considerarGarantiaMinima"),
      c("definicoes.considerarApenasGarantiaMinimaComSalario"),
      c("definicoes.naoCalcularAntecipacaoComAdiantamentoLancado"),
      c("definicoes.permitirMaisDeUmAdiantamento.ativo"),
      c("definicoes.permitirMaisDeUmAdiantamento.limitarPercentual", permitirMaisDeUmAtivo),
    ]
      .concat(blocoProporcionalidade("ferias"))
      .concat(blocoProporcionalidade("licencaMaternidade"))
      .concat(blocoProporcionalidade("outrosAfastamentos"))
      .concat(blocoProporcionalidade("admissao"));
  })();

  // ===========================================================================
  // 13º SALÁRIO (Fase 4) — Geral + 13º Adiantamento.
  // ===========================================================================
  const SCHEMA_DECIMO_TERCEIRO = (function () {
    const M = L.LABELS_DECIMO_TERCEIRO;
    const c = (path, gate) => campo(M, "LABELS_DECIMO_TERCEIRO", path, gate);
    const desconsiderarMesDivisorAtivo = (f) => f.geral.desconsiderarMesDivisorMedias.ativo === true;
    const permiteMaisDeUmAtivo = (f) => f.decimoAdiantamento.permiteMaisDeUmAdiantamento.ativo === true;
    return [
      c("geral.descontarFaltasAutomaticamente"),
      c("geral.descontarFaltasNoturnas"),
      c("geral.pagarAdicionais"),
      c("geral.pagarMedias"),
      c("geral.considerarMesAdmissaoMediasSemAvo"),
      c("geral.ajustarDezembroFavorEmpregado"),
      c("geral.ajustarDezembroFavorEmpregador"),
      c("geral.pagarParaEstagiarios"),
      c("geral.calcularParaRescisaoJustaCausa"),
      c("geral.naoCalcularProporcionalRescisaoMotivoAntecipado"),
      c("geral.desconsiderarAfastamentosDiasDireito"),
      c("geral.considerarMesAfastamentoMediasSemAvo"),
      c("geral.naoCalcularMediasComissaoAposMudancaMensalista"),
      c("geral.considerarMesAfastamentoDivisorMedias"),
      c("geral.considerarAvoSomenteDiasTrabalhados"),
      c("geral.utilizarRubricasDescontoDiferencaComEncargos"),
      c("geral.calcularInssEmpresaRescisaoConformeReducao"),
      c("geral.desconsiderarMesDivisorMedias.ativo"),
      c("geral.desconsiderarMesDivisorMedias.dias", desconsiderarMesDivisorAtivo),
      c("geral.considerarAusenciaJustificadaAvoDomestico"),
      c("geral.considerarAvoCompetenciasComCalculoTrocaIntermitente"),
      c("geral.pagarProporcionalMensalistaHoristaTrocaCategoria"),

      c("decimoAdiantamento.percentual"),
      c("decimoAdiantamento.permiteMaisDeUmAdiantamento.ativo"),
      c("decimoAdiantamento.permiteMaisDeUmAdiantamento.limitarPercentual", permiteMaisDeUmAtivo),
      c("decimoAdiantamento.pagarAteDezembroAdmitidosNoAno"),
      c("decimoAdiantamento.pagarAteMesAnteriorAdmitidosNoAno"),
      c("decimoAdiantamento.calcularComBaseSalarioMesAnterior"),
      c("decimoAdiantamento.pagarAdicionais"),
      c("decimoAdiantamento.pagarMedias"),
      c("decimoAdiantamento.calcularNaFolhaMensal"),
      c("decimoAdiantamento.descontarValorJaAdiantadoComAlteracaoSalarial"),
    ];
  })();

  // ===========================================================================
  // FÉRIAS (Fase 5) — Geral + Opções + Rescisão.
  // ===========================================================================
  const SCHEMA_FERIAS = (function () {
    const M = L.LABELS_FERIAS;
    const c = (path, gate) => campo(M, "LABELS_FERIAS", path, gate);
    const pagarParaEstagiariosAtivo = (f) => f.geral.pagarParaEstagiarios === true;
    const considerarDilatarLimiteGozoAtivo = (f) => f.geral.considerarDiasAfastadosDilatarLimiteGozo === true;
    const contribSindicalMinimoDiasAtivo = (f) => f.geral.calcularContribuicaoSindicalMinimoDias.ativo === true;
    const calcular1_3LicencaAtivo = (f) => f.opcoes.calcular1_3LicencaRemunerada === true;
    return [
      c("geral.descontarFaltas"),
      c("geral.descontarFaltasNoturnas"),
      c("geral.descontarFaltasSuspensas"),
      c("geral.informarDataLancamentoFaltas"),
      c("geral.usarFaltasParciais"),
      c("geral.desconsiderarAfastamentosDiasDireito"),
      c("geral.pagarAdicionais"),
      c("geral.pagarMedias"),
      c("geral.adiantarPrimeiraParcela13"),
      c("geral.pagarParaEstagiarios"),
      c("geral.calcular1_3Estagiarios", pagarParaEstagiariosAtivo),
      c("geral.considerarDiasAfastadosDilatarLimiteGozo"),
      c("geral.limitarDilatacaoLimiteGozo12Meses", considerarDilatarLimiteGozoAtivo),
      c("geral.incluirMovimentoFeriasFolhaMensal"),
      c("geral.mediasAdicionaisLicencaRemunerada"),
      c("geral.naoCalcularSalarioFamilia"),
      c("geral.naoCalcularContribuicaoSindical"),
      c("geral.calcularContribuicaoSindicalMinimoDias.ativo"),
      c("geral.calcularContribuicaoSindicalMinimoDias.dias", contribSindicalMinimoDiasAtivo),
      c("geral.naoConsiderarAfastadosLicencaSemVencimento"),
      c("geral.considerarMesesContagemAfastamento"),
      c("geral.naoConsiderarDiasAfastadosDilatarPeriodoAquisitivoAprendiz"),

      c("opcoes.calcular1_3LicencaRemunerada"),
      c("opcoes.calcular1_3SalarioContratual", calcular1_3LicencaAtivo),
      c("opcoes.calcularLicencaRemuneradaMenor18"),
      c("opcoes.pagarDiasGozoExcedentesLicencaRemunerada"),
      c("opcoes.informarDataSolicitacaoAbonoPecuniario"),
      c("opcoes.calcularFeriasSalarioMedioReducaoSalarial"),
      c("opcoes.naoCalcularMediasComissoesMudancaMensalista"),
      c("opcoes.gerarValorLicencaRemuneradaCalculoFerias"),
      c("opcoes.calcularPeriodoCompletoFeriasDobro"),
      c("opcoes.naoCalcularFeriasGozoInferior10Dias"),
      c("opcoes.considerarDiasContagemAvosConformeDiasMes"),
      c("opcoes.calculoProporcionalidadeSempre30Dias"),
      c("opcoes.calcularSalarioProporcionalDiasMes"),

      c("rescisao.calcularFeriasProporcionalJustaCausa"),
      c("rescisao.naoDescontarFaltasAvosIndenizado"),
      c("rescisao.pagarIntegralFeriasProporcionalPeriodoAquisitivoIncompleto"),
      c("rescisao.pagarFeriasIndenizadasPeriodoAquisitivoIncompleto"),
      c("rescisao.considerarDiasAvisoPrevioIndenizadoFeriasDobro"),
    ];
  })();

  // ===========================================================================
  // CONTABILIDADE (Fase 6) — Geral (gated por "geraLancamentosContabeis",
  // escopo restrito confirmado por P13) + Opções (independente do gatilho
  // de Geral, mesmo P13; tabela com dependsOnExterno de P14 para
  // Rescisão/Férias). "Filial Ativa" sem entrada — sem modelo de dados (P18).
  // ===========================================================================
  const SCHEMA_CONTABILIDADE = (function () {
    const M = L.LABELS_CONTABILIDADE;
    const c = (path, gate) => campo(M, "LABELS_CONTABILIDADE", path, gate);
    const geraLancamentosAtivo = (f) => f.geral.geraLancamentosContabeis === true;
    const centroCustoAtivo = (f) => geraLancamentosAtivo(f) && f.geral.contabilidadePorCentroCusto.ativo === true;
    const integracaoColaboradorAtivo = (f) => geraLancamentosAtivo(f) && f.geral.integracaoPorColaborador.ativo === true;
    return [
      c("geral.geraLancamentosContabeis"),
      c("geral.contabilidadePorCentroCusto.ativo", geraLancamentosAtivo),
      c("geral.contabilidadePorCentroCusto.rateio", centroCustoAtivo),
      c("geral.separarLancamentosPor", geraLancamentosAtivo),
      c("geral.geraLancamentosEmpresa", geraLancamentosAtivo),
      c("geral.possuiScp", geraLancamentosAtivo),
      c("geral.integracaoPorColaborador.ativo", geraLancamentosAtivo),
      c("geral.integracaoPorColaborador.folhaMensal", integracaoColaboradorAtivo),
      c("geral.integracaoPorColaborador.ferias", integracaoColaboradorAtivo),
      c("geral.integracaoPorColaborador.rescisao", integracaoColaboradorAtivo),
      c("geral.integracaoPorColaborador.provisaoFerias", integracaoColaboradorAtivo),
      c("geral.integracaoPorColaborador.provisaoDecimoTerceiro", integracaoColaboradorAtivo),
      c("geral.configuracaoRelatorioProvisaoFerias", geraLancamentosAtivo),

      c("opcoes.usarMesmaConfigRescisao"),
      c("opcoes.usarMesmaConfigFerias"),
      c("opcoes.integrarIrrfFeriasDataPagamento"),
      c("opcoes.gerarProvisaoSefipPagamentoEncargos"),
      c("opcoes.considerarUltimoDiaMesNaoUtil"),
      {
        path: "opcoes.linhasTipoCalculo",
        tipo: "array-fixo",
        rowLabelKey: "tipoCalculo",
        colunas: {
          data: {
            label: L.TABELA_CONTABILIDADE_OPCOES.colunas.data,
            // P14: linha "Rescisão"/"Férias" fica inaplicável quando o
            // respectivo "usar mesma configuração" está marcado — mesma
            // condição de `dependsOnExterno` em montaContabilidadeOpcoes().
            aplicavelEm: (linha, form) => {
              if (linha.tipoCalculo === "Rescisão") return !form.opcoes.usarMesmaConfigRescisao;
              if (linha.tipoCalculo === "Férias") return !form.opcoes.usarMesmaConfigFerias;
              return true;
            },
          },
        },
      },
    ];
  })();

  // ===========================================================================
  // HONORÁRIOS (Fase 6) — gatilho amplo + tabela dinâmica de rubricas
  // (D-1/D3).
  // ===========================================================================
  const SCHEMA_HONORARIOS = (function () {
    const M = L.LABELS_HONORARIOS;
    const c = (path, gate) => campo(M, "LABELS_HONORARIOS", path, gate);
    const gerarVariaveisAtivo = (f) => f.gerarVariaveisHonorarios === true;
    return [
      c("gerarVariaveisHonorarios"),
      c("escritorio", gerarVariaveisAtivo),
      {
        path: "rubricas",
        tipo: "array-dinamico",
        resumoLabel: L.TABELA_HONORARIOS_RUBRICAS.resumoLabel,
        colunas: L.TABELA_HONORARIOS_RUBRICAS.colunas,
        aplicavelEm: gerarVariaveisAtivo,
      },
    ];
  })();

  // ===========================================================================
  // CRONOGRAMA (Fase 7) — 3 categorias paralelas (Empregados/Estagiários/
  // Contribuintes). Decisão 1 da Rev. 3: SOMENTE a categoria ativa no
  // momento do salvamento entra no diff — `ctxExtra.categoriaAtiva` é a
  // ÚNICA fonte de verdade aceita (equivalente real a
  // `cronogramaCtx.categoriaAtiva`, passado pelo chamador — nenhuma fonte
  // nova foi inventada; este arquivo não lê nem altera `cronogramaCtx`).
  // "Total de dias" só aplicável na linha "13º Adiantamento" quando "Forma
  // de vencimento" !== "Último dia útil" (mesma condição de
  // `dependsOn`/`ativoQuandoDiferente`/`dependsOnSomenteLinhas` em
  // COLUNAS_CRONOGRAMA).
  // ===========================================================================
  const SCHEMA_CRONOGRAMA = (function () {
    const M = L.LABELS_CRONOGRAMA;
    const categorias = Object.keys(L.CATEGORIAS_CRONOGRAMA); // ["empregados","estagiarios","contribuintes"]
    const totalDiasAplicavel = (linha) => !(linha.evento === "13º Adiantamento" && linha.formaVencimento === "Último dia útil");

    const schema = [];
    categorias.forEach((cat) => {
      const gateCategoria = (form, ctxExtra) => !!ctxExtra && ctxExtra.categoriaAtiva === cat;
      schema.push(campo(M, "LABELS_CRONOGRAMA", cat + ".antecipacaoSabado", gateCategoria));
      schema.push({
        path: cat + ".linhas",
        tipo: "array-fixo",
        rowLabelKey: "evento",
        aplicavelEm: gateCategoria,
        colunas: {
          mesPagamento: { label: L.TABELA_CRONOGRAMA_EVENTOS.colunas.mesPagamento },
          formaVencimento: { label: L.TABELA_CRONOGRAMA_EVENTOS.colunas.formaVencimento },
          totalDias: { label: L.TABELA_CRONOGRAMA_EVENTOS.colunas.totalDias, aplicavelEm: totalDiasAplicavel },
        },
      });
    });
    return schema;
  })();

  global.FolhaHistoricoSchemas = {
    SCHEMA_GERAL,
    SCHEMA_REGIME,
    SCHEMA_ARREDONDAMENTO,
    SCHEMA_ADIANTAMENTO,
    SCHEMA_DECIMO_TERCEIRO,
    SCHEMA_FERIAS,
    SCHEMA_CONTABILIDADE,
    SCHEMA_HONORARIOS,
    SCHEMA_CRONOGRAMA,
  };
})(window);
