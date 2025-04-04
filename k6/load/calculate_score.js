import http from "k6/http";
import { check, sleep } from "k6";
import { headers, testOptions } from "./helpers/config.js";
import { uuidv4 } from "https://jslib.k6.io/k6-utils/1.2.0/index.js";

export let options = testOptions;

// 1. Applicant yaratish va exam data olish uchun foydalanuvchi maʼlumotlari
const applicantPayload = {
  education_type: "1",
  exam_type: "with_online_test",
  faculty: "2",
  speciality: "17",
  user_id: "20cb8ba4-e331-4f1b-b855-c070abd5896c",
  is_now_exam_time: true
};

export function setup() {
  // --- Applicant yaratish ---
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
  
  // --- Exam data olish ---
  const examDataUrl = `https://api.admin.utas.uz/applicant-exam-data/${applicantPayload.user_id}/${applicantApiKey}`;
  let retries = 5;
  let examData, collectionId;
  let lastResp;
  while (retries > 0) {
    lastResp = http.get(examDataUrl, { headers });
    check(lastResp, {
      "✅ GET exam data successful": (r) => r.status === 200,
      "✅ Exam data exists": (r) =>
        r.body && r.body.length > 0 && !r.body.includes("no exam data found"),
    });
    if (lastResp.status === 200 && !lastResp.body.includes("no exam data found")) {
      try {
        const parsed = JSON.parse(lastResp.body);
        if (parsed.exam_data && parsed.exam_data.collection_data) {
          examData = parsed.exam_data;
          collectionId = parsed.exam_data.collection_data.id;
          // console.log(`✅ Exam data received! Collection ID: ${collectionId}`);
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
  // console.log(`📢 Final Exam Data: ${lastResp.body}`);
  
  // --- Yangi Applicant Test Attempt yaratish ---
  // CreateApplicantTestAttempt endpoint: POST /test-applicant-attempt/{token}
  const attemptUrl = `https://api.admin.utas.uz/test-applicant-attempt/${applicantApiKey}`;

  const attemptPayload = {
    applicant_id: applicantPayload.user_id,
    collection_id: collectionId,
    score: 0,
    status: "started"
  };
  // console.log(`📢 Payload for CreateApplicantTestAttempt: ${JSON.stringify(attemptPayload)}`);
  const resAttempt = http.post(attemptUrl, JSON.stringify(attemptPayload), { headers });
  check(resAttempt, {
    "✅ CreateApplicantTestAttempt request successful": (r) => r.status === 201,
    "✅ Attempt JSON returned": (r) => r.body && r.body.length > 0,
  });
  let attemptResponse;
  try {
    attemptResponse = JSON.parse(resAttempt.body);
    // console.log("📢 Attempt response:", JSON.stringify(attemptResponse));
  } catch (e) {
    console.error("❌ Error parsing Attempt response:", e);
  }
  // Agar backend javobida attempt id "id" yoki "applicant_attempt_id" orqali qaytarilsa:
  const applicantAttemptId = attemptResponse && (attemptResponse.id || attemptResponse.applicant_attempt_id);
  // console.log(`✅ Created applicant test attempt: ${applicantAttemptId}`);
  if (!applicantAttemptId) {
    throw new Error("Applicant Test Attempt ID not obtained.");
  }
  
  // --- Test questions generate qilish ---
  // POST /test-question/generate/{token}
  const testGenUrl = `https://api.admin.utas.uz/test-question/generate/${applicantApiKey}`;
  // Test generation uchun payload: exam_data va collection_id yuboriladi.
  const testGenPayload = {
    exam_data: examData,
    collection_id: collectionId,
  };
  const resTestGen = http.post(testGenUrl, JSON.stringify(testGenPayload), { headers });
  check(resTestGen, {
    "✅ Test generation request successful": (r) => r.status === 200 || r.status === 201,
  });
  // console.log(`📢 Test generation result: ${resTestGen.body}`);
  let generatedQuestions = [];
  try {
    const parsedGen = JSON.parse(resTestGen.body);
    // Agar "items" maydoni bo'lsa, u yerda odatda bitta item mavjud deb taxmin qilamiz.
    if (parsedGen.items && Array.isArray(parsedGen.items) && parsedGen.items.length > 0) {
      // Biz barcha savollarni bitta item ichidan yig'amiz:
      const item = parsedGen.items[0];
      if (item.questions && Array.isArray(item.questions)) {
        // Har bir savol uchun birinchi javobni tanlaymiz
        item.questions.forEach((q) => {
          if (q.answers && Array.isArray(q.answers) && q.answers.length > 0) {
            generatedQuestions.push({
              question_id: q.question_id,
              answer_id: q.answers[0].answer_id
            });
          }
        });
      }
    }
  } catch (e) {
    console.error("❌ Error parsing Test Generation response:", e);
  }
  if (generatedQuestions.length === 0) {
    throw new Error("No test questions extracted.");
  }
  // console.log(`✅ Extracted ${generatedQuestions.length} test question(s).`);

  let collection_item_id = "";
  try {
    const parsedGen = JSON.parse(resTestGen.body);
    if (parsedGen.items && parsedGen.items.length > 0) {
      collection_item_id = parsedGen.items[0].collection_item_id;
    }
  } catch (e) {
    console.error("❌ Error re-parsing test generation for collection_item_id:", e);
  }
  if (!collection_item_id) {
    throw new Error("Collection item ID not found in test generation response.");
  }
  
  // "items" array: bitta obyekt, unda barcha savollarning question_id va answer_id larini qo'shamiz
  const items = [
    {
      collection_item_id: collection_item_id,
      question_answer_ids: generatedQuestions
    }
  ];
  
  // Setup dan quyidagi ma'lumotlarni qaytaramiz, shunda default funksiyada calculate-score uchun ishlatamiz:
  return {
    token: applicantApiKey, // token sifatida ishlatiladi
    applicantId: applicantPayload.user_id,
    collectionId: collectionId,
    applicantAttemptId: applicantAttemptId,
    calculateScoreItems: items
  };
}

// Default: Ko'p marta calculate-score uchun so'rov yuborish
export default function (data) {
  // Endpoint: /test-applicant-attempt/calculate-score/{token}
  const calcScoreUrl = `https://api.admin.utas.uz/test-applicant-attempt/calculate-score/${data.token}`;

  const calcPayload = {
    applicant_attempt_id: data.applicantAttemptId,
    applicant_id: data.applicantId,
    collection_id: data.collectionId,
    items: data.calculateScoreItems
  };
  
  // console.log(`📢 Payload for CalculateScore: ${JSON.stringify(calcPayload)}`);
  
  const resCalc = http.post(calcScoreUrl, JSON.stringify(calcPayload), { headers });
  check(resCalc, {
    "✅ CalculateScore request successful": (r) => r.status === 200 || r.status === 201,
    "✅ CalculateScore response received": (r) => r.body && r.body.length > 0,
  });
  // console.log(`📢 CalculateScore result: ${resCalc.body}`);
  sleep(1);
}
