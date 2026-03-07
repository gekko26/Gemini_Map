export async function chatWithGemini(prompt: string): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const body = {
    contents: [{
      parts: [{
        text: `You are a map assistant. RESPOND ONLY IN RAW JSON.
        Format: {"message": "text", "lat": number, "lng": number, "view": "map"|"streetview", "destination": "name"}
        User: "${prompt}"`
      }]
    }],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: "application/json"
    }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    // Guard against API errors (like your 429 Quota Exceeded)
    if (data.error) {
      console.warn("Gemini Error:", data.error.message);
      return JSON.stringify({ 
        message: "I've hit my daily limit! I'll be back once my quota resets.",
        view: "map" 
      });
    }

    // Safe access using optional chaining
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) return JSON.stringify({ message: "AI is silent.", view: "map" });

    return rawText.replace(/```json/g, "").replace(/```/g, "").trim();

  } catch (error) {
    return JSON.stringify({ message: "Network error occurred.", view: "map" });
  }
}