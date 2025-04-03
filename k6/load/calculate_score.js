import http from "k6/http";
import { check, sleep } from "k6";
import { headers, testOptions } from "./helpers/config.js";
import { uuidv4 } from "https://jslib.k6.io/k6-utils/1.2.0/index.js";

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

// 1️⃣ **setup()** - Create Applicant, get exam data and generate test questions (only once)
export function setup() {
  // Create Applicant
  const createApplicantUrl = "https://api.admin.utas.uz/create-applicant";
  const resApplicant = http.post(createApplicantUrl, JSON.stringify(payload), { headers });
  check(resApplicant, {
    "✅ Applicant creation successful": (r) => r.status === 200 || r.status === 201,
    "✅ JSON returned for Applicant": (r) => r.body && r.body.length > 0,
  });

  let applicantApiKey = null;
  try {
    const responseBody = JSON.parse(resApplicant.body);
    if (responseBody && responseBody.applicant_api_key) {
      applicantApiKey = responseBody.applicant_api_key;
      console.log(`✅ Applicant API Key: ${applicantApiKey}`);
    } else {
      console.log("⚠️ Applicant API Key not found.");
    }
  } catch (e) {
    console.error("❌ Error parsing Applicant response JSON:", e);
  }

  if (!applicantApiKey) {
    throw new Error("Applicant API Key not found.");
  }

  // Get Exam data (GET)
  const getUrl = `https://api.admin.utas.uz/applicant-exam-data/${payload.user_id}/${applicantApiKey}`;
  let retries = 5;
  let examData = null;
  let collectionId = null;
  let lastGetResponse = null;
  while (retries > 0) {
    lastGetResponse = http.get(getUrl, { headers });
    check(lastGetResponse, {
      "✅ GET request successful": (r) => r.status === 200,
      "✅ Exam data exists": (r) => r.body && r.body.length > 0 && !r.body.includes("no exam data found"),
    });
    if (lastGetResponse.status === 200 && !lastGetResponse.body.includes("no exam data found")) {
      try {
        const parsedBody = JSON.parse(lastGetResponse.body);
        if (parsedBody.exam_data && parsedBody.exam_data.collection_data) {
          examData = parsedBody.exam_data;
          collectionId = parsedBody.exam_data.collection_data.id;
          console.log(`✅ Exam data received! Collection ID: ${collectionId}`);
          break;
        } else {
          console.log("⚠️ Collection ID not found.");
        }
      } catch (e) {
        console.error("❌ Error parsing Exam data JSON:", e);
      }
    }
    console.log("⏳ Exam data not ready yet, retrying...");
    sleep(5);
    retries--;
  }

  if (!examData || !collectionId) {
    throw new Error("Exam data or Collection ID not found. Stopping test.");
  }

  console.log(`📢 Last GET Response Body: ${lastGetResponse.body}`);

  // Generate test questions (POST)
  const testGenUrl = `https://api.admin.utas.uz/test-question/generate/${applicantApiKey}`;
  const testPayload = {
    exam_data: examData,
    collection_id: collectionId,
  };
  const resTestGen = http.post(testGenUrl, JSON.stringify(testPayload), { headers });
  check(resTestGen, {
    "✅ Test generation request successful": (r) => r.status === 200 || r.status === 201,
  });
  console.log(`📢 Test generation result: ${resTestGen.body}`);

  // Here we simulate the answer structure from test results.
  // For example, test generation response might be in this format:
  // { questions: [ { collection_item_id, question_id, answer_id }, ... ] }
  // If you know the actual response structure, you can parse it here.
  let testQuestions = [];
  try {
    const parsedTest = JSON.parse(resTestGen.body);
    if (parsedTest.questions && Array.isArray(parsedTest.questions)) {
      testQuestions = parsedTest.questions;
    } else {
      // If test questions field is not available, simulate with dummy data:
      for (let i = 0; i < 10; i++) {
        testQuestions.push({
          collection_item_id: `ci-${i}`,
          question_id: `q-${i}`,
          answer_id: `a-${i}`
        });
      }
    }
  } catch (e) {
    console.error("❌ Error parsing test generation response, using dummy data:", e);
    for (let i = 0; i < 10; i++) {
      testQuestions.push({
        collection_item_id: `ci-${i}`,
        question_id: `q-${i}`,
        answer_id: `a-${i}`
      });
    }
  }

  return {
    applicantApiKey,
    collectionId,
    testQuestions, // List of questions (answer simulation)
    applicantId: payload.user_id, // Applicant ID from payload
  };
}

// 2️⃣ **default()** - Send multiple POST requests to calculate-score API in each iteration
export default function (data) {
  if (!data.applicantApiKey) {
    console.log("⛔ No Applicant API Key, calculate-score request will not be sent.");
    return;
  }

  // CalculateScore API URL, using applicantApiKey as token
  const calcScoreUrl = `https://api.admin.utas.uz/test-applicant-attempt/calculate-score/${data.applicantApiKey}`;

  // Send multiple calculate-score requests using a for loop.
  // For example, each VU sends 5 requests.
  const iterations = 5;
  for (let i = 0; i < iterations; i++) {
    // Generate new applicant_attempt_id (UUID) for each request
    const applicantAttemptId = uuidv4();

    // Iterate through test questions list to form answer objects
    let items = [];
    data.testQuestions.forEach((q) => {
      items.push({
        collection_item_id: q.collection_item_id,
        question_answer_ids: [
          {
            question_id: q.question_id,
            answer_id: q.answer_id,
          },
        ],
      });
    });

    // CalculateScore request payload
    const calcPayload = {
      applicant_attempt_id: applicantAttemptId,
      applicant_id: data.applicantId,
      collection_id: data.collectionId,
      items: items,
    };

    const resCalc = http.post(calcScoreUrl, JSON.stringify(calcPayload), { headers });
    check(resCalc, {
      "✅ CalculateScore request successful": (r) => r.status === 200 || r.status === 201,
      "✅ Answer selected": (r) => r.body && r.body.length > 0,
    });
    console.log(`📢 CalculateScore iteration ${i + 1} result: ${resCalc.body}`);
    // Wait a bit between each request (1 second)
    sleep(1);
  }
}