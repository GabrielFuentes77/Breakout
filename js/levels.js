"use strict";

window.BreakoutLevels = (() => {
  const cores = [
    "#ff4d8d",
    "#ff8057",
    "#ffd166",
    "#68e0cf",
    "#5d8dff",
    "#aa7cff",
  ];
  const niveis = [
    { nome: "Fundamentos", linhas: 6, colunas: 10, formato: () => true },
    {
      nome: "Corredores",
      linhas: 7,
      colunas: 10,
      formato: (l, c) => !(l % 2 && (c === 0 || c === 9)),
    },
    {
      nome: "Diamante",
      linhas: 8,
      colunas: 11,
      formato: (l, c) => Math.abs(c - 5) + Math.abs(l - 3.5) <= 7,
    },
    {
      nome: "Tabuleiro",
      linhas: 9,
      colunas: 12,
      formato: (l, c) => (l + c) % 2 === 0 || l === 0 || l === 8,
    },
    {
      nome: "Fortaleza",
      linhas: 9,
      colunas: 12,
      formato: (l, c) => !((l === 3 || l === 4) && c >= 4 && c <= 7),
    },
  ];

  function tipoEspecial(nivel, linha, coluna) {
    if (nivel >= 5 && linha === 0 && coluna % 4 === 0) return "indestrutivel";
    if (nivel >= 3 && (linha * 7 + coluna) % 17 === 0) return "explosivo";
    if (nivel >= 2 && (linha * 5 + coluna) % 13 === 0) return "bonus";
    if (nivel >= 2 && (linha + coluna * 3) % 11 === 0) return "resistente";
    return "normal";
  }

  function criar(nivel, larguraTela) {
    const cfg = niveis[nivel - 1];
    const margem = 38,
      espaco = 8;
    const largura =
      (larguraTela - margem * 2 - espaco * (cfg.colunas - 1)) / cfg.colunas;
    const blocos = [];
    for (let linha = 0; linha < cfg.linhas; linha++) {
      for (let coluna = 0; coluna < cfg.colunas; coluna++) {
        if (!cfg.formato(linha, coluna)) continue;
        const tipo = tipoEspecial(nivel, linha, coluna);
        const hp =
          tipo === "resistente"
            ? nivel >= 4
              ? 3
              : 2
            : tipo === "indestrutivel"
              ? Infinity
              : 1;
        blocos.push({
          x: margem + coluna * (largura + espaco),
          y: 52 + linha * 28,
          w: largura,
          h: 20,
          cor: cores[(linha + nivel - 1) % cores.length],
          tipo,
          hp,
          hpMax: hp,
          ativo: true,
          linha,
          coluna,
        });
      }
    }
    return blocos;
  }

  return { niveis, cores, criar };
})();
