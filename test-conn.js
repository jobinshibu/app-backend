import axios from 'axios';

const url = "http://13.126.236.126:5710/api/admin/admin-notifications";
const key = "5Q52tQ8k8E8VV9mh";

async function test() {
    console.log(`Testing connection to ${url}...`);
    try {
        const payload = {
            type: "doctor_booking",
            title: "Test Doctor Booking",
            body: "Booking #123 created",
            metadata: {
                bookingId: 123,
                date: new Date().toISOString(),
                formattedDate: "17 Dec 2025",
                time: "06:00 PM to 07:00 PM",
                customerId: 9827,
                doctorId: 115,
                doctorName: "Dr. Amina Naushad",
                hospitalId: null,
                hospitalName: null,
                patientName: "Test Patient",
                patientPhone: "+1234567890"
            }
        };
        const res = await axios.post(url, payload, {
            headers: { "x-api-key": key },
            timeout: 10000
        });
        console.log("✅ Success! Status:", res.status);
    } catch (err) {
        if (err.response) {
            console.error("❌ Response Error:", err.response.status);
        } else if (err.request) {
            console.error("❌ Network Error (No Response):", err.code || err.message);
        } else {
            console.error("❌ Error:", err.message);
        }
    }
}

test();
