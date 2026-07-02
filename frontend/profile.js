const params = new URLSearchParams(window.location.search);
const pageType = params.get("type");

const select = document.getElementById("type");
const roomLabel = document.getElementById("roomLabel");
const title = document.getElementById("title");

let issues = [];

if(pageType === "classroom"){
  title.innerText = "Classroom Complaint";
  roomLabel.innerText = "Classroom Number";
  issues = ["Projector issue","Bench broken","Fan issue"];
}

else if(pageType === "hostel"){
  title.innerText = "Hostel Complaint";
  roomLabel.innerText = "Hostel Room Number";
  issues = ["Water problem","Cleaning issue","WiFi issue"];
}

else if(pageType === "lab"){
  title.innerText = "Lab Complaint";
  roomLabel.innerText = "Lab Number";
  issues = ["IDE not installed","Compiler issue","Internet issue"];
}

select.innerHTML = '<option value="">Select Issue</option>';

issues.forEach(issue => {
  const option = document.createElement("option");
  option.textContent = issue;
  select.appendChild(option);
});