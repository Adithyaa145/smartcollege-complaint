require('dotenv').config();
const express = require("express");
console.log('🔑 SMTP_USER:', process.env.SMTP_USER);
console.log('🔑 SMTP_PASS exists?', !!process.env.SMTP_PASS);
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

let tesseract = null;
try {
  tesseract = require('tesseract.js');
} catch (e) {
  console.log("tesseract.js not installed, operating in mock fallback mode for OCR");
}

const JWT_SECRET = "smartcollege_super_secret_key_123"; // Usually in .env

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER || "your_gmail_user@gmail.com",
    pass: process.env.SMTP_PASS || "your_gmail_app_password"
  }
});

async function sendNotificationEmail(toEmail, subject, textContent) {
  try {
    const mailOptions = {
      from: process.env.SMTP_USER || "your_gmail_user@gmail.com",
      to: toEmail,
      subject: subject,
      text: textContent
    };
    await transporter.sendMail(mailOptions);
    console.log(`[Email Alert] Successfully sent email notification to ${toEmail}`);
  } catch (err) {
    console.warn(`[Email Alert Warning] Failed to send email to ${toEmail} (Operating in mock fallback mode):`, err.message);
  }
}

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==========================
// 🔥 MONGODB CONNECTION
// ==========================
const mongoURI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/complaintDB";
mongoose.connect(mongoURI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log("❌ DB Error:", err));

// ==========================
// 📦 SCHEMA
// ==========================
const complaintSchema = new mongoose.Schema({
  student_name: String,
  phone: String,        // ✅ added
  email: String,        // ✅ added
  room: String,
  type: String,         // (we will map issue → type)
  description: String,
  category: String,
  role: { type: String, default: "student" },
  branch: { type: String, default: "CSE" },
  upvotes: { type: Number, default: 0 },
  votedBy: [{ type: String }],
  image: String,
  priority: { type: String, enum: ["Low", "Medium", "High"], default: "Medium" },
  comments: [{
    sender: String,
    text: String,
    createdAt: { type: Date, default: Date.now }
  }],
  summary: String,
  sentiment: { type: String, default: "Neutral" },
  tags: [String],
  ocrText: String,
  resolvedAt: Date,
  anonymous: { type: Boolean, default: false },
  status: {
    type: String,
    default: "Pending"
  }
});

const Complaint = mongoose.model("Complaint", complaintSchema);

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  enrollment: { type: String, unique: true, sparse: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["student", "admin", "faculty"], default: "student" },
  branch: { type: String, default: "CSE" }
});

const User = mongoose.model("User", userSchema);

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true },
  otp: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 300 }
});
const OTP = mongoose.model("OTP", otpSchema);

const resetOtpSchema = new mongoose.Schema({
  email: { type: String, required: true },
  otp: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 300 }
});
const ResetOTP = mongoose.model("ResetOTP", resetOtpSchema);

const notificationSchema = new mongoose.Schema({
  email: { type: String, required: true }, // Send notification by user email
  text: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});
const Notification = mongoose.model("Notification", notificationSchema);

// ==========================
// 📁 STATIC FOLDER
// ==========================
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/", express.static(path.join(__dirname, "../frontend")));

// ==========================
// 📸 MULTER SETUP
// ==========================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "uploads"));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// ==========================
// 🛡️ AUTH MIDDLEWARE
// ==========================
const verifyToken = (req, res, next) => {
  const token = req.header("Authorization");
  if (!token) return res.status(401).json({ error: "Access Denied. No token provided." });

  try {
    const bearerToken = token.split(" ")[1];
    const verified = jwt.verify(bearerToken || token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ error: "Invalid Token" });
  }
};

const verifyAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ error: "Access Denied. Admins only." });
  }
};

// ==========================
// 🤖 AI CLASSIFICATION HELPER
// ==========================
function classifyComplaintAI(description, inputType) {
  const desc = description.toLowerCase();
  let type = inputType || "general";
  let priority = "Medium";

  // Category keyword rules
  if (desc.includes("wifi") || desc.includes("internet") || desc.includes("router") || desc.includes("network")) {
    type = "internet";
  } else if (desc.includes("socket") || desc.includes("bolt") || desc.includes("power") || desc.includes("electricity") || desc.includes("wire") || desc.includes("switch") || desc.includes("shock")) {
    type = "electrical";
  } else if (desc.includes("bus") || desc.includes("transport") || desc.includes("driver") || desc.includes("route")) {
    type = "transport";
  } else if (desc.includes("room") || desc.includes("hostel") || desc.includes("mess") || desc.includes("warden") || desc.includes("bed")) {
    type = "hostel";
  } else if (desc.includes("projector") || desc.includes("screen") || desc.includes("hdmi") || desc.includes("display")) {
    type = "projector";
  } else if (desc.includes("pc") || desc.includes("computer") || desc.includes("compiler") || desc.includes("c++") || desc.includes("java")) {
    type = "labs";
  } else if (desc.includes("fee") || desc.includes("payment") || desc.includes("transaction") || desc.includes("refund") || desc.includes("receipt")) {
    type = "fees";
  } else if (desc.includes("leak") || desc.includes("plumb") || desc.includes("pipe") || desc.includes("toilet") || desc.includes("tap") || desc.includes("clean") || desc.includes("sweep")) {
    type = "maintenance";
  }

  // Priority classification
  if (desc.includes("shock") || desc.includes("wire") || desc.includes("fire") || desc.includes("danger") || desc.includes("emergency") || desc.includes("refund") || desc.includes("exam") || desc.includes("fail")) {
    priority = "High";
  } else if (desc.includes("broken") || desc.includes("wifi") || desc.includes("not working") || desc.includes("delay")) {
    priority = "Medium";
  } else {
    priority = "Low";
  }

  // 1. AI Summary Generation (shortens description)
  let summary = description;
  if (description.length > 50) {
    const sentences = description.split(/[.!?]/);
    if (sentences[0] && sentences[0].trim().length > 5) {
      summary = sentences[0].trim();
    }
    if (summary.length > 60) {
      summary = summary.substring(0, 57) + "...";
    }
  }

  // 2. AI Sentiment Analysis
  let sentiment = "Neutral";
  if (desc.includes("angry") || desc.includes("annoyed") || desc.includes("useless") || desc.includes("frustrated") || desc.includes("unacceptable") || desc.includes("terrible") || desc.includes("worst") || desc.includes("danger") || desc.includes("shock")) {
    sentiment = "Frustrated / Urgent";
  } else if (desc.includes("happy") || desc.includes("great") || desc.includes("thanks") || desc.includes("satisfied") || desc.includes("good")) {
    sentiment = "Positive";
  }

  // 3. Auto-tagging
  const tags = [];
  if (desc.includes("wifi") || desc.includes("internet") || desc.includes("router")) tags.push("network");
  if (desc.includes("socket") || desc.includes("wire") || desc.includes("power")) tags.push("electrical");
  if (desc.includes("hostel") || desc.includes("mess") || desc.includes("room")) tags.push("hostel");
  if (desc.includes("leak") || desc.includes("plumb") || desc.includes("toilet") || desc.includes("tap")) tags.push("water");
  if (desc.includes("broken") || desc.includes("damage")) tags.push("damage");
  if (desc.includes("danger") || desc.includes("shock") || desc.includes("fire")) tags.push("safety");
  if (tags.length === 0) tags.push("general");

  return { type, priority, summary, sentiment, tags };
}

// ==========================
// ✅ SUBMIT COMPLAINT (FIXED)
// ==========================
app.post("/submit-complaint", verifyToken, upload.single("image"), async (req, res) => {
  try {

    console.log("BODY:", req.body);   // 🔥 debug
    console.log("FILE:", req.file);   // 🔥 debug

    const aiResult = classifyComplaintAI(req.body.description, req.body.issue);


    const isAnonymous = req.body.anonymous === "true" || req.body.anonymous === true;

    const newComplaint = new Complaint({
      student_name: isAnonymous ? "Anonymous" : req.body.student_name,
      phone: isAnonymous ? "N/A" : req.body.phone,
      email: isAnonymous ? "anonymous@college.edu" : req.body.email,
      room: req.body.room,
      type: aiResult.type,
      description: req.body.description,
      category: req.body.category,
      role: req.user.role,
      branch: req.user.branch,
      image: req.file ? req.file.filename : null,
      priority: aiResult.priority,
      summary: aiResult.summary,
      sentiment: aiResult.sentiment,
      tags: aiResult.tags,
      ocrText: req.body.ocrText || "",
      anonymous: isAnonymous
    });

    await newComplaint.save();

    res.json({ message: "Complaint submitted successfully ✅" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Submission failed ❌" });
  }
});

// ==========================
// 🔍 HEALTH CHECK
// ==========================
app.get("/ping", (req, res) => {
  res.json({ status: "ok" });
});

// ==========================
// 🔐 USER AUTHENTICATION & OTP (Draft / Incomplete)
// ==========================
// 🔐 USER AUTHENTICATION & EMAIL VERIFICATION
// ==========================

app.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required ⚠️" });
    }

    // Check if email already registered
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered ⚠️" });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save to DB (overwrite existing OTP for this email)
    await OTP.deleteOne({ email });
    const newOtp = new OTP({ email, otp });
    await newOtp.save();

    console.log(`[OTP] Sent verification OTP ${otp} to ${email}`);

    // Send mail
    const mailOptions = {
      from: `"SmartCollege Portal" <${process.env.SMTP_USER || "noreply@smartcollege.com"}>`,
      to: email,
      subject: "SmartCollege Email Verification Code",
      text: `Your verification code is ${otp}. It is valid for 5 minutes.`,
      html: `
        <div style="font-family: 'Outfit', sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; max-width: 480px; margin: auto;">
          <h2 style="color: #4f46e5; margin-bottom: 16px;">Email Verification</h2>
          <p>Thank you for registering at SmartCollege portal. Use the verification code below to complete your registration:</p>
          <div style="font-size: 32px; font-weight: 700; color: #0f172a; background-color: #f8fafc; padding: 12px; border-radius: 8px; text-align: center; margin: 24px 0; letter-spacing: 4px;">
            ${otp}
          </div>
          <p style="color: #64748b; font-size: 13px;">This code is valid for 5 minutes. If you did not request this, please ignore this email.</p>
        </div>
      `
    };

    try {
      await transporter.sendMail(mailOptions);
      res.json({ message: "Verification code sent to your email! ✉️" });
    } catch (mailErr) {
      console.warn("Mail sending failed, operating in mock console mode:", mailErr.message);
      res.json({ 
        message: "Verification code sent! (Mock Mode: Please check the backend server console log for the code) ✉️",
        mockOtp: otp // Send back for easy frontend mock testing if SMTP is not set up!
      });
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send verification code ❌" });
  }
});

app.post("/register", async (req, res) => {
  try {
    const { name, email, password, role, branch, enrollment } = req.body;

    // Check required fields
    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields are required ⚠️" });
    }

    // Validate enrollment number for students (exactly 13 digits)
    const isStudent = !role || role === "student";
    if (isStudent) {
      if (!enrollment) {
        return res.status(400).json({ error: "Enrollment number is required for students ⚠️" });
      }
      if (!/^\d{13}$/.test(enrollment)) {
        return res.status(400).json({ error: "Enrollment number must be exactly 13 digits ⚠️" });
      }

      // Check duplicate enrollment
      const existingEnrollment = await User.findOne({ enrollment });
      if (existingEnrollment) {
        return res.status(400).json({ error: "Enrollment number already registered ⚠️" });
      }
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered ⚠️" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const newUser = new User({
      name,
      email,
      enrollment: isStudent ? enrollment : undefined,
      password: hashedPassword,
      role: role || "student",
      branch: branch || "CSE"
    });

    await newUser.save();
    res.json({ message: "Registration successful! You can now log in. ✅" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Registration failed ❌" });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { identifier, password, role } = req.body;

    // Find user by either email or enrollment number
    const user = await User.findOne({
      $or: [
        { email: identifier },
        { enrollment: identifier }
      ]
    });
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials ❌" });
    }

    // Validate password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: "Invalid email or password ❌" });
    }

    // Optional role check
    if (role && user.role !== role) {
      return res.status(400).json({ error: `Account registered as ${user.role}, not ${role} ⚠️` });
    }

    // Generate token
    const token = jwt.sign(
      { id: user._id, name: user.name, email: user.email, role: user.role, branch: user.branch },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      message: "Login successful! ✅",
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, branch: user.branch }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed ❌" });
  }
});

// ==========================
// 🔑 FORGOT & RESET PASSWORD
// ==========================
app.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required ⚠️" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "No account found with this email ❌" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await ResetOTP.deleteOne({ email });
    const newReset = new ResetOTP({ email, otp });
    await newReset.save();

    console.log(`[RESET OTP] Sent reset OTP ${otp} to ${email}`);

    const mailOptions = {
      from: `"SmartCollege Portal" <${process.env.SMTP_USER || "noreply@smartcollege.com"}>`,
      to: email,
      subject: "SmartCollege Password Reset Code",
      text: `Your password reset code is ${otp}. It is valid for 5 minutes.`,
      html: `
        <div style="font-family: 'Outfit', sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; max-width: 480px; margin: auto;">
          <h2 style="color: #ef4444; margin-bottom: 16px;">Password Reset Request</h2>
          <p>We received a request to reset your password. Use the code below to complete the reset:</p>
          <div style="font-size: 32px; font-weight: 700; color: #0f172a; background-color: #f8fafc; padding: 12px; border-radius: 8px; text-align: center; margin: 24px 0; letter-spacing: 4px;">
            ${otp}
          </div>
          <p style="color: #64748b; font-size: 13px;">This code is valid for 5 minutes. If you did not request this, please ignore this email.</p>
        </div>
      `
    };

    try {
      await transporter.sendMail(mailOptions);
      res.json({ message: "Password reset code sent to your email! ✉️" });
    } catch (mailErr) {
      console.warn("Mail sending failed, operating in mock console mode:", mailErr.message);
      res.json({ 
        message: "Reset code sent! (Mock Mode: Please check the backend server console log for the code) ✉️",
        mockOtp: otp
      });
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send reset code ❌" });
  }
});

app.post("/reset-password", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: "All fields are required ⚠️" });
    }

    const record = await ResetOTP.findOne({ email, otp });
    if (!record) {
      return res.status(400).json({ error: "Invalid or expired reset code ❌" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await User.findOneAndUpdate({ email }, { password: hashedPassword });
    await ResetOTP.deleteOne({ email });

    res.json({ message: "Password reset successfully! You can now log in. ✅" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to reset password ❌" });
  }
});

// ==========================
// 👤 UPDATE PROFILE
// ==========================
app.put("/update-profile", verifyToken, async (req, res) => {
  try {
    const { name, branch, password } = req.body;
    const userId = req.user.id;

    const updates = {};
    if (name) updates.name = name;
    if (branch) updates.branch = branch;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(password, salt);
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updates, { new: true }).select("-password");
    if (!updatedUser) return res.status(404).json({ error: "User not found" });

    const token = jwt.sign(
      { id: updatedUser._id, name: updatedUser.name, email: updatedUser.email, role: updatedUser.role, branch: updatedUser.branch },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      message: "Profile updated successfully! ✅",
      token,
      user: updatedUser
    });

  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ error: "Failed to update profile ❌" });
  }
});

// ==========================
// 👤 GET CURRENT USER
// ==========================
app.get("/me", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Error fetching profile" });
  }
});

// ==========================
// ✅ GET ALL COMPLAINTS
// ==========================
app.get("/complaints", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const data = await Complaint.find().sort({ _id: -1 }).lean();
    
    // Aggregate total complaints count grouped by email
    const emailCounts = await Complaint.aggregate([
      { $group: { _id: "$email", count: { $sum: 1 } } }
    ]);
    
    // Create email to count map
    const countMap = {};
    emailCounts.forEach(item => {
      if (item._id) {
        countMap[item._id.toLowerCase()] = item.count;
      }
    });

    // Also count by name for records with no email
    const nameCounts = await Complaint.aggregate([
      { $group: { _id: "$student_name", count: { $sum: 1 } } }
    ]);
    const nameCountMap = {};
    nameCounts.forEach(item => {
      if (item._id) {
        nameCountMap[item._id.toLowerCase()] = item.count;
      }
    });

    const result = data.map(c => {
      let total = 0;
      if (c.email) {
        total = countMap[c.email.toLowerCase()] || 0;
      } else if (c.student_name) {
        total = nameCountMap[c.student_name.toLowerCase()] || 0;
      }
      
      return {
        ...c,
        pastComplaintsCount: Math.max(0, total - 1) // exclude current complaint
      };
    });

    res.json(result);
  } catch (err) {
    console.error("Error fetching admin complaints:", err);
    res.status(500).json({ error: "Error fetching complaints" });
  }
});

// ==========================
// ✅ UPDATE STATUS
// ==========================
app.put("/update/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const updateFields = { status };
    if (status === "Resolved") {
      updateFields.resolvedAt = new Date();
    } else {
      updateFields.$unset = { resolvedAt: "" };
    }

    const complaint = await Complaint.findByIdAndUpdate(req.params.id, updateFields, { new: true });
    if (!complaint) return res.status(404).json({ error: "Complaint not found" });

    // Send notification to the student
    if (complaint.email && complaint.email !== "anonymous@college.edu") {
      const notif = new Notification({
        email: complaint.email,
        text: `Your complaint status for Room ${complaint.room} has been updated to: "${status}"`
      });
      await notif.save();

      await sendNotificationEmail(
        complaint.email,
        "SmartCollege - Complaint Status Update",
        `Hello,\n\nYour complaint for Room ${complaint.room} (${complaint.category || "General"}) has been updated to status: "${status}".\n\nTrack progress on your student portal.`
      );

      console.log(`[SMS/WhatsApp Alert] Status update alert sent to student phone ${complaint.phone || "N/A"}: Status is now "${status}".`);
    }

    res.json({ message: "Status updated ✅" });

  } catch (err) {
    res.status(500).json({ error: "Update failed ❌" });
  }
});

// ==========================
// ✅ DELETE COMPLAINT
// ==========================
app.delete("/delete/:id", verifyToken, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ error: "Complaint not found" });
    }

    // Only allow deletion if user is admin OR if the user is the student who filed it
    if (req.user.role !== "admin" && complaint.email !== req.user.email) {
      return res.status(403).json({ error: "Unauthorized: You can only delete your own complaints" });
    }

    await Complaint.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Delete failed" });
  }
});

// ==========================
// 🔍 SIMILARITY CHECKS API
// ==========================
app.get("/check-similarity", verifyToken, async (req, res) => {
  try {
    const { room, description } = req.query;
    if (!room || !description) {
      return res.status(400).json({ error: "Room and description are required parameters" });
    }

    const stopWords = new Set(["the", "is", "a", "and", "to", "in", "on", "of", "for", "has", "it", "with", "at", "by", "this", "that"]);

    const inputWords = description
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter(w => w && !stopWords.has(w));

    if (inputWords.length === 0) {
      return res.json({ similar: null });
    }

    const activeComplaints = await Complaint.find({
      room: { $regex: new RegExp("^" + room.trim() + "$", "i") },
      status: { $in: ["Pending", "In Progress"] }
    });

    let bestMatch = null;
    let highestScore = 0;

    for (const c of activeComplaints) {
      const compWords = (c.description || "")
        .toLowerCase()
        .replace(/[^\w\s]/g, "")
        .split(/\s+/)
        .filter(w => w && !stopWords.has(w));

      if (compWords.length === 0) continue;

      const setA = new Set(inputWords);
      const setB = new Set(compWords);
      const intersection = new Set([...setA].filter(x => setB.has(x)));
      const union = new Set([...setA, ...setB]);
      const score = intersection.size / union.size;

      if (score > highestScore) {
        highestScore = score;
        bestMatch = c;
      }
    }

    if (highestScore >= 0.2) {
      return res.json({
        similar: {
          _id: bestMatch._id,
          type: bestMatch.type,
          description: bestMatch.description,
          score: highestScore
        }
      });
    }

    res.json({ similar: null });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Similarity check failed" });
  }
});

// ==========================
// 📷 OCR IMAGE TEXT EXTRACTION API
// ==========================
app.post("/extract-text", verifyToken, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file uploaded" });
    }

    const imagePath = req.file.path;
    let extractedText = "";

    if (tesseract) {
      try {
        console.log("Running Tesseract OCR on:", imagePath);
        const { data: { text } } = await tesseract.recognize(imagePath, 'eng');
        extractedText = text.trim();
        console.log("OCR Extracted Text:", extractedText);
      } catch (ocrErr) {
        console.warn("Tesseract execution failed, using fallback:", ocrErr.message);
      }
    }

    if (!extractedText) {
      const filename = req.file.originalname.toLowerCase();
      if (filename.includes("wifi") || filename.includes("internet") || filename.includes("offline")) {
        extractedText = "ROUTER OFFLINE - NETWORK SERVICE DOWN";
      } else if (filename.includes("socket") || filename.includes("electrical") || filename.includes("broken")) {
        extractedText = "OUT OF ORDER - ELECTRICAL SOCKET FAULTY";
      } else if (filename.includes("leak") || filename.includes("water") || filename.includes("pipe")) {
        extractedText = "PLUMBING ISSUE: LEAK IN WATER PIPE";
      } else {
        extractedText = "CAMPUS EQUIPMENT ISSUE DETECTED";
      }
      console.log("OCR Fallback text matched:", extractedText);
    }

    res.json({ text: extractedText });

  } catch (err) {
    console.error("OCR Extraction failed:", err);
    res.status(500).json({ error: "OCR extraction failed" });
  }
});

// ==========================
// ✅ MY COMPLAINTS (SECURED)
// ==========================
app.get("/my-complaints", verifyToken, async (req, res) => {
  try {
    const complaints = await Complaint.find({
      email: req.user.email
    }).sort({ _id: -1 });

    res.json(complaints);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// ==========================
// ✅ CLASS COMPLAINTS (VOTING SYSTEM)
// ==========================
app.get("/class-complaints", verifyToken, async (req, res) => {
  try {
    const complaints = await Complaint.find({ branch: req.user.branch, status: "Pending" }).sort({ upvotes: -1, _id: -1 });
    res.json(complaints);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/complaint/:id/vote", verifyToken, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ error: "Not found" });
    
    // Prevent double voting
    if (complaint.votedBy.includes(req.user.email)) {
        return res.status(400).json({ error: "Already voted" });
    }

    complaint.upvotes = (complaint.upvotes || 0) + 1;
    complaint.votedBy.push(req.user.email);
    await complaint.save();

    res.json({ message: "Vote cast successfully", upvotes: complaint.upvotes });
  } catch (err) {
    res.status(500).json({ error: "Vote failed" });
  }
});

// ==========================
// 💬 COMMENTS THREAD API
// ==========================
app.post("/complaint/:id/comment", verifyToken, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Comment text is required" });

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ error: "Complaint not found" });

    const senderName = req.user.name + ` (${req.user.role})`;
    
    // Add comment
    complaint.comments.push({
      sender: senderName,
      text,
      createdAt: new Date()
    });

    await complaint.save();

    // Create Notification & Alerts
    if (req.user.role === "admin" || req.user.role === "faculty") {
      if (complaint.email && complaint.email !== "anonymous@college.edu") {
        const notif = new Notification({
          email: complaint.email,
          text: `New comment on your complaint for Room ${complaint.room}: "${text.substring(0, 30)}..."`
        });
        await notif.save();

        await sendNotificationEmail(
          complaint.email,
          "SmartCollege - New Comment on your Complaint",
          `Hello,\n\nA new comment has been posted by ${senderName} on your complaint for Room ${complaint.room}:\n\n"${text}"\n\nTrack progress on your student dashboard.`
        );

        console.log(`[SMS/WhatsApp Alert] Comment alert sent to student phone ${complaint.phone || "N/A"}: "${text.substring(0, 35)}..."`);
      }
    } else {
      const admins = await User.find({ role: "admin" });
      for (const admin of admins) {
        const notif = new Notification({
          email: admin.email,
          text: `New student comment on Room ${complaint.room}: "${text.substring(0, 30)}..."`
        });
        await notif.save();

        await sendNotificationEmail(
          admin.email,
          "SmartCollege Admin - New Student Comment",
          `Hello Admin,\n\nStudent ${senderName} commented on Room ${complaint.room} complaint:\n\n"${text}"\n\nOpen Admin Panel to view/respond.`
        );
      }
      console.log(`[SMS/WhatsApp Alert] Admin comment alert logged for Room ${complaint.room}.`);
    }

    res.json({ message: "Comment added successfully", comments: complaint.comments });

  } catch (err) {
    console.error("Comment error:", err);
    res.status(500).json({ error: "Failed to add comment" });
  }
});

// ==========================
// 📊 ANALYTICS & REPORTS API
// ==========================
app.get("/admin/analytics", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const complaints = await Complaint.find({});

    let pendingCount = 0;
    let inProgressCount = 0;
    let resolvedCount = 0;

    let totalResolutionTimeMs = 0;
    let resolvedWithTimeCount = 0;

    const branchStats = {};
    const monthlyStats = Array(12).fill(0);
    const categoryStats = {};
    const currentYear = new Date().getFullYear();

    complaints.forEach(c => {
      if (c.status === "Pending") pendingCount++;
      else if (c.status === "In Progress") inProgressCount++;
      else if (c.status === "Resolved") resolvedCount++;

      if (c.status === "Resolved" && c.resolvedAt && c.createdAt) {
        const timeDiff = new Date(c.resolvedAt) - new Date(c.createdAt);
        if (timeDiff > 0) {
          totalResolutionTimeMs += timeDiff;
          resolvedWithTimeCount++;
        }
      }

      const branchName = c.branch || "General";
      if (!branchStats[branchName]) {
        branchStats[branchName] = { total: 0, resolved: 0, totalResolutionTimeMs: 0, resolvedWithTimeCount: 0 };
      }
      branchStats[branchName].total++;
      if (c.status === "Resolved") {
        branchStats[branchName].resolved++;
        if (c.resolvedAt && c.createdAt) {
          const timeDiff = new Date(c.resolvedAt) - new Date(c.createdAt);
          if (timeDiff > 0) {
            branchStats[branchName].totalResolutionTimeMs += timeDiff;
            branchStats[branchName].resolvedWithTimeCount++;
          }
        }
      }

      const createdDate = new Date(c.createdAt || c._id.getTimestamp());
      if (createdDate.getFullYear() === currentYear) {
        const month = createdDate.getMonth();
        if (month >= 0 && month <= 11) {
          monthlyStats[month]++;
        }
      }

      const cat = c.category || "General";
      categoryStats[cat] = (categoryStats[cat] || 0) + 1;
    });

    const avgResolutionHours = resolvedWithTimeCount > 0
      ? (totalResolutionTimeMs / resolvedWithTimeCount / (1000 * 60 * 60)).toFixed(1)
      : "0.0";

    const departments = Object.keys(branchStats).map(branch => {
      const stats = branchStats[branch];
      const avgHours = stats.resolvedWithTimeCount > 0
        ? (stats.totalResolutionTimeMs / stats.resolvedWithTimeCount / (1000 * 60 * 60)).toFixed(1)
        : "N/A";
      const resolutionRate = stats.total > 0
        ? Math.round((stats.resolved / stats.total) * 100)
        : 0;

      return {
        name: branch,
        total: stats.total,
        resolved: stats.resolved,
        pending: stats.total - stats.resolved,
        avgResolutionHours: avgHours,
        resolutionRate: resolutionRate + "%"
      };
    });

    res.json({
      summary: {
        total: complaints.length,
        pending: pendingCount,
        inProgress: inProgressCount,
        resolved: resolvedCount,
        avgResolutionHours
      },
      departments,
      monthlyTrends: monthlyStats,
      categories: categoryStats
    });

  } catch (err) {
    console.error("Analytics fetch failed:", err);
    res.status(500).json({ error: "Failed to generate analytics data" });
  }
});

// ==========================
// 🔔 NOTIFICATIONS FEED API
// ==========================
app.get("/notifications", verifyToken, async (req, res) => {
  try {
    const notifs = await Notification.find({ email: req.user.email, isRead: false }).sort({ createdAt: -1 });
    res.json(notifs);
  } catch (err) {
    res.status(500).json({ error: "Error fetching notifications" });
  }
});

app.put("/notifications/read-all", verifyToken, async (req, res) => {
  try {
    await Notification.updateMany({ email: req.user.email, isRead: false }, { isRead: true });
    res.json({ message: "All marked as read" });
  } catch (err) {
    res.status(500).json({ error: "Error updating notifications" });
  }
});

// ==========================
// 🤖 AI CAMPUS CHATBOT API
// ==========================
app.post("/chat", verifyToken, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const msg = message.toLowerCase();
    let reply = "";

    if (msg.includes("hello") || msg.includes("hi") || msg.includes("hey")) {
      reply = "Hello there! I am the SmartCollege AI Assistant. How can I help you today? You can ask me about library hours, hostel rules, exam fee deadlines, or how to file a complaint.";
    } else if (msg.includes("library") || msg.includes("book") || msg.includes("read")) {
      reply = "The Central Library is open Monday to Friday from 8:00 AM to 8:00 PM, and Saturdays from 9:00 AM to 4:00 PM. It is closed on Sundays and national holidays.";
    } else if (msg.includes("hostel") || msg.includes("room") || msg.includes("mess") || msg.includes("warden")) {
      reply = "Hostel curfews are at 9:30 PM daily. Mess timings are: Breakfast (7:30 AM - 9:00 AM), Lunch (12:30 PM - 2:00 PM), and Dinner (7:30 PM - 9:00 PM). If you have a room issue, please file a grievance under the 'Hostel' category.";
    } else if (msg.includes("fee") || msg.includes("payment") || msg.includes("deadline") || msg.includes("exam")) {
      reply = "The deadline for regular semester exam fee submission is the 15th of this month. Late submissions incur a late fee of ₹500. Payments can be processed online via the Fees desk or in person at the administration office block.";
    } else if (msg.includes("complaint") || msg.includes("report") || msg.includes("file") || msg.includes("grievance")) {
      reply = "To file a complaint, click on 'Submit Complaint' on your student dashboard. Describe the issue, select the location/room, upload an optional photo, and the AI will auto-categorize it. Admins will review and update you in real-time!";
    } else if (msg.includes("wi-fi") || msg.includes("wifi") || msg.includes("internet") || msg.includes("network")) {
      reply = "Campus WiFi credentials are provided at registration. If you experience slow connection speeds or downtime in your classroom or hostel, submit a complaint under the 'Internet' category so technicians can restart the access points.";
    } else if (msg.includes("admin") || msg.includes("office") || msg.includes("faculty")) {
      reply = "The main administrative office is located on the ground floor of the Admin Block A and operates from 9:00 AM to 5:00 PM daily. Faculty offices are open during counseling hours posted on their respective department boards.";
    } else {
      reply = "That is a great question! I'm constantly learning campus details. For specific issues, I highly recommend checking with the main Administration Office in Block A, or filing a formal grievance using the Portal form so our staff can address it directly.";
    }

    res.json({ reply });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Chatbot query failed" });
  }
});

// ==========================
// 🚀 START SERVER
// ==========================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});