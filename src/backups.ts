/**
 * Backups Module
 * Handles saving and loading code/input backups to Django backend
 */

// Types
interface Backup {
  id: number;
  timestamp: string;
  task_name: number | null;
  competition_name: string | null;
  comment: string;
  the_type: 'code' | 'input';
}

interface BackupData {
  task_name: number | null;
  competition_name: string | null;
  comment: string;
  data: string;
  the_type: 'code' | 'input';
}

// API endpoints
const ENDPOINTS = {
  retrieveBackups: '/editor/retrieve_backups',
  retrieveBackup: '/editor/retrieve_a_backup',
  deleteBackup: '/editor/delete_a_backup',
  addBackup: '/editor/add_a_backup'
};

/**
 * Get CSRF token from cookies (required for Django POST requests)
 */
function getCsrfToken(): string | null {
  const name = 'csrftoken';
  let cookieValue: string | null = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

/**
 * Fetch all backups of a specific type (code or input)
 */
export async function fetchBackups(type: 'code' | 'input'): Promise<Backup[]> {
  try {
    const response = await fetch(ENDPOINTS.retrieveBackups, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCsrfToken() || ''
      },
      body: JSON.stringify({ the_type: type })
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch backups: ${response.status}`);
    }

    const backups: Backup[] = await response.json();
    console.log(`[Backups] Retrieved ${backups.length} ${type} backups`);
    return backups;
  } catch (error) {
    console.error('[Backups] Error fetching backups:', error);
    throw error;
  }
}

/**
 * Fetch a specific backup's data by ID
 */
export async function fetchBackupData(id: number, type: 'code' | 'input'): Promise<string> {
  try {
    const response = await fetch(ENDPOINTS.retrieveBackup, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCsrfToken() || ''
      },
      body: JSON.stringify({ id, the_type: type })
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch backup data: ${response.status}`);
    }

    const data = await response.json();
    console.log(`[Backups] Retrieved backup ${id} data`);
    return data;
  } catch (error) {
    console.error('[Backups] Error fetching backup data:', error);
    throw error;
  }
}

/**
 * Delete a specific backup
 */
export async function deleteBackup(id: number, type: 'code' | 'input'): Promise<void> {
  try {
    const response = await fetch(ENDPOINTS.deleteBackup, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCsrfToken() || ''
      },
      body: JSON.stringify({ id, the_type: type })
    });

    if (response.status !== 204 && !response.ok) {
      throw new Error(`Failed to delete backup: ${response.status}`);
    }

    console.log(`[Backups] Deleted backup ${id}`);
  } catch (error) {
    console.error('[Backups] Error deleting backup:', error);
    throw error;
  }
}

/**
 * Save a new backup
 */
export async function saveBackup(backupData: BackupData): Promise<void> {
  try {
    const response = await fetch(ENDPOINTS.addBackup, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCsrfToken() || ''
      },
      body: JSON.stringify(backupData)
    });

    if (response.status !== 204 && !response.ok) {
      throw new Error(`Failed to save backup: ${response.status}`);
    }

    console.log(`[Backups] Saved ${backupData.the_type} backup: ${backupData.comment}`);
  } catch (error) {
    console.error('[Backups] Error saving backup:', error);
    throw error;
  }
}

/**
 * Show a modal to select and load a backup
 */
async function showLoadBackupModal(type: 'code' | 'input'): Promise<string | null> {
  try {
    const backups = await fetchBackups(type);

    if (backups.length === 0) {
      alert(`Nenhum backup de ${type === 'code' ? 'código' : 'entrada'} encontrado.`);
      return null;
    }

    // Create modal HTML
    const modalId = `load-backup-modal-${type}`;
    const existingModal = document.getElementById(modalId);
    if (existingModal) {
      existingModal.remove();
    }

    // Generate backup list
    const backupListHTML = backups
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .map(backup => {
        const date = new Date(backup.timestamp);
        const dateStr = date.toLocaleString('pt-BR');
        return `
          <div class="backup-item" data-backup-id="${backup.id}" style="padding: 10px; border: 1px solid #ddd; border-radius: 4px; margin-bottom: 8px; cursor: pointer; background: white;">
            <div style="font-weight: 600; color: #333;">${backup.comment || 'Sem descrição'}</div>
            <div style="font-size: 12px; color: #666; margin-top: 4px;">${dateStr}</div>
          </div>
        `;
      })
      .join('');

    const modalHTML = `
      <div id="${modalId}" class="obi-modal" role="dialog" aria-modal="true" aria-labelledby="load-backup-title-${type}" aria-hidden="false" style="display: block; position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 10000;">
        <div class="obi-modal__backdrop" data-dismiss="modal" tabindex="-1" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.5); z-index: 10001;"></div>
        <div class="obi-modal__dialog" role="document" style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 10002; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); min-width: 400px; max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto;">
          <div class="obi-modal__header" style="margin-bottom: 20px; position: relative;">
            <h2 id="load-backup-title-${type}" style="margin: 0; font-size: 1.5rem; color: #333; padding-right: 30px;">Carregar Backup ${type === 'code' ? 'de Código' : 'de Entrada'}</h2>
            <button id="load-backup-close-${type}" class="obi-modal__close" aria-label="Fechar" style="position: absolute; top: 0; right: 0; background: none; border: none; font-size: 1.5rem; cursor: pointer; padding: 0; color: #666; line-height: 1;">✕</button>
          </div>
          <div class="obi-modal__body" style="max-height: 50vh; overflow-y: auto;">
            <div id="backup-list-${type}">
              ${backupListHTML}
            </div>
          </div>
          <div class="obi-modal__footer" style="margin-top: 20px; display: flex; justify-content: flex-end;">
            <button id="load-backup-cancel-${type}" class="obi-modal__action" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">Cancelar</button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const modal = document.getElementById(modalId);
    if (!modal) return null;

    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    return new Promise((resolve) => {
      const closeModal = () => {
        modal.remove();
        document.body.style.overflow = '';
        resolve(null);
      };

      // Close button handlers
      document.getElementById(`load-backup-close-${type}`)?.addEventListener('click', closeModal);
      document.getElementById(`load-backup-cancel-${type}`)?.addEventListener('click', closeModal);
      modal.querySelector('.obi-modal__backdrop')?.addEventListener('click', closeModal);

      // Backup item click handlers
      const backupItems = modal.querySelectorAll('.backup-item');
      backupItems.forEach(item => {
        item.addEventListener('click', async () => {
          const backupId = parseInt(item.getAttribute('data-backup-id') || '0');
          if (!backupId) return;

          try {
            const data = await fetchBackupData(backupId, type);
            modal.remove();
            document.body.style.overflow = '';
            resolve(data);
          } catch (error) {
            alert('Erro ao carregar backup. Tente novamente.');
            closeModal();
          }
        });
      });

      // ESC key to close
      const escHandler = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          closeModal();
          document.removeEventListener('keydown', escHandler);
        }
      };
      document.addEventListener('keydown', escHandler);
    });
  } catch (error) {
    alert('Erro ao carregar lista de backups.');
    return null;
  }
}

/**
 * Show a modal to save a backup with a comment
 */
async function showSaveBackupModal(
  type: 'code' | 'input',
  data: string
): Promise<boolean> {
  const modalId = `save-backup-modal-${type}`;
  const existingModal = document.getElementById(modalId);
  if (existingModal) {
    existingModal.remove();
  }

  const modalHTML = `
    <div id="${modalId}" class="obi-modal" role="dialog" aria-modal="true" aria-labelledby="save-backup-title-${type}" aria-hidden="false" style="display: block; position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 10000;">
      <div class="obi-modal__backdrop" data-dismiss="modal" tabindex="-1" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.5); z-index: 10001;"></div>
      <div class="obi-modal__dialog" role="document" style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 10002; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); min-width: 400px; width: auto; max-width: 90%;">
        <div class="obi-modal__header" style="margin-bottom: 20px; position: relative;">
          <h2 id="save-backup-title-${type}" style="margin: 0; font-size: 1.5rem; color: #333; padding-right: 30px;">Salvar Backup ${type === 'code' ? 'de Código' : 'de Entrada'}</h2>
          <button id="save-backup-close-${type}" class="obi-modal__close" aria-label="Fechar" style="position: absolute; top: 0; right: 0; background: none; border: none; font-size: 1.5rem; cursor: pointer; padding: 0; color: #666; line-height: 1;">✕</button>
        </div>
        <div class="obi-modal__body">
          <div style="margin-bottom: 20px;">
            <label for="backup-comment-${type}" style="display: block; margin-bottom: 8px; font-weight: 600; color: #333;">Descrição do backup:</label>
            <input type="text" id="backup-comment-${type}" placeholder="Ex: Solução problema 1" style="width: 100%; padding: 10px; font-size: 14px; border: 1px solid #ccc; border-radius: 4px; display: block;" />
          </div>
        </div>
        <div class="obi-modal__footer" style="display: flex; justify-content: flex-end; gap: 10px;">
          <button id="save-backup-cancel-${type}" class="obi-modal__action" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; white-space: nowrap;">Cancelar</button>
          <button id="save-backup-confirm-${type}" class="obi-modal__action" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; white-space: nowrap;">Salvar</button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);
  const modal = document.getElementById(modalId);
  if (!modal) return false;

  // Prevent body scroll
  document.body.style.overflow = 'hidden';

  // Focus on input
  setTimeout(() => {
    const input = document.getElementById(`backup-comment-${type}`) as HTMLInputElement;
    input?.focus();
  }, 100);

  return new Promise((resolve) => {
    const closeModal = () => {
      modal.remove();
      document.body.style.overflow = '';
      resolve(false);
    };

    // Close button handlers
    document.getElementById(`save-backup-close-${type}`)?.addEventListener('click', closeModal);
    document.getElementById(`save-backup-cancel-${type}`)?.addEventListener('click', closeModal);
    modal.querySelector('.obi-modal__backdrop')?.addEventListener('click', closeModal);

    // Save button handler
    document.getElementById(`save-backup-confirm-${type}`)?.addEventListener('click', async () => {
      const input = document.getElementById(`backup-comment-${type}`) as HTMLInputElement;
      const comment = input?.value.trim() || 'Backup sem descrição';

      try {
        await saveBackup({
          task_name: null,
          competition_name: null,
          comment,
          data,
          the_type: type
        });

        modal.remove();
        document.body.style.overflow = '';
        alert('Backup salvo com sucesso!');
        resolve(true);
      } catch (error) {
        alert('Erro ao salvar backup. Tente novamente.');
        closeModal();
      }
    });

    // Enter key to save
    const enterHandler = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        document.getElementById(`save-backup-confirm-${type}`)?.click();
        document.removeEventListener('keydown', enterHandler);
      } else if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', enterHandler);
      }
    };
    document.addEventListener('keydown', enterHandler);
  });
}

/**
 * Initialize backup functionality for download/upload buttons
 */
export function initBackups(): void {
  console.log('[Backups] Initializing backup functionality');

  // Replace download-btn functionality with save backup
  const downloadBtn = document.getElementById('download-btn');
  if (downloadBtn) {
    // Remove existing click listeners by cloning the node
    const newDownloadBtn = downloadBtn.cloneNode(true) as HTMLElement;
    downloadBtn.parentNode?.replaceChild(newDownloadBtn, downloadBtn);

    newDownloadBtn.addEventListener('click', async () => {
      const code = (window as any).editor?.getValue() || '';
      if (!code.trim()) {
        alert('Não há código para salvar.');
        return;
      }
      await showSaveBackupModal('code', code);
    });
  }

  // Replace upload-btn functionality with load backup
  const uploadBtn = document.getElementById('upload-btn');
  if (uploadBtn) {
    const newUploadBtn = uploadBtn.cloneNode(true) as HTMLElement;
    uploadBtn.parentNode?.replaceChild(newUploadBtn, uploadBtn);

    newUploadBtn.addEventListener('click', async () => {
      const current = ((window as any).editor?.getValue() || '').trim();
      if (current) {
        if (!confirm('Deseja substituir o código atual?')) {
          return;
        }
      }

      const data = await showLoadBackupModal('code');
      if (data !== null) {
        (window as any).editor?.setValue(data);
        // Trigger snapshot save
        if ((window as any).scheduleSaveSnapshot) {
          (window as any).scheduleSaveSnapshot();
        }
      }
    });
  }

  // Replace download-input-btn functionality with save backup
  const downloadInputBtn = document.getElementById('download-input-btn');
  if (downloadInputBtn) {
    const newDownloadInputBtn = downloadInputBtn.cloneNode(true) as HTMLElement;
    downloadInputBtn.parentNode?.replaceChild(newDownloadInputBtn, downloadInputBtn);

    newDownloadInputBtn.addEventListener('click', async () => {
      const input = (document.getElementById('stdin-input') as HTMLTextAreaElement)?.value || '';
      if (!input.trim()) {
        alert('Não há entrada para salvar.');
        return;
      }
      await showSaveBackupModal('input', input);
    });
  }

  // Replace upload-input-btn functionality with load backup
  const uploadInputBtn = document.getElementById('upload-input-btn');
  if (uploadInputBtn) {
    const newUploadInputBtn = uploadInputBtn.cloneNode(true) as HTMLElement;
    uploadInputBtn.parentNode?.replaceChild(newUploadInputBtn, uploadInputBtn);

    newUploadInputBtn.addEventListener('click', async () => {
      const inputEl = document.getElementById('stdin-input') as HTMLTextAreaElement;
      if (inputEl?.value.trim()) {
        if (!confirm('Deseja substituir a entrada atual?')) {
          return;
        }
      }

      const data = await showLoadBackupModal('input');
      if (data !== null && inputEl) {
        inputEl.value = data;
        // Trigger snapshot save
        if ((window as any).scheduleSaveSnapshot) {
          (window as any).scheduleSaveSnapshot();
        }
      }
    });
  }

  console.log('[Backups] Backup functionality initialized');
}
