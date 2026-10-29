/* ============================================================
   MÓDULO DE TEMÁTICAS — New Age Professional Services
   ------------------------------------------------------------
   El tema activo de la página se decide EN EL SERVIDOR
   (Supabase, tabla temas_sitio): cambiarlo una vez desde el
   panel (temas.html) aplica a TODO el público, en todos los
   navegadores. Nada de temas guardados en un solo navegador.

   INSTALACIÓN en el <head> de la página, SIN async ni defer
   (tiene que correr antes de pintar para que no parpadee):

     <script>
     window.MODULO_TEMAS = {
       sitio: 'willi-barbershop',              // fila en temas_sitio
       defecto: 'halloween',                   // si el servidor no responde
       temas: ['normal', 'halloween'],         // temas válidos del sitio
       supabaseUrl: 'https://ildviocjmqcyfknzlyrm.supabase.co',
       anonKey: 'sb_publishable_b6X_FUcoooXAvUWI6UXT-g_Zu4ZHi0g'
     };
     </script>
     <script src="modulo-temas.js"></script>

   La anon/publishable key es PÚBLICA por diseño (solo permite
   LEER el tema y llamar a la RPC protegida por clave). La misma
   del portal de agentes: ~/workspace/portal-agentes/js/config.js.
   La CLAVE del panel NUNCA va en el código: la pide el panel
   y la verifica el servidor (función fijar_tema).

   COMPORTAMIENTO
     1) Arranque instantáneo: aplica ?tema= (preview) o la
        última respuesta del servidor guardada en caché local
        (localStorage 'mt-cache-<sitio>') o el tema por defecto.
     2) Consulta el servidor; si el tema es válido y difiere,
        lo aplica (data-tema en <html>) y actualiza la caché.
     3) ?tema=nombre sigue existiendo SOLO como preview local:
        manda en esa carga y NO escribe nada en el servidor.
     4) Si la red falla o el SQL aún no se corrió: silencio.
        La página se queda con el defecto/caché, sin errores.
   ============================================================ */
(function () {
  'use strict';

  var cfg = window.MODULO_TEMAS || {};
  var SITIO   = cfg.sitio || 'default';
  var DEFECTO = cfg.defecto || 'normal';
  var TEMAS   = cfg.temas || ['normal'];
  var BASE    = (cfg.supabaseUrl || '').replace(/\/+$/, '');
  var KEY     = cfg.anonKey || '';
  var CACHE   = 'mt-cache-' + SITIO;

  function valido(t) { return !!t && TEMAS.indexOf(t) !== -1; }
  function aplicar(t) {
    if (valido(t)) document.documentElement.setAttribute('data-tema', t);
  }
  function leerCache() {
    try {
      var t = localStorage.getItem(CACHE);
      return valido(t) ? t : null;
    } catch (e) { return null; }
  }
  function guardarCache(t) {
    try { if (valido(t)) localStorage.setItem(CACHE, t); } catch (e) {}
  }
  function preview() {
    try {
      var q = new URLSearchParams(location.search).get('tema');
      return valido(q) ? q : null;
    } catch (e) { return null; }
  }
  function cabeceras(extra) {
    var h = { 'apikey': KEY, 'Authorization': 'Bearer ' + KEY };
    if (extra) for (var k in extra) h[k] = extra[k];
    return h;
  }

  /* ---------- 1) Arranque sin parpadeo ---------- */
  var pv = preview();
  aplicar(pv || leerCache() || DEFECTO);

  /* ---------- 2) Tema del servidor ---------- */
  function consultarServidor() {
    if (!BASE || !KEY || typeof fetch !== 'function') return Promise.resolve(null);
    return fetch(BASE + '/rest/v1/temas_sitio?sitio=eq.' + encodeURIComponent(SITIO) + '&select=tema',
                 { headers: cabeceras(), cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (filas) {
        if (!filas || !filas.length) return null;
        var t = filas[0].tema;
        if (!valido(t)) return null;
        guardarCache(t);
        if (!preview()) aplicar(t);   // un preview manda en su propia carga
        return t;
      })
      .catch(function () { return null; });  // silencio: se queda defecto/caché
  }

  /* ---------- 3) API pública (panel) ---------- */
  window.ModuloTemas = {
    config: cfg,

    /** Tema que ve TODO el público, leído del servidor (o null si no responde). */
    actual: function () { return consultarServidor(); },

    /**
     * Fija el tema para TODO el público.
     * Llama a la RPC fijar_tema; el servidor verifica la clave.
     * Devuelve una Promise con el tema fijado; rechaza con el
     * mensaje del servidor si la clave es incorrecta.
     */
    fijar: function (tema, clave) {
      if (!valido(tema)) return Promise.reject(new Error('tema no válido: ' + tema));
      if (!BASE || !KEY) return Promise.reject(new Error('módulo sin configurar'));
      return fetch(BASE + '/rest/v1/rpc/fijar_tema', {
        method: 'POST',
        headers: cabeceras({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ p_sitio: SITIO, p_tema: tema, p_clave: clave || '' })
      }).then(function (r) {
        return r.json().catch(function () { return null; }).then(function (data) {
          if (!r.ok) {
            var msg = (data && (data.message || data.hint)) || ('HTTP ' + r.status);
            throw new Error(msg);
          }
          guardarCache(tema);
          return data; // el tema fijado, tal como lo devolvió el servidor
        });
      });
    },

    /** Aplica un tema solo en esta página (preview local). */
    aplicar: aplicar
  };

  /* ---------- 4) Al cargar: sincronizar con el servidor ---------- */
  consultarServidor();
})();
