

const express = require("express");
const speakeasy = require("speakeasy");
const cors = require("cors");
const bodyParser = require("body-parser");
const admin = require("firebase-admin");
const { OAuth2Client } = require("google-auth-library");
const router = express.Router();
const app = express();

app.use(cors())
app.use(express.json());
const qrcode = require("qrcode");


const serviceAccount = require("../config/nano-hr-satging-firebase-adminsdk-qrykr-2122a57324.json");
const e = require("express");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),

});


const db = admin.firestore();
db.collection("test").add({ message: "Firestore is connected!" })
    .then(docRef => console.log("Document written with ID:", docRef.id))
    .catch(error => console.error("Error adding document:", error));

const userOtps = {};


const CLIENT_ID = "nano-hr-satging";
const client = new OAuth2Client(CLIENT_ID);

router.get('/', (req, res) => {
    res.json({ message: 'Auth route working!' });
});
// app.post("/send-otp", async (req, res) => {
//     const { mobileNumber } = req.body;
//     try {
//         const employeesRef = db.collection("employees");
//         const snapshot = await employeesRef.where("primary_number", "==", mobileNumber).get();

//         if (snapshot.empty) {
//             return res.status(400).json({ error: "No user found with this mobile number" });
//         }


//         const otp = speakeasy.totp({
//             secret: "MY_SECRET_KEY",
//             encoding: "base32",
//         });

//         userOtps[mobileNumber] = otp; 

//         console.log(`Generated OTP for ${mobileNumber}: ${otp}`); 



//         res.json({ message: "OTP sent successfully" });

//     } catch (error) {
//         console.error("Error fetching employee:", error);
//         res.status(500).json({ error: "Internal server error" });
//     }
// });

// app.post("/check-employee", async (req, res) => {
//     try {
//         const { mobileNumber } = req.body;

//         if (!mobileNumber) {
//             return res.status(400).json({ message: "Mobile number is required" });
//         }

//         // Query Firestore where primary_number == mobileNumber
//         const employeesRef = db.collection("employees");
//         const querySnapshot = await employeesRef.where("primary_number", "==", mobileNumber).get();

//         if (querySnapshot.empty) {
//             return res.status(404).json({ message: "Employee not found" });
//         }

//         // Assuming primary number is unique, get the first matching employee
//         const employeeData = querySnapshot.docs[0].data();
//             console.log("empd data", employeeData)
//         if (!employeeData.secret && mobileNumber !== employeeData.primary_number) {
//             return res.status(400).json({ message: "Employee has not enabled 2FA" });
//         }

//         res.json({ success: true, message: "Employee exists and has 2FA enabled" });

//     } catch (error) {
//         console.error("Error checking employee:", error);
//         res.status(500).json({ message: "Internal server error" });
//     }
// });
router.post("/check-employee", async (req, res) => {
    try {
        const { mobileNumber } = req.body;

        if (!mobileNumber) {
            return res.status(400).json({ message: "Mobile number is required" });
        }

        // Query Firestore for employees where primary_number == mobileNumber
        const employeesRef = db.collection("employees");
        const querySnapshot = await employeesRef.where("primary_number", "==", mobileNumber).get();

        if (querySnapshot.empty) {
            return res.status(404).json({ message: "Employee not found" });
        }

        // Get the first matching employee (assuming primary_number is unique)
        const employeeData = querySnapshot.docs[0].data();
        console.log("Employee Data:", employeeData);

        // Ensure the primary number matches and 2FA (secret) exists
        if (!employeeData.secret) {
            return res.status(400).json({ message: "Employee has not enabled 2FA" });
        }

        // Return success response with employee info
        res.json({
            success: true,
            message: "Employee exists and has 2FA enabled",
            employee: {
                auth_id: employeeData.auth_id, // Include auth_id for login reference
                name: employeeData.name, // Optional: Send employee name if needed
            }
        });

    } catch (error) {
        console.error("Error checking employee:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});



router.post("/send-otp", async (req, res) => {
    const { mobileNumber } = req.body;

    try {
        const employeesRef = db.collection("employees");
        const snapshot = await employeesRef.where("primary_number", "==", mobileNumber).get();

        if (snapshot.empty) {
            return res.status(400).json({ error: "No user found with this mobile number" });
        }

        const employeeDoc = snapshot.docs[0];
        const employeeData = employeeDoc.data();

        if (!employeeData.secretKey) {
            return res.status(400).json({ error: "Google Authenticator is not set up for this user" });
        }

        // Generate OTP based on stored secret key
        const otp = speakeasy.totp({
            secret: employeeData.secretKey,
            encoding: "base32",
        });

        console.log(`Generated OTP for ${mobileNumber}: ${otp}`);

        res.json({ message: "OTP sent successfully", otp });

    } catch (error) {
        console.error("Error fetching employee:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

async function generateFirebaseToken(uid) {
    return await admin.auth().createCustomToken(uid);
}
router.post("/verify-otp", async (req, res) => {
    try {
        const { mobileNumber, otp } = req.body;

        if (!mobileNumber || !otp) {
            return res.status(400).json({ message: "Mobile number and OTP are required" });
        }

        // Query Firestore where primary_number == mobileNumber
        const employeesRef = db.collection("employees");
        const querySnapshot = await employeesRef.where("primary_number", "==", mobileNumber).get();

        if (querySnapshot.empty) {
            return res.status(404).json({ message: "Employee not found" });
        }

        const employeeDoc = querySnapshot.docs[0];
        const employeeData = employeeDoc.data();
        console.log("✅ Employee Data:", employeeData);

        if (!employeeData.secret) {
            return res.status(400).json({ message: "Employee has not enabled 2FA" });
        }

        // Verify OTP using speakeasy
        const verified = speakeasy.totp.verify({
            secret: employeeData.secret,
            encoding: "base32",
            token: otp,
            window: 1 // Allows a slight time drift
        });

        if (!verified) {
            return res.status(400).json({ message: "Invalid OTP" });
        }

        // Generate Firebase Custom Token
        const firebaseUid = employeeDoc.id; // Use Firestore document ID as UID
        const firebaseToken = await admin.auth().createCustomToken(firebaseUid);

        console.log("✅ Firebase Token Generated:", firebaseToken);

        res.json({
            success: true,
            message: "OTP verified successfully",
            firebaseCustomToken: firebaseToken,
            employeeData
        });

    } catch (error) {
        console.error("❌ Error verifying OTP:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
router.post("/verify-otp-real", async (req, res) => {
    try {
        const { mobileNumber, otp } = req.body;

        if (!mobileNumber || !otp) {
            return res.status(400).json({ message: "Mobile number and OTP are required" });
        }

        // Query Firestore where primary_number == mobileNumber
        const employeesRef = db.collection("employees");
        const querySnapshot = await employeesRef.where("primary_number", "==", mobileNumber).get();

        if (querySnapshot.empty) {
            return res.status(404).json({ message: "Employee not found" });
        }

        const employeeData = querySnapshot.docs[0].data();
        console.log("emploheee", employeeData)

        if (!employeeData.secret && employeeData.primary_number !== mobileNumber) {
            return res.status(400).json({ message: "Employee has not enabled 2FA" });
        }

        // Verify OTP using speakeasy
        const verified = speakeasy.totp.verify({
            secret: employeeData.secret,
            encoding: "base32",
            token: otp,
            window: 1 // Allows a slight time drift
        });

        if (verified) {
            res.json({ success: true, message: "OTP verified successfully", data: employeeData });
        } else {
            res.status(400).json({ message: "Invalid OTP" });
        }

    } catch (error) {
        console.error("Error verifying OTP:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});


// app.post("/verify-otp", async (req, res) => {
//     try {
//         const { employeeId, token } = req.body;

//         if (!employeeId || !token) {
//             return res.status(400).json({ message: "Employee ID and OTP token are required" });
//         }

//         // Retrieve employee's secret key from Firestore
//         const employeeDoc = await db.collection("employees").doc(employeeId).get();

//         if (!employeeDoc.exists) {
//             return res.status(404).json({ message: "Employee not found" });
//         }

//         const secret = employeeDoc.data().secret;

//         // Verify OTP
//         const verified = speakeasy.totp.verify({
//             secret: secret,
//             encoding: "base32",
//             token: token,
//             window: 1, // Allow time drift
//         });

//         if (verified) {
//             return res.json({ success: true, message: "OTP verified successfully" });
//         } else {
//             return res.status(400).json({ success: false, message: "Invalid OTP" });
//         }
//     } catch (error) {
//         console.error("Error verifying OTP:", error);
//         res.status(500).json({ message: "Internal server error" });
//     }
// });


// app.post("/verify-otp", async (req, res) => {
//     const { mobileNumber, otp } = req.body;

//     if (userOtps[mobileNumber] && userOtps[mobileNumber] === otp) {
//         delete userOtps[mobileNumber]; 
//         res.json({ success: true, message: "OTP verified successfully" });
//     } else {
//         res.status(400).json({ error: "Invalid OTP" });
//     }
// });

router.post("/google-auth", async (req, res) => {
    const { token } = req.body;

    try {

        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const userId = payload["sub"];
        const email = payload["email"];
        const name = payload["name"];

        console.log("Google Auth Success:", { userId, email, name });

        const userRef = db.collection("employees").where("email", "==", email);
        const snapshot = await userRef.get();

        if (snapshot.empty) {
            return res.status(400).json({ error: "User not registered in system" });
        }

        res.json({ success: true, message: "Google authentication successful", user: payload });

    } catch (error) {
        console.error("Google Auth Error:", error);
        res.status(500).json({ error: "Invalid Google token" });
    }
});


// work data
router.post("/generate-secret", async (req, res) => {
    console.log("📌 Received Request:", req.body);
    const mobileNumber = req.body.mobileNumber

    try {
        const { uid, isnew } = req.body; // Get employee ID & isnew flag

        if (!uid) {
            console.log("❌ Employee UID is missing");
            return res.status(400).json({ message: "Employee UID is required" });
        }

        const employeeRef = db.collection("employees").doc(uid);
        const employeeDoc = await employeeRef.get();

        if (!employeeDoc.exists) {
            console.log("❌ Employee not found:", uid);
            return res.status(400).json({ message: "Employee not found." });
        }

        const employeeData = employeeDoc.data();

        // ✅ If secret key exists, return it (DO NOT generate new)
        if (employeeData.secret) {
            console.log("✅ Secret key already exists for", uid);
            return res.json({ secret: employeeData.secret, qrCode: employeeData.qrCode, message: "Secret key already exists." });
        }

        // ❌ If secret key is missing, generate a new one
        console.log("🔑 Generating new secret key for:", uid);
        //const secret = speakeasy.generateSecret({ length: 20 });

        const secret = speakeasy.generateSecret({
            length: 20,
            name: `${employeeData.companyName} (${mobileNumber})`, // ✅ Custom name in Authenticator
            issuer: "MyCompany" // ✅ Issuer name
        });

        // Generate the OTP Auth URL with custom name
        // const otpAuthUrl = `otpauth://totp/${encodeURIComponent("MyCompany:" + employeeName)}?secret=${secret.base32}&issuer=${encodeURIComponent("MyCompany")}`;
        // Generate QR Code
        const otpAuthUrl = secret.otpauth_url;
        const qrCodeImage = await qrcode.toDataURL(otpAuthUrl);

        // Save to Firestore
        await employeeRef.update({ secret: secret.base32, qrCode: qrCodeImage });

        console.log("✅ New Secret Key Generated:", secret.base32);

        res.json({ secret: secret.base32, qrCode: qrCodeImage, message: "New secret key generated." });
    } catch (error) {
        console.error("❌ Error generating secret:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});



module.exports = router