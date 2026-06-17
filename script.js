const navLinks = Array.from(document.querySelectorAll(".nav a"));
const sections = navLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((link) => {
        link.classList.toggle("active", link.getAttribute("href") === `#${entry.target.id}`);
      });
    });
  },
  { rootMargin: "-42% 0px -48% 0px" },
);

sections.forEach((section) => observer.observe(section));

const uiText = {
  en: {
    navAgenda: "Agenda",
    navEducation: "Education",
    navPublications: "Publications",
    navMedia: "Media",
    navExperience: "Experience",
    heroPrimary: "Research Agenda",
    heroSecondary: "Download CV",
    currentFocus: "Current Focus",
    agendaEyebrow: "Research Agenda",
    agendaTitle: "How infrastructures shape participation",
    educationEyebrow: "Education",
    educationTitle: "Training across media, culture, and communication",
    publicationsEyebrow: "Publications & Presentations",
    publicationsTitle: "Selected scholarly work",
    mediaEyebrow: "Columns & Media",
    mediaTitle: "Public-facing writing and commentary",
    experienceEyebrow: "Experience",
    experienceTitle: "Research, policy, and cultural work",
    methodsEyebrow: "Methods & Skills",
    methodsTitle: "Research toolkit",
    contactEyebrow: "Contact",
    contactTitle: "Open to doctoral research conversations and academic collaboration.",
    adminLink: "Admin",
  },
  ko: {
    navAgenda: "연구 의제",
    navEducation: "학력",
    navPublications: "연구 성과",
    navMedia: "언론 활동",
    navExperience: "경력",
    heroPrimary: "연구 의제 보기",
    heroSecondary: "CV 다운로드",
    currentFocus: "현재 연구 초점",
    agendaEyebrow: "연구 의제",
    agendaTitle: "디지털 인프라는 참여를 어떻게 구조화하는가",
    educationEyebrow: "학력",
    educationTitle: "미디어, 문화, 커뮤니케이션을 가로지르는 연구 훈련",
    publicationsEyebrow: "논문 및 학술 발표",
    publicationsTitle: "주요 연구 성과",
    mediaEyebrow: "칼럼 및 언론 활동",
    mediaTitle: "공론장 글쓰기와 미디어 코멘터리",
    experienceEyebrow: "경력",
    experienceTitle: "연구, 정책, 문화 현장의 경험",
    methodsEyebrow: "방법론 및 역량",
    methodsTitle: "연구 도구",
    contactEyebrow: "연락처",
    contactTitle: "박사과정 연구 논의와 학술 협업에 열려 있습니다.",
    adminLink: "관리",
  },
};

const fallbackContent = {
  defaultLocale: "en",
  locales: {
    en: {
      name: "Sunghyun Park",
      status: "PhD Applicant · Media & Platform Studies",
      email: "parksunghyun@yonsei.ac.kr",
      profile:
        "Scholar investigating how digital platforms shape participation, inequality, and user agency in contemporary mediated environments.",
      interests: ["Platform Power", "User Agency", "Digital Inequality"],
      facts: [],
      agenda: [],
      education: [],
      publications: [],
      media: [],
      experience: [],
      skills: [],
      links: [],
    },
  },
};

let siteContent = fallbackContent;
let activeLocale = localStorage.getItem("portfolioLocale") || "en";

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setText(selector, value) {
  document.querySelectorAll(selector).forEach((node) => {
    node.textContent = value;
  });
}

function renderList(container, items, template) {
  if (!container) return;
  container.innerHTML = (items || []).map(template).join("");
}

function translateStatic(locale) {
  document.documentElement.lang = locale;
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    const key = node.dataset.i18n;
    node.textContent = uiText[locale]?.[key] || uiText.en[key] || node.textContent;
  });
  document.querySelectorAll("[data-lang]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.lang === locale));
  });
}

function getLocaleContent(content, locale) {
  return content.locales?.[locale] || content.locales?.[content.defaultLocale] || fallbackContent.locales.en;
}

function renderSite(locale = activeLocale) {
  activeLocale = siteContent.locales?.[locale] ? locale : siteContent.defaultLocale || "en";
  const data = getLocaleContent(siteContent, activeLocale);
  translateStatic(activeLocale);
  setText("[data-field='name']", data.name);
  setText("[data-field='status']", data.status);
  setText("[data-field='profile']", data.profile);

  const emailLink = document.querySelector("#email-link");
  if (emailLink) {
    emailLink.href = `mailto:${data.email}`;
    emailLink.textContent = data.email;
  }

  const footerName = document.querySelector("#footer-name");
  if (footerName) footerName.textContent = `© 2026 ${data.name}`;

  renderList(document.querySelector("#research-interests"), (data.interests || []).slice(0, 4), (item) => {
    return `<span class="tag">${escapeHTML(item)}</span>`;
  });

  renderList(document.querySelector("#quick-facts"), data.facts, (item) => {
    return `<div><dt>${escapeHTML(item.label)}</dt><dd>${escapeHTML(item.value)}</dd></div>`;
  });

  if (data.agenda?.[0]) {
    document.querySelector("#focus-title").textContent = data.agenda[0].title;
    document.querySelector("#focus-summary").textContent = data.agenda[0].summary;
  }

  renderList(document.querySelector("#agenda-grid"), data.agenda, (item, index) => {
    return `<article class="agenda-card">
      <span class="card-index">0${index + 1}</span>
      <div>
        <h3>${escapeHTML(item.title)}</h3>
        <p>${escapeHTML(item.summary)}</p>
      </div>
    </article>`;
  });

  renderList(document.querySelector("#education-list"), data.education, (item) => {
    return `<article class="timeline-item">
      <div>
        <h3>${escapeHTML(item.degree)}</h3>
        <p class="timeline-meta">${escapeHTML(item.institution)} · ${escapeHTML(item.location)}</p>
      </div>
      <p>${escapeHTML(item.detail)}</p>
    </article>`;
  });

  renderList(document.querySelector("#publication-list"), data.publications, (item) => {
    return `<article class="publication-card">
      <span class="publication-type">${escapeHTML(item.type)}</span>
      <h3>${escapeHTML(item.title)}</h3>
      <p>${escapeHTML(item.citation)}</p>
    </article>`;
  });

  renderList(document.querySelector("#media-list"), data.media, (item) => {
    const href = item.href ? ` href="${escapeHTML(item.href)}"` : "";
    return `<article class="media-card">
      <span class="media-type">${escapeHTML(item.type)}</span>
      <h3>${href ? `<a${href}>${escapeHTML(item.title)}</a>` : escapeHTML(item.title)}</h3>
      <p>${escapeHTML(item.summary)}</p>
    </article>`;
  });

  renderList(document.querySelector("#experience-list"), data.experience, (item) => {
    const bullets = (item.bullets || []).map((bullet) => `<li>${escapeHTML(bullet)}</li>`).join("");
    return `<article class="timeline-item">
      <div>
        <h3>${escapeHTML(item.role)}</h3>
        <p class="timeline-meta">${escapeHTML(item.organization)} · ${escapeHTML(item.period)}</p>
      </div>
      <ul>${bullets}</ul>
    </article>`;
  });

  renderList(document.querySelector("#skills-list"), data.skills, (group) => {
    const items = (group.items || []).map((item) => `<li>${escapeHTML(item)}</li>`).join("");
    return `<article class="skill-column"><h3>${escapeHTML(group.category)}</h3><ul>${items}</ul></article>`;
  });

  renderList(document.querySelector("#footer-links"), data.links, (link) => {
    return `<a href="${escapeHTML(link.href)}">${escapeHTML(link.label)}</a>`;
  });
}

async function loadContent() {
  try {
    const localDraft = localStorage.getItem("portfolioContentDraft");
    if (localDraft) return JSON.parse(localDraft);

    const response = await fetch("content.json", { cache: "no-store" });
    if (!response.ok) throw new Error("content.json not found");
    return await response.json();
  } catch {
    return fallbackContent;
  }
}

document.querySelectorAll("[data-lang]").forEach((button) => {
  button.addEventListener("click", () => {
    localStorage.setItem("portfolioLocale", button.dataset.lang);
    renderSite(button.dataset.lang);
  });
});

loadContent().then((content) => {
  siteContent = content;
  renderSite(activeLocale);
});
