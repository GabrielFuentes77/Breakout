"use strict";

window.BreakoutStorage = (() => {
  const CHAVE = "breakout-evolution-v1";
  const padrao = {
    recordes: {
      facil: { nome: "—", pontos: 0 },
      normal: { nome: "—", pontos: 0 },
      dificil: { nome: "—", pontos: 0 },
    },
    rankings: {
      facil: [],
      normal: [],
      dificil: [],
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
        rankings: {
          facil: [...(salvo?.rankings?.facil || [])],
          normal: [...(salvo?.rankings?.normal || [])],
          dificil: [...(salvo?.rankings?.dificil || [])],
        },
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
      let rankingMigrado = false;
      ["facil", "normal", "dificil"].forEach((dificuldade) => {
        const recorde = dados.recordes[dificuldade];
        if (!dados.rankings[dificuldade].length && recorde.pontos > 0) {
          dados.rankings[dificuldade].push({
            nome: recorde.nome,
            pontos: recorde.pontos,
            nivel: "—",
            data: "",
          });
          rankingMigrado = true;
        }
      });
      if (rankingMigrado) salvar(dados);
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

  function registrarResultado(dificuldade, nome, pontos, nivel) {
    const dados = carregar();
    const pontuacao = Math.round(pontos);
    if (pontuacao <= 0) return dados.rankings[dificuldade] || [];

    const lista = dados.rankings[dificuldade] || [];
    lista.push({
      nome,
      pontos: pontuacao,
      nivel,
      data: new Date().toISOString(),
    });
    dados.rankings[dificuldade] = lista
      .sort((a, b) => b.pontos - a.pontos || b.nivel - a.nivel)
      .slice(0, 10);
    salvar(dados);
    return dados.rankings[dificuldade];
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
    registrarResultado,
    desbloquearNivel,
    salvarConfiguracoes,
    salvarJogador,
  };
})();
