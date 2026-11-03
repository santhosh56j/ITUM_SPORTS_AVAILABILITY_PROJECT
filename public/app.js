const searchForm = document.querySelector("#search-form");
const equipmentGrid = document.querySelector("#equipment-grid");
const resultsCount = document.querySelector("#results-count");
const statusMessage = document.querySelector("#status-message");
const reservationDialog = document.querySelector("#reservation-dialog");
const bookingForm = document.querySelector("#booking-form");
const bookingError = document.querySelector("#booking-error");
const bookingSubmit = document.querySelector("#booking-submit");
const confirmationDialog = document.querySelector("#confirmation-dialog");

let equipmentItems = [];
let selectedEquipment = null;
let activeCategory = "All";

const equipmentArtwork = {
  Football: `<svg viewBox="0 0 180 130" fill="none" aria-hidden="true"><circle cx="90" cy="66" r="44" fill="#F8F8F3"/><path d="m90 44 14 10-5 17H81l-5-17 14-10Zm-14 10-18-5m10 33 18-11m18-17 18-5m-8 39-18-11m0 23V72" stroke="#262626" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M56 34c16-16 39-22 60-16" stroke="#fff" stroke-opacity=".6" stroke-width="3" stroke-linecap="round"/></svg>`,
  Basketball: `<svg viewBox="0 0 180 130" fill="none" aria-hidden="true"><circle cx="90" cy="66" r="44" fill="#EF8844"/><path d="M90 22v88M46 66h88M58 34c22 16 22 48 0 64m64-64c-22 16-22 48 0 64" stroke="#292821" stroke-width="4" stroke-linecap="round"/><path d="M61 35c10-8 21-12 33-13" stroke="#fff" stroke-opacity=".55" stroke-width="3" stroke-linecap="round"/></svg>`,
  Volleyball: `<svg viewBox="0 0 180 130" fill="none" aria-hidden="true"><circle cx="90" cy="66" r="44" fill="#F7F1DE"/><path d="M90 22c-7 23-5 44 5 64 11-2 23-10 34-21M49 51c22-5 43-1 61 11 0 12-6 25-18 39M71 107c2-24 13-43 32-57-4-10-14-19-29-28" stroke="#5B8E9C" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><path d="M59 37c10-8 22-13 34-14" stroke="#fff" stroke-width="3" stroke-linecap="round"/></svg>`,
  "Badminton racket": `<svg viewBox="0 0 180 130" fill="none" aria-hidden="true"><ellipse cx="79" cy="51" rx="26" ry="37" transform="rotate(35 79 51)" fill="#F8F8F3" stroke="#253C31" stroke-width="5"/><path d="m95 77 35 33m-57-87 2 47m-17-40 38 29m-48-13 48 4m-38 23 35-33m7 81 14-14" stroke="#253C31" stroke-width="3" stroke-linecap="round"/><circle cx="142" cy="29" r="8" fill="#DB724F"/></svg>`,
  "Badminton shuttlecock set": `<svg viewBox="0 0 180 130" fill="none" aria-hidden="true"><path d="m90 43 29-29m-29 29L76 9m14 34L103 6m-13 37L61 16" stroke="#F8F8F3" stroke-width="7" stroke-linecap="round"/><path d="M66 31c14 10 34 14 49 9L90 83 66 40" fill="#FCFCF7" stroke="#315847" stroke-width="4" stroke-linejoin="round"/><path d="m83 83 7 28m0-28 7 28m-7-28v28" stroke="#D77B55" stroke-width="5" stroke-linecap="round"/></svg>`,
  "Cricket bat": `<svg viewBox="0 0 180 130" fill="none" aria-hidden="true"><path d="m76 47 14-31c3-7 13-7 17 0l11 22c2 4 1 9-2 12l-38 40-15 18-16-15 17-17 12-29Z" fill="#D6A75F" stroke="#473B2D" stroke-width="4" stroke-linejoin="round"/><path d="m91 17 16 15" stroke="#473B2D" stroke-width="3" stroke-linecap="round"/><circle cx="127" cy="91" r="19" fill="#C64F45"/><path d="m118 78 18 26" stroke="#F5D6C8" stroke-width="3"/></svg>`,
  "Cricket ball": `<svg viewBox="0 0 180 130" fill="none" aria-hidden="true"><circle cx="90" cy="66" r="43" fill="#B9473F"/><path d="M62 31c22 20 34 48 33 78m24-86c-23 20-35 47-34 77" stroke="#F5E4D9" stroke-width="4" stroke-linecap="round" stroke-dasharray="3 7"/><path d="M59 41c10-10 21-15 34-17" stroke="#fff" stroke-opacity=".55" stroke-width="3" stroke-linecap="round"/></svg>`,
  "Table tennis paddle": `<svg viewBox="0 0 180 130" fill="none" aria-hidden="true"><ellipse cx="79" cy="49" rx="31" ry="38" transform="rotate(-32 79 49)" fill="#C95849"/><path d="m93 76 29 38c4 5 12 5 16 1l4-4c4-4 4-10 0-14l-32-37" fill="#D7A75D" stroke="#443B31" stroke-width="4" stroke-linejoin="round"/><path d="M56 31c12-12 28-17 43-15" stroke="#F7C2AE" stroke-width="4" stroke-linecap="round"/><circle cx="141" cy="27" r="9" fill="#F6F0D8"/></svg>`
};

function localDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getSchedule() {
  const values = new FormData(searchForm);
  const date = values.get("date");
  const time = values.get("time");

  return {
    date,
    time,
    duration_minutes: values.get("duration_minutes"),
    timezone_offset_minutes: new Date(`${date}T${time}:00`).getTimezoneOffset()
  };
}

function formatSchedule(startAt, endAt) {
  const start = new Date(startAt);
  const end = new Date(endAt);
  const date = start.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric"
  });
  const startTime = start.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit"
  });
  const endTime = end.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit"
  });
  return `${date}, ${startTime}–${endTime}`;
}

function selectedScheduleRange() {
  const schedule = getSchedule();
  const start = new Date(`${schedule.date}T${schedule.time}:00`);
  const end = new Date(start.getTime() + Number(schedule.duration_minutes) * 60_000);
  return { start, end };
}

function showStatus(message) {
  statusMessage.textContent = message;
  statusMessage.hidden = false;
}

function clearStatus() {
  statusMessage.textContent = "";
  statusMessage.hidden = true;
}

function renderEquipment(items) {
  equipmentGrid.replaceChildren();
  const visibleItems = activeCategory === "All"
    ? items
    : items.filter((item) => item.category === activeCategory);
  const availableCount = visibleItems.filter((item) => item.available_quantity > 0).length;
  resultsCount.textContent = `${availableCount} of ${visibleItems.length} available`;

  if (visibleItems.length === 0) {
    const emptyState = document.createElement("p");
    emptyState.className = "empty-state";
    emptyState.textContent = activeCategory === "All"
      ? "No equipment has been added yet. Please check back soon."
      : `No equipment is listed in ${activeCategory.toLowerCase()} yet.`;
    equipmentGrid.append(emptyState);
    return;
  }

  for (const item of visibleItems) {
    const card = document.createElement("article");
    card.className = "equipment-card";

    const artwork = document.createElement("div");
    artwork.className = `equipment-art art-${item.id}`;
    artwork.setAttribute("aria-hidden", "true");
    artwork.innerHTML = equipmentArtwork[item.name] || equipmentArtwork.Football;

    const topLine = document.createElement("div");
    topLine.className = "card-topline";

    const category = document.createElement("span");
    category.className = "category-tag";
    category.textContent = item.category;

    const availability = document.createElement("span");
    availability.className = `availability-tag${item.available_quantity < 1 ? " unavailable" : ""}`;
    availability.textContent = item.available_quantity > 0
      ? `${item.available_quantity} available`
      : "Fully booked";
    topLine.append(category, availability);

    const name = document.createElement("h3");
    name.textContent = item.name;

    const description = document.createElement("p");
    description.textContent = item.description;

    const cardFooter = document.createElement("div");
    cardFooter.className = "card-footer";

    const quantity = document.createElement("span");
    quantity.className = "quantity-note";
    quantity.textContent = `${item.total_quantity} in the equipment room`;

    const button = document.createElement("button");
    button.className = "card-action";
    button.type = "button";
    button.setAttribute("aria-label", `Reserve ${item.name}`);
    button.textContent = item.available_quantity > 0 ? "Reserve →" : "Booked";
    button.disabled = item.available_quantity < 1;
    button.addEventListener("click", () => openReservation(item));
    cardFooter.append(quantity, button);

    card.append(artwork, topLine, name, description, cardFooter);
    equipmentGrid.append(card);
  }
}

async function loadEquipment(event) {
  if (event) {
    event.preventDefault();
  }

  if (!searchForm.reportValidity()) {
    return;
  }

  clearStatus();
  resultsCount.textContent = "Checking…";
  equipmentGrid.setAttribute("aria-busy", "true");

  const query = new URLSearchParams(getSchedule());

  try {
    const response = await fetch(`/api/equipment?${query}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Could not load equipment availability.");
    }

    equipmentItems = data.equipment;
    renderEquipment(equipmentItems);
  } catch (error) {
    resultsCount.textContent = "";
    showStatus(error.message || "Could not connect to the reservation service. Please try again.");
  } finally {
    equipmentGrid.removeAttribute("aria-busy");
  }
}

function openReservation(item) {
  selectedEquipment = item;
  bookingError.hidden = true;
  bookingError.textContent = "";
  const { start, end } = selectedScheduleRange();
  document.querySelector("#selected-equipment").textContent =
    `${item.name} · ${formatSchedule(start.toISOString(), end.toISOString())}`;
  reservationDialog.showModal();
}

bookingForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!selectedEquipment || !bookingForm.reportValidity()) {
    return;
  }

  bookingError.hidden = true;
  bookingSubmit.disabled = true;
  bookingSubmit.textContent = "Confirming…";

  const formValues = new FormData(bookingForm);
  const payload = {
    ...getSchedule(),
    equipment_id: selectedEquipment.id,
    student_name: formValues.get("student_name"),
    student_email: formValues.get("student_email")
  };

  try {
    const response = await fetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Could not make this reservation.");
    }

    reservationDialog.close();
    document.querySelector("#confirmation-summary").textContent =
      `${data.reservation.equipment_name} is reserved for ${formatSchedule(
        data.reservation.start_at,
        data.reservation.end_at
      )}.`;
    document.querySelector("#confirmation-code").textContent = data.reservation.confirmation_code;
    bookingForm.reset();
    confirmationDialog.showModal();
    await loadEquipment();
  } catch (error) {
    bookingError.textContent = error.message || "Could not connect to the reservation service. Please try again.";
    bookingError.hidden = false;
  } finally {
    bookingSubmit.disabled = false;
    bookingSubmit.textContent = "Confirm reservation";
  }
});

document.querySelector("#close-dialog").addEventListener("click", () => reservationDialog.close());
document.querySelector("#close-confirmation").addEventListener("click", () => confirmationDialog.close());
searchForm.addEventListener("submit", loadEquipment);
document.querySelectorAll(".category-filter").forEach((filter) => {
  filter.addEventListener("click", () => {
    activeCategory = filter.dataset.category;
    document.querySelectorAll(".category-filter").forEach((button) => {
      const isActive = button === filter;
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
    renderEquipment(equipmentItems);
  });
});

const now = new Date();
const today = localDateString(now);
document.querySelector("#reservation-date").min = today;
document.querySelector("#reservation-date").value = today;
const nextHour = new Date(now);
nextHour.setMinutes(0, 0, 0);
nextHour.setHours(nextHour.getHours() + 1);
document.querySelector("#reservation-time").value =
  `${String(nextHour.getHours()).padStart(2, "0")}:${String(nextHour.getMinutes()).padStart(2, "0")}`;

loadEquipment();
