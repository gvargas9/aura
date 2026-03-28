import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface ChatRequestBody {
  message: string;
  conversationHistory: { role: string; content: string }[];
}

interface ChatResponseBody {
  reply: string;
  suggestions?: string[];
}

const SYSTEM_PROMPT = `You are Aura, a friendly and knowledgeable food assistant for the Aura premium shelf-stable food platform. You help customers with:
- Finding meals based on dietary preferences (vegan, keto, gluten-free, paleo)
- Product recommendations based on taste preferences
- Order tracking and subscription management questions
- Explaining shelf-stable food benefits (no refrigeration, long shelf life, all-natural)
- Box building suggestions

Keep responses concise (2-3 sentences max). Be warm but professional.
If asked about prices: Starter box (8 meals) $59.99/mo, Voyager (12 meals) $84.99/mo, Bunker (24 meals) $149.99/mo.
Always suggest building a box when relevant.`;

function buildUserContext(profile: {
  full_name: string | null;
  role: string;
  dietary_restrictions: string[] | null;
  taste_preferences: unknown;
} | null): string {
  if (!profile) return "";

  const parts: string[] = [];
  if (profile.full_name) {
    parts.push(`The user's name is ${profile.full_name}.`);
  }
  if (profile.dietary_restrictions && profile.dietary_restrictions.length > 0) {
    parts.push(
      `Their dietary restrictions: ${profile.dietary_restrictions.join(", ")}.`
    );
  }

  return parts.length > 0
    ? `\n\nUser context: ${parts.join(" ")}`
    : "";
}

async function searchProducts(
  query: string
): Promise<string> {
  try {
    const supabase = await createClient();

    const { data: products, error } = await supabase
      .from("aura_products")
      .select("name, price, category, dietary_labels, short_description")
      .eq("is_active", true)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%,tags.cs.{${query}}`)
      .limit(5);

    if (error || !products || products.length === 0) {
      return "";
    }

    const productList = products
      .map(
        (p) =>
          `- ${p.name} ($${p.price}) [${p.category}]${p.dietary_labels?.length ? ` - ${p.dietary_labels.join(", ")}` : ""}${p.short_description ? `: ${p.short_description}` : ""}`
      )
      .join("\n");

    return `\n\nRelevant products from our catalog:\n${productList}`;
  } catch {
    return "";
  }
}

function shouldSearchProducts(message: string): boolean {
  const productKeywords = [
    "recommend",
    "suggest",
    "find",
    "looking for",
    "popular",
    "best",
    "favorite",
    "vegan",
    "keto",
    "gluten",
    "paleo",
    "spicy",
    "meal",
    "food",
    "product",
    "entree",
    "snack",
    "breakfast",
    "lunch",
    "dinner",
    "choose",
    "dietary",
    "option",
    "what do you have",
    "show me",
    "menu",
  ];
  const lower = message.toLowerCase();
  return productKeywords.some((kw) => lower.includes(kw));
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequestBody = await request.json();

    if (!body.message || typeof body.message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    if (body.message.length > 2000) {
      return NextResponse.json(
        { error: "Message is too long (max 2000 characters)" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GOOGLE_GEMINI_API_KEY is not configured");
      return NextResponse.json(
        { reply: "I'm temporarily unavailable. Please try again later." },
        { status: 200 }
      );
    }

    // Get user profile if authenticated (optional)
    let userContext = "";
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, role, dietary_restrictions, taste_preferences")
          .eq("id", user.id)
          .single();

        userContext = buildUserContext(profile);
      }
    } catch {
      // Auth is optional, continue without user context
    }

    // Search products if the message relates to food/products
    let productContext = "";
    if (shouldSearchProducts(body.message)) {
      productContext = await searchProducts(body.message);
    }

    // Build conversation for Gemini
    const systemInstruction = SYSTEM_PROMPT + userContext + productContext;

    // Map conversation history to Gemini format
    const conversationHistory = (body.conversationHistory || [])
      .slice(-10) // Keep last 10 messages for context
      .map((msg) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      }));

    const geminiPayload = {
      system_instruction: {
        parts: [{ text: systemInstruction }],
      },
      contents: conversationHistory,
      generationConfig: {
        temperature: 0.7,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 300,
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
      ],
    };

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(geminiPayload),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("Gemini API error:", geminiRes.status, errText);
      return NextResponse.json<ChatResponseBody>({
        reply:
          "I'm having a moment -- could you try again? In the meantime, feel free to browse our menu!",
      });
    }

    const geminiData = await geminiRes.json();
    const reply =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "I couldn't come up with a response. Could you rephrase your question?";

    // Generate contextual suggestions
    const suggestions = generateSuggestions(body.message, reply);

    return NextResponse.json<ChatResponseBody>({ reply, suggestions });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json<ChatResponseBody>({
      reply:
        "Something went wrong on my end. Please try again in a moment!",
    });
  }
}

function generateSuggestions(
  _userMessage: string,
  _aiReply: string
): string[] {
  // Return contextual follow-up suggestions
  const lower = _aiReply.toLowerCase();

  if (lower.includes("box") || lower.includes("subscription")) {
    return ["Tell me about box sizes", "What's the best value?"];
  }
  if (lower.includes("vegan") || lower.includes("dietary") || lower.includes("keto")) {
    return ["Show me all vegan options", "Any gluten-free meals?"];
  }
  if (lower.includes("order") || lower.includes("shipping")) {
    return ["When will my order arrive?", "Can I change my order?"];
  }

  return ["Build my box", "What's on sale?"];
}
