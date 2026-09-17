"use strict";

window.BreakoutControls = (() => {
  const teclas = { esquerda: false, direita: false };
  let tipo = "teclado",
    mouseX = 450,
    sensibilidade = 0.18;

  function configurar(opcoes) {
    tipo = opcoes.tipo ?? tipo;
    sensibilidade = (opcoes.sensibilidade ?? 18) / 100;
  }
  function definirMouseX(valor) {
    mouseX = valor;
  }
  function estado() {
    return { tipo, mouseX, sensibilidade, teclas };
  }
  function ligar({ canvas, aoPausar, aoLancar }) {
    window.addEventListener("pointermove", (evento) => {
      if (tipo !== "mouse") return;
      const r = canvas.getBoundingClientRect();
      const x = Math.max(r.left, Math.min(r.right, evento.clientX));
      mouseX = ((x - r.left) / r.width) * canvas.width;
    });
    window.addEventListener("keydown", (evento) => {
      const tecla = evento.key.toLowerCase();
      if (["arrowleft", "arrowright", " ", "escape"].includes(tecla))
        evento.preventDefault();
      if (tipo === "teclado") {
        if (tecla === "arrowleft" || tecla === "a") teclas.esquerda = true;
        if (tecla === "arrowright" || tecla === "d") teclas.direita = true;
      }
      if (tecla === " " || tecla === "enter") aoLancar();
      if (tecla === "p" || tecla === "escape") aoPausar();
    });
    window.addEventListener("keyup", (evento) => {
      const tecla = evento.key.toLowerCase();
      if (tecla === "arrowleft" || tecla === "a") teclas.esquerda = false;
      if (tecla === "arrowright" || tecla === "d") teclas.direita = false;
    });
    canvas.addEventListener("pointerdown", aoLancar);
    window.addEventListener("blur", () => {
      teclas.esquerda = false;
      teclas.direita = false;
    });
  }
  return { configurar, definirMouseX, estado, ligar };
})();
