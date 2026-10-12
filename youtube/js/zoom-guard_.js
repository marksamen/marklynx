/* TEST ONLY — ZOOM REV04. Experimental post-gesture snapback; no touch blocking.
 * WebKit may ignore dynamic viewport changes. This is an instrumented experiment,
 * not a guaranteed zoom reset. No layout or CSS changes.
 */
(function () {
  'use strict';
  var vv = window.visualViewport;
  var meta = document.querySelector('meta[name="viewport"]');
  var originalMeta = meta ? meta.getAttribute('content') : '';
  var stats = window.__mlZoomSnapRev04 = {
    loaded: true, baseline: vv ? vv.scale : 1,
    fingers: 0, multiTouchSeen: false, gestureActive: false,
    detected: 0, attempts: 0, successes: 0, failures: 0,
    last: 'waiting', before: null, after: null
  };
  var settleTimer = null, checking = false, orientation = screen.orientation ? screen.orientation.type : (innerWidth > innerHeight ? 'landscape' : 'portrait');
  function scale() { return vv ? vv.scale : 1; }
  function nearBaseline() { return Math.abs(scale() - stats.baseline) < 0.025; }
  function queueCheck() {
    clearTimeout(settleTimer);
    settleTimer = setTimeout(function () {
      if (stats.fingers || stats.gestureActive || checking || !stats.multiTouchSeen) return;
      if (nearBaseline()) { stats.last = 'gesture ended: baseline'; stats.multiTouchSeen = false; return; }
      stats.detected++;
      checking = true;
      stats.before = scale();
      stats.attempts++;
      stats.last = 'reset attempted';
      // Re-assert the existing viewport declaration. WebKit may or may not honor it.
      if (meta) {
        meta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
        // Replacing the node is a second, distinct signal for WebKit to reconsider viewport settings.
        var replacement = meta.cloneNode(true);
        meta.parentNode.replaceChild(replacement, meta);
        meta = replacement;
      } else {
        stats.last = 'no viewport meta';
      }
      setTimeout(function () {
        stats.after = scale();
        if (nearBaseline()) { stats.successes++; stats.last = 'scale restored'; }
        else { stats.failures++; stats.last = 'scale unchanged (WebKit ignored reset)'; }
        stats.multiTouchSeen = false;
        checking = false;
      }, 550);
    }, 350);
  }
  document.addEventListener('touchstart', function (e) {
    stats.fingers = e.touches.length;
    if (stats.fingers > 1) stats.multiTouchSeen = true;
    clearTimeout(settleTimer);
  }, {passive:true, capture:true});
  document.addEventListener('touchmove', function (e) {
    stats.fingers = e.touches.length;
    if (stats.fingers > 1) stats.multiTouchSeen = true;
  }, {passive:true, capture:true});
  ['touchend', 'touchcancel'].forEach(function (name) {
    document.addEventListener(name, function (e) {
      stats.fingers = e.touches.length;
      if (stats.fingers === 0) queueCheck();
    }, {passive:true, capture:true});
  });
  document.addEventListener('gesturestart', function () { stats.gestureActive = true; stats.multiTouchSeen = true; clearTimeout(settleTimer); }, {passive:true, capture:true});
  ['gestureend'].forEach(function (name) {
    document.addEventListener(name, function () { stats.gestureActive = false; queueCheck(); }, {passive:true, capture:true});
  });
  window.addEventListener('orientationchange', function () {
    clearTimeout(settleTimer);
    stats.multiTouchSeen = false;
    stats.last = 'orientation changed';
    setTimeout(function () { stats.baseline = scale(); }, 650);
  }, {passive:true});
  // Restore original viewport declaration on unload only if a future revision modifies it.
  void originalMeta; void orientation;
})();
