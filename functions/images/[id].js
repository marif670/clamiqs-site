// functions/images/[id].js
export async function onRequestGet({ params, env }) {
  const key = params.id;

  if (!key) {
    return new Response(
      JSON.stringify({ success: false, error: "No image ID provided" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    // Fetch the image from KV
    const value = await env.CALMIQS_IMAGES.get(key, {
      type: "arrayBuffer",
      metadata: true,
    });
    if (!value) {
      return new Response(
        JSON.stringify({ success: false, error: "Image not found" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Determine MIME type
    const mime = value.metadata?.mime || "application/octet-stream";

    return new Response(value, {
      status: 200,
      headers: {
        "Content-Type": mime,
        "Cache-Control": "public, max-age=31536000", // cache 1 year
      },
    });
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message || "Failed to fetch image",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
