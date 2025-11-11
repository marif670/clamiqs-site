// /assets/js/editor-images.js
// Calmiqs Editor Image Manager
(() => {
  /* ===========================================================
   Calmiqs — Image Management (Worker API Integration)
   Version: Hybrid (Cloudflare Pages + Worker Direct)
   =========================================================== */

  // 🔗 Worker endpoint base — replace <your-worker-subdomain> with your actual subdomain
  // Example: https://calmiqs-images-worker.ai-pet-tech.workers.dev
  // Worker endpoint base
  const WORKER_BASE = "https://calmiqs-images-worker.techaipet.workers.dev";

  // API endpoints
  const LIST_URL = `${WORKER_BASE}/list`;
  const UPLOAD_URL = `${WORKER_BASE}/upload`;
  const UPDATE_URL = `${WORKER_BASE}/update`;

  // Global admin token injected in editor.html
  const ADMIN_TOKEN = window.CALMIQS_ADMIN_TOKEN || "";

  /**
   * Helper to perform authorized fetch to the Calmiqs Worker
   */
  async function calmiqsFetch(url, options = {}) {
    const headers = {
      "X-Admin-Token": ADMIN_TOKEN,
      ...(options.headers || {}),
    };
    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
      const text = await response.text();
      console.error("Calmiqs Worker API Error:", response.status, text);
      throw new Error(`Request failed (${response.status})`);
    }
    return response;
  }

  /* ===========================================================
   Image Upload Handler
   =========================================================== */
  async function uploadImageFile(file, meta = {}) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", meta.title || file.name);
    formData.append("alt", meta.alt || "");
    formData.append("caption", meta.caption || "");

    const res = await calmiqsFetch(API_ENDPOINTS.upload, {
      method: "POST",
      body: formData,
    });

    return await res.json();
  }

  /* ===========================================================
   Fetch Image List from Worker (for gallery modal)
   =========================================================== */
  async function fetchImageList() {
    const res = await calmiqsFetch(API_ENDPOINTS.list);
    const data = await res.json();
    return data.images || [];
  }

  /* ===========================================================
   Update Metadata (alt/title/caption)
   =========================================================== */
  async function updateImageMetadata(id, meta) {
    const res = await calmiqsFetch(API_ENDPOINTS.update, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, meta }),
    });
    const data = await res.json();
    return data.success || false;
  }

  /* ===========================================================
   End of Calmiqs Worker API Layer
   =========================================================== */

  const IMG_DELIVERY = (id, size) => `/img/${id}/${size}`;

  // Selectors (detected from editor.html)
  const editorEl = document.querySelector("#content"); // contentEditable area
  const inlineInput = document.querySelector("#inlineImageFile");

  // modal elements
  const modal = document.getElementById("calmiqs-image-modal");
  const grid = document.getElementById("calmiqs-gallery-grid");
  const closeBtn = document.getElementById("calmiqs-gallery-close");
  const uploadNewBtn = document.getElementById("calmiqs-upload-new-btn");
  const insertSelectedBtn = document.getElementById("calmiqs-insert-selected");
  const selectAllCheckbox = document.getElementById("calmiqs-select-all");
  const gallerySearch = document.getElementById("calmiqs-gallery-search");

  // inline toolbar
  const inlineToolbar = document.getElementById("calmiqs-inline-toolbar");
  const editMetaBtn = document.getElementById("calmiqs-edit-meta");
  const removeImageBtn = document.getElementById("calmiqs-remove-image");
  const widthInput = document.getElementById("calmiqs-width-input");

  // local state
  let imagesPage = 1;
  let selectedIds = new Set();
  let lastClickedThumb = null;
  let postId = document.querySelector("#post-id")?.value || "unsaved";
  const AUTOSAVE_KEY = `calmiqs:editor:draft:${postId}`;

  // helper: fetch wrapper with admin token
  async function authFetch(url, opts = {}) {
    opts.headers = opts.headers || {};
    if (ADMIN_TOKEN) opts.headers[ADMIN_TOKEN_HEADER] = ADMIN_TOKEN;
    opts.credentials = "include";
    return fetch(url, opts);
  }

  // ========== Gallery: open / load ==========
  function openGallery() {
    modal.classList.remove("hidden");
    modal.classList.add("flex");
    loadGalleryPage(1);
  }

  function closeGallery() {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
    grid.innerHTML = "";
    selectedIds.clear();
  }

  closeBtn.addEventListener("click", closeGallery);

  // load images from KV via Worker endpoint
  async function loadGalleryPage(page = 1, q = "") {
    imagesPage = page;
    grid.innerHTML = '<div class="col-span-3 text-center py-8">Loading…</div>';
    const url = new URL(KV_LIST_URL, location.origin);
    url.searchParams.set("page", page);
    if (q) url.searchParams.set("q", q);
    const res = await authFetch(url.toString());
    if (!res.ok) {
      grid.innerHTML = `<div class="col-span-3 text-red-600">Failed to load images: ${res.status}</div>`;
      return;
    }
    const { images = [] } = await res.json();
    renderGalleryGrid(images);
  }

  function renderGalleryGrid(images) {
    grid.innerHTML = "";
    if (!images || images.length === 0) {
      grid.innerHTML = '<div class="col-span-3 text-center py-8">No images uploaded yet.</div>';
      return;
    }
    images.forEach((img) => {
      const id = img.id;
      const thumbSrc = IMG_DELIVERY(id, 150);
      const wrapper = document.createElement("div");
      wrapper.className = "relative rounded overflow-hidden bg-slate-100 dark:bg-slate-800";
      wrapper.style.minHeight = "150px";
      wrapper.style.maxHeight = "150px";

      // thumbnail image
      const timg = document.createElement("img");
      timg.dataset.id = id;
      timg.src = thumbSrc;
      timg.alt = img.alt || img.title || "image";
      timg.className = "w-full h-36 object-cover";
      timg.style.height = "150px";
      wrapper.appendChild(timg);

      // caption
      const caption = document.createElement("div");
      caption.className = "p-2 text-xs";
      caption.innerText = img.title || img.id;
      wrapper.appendChild(caption);

      // click to select / multi-select highlight
      wrapper.addEventListener("click", (ev) => {
        ev.stopPropagation();
        if (selectedIds.has(id)) {
          selectedIds.delete(id);
          wrapper.classList.remove("ring-4", "ring-indigo-400");
        } else {
          selectedIds.add(id);
          wrapper.classList.add("ring-4", "ring-indigo-400");
        }
        lastClickedThumb = wrapper;
      });

      grid.appendChild(wrapper);
    });
  }

  // Search
  gallerySearch.addEventListener(
    "input",
    debounce((e) => {
      loadGalleryPage(1, e.target.value.trim());
    }, 300)
  );

  selectAllCheckbox.addEventListener("change", (e) => {
    if (e.target.checked) {
      // select all ids in the DOM
      grid.querySelectorAll("img").forEach((img) => selectedIds.add(img.dataset.id));
      grid.querySelectorAll("div").forEach((div) => div.classList.add("ring-4", "ring-indigo-400"));
    } else {
      selectedIds.clear();
      grid
        .querySelectorAll("div")
        .forEach((div) => div.classList.remove("ring-4", "ring-indigo-400"));
    }
  });

  insertSelectedBtn.addEventListener("click", () => {
    if (!selectedIds.size) return alert("No images selected.");
    insertImagesAtCaret(Array.from(selectedIds));
    closeGallery();
  });

  // Upload new from modal triggers underlying input
  uploadNewBtn.addEventListener("click", () => {
    inlineInput.click();
  });

  // bind the existing inline input to upload flow (local file -> upload to worker)
  inlineInput.addEventListener("change", async (e) => {
    const file = inlineInput.files && inlineInput.files[0];
    if (!file) return;
    try {
      const fd = new FormData();
      fd.append("file", file, file.name);
      // add optional metadata fields from editor UI (if available)
      const res = await authFetch(UPLOAD_URL, { method: "POST", body: fd });
      if (!res.ok) throw new Error("Upload failed: " + res.status);
      const data = await res.json();
      // insert new image into editor at caret
      insertImagesAtCaret([data.id], { meta: data });
    } catch (err) {
      console.error(err);
      alert("Image upload failed: " + (err.message || err));
    } finally {
      inlineInput.value = "";
    }
  });

  // ========== Insertion & DOM building ==========
  function insertImagesAtCaret(ids = [], opts = {}) {
    const metaMap = opts.metaMap || {}; // optional pre-fetched meta map
    const docFrag = document.createDocumentFragment();
    const group = document.createElement("div");
    group.className = "calmiqs-img-group flex flex-wrap items-start";
    group.style.gap = "8px";

    // limit per row handled via Tailwind width utilities per item
    ids.forEach((id, idx) => {
      const fig = document.createElement("figure");
      fig.className = "calmiqs-img-item w-full md:w-1/3 p-1";
      fig.style.position = "relative";
      fig.dataset.imgId = id;

      const wrapper = document.createElement("div");
      wrapper.className = "calmiqs-img-wrapper";
      wrapper.style.display = "inline-block";
      wrapper.style.position = "relative";

      const img = document.createElement("img");
      img.src = IMG_DELIVERY(id, 800); // default medium size
      img.alt = metaMap[id]?.alt || "";
      img.dataset.id = id;
      img.className = "inline-img rounded-lg shadow-sm";
      img.style.maxWidth = "100%";
      img.style.height = "auto";
      img.style.display = "block";
      img.setAttribute("loading", "lazy");
      img.setAttribute("decoding", "async");

      // data attributes for persisted size
      img.dataset.widthPx = "";
      img.dataset.widthPct = "";

      // resizer handle
      const resizer = document.createElement("div");
      resizer.className = "calmiqs-resizer";
      wrapper.appendChild(img);
      wrapper.appendChild(resizer);

      // alt warning badge when alt generated
      if (!img.alt) {
        const badge = document.createElement("div");
        badge.className = "calmiqs-alt-warning";
        badge.innerText = "alt auto";
        wrapper.appendChild(badge);
      }

      // caption
      const caption = document.createElement("figcaption");
      caption.className = "text-xs mt-1";
      caption.innerText = metaMap[id]?.caption || "";

      fig.appendChild(wrapper);
      fig.appendChild(caption);
      group.appendChild(fig);

      // wire up resizer events
      attachResizer(img, resizer, wrapper);

      // click for inline toolbar
      img.addEventListener("click", (ev) => {
        ev.stopPropagation();
        showInlineToolbarFor(img);
      });
    });

    docFrag.appendChild(group);

    // Insert at caret position (if available)
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      range.deleteContents();
      range.insertNode(docFrag);
    } else {
      editorEl.appendChild(docFrag);
    }
  }

  // ========== Resizer ==========
  function attachResizer(img, handle, wrapper) {
    let startX = 0;
    let startWidth = 0;
    let dragging = false;

    handle.addEventListener("mousedown", (e) => {
      e.preventDefault();
      startX = e.clientX;
      startWidth = img.getBoundingClientRect().width;
      dragging = true;
      document.body.style.userSelect = "none";
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    });

    function onMove(e) {
      if (!dragging) return;
      const dx = e.clientX - startX;
      let newWidthPx = Math.max(100, startWidth + dx);
      const containerWidth = wrapper.parentElement.getBoundingClientRect().width;
      newWidthPx = Math.min(newWidthPx, containerWidth);
      // apply live preview
      img.style.width = newWidthPx + "px";
      // compute percent
      const pct = Math.round((newWidthPx / containerWidth) * 100);
      img.dataset.widthPx = newWidthPx;
      img.dataset.widthPct = pct;
      // update toolbar width input if visible
      widthInput.value = `${newWidthPx}px / ${pct}%`;
    }

    function onUp(e) {
      if (!dragging) return;
      dragging = false;
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      // persist local attributes (don't push to KV here; done on Save)
    }
  }

  // ========== Inline toolbar ==========
  let activeImage = null;
  function showInlineToolbarFor(img) {
    activeImage = img;
    const r = img.getBoundingClientRect();
    inlineToolbar.style.top = window.scrollY + r.top - 42 + "px";
    inlineToolbar.style.left = r.left + "px";
    inlineToolbar.classList.remove("hidden");

    // set width input
    const wpx = img.dataset.widthPx || Math.round(r.width);
    const wpct =
      img.dataset.widthPct ||
      Math.round((r.width / img.parentElement.getBoundingClientRect().width) * 100);
    widthInput.value = `${wpx}px / ${wpct}%`;
  }

  // click outside to hide toolbar
  document.addEventListener("click", (ev) => {
    if (!inlineToolbar.contains(ev.target) && !ev.target.matches("img.inline-img")) {
      inlineToolbar.classList.add("hidden");
      activeImage = null;
    }
  });

  editMetaBtn.addEventListener("click", async () => {
    if (!activeImage) return;
    // show a quick prompt modal to edit alt, title, caption
    const currentAlt = activeImage.alt || "";
    const newAlt = prompt("Edit alt text:", currentAlt);
    if (newAlt !== null) {
      activeImage.alt = newAlt;
      // remove alt warning if set
      const warning = activeImage.parentElement.querySelector(".calmiqs-alt-warning");
      if (warning && newAlt.trim()) warning.remove();
      // optionally, push metadata update to backend for this image id
      const id = activeImage.dataset.id;
      try {
        await authFetch(UPDATE_META_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, alt: newAlt }),
        });
      } catch (err) {
        console.warn("Failed to persist metadata to server (ok to continue offline):", err);
      }
    }
  });

  removeImageBtn.addEventListener("click", () => {
    if (!activeImage) return;
    const figure = activeImage.closest("figure");
    if (figure) figure.remove();
    inlineToolbar.classList.add("hidden");
  });

  widthInput.addEventListener("change", () => {
    if (!activeImage) return;
    const v = widthInput.value.trim();
    // Accept formats like "320px" or "50%" or "320px / 30%"
    const pxMatch = v.match(/(\d+)\s*px/);
    const pctMatch = v.match(/(\d+)\s*%/);
    if (pxMatch) {
      activeImage.style.width = pxMatch[1] + "px";
      activeImage.dataset.widthPx = pxMatch[1];
    }
    if (pctMatch) {
      activeImage.style.width = pctMatch[1] + "%";
      activeImage.dataset.widthPct = pctMatch[1];
    }
  });

  // ========== Autosave ==========
  function startAutosave() {
    // load draft if exists
    const draft = localStorage.getItem(AUTOSAVE_KEY);
    if (draft) editorEl.innerHTML = draft;

    setInterval(() => {
      localSave();
    }, 60000); // every 60s

    editorEl.addEventListener("blur", () => localSave(), true);
    // Optional: on explicit "Save" button in your editor, call pushToServer()
  }

  function localSave() {
    const content = editorEl.innerHTML;
    localStorage.setItem(AUTOSAVE_KEY, content);
    // small visual feedback (optional)
    console.log("[Calmiqs] Draft autosaved");
  }

  // push to server (save to your post storage + optionally update image meta to KV)
  async function pushToServer() {
    // Implement pushing the editor content to your existing post save endpoint.
    // Additionally, for images that have data attributes changed, you can post updates to the image metadata endpoint.
    // This function acts as a placeholder. Integrate with your Save flow.
    const content = editorEl.innerHTML;
    // TODO: call your post save endpoint with content
    console.log("[Calmiqs] pushToServer called; integrate with your Save endpoint.");
    // Persist local changes to image metadata to KV via UPDATE_META_URL if needed.
  }

  // ========== Utility functions ==========
  function debounce(fn, wait) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), wait);
    };
  }

  // ========== Init ==========
  function init() {
    // expose openGallery for UI hook; you may add a button in editor html to open the gallery
    window.CalmiqsOpenImageGallery = openGallery;
    // start autosave
    startAutosave();

    // keyboard: Ctrl+I to open image gallery
    document.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "i") {
        e.preventDefault();
        openGallery();
      }
    });
  }

  init();
})();
// === Inline Image Upload ===
document.getElementById("inlineImageFile").addEventListener("change", uploadInlineImage);

async function uploadInlineImage(event) {
  const file = event.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch(UPLOAD_URL, {
      method: "POST",
      headers: { "X-Admin-Token": window.CALMIQS_ADMIN_TOKEN },
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Upload failed");
    insertInlineImage(data.url, file.name);
  } catch (err) {
    alert("Image upload failed: " + err.message);
  }
}

function insertInlineImage(url, altText) {
  const imgHTML = `<img src="${url}" alt="${altText}" class="inline-img mx-auto my-4 rounded-lg shadow-md" style="max-width:100%;height:auto;" />`;
  insertAtCursor(document.getElementById("blogContent"), imgHTML);
}
// === Image Library ===
document.getElementById("selectImageBtn").addEventListener("click", loadLibrary);
document.getElementById("closeLibraryBtn").addEventListener("click", () => {
  document.getElementById("imageLibrary").classList.add("hidden");
});

async function loadLibrary() {
  const res = await fetch(LIST_URL, {
    headers: { "X-Admin-Token": window.CALMIQS_ADMIN_TOKEN },
  });
  const data = await res.json();
  const grid = document.getElementById("libraryGrid");
  grid.innerHTML = "";
  data.images.forEach((img) => {
    const thumb = document.createElement("img");
    thumb.src = `${WORKER_BASE}/files/${img.name}`; // adjust once upload logic added
    thumb.className = "w-full rounded-lg cursor-pointer hover:ring-2 hover:ring-blue-400";
    thumb.addEventListener("click", () => {
      insertInlineImage(thumb.src, img.name);
      document.getElementById("imageLibrary").classList.add("hidden");
    });
    grid.appendChild(thumb);
  });
  document.getElementById("imageLibrary").classList.remove("hidden");
}
