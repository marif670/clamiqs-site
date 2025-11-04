import { v4 as uuidv4 } from "uuid";

export async function onRequestPost({ request, env }) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const alt = formData.get("alt") || "";

    if (!file)
      return new Response(
        JSON.stringify({ success: false, error: "No file provided" }),
        { status: 400 }
      );

    const id = Date.now() + "-" + Math.floor(Math.random() * 10000);
    const key = id;
    const mime = file.type || "application/octet-stream";
    const arrayBuffer = await file.arrayBuffer();

    await env.CALMIQS_IMAGES.put(key, arrayBuffer, {
      metadata: {
        alt,
        originalName: file.name,
        mime,
        uploadedAt: new Date().toISOString(),
      },
    });

    const url = `/images/${key}`;

    return new Response(JSON.stringify({ success: true, id: key, url, alt }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { headers: { "Content-Type": "application/json" }, status: 500 }
    );
  }
}
