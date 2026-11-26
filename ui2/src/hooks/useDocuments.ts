import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '@/store/appStore';
import type { Document, DocumentChunk } from '@/types';

const API_Url = "http://localhost:5000";

// Real document upload
const uploadDocumentFn = async (file: File): Promise<Document> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_Url}/analyzer/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Upload failed');
  }

  const data = await response.json();
  console.log("🔥 UPLOAD RESPONSE:", data); // DEBUG log

  // Transform backend response to frontend Document type
  return {
    id: data.doc_id,
    name: data.filename,
    type: file.name.endsWith('.pdf') ? 'pdf' : file.name.endsWith('.docx') ? 'docx' : file.name.endsWith('.md') ? 'md' : 'txt',
    size: file.size,
    uploadedAt: new Date(),
    previewUrl: data.preview_url,
    chunks: [], // Backend handles chunks, UI just needs ID
    status: 'ready',
  };
};

// Real document query
const queryDocumentFn = async (documentId: string, query: string): Promise<string> => {
  const response = await fetch(`${API_Url}/analyzer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      doc_id: documentId,
      query: query
    }),
  });

  if (!response.ok) {
    throw new Error('Query failed');
  }

  const data = await response.json();
  return data.answer;
};

// Fetch documents list
const fetchDocumentsFn = async (): Promise<Document[]> => {
  const response = await fetch(`${API_Url}/documents`);
  if (!response.ok) throw new Error('Failed to fetch documents');
  const data = await response.json();

  return data.map((d: any) => ({
    id: d.id,
    name: d.filename,
    type: d.type,
    size: d.size,
    uploadedAt: new Date(d.uploaded_at),
    previewUrl: d.preview_url,
    status: 'ready'
  }));
};

// Fetch chat history
const fetchChatHistoryFn = async (docId: string): Promise<{ role: string, content: string }[]> => {
  if (!docId) return [];
  const response = await fetch(`${API_Url}/chats/${docId}`);
  if (!response.ok) throw new Error('Failed to fetch chat history');
  return await response.json();
};

// Delete document
const deleteDocumentFn = async (docId: string): Promise<void> => {
  const response = await fetch(`${API_Url}/documents/${docId}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete document');
};

// Rename document
const renameDocumentFn = async ({ docId, name }: { docId: string; name: string }): Promise<void> => {
  const response = await fetch(`${API_Url}/documents/${docId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  });
  if (!response.ok) throw new Error('Failed to rename document');
};

export function useDocuments() {
  const { addDocument, updateDocument, setActiveDocument } = useAppStore();
  const queryClient = useQueryClient();

  // CACHE BUSTER: Verify real API is used
  console.log("🚀 useDocuments hook initialized - Using Real RAG API");

  const uploadDocument = useMutation({
    mutationFn: uploadDocumentFn,
    onMutate: async (file) => {
      const tempDoc: Document = {
        id: `temp-${Date.now()}`,
        name: file.name,
        type: file.name.endsWith('.pdf') ? 'pdf' : file.name.endsWith('.docx') ? 'docx' : 'txt',
        size: file.size,
        uploadedAt: new Date(),
        status: 'uploading',
      };
      addDocument(tempDoc);
      return tempDoc;
    },
    onSuccess: (document, _, context) => {
      if (context) {
        updateDocument(context.id, { ...document, id: document.id });
      }
      setActiveDocument(document);
      // Invalidate queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
    onError: (_, __, context) => {
      if (context) {
        updateDocument(context.id, { status: 'error' });
      }
    },
  });

  const queryDocument = useMutation({
    mutationFn: ({ documentId, query }: { documentId: string; query: string }) =>
      queryDocumentFn(documentId, query),
  });

  const deleteDocument = useMutation({
    mutationFn: deleteDocumentFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    }
  });

  const renameDocument = useMutation({
    mutationFn: renameDocumentFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    }
  });

  return {
    uploadDocument: uploadDocument.mutate,
    isUploading: uploadDocument.isPending,
    queryDocument: queryDocument.mutate,
    isQuerying: queryDocument.isPending,
    queryResult: queryDocument.data,
    fetchDocumentsFn,
    fetchChatHistoryFn,
    deleteDocument: deleteDocument.mutate,
    isDeleting: deleteDocument.isPending,
    renameDocument: renameDocument.mutate,
    isRenaming: renameDocument.isPending
  };
}
