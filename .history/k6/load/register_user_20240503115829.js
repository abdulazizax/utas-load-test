import http from 'k6/http';
import { sleep } from 'k6';
import { getRandomPhoneNumber, getRandomLogin, getRandomPassword, getRandomEmail } from './helpers/config.js';


export default function () {
      
      // Ro'yxat formasini to'ldirish uchun POST so'rovi yaratish
      const registrationUrl = 'https://api.auth.u-code.io/v2/register?project-id=f539f64b-961e-4c6c-8534-140091f7f27b';
       const headers = {
        'x-api-key': 'P-LVV522r72r72mHNTNZ1w0FimKLFSCOqT',
        Authorization: 'API-KEY'
    };
    
      const postHeaders = {
        'x-api-key': headers['x-api-key'],
        Authorization: headers.Authorization,
        'Content-Type': 'application/json'
    };
      const registrationFormData = {
        data:{
         type: "phone",
         client_type_id: "9bb1227a-0c90-4c70-bcee-b2563d32f7a0",
         role_id: "48871d27-7361-4f69-8fe4-b54daf270739",
         phone: getRandomPhoneNumber(),
         full_name: "qwtest1",
         login: getRandomLogin(),
         password: getRandomPassword(),
         firm_id: "d1569915-30ff-4b0a-ba7a-c172f7696288",
         email: getRandomEmail()
        }
        // Qo'shimcha maydonlar kerak bo'lsa, ularni ham yozishingiz mumkin
      };
      const registrationResponse = http.post(registrationUrl, JSON.stringify(registrationFormData), { headers: postHeaders });
      console.log(registrationResponse)

      // Ro'yxatdan o'tish uchun POST so'rovini tekshirish
      if (registrationResponse.status == 201) {
        console.log('User registered successfully!');
      } else {
        console.error(`Failed to register user: ${registrationResponse.status}`);
      }
}
