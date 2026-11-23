/* Escáneres 3D · Comportamiento de la interfaz (traducción de los componentes React de Lovable) */
(function () {
  'use strict';

  var SVG_ATTRS = 'xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
  var ICONS = {
    menu: '<path d="M4 5h16"/><path d="M4 12h16"/><path d="M4 19h16"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    check: '<path d="M20 6 9 17l-5-5"/>'
  };
  function icon(name, size) {
    size = size || 24;
    return '<svg ' + SVG_ATTRS + ' width="' + size + '" height="' + size + '" class="lucide lucide-' + name + '">' + ICONS[name] + '</svg>';
  }

  /* ------------------------------------------------------------------
     Header: menú móvil (shell.tsx → Header)
     ------------------------------------------------------------------ */
  function initHeader() {
    var toggle = document.querySelector('[data-menu-toggle]');
    var nav = document.querySelector('[data-main-nav]');
    if (!toggle || !nav) return;
    var open = false;
    function render() {
      nav.className = open ? 'main-nav open' : 'main-nav';
      toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
      toggle.innerHTML = icon(open ? 'x' : 'menu');
    }
    toggle.addEventListener('click', function () { open = !open; render(); });
    nav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { open = false; render(); });
    });
  }

  /* ------------------------------------------------------------------
     Enlaces activos (comportamiento por defecto de <Link> en TanStack Router:
     misma ruta + parámetros de búsqueda del enlace contenidos en la URL actual)
     ------------------------------------------------------------------ */
  function pageName(pathname) {
    var file = pathname.split('/').pop();
    return file === '' ? 'index.html' : file;
  }
  function initActiveLinks() {
    var here = new URL(window.location.href);
    var herePage = pageName(here.pathname);
    document.querySelectorAll('a[href]').forEach(function (a) {
      var raw = a.getAttribute('href');
      if (!raw || raw.charAt(0) === '#' || /^[a-z]+:/i.test(raw)) return;
      var url = new URL(raw, here);
      if (pageName(url.pathname) !== herePage) return;
      var match = true;
      url.searchParams.forEach(function (v, k) { if (here.searchParams.get(k) !== v) match = false; });
      if (!match) return;
      a.classList.add('active');
      a.setAttribute('aria-current', 'page');
      a.setAttribute('data-status', 'active');
    });
  }

  /* ------------------------------------------------------------------
     Formulario de proyecto (contact-form.tsx → ContactForm)
     ------------------------------------------------------------------ */
  var REASONS = ['Orientación', 'Demostración', 'Precios y cotización'];

  function interestFields(selected) {
    return {
      need: selected.indexOf('Orientación') !== -1,
      demo: selected.indexOf('Demostración') !== -1,
      equipment: selected.indexOf('Precios y cotización') !== -1
    };
  }

  // Equivale a desmontar/volver a montar un campo en React: vuelve a su valor por defecto.
  function resetControl(el) {
    if (el.tagName === 'SELECT') {
      var idx = 0;
      for (var i = 0; i < el.options.length; i++) if (el.options[i].defaultSelected) { idx = i; break; }
      el.selectedIndex = idx;
    } else {
      el.value = el.defaultValue;
    }
  }

  function initContactForm(section) {
    var initialReason = section.getAttribute('data-initial-reason') || 'Orientación';
    var initialEquipment = section.getAttribute('data-initial-equipment') || '';

    // Página /contacto: los valores iniciales llegan por la URL (?motivo=…&equipo=…)
    if (section.hasAttribute('data-from-url')) {
      var params = new URLSearchParams(window.location.search);
      var motivo = params.get('motivo');
      var equipo = params.get('equipo');
      if (motivo && REASONS.indexOf(motivo) !== -1) initialReason = motivo;
      if (equipo !== null) initialEquipment = equipo;
    }

    var form = section.querySelector('[data-project-form]');
    var success = section.querySelector('[data-form-success]');
    var back = section.querySelector('[data-form-back]');
    var errorEl = section.querySelector('[data-form-error]');
    var submitBtn = section.querySelector('[data-form-submit]');
    var options = Array.prototype.slice.call(section.querySelectorAll('.reason-option'));
    var blocks = {
      need: section.querySelector('[data-field="need"]'),
      demo: section.querySelector('[data-field="demo"]'),
      equipment: section.querySelector('[data-field="equipment"]')
    };

    // Valor por defecto del selector de equipo (defaultValue={initialEquipment})
    var eqSelect = blocks.equipment.querySelector('select');
    var matched = false;
    Array.prototype.forEach.call(eqSelect.options, function (o) {
      var isDefault = o.value === initialEquipment && (initialEquipment !== '' || o.value === '');
      if (isDefault && !matched) { o.defaultSelected = true; matched = true; } else { o.defaultSelected = false; }
    });

    var selected = [initialReason];
    var submitted = false;

    function setBlock(block, show, forceFresh) {
      var wasHidden = block.hidden;
      block.hidden = !show;
      block.querySelectorAll('input, select, textarea').forEach(function (el) {
        el.disabled = !show;
        if (show && (wasHidden || forceFresh)) resetControl(el);
      });
    }

    function render(forceFresh) {
      options.forEach(function (label) {
        var input = label.querySelector('input');
        var on = selected.indexOf(input.value) !== -1;
        input.checked = on;
        label.className = 'reason-option' + (on ? ' selected' : '');
        label.querySelector('.reason-check').innerHTML = on ? icon('check', 12) : '';
      });
      var f = interestFields(selected);
      errorEl.hidden = selected.length !== 0;
      setBlock(blocks.need, f.need, forceFresh);
      setBlock(blocks.demo, f.demo, forceFresh);
      setBlock(blocks.equipment, f.equipment || !!initialEquipment, forceFresh);
      submitBtn.disabled = !selected.length;
      form.hidden = submitted;
      success.hidden = !submitted;
    }

    options.forEach(function (label) {
      var input = label.querySelector('input');
      input.addEventListener('change', function () {
        var r = input.value;
        var i = selected.indexOf(r);
        if (i !== -1) selected.splice(i, 1); else selected.push(r);
        render(false);
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (selected.length) { submitted = true; render(false); }
    });

    back.addEventListener('click', function () {
      submitted = false;
      form.reset();        // el formulario se vuelve a montar vacío
      render(true);        // conserva los motivos seleccionados
    });

    render(true);
  }

  document.addEventListener('DOMContentLoaded', function () {
    initActiveLinks();
    initHeader();
    document.querySelectorAll('[data-contact-form]').forEach(initContactForm);
  });
})();
