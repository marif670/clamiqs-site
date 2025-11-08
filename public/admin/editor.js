// --- ELEMENTS ---
const loginBtn = document.getElementById("loginBtn");
const passwordInput = document.getElementById("passwordInput");
const authSection = document.getElementById("authSection");
const editorSection = document.getElementById("editorSection");
const editorContent = document.getElementById("editorContent");
const logoutBtn = document.getElementById("logoutBtn");
const cmsBtn = document.getElementById("cmsBtn");

const PASSWORD = "Hadia@2017"; // Replace with your password

// --- AUTHENTICATION ---
function showEditor() {
  authSection.classList.add("hidden");
  editorSection.classList.remove("hidden");
  cmsBtn.classList.remove("hidden");
  loadPosts();
}

function hideEditor() {
  authSection.classList.remove("hidden");
  editorSection.classList.add("hidden");
  cmsBtn.classList.add("hidden");
}

// LOGIN
loginBtn.addEventListener("click", () => {
  if (passwordInput.value.trim() === PASSWORD) {
    sessionStorage.setItem("calmiqsAuth", "true");
    localStorage.setItem("isAdmin", "true");
    showEditor();
  } else {
    alert("Incorrect password.");
  }
});

// LOGOUT
logoutBtn.addEventListener("click", () => {
  sessionStorage.removeItem("calmiqsAuth");
  localStorage.removeItem("isAdmin");
  hideEditor();
});

// --- INITIAL STATE ---
if (sessionStorage.getItem("calmiqsAuth") === "true") {
  showEditor();
} else {
  hideEditor();
}
// Hide CMS button
// const cmsDesktop = document.querySelector("nav a[href='/admin/editor.html']");
//const cmsMobile = document.querySelector("#mobile-menu a[href='/admin/editor.html']");
//cmsDesktop?.classList.add("hidden");
//cmsMobile?.classList.add("hidden");
//});

// AUTO-LOGIN if already admin
//if (localStorage.getItem("isAdmin") === "true") {
//authSection.classList.add("hidden");
//editorSection.classList.remove("hidden");
//loadPosts?.();
//}

// --- CMS BUTTON VISIBILITY ACROSS SITE ---
if (cmsBtn) {
  if (localStorage.getItem("isAdmin") === "true") {
    cmsBtn.classList.remove("hidden");
  } else {
    cmsBtn.classList.add("hidden");
  }
}

function loadPosts() {
  const editorContent = document.getElementById("editorContent");
  editorContent.innerHTML = `
    <div class="grid gap-6">
      <div class="p-4 bg-white shadow rounded-lg">
        <h3 class="font-semibold text-lg mb-2">Blog Post Editor</h3>
        <p class="text-gray-600 mb-4">Add or edit your blog posts here.</p>
        <button class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">+ New Post</button>
      </div>
    </div>
  `;
}
