import { showModal } from './ModalManager';

// Clear workspace action
export function handleClearWorkspace(clearCallback: () => void) {
  showModal({
    title: 'Clear Workspace',
    content: `
      <div class="space-y-0">
        <p>Are you sure you want to clear all shapes from the workspace?</p>
        <p class="text-xs text-red-600 font-bold">This action cannot be undone!</p>
      </div>
    `,
    icon: 'fas fa-exclamation-triangle',
  });
  
  const modalOkBtn = document.getElementById('modal-ok-btn') as HTMLButtonElement;
  const modalOverlay = document.getElementById('modal-overlay') as HTMLDivElement;
  modalOkBtn.onclick = () => {
    clearCallback();
    modalOverlay.classList.add('hidden');
  };
}

// Start page action
export function handleStartPage() {
  showModal({
    title: 'Start Page',
    content: `
      <div class="space-y-0">
        <p>Do you want to return to the main page?</p>
        <p class="text-xs font-bold text-red-600">Current drawing will be lost if not saved.</p>
      </div>
    `,
    icon: 'fas fa-home',
  });
  
  const modalOkBtn = document.getElementById('modal-ok-btn') as HTMLButtonElement;
  modalOkBtn.onclick = () => {
    window.location.href = '../../pages/start-page.html';
  };
}


