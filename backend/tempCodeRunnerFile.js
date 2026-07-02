const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const mongoose = require("mongoose");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==========================
// 🔥 MONGODB CONNECTION
// ==========================
mongoose.connect("mongodb://127.0.0.1:27017/complaintDB")
.then(() => console.log("✅ MongoDB Connected"))
.catch(err => console.log("❌ DB Error:", err));

// ==========================
// 📦 SCHEMA
// ==========================
const complaintSchema = new mongoose.Schema({
  student_name: String,
  room: String,