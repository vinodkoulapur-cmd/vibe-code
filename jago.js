/* ===== 1. DATA (all content lives here) ===== */
const SUBJECTS = ["C Programming", "Python", "C++ / OOP", "Maths", "Other"]; /* CHANGE HERE: subjects */
const QUOTES = ["Small steps beat big plans.", "Done is better than perfect.", "One focused hour today = less panic tomorrow."];
const PRIORITY_RANK = { High: 0, Medium: 1, Low: 2 };
const iso = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.toLocaleDateString("en-CA"); };
const SAMPLE = [
  { id: 1, title: "Solve 10 pointer problems", subject: "C Programming", due: iso(1), priority: "High", done: false },
  { id: 2, title: "Python lists & dicts notes", subject: "Python", due: iso(3), priority: "Medium", done: false },
  { id: 3, title: "OOP inheritance revision", subject: "C++ / OOP", due: iso(-1), priority: "High", done: false },
  { id: 4, title: "Lab record submission", subject: "Other", due: iso(5), priority: "Low", done: true }
];

let tasks = JSON.parse(localStorage.getItem("tasks")) || SAMPLE;
let streak = JSON.parse(localStorage.getItem("streak")) || { count: 0, last: "" };
let view = { status: "all", search: "", sort: "due" };
const $ = id => document.getElementById(id);

/* ===== 2. HELPERS ===== */
const save = () => { localStorage.setItem("tasks", JSON.stringify(tasks)); localStorage.setItem("streak", JSON.stringify(streak)); };
const esc = s => s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const showError = msg => { $("err").textContent = msg; };
function toast(msg) {
  const t = $("toast"); t.textContent = msg; t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2200);
}

/* ===== 3. FEATURES (one function each) ===== */
function addTask(e) {                                   // Feature: add + validation
  e.preventDefault();
  const title = $("title").value.trim(), due = $("due").value;
  if (title.length < 3) return showError("Task name needs at least 3 characters.");
  if (!due) return showError("Please pick a due date.");
  tasks.unshift({ id: Date.now(), title, subject: $("subject").value, due, priority: $("priority").value, done: false });
  showError(""); e.target.reset(); save(); render(); toast("Task added ✅");
}

function toggleTask(id) {                               // Feature: complete / undo
  const t = tasks.find(x => x.id === id);
  t.done = !t.done;
  if (t.done) updateStreak();
  save(); render(); toast(t.done ? "Nice! Task completed 🎉" : "Moved back to pending");
}

function deleteTask(id) {                               // Feature: delete
  tasks = tasks.filter(t => t.id !== id);
  save(); render(); toast("Task deleted");
}

function updateStreak() {                               // Creative: streak counter
  const today = iso(0);
  if (streak.last === today) return;
  streak.count = streak.last === iso(-1) ? streak.count + 1 : 1;
  streak.last = today;
}

function updateStats() {                                // Creative: progress ring + Focus Pick
  const total = tasks.length, done = tasks.filter(t => t.done).length;
  const pct = total ? Math.round(done / total * 100) : 0;
  $("total").textContent = total;
  $("doneCount").textContent = done;
  $("streak").textContent = (streak.last >= iso(-1) ? streak.count : 0) + " 🔥";
  $("ring").style.setProperty("--p", pct + "%");
  $("ringText").textContent = pct + "%";
  const next = tasks.filter(t => !t.done)
    .sort((a, b) => a.due.localeCompare(b.due) || PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority])[0];
  $("focus").textContent = next
    ? `🎯 Focus pick: ${next.title} (${next.due < iso(0) ? "overdue!" : "due " + next.due})`
    : "🎉 All clear! Add a new goal.";
}

function render() {                                     // Feature: list + filter + search + sort
  const list = tasks
    .filter(t => (view.status === "all" || (view.status === "done") === t.done) && t.title.toLowerCase().includes(view.search))
    .sort((a, b) => view.sort === "due" ? a.due.localeCompare(b.due) : PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]);
  $("list").innerHTML = list.map(t => `
    <li class="task ${t.done ? "done" : ""} ${!t.done && t.due < iso(0) ? "overdue" : ""}">
      <input type="checkbox" data-id="${t.id}" ${t.done ? "checked" : ""} aria-label="Mark ${esc(t.title)} as done">
      <div class="info"><strong>${esc(t.title)}</strong><small>${esc(t.subject)} · Due ${t.due}</small></div>
      <span class="badge ${t.priority}">${t.priority}</span>
      <button class="icon-btn" data-del="${t.id}" aria-label="Delete ${esc(t.title)}">🗑️</button>
    </li>`).join("");
  $("empty").hidden = list.length > 0;
  updateStats();
}

function setTheme(mode) {                               // Feature: dark mode (saved)
  document.documentElement.dataset.theme = mode;
  localStorage.setItem("theme", mode);
  $("themeBtn").textContent = mode === "dark" ? "☀️" : "🌙";
}

/* ===== 4. INIT ===== */
function init() {
  $("subject").innerHTML = SUBJECTS.map(s => `<option>${s}</option>`).join("");
  $("quote").textContent = QUOTES[new Date().getDate() % QUOTES.length];
  setTheme(localStorage.getItem("theme") || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));

  $("taskForm").addEventListener("submit", addTask);
  $("themeBtn").onclick = () => setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
  $("search").oninput = e => { view.search = e.target.value.toLowerCase(); render(); };
  $("sort").onchange = e => { view.sort = e.target.value; render(); };
  document.querySelectorAll(".tab").forEach(b => b.onclick = () => {
    document.querySelectorAll(".tab").forEach(x => x.classList.remove("active"));
    b.classList.add("active"); view.status = b.dataset.status; render();
  });
  $("list").addEventListener("click", e => {
    if (e.target.dataset.id) toggleTask(+e.target.dataset.id);
    if (e.target.dataset.del) deleteTask(+e.target.dataset.del);
  });

  $("list").innerHTML = '<li class="loading">Loading your plan…</li>';   // loading state
  setTimeout(render, 400);
}
init();