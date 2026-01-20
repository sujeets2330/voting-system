const API = "http://localhost:3000";
const token = localStorage.getItem("token");
const path = window.location.pathname;

//   LOGOUT  
function logout() {
  localStorage.clear();
  window.location.href = "/";
}

//   USER SIGNUP  
document.getElementById("signupForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const payload = {
    name: document.getElementById("name").value.trim(),
    age: Number(document.getElementById("age").value),
    address: document.getElementById("address").value.trim(),
    aadharCardNumber: document.getElementById("aadhar").value.trim(),
    password: document.getElementById("password").value
  };

  if (!payload.name || !payload.age || !payload.address || !payload.aadharCardNumber || !payload.password) {
    alert("All fields are required");
    return;
  }

  if (!/^\d{12}$/.test(payload.aadharCardNumber)) {
    alert("Aadhar must be exactly 12 digits");
    return;
  }

  const res = await fetch(`${API}/user/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (!res.ok) {
    alert(data.error || "Signup failed");
    return;
  }

  alert("Signup successful. Please login.");
  window.location.href = "/user-login";
});

//   LOGIN (USER + ADMIN SAME FORM)  
document.getElementById("userLoginForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const res = await fetch(`${API}/user/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      aadharCardNumber: document.getElementById("aadhar").value.trim(),
      password: document.getElementById("password").value
    })
  });

  const data = await res.json();
  if (!res.ok) {
    alert(data.error || "Login failed");
    return;
  }

  localStorage.setItem("token", data.token);

  //  ROLE BASED REDIRECT
  if (data.role === "admin") {
    window.location.href = "/admin-dashboard";
  } else {
    window.location.href = "/user-dashboard";
  }
});

//   USER DASHBOARD  
async function loadCandidatesForUser() {
  const div = document.getElementById("candidateList");
  if (!div) return;

  div.innerHTML = "";

  const res = await fetch(`${API}/candidate`);
  const candidates = await res.json();

  candidates.forEach(c => {
    div.innerHTML += `
      <p>
        <b>${c.name}</b> (${c.party})
        <button onclick="vote('${c._id}', this)">Vote</button>
      </p>
    `;
  });
}

async function vote(candidateId, btn) {
  if (!token) {
    alert("Login required");
    return;
  }

  const res = await fetch(`${API}/candidate/vote/${candidateId}`, {
    headers: { Authorization: "Bearer " + token }
  });

  const data = await res.json();
  if (!res.ok) {
    alert(data.message || "Voting failed");
    return;
  }

  btn.disabled = true;
  btn.innerText = "Voted";
  alert("Vote recorded successfully");

  loadVoteResults(); 
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
  const div = document.getElementById("adminCandidates");
  if (!div) return;

  div.innerHTML = "";

  const res = await fetch(`${API}/candidate`);
  const candidates = await res.json();

  candidates.forEach(c => {
    div.innerHTML += `<p>${c.name} (${c.party})</p>`;
  });
}

//  LIVE VOTE RESULTS (USER + ADMIN) 
async function loadVoteResults() {
  const div = document.getElementById("results");
  if (!div) return;

  div.innerHTML = "";

  const res = await fetch(`${API}/candidate/vote/count`);
  if (!res.ok) {
    div.innerHTML = "<p>Unable to load vote results</p>";
    return;
  }

  const data = await res.json();
  data.forEach(r => {
    div.innerHTML += `<p>${r.party}: ${r.count}</p>`;
  });
}

//  ADD CANDIDATE (ADMIN) 
document.getElementById("addCandidateForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!token) {
    alert("Unauthorized");
    return;
  }

  const payload = {
    name: document.getElementById("cname").value.trim(),
    party: document.getElementById("party").value.trim(),
    age: Number(document.getElementById("age").value)
  };

  const res = await fetch(`${API}/candidate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token
    },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (!res.ok) {
    alert(data.message || "Failed to add candidate");
    return;
  }

  alert("Candidate added successfully");
  loadAdminCandidates();
  loadVoteResults();
});

//  PAGE INIT 
if (path.includes("user-dashboard")) {
  loadCandidatesForUser();
  loadVoteResults(); 
}

if (path.includes("admin-dashboard")) {
  loadAdminCandidates();
  loadVoteResults();
  loadAdminStats();
}
