export async function onRequestPost(context) {
  try {
    // Get the request body
    const data = await context.request.json();

    // Example: Log or return it
    console.log("Received data:", data);

    return new Response(JSON.stringify({ success: true, message: "Post updated successfully" }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
}
