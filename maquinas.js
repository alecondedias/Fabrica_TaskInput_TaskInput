/*
 * Ilustrações da Fábrica do TaskInput.
 *
 * Cada máquina é um desenho SVG em um quadro de 120 por 90. O estilo é um
 * só: contorno escuro, cores chapadas, paleta de chão de fábrica.
 *
 * Peças que se mexem recebem uma classe "mv-*". A folha de estilos anima essas
 * classes só quando o encaixe está ativo (ou em destaque).
 *
 * Uso:
 *   Maquinas.svg("tesoura")      devolve o SVG como texto
 *   Maquinas.icone("play")       devolve um ícone de interface (24 por 24)
 */
(function () {
  "use strict";

  var C = {
    ink: "#26292e",
    steel: "#4b525a",
    steelM: "#79818a",
    steelL: "#bcc3c9",
    conc: "#e4dfd3",
    concD: "#a39c8c",
    yel: "#f5c400",
    yelD: "#c99a00",
    teal: "#0f8b8d",
    tealL: "#c4ebe8",
    tealD: "#0b4a4d",
    red: "#d7263d",
    redL: "#f6c6cc",
    green: "#2f9e44",
    greenL: "#cdeed3",
    paper: "#fff3c2",
    white: "#ffffff",
    wood: "#d9a35a",
    woodL: "#ecc48a",
    skin: "#f0b48a",
    gray: "#8d949b"
  };

  var FONTE = "Consolas, Menlo, 'Courier New', monospace";

  function R(x, y, w, h, f, rx, ex) {
    if (typeof rx === "string") {
      ex = rx;
      rx = 0;
    }
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + (rx || 0) + '" fill="' + f + '"' + (ex ? " " + ex : "") + "/>";
  }
  function E(cx, cy, rx, ry, f, ex) {
    return '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" fill="' + f + '"' + (ex ? " " + ex : "") + "/>";
  }
  function O(cx, cy, r, f, ex) {
    return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + f + '"' + (ex ? " " + ex : "") + "/>";
  }
  function P(d, f, ex) {
    return '<path d="' + d + '" fill="' + f + '"' + (ex ? " " + ex : "") + "/>";
  }
  function G(pontos, f, ex) {
    return '<polygon points="' + pontos + '" fill="' + f + '"' + (ex ? " " + ex : "") + "/>";
  }
  function L(x1, y1, x2, y2, ex) {
    return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '"' + (ex ? " " + ex : "") + "/>";
  }
  function T(x, y, s, tam, f, ex) {
    return '<text x="' + x + '" y="' + y + '" font-size="' + tam + '" fill="' + f + '" stroke="none" text-anchor="middle" font-family="' + FONTE + '" font-weight="700"' + (ex ? " " + ex : "") + ">" + s + "</text>";
  }
  function grupo(cls, conteudo, ex) {
    return '<g class="' + cls + '"' + (ex ? " " + ex : "") + ">" + conteudo + "</g>";
  }

  /* Celular pequeno, usado em várias ilustrações. */
  function celular(x, y, escala, interno) {
    return '<g transform="translate(' + x + " " + y + ") scale(" + escala + ')">' +
      R(0, 0, 52, 82, C.ink, 10) +
      R(5, 8, 42, 62, C.tealL, 3, 'stroke-width="1.5"') +
      (interno || "") +
      O(26, 76, 2.5, C.white, 'stroke="none"') +
      "</g>";
  }

  /* Megafone: o corpo muda de cor conforme o aviso. */
  function megafone(cor, ondas, extra) {
    return grupo("mv-pulsa",
      G("22,34 22,56 38,56 80,76 80,14 38,34", cor) +
      R(28, 56, 11, 16, C.ink, 3, 'stroke-width="1.5"') +
      R(80, 12, 6, 66, C.steel, 2)) +
      grupo("mv-onda", ondas) + (extra || "");
  }

  /* Porta de prédio, para export e import. */
  function predio(x, corPorta) {
    var janelas = "";
    for (var i = 0; i < 2; i++) {
      for (var j = 0; j < 3; j++) {
        janelas += R(x + 7 + j * 14, 24 + i * 13, 9, 8, C.tealL, 1, 'stroke-width="1.2"');
      }
    }
    return R(x, 16, 50, 62, C.conc, 3) + janelas + R(x + 15, 50, 20, 28, corPorta, 3);
  }

  var DESENHOS = {
    /* ----- origens e destinos ----- */
    teclado: function () {
      var teclas = "";
      for (var i = 0; i < 3; i++) {
        for (var j = 0; j < 10; j++) {
          var dest = i === 1 && j === 4;
          teclas += R(14 + j * 9.4, 36 + i * 10.6, 7.6, 8, dest ? C.yel : C.conc, 1.5, 'stroke-width="1"' + (dest ? ' class="mv-tecla"' : ""));
        }
      }
      return R(8, 28, 104, 50, C.steel, 7) + teclas + R(32, 69, 56, 6, C.conc, 2, 'stroke-width="1"');
    },

    dedo: function () {
      return grupo("mv-toca",
        P("M40,2 H80 Q86,2 86,8 V30 Q86,36 80,36 H70 V56 Q70,66 60,66 Q50,66 50,56 V36 H40 Q34,36 34,30 V8 Q34,2 40,2 Z", C.skin) +
        L(70, 14, 86, 14, 'stroke-width="1.5"') + L(70, 24, 86, 24, 'stroke-width="1.5"') +
        E(60, 58, 5, 3, "#fbe2cc", 'stroke-width="1"')) +
        grupo("mv-onda", O(60, 71, 6, "none", 'stroke="' + C.teal + '" stroke-width="2.5"') + O(60, 71, 12, "none", 'stroke="' + C.teal + '" stroke-width="2" opacity=".6"'));
    },

    componente: function () {
      return R(20, 22, 80, 54, C.wood, 3) +
        L(20, 40, 100, 40, 'stroke-width="1.5"') + L(20, 58, 100, 58, 'stroke-width="1.5"') +
        R(20, 22, 10, 54, C.yel, 0, 'stroke-width="1.5"') + R(90, 22, 10, 54, C.yel, 0, 'stroke-width="1.5"') +
        R(34, 44, 52, 17, C.white, 2, 'stroke-width="1.5"') + T(60, 56, "TaskInput", 9.5, C.ink);
    },

    campo: function () {
      return R(8, 26, 104, 36, C.white, 9, 'stroke="' + C.teal + '" stroke-width="3"') +
        P("M20,34 V54", "none", 'stroke="' + C.teal + '" stroke-width="2.5" class="mv-pisca"') +
        T(70, 49, "Digite...", 10, C.gray, 'font-weight="400" font-style="italic"');
    },

    botao: function () {
      return grupo("mv-pulsa", R(12, 26, 96, 38, C.teal, 12) + T(60, 50, "+ Adicionar", 10, C.white));
    },

    "celular-mini": function () {
      return celular(34, 4, 1,
        R(4, 9, 34, 9, C.white, 3, 'stroke-width="1.2"') +
        R(4, 24, 34, 9, C.teal, 3, 'stroke-width="1.2"') +
        L(6, 42, 36, 42, 'stroke-width="1.2" opacity=".5"') +
        L(6, 48, 28, 48, 'stroke-width="1.2" opacity=".5"'));
    },

    /* ----- estação 1: a caixinha de memória ----- */
    "funil-troca": function () {
      return R(30, 2, 34, 12, C.paper, 2, 'stroke-width="1.5"') + L(36, 8, 58, 8, 'stroke-width="1.2" opacity=".5"') +
        P("M18,18 H76 L58,46 V68 H36 V46 Z", C.steelL) +
        grupo("mv-gira", P("M100,36 A16,16 0 1 0 98,66", "none", 'stroke="' + C.teal + '" stroke-width="5"') +
          G("92,30 110,36 94,46", C.teal, 'stroke-width="1.5"'), 'style="transform-origin:90px 52px"');
    },

    "caixa-memoria": function () {
      return R(44, 10, 32, 22, C.paper, 2, 'stroke-width="1.5"') + L(50, 18, 70, 18, 'stroke-width="1.2" opacity=".5"') +
        grupo("mv-pulsa",
          R(20, 38, 80, 38, C.wood, 3) +
          P("M20,38 L32,24 H88 L100,38 Z", C.woodL) +
          R(38, 48, 44, 20, C.white, 2, 'stroke-width="1.5"') + T(60, 63, "''", 15, C.ink));
    },

    "janela-leitura": function () {
      return R(14, 14, 84, 56, C.tealD, 6) + R(20, 20, 72, 44, C.tealL, 3, 'stroke-width="1.5"') +
        R(26, 28, 44, 5, C.teal, 2, 'stroke="none"') + R(26, 38, 56, 5, C.teal, 2, 'stroke="none"') + R(26, 48, 34, 5, C.teal, 2, 'stroke="none"') +
        grupo("mv-lupa", O(88, 56, 15, "rgba(255,255,255,.55)", 'stroke-width="3.5"') + L(99, 67, 110, 80, 'stroke-width="6"'));
    },

    "caixa-sem-fundo": function () {
      return P("M22,24 V58 M98,24 V58", "none", 'stroke-width="4"') +
        P("M22,24 H98", "none", 'stroke-width="4"') +
        R(22, 24, 76, 34, C.wood, 0, 'opacity=".35" stroke="none"') +
        L(22, 58, 98, 58, 'stroke="' + C.red + '" stroke-width="3" stroke-dasharray="6 5"') +
        grupo("mv-cai", R(36, 64, 14, 7, C.paper, 1, 'stroke-width="1.5"') + R(62, 70, 18, 7, C.paper, 1, 'stroke-width="1.5"') + R(48, 78, 10, 6, C.paper, 1, 'stroke-width="1.5" opacity=".7"')) +
        T(60, 46, "''", 14, C.ink);
    },

    /* ----- estação 2: os dois fios ----- */
    "fio-escrita": function () {
      return R(4, 30, 36, 28, C.white, 6) + T(22, 48, "campo", 7.5, C.ink) +
        R(80, 30, 36, 28, C.tealL, 6) + T(98, 48, "estado", 7.5, C.ink) +
        grupo("mv-fluxo", L(40, 44, 70, 44, 'stroke="' + C.yelD + '" stroke-width="9"') + L(40, 44, 70, 44, 'stroke="' + C.yel + '" stroke-width="5"') +
          G("68,34 82,44 68,54", C.yel, 'stroke-width="2"'));
    },

    "fio-leitura": function () {
      return R(4, 30, 36, 28, C.white, 6) + T(22, 48, "campo", 7.5, C.ink) +
        R(80, 30, 36, 28, C.tealL, 6) + T(98, 48, "estado", 7.5, C.ink) +
        grupo("mv-fluxo", L(50, 44, 80, 44, 'stroke="' + C.tealD + '" stroke-width="9"') + L(50, 44, 80, 44, 'stroke="' + C.teal + '" stroke-width="5"') +
          G("52,34 38,44 52,54", C.teal, 'stroke-width="2"'));
    },

    "placa-cinza": function () {
      return R(55, 46, 10, 34, C.steelM, 2) +
        R(10, 12, 100, 38, "#eceff1", 5) +
        T(60, 36, "Digite...", 14, C.gray, 'font-weight="400" font-style="italic"') +
        P("M18,20 V42", "none", 'stroke="' + C.gray + '" stroke-width="2" opacity=".7" class="mv-pisca"');
    },

    "etiqueta-inicial": function () {
      return R(34, 52, 52, 26, C.wood, 3) + L(34, 62, 86, 62, 'stroke-width="1.5"') +
        grupo("mv-balanca",
          G("30,10 84,10 98,26 84,42 30,42", C.paper) + O(40, 26, 3.5, C.white, 'stroke-width="1.5"') +
          T(66, 30, "1ª vez", 11, C.ink) +
          P("M40,26 C30,30 28,44 40,54", "none", 'stroke-width="1.5"'), 'style="transform-origin:40px 26px"');
    },

    /* ----- estação 3: o botão ----- */
    "area-tocavel": function () {
      return grupo("mv-esmaece", R(12, 22, 96, 38, C.teal, 13) + T(46, 46, "Adicionar", 10.5, C.white)) +
        grupo("mv-onda", O(92, 42, 6, "none", 'stroke="' + C.white + '" stroke-width="2.5"') + O(92, 42, 13, "none", 'stroke="' + C.white + '" stroke-width="2" opacity=".6"')) +
        R(12, 70, 96, 6, "rgba(15,139,141,.35)", 3, 'stroke="none"');
    },

    gatilho: function () {
      return R(24, 58, 72, 18, C.steel, 4) +
        grupo("mv-aperta", R(40, 36, 40, 24, C.red, 6) + E(60, 36, 20, 7, C.redL)) +
        L(96, 44, 106, 44, 'stroke-width="2"') +
        R(98, 24, 18, 20, C.paper, 2, 'stroke-width="1.5"') + T(107, 38, "f", 13, C.ink, 'font-style="italic"');
    },

    "area-pressable": function () {
      return R(12, 22, 96, 38, "#c9ced3", 13, 'stroke-dasharray="6 4"') + T(46, 46, "Adicionar", 10.5, C.steel) +
        grupo("mv-onda", O(92, 42, 6, "none", 'stroke="' + C.steel + '" stroke-width="2.5"') + O(92, 42, 13, "none", 'stroke="' + C.steel + '" stroke-width="2" opacity=".6"')) +
        T(60, 78, "sem estilo", 9, C.gray, 'font-weight="400"');
    },

    "gatilho-chamado": function () {
      return R(24, 58, 72, 18, C.steel, 4) +
        R(40, 44, 40, 16, C.red, 6) + E(60, 44, 20, 6, C.redL) +
        grupo("mv-faisca", G("100,6 90,24 98,24 90,40 108,18 100,18 108,6", C.yel, 'stroke-width="1.8"') +
          G("12,8 18,22 12,22 20,36 8,18 14,18", C.yel, 'stroke-width="1.8"')) +
        R(88, 50, 28, 18, C.redL, 3, 'stroke-width="1.5"') + T(102, 63, "()", 13, C.red);
    },

    /* ----- estação 4: os alertas ----- */
    "megafone-erro": function () {
      return megafone(C.red,
        P("M90,30 Q100,45 90,60", "none", 'stroke="' + C.red + '" stroke-width="4"') +
        P("M99,22 Q114,45 99,68", "none", 'stroke="' + C.red + '" stroke-width="4" opacity=".6"'),
        O(34, 20, 10, C.yel, 'stroke-width="2"') + T(34, 25, "!", 14, C.ink));
    },

    "megafone-ok": function () {
      return megafone(C.teal,
        P("M90,30 Q100,45 90,60", "none", 'stroke="' + C.teal + '" stroke-width="4"') +
        P("M99,22 Q114,45 99,68", "none", 'stroke="' + C.teal + '" stroke-width="4" opacity=".6"'),
        O(34, 20, 10, C.green, 'stroke-width="2"') + P("M28,20 L33,25 L41,15", "none", 'stroke="' + C.white + '" stroke-width="3"'));
    },

    "botao-ok": function () {
      return R(14, 10, 92, 66, C.white, 8) +
        R(24, 20, 50, 6, C.steelL, 2, 'stroke="none"') + R(24, 32, 72, 5, C.steelL, 2, 'stroke="none"') +
        grupo("mv-pulsa", R(34, 50, 52, 18, C.teal, 9, 'stroke="' + C.yel + '" stroke-width="3"') + T(60, 63, "OK", 11, C.white));
    },

    "megafone-mudo": function () {
      return G("22,34 22,56 38,56 80,76 80,14 38,34", "#c9ced3") +
        R(28, 56, 11, 16, C.steelM, 3, 'stroke-width="1.5"') + R(80, 12, 6, 66, C.steelM, 2) +
        P("M92,32 Q100,45 92,58", "none", 'stroke="' + C.gray + '" stroke-width="3" stroke-dasharray="3 4"') +
        L(14, 10, 106, 80, 'stroke="' + C.red + '" stroke-width="5"') +
        R(84, 4, 30, 15, C.yel, 3, 'stroke-width="1.5"') + T(99, 15, "web", 10, C.ink);
    },

    /* ----- estação 5: o porteiro ----- */
    tesoura: function () {
      return R(30, 50, 60, 16, C.paper, 2, 'stroke-width="1.5"') +
        R(6, 56, 20, 14, C.paper, 2, 'stroke-width="1.5" opacity=".75" transform="rotate(-8 16 63)"') +
        R(94, 56, 20, 14, C.paper, 2, 'stroke-width="1.5" opacity=".75" transform="rotate(8 104 63)"') +
        grupo("mv-corta",
          P("M60,34 L40,56 L46,60 L60,40 Z", C.steelL) + P("M60,34 L80,56 L74,60 L60,40 Z", C.steelM) +
          O(52, 16, 7, "none", 'stroke-width="3.5"') + O(68, 16, 7, "none", 'stroke-width="3.5"') +
          L(54, 22, 62, 36, 'stroke-width="3.5"') + L(66, 22, 58, 36, 'stroke-width="3.5"'), 'style="transform-origin:60px 36px"');
    },

    "cancela-pergunta": function () {
      var braco = "";
      for (var i = 0; i < 6; i++) {
        braco += R(30 + i * 13, 44, 13, 9, i % 2 ? C.ink : C.yel, 0, 'stroke-width="1.2"');
      }
      return R(14, 36, 16, 42, C.steel, 3) + O(22, 32, 5, C.red, 'stroke-width="1.5"') +
        grupo("mv-sobe", braco + R(30, 44, 78, 9, "none", 'stroke-width="2"'), 'style="transform-origin:30px 48px"') +
        O(92, 22, 13, C.white, 'stroke-width="2"') + T(92, 30, "?", 20, C.ink);
    },

    "placa-pare": function () {
      return R(56, 62, 8, 22, C.steelM, 2) +
        grupo("mv-pulsa", G("40,6 80,6 98,24 98,52 80,70 40,70 22,52 22,24", C.red, 'stroke-width="2.5"') +
          T(60, 46, "PARE", 17, C.white));
    },

    "carimbo-borracha": function () {
      return grupo("mv-carimba",
        R(48, 4, 24, 22, C.wood, 9) + R(32, 26, 56, 10, C.steelM, 3) + R(36, 36, 48, 6, C.ink, 2)) +
        R(16, 54, 88, 26, C.white, 5) +
        R(24, 62, 30, 4, C.steelL, 1, 'stroke="none" opacity=".7"') + R(24, 70, 20, 4, C.steelL, 1, 'stroke="none" opacity=".7"') +
        O(84, 67, 9, C.greenL, 'stroke="' + C.green + '" stroke-width="2.5"') + P("M79,67 L83,71 L90,62", "none", 'stroke="' + C.green + '" stroke-width="3"');
    },

    trituradora: function () {
      return R(36, 4, 48, 18, C.paper, 2, 'stroke-width="1.5"') + L(42, 12, 78, 12, 'stroke-width="1.2" opacity=".5"') +
        R(24, 26, 72, 34, C.red, 7) + R(32, 22, 56, 6, C.ink, 2) + O(84, 43, 4, C.yel, 'stroke-width="1.5"') +
        grupo("mv-cai",
          R(34, 62, 4, 16, C.paper, 1, 'stroke-width="1.2"') + R(44, 62, 4, 20, C.paper, 1, 'stroke-width="1.2"') +
          R(54, 62, 4, 14, C.paper, 1, 'stroke-width="1.2"') + R(64, 62, 4, 19, C.paper, 1, 'stroke-width="1.2"') +
          R(74, 62, 4, 15, C.paper, 1, 'stroke-width="1.2"'));
    },

    /* ----- estação 6: a montagem ----- */
    "etiqueta-fc": function () {
      var pinos = "";
      for (var i = 0; i < 4; i++) {
        pinos += R(30 + i * 16, 10, 6, 8, C.steelL, 1, 'stroke-width="1.2"') + R(30 + i * 16, 54, 6, 8, C.steelL, 1, 'stroke-width="1.2"');
      }
      return pinos + R(22, 16, 76, 42, C.steel, 6) + T(60, 42, "React.FC", 13, C.white) +
        R(32, 68, 56, 15, C.paper, 3, 'stroke-width="1.5"') + T(60, 79, "sem props", 9.5, C.ink, 'font-weight="400"');
    },

    "porta-saida": function () {
      return predio(6, C.green) + grupo("mv-seta", G("62,56 82,56 82,48 112,60 82,72 82,64 62,64", C.green, 'stroke-width="2"')) +
        R(12, 4, 38, 12, C.paper, 2, 'stroke-width="1.5"') + T(31, 13.5, "export", 9, C.ink);
    },

    "porta-entrada": function () {
      return predio(64, C.green) + grupo("mv-seta", G("58,56 38,56 38,48 8,60 38,72 38,64 58,64", C.green, 'stroke-width="2"')) +
        R(70, 4, 38, 12, C.paper, 2, 'stroke-width="1.5"') + T(89, 13.5, "import", 9, C.ink);
    },

    "na-tela": function () {
      return celular(34, 4, 1,
        grupo("mv-pulsa",
          R(4, 9, 34, 9, C.white, 3, 'stroke-width="1.2"') + L(7, 11, 7, 16, 'stroke="' + C.teal + '" stroke-width="1.5"') +
          R(4, 24, 34, 9, C.teal, 3, 'stroke-width="1.2"')) +
        L(6, 42, 36, 42, 'stroke-width="1.2" opacity=".5"')) +
        O(94, 22, 11, C.green, 'stroke-width="2"') + P("M88,22 L93,27 L101,17", "none", 'stroke="' + C.white + '" stroke-width="3"');
    },

    "porta-padrao": function () {
      return R(30, 10, 60, 68, "#c9ced3", 4) + R(36, 16, 48, 56, "none", 'stroke-width="1.5"') +
        R(54, 38, 12, 14, C.ink, 2) + O(60, 44, 3, C.yel, 'stroke="none"') +
        grupo("mv-balanca", O(100, 24, 8, C.yel, 'stroke-width="2"') + L(100, 32, 100, 52, 'stroke-width="4"') + L(100, 46, 108, 46, 'stroke-width="3"'), 'style="transform-origin:100px 24px"') +
        R(6, 4, 46, 13, C.red, 3, 'stroke-width="1.5"') + T(29, 14, "default", 10, C.white);
    },

    /* ----- pacote da estação 6 e ícone de arquivo ----- */
    caminhao: function () {
      return R(6, 16, 64, 44, C.wood, 3) + L(6, 34, 70, 34, 'stroke-width="1.5"') +
        R(14, 24, 48, 16, C.white, 2, 'stroke-width="1.5"') + T(38, 36, "TaskInput", 8.5, C.ink) +
        P("M70,28 H92 L110,44 V60 H70 Z", C.yel) + P("M76,33 H90 L102,44 H76 Z", C.tealL, 'stroke-width="1.5"') +
        O(26, 62, 9, C.ink, 'stroke-width="2"') + O(26, 62, 3, C.steelL, 'stroke="none"') +
        O(92, 62, 9, C.ink, 'stroke-width="2"') + O(92, 62, 3, C.steelL, 'stroke="none"');
    },

    arquivo: function () {
      return P("M30,6 H72 L92,26 V82 H30 Z", C.white) + P("M72,6 V26 H92", C.paper) +
        R(36, 38, 50, 5, C.steelL, 2, 'stroke="none"') + R(36, 48, 40, 5, C.steelL, 2, 'stroke="none"') +
        R(40, 60, 34, 16, C.teal, 3) + T(57, 72, "TSX", 10, C.white);
    }
  };

  var SOMBRA = '<ellipse cx="60" cy="84" rx="36" ry="3.5" fill="rgba(0,0,0,.12)" stroke="none"/>';
  var SEM_SOMBRA = { "celular-mini": 1, "na-tela": 1, "fio-escrita": 1, "fio-leitura": 1, "megafone-mudo": 1 };

  function svg(nome, ex) {
    var f = DESENHOS[nome];
    if (!f) {
      return "";
    }
    return '<svg class="maq maq-' + nome + (ex ? " " + ex : "") + '" viewBox="0 0 120 90" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">' +
      '<g fill="none" stroke="' + C.ink + '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round">' +
      (SEM_SOMBRA[nome] ? "" : SOMBRA) + f() + "</g></svg>";
  }

  /* Ícones de interface, 24 por 24, na cor do texto. */
  var ICONES = {
    play: '<polygon points="7,4 20,12 7,20" fill="currentColor"/>',
    passo: '<polygon points="5,5 15,12 5,19" fill="currentColor"/><rect x="17" y="5" width="3" height="14" fill="currentColor" stroke="none"/>',
    parar: '<rect x="6" y="6" width="12" height="12" rx="1.5" fill="currentColor"/>',
    desfazer: '<path d="M9 7 L4 12 L9 17" fill="none"/><path d="M4 12 H15 A5 5 0 0 1 15 22 H11" fill="none" transform="translate(0 -5)"/>',
    dica: '<path d="M9 18 H15 M10 21 H14" fill="none"/><path d="M12 3 A6 6 0 0 0 8 13.5 C9 14.5 9 15.5 9 16.5 H15 C15 15.5 15 14.5 16 13.5 A6 6 0 0 0 12 3 Z" fill="none"/>',
    guia: '<path d="M4 5 H11 A2 2 0 0 1 12 7 V20 A2 2 0 0 0 11 19 H4 Z M20 5 H13 A2 2 0 0 0 12 7 V20 A2 2 0 0 1 13 19 H20 Z" fill="none"/>',
    fechar: '<path d="M6 6 L18 18 M18 6 L6 18" fill="none"/>',
    estrela: '<polygon points="12,3 14.8,9 21,9.7 16.4,14 17.8,20.5 12,17.2 6.2,20.5 7.6,14 3,9.7 9.2,9" fill="currentColor"/>',
    cadeado: '<rect x="5" y="11" width="14" height="9" rx="2" fill="currentColor"/><path d="M8 11 V8 A4 4 0 0 1 16 8 V11" fill="none"/>',
    check: '<path d="M5 12.5 L10 17.5 L19 7" fill="none"/>',
    imprimir: '<rect x="6" y="3" width="12" height="6" fill="none"/><rect x="4" y="9" width="16" height="8" rx="2" fill="none"/><rect x="7" y="14" width="10" height="7" fill="none"/>',
    esquerda: '<path d="M15 5 L8 12 L15 19" fill="none"/>',
    direita: '<path d="M9 5 L16 12 L9 19" fill="none"/>',
    reiniciar: '<path d="M20 12 A8 8 0 1 1 17.7 6.3" fill="none"/><polygon points="20,3 20,9 14,9" fill="currentColor"/>'
  };

  function icone(nome) {
    var d = ICONES[nome];
    if (!d) {
      return "";
    }
    return '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + d + "</svg>";
  }

  window.Maquinas = {
    svg: svg,
    icone: icone,
    cores: C,
    nomes: Object.keys(DESENHOS)
  };
})();
