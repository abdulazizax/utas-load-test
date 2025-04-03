import http from 'k6/http';
import { sleep } from 'k6';

// You can add helper functions here if needed
// Example: getRandomPhoneNumber, getRandomEmail, etc.

// helpers/config.js

// Function to generate a unique phone number
export function getUniquePhoneNumber() {
  const timestamp = new Date().getTime(); // Current timestamp
  const randomSuffix = Math.floor(Math.random() * 1000); // Random number to make it unique
  return `+998646464${timestamp}${randomSuffix}`;  // Create unique phone number
}

// Function to generate a unique email
export function getUniqueEmail() {
  const timestamp = new Date().getTime(); // Current timestamp
  const randomSuffix = Math.floor(Math.random() * 1000); // Random number to make it unique
  return `user${timestamp}${randomSuffix}@example.com`;  // Create unique email
}


export default function () {
    // Define the API endpoint for registration
    const registrationUrl = 'https://api.admin.u-code.io/v2/invoke_function/binn-register?project-id=7e2c2c8c-522f-4a40-ae43-a43b85ccd32e';
    const headers = {
        'authorization': 'API-KEY',  // Replace with the actual API Key
        'content-type': 'application/json',
        'x-api-key': 'P-JUbAh8IYsjRxQGnpNkvf75rFBpqWevEQ'  // Replace with the actual API Key
    };

    // Registration data for the POST request
    const registrationFormData = {
        data: {
            type: "phone",
            first_name: "asdf",
            last_name: "asldkj",
            phone_number: getUniquePhoneNumber,
            phone: get,
            email: "jfdl@lkj.jfj",
            password: "12345678",
            device_id: "id-aoq6qgz6p",
            login: "+998646464654",
            role_id: "87335131-d347-4015-8813-6452cbc37cbf",
            client_type_id: "457c9168-102c-43e8-bf9e-85012ba9970e",
            birthday: "2004-12-02T00:00:00+05:00",
            name: ""
        }
    };

    // Perform the POST request for user registration
    const registrationResponse = http.post(registrationUrl, JSON.stringify(registrationFormData), { headers: headers });

    // Log the response for debugging
    console.log('Response Status:', registrationResponse.status);
    console.log('Response Body:', registrationResponse.body);

    // Check if the registration was successful
    if (registrationResponse.status === 200) {
        console.log('User registered successfully!');
    } else {
        console.error(`Failed to register user: ${registrationResponse.status}`);
    }

    // Optional: sleep between iterations (useful in load testing)
    sleep(1);
}
