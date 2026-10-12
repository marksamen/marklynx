/* TEST ONLY — Zoom guard REV03 (REV02 blocking logic unchanged; instrumentation only). No layout or viewport changes.
 * Experimental iOS WebKit gesture interception. Does not block one-finger scroll.
 * Accessibility note: disabling pinch zoom can prevent users from enlarging text.
 */
(function () {
  'use strict';
  var stats = window.__mlZoomGuardRev03 = {
    gestureEvents: 0, multiTouchMoves: 0, cancelable: 0,
    nonCancelable: 0, prevented: 0, lastEvent: 'none'
  };
  function record(event) {
    stats.lastEvent = event.type;
    if (event.cancelable) stats.cancelable++;
    else stats.nonCancelable++;
  }
  function blockGesture(event) {
    stats.gestureEvents++;
    record(event);
    if (event.cancelable) {
      event.preventDefault();
      if (event.defaultPrevented) stats.prevented++;
    }
  }
  // iOS Safari/WebKit exposes native gesture events for pinch gestures.
  ['gesturestart', 'gesturechange'].forEach(function (name) {
    document.addEventListener(name, blockGesture, { passive: false, capture: true });
  });
  // Fallback for two-finger touch movement while a page is already scrolling.
  // Single-finger scrolling and normal taps are deliberately left untouched.
  document.addEventListener('touchmove', function (event) {
    if (event.touches && event.touches.length > 1) {
      stats.multiTouchMoves++;
      record(event);
      if (event.cancelable) {
        event.preventDefault();
        if (event.defaultPrevented) stats.prevented++;
      }
    }
  }, { passive: false, capture: true });
})();
