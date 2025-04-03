import http from "k6/http";
import { check, sleep } from "k6";
import { baseUrl1, headers, testOptions } from './helpers/config.js';

export let options = testOptions


export default () => {
  const res = http.get(`${baseUrl1}object-slim/get-list/partners_company?data={"status":["banner"]}`, {headers});
  check(res, { "status was 200": (r) => r.status == 200 });
  sleep(1);
};