"use strict";

(() => {
  const canvas = document.querySelector("#canvas");
  const ctx = canvas.getContext("2d");
  const W = canvas.width,
    H = canvas.height,
    ALTURA_PLATAFORMA = 14,
    RAIO_BOLA = 8;
  const Storage = window.BreakoutStorage,
    Levels = window.BreakoutLevels;
  const Audio = window.BreakoutAudio,
    Controls = window.BreakoutControls;
  const $ = (seletor) => document.querySelector(seletor);

  const el = {
    jogo: $(".jogo"),
    palco: $("#palco"),
    sobreposicao: $("#sobreposicao"),
    menu: $("#menu"),
    preJogo: $("#preJogo"),
    configuracoes: $("#configuracoes"),
    pausa: $("#pausa"),
    resultado: $("#resultado"),
    pontos: $("#pontuacao"),
    recorde: $("#recorde"),
    tituloRecorde: $("#tituloRecorde"),
    recordista: $("#recordista"),
    nomeJogador: $("#nomeJogador"),
    erroNome: $("#erroNome"),
    nivel: $("#nivel"),
    combo: $("#combo"),
    vidas: $("#vidas"),
    aviso: $("#avisoJogo"),
    tituloResultado: $("#tituloResultado"),
    mensagemResultado: $("#mensagemResultado"),
    pontuacaoFinal: $("#pontuacaoFinal"),
    acaoResultado: $("#acaoResultado"),
    seletorNivel: $("#seletorNivel"),
    controleAtual: $("#controleAtual"),
    efeitoAtual: $("#efeitoAtual"),
    som: $("#som"),
    telaCheia: $("#telaCheia"),
    pausar: $("#pausar"),
    volume: $("#volume"),
    sensibilidade: $("#sensibilidade"),
    velocidadePlataforma: $("#velocidadePlataforma"),
    efeitos: $("#efeitos"),
    valorVolume: $("#valorVolume"),
    valorSensibilidade: $("#valorSensibilidade"),
    valorVelocidade: $("#valorVelocidade"),
  };

  const dificuldades = {
    facil: {
      vidas: 5,
      velocidadeBola: 0.82,
      larguraPlataforma: 135,
      multiplicadorPontos: 1,
    },
    normal: {
      vidas: 3,
      velocidadeBola: 1,
      larguraPlataforma: 100,
      multiplicadorPontos: 1.5,
    },
    dificil: {
      vidas: 2,
      velocidadeBola: 1.2,
      larguraPlataforma: 78,
      multiplicadorPontos: 2,
    },
  };

  let persistencia = Storage.carregar();
  let estado = "menu",
    controle = "teclado",
    dificuldade = "normal",
    acaoResultado = "reiniciar";
  let aguardandoLancamento = false,
    ultimoTempo = performance.now();
  let configuracoes = { ...persistencia.configuracoes };
  let jogador = persistencia.jogador || "";
  const jogo = {
    plataformaX: 400,
    larguraPlataforma: 100,
    vidas: 3,
    vidasIniciais: 3,
    pontos: 0,
    nivel: 1,
    totalNiveis: Levels.niveis.length,
    combo: 0,
    blocos: [],
    bolas: [],
    powerUps: [],
    particulas: [],
    efeitos: { larguraAte: 0, larguraTipo: "", lentoAte: 0, penetranteAte: 0 },
  };

  function preencherNiveis() {
    el.seletorNivel.innerHTML = "";
    for (let nivel = 1; nivel <= jogo.totalNiveis; nivel++) {
      const opcao = document.createElement("option");
      opcao.value = nivel;
      opcao.disabled = nivel > persistencia.nivelDesbloqueado;
      opcao.textContent = `${nivel} — ${Levels.niveis[nivel - 1].nome}${opcao.disabled ? " 🔒" : ""}`;
      el.seletorNivel.appendChild(opcao);
    }
  }

  function nomeDificuldade(chave) {
    return { facil: "FÁCIL", normal: "NORMAL", dificil: "DIFÍCIL" }[chave];
  }

  function atualizarQuadroRecordes() {
    persistencia = Storage.carregar();
    document.querySelectorAll("[data-recorde]").forEach((cartao) => {
      const chave = cartao.dataset.recorde;
      const entrada = persistencia.recordes[chave];
      cartao.querySelector("strong").textContent = String(
        entrada.pontos,
      ).padStart(6, "0");
      cartao.querySelector("span").textContent = entrada.nome;
      cartao.classList.remove("ativo");
    });
  }

  function atualizarRecordeExibido() {
    const entrada = Storage.atualizarRecorde(
      dificuldade,
      jogador || "Jogador",
      jogo.pontos,
    );
    el.tituloRecorde.textContent = `RECORDE — ${nomeDificuldade(dificuldade)}`;
    el.recorde.textContent = String(entrada.pontos).padStart(6, "0");
    el.recordista.textContent = entrada.nome;
    atualizarQuadroRecordes();
  }

  function aplicarConfiguracoes() {
    controle = configuracoes.controle || "teclado";
    el.volume.value = configuracoes.volume;
    el.sensibilidade.value = configuracoes.sensibilidade;
    el.velocidadePlataforma.value = configuracoes.velocidadePlataforma;
    el.efeitos.checked = configuracoes.efeitos;
    atualizarValoresConfiguracao();
    Audio.configurar(configuracoes.volume);
    Controls.configurar({
      tipo: controle,
      sensibilidade: configuracoes.sensibilidade,
    });
    document
      .querySelectorAll("[data-controle]")
      .forEach((botao) =>
        botao.classList.toggle(
          "selecionada",
          botao.dataset.controle === controle,
        ),
      );
    el.controleAtual.textContent = `CONTROLE: ${controle.toUpperCase()}`;
  }

  function atualizarValoresConfiguracao() {
    el.valorVolume.value = `${el.volume.value}%`;
    el.valorSensibilidade.value = el.sensibilidade.value;
    el.valorVelocidade.value = el.velocidadePlataforma.value;
  }

  function mostrarTela(nome) {
    estado = nome;
    el.jogo.classList.toggle(
      "modo-menu",
      ["menu", "preJogo", "configuracoes"].includes(nome),
    );
    el.sobreposicao.classList.toggle(
      "oculta",
      ["jogando", "preparando"].includes(nome),
    );
    el.menu.classList.toggle("escondido", nome !== "menu");
    el.preJogo.classList.toggle("escondido", nome !== "preJogo");
    el.configuracoes.classList.toggle("escondido", nome !== "configuracoes");
    el.pausa.classList.toggle("escondido", nome !== "pausado");
    el.resultado.classList.toggle(
      "escondido",
      !["nivelConcluido", "vitoria", "derrota"].includes(nome),
    );
    el.pausar.textContent = nome === "pausado" ? "▶ CONTINUAR" : "Ⅱ PAUSAR";
  }

  function velocidadeInicial() {
    return (
      (4.5 + (jogo.nivel - 1) * 0.55) * dificuldades[dificuldade].velocidadeBola
    );
  }

  function criarBola(
    x = jogo.plataformaX + jogo.larguraPlataforma / 2,
    anexada = true,
  ) {
    const velocidade = velocidadeInicial();
    return {
      x,
      y: H - 57,
      vx: (Math.random() > 0.5 ? 1 : -1) * velocidade * 0.72,
      vy: -velocidade,
      anexada,
    };
  }

  function prepararLancamento(manterPlataforma = true) {
    if (!manterPlataforma) jogo.plataformaX = (W - jogo.larguraPlataforma) / 2;
    Controls.definirMouseX(jogo.plataformaX + jogo.larguraPlataforma / 2);
    jogo.bolas = [criarBola(undefined, true)];
    aguardandoLancamento = true;
    el.aviso.textContent = "ESPAÇO, ENTER OU CLIQUE PARA LANÇAR";
    el.aviso.classList.remove("escondido");
    mostrarTela("preparando");
  }

  function lancar() {
    if (!aguardandoLancamento || !["preparando", "jogando"].includes(estado))
      return;
    aguardandoLancamento = false;
    jogo.bolas.forEach((bola) => (bola.anexada = false));
    el.aviso.classList.add("escondido");
    mostrarTela("jogando");
    Audio.tocar(440);
  }

  function iniciarJogo() {
    const nomeInformado = el.nomeJogador.value.trim().replace(/\s+/g, " ");
    if (!nomeInformado) {
      el.nomeJogador.classList.add("invalido");
      el.erroNome.classList.remove("escondido");
      el.nomeJogador.focus();
      return;
    }
    jogador = nomeInformado;
    Storage.salvarJogador(jogador);
    el.nomeJogador.classList.remove("invalido");
    el.erroNome.classList.add("escondido");
    const cfg = dificuldades[dificuldade];
    jogo.pontos = 0;
    jogo.combo = 0;
    jogo.nivel = Number(el.seletorNivel.value || 1);
    jogo.vidas = cfg.vidas;
    jogo.vidasIniciais = cfg.vidas;
    jogo.larguraPlataforma = cfg.larguraPlataforma;
    jogo.powerUps = [];
    jogo.particulas = [];
    limparEfeitos();
    criarNivel();
    prepararLancamento(false);
    atualizarHUD();
  }

  function criarNivel() {
    jogo.blocos = Levels.criar(jogo.nivel, W);
    jogo.powerUps = [];
    jogo.particulas = [];
  }

  function atualizarHUD() {
    el.pontos.textContent = String(Math.round(jogo.pontos)).padStart(6, "0");
    atualizarRecordeExibido();
    el.nivel.textContent = `${jogo.nivel} / ${jogo.totalNiveis}`;
    const multiplicador = 1 + Math.floor(jogo.combo / 5) * 0.5;
    el.combo.textContent = `×${multiplicador.toFixed(multiplicador % 1 ? 1 : 0)}`;
    el.vidas.textContent =
      `${"♥ ".repeat(jogo.vidas)}${"♡ ".repeat(Math.max(0, jogo.vidasIniciais - jogo.vidas))}`.trim();
    el.vidas.setAttribute("aria-label", `${jogo.vidas} vidas`);
  }

  function atualizarPlataforma(delta) {
    const entrada = Controls.estado();
    const fatorDelta = Math.min(2, delta / 16.67);
    if (entrada.tipo === "teclado") {
      if (entrada.teclas.esquerda)
        jogo.plataformaX -= configuracoes.velocidadePlataforma * fatorDelta;
      if (entrada.teclas.direita)
        jogo.plataformaX += configuracoes.velocidadePlataforma * fatorDelta;
    } else {
      jogo.plataformaX +=
        (entrada.mouseX - jogo.larguraPlataforma / 2 - jogo.plataformaX) *
        entrada.sensibilidade *
        fatorDelta;
    }
    jogo.plataformaX = Math.max(
      8,
      Math.min(W - jogo.larguraPlataforma - 8, jogo.plataformaX),
    );
    if (aguardandoLancamento) {
      jogo.bolas.forEach((bola) => {
        bola.x = jogo.plataformaX + jogo.larguraPlataforma / 2;
        bola.y = H - 57;
      });
    }
  }

  function atualizarBolas(delta) {
    const fator = Math.min(2, delta / 16.67);
    for (const bola of jogo.bolas) {
      if (bola.anexada) continue;
      const anterior = { x: bola.x, y: bola.y };
      bola.x += bola.vx * fator;
      bola.y += bola.vy * fator;
      if (bola.x <= RAIO_BOLA || bola.x >= W - RAIO_BOLA) {
        bola.x = Math.max(RAIO_BOLA, Math.min(W - RAIO_BOLA, bola.x));
        bola.vx *= -1;
        Audio.tocar(180);
      }
      if (bola.y <= RAIO_BOLA) {
        bola.y = RAIO_BOLA;
        bola.vy = Math.abs(bola.vy);
        Audio.tocar(180);
      }
      colisaoPlataforma(bola);
      colisaoBlocos(bola, anterior);
    }
    jogo.bolas = jogo.bolas.filter((bola) => bola.y <= H + RAIO_BOLA);
    if (!aguardandoLancamento && jogo.bolas.length === 0) perderVida();
  }

  function colisaoPlataforma(bola) {
    if (bola.vy <= 0 || bola.y + RAIO_BOLA < H - 34 || bola.y > H - 12) return;
    if (
      bola.x < jogo.plataformaX ||
      bola.x > jogo.plataformaX + jogo.larguraPlataforma
    )
      return;
    const impacto =
      (bola.x - (jogo.plataformaX + jogo.larguraPlataforma / 2)) /
      (jogo.larguraPlataforma / 2);
    const limite =
      (8.3 + (jogo.nivel - 1) * 0.6) * dificuldades[dificuldade].velocidadeBola;
    const velocidade = Math.min(limite, Math.hypot(bola.vx, bola.vy) + 0.08);
    bola.vx = impacto * velocidade * 0.92;
    bola.vy = -Math.sqrt(Math.max(12, velocidade ** 2 - bola.vx ** 2));
    bola.y = H - 34 - RAIO_BOLA;
    Audio.tocar(320);
  }

  function colisaoBlocos(bola, anterior) {
    for (const bloco of jogo.blocos) {
      if (
        !bloco.ativo ||
        bola.x + RAIO_BOLA <= bloco.x ||
        bola.x - RAIO_BOLA >= bloco.x + bloco.w ||
        bola.y + RAIO_BOLA <= bloco.y ||
        bola.y - RAIO_BOLA >= bloco.y + bloco.h
      )
        continue;
      const penetrante = performance.now() < jogo.efeitos.penetranteAte;
      if (!penetrante || bloco.tipo === "indestrutivel")
        rebaterPeloLado(bola, bloco, anterior);
      if (bloco.tipo === "indestrutivel") {
        Audio.tocar(115, 0.12, "square");
        tremer();
        break;
      }
      bloco.hp--;
      if (bloco.hp <= 0) destruirBloco(bloco);
      else {
        Audio.tocar(260);
        criarParticulas(
          bloco.x + bloco.w / 2,
          bloco.y + bloco.h / 2,
          bloco.cor,
          5,
        );
      }
      break;
    }
  }

  function rebaterPeloLado(bola, bloco, anterior) {
    const veioDeCima = anterior.y + RAIO_BOLA <= bloco.y;
    const veioDeBaixo = anterior.y - RAIO_BOLA >= bloco.y + bloco.h;
    const veioDaEsquerda = anterior.x + RAIO_BOLA <= bloco.x;
    const veioDaDireita = anterior.x - RAIO_BOLA >= bloco.x + bloco.w;
    if (veioDeCima) {
      bola.y = bloco.y - RAIO_BOLA;
      bola.vy = -Math.abs(bola.vy);
    } else if (veioDeBaixo) {
      bola.y = bloco.y + bloco.h + RAIO_BOLA;
      bola.vy = Math.abs(bola.vy);
    } else if (veioDaEsquerda) {
      bola.x = bloco.x - RAIO_BOLA;
      bola.vx = -Math.abs(bola.vx);
    } else if (veioDaDireita) {
      bola.x = bloco.x + bloco.w + RAIO_BOLA;
      bola.vx = Math.abs(bola.vx);
    } else bola.vy *= -1;
  }

  function destruirBloco(bloco, porExplosao = false) {
    if (!bloco.ativo || bloco.tipo === "indestrutivel") return;
    bloco.ativo = false;
    jogo.combo++;
    const multiplicador = 1 + Math.floor(jogo.combo / 5) * 0.5;
    const base =
      bloco.tipo === "bonus" ? 300 : bloco.tipo === "resistente" ? 180 : 100;
    jogo.pontos += Math.round(
      base *
        jogo.nivel *
        multiplicador *
        dificuldades[dificuldade].multiplicadorPontos,
    );
    criarParticulas(
      bloco.x + bloco.w / 2,
      bloco.y + bloco.h / 2,
      bloco.cor,
      bloco.tipo === "explosivo" ? 20 : 10,
    );
    if (bloco.tipo === "explosivo" && !porExplosao) explodirVizinhos(bloco);
    if (bloco.tipo === "bonus" || Math.random() < 0.14) criarPowerUp(bloco);
    Audio.tocar(bloco.tipo === "explosivo" ? 120 : 520);
    atualizarHUD();
    if (
      jogo.blocos.every((item) => !item.ativo || item.tipo === "indestrutivel")
    )
      concluirNivel();
  }

  function explodirVizinhos(origem) {
    tremer();
    jogo.blocos.forEach((bloco) => {
      if (
        bloco.ativo &&
        bloco.tipo !== "indestrutivel" &&
        Math.abs(bloco.linha - origem.linha) <= 1 &&
        Math.abs(bloco.coluna - origem.coluna) <= 1
      )
        destruirBloco(bloco, true);
    });
  }

  function criarPowerUp(bloco) {
    const tipos = [
      "expandir",
      "lento",
      "vida",
      "multibola",
      "penetrante",
      "encolher",
    ];
    const tipo = tipos[Math.floor(Math.random() * tipos.length)];
    jogo.powerUps.push({ x: bloco.x + bloco.w / 2, y: bloco.y, tipo, vy: 2.1 });
  }

  function atualizarPowerUps(delta) {
    const fator = Math.min(2, delta / 16.67);
    jogo.powerUps.forEach((item) => {
      item.y += item.vy * fator;
      if (
        item.y >= H - 43 &&
        item.y <= H - 15 &&
        item.x >= jogo.plataformaX &&
        item.x <= jogo.plataformaX + jogo.larguraPlataforma
      ) {
        aplicarPowerUp(item.tipo);
        item.coletado = true;
      }
    });
    jogo.powerUps = jogo.powerUps.filter(
      (item) => !item.coletado && item.y < H + 20,
    );
  }

  function aplicarPowerUp(tipo) {
    const agora = performance.now(),
      nomes = {
        expandir: "PLATAFORMA MAIOR",
        lento: "BOLA LENTA",
        vida: "VIDA EXTRA",
        multibola: "MULTIBOLA",
        penetrante: "BOLA PERFURANTE",
        encolher: "PLATAFORMA MENOR",
      };
    if (tipo === "vida") {
      jogo.vidas = Math.min(5, jogo.vidas + 1);
      jogo.vidasIniciais = Math.max(jogo.vidasIniciais, jogo.vidas);
    }
    if (tipo === "multibola") {
      const extras = jogo.bolas.slice(0, 2).map((bola) => ({
        ...bola,
        vx: -bola.vx,
        vy: bola.vy * 0.96,
        anexada: false,
      }));
      jogo.bolas.push(...extras);
      jogo.bolas = jogo.bolas.slice(0, 4);
    }
    if (tipo === "expandir" || tipo === "encolher") {
      jogo.efeitos.larguraTipo = tipo;
      jogo.efeitos.larguraAte = agora + 12000;
      jogo.larguraPlataforma = tipo === "expandir" ? 155 : 68;
    }
    if (tipo === "lento") {
      jogo.bolas.forEach((b) => {
        b.vx *= 0.72;
        b.vy *= 0.72;
      });
      jogo.efeitos.lentoAte = agora + 9000;
    }
    if (tipo === "penetrante") jogo.efeitos.penetranteAte = agora + 9000;
    el.efeitoAtual.textContent = nomes[tipo];
    Audio.tocar(820, 0.14);
    atualizarHUD();
  }

  function atualizarEfeitos() {
    const agora = performance.now();
    if (jogo.efeitos.larguraAte && agora > jogo.efeitos.larguraAte) {
      jogo.larguraPlataforma = dificuldades[dificuldade].larguraPlataforma;
      jogo.efeitos.larguraAte = 0;
      jogo.efeitos.larguraTipo = "";
    }
    if (jogo.efeitos.lentoAte && agora > jogo.efeitos.lentoAte) {
      jogo.bolas.forEach((b) => {
        b.vx /= 0.72;
        b.vy /= 0.72;
      });
      jogo.efeitos.lentoAte = 0;
    }
    const ativos = [];
    if (jogo.efeitos.larguraAte)
      ativos.push(
        jogo.efeitos.larguraTipo === "expandir" ? "BASE MAIOR" : "BASE MENOR",
      );
    if (jogo.efeitos.lentoAte) ativos.push("BOLA LENTA");
    if (jogo.efeitos.penetranteAte > agora) ativos.push("PERFURANTE");
    el.efeitoAtual.textContent = ativos.join(" • ");
  }

  function limparEfeitos() {
    jogo.efeitos = {
      larguraAte: 0,
      larguraTipo: "",
      lentoAte: 0,
      penetranteAte: 0,
    };
    el.efeitoAtual.textContent = "";
  }

  function perderVida() {
    jogo.vidas--;
    jogo.combo = 0;
    limparEfeitos();
    atualizarHUD();
    tremer();
    Audio.tocar(95, 0.25, "sawtooth");
    if (jogo.vidas <= 0) finalizar(false);
    else prepararLancamento(true);
  }

  function concluirNivel() {
    jogo.pontos += Math.round(
      500 * jogo.nivel * dificuldades[dificuldade].multiplicadorPontos,
    );
    atualizarHUD();
    if (jogo.nivel === jogo.totalNiveis) {
      finalizar(true);
      return;
    }
    persistencia.nivelDesbloqueado = Storage.desbloquearNivel(jogo.nivel + 1);
    preencherNiveis();
    acaoResultado = "proximo";
    el.tituloResultado.textContent = `NÍVEL ${jogo.nivel} CONCLUÍDO`;
    el.mensagemResultado.textContent = `Próxima fase: ${Levels.niveis[jogo.nivel].nome}.`;
    el.pontuacaoFinal.textContent = Math.round(jogo.pontos);
    el.acaoResultado.innerHTML = "▶ &nbsp; PRÓXIMO NÍVEL";
    mostrarTela("nivelConcluido");
    Audio.tocar(760, 0.2);
  }

  function proximoNivel() {
    jogo.nivel++;
    jogo.combo = 0;
    limparEfeitos();
    jogo.larguraPlataforma = dificuldades[dificuldade].larguraPlataforma;
    criarNivel();
    atualizarHUD();
    prepararLancamento(false);
  }

  function finalizar(venceu) {
    acaoResultado = "reiniciar";
    Storage.atualizarRecorde(dificuldade, jogador, jogo.pontos);
    el.tituloResultado.textContent = venceu
      ? "CAMPEÃO DO BREAKOUT!"
      : "FIM DE JOGO";
    el.mensagemResultado.textContent = venceu
      ? "Você venceu os cinco níveis."
      : "Os blocos venceram desta vez.";
    el.pontuacaoFinal.textContent = Math.round(jogo.pontos);
    el.acaoResultado.innerHTML = venceu
      ? "↻ &nbsp; JOGAR NOVAMENTE"
      : "↻ &nbsp; TENTAR NOVAMENTE";
    el.aviso.classList.add("escondido");
    mostrarTela(venceu ? "vitoria" : "derrota");
    atualizarHUD();
  }

  function criarParticulas(x, y, cor, quantidade) {
    if (!configuracoes.efeitos) return;
    for (let i = 0; i < quantidade; i++)
      jogo.particulas.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        vida: 1,
        cor,
      });
  }

  function atualizarParticulas(delta) {
    jogo.particulas.forEach((p) => {
      p.x += (p.vx * delta) / 16.67;
      p.y += (p.vy * delta) / 16.67;
      p.vy += 0.08;
      p.vida -= (0.025 * delta) / 16.67;
    });
    jogo.particulas = jogo.particulas.filter((p) => p.vida > 0);
  }

  function tremer() {
    if (!configuracoes.efeitos) return;
    el.palco.classList.remove("shake");
    void el.palco.offsetWidth;
    el.palco.classList.add("shake");
  }

  function atualizar(delta) {
    if (!["jogando", "preparando"].includes(estado)) return;
    atualizarPlataforma(delta);
    atualizarEfeitos();
    atualizarParticulas(delta);
    if (estado === "jogando") {
      atualizarBolas(delta);
      atualizarPowerUps(delta);
    }
  }

  function desenharBloco(bloco) {
    ctx.shadowColor = bloco.tipo === "indestrutivel" ? "#fff" : bloco.cor;
    ctx.shadowBlur = 10;
    ctx.fillStyle = bloco.tipo === "indestrutivel" ? "#69738e" : bloco.cor;
    ctx.beginPath();
    ctx.roundRect(bloco.x, bloco.y, bloco.w, bloco.h, 5);
    ctx.fill();
    if (bloco.tipo === "resistente") {
      ctx.strokeStyle = "#fff9";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    if (bloco.tipo === "explosivo") {
      ctx.fillStyle = "#1b1020";
      ctx.font = "bold 13px Arial";
      ctx.textAlign = "center";
      ctx.fillText("✦", bloco.x + bloco.w / 2, bloco.y + 15);
    }
    if (bloco.tipo === "bonus") {
      ctx.fillStyle = "#1b1020";
      ctx.font = "bold 12px Arial";
      ctx.textAlign = "center";
      ctx.fillText("★", bloco.x + bloco.w / 2, bloco.y + 15);
    }
    if (Number.isFinite(bloco.hp) && bloco.hp > 1) {
      ctx.fillStyle = "#111c";
      ctx.font = "bold 9px monospace";
      ctx.textAlign = "right";
      ctx.fillText(bloco.hp, bloco.x + bloco.w - 5, bloco.y + 14);
    }
    ctx.fillStyle = "#ffffff42";
    ctx.fillRect(bloco.x + 5, bloco.y + 4, bloco.w - 10, 2);
    ctx.shadowBlur = 0;
  }

  function desenhar() {
    const fundo = ctx.createLinearGradient(0, 0, 0, H);
    fundo.addColorStop(0, "#111941");
    fundo.addColorStop(1, "#050713");
    ctx.fillStyle = fundo;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#ffffff24";
    for (let i = 0; i < 38; i++)
      ctx.fillRect((i * 137) % W, (i * 83) % H, 1.4, 1.4);
    jogo.blocos.forEach((bloco) => bloco.ativo && desenharBloco(bloco));
    jogo.powerUps.forEach((item) => {
      const simbolos = {
        expandir: "↔",
        lento: "◷",
        vida: "♥",
        multibola: "●●",
        penetrante: "◆",
        encolher: "↹",
      };
      ctx.shadowColor = "#ffd166";
      ctx.shadowBlur = 12;
      ctx.fillStyle = "#ffd166";
      ctx.beginPath();
      ctx.arc(item.x, item.y, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#151020";
      ctx.font = "bold 10px Arial";
      ctx.textAlign = "center";
      ctx.fillText(simbolos[item.tipo], item.x, item.y + 4);
    });
    jogo.particulas.forEach((p) => {
      ctx.globalAlpha = p.vida;
      ctx.fillStyle = p.cor;
      ctx.fillRect(p.x, p.y, 4, 4);
    });
    ctx.globalAlpha = 1;
    ctx.shadowColor = "#68e0cf";
    ctx.shadowBlur = 18;
    ctx.fillStyle = "#e9fffb";
    ctx.beginPath();
    ctx.roundRect(
      jogo.plataformaX,
      H - 34,
      jogo.larguraPlataforma,
      ALTURA_PLATAFORMA,
      8,
    );
    ctx.fill();
    jogo.bolas.forEach((bola) => {
      ctx.shadowColor =
        performance.now() < jogo.efeitos.penetranteAte ? "#ffd166" : "#fff";
      ctx.fillStyle =
        performance.now() < jogo.efeitos.penetranteAte ? "#ffd166" : "#fff";
      ctx.beginPath();
      ctx.arc(bola.x, bola.y, RAIO_BOLA, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.shadowBlur = 0;
  }

  function ciclo(tempo) {
    const delta = Math.min(35, tempo - ultimoTempo || 16.67);
    ultimoTempo = tempo;
    atualizar(delta);
    desenhar();
    requestAnimationFrame(ciclo);
  }

  function alternarPausa() {
    if (["jogando", "preparando"].includes(estado)) mostrarTela("pausado");
    else if (estado === "pausado")
      mostrarTela(aguardandoLancamento ? "preparando" : "jogando");
  }

  document.querySelectorAll("[data-controle]").forEach((botao) =>
    botao.addEventListener("click", () => {
      controle = botao.dataset.controle;
      document
        .querySelectorAll("[data-controle]")
        .forEach((b) => b.classList.toggle("selecionada", b === botao));
      Controls.configurar({
        tipo: controle,
        sensibilidade: configuracoes.sensibilidade,
      });
      el.controleAtual.textContent = `CONTROLE: ${controle.toUpperCase()}`;
    }),
  );
  document.querySelectorAll("[data-dificuldade]").forEach((botao) =>
    botao.addEventListener("click", () => {
      dificuldade = botao.dataset.dificuldade;
      document
        .querySelectorAll("[data-dificuldade]")
        .forEach((b) => b.classList.toggle("selecionada", b === botao));
      atualizarRecordeExibido();
    }),
  );
  el.nomeJogador.addEventListener("input", () => {
    if (el.nomeJogador.value.trim()) {
      el.nomeJogador.classList.remove("invalido");
      el.erroNome.classList.add("escondido");
    }
  });
  $("#iniciar").addEventListener("click", () => {
    preencherNiveis();
    mostrarTela("preJogo");
    setTimeout(() => el.nomeJogador.focus(), 50);
  });
  $("#confirmarInicio").addEventListener("click", iniciarJogo);
  $("#voltarPreJogo").addEventListener("click", () => mostrarTela("menu"));
  $("#continuar").addEventListener("click", alternarPausa);
  el.pausar.addEventListener("click", alternarPausa);
  document.querySelectorAll(".sair-menu").forEach((b) =>
    b.addEventListener("click", () => {
      el.aviso.classList.add("escondido");
      preencherNiveis();
      mostrarTela("menu");
    }),
  );
  el.acaoResultado.addEventListener("click", () =>
    acaoResultado === "proximo" ? proximoNivel() : iniciarJogo(),
  );
  $("#abrirConfiguracoes").addEventListener("click", () =>
    mostrarTela("configuracoes"),
  );
  $("#fecharConfiguracoes").addEventListener("click", () =>
    mostrarTela("menu"),
  );
  $("#salvarConfiguracoes").addEventListener("click", () => {
    configuracoes = {
      controle,
      volume: Number(el.volume.value),
      sensibilidade: Number(el.sensibilidade.value),
      velocidadePlataforma: Number(el.velocidadePlataforma.value),
      efeitos: el.efeitos.checked,
    };
    Storage.salvarConfiguracoes(configuracoes);
    Audio.configurar(configuracoes.volume);
    Controls.configurar({
      tipo: controle,
      sensibilidade: configuracoes.sensibilidade,
    });
    mostrarTela("menu");
  });
  [el.volume, el.sensibilidade, el.velocidadePlataforma].forEach((input) =>
    input.addEventListener("input", atualizarValoresConfiguracao),
  );
  el.som.addEventListener("click", () => {
    const ativo = Audio.alternar();
    el.som.textContent = ativo ? "♪ SOM ATIVO" : "♩ SOM DESATIVADO";
  });
  el.telaCheia.addEventListener("click", async () => {
    try {
      if (!document.fullscreenElement)
        await document.documentElement.requestFullscreen();
      else await document.exitFullscreen();
    } catch {}
  });
  document.addEventListener("fullscreenchange", () => {
    el.telaCheia.textContent = document.fullscreenElement
      ? "⛶ SAIR DA TELA CHEIA"
      : "⛶ TELA CHEIA";
  });

  Controls.ligar({ canvas, aoPausar: alternarPausa, aoLancar: lancar });
  el.nomeJogador.value = jogador;
  preencherNiveis();
  aplicarConfiguracoes();
  atualizarQuadroRecordes();
  atualizarHUD();
  criarNivel();
  prepararLancamento(false);
  mostrarTela("menu");
  requestAnimationFrame(ciclo);
})();
