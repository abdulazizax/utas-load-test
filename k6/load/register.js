import http from "k6/http";
import { check, sleep } from "k6";
import { headers, testOptions } from "./helpers/config.js";

export let options = testOptions;

const url = "https://api.admin.utas.uz/new-auth/registry";

// Function to generate a unique phone number
function generateUniquePhoneNumber() {
  const randomSuffix = Math.floor(1000000 + Math.random() * 9000000); // 7-digit random number
  return `+99891${randomSuffix}`; // Uzbek phone number format
}

export default function () {
  const uniquePhone = generateUniquePhoneNumber();

  const payload = JSON.stringify({
    birth_date: "2003-01-20",
    phone: uniquePhone, // Assign the unique phone number
    document_type: "passport",
    document: "AC2541416",
  });

  const requestHeaders = {
    "Content-Type": "application/json",
  };

  const res = http.post(url, payload, { headers: requestHeaders });

  check(res, {
    "status is 200 or 201": (r) => r.status === 200 || r.status === 201,
    "response body is not empty": (r) => r.body && r.body.length > 0,
  });

  //console.log(`Request Phone: ${uniquePhone}`);
  //console.log(`Response: ${res.body}`);

  sleep(1); 
}
