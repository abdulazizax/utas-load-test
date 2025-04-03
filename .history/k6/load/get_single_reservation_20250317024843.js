import http from "k6/http";
import { check, sleep } from "k6";
import { baseUrl1, headers, testOptions } from './helpers/config.js';

export let options = testOptions;

export default () => {
  // Send the GET request to the specified URL
  const res = http.get("https://api.admin.u-code.io/v1/invoke_function/binn-get-one-reservation?project-id=7e2c2c8c-522f-4a40-ae43-a43b85ccd32e", { headers });

  // Check if the response status is 200 (OK)
  check(res, { "status was 200": (r) => r.status == 201 });

  // Try to parse the response body and log the "bed_count" field
  try {
    const responseBody = JSON.parse(res.body);

    // Check if the "bed_count" exists in the response and log it
    if (responseBody && responseBody.data && responseBody.data.data && responseBody.data.data.bed_count !== undefined) {
      console.log(`Bed Count: ${responseBody.data.data.bed_count}`);
    } else {
      console.log("No bed_count found in the response data.");
    }
  } catch (error) {
    console.error("Error parsing response body:", error);
  }

  // Sleep to simulate user wait time
  sleep(1);
};
