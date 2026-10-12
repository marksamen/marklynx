/* TEST ONLY — Zoom guard REV02. No layout or viewport changes.
 * Experimental iOS WebKit gesture interception. Does not block one-finger scroll.
 * Accessibility note: disabling pinch zoom can prevent users from enlarging text.
 */
(function () {
  'use strict';
  function blockGesture(event) {
    if (event.cancelable) event.preventDefault();
  }
  // iOS Safari/WebKit exposes native gesture events for pinch gestures.
  ['gesturestart', 'gesturechange'].forEach(function (name) {
    document.addEventListener(name, blockGesture, { passive: false, capture: true });
  });
  // Fallback for two-finger touch movement while a page is already scrolling.
  // Single-finger scrolling and normal taps are deliberately left untouched.
  document.addEventListener('touchmove', function (event) {
    if (event.touches && event.touches.length > 1 && event.cancelable) {
      event.preventDefault();
    }
  }, { passive: false, capture: true });
})();
