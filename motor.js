/*
 * Motor da esteira: simula o que acontece quando os pacotes de teste
 * passam pelas máquinas encaixadas.
 *
 * Entrada:  a estação (dados.js) e a montagem, um objeto { idDoEncaixe: idDaPeça }.
 * Saída:    uma execução por pacote, com a lista de passos que a tela anima.
 *
 * Cada passo: { no, tipo, legenda, celular, pacoteTexto }
 *   no       "origem", "destino" ou o id de um encaixe
 *   tipo     "ok" (a máquina agiu), "pula" (o pacote só passou), "info" (observação) ou "falha"
 *   celular  o estado completo do celular depois do passo
 *
 * A regra de sucesso é única: a esteira só fecha a estação quando todos os pacotes
 * (menos os de observação) passam. Nos testes, só a montagem do gabarito passa.
 */
(function (janela) {
  "use strict";

  function dados() {
    return janela.DADOS;
  }

  /* ------------------------------------------------------------ utilidades */

  /* código de várias linhas em uma linha só, sem espaços sobrando */
  function umaLinha(s) {
    return String(s)
      .replace(/\(\s*\n\s*/g, "(")
      .replace(/=\s*\n\s*(?=")/g, "=")
      .replace(/\s*\n\s*(?=\.)/g, "")
      .replace(/\s*\n\s*/g, " ");
  }
  function clone(o) {
    return JSON.parse(JSON.stringify(o));
  }
  function fmt(s, v) {
    return String(s).replace(/\{(\w+)\}/g, function (m, k) {
      return v && v[k] != null ? v[k] : m;
    });
  }
  /* espaços das pontas viram pontinhos, para dar para ver; os do meio ficam */
  function vis(t) {
    return String(t).replace(/^ +| +$/g, function (m) {
      return m.replace(/ /g, "\u00b7");
    });
  }
  function rotuloTexto(t) {
    return t === "" ? "(vazio)" : vis(t);
  }
  function pecaDe(est, id) {
    for (var i = 0; i < est.pecas.length; i++) {
      if (est.pecas[i].id === id) return est.pecas[i];
    }
    return null;
  }
  function textoDoSlot(mapa, evento, vars) {
    if (!mapa) return "";
    var s = mapa[evento];
    if (s == null) s = mapa.padrao;
    return s == null ? "" : fmt(s, vars);
  }

  var ERRO = { titulo: "Erro", msg: "Por favor, digite um nome para a tarefa", ok: true };

  function celularInicial(est) {
    var c = est.celular0 || {};
    return {
      texto: c.texto || "",
      refeitas: c.refeitas || 0,
      travado: false,
      placeholder: false,
      botao: "normal",
      alerta: null,
      erroTS: null,
      conteudo: c.conteudo || "input"
    };
  }

  /* Texto de um encaixe com a peça errada. Armadilhas têm texto próprio. */
  function motivo(est, slot, peca) {
    if (peca.falhaPropria) {
      return { titulo: peca.falhaPropria.titulo, texto: peca.falhaPropria.texto };
    }
    return {
      titulo: "Peça no encaixe errado",
      texto: "Este encaixe é para: «" + slot.papel + "». A peça `" + umaLinha(peca.codigo) + "` " + peca.faz + "."
    };
  }

  /* ------------------------------------------------------------ contexto de um pacote */

  function Ctx(est, M, pk, cel) {
    this.est = est;
    this.M = M;
    this.pk = pk;
    this.cel = cel;
    this.slots = est.slots;
    this.passos = [];
    this.falha = null;
    this.pacoteTexto = pk.texto;
    this.vars = { t: est.mostrarEspacos ? vis(pk.texto) : pk.texto };
  }

  Ctx.prototype.passo = function (no, tipo, legenda, patch, extra) {
    if (patch) {
      for (var k in patch) this.cel[k] = patch[k];
    }
    var p = { no: no, tipo: tipo, legenda: legenda, celular: clone(this.cel), pacoteTexto: this.pacoteTexto };
    if (extra) {
      for (var e in extra) p[e] = extra[e];
    }
    this.passos.push(p);
    return p;
  };

  Ctx.prototype.origem = function (legenda, patch) {
    var base = { alerta: null, erroTS: null };
    if (patch) {
      for (var k in patch) base[k] = patch[k];
    }
    this.passo("origem", "ok", legenda, base);
  };

  Ctx.prototype.destino = function (legenda, patch, extra) {
    this.passo("destino", "ok", legenda, patch, extra);
  };

  Ctx.prototype.falhar = function (slot, titulo, texto, patch, noDaParada) {
    var peca = pecaDe(this.est, this.M[slot.id]);
    this.passo(noDaParada || slot.id, "falha", titulo, patch);
    this.falha = {
      slot: slot.id,
      no: noDaParada || slot.id,
      peca: peca ? peca.id : null,
      titulo: titulo,
      texto: texto,
      pista: peca ? peca.pistaErro : ""
    };
  };

  /* A máquina age. Se a peça do encaixe não é a certa, o pacote para aqui. */
  Ctx.prototype.slotOk = function (slot, patch, legenda) {
    var id = this.M[slot.id];
    if (id !== slot.certo) {
      var m = motivo(this.est, slot, pecaDe(this.est, id));
      this.falhar(slot, m.titulo, m.texto);
      return false;
    }
    this.passo(slot.id, "ok", legenda != null ? legenda : textoDoSlot(slot.ok, this.pk.evento, this.vars), patch);
    return true;
  };

  Ctx.prototype.slotPula = function (slot, legenda, patch) {
    this.passo(slot.id, "pula", legenda != null ? legenda : textoDoSlot(slot.pula, this.pk.evento, this.vars), patch);
  };

  /* ------------------------------------------------------------ estações */

  var ESTACOES = {};

  /* 1. A caixinha de memória */
  ESTACOES.memoria = function (c) {
    var s = c.slots;
    var t = c.pk.texto;
    c.origem("O teclado manda o texto digitado: `" + t + "`.");
    if (!c.slotOk(s[0])) return;
    if (!c.slotOk(s[1])) return;
    if (!c.slotOk(s[2], { texto: t, refeitas: c.cel.refeitas + 1 })) return;
    c.destino("O campo do celular mostra `" + t + "` e a tela foi refeita.");
  };

  /* 2. Os dois fios do campo */
  ESTACOES.fios = function (c) {
    var A = c.slots[0];
    var B = c.slots[1];
    var C = c.slots[2];
    var M = c.M;
    var t = c.pk.texto;
    var armadilha = pecaDe(c.est, "default");

    if (c.pk.evento === "digitar") {
      c.origem("Alguém digita `" + t + "`. O bilhete sai com esse texto.");
      if (M[A.id] !== A.certo && M[B.id] === B.certo) {
        c.falhar(A, A.falha.titulo, A.falha.texto, A.falha.celular);
        return;
      }
      if (!c.slotOk(A)) return;
      if (M[B.id] === armadilha.id) {
        c.passo(B.id, "ok", "O campo aceita as teclas e mostra `" + t + "`, mas sem `value` ele não depende do estado.", { texto: t });
      } else if (!c.slotOk(B, { texto: t })) {
        return;
      }
      if (!c.slotOk(C, { placeholder: true })) return;
      c.destino("O campo mostra `" + t + "` e o texto cinza de exemplo sumiu.");
    } else {
      c.origem("O estado volta a ficar vazio. O bilhete sai em branco.");
      c.slotPula(A);
      if (M[B.id] === armadilha.id) {
        c.falhar(B, armadilha.falhaPropria.titulo, armadilha.falhaPropria.texto);
        return;
      }
      if (!c.slotOk(B, { texto: "" })) return;
      if (!c.slotOk(C, { placeholder: true })) return;
      c.destino("O campo ficou vazio e o texto cinza de exemplo voltou.");
    }
  };

  /* 3. O botão que escuta o toque */
  ESTACOES.botao = function (c) {
    var A = c.slots[0];
    var B = c.slots[1];
    var M = c.M;
    var t = c.pk.texto;
    var pressable = pecaDe(c.est, "pressable");
    var chamada = pecaDe(c.est, "call");

    if (c.pk.evento === "abrir") {
      c.origem("A tela abre e o React monta o botão. Ninguém tocou em nada.", { texto: "", botao: "normal" });
      if (M[A.id] === pressable.id) {
        c.passo(A.id, "ok", "O `Pressable` fica parado, esperando o dedo.");
      } else if (!c.slotOk(A)) {
        return;
      }
      if (M[B.id] === chamada.id) {
        c.falhar(B, chamada.falhaPropria.titulo, chamada.falhaPropria.texto, { alerta: ERRO });
        return;
      }
      if (!c.slotOk(B)) return;
      c.destino("A tela abriu sem nenhum alerta. A função só vai rodar no toque.");
    } else {
      c.origem("O dedo toca no botão com `" + t + "` no campo.", { texto: t, botao: "normal" });
      if (M[A.id] === pressable.id) {
        c.falhar(A, pressable.falhaPropria.titulo, pressable.falhaPropria.texto, {
          botao: "normal",
          alerta: { titulo: "Tarefa digitada", msg: t, ok: true },
          texto: ""
        });
        return;
      }
      if (!c.slotOk(A, { botao: "esmaece" })) return;
      if (!c.slotOk(B, { alerta: { titulo: "Tarefa digitada", msg: t, ok: true }, texto: "" })) return;
      c.destino("A função rodou no toque: o alerta apareceu e o campo foi limpo.");
    }
  };

  /* 4. Os alertas na tela */
  ESTACOES.alertas = function (c) {
    var A = c.slots[0];
    var B = c.slots[1];
    var C = c.slots[2];
    var t = c.pk.texto;

    if (c.pk.evento === "web") {
      c.origem("Agora o mesmo toque, mas no navegador (react-native-web).", { texto: t });
      c.slotPula(A);
      c.passo(B.id, "info", "A chamada `Alert.alert` roda, mas no navegador ela é uma função vazia: nenhuma caixa aparece.");
      c.slotPula(C, "Nenhuma caixa foi aberta, então não há botão OK para mostrar.");
      c.destino("Observação: na versão web o `Alert.alert` não mostra nada. Teste também no celular ou no emulador.", null, { observacao: true });
      return;
    }
    if (t === "") {
      c.origem("O dedo toca em Adicionar com o campo vazio.", { texto: "" });
      if (!c.slotOk(A, { alerta: { titulo: ERRO.titulo, msg: ERRO.msg, ok: false } })) return;
      c.slotPula(B);
      if (!c.slotOk(C, { alerta: { titulo: ERRO.titulo, msg: ERRO.msg, ok: true } })) return;
      c.destino("A caixa de erro aparece com o botão OK. É só tocar nele para fechar.");
    } else {
      c.origem("O dedo toca em Adicionar com `" + t + "` no campo.", { texto: t });
      c.slotPula(A);
      if (!c.slotOk(B, { alerta: { titulo: "Tarefa digitada", msg: t, ok: false } })) return;
      if (!c.slotOk(C, { alerta: { titulo: "Tarefa digitada", msg: t, ok: true } })) return;
      c.destino("A confirmação mostra de volta `" + t + "`.");
    }
  };

  /* 5. O porteiro da validação: um mini interpretador do trecho de código */
  ESTACOES.porteiro = function (c) {
    var A = c.slots[0];
    var B = c.slots[1];
    var Cc = c.slots[2];
    var Dd = c.slots[3];
    var M = c.M;
    var est = c.est;
    var t = c.pk.texto;
    var tipos = { A: ["trim", "replace"], B: ["if"], C: ["erroRet", "okClear"], D: ["erroRet", "okClear"] };

    function tipoOk(slot) {
      return tipos[slot.id].indexOf(M[slot.id]) >= 0;
    }
    function falhaDoTipo(slot) {
      var m = motivo(est, slot, pecaDe(est, M[slot.id]));
      c.falhar(slot, m.titulo, m.texto);
    }

    var semNada = t.trim() === "";
    c.origem(
      semNada
        ? "O botão é tocado com o campo só com espaços: `" + rotuloTexto(t) + "`."
        : "O botão é tocado com `" + vis(t) + "` no campo.",
      { texto: t }
    );

    /* A: corta ou tritura */
    if (!tipoOk(A)) return falhaDoTipo(A);
    var tt;
    if (M[A.id] === "trim") {
      tt = t.trim();
      c.pacoteTexto = tt;
      c.passo(A.id, "ok", fmt(A.ok.padrao, { t: vis(t) }) + " Resultado: `" + rotuloTexto(tt) + "`.");
    } else {
      tt = t.replace(/\s/g, "");
      c.pacoteTexto = tt;
      c.passo(A.id, "ok", "A trituradora arranca todos os espaços: `" + vis(t) + "` vira `" + rotuloTexto(tt) + "`.");
    }

    /* B: a cancela pergunta */
    if (!tipoOk(B)) return falhaDoTipo(B);
    c.passo(B.id, "ok", "A cancela pergunta se sobrou texto: " + (tt === "" ? "não, ficou vazio." : "sim, sobrou `" + vis(tt) + "`."));

    var alertas = [];
    var texto = t;
    var voltou = false;
    function executa(id) {
      if (id === "erroRet") {
        alertas.push({ titulo: ERRO.titulo, msg: ERRO.msg, ok: true });
        voltou = true;
        return "Aparece o alerta “Erro” e o `return` interrompe a função.";
      }
      alertas.push({ titulo: "Tarefa digitada", msg: tt, ok: true });
      texto = "";
      return "Aparece o alerta “Tarefa digitada” com `" + rotuloTexto(tt) + "` e o campo é limpo.";
    }
    function patchAlerta() {
      return { alerta: alertas[alertas.length - 1], texto: texto };
    }

    /* C: ramo de dentro do if */
    if (!tipoOk(Cc)) return falhaDoTipo(Cc);
    if (tt === "") {
      var legC = executa(M[Cc.id]);
      c.passo(Cc.id, "ok", legC, patchAlerta());
    } else {
      c.passo(Cc.id, "pula", "Sobrou texto, então o caminho do erro fica parado.");
    }

    /* D: o que vem depois do if */
    if (!tipoOk(Dd)) return falhaDoTipo(Dd);
    if (voltou) {
      c.passo(Dd.id, "pula", "O `return` já interrompeu a função: esta parte não roda.");
    } else {
      var legD = executa(M[Dd.id]);
      c.passo(Dd.id, "ok", legD + (alertas.length > 1 ? " Já são " + alertas.length + " alertas na fila." : ""), patchAlerta());
    }

    /* chegada: compara com o que o código certo faria */
    var esperado = semNada
      ? { alertas: [{ titulo: ERRO.titulo }], texto: t }
      : { alertas: [{ titulo: "Tarefa digitada", msg: t.trim() }], texto: "" };
    function descreve(r) {
      var a = r.alertas.length
        ? r.alertas
            .map(function (x) {
              return x.titulo === ERRO.titulo ? "alerta “Erro”" : "alerta “Tarefa digitada” com `" + rotuloTexto(x.msg) + "`";
            })
            .join(" e ")
        : "nenhum alerta";
      return a + " e campo " + (r.texto === "" ? "limpo" : "não limpo");
    }
    var real = { alertas: alertas, texto: texto };
    var igual =
      real.texto === esperado.texto &&
      real.alertas.length === esperado.alertas.length &&
      real.alertas.every(function (x, i) {
        return x.titulo === esperado.alertas[i].titulo && (x.titulo === ERRO.titulo || x.msg === esperado.alertas[i].msg);
      });
    if (igual) {
      c.destino(
        semNada
          ? "Só espaços: o erro foi avisado e o campo não foi limpo."
          : "A confirmação mostrou `" + rotuloTexto(tt) + "` e o campo foi limpo."
      );
      return;
    }

    var culpado = null;
    for (var i = 0; i < c.slots.length; i++) {
      if (M[c.slots[i].id] !== c.slots[i].certo) {
        culpado = c.slots[i];
        break;
      }
    }
    var peca = pecaDe(est, M[culpado.id]);
    var titulo;
    var texto2;
    if (peca.falhaPropria) {
      titulo = peca.falhaPropria.titulo;
      texto2 = peca.falhaPropria.texto;
    } else {
      titulo = "Ordem errada";
      texto2 =
        "Com `" + rotuloTexto(t) + "` o resultado foi: " + descreve(real) + ". O esperado era: " + descreve(esperado) + ". " +
        "Este encaixe é para: «" + culpado.papel + "». A peça `" + umaLinha(peca.codigo) + "` " + peca.faz + ".";
    }
    c.falhar(culpado, titulo, texto2, patchAlerta(), "destino");
  };

  /* 6. A montagem dos dois arquivos */
  ESTACOES.montagem = function (c) {
    var A = c.slots[0];
    var B = c.slots[1];
    var C = c.slots[2];
    var D = c.slots[3];

    if (c.pk.evento === "montar") {
      c.origem("O componente nasce no arquivo `TaskInput.tsx` e vai ser usado na `HomeScreen.tsx`.", { conteudo: "vazio" });
      if (!c.slotOk(A)) return;
      if (!c.slotOk(B)) return;
      if (!c.slotOk(C)) return;
      if (!c.slotOk(D, { conteudo: "input" })) return;
      c.destino("A `HomeScreen` mostra o campo e o botão no lugar do bloco “Aqui vai o Input”.");
    } else {
      c.origem("A `HomeScreen` tenta passar `nome=\"x\"` para o componente.");
      if (!c.slotOk(A, { erroTS: "A propriedade `nome` não existe nas props do `TaskInput`." })) return;
      c.slotPula(B);
      c.slotPula(C);
      c.slotPula(D);
      c.destino("O TypeScript recusou `nome=\"x\"`. É o que queremos: o componente não aceita props de fora.");
    }
  };

  /* ------------------------------------------------------------ execução */

  function rodarPacote(est, M, pk, cel) {
    var c = new Ctx(est, M, pk, cel);
    ESTACOES[est.id](c);
    return {
      pacote: pk,
      passos: c.passos,
      ok: !c.falha,
      falha: c.falha,
      observar: !!pk.observar
    };
  }

  function rodarTudo(est, M) {
    var cel = celularInicial(est);
    var execucoes = [];
    var ok = true;
    var falha = null;
    var normais = est.pacotes.filter(function (p) { return !p.observar; });
    var obs = est.pacotes.filter(function (p) { return p.observar; });
    for (var i = 0; i < normais.length; i++) {
      var ex = rodarPacote(est, M, normais[i], cel);
      execucoes.push(ex);
      if (!ex.ok) {
        ok = false;
        falha = ex.falha;
        break;
      }
    }
    if (ok) {
      for (var j = 0; j < obs.length; j++) {
        execucoes.push(rodarPacote(est, M, obs[j], cel));
      }
    }
    return { execucoes: execucoes, ok: ok, falha: falha };
  }

  function gabarito(est) {
    var m = {};
    est.slots.forEach(function (s) {
      m[s.id] = s.certo;
    });
    return m;
  }

  janela.Motor = {
    rodarTudo: rodarTudo,
    gabarito: gabarito,
    celularInicial: celularInicial,
    peca: pecaDe,
    vis: vis,
    umaLinha: umaLinha
  };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = janela.Motor;
  }
})(typeof window !== "undefined" ? window : globalThis);
