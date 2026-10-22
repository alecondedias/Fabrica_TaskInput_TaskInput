/*
 * Visor: o celular de teste que fica ao lado da esteira.
 *
 * Ele só desenha. Quem decide o que aparece é o motor (motor.js): cada passo
 * traz o estado completo do celular, e a tela chama Visor.aplicar(estado).
 *
 * Estado: { texto, refeitas, travado, placeholder, botao, alerta, erroTS, conteudo }
 *   botao     "normal" ou "esmaece"
 *   alerta    null ou { titulo, msg, ok }   (ok: a caixa já tem o botão OK)
 *   erroTS    null ou o texto do erro de tipo
 *   conteudo  "input" (campo e botão) ou "vazio" (bloco "Aqui vai o Input")
 */
(function () {
  "use strict";

  var el = null;
  var cfg = { botao: false, contador: false, espacos: false };
  var atual = null;

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function md(s) {
    return esc(s).replace(/`([^`]+)`/g, "<code>$1</code>");
  }
  function pontos(t) {
    return String(t).replace(/^ +| +$/g, function (m) {
      return m.replace(/ /g, "·");
    });
  }

  var HTML =
    '<div class="cel">' +
    '<div class="cel-aparelho">' +
    '<div class="cel-tela">' +
    '<div class="cel-nav"><span class="cel-nav-titulo">HomeScreen</span></div>' +
    '<div class="cel-corpo">' +
    '<div class="cel-vazio"><span>Aqui vai o Input</span></div>' +
    '<div class="cel-input">' +
    '<div class="cel-rotulo">Nova tarefa</div>' +
    '<div class="cel-campo">' +
    '<span class="cel-texto"></span><span class="cel-ph">Digite o nome da tarefa...</span><span class="cel-cursor"></span>' +
    '<span class="cel-trava">travado</span>' +
    "</div>" +
    '<div class="cel-botao">+ Adicionar Tarefa</div>' +
    "</div>" +
    '<div class="cel-contador">Telas refeitas: <b class="cel-n">0</b></div>' +
    "</div>" +
    '<div class="cel-alerta" hidden>' +
    '<div class="cel-caixa">' +
    '<div class="cel-caixa-titulo"></div><div class="cel-caixa-msg"></div>' +
    '<div class="cel-caixa-botoes"><span class="cel-caixa-ok">OK</span></div>' +
    "</div></div>" +
    '<div class="cel-ts" hidden><b>Erro de tipo</b><span class="cel-ts-msg"></span></div>' +
    "</div>" +
    "</div>" +
    "</div>";

  function montar(raiz) {
    raiz.innerHTML = HTML;
    function q(sel) {
      return raiz.querySelector(sel);
    }
    el = {
      raiz: raiz,
      cel: q(".cel"),
      vazio: q(".cel-vazio"),
      input: q(".cel-input"),
      campo: q(".cel-campo"),
      texto: q(".cel-texto"),
      ph: q(".cel-ph"),
      trava: q(".cel-trava"),
      botao: q(".cel-botao"),
      contador: q(".cel-contador"),
      n: q(".cel-n"),
      alerta: q(".cel-alerta"),
      caixaTitulo: q(".cel-caixa-titulo"),
      caixaMsg: q(".cel-caixa-msg"),
      caixaBotoes: q(".cel-caixa-botoes"),
      ts: q(".cel-ts"),
      tsMsg: q(".cel-ts-msg")
    };
  }

  function configurar(c) {
    cfg = { botao: !!c.botao, contador: !!c.contador, espacos: !!c.espacos };
    el.botao.hidden = !cfg.botao;
    el.contador.hidden = !cfg.contador;
  }

  function aplicar(s) {
    if (!el) return;
    var antes = atual;
    atual = s;
    var vazio = s.conteudo === "vazio";
    el.vazio.hidden = !vazio;
    el.input.hidden = vazio;

    var t = s.texto || "";
    el.texto.textContent = cfg.espacos ? pontos(t) : t;
    el.texto.classList.toggle("com-pontos", cfg.espacos && /^ | $/.test(t));
    el.ph.hidden = !(t === "" && s.placeholder);
    el.trava.hidden = !s.travado;
    el.campo.classList.toggle("travado", !!s.travado);
    if (!antes || antes.texto !== s.texto) {
      el.campo.classList.remove("muda");
      void el.campo.offsetWidth;
      el.campo.classList.add("muda");
    }

    el.botao.classList.toggle("esmaece", s.botao === "esmaece");
    el.n.textContent = String(s.refeitas || 0);
    if (!antes || antes.refeitas !== s.refeitas) {
      el.contador.classList.remove("sobe");
      void el.contador.offsetWidth;
      el.contador.classList.add("sobe");
    }

    if (s.alerta) {
      el.alerta.hidden = false;
      el.caixaTitulo.textContent = s.alerta.titulo;
      el.caixaMsg.textContent = s.alerta.msg;
      el.caixaBotoes.hidden = !s.alerta.ok;
      el.alerta.classList.toggle("erro", s.alerta.titulo === "Erro");
    } else {
      el.alerta.hidden = true;
    }

    if (s.erroTS) {
      el.ts.hidden = false;
      el.tsMsg.innerHTML = " " + md(s.erroTS);
    } else {
      el.ts.hidden = true;
    }
  }

  function reiniciar(s) {
    atual = null;
    aplicar(s);
    if (el) {
      el.campo.classList.remove("muda");
      el.contador.classList.remove("sobe");
    }
  }

  window.Visor = { montar: montar, configurar: configurar, aplicar: aplicar, reiniciar: reiniciar };
})();
