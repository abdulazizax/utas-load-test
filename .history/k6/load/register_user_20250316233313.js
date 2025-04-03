import http from 'k6/http';
import { sleep } from 'k6';

// You can add helper functions here if needed
// Example: getRandomPhoneNumber, getRandomEmail, etc.

export default function () {
    // Define the API endpoint for registration
    const registrationUrl = 'https://api.admin.u-code.io/v2/invoke_function/binn-register?project-id=7e2c2c8c-522f-4a40-ae43-a43b85ccd32e';
    
    // Headers to be included in the request
    const headers = {
        'accept': 'application/json, text/plain, */*',
        'accept-language': 'en,ru-RU;q=0.9,ru;q=0.8,uz;q=0.7',
        'authorization': 'API-KEY',  // Replace with the actual API Key
        'content-type': 'application/json',
        'environment-id': 'f012607d-07ed-4633-b31d-81152e0993e7',
        'origin': 'https://binn.uz',
        'priority': 'u=1, i',
        'referer': 'https://binn.uz/',
        'resource-id': '9663e514-7230-4577-b9b0-c95035e46b6d',
        'sec-ch-ua': '"Google Chrome";v="129", "Not=A?Brand";v="8", "Chromium";v="129"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'cross-site',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
        'x-api-key': 'P-JUbAh8IYsjRxQGnpNkvf75rFBpqWevEQ'  // Replace with the actual API Key
    };

    // Registration data for the POST request
    const registrationFormData = {
        data: {
            type: "phone",
            first_name: "asdf",
            last_name: "asldkj",
            phone_number: "+998646464654",
            phone: "+998646464654",
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
