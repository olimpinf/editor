/**
 * Global variable for the login result
 */
let login_data = null;
const CMS_TASK_NAME = "hashedName-d8724aa0b88f985f11";
/**
 * Hardcoded CMS credentials (shared by all students)
 */
const protocol = window.location.protocol
const hostname = window.location.hostname
const URL_API = protocol + '//' + hostname
//const URL_API = "http://143.106.73.75/cws"
//const URL_API = ""
const CMS_USERNAME = "00000-A";
const CMS_PASSWORD = "tarefa-forte-pilha-fraca";

/**
 * Save login_data to localStorage
 */
function saveLoginData(value) {
    login_data = value;
    if (value !== null && value !== undefined) {
	localStorage.setItem("login_data", value);
    } else {
	localStorage.removeItem("login_data");
    }
}

/**
 * Load login_data from localStorage (if any)
 */
function loadLoginData() {
    const stored = localStorage.getItem("login_data");
    if (stored) {
	login_data = stored;
    }
}

/**
 * Perform login using the fixed username/password.
 */
async function taskList() {
    const url = URL_API + "/task_list"

    try {
        const resp = await fetch(url, {
             method: "GET" 
         });

        if (!resp.ok) {
            console.error("Task List failed with status", resp.status);
            return;
        }

        const data = await resp.json();
	
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
    if (languageExtension == '.cpp' ) {
     const SUBMIT_API_URL = URL_API + "/tarefa/submit";
    }
    else {
     const SUBMIT_API_URL =  URL_API + "/hashedName-d8724aa0b88f985f11/submit";
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
async function cmsTestSend(runninTaskId, codeContent, inputContent, language, languageExtension) {
    // --- Configuration ---
    let TEST_API_URL = URL_API + "/hashedName-d8724aa0b88f985f11/test";
    let fileNameField = "hashedName-d8724aa0b88f985f11.%l";
    let fileName = "hashedName-d8724aa0b88f985f11." + languageExtension; 
    
    if (languageExtension == "java") {
	TEST_API_URL = URL_API + "/tarefa/test";
	fileNameField = "tarefa.%l";
	fileName = "tarefa.java";
    }

    const formData = new FormData();
    const codeBlob = new Blob([codeContent], { type: 'application/octet-stream' });
    const inputBlob = new Blob([inputContent], { type: 'application/octet-stream' });
    
    formData.append(fileNameField, codeBlob, fileName);
    formData.append("input", inputBlob, "input.txt");
    
    formData.append("language", language);

    
    try {
        const response = await fetch(TEST_API_URL, {
            method: 'POST',
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

/**
 * Get status of a test submission
 */
async function cmsTestStatus(theTaskId, id) {
    let url = URL_API + "/hashedName-d8724aa0b88f985f11/test/" + id
    if (runningLanguage == "java") {
	url = URL_API + "/tarefa/test/" + id
    }

    try {
        const resp = await fetch(url, {
             method: "GET" 
         });

        if (!resp.ok) {
            console.error("Test Status failed with status", resp.status);
	    data = {status: 0, status_text: "Erro"};
            return;
        }

        const data = await resp.json();
	return data;
	
    } catch (err) {
         console.error("Error during task list retrieval:", err); 
    }
}



/**
 * On page load, try to restore login_data.
 * If not found, perform a login automatically.
 */
// document.addEventListener("DOMContentLoaded", () => {
//     loadLoginData();
//     if (!login_data) {
// 	doLogin();
//     }
// });
