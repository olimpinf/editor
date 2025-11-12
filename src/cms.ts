import { stat } from "fs";

export const CMS_TASK_NAME = "hashedName-d8724aa0b88f985f11";


/**
 * Get the task list from CMS API
 * Returns an array of tasks formatted for the submit modal
 */
export async function cmsTaskList(): Promise<Array<{ id: string; name: string }> | null> {
    const url = "/api/task_list"

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
        
        // Transform CMS task list into format expected by submit modal
        // CMS can return different formats:
        // Format 1: { "tasks": ["task1", "task2", ...] }
        // Format 2: { "tasks": [{ "name": "task1", "short_name": "t1" }, ...] }
        // Format 3: { "tasks": [{ "name": "task1" }, ...] }
        
        if (data && data.tasks && Array.isArray(data.tasks)) {
            const taskArray = data.tasks.map((task: any) => {
                // If task is a string
                if (typeof task === 'string') {
                    console.log('[cmsTaskList] Task is string:', task);
                    return {
                        id: task,
                        name: task
                    };
                }
                // If task is an object with name property
                else if (typeof task === 'object' && task !== null) {
                    console.log('[cmsTaskList] Task is object:', task);
                    const taskId = task.short_name || task.name || task.id || 'unknown';
                    const taskName = task.name || task.short_name || task.id || 'Unknown Task';
                    return {
                        id: taskId,
                        name: taskName
                    };
                }
                // Fallback
                else {
                    console.warn('[cmsTaskList] Unexpected task format:', task);
                    return {
                        id: String(task),
                        name: String(task)
                    };
                }
            });
            console.log('[cmsTaskList] Formatted tasks:', taskArray);
            return taskArray;
        }
        
        console.error('[cmsTaskList] Unexpected data format:', data);
        return null;

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
    // Build the submit URL with the task ID
    const SUBMIT_API_URL = `/api/${taskId}/submit`;
    
    // Build the file name field and file name
    const fileNameField = `${taskId}.%l`;
    const fileName = `${taskId}${languageExtension}`;

    console.log('[cmsSubmit] Submitting to:', SUBMIT_API_URL);
    console.log('[cmsSubmit] taskId:', taskId);
    console.log('[cmsSubmit] language:', language);
    console.log('[cmsSubmit] fileName:', fileName);
    console.log('[cmsSubmit] fileNameField:', fileNameField);

    const formData = new FormData();
    const codeBlob = new Blob([codeContent], { type: 'application/octet-stream' });

    // Append the code file
    formData.append(fileNameField, codeBlob, fileName);
    formData.append("language", language);

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
export async function cmsTestSend(runninTaskId, codeContent, inputContent, language, languageExtension) {
    // --- Configuration ---
    let TEST_API_URL = "/api/hashedName-d8724aa0b88f985f11/test";
    let fileNameField = "hashedName-d8724aa0b88f985f11.%l";
    let fileName = "hashedName-d8724aa0b88f985f11." + languageExtension;

    if (languageExtension == "java") {
        TEST_API_URL = "/api/tarefa/test";
        fileNameField = "tarefa.%l";
        fileName = "tarefa.java";
    }

    console.log("[cmsTestSend] URL", TEST_API_URL);
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

        if (status === 302 || status === 303) {
            // Success: CMS returned a redirect (302/303) to the status page.
            const redirectLocation = response.headers.get('Location');
            return { success: true, redirect: redirectLocation };

        } else if (status >= 200 && status < 300) {
            // Success: 200 OK. Try to parse JSON or display text.
            let data = {};
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                data = await response.text();
            }
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
export async function cmsTestStatus(theTaskId: string, id: string, language: string) {
    console.log("cmsTestStatus, language:", language);
    let url = "/api/hashedName-d8724aa0b88f985f11/test/" + id;
    if (language == "Java / JDK") {
        url = "/api/tarefa/test/" + id;
    }

    let data = "";
    try {
        const resp = await fetch(url, {
            method: "GET",
            headers: window.CMS_API_HEADERS,
        });

        if (!resp.ok) {
            console.error("Test Status failed with status", resp.status);
            data = { status: 0, status_text: "Erro" };
            return;
        }

        data = await resp.json();
        return data;

    } catch (err) {
        console.error("Error during task list retrieval:", err);
    }
}
