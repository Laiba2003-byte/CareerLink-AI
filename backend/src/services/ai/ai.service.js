import { logger } from "../../utils/logger.js";

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

function hasUsableSecret(value = "") {
  return Boolean(value && !value.includes("YOUR_") && !value.includes("REPLACE") && value.trim().length > 8);
}

function normalizeOpenRouterModel(model = "") {
  if (!model) return "openai/gpt-4o-mini";
  if (model.includes("/")) return model;
  if (model.startsWith("gpt-")) return `openai/${model}`;
  return model;
}

function createProviderConfig() {
  if (hasUsableSecret(process.env.OPENROUTER_API_KEY)) {
    const headers = {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json"
    };

    if (process.env.OPENROUTER_SITE_URL) {
      headers["HTTP-Referer"] = process.env.OPENROUTER_SITE_URL;
    }

    if (process.env.OPENROUTER_APP_NAME) {
      headers["X-Title"] = process.env.OPENROUTER_APP_NAME;
    }

    return {
      name: "OpenRouter",
      url: process.env.OPENROUTER_API_URL || process.env.LLM_API_URL || "https://openrouter.ai/api/v1/chat/completions",
      model: normalizeOpenRouterModel(process.env.OPENROUTER_MODEL || process.env.OPENAI_MODEL),
      headers
    };
  }

  if (hasUsableSecret(process.env.OPENAI_API_KEY)) {
    return {
      name: "OpenAI",
      url: process.env.LLM_API_URL || "https://api.openai.com/v1/chat/completions",
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      }
    };
  }

  return null;
}

function safeUrlHost(url = "") {
  try {
    return new URL(url).host;
  } catch {
    return "invalid-url";
  }
}

export async function generateJson({ system, prompt, fallback, task = "ai.generateJson" }) {
  const provider = createProviderConfig();

  if (!provider) {
    logger.warn("ai.provider.missing", { task, fallback: true });
    return fallback();
  }

  const startedAt = Date.now();
  logger.info("ai.request.start", {
    task,
    provider: provider.name,
    model: provider.model,
    host: safeUrlHost(provider.url),
    promptChars: String(prompt || "").length
  });

  try {
    const response = await fetch(provider.url, {
      method: "POST",
      headers: provider.headers,
      body: JSON.stringify({
        model: provider.model,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: `${system}\nReturn only valid JSON.` },
          { role: "user", content: prompt }
        ],
        temperature: 0.4
      })
    });

    const elapsedMs = Date.now() - startedAt;
    logger.info("ai.response.received", {
      task,
      provider: provider.name,
      model: provider.model,
      status: response.status,
      elapsedMs
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.warn("ai.response.error", {
        task,
        provider: provider.name,
        status: response.status,
        bodyPreview: errorText.slice(0, 240)
      });
      throw new Error(`${provider.name} request failed with ${response.status}: ${errorText.slice(0, 240)}`);
    }

    const payload = await response.json();
    const text =
      payload.choices?.[0]?.message?.content ||
      payload.output_text ||
      payload.output?.[0]?.content?.[0]?.text;
    const parsed = extractJson(text);

    if (!parsed) {
      logger.warn("ai.response.parse_failed", {
        task,
        provider: provider.name,
        textPreview: String(text || "").slice(0, 240)
      });
      return fallback();
    }

    logger.debug("ai.response.parsed", {
      task,
      keys: Object.keys(parsed)
    });

    return parsed;
  } catch (error) {
    logger.warn("ai.fallback.used", { task, reason: error.message });
    return fallback();
  }
}
