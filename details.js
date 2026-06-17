const sectionLabels = {
  en: {
    interests: "Research Interests",
    education: "Education History",
    publications: "Publications",
    presentations: "Presentations",
    work: "Work History",
    media: "Media Activity",
    skills: "Methods & Skills",
  },
  ko: {
    interests: "연구 관심사",
    education: "학력",
    publications: "논문",
    presentations: "발표",
    work: "경력",
    media: "언론 활동",
    skills: "방법론 및 역량",
  },
};

let detailContent;
let detailLocale = localStorage.getItem("portfolioLocale") || "en";

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function loadContent() {
  const draft = localStorage.getItem("portfolioContentDraft");
  if (draft) return JSON.parse(draft);
  const response = await fetch("content.json", { cache: "no-store" });
  return response.json();
}

function getSection() {
  return new URLSearchParams(window.location.search).get("section") || "interests";
}

function getItemIndex() {
  const value = new URLSearchParams(window.location.search).get("item");
  if (value === null) return null;
  const index = Number.parseInt(value, 10);
  return Number.isNaN(index) ? null : index;
}

function getData() {
  return detailContent.locales?.[detailLocale] || detailContent.locales?.[detailContent.defaultLocale];
}

function renderMenu(active) {
  const menu = document.querySelector("#details-menu");
  menu.innerHTML = Object.entries(sectionLabels[detailLocale])
    .map(([key, label]) => {
      return `<a class="${key === active ? "active" : ""}" href="details.html?section=${key}">${escapeHTML(label)}</a>`;
    })
    .join("");
}

function renderPublicationCards(items) {
  return (items || [])
    .map((item) => {
      return `<article class="publication-card">
        <span class="publication-type">${escapeHTML(item.type)}</span>
        <h3>${escapeHTML(item.title)}</h3>
        <p>${escapeHTML(item.citation)}</p>
      </article>`;
    })
    .join("");
}

function pickItems(items, itemIndex) {
  if (itemIndex === null) return items || [];
  const item = (items || [])[itemIndex];
  return item ? [item] : [];
}

function renderDetailsCards(section, data) {
  const content = document.querySelector("#details-content");
  const itemIndex = getItemIndex();

  if (section === "interests") {
    content.innerHTML = pickItems(data.researchInterests, itemIndex)
      .map((item) => `<article class="agenda-card"><span class="card-index">·</span><h3>${escapeHTML(item.title)}</h3><p>${escapeHTML(item.summary)}</p></article>`)
      .join("");
    return;
  }

  if (section === "education") {
    content.innerHTML = pickItems(data.education, itemIndex)
      .map((item) => `<article class="timeline-item"><h3>${escapeHTML(item.degree)}</h3><p class="timeline-meta">${escapeHTML(item.institution)} · ${escapeHTML(item.location)}</p><p>${escapeHTML(item.detail)}</p></article>`)
      .join("");
    return;
  }

  if (section === "publications") {
    content.innerHTML = renderPublicationCards(pickItems(data.publications, itemIndex));
    return;
  }

  if (section === "presentations") {
    content.innerHTML = renderPublicationCards(pickItems(data.presentations, itemIndex));
    return;
  }

  if (section === "media") {
    content.innerHTML = pickItems(data.media, itemIndex)
      .map((item) => {
        const title = item.href ? `<a href="${escapeHTML(item.href)}">${escapeHTML(item.title)}</a>` : escapeHTML(item.title);
        return `<article class="media-card"><span class="media-type">${escapeHTML(item.type)}</span><h3>${title}</h3><p>${escapeHTML(item.summary)}</p></article>`;
      })
      .join("");
    return;
  }

  if (section === "work") {
    content.innerHTML = pickItems(data.work, itemIndex)
      .map((item) => {
        const bullets = (item.bullets || []).map((bullet) => `<li>${escapeHTML(bullet)}</li>`).join("");
        return `<article class="timeline-item"><h3>${escapeHTML(item.role)}</h3><p class="timeline-meta">${escapeHTML(item.organization)} · ${escapeHTML(item.period)}</p><ul>${bullets}</ul></article>`;
      })
      .join("");
    return;
  }

  content.innerHTML = (data.skills || [])
    .map((group) => {
      const items = (group.items || []).map((item) => `<li>${escapeHTML(item)}</li>`).join("");
      return `<article class="skill-column"><h3>${escapeHTML(group.category)}</h3><ul>${items}</ul></article>`;
    })
    .join("");
}

function renderDetails() {
  const section = getSection();
  const itemIndex = getItemIndex();
  const data = getData();
  const label = sectionLabels[detailLocale][section] || sectionLabels[detailLocale].interests;
  const titleMap = {
    interests: data.researchInterests?.[itemIndex]?.title,
    education: data.education?.[itemIndex]?.degree,
    publications: data.publications?.[itemIndex]?.title,
    presentations: data.presentations?.[itemIndex]?.title,
    media: data.media?.[itemIndex]?.title,
    work: data.work?.[itemIndex]?.role,
  };
  document.documentElement.lang = detailLocale;
  document.querySelector("#details-eyebrow").textContent = detailLocale === "ko" ? "상세 정보" : "Details";
  document.querySelector("#details-title").textContent = itemIndex === null ? label : titleMap[section] || label;
  document.querySelector("#details-summary").textContent =
    detailLocale === "ko"
      ? "홈에서는 요약만 보여주고, 이 페이지에서 전체 내용을 확인합니다."
      : "The homepage stays concise; full section details live here.";
  document.querySelectorAll("[data-lang]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.lang === detailLocale));
  });
  renderMenu(section);
  renderDetailsCards(section, data);
}

document.querySelectorAll("[data-lang]").forEach((button) => {
  button.addEventListener("click", () => {
    detailLocale = button.dataset.lang;
    localStorage.setItem("portfolioLocale", detailLocale);
    renderDetails();
  });
});

loadContent().then((content) => {
  detailContent = content;
  renderDetails();
});
