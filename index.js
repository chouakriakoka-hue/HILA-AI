OPENAI express from "express";
import cors from "cors";
import "dotenv/config";
import OpenAI from "openai";

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

const apiKey = process.env.GEMINI_API_KEY;
const client = apiKey ? new GEMINI({ apiKey;
const model = process.env.OPENAI_MODEL || "gemini-3.8-flash";
appp.get("/", (_req, res) => {
  res.send("HILA AI backend is running.");
});

app.post("/api/chat", async (req, res) => {
  try {
    if (!client) {
      return res.status(500).json({ error: "مفتاح Gemeni غير مضبوط في ملف .env" });
    }

    const incoming = Array.isArray(req.body?.messages) ? req.body.messages : [];
    const messages = incoming
      .filter(m =>
        m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string"
      )
      .slice(-30)
      .map(m => ({ role: m.role, content: m.content.slice(0, 8000) }));

    if (!messages.length || messages[messages.length - 1].role !== "user") {
      return res.status(400).json({ error: "اكتب رسالة أولاً." });
    }

    const response = await client.responses.create({
      model,
      instructions:
        "أنت HILA AI، مساعد ذكي مفيد وواضح. أجب بلغة المستخدم، ويمكنك استعمال الدارجة الجزائرية عندما يكتب بها. اشرح ببساطة ولا تخترع معلومات.",
      input: messages
    });

    res.json({ reply: response.output_text || "ما قدرتش نولّد إجابة." });
  } catch (error) {
    console.error("HILA API error:", error);
    res.status(500).json({ error: "حدث خطأ أثناء الاتصال بـ Gemeni. تحقق من إعدادات API." });
  }
});

const port = Number(process.env.PORT || 3001);
app.listen(port, "0.0.0.0", () => {
  console.log(`HILA AI server running on port ${port}`);
});
