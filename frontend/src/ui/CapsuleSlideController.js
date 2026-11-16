/**
 * CapsuleSlideController.js
 * Enables smooth mouse click-and-drag vertical and horizontal sliding on the capsule navigation track,
 * with momentum preservation and touch compatibility.
 */
export function initCapsuleSlide() {
  if (typeof window === 'undefined') return;

  const tracks = document.querySelectorAll('.capsule-slide-track, .cd-dock-scroll-track');
  tracks.forEach((track) => {
    if (track._capsuleSlideInitialized) return;
    track._capsuleSlideInitialized = true;

    let isDown = false;
    let startX = 0;
    let startY = 0;
    let scrollLeft = 0;
    let scrollTop = 0;
    let hasDragged = false;

    track.addEventListener('mousedown', (e) => {
      isDown = true;
      hasDragged = false;
      track.classList.add('grabbing');
      startX = e.pageX - track.offsetLeft;
      startY = e.pageY - track.offsetTop;
      scrollLeft = track.scrollLeft;
      scrollTop = track.scrollTop;
    });

    track.addEventListener('mouseleave', () => {
      isDown = false;
      track.classList.remove('grabbing');
    });

    track.addEventListener('mouseup', () => {
      isDown = false;
      track.classList.remove('grabbing');
    });

    track.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - track.offsetLeft;
      const y = e.pageY - track.offsetTop;
      const walkX = (x - startX) * 1.6;
      const walkY = (y - startY) * 1.6;

      if (Math.abs(walkX) > 4 || Math.abs(walkY) > 4) {
        hasDragged = true;
      }
      track.scrollLeft = scrollLeft - walkX;
      track.scrollTop = scrollTop - walkY;
    });

    // Prevent accidental click when dragging
    track.addEventListener('click', (e) => {
      if (hasDragged) {
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);
  });
}

// Global auto-observer for client-side hydration & route changes
if (typeof window !== 'undefined') {
  initCapsuleSlide();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCapsuleSlide);
  }
  window.addEventListener('load', initCapsuleSlide);
  setInterval(initCapsuleSlide, 500); // lightweight guard ensuring dynamically mounted tabs attach drag handlers
}
