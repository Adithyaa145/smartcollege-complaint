const API_BASE = (() => {
    const proto = window.location.protocol;
    const host = window.location.hostname;
    const port = window.location.port;

    if (host === 'localhost' || host === '127.0.0.1') {
        if (port === '3001') {
            return '';
        }
        return 'http://localhost:3001';
    }
    if (host === 'smartcollege-complaint.onrender.com') {
        return '';
    }
    return 'https://smartcollege-complaint.onrender.com';
})();
// ==========================
// 🔥 DYNAMIC TITLE + OPTIONS
// ==========================
const title = document.getElementById("formTitle");
const category = document.getElementById("category");
const issue = document.getElementById("issue");

const urlParams = new URLSearchParams(window.location.search);
const type = urlParams.get("type") || "classroom";

// Fallback logic to beautifully capitalize any unknown type
const formatType = (str) => {
    if(!str) return "General";
    return str.charAt(0).toUpperCase() + str.slice(1).replace("-", " ") + " Complaint";
};

const titles = {
  classroom: "🏫 Classroom Complaint",
  hostel: "🏠 Hostel Complaint",
  labs: "💻 Lab Complaint",
  transport: "🚌 Transport Complaint",
  fees: "💳 Fees Complaint",
  notifications: "🔔 Notifications Complaint",
  feedback: "💬 Feedback",
  others: "📌 Other Complaints",
  projector: "📽️ Projector Issue",
  internet: "🌐 Internet Issue",
  electrical: "⚡ Electrical Issue",
  maintenance: "🔧 Maintenance Issue",
  general: "➕ General Complaint"
};

title.innerText = titles[type] ? titles[type] + " Form" : "⚠ " + formatType(type) + " Form";

const data = {

  // ── CLASSROOM ──────────────────────────────────────────────
  classroom: {
    "Electrical":      ["Switch Not Working", "Power Failure", "Tube Light Broken", "Fan Making Noise", "AC Not Working", "Sparking in Socket", "Projector Power Issue", "Exhaust Fan Broken"],
    "Furniture":       ["Broken Chair", "Damaged Desk", "Whiteboard Damaged", "Door / Window Broken", "Podium Damaged", "Curtains Torn or Missing", "Bench Wobbling", "Cupboard Broken"],
    "Projector / AV":  ["Projector Not Turning On", "Blurry / Out-of-Focus Image", "HDMI Cable Missing", "VGA Cable Broken", "No Audio Output", "Remote Control Missing", "Screen Flickering", "Projection Screen Stuck"],
    "Lighting":        ["Tube Light Blown Out", "Room Too Dark", "Flickering Lights", "Emergency Light Not Working", "Bulb Replacement Needed", "Light Switch Broken"],
    "Cleanliness":     ["Classroom Not Cleaned", "Dustbins Overflowing", "Foul Smell in Room", "Pest / Insects Spotted", "Broken Windows Letting in Rain", "Dirty Walls / Graffiti"],
    "Internet / Wi-Fi":["Wi-Fi Dead Zone in Class", "Slow Internet Speed", "No LAN Connection in Class", "Portal Not Accessible", "Login Page Not Loading"],
    "Safety":          ["Loose Ceiling Tile", "Broken Staircase Rail Near Class", "Fire Extinguisher Missing", "Exposed Electrical Wiring", "Water Leaking into Classroom"],
    "Others":          ["Not Listed Above", "Multiple Issues at Once", "Urgent – Needs Immediate Attention", "Faculty-reported Issue", "Any Other Classroom Problem"]
  },

  // ── HOSTEL ─────────────────────────────────────────────────
  hostel: {
    "Room Maintenance": ["Fan/Light Not Working", "Bed Frame Broken", "Mattress in Bad Condition", "Window/Door Lock Jammed", "Wardrobe Latch Broken", "Mirror Cracked", "Power Socket Burnt", "Balcony Door Stuck"],
    "Water & Plumbing": ["No Drinking Water Supply", "Tap Leakage in Washroom", "Geyser Not Working", "Flush System Broken", "Drain Clogged", "Shower Head Damaged", "Very Low Water Pressure", "Discolored Water"],
    "Hygiene":          ["Room Not Cleaned", "Washroom Very Dirty", "Dustbin Overflowing", "Pest / Insect Infestation", "Bad Odor from Drain", "Corridor Dirty", "Fungus or Mold on Walls"],
    "Security":         ["Unauthorized Person Entered", "Noise Disturbance Late Night", "Theft of Belongings", "Harassment by Other Student", "CCTV Camera Not Working", "Main Gate Left Open", "Fire Extinguisher Expired"],
    "Food / Mess":      ["Food Quality Very Poor", "Stale / Expired Food Served", "Unhygienic Kitchen", "Mess Not Open on Time", "Item Missing from Menu", "Overcharged for Meal"],
    "Electrical":       ["Room Has No Power", "MCB Tripping Frequently", "Charger Point Damaged", "Light Fitting Loose", "Extension Board Sparking"],
    "Internet":         ["Wi-Fi Not Reaching Room", "Hostel Router Down", "Very Slow Hostel Internet", "Cannot Login to Campus Portal from Hostel"],
    "Others":           ["Not Listed Above", "Warden Misconduct", "Urgent – Hostel Emergency", "Multiple Issues at Once", "Any Other Hostel Problem"]
  },

  // ── LABS ───────────────────────────────────────────────────
  labs: {
    "Computer / PC":    ["PC Not Booting", "Keyboard or Mouse Broken", "Monitor Flickering or Dead", "System Crashing Frequently", "Blue Screen of Death (BSOD)", "USB Ports Not Working", "Audio Port Damaged", "Slow System Performance"],
    "Software":         ["Required Software Not Installed", "Software License Expired", "Application Crashing on Launch", "Compiler / IDE Not Working", "OS Update Broken", "Antivirus Blocking Work", "Missing Driver", "Database Access Error"],
    "Internet / LAN":   ["No LAN Connection at Desk", "Ethernet Cable Damaged", "Very Slow Network Speed", "High Ping / Packet Loss", "Server Down in Department", "Firewall Blocking Resource", "Website Blocked Incorrectly"],
    "Equipment":        ["Lab Hardware Broken", "Chemical Supply Empty", "Safety Kit Missing", "Measuring Tools Damaged", "Calibration Failure", "Microscope Out of Focus", "Oscilloscope Faulty"],
    "Cleanliness":      ["Lab Not Cleaned Properly", "Lab Smell / Ventilation Issue", "Dusty Equipment", "Broken Glassware Not Cleared"],
    "Safety":           ["Emergency Exit Blocked", "Fire Extinguisher Missing", "Chemicals Not Properly Stored", "Electrical Hazard in Lab", "Safety Goggles Not Available"],
    "Printing":         ["Printer Out of Ink", "Printer Offline / Not Detected", "Paper Jam in Printer", "Print Quality Poor", "Scanner Not Working"],
    "Others":           ["Not Listed Above", "Lab Access Issue", "Lab Scheduling Conflict", "Urgent – Lab Emergency", "Any Other Lab Problem"]
  },

  // ── TRANSPORT ──────────────────────────────────────────────
  transport: {
    "Bus Punctuality":  ["Bus Arriving Very Late", "Bus Left Before Scheduled Time", "No Bus on Route Today", "Bus Skipped Stop Without Reason", "Incorrect Timetable Followed"],
    "Bus Condition":    ["Bus AC / Fan Not Working", "Seat Badly Damaged", "Bus Window Stuck / Broken", "Foul Smell Inside Bus", "Bus Overcrowded Daily", "Vehicle Making Unusual Noise"],
    "Driver / Staff":   ["Rash / Unsafe Driving", "Driver Using Phone While Driving", "Conductor Misbehaving", "Harassment by Staff", "Driver Not Wearing Uniform"],
    "Route":            ["Route Change Request", "Wrong Route Being Followed", "New Stop Needed", "Pick-up Point Skipped", "Drop-point Changed Without Notice"],
    "Pass / ID Card":   ["Bus Pass Not Issued", "Pass Not Printed Correctly", "Pass Lost – Reissue Needed", "Pass Expiry Not Renewed", "Pass Not Accepted by Driver"],
    "Breakdown":        ["Bus Broke Down Mid-Route", "Bus Broke Down at Campus", "Engine Overheating", "Tyre Puncture", "Bus Needs Emergency Rescue"],
    "Safety":           ["No First Aid Kit in Bus", "Emergency Exit Blocked", "CCTV in Bus Not Working", "Seatbelts Missing or Broken"],
    "Others":           ["Not Listed Above", "Bus Not Sanitized", "Special Trip Request", "Any Other Transport Issue"]
  },

  // ── FEES ───────────────────────────────────────────────────
  fees: {
    "Payment Failure":  ["Transaction Failed – Money Deducted", "Double Payment Processed", "Bank Gateway Error", "Payment Pending for 3+ Days", "Receipt Not Generated After Payment", "Refund Not Credited"],
    "Dues & Billing":   ["Incorrect Amount Showing as Due", "Extra Fine Added Wrongly", "Scholarship Amount Not Adjusted", "Invalid Late Fee Charged", "Installment Option Not Available"],
    "Exam Fees":        ["Exam Form Blocked Due to Dues", "Exam Fee Payment Rejected", "Fee Paid but Exam Form Not Activated", "Wrong Exam Batch Billed"],
    "Scholarship":      ["Scholarship Not Disbursed", "Wrong Scholarship Amount", "Scholarship Eligibility Issue", "Application Approved but Not Applied"],
    "Receipts":         ["Receipt Download Not Working", "Receipt Shows Wrong Amount", "Duplicate Receipt Issued", "Acknowledgment Not Received on Email"],
    "Hostel Fees":      ["Hostel Fee Not Updated on Portal", "Mess Charge Incorrect", "Extra Hostel Charges Applied", "Refund for Early Checkout Pending"],
    "Library / Other":  ["Library Fine Incorrect", "ID Card Fee Charged Twice", "Sports Fee Dispute", "Event Registration Fee Issue"],
    "Others":           ["Not Listed Above", "Fee Portal Not Loading", "Urgent – Exam Blocked Due to Fee Error", "Any Other Fee Issue"]
  },

  // ── PROJECTOR ──────────────────────────────────────────────
  projector: {
    "Power / Startup":  ["Projector Won't Power On", "Projector Shuts Off Mid-class", "No Standby LED", "Power Indicator Blinking Red", "Overheating Warning"],
    "Bulb / Lamp":      ["Bulb Needs Replacement", "Dim / Faded Image", "Lamp Life Warning Showing", "Color Shift After Long Use"],
    "Display Quality":  ["Image Out of Focus / Blurry", "Color Distortion (Yellow or Blue Tint)", "Half Screen Not Displaying", "Resolution Mismatch", "Black Vertical Lines on Screen"],
    "Connections":      ["HDMI Port Broken", "VGA Cable Missing or Bent Pins", "Wireless / Miracast Not Working", "Display Not Detected by Laptop", "Screen Flickering Due to Cable"],
    "Audio":            ["No Sound from Projector Speaker", "Audio Crackling or Distorted", "Volume Very Low", "Mic Not Working with Projector"],
    "Remote / Control": ["Remote Control Missing", "Remote Not Working (Battery)", "Keystone Correction Stuck", "Input Button Not Responding"],
    "Screen / Mount":   ["Projection Screen Stuck", "Screen Not Fully Unrolling", "Mount Loose / Tilted", "Screen Torn or Stained"],
    "Others":           ["Not Listed Above", "Projector Needs Full Service", "Multiple Issues at Once", "Any Other Projector Problem"]
  },

  // ── INTERNET ───────────────────────────────────────────────
  internet: {
    "Wi-Fi Connectivity":  ["Cannot Connect to Campus Wi-Fi", "Wi-Fi Keeps Disconnecting", "Captive Portal Not Loading", "Authentication Login Failing", "IP Address Conflict", "Wi-Fi Password Not Working"],
    "Speed / Performance": ["Internet Very Slow", "High Ping / Latency", "Videos Buffering Constantly", "File Downloads Very Slow", "Packet Loss on Connection"],
    "Coverage":            ["No Wi-Fi Signal in My Area", "Dead Zone in Library", "Poor Coverage in Hostel Room", "No Signal in Basement / Lab", "Coverage Drops After Rain"],
    "LAN / Wired":         ["LAN Port Broken in Wall", "Ethernet Cable Damaged", "Wired Connection Not Detected", "LAN Speed Very Slow", "Switch Port Not Working"],
    "Portal / Website":    ["College Portal Not Loading", "Website Access Blocked", "Firewall Blocking Study Resources", "VPN Blocked on Campus Network", "Online Exam Portal Unreachable"],
    "Account / Login":     ["Campus Network Account Locked", "Cannot Reset Network Password", "New Student Account Not Created", "MAC Address Needs Registration"],
    "Hardware":            ["Router Seems Down in Block", "Access Point Offline", "Network Switch Failure Reported", "Cable TV / IPTV Not Working"],
    "Others":              ["Not Listed Above", "Internet During Exam Not Working", "Urgent – Exam Platform Unreachable", "Any Other Internet Issue"]
  },

  // ── ELECTRICAL ─────────────────────────────────────────────
  electrical: {
    "Sockets & Plugs":  ["Socket Sparking When Plugged", "Broken / Cracked Plug Point", "Socket Not Providing Power", "Extension Board Burnt", "Three-Pin Point Not Working"],
    "Wiring":           ["Exposed Live Wires Visible", "Wire Insulation Melted", "Junction Box Open / Uncovered", "Loose Hanging Wires Overhead", "Wiring Behind Wall Sparking"],
    "Fuses & MCB":      ["MCB Tripping Frequently", "Main Fuse Blown", "RCD Not Resetting", "Phase Failure in Block", "Entire Floor Power Loss"],
    "Lighting":         ["Tube Light / LED Not Working", "Corridor Completely Dark", "Street Lights Not Turning On at Night", "Parking Lot Lights Dead", "Emergency Exit Light Off"],
    "AC / Fans":        ["AC Not Cooling at All", "Fan Running Very Slow", "Fan Wobbling Dangerously", "AC Remote Not Working", "AC Making Loud Grinding Noise"],
    "Appliances":       ["Water Cooler Not Working", "Microwave Sparking in Pantry", "Vending Machine Not Powering", "Electric Bell / Buzzer Dead"],
    "Safety Hazards":   ["Electric Shock Received", "Burning Smell from Panel", "Water Near Live Wire", "Fire Hazard Due to Electrical Fault", "Panel Box Door Open / Unlocked"],
    "Others":           ["Not Listed Above", "Power Cut Affecting Work", "UPS / Generator Not Starting", "Any Other Electrical Issue"]
  },

  // ── MAINTENANCE ────────────────────────────────────────────
  maintenance: {
    "Building / Infra": ["Leaking Roof / Ceiling", "Peeling Paint or Damp Walls", "Broken Tiles on Floor", "Cracked Wall Needs Repair", "Drain Overflow on Campus Road", "Potholes on Internal Road"],
    "Doors & Windows":  ["Door Hinge Broken", "Window Glass Shattered", "Door Lock Jammed", "Sliding Door Off Track", "Fire Door Not Closing Properly", "Roller Shutter Stuck"],
    "Elevator / Lift":  ["Lift Not Working", "Lift Door Not Opening", "Lift Making Unusual Noise", "Emergency Alarm in Lift Dead", "Lift Capacity Overload Sensor Faulty"],
    "Plumbing":         ["Water Pipeline Leaking", "Drain Blocked in Corridor", "Overhead Tank Overflow", "Water Pump Not Running", "Sewage Smell from Drain"],
    "Garden / Campus":  ["Overgrown Grass / Weeds", "Sprinkler System Broken", "Fallen Tree Branch Blocking Path", "Garden Bench Broken", "Campus Pond / Fountain Broken"],
    "Signage":          ["Directional Sign Missing", "Exit Sign Not Lit", "Room Number Plate Fallen", "Notice Board Damaged", "Parking Sign Broken"],
    "Furniture":        ["Classroom / Office Chair Broken", "Table Damaged", "Filing Cabinet Jammed", "Reception Desk Damaged", "Shelf Collapsed"],
    "Others":           ["Not Listed Above", "Urgent Safety Hazard", "Multiple Maintenance Issues", "Any Other Campus Infrastructure Problem"]
  },

  // ── FEEDBACK ───────────────────────────────────────────────
  feedback: {
    "Portal / App":     ["UI Hard to Use", "Feature Not Working Correctly", "Page Loading Very Slow", "Found a Bug", "Missing Feature Request", "Design Improvement Suggestion"],
    "Academic":         ["Course Content Suggestion", "Timetable Conflict Feedback", "Faculty Appreciation", "Faculty Concern", "Exam Schedule Feedback"],
    "Campus Life":      ["Cafeteria Food Quality Feedback", "Library Hours Feedback", "Sports Facility Suggestion", "Event Organisation Feedback", "College Atmosphere Feedback"],
    "Support Staff":    ["Office Staff Very Helpful – Appreciation", "Staff Behaviour Concern", "Security Personnel Feedback", "Housekeeping Staff Feedback"],
    "Facilities":       ["Classroom Condition Feedback", "Hostel Facility Feedback", "Lab Equipment Feedback", "Washroom Hygiene Feedback"],
    "Administration":   ["Admission Process Feedback", "Fee Structure Concern", "Scholarship Process Suggestion", "Communication / Notice Feedback"],
    "General":          ["General Appreciation", "Overall College Experience", "Improvement Suggestion", "Anything Else Positive or Negative"],
    "Others":           ["Not Listed Above", "Anonymous Feedback", "Urgent Concern", "Any Other Feedback"]
  },

  // ── GENERAL ────────────────────────────────────────────────
  general: {
    "Lost & Found":     ["Lost ID Card", "Lost Laptop / Device", "Lost Books / Notes", "Found Something – Reporting", "Lost Bag or Wallet", "Lost Keys"],
    "Events":           ["Event Venue Issue", "Event Equipment Not Ready", "Event Permission Not Granted", "Mis-communication About Event", "Event Cancellation Issue"],
    "Cafeteria":        ["Unhygienic Food Preparation", "Item Not Available", "Overcharged at Counter", "Seating Not Enough", "Cafeteria Not Open on Time"],
    "Library":          ["Book Not Available", "Library Silent Zone Disturbed", "Borrowing Limit Issue", "Fine Dispute", "E-Resource Access Problem"],
    "Printing":         ["Printing Not Working", "Photocopy Machine Jammed", "Out of Paper at Printing Counter", "Printing Too Expensive"],
    "Health / Medical": ["College Clinic Not Open", "First Aid Kit Missing from Block", "Ambulance Request", "Medical Emergency Reported"],
    "Service Request":  ["New Bench / Chair Needed", "Water Cooler Needed in Area", "Waste Bin Needed", "Additional Notice Board Needed"],
    "Others":           ["Not Listed Above", "Multiple Issues", "Urgent – Needs Immediate Attention", "Any Other General Issue"]
  },

  // ── OTHERS (catch-all) ─────────────────────────────────────
  others: {
    "Disciplinary":     ["Ragging / Bullying", "Harassment", "Misconduct by Student", "Misconduct by Staff", "Substance Abuse Concern"],
    "Administration":   ["Admission Error", "Certificate Not Issued", "Document Verification Pending", "Wrong Data on ID Card", "Transfer Certificate Issue"],
    "Counseling":       ["Need Personal Counselor", "Academic Stress Assistance", "Career Guidance Needed", "Personal Problem – Needs Support"],
    "Infrastructure":   ["New Room / Space Needed", "Renovation Request", "Accessibility Issue (Disability)", "Lift Access for Differently Abled"],
    "IT Support":       ["Portal Account Locked", "Email ID Not Working", "Cannot Reset Password", "Duplicate Entry in Database"],
    "HR / Staff":       ["Faculty Not Available for Class", "Office Closed During Hours", "Staff Leave Issue", "Payroll Query (Staff)"],
    "Miscellaneous":    ["Multiple Unrelated Issues", "Urgent Unclassified Issue", "Need Admin Assistance", "Anonymous Concern"],
    "Others":           ["Not Listed Above", "Any Other Problem Not Categorised Above"]
  },

  // ── NOTIFICATIONS ──────────────────────────────────────────
  notifications: {
    "Email Alerts":     ["Not Receiving Emails", "Emails Going to Spam", "Wrong Email in Account", "Bulk Emails Sending Twice", "Unsubscribed but Still Receiving"],
    "SMS Alerts":       ["SMS Not Arriving", "SMS Delayed by Hours", "Wrong Phone Number on Account", "OTP Not Received for Login"],
    "Portal Notices":   ["Announcement Not Visible on Portal", "Wrong Date on Notice", "Important Notice Missing", "Outdated Notice Still Showing"],
    "Push / App":       ["App Notification Not Working", "App Crashing on Notification Tap", "Notification Badge Count Wrong", "Silent Notifications Mode Stuck"],
    "Event Reminders":  ["Event Reminder Not Sent", "Reminder Sent After Event", "Wrong Event Details in Notification"],
    "Exam Alerts":      ["Exam Hall Ticket Notification Missing", "Result Notification Not Received", "Exam Schedule Change Not Notified"],
    "Emergency":        ["Emergency Alert Not Received", "Fire Drill Announcement Missing", "Holiday Declared – No Notice Sent"],
    "Others":           ["Not Listed Above", "Multiple Notification Issues", "Any Other Notification Problem"]
  },

  // ── SUBMIT / GENERAL (fallback) ────────────────────────────
  submit: {
    "Service Request":  ["New Bench Needed", "Water Cooler Needed", "Waste Bin Needed", "Notice Board Needed"],
    "Lost & Found":     ["Lost ID Card", "Lost Device", "Lost Books", "Found Item – Reporting"],
    "Event":            ["Venue Issue", "Equipment Not Ready", "Cancellation Concern"],
    "Cafeteria":        ["Food Quality Issue", "Item Unavailable", "Overcharged"],
    "Others":           ["Not Listed Above", "Any Other Request"]
  }

};

// Start by explicitly telling the user they must pick a Category
issue.innerHTML = '<option value="">⬅ Select Category First</option>';

// load categories
if (data[type]) {
  Object.keys(data[type]).forEach(cat => {
    let opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    category.appendChild(opt);
  });
  // Always include an "Others / Not Listed Above" option
  const othersOpt = document.createElement("option");
  othersOpt.value = "Others / Not Listed Above";
  othersOpt.textContent = "Others / Not Listed Above";
  category.appendChild(othersOpt);
} else {
  // Generic fallback if data[type] doesn't specifically exist
  let opt = document.createElement("option");
  opt.value = "General";
  opt.textContent = "General " + formatType(type);
  category.appendChild(opt);

  let genericIssue = document.createElement("option");
  genericIssue.value = "Other Issue";
  genericIssue.textContent = "Other Issue";
  issue.appendChild(genericIssue);
}

// load issues when category is clicked
category.addEventListener("change", function () {
  issue.innerHTML = '<option value="">Select Issue</option>';
  // Get all selected categories (multi-select)
  const selectedCategories = Array.from(category.selectedOptions).map(o => o.value).filter(v => v);
  if (selectedCategories.length === 0) {
    issue.innerHTML = '<option value="">⬅ Select Category First</option>';
    return;
  }
  // For each selected category, add its issues
  selectedCategories.forEach(selected => {
    if (data[type] && data[type][selected]) {
      data[type][selected].forEach(i => {
        let opt = document.createElement("option");
        opt.value = i;
        opt.textContent = i;
        issue.appendChild(opt);
      });
    }
  });
  // Always append a final "Others / Not Listed" option to the issue dropdown
  const othersOpt = document.createElement("option");
  othersOpt.value = "Others / Not Listed Above";
  othersOpt.textContent = "Others / Not Listed Above";
  issue.appendChild(othersOpt);
});




// ==========================
// 🛡️ AUTH & IDENTITY LOGIC
// ==========================
const token = localStorage.getItem("token");
let userString = localStorage.getItem("user");

if (!token || !userString) {
    // Use SweetAlert if loaded, else fallback
    if (typeof Swal !== 'undefined') {
        Swal.fire({ title: 'Not Logged In', text: 'Please log in to submit a complaint.', icon: 'warning', confirmButtonColor: '#4f46e5' })
            .then(() => { window.location.href = "index.html"; });
    } else {
        window.location.href = "index.html";
    }
}

const user = JSON.parse(userString || '{}');

// Auto-fill student/faculty details
if (document.getElementById("userInfoHeader")) {
    document.getElementById("userInfoHeader").innerText =
        (user.role && user.role.toLowerCase() === 'faculty') ? "Faculty Information" : "Student Information";
}
document.getElementById("student_name").value = user.name || '';
document.getElementById("student_name").disabled = true;
document.getElementById("email").value = user.email || '';
document.getElementById("email").disabled = true;

// ── Submit handler ──────────────────────────────────────────
document.getElementById("complaintForm").addEventListener("submit", async function(e) {
    e.preventDefault();

    // Basic validation
    const room        = document.getElementById("room").value.trim();
    // Extract selected categories (multi-select)
    const categorySelect = document.getElementById("category");
    const selectedCategories = Array.from(categorySelect.selectedOptions).map(o => o.value).filter(v => v);
    const categoryVal = selectedCategories.join(", ");
    // Issue handling
    const issueSelect = document.getElementById("issue");
    const selectedIssues = Array.from(issueSelect.selectedOptions).map(o => o.value).filter(v => v);
    const issueVal = selectedIssues.join(", ");
    const descVal     = document.getElementById("description").value.trim();

    // Validate category selection
    if (selectedCategories.length === 0) {
        Swal.fire({ title: 'Missing Field', text: 'Please select at least one category.', icon: 'warning', confirmButtonColor: '#4f46e5' });
        return;
    }
    // Validate issue selection (already done earlier)
    if (!issueVal) {
        Swal.fire({ title: 'Missing Field', text: 'Please select an issue type.', icon: 'warning', confirmButtonColor: '#4f46e5' });
        return;
    }
    if (!descVal) {
        Swal.fire({ title: 'Missing Field', text: 'Please describe your complaint.', icon: 'warning', confirmButtonColor: '#4f46e5' });
        return;
    }

    // Show loading state on button
    const submitBtn = document.querySelector(".submit-btn");
    const originalHTML = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
        <svg style="width:20px;height:20px;animation:spin .7s linear infinite;" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" stroke-width="3"/>
            <path d="M12 2a10 10 0 0 1 10 10" stroke="white" stroke-width="3" stroke-linecap="round"/>
        </svg>
        Submitting...
    `;

    // Build form payload
    const formData = new FormData();
    formData.append("student_name", user.name);
    formData.append("phone",        document.getElementById("phone").value);
    formData.append("email",        user.email);
    formData.append("room",         room);
    formData.append("category", categoryVal);
    formData.append("type", new URLSearchParams(window.location.search).get("type") || "classroom");
    formData.append("issue",        issueVal);
    formData.append("description",  descVal);
    formData.append("ocrText",      lastOcrText || "");

    const fileInput = document.getElementById("image");
    if (fileInput.files.length > 0) {
        formData.append("image", fileInput.files[0]);
    }

    try {
        const res = await fetch(API_BASE + "/submit-complaint", {
            method: "POST",
            body: formData,
            headers: { "Authorization": "Bearer " + token }
        });

        // Restore button regardless of outcome
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalHTML;

        if (!res.ok) {
            // Try to extract error details from response body
            let errorMsg = `Server returned ${res.status}`;
            try {
                const errData = await res.json();
                if (errData && errData.error) {
                    errorMsg = errData.error;
                }
            } catch (e) {
                // ignore parsing errors
            }
            if (res.status === 401 || res.status === 403) {
                Swal.fire({ title: 'Session Expired', text: 'Please log in again.', icon: 'warning', confirmButtonColor: '#4f46e5' })
                    .then(() => { localStorage.clear(); window.location.href = "index.html"; });
                return;
            }
            Swal.fire({ title: 'Submission Error', text: errorMsg, icon: 'error', confirmButtonColor: '#4f46e5' });
            return;
        }

        const result = await res.json();

        // ── SUCCESS ── show success modal for 3 seconds, then redirect
        Swal.fire({
            icon: 'success',
            title: '<span style="font-size:22px;font-weight:800;color:#0f172a;">Complaint Submitted!</span>',
            html: `
                <div style="text-align:center;padding:4px 0 8px;">
                    <div style="
                        width:70px;height:70px;
                        background:linear-gradient(135deg,#ecfdf5,#d1fae5);
                        border-radius:50%;
                        display:inline-flex;align-items:center;justify-content:center;
                        margin-bottom:16px;
                        box-shadow:0 0 0 8px rgba(16,185,129,0.08);
                    ">
                        <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
                            <path d="M5 13l4 4L19 7" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </div>
                    <p style="margin:0 0 6px;font-size:15px;color:#374151;font-family:'Outfit',sans-serif;">
                        Your complaint has been <strong>received</strong> and is now pending review.
                    </p>
                    <p style="margin:0;font-size:13px;color:#6b7280;font-family:'Outfit',sans-serif;">
                        Redirecting to submissions in 3 seconds...
                    </p>
                </div>
            `,
            timer: 3000,
            timerProgressBar: true,
            showConfirmButton: false,
            allowOutsideClick: false,
            allowEscapeKey: false,
            customClass: {
                popup: 'swal-custom-popup'
            },
            showClass: { popup: 'animate__animated animate__zoomIn' }
        }).then(() => {
            document.getElementById("complaintForm").reset();
            const previewContainer = document.getElementById("imagePreviewContainer");
            if (previewContainer) previewContainer.style.display = "none";
            window.location.href = "my.complaint.html";
        });

    } catch (err) {
        console.error(err);
        // Restore button on error too
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalHTML;
        Swal.fire({
            title: 'Submission Failed',
            text: 'Could not reach the server. Please check your connection and try again.',
            icon: 'error',
            confirmButtonColor: '#4f46e5'
        });
    }
});

// ==========================================================
// 📷 IMAGE PREVIEW HANDLER (AI OCR REMOVED)
// ==========================================================
let lastOcrText = "";
const descInput = document.getElementById("description");

const imageInput = document.getElementById("image");
if (imageInput) {
    imageInput.addEventListener("change", () => {
        const files = imageInput.files;
        if (files.length === 0) return;

        const file = files[0];
        
        // Show image preview thumbnail
        const reader = new FileReader();
        reader.onload = function (e) {
            const previewContainer = document.getElementById("imagePreviewContainer");
            const previewImage = document.getElementById("imagePreview");
            if (previewContainer && previewImage) {
                previewImage.src = e.target.result;
                previewContainer.style.display = "flex";
            }
        };
        reader.readAsDataURL(file);
    });
}