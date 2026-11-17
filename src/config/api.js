export const API_URL = import.meta.env.PROD ? "https://kairos-api.duckdns.org" : "";
export const endpoints = {
    departamentos:  `${API_URL}/api/department`,
    register:       `${API_URL}/api/visits/register`,
    lookup:         `${API_URL}/api/visits/lookup`,
    resendQR:       `${API_URL}/api/visits/resend-qr`,
    requestCode:    `${API_URL}/api/visits/lookup/request-code`,
    verifyCode:     `${API_URL}/api/visits/lookup/verify-code`,
    logout:         `${API_URL}/api/visits/lookup/logout`,
};
