/* ============================================================
   WILLI BARBERSHOP — CAJA DE CONTROL DE TEMÁTICAS
   ------------------------------------------------------------
   TEMA_POR_DEFECTO es el tema que ve TODO el público.
   Para cambiar el tema de todo el mundo se edita SOLO esta
   línea (pedírselo a Tiky) y se republica la página.

   Valores posibles: los de WILLI_TEMAS ('normal', 'halloween').

   El visitante también puede previsualizar un tema sin que
   cambie para los demás, en este orden de prioridad:
     1) ?tema=nombre en la URL (se guarda en su navegador)
     2) la elección guardada en su navegador (localStorage)
     3) TEMA_POR_DEFECTO

   Página interna de cambio (no enlazada desde el front):
   temas.html
   ============================================================ */
var TEMA_POR_DEFECTO = 'halloween';
var WILLI_TEMAS = ['normal', 'halloween'];
