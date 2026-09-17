"use strict";

window.BreakoutStorage = (() => {
  const CHAVE = "breakout-evolution-v1";
  const padrao = {
    recordes: {
      facil: { nome: "—", pontos: 0 },
      normal: { nome: "—", pontos: 0 },
      dificil: { nome: "—", pontos: 0 },
    },
    jogador: "",
    nivelDesbloqueado: 1,
    configuracoes: {
      controle: "teclado",
      volume: 70,
      sensibilidade: 18,
      velocidadePlataforma: 8,
      efeitos: true,
    },
  };

  function salvar(dados) {
    localStorage.setItem(CHAVE, JSON.stringify(dados));
  }

  function carregar() {
    try {
      const salvo = JSON.parse(localStorage.getItem(CHAVE) || "null");
      const dados = {
        ...padrao,
        ...salvo,
        recordes: { ...padrao.recordes, ...(salvo?.recordes || {}) },
        configuracoes: {
          ...padrao.configuracoes,
          ...(salvo?.configuracoes || {}),
        },
      };
      // Preserva e migra o recorde criado antes da separação por dificuldade.
      if (salvo?.recorde && !salvo?.recordes) {
        dados.recordes.normal = {
          nome: "Jogador anterior",
          pontos: salvo.recorde,
        };
        delete dados.recorde;
        salvar(dados);
      }
      return dados;
    } catch {
      return structuredClone(padrao);
    }
  }

  function atualizarRecorde(dificuldade, nome, pontos) {
    const dados = carregar();
    const atual = dados.recordes[dificuldade] || { nome: "—", pontos: 0 };
    if (pontos > atual.pontos) {
      dados.recordes[dificuldade] = { nome, pontos: Math.round(pontos) };
      salvar(dados);
    }
    return dados.recordes[dificuldade];
  }

  function desbloquearNivel(nivel) {
    const dados = carregar();
    dados.nivelDesbloqueado = Math.max(
      dados.nivelDesbloqueado,
      Math.min(5, nivel),
    );
    salvar(dados);
    return dados.nivelDesbloqueado;
  }

  function salvarConfiguracoes(configuracoes) {
    const dados = carregar();
    dados.configuracoes = { ...dados.configuracoes, ...configuracoes };
    salvar(dados);
  }

  function salvarJogador(nome) {
    const dados = carregar();
    dados.jogador = nome;
    salvar(dados);
  }

  return {
    carregar,
    atualizarRecorde,
    desbloquearNivel,
    salvarConfiguracoes,
    salvarJogador,
  };
})();
