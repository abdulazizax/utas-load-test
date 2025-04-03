import http from "k6/http";
import { check, sleep } from "k6";
import { headers, testOptions } from './helpers/config.js';

export let options = testOptions;
const url = "https://api.admin.utas.uz/education-types?from_web=true&offset=0&limit=50";

export default () => {
  const res = http.get(url, { headers });
  check(res, { "status was 200": (r) => r.status == 200});
  //console.log(res);
  sleep(1);
};
