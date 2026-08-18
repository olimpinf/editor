export const CMS_TASK_NAME = "hashedName-d8724aa0b88f985f11";

// Contest identifier — ExamLock injects window.CMS_CONTEST_ID asynchronously, well
// after this module has already been evaluated, so this must be read live on each
// call rather than captured once at module load (which would always see it unset).
// 1 = Phase 1 Turn A, 2 = Phase 1 Turn B, etc.
export function contestId(): number {
    return (window as any).CMS_CONTEST_ID ?? 2;
}

function examBaseUrl(): string {
    return (window as any).CMS_EXAM_URL || 'https://pj.provas.ic.unicamp.br';
}

// Single point for all CMS API URLs — change here if the path structure ever changes.
function cmsApiUrl(path: string): string {
    return `${examBaseUrl()}/api/${path}`;
}

/**
 * Transform the raw CMS /api/task_list response body into the format expected
 * by the submit modal. Shared by cmsTaskList() (normal in-page fetch) and by
 * the ExamLock-driven external path (see window.__obiApplyExternalTaskList in
 * editor.ts) — the outer app polls task_list itself, from the main process,
 * so this must not depend on anything only available inside the fetch call.
 *
 * CMS can return different formats:
 * Format 1: { "tasks": ["task1", "task2", ...] }
 * Format 2: { "tasks": [{ "name": "task1", "short_name": "t1" }, ...] }
 * Format 3: { "tasks": [{ "name": "task1" }, ...] }
 */
export function transformTaskList(data: any): Array<{ id: string; name: string }> | null {
    if (!(data && data.tasks && Array.isArray(data.tasks))) {
        console.error('[transformTaskList] Unexpected data format:', data);
        return null;
    }

    const taskArray = data.tasks.map((task: any) => {
        // If task is a string
        if (typeof task === 'string') {
            console.log('[transformTaskList] Task is string:', task);
            return {
                id: task,
                name: task
            };
        }
        // If task is an object with name property
        else if (typeof task === 'object' && task !== null) {
            console.log('[transformTaskList] Task is object:', task);
            const taskId = task.short_name || task.name || task.id || 'unknown';
            const taskName = task.name || task.short_name || task.id || 'Unknown Task';
            return {
                id: taskId,
                name: taskName
            };
        }
        // Fallback
        else {
            console.warn('[transformTaskList] Unexpected task format:', task);
            return {
                id: String(task),
                name: String(task)
            };
        }
    });
    console.log('[transformTaskList] Formatted tasks:', taskArray);
    return taskArray;
}

/**
 * Get the task list from CMS API
 * Returns an array of tasks formatted for the submit modal
 */
export async function cmsTaskList(): Promise<Array<{ id: string; name: string }> | null> {
    const url = cmsApiUrl('task_list');

    console.log("[cmsTaskList] *****************************");
    console.log("[cmsTaskList] url:", url);
    console.log("[cmsTaskList] window.CMS_API_HEADERS:", window.CMS_API_HEADERS)
    try {
        const resp = await fetch(url, {
            method: "GET",
            headers: window.CMS_API_HEADERS
        });

        if (!resp.ok) {
            console.error("[cmsTaskList] Failed with status", resp.status);
            return null;
        }

        const data = await resp.json();
        console.log('[cmsTaskList] Raw data:', data);

        return transformTaskList(data);

    } catch (err) {
        console.error("[cmsTaskList] Error during task list retrieval:", err);
        return null;
    }
}

/**
 * Submit code to CMS for evaluation
 * @param taskId - The task ID to submit to
 * @param codeContent - The raw source code string from the editor
 * @param language - The programming language string (e.g., 'C++20 / g++')
 * @param languageExtension - File extension (e.g., '.cpp', '.py', '.java')
 */
export async function cmsSubmit(taskId: string, codeContent: string, language: string, languageExtension: string) {

    let cmsLanguage = "C++20 / g++";
    if (language == "python" || language == "blockly")
        cmsLanguage = "Python 3 / PyPy";
    else if (language == "java")
        cmsLanguage = "Java / JDK";
    // "c" has no separate CMS language; g++ compiles plain C code fine


    // Build the submit URL with the task ID
    const SUBMIT_API_URL = cmsApiUrl(`${taskId}/submit`);
    
    // Build the file name field and file name
    const fileNameField = `${taskId}.%l`;
    const fileName = `${taskId}${languageExtension}`;

    console.log('[cmsSubmit] Submitting to:', SUBMIT_API_URL);
    console.log('[cmsSubmit] taskId:', taskId);
    console.log('[cmsSubmit] language:', cmsLanguage);
    console.log('[cmsSubmit] fileName:', fileName);
    console.log('[cmsSubmit] fileNameField:', fileNameField);

    const formData = new FormData();
    const codeBlob = new Blob([codeContent], { type: 'application/octet-stream' });

    // Append the code file
    formData.append(fileNameField, codeBlob, fileName);
    formData.append("language", cmsLanguage);

    try {
        const response = await fetch(SUBMIT_API_URL, {
            method: 'POST',
            headers: window.CMS_API_HEADERS,
            body: formData,
            redirect: 'manual' // Prevents fetch from following 302/303 redirects
        });

        const status = response.status;
        const contentType = response.headers.get('content-type');

        if (status === 302 || status === 303) {
            // Success: CMS returned a redirect (302/303) to the status page
            const redirectLocation = response.headers.get('Location');
            console.log('[cmsSubmit] Success! Redirect to:', redirectLocation);
            return { success: true, redirect: redirectLocation };

        } else if (status >= 200 && status < 300) {
            // Success: 200 OK. Try to parse JSON or display text
            let data = {};
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                data = await response.text();
            }
            console.log('[cmsSubmit] Success!', data);
            return { success: true, data: data };

        } else {
            // Failure: Non-success status code (4xx, 5xx)
            const errorText = await response.text();
            console.error(`[cmsSubmit] Failed with status ${status}. Response:`, errorText.substring(0, 500) + '...');
            return { success: false, status: status, error: errorText };
        }

    } catch (err) {
        console.error("[cmsSubmit] Error during submission:", err);
        return { success: false, error: err.message };
    }
}


/*
 * @param {string} codeContent - The raw source code string from the editor.
 * @param {string} language - The programming language string (e.g., 'C++20 / g++').
 */
export async function cmsTestSend(taskId:string, codeContent: string, inputContent: string, language: string, languageExtension: string) {
    // taskId is either the hidden "tarefa" task (fixed limits) or a real exam
    // task chosen by the student — see AppConfig.testTaskSelection in index.html.
    let TEST_API_URL = cmsApiUrl(`${taskId}/test`);
    let fileNameField = `${taskId}.%l`;
    let fileName = `${taskId}.${languageExtension}`;

    console.log("[cmsTestSend] URL", TEST_API_URL);
    console.log('[cmsTestSend] language:', language);
    console.log('[cmsTestSend] fileName:', fileName);
    console.log('[cmsTestSend] fileNameField:', fileNameField);

    const formData = new FormData();
    const codeBlob = new Blob([codeContent], { type: 'application/octet-stream' });
    const inputBlob = new Blob([inputContent], { type: 'application/octet-stream' });

    formData.append(fileNameField, codeBlob, fileName);
    formData.append("input", inputBlob, "input.txt");
    formData.append("language", language);

    try {
        const response = await fetch(TEST_API_URL, {
            method: 'POST',
            headers: window.CMS_API_HEADERS,
            body: formData, // fetch automatically sets Content-Type: multipart/form-data
            redirect: 'manual' // Prevents fetch from following 302/303 redirects
        });

        const status = response.status;
        const contentType = response.headers.get('content-type');
        console.log("[cmsTestSend] POST status:", status);

        if (status === 302 || status === 303 || status === 0) {
            // Success: CMS returned a redirect to the status page.
            // (cross-origin redirect: 'manual' gives status 0 with type 'opaqueredirect')
            const redirectLocation = response.headers.get('Location') || response.url;
            console.log("[cmsTestSend] Redirect to:", redirectLocation);
            return { success: true, redirect: redirectLocation };

        } else if (status >= 200 && status < 300) {
            // Success: 200 OK. Try to parse JSON or display text.
            let data: any = {};
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                data = await response.text();
            }
            console.log("[cmsTestSend] Response data:", JSON.stringify(data));
            return { success: true, data: data };

        } else {
            // Failure: Non-success status code (4xx, 5xx).
            const errorText = await response.text();
            console.error(`Submission failed with status code ${status}. Response text:`, errorText.substring(0, 500) + '...');
            return { success: false, status: status, error: errorText };
        }

    } catch (err) {
        console.error("An error occurred during POST submission:", err);
        return { success: false, error: err.message };
    }
}

/**
 * Get status of a test submission
 */
export async function cmsTestStatus(taskId: string, id: string, language: string) {
    console.log("cmsTestStatus, language:", language);
    // Must match whatever taskId cmsTestSend used to submit this test.
    let url = cmsApiUrl(`${taskId}/test/${id}`);
    console.log("Test Status for taskId", taskId);
    console.log("url", url);

    let data = "";
    try {
        const resp = await fetch(url, {
            method: "GET",
            headers: window.CMS_API_HEADERS,
        });

        if (!resp.ok) {
            console.error("Test Status failed with status", resp.status);
            return { status: 0, status_text: "Erro" };
        }

        data = await resp.json();
        return data;

    } catch (err) {
        console.error("Error during task list retrieval:", err);
    }
}
