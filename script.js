// main.js (Client-Side PWA Script - SECRETS REMOVED)

document.addEventListener('DOMContentLoaded', () => {
    const animeList = document.getElementById('anime-list');
    const addButton = document.getElementById('add-button');
    const deleteButton = document.getElementById('delete-button');
    const addContainer = document.getElementById('add-container');
    const deleteContainer = document.getElementById('delete-container');
    const submitButton = document.getElementById('submit-button');
    const animeIdInput = document.getElementById('anime-id');
    const animeTitleInput = document.getElementById('anime-title');
    const notification = document.getElementById('notification');
    const deleteList = document.getElementById('delete-list');
    const confirmDeleteButton = document.getElementById('confirm-delete');

    // **IMPORTANT:** The secrets (API Key, Base ID, Table Name) have been REMOVED.
    // All communication now goes through the secure serverless function proxy.
    const API_ENDPOINT = '/api/anime';

    // NOW (Absolute Path - good for local Live Server testing):
    // const API_ENDPOINT = 'https://anime-bookmark-v2.vercel.app/api/anime'; 


    let animeData = [];

    // Load data from cache
    function loadCache() {
        const cachedData = localStorage.getItem('animeData');
        if (cachedData) {
            animeData = JSON.parse(cachedData);
            renderAnimeList();
        }
    }

    // Save data to cache
    function saveCache() {
        localStorage.setItem('animeData', JSON.stringify(animeData));
    }

    // Fetch anime data from the new API proxy and update cache if needed
    async function fetchAnimeData(forceUpdate = false) {
        try {
            // Fetching data from the secure API proxy
            const response = await fetch(API_ENDPOINT);
            
            if (!response.ok) {
                throw new Error(`API response status: ${response.status}`);
            }
            
            const data = await response.json();
            const newAnimeData = data.records.map(record => ({
                id: record.fields.id,
                title: record.fields.title,
                recordId: record.id, // Airtable record ID for deletion
            }));

            if (JSON.stringify(newAnimeData) !== JSON.stringify(animeData) || forceUpdate) {
                animeData = newAnimeData;
                saveCache(); // Update cache
                renderAnimeList();
            }
        } catch (error) {
            console.error('Error fetching anime data:', error);
        }
    }

    // Render anime list
    function renderAnimeList() {
        animeList.innerHTML = '';
        animeData.sort((a, b) => a.title.localeCompare(b.title)).forEach(anime => {
            const button = document.createElement('button');
            button.className = 'anime-button';
            button.textContent = anime.title;
            // Assuming the external link structure remains the same
            button.onclick = () => window.open(`https://animepahe.si/a/${anime.id}`, '_blank');
            animeList.appendChild(button);
        });
    }

    // Show add container and hide delete container
    addButton.addEventListener('click', () => {
        addContainer.classList.remove('hidden');
        deleteContainer.classList.add('hidden');
    });

    // Show delete container and hide add container
    deleteButton.addEventListener('click', () => {
        deleteContainer.classList.remove('hidden');
        addContainer.classList.add('hidden');
        renderDeleteList();
    });

    // Render delete list
    function renderDeleteList() {
        deleteList.innerHTML = '';
        animeData.forEach((anime, index) => {
            const item = document.createElement('div');
            item.className = 'delete-list-item';
            item.innerHTML = `
                <input type="checkbox" id="anime-${index}" value="${anime.recordId}" class="cyberpunk-checkbox">
                <label for="anime-${index}">${anime.title}</label>
            `;
            deleteList.appendChild(item);
        });
    }

    // Submit new anime using the API proxy
    submitButton.addEventListener('click', async () => {
        const id = animeIdInput.value.trim();
        const title = animeTitleInput.value.trim();

        if (id && title) {
            try {
                // Sending POST request to the API proxy
                const response = await fetch(API_ENDPOINT, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    // Send only the required fields. Proxy adds Airtable structure/auth.
                    body: JSON.stringify({ id, title }), 
                });

                if (response.ok) {
                    fetchAnimeData(true); // Force update cache
                    animeIdInput.value = '';
                    animeTitleInput.value = '';
                    notification.textContent = `${title} added to the list!`;
                    notification.classList.remove('hidden');
                    setTimeout(() => notification.classList.add('hidden'), 7000);
                } else {
                    throw new Error(`POST failed with status: ${response.status}`);
                }
            } catch (error) {
                console.error('Error adding anime: ', error);
            }
        }
    });

    // Confirm delete using the API proxy
    confirmDeleteButton.addEventListener('click', async () => {
        const selectedAnime = Array.from(document.querySelectorAll('.delete-list-item input:checked'))
            .map(input => input.value); // These are the Airtable record IDs

        if (selectedAnime.length > 0) {
            if (confirm(`🗑️ Do you want to delete the Anime:\n🔹${selectedAnime.map(recordId => animeData.find(anime => anime.recordId === recordId).title).join('\n🔹')}`)) {
                try {
                    // Sending DELETE request with record IDs to the API proxy
                    const response = await fetch(API_ENDPOINT, {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        // Send an array of record IDs to be deleted
                        body: JSON.stringify({ recordIds: selectedAnime }), 
                    });

                    if (response.ok) {
                        fetchAnimeData(true); // Force update cache
                        renderDeleteList();
                        deleteContainer.classList.add('hidden');
                    } else {
                        throw new Error(`DELETE failed with status: ${response.status}`);
                    }
                } catch (error) {
                    console.error('Error deleting anime: ', error);
                }
            }
        }
    });

    // Load cached data first, then fetch new data in the background
    loadCache();
    fetchAnimeData();
});