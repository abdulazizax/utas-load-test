import http from "k6/http";
import { check, sleep } from "k6";
import { baseUrl1, headers, testOptions } from './helpers/config.js';

// Load test parametrlari
export let options = testOptions;

// Yuboriladigan JSON data
const payload = JSON.stringify({
  data: {
    limit: 10,
    offset: 0,
    device_id: "id-aoq6qgz6p",
  },
});

// Asosiy test funksiyasi
export default () => {
  const res = http.post("https://api.admin.u-code.io/v1/invoke_function/binn-get-popular-place?project-id=7e2c2c8c-522f-4a40-ae43-a43b85ccd32e", 
    payload, { headers });
  // Status kod 200 ekanligini tekshiramiz
  check(res, { "status is 200": (r) => r.status === 200 });

  // Javobni konsolga chiqaramiz


  // Har bir iteratsiyada 1 soniya pauza qilamiz
  sleep(1);
};
