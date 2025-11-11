/**
 * Submit Modal Module
 * Handles the task selection modal when submitting code
 */

// Task names - modify this array to add/remove tasks dynamically
// Each task should have an id and a name
let TASK_NAMES: Array<{ id: string; name: string }> = [
  { id: "task1", name: "Tarefa 1" },
  { id: "task2", name: "Tarefa 2" },
  { id: "task3", name: "Tarefa 3" },
  { id: "task4", name: "Tarefa 4" }
];

/**
 * Set the task names dynamically
 * Call this function before showing the modal if you want to change the tasks
 * @param tasks - Array of task objects with id and name
 */
export function setTaskNames(tasks: Array<{ id: string; name: string }>): void {
  TASK_NAMES = tasks;
  console.log('[SubmitModal] Task names updated:', TASK_NAMES);
}

interface SubmitModalOptions {
  onSubmit: (taskId: string, taskName: string) => void;
}

class SubmitModal {
  private modal: HTMLElement | null = null;
  private options: SubmitModalOptions;

  constructor(options: SubmitModalOptions) {
    this.options = options;
    this.createModal();
    this.attachEventListeners();
  }

  /**
   * Create the modal HTML and inject it into the page
   */
  private createModal(): void {
    // Generate option elements dynamically from TASK_NAMES
    const optionsHTML = TASK_NAMES.map(task => 
      `<option value="${task.id}">${task.name}</option>`
    ).join('');
    
    const modalHTML = `
      <div id="submit-modal" class="obi-modal" role="dialog" aria-modal="true" aria-labelledby="submit-title" aria-hidden="true" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 10000;">
        <div class="obi-modal__backdrop" data-dismiss="modal" tabindex="-1" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.5); z-index: 10001;"></div>
        <div class="obi-modal__dialog" role="document" style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 10002; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); min-width: 300px; width: auto; max-width: 90%;">
          <div class="obi-modal__header" style="margin-bottom: 20px; position: relative;">
            <h2 id="submit-title" style="margin: 0; font-size: 1.5rem; color: #333; padding-right: 30px;">Submeter Solução</h2>
            <button id="submit-close-btn" class="obi-modal__close" aria-label="Fechar" style="position: absolute; top: 0; right: 0; background: none; border: none; font-size: 1.5rem; cursor: pointer; padding: 0; color: #666; line-height: 1;">✕</button>
          </div>
          <div class="obi-modal__body">
            <div style="margin-bottom: 20px;">
              <label for="task-select" style="display: block; margin-bottom: 8px; font-weight: 600; color: #333;">Tarefa:</label>
              <select id="task-select" style="width: 100%; padding: 10px; font-size: 14px; border: 1px solid #ccc; border-radius: 4px; background-color: white; color: #333; appearance: auto; -webkit-appearance: menulist; -moz-appearance: menulist; cursor: pointer; height: auto; min-height: 40px; display: block;">
                ${optionsHTML}
              </select>
            </div>
          </div>
          <div class="obi-modal__footer" style="display: flex; justify-content: flex-end; gap: 10px;">
            <button id="submit-cancel-btn" class="obi-modal__action" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; white-space: nowrap;">Cancelar</button>
            <button id="submit-confirm-btn" class="obi-modal__action" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; white-space: nowrap;">Submeter</button>
          </div>
        </div>
        <span class="obi-modal__sentry" tabindex="0" aria-hidden="true"></span>
      </div>
    `;

    // Insert modal into the page
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    this.modal = document.getElementById('submit-modal');
    
    console.log('[SubmitModal] Modal element created with', TASK_NAMES.length, 'tasks');
  }

  /**
   * Show the modal
   */
  public show(): void {
    console.log('[SubmitModal] show() called');
    console.log('[SubmitModal] Modal element:', this.modal);
    
    if (!this.modal) {
      console.error('[SubmitModal] Modal element is null!');
      return;
    }
    
    console.log('[SubmitModal] Setting aria-hidden to false');
    this.modal.setAttribute('aria-hidden', 'false');
    
    console.log('[SubmitModal] Setting display to block');
    this.modal.style.display = 'block';
    
    console.log('[SubmitModal] Modal computed style:', window.getComputedStyle(this.modal));
    console.log('[SubmitModal] Modal offsetParent:', this.modal.offsetParent);
    console.log('[SubmitModal] Modal offsetWidth:', this.modal.offsetWidth);
    console.log('[SubmitModal] Modal offsetHeight:', this.modal.offsetHeight);
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    
    // Focus on the select element
    setTimeout(() => {
      console.log('[SubmitModal] Setting focus on select');
      const selectElement = document.getElementById('task-select') as HTMLSelectElement;
      if (selectElement) {
        selectElement.focus();
        console.log('[SubmitModal] Focus set successfully');
      } else {
        console.error('[SubmitModal] Select element not found!');
      }
    }, 100);
  }

  /**
   * Hide the modal
   */
  private hide(): void {
    console.log('[SubmitModal] hide() called');
    
    if (!this.modal) return;
    
    this.modal.setAttribute('aria-hidden', 'true');
    this.modal.style.display = 'none';
    
    // Restore body scroll
    document.body.style.overflow = '';
    
    console.log('[SubmitModal] Modal hidden');
  }

  /**
   * Handle submit confirmation
   */
  private handleSubmitConfirm(): void {
    const selectElement = document.getElementById('task-select') as HTMLSelectElement;
    if (!selectElement) return;

    const selectedTask = selectElement.value;
    const selectedTaskName = selectElement.selectedOptions[0]?.text || '';
    
    console.log('[SubmitModal] Submitting task:', selectedTask, selectedTaskName);
    
    // Call the callback function provided during initialization
    this.options.onSubmit(selectedTask, selectedTaskName);
    
    this.hide();
  }

  /**
   * Attach event listeners to modal buttons
   */
  private attachEventListeners(): void {
    // Close button
    const closeBtn = document.getElementById('submit-close-btn');
    closeBtn?.addEventListener('click', () => this.hide());
    
    // Cancel button
    const cancelBtn = document.getElementById('submit-cancel-btn');
    cancelBtn?.addEventListener('click', () => this.hide());
    
    // Confirm button
    const confirmBtn = document.getElementById('submit-confirm-btn');
    confirmBtn?.addEventListener('click', () => this.handleSubmitConfirm());
    
    // Backdrop click to close
    const backdrop = this.modal?.querySelector('.obi-modal__backdrop');
    backdrop?.addEventListener('click', () => this.hide());
    
    // ESC key to close
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape' && this.modal?.getAttribute('aria-hidden') === 'false') {
        this.hide();
      }
    });
  }
}

/**
 * Initialize the submit modal functionality
 * Call this function from your editor.ts after DOM is ready
 */
export function initSubmitModal(): void {
  // Ensure the editor and Monaco are fully initialized before creating the modal
  const checkEditorReady = () => {
    if ((window as any).editor && (window as any).monaco) {
      // Editor is ready, now we can safely create the modal
      createSubmitModalInstance();
    } else {
      // Editor not ready yet, check again in a bit
      setTimeout(checkEditorReady, 50);
    }
  };
  
  checkEditorReady();
}

/**
 * Internal function to create the actual modal instance
 */
function createSubmitModalInstance(): void {
  // Create the modal instance
  const submitModal = new SubmitModal({
    onSubmit: (taskId: string, taskName: string) => {
      // This is where you integrate with your existing submission logic
      console.log('[Submit] Task selected:', taskId, taskName);
      
      // TODO: Integrate with your existing CMS submission code
      // You can call your existing submission functions here
      // For example, if you have a function like:
      // cmsTestSend(taskId, window.editor.getValue(), ...);
      
      // Show a status message
      if ((window as any).App?.Status) {
        (window as any).App.Status.setForCurrent(
          `Submetendo para ${taskName}...`,
          { spinning: true }
        );
      }
      
      // Example: You might want to call your existing submit logic here
      // handleActualSubmission(taskId, taskName);
    }
  });

  // Attach to the submit button
  const submitBtn = document.getElementById('submit-btn');
  if (!submitBtn) {
    console.error('[SubmitModal] Submit button not found');
    return;
  }

  submitBtn.addEventListener('click', (e: Event) => {
    e.preventDefault();
    submitModal.show();
  });

  console.log('[SubmitModal] Initialized successfully');
}

/**
 * Example function showing how to integrate with actual submission
 * You would replace this with your actual CMS submission logic
 */
export function handleActualSubmission(taskId: string, taskName: string): void {
  // Get current code from editor
  const code = (window as any).editor?.getValue() || '';
  const language = (document.getElementById('language-select') as HTMLSelectElement)?.value || 'cpp';
  
  console.log('[Submit] Preparing submission:', {
    taskId,
    taskName,
    language,
    codeLength: code.length
  });
  
  // Here you would integrate with your CMS module
  // Example (based on your cms.ts import):
  // cmsTestSend(taskId, code, language).then(response => {
  //   // Handle success
  // }).catch(error => {
  //   // Handle error
  // });
}
