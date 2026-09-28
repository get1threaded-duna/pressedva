/* =============================================================
   js/motion.js
   Every scroll and entrance animation on pressedva.com runs here, on GSAP.
   Numbers that tune the feel live in design/tokens.css (--motion-*).
   Reduced motion: nothing here runs, the page is fully static and readable.
   ============================================================= */
(function () {
  if (!window.gsap || !window.ScrollTrigger || !window.ScrollSmoother || !window.SplitText) return;
  gsap.registerPlugin(ScrollTrigger, ScrollSmoother, SplitText);

  var root = document.documentElement;
  function tok(name) { return getComputedStyle(root).getPropertyValue(name).trim(); }
  function num(name) { return parseFloat(tok(name)); }
  var T = {
    smooth: num('--motion-smooth'),
    reveal: num('--motion-reveal'),
    stagger: num('--motion-stagger'),
    pinDesktop: num('--motion-pin-desktop'),
    pinMobile: num('--motion-pin-mobile')
  };
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return gsap.utils.toArray(sel, ctx); };
  var header = $('.top');
  function headerH() { return header.offsetHeight; }

  ScrollTrigger.config({ ignoreMobileResize: true });

  var mm = gsap.matchMedia();
  var fontsReady = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();

  fontsReady.then(function () {

    /* ---------- Smooth scrolling + anchor links ---------- */
    mm.add('(prefers-reduced-motion: no-preference)', function () {
      var smoother = ScrollSmoother.create({
        wrapper: '#smooth-wrapper',
        content: '#smooth-content',
        smooth: T.smooth,
        effects: true,
        smoothTouch: false
      });
      function onAnchor(e) {
        var a = e.target.closest('a[href^="#"]');
        if (!a) return;
        var id = a.getAttribute('href');
        if (id.length < 2) return;
        var target = $(id);
        if (!target) return;
        e.preventDefault();
        if (id === '#top') smoother.scrollTo(0, true);
        else smoother.scrollTo(target, true, 'top ' + (headerH() + 8) + 'px');
      }
      document.addEventListener('click', onAnchor);
      return function () { document.removeEventListener('click', onAnchor); };
    });

    /* ---------- Everything else: motion allowed, layout-aware ---------- */
    mm.add({ wide: '(min-width: 900px)', ok: '(prefers-reduced-motion: no-preference)' }, function (ctx) {
      if (!ctx.conditions.ok) return;
      var wide = ctx.conditions.wide;
      var hero = window.PressedHero;

      /* Header: away on the way down, back on the way up */
      var hideHeader = gsap.to(header, { yPercent: -100, duration: 0.45, ease: 'power3.out', paused: true });
      ScrollTrigger.create({
        start: 0, end: 'max',
        onUpdate: function (self) {
          var y = self.scroll();
          if (y < headerH() * 2 || self.direction === -1) hideHeader.reverse();
          else if (self.direction === 1) hideHeader.play();
        }
      });
      header.addEventListener('focusin', function () { hideHeader.reverse(); });
      gsap.from(header, { yPercent: -100, duration: 0.9, delay: 0.15, ease: 'expo.out' });

      /* ---------- Pinned hero ---------- */
      var word = $('.word');
      var wordSplit = SplitText.create(word, { type: 'chars', aria: 'auto' });
      var chars = wordSplit.chars;
      gsap.from(chars, { yPercent: 125, rotate: 9, duration: 1.15, ease: 'expo.out', stagger: { each: 0.07, from: 'start' }, delay: 0.1 });
      gsap.from('#hint', { opacity: 0, y: -12, duration: 0.8, delay: 1.1, ease: 'power3.out' });

      var pinLen = wide ? T.pinDesktop : T.pinMobile;
      var mid = (chars.length - 1) / 2;
      var pinTL = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: '.hero',
          start: 'top top+=' + headerH(),
          end: '+=' + pinLen + '%',
          pin: true,
          scrub: wide ? 0.6 : true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: function (self) { if (hero) hero.p = self.progress; }
        }
      });
      // Wide: letters fan out and the word grows. Narrow: the word already fills the screen, so letters ripple upward in a wave instead.
      pinTL
        .fromTo(chars, { x: 0, yPercent: 0, rotate: 0 }, {
          x: function (i) { return wide ? (i - mid) * window.innerWidth * 0.018 : 0; },
          yPercent: function (i) { return wide ? 0 : -14 - 18 * Math.abs(Math.sin(i * 0.9)); },
          rotate: function (i) { return (i - mid) * (wide ? 2.2 : 3.6); },
          duration: 1, immediateRender: false
        }, 0)
        .to(word, { scale: wide ? 1.22 : 1, yPercent: wide ? -6 : 0, color: tok('--bubble'), duration: 1 }, 0)
        .to('#hint', { opacity: 0, duration: 0.12 }, 0);
      if (hero) hero.driven = true;

      /* Intro block: in view on load, so it plays on load */
      var intro = $('.intro');
      gsap.from($$('.pill, .intro .eyebrow, .intro .lede', intro), { y: 26, opacity: 0, duration: T.reveal, ease: 'expo.out', stagger: T.stagger, delay: 0.7 });
      gsap.from($$('.ctas .btn', intro), { y: 34, opacity: 0, duration: T.reveal, ease: 'expo.out', stagger: T.stagger, delay: 1.0 });

      /* ---------- Section headings: line-mask reveals, scrubbed ledes ---------- */
      $$('.head').forEach(function (head) {
        var h2 = $('h2', head), eyebrow = $('.eyebrow', head), lede = $('.lede', head);
        if (eyebrow) gsap.from(eyebrow, { y: 18, opacity: 0, duration: T.reveal * 0.8, ease: 'power3.out', scrollTrigger: { trigger: head, start: 'top 88%', once: true } });
        SplitText.create(h2, {
          type: 'lines', mask: 'lines', autoSplit: true, aria: 'auto',
          onSplit: function (self) {
            return gsap.from(self.lines, { yPercent: 118, duration: T.reveal * 1.1, ease: 'expo.out', stagger: T.stagger, scrollTrigger: { trigger: h2, start: 'top 88%', once: true } });
          }
        });
        if (lede) scrubWords(lede);
      });

      function scrubWords(el) {
        SplitText.create(el, {
          type: 'words', autoSplit: true, aria: 'auto',
          onSplit: function (self) {
            return gsap.fromTo(self.words, { opacity: 0.14 }, { opacity: 1, ease: 'none', stagger: 0.12, scrollTrigger: { trigger: el, start: 'top 92%', end: 'top 55%', scrub: 0.4 } });
          }
        });
      }

      /* ---------- Parties: cards rise in, then tilt takes over ---------- */
      gsap.from($$('.pack'), {
        y: 110, rotationX: -16, opacity: 0, transformPerspective: 900, transformOrigin: '50% 100%',
        duration: T.reveal * 1.2, ease: 'expo.out', stagger: T.stagger * 1.4,
        scrollTrigger: { trigger: '.packs', start: 'top 82%', once: true }
      });

      /* ---------- Form cards and step lists ---------- */
      $$('.formcard').forEach(function (card) {
        gsap.from(card, { y: 80, opacity: 0, duration: T.reveal * 1.1, ease: 'expo.out', scrollTrigger: { trigger: card, start: 'top 88%', once: true } });
      });
      gsap.from($$('.steps li'), { y: 60, opacity: 0, duration: T.reveal, ease: 'expo.out', stagger: T.stagger * 1.4, scrollTrigger: { trigger: '.steps', start: 'top 85%', once: true } });

      /* ---------- Curtains: dark sections open up as they arrive ---------- */
      $$('.crew, .drop').forEach(function (sec) {
        gsap.fromTo(sec,
          { clipPath: 'inset(7% 3% 0% 3% round 2.75rem 2.75rem 0rem 0rem)' },
          { clipPath: 'inset(0% -1% -1% -1% round 0rem 0rem 0rem 0rem)', ease: 'none',
            scrollTrigger: { trigger: sec, start: 'top 96%', end: 'top 28%', scrub: true } });
      });

      /* ---------- Bars: words slide into place as you scroll ---------- */
      $$('.barrow').forEach(function (row) {
        var big = $('.display', row), copy = $('p', row);
        gsap.fromTo(big, { xPercent: wide ? -14 : -8, opacity: 0.15 }, { xPercent: 0, opacity: 1, ease: 'none', scrollTrigger: { trigger: row, start: 'top 92%', end: 'top 42%', scrub: 0.5 } });
        gsap.from(copy, { y: 40, opacity: 0, duration: T.reveal, ease: 'expo.out', scrollTrigger: { trigger: row, start: 'top 70%', once: true } });
        gsap.from(row, { borderTopColor: 'rgba(0,0,0,0)', duration: T.reveal, ease: 'power2.out', scrollTrigger: { trigger: row, start: 'top 92%', once: true } });
      });

      /* ---------- Pop-up dates ---------- */
      gsap.from($$('.dates li'), { y: 44, opacity: 0, duration: T.reveal, ease: 'expo.out', stagger: T.stagger * 1.2, scrollTrigger: { trigger: '.dates', start: 'top 85%', once: true } });

      /* ---------- Footer wordmark builds as it arrives ---------- */
      var foot = SplitText.create('footer .big', { type: 'lines,chars', mask: 'lines', aria: 'none' });
      gsap.from(foot.chars, { yPercent: 118, rotate: 7, duration: T.reveal * 1.1, ease: 'expo.out', stagger: 0.035, scrollTrigger: { trigger: 'footer .big', start: 'top 92%', once: true } });
      gsap.from('footer .cols', { y: 30, opacity: 0, duration: T.reveal, ease: 'expo.out', scrollTrigger: { trigger: 'footer .cols', start: 'top 98%', once: true } });

      /* ---------- Marquee: scroll speed and direction push it ---------- */
      var track = $('.track');
      var run = gsap.to(track, { xPercent: -50, duration: 26, ease: 'none', repeat: -1 });
      var skew = gsap.quickTo(track, 'skewX', { duration: 0.5, ease: 'power3.out' });
      var settle;
      ScrollTrigger.create({
        start: 0, end: 'max',
        onUpdate: function (self) {
          var v = self.getVelocity(), dir = self.direction;
          gsap.to(run, { timeScale: dir * Math.min(1 + Math.abs(v) / 220, 9), duration: 0.25, ease: 'power2.out', overwrite: true });
          skew(gsap.utils.clamp(-7, 7, -v / 260));
          if (settle) settle.kill();
          settle = gsap.delayedCall(0.14, function () { gsap.to(run, { timeScale: dir, duration: 0.9, ease: 'power2.out', overwrite: true }); skew(0); });
        }
      });

      /* ---------- Buttons: hover lift and press ---------- */
      $$('.btn, .copybtn').forEach(function (b) {
        var lift = window.matchMedia('(hover: hover)').matches;
        if (lift) {
          b.addEventListener('pointerenter', function () { gsap.to(b, { y: -3, duration: 0.3, ease: 'power3.out', overwrite: 'auto' }); });
          b.addEventListener('pointerleave', function () { gsap.to(b, { y: 0, scale: 1, duration: 0.4, ease: 'power3.out', overwrite: 'auto' }); });
        }
        b.addEventListener('pointerdown', function () { gsap.to(b, { y: 1, scale: 0.97, duration: 0.12, ease: 'power2.out', overwrite: 'auto' }); });
        b.addEventListener('pointerup', function () { gsap.to(b, { y: lift ? -3 : 0, scale: 1, duration: 0.5, ease: 'elastic.out(1, 0.5)', overwrite: 'auto' }); });
      });

      return function () { if (hero) { hero.driven = false; hero.p = 0; } };
    });

    ScrollTrigger.refresh();
  });

  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
