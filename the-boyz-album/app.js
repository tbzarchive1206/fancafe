const DATA = window.FANCAFE_ALBUM_DATA;
const state = { section: "all", query: "", sort: "newest", shown: 24, current: null, photoShown: 24 };
const $ = (selector) => document.querySelector(selector);
const cards = $("#galleries");
const search = $("#search");
const sectionFilter = $("#sectionFilter");
const sortFilter = $("#sortFilter");
const tabs = $("#sectionTabs");
const loadMore = $("#loadMore");
const dialog = $("#galleryDialog");
const photoGrid = $("#photoGrid");
const esc = (value) => String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
const thumb = (id, size = "w1000") => `https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=${size}`;
const folder = (id) => `https://drive.google.com/drive/folders/${encodeURIComponent(id)}`;
const view = (id) => `https://drive.google.com/file/d/${encodeURIComponent(id)}/view`;
const download = (id) => `https://drive.google.com/uc?export=download&id=${encodeURIComponent(id)}`;
const dateCode = (name) => { const match = String(name).match(/^(\d{6}|\d{8})/); if (!match) return 0; return Number(match[1].length === 6 ? `20${match[1]}` : match[1]); };
const dateLabel = (name) => { const value = String(dateCode(name)); return value === "0" ? "—" : `${value.slice(0, 4)}.${value.slice(4, 6)}.${value.slice(6, 8)}`; };

function setupFilters() {
  DATA.categories.forEach((category) => sectionFilter.insertAdjacentHTML("beforeend", `<option value="${esc(category.id)}">${esc(category.name)}</option>`));
  renderTabs();
}

function renderTabs() {
  tabs.innerHTML = `<button class="${state.section === "all" ? "selected" : ""}" data-section="all">ALL SECTIONS</button>` + DATA.categories.map((category) => `<button class="${state.section === category.id ? "selected" : ""}" data-section="${esc(category.id)}">${esc(category.name)}</button>`).join("");
}

function filtered() {
  let list = DATA.galleries.filter((gallery) => (state.section === "all" || gallery.categoryId === state.section) && (!state.query || `${gallery.name} ${gallery.category}`.toLocaleLowerCase().includes(state.query)));
  list = [...list];
  if (state.sort === "oldest") list.sort((a, b) => dateCode(a.name) - dateCode(b.name));
  else if (state.sort === "largest") list.sort((a, b) => b.images.length - a.images.length);
  else if (state.sort === "az") list.sort((a, b) => a.name.localeCompare(b.name));
  else list.sort((a, b) => dateCode(b.name) - dateCode(a.name));
  return list;
}

function renderCards() {
  const list = filtered();
  const visible = list.slice(0, state.shown);
  const sectionName = state.section === "all" ? "ALL GALLERIES" : DATA.categories.find((category) => category.id === state.section)?.name || "ALL GALLERIES";
  $("#resultsLabel").textContent = `${sectionName} · ${list.length}`;
  cards.innerHTML = visible.map((gallery, index) => `<article class="post-card"><button class="post-thumb" type="button" data-open="${esc(gallery.id)}" aria-label="${esc(`VIEW GALLERY: ${gallery.name}`)}"><img src="${thumb(gallery.images[0].id)}" alt="" loading="lazy"><span class="number">${String(index + 1).padStart(3, "0")}</span><span class="read-tag">${gallery.images.length} PHOTOS</span></button><div class="post-info"><div class="eyebrow">${esc(gallery.category)}</div><h2>${esc(gallery.name)}</h2><div class="meta"><span>GALLERY</span><b>${gallery.images.length} PHOTOS</b><span>DATE</span><b>${dateLabel(gallery.name)}</b></div><div class="post-actions"><button type="button" data-open="${esc(gallery.id)}">VIEW GALLERY →</button><a href="${folder(gallery.id)}" target="_blank" rel="noopener noreferrer">DRIVE ↗</a></div></div></article>`).join("");
  $("#empty").hidden = list.length > 0;
  loadMore.hidden = state.shown >= list.length;
}

function openGallery(id) {
  state.current = DATA.galleries.find((gallery) => gallery.id === id);
  if (!state.current) return;
  state.photoShown = 24;
  $("#dialogTitle").textContent = state.current.name;
  $("#dialogKicker").textContent = `${state.current.category} · ${state.current.images.length} PHOTOS`;
  $("#dialogDrive").href = folder(state.current.id);
  renderPhotos();
  dialog.showModal();
  document.body.classList.add("reader-open");
}

function renderPhotos() {
  const images = state.current.images.slice(0, state.photoShown);
  photoGrid.innerHTML = images.map((image, index) => `<figure class="photo"><img src="${thumb(image.id, "w1400")}" alt="${esc(`${state.current.name} — ${image.name}`)}" loading="lazy"><figcaption class="photo-bar"><span class="photo-name">${String(index + 1).padStart(3, "0")} / ${esc(image.name)}</span><span class="photo-links"><a href="${view(image.id)}" target="_blank" rel="noopener noreferrer">VIEW ↗</a><a href="${download(image.id)}" target="_blank" rel="noopener noreferrer" download>DOWNLOAD ↓</a></span></figcaption></figure>`).join("");
  $("#galleryMore").hidden = state.photoShown >= state.current.images.length;
}

search.addEventListener("input", (event) => { state.query = event.target.value.trim().toLocaleLowerCase(); state.shown = 24; renderCards(); });
sectionFilter.addEventListener("change", (event) => { state.section = event.target.value; state.shown = 24; renderTabs(); renderCards(); });
sortFilter.addEventListener("change", (event) => { state.sort = event.target.value; renderCards(); });
tabs.addEventListener("click", (event) => { const button = event.target.closest("button[data-section]"); if (!button) return; state.section = button.dataset.section; sectionFilter.value = state.section; state.shown = 24; renderTabs(); renderCards(); });
cards.addEventListener("click", (event) => { const target = event.target.closest("[data-open]"); if (target) openGallery(target.dataset.open); });
loadMore.addEventListener("click", () => { state.shown += 24; renderCards(); });
$("#galleryMore").addEventListener("click", () => { state.photoShown += 24; renderPhotos(); });
$("#closeDialog").addEventListener("click", () => dialog.close());
dialog.addEventListener("close", () => { document.body.classList.remove("reader-open"); state.current = null; });
dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });

$("#galleryCount").textContent = DATA.galleries.length.toLocaleString("en-US");
$("#photoCount").textContent = DATA.galleries.reduce((sum, gallery) => sum + gallery.images.length, 0).toLocaleString("en-US");
setupFilters();
renderCards();
