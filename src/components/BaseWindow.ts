export class BaseWindow extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    // Attributes
    const title = this.getAttribute('title') || 'Untitled';
    
    // Slot contents
    const menuLeft = this.querySelector('[slot="menu-left"]')?.innerHTML || '';
    const toolbox = this.querySelector('[slot="toolbox"]')?.innerHTML || '';
    const panels = this.querySelector('[slot="panels"]')?.innerHTML || '';
    
    // Window Structure
    this.innerHTML = `
      <div class="max-w-7xl mx-auto flex flex-col h-[calc(100vh-2rem)] border-3 border-[#0831D9] rounded-t-lg overflow-hidden window-open-animation">
        
        <!-- Title -->
        <div class="bg-gradient-to-b from-[#3C8CF6] via-[#0054E3] to-[#0054E3] px-2 py-1 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <img src="../../public/icons/Pepe.svg" alt="icon" class="w-4 h-4" />
            <span class="text-white text-sm font-bold">${title}</span>
          </div>

          <!-- Navigate buttons -->
          <div class="flex gap-1 flex-wrap">
            <button id="minimize-btn" class="w-5 h-5 hover:cursor-pointer hover:bg-[#3C8CF6] active:bg-[#002C7A] flex items-center justify-center border border-white rounded-sm">
              <span class="w-2 h-0.5 bg-white mt-2"></span>
            </button>
            <button id="maximize-btn" class="w-5 h-5 hover:cursor-pointer hover:bg-[#3C8CF6] active:bg-[#002C7A] flex items-center justify-center border border-white rounded-sm">
              <span class="w-2.5 h-2.5 border border-white"></span>
            </button>
            <button id="close-btn" class="w-5 h-5 hover:cursor-pointer bg-[#E24C4C] hover:bg-[#FF5D5D] active:bg-[#C02020] flex items-center justify-center border border-white rounded-sm">
              <span class="absolute w-2.5 h-0.5 bg-white rotate-45"></span>
              <span class="absolute w-2.5 h-0.5 bg-white -rotate-45"></span>
            </button>
          </div>
        </div>

        <!-- Menu Bar -->
        <div class="bg-[#ECE9D8] border-b border-[#808080] px-1 py-2">
          <div class="flex justify-between text-xs flex-wrap">
            
            <!-- Left menu buttons slot -->
            <div class="flex gap-1 flex-wrap">
              ${menuLeft}
            </div>
            
            <!-- Right menu buttons -->
            <div class="flex gap-1 flex-wrap">
              <button id="clear-btn" class="xp-button">Clear Workspace</button>
              <button id="start-page-btn" class="xp-button">Start Page</button>
              <button id="help-btn" class="xp-button">Help</button>
            </div>
          </div>
        </div>

        <!-- Main Content -->
        <div class="flex flex-1 bg-[#ECE9D8] overflow-hidden">
          
          <!-- Toolbox slot -->
          ${toolbox}
          
          <!-- Canvas -->
          <div class="flex-1 bg-[#808080] p-2 overflow-auto">
            <canvas 
              id="canvas"
              width="1000"
              height="600"
              class="bg-white cursor-crosshair"
              aria-label="Rysunkowe pole robocze"
            ></canvas>
          </div>
        </div>

        <!-- Bottom Panels slot -->
        ${panels}

        <!-- Status Bar -->
        <div class="bg-[#ECE9D8] border-t border-[#808080] px-2 py-1">
          <div class="flex items-center justify-between text-xs">
            <span id="status-text"></span>
            <span id="cursor-position" class="inline text-[10px]">0, 0</span>
          </div>
        </div>

      </div>

    `;
  }
}

// Register the component
customElements.define('base-window', BaseWindow);