"use client";
import { useState, useRef, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import styles from "../app/page.module.css";

interface Message {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  jobId?: string;
  status?: string;
  sources?: Array<{
    content: string;
    distance?: number;
    metadata?: any;
  }>;
}

interface ChatProps {
  mode: "ask" | "research" | "workflows" | "analyzer";
  title: string;
  placeholder: string;
  initialMessage: string;
}

export default function Chat({ mode, title, placeholder, initialMessage }: ChatProps) {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: initialMessage },
  ]);
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [documentContent, setDocumentContent] = useState<string | null>(null);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Initialize WebSocket connection
  useEffect(() => {
    if (mode === "research" || mode === "workflows") {
      const newSocket = io("http://localhost:5000");
      
      newSocket.on("connect", () => {
        console.log("Connected to WebSocket");
      });

      newSocket.on("job_status", (data: any) => {
        console.log("Job status update:", data);
        updateJobStatus(data);
      });

      newSocket.on("job_result", (data: any) => {
        console.log("Job result received:", data);
        handleJobResult(data);
      });

      newSocket.on("disconnect", () => {
        console.log("Disconnected from WebSocket");
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [mode]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const updateJobStatus = (statusData: any) => {
    setMessages((msgs) => {
      const newMsgs = [...msgs];
      const messageIndex = newMsgs.findIndex(msg => msg.jobId === statusData.job_id);
      
      if (messageIndex !== -1) {
        const message = newMsgs[messageIndex];
        if (message.role === "assistant") {
          let statusText = "";
          switch (statusData.status) {
            case "pending":
              statusText = "⏳ Job queued...";
              break;
            case "processing":
              statusText = `🔄 ${statusData.message || "Processing..."}`;
              break;
            case "completed":
              statusText = "✅ Analysis complete!";
              break;
            case "failed":
              statusText = `❌ Error: ${statusData.message || "Job failed"}`;
              break;
            default:
              statusText = `Status: ${statusData.status}`;
          }
          
          message.content = statusText;
          message.status = statusData.status;
        }
      }
      
      return newMsgs;
    });
  };

  const handleJobResult = (resultData: any) => {
    setMessages((msgs) => {
      const newMsgs = [...msgs];
      const messageIndex = newMsgs.findIndex(msg => msg.jobId === resultData.job_id || msg.jobId === currentJobId);
      
      if (messageIndex !== -1) {
        const message = newMsgs[messageIndex];
        if (message.role === "assistant") {
          message.content = resultData.answer || "No result available";
          message.sources = resultData.sources || [];
          message.status = "completed";
          message.isStreaming = false;
        }
      }
      
      return newMsgs;
    });
    
    setLoading(false);
    setCurrentJobId(null);
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    
    const validTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (!validTypes.includes(file.type)) {
      const errorMessage = { 
        role: "assistant" as const, 
        content: "Please upload a PDF or Word document (.pdf, .doc, .docx)" 
      };
      setMessages((msgs) => [...msgs, errorMessage]);
      return;
    }
    
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const res = await fetch('http://localhost:5000/analyzer/upload', {
        method: 'POST',
        body: formData,
      });
      
      const data = await res.json();
      
      if (data.success) {
        setUploadedFile(file);
        setDocumentContent(data.content);
        setDocumentId(data.doc_id);
        const successMessage = { 
          role: "assistant" as const, 
          content: `✅ Document "${file.name}" uploaded successfully! You can now ask questions about it.` 
        };
        setMessages((msgs) => [...msgs, successMessage]);
      } else {
        const errorMessage = { 
          role: "assistant" as const, 
          content: data.error || "Failed to process document." 
        };
        setMessages((msgs) => [...msgs, errorMessage]);
      }
    } catch (err) {
      const errorMessage = { 
        role: "assistant" as const, 
        content: "Error uploading document. Please try again." 
      };
      setMessages((msgs) => [...msgs, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAskMode = async (userQuery: string) => {
    try {
      const requestBody: any = { query: userQuery };
      
      // For analyzer mode, include document ID if available
      if (mode === "analyzer" && documentId) {
        requestBody.doc_id = documentId;
      }
      
      const res = await fetch(`http://localhost:5000/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      
      const data = await res.json();
      const responseText = (data.answer || data.error || "No answer returned.")
        .replace(/<think>[\s\S]*?<\/think>/g, "")
        .trim();
      
      // Stop loading and start streaming
      setLoading(false);
      setStreaming(true);
      
      // Add streaming message
      setMessages((msgs) => [...msgs, { 
        role: "assistant", 
        content: "", 
        isStreaming: true 
      }]);
      
      // Simulate streaming effect
      let currentText = "";
      const words = responseText.split(' ');
      
      for (let i = 0; i < words.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 50)); // 50ms delay between words
        currentText += (i > 0 ? ' ' : '') + words[i];
        
        setMessages((msgs) => {
          const newMsgs = [...msgs];
          const lastMsg = newMsgs[newMsgs.length - 1];
          if (lastMsg && lastMsg.role === 'assistant' && lastMsg.isStreaming) {
            lastMsg.content = currentText;
          }
          return newMsgs;
        });
      }
      
      // Mark streaming as complete
      setMessages((msgs) => {
        const newMsgs = [...msgs];
        const lastMsg = newMsgs[newMsgs.length - 1];
        if (lastMsg && lastMsg.role === 'assistant') {
          lastMsg.isStreaming = false;
        }
        return newMsgs;
      });
      
    } catch (err) {
      const errorMessage = { role: "assistant" as const, content: "Error calling API." };
      setMessages((msgs) => [...msgs, errorMessage]);
    } finally {
      setLoading(false);
      setStreaming(false);
    }
  };

  const handleJobMode = async (userQuery: string) => {
    try {
      const res = await fetch(`http://localhost:5000/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: userQuery }),
      });
      
      const data = await res.json();
      
      if (data.job_id) {
        const jobId = data.job_id;
        setCurrentJobId(jobId);
        
        // Add initial status message
        setMessages((msgs) => [...msgs, {
          role: "assistant",
          content: "⏳ Job queued...",
          jobId: jobId,
          status: "pending"
        }]);
        
        // Monitor the job via WebSocket
        if (socket) {
          socket.emit("monitor_job", { job_id: jobId });
        }
      } else {
        throw new Error(data.error || "Failed to create job");
      }
    } catch (err) {
      const errorMessage = { 
        role: "assistant" as const, 
        content: `Error: ${err instanceof Error ? err.message : "Failed to submit job"}` 
      };
      setMessages((msgs) => [...msgs, errorMessage]);
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!query.trim()) return;
    
    // For analyzer mode, check if document is uploaded
    if (mode === "analyzer" && !documentContent) {
      const errorMessage = { 
        role: "assistant" as const, 
        content: "Please upload a document first before asking questions." 
      };
      setMessages((msgs) => [...msgs, errorMessage]);
      return;
    }
    
    const userMessage = { role: "user" as const, content: query };
    setMessages((msgs) => [...msgs, userMessage]);
    setLoading(true);
    const userQuery = query;
    setQuery("");
    
    if (mode === "ask" || mode === "analyzer") {
      await handleAskMode(userQuery);
    } else {
      await handleJobMode(userQuery);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !loading && !streaming) {
      handleSubmit();
    }
  };

  const startNewChat = () => {
    setMessages([{ role: "assistant", content: initialMessage }]);
    setCurrentJobId(null);
    if (mode === "analyzer") {
      setUploadedFile(null);
      setDocumentContent(null);
      setDocumentId(null);
    }
  };

  const renderMessage = (msg: Message, idx: number) => {
    return (
      <div key={idx}>
        <div
          className={
            msg.role === "user"
              ? styles.userMessage
              : styles.assistantMessage
          }
        >
          {msg.content}
          {msg.isStreaming && <span className={styles.cursor}>|</span>}
        </div>
        
        {/* Show sources for research/workflow results */}
        {msg.sources && msg.sources.length > 0 && (
          <div className={styles.sourcesContainer}>
            <h4>Sources from your notes:</h4>
            {msg.sources.map((source, sourceIdx) => (
              <div key={sourceIdx} className={styles.sourceItem}>
                <div className={styles.sourceContent}>
                  {source.content}
                </div>
                {source.metadata && source.metadata.source && (
                  <div className={styles.sourceMetadata}>
                    📄 {source.metadata.source}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <main className={styles.chatMain}>
      <div className={styles.chatWindow}>
        {messages.map((msg, idx) => renderMessage(msg, idx))}
        {loading && !streaming && (
          <div className={styles.assistantMessage}>
            <div className={styles.loadingAnimation}>
              <div className={styles.loadingDot}></div>
              <div className={styles.loadingDot}></div>
              <div className={styles.loadingDot}></div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>
      <div className={styles.inputArea}>
        {mode === "analyzer" && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleFileChange}
              style={{ display: 'none' }}
              disabled={loading || streaming}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className={styles.newChatButton}
              title="Upload document"
              disabled={loading || streaming}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {uploadedFile && (
              <span style={{ fontSize: '12px', color: '#666', marginRight: '8px' }}>
                📄 {uploadedFile.name}
              </span>
            )}
          </>
        )}
        <button
          onClick={startNewChat}
          className={styles.newChatButton}
          title="Start new chat"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleInputKeyDown}
          placeholder={placeholder}
          disabled={loading || streaming}
          className={styles.chatInput}
        />
        <button
          onClick={handleSubmit}
          disabled={loading || streaming || !query.trim()}
          className={styles.sendButton}
          aria-label="Send"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 21L23 12L2 3V10L17 12L2 14V21Z" fill="currentColor"/>
          </svg>
        </button>
      </div>
    </main>
  );
} 

