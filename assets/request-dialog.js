const requestDialog = document.querySelector("#request-dialog");
const requestMenuButton = document.querySelector(".menu-toggle");
const requestMobileMenu = document.querySelector("#mobile-menu");
const requestForm = document.querySelector("#request-form");
const requestNote = document.querySelector("#request-note");
const requestFallback = document.querySelector("#request-fallback");
const requestSubmit = requestForm.querySelector('[type="submit"]');
const requestFields = [...requestForm.querySelectorAll('input:not([name="website"]), textarea')];
let requestReturnFocus = null;
const requestText = document.documentElement.lang.startsWith("en")
  ? { available: "Leave your contact details and we will get back to you.", unavailable: "Email or call us.", pending: "Sending your message…", sent: "Message sent. Thank you!", error: "We could not send your message. Please try again." }
  : { available: "Оставьте контакт, чтобы мы могли ответить.", unavailable: "Напишите или позвоните нам.", pending: "Отправляем сообщение…", sent: "Сообщение отправлено. Спасибо!", error: "Не удалось отправить сообщение. Попробуйте ещё раз." };

function getContactEndpoint() {
  return typeof window.PLAY_CONTACT_API_URL === "string" ? window.PLAY_CONTACT_API_URL.trim() : "";
}

function setRequestNote(message, state = "") {
  requestNote.textContent = message;
  requestNote.dataset.state = state;
}

function updateContactAvailability() {
  const available = Boolean(getContactEndpoint());
  requestFields.forEach(field => { field.disabled = !available; });
  requestSubmit.disabled = !available;
  requestForm.hidden = !available;
  requestFallback.hidden = available;
  setRequestNote(available ? requestText.available : requestText.unavailable, available ? "" : "unavailable");
}

updateContactAvailability();

document.querySelectorAll("[data-open-request]").forEach(trigger => {
  trigger.addEventListener("click", () => {
    requestReturnFocus = trigger.closest(".mobile-menu") ? requestMenuButton : trigger;
    requestMobileMenu.hidden = true;
    requestMenuButton.setAttribute("aria-expanded", "false");
    updateContactAvailability();
    if (!requestDialog.open) requestDialog.showModal();
    document.body.classList.add("dialog-open");
  });
});

requestDialog.querySelector(".dialog-close").addEventListener("click", () => requestDialog.close());
requestDialog.addEventListener("click", event => {
  if (event.target === requestDialog) requestDialog.close();
});
requestDialog.addEventListener("close", () => {
  document.body.classList.remove("dialog-open");
  requestReturnFocus?.focus();
});

requestForm.addEventListener("submit", async event => {
  event.preventDefault();
  if (!requestForm.reportValidity()) return;

  const endpoint = getContactEndpoint();
  if (!endpoint) {
    updateContactAvailability();
    return;
  }

  const fields = new FormData(requestForm);
  const payload = {
    name: String(fields.get("name") || "").trim(),
    contact: String(fields.get("contact") || "").trim(),
    message: String(fields.get("question") || "").trim(),
    website: String(fields.get("website") || "").trim()
  };

  requestFields.forEach(field => { field.disabled = true; });
  requestSubmit.disabled = true;
  setRequestNote(requestText.pending, "pending");
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error("Contact delivery failed");
    requestForm.reset();
    setRequestNote(requestText.sent, "success");
  } catch {
    setRequestNote(requestText.error, "error");
  } finally {
    requestFields.forEach(field => { field.disabled = false; });
    requestSubmit.disabled = false;
  }
});
