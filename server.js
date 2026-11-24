
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = express();
const port = process.env.PORT || 3001;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(express.json({ limit: "32kb" }));
app.use(express.static(__dirname));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.post("/api/chat", async (req, res) => {
  try {
    const key = process.env.GEMINI_API_KEY;

    if (!key) {
      return res.status(503).json({
        error: "GEMINI_API_KEY غير مضبوط في Render."
      });
    }

    const incoming = req.body?.messages;

    if (!Array.isArray(incoming) || incoming.length === 0) {
      return res.status(400).json({
        error: "أرسل رسالة صحيحة."
      });
    }

    const messages = incoming.slice(-30)
      .filter(m =>
        m &&
        ["user", "assistant"].includes(m.role) &&
        typeof m.content === "string"
      );

    const contents = messages.map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content.slice(0, 6000) }]
    }));

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": key
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{
              text: "أنت HILA AI، مساعد مفيد. أجب بلغة المستخدم وادعم العربية والدارجة الجزائرية."
            }]
          },
          contents,
          generationConfig: {
            maxOutputTokens: 900
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini error:", data);
      return res.status(502).json({
        error: "تعذر الاتصال بـ Gemini. تحقق من المفتاح وحدود الاستخدام."
      });
    }

    const reply = data.candidates?.[0]?.content?.parts
      ?.map(p => p.text || "")
      .join("") || "لم يصل رد.";

    res.json({ reply });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "حدث خطأ في الخادم."
    });
  }
});

app.listen(port, "0.0.0.0", () => {
  console.log("HILA AI Gemini server running");
});
