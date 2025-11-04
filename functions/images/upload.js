export async function POST(request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!file)
    return new Response(
      JSON.stringify({ success: false, error: "No file provided" }),
      { status: 400 }
    );

  const id = Date.now().toString();
  await CALMIQS_IMAGES.put(id, await file.arrayBuffer(), {
    metadata: { name: file.name, type: file.type },
  });

  return new Response(
    JSON.stringify({ success: true, id, url: `/api/images/${id}` }),
    {
      headers: { "Content-Type": "application/json" },
    }
  );
}
