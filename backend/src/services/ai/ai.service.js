function extractJson(text) {
  if (!text) return null;
  const cleaned = String(text)
    .trim()
    .replace(/^```json/i, "")
    .replace(/^```/, "")
    .replace(/```$/, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : null;
  }
}

export async function generateJson({ system, prompt, fallback }) {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  if (!apiKey) {
    return fallback();
  }

  try {
    const response = await fetch(process.env.LLM_API_URL || "https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: `${system}\nReturn only valid JSON.` },
          { role: "user", content: prompt }
        ],
        temperature: 0.4
      })
    });

    if (!response.ok) {
      throw new Error(`LLM request failed with ${response.status}`);
    }

    const payload = await response.json();
    const text =
      payload.choices?.[0]?.message?.content ||
      payload.output_text ||
      payload.output?.[0]?.content?.[0]?.text;
    const parsed = extractJson(text);

    return parsed || fallback();
  } catch (error) {
    console.warn("AI fallback used:", error.message);
    return fallback();
  }
}
