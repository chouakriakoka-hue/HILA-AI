HILA AI + Gemini API

الملفات

- "index.html": واجهة HILA AI التي تعدّلها في Acode.
- "server/index.js": خادم Node.js يتصل بـ Gemini API ويحمي مفتاح API.
- ".env.example": نموذج إعدادات مفتاح Gemini.

التشغيل

1. ثبّت Node.js في بيئة تشغيل مناسبة (على Android يمكنك استعمال Termux؛ Acode محرر كود وليس خادماً).
2. افتح مجلد المشروع في بيئة الطرفية.
3. نفّذ: "npm install"
4. انسخ ".env.example" إلى ملف اسمه ".env".
5. افتح ".env" وضع مفتاح Gemini API مكان "ضع_مفتاحك_هنا"، ولا تشارك الملف.
6. نفّذ: "npm start"
7. افتح "index.html" عبر خادم ويب، وليس بالضرورة عبر معاينة "file://". الواجهة تتصل بالخادم عبر "/api/chat".

عند النشر على Render

- استخدم Render Web Service.
- Build Command: "npm install"
- Start Command: "npm start"
- أضف مفتاح "GEMINI_API_KEY" في Environment Variables.
- لا تضع مفتاح Gemini داخل "index.html" أو JavaScript الخاص بالواجهة.

تنبيه

- مفتاح Gemini يبقى في الخادم فقط.
- استخدام Gemini API قد يخضع لحدود الاستخدام أو رسوم حسب الخدمة والخطة.
- عند نشر الموقع على الإنترنت، استخدم HTTPS، وقيّد CORS، وأضف حماية من إساءة الاستخدام.
