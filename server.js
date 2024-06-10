const express = require('express');
const axios = require('axios');
const session = require('express-session');

const app = express();
const port = 3000;

const client_id = 'dO0CKrXH2rPy0GCVXJzdAS6J9K8YTsTp'; // 이곳에 자신의 client_id를 입력하세요
const client_secret = 'ojvqHhoGoY5odc4q'; // 이곳에 자신의 client_secret을 입력하세요
const redirect_uri = 'http://localhost:3000/callback';

// Configure express-session
app.use(session({
    secret: client_secret,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS
}));
// Endpoint to start the login process
app.get('/login', (req, res) => {
    const authorizationUrl = `https://sandbox-api.dexcom.com/v2/oauth2/login?client_id=${client_id}&redirect_uri=${redirect_uri}&response_type=code&scope=offline_access`;
    res.redirect(authorizationUrl);
});

// Endpoint to handle the callback from the OAuth2 server
app.get('/callback', async (req, res) => {
    const code = req.query.code;

    try {
        const response = await axios.post('https://sandbox-api.dexcom.com/v2/oauth2/token', new URLSearchParams({
            client_id,
            client_secret,
            code,
            grant_type: 'authorization_code',
            redirect_uri,
        }), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        const accessToken = response.data.access_token;
        // Store the access token in the session
        req.session.accessToken = accessToken;
        // Store the access token in a safe way. For demo purposes, we just send it in the response.
        res.send(`Access Token: ${accessToken}`);
    } catch (error) {
        res.status(500).send('Error exchanging code for token');
    }
});

// Function to fetch EGV data from Dexcom API
async function fetchEGVData(accessToken) {
    const { default: fetch } = await import('node-fetch'); // Dynamic import for node-fetch

    const query = new URLSearchParams({
        startDate: '2024-06-09T09:12:35',
        endDate: '2024-06-10T11:55:35'
    }).toString();

    const resp = await fetch(
        `https://sandbox-api.dexcom.com/v3/users/self/alerts?${query}`,
        {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        }
    );

    const data = await resp.text();
    return data;
}

// Endpoint to get EGV data
app.get('/data', async (req, res) => {
    const accessToken = req.session.accessToken; // Retrieve the access token from session

    if (!accessToken) {
        return res.status(400).send('Access token is required. Please authenticate first.');
    }

    try {
        const data = await fetchEGVData(accessToken);
        res.send(data);
    } catch (error) {
        res.status(500).send('Error fetching EGV data');
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
