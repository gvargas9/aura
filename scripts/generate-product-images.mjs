import { createClient } from "@supabase/supabase-js";

const GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!GEMINI_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing env vars. Source .env.local first.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const products = [
  {
    id: "20df9690-3195-46f9-8ea8-090fd2522914",
    name: "Herb Roasted Chicken",
    prompt: "Professional food photography of herb roasted chicken breast with rosemary and thyme garnish on a rustic wooden board, warm lighting, premium shelf-stable retort pouch packaging partially visible, appetizing golden brown color, steam rising, dark moody background, 4k quality",
    filename: "herb-roasted-chicken.png",
  },
  {
    id: "a4f8cb93-77ad-4db8-9cee-5121ee35db5f",
    name: "Beef Stew Classic",
    prompt: "Professional food photography of hearty beef stew with chunks of tender beef, carrots, potatoes in rich brown gravy, served in a premium bowl, warm cozy lighting, premium shelf-stable food, dark moody background, overhead angle, 4k quality",
    filename: "beef-stew-classic.png",
  },
  {
    id: "4dfba4d6-191b-4a01-95f7-3568b7b549f8",
    name: "Vegetable Curry",
    prompt: "Professional food photography of aromatic vegetable curry with chickpeas, sweet potato, spinach in golden coconut curry sauce, vibrant colors, fresh cilantro garnish, premium shelf-stable food, dark moody background, 4k quality",
    filename: "vegetable-curry.png",
  },
  {
    id: "fc28486a-e540-4718-a95a-93766789fe72",
    name: "Salmon Teriyaki",
    prompt: "Professional food photography of glazed salmon teriyaki fillet with sesame seeds and teriyaki sauce, served on a dark slate plate, vibrant pink salmon color, green onion garnish, premium shelf-stable food, dark moody background, 4k quality",
    filename: "salmon-teriyaki.png",
  },
  {
    id: "6e0903b7-68b1-41be-a761-977916cd7ec7",
    name: "Quinoa Pilaf",
    prompt: "Professional food photography of fluffy quinoa pilaf with fresh herbs, diced vegetables, served in a modern bowl, light and healthy looking, premium shelf-stable food, bright natural lighting, clean white background, 4k quality",
    filename: "quinoa-pilaf.png",
  },
  {
    id: "482ce43f-bdd2-46bc-810b-eaa97215ca64",
    name: "Mashed Sweet Potato",
    prompt: "Professional food photography of creamy mashed sweet potato with a drizzle of maple syrup and cinnamon, swirled texture, served in a ceramic bowl, warm orange color, premium shelf-stable food, warm lighting, 4k quality",
    filename: "mashed-sweet-potato.png",
  },
  {
    id: "4ce391d9-7bdd-4f2b-a22d-59da401c6a29",
    name: "Energy Bites",
    prompt: "Professional food photography of artisan energy bites made with oats, almonds, and honey, arranged on parchment paper, some cut in half showing texture, golden brown color, healthy snack, premium shelf-stable food, natural lighting, 4k quality",
    filename: "energy-bites.png",
  },
  {
    id: "de36f64d-523f-4932-94b1-ca6a44e51e3a",
    name: "Overnight Oats",
    prompt: "Professional food photography of overnight oats in a glass jar with chia seeds, dried berries, and granola topping, layers visible through glass, healthy breakfast, premium shelf-stable food, bright morning lighting, 4k quality",
    filename: "overnight-oats.png",
  },
];

async function generateImage(prompt) {
  // Use Imagen 4.0 for high-quality food photography
  const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${GEMINI_API_KEY}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      instances: [{ prompt }],
      parameters: {
        sampleCount: 1,
        aspectRatio: "1:1",
        outputOptions: { mimeType: "image/png" },
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    // Fallback to gemini-2.5-flash-image if Imagen fails
    if (response.status === 400 || response.status === 403) {
      return generateImageFallback(prompt);
    }
    throw new Error(`Imagen API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();

  const prediction = data.predictions?.[0];
  if (prediction?.bytesBase64Encoded) {
    return {
      data: Buffer.from(prediction.bytesBase64Encoded, "base64"),
      mimeType: prediction.mimeType || "image/png",
    };
  }

  throw new Error("No image in Imagen response");
}

async function generateImageFallback(prompt) {
  // Fallback: use Gemini 2.5 Flash Image model
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${GEMINI_API_KEY}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: `Generate a high-quality product image: ${prompt}` }],
        },
      ],
      generationConfig: {
        responseModalities: ["IMAGE"],
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini fallback error ${response.status}: ${errorText}`);
  }

  const data = await response.json();

  for (const candidate of data.candidates || []) {
    for (const part of candidate.content?.parts || []) {
      if (part.inlineData?.mimeType?.startsWith("image/")) {
        return {
          data: Buffer.from(part.inlineData.data, "base64"),
          mimeType: part.inlineData.mimeType,
        };
      }
    }
  }

  throw new Error("No image in Gemini fallback response");
}

async function uploadToSupabase(filename, imageData, mimeType) {
  const { data, error } = await supabase.storage
    .from("media")
    .upload(`products/${filename}`, imageData, {
      contentType: mimeType,
      upsert: true,
    });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const {
    data: { publicUrl },
  } = supabase.storage.from("media").getPublicUrl(`products/${filename}`);

  return publicUrl;
}

async function updateProductImage(productId, imageUrl) {
  const { error } = await supabase
    .from("aura_products")
    .update({ image_url: imageUrl })
    .eq("id", productId);

  if (error) throw new Error(`DB update failed: ${error.message}`);
}

async function main() {
  console.log(`Generating images for ${products.length} products...\n`);

  for (const product of products) {
    try {
      process.stdout.write(`${product.name}... generating`);

      const { data: imageData, mimeType } = await generateImage(
        product.prompt
      );
      process.stdout.write(" -> uploading");

      const ext = mimeType.includes("png") ? "png" : "jpg";
      const filename = product.filename.replace(/\.\w+$/, `.${ext}`);
      const publicUrl = await uploadToSupabase(filename, imageData, mimeType);
      process.stdout.write(" -> updating DB");

      await updateProductImage(product.id, publicUrl);
      console.log(` -> DONE (${publicUrl})`);
    } catch (err) {
      console.log(` -> FAILED: ${err.message}`);
    }

    // Small delay between requests
    await new Promise((r) => setTimeout(r, 2000));
  }

  console.log("\nAll done!");
}

main();
