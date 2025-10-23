// Modal import
import { showModal } from './ModalManager';

// Window control buttons and their functionality
export function initializeWindowControls() {
  const minimizeBtn = document.getElementById('minimize-btn');
  const maximizeBtn = document.getElementById('maximize-btn');
  const closeBtn = document.getElementById('close-btn');

  // Minimize button functionality
  if (minimizeBtn) {
    minimizeBtn.addEventListener('click', () => {
      console.log('Minimize clicked');
      showModal({
        title: 'Minimize Window',
        content: `
          <div class="space-y-2">
            <p>This button does not have functionality in a web environment.</p>
            <p class="text-xs text-gray-600">Minimize will do nothing in the future.</p>
          </div>
        `,
      });
    });
  }

  // Maximize button functionality
  if (maximizeBtn) {
    maximizeBtn.addEventListener('click', () => {
      console.log('Maximize clicked');
      showModal({
        title: 'Maximize Window',
        content: `
          <div class="space-y-2">
            <p>This button does not have functionality in a web environment.</p>
            <p class="text-xs text-gray-600">Maximize will do nothing in the future.</p>
          </div>
        `,
      });
    });
  }

  // Close button functionality
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      console.log('Close clicked');
      showModal({
        icon: 'fas fa-times-circle',
        title: 'Close Window',
        content: `
          <div class="space-y-2">
            <p>Are you sure you want to close this window?</p>
            <p class="text-xs text-red-600 font-bold">You will be redirected to the start page.</p>
          </div>
        `,
      });

      // On click OK, close window and go to start-page.html
      const modalOkBtn = document.getElementById('modal-ok-btn') as HTMLButtonElement;

      modalOkBtn.onclick = () => {
        window.location.href = '../../pages/start-page.html';
      };
    });
  }
}