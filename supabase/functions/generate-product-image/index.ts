import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, corsResponse, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { createAdminClient, requireAdmin } from "../_shared/auth.ts";

interface ImageRequest {
  productName: string;
  description: string;
  category: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return corsResponse();
  }

  try {
    const supabase = createAdminClient();

    // ---- Admin only ----
    const admin = await requireAdmin(req, supabase);
    if (!admin) {
      return errorResponse("Admin access required", 403);
    }

    const body: ImageRequest = await req.json();

    if (!body.productName) {
      return errorResponse("productName is required");
    }

    const apiKey = Deno.env.get("GOOGLE_GEMINI_API_KEY");
    if (!apiKey) {
      return errorResponse("Image generation service is not configured", 503);
    }

    // ---- Build prompt ----
    const prompt = buildImagePrompt(body.productName, body.description, body.category);

    // ---- Call Imagen 4.0 via Gemini API ----
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${apiKey}`;

    const geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instances: [{ prompt }],
        parameters: {
          sampleCount: 1,
          aspectRatio: "1:1",
          safetyFilterLevel: "block_medium_and_above",
          personGeneration: "dont_allow",
        },
      }),
    });

    if (!geminiResponse.ok) {
      const errBody = await geminiResponse.text();
      console.error("Gemini API error:", geminiResponse.status, errBody);
      return errorResponse(`Image generation failed: ${geminiResponse.status}`, 502);
    }

    const geminiData = await geminiResponse.json();

    // Extract base64 image from response
    const predictions = geminiData.predictions;
    if (!predictions || predictions.length === 0 || !predictions[0].bytesBase64Encoded) {
      return errorResponse("No image was generated", 502);
    }

    const base64Image = predictions[0].bytesBase64Encoded;
    const imageBytes = Uint8Array.from(atob(base64Image), (c) => c.charCodeAt(0));

    // ---- Upload to Supabase Storage ----
    const fileName = `products/${crypto.randomUUID()}.png`;

    const { error: uploadError } = await supabase.storage
      .from("media")
      .upload(fileName, imageBytes, {
        contentType: "image/png",
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return errorResponse("Failed to upload generated image", 500);
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from("media")
      .getPublicUrl(fileName);

    const publicUrl = publicUrlData.publicUrl;

    return jsonResponse({
      success: true,
      imageUrl: publicUrl,
      storagePath: fileName,
      prompt,
    });
  } catch (err) {
    console.error("generate-product-image error:", err);
    return errorResponse("Internal server error", 500);
  }
});

function buildImagePrompt(name: string, description: string, category: string): string {
  const categoryStyle: Record<string, string> = {
    Entrees: "a plated gourmet meal, warm lighting, rustic table setting",
    Sides: "a side dish in a ceramic bowl, natural lighting, minimalist background",
    Snacks: "packaged snack food, clean white background, product photography",
    Breakfast: "breakfast setting, morning light, warm tones, cozy atmosphere",
    Beverages: "beverage in a glass, condensation droplets, refreshing look",
  };

  const style = categoryStyle[category] || "food product photography, clean background, professional lighting";

  return [
    `Professional food product photography of "${name}".`,
    description ? `Description: ${description}.` : "",
    `Style: ${style}.`,
    "High resolution, appetizing presentation, commercial quality.",
    "No text, no logos, no watermarks, no people.",
    "Shot on a Canon EOS R5 with a 100mm macro lens, f/2.8, soft diffused lighting.",
  ]
    .filter(Boolean)
    .join(" ");
}
