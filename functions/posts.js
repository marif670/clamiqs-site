export async function onRequest(context) {
  const { request, env } = context;
  const { CALMIQS_POSTS } = env;

  try {
    // GET request — fetch all posts or a single post
    if (request.method === "GET") {
      const url = new URL(request.url);
      const key = url.searchParams.get("key");

      const posts = (await CALMIQS_POSTS.get("posts", "json")) || {};

      if (key) {
        if (!posts[key]) {
          return new Response(JSON.stringify({ error: "Post not found" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
          });
        }
        return new Response(JSON.stringify(posts[key]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Return all posts
      return new Response(JSON.stringify(posts), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // POST request — add/update a post
    if (request.method === "POST") {
      const body = await request.json();
      const { key, data } = body;

      if (!key || !data) {
        return new Response(
          JSON.stringify({ success: false, error: "Missing key or data" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      const posts = (await CALMIQS_POSTS.get("posts", "json")) || {};
      posts[key] = data;

      await CALMIQS_POSTS.put("posts", JSON.stringify(posts));

      return new Response(
        JSON.stringify({ success: true, message: "Post saved successfully!" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // DELETE request — remove a post
    if (request.method === "DELETE") {
      const url = new URL(request.url);
      const key = url.searchParams.get("key");

      if (!key) {
        return new Response(
          JSON.stringify({ success: false, error: "Missing key" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      const posts = (await CALMIQS_POSTS.get("posts", "json")) || {};
      if (!posts[key]) {
        return new Response(
          JSON.stringify({ success: false, error: "Post not found" }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }

      delete posts[key];
      await CALMIQS_POSTS.put("posts", JSON.stringify(posts));

      return new Response(
        JSON.stringify({
          success: true,
          message: "Post deleted successfully!",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Method not allowed
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
