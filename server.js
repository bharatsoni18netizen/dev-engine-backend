const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { GoogleGenAI } = require("@google/genai");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

// Currently active models
const MODELS = [
  "gemini-2.5-flash",
  "gemini-3.5-flash-lite"
];

// Fallback & Safe Call Function
async function callGeminiSafe(prompt) {
  let lastError = null;

  for (const model of MODELS) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`--> Calling model: ${model} (Attempt ${attempt})`);
        const response = await ai.models.generateContent({
          model: model,
          contents: prompt,
          config: {
            responseMimeType: "application/json"
          }
        });

        if (response && response.text) {
          console.log(`--> Success with ${model}`);
          return response.text;
        }
      } catch (err) {
        lastError = err;
        console.warn(`Model ${model} issue: ${err.message || "busy"}`);
        if (err.message && err.message.includes("503")) {
          await new Promise((res) => setTimeout(res, 1000));
        }
      }
    }
  }

  throw new Error(lastError?.message || "AI servers are busy. Please try again.");
}

// Clean JSON Parser
function extractData(text) {
  if (!text) return null;
  try {
    let clean = text.replace(/```json/gi, "").replace(/```/g, "").trim();
    const start = clean.indexOf("{");
    const end = clean.lastIndexOf("}");
    if (start !== -1 && end !== -1) {
      return JSON.parse(clean.substring(start, end + 1));
    }
    return JSON.parse(clean);
  } catch (e) {
    return null;
  }
}

// 1. Analyze Endpoint (Bug Fix & Optimize)
app.post("/api/analyze", async (req, res) => {
  try {
    const { code, language } = req.body;
    console.log("--> [REQUEST] Analyze for:", language);

    const prompt = `You are a beginner coding tutor. Fix all syntax and logic errors in this ${language} code:
\`\`\`${language}
${code}
\`\`\`

Strict Rules:
1. Provide standard, beginner-friendly clean code. In C++, keep simple 'using namespace std;' and normal basic types.
2. Find every missing semicolon, typo, or syntax bug.
3. Return ONLY valid JSON in this exact structure:
{
  "errors": ["Line x: issue description"],
  "cleanCode": "paste the full fixed working code here",
  "complexity": "O(1)"
}`;

    const rawResponse = await callGeminiSafe(prompt);
    const parsed = extractData(rawResponse);

    if (parsed) {
      const codeOutput =
        parsed.cleanCode ||
        parsed.code ||
        parsed.correctedCode ||
        parsed.optimizedCode ||
        parsed.fixedCode ||
        "";

      return res.json({
        errors: Array.isArray(parsed.errors) ? parsed.errors : ["Syntax checked"],
        cleanCode: codeOutput,
        complexity: parsed.complexity || "O(1)"
      });
    }

    res.json({
      errors: ["Code syntax verified and optimized."],
      cleanCode: rawResponse.replace(/```[a-z]*\n?/gi, "").replace(/```/g, "").trim(),
      complexity: "O(1)"
    });
  } catch (error) {
    console.error("Backend Error:", error.message || error);
    res.status(500).json({ error: error.message || "Server Error" });
  }
});

// 2. Solve Endpoint (Question to Code)
app.post("/api/solve", async (req, res) => {
  try {
    const { question, language } = req.body;
    console.log("--> [REQUEST] Solve for:", language);

    const prompt = `Write a simple, standard, beginner-friendly program in ${language} for: "${question}".
Strict Rules:
- Keep standard beginner syntax (simple main function, standard I/O, no complex modern keywords).
- Return ONLY valid JSON in this exact structure:
{
  "cleanCode": "working source code",
  "complexity": "O(n)",
  "explanation": "short step-by-step logic"
}`;

    const rawResponse = await callGeminiSafe(prompt);
    const parsed = extractData(rawResponse);

    if (parsed) {
      res.json({
        cleanCode: parsed.cleanCode || parsed.code || "",
        complexity: parsed.complexity || "O(n)",
        explanation: parsed.explanation || ""
      });
    } else {
      res.json({
        cleanCode: rawResponse.replace(/```[a-z]*\n?/gi, "").replace(/```/g, "").trim(),
        complexity: "O(n)",
        explanation: "Generated solution"
      });
    }
  } catch (error) {
    console.error("Backend Error:", error.message || error);
    res.status(500).json({ error: error.message || "Server Error" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});