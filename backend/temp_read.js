const mongoose = require("mongoose");
const complaintSchema = new mongoose.Schema({}, { strict: false });
const Complaint = mongoose.model("Complaint", complaintSchema);

mongoose.connect("mongodb://127.0.0.1:27017/complaintDB")
.then(async () => {
    const data = await Complaint.find().sort({ _id: -1 }).limit(3);
    console.log(JSON.stringify(data, null, 2));
    mongoose.connection.close();
});
