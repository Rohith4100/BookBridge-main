// js/ui.js
export const qs = (s, r = document) => r.querySelector(s);
export const qsa = (s, r = document) => [...r.querySelectorAll(s)];
export function el(tag, attrs = {}) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
  return node;
}

// Toast system (works with #toast styles)
export function showToast(msg, type = "info") {
  let t = qs("#toast");
  if (!t) {
    t = document.createElement("div");
    t.id = "toast";
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.className = `toast ${type} show`;
  setTimeout(() => {
    t.className = "toast";
  }, 2500);
}

// Modal system (in-page confirm/alert)
export function showModal({ title = "Notice", message = "", actions = [] }) {
  let overlay = qs("#modalOverlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "modalOverlay";
    overlay.style.position = "fixed";
    overlay.style.inset = "0";
    overlay.style.background = "rgba(0,0,0,0.6)";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.zIndex = "1000";
    document.body.appendChild(overlay);
  }
  overlay.innerHTML = "";

  const card = document.createElement("div");
  card.className = "card";
  card.style.maxWidth = "420px";
  card.style.textAlign = "center";
  card.innerHTML = `
    <h3 style="color:var(--accent)">${title}</h3>
    <p>${message}</p>
  `;

  const btnRow = document.createElement("div");
  btnRow.style.display = "flex";
  btnRow.style.justifyContent = "center";
  btnRow.style.gap = "12px";
  btnRow.style.marginTop = "16px";

  actions.forEach(a => {
    const b = document.createElement("button");
    b.textContent = a.label;
    b.className = `btn ${a.class || ""}`;
    b.onclick = () => {
      if (a.onClick) a.onClick();
      overlay.remove();
    };
    btnRow.appendChild(b);
  });

  card.appendChild(btnRow);
  overlay.appendChild(card);
}
