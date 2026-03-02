import { head, masthead, footer, foot } from "../partials/chrome";

export function renderPage(title: string, bodyHtml: string) {
  return (
    head(title) +
    `<div class="shell"><div class="content">` +
    masthead() +
    bodyHtml +
    footer() +
    `</div></div>` +
    foot()
  );
}








