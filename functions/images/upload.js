// functions/images/upload.js
// POST /api/images/upload
// Expects a multipart/form-data body with field "file" and optional "alt" and "postSlug" fields.
// Stores binary in CALMIQS_IMAGES KV under key "img:<id>" and metadata under "imgmeta:<id>"

export async function onRequestPost({ request, env }) {
  try {
    // Only accept form uploads
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return new Response(
        JSON.stringify({ error: "Content-Type must be multipart/form-data" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!file) {
      return new Response(JSON.stringify({ error: "Missing file field" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // get optional fields
    const alt = (formData.get("alt") || "").toString();
    const postSlug = (formData.get("postSlug") || "").toString();

    // Create a reasonably-unique id (timestamp + random)
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    // Read file binary
    const arrayBuffer = await file.arrayBuffer();
    const uint8 = new Uint8Array(arrayBuffer);

    // Determine content type and filename
    const mime = file.type || "application/octet-stream";
    const originalName = file.name || `${id}`;

    // KV key naming convention
    const imgKey = `img:${id}`;
    const metaKey = `imgmeta:${id}`;

    // Store binary in KV (use put with arrayBuffer)
    // Note: Cloudflare KV put supports ArrayBuffer/TypedArray via Workers runtime
    await env.CALMIQS_IMAGES.put(imgKey, uint8);

    // Save metadata as JSON (alt, mime, originalName, postSlug, size, uploadedAt)
    const meta = {
      id,
      mime,
      originalName,
      alt,
      postSlug,
      size: uint8.length,
      uploadedAt: new Date().toISOString(),
      url: `/api/images/${id}`, // canonical retrieval path
    };
    await env.CALMIQS_IMAGES.put(metaKey, JSON.stringify(meta));

    // Return canonical URL (relative) and metadata
    return new Response(
      JSON.stringify({ success: true, id, url: meta.url, meta }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("upload error:", err);
    return new Response(
      JSON.stringify({
        error: "Upload failed",
        details: err?.message || String(err),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
