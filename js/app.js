/* ===== Hostel Complaint Management - shared JavaScript =====
   Data is saved in the browser's localStorage, so no server or database is needed.
   (Data stays in the same browser. Clearing browser data will erase it.)
*/

var STATUSES = ["Pending", "In Progress", "Resolved"];
var CATEGORIES = ["Electrical", "Plumbing", "Furniture", "Cleaning", "Internet / Wi-Fi", "Other"];

/* ---------- Storage helpers ---------- */
function loadData(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch (e) {
    return [];
  }
}
function saveData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}
function getResidents() { return loadData("hcm_residents"); }
function saveResidents(list) { saveData("hcm_residents", list); }
function getComplaints() { return loadData("hcm_complaints"); }
function saveComplaints(list) { saveData("hcm_complaints", list); }

function newId(prefix) {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

/* ---------- Small utilities ---------- */
function esc(text) {            // stops HTML injection when printing user text
  var div = document.createElement("div");
  div.textContent = text == null ? "" : String(text);
  return div.innerHTML;
}
function formatDate(iso) {
  var d = new Date(iso);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) +
         ", " + d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}
function badge(status) {
  return '<span class="badge ' + status.replace(" ", "-") + '">' + esc(status) + "</span>";
}
function showToast(message) {
  var t = document.getElementById("toast");
  if (!t) {
    t = document.createElement("div");
    t.id = "toast";
    t.className = "toast";
    document.body.appendChild(t);
  }
  t.textContent = message;
  t.classList.add("show");
  setTimeout(function () { t.classList.remove("show"); }, 2200);
}
function fillSelect(selectEl, options, firstLabel) {
  var html = firstLabel ? '<option value="">' + firstLabel + "</option>" : "";
  options.forEach(function (o) { html += '<option value="' + esc(o) + '">' + esc(o) + "</option>"; });
  selectEl.innerHTML = html;
}

/* ---------- Status order rule ----------
   Pending -> In Progress -> Resolved (no skipping, no going back).
   Returns the only status allowed next, or null if already Resolved. */
function nextStatus(current) {
  var i = STATUSES.indexOf(current);
  return i >= 0 && i < STATUSES.length - 1 ? STATUSES[i + 1] : null;
}

/* Changes a complaint's status. Returns {ok:true} or {ok:false, message} */
function changeStatus(complaintId, newStatus) {
  var list = getComplaints();
  var c = list.find(function (x) { return x.id === complaintId; });
  if (!c) return { ok: false, message: "Complaint not found." };
  if (nextStatus(c.status) !== newStatus) {
    return {
      ok: false,
      message: c.status === "Resolved"
        ? "This complaint is already Resolved."
        : 'A "' + c.status + '" complaint can only move to "' + nextStatus(c.status) + '".'
    };
  }
  var now = new Date().toISOString();
  c.status = newStatus;
  c.updatedAt = now;
  c.history.push({ status: newStatus, at: now });
  saveComplaints(list);
  return { ok: true };
}

/* ---------- Navigation bar (same on every page) ---------- */
function renderNav(activePage) {
  var pages = [
    ["index.html", "Home"],
    ["residents.html", "Residents"],
    ["new-complaint.html", "New Complaint"],
    ["track.html", "Track Complaints"],
    ["staff.html", "Staff Panel"]
  ];
  var links = pages.map(function (p) {
    return '<li><a href="' + p[0] + '"' + (p[0] === activePage ? ' class="active"' : "") + ">" + p[1] + "</a></li>";
  }).join("");
  var nav = document.createElement("nav");
  nav.className = "navbar";
  nav.innerHTML = '<div class="brand">🏠 Hostel Complaints</div><ul>' + links + "</ul>";
  document.body.insertBefore(nav, document.body.firstChild);
}

/* ---------- Sample data (only added the first time) ---------- */
function addSampleDataOnce() {
  if (localStorage.getItem("hcm_seeded")) return;
  var r1 = { id: newId("r"), name: "Ravi Kumar", room: "A-101", phone: "9876543210", email: "ravi@example.com" };
  var r2 = { id: newId("r"), name: "Sneha Reddy", room: "B-204", phone: "9123456780", email: "sneha@example.com" };
  var r3 = { id: newId("r"), name: "Arjun Varma", room: "C-307", phone: "9988776655", email: "arjun@example.com" };
  saveResidents([r1, r2, r3]);

  function mk(res, cat, desc, steps, daysAgo) {
    var created = new Date(Date.now() - daysAgo * 86400000).toISOString();
    var history = [{ status: "Pending", at: created }];
    for (var i = 1; i < steps.length; i++) history.push({ status: steps[i], at: new Date().toISOString() });
    return {
      id: newId("c"), residentId: res.id, residentName: res.name, room: res.room,
      category: cat, description: desc, status: steps[steps.length - 1],
      createdAt: created, updatedAt: history[history.length - 1].at, history: history
    };
  }
  saveComplaints([
    mk(r1, "Electrical", "Ceiling fan is making a loud noise and runs very slowly.", ["Pending"], 3),
    mk(r2, "Plumbing", "Water tap in the bathroom is leaking continuously.", ["Pending", "In Progress"], 2),
    mk(r3, "Internet / Wi-Fi", "Wi-Fi is not working on the 3rd floor since morning.", ["Pending", "In Progress", "Resolved"], 5)
  ]);
  localStorage.setItem("hcm_seeded", "1");
}
addSampleDataOnce();
