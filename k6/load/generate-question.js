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

// 1️⃣ **`setup()`** - Create Applicant (runs only once)
export function setup() {
  const createApplicantUrl = "https://api.admin.utas.uz/create-applicant";
  const res = http.post(createApplicantUrl, JSON.stringify(payload), { headers });

  check(res, {
    "✅ POST request successful": (r) => r.status === 200 || r.status === 201,
    "✅ JSON returned": (r) => r.body && r.body.length > 0,
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

// 2️⃣ **`default()`** - Sends GET and POST requests in each iteration
export default function (data) {
  if (!data.applicantApiKey) {
    // console.log("⛔ No Applicant API Key, request won't be sent.");
    return;
  }

  const getUrl = `https://api.admin.utas.uz/applicant-exam-data/${payload.user_id}/${data.applicantApiKey}`;
  
  // 3️⃣ **GET request to fetch exam data**
  let retries = 5;
  let examData = null;
  let collectionId = null;

  while (retries > 0) {
    const res = http.get(getUrl, { headers });

    check(res, {
      "✅ GET request successful": (r) => r.status === 200,
      "✅ Exam data exists": (r) => r.body && r.body.length > 0 && !r.body.includes("no exam data found"),
    });

    if (res.status === 200 && !res.body.includes("no exam data found")) {
      try {
        const parsedBody = JSON.parse(res.body);
        if (parsedBody.exam_data && parsedBody.exam_data.collection_data) {
          examData = parsedBody.exam_data;
          collectionId = parsedBody.exam_data.collection_data.id;
          // console.log(`✅ Exam data received! Collection ID: ${collectionId}`);
          break;
        } else {
          console.log("⚠️ Collection ID not found.");
        }
      } catch (e) {
        console.error("❌ Error parsing exam data JSON:", e);
      }
    }

    console.log("⏳ Exam data not ready yet, retrying...");
    sleep(5); // Wait for 5 seconds
    retries--;
  }

  if (!examData || !collectionId) {
    console.log("❌ Exam data or Collection ID not found. Test generation cancelled.");
    return;
  }

  // 4️⃣ **POST request to generate test questions**
  const testGenUrl = `https://api.admin.utas.uz/test-question/generate/${data.applicantApiKey}`;
  const testPayload = {
    exam_data: examData,
    collection_id: collectionId,
  };

  const testRes = http.post(testGenUrl, JSON.stringify(testPayload), { headers });

  check(testRes, {
    "✅ Test generation request successful": (r) => r.status === 200 || r.status === 201,
  });

//   console.log(`📢 Test generation result: ${testRes.body}`);
  
  sleep(1);
}