import http from "k6/http";
import { check, sleep } from "k6";
import { headers, testOptions } from "./helpers/config.js";

export let options = testOptions;

// User data
const payload = {
  education_type: "1",
  exam_type: "with_online_test",
  faculty: "2",
  speciality: "17",
  user_id: "ec1469b7-9850-4de6-b603-a8ef4293a70d",
  is_now_exam_time: true
};

// 1. `setup()` - One-time `POST` request (runs only once)
export function setup() {
  const createApplicantUrl = "https://api.admin.utas.uz/create-applicant";
  const res = http.post(createApplicantUrl, JSON.stringify(payload), { headers });

  check(res, {
    "POST request status is 200 or 201": (r) => r.status === 200 || r.status === 201,
    "POST response body is not empty": (r) => r.body && r.body.length > 0,
  });

  let applicantApiKey = null;

  if (res.status === 200 || res.status === 201) {
    try {
      const responseBody = JSON.parse(res.body);
      if (responseBody && responseBody.applicant_api_key) {
        applicantApiKey = responseBody.applicant_api_key;
        // console.log(`✅ Applicant API Key: ${applicantApiKey}`);
      } else {
        // console.log("⚠️ Applicant API Key not found.");
      }
    } catch (e) {
      // console.error("❌ Error parsing JSON:", e);
    }
  }

  return { applicantApiKey };
}

// 2. `default()` - Send `GET` request in each iteration
export default function (data) {
  if (!data.applicantApiKey) {
    // console.log("⛔ No Applicant API Key, `GET` request will not be sent.");
    return;
  }

  const getUrl = `https://api.admin.utas.uz/applicant-exam-data/${payload.user_id}/${data.applicantApiKey}`;
  const res = http.get(getUrl, { headers });

  check(res, {
    "GET request status is 200": (r) => r.status === 200,
    "GET response body is not empty": (r) => r.body && r.body.length > 0,
  });

//   console.log(`📢 GET Response Body: ${res.body}`);

  sleep(5);
}