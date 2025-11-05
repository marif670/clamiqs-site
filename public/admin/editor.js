// === CONFIG ===
const PASSWORD = "calmiqs2025";
const KV_URL = "/posts";
const IMAGE_UPLOAD_URL = "/images/upload";

let posts = {};

// === ELEMENTS ===
const authSection = document.getElementById("authSection");
const editorSection = document.getElementById("editorSection");
const passwordInput = document.getElementById("passwordInput");
const loginBtn = document.getElementById("loginBtn");
const postSelect = document.getElementById("postSelect");
const saveBtn = document.getElementById("saveBtn");
const deleteBtn = document.getElementById("deleteBtn");

const titleInput = document.getElementById("title");
const dateInput = document.getElementById("date");
const imageInput = document.getElementById("image");
const imageAltInput = document.getElementById("imageAlt");
const contentInput = document.getElementById("content");
const preview = document.getElementById("previewContent");

// Inline image controls
const inlineFileInput = document.getElementById("inlineImageFile");
const inlineAlignSelect = document.getElementById("inlineImageAlign");
const inlineAltInput = document.getElementById("inlineImageAlt");

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
  if (!inlineFileInput.files[0]) return alert("Select a file");
  const align = inlineAlignSelect.value;
  const altText = inlineAltInput.value || inlineFileInput.files[0].name;

  const formData = new FormData();
  formData.append("file", inlineFileInput.files[0]);
  formData.append("alt", altText);
  formData.append("alignment", align);

  try {
    const res = await fetch(IMAGE_UPLOAD_URL, { method: "POST", body: formData });
    const result = await res.json();
    if (result.success) {
      const cursorPos = contentInput.selectionStart;
      const template = `<img src="${result.url}" alt="${result.meta.alt}" class="my-4 rounded-lg shadow-md float-${align}" />`;
      const currentText = contentInput.value;
      contentInput.value =
        currentText.slice(0, cursorPos) + template + currentText.slice(cursorPos);
      updatePreview();
      alert("✅ Inline image inserted");
    } else alert("❌ Failed to insert inline image: " + (result.error || "Unknown error"));
  } catch (err) {
    console.error(err);
    alert("❌ Failed to insert inline image.");
  }
});

// === LIVE PREVIEW ===
function updatePreview() {
  const title = titleInput.value || "Untitled Post";
  const date = dateInput.value || "No date set";
  const image = imageInput.value || "https://via.placeholder.com/800x400?text=Preview";
  const imageAlt = imageAltInput.value || "Preview image";
  const content = contentInput.value || "<p>Start typing...</p>";
  preview.innerHTML = `
    <img src="${image}" alt="${imageAlt}" class="rounded-xl mb-4 shadow-md w-full max-h-96 object-cover" />
    <h3 class="text-3xl font-bold mb-2 text-primary">${title}</h3>
    <p class="text-gray-500 mb-6">${date}</p>
    <div class="text-gray-800 leading-relaxed">${content}</div>
  `;
}

[titleInput, dateInput, imageInput, imageAltInput, contentInput].forEach((el) =>
  el.addEventListener("input", updatePreview)
);
updatePreview();

// === TOOLBAR BUTTONS ===
document.querySelectorAll(".toolbar-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const action = btn.dataset.action;
    let start = contentInput.selectionStart;
    let end = contentInput.selectionEnd;
    let selectedText = contentInput.value.substring(start, end);
    let insertText = "";

    switch (action) {
      case "b":
        insertText = `<strong>${selectedText}</strong>`;
        break;
      case "i":
        insertText = `<em>${selectedText}</em>`;
        break;
      case "h2":
        insertText = `<h2>${selectedText}</h2>`;
        break;
      case "h3":
        insertText = `<h3>${selectedText}</h3>`;
        break;
      case "ul":
        insertText = `<ul><li>${selectedText}</li></ul>`;
        break;
      case "ol":
        insertText = `<ol><li>${selectedText}</li></ol>`;
        break;
      case "link":
        const url = prompt("Enter URL:");
        if (url) insertText = `<a href="${url}" target="_blank">${selectedText || url}</a>`;
        break;
    }

    contentInput.value =
      contentInput.value.slice(0, start) + insertText + contentInput.value.slice(end);
    updatePreview();
  });
});

// === BUTTON EVENTS ===
document.getElementById("loadBtn").addEventListener("click", loadPosts);
saveBtn.addEventListener("click", savePost);
deleteBtn.addEventListener("click", deletePost);
