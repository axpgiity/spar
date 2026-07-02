export function html(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function view(markup) {
  return markup;
}

export function bind(root, selector, eventName, handler) {
  root.querySelectorAll(selector).forEach((node) => {
    node.addEventListener(eventName, handler);
  });
}
