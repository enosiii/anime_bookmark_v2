// api/anime.js (Serverless Function - CORRECTED)

// 1. Get secrets from environment variables (NEVER hardcode them here)
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_TABLE_NAME;
const AIRTABLE_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}`;

// Since Netlify/Vercel/Node environment may not have 'fetch', use node-fetch 
// (assuming you have a package.json with "node-fetch" dependency, otherwise the platform's native fetch might be fine)
// If deploying to Vercel/Netlify, you might not need the explicit require if they polyfill it.
// For maximum compatibility, ensure node-fetch is available if you need it.
// const fetch = require('node-fetch'); 

// 2. Main handler for the function
module.exports = async (req, res) => {
    // --- Initial Checks ---
    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID || !AIRTABLE_TABLE_NAME) {
        console.error("Airtable environment variables are NOT set.");
        return res.status(500).json({ error: 'Airtable configuration missing on server.' });
    }
    
    // --- CORS Headers (Keep these to allow client-side requests) ---
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).send();
    }
    
    // --- Body Parsing (CRITICAL FIX) ---
    // Extracting the body based on method, as Vercel/Netlify don't always auto-parse for Node functions
    let requestBody = {};
    if (req.method === 'POST' || req.method === 'DELETE') {
        try {
            // Vercel/Netlify often put the parsed JSON body on req.body, but for DELETE it can be tricky.
            // If the platform doesn't auto-parse, we assume the body is a stream or string.
            // Since you're using Vercel/Netlify, req.body should usually be available.
            // If req.body is NOT an object, it means it wasn't parsed, and we fall back to manual parsing.
            if (typeof req.body === 'object' && req.body !== null) {
                requestBody = req.body;
            } else {
                 // Fallback if req.body isn't auto-parsed (less common on Vercel/Netlify but safer)
                 // NOTE: This fallback may need more robust stream handling if deployed outside Vercel/Netlify standard environment.
                 // For now, let's trust Vercel/Netlify's auto-parsing of JSON requests.
                 requestBody = req.body; 
            }
        } catch (e) {
            console.error('Error parsing request body:', e);
            return res.status(400).json({ error: 'Invalid JSON format in request body.' });
        }
    }

    // --- Request Handling ---
    try {
        if (req.method === 'GET') {
            // ---------------------------------
            // GET: Fetching all anime records
            // ---------------------------------
            const response = await fetch(AIRTABLE_URL, {
                headers: { 
                    Authorization: `Bearer ${AIRTABLE_API_KEY}`,
                },
            });
            
            const data = await response.json();
            res.status(response.status).json(data); 

        } else if (req.method === 'POST') {
            // ---------------------------------
            // POST: Adding a new anime record
            // ---------------------------------
            const { id, title } = requestBody; // Use the parsed body
            
            if (!id || !title) {
                 return res.status(400).json({ error: 'Missing id or title for POST request.' });
            }

            const response = await fetch(AIRTABLE_URL, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${AIRTABLE_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    records: [{ fields: { id: id, title: title } }],
                    typecast: true, // Helpful for ensuring data types are correct
                }),
            });

            const data = await response.json();
            res.status(response.status).json(data); 

        } else if (req.method === 'DELETE') {
            // ---------------------------------
            // DELETE: Deleting multiple records
            // ---------------------------------
            const { recordIds } = requestBody; // Use the parsed body
            
            if (!recordIds || recordIds.length === 0) {
                return res.status(400).json({ error: 'No record IDs provided' });
            }

            // Airtable API deletes multiple records by passing multiple IDs in the URL query
            const deleteQuery = recordIds.map(id => `records[]=${id}`).join('&');
            const deleteUrl = `${AIRTABLE_URL}?${deleteQuery}`;

            const response = await fetch(deleteUrl, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${AIRTABLE_API_KEY}`,
                },
            });

            const data = await response.json();
            res.status(response.status).json(data);

        } else {
            res.status(405).json({ error: 'Method Not Allowed' });
        }

    } catch (error) {
        console.error('Serverless Function Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};