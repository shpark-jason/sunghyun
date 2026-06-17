const editor = document.querySelector("#json-editor");
const form = document.querySelector("#quick-form");

async function loadAdminContent() {
  const draft = localStorage.getItem("portfolioContentDraft");
  if (draft) return JSON.parse(draft);

  const response = await fetch("content.json", { cache: "no-store" });
  if (!response.ok) throw new Error("Unable to load content.json");
  return response.json();
}

function formatJSON(data) {
  return JSON.stringify(data, null, 2);
}

function readEditor() {
  return JSON.parse(editor.value);
}

function fillQuickForm(data) {
  const locale = form.elements.locale.value || data.defaultLocale || "en";
  const localeData = data.locales?.[locale] || {};
  form.elements.name.value = localeData.name || "";
  form.elements.status.value = localeData.status || "";
  form.elements.email.value = localeData.email || "";
  form.elements.profile.value = localeData.profile || "";
}

function download(filename, text) {
  const blob = new Blob([text], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

loadAdminContent()
  .then((data) => {
    editor.value = formatJSON(data);
    form.elements.locale.value = data.defaultLocale || "en";
    fillQuickForm(data);
  })
  .catch((error) => {
    editor.value = JSON.stringify({ error: error.message }, null, 2);
  });

form.elements.locale.addEventListener("change", () => {
  fillQuickForm(readEditor());
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = readEditor();
  const locale = form.elements.locale.value;
  data.locales = data.locales || {};
  data.locales[locale] = data.locales[locale] || {};
  data.locales[locale].name = form.elements.name.value;
  data.locales[locale].status = form.elements.status.value;
  data.locales[locale].email = form.elements.email.value;
  data.locales[locale].profile = form.elements.profile.value;
  editor.value = formatJSON(data);
});

document.querySelector("#save-preview").addEventListener("click", () => {
  const data = readEditor();
  localStorage.setItem("portfolioContentDraft", formatJSON(data));
  window.location.href = "index.html";
});

document.querySelector("#download-json").addEventListener("click", () => {
  const data = readEditor();
  download("content.json", formatJSON(data));
});

document.querySelector("#clear-draft").addEventListener("click", () => {
  localStorage.removeItem("portfolioContentDraft");
  window.location.reload();
});
