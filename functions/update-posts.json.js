export async function onRequestPost({ request, env }) {
  try {
    // === 1️⃣ Parse the request body (new posts.json data) ===
    const body = await request.json();
    const jsonContent = JSON.stringify(body, null, 2);

    // === 2️⃣ Define repo details ===
    const repoOwner = "marif670";
    const repoName = "clamiqs-site";
    const filePath = "assets/data/posts.json";
    const branch = "main"; // or "master" if your repo uses that

    // === 3️⃣ Get your GitHub token from Cloudflare environment variable ===
    const githubToken = env.GITHUB_TOKEN;
    if (!githubToken) {
      return new Response("❌ Missing GitHub token in environment.", { status: 500 });
    }

    // === 4️⃣ Fetch the current file info (for SHA) ===
    const getUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`;
    const getRes = await fetch(getUrl, {
      headers: { Authorization: `token ${githubToken}` },
    });

    if (!getRes.ok) {
      const msg = await getRes.text();
      throw new Error(`GitHub fetch failed: ${msg}`);
    }

    const fileData = await getRes.json();

    // === 5️⃣ Prepare commit payload ===
    const payload = {
      message: "Update posts.json via admin editor",
      content: btoa(unescape(encodeURIComponent(jsonContent))), // encode to base64
      sha: fileData.sha,
      branch,
    };

    // === 6️⃣ Commit update back to GitHub ===
    const putRes = await fetch(getUrl, {
      method: "PUT",
      headers: {
        Authorization: `token ${githubToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!putRes.ok) {
      const msg = await putRes.text();
      throw new Error(`GitHub commit failed: ${msg}`);
    }

    return new Response(
      JSON.stringify({ success: true, message: "✅ posts.json updated on GitHub" }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
}
