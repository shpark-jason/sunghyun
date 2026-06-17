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
    navInterests: "Interests",
    navEducation: "Education",
    navPublications: "Publications",
    navPresentations: "Presentations",
    navWork: "Work",
    navMedia: "Media",
    heroPrimary: "Research Interests",
    heroSecondary: "Download CV",
    currentFocus: "Current Focus",
    interestsEyebrow: "Research Interests",
    interestsTitle: "Current research interests",
    educationEyebrow: "Education History",
    educationTitle: "Training across media, culture, and communication",
    publicationsEyebrow: "Publications",
    publicationsTitle: "Peer-reviewed scholarly work",
    presentationsEyebrow: "Presentations",
    presentationsTitle: "Conference activity",
    mediaEyebrow: "Columns & Media",
    mediaTitle: "Public-facing writing and commentary",
    workEyebrow: "Work History",
    workTitle: "Research, policy, and cultural work",
    methodsEyebrow: "Methods & Skills",
    methodsTitle: "Research toolkit",
    contactEyebrow: "Contact",
    contactTitle: "Open to research conversations, media policy projects, and academic collaboration.",
    adminLink: "Admin",
    emailAction: "Send Email",
    viewResearch: "View research details",
    viewEducation: "View education details",
    viewPublications: "View all publications",
    viewPresentations: "View all presentations",
    viewMedia: "View media activity",
    viewWork: "View work details",
  },
  ko: {
    navInterests: "연구 관심사",
    navEducation: "학력",
    navPublications: "논문",
    navPresentations: "발표",
    navWork: "경력",
    navMedia: "언론 활동",
    heroPrimary: "연구 관심사 보기",
    heroSecondary: "CV 다운로드",
    currentFocus: "현재 연구 초점",
    interestsEyebrow: "연구 관심사",
    interestsTitle: "최근 연구 관심 주제",
    educationEyebrow: "학력",
    educationTitle: "미디어, 문화, 커뮤니케이션을 가로지르는 연구 훈련",
    publicationsEyebrow: "논문",
    publicationsTitle: "동료심사 학술 성과",
    presentationsEyebrow: "발표",
    presentationsTitle: "학술대회 발표 활동",
    mediaEyebrow: "칼럼 및 언론 활동",
    mediaTitle: "공론장 글쓰기와 미디어 코멘터리",
    workEyebrow: "경력",
    workTitle: "연구, 정책, 문화 현장의 경험",
    methodsEyebrow: "방법론 및 역량",
    methodsTitle: "연구 도구",
    contactEyebrow: "연락처",
    contactTitle: "연구 논의, 미디어 정책 프로젝트, 학술 협업에 열려 있습니다.",
    adminLink: "관리",
    emailAction: "메일 보내기",
    viewResearch: "연구 상세 보기",
    viewEducation: "학력 상세 보기",
    viewPublications: "논문 전체 보기",
    viewPresentations: "발표 전체 보기",
    viewMedia: "언론 활동 보기",
    viewWork: "경력 상세 보기",
  },
};

const fallbackContent = {
  defaultLocale: "en",
  locales: {
    en: {
      name: "Sunghyun Park",
      status: "Research Portfolio · Media & Platform Studies",
      email: "parksunghyun@yonsei.ac.kr",
      profile:
        "Scholar investigating how digital platforms shape participation, inequality, and user agency in contemporary mediated environments.",
      interests: ["Platform Power", "User Agency", "Digital Inequality"],
      facts: [],
      researchInterests: [],
      education: [],
      publications: [],
      presentations: [],
      media: [],
      work: [],
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

  const emailActionLink = document.querySelector("#email-action-link");
  if (emailActionLink) {
    emailActionLink.href = `mailto:${data.email}`;
  }

  const portrait = document.querySelector("#portrait-image");
  if (portrait && data.portrait) {
    portrait.src = data.portrait;
  }

  const footerName = document.querySelector("#footer-name");
  if (footerName) footerName.textContent = `© 2026 ${data.name}`;

  renderList(document.querySelector("#research-interests"), (data.interests || []).slice(0, 4), (item) => {
    return `<span class="tag">${escapeHTML(item)}</span>`;
  });

  renderList(document.querySelector("#quick-facts"), data.facts, (item) => {
    return `<div><dt>${escapeHTML(item.label)}</dt><dd>${escapeHTML(item.value)}</dd></div>`;
  });

  renderList(document.querySelector("#interests-grid"), data.researchInterests, (item, index) => {
    return `<article class="agenda-card">
      <span class="card-index">0${index + 1}</span>
      <div>
        <h3><a href="details.html?section=interests&item=${index}">${escapeHTML(item.title)}</a></h3>
        <p>${escapeHTML(item.summary)}</p>
      </div>
    </article>`;
  });

  renderList(document.querySelector("#education-list"), (data.education || []).slice(0, 2), (item, index) => {
    return `<article class="timeline-item">
      <div>
        <h3><a href="details.html?section=education&item=${index}">${escapeHTML(item.degree)}</a></h3>
        <p class="timeline-meta">${escapeHTML(item.institution)} · ${escapeHTML(item.location)}</p>
      </div>
      <p>${escapeHTML(item.detail)}</p>
    </article>`;
  });

  renderList(document.querySelector("#publication-list"), (data.publications || []).slice(0, 2), (item, index) => {
    return `<article class="publication-card">
      <span class="publication-type">${escapeHTML(item.type)}</span>
      <h3><a href="details.html?section=publications&item=${index}">${escapeHTML(item.title)}</a></h3>
      <p>${escapeHTML(item.citation)}</p>
    </article>`;
  });

  renderList(document.querySelector("#presentation-list"), (data.presentations || []).slice(0, 2), (item, index) => {
    return `<article class="publication-card">
      <span class="publication-type">${escapeHTML(item.type)}</span>
      <h3><a href="details.html?section=presentations&item=${index}">${escapeHTML(item.title)}</a></h3>
      <p>${escapeHTML(item.citation)}</p>
    </article>`;
  });

  renderList(document.querySelector("#media-list"), (data.media || []).slice(0, 2), (item, index) => {
    return `<article class="media-card">
      <span class="media-type">${escapeHTML(item.type)}</span>
      <h3><a href="details.html?section=media&item=${index}">${escapeHTML(item.title)}</a></h3>
      <p>${escapeHTML(item.summary)}</p>
    </article>`;
  });

  renderList(document.querySelector("#work-list"), (data.work || data.experience || []).slice(0, 3), (item, index) => {
    const bullets = (item.bullets || []).map((bullet) => `<li>${escapeHTML(bullet)}</li>`).join("");
    return `<article class="timeline-item compact">
      <div>
        <h3><a href="details.html?section=work&item=${index}">${escapeHTML(item.role)}</a></h3>
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
