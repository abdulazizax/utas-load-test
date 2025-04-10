export const baseUrl = 'https://api.admin.u-code.io/v1/invoke_function';
export const baseUrl1 = 'https://api.admin.u-code.io/v2/';


export const headers = {
    'x-api-key': 'P-JUbAh8IYsjRxQGnpNkvf75rFBpqWevEQ',
    Authorization: 'API-KEY',
    "Content-Type": "application/json"
};

export const postHeaders = {
    'x-api-key': headers['x-api-key'],
    Authorization: headers.Authorization,
    'Content-Type': 'application/json'
};

export const testOptions = {
    thresholds: {
        http_req_failed: [{ threshold: 'rate<0.01'}],
        http_req_duration: ['p(95)<5000']
    },
    stages: [
        { duration: '5s', target: 100 },
        // { duration: '5s', target: 200 },
        // { duration: '5s', target: 300 },
        // { duration: '5s', target: 400 },
        // { duration: '5s', target: 500 },
        // { duration: '5s', target: 600 },
        // { duration: '5s', target: 700 },
        // { duration: '5s', target: 800 },
        // { duration: '5s', target: 900 },
        // { duration: '5s', target: 1000 },
        { duration: '10s', target: 100 }, // 1000 VU da saqlab turish
        { duration: '10s', target: 0 }     // Sekin to‘xtatish
    ]
};
