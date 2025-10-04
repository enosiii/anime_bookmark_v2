// api/anime.js (Serverless Function)

// 1. Get secrets from environment variables (NEVER hardcode them here)
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_TABLE_NAME;
const AIRTABLE_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}`;

// Use node-fetch for server-side HTTP requests
const fetch = require('node-fetch'); 

// 2. Main handler for the function
module.exports = async (req, res) => {
    // Set CORS headers for PWA to communicate with the API
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests (required for POST/DELETE from browser)
    if (req.method === 'OPTIONS') {
        return res.status(200).send();
    }
    
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
            // Send the data back to the PWA
            res.status(response.status).json(data); 

        } else if (req.method === 'POST') {
            // ---------------------------------
            // POST: Adding a new anime record
            // ---------------------------------
            const { id, title } = req.body;
            
            const response = await fetch(AIRTABLE_URL, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${AIRTABLE_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    fields: { id, title },
                }),
            });

            const data = await response.json();
            res.status(response.status).json(data); 

        } else if (req.method === 'DELETE') {
            // ---------------------------------
            // DELETE: Deleting multiple records
            // ---------------------------------
            const { recordIds } = req.body; // Array of Airtable record IDs
            
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