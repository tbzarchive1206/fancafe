const POSTS = window.FANCAFE_POSTS || [];
const CONTENT = window.FANCAFE_CONTENT || {};
const MEMBERS = [
  { value: "SANGYEON", label: "SANGYEON" },
  { value: "JACOB", label: "JACOB" },
  { value: "YOUNGHOON", label: "YOUNGHOON" },
  { value: "HYUNJAE", label: "HYUNJAE" },
  { value: "JUYEON", label: "JUYEON" },
  { value: "KEVIN", label: "KEVIN" },
  { value: "Q / CHANGMIN", label: "Q" },
  { value: "SUNWOO", label: "SUNWOO" },
  { value: "ERIC", label: "ERIC" },
  { value: "HWALL", label: "HWALL (2017 - 2019)" },
  { value: "HAKNYEON", label: "HAKNYEON (2017 - 2025)" },
  { value: "NEW / CHANHEE", label: "NEW (2017 - 2026)" }
];
const YEARS = [...new Set(POSTS.map((post) => post.year).filter(Boolean))].sort((a, b) => b - a);
const state = { member: "all", year: "all", query: "", shown: 30, current: null };
const $ = (selector) => document.querySelector(selector);
const postsEl = $("#posts");
const search = $("#search");
const memberFilter = $("#memberFilter");
const yearFilter = $("#yearFilter");
const yearTabs = $("#yearTabs");
const loadMore = $("#loadMore");
const reader = $("#reader");
const readerArticle = $("#readerArticle");
const readerFrameWrap = $("#readerFrameWrap");
const esc = (value) => String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
const thumb = (id) => `https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w1000`;
const preview = (post) => post.type === "pdf" ? `https://drive.google.com/file/d/${encodeURIComponent(post.id)}/preview` : `https://docs.google.com/document/d/${encodeURIComponent(post.id)}/preview`;
const original = (post) => post.type === "pdf" ? `https://drive.google.com/file/d/${encodeURIComponent(post.id)}/view` : `https://docs.google.com/document/d/${encodeURIComponent(post.id)}/view`;
const download = (post) => post.type === "pdf" ? `https://drive.google.com/uc?export=download&id=${encodeURIComponent(post.id)}` : `https://docs.google.com/document/d/${encodeURIComponent(post.id)}/export?format=pdf`;
const displayDate = (post) => post.date ? post.date.replaceAll("-", ".") : "DATE UNKNOWN";
const displayMember = (value) => MEMBERS.find((member) => member.value === value)?.label || value;

function setupFilters() {
  MEMBERS.forEach((member) => memberFilter.insertAdjacentHTML("beforeend", `<option value="${esc(member.value)}">${esc(member.label)}</option>`));
  YEARS.forEach((year) => yearFilter.insertAdjacentHTML("beforeend", `<option value="${year}">${year}</option>`));
  renderYearTabs();
}

function renderYearTabs() {
  yearTabs.innerHTML = `<button class="${state.year === "all" ? "selected" : ""}" data-year="all">ALL YEARS</button>` + YEARS.map((year) => `<button class="${String(state.year) === String(year) ? "selected" : ""}" data-year="${year}">${year}</button>`).join("");
}

function filtered() {
  return POSTS
    .filter((post) => state.member === "all" || post.member === state.member)
    .filter((post) => state.year === "all" || post.year === Number(state.year))
    .filter((post) => !state.query || `${post.title} ${post.originalName} ${post.member}`.toLocaleLowerCase().includes(state.query))
    .sort((a, b) => b.sort - a.sort || a.originalName.localeCompare(b.originalName, undefined, { numeric: true }));
}

function renderPosts() {
  const list = filtered();
  const visible = list.slice(0, state.shown);
  $("#resultsLabel").textContent = `${state.member === "all" ? "ALL POSTS" : displayMember(state.member)} · ${list.length.toLocaleString("en-US")}`;
  postsEl.innerHTML = visible.map((post, index) => `<article class="post-card"><button class="post-thumb" type="button" data-read="${esc(post.id)}" aria-label="${esc(`READ POST: ${post.title}`)}"><img src="${thumb(post.id)}" alt="" loading="lazy"><span class="number">${String(index + 1).padStart(3, "0")}</span><span class="read-tag">READ POST →</span></button><div class="post-info"><div class="eyebrow">${esc(displayMember(post.member))}</div><h2>${esc(post.title)}</h2><div class="meta"><span>DATE</span><b>${displayDate(post)}</b><span>MEMBER</span><b>${esc(displayMember(post.member))}</b></div><div class="post-actions"><button type="button" data-read="${esc(post.id)}">READ POST →</button><a href="${download(post)}" target="_blank" rel="noopener noreferrer">PDF ↓</a></div></div></article>`).join("");
  $("#empty").hidden = list.length > 0;
  loadMore.hidden = state.shown >= list.length;
}

function openReader(id) {
  const post = POSTS.find((item) => item.id === id);
  if (!post) return;
  state.current = post;
  $("#readerTitle").textContent = post.title;
  $("#readerKicker").textContent = `${displayMember(post.member)} · ${displayDate(post)}`;
  $("#downloadPost").href = download(post);
  $("#originalPost").href = original(post);
  const article = CONTENT[post.id];
  readerArticle.hidden = !article;
  readerFrameWrap.hidden = Boolean(article);
  if (article) {
    readerArticle.innerHTML = article;
    $("#readerFrame").src = "about:blank";
  } else {
    readerArticle.innerHTML = "";
    $("#readerFrame").src = preview(post);
  }
  reader.showModal();
  document.body.classList.add("reader-open");
}

search.addEventListener("input", (event) => { state.query = event.target.value.trim().toLocaleLowerCase(); state.shown = 30; renderPosts(); });
memberFilter.addEventListener("change", (event) => { state.member = event.target.value; state.shown = 30; renderPosts(); });
yearFilter.addEventListener("change", (event) => { state.year = event.target.value; state.shown = 30; renderYearTabs(); renderPosts(); });
yearTabs.addEventListener("click", (event) => { const button = event.target.closest("button[data-year]"); if (!button) return; state.year = button.dataset.year; yearFilter.value = state.year; state.shown = 30; renderYearTabs(); renderPosts(); });
postsEl.addEventListener("click", (event) => { const target = event.target.closest("[data-read]"); if (target) openReader(target.dataset.read); });
loadMore.addEventListener("click", () => { state.shown += 30; renderPosts(); });
$("#closeReader").addEventListener("click", () => reader.close());
reader.addEventListener("close", () => { document.body.classList.remove("reader-open"); $("#readerFrame").src = "about:blank"; readerArticle.innerHTML = ""; state.current = null; });
reader.addEventListener("click", (event) => { if (event.target === reader) reader.close(); });

$("#postCount").textContent = POSTS.length.toLocaleString("en-US");
setupFilters();
renderPosts();
