import "./styles/site.css";
import { renderMethodPage } from "./pages/method";
import { initSite } from "./site";

const root = document.querySelector<HTMLDivElement>("#app");
if (root) root.innerHTML = renderMethodPage();
initSite();

