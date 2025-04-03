import http from "k6/http";
import { check, sleep } from "k6";
import { headers, testOptions } from './helpers/config.js';

export let options = testOptions;
const url = "https://api.admin.utas.uz/enrolled-students-status/7fca25aa-e055-46b2-a764-c087e6c93963/52001035560021";

export default () => {
  const res = http.get(url, { headers });
  check(res, { "status was 200": (r) => r.status == 200});
  //console.log(res);
  sleep(1);
};
