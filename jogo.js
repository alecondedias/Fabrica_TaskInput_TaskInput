/*
 * Fábrica do TaskInput: lógica do jogo.
 *
 * Fluxo: tela inicial -> 6 estações (montar a linha, ligar a esteira) -> tela final.
 * O conteúdo está em dados.js, os desenhos em maquinas.js, o celular em visor.js e a
 * simulação de cada estação em motor.js. Este arquivo cuida da tela: encaixar peças
 * (arrastar, clicar ou teclado), animar o bilhete, dicas, desfazer, tutorial, janelas,
 * pontuação e telas.
 *
 * Nada é gravado no navegador (sem localStorage): fechar a página zera o jogo.
 */
(function () {
  "use strict";

  var D = window.DADOS;
  var MQ = window.Maquinas;
  var VI = window.Visor;
  var MO = window.Motor;

  /* ------------------------------------------------------------ utilidades */

  function $(sel, raiz) {
    return (raiz || document).querySelector(sel);
  }
  function $$(sel, raiz) {
    return Array.prototype.slice.call((raiz || document).querySelectorAll(sel));
  }
  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  /* texto com `trechos de código` */
  function md(s) {
    return esc(s).replace(/`([^`]+)`/g, "<code>$1</code>");
  }
  var umaLinha = MO.umaLinha;

  function rng(semente) {
    var a = semente >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function embaralhar(lista, r) {
    var a = lista.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(r() * (i + 1));
      var t = a[i];
      a[i] = a[j];
      a[j] = t;
    }
    return a;
  }
  function movimentoReduzido() {
    return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }

  /* ------------------------------------------------------------ estado */

  var N = D.estacoes.length;
  var NOTAS_LADO = {
    memoria: "O contador mostra quantas vezes a tela foi refeita.",
    fios: "O texto cinza aparece só enquanto o campo está vazio.",
    botao: "O botão esmaece enquanto o dedo está sobre ele.",
    alertas: "A caixa de alerta aparece por cima da tela.",
    porteiro: "Os pontinhos (·) mostram os espaços das pontas do texto.",
    montagem: "Esta é a HomeScreen. O bloco tracejado marca onde o Input vai entrar."
  };
  var DUR = {
    lento: { mover: 900, ficar: 1700 },
    normal: { mover: 600, ficar: 1100 },
    rapido: { mover: 300, ficar: 450 }
  };

  var S = {
    fase: "inicio",
    est: 0,
    dicasMax: D.dicasPadrao,
    ilimitadas: false,
    dicasUsadas: 0,
    resultados: [],
    montagem: {},
    historico: [],
    falhasEst: 0,
    dicasEst: 0,
    dicaNivel: {},
    selecionada: null,
    rodando: false,
    modo: "auto",
    velocidade: "normal",
    corrida: null,
    iPac: 0,
    iPasso: -1,
    ocupado: false,
    gratisCorrida: false,
    concluindo: false,
    arrasto: null,
    suprimirClick: false,
    pedirTutorial: true,
    suspeito: null
  };
  var modalAtual = null;
  var ordens = [];
  var timerToast = null;
  var timerCorrida = null;
  var timerMover = null;

  function estacao() {
    return D.estacoes[S.est];
  }
  function slotDe(id) {
    return estacao().slots.filter(function (s) { return s.id === id; })[0];
  }
  function pecaDe(id) {
    return MO.peca(estacao(), id);
  }
  function slotDaPeca(pecaId) {
    var ids = Object.keys(S.montagem);
    for (var i = 0; i < ids.length; i++) {
      if (S.montagem[ids[i]] === pecaId) return ids[i];
    }
    return null;
  }
  function todosCheios() {
    return estacao().slots.every(function (s) { return !!S.montagem[s.id]; });
  }
  function faltam() {
    return estacao().slots.filter(function (s) { return !S.montagem[s.id]; }).length;
  }
  function elSlot(id) {
    return $('.encaixe[data-slot="' + id + '"]');
  }
  function elVao(id) {
    return $('.vao[data-slot="' + id + '"]');
  }
  function elPeca(id) {
    return $('.peca[data-peca="' + id + '"]');
  }

  /* ordem fixa (por semente) das peças na bandeja, sem aparecer já na ordem da resposta */
  function preparaOrdens() {
    for (var i = 0; i < N; i++) {
      var est = D.estacoes[i];
      var certos = est.slots.map(function (s) { return s.certo; });
      var r = rng(7300 + i * 131);
      var ids = est.pecas.map(function (p) { return p.id; });
      var ordem;
      var tentativas = 0;
      do {
        ordem = embaralhar(ids, r);
        tentativas++;
      } while (ordemRevela(ordem, certos) && tentativas < 300);
      ordens.push(ordem);
    }
  }
  function ordemRevela(ordem, certos) {
    var vistos = ordem.filter(function (id) { return certos.indexOf(id) >= 0; });
    var igual = vistos.every(function (id, k) { return id === certos[k]; });
    var emPosicao = 0;
    for (var i = 0; i < certos.length; i++) {
      if (ordem[i] === certos[i]) emPosicao++;
    }
    return igual || emPosicao > 1;
  }

  /* ------------------------------------------------------------ avisos */

  function anunciar(txt) {
    var a = $("#anuncio");
    a.textContent = "";
    setTimeout(function () {
      a.textContent = txt;
    }, 30);
  }

  function aviso(txt) {
    var t = $("#toast");
    t.textContent = txt;
    t.hidden = false;
    clearTimeout(timerToast);
    timerToast = setTimeout(function () {
      t.hidden = true;
    }, 3400);
    anunciar(txt);
  }

  /* ------------------------------------------------------------ janelas */

  function abrirModal(op) {
    fecharModal(true);
    var camada = $("#camada-modal");
    camada.innerHTML =
      '<div class="modal ' + (op.classe || "") + '" role="dialog" aria-modal="true" aria-labelledby="modal-titulo">' +
      '<div class="modal-corpo">' + op.html + "</div>" +
      '<div class="modal-botoes"></div></div>';
    var area = $(".modal-botoes", camada);
    var primario = null;
    (op.botoes || []).forEach(function (b) {
      var el = document.createElement("button");
      el.type = "button";
      el.className = "botao" + (b.primario ? " botao-primario" : "");
      el.textContent = b.rotulo;
      el.addEventListener("click", function () {
        b.aoClicar();
      });
      area.appendChild(el);
      if (b.primario) primario = el;
    });
    modalAtual = { op: op, anterior: document.activeElement };
    camada.hidden = false;
    var foco = primario || $(".botao", area);
    if (foco) foco.focus();
    var corpo = $(".modal-corpo", camada);
    if (corpo) corpo.scrollTop = 0;
  }

  function fecharModal(semFoco) {
    var camada = $("#camada-modal");
    if (!modalAtual) {
      camada.hidden = true;
      return;
    }
    var anterior = modalAtual.anterior;
    modalAtual = null;
    camada.hidden = true;
    camada.innerHTML = "";
    if (!semFoco && anterior && document.body.contains(anterior)) {
      try {
        anterior.focus({ preventScroll: true });
      } catch (e) {
        /* sem foco, tudo bem */
      }
    }
  }

  function prenderFoco(e) {
    if (!modalAtual || e.key !== "Tab") return;
    var foco = $$("button, [href], input, select, textarea", $("#camada-modal")).filter(function (x) { return !x.disabled; });
    if (!foco.length) return;
    var primeiro = foco[0];
    var ultimo = foco[foco.length - 1];
    if (e.shiftKey && document.activeElement === primeiro) {
      e.preventDefault();
      ultimo.focus();
    } else if (!e.shiftKey && document.activeElement === ultimo) {
      e.preventDefault();
      primeiro.focus();
    }
  }

  function bloqueado() {
    return S.concluindo || !!modalAtual;
  }

  /* ------------------------------------------------------------ telas */

  function mostrarTela(qual) {
    $("#tela-inicio").hidden = qual !== "inicio";
    $("#tela-jogo").hidden = qual !== "jogo";
    $("#tela-fim").hidden = qual !== "fim";
    S.fase = qual;
    window.scrollTo(0, 0);
  }

  function comecar(e) {
    if (e) e.preventDefault();
    S.ilimitadas = $('input[name="dicas"]:checked').value === "ilimitada";
    S.dicasUsadas = 0;
    S.resultados = [];
    S.pedirTutorial = $("#opt-tutorial").checked;
    mostrarTela("jogo");
    iniciarEstacao(0);
    if (S.pedirTutorial) tutIniciar();
  }

  function reiniciar() {
    tutFim();
    limparCorrida();
    fecharModal(true);
    S.resultados = [];
    S.dicasUsadas = 0;
    mostrarTela("inicio");
    $("#btn-comecar").focus();
  }

  /* ------------------------------------------------------------ montar a estação */

  function iniciarEstacao(i) {
    limparCorrida();
    S.est = i;
    S.montagem = {};
    S.historico = [];
    S.falhasEst = 0;
    S.dicasEst = 0;
    S.dicaNivel = {};
    S.selecionada = null;
    S.arrasto = null;
    S.concluindo = false;
    S.suspeito = null;
    var est = estacao();

    $("#est-nome").textContent = "Estação " + (i + 1) + ": " + est.nome;
    $("#est-pedido").innerHTML = md(est.pedido);
    $("#linha").style.setProperty("--acento", est.cor);
    $("#tela-jogo").style.setProperty("--acento", est.cor);

    desenharEsteira();
    desenharBandeja();
    desenharChips();
    VI.montar($("#celular"));
    VI.configurar({ botao: i >= 2, contador: i === 0, espacos: !!est.mostrarEspacos });
    VI.reiniciar(MO.celularInicial(est));
    $("#lado-nota").textContent = NOTAS_LADO[est.id] || "";

    definirFaixa("ocioso");
    atualizarTudo();
    var primeira = $(".peca:not(.usada)");
    if (primeira) primeira.focus({ preventScroll: true });
    anunciar("Estação " + (i + 1) + " de " + N + ": " + est.nome);
  }

  function noHtml(tipo, info) {
    return (
      '<div class="no no-' + tipo + '" data-no="' + tipo + '">' +
      '<div class="no-ilu">' + MQ.svg(info.maq) + "</div>" +
      '<div class="no-rotulo">' + esc(info.rotulo) + "</div>" +
      '<span class="ancora"></span></div>'
    );
  }

  function encaixeHtml(s) {
    return (
      '<div class="encaixe" data-slot="' + s.id + '">' +
      '<div class="encaixe-cab"><span class="encaixe-letra">' + s.id + '</span><span class="encaixe-curto">' + esc(s.curto) + "</span></div>" +
      '<p class="encaixe-papel">' + esc(s.papel) + "</p>" +
      '<button type="button" class="vao" data-slot="' + s.id + '"></button>' +
      '<span class="ancora"></span></div>'
    );
  }

  function desenharEsteira() {
    var est = estacao();
    var h = '<div class="esteira-corpo' + (est.grupos ? " com-grupos" : "") + '" id="esteira-corpo"><div class="trilho" aria-hidden="true"><div class="trilho-rolos"></div></div>';
    h += noHtml("origem", est.origem);
    if (est.grupos) {
      est.grupos.forEach(function (nome, g) {
        h += '<div class="grupo"><div class="grupo-cab"><span class="grupo-ico">' + MQ.svg("arquivo") + '</span><span class="grupo-nome">' + esc(nome) + '</span></div><div class="grupo-slots">';
        est.slots.forEach(function (s) {
          if (s.grupo === g) h += encaixeHtml(s);
        });
        h += "</div></div>";
      });
    } else {
      est.slots.forEach(function (s) {
        h += encaixeHtml(s);
      });
    }
    h += noHtml("destino", est.destino);
    h += '<div class="pacote" id="pacote" hidden></div></div>';
    $("#esteira").innerHTML = h;
    est.slots.forEach(function (s) {
      desenharVao(s.id);
    });
  }

  /* código com pontos de quebra depois de "/" em caminhos, para não cortar no meio da palavra */
  function codigoQuebravel(t) {
    return esc(t).replace(/\/(?=[A-Za-z])/g, "/<wbr>");
  }

  function cartaoHtml(p, compacto) {
    return (
      '<span class="pc-ilu">' + MQ.svg(p.maq) + "</span>" +
      (compacto ? "" : '<span class="pc-rotulo">' + esc(p.rotulo) + "</span>") +
      '<code class="pc-cod">' + codigoQuebravel(p.codigo) + "</code>"
    );
  }

  function desenharVao(slotId) {
    var vao = elVao(slotId);
    var s = slotDe(slotId);
    var id = S.montagem[slotId];
    var p = id ? pecaDe(id) : null;
    vao.classList.toggle("cheio", !!p);
    if (p) {
      vao.innerHTML = '<span class="pc pc-encaixe">' + cartaoHtml(p, true) + "</span>";
      vao.setAttribute("aria-label", "Encaixe " + slotId + ", " + s.curto + ". Contém " + umaLinha(p.codigo) + ". Pressione Enter para devolver a peça à bandeja.");
      vao.dataset.peca = p.id;
    } else {
      vao.innerHTML = '<span class="vao-vazio">Solte uma peça aqui</span>';
      vao.setAttribute("aria-label", "Encaixe " + slotId + ", " + s.curto + ". Vazio. " + s.papel + ".");
      delete vao.dataset.peca;
    }
  }

  function desenharBandeja() {
    var cx = $("#pecas");
    cx.innerHTML = "";
    ordens[S.est].forEach(function (id) {
      var p = pecaDe(id);
      var lugar = document.createElement("div");
      lugar.className = "peca-lugar";
      var b = document.createElement("button");
      b.type = "button";
      b.className = "peca";
      b.dataset.peca = id;
      b.setAttribute("aria-pressed", "false");
      b.setAttribute("aria-label", p.rotulo + ". Código: " + umaLinha(p.codigo) + ".");
      b.innerHTML = '<span class="pc">' + cartaoHtml(p, false) + "</span>";
      lugar.appendChild(b);
      cx.appendChild(lugar);
    });
  }

  function desenharChips() {
    var est = estacao();
    var h = "";
    est.pacotes.forEach(function (pk, i) {
      h +=
        '<li class="chip" data-i="' + i + '"><span class="chip-ico" aria-hidden="true"></span>' +
        '<span class="chip-txt">' + esc(pk.rotulo) + "</span>" +
        (pk.observar ? '<em class="chip-obs">observação</em>' : "") + "</li>";
    });
    if (est.mostrarEspacos) h += '<li class="chip-nota">· = espaço</li>';
    $("#chips").innerHTML = h;
  }

  function marcarChip(i, estado) {
    $$(".chip").forEach(function (c) {
      var k = parseInt(c.dataset.i, 10);
      if (i === null) {
        c.classList.remove("atual", "ok", "falhou");
      } else if (k === i) {
        c.classList.remove("atual", "ok", "falhou");
        if (estado) c.classList.add(estado);
      }
    });
  }

  /* ------------------------------------------------------------ cabeçalho e botões */

  function atualizarTudo() {
    atualizarCabecalho();
    atualizarMontagem();
  }

  function atualizarCabecalho() {
    var passos = $("#passos");
    passos.innerHTML = "";
    for (var i = 0; i < N; i++) {
      var li = document.createElement("li");
      var r = S.resultados[i];
      li.className = "passo" + (i === S.est ? " atual" : "") + (r ? " feito" : "");
      li.textContent = String(i + 1);
      li.title = "Estação " + (i + 1) + ": " + D.estacoes[i].nome + (r ? " (" + r.estrelas + (r.estrelas === 1 ? " estrela" : " estrelas") + ")" : "");
      if (i === S.est) li.setAttribute("aria-current", "step");
      passos.appendChild(li);
    }
    var total = 0;
    S.resultados.forEach(function (r) {
      if (r) total += r.estrelas;
    });
    var dicas = S.ilimitadas ? "Dicas ilimitadas" : "Dicas: " + Math.max(0, S.dicasMax - S.dicasUsadas) + " de " + S.dicasMax;
    $("#topo-info").innerHTML = "<span>" + dicas + '</span><span class="topo-estrelas"><span class="mini-estrela">' + MQ.icone("estrela") + "</span>" + total + "</span>";
  }

  function atualizarMontagem() {
    var est = estacao();
    est.slots.forEach(function (s) {
      desenharVao(s.id);
      var el = elSlot(s.id);
      el.classList.toggle("aceita", !!S.selecionada);
      el.classList.toggle("suspeito", S.suspeito === s.id);
    });
    $$(".peca").forEach(function (b) {
      var usada = !!slotDaPeca(b.dataset.peca);
      b.classList.toggle("usada", usada);
      b.disabled = usada;
      var sel = S.selecionada === b.dataset.peca;
      b.classList.toggle("selecionada", sel);
      b.setAttribute("aria-pressed", sel ? "true" : "false");
    });
    atualizarControles();
    if (todosCheios()) {
      tutEvento("cheio");
      if (!S.rodando && !S.concluindo) definirLegendaOciosa();
    } else if (!S.rodando) {
      definirLegendaOciosa();
    }
  }

  function definirLegendaOciosa() {
    var n = faltam();
    var txt;
    if (n === estacao().slots.length) txt = "Arraste cada peça da bandeja para o encaixe que combina com o seu papel.";
    else if (n > 0) txt = n === 1 ? "Falta 1 encaixe. Escolha uma peça da bandeja." : "Faltam " + n + " encaixes. Escolha uma peça da bandeja.";
    else txt = "Tudo encaixado. Ligue a esteira ou avance no passo a passo.";
    $("#legenda").innerHTML = '<span class="leg-ocioso">' + esc(txt) + "</span>";
  }

  function atualizarControles() {
    var cheio = todosCheios();
    var ligar = $("#btn-ligar");
    var passo = $("#btn-passo");
    var parar = $("#btn-parar");
    ligar.innerHTML = MQ.icone("play") + "<span>Ligar a esteira</span>";
    ligar.disabled = S.rodando || !cheio;
    ligar.title = cheio ? "Liga a esteira e solta os bilhetes de teste" : "Preencha todos os encaixes primeiro";
    if (S.rodando && S.modo === "passo") {
      passo.innerHTML = MQ.icone("passo") + "<span>Próximo passo</span>";
      passo.disabled = S.ocupado;
    } else {
      passo.innerHTML = MQ.icone("passo") + "<span>Passo a passo</span>";
      passo.disabled = S.rodando || !cheio;
    }
    passo.title = "Avança uma máquina por vez, com legenda";
    parar.innerHTML = MQ.icone("parar") + "<span>Parar</span>";
    parar.disabled = !S.rodando;
    $$("#velocidade button").forEach(function (b) {
      var on = b.dataset.vel === S.velocidade;
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });

    var restantes = S.ilimitadas ? Infinity : S.dicasMax - S.dicasUsadas;
    var bd = $("#btn-dica");
    bd.innerHTML = MQ.icone("dica") + "<span>" + (S.ilimitadas ? "Dica" : "Dica (" + Math.max(0, restantes) + ")") + "</span>";
    bd.disabled = S.rodando;
    bd.title = "Pede uma pista sobre o próximo encaixe (tecla H)";
    var bz = $("#btn-desfazer");
    bz.innerHTML = MQ.icone("desfazer") + "<span>Desfazer</span>";
    bz.disabled = S.rodando || !S.historico.length;
    bz.title = "Volta a última mudança na montagem (tecla Z)";
    $("#bandeja").classList.toggle("travada", S.rodando);
  }

  /* ------------------------------------------------------------ colocar e tirar peças */

  function guardarHistorico() {
    S.historico.push(JSON.parse(JSON.stringify(S.montagem)));
    if (S.historico.length > 80) S.historico.shift();
  }

  function colocar(slotId, pecaId) {
    if (S.rodando || bloqueado()) return;
    if (tutorialBloqueiaColocar(slotId, pecaId)) return;
    var antigo = slotDaPeca(pecaId);
    var ocupante = S.montagem[slotId];
    if (antigo === slotId) return;
    guardarHistorico();
    if (antigo) delete S.montagem[antigo];
    if (ocupante && antigo) S.montagem[antigo] = ocupante;
    S.montagem[slotId] = pecaId;
    S.selecionada = null;
    if (S.suspeito === slotId || S.suspeito === antigo) S.suspeito = null;
    limparPulsos(slotId, pecaId);
    atualizarMontagem();
    var p = pecaDe(pecaId);
    anunciar("Peça " + umaLinha(p.codigo) + " no encaixe " + slotId + ".");
    tutEvento("colocou", { slot: slotId, peca: pecaId });
  }

  function devolver(slotId) {
    if (S.rodando || bloqueado() || !S.montagem[slotId]) return;
    if (tutorialBloqueiaAcao("devolver")) return;
    guardarHistorico();
    var id = S.montagem[slotId];
    delete S.montagem[slotId];
    if (S.suspeito === slotId) S.suspeito = null;
    atualizarMontagem();
    anunciar("Peça devolvida à bandeja.");
    var b = elPeca(id);
    if (b) b.focus({ preventScroll: true });
  }

  function desfazer() {
    if (S.fase !== "jogo" || bloqueado() || S.rodando) return;
    if (tutorialBloqueiaAcao("desfazer")) return;
    var antes = S.historico.pop();
    if (!antes) {
      aviso("Ainda não há o que desfazer.");
      return;
    }
    S.montagem = antes;
    S.selecionada = null;
    S.suspeito = null;
    atualizarMontagem();
    anunciar("Última mudança desfeita.");
  }

  function selecionar(pecaId) {
    if (tutorialBloqueiaSelecao(pecaId)) return;
    S.selecionada = S.selecionada === pecaId ? null : pecaId;
    atualizarMontagem();
    if (S.selecionada) anunciar("Peça selecionada. Escolha agora um encaixe.");
  }

  function limparPulsos(slotId, pecaId) {
    var v = elVao(slotId);
    if (v) v.classList.remove("pulsa-dica");
    var b = elPeca(pecaId);
    if (b) b.classList.remove("pulsa-dica");
  }

  /* ------------------------------------------------------------ arrastar e clicar */

  function aoPressionar(e) {
    if (S.fase !== "jogo" || bloqueado() || S.rodando || e.button > 0) return;
    var peca = e.target.closest(".peca");
    var vao = e.target.closest(".vao.cheio");
    var origem = null;
    if (peca && !peca.disabled) origem = { tipo: "bandeja", peca: peca.dataset.peca, el: peca };
    else if (vao) origem = { tipo: "encaixe", peca: vao.dataset.peca, slot: vao.dataset.slot, el: vao };
    if (!origem) return;
    S.arrasto = { origem: origem, x: e.clientX, y: e.clientY, ativo: false };
  }

  function aoMover(e) {
    var a = S.arrasto;
    if (!a) return;
    if (!a.ativo && Math.abs(e.clientX - a.x) + Math.abs(e.clientY - a.y) > 6) {
      if (tutorialBloqueiaSelecao(a.origem.peca)) {
        S.arrasto = null;
        return;
      }
      a.ativo = true;
      document.body.classList.add("arrastando");
      var f = $("#fantasma");
      f.innerHTML = '<span class="pc">' + cartaoHtml(pecaDe(a.origem.peca), false) + "</span>";
      f.hidden = false;
      a.origem.el.classList.add("arrastada");
      S.selecionada = null;
      $$(".encaixe").forEach(function (x) { x.classList.add("aceita"); });
    }
    if (a.ativo) {
      var f2 = $("#fantasma");
      f2.style.transform = "translate(" + (e.clientX + 6) + "px," + (e.clientY + 6) + "px) rotate(-3deg)";
      var alvo = encaixeSob(e);
      $$(".encaixe.alvo").forEach(function (x) { if (x !== alvo) x.classList.remove("alvo"); });
      if (alvo) alvo.classList.add("alvo");
    }
  }

  function encaixeSob(e) {
    var el = document.elementFromPoint(e.clientX, e.clientY);
    return el && el.closest ? el.closest(".encaixe") : null;
  }

  function terminarArrasto() {
    document.body.classList.remove("arrastando");
    var f = $("#fantasma");
    f.hidden = true;
    $$(".arrastada").forEach(function (x) { x.classList.remove("arrastada"); });
    $$(".encaixe.alvo").forEach(function (x) { x.classList.remove("alvo"); });
    $$(".encaixe.aceita").forEach(function (x) { if (!S.selecionada) x.classList.remove("aceita"); });
  }

  function aoSoltar(e) {
    var a = S.arrasto;
    S.arrasto = null;
    if (!a || !a.ativo) return;
    S.suprimirClick = true;
    setTimeout(function () {
      S.suprimirClick = false;
    }, 0);
    var alvo = encaixeSob(e);
    var naBandeja = (function () {
      var el = document.elementFromPoint(e.clientX, e.clientY);
      return !!(el && el.closest && el.closest("#bandeja"));
    })();
    terminarArrasto();
    if (alvo) {
      colocar(alvo.dataset.slot, a.origem.peca);
    } else if (naBandeja && a.origem.tipo === "encaixe") {
      devolver(a.origem.slot);
    }
    atualizarMontagem();
  }

  function aoCancelar() {
    if (S.arrasto) {
      S.arrasto = null;
      terminarArrasto();
    }
  }

  function aoClicar(e) {
    if (S.suprimirClick || S.fase !== "jogo" || bloqueado() || S.rodando) return;
    var peca = e.target.closest(".peca");
    var vao = e.target.closest(".vao");
    if (peca) {
      if (!peca.disabled) selecionar(peca.dataset.peca);
      return;
    }
    if (vao) {
      if (S.selecionada) colocar(vao.dataset.slot, S.selecionada);
      else if (vao.classList.contains("cheio")) devolver(vao.dataset.slot);
      else aviso("Escolha uma peça da bandeja e depois clique neste encaixe.");
      return;
    }
    if (S.selecionada && !e.target.closest("#faixa")) {
      S.selecionada = null;
      atualizarMontagem();
    }
  }

  function aoTeclaMontagem(e) {
    var alvo = e.target;
    var ehPeca = alvo.classList && alvo.classList.contains("peca");
    var ehVao = alvo.classList && alvo.classList.contains("vao");
    if (!ehPeca && !ehVao) return;
    var k = e.key;
    if ((k === "Delete" || k === "Backspace") && ehVao) {
      e.preventDefault();
      devolver(alvo.dataset.slot);
      return;
    }
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].indexOf(k) < 0) return;
    e.preventDefault();
    var vaos = $$(".vao");
    var pecas = $$(".peca:not(.usada)");
    var lista = ehPeca ? pecas : vaos;
    var i = lista.indexOf(alvo);
    if (k === "ArrowRight" && i < lista.length - 1) lista[i + 1].focus();
    else if (k === "ArrowLeft" && i > 0) lista[i - 1].focus();
    else if (k === "ArrowUp" && ehPeca && vaos.length) vaos[Math.min(vaos.length - 1, Math.max(0, i))].focus();
    else if (k === "ArrowDown" && ehVao && pecas.length) pecas[Math.min(pecas.length - 1, Math.max(0, i))].focus();
  }

  /* ------------------------------------------------------------ faixa: dica, tutorial, repouso */

  function definirFaixa(modo, html) {
    var f = $("#faixa");
    f.className = "faixa faixa-" + modo;
    if (modo === "ocioso") {
      f.innerHTML = '<span class="faixa-texto faixa-calma">Atalhos do teclado: H pede uma dica e Z desfaz a última mudança.</span>';
    } else {
      f.innerHTML = html;
    }
  }

  /* ------------------------------------------------------------ dicas */

  function alvoDaDica() {
    var slots = estacao().slots;
    for (var i = 0; i < slots.length; i++) {
      if (S.montagem[slots[i].id] !== slots[i].certo) return slots[i];
    }
    return null;
  }

  function pedirDica() {
    if (S.fase !== "jogo" || bloqueado() || S.rodando) return;
    if (tutorialBloqueiaAcao("dica")) return;
    var slot = alvoDaDica();
    if (!slot) {
      aviso("Todos os encaixes estão certos. Ligue a esteira.");
      return;
    }
    var peca = pecaDe(slot.certo);
    var gratis = tutAtivo();
    var nivelAtual = S.dicaNivel[slot.id] || 0;
    var cobra = !gratis && nivelAtual < 2;
    if (cobra && !S.ilimitadas && S.dicasUsadas >= S.dicasMax) {
      aviso("As dicas acabaram. Use o que as explicações já mostraram.");
      return;
    }
    var nivel = Math.min(2, nivelAtual + 1);
    S.dicaNivel[slot.id] = nivel;
    if (cobra) {
      S.dicasUsadas++;
      S.dicasEst++;
    }
    var selo = gratis ? "Dica do tutorial" : S.ilimitadas ? "Dica" : "Dica " + S.dicasUsadas + " de " + S.dicasMax;
    var texto = nivel === 1 ? peca.dica : peca.dicaForte;
    S.dicaTut = { slot: slot.id, texto: texto };
    if (!tutAtivo()) {
      definirFaixa(
        "dica",
        '<span class="faixa-selo">' + esc(selo) + "</span>" +
        '<span class="faixa-texto"><strong>Encaixe ' + slot.id + ", " + esc(slot.curto) + ":</strong> " + md(texto) + "</span>" +
        '<button type="button" class="faixa-fechar" id="faixa-fechar" aria-label="Fechar a dica">' + MQ.icone("fechar") + "</button>"
      );
      $("#faixa-fechar").addEventListener("click", function () {
        definirFaixa("ocioso");
      });
    } else if (TUT.passo === 3) {
      tutMostrar();
    }
    pulsar(elVao(slot.id));
    if (nivel === 2) {
      var onde = slotDaPeca(peca.id);
      pulsar(onde ? elVao(onde) : elPeca(peca.id));
    }
    atualizarCabecalho();
    atualizarControles();
    anunciar(selo + ". Encaixe " + slot.id + ". " + texto);
    tutEvento("dica");
  }

  function pulsar(el) {
    if (!el) return;
    el.classList.remove("pulsa-dica");
    void el.offsetWidth;
    el.classList.add("pulsa-dica");
  }

  function limparDica() {
    $$(".pulsa-dica").forEach(function (n) {
      n.classList.remove("pulsa-dica");
    });
    var f = $("#faixa");
    if (f.classList.contains("faixa-dica")) definirFaixa("ocioso");
  }

  /* ------------------------------------------------------------ pacote e esteira */

  function textoDoPacote(pk, texto) {
    if (pk.evento === "abrir") return "abrir a tela";
    if (pk.evento === "montar") return "";
    if (pk.evento === "props") return 'nome="x"';
    if (pk.evento === "limpar") return "(vazio)";
    if (texto === "" || texto == null) return "(vazio)";
    return estacao().mostrarEspacos ? MO.vis(texto) : texto;
  }
  var TIPO_PACOTE = { digitar: "texto", limpar: "estado", abrir: "evento", tocar: "toque", web: "toque no navegador", montar: "componente", props: "tentativa" };

  function pacoteHtml(pk) {
    if (pk.evento === "montar" || pk.evento === "props") {
      return (
        '<span class="pk-caminhao">' + MQ.svg("caminhao") + "</span>" +
        (pk.evento === "props" ? '<span class="pk-etq">' + esc(textoDoPacote(pk, pk.texto)) + "</span>" : "")
      );
    }
    return (
      '<span class="pk-nota"><span class="pk-tipo">' + esc(TIPO_PACOTE[pk.evento] || "texto") + "</span>" +
      '<span class="pk-texto">' + esc(textoDoPacote(pk, pk.texto)) + "</span></span>"
    );
  }

  function atualizarTextoDoPacote(pk, texto) {
    var t = $("#pacote .pk-texto");
    if (t) t.textContent = textoDoPacote(pk, texto);
  }

  function elementoDoNo(no) {
    if (no === "origem" || no === "destino") return $('.no[data-no="' + no + '"]');
    return elSlot(no);
  }

  function centroDaAncora(el) {
    var corpo = $("#esteira-corpo");
    var a = $(".ancora", el);
    var rc = corpo.getBoundingClientRect();
    var ra = a.getBoundingClientRect();
    return { x: ra.left + ra.width / 2 - rc.left + corpo.scrollLeft, y: ra.top + ra.height / 2 - rc.top + corpo.scrollTop };
  }

  function colocarPacote(el, animar, dur) {
    var p = $("#pacote");
    var c = centroDaAncora(el);
    p.style.transitionDuration = animar ? dur + "ms" : "0ms";
    p.style.transform = "translate(" + c.x + "px," + c.y + "px) translate(-50%,-50%)";
  }

  function durMover() {
    if (movimentoReduzido()) return 60;
    return S.modo === "passo" ? DUR.normal.mover : DUR[S.velocidade].mover;
  }
  function durFicar() {
    if (movimentoReduzido()) return Math.min(DUR[S.velocidade].ficar, 700);
    return DUR[S.velocidade].ficar;
  }

  function execucaoAtual() {
    return S.corrida.execucoes[S.iPac];
  }

  function preparaPacote(i) {
    var ex = S.corrida.execucoes[i];
    var p = $("#pacote");
    p.innerHTML = pacoteHtml(ex.pacote);
    p.className = "pacote " + (ex.pacote.evento === "montar" || ex.pacote.evento === "props" ? "pacote-caminhao" : "pacote-bilhete");
    p.hidden = false;
    colocarPacote(elementoDoNo("origem"), false);
    void p.offsetWidth;
    p.classList.add("entra");
    $$(".encaixe").forEach(function (e) {
      e.classList.remove("ativo", "res-ok", "res-pula", "res-falha", "res-info");
    });
    $$(".no").forEach(function (e) {
      e.classList.remove("ativo");
    });
    marcarChip(null);
    for (var k = 0; k < i; k++) marcarChip(k, S.corrida.execucoes[k].ok ? "ok" : "falhou");
    marcarChip(i, "atual");
    $("#legenda").innerHTML = '<span class="leg-ocioso">Pacote ' + (i + 1) + " de " + S.corrida.execucoes.length + ": " + esc(ex.pacote.rotulo) + ".</span>";
  }

  function ligar(modo) {
    if (S.fase !== "jogo" || bloqueado() || S.rodando) return;
    if (!todosCheios()) {
      aviso("Preencha todos os encaixes antes de ligar a esteira.");
      return;
    }
    if (tutorialBloqueiaAcao("ligar")) return;
    S.rodando = true;
    S.modo = modo;
    S.gratisCorrida = tutAtivo();
    S.corrida = MO.rodarTudo(estacao(), S.montagem);
    S.iPac = 0;
    S.iPasso = -1;
    S.ocupado = false;
    S.selecionada = null;
    S.suspeito = null;
    limparDica();
    document.body.classList.add("rodando");
    $("#esteira").classList.add("rodando");
    atualizarMontagem();
    preparaPacote(0);
    tutEvento("ligou");
    clearTimeout(timerCorrida);
    if (modo === "auto") timerCorrida = setTimeout(proximo, 500);
  }

  function proximo() {
    if (!S.rodando || S.ocupado) return;
    var ex = execucaoAtual();
    if (!ex) return;
    var passo = ex.passos[S.iPasso + 1];
    if (!passo) {
      fimDoPacote();
      return;
    }
    S.iPasso++;
    executaPasso(ex, passo);
  }

  /* na esteira vertical (telas estreitas) a página rola para acompanhar o pacote */
  function seguirNaTela(el) {
    if (!el || !window.matchMedia || !window.matchMedia("(max-width: 1099px)").matches) return;
    var r = el.getBoundingClientRect();
    if (r.top < 90 || r.bottom > window.innerHeight - 150) {
      el.scrollIntoView({ block: "center", behavior: movimentoReduzido() ? "auto" : "smooth" });
    }
  }

  function executaPasso(ex, p) {
    S.ocupado = true;
    atualizarControles();
    var alvo = elementoDoNo(p.no);
    var dur = durMover();
    colocarPacote(alvo, true, dur);
    seguirNaTela(alvo);
    clearTimeout(timerMover);
    timerMover = setTimeout(function () {
      if (!S.rodando) return;
      aplicaPasso(ex, p);
      S.ocupado = false;
      atualizarControles();
      var ultimo = S.iPasso === ex.passos.length - 1;
      var ultimoPacote = S.iPac === S.corrida.execucoes.length - 1;
      clearTimeout(timerCorrida);
      if (p.tipo === "falha") {
        timerCorrida = setTimeout(function () {
          falhou(ex);
        }, 700);
      } else if (ultimo && ultimoPacote) {
        timerCorrida = setTimeout(terminouOk, 1000);
      } else if (S.modo === "auto") {
        timerCorrida = setTimeout(proximo, durFicar());
      }
    }, dur + 20);
  }

  function aplicaPasso(ex, p) {
    atualizarTextoDoPacote(ex.pacote, p.pacoteTexto);
    VI.aplicar(p.celular);
    $$(".encaixe, .no").forEach(function (e) {
      e.classList.remove("ativo");
    });
    var alvo = elementoDoNo(p.no);
    var el = $("#pacote");
    if (p.tipo === "falha") {
      el.classList.add("pk-falha");
    }
    if (alvo) {
      if (p.no === "origem" || p.no === "destino") {
        alvo.classList.add("ativo");
      } else {
        if (p.tipo === "ok") alvo.classList.add("ativo", "res-ok");
        else if (p.tipo === "info") alvo.classList.add("ativo", "res-info");
        else if (p.tipo === "pula") alvo.classList.add("res-pula");
        else if (p.tipo === "falha") alvo.classList.add("res-falha");
      }
    }
    if (ex.falha && p.tipo === "falha" && ex.falha.slot && ex.falha.no === "destino") {
      var culpado = elSlot(ex.falha.slot);
      if (culpado) culpado.classList.add("res-falha");
    }
    mostrarLegenda(p);
  }

  function rotuloDoNo(no) {
    if (no === "origem") return "Saída";
    if (no === "destino") return "Chegada";
    var s = slotDe(no);
    return "Encaixe " + no + ", " + s.curto;
  }

  function mostrarLegenda(p) {
    var classe = p.tipo === "falha" ? "leg-falha" : p.tipo === "pula" ? "leg-pula" : p.tipo === "info" ? "leg-info" : "leg-ok";
    var tag = p.tipo === "falha" ? (p.no === "destino" ? "Chegada com erro" : "Parou: " + rotuloDoNo(p.no)) : p.tipo === "pula" ? rotuloDoNo(p.no) + " (passou direto)" : p.tipo === "info" ? "Observação" : rotuloDoNo(p.no);
    var txt = p.tipo === "falha" ? p.legenda : p.legenda;
    $("#legenda").innerHTML = '<span class="leg-tag ' + classe + '">' + esc(tag) + "</span><span class=\"leg-texto\">" + md(txt) + "</span>";
    anunciar(tag + ". " + txt.replace(/`/g, ""));
  }

  function fimDoPacote() {
    var ex = execucaoAtual();
    marcarChip(S.iPac, ex.ok ? "ok" : "falhou");
    S.iPac++;
    if (S.iPac >= S.corrida.execucoes.length) {
      terminouOk();
      return;
    }
    S.iPasso = -1;
    preparaPacote(S.iPac);
    clearTimeout(timerCorrida);
    if (S.modo === "auto") timerCorrida = setTimeout(proximo, 700);
    atualizarControles();
  }

  function parar() {
    if (!S.rodando) return;
    limparCorrida();
    atualizarMontagem();
    anunciar("Esteira parada.");
  }

  function limparCorrida() {
    clearTimeout(timerCorrida);
    clearTimeout(timerMover);
    S.rodando = false;
    S.ocupado = false;
    S.corrida = null;
    S.iPac = 0;
    S.iPasso = -1;
    document.body.classList.remove("rodando");
    var est = $("#esteira");
    if (est) est.classList.remove("rodando");
    var p = $("#pacote");
    if (p) {
      p.hidden = true;
      p.className = "pacote";
      p.innerHTML = "";
    }
    $$(".encaixe, .no").forEach(function (e) {
      e.classList.remove("ativo", "res-ok", "res-pula", "res-falha", "res-info", "concluido");
    });
    marcarChip(null);
    if (S.fase === "jogo" || S.fase === "fim") {
      var e = D.estacoes[S.est];
      if ($("#celular .cel")) VI.reiniciar(MO.celularInicial(e));
      if (S.fase === "jogo") definirLegendaOciosa();
    }
  }

  /* ------------------------------------------------------------ resultado da corrida */

  function falhou(ex) {
    if (!S.rodando) return;
    var f = ex.falha;
    tutFim();
    if (!S.gratisCorrida) S.falhasEst++;
    S.suspeito = f.slot;
    var slot = slotDe(f.slot);
    var peca = f.peca ? pecaDe(f.peca) : null;
    var quando =
      f.no === "destino"
        ? "Os bilhetes passaram, mas o celular mostrou o resultado errado. O encaixe suspeito é o " + f.slot + " (" + esc(slot.curto) + ")."
        : "O pacote “" + esc(ex.pacote.rotulo) + "” parou no encaixe " + f.slot + " (" + esc(slot.curto) + ").";
    var corpo =
      '<div class="modal-ilu">' +
      (peca ? '<span class="ilu-peca">' + MQ.svg(peca.maq) + "</span>" : "") +
      '<span class="modal-faisca">' + faisca() + "</span>" +
      '<span class="ilu-nota">' + MQ.svg(f.no === "destino" ? estacao().destino.maq : estacao().origem.maq) + "</span></div>" +
      '<h2 class="modal-titulo" id="modal-titulo">' + esc(f.titulo) + "</h2>" +
      '<p class="modal-contexto">' + quando + "</p>" +
      "<p>" + md(f.texto) + "</p>" +
      (f.pista ? '<p class="modal-pista">' + md(f.pista) + "</p>" : "");
    abrirModal({
      classe: "modal-erro",
      html: corpo,
      botoes: [{ rotulo: "OK", primario: true, aoClicar: fecharErro }]
    });
    atualizarCabecalho();
  }

  function faisca() {
    return (
      '<svg viewBox="0 0 56 26" aria-hidden="true" focusable="false">' +
      '<path d="M2 13 H18 L24 4 L32 22 L38 13 H54" fill="none" stroke="#d7263d" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    );
  }

  function fecharErro() {
    fecharModal(true);
    limparCorrida();
    atualizarMontagem();
    var s = S.suspeito ? elVao(S.suspeito) : null;
    if (s) s.focus({ preventScroll: true });
  }

  function terminouOk() {
    if (!S.rodando) return;
    S.concluindo = true;
    clearTimeout(timerCorrida);
    $$(".encaixe").forEach(function (e) {
      e.classList.remove("ativo", "res-pula", "res-info");
      e.classList.add("concluido");
    });
    marcarChip(null);
    S.corrida.execucoes.forEach(function (ex, k) {
      marcarChip(k, "ok");
    });
    $("#legenda").innerHTML = '<span class="leg-tag leg-ok">Esteira aprovada</span><span class="leg-texto">Todos os pacotes de teste passaram.</span>';
    anunciar("Esteira aprovada. Todos os pacotes de teste passaram.");
    timerCorrida = setTimeout(concluirEstacao, 1100);
  }

  /* ------------------------------------------------------------ conclusão da estação */

  function estrelasDaEstacao() {
    var pen = S.falhasEst + S.dicasEst;
    return pen <= 1 ? 3 : pen <= 4 ? 2 : 1;
  }

  function htmlEstrelas(n, animar) {
    var h = '<div class="estrelas" role="img" aria-label="' + n + (n === 1 ? " estrela" : " estrelas") + ' de 3">';
    for (var i = 1; i <= 3; i++) {
      h += '<span class="estrela' + (i <= n ? " cheia" : "") + (animar && i <= n ? " nova" : "") + '">' + MQ.icone("estrela") + "</span>";
    }
    return h + "</div>";
  }

  function fichasDaEstacao() {
    var est = estacao();
    var lista = [{ tipo: "linha" }];
    est.slots.forEach(function (s) {
      lista.push({ tipo: "certa", peca: pecaDe(s.certo), slot: s });
    });
    est.pecas.forEach(function (p) {
      if (p.tipo !== "certa") lista.push({ tipo: p.tipo, peca: p });
    });
    return lista;
  }

  function fichaHtml(f) {
    var est = estacao();
    if (f.tipo === "linha") {
      var itens = est.slots
        .map(function (s) {
          var p = pecaDe(s.certo);
          return (
            '<li><span class="encaixe-letra">' + s.id + '</span><span class="linha-curto">' + esc(s.curto) + "</span>" +
            '<code class="linha-cod">' + esc(umaLinha(p.codigo)) + '</code><span class="linha-faz">' + esc(p.resumo) + "</span></li>"
          );
        })
        .join("");
      return (
        '<div class="ficha ficha-linha"><span class="ficha-tag tag-certa">A linha montada</span>' +
        '<ol class="linha-resumo">' + itens + "</ol></div>"
      );
    }
    var p = f.peca;
    var rotulo = f.tipo === "certa" ? "Peça certa, encaixe " + f.slot.id : f.tipo === "alternativa" ? "Alternativa que não serviu aqui" : "Peça armadilha";
    return (
      '<div class="ficha ficha-' + f.tipo + '"><div class="ficha-topo"><span class="ficha-ilu">' + MQ.svg(p.maq) + "</span>" +
      '<div><span class="ficha-tag tag-' + f.tipo + '">' + rotulo + '</span><h3 class="ficha-titulo">' + esc(p.flash.titulo) + "</h3></div></div>" +
      '<p class="ficha-texto">' + md(p.flash.texto) + "</p>" +
      '<pre class="ficha-codigo">' + esc(p.flash.codigo) + "</pre></div>"
    );
  }

  function concluirEstacao() {
    var est = estacao();
    tutFim();
    var estrelas = estrelasDaEstacao();
    S.resultados[S.est] = { estrelas: estrelas, falhas: S.falhasEst, dicas: S.dicasEst };
    atualizarCabecalho();
    var ultima = S.est === N - 1;
    var fichas = fichasDaEstacao();
    var msg =
      estrelas === 3
        ? "Linha montada sem tropeços."
        : estrelas === 2
          ? "Linha montada, com alguns ajustes pelo caminho."
          : "Linha montada. Releia as fichas e tente errar menos na próxima.";
    var indice = 0;
    abrirModal({
      classe: "modal-ok",
      html:
        '<h2 class="modal-titulo" id="modal-titulo">Estação ' + (S.est + 1) + " pronta: " + esc(est.nome) + "</h2>" +
        '<div class="ok-topo">' + htmlEstrelas(estrelas, true) +
        '<p class="placar">' + msg + " Esteiras que falharam: " + S.falhasEst + ". Dicas usadas: " + S.dicasEst + ".</p></div>" +
        '<div class="fichas"><div class="ficha-area" id="ficha-area" aria-live="polite"></div>' +
        '<div class="ficha-nav"><button type="button" class="botao botao-mini" id="ficha-ant" aria-label="Ficha anterior">' + MQ.icone("esquerda") + "</button>" +
        '<span class="ficha-conta" id="ficha-conta"></span>' +
        '<button type="button" class="botao botao-mini" id="ficha-prox" aria-label="Próxima ficha">' + MQ.icone("direita") + "</button></div></div>",
      botoes: [
        {
          rotulo: ultima ? "Ver resultado final" : "Próxima estação",
          primario: true,
          aoClicar: function () {
            fecharModal(true);
            if (ultima) mostrarFim();
            else iniciarEstacao(S.est + 1);
          }
        }
      ]
    });
    function mostrar(i) {
      indice = Math.max(0, Math.min(fichas.length - 1, i));
      $("#ficha-area").innerHTML = fichaHtml(fichas[indice]);
      $("#ficha-conta").textContent = "Ficha " + (indice + 1) + " de " + fichas.length;
      $("#ficha-ant").disabled = indice === 0;
      $("#ficha-prox").disabled = indice === fichas.length - 1;
    }
    $("#ficha-ant").addEventListener("click", function () { mostrar(indice - 1); });
    $("#ficha-prox").addEventListener("click", function () { mostrar(indice + 1); });
    mostrar(0);
    limparCorrida();
    S.concluindo = false;
    atualizarMontagem();
    $$(".encaixe").forEach(function (e) {
      e.classList.add("concluido");
    });
  }

  /* ------------------------------------------------------------ tela final */

  function mostrarFim() {
    var total = 0;
    S.resultados.forEach(function (r) {
      total += r.estrelas;
    });
    var feitas = S.resultados.filter(Boolean).length;
    var media = total / N;
    var grandes = media >= 2.5 ? 3 : media >= 1.75 ? 2 : 1;
    var linhas = D.estacoes
      .map(function (est, i) {
        var r = S.resultados[i] || { estrelas: 0, falhas: 0, dicas: 0 };
        var mini = "";
        for (var k = 1; k <= 3; k++) mini += '<span class="' + (k <= r.estrelas ? "cheia" : "") + '">' + MQ.icone("estrela") + "</span>";
        return (
          "<tr><td>" + (i + 1) + ". " + esc(est.nome) + '</td><td><span class="mini-estrelas" role="img" aria-label="' + r.estrelas + ' de 3">' + mini +
          "</span></td><td>" + r.falhas + "</td><td>" + r.dicas + "</td></tr>"
        );
      })
      .join("");
    $("#fim-resumo").innerHTML =
      '<h1 class="fim-titulo">Fábrica funcionando</h1>' +
      '<div class="fim-total">' + htmlEstrelas(grandes, true) +
      "<p><strong>" + total + " de " + N * 3 + " estrelas.</strong> " +
      (feitas === N
        ? "As seis linhas de produção do TaskInput estão montadas e aprovadas."
        : "Estações concluídas: " + feitas + " de " + N + ".") +
      "</p></div>" +
      '<table class="fim-tabela"><thead><tr><th>Estação</th><th>Estrelas</th><th>Esteiras que falharam</th><th>Dicas</th></tr></thead><tbody>' + linhas + "</tbody></table>" +
      '<div class="fim-botoes">' +
      '<button type="button" class="botao botao-primario" id="btn-imprimir">' + MQ.icone("imprimir") + "<span>Imprimir a cola de revisão</span></button>" +
      '<button type="button" class="botao" id="btn-de-novo">' + MQ.icone("reiniciar") + "<span>Jogar de novo</span></button>" +
      '<button type="button" class="botao botao-discreto" id="btn-guia-fim">Guia do professor</button></div>';
    $("#cola").innerHTML = htmlCola();
    mostrarTela("fim");
    $("#btn-imprimir").addEventListener("click", function () {
      window.print();
    });
    $("#btn-de-novo").addEventListener("click", reiniciar);
    $("#btn-guia-fim").addEventListener("click", abrirGuia);
    $("#btn-imprimir").focus();
  }

  function htmlCola() {
    var h =
      '<h2 class="cola-titulo">Cola de revisão: o que cada código faz</h2>' +
      '<p class="cola-sub">Fábrica do TaskInput. Em cada estação, a linha certa e as peças que enganam.</p><div class="cola-grade">';
    D.estacoes.forEach(function (est, i) {
      h += '<div class="cola-estacao"><h3>' + (i + 1) + ". " + esc(est.nome) + "</h3><ol class=\"cola-linha\">";
      est.slots.forEach(function (s) {
        var p = MO.peca(est, s.certo);
        h +=
          '<li><span class="cola-slot">' + s.id + '</span><span class="cola-corpo"><code>' + esc(umaLinha(p.codigo)) + "</code><span>" + esc(p.resumo) + "</span></span></li>";
      });
      h += "</ol>";
      est.pecas.forEach(function (p) {
        if (p.tipo === "certa") return;
        h += '<p class="cola-cuidado"><strong>' + (p.tipo === "alternativa" ? "Quase serve:" : "Cuidado:") + "</strong> <code>" + esc(umaLinha(p.codigo)) + "</code> " + esc(p.resumo) + "</p>";
      });
      h += "</div>";
    });
    return h + "</div>";
  }

  /* ------------------------------------------------------------ guia do professor */

  function abrirGuia() {
    if (modalAtual && modalAtual.op.guia) {
      fecharModal();
      return;
    }
    var g = D.guia;
    var jogando = S.fase === "jogo";
    var gab = D.estacoes
      .map(function (est, i) {
        var linhas = est.slots
          .map(function (s) {
            var p = MO.peca(est, s.certo);
            return '<div class="guia-par"><span class="guia-slot"><b>' + s.id + "</b> " + esc(s.curto) + "</span><code>" + esc(umaLinha(p.codigo)) + "</code><span>" + esc(s.papel) + "</span></div>";
          })
          .join("");
        est.pecas.forEach(function (p) {
          if (p.tipo === "certa") return;
          linhas +=
            '<div class="guia-par isca"><span class="guia-slot">' + (p.tipo === "alternativa" ? "Alternativa" : "Armadilha") + "</span><code>" + esc(umaLinha(p.codigo)) + "</code><span>" + esc(p.resumo) + "</span></div>";
        });
        return (
          '<div class="guia-estacao"><h4><span>' + (i + 1) + ". " + esc(est.nome) + "</span>" +
          (jogando ? '<button type="button" class="botao botao-mini" data-ir="' + i + '">Ir para esta estação</button>' : "") +
          "</h4>" + linhas + "</div>"
        );
      })
      .join("");
    var lista = function (arr, tag) {
      return "<" + tag + ">" + arr.map(function (t) { return "<li>" + md(t) + "</li>"; }).join("") + "</" + tag + ">";
    };
    abrirModal({
      classe: "modal-largo",
      guia: true,
      html:
        '<h2 class="modal-titulo" id="modal-titulo">Guia do professor</h2><div class="guia">' +
        "<h3>Objetivo</h3><p>" + md(g.objetivo) + "</p>" +
        "<h3>Como conduzir</h3>" + lista(g.comoUsar, "ul") +
        '<h3>Gabarito</h3><div class="guia-tabela">' + gab + "</div>" +
        "<h3>Pontos de atenção</h3>" + lista(g.atencao, "ul") +
        "<h3>Perguntas para discutir</h3>" + lista(g.perguntas, "ol") +
        "</div>",
      botoes: [{ rotulo: "Fechar", primario: true, aoClicar: function () { fecharModal(); } }]
    });
  }

  /* ------------------------------------------------------------ tutorial */

  var TUT = { ativo: false, passo: 0 };
  var PASSOS_TUT = [
    {
      texto: "Bem-vindo à fábrica! O texto digitado vira um bilhete que viaja por uma esteira. Cada código é uma máquina: você monta a linha e liga a esteira.",
      botao: "Próximo",
      permite: []
    },
    {
      texto: "Pegue <code>useState('')</code> na bandeja e solte no encaixe B, o do meio. Também vale clicar na peça e depois no encaixe.",
      alvos: function () { return [elPeca("state"), elVao("B")]; },
      espera: "colocou",
      permite: []
    },
    {
      texto: "Travou? O botão Dica mostra uma pista sobre o próximo encaixe vazio. No tutorial ela não custa nada. Clique em Dica.",
      alvos: function () { return [$("#btn-dica")]; },
      espera: "dica",
      permite: ["dica"]
    },
    {
      texto: function () {
        return "A pista fala do encaixe " + (S.dicaTut ? S.dicaTut.slot : "A") + ": " + (S.dicaTut ? S.dicaTut.texto : "") + " Um segundo clique em Dica entrega mais detalhes.";
      },
      botao: "Próximo",
      permite: ["dica", "desfazer", "devolver"]
    },
    {
      texto: "Complete os encaixes que faltam com as peças que combinam. Errou? Desfazer volta um passo, sem custo.",
      alvos: function () { return [$("#btn-desfazer")]; },
      espera: "cheio",
      permite: ["dica", "desfazer", "devolver"]
    },
    {
      texto: "Tudo no lugar. Aperte Ligar a esteira e acompanhe o bilhete.",
      alvos: function () { return [$("#btn-ligar")]; },
      espera: "ligou",
      permite: ["ligar", "dica", "desfazer", "devolver"]
    },
    {
      texto: "O bilhete passa por cada máquina e o celular reage. Se uma máquina falhar, uma janela mostra qual e por quê. O botão Passo a passo avança uma máquina por vez.",
      botao: "Entendi",
      permite: ["ligar", "dica", "desfazer", "devolver"]
    }
  ];

  function tutAtivo() {
    return TUT.ativo;
  }

  function tutIniciar() {
    TUT.ativo = true;
    TUT.passo = 0;
    S.dicaTut = null;
    tutMostrar();
  }

  function tutLimparDestaques() {
    $$(".destaque-tut").forEach(function (e) {
      e.classList.remove("destaque-tut");
    });
  }

  function tutMostrar() {
    var p = PASSOS_TUT[TUT.passo];
    tutLimparDestaques();
    var texto = typeof p.texto === "function" ? md(p.texto()) : p.texto;
    definirFaixa(
      "tutorial",
      '<span class="faixa-selo">Tutorial ' + (TUT.passo + 1) + " de " + PASSOS_TUT.length + "</span>" +
      '<span class="faixa-texto">' + texto + "</span>" +
      '<span class="faixa-acoes">' +
      (p.botao ? '<button type="button" class="botao botao-primario botao-mini" id="tut-prox">' + p.botao + "</button>" : "") +
      '<button type="button" class="botao-link" id="tut-pular">Pular tutorial</button></span>'
    );
    $("#tut-pular").addEventListener("click", tutFim);
    if (p.botao) {
      $("#tut-prox").addEventListener("click", tutAvancar);
    }
    (p.alvos ? p.alvos() : []).forEach(function (a) {
      if (a) a.classList.add("destaque-tut");
    });
    anunciar("Tutorial, passo " + (TUT.passo + 1) + ". " + String(texto).replace(/<[^>]+>/g, ""));
  }

  function tutAvancar() {
    TUT.passo++;
    if (TUT.passo >= PASSOS_TUT.length) tutFim();
    else tutMostrar();
  }

  function tutFim() {
    if (!TUT.ativo) return;
    TUT.ativo = false;
    tutLimparDestaques();
    if (S.fase === "jogo") definirFaixa("ocioso");
  }

  function tutEvento(nome, info) {
    if (!TUT.ativo) return;
    var p = PASSOS_TUT[TUT.passo];
    if (!p || p.espera !== nome) return;
    if (nome === "colocou" && !(info && info.slot === "B" && info.peca === "state")) return;
    tutAvancar();
  }

  function tutPasso() {
    return TUT.ativo ? PASSOS_TUT[TUT.passo] : null;
  }

  function tutorialBloqueiaSelecao(pecaId) {
    var p = tutPasso();
    if (!p) return false;
    if (TUT.passo === 1 && pecaId === "state") return false;
    if (TUT.passo >= 4) return false;
    aviso(TUT.passo === 1 ? "No tutorial, use a peça destacada." : "Siga o passo do tutorial ou toque em Pular tutorial.");
    return true;
  }

  function tutorialBloqueiaColocar(slotId, pecaId) {
    var p = tutPasso();
    if (!p) return false;
    if (TUT.passo === 1 && slotId === "B" && pecaId === "state") return false;
    if (TUT.passo >= 4) return false;
    aviso(TUT.passo === 1 ? "No tutorial, solte a peça destacada no encaixe destacado." : "Siga o passo do tutorial ou toque em Pular tutorial.");
    return true;
  }

  function tutorialBloqueiaAcao(qual) {
    var p = tutPasso();
    if (!p) return false;
    if (p.permite.indexOf(qual) >= 0) return false;
    aviso("Siga o passo do tutorial ou toque em Pular tutorial.");
    return true;
  }

  /* ------------------------------------------------------------ teclado */

  function aoTeclaGlobal(e) {
    var alvo = e.target;
    var digitando = alvo && (alvo.tagName === "INPUT" || alvo.tagName === "TEXTAREA" || alvo.isContentEditable);
    if (e.key === "Escape") {
      if (modalAtual) {
        e.preventDefault();
        if (modalAtual.op.guia) fecharModal();
        else if (modalAtual.op.classe && modalAtual.op.classe.indexOf("modal-erro") >= 0) fecharErro();
        return;
      }
      if (S.selecionada) {
        S.selecionada = null;
        atualizarMontagem();
        anunciar("Seleção cancelada.");
      }
      return;
    }
    if (e.ctrlKey || e.metaKey || e.altKey || digitando) return;
    var k = e.key.toLowerCase();
    if (k === "g") {
      e.preventDefault();
      abrirGuia();
      return;
    }
    if (modalAtual || S.fase !== "jogo") return;
    if (k === "h") {
      e.preventDefault();
      pedirDica();
    } else if (k === "z") {
      e.preventDefault();
      desfazer();
    }
  }

  /* ------------------------------------------------------------ início */

  function logo() {
    return (
      '<svg viewBox="0 0 32 32" aria-hidden="true" focusable="false"><rect x="2" y="2" width="28" height="28" rx="6" fill="#f5c400" stroke="#26292e" stroke-width="2.5"/>' +
      '<path d="M7 22 H25" stroke="#26292e" stroke-width="3" stroke-linecap="round"/><rect x="8" y="11" width="7" height="7" rx="1.5" fill="#26292e"/>' +
      '<rect x="17" y="8" width="7" height="10" rx="1.5" fill="#26292e"/></svg>'
    );
  }

  function heroHtml() {
    var itens = ["teclado", "funil-troca", "caixa-memoria", "janela-leitura", "celular-mini"]
      .map(function (n) {
        return '<div class="hero-item">' + MQ.svg(n) + "</div>";
      })
      .join("");
    return (
      '<div class="hero"><div class="hero-itens">' + itens + "</div>" +
      '<div class="hero-trilho"><div class="hero-rolos"></div></div>' +
      '<div class="hero-bilhete"><span>texto</span><b>Comprar pão</b></div></div>'
    );
  }

  function reposicionarPacote() {
    var p = $("#pacote");
    if (!p || p.hidden || !S.rodando || !S.corrida) return;
    var ex = execucaoAtual();
    var passo = ex && S.iPasso >= 0 ? ex.passos[S.iPasso] : null;
    colocarPacote(elementoDoNo(passo ? passo.no : "origem"), false);
  }

  function iniciar() {
    preparaOrdens();
    $("#marca-topo").innerHTML = logo();
    $("#ilu-inicio").innerHTML = heroHtml();

    $("#form-inicio").addEventListener("submit", comecar);
    $("#btn-dica").addEventListener("click", pedirDica);
    $("#btn-desfazer").addEventListener("click", desfazer);
    $("#btn-guia").addEventListener("click", abrirGuia);
    $("#btn-ligar").addEventListener("click", function () {
      ligar("auto");
    });
    $("#btn-passo").addEventListener("click", function () {
      if (S.rodando && S.modo === "passo") proximo();
      else ligar("passo");
    });
    $("#btn-parar").addEventListener("click", parar);
    $("#velocidade").addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b) return;
      S.velocidade = b.dataset.vel;
      atualizarControles();
    });

    var linha = $("#linha");
    linha.addEventListener("pointerdown", aoPressionar);
    linha.addEventListener("click", aoClicar);
    linha.addEventListener("keydown", aoTeclaMontagem);
    linha.addEventListener("dragstart", function (e) {
      e.preventDefault();
    });
    window.addEventListener("pointermove", aoMover);
    window.addEventListener("pointerup", aoSoltar);
    window.addEventListener("pointercancel", aoCancelar);
    document.addEventListener("keydown", aoTeclaGlobal);
    document.addEventListener("keydown", prenderFoco);
    $("#camada-modal").addEventListener("click", function (e) {
      var ir = e.target.closest ? e.target.closest("[data-ir]") : null;
      if (ir) {
        var i = parseInt(ir.getAttribute("data-ir"), 10);
        fecharModal(true);
        tutFim();
        iniciarEstacao(i);
      }
    });

    window.addEventListener("resize", reposicionarPacote);
    if (window.ResizeObserver) new ResizeObserver(reposicionarPacote).observe($("#esteira"));

    mostrarTela("inicio");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
  else iniciar();
})();
