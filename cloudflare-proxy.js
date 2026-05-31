const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Read credentials from environment variables
const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const MODEL = "@cf/meta/llama-3.1-8b-instruct";

// Check if credentials are configured
if (!ACCOUNT_ID || !API_TOKEN) {
    console.error('❌ ERROR: CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN environment variables must be set');
}

const CLOUDFLARE_URL = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/ai/run/${MODEL}`;

app.post('/api/cloudflare/chat', async (req, res) => {
    const { messages } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: 'messages array required' });
    }
    
    try {
        const response = await fetch(CLOUDFLARE_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ messages })
        });
        
        const data = await response.json();
        
        if (data.success) {
            res.json({ success: true, response: data.result.response });
        } else {
            res.status(400).json({ success: false, error: data.errors });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        cloudflare_configured: !!ACCOUNT_ID && !!API_TOKEN
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Cloudflare proxy running on port ${PORT}`);
});