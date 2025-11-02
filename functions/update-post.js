export async function onRequestPost({ request, env }) {
  try {
    const AUTH_KEY = env.GITHUB_TOKEN; // ✅ use the Cloudflare secret key
    const key = request.headers.get("Authorization");

    if (key !== `Bearer ${AUTH_KEY}`) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Parse request body
    const posts = await request.json();

    // Prepare the GitHub API request to update posts.json
    const repoOwner = "marif670";
    const repoName = "calmiqs-site";
    const filePath = "assets/data/posts.json";
    const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`;

    // Get the current file SHA
    const getResponse = await fetch(apiUrl, {
      headers: { Authorization: `Bearer ${AUTH_KEY}` },
    });

    const getData = await getResponse.json();
    const currentSha = getData.sha;

    // Update posts.json
    const updateResponse = await fetch(apiUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${AUTH_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Update posts.json via Cloudflare Function",
        content: btoa(unescape(encodeURIComponent(JSON.stringify(posts, null, 2)))),
        sha: currentSha,
      }),
    });

    if (!updateResponse.ok) {
      const errorData = await updateResponse.text();
      return new Response("GitHub API Error: " + errorData, { status: 500 });
    }

    return new Response("✅ posts.json updated successfully!", { status: 200 });
  } catch (err) {
    return new Response("Server Error: " + err.message, { status: 500 });
  }
}
