import http from "k6/http";
import { check, sleep } from "k6";
import { headers, testOptions } from "./helpers/config.js";

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

// 1️⃣ **`setup()`** - Applicant yaratish (faqat bir marta bajariladi)
export function setup() {
  const createApplicantUrl = "https://api.admin.utas.uz/create-applicant";
  const res = http.post(createApplicantUrl, JSON.stringify(payload), { headers });

  check(res, {
    "✅ POST request muvaffaqiyatli": (r) => r.status === 200 || r.status === 201,
    "✅ JSON qaytdi": (r) => r.body && r.body.length > 0,
  });

  let applicantApiKey = null;

  if (res.status === 200 || res.status === 201) {
    try {
      const responseBody = JSON.parse(res.body);
      if (responseBody && responseBody.applicant_api_key) {
        applicantApiKey = responseBody.applicant_api_key;
        console.log(`✅ Applicant API Key: ${applicantApiKey}`);
      } else {
        console.log("⚠️ Applicant API Key mavjud emas.");
      }
    } catch (e) {
      console.error("❌ JSON parse qilishda xatolik:", e);
    }
  }

  return { applicantApiKey };
}

// 2️⃣ **`default()`** - Har bir iteratsiyada `GET` va `POST` requestlarni yuboradi
export default function (data) {
  if (!data.applicantApiKey) {
    console.log("⛔ Applicant API Key yo‘q, request yuborilmaydi.");
    return;
  }

  const getUrl = `https://api.admin.utas.uz/applicant-exam-data/${payload.user_id}/${data.applicantApiKey}`;
  
  // 3️⃣ **Exam data olish uchun GET request**
  let retries = 5;
  let examData = null;
  let collectionId = null;

  while (retries > 0) {
    const res = http.get(getUrl, { headers });

    check(res, {
      "✅ GET request muvaffaqiyatli": (r) => r.status === 200,
      "✅ Exam ma'lumotlari bor": (r) => r.body && r.body.length > 0 && !r.body.includes("no exam data found"),
    });

    if (res.status === 200 && !res.body.includes("no exam data found")) {
      try {
        const parsedBody = JSON.parse(res.body);
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
    sleep(5); // 5 soniya kutish
    retries--;
  }

  if (!examData || !collectionId) {
    console.log("❌ Exam data yoki Collection ID topilmadi. Test generatsiya qilish bekor qilindi.");
    return;
  }

  // 4️⃣ **Test savollarini generatsiya qilish uchun POST request**
  const testGenUrl = `https://api.admin.utas.uz/test-question/generate/${data.applicantApiKey}`;
  const testPayload = {
    exam_data: examData,
    collection_id: collectionId,
  };

  const testRes = http.post(testGenUrl, JSON.stringify(testPayload), { headers });

  check(testRes, {
    "✅ Test generatsiya request muvaffaqiyatli": (r) => r.status === 200 || r.status === 201,
  });

//   console.log(`📢 Test generatsiya natijasi: ${testRes.body}`);
  
  sleep(1);
}
