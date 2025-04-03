import http from "k6/http";
import { check, sleep } from "k6";
import { headers, testOptions } from "./helpers/config.js";

export let options = testOptions;

// 1️⃣ **Applicant yaratish (setup function)**
export function setup() {
  const createApplicantUrl = "https://api.admin.utas.uz/create-applicant";
  const payload = {
    education_type: "1",
    exam_type: "with_online_test",
    faculty: "2",
    speciality: "17",
    user_id: "ec1469b7-9850-4de6-b603-a8ef4293a70d",
    is_now_exam_time: true
  };

  const res = http.post(createApplicantUrl, JSON.stringify(payload), { headers });

  check(res, {
    "✅ Applicant yaratildi": (r) => r.status === 200 || r.status === 201,
  });

  if (res.status !== 200 && res.status !== 201) {
    console.log("⛔ Applicant yaratishda xatolik:", res.body);
    return null;
  }

  const responseBody = JSON.parse(res.body);
  return {
    applicantApiKey: responseBody.applicant_api_key
  };
}

// 2️⃣ **Test ma'lumotlarini olish va CalculateScore APIga so‘rov yuborish**
export default function (data) {
  if (!data || !data.applicantApiKey) {
    console.log("⛔ Applicant API Key yo‘q, test o‘tkazilmaydi.");
    return;
  }

  const getUrl = `https://api.admin.utas.uz/applicant-exam-data/ec1469b7-9850-4de6-b603-a8ef4293a70d/${data.applicantApiKey}`;

  let retries = 5;
  let collectionId = null;
  let testItems = null;

  while (retries > 0) {
    const res = http.get(getUrl, { headers });

    check(res, {
      "✅ Exam ma'lumotlari olindi": (r) => r.status === 200,
    });

    if (res.status === 200) {
      const parsedBody = JSON.parse(res.body);
      if (parsedBody.exam_data && parsedBody.exam_data.collection_data) {
        collectionId = parsedBody.exam_data.collection_data.id;
        break;
      }
    }

    console.log("⏳ Exam ma'lumotlari hali tayyor emas, qayta urinamiz...");
    sleep(5);
    retries--;
  }

  if (!collectionId) {
    console.log("❌ Collection ID topilmadi.");
    return;
  }

  const testGenUrl = `https://api.admin.utas.uz/test-question/generate/${data.applicantApiKey}`;
  const testPayload = { exam_data: { collection_id: collectionId } };
  const testRes = http.post(testGenUrl, JSON.stringify(testPayload), { headers });

  check(testRes, {
    "✅ Test generatsiya qilindi": (r) => r.status === 200 || r.status === 201,
  });

  if (testRes.status !== 200 && testRes.status !== 201) {
    console.log("⛔ Test generatsiya qilishda xatolik:", testRes.body);
    return;
  }

  const testResponseBody = JSON.parse(testRes.body);
  testItems = testResponseBody.items;

  // 3️⃣ **CalculateScore APIga request yuborish**
  const calculateScoreUrl = `https://api.admin.utas.uz/test-applicant-attempt/calculate-score/${data.applicantApiKey}`;
  
  const answerPayload = {
    applicant_attempt_id: "some_attempt_id",
    applicant_id: "ec1469b7-9850-4de6-b603-a8ef4293a70d",
    collection_id: collectionId,
    items: testItems.map(item => ({
      collection_item_id: item.collection_item_id,
      question_answer_ids: item.questions.map(q => ({
        question_id: q.question_id,
        answer_id: q.answers[0].answer_id // Random javob tanlandi
      }))
    }))
  }; 

  const scoreRes = http.post(calculateScoreUrl, JSON.stringify(answerPayload), { headers });

  check(scoreRes, {
    "✅ CalculateScore muvaffaqiyatli": (r) => r.status === 200,
  });

  console.log(`📢 CalculateScore response: ${scoreRes.body}`);
}
