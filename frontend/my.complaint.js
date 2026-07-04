/* ===================================================
   my.complaint.js  –  SmartCollege Complaint System
   My Submissions page (Students + Faculty)
=================================================== */

// Category → icon map
const CATEGORY_ICONS = {
    classroom:   { icon: 'fa-chalkboard',      bg: '#eff6ff', color: '#3b82f6' },
    projector:   { icon: 'fa-tv',              bg: '#fffbeb', color: '#d97706' },
    lab:         { icon: 'fa-desktop',         bg: '#f5f3ff', color: '#8b5cf6' },
    internet:    { icon: 'fa-wifi',            bg: '#ecfdf5', color: '#10b981' },
    electrical:  { icon: 'fa-bolt',            bg: '#fff1f2', color: '#f43f5e' },
    maintenance: { icon: 'fa-tools',           bg: '#f0fdfa', color: '#0d9488' },
    feedback:    { icon: 'fa-comment-dots',    bg: '#f0fdf4', color: '#16a34a' },
    others:      { icon: 'fa-ellipsis',        bg: '#faf5ff', color: '#a855f7' },
    general:     { icon: 'fa-circle-plus',     bg: '#f8fafc', color: '#475569' },
};

function getCategoryMeta(category) {
    const key = (category || '').toLowerCase().trim();
    return CATEGORY_ICONS[key] || { icon: 'fa-flag', bg: '#f1f5f9', color: '#64748b' };
}

function formatDate(dateStr) {
    if (!dateStr) return 'Unknown date';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatTimeAgo(dateStr) {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days  = Math.floor(diff / 86400000);
    if (mins < 1)   return 'Just now';
    if (mins < 60)  return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7)   return `${days}d ago`;
    return formatDate(dateStr);
}

// Build a single card element
function buildCard(c, idx) {
    let statusClass = 'pending';
    if (c.status === 'Resolved')    statusClass = 'resolved';
    if (c.status === 'In Progress') statusClass = 'in-progress';

    const meta = getCategoryMeta(c.category);
    const showProgress = statusClass === 'in-progress';

    const card = document.createElement('div');
    card.className = 'complaint-card';
    card.setAttribute('data-status', c.status || 'Pending');
    card.style.animationDelay = `${idx * 60}ms`;

    card.innerHTML = `
        <div class="card-accent ${statusClass}"></div>
        <div class="card-body">
            <div class="card-top">
                <div class="card-type-section">
                    <div class="card-type-icon"
                         style="background:${meta.bg}; color:${meta.color};">
                        <i class="fa-solid ${meta.icon}"></i>
                    </div>
                    <div class="card-type-label">${c.type || 'General Issue'}</div>
                    <div class="card-category-tag">${c.category || 'General'}</div>
                </div>
                <span class="status-badge ${statusClass}">${c.status || 'Pending'}</span>
            </div>

            <div class="card-desc">${c.description || 'No description provided.'}</div>

            <div class="progress-bar-wrap ${showProgress ? 'show' : ''}">
                <span class="progress-label">Being worked on…</span>
                <div class="progress-track">
                    <div class="progress-fill"></div>
                </div>
            </div>
        </div>

        <div class="card-footer">
            <div class="meta-item">
                <i class="fa-solid fa-location-dot"></i>
                <span>${c.room || 'Location not set'}</span>
            </div>
            <div class="meta-item">
                <i class="fa-regular fa-clock"></i>
                <span>${formatTimeAgo(c.createdAt || c.date)}</span>
            </div>
            ${(c.upvotes !== undefined) ? `
            <div class="upvote-pill">
                <i class="fa-solid fa-thumbs-up"></i>
                <span>${c.upvotes}</span>
            </div>` : ''}
        </div>
    `;

    card.style.cursor = 'pointer';
    card.onclick = () => openComplaintDetailsModal(c);
    return card;
}

// Filter logic
let allCards = [];

function filterCards(status, btn) {
    // Update active button
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const container = document.getElementById('complaintsContainer');

    // Remove previous no-results message if any
    const existing = container.querySelector('.no-results');
    if (existing) existing.remove();

    let visible = 0;
    allCards.forEach(card => {
        const cardStatus = card.getAttribute('data-status');
        const show = status === 'all' || cardStatus === status;
        card.style.display = show ? '' : 'none';
        if (show) visible++;
    });

    if (visible === 0) {
        const msg = document.createElement('div');
        msg.className = 'no-results';
        msg.innerHTML = `
            <i class="fa-regular fa-folder-open"></i>
            <span>No complaints match this filter</span>
        `;
        container.appendChild(msg);
    }
}

// ── MAIN ──────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async function () {
    const token = localStorage.getItem('token');
    let user    = localStorage.getItem('user');

    const container  = document.getElementById('complaintsContainer');
    const welcomeEl  = document.getElementById('welcomeUser');
    const navName    = document.getElementById('navUsername');
    const avatarEl   = document.getElementById('userAvatar');
    const roleChip   = document.getElementById('roleChip');
    const heroEmail  = document.getElementById('heroEmail');

    // ── Not logged in ─────────────────────────────
    if (!token || !user) {
        welcomeEl.textContent = 'Guest';
        container.innerHTML = `
            <div class="state-box">
                <div class="state-icon locked"><i class="fa-solid fa-user-lock"></i></div>
                <h3>Authentication Required</h3>
                <p class="state-desc">You must be logged in to view your submissions.</p>
                <a href="login.html" class="btn-primary">
                    <i class="fa-solid fa-right-to-bracket"></i> Login Now
                </a>
            </div>`;
        return;
    }

    // ── Parse user ────────────────────────────────
    user = JSON.parse(user);
    const isStudent = !user.role || user.role === 'student';

    // Populate header
    welcomeEl.textContent = user.name;
    navName.textContent   = user.name;
    avatarEl.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=4f46e5&color=fff&size=128&bold=true`;

    if (user.role === 'faculty') {
        roleChip.textContent = 'Faculty';
        roleChip.classList.add('faculty');
        avatarEl.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=f59e0b&color=000&size=128&bold=true`;
    }

    heroEmail.innerHTML = `<i class="fa-regular fa-envelope"></i> ${user.email} &nbsp;|&nbsp; <i class="fa-solid fa-user-tag"></i> ${(user.role || 'student').toUpperCase()}`;

    // Global back
    window.goBack = function () {
        window.location.href = user.role === 'faculty' ? 'faculty.html' : 'profile.html';
    };

    // ── Fetch complaints ──────────────────────────
    try {
        const res = await fetch('http://localhost:3000/my-complaints', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) {
            if (res.status === 401) {
                localStorage.clear();
                window.location.href = 'login.html';
                return;
            }
            throw new Error('Server error');
        }

        const data = await res.json();

        // Update stats
        const total    = data.length;
        const pending  = data.filter(c => c.status !== 'Resolved' && c.status !== 'In Progress').length;
        const progress = data.filter(c => c.status === 'In Progress').length;
        const resolved = data.filter(c => c.status === 'Resolved').length;

        document.getElementById('statTotal').textContent    = total;
        document.getElementById('statPending').textContent  = pending;
        document.getElementById('statProgress').textContent = progress;
        document.getElementById('statResolved').textContent = resolved;

        container.innerHTML = '';

        if (data.length === 0) {
            container.innerHTML = `
                <div class="state-box">
                    <div class="state-icon empty"><i class="fa-solid fa-inbox"></i></div>
                    <h3>No Submissions Yet</h3>
                    <p class="state-desc">You haven't filed any complaints or feedback. Get started below.</p>
                    <a href="complaint.html" class="btn-primary">
                        <i class="fa-solid fa-plus"></i> Submit New Complaint
                    </a>
                </div>`;
            return;
        }

        // Build and append cards with stagger
        data.forEach((c, i) => {
            const card = buildCard(c, i);
            allCards.push(card);
            container.appendChild(card);
        });

    } catch (err) {
        container.innerHTML = `
            <div class="state-box">
                <div class="state-icon error"><i class="fa-solid fa-triangle-exclamation"></i></div>
                <h3>Could Not Load Submissions</h3>
                <p class="state-desc">Make sure the backend server is running, then try refreshing.</p>
            </div>`;
    }
});

// OPEN DETAILS MODAL FOR STUDENTS
async function openComplaintDetailsModal(c) {
    const token = localStorage.getItem("token");

    let complaintData = c;

    const renderModalContent = (comp) => {
        const priorityClass = comp.priority === 'High' ? 'danger' : comp.priority === 'Low' ? 'info' : 'warning';
        
        let imageHtml = "";
        if (comp.image && comp.image !== 'null' && comp.image !== 'undefined') {
            imageHtml = `
                <div style="margin-top: 15px; text-align: left;">
                    <label style="font-size: 13px; font-weight: 700; color: #0f172a;">Attachment:</label>
                    <div style="margin-top: 6px; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0; max-height: 200px; display: flex; justify-content: center; background: #f8fafc;">
                        <img src="http://localhost:3000/uploads/${comp.image}" style="max-height: 200px; max-width: 100%; object-fit: contain;">
                    </div>
                </div>
            `;
        }

        const timelineHtml = `
            <div class="timeline-container" style="display: flex; align-items: center; justify-content: space-between; background-color: #f8fafc; padding: 16px 20px; border-radius: 12px; margin: 15px 0; border: 1px solid #e2e8f0;">
                <div class="timeline-step active" style="display: flex; flex-direction: column; align-items: center; gap: 6px; flex: 1;">
                    <div class="step-circle" style="width: 32px; height: 32px; border-radius: 50%; background-color: #4f46e5; color: white; display: flex; align-items: center; justify-content: center; font-size: 13px;"><i class="fa-solid fa-file-arrow-up"></i></div>
                    <span class="step-label" style="font-size: 11px; font-weight: 700; color: #4f46e5;">Submitted</span>
                </div>
                <div class="timeline-line ${comp.status === 'In Progress' || comp.status === 'Resolved' ? 'active' : ''}" style="height: 3px; background-color: ${comp.status === 'In Progress' || comp.status === 'Resolved' ? '#4f46e5' : '#cbd5e1'}; flex: 2; margin: 0 -10px; position: relative; top: -10px;"></div>
                <div class="timeline-step ${comp.status === 'In Progress' || comp.status === 'Resolved' ? 'active' : ''}" style="display: flex; flex-direction: column; align-items: center; gap: 6px; flex: 1;">
                    <div class="step-circle" style="width: 32px; height: 32px; border-radius: 50%; background-color: ${comp.status === 'In Progress' || comp.status === 'Resolved' ? '#4f46e5' : '#cbd5e1'}; color: white; display: flex; align-items: center; justify-content: center; font-size: 13px;"><i class="fa-solid fa-spinner"></i></div>
                    <span class="step-label" style="font-size: 11px; font-weight: 700; color: ${comp.status === 'In Progress' || comp.status === 'Resolved' ? '#4f46e5' : '#64748b'};">In Progress</span>
                </div>
                <div class="timeline-line ${comp.status === 'Resolved' ? 'active' : ''}" style="height: 3px; background-color: ${comp.status === 'Resolved' ? '#4f46e5' : '#cbd5e1'}; flex: 2; margin: 0 -10px; position: relative; top: -10px;"></div>
                <div class="timeline-step ${comp.status === 'Resolved' ? 'active' : ''}" style="display: flex; flex-direction: column; align-items: center; gap: 6px; flex: 1;">
                    <div class="step-circle" style="width: 32px; height: 32px; border-radius: 50%; background-color: ${comp.status === 'Resolved' ? '#4f46e5' : '#cbd5e1'}; color: white; display: flex; align-items: center; justify-content: center; font-size: 13px;"><i class="fa-solid fa-circle-check"></i></div>
                    <span class="step-label" style="font-size: 11px; font-weight: 700; color: ${comp.status === 'Resolved' ? '#4f46e5' : '#64748b'};">Resolved</span>
                </div>
            </div>
        `;

        let commentsListHtml = "";
        if (comp.comments && comp.comments.length > 0) {
            comp.comments.forEach(com => {
                const dateStr = new Date(com.createdAt).toLocaleString();
                commentsListHtml += `
                    <div style="background-color: #f8fafc; padding: 10px 14px; border-radius: 8px; border-left: 3px solid #cbd5e1; margin-bottom: 8px; text-align: left;">
                        <div style="display: flex; justify-content: space-between; font-size: 10px; font-weight: 700; color: #64748b; margin-bottom: 4px;">
                            <span style="color: #4f46e5;">${com.sender}</span>
                            <span>${dateStr}</span>
                        </div>
                        <div style="font-size: 13px; color: #0f172a; line-height: 1.4;">${com.text}</div>
                    </div>
                `;
            });
        } else {
            commentsListHtml = `
                <div style="text-align: center; padding: 16px; color: #64748b;">
                    <i class="fa-solid fa-comments" style="font-size: 24px; color: #cbd5e1; margin-bottom: 6px;"></i>
                    <p style="font-size: 12px;">No comments yet.</p>
                </div>
            `;
        }

        return `
            <div style="font-family: 'Outfit', sans-serif;">
                <!-- Category/Priority tags -->
                <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 8px; justify-content: flex-start;">
                    <span style="font-size: 10px; font-weight: 700; padding: 3px 10px; border-radius: 20px; text-transform: uppercase; background-color: #eff6ff; color: #4f46e5;">${comp.category || 'General'}</span>
                    <span style="font-size: 10px; font-weight: 700; padding: 3px 10px; border-radius: 20px; text-transform: uppercase; background-color: ${comp.priority === 'High' ? '#fee2e2' : comp.priority === 'Low' ? '#eff6ff' : '#fffbeb'}; color: ${comp.priority === 'High' ? '#ef4444' : comp.priority === 'Low' ? '#4f46e5' : '#d97706'};">${comp.priority || 'Medium'} Priority</span>
                </div>

                <div style="text-align: left; font-size: 14px; margin-bottom: 12px; color: #0f172a; font-weight: 500;">
                    Location: <i class="fa-solid fa-location-dot" style="color: #64748b; margin-left: 4px;"></i> <strong>${comp.room || 'Location not set'}</strong>
                </div>

                <!-- Description -->
                <div style="text-align: left; background-color: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 13.5px; color: #0f172a; margin-bottom: 15px; max-height: 120px; overflow-y: auto;">
                    <strong style="display: block; margin-bottom: 4px; font-size: 12px; color: #64748b;">Description:</strong>
                    ${comp.description || 'No description.'}
                </div>

                ${imageHtml}

                <!-- Timeline Tracker -->
                ${timelineHtml}

                <!-- Discussion Section -->
                <div style="margin-top: 15px; border-top: 1px solid #e2e8f0; padding-top: 15px;">
                    <h4 style="font-size: 13px; font-weight: 700; color: #0f172a; text-align: left; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px;">Comments Thread</h4>
                    <div id="swalCommentsContainer" style="max-height: 180px; overflow-y: auto; padding-right: 4px;">
                        ${commentsListHtml}
                    </div>
                    
                    <div style="display: flex; gap: 8px; margin-top: 12px;">
                        <input id="swalCommentInput" class="swal2-input" placeholder="Type a message or reply..." style="margin: 0; flex: 1; font-size: 13.5px; padding: 10px 14px; height: auto; box-sizing: border-box;">
                        <button type="button" onclick="postStudentComment('${comp._id}')" style="background-color: #4f46e5; color: white; border: none; padding: 10px 16px; border-radius: 12px; font-weight: 700; cursor: pointer; transition: all 0.2s;">
                            Send
                        </button>
                    </div>
                </div>

                <!-- Delete Action -->
                <div style="margin-top: 20px; border-top: 1px solid #e2e8f0; padding-top: 15px; display: flex; justify-content: flex-end;">
                    <button type="button" onclick="deleteStudentComplaint('${comp._id}')" style="background-color: #ef4444; color: white; border: none; padding: 10px 16px; border-radius: 12px; font-weight: 700; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 6px;">
                        <i class="fa-solid fa-trash-can"></i> Delete Complaint
                    </button>
                </div>
            </div>
        `;
    };

    window.activeComplaintDetails = complaintData;

    Swal.fire({
        title: `${complaintData.type || 'Complaint'} Details`,
        html: renderModalContent(complaintData),
        showCloseButton: true,
        showConfirmButton: false,
        width: '520px',
        didOpen: () => {
            const container = document.getElementById("swalCommentsContainer");
            if (container) container.scrollTop = container.scrollHeight;
        }
    });

    window.postStudentComment = async (id) => {
        const input = document.getElementById("swalCommentInput");
        const text = input.value.trim();
        if (!text) return;

        try {
            const res = await fetch(`http://localhost:3000/complaint/${id}/comment`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + token
                },
                body: JSON.stringify({ text })
            });

            if (res.ok) {
                const data = await res.json();
                
                window.activeComplaintDetails.comments = data.comments;

                const root = document.querySelector(".swal2-html-container");
                if (root) {
                    root.innerHTML = renderModalContent(window.activeComplaintDetails);
                    const container = document.getElementById("swalCommentsContainer");
                    if (container) container.scrollTop = container.scrollHeight;
                }
                
                // Reload list in background to reflect comments count or updates locally
                const reloadRes = await fetch('http://localhost:3000/my-complaints', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (reloadRes.ok) {
                    const reloadData = await reloadRes.json();
                    // Keep references matching
                    allCards = [];
                    const listContainer = document.getElementById('complaintsContainer');
                    listContainer.innerHTML = '';
                    reloadData.forEach((cItem, iItem) => {
                        const newCard = buildCard(cItem, iItem);
                        allCards.push(newCard);
                        listContainer.appendChild(newCard);
                    });
                }
            } else {
                Swal.fire({ title: 'Error', text: 'Failed to send comment', icon: 'error', confirmButtonColor: '#4f46e5' });
            }
        } catch (err) {
            console.error("Comment Error:", err);
            Swal.fire({ title: 'Error', text: 'Failed to send comment ❌', icon: 'error', confirmButtonColor: '#4f46e5' });
        }
    };

    window.deleteStudentComplaint = async (id) => {
        const confirmResult = await Swal.fire({
            title: 'Are you sure?',
            text: "Do you want to permanently delete this complaint?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Yes, delete it!'
        });

        if (!confirmResult.isConfirmed) return;

        try {
            const res = await fetch(`http://localhost:3000/delete/${id}`, {
                method: "DELETE",
                headers: { "Authorization": "Bearer " + token }
            });

            if (res.ok) {
                Swal.fire({
                    title: 'Deleted!',
                    text: 'Your complaint has been deleted successfully.',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                }).then(() => {
                    window.location.reload();
                });
            } else {
                const data = await res.json();
                Swal.fire('Error', data.error || 'Failed to delete complaint', 'error');
            }
        } catch (err) {
            console.error(err);
            Swal.fire('Error', 'Failed to delete complaint ❌', 'error');
        }
    };
}

// NOTIFICATIONS
let activeNotifications = [];

async function checkNotifications() {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
        const res = await fetch("http://localhost:3000/notifications", {
            headers: { "Authorization": "Bearer " + token }
        });
        if (res.ok) {
            const data = await res.json();
            activeNotifications = data;
            const badge = document.getElementById("notif-badge");
            if (badge) {
                if (data.length > 0) {
                    badge.style.display = "block";
                } else {
                    badge.style.display = "none";
                }
            }
        }
    } catch(err) {
        console.error("Notifications poll error:", err);
    }
}

// Check every 10 seconds
setInterval(checkNotifications, 10000);
// Initial check
checkNotifications();

async function showNotificationsFeed() {
    const token = localStorage.getItem("token");
    if (activeNotifications.length === 0) {
        Swal.fire({
            title: 'Notifications',
            text: 'You have no unread notifications.',
            icon: 'info',
            confirmButtonColor: '#4f46e5'
        });
        return;
    }

    let notifListHtml = "";
    activeNotifications.forEach(n => {
        const dateStr = new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        notifListHtml += `
            <div style="text-align: left; padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #0f172a;">
                <div style="font-weight: 500;">${n.text}</div>
                <div style="font-size: 10px; color: #64748b; margin-top: 4px;">${dateStr}</div>
            </div>
        `;
    });

    await Swal.fire({
        title: 'Unread Notifications 🔔',
        html: `
            <div style="max-height: 200px; overflow-y: auto; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 10px;">
                ${notifListHtml}
            </div>
        `,
        confirmButtonColor: '#4f46e5',
        confirmButtonText: 'Mark all as read',
        showCancelButton: true,
        cancelButtonText: 'Close',
        cancelButtonColor: '#64748b'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const markRes = await fetch("http://localhost:3000/notifications/read-all", {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Bearer " + token
                    }
                });
                if (markRes.ok) {
                    activeNotifications = [];
                    const badge = document.getElementById("notif-badge");
                    if (badge) badge.style.display = "none";
                    Swal.fire({ title: 'Read!', text: 'All notifications cleared.', icon: 'success', timer: 1200, showConfirmButton: false });
                }
            } catch (err) {
                console.error(err);
            }
        }
    });
}