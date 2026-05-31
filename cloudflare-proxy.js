const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for all origins
app.use(cors());
app.use(express.json());

// ============================================
// WHERE TO ADD YOUR CLOUDFLARE CREDENTIALS:
// ============================================
// 
// OPTION A: Set as environment variables in Render Dashboard (RECOMMENDED)
//    - Go to your service in Render → Environment → Add Environment Variable
//    - Add: CLOUDFLARE_ACCOUNT_ID = your_account_id
//    - Add: CLOUDFLARE_API_TOKEN = your_api_token
//
// OPTION B: Hardcode below (NOT RECOMMENDED for security)
//    Replace the placeholders below with your actual credentials
// ============================================

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || "YOUR_ACCOUNT_ID_HERE";
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN || "YOUR_API_TOKEN_HERE";
const MODEL = "@cf/meta/llama-3.1-8b-instruct";

// Check if credentials are configured
if (ACCOUNT_ID === "YOUR_ACCOUNT_ID_HERE" || API_TOKEN === "YOUR_API_TOKEN_HERE") {
    console.warn('⚠️  WARNING: Using default placeholder credentials!');
    console.warn('⚠️  Please set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN environment variables in Render dashboard.');
    console.warn('⚠️  Or edit the cloudflare-proxy.js file directly with your credentials.\n');
}

const CLOUDFLARE_URL = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/ai/run/${MODEL}`;

console.log(`🚀 Vrythos Cloudflare Proxy Starting...`);
console.log(`📡 Proxy URL: http://localhost:${PORT}`);
console.log(`☁️  Cloudflare Model: ${MODEL}`);
console.log(`🔑 Cloudflare Account ID: ${ACCOUNT_ID.substring(0, 10)}...`);

// Health check endpoint
app.get('/health', (req, res) => {
    const isConfigured = ACCOUNT_ID !== "YOUR_ACCOUNT_ID_HERE" && API_TOKEN !== "YOUR_API_TOKEN_HERE";
    res.json({ 
        status: 'ok',
        service: 'Vrythos Cloudflare Proxy',
        cloudflare_configured: isConfigured,
        message: isConfigured ? 'Ready to accept requests' : 'Please configure Cloudflare credentials',
        endpoints: {
            chat: '/api/cloudflare/chat',
            health: '/health'
        }
    });
});

// Main chat endpoint
app.post('/api/cloudflare/chat', async (req, res) => {
    const { messages } = req.body;
    
    // Validate request
    if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ 
            success: false, 
            error: 'Invalid request: messages array required' 
        });
    }
    
    // Check if credentials are configured
    if (ACCOUNT_ID === "YOUR_ACCOUNT_ID_HERE" || API_TOKEN === "YOUR_API_TOKEN_HERE") {
        return res.status(500).json({ 
            success: false, 
            error: 'Cloudflare credentials not configured. Please set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN environment variables.' 
        });
    }
    
    try {
        console.log(`📤 Received request with ${messages.length} messages`);
        
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
            console.log(`✅ Cloudflare response successful`);
            res.json({ 
                success: true, 
                response: data.result.response 
            });
        } else {
            console.error(`❌ Cloudflare API error:`, data.errors);
            res.status(400).json({ 
                success: false, 
                error: data.errors 
            });
        }
    } catch (error) {
        console.error(`❌ Proxy error:`, error.message);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        name: 'Vrythos Cloudflare Proxy',
        version: '1.0.0',
        status: 'running',
        endpoints: {
            chat: 'POST /api/cloudflare/chat',
            health: 'GET /health'
        },
        documentation: 'Send POST requests to /api/cloudflare/chat with { "messages": [...] }'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`\n✅ Server running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/health`);
    console.log(`💬 Chat endpoint: http://localhost:${PORT}/api/cloudflare/chat\n`);
});
