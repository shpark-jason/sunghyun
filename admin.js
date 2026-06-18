const sectionSelect = document.querySelector("#section-select");
const itemList = document.querySelector("#item-list");
const form = document.querySelector("#cms-form");
const editorEyebrow = document.querySelector("#editor-eyebrow");
const editorTitle = document.querySelector("#editor-title");
const adminLock = document.querySelector("#admin-lock");
const lockForm = document.querySelector("#lock-form");
const lockError = document.querySelector("#lock-error");
const passwordModal = document.querySelector("#password-modal");
const passwordForm = document.querySelector("#password-form");
const passwordError = document.querySelector("#password-error");
const publishModal = document.querySelector("#publish-modal");
const publishForm = document.querySelector("#publish-form");
const publishError = document.querySelector("#publish-error");
const publishStatus = document.querySelector("#publish-status");

let contentData;
let selectedIndex = 0;
const uploadedImageNames = new Map();

const locales = [
  { key: "en", label: "English" },
  { key: "ko", label: "한국어" },
];

const sectionConfig = {
  profile: {
    label: "Profile",
    sharedFields: [["portrait", "Profile photo", "image"]],
    fields: [
      ["name", "Name", "text"],
      ["status", "Status", "text"],
      ["email", "Email", "email"],
      ["phone", "Phone", "text"],
      ["location", "Location", "text"],
      ["profile", "Short profile", "textarea"],
      ["interests", "Hero tags, one per line", "lines"],
    ],
  },
  researchInterests: {
    label: "Research Interests",
    create: () => ({ title: "New research interest", summary: "", description: "", image: "" }),
    sharedFields: [["image", "Detail image", "image"]],
    fields: [
      ["title", "Title", "text"],
      ["summary", "Short summary", "textarea"],
      ["description", "Detailed description", "textarea"],
    ],
  },
  education: {
    label: "Education History",
    create: () => ({ degree: "New degree", institution: "", location: "", detail: "", description: "", image: "" }),
    sharedFields: [["image", "Detail image", "image"]],
    fields: [
      ["degree", "Degree", "text"],
      ["institution", "Institution", "text"],
      ["location", "Location", "text"],
      ["detail", "Short detail", "textarea"],
      ["description", "Detailed description", "textarea"],
    ],
  },
  work: {
    label: "Work History",
    create: () => ({ role: "New role", organization: "", period: "", bullets: [], description: "", image: "" }),
    sharedFields: [["image", "Detail image", "image"]],
    fields: [
      ["role", "Role", "text"],
      ["organization", "Organization", "text"],
      ["period", "Period", "text"],
      ["bullets", "Bullet points, one per line", "lines"],
      ["description", "Detailed description", "textarea"],
    ],
  },
  memberships: {
    label: "Memberships",
    create: () => ({ type: "Membership", title: "New membership", summary: "", href: "", description: "", image: "" }),
    sharedFields: [
      ["href", "External link", "text"],
      ["image", "Detail image", "image"],
    ],
    fields: [
      ["type", "Type", "text"],
      ["title", "Title", "text"],
      ["summary", "Short summary", "textarea"],
      ["description", "Detailed description", "textarea"],
    ],
  },
  publications: {
    label: "Publications",
    create: () => ({ type: "Refereed Journal Article", title: "New publication", citation: "", href: "", description: "", image: "" }),
    sharedFields: [
      ["href", "External link", "text"],
      ["image", "Detail image", "image"],
    ],
    fields: [
      ["type", "Type", "text"],
      ["title", "Title", "text"],
      ["citation", "APA / citation", "textarea"],
      ["description", "Detailed description", "textarea"],
    ],
  },
  presentations: {
    label: "Presentations",
    create: () => ({ type: "Conference Presentation", title: "New presentation", citation: "", href: "", description: "", image: "" }),
    sharedFields: [
      ["href", "External link", "text"],
      ["image", "Detail image", "image"],
    ],
    fields: [
      ["type", "Type", "text"],
      ["title", "Title", "text"],
      ["citation", "APA / citation", "textarea"],
      ["description", "Detailed description", "textarea"],
    ],
  },
  projects: {
    label: "Projects",
    create: () => ({ type: "Project", title: "New project", summary: "", href: "", description: "", image: "" }),
    sharedFields: [
      ["href", "External link", "text"],
      ["image", "Detail image", "image"],
    ],
    fields: [
      ["type", "Type", "text"],
      ["title", "Title", "text"],
      ["summary", "Short summary", "textarea"],
      ["description", "Detailed description", "textarea"],
    ],
  },
  media: {
    label: "Columns & Media",
    create: () => ({ type: "Column", title: "New media activity", summary: "", href: "", description: "", image: "" }),
    sharedFields: [
      ["href", "External link", "text"],
      ["image", "Detail image", "image"],
    ],
    fields: [
      ["type", "Type", "text"],
      ["title", "Title", "text"],
      ["summary", "Short summary", "textarea"],
      ["description", "Detailed description", "textarea"],
    ],
  },
  skills: {
    label: "Methods & Skills",
    create: () => ({ category: "New category", items: [] }),
    fields: [
      ["category", "Category", "text"],
      ["items", "Items, one per line", "lines"],
    ],
  },
  sectionOrder: {
    label: "Section Order",
    fields: [["sectionOrder", "Home section order, one per line", "lines"]],
  },
};

function unlockAdmin() {
  adminLock.hidden = true;
}

function adminPassword() {
  return localStorage.getItem("portfolioAdminPassword") || "1130";
}

function isFourDigits(value) {
  return /^\d{4}$/.test(value);
}

lockForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (document.querySelector("#admin-password").value === adminPassword()) {
    unlockAdmin();
    return;
  }
  lockError.textContent = "Incorrect password.";
});

document.querySelector("#change-password").addEventListener("click", () => {
  passwordError.textContent = "";
  passwordForm.reset();
  passwordModal.hidden = false;
});

document.querySelector("#cancel-password").addEventListener("click", () => {
  passwordModal.hidden = true;
});

passwordForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const current = document.querySelector("#current-password").value;
  const next = document.querySelector("#new-password").value;

  if (current !== adminPassword()) {
    passwordError.textContent = "Current password is incorrect.";
    return;
  }

  if (!isFourDigits(next)) {
    passwordError.textContent = "New password must be exactly 4 digits.";
    return;
  }

  localStorage.setItem("portfolioAdminPassword", next);
  passwordModal.hidden = true;
});

async function loadAdminContent() {
  const draft = localStorage.getItem("portfolioContentDraft");
  if (draft) return JSON.parse(draft);
  const response = await fetch("content.json", { cache: "no-store" });
  if (!response.ok) throw new Error("Unable to load content.json");
  return response.json();
}

function localeData(locale) {
  contentData.locales = contentData.locales || {};
  contentData.locales[locale] = contentData.locales[locale] || {};
  return contentData.locales[locale];
}

function collection(locale, section) {
  const data = localeData(locale);
  data[section] = data[section] || [];
  return data[section];
}

function currentItem(locale) {
  const section = sectionSelect.value;
  if (section === "sectionOrder") return contentData;
  if (section === "profile") return localeData(locale);
  const items = collection(locale, section);
  return items[Math.min(selectedIndex, items.length - 1)] || null;
}

function sharedItem() {
  if (sectionSelect.value === "sectionOrder") return contentData;
  return currentItem("en");
}

function itemLabel(item, section) {
  if (!item) return "Untitled";
  if (section === "researchInterests") return item.title;
  if (section === "education") return item.degree;
  if (section === "work") return item.role;
  if (section === "skills") return item.category;
  if (section === "sectionOrder") return "Home section order";
  return item.title;
}

function fieldValue(item, key, type) {
  const value = item?.[key];
  if (type === "lines") return Array.isArray(value) ? value.join("\n") : "";
  return value || "";
}

function parseField(value, type) {
  if (type === "lines") {
    return value.split("\n").map((line) => line.trim()).filter(Boolean);
  }
  return value;
}

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function sectionOrderLabel(key) {
  const labels = {
    interests: "Research Interests",
    education: "Education History",
    work: "Work History",
    memberships: "Memberships",
    publications: "Publications",
    presentations: "Presentations",
    projects: "Projects",
    media: "Columns & Media",
    skills: "Methods & Skills",
  };
  return labels[key] || key;
}

function setupOrderDrag() {
  const list = document.querySelector("#order-list");
  if (!list) return;
  let dragged;

  list.querySelectorAll(".order-item").forEach((item) => {
    item.addEventListener("dragstart", () => {
      dragged = item;
      item.classList.add("dragging");
    });

    item.addEventListener("dragend", () => {
      item.classList.remove("dragging");
      dragged = null;
      contentData.sectionOrder = Array.from(list.querySelectorAll(".order-item")).map((node) => node.dataset.key);
    });

    item.addEventListener("dragover", (event) => {
      event.preventDefault();
      if (!dragged || dragged === item) return;
      const rect = item.getBoundingClientRect();
      const after = event.clientY > rect.top + rect.height / 2;
      list.insertBefore(dragged, after ? item.nextSibling : item);
    });
  });
}

function renderItemList() {
  const section = sectionSelect.value;
  itemList.innerHTML = "";

  if (section === "profile") {
    itemList.innerHTML = `<button class="cms-list-item active" type="button">Main profile</button>`;
    return;
  }

  if (section === "sectionOrder") {
    itemList.innerHTML = `<button class="cms-list-item active" type="button">Home section order</button>`;
    return;
  }

  const enItems = collection("en", section);
  const koItems = collection("ko", section);
  const length = Math.max(enItems.length, koItems.length);
  if (length === 0) {
    selectedIndex = 0;
    itemList.innerHTML = `<p class="shared-note">No items yet. Select Add Item to create one.</p>`;
    return;
  }
  while (enItems.length < length) enItems.push(sectionConfig[section].create());
  while (koItems.length < length) koItems.push(sectionConfig[section].create());
  selectedIndex = Math.min(selectedIndex, length - 1);

  itemList.innerHTML = enItems
    .map((item, index) => {
      const label = itemLabel(item, section) || itemLabel(koItems[index], section) || `Item ${index + 1}`;
      return `<button class="cms-list-item ${index === selectedIndex ? "active" : ""}" type="button" data-index="${index}">${escapeHTML(label)}</button>`;
    })
    .join("");

  itemList.querySelectorAll("[data-index]").forEach((button) => {
    button.addEventListener("click", () => {
      selectedIndex = Number(button.dataset.index);
      renderAdmin();
    });
  });
}

function controlMarkup(locale, item, key, label, type) {
  const id = `${locale}-${key}`;
  const value = escapeHTML(fieldValue(item, key, type));
  if (type === "textarea" || type === "lines") {
    return `<label>${escapeHTML(label)}<textarea data-locale="${locale}" name="${key}">${value}</textarea></label>`;
  }
  if (type === "image") {
    const preview = value ? `<img class="image-preview" src="${value}" alt="" />` : "";
    return `<label>${escapeHTML(label)}
      <input data-locale="${locale}" name="${key}" type="text" value="${value}" placeholder="assets/photo.jpg or uploaded file" />
      <input class="file-control" data-locale="${locale}" data-target="${key}" id="${id}" type="file" accept="image/*" />
      ${preview}
    </label>`;
  }
  return `<label>${escapeHTML(label)}<input data-locale="${locale}" name="${key}" type="${type}" value="${value}" /></label>`;
}

function renderForm() {
  const section = sectionSelect.value;
  const config = sectionConfig[section];

  if (section === "sectionOrder") {
    editorEyebrow.textContent = config.label;
    editorTitle.textContent = "Arrange homepage sections";
    const defaultOrder = ["interests", "education", "work", "memberships", "publications", "presentations", "projects", "media", "skills"];
    const savedOrder = contentData.sectionOrder || defaultOrder;
    const order = [...savedOrder, ...defaultOrder.filter((key) => !savedOrder.includes(key))];
    form.innerHTML = `<section class="locale-editor shared-editor">
      <h3>Shared order</h3>
      <p class="shared-note">Drag sections to reorder the homepage.</p>
      <div class="order-list" id="order-list">
        ${order.map((key) => `<div class="order-item" draggable="true" data-key="${escapeHTML(key)}"><span class="drag-handle">≡</span><span>${escapeHTML(sectionOrderLabel(key))}</span></div>`).join("")}
      </div>
    </section>`;
    setupOrderDrag();
    return;
  }

  if (!currentItem("en")) {
    editorEyebrow.textContent = config.label;
    editorTitle.textContent = "No items";
    form.innerHTML = `<section class="locale-editor shared-editor"><p class="shared-note">Select Add Item to create content for this section.</p></section>`;
    return;
  }

  editorEyebrow.textContent = config.label;
  editorTitle.textContent = section === "profile" ? "Edit main profile" : itemLabel(currentItem("en"), section) || "Edit item";

  const sharedFields = (config.sharedFields || [])
    .map(([fieldKey, fieldLabel, type]) => controlMarkup("shared", sharedItem(), fieldKey, fieldLabel, type))
    .join("");

  const sharedSection = sharedFields
    ? `<section class="locale-editor shared-editor"><h3>Shared fields</h3><p class="shared-note">Images and links are shared across English and Korean.</p>${sharedFields}</section>`
    : "";

  form.innerHTML = sharedSection + locales
    .map(({ key, label }) => {
      const item = currentItem(key);
      const fields = config.fields.map(([fieldKey, fieldLabel, type]) => controlMarkup(key, item, fieldKey, fieldLabel, type)).join("");
      return `<section class="locale-editor"><h3>${escapeHTML(label)}</h3>${fields}</section>`;
    })
    .join("");

  form.querySelectorAll("input:not([type='file']), textarea").forEach((control) => {
    control.addEventListener("input", () => {
      const allFields = [...(config.fields || []), ...(config.sharedFields || [])];
      const configField = allFields.find(([key]) => key === control.name);
      if (control.dataset.locale === "shared") {
        locales.forEach(({ key }) => {
          currentItem(key)[control.name] = parseField(control.value, configField?.[2]);
        });
      } else {
        currentItem(control.dataset.locale)[control.name] = parseField(control.value, configField?.[2]);
      }
      renderItemList();
    });
  });

  form.querySelectorAll("input[type='file']").forEach((input) => {
    input.addEventListener("change", async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const imageData = await prepareImage(file);
        uploadedImageNames.set(imageData, file.name);
        if (input.dataset.locale === "shared") {
          locales.forEach(({ key }) => {
            currentItem(key)[input.dataset.target] = imageData;
          });
        } else {
          currentItem(input.dataset.locale)[input.dataset.target] = imageData;
        }
        renderAdmin();
      } catch (error) {
        publishStatus.textContent = error.message;
      }
    });
  });
}

function prepareImage(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Please select an image file."));
      return;
    }

    const reader = new FileReader();
    reader.addEventListener("error", () => reject(new Error("The image could not be read.")));
    reader.addEventListener("load", () => {
      const image = new Image();
      image.addEventListener("error", () => reject(new Error("The image could not be prepared.")));
      image.addEventListener("load", () => {
        const maxSize = 1800;
        const scale = Math.min(1, maxSize / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const context = canvas.getContext("2d");
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.86));
      });
      image.src = reader.result;
    });
    reader.readAsDataURL(file);
  });
}

function renderAdmin() {
  renderItemList();
  renderForm();
}

sectionSelect.addEventListener("change", () => {
  selectedIndex = 0;
  renderAdmin();
});

document.querySelector("#add-item").addEventListener("click", () => {
  const section = sectionSelect.value;
  if (section === "profile") return;
  if (section === "sectionOrder") return;
  locales.forEach(({ key }) => collection(key, section).push(sectionConfig[section].create()));
  selectedIndex = collection("en", section).length - 1;
  renderAdmin();
});

document.querySelector("#delete-item").addEventListener("click", () => {
  const section = sectionSelect.value;
  if (section === "profile") return;
  if (section === "sectionOrder") return;
  locales.forEach(({ key }) => {
    const items = collection(key, section);
    if (items.length > 0) items.splice(selectedIndex, 1);
  });
  selectedIndex = Math.max(0, selectedIndex - 1);
  renderAdmin();
});

document.querySelector("#save-preview").addEventListener("click", () => {
  localStorage.setItem("portfolioContentDraft", JSON.stringify(contentData, null, 2));
  window.location.href = "index.html";
});

document.querySelector("#publish-github").addEventListener("click", () => {
  publishError.textContent = "";
  publishModal.hidden = false;
});

document.querySelector("#cancel-publish").addEventListener("click", () => {
  publishModal.hidden = true;
});

function bytesToBase64(bytes) {
  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary);
}

function utf8ToBase64(value) {
  return bytesToBase64(new TextEncoder().encode(value));
}

function dataUrlToBase64(dataUrl) {
  return dataUrl.slice(dataUrl.indexOf(",") + 1);
}

function safeImageName(value) {
  const base = (value || "image").replace(/\.[^.]+$/, "").toLowerCase();
  const cleaned = base.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48);
  return `${cleaned || "image"}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.jpg`;
}

function findDataImages(value, results = new Set()) {
  if (typeof value === "string" && value.startsWith("data:image/")) results.add(value);
  if (Array.isArray(value)) value.forEach((item) => findDataImages(item, results));
  if (value && typeof value === "object") Object.values(value).forEach((item) => findDataImages(item, results));
  return results;
}

function replaceDataImages(value, replacements) {
  if (typeof value === "string") return replacements.get(value) || value;
  if (Array.isArray(value)) return value.map((item) => replaceDataImages(item, replacements));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, replaceDataImages(item, replacements)]));
  }
  return value;
}

async function githubRequest(repository, path, token, options = {}) {
  const response = await fetch(`https://api.github.com/repos/${repository}/contents/${path}`, {
    cache: "no-store",
    ...options,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
      ...(options.headers || {}),
    },
  });
  if (!response.ok) {
    let message = `${response.status} ${response.statusText}`;
    try {
      const error = await response.json();
      message = error.message || message;
    } catch {}
    throw new Error(message);
  }
  return response.json();
}

async function putGithubFile({ repository, branch, token, path, content, message }) {
  const update = async () => {
    let sha;
    try {
      const cacheBuster = `admin=${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const existing = await githubRequest(
        repository,
        `${path}?ref=${encodeURIComponent(branch)}&${cacheBuster}`,
        token,
      );
      sha = existing.sha;
    } catch (error) {
      if (!String(error.message).startsWith("Not Found")) throw error;
    }

    return githubRequest(repository, path, token, {
      method: "PUT",
      body: JSON.stringify({ message, content, branch, ...(sha ? { sha } : {}) }),
    });
  };

  try {
    return await update();
  } catch (error) {
    if (!String(error.message).includes("does not match")) throw error;
    await new Promise((resolve) => setTimeout(resolve, 800));
    return update();
  }
}

publishForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const repository = document.querySelector("#github-repository").value.trim();
  const branch = document.querySelector("#github-branch").value.trim() || "main";
  const token = document.querySelector("#github-token").value.trim();
  const submitButton = publishForm.querySelector("button[type='submit']");

  if (!repository.includes("/") || !token) {
    publishError.textContent = "Enter the repository and GitHub token.";
    return;
  }

  publishError.textContent = "";
  submitButton.disabled = true;
  submitButton.textContent = "Publishing...";

  try {
    const replacements = new Map();
    const images = Array.from(findDataImages(contentData));

    for (let index = 0; index < images.length; index += 1) {
      publishStatus.textContent = `Uploading image ${index + 1} of ${images.length}...`;
      const imageData = images[index];
      const filename = safeImageName(uploadedImageNames.get(imageData));
      const path = `assets/uploads/${filename}`;
      await putGithubFile({
        repository,
        branch,
        token,
        path,
        content: dataUrlToBase64(imageData),
        message: `Upload portfolio image: ${filename}`,
      });
      replacements.set(imageData, path);
    }

    const publishedContent = replaceDataImages(contentData, replacements);
    publishStatus.textContent = "Publishing portfolio content...";
    await putGithubFile({
      repository,
      branch,
      token,
      path: "content.json",
      content: utf8ToBase64(JSON.stringify(publishedContent, null, 2)),
      message: "Update portfolio content",
    });

    contentData = publishedContent;
    localStorage.removeItem("portfolioContentDraft");
    publishModal.hidden = true;
    publishForm.reset();
    document.querySelector("#github-repository").value = repository;
    document.querySelector("#github-branch").value = branch;
    publishStatus.innerHTML = `Published successfully. <a href="https://${repository.split("/")[0]}.github.io/${repository.split("/")[1]}/" target="_blank" rel="noopener">Open live site</a>`;
    renderAdmin();
  } catch (error) {
    publishError.textContent = `Publishing failed: ${error.message}`;
    publishStatus.textContent = "";
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Publish Now";
  }
});

document.querySelector("#download-json").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(contentData, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "content.json";
  link.click();
  URL.revokeObjectURL(url);
});

loadAdminContent().then((data) => {
  contentData = data;
  renderAdmin();
});
