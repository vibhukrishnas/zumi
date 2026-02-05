const axios = require('axios');

async function testRegister() {
    try {
        console.log("Attempting to register user...");
        const response = await axios.post('http://localhost:5000/api/auth/register', {
            fullName: "Test User",
            email: "test" + Date.now() + "@example.com",
            phone: "1234567890",
            password: "password123"
        });
        console.log("✅ Registration Successful:", response.data);
    } catch (error) {
        if (error.response) {
            console.error("❌ Server Error:", error.response.status, error.response.data);
        } else if (error.request) {
            console.error("❌ No Response (Network Error):", error.message);
        } else {
            console.error("❌ Error:", error.message);
        }
    }
}

testRegister();
