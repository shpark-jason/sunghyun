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

let contentData;
let selectedIndex = 0;

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
  if (section === "profile") return localeData(locale);
  const items = collection(locale, section);
  if (items.length === 0) items.push(sectionConfig[section].create());
  return items[Math.min(selectedIndex, items.length - 1)];
}

function sharedItem() {
  return currentItem("en");
}

function itemLabel(item, section) {
  if (!item) return "Untitled";
  if (section === "researchInterests") return item.title;
  if (section === "education") return item.degree;
  if (section === "work") return item.role;
  if (section === "skills") return item.category;
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

function renderItemList() {
  const section = sectionSelect.value;
  itemList.innerHTML = "";

  if (section === "profile") {
    itemList.innerHTML = `<button class="cms-list-item active" type="button">Main profile</button>`;
    return;
  }

  const enItems = collection("en", section);
  const koItems = collection("ko", section);
  const length = Math.max(enItems.length, koItems.length, 1);
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
    input.addEventListener("change", () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        if (input.dataset.locale === "shared") {
          locales.forEach(({ key }) => {
            currentItem(key)[input.dataset.target] = reader.result;
          });
        } else {
          currentItem(input.dataset.locale)[input.dataset.target] = reader.result;
        }
        renderAdmin();
      });
      reader.readAsDataURL(file);
    });
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
  locales.forEach(({ key }) => collection(key, section).push(sectionConfig[section].create()));
  selectedIndex = collection("en", section).length - 1;
  renderAdmin();
});

document.querySelector("#delete-item").addEventListener("click", () => {
  const section = sectionSelect.value;
  if (section === "profile") return;
  locales.forEach(({ key }) => {
    const items = collection(key, section);
    if (items.length > 0) items.splice(selectedIndex, 1);
    if (items.length === 0) items.push(sectionConfig[section].create());
  });
  selectedIndex = Math.max(0, selectedIndex - 1);
  renderAdmin();
});

document.querySelector("#save-preview").addEventListener("click", () => {
  localStorage.setItem("portfolioContentDraft", JSON.stringify(contentData, null, 2));
  window.location.href = "index.html";
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
