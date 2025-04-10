import http from "k6/http";
import { check, sleep } from "k6";
import { headers, testOptions } from "./helpers/config.js";

export let options = testOptions;

// 1) Applicant yaratish uchun payload
const applicantPayload = {
  education_type:   "1",
  exam_type:        "with_online_test",
  faculty:          "2",
  speciality:       "17",
  user_id:          "0dab9067-8209-4775-a293-a4f5e66d1bd1",
  is_now_exam_time: true,
};

export function setup() {
  let token; // <-- bu yerda eʼlon qilamiz

  // --- 1) Applicant yaratish ---
  const createApplicantUrl = "https://api.admin.utas.uz/create-applicant";
  const resApplicant = http.post(
    createApplicantUrl,
    JSON.stringify(applicantPayload),
    { headers }
  );
  check(resApplicant, {
    "✅ Applicant creation status 200/201": (r) =>
      r.status === 200 || r.status === 201,
    "✅ Applicant API Key returned": (r) =>
      !!r.json("applicant_api_key"),
  });
  console.log(`Create applicant response: ${resApplicant.body}`);
  token = resApplicant.json("applicant_api_key");
  if (!token) {
    throw new Error("❌ Applicant API Key not obtained.");
  }

  // --- 2) Exam data olish (retry) ---
  const examDataUrl = `https://api.admin.utas.uz/applicant-exam-data/${applicantPayload.user_id}/${token}`;
  let examData, collectionId;
  for (let i = 0; i < 5; i++) {
    const resExam = http.get(examDataUrl, { headers });
    check(resExam, {
      "✅ Exam data status 200": (r) => r.status === 200,
      "✅ Exam data non-empty": (r) =>
        r.body && !r.body.includes("no exam data found"),
    });
    console.log(`Exam data attempt ${i + 1}: ${resExam.body}`);
    if (resExam.status === 200) {
      const body = resExam.json();
      if (body.exam_data && body.exam_data.collection_data) {
        examData     = body.exam_data;
        collectionId = body.exam_data.collection_data.id;
        break;
      }
    }
    sleep(5);
  }
  if (!examData || !collectionId) {
    throw new Error("❌ Exam data or Collection ID not found.");
  }

  // --- 3) Applicant Test Attempt yaratish ---
  const attemptUrl = `https://api.admin.utas.uz/test-applicant-attempt/${token}`;
  const attemptPayload = {
    applicant_id:  applicantPayload.user_id,
    collection_id: collectionId,
    score:         0,
    status:        "started",
  };
  const resAttempt = http.post(
    attemptUrl,
    JSON.stringify(attemptPayload),
    { headers }
  );
  check(resAttempt, {
    "✅ CreateAttempt status 201": (r) => r.status === 201,
    "✅ Attempt ID returned":     (r) =>
      !!(r.json("id") || r.json("applicant_attempt_id")),
  });
  console.log(`Create attempt response: ${resAttempt.body}`);
  const attemptBody        = resAttempt.json();
  const applicantAttemptId = attemptBody.id || attemptBody.applicant_attempt_id;
  if (!applicantAttemptId) {
    throw new Error("❌ Applicant Attempt ID not obtained.");
  }

  // --- 4) Test questions generate qilish ---
  const testGenUrl     = `https://api.admin.utas.uz/test-question/generate/${token}`;
  const testGenPayload = {
    exam_data:     examData,
    collection_id: collectionId,
  };
  const resTestGen = http.post(
    testGenUrl,
    JSON.stringify(testGenPayload),
    { headers }
  );
  check(resTestGen, {
    "✅ Test generation status 200/201": (r) =>
      r.status === 200 || r.status === 201,
  });
  console.log(`Test generation response: ${resTestGen.body}`);
  const genBody = resTestGen.json();
  if (!genBody.items || genBody.items.length === 0) {
    throw new Error("❌ No test items returned.");
  }
  const firstItem          = genBody.items[0];
  const collection_item_id = firstItem.collection_item_id;
  if (!collection_item_id) {
    throw new Error("❌ collection_item_id missing in test-gen response.");
  }

  // --- 5) question_answer_ids tayyorlash ---
  const generatedQuestions = [];
  for (const q of firstItem.questions || []) {
    if (q.answers && q.answers.length) {
      generatedQuestions.push({
        question_id: q.question_id,
        answer_id:   q.answers[0].answer_id,
      });
    }
  }
  if (generatedQuestions.length === 0) {
    throw new Error("❌ question_answer_ids tayyorlanmadi");
  }

  // --- items array va setup return ---
  const items = [
    {
      collection_item_id:   collection_item_id,
      question_answer_ids:  generatedQuestions,
    },
  ];

  return {
    token,
    applicantId:         applicantPayload.user_id,
    collectionId,
    applicantAttemptId,
    calculateScoreItems: items,
  };
}

export default function (data) {
  // destructuring for clarity
  const {
    token,
    applicantId,
    collectionId,
    applicantAttemptId,
    calculateScoreItems,
  } = data;

  const calcScoreUrl = `https://api.admin.utas.uz/test-applicant-attempt/calculate-score/${token}`;
  const calcPayload = {
    applicant_attempt_id: applicantAttemptId,
    applicant_id:         applicantId,
    collection_id:        collectionId,
    items:                calculateScoreItems,
  };

  console.log("📝 Payload:", JSON.stringify(calcPayload));
  console.log("Token:", token)
  const resCalc = http.post(
    calcScoreUrl,
    JSON.stringify(calcPayload),
    { headers }
  );
  // console.log("📢 Response:", resCalc.status, resCalc.body);

  check(resCalc, {
    "✅ CalculateScore request successful": (r) => r.status === 200,
    "✅ CalculateScore response received":  (r) => r.body && r.body.length > 0,
  });
  // if (resCalc.status !== 200) {
  //   console.error(
  //     `❌ CalculateScore failed: status=${resCalc.status}, body=${resCalc.body}`
  //   );
  // }

  sleep(1);
}
