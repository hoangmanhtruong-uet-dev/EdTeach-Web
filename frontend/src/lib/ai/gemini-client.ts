// Server-side Gemini AI caller with automatic fallback models, abort timeouts, and resilient JSON parsing

export type GeminiTier = "free" | "pro" | "max";

/**
 * Smart API Key Router phân tầng theo 3 gói (FREE - PRO - MAX):
 * - tier = 'max': Sử dụng GEMINI_API_KEY_MAX (hoặc GEMINI_API_MAX_KEY) (Thinking, Live Clone, Scaffold, Multi-method, Remediation)
 * - tier = 'pro': Sử dụng GEMINI_API_KEY_PRO (hoặc GEMINI_API_PRO_KEY) (Tạo đề GDPT, URL import, Vision OMR Fallback)
 * - tier = 'free': Sử dụng GEMINI_API_KEY_FREE (hoặc GEMINI_API_FREE_KEY) (Tạo đề Flash cơ bản, tối đa 3 lượt/ngày)
 * - Fallback tự động về GEMINI_API_KEY_PAID / GEMINI_API_KEY chung nếu biến môi trường riêng chưa cấu hình.
 */
export function resolveGeminiApiKey(tierOrPaid: GeminiTier | boolean = "free"): string {
  let tier: GeminiTier = "free";
  if (typeof tierOrPaid === "boolean") {
    tier = tierOrPaid ? "pro" : "free";
  } else {
    tier = tierOrPaid;
  }

  if (tier === "max") {
    return (
      process.env.GEMINI_API_KEY_MAX ||
      process.env.GEMINI_API_MAX_KEY ||
      process.env.GEMINI_API_KEY_PRO ||
      process.env.GEMINI_API_PRO_KEY ||
      process.env.GEMINI_API_KEY_PAID ||
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_AI_API_KEY ||
      ""
    );
  }

  if (tier === "pro") {
    return (
      process.env.GEMINI_API_KEY_PRO ||
      process.env.GEMINI_API_PRO_KEY ||
      process.env.GEMINI_API_KEY_PAID ||
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_AI_API_KEY ||
      ""
    );
  }

  // Free tier
  return (
    process.env.GEMINI_API_KEY_FREE ||
    process.env.GEMINI_API_FREE_KEY ||
    process.env.GEMINI_API_FREE_KEY_2 ||
    process.env.GEMINI_API_FREE_KEY_3 ||
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_AI_API_KEY ||
    process.env.GEMINI_API_KEY_PRO ||
    process.env.GEMINI_API_PRO_KEY ||
    process.env.GEMINI_API_KEY_PAID ||
    ""
  );
}

export function getGeminiApiKey(tierOrPaid: GeminiTier | boolean = false): string {
  return resolveGeminiApiKey(tierOrPaid);
}

export async function callGeminiJson<T = any>(
  prompt: string,
  preferredModels: string[] = ["gemini-3.5-flash-lite", "gemini-flash-lite-latest", "gemini-flash-latest", "gemini-3.8-flash"],
  tierOrPaid: GeminiTier | boolean = false
): Promise<T> {
  const geminiKey = resolveGeminiApiKey(tierOrPaid);

  if (!geminiKey) {
    throw new Error("Chưa cấu hình GEMINI_API_KEY trong hệ thống.");
  }

  let lastError: any = null;

  // Sprint 6 Cost Guard: Prompt Length Fencing (max 25,000 chars)
  const safePrompt = prompt.length > 25000 ? prompt.slice(0, 25000) : prompt;

  for (const model of preferredModels) {
    try {
      // 12-second timeout per model to prevent teacher's UI from hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [{ parts: [{ text: safePrompt }] }],
            generationConfig: {
              temperature: 0.35,
              responseMimeType: "application/json",
              maxOutputTokens: 3072, // Sprint 6 Cost Guard: Token cap ceiling
            },
          }),
        }
      );

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          try {
            return JSON.parse(text) as T;
          } catch {
            // Clean markdown code blocks and extract JSON object or array
            const clean = text.replace(/```json/gi, "").replace(/```/g, "").trim();
            const matched = clean.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
            if (matched) {
              return JSON.parse(matched[0]) as T;
            }
            return JSON.parse(clean) as T;
          }
        }
      } else {
        const errText = await res.text();
        console.warn(`Model ${model} returned status ${res.status}`);
        lastError = new Error(`Hệ thống AI bận (${model} code ${res.status}).`);
      }
    } catch (e: any) {
      if (e.name === "AbortError") {
        console.warn(`Model ${model} timed out after 12s, switching to next fallback model...`);
      } else {
        console.warn(`Model ${model} failed:`, e.message);
      }
      lastError = e;
    }
  }

  throw lastError || new Error("Không thể kết nối đến máy chủ AI.");
}
