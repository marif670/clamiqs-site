export const onRequestPost = async ({ request, env }) => {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return new Response(
        JSON.stringify({ success: false, error: "No file uploaded" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const id = Date.now().toString();
    const mime = file.type;
    const arrayBuffer = await file.arrayBuffer();

    await env.CALMIQS_IMAGES.put(id, arrayBuffer, {
      metadata: { mime, originalName: file.name },
    });

    return new Response(
      JSON.stringify({
        success: true,
        id,
        url: `/api/images/${id}`,
        meta: {
          id,
          mime,
          originalName: file.name,
          size: arrayBuffer.byteLength,
          uploadedAt: new Date().toISOString(),
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
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
