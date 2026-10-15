# 📄 PDF Q&A Chatbot

An AI-powered RAG (Retrieval-Augmented Generation) chatbot that allows users to upload PDF documents and ask questions about their content.

The application extracts text from uploaded PDFs, splits the text into smaller chunks, generates embeddings using Gemini, stores them in MongoDB Atlas, retrieves relevant chunks using MongoDB Vector Search, and generates answers using the Gemini API.

## ✨ Features

- 📄 Upload PDF documents
- 🔍 Extract text from PDFs
- ✂️ Split documents into smaller chunks
- 🧠 Generate Gemini embeddings
- 🗄️ Store document chunks and embeddings in MongoDB Atlas
- 🔎 Semantic search using MongoDB Vector Search
- 🤖 Generate answers using Gemini
- 💬 Chat history
- 📚 Display retrieved sources
- 🧹 Clear chat functionality
- 📱 Responsive frontend
- ⏳ Loading state while generating answers

## 🛠️ Technologies Used

### Frontend
- React
- Vite
- CSS

### Backend
- Node.js
- Express.js
- Multer
- pdf-parse

### AI / RAG
- LangChain
- Gemini API
- Gemini Embeddings
- Retrieval-Augmented Generation (RAG)

### Database
- MongoDB Atlas
- MongoDB Vector Search

## 🏗️ Project Architecture

```text
React Frontend
       ↓
Node.js + Express Backend
       ↓
PDF Upload
       ↓
PDF Text Extraction
       ↓
LangChain Text Chunking
       ↓
Gemini Embeddings
       ↓
MongoDB Atlas
       ↓
MongoDB Vector Search
       ↓
Relevant PDF Chunks
       ↓
Gemini
       ↓
AI Answer
```

## 📁 Project Structure

```text
pdf-qa-chatbot_project/
│
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── .env
│   └── .gitignore
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── main.jsx
│   ├── index.html
│   └── package.json
│
└── README.md
```

## ⚙️ Installation

### 1. Clone the repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd pdf-qa-chatbot_project
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Create the backend `.env` file

Create a `.env` file inside the `backend` folder:

```env
GEMINI_API_KEY=your_gemini_api_key
MONGODB_URI=your_mongodb_connection_string
MONGODB_DB_NAME=pdf_qa_chatbot
PORT=5000
```

Do not upload your `.env` file to GitHub.

### 4. Start the backend

```bash
npm run dev
```

The backend runs on:

```text
http://localhost:5000
```

### 5. Install frontend dependencies

Open another terminal:

```bash
cd frontend
npm install
```

### 6. Start the frontend

```bash
npm run dev
```

The frontend runs on:

```text
http://localhost:5173
```

## 🔄 How It Works

### PDF Processing

When a PDF is uploaded:

1. The backend receives the PDF.
2. PDF text is extracted.
3. LangChain splits the text into chunks.
4. Gemini generates an embedding for each chunk.
5. Chunks and embeddings are stored in MongoDB Atlas.

### Question Answering

When the user asks a question:

1. The question is converted into an embedding.
2. MongoDB Vector Search finds the most relevant PDF chunks.
3. The retrieved chunks are provided to Gemini as context.
4. Gemini generates an answer using the retrieved PDF information.
5. The answer and retrieved sources are displayed in the React interface.

## 🔐 Environment Variables

The application requires:

| Variable | Description |
|---|---|
| `GEMINI_API_KEY` | Gemini API key |
| `MONGODB_URI` | MongoDB Atlas connection string |
| `MONGODB_DB_NAME` | MongoDB database name |
| `PORT` | Backend server port |

## ⚠️ Important

Never commit your `.env` file or API keys to GitHub.

The backend `.gitignore` contains:

```text
node_modules/
.env
```

## 🚀 Future Improvements

- Multiple PDF/document management
- User authentication
- Persistent chat sessions
- Better source previews
- Streaming AI responses
- Production deployment
- Document deletion and management
- Improved conversation memory

## 👩‍💻 Project

This project was built as a portfolio project to demonstrate full-stack development, RAG architecture, AI integration, vector search, and document-based question answering.