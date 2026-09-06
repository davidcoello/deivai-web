(function(){
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- nav background on scroll ---- */
  var nav = document.getElementById("nav");
  var progress = document.getElementById("navProgress");
  function onScroll(){
    nav.classList.toggle("stuck", window.scrollY > 12);
    if(progress){
      var max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0).toFixed(2) + "%";
    }
  }
  onScroll(); window.addEventListener("scroll", onScroll, {passive:true});
  window.addEventListener("resize", onScroll);

  /* ---- menu en pantallas estrechas ---- */
  var toggle = document.getElementById("navToggle");
  var links  = document.getElementById("navLinks");
  if(toggle && links){
    function setMenu(open){
      links.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    }
    toggle.addEventListener("click", function(e){
      e.stopPropagation();
      setMenu(toggle.getAttribute("aria-expanded") !== "true");
    });
    links.addEventListener("click", function(e){ if(e.target.tagName === "A") setMenu(false); });
    document.addEventListener("click", function(e){
      if(!links.contains(e.target) && e.target !== toggle) setMenu(false);
    });
    document.addEventListener("keydown", function(e){ if(e.key === "Escape") setMenu(false); });
  }

  /* ---- seccion actual marcada en el menu ---- */
  /* un href="#" o mal formado no debe poder tirar el resto del script */
  function safeQuery(sel){
    try { return sel ? document.querySelector(sel) : null; }
    catch(err){ return null; }
  }
  var navAnchors = Array.prototype.slice.call(document.querySelectorAll(".nav-links a"));
  var watched = navAnchors.map(function(a){
    return { a:a, el:safeQuery(a.getAttribute("href")) };
  }).filter(function(o){ return o.el; });
  if(watched.length && "IntersectionObserver" in window){
    var so = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if(!en.isIntersecting) return;
        watched.forEach(function(o){ o.a.classList.toggle("is-current", o.el === en.target); });
      });
    }, {rootMargin:"-45% 0px -50% 0px"});
    watched.forEach(function(o){ so.observe(o.el); });
  }

  /* ---- ir a una tarjeta de tarea y encenderla (reutilizable) ---- */
  window.highlightTask = function(id){
    var card = document.getElementById(id);
    if(!card) return;
    var host = card.closest("section");
    if(host) Array.prototype.forEach.call(host.querySelectorAll(".rv"), function(el){ el.classList.add("in"); });
    card.scrollIntoView({behavior: reduce ? "auto" : "smooth", block:"center"});
    card.classList.remove("is-hit");
    void card.offsetWidth;          /* reinicia la animacion si se repite el clic */
    card.classList.add("is-hit");
    window.setTimeout(function(){ card.classList.remove("is-hit"); }, 2700);
  };

  /* ---- calculadora rapida dentro de AUD ---- */
  var calc = document.getElementById("calc");
  if(calc){
    var cPeople = document.getElementById("calcPeople");
    var cHours  = document.getElementById("calcHours");
    var cRate   = document.getElementById("calcRate");
    var cPct    = document.getElementById("calcPct");
    var cPctLbl = document.getElementById("calcPctLabel");
    var outH = document.getElementById("calcHoursOut");
    var outM = document.getElementById("calcMonthOut");
    var outY = document.getElementById("calcYearOut");

    var euros = new Intl.NumberFormat("es-ES", {maximumFractionDigits:0});
    var horas = new Intl.NumberFormat("es-ES", {maximumFractionDigits:1});
    var WEEKS_PER_MONTH = 4.345;

    function clamp(v, min, max){ return Math.min(max, Math.max(min, v)); }

    function calcUpdate(){
      var people = clamp(parseFloat(cPeople.value) || 0, 1, 200);
      var hours  = clamp(parseFloat(cHours.value)  || 0, 0, 60);
      var rate   = clamp(parseFloat(cRate.value)   || 0, 0, 200);
      var pct    = clamp(parseFloat(cPct.value)    || 0, 0, 100);

      cPctLbl.textContent = pct + "%";
      cPct.style.setProperty("--fill", pct + "%");

      var hoursMonth = people * hours * WEEKS_PER_MONTH * (pct / 100);
      var moneyMonth = hoursMonth * rate;
      var moneyYear  = moneyMonth * 12;

      outH.textContent = horas.format(hoursMonth) + " h";
      outM.textContent = euros.format(moneyMonth) + " €";
      outY.textContent = euros.format(moneyYear) + " €";
    }

    [cPeople, cHours, cRate, cPct].forEach(function(el){
      el.addEventListener("input", calcUpdate);
    });
    calcUpdate();
  }

  /* ---- reveal on scroll ---- */
  var items = document.querySelectorAll(".rv");
  if(!("IntersectionObserver" in window) || reduce){
    items.forEach(function(el){ el.classList.add("in"); });
  } else {
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(e.isIntersecting){ e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, {threshold:.12, rootMargin:"0px 0px -8% 0px"});
    items.forEach(function(el){ io.observe(el); });
  }

  /* ---- hero: la luz del titular sigue al cursor y el fondo se mueve con el ---- */
  var hero = document.getElementById("hero");
  var aura = document.querySelector(".aura");
  var h1el = hero ? hero.querySelector("h1") : null;

  if(hero && h1el && !reduce){
    var litTimer = null, raf = null, pend = null;

    function lightAt(cx0, cy0){
      var r = h1el.getBoundingClientRect();
      var x = cx0 - r.left, y = cy0 - r.top;
      /* margen generoso: la luz sigue viva cerca del titular, no solo encima */
      if(x < -160 || y < -140 || x > r.width + 160 || y > r.height + 140){
        hero.classList.remove("is-lit");
        return;
      }
      h1el.style.setProperty("--hx", x.toFixed(0) + "px");
      h1el.style.setProperty("--hy", y.toFixed(0) + "px");
      hero.classList.add("is-lit");
    }

    function parallax(cx0, cy0){
      var px = (cx0 / window.innerWidth  - .5) * 2;
      var py = (cy0 / window.innerHeight - .5) * 2;
      if(aura){
      aura.style.setProperty("--px", (px * -22).toFixed(1));
      aura.style.setProperty("--py", (py * -16).toFixed(1));
      }
      hero.style.setProperty("--px", (px * -9).toFixed(1));
      hero.style.setProperty("--py", (py * -7).toFixed(1));
    }

    function frame(){
      raf = null;
      if(!pend) return;
      lightAt(pend.x, pend.y);
      parallax(pend.x, pend.y);
    }

    window.addEventListener("mousemove", function(e){
      pend = {x:e.clientX, y:e.clientY};
      if(!raf) raf = window.requestAnimationFrame(frame);
    }, {passive:true});

    /* en tactil: al tocar, la luz salta a ese punto y luego vuelve a pasear sola */
    hero.addEventListener("touchstart", function(e){
      var t = e.touches[0];
      lightAt(t.clientX, t.clientY);
      parallax(t.clientX, t.clientY);
      clearTimeout(litTimer);
      litTimer = setTimeout(function(){ hero.classList.remove("is-lit"); }, 2600);
    }, {passive:true});
  }

  /* ---- slider de servicios: cristal en profundidad ---- */
  /* todo el bloque queda protegido: si falta algun elemento (por una edicion
     futura del HTML que borre o renombre un id), el slider se desactiva solo
     en vez de detener el resto del script (menu, calculadora, pasos...) */
  var stage = document.getElementById("svcStage");
  if(stage){
  var slides = Array.prototype.slice.call(stage.querySelectorAll(".svc-slide"));
  var tabs   = Array.prototype.slice.call(document.querySelectorAll(".svc-tab"));
  var count  = document.getElementById("svcCount");
  var svcPrev = document.getElementById("svcPrev");
  var svcNext = document.getElementById("svcNext");
  var svcTabsBox = document.querySelector(".svc-tabs");
  var i = 0;

  function pad(n){ return (n<10?"0":"")+n; }

  /* offset mas corto con envoltura circular: -1, 0, 1 */
  function rel(k){
    var n = slides.length, d = k - i;
    if(d >  n/2) d -= n;
    if(d < -n/2) d += n;
    return d;
  }

  function place(){
    slides.forEach(function(s,k){
      var d = rel(k), ghost = s.querySelector(".svc-ghost");
      if(d === 0){
        s.dataset.pos = "active";
        s.style.transform = "translate3d(-50%,0,0) rotateY(0deg) scale(1)";
        s.setAttribute("aria-hidden","false");
        if(ghost) ghost.style.transform = "translateX(0)";
      } else {
        s.dataset.pos = "side";
        var off = window.innerWidth < 760 ? 86 : 66;
        s.style.transform = "translate3d(calc(-50% + " + (d*off) + "%),0,-300px)" +
                            " rotateY(" + (-d*14) + "deg) scale(.84)";
        s.setAttribute("aria-hidden","true");
        if(ghost) ghost.style.transform = "translateX(" + (-d*26) + "px)";
      }
    });
  }

  function measure(){
    var h = 0;
    slides.forEach(function(s){ h = Math.max(h, s.offsetHeight); });
    stage.style.height = h + "px";
  }

  function go(n){
    i = (n + slides.length) % slides.length;
    tabs.forEach(function(t,k){ t.setAttribute("aria-selected", k===i ? "true" : "false"); });
    count.textContent = pad(i+1) + " / " + pad(slides.length);
    place();
  }

  tabs.forEach(function(t,k){ t.addEventListener("click", function(){ go(k); }); });
  if(svcPrev) svcPrev.addEventListener("click", function(){ go(i-1); });
  if(svcNext) svcNext.addEventListener("click", function(){ go(i+1); });

  /* al hacer clic en una tarjeta del lado, pasa al frente */
  slides.forEach(function(s,k){
    s.addEventListener("click", function(e){
      if(s.dataset.pos === "side" && !e.target.closest("a")) go(k);
    });
  });

  /* teclado sobre las pestañas */
  if(svcTabsBox) svcTabsBox.addEventListener("keydown", function(e){
    if(e.key === "ArrowRight"){ e.preventDefault(); go(i+1); tabs[i].focus(); }
    if(e.key === "ArrowLeft"){  e.preventDefault(); go(i-1); tabs[i].focus(); }
  });

  /* reflejo que sigue al cursor sobre la tarjeta activa */
  if(!reduce && window.matchMedia("(hover:hover)").matches){
    slides.forEach(function(s){
      s.addEventListener("mousemove", function(e){
        if(s.dataset.pos !== "active") return;
        var r = s.getBoundingClientRect();
        s.style.setProperty("--mx", ((e.clientX-r.left)/r.width*100).toFixed(1) + "%");
        s.style.setProperty("--my", ((e.clientY-r.top)/r.height*100).toFixed(1) + "%");
      });
      s.addEventListener("mouseleave", function(){
        s.style.setProperty("--mx","50%"); s.style.setProperty("--my","-10%");
      });
    });
  }

  /* arrastrar y deslizar */
  var x0 = null, y0 = null, locked = false;
  function down(x,y){ x0 = x; y0 = y; locked = false; }
  function move(x,y){
    if(x0 === null || locked) return;
    var dx = x - x0, dy = y - y0;
    if(Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy)){
      locked = true; go(dx < 0 ? i+1 : i-1); x0 = null;
    }
  }
  stage.addEventListener("touchstart", function(e){ down(e.touches[0].clientX, e.touches[0].clientY); }, {passive:true});
  stage.addEventListener("touchmove",  function(e){ move(e.touches[0].clientX, e.touches[0].clientY); }, {passive:true});
  stage.addEventListener("touchend",   function(){ x0 = null; });
  stage.addEventListener("pointerdown", function(e){ if(e.pointerType === "mouse") down(e.clientX, e.clientY); });
  stage.addEventListener("pointermove", function(e){ if(e.pointerType === "mouse") move(e.clientX, e.clientY); });
  window.addEventListener("pointerup", function(){ x0 = null; });

  measure(); go(0);
  window.addEventListener("resize", function(){ measure(); place(); });
  if(document.fonts && document.fonts.ready){ document.fonts.ready.then(measure); }
  setTimeout(measure, 600);
  } /* fin del bloque protegido del slider (if(stage)) */

  /* ---- proceso: el foco avanza con el scroll ---- */
  var stepsBox = document.getElementById("steps");
  if(stepsBox){
    var stepEls = Array.prototype.slice.call(stepsBox.querySelectorAll(".step"));
    var fill = document.getElementById("railFill");
    var rail = stepsBox.querySelector(".rail");
    var queued = false;

    function paintSteps(){
      queued = false;
      var focus = window.innerHeight * 0.46;
      var active = -1;
      stepEls.forEach(function(el,k){
        var r = el.getBoundingClientRect();
        if(r.top < focus + 30) active = k;
      });
      /* si la seccion ya esta a la vista, siempre hay un paso encendido */
      var box = stepsBox.getBoundingClientRect();
      if(active < 0 && box.top < window.innerHeight * 0.8) active = 0;

      stepEls.forEach(function(el,k){
        el.classList.toggle("is-on", k === active);
        el.classList.toggle("is-past", active > -1 && k < active);
      });

      var rr = rail.getBoundingClientRect();
      var h = Math.max(0, Math.min(rr.height, focus - rr.top));
      fill.style.height = h.toFixed(1) + "px";
    }

    function queue(){
      if(queued) return;
      queued = true;
      window.requestAnimationFrame(paintSteps);
    }
    window.addEventListener("scroll", queue, {passive:true});
    window.addEventListener("resize", queue);
    paintSteps();
  }

  /* ---- year ---- */
  var yrEl = document.getElementById("yr");
  if(yrEl) yrEl.textContent = new Date().getFullYear();
})();
