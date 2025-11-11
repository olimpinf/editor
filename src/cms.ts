import { stat } from "fs";

export const CMS_TASK_NAME = "hashedName-d8724aa0b88f985f11";


/**
 * Get the task list.
 */
export async function cmsTaskList() {
    const url = "/api/task_list"

    console.log("[cmsTaskList] url:", url);
    console.log("[cmsTaskList] window.CMS_API_HEADERS:", window.CMS_API_HEADERS)
    try {
        const resp = await fetch(url, {
            method: "GET",
            headers: window.CMS_API_HEADERS
        });

        if (!resp.ok) {
            console.error("Task List failed with status", resp.status);
            return;
        }

        const data = await resp.json();
        console.log('[CMS] data', data);
        return data;

    } catch (err) {
        console.error("Error during task list retrieval:", err);
    }
}

/*
 * @param {string} codeContent - The raw source code string from the editor.
 * @param {string} language - The programming language string (e.g., 'C++20 / g++').
 */
async function cmsSubmit(codeContent, language, languageExtension) {
    // --- Configuration ---
    if (languageExtension == '.cpp') {
        const SUBMIT_API_URL = "/api/tarefa/submit";
    }
    else {
        const SUBMIT_API_URL = "/api/hashedName-d8724aa0b88f985f11/submit";
    }

    // The name of the file field in the multipart form (e.g., "tarefa1.cpp")
    const fileNameField = "tarefa1.%l";
    const fileName = "tarefa1" + languageExtension;

    const formData = new FormData();
    const codeBlob = new Blob([codeContent], { type: 'application/octet-stream' });

    // Example: formData.append("tarefa1.cpp", Blob, "tarefa1.cpp")
    formData.append(fileNameField, codeBlob, fileName);

    formData.append("language", language);

    try {
        const response = await fetch(SUBMIT_API_URL, {
            method: 'POST',
            headers: window.CMS_API_HEADERS,
            body: formData, // fetch automatically sets Content-Type: multipart/form-data
            redirect: 'manual' // Prevents fetch from following 302/303 redirects
        });

        const status = response.status;
        const contentType = response.headers.get('content-type');

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
