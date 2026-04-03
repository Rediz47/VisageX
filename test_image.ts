import 'dotenv/config';

const apiKey = process.env.VERTEX_API_KEY;
const model = 'gemini-3-flash-preview';
const VERTEX_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

const url = `${VERTEX_BASE}/${model}:generateContent?key=${apiKey}`;

// 1 pixel transparent png
const base64Data = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    contents: [{ 
      role: 'user', 
      parts: [
        { inlineData: { data: base64Data, mimeType: "image/png" } },
        { text: "Who was the first president of US?" }
      ] 
    }],
    tools: [{ googleSearch: {} }]
  }),
}).then(async r => {
  console.log('googleSearch with image:', r.status);
  console.log(await r.text());
}).catch(console.error);
