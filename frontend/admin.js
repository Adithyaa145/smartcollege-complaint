const API_BASE = window.location.protocol === 'file:' ? 'https://smartcollege-complaint.onrender.com' : '';
const token = localStorage.getItem("token");
if (!token) window.location.href = "index.html";

let allComplaints = [];
let currentRoleFilter = 'all';
let currentStatusFilter = 'all';
let currentTypeFilter = 'all';
let searchQuery = '';

// Quick Filter from Sidebar or Stats Card
function setQuickFilter(status) {
    currentStatusFilter = status === 'all' ? 'all' : (status === 'pending' ? 'Pending' : (status === 'in-progress' ? 'In Progress' : 'Resolved'));
    
    // Update active state in sidebar quick filters
    document.querySelectorAll('.nav-filter-btn:not(.type-section-btn)').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById('qf-' + status);
    if (activeBtn) activeBtn.classList.add('active');

    // Update active status filter buttons
    updateStatusFilterButtons();

    renderComplaints();
}

function setRoleFilter(role) {
    currentRoleFilter = role;
    
    // Update active state in role pills
    document.querySelectorAll('.filter-pill').forEach(btn => {
        if (btn.id === 'btn-all' || btn.id === 'btn-student' || btn.id === 'btn-faculty') {
            btn.classList.remove('active');
        }
    });
    const activeBtn = document.getElementById('btn-' + role);
    if (activeBtn) activeBtn.classList.add('active');

    renderComplaints();
}

function setStatusFilter(status) {
    currentStatusFilter = status;

    // Update sidebar quick filter active state
    document.querySelectorAll('.nav-filter-btn:not(.type-section-btn)').forEach(btn => btn.classList.remove('active'));
    const sidebarStatus = status === 'all' ? 'all' : (status === 'Pending' ? 'pending' : (status === 'In Progress' ? 'in-progress' : 'resolved'));
    const sidebarBtn = document.getElementById('qf-' + sidebarStatus);
    if (sidebarBtn) sidebarBtn.classList.add('active');

    updateStatusFilterButtons();
    renderComplaints();
}

function updateStatusFilterButtons() {
    document.querySelectorAll('.filter-pill').forEach(btn => {
        if (btn.id.startsWith('btn-status-')) {
            btn.classList.remove('active');
        }
    });
    const statusMap = {
        'all': 'btn-status-all',
        'Pending': 'btn-status-pending',
        'In Progress': 'btn-status-inprogress',
        'Resolved': 'btn-status-resolved'
    };
    const activeBtn = document.getElementById(statusMap[currentStatusFilter]);
    if (activeBtn) activeBtn.classList.add('active');
}

function setTypeSection(type) {
    currentTypeFilter = type;
    
    // Update active class on section buttons
    document.querySelectorAll('.type-section-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById('ts-' + type);
    if (activeBtn) activeBtn.classList.add('active');

    // Update topbar header dynamic title
    const headerTitle = document.querySelector('.welcome-message h1');
    const headerSub = document.querySelector('.welcome-message p');
    if (headerTitle) {
        if (type === 'all') {
            headerTitle.innerText = "Overview";
            headerSub.innerText = "Track, manage, and resolve campus-wide complaints";
        } else {
            const formattedName = type.charAt(0).toUpperCase() + type.slice(1);
            headerTitle.innerText = formattedName + " Section";
            headerSub.innerText = `Track and resolve complaints specific to ${type}`;
        }
    }

    updateStats();
    renderComplaints();
}

function updateStats() {
    // Filter complaints by type section
    const typeFiltered = allComplaints.filter(c => {
        if (currentTypeFilter === 'all') return true;
        const cType = (c.type || 'general').toLowerCase();
        if (currentTypeFilter === 'general') {
            return cType === 'general' || cType === 'others' || cType === 'submit';
        }
        return cType === currentTypeFilter;
    });

    document.getElementById("total").innerText = typeFiltered.length;
    document.getElementById("pending").innerText =
        typeFiltered.filter(c => c.status === "Pending").length;
    document.getElementById("progress").innerText =
        typeFiltered.filter(c => c.status === "In Progress").length;
    document.getElementById("resolved").innerText =
        typeFiltered.filter(c => c.status === "Resolved").length;
}

function handleSearch() {
    searchQuery = document.getElementById("searchInput").value.toLowerCase();
    renderComplaints();
}

function renderComplaints() {
    const list = document.getElementById("complaintList");
    list.innerHTML = "";

    const filtered = allComplaints.filter(c => {
        // Section type filter
        if (currentTypeFilter !== 'all') {
            const cType = (c.type || 'general').toLowerCase();
            if (currentTypeFilter === 'general') {
                if (cType !== 'general' && cType !== 'others' && cType !== 'submit') return false;
            } else {
                if (cType !== currentTypeFilter) return false;
            }
        }

        // Role filter
        const role = c.role || 'student';
        if (currentRoleFilter !== 'all' && role !== currentRoleFilter) return false;

        // Status filter
        if (currentStatusFilter !== 'all' && c.status !== currentStatusFilter) return false;

        // Search query
        if (searchQuery) {
            const name = (c.student_name || '').toLowerCase();
            const type = (c.type || '').toLowerCase();
            const desc = (c.description || '').toLowerCase();
            const room = (c.room || '').toLowerCase();
            const category = (c.category || '').toLowerCase();
            const email = (c.email || '').toLowerCase();
            if (!name.includes(searchQuery) && 
                !type.includes(searchQuery) && 
                !desc.includes(searchQuery) && 
                !room.includes(searchQuery) &&
                !category.includes(searchQuery) &&
                !email.includes(searchQuery)) {
                return false;
            }
        }

        return true;
    });

    document.getElementById("list-count").innerText = filtered.length;
    
    // Update List Title Text based on filters
    let listTitle = "Complaints";
    if (currentRoleFilter !== 'all') {
        listTitle = (currentRoleFilter === 'student' ? 'Student' : 'Faculty') + " " + listTitle;
    }
    if (currentStatusFilter !== 'all') {
        listTitle = currentStatusFilter + " " + listTitle;
    } else {
        listTitle = "All " + listTitle;
    }
    document.getElementById("list-title-text").innerText = listTitle;

    if (filtered.length === 0) {
        list.innerHTML = `
            <div class="empty-list-state">
                <i class="fa-solid fa-magnifying-glass"></i>
                <p>No complaints match the current filters.</p>
            </div>
        `;
        document.getElementById("details").innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-inbox"></i>
                <h3>No Complaints Displayed</h3>
                <p>Try modifying your search or filter terms to find records.</p>
            </div>
        `;
        return;
    }

    // Type Metadata for grouping
    const typeMeta = {
      classroom: { name: "Classroom Complaints", icon: "fa-school", color: "#4f46e5" },
      hostel: { name: "Hostel Complaints", icon: "fa-hotel", color: "#f59e0b" },
      labs: { name: "Lab Complaints", icon: "fa-flask", color: "#10b981" },
      transport: { name: "Transport Complaints", icon: "fa-bus", color: "#3b82f6" },
      fees: { name: "Fees Complaints", icon: "fa-credit-card", color: "#ec4899" },
      projector: { name: "Projector Issues", icon: "fa-video", color: "#8b5cf6" },
      internet: { name: "Internet Issues", icon: "fa-wifi", color: "#06b6d4" },
      electrical: { name: "Electrical Issues", icon: "fa-bolt", color: "#eab308" },
      maintenance: { name: "Maintenance Issues", icon: "fa-wrench", color: "#f97316" },
      feedback: { name: "Feedbacks", icon: "fa-comments", color: "#14b8a6" },
      general: { name: "General Complaints", icon: "fa-folder-open", color: "#6b7280" },
      others: { name: "Other Complaints", icon: "fa-circle-question", color: "#64748b" }
    };

    // Grouping by type
    const grouped = {};
    filtered.forEach(c => {
        const typeKey = (c.type || 'general').toLowerCase();
        if (!grouped[typeKey]) {
            grouped[typeKey] = [];
        }
        grouped[typeKey].push(c);
    });

    // Consistent ordering of groups
    const typeOrder = ['classroom', 'hostel', 'labs', 'transport', 'fees', 'projector', 'internet', 'electrical', 'maintenance', 'feedback', 'general', 'others'];
    const keys = Object.keys(grouped).sort((a, b) => {
        let indexA = typeOrder.indexOf(a);
        let indexB = typeOrder.indexOf(b);
        if (indexA === -1) indexA = 999;
        if (indexB === -1) indexB = 999;
        return indexA - indexB;
    });

    let firstItemSet = false;

    keys.forEach(typeKey => {
        const groupContainer = document.createElement("div");
        groupContainer.className = "complaint-group";

        const meta = typeMeta[typeKey] || { 
            name: typeKey.charAt(0).toUpperCase() + typeKey.slice(1) + " Complaints", 
            icon: "fa-flag", 
            color: "#4f46e5" 
        };

        const header = document.createElement("div");
        header.className = "complaint-group-header";
        header.style.borderLeftColor = meta.color;
        header.innerHTML = `
            <span><i class="fa-solid ${meta.icon}" style="color: ${meta.color}; margin-right: 8px;"></i> ${meta.name}</span>
            <span class="group-count-badge">${grouped[typeKey].length}</span>
        `;
        groupContainer.appendChild(header);

        const groupList = document.createElement("ul");
        groupList.className = "complaint-group-list";

        grouped[typeKey].forEach(c => {
            const li = document.createElement("li");
            li.className = "complaint-item-card";

            let roleBadge = "";
            if (c.role === "faculty") {
                roleBadge = `<span class="item-role-badge faculty">FACULTY</span>`;
            } else {
                roleBadge = `<span class="item-role-badge student">STUDENT</span>`;
            }

            let upvoteBadge = "";
            if (c.upvotes && c.upvotes > 0) {
                upvoteBadge = `<span class="item-vote-badge"><i class="fa-solid fa-arrow-up"></i> ${c.upvotes}</span>`;
            }

            let statusClass = c.status === 'Resolved' ? 'success' : c.status === 'Pending' ? 'warning' : 'info';
            let statusBadge = `<span class="item-status-dot ${statusClass}">${c.status}</span>`;

            // Past complaints history badge
            let historyBadge = "";
            if (c.pastComplaintsCount && c.pastComplaintsCount > 0) {
                historyBadge = `<span class="item-history-badge" title="${c.pastComplaintsCount} past complaints submitted"><i class="fa-solid fa-clock-rotate-left"></i> ${c.pastComplaintsCount} past</span>`;
            }

            li.innerHTML = `
                <div class="item-card-header">
                    <div class="item-title-section">
                        <span class="item-category">${c.category || 'General'}</span>
                    </div>
                    ${statusBadge}
                </div>
                <div class="item-card-body">
                    <div class="item-student-name">
                        <i class="fa-regular fa-user"></i> ${c.student_name}
                    </div>
                    <div class="item-badges-row">
                        ${roleBadge}
                        ${upvoteBadge}
                        ${historyBadge}
                    </div>
                </div>
            `;

            li.onclick = () => {
                document.querySelectorAll(".complaint-item-card")
                    .forEach(i => i.classList.remove("active"));
                li.classList.add("active");
                showDetails(c);
            };

            if (!firstItemSet) {
                li.classList.add("active");
                showDetails(c);
                firstItemSet = true;
            }

            groupList.appendChild(li);
        });

        groupContainer.appendChild(groupList);
        list.appendChild(groupContainer);
    });
}

// SHOW DETAILS
function showDetails(c) {
    const isResolved = c.status === 'Resolved';
    const hasHistory = c.pastComplaintsCount && c.pastComplaintsCount > 0;
    
    let imageHtml = "";
    if (c.image && c.image !== 'null' && c.image !== 'undefined') {
        imageHtml = `
            <div class="image-box">
                <h4>Attachment</h4>
                <div class="image-preview-wrapper" onclick="zoomImage('${API_BASE}/uploads/${c.image}')">
                    <img src="${API_BASE}/uploads/${c.image}" alt="Attachment Preview"/>
                    <div class="image-overlay">
                        <i class="fa-solid fa-expand"></i> Click to enlarge
                    </div>
                </div>
            </div>
        `;
    }

    let historyBox = "";
    if (hasHistory) {
        historyBox = `
            <div class="history-box-card warning">
                <div class="history-card-icon">
                    <i class="fa-solid fa-clock-rotate-left"></i>
                </div>
                <div class="history-card-content">
                    <h5>Student Submission History</h5>
                    <p>This student has submitted <strong>${c.pastComplaintsCount}</strong> other complaint(s) in the past. Verify history if there is a pattern of repeat issues.</p>
                </div>
            </div>
        `;
    } else {
        historyBox = `
            <div class="history-box-card info">
                <div class="history-card-icon">
                    <i class="fa-solid fa-shield-check"></i>
                </div>
                <div class="history-card-content">
                    <h5>First-time Submitter</h5>
                    <p>This is the first complaint submitted by this student.</p>
                </div>
            </div>
        `;
    }

    // Timeline steps HTML
    const timelineHtml = `
        <div class="timeline-container">
            <div class="timeline-step ${c.status === 'Pending' || c.status === 'In Progress' || c.status === 'Resolved' ? 'active' : ''}">
                <div class="step-circle"><i class="fa-solid fa-file-arrow-up"></i></div>
                <span class="step-label">Submitted</span>
            </div>
            <div class="timeline-line ${c.status === 'In Progress' || c.status === 'Resolved' ? 'active' : ''}"></div>
            <div class="timeline-step ${c.status === 'In Progress' || c.status === 'Resolved' ? 'active' : ''}">
                <div class="step-circle"><i class="fa-solid fa-spinner"></i></div>
                <span class="step-label">In Progress</span>
            </div>
            <div class="timeline-line ${c.status === 'Resolved' ? 'active' : ''}"></div>
            <div class="timeline-step ${c.status === 'Resolved' ? 'active' : ''}">
                <div class="step-circle"><i class="fa-solid fa-circle-check"></i></div>
                <span class="step-label">Resolved</span>
            </div>
        </div>
    `;

    // Comments list HTML
    let commentsListHtml = "";
    if (c.comments && c.comments.length > 0) {
        c.comments.forEach(com => {
            const dateStr = new Date(com.createdAt).toLocaleString();
            commentsListHtml += `
                <div class="comment-item">
                    <div class="comment-header">
                        <span class="comment-sender">${com.sender}</span>
                        <span class="comment-date">${dateStr}</span>
                    </div>
                    <div class="comment-text">${com.text}</div>
                </div>
            `;
        });
    } else {
        commentsListHtml = `
            <div class="empty-comments">
                <i class="fa-solid fa-comments"></i>
                <p>No comments yet. Start the conversation!</p>
            </div>
        `;
    }

    const priorityClass = c.priority === 'High' ? 'danger' : c.priority === 'Low' ? 'info' : 'warning';

    document.getElementById("details").innerHTML = `
        <div class="detail-card">
            <div class="card-header">
                <div class="title-area">
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <span class="category-tag">${c.category || 'General'}</span>
                        <span class="priority-tag-inline ${priorityClass}">${c.priority || 'Medium'}</span>
                    </div>
                    <h2>${c.type} Issue</h2>
                </div>
                <div class="badge ${c.status === 'Resolved' ? 'success' : c.status === 'Pending' ? 'warning' : 'info'}">
                    <i class="fa-solid ${c.status === 'Resolved' ? 'fa-circle-check' : c.status === 'Pending' ? 'fa-clock' : 'fa-spinner'}"></i> ${c.status}
                </div>
            </div>

            <!-- Timeline Tracker -->
            ${timelineHtml}

            <!-- Profile Info Grid -->
            <div class="profile-info-grid">
                <div class="profile-avatar">
                    <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(c.anonymous ? '?' : c.student_name)}&background=${c.anonymous ? 'f1f5f9' : 'e0e7ff'}&color=${c.anonymous ? '475569' : '4338ca'}&bold=true" alt="Avatar">
                </div>
                <div class="profile-details">
                    <div class="detail-field">
                        <span class="field-label">Submitter</span>
                        <span class="field-value">${c.anonymous ? '🔒 Anonymous Grievance' : `${c.student_name} <span class="role-pill-inline ${c.role || 'student'}">${c.role || 'student'}</span>`}</span>
                    </div>
                    <div class="detail-field">
                        <span class="field-label">Email Address</span>
                        <span class="field-value">${c.anonymous ? 'Hidden for Privacy' : (c.email || 'N/A')}</span>
                    </div>
                    <div class="detail-field">
                        <span class="field-label">Room / Location</span>
                        <span class="field-value"><i class="fa-solid fa-location-dot"></i> ${c.room || 'N/A'}</span>
                    </div>
                    <div class="detail-field">
                        <span class="field-label">Department / Branch</span>
                        <span class="field-value">${c.branch || 'CSE'}</span>
                    </div>
                    ${c.phone && !c.anonymous ? `
                    <div class="detail-field">
                        <span class="field-label">Phone Number</span>
                        <span class="field-value"><i class="fa-solid fa-phone"></i> ${c.phone}</span>
                    </div>
                    ` : ''}
                    ${c.upvotes ? `
                    <div class="detail-field">
                        <span class="field-label">Community Support</span>
                        <span class="field-value upvotes-highlight"><i class="fa-solid fa-circle-arrow-up"></i> ${c.upvotes} Upvotes</span>
                    </div>
                    ` : ''}
                    ${c.votedBy && c.votedBy.length > 0 ? `
                    <div class="detail-field">
                        <span class="field-label">Upvoted By</span>
                        <span class="field-value" style="font-size: 13.5px; color: #4b5563; word-break: break-all;">
                            <i class="fa-solid fa-users" style="color: #64748b; margin-right: 4px;"></i> ${c.votedBy.join(", ")}
                        </span>
                    </div>
                    ` : ''}
                </div>
            </div>

            <!-- Description Box -->
            <div class="description-box">
                <h4>Description of Issue</h4>
                <p>${c.description}</p>
            </div>

            <!-- Attachment Image Box -->
            ${imageHtml}

            <!-- Comments discussion Section -->
            <div class="comments-section">
                <h4>Discussion & Resolution Updates</h4>
                <div class="comments-list">
                    ${commentsListHtml}
                </div>
                <div class="comment-input-area">
                    <input type="text" id="commentTextInput" placeholder="Write a comment or thread message...">
                    <button class="btn-primary" onclick="postComment('${c._id}')">
                        <i class="fa-solid fa-paper-plane"></i>
                    </button>
                </div>
            </div>

            <!-- Action Bar -->
            <div class="action-bar">
                <div class="status-selector-group">
                    <label for="status">Update Resolution Status</label>
                    <div class="status-select-wrapper">
                        <select id="status" class="status-select">
                            <option value="Pending" ${c.status === "Pending" ? "selected" : ""}>Pending</option>
                            <option value="In Progress" ${c.status === "In Progress" ? "selected" : ""}>In Progress</option>
                            <option value="Resolved" ${c.status === "Resolved" ? "selected" : ""}>Resolved</option>
                        </select>
                        <i class="fa-solid fa-chevron-down"></i>
                    </div>
                </div>
                <div class="action-buttons">
                    <button class="btn-primary" onclick="updateStatus('${c._id}')">
                        <i class="fa-solid fa-floppy-disk"></i> Update Status
                    </button>
                    <button class="btn-danger" onclick="deleteComplaint('${c._id}')" title="Delete complaint">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

// ZOOM IMAGE
function zoomImage(url) {
    Swal.fire({
        imageUrl: url,
        imageAlt: 'Complaint Attachment',
        showCloseButton: true,
        showConfirmButton: false,
        background: '#fff',
        width: 'auto',
        imageWidth: '100%',
        imageHeight: 'auto',
        customClass: {
            popup: 'swal-image-zoom-popup'
        }
    });
}

// UPDATE STATUS
async function updateStatus(id) {
    try {
        const status = document.getElementById("status").value;

        const res = await fetch(API_BASE + `/update/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify({ status })
        });

        if (res.ok) {
            Swal.fire({
                title: 'Status Updated!',
                text: `The complaint status has been set to: ${status}`,
                icon: 'success',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true
            });
            loadComplaints();
        } else {
            Swal.fire('Error', 'Failed to update status', 'error');
        }

    } catch (err) {
        console.error("Update error:", err);
        Swal.fire('Error', 'Failed to update status ❌', 'error');
    }
}

// DELETE COMPLAINT
async function deleteComplaint(id) {
    const confirmResult = await Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Yes, delete it!'
    });

    if (!confirmResult.isConfirmed) return;

    try {
        const res = await fetch(API_BASE + `/delete/${id}`, {
            method: "DELETE",
            headers: { "Authorization": "Bearer " + token }
        });
        
        if (res.ok) {
            Swal.fire({
                title: 'Deleted!',
                text: 'The complaint has been deleted.',
                icon: 'success',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true
            });
            loadComplaints();
        } else {
            Swal.fire('Error', 'Failed to delete complaint', 'error');
        }
    } catch(err) {
        console.error("Delete error:", err);
        Swal.fire('Error', 'Failed to delete complaint ❌', 'error');
    }
}

// LOAD ALL COMPLAINTS
async function loadComplaints() {
    try {
        const res = await fetch(API_BASE + "/complaints", {
            headers: { "Authorization": "Bearer " + token }
        });
        
        if (res.status === 401 || res.status === 403) {
            Swal.fire({
                title: 'Access Denied',
                text: 'Admins only! Redirecting to login...',
                icon: 'error',
                confirmButtonColor: '#6366f1'
            }).then(() => {
                localStorage.clear();
                window.location.href = "index.html";
            });
            return;
        }

        const data = await res.json();
        allComplaints = data;

        // DASHBOARD STATS
        updateStats();

        // Render the filtered list
        renderComplaints();

    } catch (err) {
        console.error("Error loading complaints:", err);
        Swal.fire('Connection Error', 'Failed to fetch complaints from backend ❌', 'error');
    }
}

// INITIAL LOAD
loadComplaints();

// LOGOUT
function logout() {
    localStorage.clear();
    window.location.href = "index.html";
}

// POST COMMENT
async function postComment(complaintId) {
    const textInput = document.getElementById("commentTextInput");
    const text = textInput.value.trim();
    if (!text) return;

    try {
        const res = await fetch(API_BASE + `/complaint/${complaintId}/comment`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify({ text })
        });

        if (res.ok) {
            const data = await res.json();
            
            // Find in local array and update comments
            const comp = allComplaints.find(item => item._id === complaintId);
            if (comp) {
                comp.comments = data.comments;
                // Rerender details
                showDetails(comp);
            }
        } else {
            Swal.fire('Error', 'Failed to send comment', 'error');
        }
    } catch (err) {
        console.error("Comment post error:", err);
        Swal.fire('Error', 'Failed to send comment ❌', 'error');
    }
}

// NOTIFICATIONS
let activeNotifications = [];

async function checkNotifications() {
    if (!token) return;

    try {
        const res = await fetch(API_BASE + "/notifications", {
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
                const markRes = await fetch(API_BASE + "/notifications/read-all", {
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

// ==========================================================
// 📊 ANALYTICS & CHART.JS INTERACTIVE DASHBOARD
// ==========================================================
let monthlyChartInstance = null;
let departmentChartInstance = null;
let categoryChartInstance = null;

const navDashboard = document.getElementById("nav-dashboard");
const navAnalytics = document.getElementById("nav-analytics");
const workspaceDashboard = document.getElementById("workspace-dashboard");
const workspaceAnalytics = document.getElementById("workspace-analytics");

if (navDashboard && navAnalytics && workspaceDashboard && workspaceAnalytics) {
    navDashboard.addEventListener("click", (e) => {
        e.preventDefault();
        navDashboard.classList.add("active");
        navAnalytics.classList.remove("active");
        workspaceDashboard.style.display = "block";
        workspaceAnalytics.style.display = "none";
    });

    navAnalytics.addEventListener("click", (e) => {
        e.preventDefault();
        navAnalytics.classList.add("active");
        navDashboard.classList.remove("active");
        workspaceAnalytics.style.display = "block";
        workspaceDashboard.style.display = "none";
        loadAnalyticsData();
    });
}

async function loadAnalyticsData() {
    try {
        const res = await fetch(API_BASE + "/admin/analytics", {
            headers: { "Authorization": "Bearer " + token }
        });
        if (!res.ok) throw new Error("Failed to fetch analytics");

        const data = await res.json();

        // 1. Set Stat values
        document.getElementById("stat-avg-time").innerText = data.summary.avgResolutionHours + " hrs";
        document.getElementById("stat-total-resolved").innerText = data.summary.resolved;
        
        const total = data.summary.total;
        const rate = total > 0 ? Math.round((data.summary.resolved / total) * 100) : 0;
        document.getElementById("stat-resolution-rate").innerText = rate + "%";

        const highActive = allComplaints.filter(c => c.priority === "High" && c.status !== "Resolved").length;
        document.getElementById("stat-high-active").innerText = highActive;

        // 2. Render Leaderboard
        const tableBody = document.getElementById("facultyLeaderboardBody");
        if (tableBody) {
            tableBody.innerHTML = "";
            const sortedDeps = [...data.departments].sort((a, b) => parseInt(b.resolutionRate) - parseInt(a.resolutionRate));
            
            sortedDeps.forEach(dep => {
                const tr = document.createElement("tr");
                tr.style.borderBottom = "1px solid var(--border)";
                tr.innerHTML = `
                    <td style="padding: 10px 12px; font-weight: 600; color: var(--text-main);">${dep.name} Faculty</td>
                    <td style="padding: 10px 12px; text-align: center;">${dep.total}</td>
                    <td style="padding: 10px 12px; text-align: center; color: #10b981; font-weight: 600;">${dep.resolved}</td>
                    <td style="padding: 10px 12px; text-align: center;">${dep.avgResolutionHours !== 'N/A' ? dep.avgResolutionHours + 'h' : 'N/A'}</td>
                    <td style="padding: 10px 12px; text-align: right; font-weight: 700; color: #4f46e5;">${dep.resolutionRate}</td>
                `;
                tableBody.appendChild(tr);
            });
        }

        // 3. Render Chart.js Diagrams
        renderCharts(data);

    } catch (err) {
        console.error("Load analytics error:", err);
        Swal.fire("Error", "Could not compile analytics reports.", "error");
    }
}

function renderCharts(data) {
    if (monthlyChartInstance) monthlyChartInstance.destroy();
    if (departmentChartInstance) departmentChartInstance.destroy();
    if (categoryChartInstance) categoryChartInstance.destroy();

    const colors = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#3b82f6"];

    // A. Monthly Trends Line Chart
    const monthlyCanvas = document.getElementById("monthlyTrendChart");
    if (monthlyCanvas) {
        const monthlyCtx = monthlyCanvas.getContext("2d");
        monthlyChartInstance = new Chart(monthlyCtx, {
            type: 'line',
            data: {
                labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
                datasets: [{
                    label: 'Complaints Submitted',
                    data: data.monthlyTrends,
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    borderWidth: 3,
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, ticks: { stepSize: 1 } }
                }
            }
        });
    }

    // B. Department breakdown Doughnut Chart
    const depCanvas = document.getElementById("departmentChart");
    if (depCanvas) {
        const depCtx = depCanvas.getContext("2d");
        const depLabels = data.departments.map(d => d.name);
        const depValues = data.departments.map(d => d.total);

        departmentChartInstance = new Chart(depCtx, {
            type: 'doughnut',
            data: {
                labels: depLabels,
                datasets: [{
                    data: depValues,
                    backgroundColor: colors.slice(0, depLabels.length),
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { boxWidth: 12, font: { family: 'Outfit' } } }
                }
            }
        });
    }

    // C. Category Bar Chart
    const catCanvas = document.getElementById("categoryChart");
    if (catCanvas) {
        const catCtx = catCanvas.getContext("2d");
        const catLabels = Object.keys(data.categories);
        const catValues = Object.values(data.categories);

        categoryChartInstance = new Chart(catCtx, {
            type: 'bar',
            data: {
                labels: catLabels.map(l => l.charAt(0).toUpperCase() + l.slice(1)),
                datasets: [{
                    label: 'Complaint Submissions',
                    data: catValues,
                    backgroundColor: '#10b981',
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, ticks: { stepSize: 1 } }
                }
            }
        });
    }
}

function exportCSVReport() {
    if (allComplaints.length === 0) {
        Swal.fire("No Data", "There are no complaints available to export.", "warning");
        return;
    }

    const headers = ["Student Name", "Phone", "Email", "Room", "Type/Issue", "Description", "Category", "Branch/Department", "Priority", "Status", "Upvotes", "Created At", "Resolved At"];
    const rows = [headers];

    allComplaints.forEach(c => {
        rows.push([
            c.student_name || "N/A",
            c.phone || "N/A",
            c.email || "N/A",
            c.room || "N/A",
            c.type || "N/A",
            `"${(c.description || "").replace(/"/g, '""')}"`,
            c.category || "N/A",
            c.branch || "N/A",
            c.priority || "Medium",
            c.status || "Pending",
            c.upvotes || 0,
            c.createdAt || "",
            c.resolvedAt || ""
        ]);
    });

    const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `SmartCollege_Complaints_Report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    Swal.fire({
        title: 'Report Downloaded!',
        text: 'Excel CSV sheet saved successfully.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
    });
}

function printPDFReport() {
    window.print();
}

// ==========================================================
// 📱 RESPONSIVE SIDEBAR MOBILE HAMBURGER
// ==========================================================
const burgerBtn = document.getElementById("mobileHamburgerBtn");
const sidebarEl = document.querySelector(".sidebar");
const overlayEl = document.getElementById("sidebarOverlay");

if (burgerBtn && sidebarEl && overlayEl) {
    burgerBtn.addEventListener("click", () => {
        sidebarEl.classList.add("open");
        overlayEl.style.display = "block";
    });

    overlayEl.addEventListener("click", () => {
        sidebarEl.classList.remove("open");
        overlayEl.style.display = "none";
    });

    document.querySelectorAll(".nav-item, .nav-filter-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            if (window.innerWidth <= 768) {
                sidebarEl.classList.remove("open");
                overlayEl.style.display = "none";
            }
        });
    });
}