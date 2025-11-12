/**
 * Submit Modal Module
 * Handles the task selection modal when submitting code
 */

import { cmsTaskList, cmsSubmit } from './cms';

// Task names - modify this array to add/remove tasks dynamically
// Each task should have an id and a name
let TASK_NAMES: Array<{ id: string; name: string }> = [
  { id: "task1", name: "Tarefa 1" },
  { id: "task2", name: "Tarefa 2" },
  { id: "task3", name: "Tarefa 3" },
  { id: "task4", name: "Tarefa 4" }
];

// Store the modal instance globally
let submitModalInstance: SubmitModal | null = null;

/**
 * Set the task names dynamically
 * Call this function before showing the modal if you want to change the tasks
 * @param tasks - Array of task objects with id and name
 */
export function setTaskNames(tasks: Array<{ id: string; name: string }>): void {
  TASK_NAMES = tasks;
  console.log('[SubmitModal] Task names updated:', TASK_NAMES);
  
  // If modal already exists, recreate it with new tasks
  if (submitModalInstance) {
    submitModalInstance.updateTasks(tasks);
  }
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
   * Update the task list in an existing modal
   */
  public updateTasks(tasks: Array<{ id: string; name: string }>): void {
    console.log('[SubmitModal] Updating tasks in existing modal:', tasks);
    
    const selectElement = document.getElementById('task-select') as HTMLSelectElement;
    if (!selectElement) {
      console.warn('[SubmitModal] Select element not found, recreating modal');
      this.destroyModal();
      this.createModal();
      this.attachEventListeners();
      return;
    }
    
    // Clear existing options
    selectElement.innerHTML = '';
    
    // Add new options
    tasks.forEach(task => {
      const option = document.createElement('option');
      option.value = task.id;
      option.textContent = task.name;
      selectElement.appendChild(option);
    });
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
   * Destroy the modal element
   */
  private destroyModal(): void {
    if (this.modal) {
      this.modal.remove();
      this.modal = null;
    }
  }

  /**
   * Show the modal
   */
  public show(): void {
    console.log('[SubmitModal] show() called');
    console.log('[SubmitModal] Modal exists:', !!this.modal);
    console.log('[SubmitModal] Modal ID:', this.modal?.id);

    if (!this.modal) {
      console.error('[SubmitModal] Modal element is null! Recreating...');
      this.createModal();
      this.attachEventListeners();
      if (!this.modal) {
        console.error('[SubmitModal] Failed to create modal!');
        return;
      }
    }

    console.log('[SubmitModal] Setting modal visible');
    this.modal.setAttribute('aria-hidden', 'false');
    this.modal.style.display = 'block';

    // Verify it's actually visible
    const computedStyle = window.getComputedStyle(this.modal);
    console.log('[SubmitModal] Modal display:', computedStyle.display);
    console.log('[SubmitModal] Modal visibility:', computedStyle.visibility);
    console.log('[SubmitModal] Modal z-index:', computedStyle.zIndex);

    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    // Focus on the select element
    setTimeout(() => {
      const selectElement = document.getElementById('task-select') as HTMLSelectElement;
      if (selectElement) {
        selectElement.focus();
        console.log('[SubmitModal] Focus set on select');
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
 * Get the submit callback handler
 */
function getSubmitHandler() {
  return async (taskId: string, taskName: string) => {
    console.log('[SubmitModal] Submitting to task:', taskId, taskName);
    
    // Get current code from editor
    const editor = (window as any).editor;
    if (!editor) {
      console.error('[SubmitModal] Editor not available!');
      alert('Editor não está disponível. Por favor, recarregue a página.');
      return;
    }
    
    const code = editor.getValue() || '';
    if (!code || code.trim().length === 0) {
      console.warn('[SubmitModal] Code is empty');
      alert('Por favor, escreva algum código antes de submeter.');
      return;
    }
    
    const languageSelect = document.getElementById('language-select') as HTMLSelectElement;
    const language = languageSelect?.value || 'cpp';
    
    // Determine file extension based on language
    let languageExtension = '.cpp';
    if (language === 'python') {
      languageExtension = '.py';
    } else if (language === 'java') {
      languageExtension = '.java';
    } else if (language === 'cpp') {
      languageExtension = '.cpp';
    }
    
    console.log('[SubmitModal] Submission details:', {
      taskId,
      taskName,
      language,
      languageExtension,
      codeLength: code.length
    });
    
    // Show status message
    if ((window as any).App?.Status) {
      (window as any).App.Status.setForCurrent(
        `Submetendo ${taskName}...`,
        { spinning: true }
      );
    }
    
    try {
      // Call the CMS submit function
      const result = await cmsSubmit(taskId, code, language, languageExtension);
      
      if (result.success) {
        console.log('[SubmitModal] Submission successful!', result);
        
        // Update status
        if ((window as any).App?.Status) {
          (window as any).App.Status.setForCurrent(
            `✓ ${taskName} submetido com sucesso!`,
            { spinning: false }
          );
        }
        
        // If there's a redirect, you might want to handle it
        if (result.redirect) {
          console.log('[SubmitModal] Redirect to:', result.redirect);
          // Optionally navigate to the redirect location
          // window.location.href = result.redirect;
        }
      } else {
        console.error('[SubmitModal] Submission failed:', result);
        
        // Update status with error
        if ((window as any).App?.Status) {
          (window as any).App.Status.setForCurrent(
            `Erro na submissão`,
            { spinning: false }
          );
        }
        
        // Show error alert
        alert(`Erro ao submeter: ${result.error || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('[SubmitModal] Submission error:', error);
      
      // Update status with error
      if ((window as any).App?.Status) {
        (window as any).App.Status.setForCurrent(
          `Erro na submissão`,
          { spinning: false }
        );
      }
      
      alert(`Erro ao submeter: ${error.message}`);
    }
  };
}

/**
 * Internal function to create the actual modal instance
 */
function createSubmitModalInstance(): void {
  console.log('[SubmitModal] Creating modal instance');
  
  // Create the modal instance
  submitModalInstance = new SubmitModal({
    onSubmit: getSubmitHandler()
  });

  // Attach to the submit button with retry logic
  const attachSubmitListener = () => {
    const submitBtn = document.getElementById('submit-btn');
    if (!submitBtn) {
      console.error('[SubmitModal] Submit button not found in DOM');
      console.log('[SubmitModal] Available buttons:', 
        Array.from(document.querySelectorAll('button')).map(b => b.id || b.className)
      );
      return false;
    }

    console.log('[SubmitModal] Attaching listener to submit button');
    submitBtn.addEventListener('click', (e: Event) => {
      e.preventDefault();
      console.log('[SubmitModal] Submit button clicked');
      if (submitModalInstance) {
        submitModalInstance.show();
      } else {
        console.error('[SubmitModal] Modal instance is null!');
      }
    });

    console.log('[SubmitModal] Initialized successfully');
    return true;
  };

  // Try to attach immediately
  if (!attachSubmitListener()) {
    // If button not found, wait for DOM to be ready
    console.log('[SubmitModal] Waiting for DOM to be ready...');
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', attachSubmitListener);
    } else {
      // DOM is ready but button still not found - try one more time after a delay
      setTimeout(attachSubmitListener, 100);
    }
  }
}

/**
 * Initialize the submit modal with a pre-fetched task list
 * This is the RECOMMENDED way to initialize when you already have tasks
 * (e.g., from exam gate polling)
 * 
 * @param tasks - Array of task objects with id and name
 */
export function initSubmitModalWithTaskList(tasks: Array<{ id: string; name: string }>): void {
  console.log('[SubmitModal] initSubmitModalWithTaskList called with tasks:', tasks);
  
  // Validate tasks
  if (!tasks || tasks.length === 0) {
    console.error('[SubmitModal] No tasks provided!');
    return;
  }
  
  // Set the task names
  setTaskNames(tasks);
  console.log('[SubmitModal] Task names set, creating modal instance...');
  
  // Create the modal instance
  createSubmitModalInstance();
}

/**
 * Initialize the submit modal by fetching tasks from CMS
 * This is used for development mode (when exam gate is disabled)
 * 
 * For exam mode, use initSubmitModalWithTaskList() instead
 */
export async function initSubmitModalWithTasks(): Promise<void> {
  console.log('[SubmitModal] Loading tasks from CMS API...');
  
  try {
    const tasks = await cmsTaskList();
    
    if (tasks && tasks.length > 0) {
      console.log('[SubmitModal] Tasks loaded successfully:', tasks);
      initSubmitModalWithTaskList(tasks);
    } else {
      console.warn('[SubmitModal] No tasks returned from API, using defaults');
      // Initialize with default tasks as fallback
      createSubmitModalInstance();
    }
  } catch (error) {
    console.error('[SubmitModal] Error loading tasks:', error);
    
    // Initialize with default tasks as fallback
    console.warn('[SubmitModal] Using default tasks as fallback');
    createSubmitModalInstance();
  }
}

/**
 * Basic initialization without task fetching
 * Use this if you want to initialize with the default tasks
 */
export function initSubmitModal(): void {
  console.log('[SubmitModal] Initializing with default tasks');
  createSubmitModalInstance();
}
