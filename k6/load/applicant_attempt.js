import http from "k6/http";
import { check, sleep } from "k6";
import { headers, testOptions } from "./helpers/config.js";

export let options = testOptions;

// Applicant va exam data uchun foydalanuvchi maʼlumotlari
const applicantPayload = {
  education_type: "1",
  exam_type: "with_online_test",
  faculty: "2",
  speciality: "17",
  user_id: "20cb8ba4-e331-4f1b-b855-c070abd5896c",
  is_now_exam_time: true
};

// Setup: Bir marta applicant create qilinadi va exam data olinadi
export function setup() {
  // 1. Applicant yaratish
  const createApplicantUrl = "https://api.admin.utas.uz/create-applicant";
  const resApplicant = http.post(createApplicantUrl, JSON.stringify(applicantPayload), { headers });
  check(resApplicant, {
    "✅ Applicant creation successful": (r) => r.status === 200 || r.status === 201,
    "✅ Applicant JSON returned": (r) => r.body && r.body.length > 0,
  });

  let applicantApiKey;
  try {
    const resp = JSON.parse(resApplicant.body);
    applicantApiKey = resp.applicant_api_key;
    console.log(`✅ Applicant API Key: ${applicantApiKey}`);
  } catch (e) {
    console.error("❌ Error parsing Applicant response:", e);
  }
  if (!applicantApiKey) {
    throw new Error("Applicant API Key not obtained.");
  }

  // 2. Exam data olish
  const examDataUrl = `https://api.admin.utas.uz/applicant-exam-data/${applicantPayload.user_id}/${applicantApiKey}`;
  let retries = 5;
  let examData, collectionId;
  let lastResp;
  while (retries > 0) {
    lastResp = http.get(examDataUrl, { headers });
    check(lastResp, {
      "✅ GET exam data successful": (r) => r.status === 200,
      "✅ Exam data exists": (r) => r.body && r.body.length > 0 && !r.body.includes("no exam data found"),
    });
    if (lastResp.status === 200 && !lastResp.body.includes("no exam data found")) {
      try {
        const parsed = JSON.parse(lastResp.body);
        if (parsed.exam_data && parsed.exam_data.collection_data) {
          examData = parsed.exam_data;
          collectionId = parsed.exam_data.collection_data.id;
        //   console.log(`✅ Exam data received! Collection ID: ${collectionId}`);
          break;
        }
      } catch (e) {
        console.error("❌ Error parsing Exam data:", e);
      }
    }
    console.log("⏳ Exam data not ready, retrying...");
    sleep(5);
    retries--;
  }
  if (!examData || !collectionId) {
    throw new Error("Exam data or Collection ID not found. Aborting test.");
  }
//   console.log(`📢 Final Exam Data: ${lastResp.body}`);

  return {
    applicantApiKey, // Token sifatida ishlatiladi
    collectionId,
    applicantId: applicantPayload.user_id,
  };
}

// Default: Har bir iteratsiyada applicant test attempt yaratish soʻrovini yuboramiz
export default function (data) {
  if (!data.applicantApiKey) {
    console.log("⛔ Applicant API Key missing, aborting iteration.");
    return;
  }

  // Token sifatida applicantApiKey ishlatiladi
  const token = data.applicantApiKey;
  const attemptUrl = `https://api.admin.utas.uz/test-applicant-attempt/${token}`;

  // CreateApplicantTestAttempt endpointida backend keltirgan payload format:
  // {
  //    "applicant_id": "string",
  //    "collection_id": "string",
  //    "score": 0,
  //    "status": "started"
  // }
  // Shu yerda biz yuqoridagi formatda payload yuboramiz.
  const attemptPayload = {
    applicant_id: data.applicantId,
    collection_id: data.collectionId,
    score: 0,
    status: "started"
  };

//   console.log(`📢 Payload for CreateApplicantTestAttempt: ${JSON.stringify(attemptPayload)}`);

  const resAttempt = http.post(attemptUrl, JSON.stringify(attemptPayload), { headers });
  check(resAttempt, {
    "✅ CreateApplicantTestAttempt request successful": (r) => r.status === 201,
    "✅ JSON response received": (r) => r.body && r.body.length > 0,
  });

  let attemptResponse;
  try {
    attemptResponse = JSON.parse(resAttempt.body);
    // console.log("📢 Attempt response:", JSON.stringify(attemptResponse));
  } catch (e) {
    console.error("❌ Error parsing CreateApplicantTestAttempt response:", e);
  }

  // Agar backend kutilgan javob strukturasi bo'yicha attempt id qaytarsa,
  // uni resp.id yoki resp.applicant_attempt_id orqali olish kutiladi.
  const applicantAttemptId = attemptResponse && (attemptResponse.id || attemptResponse.applicant_attempt_id);
//   console.log(`✅ Created applicant test attempt: ${applicantAttemptId}`);
  
  if (!applicantAttemptId) {
    console.error("❌ Applicant Test Attempt ID not obtained.");
    return;
  }
  sleep(1);
}
