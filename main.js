/**
 * Jornada Literária — interações
 * -------------------------------------------------------------
 * Tudo aqui é progressivo: se o GSAP não carregar (ex.: bloqueado
 * por um ad-blocker, ou sem internet), a página continua funcional
 * — os objetos flutuantes usam a animação em CSS (@keyframes floatY)
 * já definida em main.css, e o bloco #Participe simplesmente aparece
 * sem a revelação sequencial, nunca ficando oculto.
 */
(function () {
  'use strict';

  var hasGSAP = typeof window.gsap !== 'undefined';

  /* -----------------------------------------------------------
     1) Slider de fotos (dia 11)
     Funciona com qualquer número de fotos; com 1 foto só (o caso
     de hoje), esconde as setas e as bolinhas automaticamente.
     ----------------------------------------------------------- */
  function initSliders() {
    var sliders = document.querySelectorAll('[data-slider]');
    sliders.forEach(function (slider) {
      var track = slider.querySelector('.slider__track');
      var slides = Array.prototype.slice.call(slider.querySelectorAll('.slider__slide'));
      var prevBtn = slider.querySelector('.slider__arrow--prev');
      var nextBtn = slider.querySelector('.slider__arrow--next');
      var dotsWrap = slider.querySelector('.slider__dots');
      var index = 0;

      if (slides.length <= 1) {
        if (prevBtn) prevBtn.hidden = true;
        if (nextBtn) nextBtn.hidden = true;
        if (dotsWrap) dotsWrap.hidden = true;
        return; // nada para deslizar ainda
      }

      slides.forEach(function (_, i) {
        var dot = document.createElement('button');
        dot.type = 'button';
        dot.setAttribute('role', 'tab');
        dot.setAttribute('aria-label', 'Ir para a foto ' + (i + 1));
        if (i === 0) dot.classList.add('is-active');
        dot.addEventListener('click', function () { goTo(i); });
        dotsWrap.appendChild(dot);
      });
      var dots = Array.prototype.slice.call(dotsWrap.children);

      function render() {
        track.style.transform = 'translateX(-' + index * 100 + '%)';
        dots.forEach(function (d, i) { d.classList.toggle('is-active', i === index); });
      }

      function goTo(i) {
        index = (i + slides.length) % slides.length;
        render();
      }

      prevBtn.addEventListener('click', function () { goTo(index - 1); });
      nextBtn.addEventListener('click', function () { goTo(index + 1); });

      // swipe no touch
      var startX = null;
      track.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; }, { passive: true });
      track.addEventListener('touchend', function (e) {
        if (startX === null) return;
        var delta = e.changedTouches[0].clientX - startX;
        if (Math.abs(delta) > 40) goTo(index + (delta < 0 ? 1 : -1));
        startX = null;
      });
    });
  }

  /* -----------------------------------------------------------
     2) Player de áudio flutuante
     ----------------------------------------------------------- */
  function initAudioPlayers() {
    var players = document.querySelectorAll('[data-audio-player]');
    players.forEach(function (player) {
      var audio = player.querySelector('[data-audio-element]');
      var toggle = player.querySelector('[data-audio-toggle]');
      var iconPlay = toggle.querySelector('.icon-play');
      var iconPause = toggle.querySelector('.icon-pause');
      if (!audio || !toggle) return;

      toggle.addEventListener('click', function () {
        if (audio.paused) {
          audio.play().catch(function () {
            /* autoplay/formato bloqueado — falha silenciosa, botão
               permanece no estado "play" */
          });
        } else {
          audio.pause();
        }
      });

      audio.addEventListener('play', function () {
        player.setAttribute('data-playing', '');
        iconPlay.hidden = true;
        iconPause.hidden = false;
        toggle.setAttribute('aria-label', 'Pausar amostra do audiolivro');
      });

      audio.addEventListener('pause', function () {
        player.removeAttribute('data-playing');
        iconPlay.hidden = false;
        iconPause.hidden = true;
        toggle.setAttribute('aria-label', 'Reproduzir amostra do audiolivro');
      });
    });
  }

  /* -----------------------------------------------------------
     3) Objetos flutuantes animados (GSAP) — card do dia 12
     Sem GSAP, a animação em CSS (floatY, já aplicada por padrão)
     cobre o efeito; aqui só assumimos o controle para movimento
     mais orgânico (deslocamento também em X, timings variados).
     ----------------------------------------------------------- */
  function initFloaters() {
    if (!hasGSAP) return;
    var floaters = document.querySelectorAll('.floater');
    if (!floaters.length) return;

    floaters.forEach(function (el, i) {
      gsap.killTweensOf(el);
      gsap.set(el, { animation: 'none' }); // desliga o fallback em CSS
      var dur = 3 + Math.random() * 2.5;
      var dx = (Math.random() - 0.5) * 26;
      var dy = 14 + Math.random() * 16;
      gsap.to(el, {
        x: dx,
        y: -dy,
        duration: dur,
        delay: i * 0.35,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true
      });
    });
  }

  /* -----------------------------------------------------------
     4) Revelação sequencial do bloco #Participe (GSAP + IO)
     Sem GSAP, os spans já nascem visíveis (opacity: var(--o)),
     então nada fica escondido — só perde-se a entrada em cascata.
     ----------------------------------------------------------- */
  function initStaggerReveal() {
    if (!hasGSAP) return;
    var group = document.querySelector('[data-stagger-group]');
    if (!group) return;
    var spans = Array.prototype.slice.call(group.querySelectorAll('span'));
    if (!spans.length) return;

    var played = false;
    function play() {
      if (played) return;
      played = true;
      gsap.set(spans, { y: 16 });
      spans.forEach(function (el) { gsap.set(el, { opacity: 0 }); });
      gsap.to(spans, {
        opacity: function (i, el) { return parseFloat(el.style.getPropertyValue('--o')) || 1; },
        y: 0,
        duration: 0.55,
        stagger: 0.12,
        ease: 'power2.out'
      });
    }

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { play(); io.disconnect(); }
        });
      }, { threshold: 0.35 });
      io.observe(group);
    } else {
      play();
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    initSliders();
    initAudioPlayers();
    initFloaters();
    initStaggerReveal();
  });
})();
