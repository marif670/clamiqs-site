export async function onRequest(context) {
  return new Response("✅ Function is working!", {
    headers: { "Content-Type": "text/plain" },
  });
}
