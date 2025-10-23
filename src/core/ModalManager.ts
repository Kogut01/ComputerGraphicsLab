// Modal elements
const modalIcon = document.getElementById('modal-icon') as HTMLElement;
const modalTitle = document.getElementById('modal-title') as HTMLSpanElement;
const modalCloseBtn = document.getElementById('modal-close-btn') as HTMLButtonElement;
const modalContent = document.getElementById('modal-content') as HTMLDivElement;
const modalOkBtn = document.getElementById('modal-ok-btn') as HTMLButtonElement;

const modalWindow = document.getElementById('modal-window') as HTMLDivElement;
const modalOverlay = document.getElementById('modal-overlay') as HTMLDivElement;

// Modal interface
interface ModalOptions {
  icon?: string;
  title: string;
  content: string;
}

// Show modal
export function showModal(options: ModalOptions) {
  modalIcon.className = `${options.icon || 'fas fa-info-circle'} text-white text-sm`;
  modalTitle.textContent = options.title;
  modalContent.innerHTML = options.content;
  
  modalOverlay.classList.remove('hidden');
  modalWindow.style.animation = 'windowOpen 0.2s ease-out';
}

// Hide modal
export function hideModal() {
  modalOverlay.classList.add('hidden');
}

// Event listeners
modalCloseBtn.addEventListener('click', hideModal);
modalOkBtn.addEventListener('click', hideModal);

// Close on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    hideModal();
  }
});