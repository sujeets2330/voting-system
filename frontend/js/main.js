const API = "http://localhost:3000";
const token = localStorage.getItem("token");
const path = window.location.pathname;

// LOGOUT 
function logout() {
  localStorage.clear();
  window.location.href = "/";
}

// SIGNUP  
document.getElementById("signupForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const payload = {
    name: name.value.trim(),
    age: Number(age.value),
    address: address.value.trim(),
    aadharCardNumber: aadhar.value.trim(),
    password: password.value
  };

  if (!payload.name || !payload.age || !payload.address || !payload.aadharCardNumber || !payload.password) {
    return alert("All fields are required");
  }

  if (!/^\d{12}$/.test(payload.aadharCardNumber)) {
    return alert("Aadhar must be exactly 12 digits");
  }

  const res = await fetch(`${API}/user/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (!res.ok) return alert(data.error || "Signup failed");

  alert("Signup successful. Please login.");
  window.location.href = "/user-login";
});

// LOGIN (USER + ADMIN)  
document.getElementById("userLoginForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const res = await fetch(`${API}/user/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      aadharCardNumber: aadhar.value.trim(),
      password: password.value
    })
  });

  const data = await res.json();
  if (!res.ok) return alert(data.error || "Login failed");

  localStorage.setItem("token", data.token);

  // ROLE BASED REDIRECT
  if (data.role === "admin") {
    window.location.href = "/admin-dashboard";
  } else {
    window.location.href = "/user-dashboard";
  }
});

// USER DASHBOARD  
async function loadCandidatesForUser() {
  const container = document.getElementById("candidateList");
  if (!container) return;

  container.innerHTML = "";

  const res = await fetch(`${API}/candidate`);
  const candidates = await res.json();

  candidates.forEach(c => {
    container.innerHTML += `
      <div class="row">
        <b>${c.name}</b> (${c.party})
        <button onclick="vote('${c._id}', this)">Vote</button>
      </div>
    `;
  });
}

async function vote(candidateId, btn) {
  if (!token) return alert("Login required");

  const res = await fetch(`${API}/candidate/vote/${candidateId}`, {
    headers: { Authorization: "Bearer " + token }
  });

  const data = await res.json();
  if (!res.ok) return alert(data.message || "Voting failed");

  btn.disabled = true;
  btn.innerText = "Voted";
  alert("Vote recorded");

  loadVoteResults();
}

// LIVE VOTE RESULTS (USER + ADMIN) 
async function loadVoteResults() {
  const div = document.getElementById("results");
  if (!div) return;

  div.innerHTML = "";

  const res = await fetch(`${API}/candidate/vote/count`);
  if (!res.ok) return div.innerHTML = "<p>No results yet</p>";

  const data = await res.json();
  data.forEach(r => {
    div.innerHTML += `<p>${r.party}: ${r.count}</p>`;
  });
}

//  ADMIN DASHBOARD  
async function loadAdminStats() {
  const totalEl = document.getElementById("totalUsers");
  const votedEl = document.getElementById("votedUsers");
  if (!totalEl || !votedEl) return;

  const res = await fetch(`${API}/user/admin/stats`, {
    headers: { Authorization: "Bearer " + token }
  });

  const data = await res.json();
  if (!res.ok) return;

  totalEl.innerText = data.totalUsers;
  votedEl.innerText = data.votedUsers;
}

async function loadAdminCandidates() {
  const container = document.getElementById("adminCandidates");
  if (!container) return;

  container.innerHTML = "";

  const res = await fetch(`${API}/candidate`);
  const candidates = await res.json();

  candidates.forEach(c => {
    container.innerHTML += `
      <div class="row">
        <input id="name-${c._id}" value="${c.name}">
        <input id="party-${c._id}" value="${c.party}">
        <input id="age-${c._id}" type="number" value="${c.age}">
        <button onclick="updateCandidate('${c._id}')">Update</button>
        <button onclick="deleteCandidate('${c._id}')">Delete</button>
      </div>
    `;
  });
}

async function updateCandidate(id) {
  await fetch(`${API}/candidate/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token
    },
    body: JSON.stringify({
      name: document.getElementById(`name-${id}`).value,
      party: document.getElementById(`party-${id}`).value,
      age: document.getElementById(`age-${id}`).value
    })
  });

  alert("Candidate updated");
}

async function deleteCandidate(id) {
  await fetch(`${API}/candidate/${id}`, {
    method: "DELETE",
    headers: { Authorization: "Bearer " + token }
  });

  alert("Candidate deleted");
  loadAdminCandidates();
}

// ADD CANDIDATE  
document.getElementById("addCandidateForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const payload = {
    name: cname.value.trim(),
    party: party.value.trim(),
    age: Number(age.value)
  };

  const res = await fetch(`${API}/candidate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) return alert("Failed to add candidate");

  alert("Candidate added");
  loadAdminCandidates();
  loadVoteResults();
});

// PAGE INIT  
if (path.includes("user-dashboard")) {
  loadCandidatesForUser();
  loadVoteResults();
}

if (path.includes("admin-dashboard")) {
  loadAdminCandidates();
  loadVoteResults();
  loadAdminStats();
}
