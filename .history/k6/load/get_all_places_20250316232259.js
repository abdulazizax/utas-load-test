import http from "k6/http";
import { check, sleep } from "k6";
import { baseUrl1, headers, testOptions } from './helpers/config.js';

export let options = testOptions


export default () => {
  const res = http.get(]}, {headers});
  check(res, { "status was 200": (r) => r.status == 200 });
  sleep(1);
};