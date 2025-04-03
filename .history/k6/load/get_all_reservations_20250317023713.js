import http from "k6/http";
import { check, sleep } from "k6";
import { baseUrl1, headers, testOptions } from './helpers/config.js';

export let options = testOptions;

export default () => {
  const url = "https://api.admin.u-code.io/v1/invoke_function/binn-get-all-reservations?project-id=7e2c2c8c-522f-4a40-ae43-a43b85ccd32e";
  
  // Data to be sent in the POST request body
  const payload = JSON.stringify({
    data: {
      limit: 10,
      client_id: "36739b9c-839c-4ba8-a7f3-2435c87344d0",
      offset: 1,
      device_id: "id-363ax4sji"
    }
  });

  // Set headers
  const requestHeaders = {
    ...headers,
    'Content-Type': 'application/json',
  };

  // Send the POST request
  const res = http.post(url, payload, { headers: requestHeaders });

  // Check if the response status is 200
  check(res, { "status was 200": (r) => r.status == 200 });

  // Log the bed counts from the bookings data
  const responseBody = JSON.parse(res.body);
  
  if (responseBody && responseBody.data && responseBody.data.bookings) {
    responseBody.data.bookings.forEach(booking => {
      if (booking.bed_count !== undefined) {
        console.log(`Booking Number: ${booking.booking_number}, Bed Count: ${booking.bed_count}`);
      }
    });
  }

  // Sleep to simulate user wait time
  sleep(1);
};
