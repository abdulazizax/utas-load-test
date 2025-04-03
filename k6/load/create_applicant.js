import http from "k6/http";
import { check, sleep } from "k6";
import { headers, testOptions } from "./helpers/config.js";

export let options = testOptions;

const url = "https://api.admin.utas.uz/create-applicant";

const payload = JSON.stringify({
  exam_ball: 123,
  dtm_number: "123",
  dtm_url: "9c95a8b1-1921-40db-87e4-a41bf68ad530_Screenshot2025-03-17at10.40.08 PM.png",
  education_type: "2",
  exam_type: "with_dtm",
  faculty: "3",
  speciality: "9",
  user_id: "ec1469b7-9850-4de6-b603-a8ef4293a70d",
  is_now_exam_time: false
});
export default function () {
  const res = http.post(url, payload);

  check(res, {
    "status is 200 or 201": (r) => r.status === 200 || r.status === 201,
    "response body is not empty": (r) => r.body && r
  });

 // console.log(`Response: ${res.body}`);

  sleep(1); 
}
