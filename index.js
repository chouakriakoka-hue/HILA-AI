
import express from "express";
import cors from "cors";
import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

const apiKey = process.env.GEMINI_API_KEY;
const client = apiKey ? new GoogleGenAI({ apiKey }) : null;

const PRIMARY_MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";
const FALLBACK_MODEL = process.GEMINI_FALLBACK_MODEL || "gemini-3.6-flash-lite";

const SYSTEM_PROMPT =
  "أنت HILA AI، مساعد ذكي مفيد وواضح. أجب بلغة المستخدم، ويمكنك استعمال الدارجة الجزائرية عندما يكتب بها. اشرح ببساطة ولا تخترع معلومات.";

app.get("/", (_req, res) => {
  res.send("HILA AI backend is running.");
});

// انتظار قبل إعادة المحاولة
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Retry للأخطاء المؤقتة
async function generateWithRetry(model, contents, maxRetries = 3) {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await client.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction: SYSTEM_PROMPT,
        },
      });
    } catch (error) {
      lastError = error;

      const status = Number(
        error?.status || error?.code || error?.response?.status
      );

      const retryable = [429, 500, 502, 503, 504].includes(status);

      if (!retryable || attempt === maxRetries) {
        throw error;
      }

      const delay = Math.min(1000 * 2 ** attempt, 8000);
      console.log(
        `Gemini ${model} error ${status}. Retry ${attempt + 1}/${maxRetries} in ${delay}ms`
      );

      await sleep(delay);
    }
  }

  throw lastError;
}

app.post("/api/chat", async (req, res) => {
  try {
    if (!client) {
      return res.status(500).json({
        error: "مفتاح Gemini API غير مضبوط في إعدادات Render.",
      });
    }

    const incoming = Array.isArray(req.body?.messages)
      ? req.body.messages
      : [];

    const messages = incoming
      .filter(
        (m) =>
          m &&
          (m.role === "user" || m.role === "assistant") &&
          typeof m.content === "string"
      )
      .slice(-30)
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content.slice(0, 8000) }],
      }));

    if (!messages.length || messages[messages.length - 1].role !== "user") {
      return res.status(400).json({
        error: "اكتب رسالة أولاً.",
      });
    }

    let response;

    // تجربة الموديل الرئيسي
    try {
      response = await generateWithRetry(PRIMARY_MODEL, messages, 3);
    } catch (primaryError) {
      console.error("Primary Gemini model failed:", primaryError?.message);

      // تجربة الموديل الاحتياطي
      if (FALLBACK_MODEL && FALLBACK_MODEL !== PRIMARY_MODEL) {
        console.log("Trying fallback model:", FALLBACK_MODEL);

        try {
          response = await generateWithRetry(FALLBACK_MODEL, messages, 1);
        } catch (fallbackError) {
          console.error("Fallback model failed:", fallbackError?.message);
          throw fallbackError;
        }
      } else {
        throw primaryError;
      }
    }

    const reply =
      response?.text?.trim() || "ما قدرتش نولّد إجابة، حاول مرة أخرى.";

    return res.json({ reply });
  } catch (error) {
    console.error("HILA API error:", error);

    const status = Number(
      error?.status || error?.code || error?.response?.status
    );

    if (status === 429) {
      return res.status(429).json({
        error: "الطلبات كثيرة حاليًا، استنى شوية وعاود.",
      });
    }

    if ([500, 502, 503, 504].includes(status)) {
      return res.status(503).json({
        error: "خدمة الذكاء الاصطناعي غير متاحة مؤقتًا. حاول بعد قليل.",
      });
    }

    return res.status(500).json({
      error: "حدث خطأ أثناء الاتصال بـ Gemini. تحقق من إعدادات API.",
    });
  }
});

const port = Number(process.env.PORT || 3001);

app.listen(port, "0.0.0.0", () => {
  console.log(`HILA AI server running on port ${port}`);
});
