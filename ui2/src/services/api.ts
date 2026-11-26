const API_BASE_URL = "http://localhost:5000";

export const api = {
    ask: async (query: string, sessionId?: string) => {
        const response = await fetch(`${API_BASE_URL}/ask`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query, session_id: sessionId }),
        });
        return response.json();
    },

    getSessions: async () => {
        const response = await fetch(`${API_BASE_URL}/sessions`);
        return response.json();
    },

    createSession: async (title?: string) => {
        const response = await fetch(`${API_BASE_URL}/sessions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title }),
        });
        return response.json();
    },

    getSessionHistory: async (sessionId: string) => {
        const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}`);
        const data = await response.json();
        return data.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
        }));
    },

    deleteSession: async (sessionId: string) => {
        const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}`, {
            method: "DELETE",
        });
        return response.json();
    },

    research: async (query: string) => {
        const response = await fetch(`${API_BASE_URL}/research`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query }),
        });
        return response.json();
    },

    analyzer: async (query: string, docId?: string) => {
        const body: any = { query };
        if (docId) body.doc_id = docId;

        const response = await fetch(`${API_BASE_URL}/analyzer`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        return response.json();
    },

    uploadDocument: async (file: File) => {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(`${API_BASE_URL}/analyzer/upload`, {
            method: "POST",
            body: formData,
        });
        return response.json();
    },

    renameDocument: async (docId: string, name: string) => {
        const response = await fetch(`${API_BASE_URL}/documents/${docId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name }),
        });
        return response.json();
    },
};
