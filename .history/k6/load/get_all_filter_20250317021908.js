import http from "k6/http";
import { check, sleep } from "k6";
import { baseUrl1, headers, testOptions } from './helpers/config.js';

export let options = testOptions;

export default () => {
  const res = http.post("https://api.admin.u-code.io/v2/invoke_function/binn-get-all-filters-staging?project-id=7e2c2c8c-522f-4a40-ae43-a43b85ccd32e", { headers });
  check(res, { "status was 200": (r) => r.status == 200 });
  sleep(1);
};
