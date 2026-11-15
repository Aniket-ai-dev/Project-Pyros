/**
 * VerticalControlsController.js
 * Manages the collapsible right-hand vertical flight and camera navigation controls menu across simulation pages.
 */

export function initVerticalControls() {
  if (typeof window === 'undefined') return;

  const panel = document.querySelector('.pyros-vertical-controls');
  const reopenTab = document.querySelector('.controls-reopen-tab');
  const hideBtn = document.querySelector('.controls-hide-btn');

  if (!panel) return;

  const hideControls = () => {
    panel.classList.add('hidden');
    if (reopenTab) {
      reopenTab.classList.add('visible');
    }
    try {
      sessionStorage.setItem('pyros_controls_hidden', 'true');
    } catch (_) {}
  };

  const showControls = () => {
    panel.classList.remove('hidden');
    if (reopenTab) {
      reopenTab.classList.remove('visible');
    }
    try {
      sessionStorage.setItem('pyros_controls_hidden', 'false');
    } catch (_) {}
  };

  if (hideBtn) {
    hideBtn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      hideControls();
    };
  }

  if (reopenTab) {
    reopenTab.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      showControls();
    };
  }

  // Hotkey toggle: press 'H' or 'h' to toggle controls (when not typing in an input)
  const onKeyDown = (e) => {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
    if (e.key === 'h' || e.key === 'H') {
      if (panel.classList.contains('hidden')) {
        showControls();
      } else {
        hideControls();
      }
    }
  };

  window.removeEventListener('keydown', window.__pyros_controls_keydown);
  window.__pyros_controls_keydown = onKeyDown;
  window.addEventListener('keydown', onKeyDown);

  // Restore previous hidden state if set
  try {
    if (sessionStorage.getItem('pyros_controls_hidden') === 'true') {
      hideControls();
    }
  } catch (_) {}
}
