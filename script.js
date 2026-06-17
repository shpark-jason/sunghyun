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

document.querySelector("[data-copy]")?.addEventListener("click", async (event) => {
  const button = event.currentTarget;
  const value = button.dataset.copy;
  const original = button.textContent;

  try {
    await navigator.clipboard.writeText(value);
    button.textContent = "복사 완료";
    setTimeout(() => {
      button.textContent = original;
    }, 1400);
  } catch {
    window.location.href = `mailto:${value}`;
  }
});
