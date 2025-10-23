export class ModalWindow extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    // Modal Structure
    this.innerHTML = `
      <!-- Modal Overlay -->
      <div id="modal-overlay" class="hidden fixed inset-0 flex items-center justify-center z-50" style="font-family: 'Tahoma', sans-serif; background-color: rgba(0, 0, 0, 0.5);">
        
        <!-- Modal Window -->
        <div id="modal-window" class="bg-[#ECE9D8] border-[3px] border-[#0831D9] rounded-t-lg shadow-2xl w-full max-w-md">
          
          <!-- Modal Title Bar -->
          <div class="bg-gradient-to-b from-[#3C8CF6] via-[#0054E3] to-[#0054E3] px-2 py-1 flex items-center justify-between rounded-t">
            <div class="flex items-center gap-2">
              <i id="modal-icon" class="fas fa-info-circle text-white text-sm"></i>
              <span id="modal-title" class="text-white text-sm font-bold">Information</span>
            </div>
            <button id="modal-close-btn" class="w-5 h-5 hover:cursor-pointer bg-[#E24C4C] hover:bg-[#FF5D5D] active:bg-[#C02020] flex items-center justify-center border border-white rounded-sm">
              <span class="absolute w-2.5 h-0.5 bg-white rotate-45"></span>
              <span class="absolute w-2.5 h-0.5 bg-white -rotate-45"></span>
            </button>
          </div>

          <!-- Modal Content -->
          <div id="modal-content" class="p-4 text-sm">
            <!-- Content will be injected here -->
          </div>

          <!-- Modal Button -->
          <div class="px-4 pb-4 flex justify-end gap-2">
            <button id="modal-ok-btn" class="xp-button font-bold">
              OK
            </button>
          </div>

        </div>

      </div>
    `;
  }
}

// Register the component
customElements.define('modal-window', ModalWindow);