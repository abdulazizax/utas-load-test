export const baseUrl = 'https://api.admin.u-code.io/v1/invoke_function';
export const baseUrl1 = 'https://api.admin.u-code.io/v2/';


export const headers = {
    'x-api-key': 'P-LVV522r72r72mHNTNZ1w0FimKLFSCOqT',
    Authorization: 'API-KEY'
};

export const postHeaders = {
    'x-api-key': headers['x-api-key'],
    Authorization: headers.Authorization,
    'Content-Type': 'application/json'
};

export const testOptions = {
    thresholds: {
        http_req_failed: [{ threshold: 'rate<0.01'}],
        http_req_duration: ['p(95)<1000']
    },
    stages: [
        { duration: '1s', target:   1},
       // { duration: '10s', target:   230},
        { duration: '2s', target: 0 }
    ]
};

// config.js

// Random telefon raqami
export const getRandomPhoneNumber = () => {
    const countryCode = '+998'; // Qo'shimcha raqam
    const randomNumber = Math.floor(Math.random() * 1000000000); // Tasodifiy raqam
    return countryCode + randomNumber;
  };
  
  // Random login
  export const getRandomLogin = () => {
    return 'user' + Math.floor(Math.random() * 1000);
  };
  
  // Random parol
  export const getRandomPassword = () => {
    return Math.random().toString(36).substring(2, 10);
  };
  
  // Random email
  export const getRandomEmail = () => {
    return 'user' + Math.floor(Math.random() * 1000) + '@example.com';
  };
  
