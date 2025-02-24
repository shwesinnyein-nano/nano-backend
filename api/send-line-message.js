

const express = require("express");
const axios = require("axios");
const cors = require("cors");
const router = express.Router();
const app = express();
app.use(express.json());

// Allow CORS for all origins (you can specify allowed origins)
app.use(cors({
    origin: "*", // Allow all domains
    methods: "GET, POST, PUT, DELETE, OPTIONS", // Allow all methods
    allowedHeaders: "*", // Allow all headers
}));
const LINE_API_URL = "https://api.line.me/v2/bot/message/push";
const CHANNEL_ACCESS_TOKEN = '65ZvV/uf2j+pKODRkZDmHy1cAB7j+2sWenSff8NB9TarzyQXM3Oc1v9evdpmWMZT5THwCmqa0tIM5KFwxuqbgwrfz82uB6Y25QlCAAMOpDCOqN6eN7RFpLxa4hxN+EbrwlnJN42mOyUfyHFtA3Dj5AdB04t89/1O/w1cDnyilFU=';

router.get('/', (req, res) => {
    res.json({ message: 'Line route working!' });
});
router.post("/send-line-message", async (req, res) => {

    try {
        const { userId, message } = req.body;

        const response = await axios.post(
            LINE_API_URL,
            {
                to: userId,
                messages: [{ type: "text", text: message }],
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}`,
                },
            }
        );

        res.status(200).json({ success: true, data: response.data });
    } catch (error) {
        console.error("Error sending LINE message:", error.response?.data || error.message);
        res.status(500).json({ success: false, error: error.response?.data || error.message });
    }
});

// const PORT = 8080;
// app.listen(PORT, () => {
//     console.log(`Server running on http://localhost:${PORT}`);
// });


module.exports = router