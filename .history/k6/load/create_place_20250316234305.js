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
            {
                "data": {
                  "location": "41.28803891810943,69.25165716432208",
                  "property_type_id": "6811b7e8-5afe-45e7-a470-058789a4b5c4",
                  "name": "THE TIME HOSTEL",
                  "place_description_ru": "rus",
                  "place_description_en": "eng",
                  "place_description_uz": "uzb",
                  "addtional_information_ru": "rus",
                  "addtional_information_en": "eng",
                  "addtional_information_uz": "uzb",
                  "country_id": "3cb121b9-fde2-4cec-a80d-52ad084bf830",
                  "country_id_2": "0b581169-0e64-43c3-bce3-2bb0094c02c4",
                  "country_id_5": "1678b599-464d-4daa-8991-a4e7d83d739e",
                  "address": "Bobur ko'chasi",
                  "postal_code": "100101",
                  "region_location": [69.25255215199344, 41.28724708485014],
                  "guest_count": 1,
                  "bed_types": [],
                  "facility_ids": [
                    "5997a052-32ec-40e3-9088-f9285417e4d2",
                    "0b74d871-2ba5-4f1e-9749-110b0396f488",
                    "7d52df4a-3e1d-4b06-9c37-f1f26b831c9d",
                    "694cbb83-74fe-40ff-bec1-ff4e24f31332",
                    "c85a18b1-44c6-4176-83aa-48fd1b06170f",
                    "1090e75c-cf87-4b89-9401-ca9ea833f48b"
                  ],
                  "parking": ["no"],
                  "age_restriction": "21",
                  "check_in_type": "keypad",
                  "check_in_description_ru": "rus - 202",
                  "check_in_description_en": "eng - 202",
                  "check_in_description_uz": "uzb - 202",
                  "check_in_from": "11:11",
                  "check_in_to": "",
                  "check_out_from": "",
                  "check_out_to": "12:12",
                  "place_languages_ids": [
                    "eba343aa-ebee-4171-9c04-2025ea4577bf",
                    "3316c69c-d08f-4bff-9635-69af8e792c55"
                  ],
                  "place_house_rule": [
                    {
                      "false_text_en": "",
                      "false_text_for_option_en": "Yes, Free",
                      "false_text_for_option_ru": "Да, Бесплатно",
                      "false_text_for_option_uz": "Ha, Tekin",
                      "guid": "82268b60-1d54-44de-ba69-645449c5248e",
                      "have_description": true,
                      "house_rule_id": "2bcd39d6-1ecc-4d97-a076-119223e02435",
                      "icon": "bed.svg",
                      "is_option": true,
                      "is_other": false,
                      "is_paid": false,
                      "object_type": ["country_house", "apartment", "hotel", "hostel"],
                      "rule_name_en": "Crib bed provided",
                      "rule_name_ru": "Предоставляется детская кроватка",
                      "rule_name_uz": "Bolalar uchun yotoq taqdim etiladi",
                      "success_text_en": "",
                      "success_text_ru": "",
                      "success_text_uz": "",
                      "true_text_for_option_en": "Yes, Paid",
                      "true_text_for_option_ru": "Да, Платно",
                      "true_text_for_option_uz": "Ha, Pullik",
                      "description_en": "",
                      "description_uz": "",
                      "description_ru": "",
                      "is_active": true,
                      "paidSelect": true
                    },
                    {
                      "false_text_en": "",
                      "false_text_for_option_en": "",
                      "false_text_for_option_ru": "",
                      "false_text_for_option_uz": "",
                      "false_text_ru": "",
                      "false_text_uz": "",
                      "guid": "84939e3c-e175-4185-9c8c-aed69c876849",
                      "have_description": true,
                      "icon": "pen-ruler.svg",
                      "is_option": false,
                      "is_other": true,
                      "is_paid": false,
                      "object_type": ["country_house", "hotel", "apartment", "hostel"],
                      "rule_name_en": "Other rules",
                      "rule_name_ru": "Другие правила",
                      "rule_name_uz": "Boshqa qoidalar",
                      "success_text_en": "",
                      "success_text_ru": "",
                      "success_text_uz": "",
                      "true_text_for_option_en": "",
                      "true_text_for_option_ru": "",
                      "true_text_for_option_uz": "",
                      "description_en": "",
                      "description_uz": "",
                      "description_ru": "",
                      "is_active": true,
                      "paidSelect": false
                    }
                  ],
                  "cover_photo": "https://cdn.u-code.io/baa6651d-cc6e-4302-977f-843a976ede5f/Media/b3bca150-f73b-4ab2-9427-3667297e94ad_645916819.jpg",
                  "image_url": [
                    "https://cdn.u-code.io/baa6651d-cc6e-4302-977f-843a976ede5f/Media/42f7cd43-f55e-447c-a0c3-4877c7680d54_486564191.jpg",
                    "https://cdn.u-code.io/baa6651d-cc6e-4302-977f-843a976ede5f/Media/5ea477c8-984e-4f5c-ba22-ef4dfb806286_486564064.jpg",
                    "https://cdn.u-code.io/baa6651d-cc6e-4302-977f-843a976ede5f/Media/ec9d6fc7-db9d-4cb1-959f-ef982e9a3fb5_486563986.jpg",
                    "https://cdn.u-code.io/baa6651d-cc6e-4302-977f-843a976ede5f/Media/a5a731d0-3bff-4b80-837d-2e8f861782de_486564012.jpg"
                  ]
                }
              }
              
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
