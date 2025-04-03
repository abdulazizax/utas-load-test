import http from "k6/http";
import { check, sleep } from "k6";
import { baseUrl1, headers, testOptions } from './helpers/config.js';

export let options = testOptions;

const payload = JSON.stringify({
  data: {
    "search": "",
    "guest_count": 2,
    "infant_count": 0,
    "child_count": 0,
    "start_date": "2025-03-17",
    "response_type": "",
    "end_date": "2025-03-18",
    "limit": 10,
    "room_count": 1,
    "guid": "",
    "offset": 1,
    "currency": "uzs",
    "order": {},
    "per_night": null,
    "is_tax": null,
    "device_id": "id-aoq6qgz6p",
    "view_fields": [
       0 "name"
    ]
  }
});

export default () => {
  const res = http.post("https://api.admin.u-code.io/v2/invoke_function/binn-get-all-filters-staging?project-id=7e2c2c8c-522f-4a40-ae43-a43b85ccd32e", payload, { headers });
  check(res, { "status was 201": (r) => r.status == 201 });
  sleep(1);
  console.log(res);
};
