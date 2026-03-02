import "./styles/site.css";
import { renderHome } from "./pages/home";
import { initSite } from "./site";

const root = document.getElementById("app");
if (root) {
  root.innerHTML = renderHome();
  initSite();
}

