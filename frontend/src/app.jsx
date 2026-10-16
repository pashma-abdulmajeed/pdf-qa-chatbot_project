import { useState } from "react";
import "./app.css";

function App() {
  const [file, setFile] = useState(null);
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploaded, setUploaded] = useState(false);

  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) {
      setUploadMessage("Please select a PDF first.");
      return;
    }

    const formData = new FormData();
    formData.append("pdf", file);

    try {
      setUploadMessage("Processing your PDF...");
      setUploaded(false);

      const response = await fetch("http://localhost:5000/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setUploadMessage(
          `PDF ready • ${data.chunks} chunks created`
        );
        setUploaded(true);
      } else {
        setUploadMessage(data.message || "Upload failed.");
      }
    } catch (error) {
      console.error(error);
      setUploadMessage("Could not connect to the backend.");
    }
  };

  const handleAsk = async () => {
    if (!question.trim() || loading) {
      return;
    }

    const userQuestion = question.trim();

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        text: userQuestion,
      },
    ]);

    setQuestion("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: userQuestion,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: data.answer,
            sources: data.sources || [],
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: data.message || "Could not get an answer.",
            sources: [],
          },
        ]);
      }
    } catch (error) {
      console.error(error);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Could not connect to the backend.",
          sources: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div className="app">
      <div className="container">

        {/* Header */}
        <header className="header">
          <div className="logo">📄</div>

          <h1>PDF Q&A Assistant</h1>

          <p>
            Upload a PDF and ask questions using AI-powered
            document search.
          </p>
        </header>

        {/* Upload Card */}
        <section className="card upload-card">

          <div className="section-title">
            <div>
              <h2>Upload Document</h2>
              <p>Choose a PDF to start asking questions.</p>
            </div>
          </div>

          <div className="upload-area">

            <div className="upload-icon">
              📁
            </div>

            <input
              id="pdf-upload"
              type="file"
              accept=".pdf"
              onChange={(e) => {
                setFile(e.target.files[0]);
                setUploadMessage("");
                setUploaded(false);
              }}
            />

            <label htmlFor="pdf-upload" className="file-label">
              Choose PDF
            </label>

            {file && (
              <div className="selected-file">
                <span>📄</span>
                <span>{file.name}</span>
              </div>
            )}

            <button
              className="upload-button"
              onClick={handleUpload}
            >
              {uploaded ? "PDF Uploaded ✓" : "Process PDF"}
            </button>

            {uploadMessage && (
              <p className={`upload-status ${uploaded ? "success" : ""}`}>
                {uploaded && "✓ "}
                {uploadMessage}
              </p>
            )}

          </div>
        </section>

        {/* Chat Card */}
        <section className="card chat-card">

          <div className="chat-header">

            <div>
              <h2>Chat with your PDF</h2>
              <p>Ask anything about the uploaded document.</p>
            </div>

            {messages.length > 0 && (
              <button
                className="clear-button"
                onClick={clearChat}
              >
                Clear chat
              </button>
            )}

          </div>

          {/* Chat Messages */}
          <div className="messages">

            {messages.length === 0 && (
              <div className="empty-chat">

                <div className="empty-icon">
                  💬
                </div>

                <h3>Start a conversation</h3>

                <p>
                  Ask a question and the AI will find
                  relevant information from your PDF.
                </p>

              </div>
            )}

            {messages.map((message, index) => (

              <div
                key={index}
                className={`message-row ${message.role}`}
              >

                <div className="avatar">
                  {message.role === "user" ? "You" : "AI"}
                </div>

                <div className="message-content">

                  <span className="message-name">
                    {message.role === "user"
                      ? "You"
                      : "AI Assistant"}
                  </span>

                  <div className="message-bubble">
                    <p>{message.text}</p>

                    {message.role === "assistant" &&
                      message.sources &&
                      message.sources.length > 0 && (

                        <div className="sources">

                          <h4>📚 Retrieved Sources</h4>

                          {message.sources.map(
                            (source, sourceIndex) => (

                              <div
                                className="source-item"
                                key={sourceIndex}
                              >

                                <div>
                                  📄{" "}
                                  <strong>
                                    {source.fileName}
                                  </strong>
                                </div>

                                <span>
                                  Chunk {source.chunkIndex}
                                </span>

                                <span>
                                  Relevance{" "}
                                  {source.score
                                    ? source.score.toFixed(3)
                                    : "N/A"}
                                </span>

                              </div>

                            )
                          )}

                        </div>
                      )}

                  </div>

                </div>

              </div>

            ))}

            {loading && (

              <div className="message-row assistant">

                <div className="avatar">
                  AI
                </div>

                <div className="message-content">

                  <span className="message-name">
                    AI Assistant
                  </span>

                  <div className="message-bubble thinking">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>

                </div>

              </div>

            )}

          </div>

          {/* Input */}
          <div className="question-area">

            <input
              type="text"
              placeholder="Ask something about your PDF..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleAsk();
                }
              }}
            />

            <button
              className="ask-button"
              onClick={handleAsk}
              disabled={loading}
            >
              {loading ? "..." : "Ask"}
            </button>

          </div>

        </section>

        {/* Footer */}
        <footer>
          Built with React • Node.js • LangChain • MongoDB • Gemini
        </footer>

      </div>
    </div>
  );
}

export default App;