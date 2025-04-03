import http from "k6/http";
import { check, sleep } from "k6";
import { headers, testOptions } from "./helpers/config.js";
import { uuidv4 } from "https://jslib.k6.io/k6-utils/1.2.0/index.js";

export let options = testOptions;

// Foydalanuvchi ma'lumotlari
const payload = {
  education_type: "1",
  exam_type: "with_online_test",
  faculty: "2",
  speciality: "17",
  user_id: "ec1469b7-9850-4de6-b603-a8ef4293a70d",
  is_now_exam_time: true
};

// 1️⃣ **setup()** - Applicant yaratish, exam ma'lumotlarini olish va test savollarini generatsiya qilish (faqat bir marta)
export function setup() {
  // Applicant yaratish
  const createApplicantUrl = "https://api.admin.utas.uz/create-applicant";
  const resApplicant = http.post(createApplicantUrl, JSON.stringify(payload), { headers });
  check(resApplicant, {
    "✅ Applicant yaratish muvaffaqiyatli": (r) => r.status === 200 || r.status === 201,
    "✅ Applicant uchun JSON qaytdi": (r) => r.body && r.body.length > 0,
  });

  let applicantApiKey = null;
  try {
    const responseBody = JSON.parse(resApplicant.body);
    if (responseBody && responseBody.applicant_api_key) {
      applicantApiKey = responseBody.applicant_api_key;
      console.log(`✅ Applicant API Key: ${applicantApiKey}`);
    } else {
      console.log("⚠️ Applicant API Key mavjud emas.");
    }
  } catch (e) {
    console.error("❌ Applicant response JSON parse qilishda xatolik:", e);
  }

  if (!applicantApiKey) {
    throw new Error("Applicant API Key topilmadi.");
  }

  // Exam ma'lumotlarini olish (GET)
  const getUrl = `https://api.admin.utas.uz/applicant-exam-data/${payload.user_id}/${applicantApiKey}`;
  let retries = 5;
  let examData = null;
  let collectionId = null;
  let lastGetResponse = null;
  while (retries > 0) {
    lastGetResponse = http.get(getUrl, { headers });
    check(lastGetResponse, {
      "✅ GET request muvaffaqiyatli": (r) => r.status === 200,
      "✅ Exam ma'lumotlari bor": (r) => r.body && r.body.length > 0 && !r.body.includes("no exam data found"),
    });
    if (lastGetResponse.status === 200 && !lastGetResponse.body.includes("no exam data found")) {
      try {
        const parsedBody = JSON.parse(lastGetResponse.body);
        if (parsedBody.exam_data && parsedBody.exam_data.collection_data) {
          examData = parsedBody.exam_data;
          collectionId = parsedBody.exam_data.collection_data.id;
          console.log(`✅ Exam ma'lumotlari olindi! Collection ID: ${collectionId}`);
          break;
        } else {
          console.log("⚠️ Collection ID mavjud emas.");
        }
      } catch (e) {
        console.error("❌ Exam data JSON parse qilishda xatolik:", e);
      }
    }
    console.log("⏳ Exam ma'lumotlari hali tayyor emas, qayta urinamiz...");
    sleep(5);
    retries--;
  }

  if (!examData || !collectionId) {
    throw new Error("Exam data yoki Collection ID topilmadi. Testni to'xtatamiz.");
  }

  console.log(`📢 Oxirgi GET Response Body: ${lastGetResponse.body}`);

  // Test savollarini generatsiya qilish (POST)
  const testGenUrl = `https://api.admin.utas.uz/test-question/generate/${applicantApiKey}`;
  const testPayload = {
    exam_data: examData,
    collection_id: collectionId,
  };
  const resTestGen = http.post(testGenUrl, JSON.stringify(testPayload), { headers });
  check(resTestGen, {
    "✅ Test generatsiya request muvaffaqiyatli": (r) => r.status === 200 || r.status === 201,
  });
  console.log(`📢 Test generatsiya natijasi: ${resTestGen.body}`);

  // Bu yerda biz test natijalaridan javob strukturasini simulyatsiya qilamiz.
  // Masalan, test generatsiya javobi quyidagi formatda bo'lishi mumkin:
  // { questions: [ { collection_item_id, question_id, answer_id }, ... ] }
  // Agar haqiqiy javob strukturasini bilsangiz, shu yerda uni parslash mumkin.
  let testQuestions = [];
  try {
    const parsedTest = JSON.parse(resTestGen.body);
    if (parsedTest.questions && Array.isArray(parsedTest.questions)) {
      testQuestions = parsedTest.questions;
    } else {
      // Agar test questions maydoni mavjud bo'lmasa, dummy ma'lumot bilan simulyatsiya qilamiz:
      for (let i = 0; i < 10; i++) {
        testQuestions.push({
          collection_item_id: `ci-${i}`,
          question_id: `q-${i}`,
          answer_id: `a-${i}`
        });
      }
    }
  } catch (e) {
    console.error("❌ Test generatsiya javobini parse qilishda xatolik, dummy ma'lumotlardan foydalanamiz:", e);
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
    testQuestions, // Savollar ro'yxati (javoblar simulyatsiyasi)
    applicantId: payload.user_id, // Applicant ID payloaddan
  };
}

// 2️⃣ **default()** - Har bir iteratsiyada calculate-score API ga bir nechta POST so'rov yuborish
export default function (data) {
  if (!data.applicantApiKey) {
    console.log("⛔ Applicant API Key yo‘q, calculate-score so‘rovi yuborilmaydi.");
    return;
  }

  // CalculateScore API URL, token sifatida applicantApiKey ishlatilmoqda
  const calcScoreUrl = `https://api.admin.utas.uz/test-applicant-attempt/calculate-score/${data.applicantApiKey}`;

  // For sikli orqali bir nechta calculate-score so'rovlari yuboramiz.
  // Masalan, har bir VU 5 marta so'rov yuborsin.
  const iterations = 5;
  for (let i = 0; i < iterations; i++) {
    // Har bir so'rov uchun yangi applicant_attempt_id (UUID) generatsiya qilamiz
    const applicantAttemptId = uuidv4();

    // Test questions ro'yxatidan iteratsiya qilib, answer obyektlarini shakllantiramiz.
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
      "✅ CalculateScore so'rovi muvaffaqiyatli": (r) => r.status === 200 || r.status === 201,
      "✅ Javob tanlandi": (r) => r.body && r.body.length > 0,
    });
    console.log(`📢 CalculateScore iteratsiya ${i + 1} natijasi: ${resCalc.body}`);
    // Har bir so'rov orasida biroz kutish (1 soniya)
    sleep(1);
  }
}
