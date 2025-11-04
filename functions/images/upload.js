// functions/images/upload.js
export async function onRequestPost({ request, env }) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const alt = formData.get("alt") || file.name;
    const postSlug = formData.get("postSlug") || "";

    if (!file) {
      return new Response(
        JSON.stringify({ success: false, error: "No file uploaded" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Generate a unique ID: timestamp + random suffix
    const id = `${Date.now()}-${crypto.randomUUID().slice(0, 6)}`;
    const fileExt = file.name.split(".").pop() || "jpg";
    const key = `${id}.${fileExt}`;

    const arrayBuffer = await file.arrayBuffer();

    // Save to KV
    await env.CALMIQS_IMAGES.put(key, arrayBuffer, {
      metadata: {
        originalName: file.name,
        mime: file.type,
        alt,
        postSlug,
        uploadedAt: new Date().toISOString(),
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        id: key,
        mime: file.type,
        originalName: file.name,
        alt,
        postSlug,
        uploadedAt: new Date().toISOString(),
        url: `/images/${key}`,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ success: false, error: err.message || "Upload failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
