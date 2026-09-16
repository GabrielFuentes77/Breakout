"use strict";

const canvas = document.querySelector("#canvas");
const ctx = canvas.getContext("2d");
const W = canvas.width,
  H = canvas.height;
const LARGURA_PLATAFORMA = 100,
  ALTURA_PLATAFORMA = 14,
  RAIO_BOLA = 8;
const cores = [
  "#ff4d8d",
  "#ff8057",
  "#ffd166",
  "#68e0cf",
  "#5d8dff",
  "#aa7cff",
];

const elementos = {
  sobreposicao: document.querySelector("#sobreposicao"),
  menu: document.querySelector("#menu"),
  pausa: document.querySelector("#pausa"),
  resultado: document.querySelector("#resultado"),
  pontuacao: document.querySelector("#pontuacao"),
  nivel: document.querySelector("#nivel"),
  vidas: document.querySelector("#vidas"),
  pontuacaoFinal: document.querySelector("#pontuacaoFinal"),
  tituloResultado: document.querySelector("#tituloResultado"),
  mensagemResultado: document.querySelector("#mensagemResultado"),
  controleAtual: document.querySelector("#controleAtual"),
  som: document.querySelector("#som"),
  telaCheia: document.querySelector("#telaCheia"),
  pausar: document.querySelector("#pausar"),
};

let estado = "menu";
let tipoControle = "teclado";
let somAtivo = true;
let acaoResultado = "reiniciar";
const teclas = { esquerda: false, direita: false };
let mouseX = W / 2;
const jogo = {
  plataformaX: (W - LARGURA_PLATAFORMA) / 2,
  bolaX: W / 2,
  bolaY: H - 64,
  vx: 4.6,
  vy: -5.2,
  vidas: 3,
  pontos: 0,
  nivel: 1,
  totalNiveis: 5,
  blocos: [],
};

const configuracoesNiveis = [
  { linhas: 6, colunas: 10, formato: () => true },
  {
    linhas: 7,
    colunas: 10,
    formato: (linha, coluna) =>
      !(linha % 2 === 1 && (coluna === 0 || coluna === 9)),
  },
  {
    linhas: 8,
    colunas: 11,
    formato: (linha, coluna) =>
      Math.abs(coluna - 5) + Math.abs(linha - 3.5) <= 7,
  },
  {
    linhas: 9,
    colunas: 12,
    formato: (linha, coluna) =>
      (linha + coluna) % 2 === 0 || linha === 0 || linha === 8,
  },
  {
    linhas: 9,
    colunas: 12,
    formato: (linha, coluna) =>
      !((linha === 3 || linha === 4) && coluna >= 4 && coluna <= 7),
  },
];

function mostrarTela(nome) {
  estado = nome;
  elementos.sobreposicao.classList.toggle("oculta", nome === "jogando");
  elementos.menu.classList.toggle("escondido", nome !== "menu");
  elementos.pausa.classList.toggle("escondido", nome !== "pausado");
  elementos.resultado.classList.toggle(
    "escondido",
    !["nivelConcluido", "vitoria", "derrota"].includes(nome),
  );
  elementos.pausar.textContent =
    nome === "pausado" ? "▶ CONTINUAR" : "Ⅱ PAUSAR";
}

function criarBlocos() {
  jogo.blocos = [];
  const configuracao = configuracoesNiveis[jogo.nivel - 1];
  const colunas = configuracao.colunas,
    linhas = configuracao.linhas,
    espaco = 8,
    margem = 38;
  const largura = (W - margem * 2 - espaco * (colunas - 1)) / colunas;
  for (let linha = 0; linha < linhas; linha++)
    for (let coluna = 0; coluna < colunas; coluna++)
      if (configuracao.formato(linha, coluna))
        jogo.blocos.push({
          x: margem + coluna * (largura + espaco),
          y: 55 + linha * 28,
          w: largura,
          h: 20,
          cor: cores[(linha + jogo.nivel - 1) % cores.length],
          ativo: true,
        });
}

function reposicionarBola(manterPlataforma = false) {
  if (!manterPlataforma) {
    jogo.plataformaX = (W - LARGURA_PLATAFORMA) / 2;
  }
  jogo.bolaX = jogo.plataformaX + LARGURA_PLATAFORMA / 2;
  jogo.bolaY = H - 64;
  const velocidade = 4.6 + (jogo.nivel - 1) * 0.65;
  jogo.vx = (Math.random() > 0.5 ? 1 : -1) * velocidade;
  jogo.vy = -(velocidade + 0.6);
  // Mantém o alvo do mouse junto da plataforma após perder uma vida.
  mouseX = jogo.plataformaX + LARGURA_PLATAFORMA / 2;
}

function iniciarJogo() {
  jogo.pontos = 0;
  jogo.vidas = 3;
  jogo.nivel = 1;
  criarBlocos();
  reposicionarBola();
  atualizarPlacar();
  mostrarTela("jogando");
}

function atualizarPlacar() {
  elementos.pontuacao.textContent = String(jogo.pontos).padStart(6, "0");
  elementos.nivel.textContent = `${jogo.nivel} / ${jogo.totalNiveis}`;
  elementos.vidas.textContent =
    "● ".repeat(jogo.vidas) + "○ ".repeat(3 - jogo.vidas);
}

function emitirSom(frequencia) {
  if (!somAtivo) return;
  try {
    const Audio = window.AudioContext || window.webkitAudioContext,
      audio = new Audio(),
      oscilador = audio.createOscillator(),
      volume = audio.createGain();
    oscilador.frequency.value = frequencia;
    volume.gain.setValueAtTime(0.04, audio.currentTime);
    volume.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.08);
    oscilador.connect(volume).connect(audio.destination);
    oscilador.start();
    oscilador.stop(audio.currentTime + 0.08);
  } catch {}
}

function atualizar() {
  if (estado !== "jogando") return;
  // Apenas o controle escolhido pode alterar a plataforma.
  if (tipoControle === "teclado") {
    if (teclas.esquerda) jogo.plataformaX -= 8;
    if (teclas.direita) jogo.plataformaX += 8;
  } else {
    jogo.plataformaX +=
      (mouseX - LARGURA_PLATAFORMA / 2 - jogo.plataformaX) * 0.18;
  }
  jogo.plataformaX = Math.max(
    12,
    Math.min(W - LARGURA_PLATAFORMA - 12, jogo.plataformaX),
  );
  jogo.bolaX += jogo.vx;
  jogo.bolaY += jogo.vy;
  if (jogo.bolaX < RAIO_BOLA || jogo.bolaX > W - RAIO_BOLA) {
    jogo.vx *= -1;
    jogo.bolaX = Math.max(RAIO_BOLA, Math.min(W - RAIO_BOLA, jogo.bolaX));
    emitirSom(180);
  }
  if (jogo.bolaY < RAIO_BOLA) {
    jogo.vy = Math.abs(jogo.vy);
    emitirSom(180);
  }
  if (
    jogo.vy > 0 &&
    jogo.bolaY + RAIO_BOLA >= H - 34 &&
    jogo.bolaY < H - 12 &&
    jogo.bolaX >= jogo.plataformaX &&
    jogo.bolaX <= jogo.plataformaX + LARGURA_PLATAFORMA
  ) {
    const impacto =
        (jogo.bolaX - (jogo.plataformaX + LARGURA_PLATAFORMA / 2)) /
        (LARGURA_PLATAFORMA / 2),
      velocidade = Math.min(
        8.4 + (jogo.nivel - 1) * 0.7,
        Math.hypot(jogo.vx, jogo.vy) + 0.1,
      );
    jogo.vx = impacto * velocidade * 0.9;
    jogo.vy = -Math.sqrt(Math.max(16, velocidade ** 2 - jogo.vx ** 2));
    jogo.bolaY = H - 34 - RAIO_BOLA;
    emitirSom(320);
  }
  for (const bloco of jogo.blocos)
    if (
      bloco.ativo &&
      jogo.bolaX + RAIO_BOLA > bloco.x &&
      jogo.bolaX - RAIO_BOLA < bloco.x + bloco.w &&
      jogo.bolaY + RAIO_BOLA > bloco.y &&
      jogo.bolaY - RAIO_BOLA < bloco.y + bloco.h
    ) {
      bloco.ativo = false;
      jogo.vy *= -1;
      jogo.pontos += 100 * jogo.nivel;
      atualizarPlacar();
      emitirSom(520);
      if (jogo.blocos.every((item) => !item.ativo)) concluirNivel();
      break;
    }
  if (jogo.bolaY > H + RAIO_BOLA) {
    jogo.vidas--;
    atualizarPlacar();
    jogo.vidas <= 0 ? finalizar(false) : reposicionarBola(true);
  }
}

function concluirNivel() {
  jogo.pontos += 500 * jogo.nivel;
  atualizarPlacar();

  if (jogo.nivel === jogo.totalNiveis) {
    finalizar(true);
    return;
  }

  acaoResultado = "proximoNivel";
  elementos.tituloResultado.textContent = `NÍVEL ${jogo.nivel} CONCLUÍDO`;
  elementos.mensagemResultado.textContent = `Prepare-se para o nível ${jogo.nivel + 1}. A bola ficará mais rápida!`;
  elementos.pontuacaoFinal.textContent = jogo.pontos;
  document.querySelector("#jogarNovamente").innerHTML =
    "▶ &nbsp; PRÓXIMO NÍVEL";
  mostrarTela("nivelConcluido");
  emitirSom(760);
}

function iniciarProximoNivel() {
  jogo.nivel++;
  criarBlocos();
  reposicionarBola();
  atualizarPlacar();
  mostrarTela("jogando");
}

function finalizar(venceu) {
  acaoResultado = "reiniciar";
  elementos.tituloResultado.textContent = venceu
    ? "VOCÊ CONSEGUIU!"
    : "FIM DE JOGO";
  elementos.mensagemResultado.textContent = venceu
    ? "Todos os blocos caíram."
    : "A bola escapou.";
  elementos.pontuacaoFinal.textContent = jogo.pontos;
  document.querySelector("#jogarNovamente").innerHTML = venceu
    ? "↻ &nbsp; JOGAR NOVAMENTE"
    : "↻ &nbsp; TENTAR NOVAMENTE";
  mostrarTela(venceu ? "vitoria" : "derrota");
}

function desenhar() {
  const fundo = ctx.createLinearGradient(0, 0, 0, H);
  fundo.addColorStop(0, "#101735");
  fundo.addColorStop(1, "#070a18");
  ctx.fillStyle = fundo;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#ffffff2b";
  for (let i = 0; i < 30; i++)
    ctx.fillRect((i * 137) % W, (i * 83) % H, 1.4, 1.4);
  jogo.blocos.forEach((bloco) => {
    if (!bloco.ativo) return;
    ctx.shadowColor = bloco.cor;
    ctx.shadowBlur = 12;
    ctx.fillStyle = bloco.cor;
    ctx.beginPath();
    ctx.roundRect(bloco.x, bloco.y, bloco.w, bloco.h, 6);
    ctx.fill();
    ctx.fillStyle = "#ffffff59";
    ctx.fillRect(bloco.x + 6, bloco.y + 4, bloco.w - 12, 2);
  });
  ctx.shadowBlur = 18;
  ctx.shadowColor = "#68e0cf";
  ctx.fillStyle = "#e9fffb";
  ctx.beginPath();
  ctx.roundRect(
    jogo.plataformaX,
    H - 34,
    LARGURA_PLATAFORMA,
    ALTURA_PLATAFORMA,
    8,
  );
  ctx.fill();
  ctx.shadowColor = "#fff";
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(jogo.bolaX, jogo.bolaY, RAIO_BOLA, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

function ciclo() {
  atualizar();
  desenhar();
  requestAnimationFrame(ciclo);
}

document.querySelectorAll(".controle").forEach((botao) =>
  botao.addEventListener("click", () => {
    tipoControle = botao.dataset.controle;
    document
      .querySelectorAll(".controle")
      .forEach((item) => item.classList.toggle("selecionado", item === botao));
    elementos.controleAtual.textContent = `CONTROLE: ${tipoControle.toUpperCase()}`;
  }),
);
document.querySelector("#iniciar").addEventListener("click", iniciarJogo);
document
  .querySelector("#jogarNovamente")
  .addEventListener("click", () =>
    acaoResultado === "proximoNivel" ? iniciarProximoNivel() : iniciarJogo(),
  );
document
  .querySelector("#continuar")
  .addEventListener("click", () => mostrarTela("jogando"));
document
  .querySelectorAll(".sair-menu")
  .forEach((botao) =>
    botao.addEventListener("click", () => mostrarTela("menu")),
  );
elementos.pausar.addEventListener("click", () => {
  if (estado === "jogando") mostrarTela("pausado");
  else if (estado === "pausado") mostrarTela("jogando");
});
elementos.som.addEventListener("click", () => {
  somAtivo = !somAtivo;
  elementos.som.textContent = somAtivo ? "♪ SOM ATIVO" : "♩ SOM DESATIVADO";
});

elementos.telaCheia.addEventListener("click", async () => {
  try {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  } catch {
    // O jogo continua funcionando caso o navegador bloqueie a tela cheia.
  }
});

document.addEventListener("fullscreenchange", () => {
  elementos.telaCheia.textContent = document.fullscreenElement
    ? "⛶ SAIR DA TELA CHEIA"
    : "⛶ TELA CHEIA";
});

function atualizarPosicaoMouse(evento) {
  if (tipoControle !== "mouse") return;
  const r = canvas.getBoundingClientRect();
  const posicaoX = Math.max(r.left, Math.min(r.right, evento.clientX));
  mouseX = ((posicaoX - r.left) / r.width) * W;
}

// O mouse é acompanhado em toda a janela, inclusive fora do canvas.
window.addEventListener("pointermove", atualizarPosicaoMouse);
canvas.addEventListener(
  "touchmove",
  (evento) => {
    if (tipoControle !== "mouse") return;
    evento.preventDefault();
    const r = canvas.getBoundingClientRect();
    mouseX = ((evento.touches[0].clientX - r.left) / r.width) * W;
  },
  { passive: false },
);
addEventListener("keydown", (evento) => {
  if (["ArrowLeft", "ArrowRight", " ", "Escape"].includes(evento.key))
    evento.preventDefault();
  if (tipoControle === "teclado") {
    if (evento.key === "ArrowLeft" || evento.key.toLowerCase() === "a")
      teclas.esquerda = true;
    if (evento.key === "ArrowRight" || evento.key.toLowerCase() === "d")
      teclas.direita = true;
  }
  if (evento.key === " " || evento.key.toLowerCase() === "p") {
    if (estado === "jogando") mostrarTela("pausado");
    else if (estado === "pausado") mostrarTela("jogando");
  }
  if (evento.key === "Escape" && estado !== "menu") mostrarTela("menu");
});
addEventListener("keyup", (evento) => {
  if (evento.key === "ArrowLeft" || evento.key.toLowerCase() === "a")
    teclas.esquerda = false;
  if (evento.key === "ArrowRight" || evento.key.toLowerCase() === "d")
    teclas.direita = false;
});

criarBlocos();
desenhar();
ciclo();
