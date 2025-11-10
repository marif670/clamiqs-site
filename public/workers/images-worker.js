// images-worker.js
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // simple auth check using secret header
    const incomingToken = request.headers.get("X-Admin-Token") || "";
    const expected = env.ADMIN_SECRET || "";
    const isAdmin = incomingToken && expected && incomingToken === expected;

    if (pathname === "/api/images/upload" && request.method === "POST") {
      if (!isAdmin) return new Response("Unauthorized", { status: 401 });
      return handleUpload(request, env);
    }

    if (pathname === "/api/images/list" && request.method === "GET") {
      if (!isAdmin) return new Response("Unauthorized", { status: 401 });
      return handleList(request, env);
    }

    if (pathname === "/api/images/update" && request.method === "POST") {
      if (!isAdmin) return new Response("Unauthorized", { status: 401 });
      return handleUpdate(request, env);
    }

    return new Response("Not found", { status: 404 });
  },
};

async function handleUpload(request, env) {
  // parse multipart
  const form = await request.formData();
  const file = form.get("file");
  if (!file) return new Response("No file", { status: 400 });

  const filename = file.name || "upload";
  const arrayBuffer = await file.arrayBuffer();
  const mime = file.type || "application/octet-stream";

  const id = `img-${Date.now()}-${randomHex(6)}`;
  const r2Key = `originals/${id}/${filename}`;

  // put binary in R2
  await env.R2_BUCKET.put(r2Key, arrayBuffer, {
    httpMetadata: { contentType: mime },
    customMetadata: { uploadedAt: new Date().toISOString() },
  });

  // generate metadata record
  const meta = {
    id,
    original: { r2_key: r2Key, mime, size: arrayBuffer.byteLength },
    title: form.get("title") || "",
    caption: form.get("caption") || "",
    alt: generateAltText(filename, form.get("caption") || ""),
    createdAt: new Date().toISOString(),
  };

  await env.CALMIQS_IMAGES.put(`img:${id}`, JSON.stringify(meta));

  // Return minimal metadata for editor
  return new Response(
    JSON.stringify({
      id,
      alt: meta.alt,
      title: meta.title,
      caption: meta.caption,
    }),
    { headers: { "Content-Type": "application/json" } }
  );
}

async function handleList(request, env) {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const q = url.searchParams.get("q") || "";
  const pageSize = 24;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;

  // List keys from KV (descending is not guaranteed by KV; for robust implementations, store index separately)
  const list = await env.CALMIQS_IMAGES.list({ prefix: "img:", limit: 1000 });
  // list.keys is array of { name }
  // Fetch metadata for each and filter
  const metas = [];
  for (const key of list.keys) {
    const val = await env.CALMIQS_IMAGES.get(key.name);
    if (!val) continue;
    try {
      const obj = JSON.parse(val);
      // simple search
      if (q) {
        const hay = `${obj.title || ""} ${obj.caption || ""} ${obj.id}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) continue;
      }
      metas.push({
        id: obj.id,
        title: obj.title,
        caption: obj.caption,
        alt: obj.alt,
        createdAt: obj.createdAt,
      });
    } catch (e) {
      /* ignore parse errors */
    }
  }

  // simple pagination
  const pageItems = metas.slice(start, end);
  return new Response(JSON.stringify({ images: pageItems }), {
    headers: { "Content-Type": "application/json" },
  });
}

async function handleUpdate(request, env) {
  const payload = await request.json();
  const { id, alt, title, caption } = payload;
  if (!id) return new Response("Missing id", { status: 400 });
  const key = `img:${id}`;
  const raw = await env.CALMIQS_IMAGES.get(key);
  if (!raw) return new Response("Not found", { status: 404 });
  const meta = JSON.parse(raw);
  if (alt !== undefined) meta.alt = String(alt);
  if (title !== undefined) meta.title = String(title);
  if (caption !== undefined) meta.caption = String(caption);
  await env.CALMIQS_IMAGES.put(key, JSON.stringify(meta));
  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
}

/* Helpers */
function generateAltText(filename, caption) {
  if (caption && caption.trim().length > 3) return sanitize(caption);
  if (filename) {
    let name = filename
      .replace(/\.[^/.]+$/, "")
      .replace(/[-_]+/g, " ")
      .replace(/\b\d+\b/g, "")
      .trim();
    if (name) return name.charAt(0).toUpperCase() + name.slice(1);
  }
  return "Image";
}
function sanitize(s) {
  return String(s)
    .replace(/[\r\n]+/g, " ")
    .trim();
}
function randomHex(len) {
  const a = new Uint8Array(len);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, len);
}
