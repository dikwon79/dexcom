const express = require('express');
const axios = require('axios');
const app = express();
const port = 3000;

const client_id = 'dO0CKrXH2rPy0GCVXJzdAS6J9K8YTsTp'; // 이곳에 자신의 client_id를 입력하세요
const client_secret = 'AhqNNCthtzxbywbQ'; // 이곳에 자신의 client_secret을 입력하세요
const redirect_uri = 'http://localhost:3000/callback';

app.get('/login', (req, res) => {
    const authorizationUrl = `https://api.dexcom.com/v2/oauth2/login?client_id=${client_id}&redirect_uri=${redirect_uri}&response_type=code&scope=offline_access`;
    res.redirect(authorizationUrl);
});

app.get('/callback', async (req, res) => {
    const code = req.query.code;

    try {
        const response = await axios.post('https://api.dexcom.com/v2/oauth2/token', null, {
            params: {
                client_id,
                client_secret,
                code,
                grant_type: 'authorization_code',
                redirect_uri,
            },
        });

        const accessToken = response.data.access_token;
        res.send(`Access Token: ${accessToken}`);
    } catch (error) {
        res.status(500).send('Error exchanging code for token');
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
