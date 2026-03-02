import type { Determination } from "./data/determinations";

export function setActiveNav() {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  const links = document.querySelectorAll<HTMLAnchorElement>(".nav a[data-path]");
  links.forEach((a) => {
    const p = a.getAttribute("data-path") || "";
    const match = p === "/" ? path === "/" : path.startsWith(p);
    if (match) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
}

export function wireCiteLinks(): void {
  const buttons = Array.from(document.querySelectorAll("button[data-cite]")) as HTMLButtonElement[];
  const links = Array.from(document.querySelectorAll("a[data-cite]")) as HTMLAnchorElement[];
  const allCiteElements = [...buttons, ...links];
  
  for (const el of allCiteElements) {
    el.addEventListener("click", async (e) => {
      e.preventDefault();
      const cite = el.getAttribute("data-cite");
      if (!cite) return;
      try {
        await navigator.clipboard.writeText(cite);
        const originalText = el.textContent;
        el.textContent = "Copied";
        window.setTimeout(() => {
          if (el.textContent === "Copied") {
            el.textContent = originalText ?? "Cite";
          }
        }, 900);
      } catch {
        // Clipboard blocked — do nothing (institutional posture)
      }
    });
  }
}

export function initSite() {
  setActiveNav();
  wireCiteLinks();
}

function normalize(s: string): string {
  return s.toLowerCase().trim();
}

export function attachSearch(dets: Determination[]) {
  const input = document.querySelector<HTMLInputElement>("#q");
  const list = document.querySelector<HTMLElement>("#detList");
  if (!input || !list) return;

  const all = dets.slice().sort((a, b) => b.assessmentDate.localeCompare(a.assessmentDate));

  const render = (items: Determination[]) => {
    list.innerHTML = items
      .map((d) => {
        return `
          <div class="record">
            <div class="recordMain">
              <a class="recordTitle" href="${d.permalink}">${d.shortTitle}</a>
              <div class="recordSub">${d.determinationLabel}</div>
            </div>
            <div class="recordMeta">
              <div>${d.assessmentDateHuman}</div>
              <div class="muted">${d.status}</div>
            </div>
          </div>
        `;
      })
      .join("");
  };

  render(all);

  input.addEventListener("input", () => {
    const q = normalize(input.value);
    if (!q) return render(all);
    const filtered = all.filter((d) => {
      const hay =
        normalize(d.shortTitle) +
        " " +
        normalize(d.systemType) +
        " " +
        normalize(d.determinationLabel);
      return hay.includes(q);
    });
    render(filtered);
  });
}


