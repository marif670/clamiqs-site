// === CONFIG ===
const PASSWORD = "calmiqs2025";
const KV_URL = "/posts";
const IMAGE_UPLOAD_URL = "/images/upload";

let posts = {};

// Elements
const authSection = document.getElementById("authSection");
const editorSection = document.getElementById("editorSection");
const passwordInput = document.getElementById("passwordInput");
const loginBtn = document.getElementById("loginBtn");
const postSelect = document.getElementById("postSelect");
const saveBtn = document.getElementById("saveBtn");
const deleteBtn = document.getElementById("deleteBtn");
const contentInput = document.getElementById("content");
const preview = document.getElementById("previewContent");

// === LOGIN ===
loginBtn.addEventListener("click", () => {
  if (passwordInput.value.trim() === PASSWORD) {
    sessionStorage.setItem("calmiqsAuth", "true");
    authSection.classList.add("hidden");
    editorSection.classList.remove("hidden");
    loadPosts();
  } else alert("Incorrect password.");
});

if (sessionStorage.getItem("calmiqsAuth") === "true") {
  authSection.classList.add("hidden");
  editorSection.classList.remove("hidden");
  loadPosts();
}

// === KV POSTS ===
async function loadPosts() {
  try {
    const res = await fetch(KV_URL);
    if (!res.ok) throw new Error("Could not load posts from KV");
    posts = await res.json();
    populateSelect();
  } catch (err) {
    console.error(err);
    alert("❌ Could not load posts from KV.");
  }
}

function populateSelect() {
  postSelect.innerHTML =
    '<option value="">➕ New Post</option>' +
    Object.keys(posts)
      .map((key) => `<option value="${key}">${key}</option>`)
      .join("");
}

postSelect.addEventListener("change", () => {
  const key = postSelect.value;
  if (!key) return clearForm();
  const post = posts[key];
  document.getElementById("key").value = key;
  ["title", "date", "image", "imageAlt", "excerpt", "content"].forEach((id) => {
    document.getElementById(id).value = post[id] || "";
  });
  updatePreview();
});

function clearForm() {
  document.getElementById("key").value = "";
  ["title", "date", "image", "imageAlt", "excerpt", "content"].forEach((id) => {
    document.getElementById(id).value = "";
  });
  updatePreview();
}

// === SAVE POST ===
async function savePost() {
  const key = document.getElementById("key").value.trim();
  if (!key) return alert("Provide a key (slug)");

  const data = ["title", "date", "image", "excerpt", "content"].reduce((obj, id) => {
    obj[id] = document.getElementById(id).value.trim();
    return obj;
  }, {});
  data.imageAlt = document.getElementById("imageAlt").value.trim();

  try {
    const res = await fetch(KV_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, data }),
    });
    const result = await res.json();
    if (result.success) {
      alert("✅ Post saved!");
      loadPosts();
    } else alert("⚠️ " + (result.error || "Unknown error"));
  } catch (err) {
    console.error(err);
    alert("❌ Failed to save post.");
  }
}

// === DELETE POST ===
async function deletePost() {
  const key = postSelect.value;
  if (!key) return alert("Select a post");
  if (!confirm(`Delete '${key}'?`)) return;
  try {
    const res = await fetch(`${KV_URL}?key=${encodeURIComponent(key)}`, { method: "DELETE" });
    const result = await res.json();
    if (result.success) {
      alert("🗑️ Post deleted");
      clearForm();
      loadPosts();
    } else alert("⚠️ " + (result.error || "Unknown error"));
  } catch (err) {
    console.error(err);
    alert("❌ Failed to delete post.");
  }
}

// === HERO IMAGE UPLOAD ===
document.getElementById("uploadHeroBtn").addEventListener("click", async () => {
  const fileInput = document.getElementById("heroImageFile");
  const altInput = document.getElementById("imageAlt");
  if (!fileInput.files[0]) return alert("Select a file");

  const formData = new FormData();
  formData.append("file", fileInput.files[0]);
  formData.append("alt", altInput.value || "");

  try {
    const res = await fetch(IMAGE_UPLOAD_URL, { method: "POST", body: formData });
    const result = await res.json();
    if (result.success) {
      document.getElementById("image").value = result.url;
      document.getElementById("imageAlt").value = result.meta.alt || "";
      alert("✅ Hero image uploaded");
      updatePreview();
    } else alert("❌ Failed to upload image: " + (result.error || "Unknown error"));
  } catch (err) {
    console.error(err);
    alert("❌ Failed to upload image.");
  }
});

// === INLINE IMAGE UPLOAD ===
document.getElementById("insertInlineBtn").addEventListener("click", async () => {
  const fileInput = document.getElementById("inlineImageFile");
  const altText = document.getElementById("inlineImageAlt").value.trim();
  const alignment = document.getElementById("inlineImageAlign").value || "center";

  if (!fileInput.files[0]) return alert("Select a file");

  const formData = new FormData();
  formData.append("file", fileInput.files[0]);
  formData.append("alt", altText || fileInput.files[0].name);
  formData.append("alignment", alignment);

  try {
    const res = await fetch(IMAGE_UPLOAD_URL, { method: "POST", body: formData });
    const result = await res.json();
    if (result.success) {
      const contentBox = document.getElementById("content");
      const cursorPos = contentBox.selectionStart;
      const template = `<img src="${result.url}" alt="${result.meta.alt}" class="my-4 rounded-lg shadow-md float-${alignment}" />`;
      const currentText = contentBox.value;
      contentBox.value = currentText.slice(0, cursorPos) + template + currentText.slice(cursorPos);
      updatePreview();
      alert("✅ Inline image inserted");
    } else alert("❌ Failed to insert inline image: " + (result.error || "Unknown error"));
  } catch (err) {
    console.error(err);
    alert("❌ Failed to insert inline image.");
  }
});

// === TOOLBAR ACTIONS ===
document.querySelectorAll(".toolbar-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const action = btn.dataset.action;
    let selected = window.getSelection().toString();

    if (!selected && action !== "link") return alert("Select text first");

    const textarea = contentInput;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    let newText = selected;

    switch (action) {
      case "b":
        newText = `<strong>${selected}</strong>`;
        break;
      case "i":
        newText = `<em>${selected}</em>`;
        break;
      case "h2":
        newText = `<h2>${selected}</h2>`;
        break;
      case "h3":
        newText = `<h3>${selected}</h3>`;
        break;
      case "ul":
        newText = `<ul>\n<li>${selected.split("\n").join("</li>\n<li>")}</li>\n</ul>`;
        break;
      case "ol":
        newText = `<ol>\n<li>${selected.split("\n").join("</li>\n<li>")}</li>\n</ol>`;
        break;
      case "link":
        const url = prompt("Enter URL");
        if (!url) return;
        newText = `<a href="${url}" target="_blank">${selected}</a>`;
        break;
    }

    textarea.setRangeText(newText, start, end, "end");
    updatePreview();
  });
});

// === LIVE PREVIEW ===
function updatePreview() {
  const title = document.getElementById("title").value || "Untitled Post";
  const date = document.getElementById("date").value || "No date set";
  const image =
    document.getElementById("image").value || "https://via.placeholder.com/800x400?text=Preview";
  const imageAlt = document.getElementById("imageAlt").value || "Preview image";
  let content = contentInput.value || "";

  // Wrap plain text lines in <p> if not already a block
  content = content
    .split(/\n+/)
    .map((line) => {
      line = line.trim();
      if (!line) return "";
      if (/^<(h2|h3|ul|ol|li|p|img|pre|blockquote)/i.test(line)) return line;
      return `<p>${line}</p>`;
    })
    .join("\n");

  preview.innerHTML = `
    <img src="${image}" alt="${imageAlt}" class="rounded-xl mb-4 shadow-md w-full max-h-96 object-cover" />
    <h3 class="text-3xl font-bold mb-2 text-primary">${title}</h3>
    <p class="text-gray-500 mb-6">${date}</p>
    <div class="text-gray-800 leading-relaxed">${content}</div>
  `;
}

// Auto-update preview on input
["title", "date", "image", "imageAlt", "content"].forEach((id) =>
  document.getElementById(id).addEventListener("input", updatePreview)
);

updatePreview();

// Button events
document.getElementById("loadBtn").addEventListener("click", loadPosts);
saveBtn.addEventListener("click", savePost);
deleteBtn.addEventListener("click", deletePost);
