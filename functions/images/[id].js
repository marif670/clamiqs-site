export const onRequestGet = async ({ params, env }) => {
  try {
    const { id } = params;
    if (!id) {
      return new Response(
        JSON.stringify({ success: false, error: "No image ID provided" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const value = await env.CALMIQS_IMAGES.get(id, {
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

    const { metadata } = value;
    const mime = metadata?.mime || "application/octet-stream";

    return new Response(value, {
      status: 200,
      headers: { "Content-Type": mime },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
