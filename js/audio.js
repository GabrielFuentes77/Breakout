"use strict";

window.BreakoutAudio = (() => {
  let ativo = true,
    volume = 0.7;
  function configurar(novoVolume, novoAtivo = ativo) {
    volume = novoVolume / 100;
    ativo = novoAtivo;
  }
  function alternar() {
    ativo = !ativo;
    return ativo;
  }
  function estaAtivo() {
    return ativo;
  }
  function tocar(frequencia, duracao = 0.08, tipo = "sine") {
    if (!ativo || volume === 0) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      const audio = new AC(),
        oscilador = audio.createOscillator(),
        ganho = audio.createGain();
      oscilador.type = tipo;
      oscilador.frequency.value = frequencia;
      ganho.gain.setValueAtTime(0.045 * volume, audio.currentTime);
      ganho.gain.exponentialRampToValueAtTime(
        0.001,
        audio.currentTime + duracao,
      );
      oscilador.connect(ganho).connect(audio.destination);
      oscilador.start();
      oscilador.stop(audio.currentTime + duracao);
    } catch {}
  }
  return { configurar, alternar, estaAtivo, tocar };
})();
