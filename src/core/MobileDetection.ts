import { showModal } from './ModalManager';

// Shows device warning overlay
export function showWarning(): void {
  showModal({
    title: 'Unsupported Device',
    content: `
      <div class="space-y-0">
        <p>This application is not optimized for mobile devices or small screens.</p>
        <p class="text-xs text-red-600 font-bold">For the best experience, please use a desktop or laptop with a larger screen.</p>
      </div>
    `,
    icon: 'fas fa-exclamation-triangle',
  });

  const modalCloseBtn = document.getElementById('modal-close-btn') as HTMLButtonElement;
  modalCloseBtn.onclick = () => {
    window.location.href = '../../pages/start-page.html';
  }

  const modalOkBtn = document.getElementById('modal-ok-btn') as HTMLButtonElement;
  modalOkBtn.onclick = () => {
    window.location.href = '../../pages/start-page.html';
  };

  const modalOverlay = document.getElementById('modal-overlay') as HTMLDivElement;
  modalOverlay.style.backgroundColor = 'rgba(255, 255, 255, 1)';
}

// Detects if the device is mobile
export function isMobile(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Detects if the screen size is small
export function isSmallScreen(): boolean {
  return window.innerWidth < 1024 || window.innerHeight < 768;
}


// Initializes mobile detection and warning system
export function initializeMobileDetection(): void {
  if (isMobile() || isSmallScreen()) {
    showWarning();
  }
}