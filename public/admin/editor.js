// ======================
// Calmiqs Editor JS
// ======================

// --- CONFIG ---
const PASSWORD = "Hadia@2017"; // Change to your secure password

// --- DOM ELEMENTS ---
const loginBtn = document.getElementById("loginBtn");
const passwordInput = document.getElementById("passwordInput");
const authSection = document.getElementById("authSection");
const editorSection = document.getElementById("editorSection");
const cmsBtn = document.getElementById("cmsBtn");
const logoutBtn = document.getElementById("logoutBtn");

// Hero & Inline Images
const heroImageFile = document.getElementById("heroImageFile");
const uploadHeroBtn = document.getElementById("uploadHeroBtn");
const inlineImageFile = document.getElementById("inlineImageFile");
const insertInlineBtn = document.getElementById("insertInlineBtn");
const inlineControls = document.getElementById("inlineControls");
const inlineWidth = document.getElementById("inlineWidth");
const inlineAlign = document.getElementById("inlineAlign");
const applyInlineFormat = document.getElementById("applyInlineFormat");

// Post fields
const keyInput = document.getElementById("key");
const titleInput = document.getElementById("title");
const dateInput = document.getElementById("date");
const imageInput = document.getElementById("image");
const imageAltInput = document.getElementById("imageAlt");
const excerptInput = document.getElementById("excerpt");
const contentDiv = document.getElementById("content");
const previewContainer = document.getElementById("previewContainer");
const previewContent = document.getElementById("previewContent");

// Buttons
const loadBtn = document.getElementById("loadBtn");
const saveBtn = document.getElementById("saveBtn");
const deleteBtn = document.getElementById("deleteBtn");

// Posts dropdown
const postSelect = document.getElementById("postSelect");

// ======================
// AUTHENTICATION
// ======================
function showEditor() {
  authSection.classList.add("hidden");
  editorSection.classList.remove("hidden");
  cmsBtn.classList.remove("hidden");
  sessionStorage.setItem("calmiqsAuth", "true");
}

function hideEditor() {
  authSection.classList.remove("hidden");
  editorSection.classList.add("hidden");
  cmsBtn.classList.add("hidden");
  sessionStorage.removeItem("calmiqsAuth");
}

loginBtn.addEventListener("click", () => {
  if (passwordInput.value.trim() === PASSWORD) {
    showEditor();
    loadPosts();
    passwordInput.value = "";
  } else {
    alert("Incorrect password.");
    passwordInput.value = "";
  }
});

logoutBtn?.addEventListener("click", () => {
  hideEditor();
});

// Auto login if session exists
if (sessionStorage.getItem("calmiqsAuth") === "true") {
  showEditor();
  loadPosts();
}

// ======================
// CMS BUTTON (HEADER)
// ======================
if (cmsBtn) {
  cmsBtn.addEventListener("click", () => {
    window.location.href = "/admin/editor.html";
  });
}

// ======================
// POSTS MANAGEMENT
// ======================
async function loadPosts() {
  try {
    // Fetch post keys from KV
    // Example: fetch("/api/getPosts") or KV fetch logic
    // For now placeholder
    postSelect.innerHTML = `<option value="">--Select Post--</option>`;
    // Add logic to populate select with KV keys
  } catch (err) {
    console.error("Error loading posts:", err);
  }
}

async function savePost() {
  const postData = {
    key: keyInput.value.trim(),
    title: titleInput.value.trim(),
    date: dateInput.value.trim(),
    image: imageInput.value.trim(),
    imageAlt: imageAltInput.value.trim(),
    excerpt: excerptInput.value.trim(),
    content: contentDiv.innerHTML,
  };
  console.log("Saving post:", postData);
  alert("Post saved (simulation).");
  // TODO: KV PUT logic
}

async function deletePost() {
  const key = keyInput.value.trim();
  if (!key) return alert("Enter Post Key to delete.");
  if (!confirm("Are you sure you want to delete this post?")) return;
  console.log("Deleting post key:", key);
  alert("Post deleted (simulation).");
  // TODO: KV DELETE logic
}

saveBtn.addEventListener("click", savePost);
deleteBtn.addEventListener("click", deletePost);
loadBtn.addEventListener("click", loadPosts);

// ======================
// INLINE IMAGE INSERT
// ======================
insertInlineBtn.addEventListener("click", () => {
  const file = inlineImageFile.files[0];
  if (!file) return alert("Select an image first.");
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = document.createElement("img");
    img.src = e.target.result;
    img.alt = "Inline image";
    img.width = inlineWidth.value || 800;
    img.style.display = inlineAlign.value === "center" ? "block" : inlineAlign.value;
    if (inlineAlign.value === "center") img.style.margin = "0 auto";
    contentDiv.appendChild(img);
    inlineImageFile.value = "";
  };
  reader.readAsDataURL(file);
});

// ======================
// HERO IMAGE UPLOAD
// ======================
uploadHeroBtn.addEventListener("click", () => {
  const file = heroImageFile.files[0];
  if (!file) return alert("Select a hero image first.");
  const reader = new FileReader();
  reader.onload = (e) => {
    imageInput.value = e.target.result;
    heroImageFile.value = "";
    alert("Hero image uploaded (preview URL set).");
  };
  reader.readAsDataURL(file);
});

// ======================
// FORMATTING BUTTONS
// ======================
document.querySelectorAll(".format-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const cmd = btn.dataset.command;
    if (cmd === "createLink") {
      const url = prompt("Enter link URL:");
      if (url) document.execCommand(cmd, false, url);
    } else if (cmd === "formatBlock") {
      document.execCommand(cmd, false, btn.dataset.value);
    } else {
      document.execCommand(cmd, false, null);
    }
  });
});

// ======================
// LIVE PREVIEW
// ======================
contentDiv.addEventListener("input", () => {
  previewContent.innerHTML = contentDiv.innerHTML;
});
