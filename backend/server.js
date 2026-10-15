import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import { PDFParse } from "pdf-parse";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { GoogleGenAI } from "@google/genai";
import { MongoClient } from "mongodb";

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY_9,
});

const mongoClient = new MongoClient(process.env.MONGODB_URI);

const db = mongoClient.db(process.env.MONGODB_DB_NAME);
const pdfCollection = db.collection("pdf_chunks");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Store uploaded PDF temporarily in memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed."));
    }
  },
});

// Test route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "PDF Q&A Chatbot backend is running",
  });
});

// PDF upload route

app.post("/api/upload", upload.single("pdf"), async (req, res) => {
  console.log("UPLOAD ROUTE HIT");

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload a PDF file.",
      });
    }

    console.log("PDF received:", req.file.originalname);
    console.log("PDF size:", req.file.size, "bytes");

    // 1. Extract text from PDF
    const parser = new PDFParse({ data: req.file.buffer });
    const result = await parser.getText();

    if (!result || !result.text) {
      return res.status(400).json({
        success: false,
        message: "Could not extract text from PDF (file might be empty or scanned images).",
      });
    }

    // 2. Split text into chunks
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    const chunks = await splitter.splitText(result.text);
    console.log("Total chunks generated:", chunks.length);

    // 3. Generate embeddings loop (Safe batching)
    const embeddings = [];
    for (const chunk of chunks) {
      const embeddingResponse = await ai.models.embedContent({
        model: "gemini-embedding-001",
        contents: chunk,
        config: {
          taskType: "RETRIEVAL_DOCUMENT",
          outputDimensionality: 768,
        },
      });

      const vector = embeddingResponse.embeddings[0].values;
      embeddings.push(vector);
    }

    // 4. Prepare documents for MongoDB
    const documents = chunks.map((chunk, index) => ({
      fileName: req.file.originalname,
      chunkIndex: index,
      text: chunk,
      embedding: embeddings[index],
    }));

    // 5. Save to MongoDB & cleanup
    await pdfCollection.insertMany(documents);
    await parser.destroy();

    return res.json({
      success: true,
      message: "PDF uploaded and text extracted successfully!",
      fileName: req.file.originalname,
      fileSize: req.file.size,
      pages: result.total,
      chunks: chunks.length,
      embeddingCount: embeddings.length,
      storedInMongoDB: true,
    });

  } catch (error) {
    console.error("UPLOAD ERROR DETAILS:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to process PDF",
      error: error.stack,
    });
  }
});

app.post("/api/search", async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({
        success: false,
        message: "Question is required.",
      });
    }

    // 1. Create embedding for the user's question
    const embeddingResponse = await ai.models.embedContent({
      model: "gemini-embedding-001",
      contents: question,
      config: {
        taskType: "RETRIEVAL_QUERY",
        outputDimensionality: 768,
      },
    });

    const queryEmbedding = embeddingResponse.embeddings[0].values;

    // 2. Search MongoDB Vector Search
    const results = await pdfCollection
      .aggregate([
        {
          $vectorSearch: {
            index: "vector_index",
            path: "embedding",
            queryVector: queryEmbedding,
            numCandidates: 50,
            limit: 5,
          },
        },
        {
          $project: {
            _id: 0,
            fileName: 1,
            chunkIndex: 1,
            text: 1,
            score: {
              $meta: "vectorSearchScore",
            },
          },
        },
      ])
      .toArray();

    // 3. Combine retrieved PDF chunks
    const context = results
      .map((result) => result.text)
      .join("\n\n");

    // 4. Ask Gemini to answer using the PDF context
    const prompt = `
You are a helpful PDF question-answering assistant.

Answer the user's question using ONLY the information provided in the PDF context below.

If the answer cannot be found in the PDF context, say:
"I could not find the answer in the uploaded PDF."

Do not make up information.

PDF Context:
${context}

User Question:
${question}

Answer:
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        temperature: 0.2,
        maxOutputTokens: 1000,
      },
    });

    // 5. Return the AI answer
    res.json({
      success: true,
      question,
      answer: response.text,
      sources: results.map((result) => ({
        fileName: result.fileName,
        chunkIndex: result.chunkIndex,
        score: result.score,
      })),
    });
  } catch (error) {
    console.error("RAG error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to generate answer.",
      error: error.message,
    });
  }
});

// Error handler
app.use((error, req, res, next) => {
  console.error(error);

  res.status(400).json({
    success: false,
    message: error.message,
  });
});

try {
  await mongoClient.connect();
  console.log("MongoDB connected successfully!");
} catch (error) {
  console.error("MongoDB connection failed:", error);
  process.exit(1);
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});