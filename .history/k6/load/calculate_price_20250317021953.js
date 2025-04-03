import http from "k6/http";
import { check, sleep } from "k6";
import { headers, testOptions } from './helpers/config.js';

export let options = testOptions;
const payload = JSON.stringify({
  data: {
    guid: 'c124656b-28e7-44da-a516-c88ce43e6ab7',
    room_id: 'c124656b-28e7-44da-a516-c88ce43e6ab7',
    start_date: '2025-03-17',
    end_date: '2025-03-18',
    place_type: ['hostel'],
    room_count: 1,
    adult_count: 2,
    bed_type_id: '955e76df-3456-428d-bfed-47115e2f571c',
    bed_count: 1,
  },
});

export default () => {
  const res = http.post("https://api.admin.u-code.io/v2/invoke_function/binn-calculate-price-knative?project-id=7e2c2c8c-522f-4a40-ae43-a43b85ccd32e", payload, { headers });
  
  
  check(res, { "status was 201": (r) => r.status == 201 });
  sleep(1);
};
