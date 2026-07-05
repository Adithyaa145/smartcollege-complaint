const API_BASE = (() => {
    const proto = window.location.protocol;
    const host = window.location.hostname;
    const port = window.location.port;

    if (proto === 'file:') {
        return 'https://smartcollege-complaint.onrender.com';
    }
    if ((host === 'localhost' || host === '127.0.0.1') && port !== '3000') {
        return 'http://localhost:3000';
    }
    return '';
})();
document.addEventListener("DOMContentLoaded", async function () {
    const token = localStorage.getItem("token");
    let user = localStorage.getItem("user");
    
    const container = document.getElementById("classComplaintsContainer");
    const branchDisplay = document.getElementById("branchDisplay");
    const navUsername  = document.getElementById("navUsername");
    const roleDisplay  = document.getElementById("userRoleDisplay");

    if (!token || !user) {
        if (branchDisplay) branchDisplay.innerText = "Unknown";
        container.innerHTML = `
            <div class="state-box">
                <div class="state-icon locked"><i class="fa-solid fa-user-lock"></i></div>
                <h3>Authentication Required</h3>
                <p class="state-desc">You must be logged in to view class complaints.</p>
                <a href="index.html" class="btn-primary"><i class="fa-solid fa-right-to-bracket"></i> Login Now</a>
            </div>
        `;
        return;
    }

    user = JSON.parse(user);
    const studentName = user.name;

    // Populate navbar + hero
    if (navUsername)  navUsername.textContent  = studentName;
    if (branchDisplay) branchDisplay.textContent = user.branch || "CSE";
    if (roleDisplay) {
        roleDisplay.textContent = (user.role || 'student').toUpperCase();
        if (user.role === 'faculty') roleDisplay.style.background = 'rgba(245,158,11,0.18)';
    }

    window.goBack = function() {
        if(user.role === 'faculty') window.location.href = 'faculty.html';
        else window.location.href = 'profile.html';
    };

    try {
        const res = await fetch(API_BASE + `/class-complaints`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        
        if (!res.ok) {
            throw new Error("Failed to fetch");
        }
        
        const data = await res.json();

        container.innerHTML = ""; // Clear loading state

        if (data.length === 0) {
            container.innerHTML = `
                <div class="state-box">
                    <div class="state-icon empty"><i class="fa-solid fa-inbox"></i></div>
                    <h3>No Open Issues Found</h3>
                    <p class="state-desc">There are no pending complaints for your class right now.</p>
                </div>
            `;
            return;
        }

        data.forEach((c, idx) => {
            const hasVoted   = c.votedBy && c.votedBy.includes(user.email);
            const isMine     = c.email === user.email;
            const disableVote = hasVoted || isMine;

            const card = document.createElement("div");
            card.className = "complaint-card";
            card.style.animationDelay = `${idx * 60}ms`;

            card.innerHTML = `
                <div class="card-accent pending"></div>
                <div class="card-body">
                    <div class="card-top">
                        <div class="card-type-section">
                            <div class="card-type-icon" style="background:#eff6ff;color:#3b82f6;">
                                <i class="fa-solid fa-flag"></i>
                            </div>
                            <div class="card-type-label">${c.type || "General Issue"}</div>
                            <div class="card-category-tag">${c.category || "General"}</div>
                            <span class="submitter-tag"><i class="fa-solid fa-user"></i> ${isMine ? "You" : (c.student_name || "Anonymous")}</span>
                        </div>
                        <button
                            onclick="upvoteComplaint('${c._id}')"
                            ${disableVote ? 'disabled' : ''}
                            class="upvote-btn ${hasVoted ? 'active' : 'inactive'}">
                            <i class="fa-solid fa-circle-up"></i>
                            ${hasVoted ? 'Upvoted' : 'Upvote'} (${c.upvotes || 0})
                        </button>
                    </div>
                    <div class="card-desc">${c.description || 'No description.'}</div>
                </div>
                <div class="card-footer">
                    <div class="meta-item">
                        <i class="fa-solid fa-location-dot"></i>
                        <span>${c.room || "Location Unknown"}</span>
                    </div>
                </div>
            `;

            container.appendChild(card);
        });

    } catch (err) {
        container.innerHTML = `
            <div class="state-box">
                <div class="state-icon error"><i class="fa-solid fa-triangle-exclamation"></i></div>
                <h3>Could Not Load</h3>
                <p class="state-desc">Could not connect to the server. Make sure the backend is running.</p>
            </div>
        `;
    }
});

async function upvoteComplaint(id) {
    const token = localStorage.getItem("token");
    try {
        const res = await fetch(API_BASE + `/complaint/${id}/vote`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        
        const data = await res.json();
        
        if(res.ok) {
            Swal.fire({
                title: 'Success!',
                text: 'Your vote has boosted the priority of this issue.',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            }).then(() => {
                location.reload();
            });
        } else {
            Swal.fire('Notice', data.error || 'Failed to submit vote', 'info');
        }
    } catch (err) {
        Swal.fire('Error', 'Server connection lost', 'error');
    }
}
