const CLIENT_ID = 'ab5812d96e5f4b568f903117b3202587'; // Substitua pelo seu CLIENT_ID do Spotify Developer Dashboard
const REDIRECT_URI = 'http://127.0.0.1:5500/index.html'; // URI de redirecionamento configurado no Spotify Dashboard
const SCOPES = [
    'user-library-read',
    'playlist-modify-public',
    'playlist-modify-private',
    'user-top-read'
];

let accessToken = null;

// Autenticação
document.getElementById('loginBtn').addEventListener('click', async () => {
    const authEndpoint = 'https://accounts.spotify.com/authorize';
    const responseType = 'code'; // Usando Authorization Code Flow com PKCE
    
    // Gere um code_verifier e code_challenge para PKCE
    const codeVerifier = generateRandomString(128);
    localStorage.setItem('code_verifier', codeVerifier);
    const codeChallenge = await generateCodeChallenge(codeVerifier);

    window.location = `${authEndpoint}?` + new URLSearchParams({
        client_id: CLIENT_ID,
        response_type: responseType,
        redirect_uri: REDIRECT_URI,
        scope: SCOPES.join(' '),
        code_challenge_method: 'S256',
        code_challenge: codeChallenge
    });
});

// Carregar dados após login
window.addEventListener('load', async () => {
    // Verificar se temos um código de autorização na URL
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
        // Se temos um código, trocamos por um token
        await handleCallback();
        return;
    }
    
    // Verificar se já temos um token armazenado
    if (localStorage.getItem('access_token')) {
        accessToken = localStorage.getItem('access_token');
        document.getElementById('loginBtn').style.display = 'none';
        const contentElement = document.getElementById('content');
        contentElement.classList.add('visible');
        
        await loadUserData();
    }
});

async function loadUserData() {
    try {
        console.log('Carregando dados do usuário...');
        
        // Obter as músicas favoritas do usuário
        const topTracks = await getTopTracks();
        console.log('Faixas obtidas:', topTracks);
        
        if (topTracks && topTracks.items && topTracks.items.length > 0) {
            // Extrair IDs das faixas para obter características de áudio
            const trackIds = topTracks.items
                .filter(item => item && item.track && item.track.id)
                .map(item => item.track.id);
            
            console.log('IDs de faixas para análise:', trackIds);
            
            // Obter características de áudio
            const audioFeatures = await getAudioFeatures(trackIds);
            console.log('Características de áudio obtidas:', audioFeatures);
            
            // Exibir faixas
            displayTopTracks(topTracks);
            
            // Analisar perfil musical
            analyzeMusicProfile(topTracks, audioFeatures);
            
            // Configurar gerador de playlist
            setupPlaylistGenerator(topTracks);
            
            console.log('Dados do usuário carregados com sucesso');
        } else {
            console.error('Nenhuma música encontrada');
            document.getElementById('topTracks').innerHTML = '<p>Nenhuma música favorita encontrada.</p>';
            document.getElementById('moodSummary').innerHTML = '<p>Não foi possível analisar seu perfil musical. Nenhuma música encontrada.</p>';
        }
    } catch(error) {
        console.error('Erro ao carregar dados:', error);
        document.getElementById('topTracks').innerHTML = `<p>Erro ao carregar músicas: ${error.message}</p>`;
        document.getElementById('moodSummary').innerHTML = `<p>Erro ao analisar perfil musical: ${error.message}</p>`;
    }
}

// Obter músicas favoritas
async function getTopTracks() {
    const response = await fetch('https://api.spotify.com/v1/me/tracks?limit=50', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    return response.json();
}

// Obter características musicais
async function getAudioFeatures(trackIds) {
    if (!trackIds || trackIds.length === 0) return { audio_features: [] };
    
    const response = await fetch(`https://api.spotify.com/v1/audio-features?ids=${trackIds.join(',')}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    return response.json();
}

// Analisar perfil musical
function analyzeMusicProfile(tracks, features) {
    const analysis = {
        danceability: 0,
        energy: 0,
        valence: 0,
        genres: {},
        eras: {},
        audio_features: features.audio_features || []
    };

    // Análise de características
    if (features && features.audio_features) {
        features.audio_features.forEach(feat => {
            if (feat) {
                analysis.danceability += feat.danceability || 0;
                analysis.energy += feat.energy || 0;
                analysis.valence += feat.valence || 0;
            }
        });
    }

    // Análise de gêneros e décadas
    if (tracks && tracks.items) {
        tracks.items.forEach(track => {
            if (track && track.track) {
                // Processamento de artistas
                if (track.track.artists) {
                    track.track.artists.forEach(artist => {
                        // Usando Promise para lidar com chamadas assíncronas
                        getArtist(artist.id).then(artistData => {
                            if (artistData && artistData.genres) {
                                artistData.genres.forEach(genre => {
                                    analysis.genres[genre] = (analysis.genres[genre] || 0) + 1;
                                });
                                // Atualizar a exibição após obter dados do artista
                                displayMusicAnalysis(analysis);
                            }
                        }).catch(err => console.error('Erro ao obter dados do artista:', err));
                    });
                }
                
                // Processamento de década
                if (track.track.album && track.track.album.release_date) {
                    const releaseYear = track.track.album.release_date.split('-')[0];
                    const decade = `${Math.floor(releaseYear / 10) * 10}s`;
                    analysis.eras[decade] = (analysis.eras[decade] || 0) + 1;
                }
            }
        });
    }

    // Exibir análise inicial
    displayMusicAnalysis(analysis);
}

// Gerar playlist automática
async function generateSmartPlaylist(tracks) {
    try {
        // Mostrar mensagem de carregamento
        const playlistContainer = document.getElementById('generatedPlaylist');
        playlistContainer.innerHTML = '<p>Criando sua playlist personalizada...</p>';
        
        // Obter ID do usuário
        const userId = await getUserId();
        
        // Criar a playlist
        const playlist = await createPlaylist(userId, 'Playlist Inteligente - GeckosFy');
        
        if (!playlist || !playlist.id) {
            throw new Error('Não foi possível criar a playlist');
        }
        
        // Verificar se temos faixas para adicionar
        if (!tracks || !tracks.items || tracks.items.length === 0) {
            throw new Error('Nenhuma faixa disponível para adicionar à playlist');
        }
        
        // Extrair URIs das faixas
        const uris = tracks.items
            .filter(item => item && item.track && item.track.uri)
            .map(item => item.track.uri);
        
        if (uris.length === 0) {
            throw new Error('Nenhuma faixa válida para adicionar à playlist');
        }
        
        // Adicionar faixas à playlist
        const result = await addTracksToPlaylist(playlist.id, uris);
        
        // Exibir resultado
        playlistContainer.innerHTML = `
            <p>Playlist criada com sucesso!</p>
            <a href="${playlist.external_urls.spotify}" target="_blank">Abrir no Spotify</a>
        `;
        
        console.log('Playlist criada:', playlist);
        return playlist;
    } catch (error) {
        console.error('Erro ao gerar playlist:', error);
        document.getElementById('generatedPlaylist').innerHTML = `
            <p>Erro ao criar playlist: ${error.message}</p>
        `;
        return null;
    }
}

// Funções auxiliares da API
async function getArtist(artistId) {
    const response = await fetch(`https://api.spotify.com/v1/artists/${artistId}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    return response.json();
}

async function getUserId() {
    const response = await fetch('https://api.spotify.com/v1/me', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const data = await response.json();
    return data.id;
}

async function createPlaylist(userId, name) {
    const response = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: name,
            public: true
        })
    });
    return response.json();
}

function generateRandomString(length) {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const values = crypto.getRandomValues(new Uint8Array(length));
    return values.reduce((acc, x) => acc + possible[x % possible.length], '');
}

// Gerar code_challenge
async function generateCodeChallenge(codeVerifier) {
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

// Após o redirecionamento, troque o code por um token
async function handleCallback() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const codeVerifier = localStorage.getItem('code_verifier');

    if (code) {
        try {
            const response = await fetch('https://accounts.spotify.com/api/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    client_id: CLIENT_ID,
                    grant_type: 'authorization_code',
                    code: code,
                    redirect_uri: REDIRECT_URI,
                    code_verifier: codeVerifier
                })
            });

            const data = await response.json();
            if (data.access_token) {
                accessToken = data.access_token;
                localStorage.setItem('access_token', accessToken);
                
                // Limpar a URL para remover o código
                window.history.replaceState({}, document.title, '/index.html');
                
                // Mostrar o conteúdo e esconder o botão de login
                document.getElementById('loginBtn').style.display = 'none';
                const contentElement = document.getElementById('content');
                contentElement.classList.add('visible');
                
                // Carregar dados do usuário
                await loadUserData();
            } else {
                console.error('Erro ao obter token:', data);
            }
        } catch (error) {
            console.error('Erro durante autenticação:', error);
        }
    }
}


// Exibir músicas favoritas
function displayTopTracks(tracks) {
    const container = document.getElementById('topTracks');
    container.innerHTML = '';
    
    if (!tracks.items || tracks.items.length === 0) {
        container.innerHTML = '<p>Nenhuma música encontrada</p>';
        return;
    }
    
    tracks.items.slice(0, 10).forEach(item => {
        const track = item.track;
        const artists = track.artists.map(artist => artist.name).join(', ');
        const albumImg = track.album.images[1] ? track.album.images[1].url : '';
        
        const trackElement = document.createElement('div');
        trackElement.className = 'track-item';
        trackElement.innerHTML = `
            <img src="${albumImg}" alt="${track.name}">
            <div class="track-info">
                <h3>${track.name}</h3>
                <p>${artists}</p>
            </div>
        `;
        
        container.appendChild(trackElement);
    });
}

// Exibir análise musical
function displayMusicAnalysis(analysis) {
    const container = document.getElementById('moodSummary');
    if (!container) return;
    
    // Normalizar valores
    const totalTracks = analysis.audio_features?.length || 1;
    const avgDanceability = analysis.danceability / totalTracks;
    const avgEnergy = analysis.energy / totalTracks;
    const avgValence = analysis.valence / totalTracks;
    
    // Determinar o humor predominante
    let mood = 'Neutro';
    if (avgValence > 0.6 && avgEnergy > 0.6) mood = 'Animado e Feliz';
    else if (avgValence < 0.4 && avgEnergy > 0.6) mood = 'Energético mas Melancólico';
    else if (avgValence > 0.6 && avgEnergy < 0.4) mood = 'Calmo e Positivo';
    else if (avgValence < 0.4 && avgEnergy < 0.4) mood = 'Introspectivo';
    else if (avgDanceability > 0.7) mood = 'Dançante';
    
    // Encontrar gêneros mais comuns
    const topGenres = Object.entries(analysis.genres || {})
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([genre]) => genre)
        .join(', ');
    
    // Encontrar décadas mais comuns
    const topEras = Object.entries(analysis.eras || {})
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([era]) => era)
        .join(' e ');
    
    container.innerHTML = `
        <p><strong>Seu humor musical:</strong> ${mood}</p>
        <p><strong>Gêneros favoritos:</strong> ${topGenres || 'Não identificado'}</p>
        <p><strong>Épocas preferidas:</strong> ${topEras || 'Variadas'}</p>
        <div class="mood-meters">
            <div class="meter">
                <label>Dançabilidade</label>
                <progress value="${avgDanceability || 0}" max="1"></progress>
            </div>
            <div class="meter">
                <label>Energia</label>
                <progress value="${avgEnergy || 0}" max="1"></progress>
            </div>
            <div class="meter">
                <label>Positividade</label>
                <progress value="${avgValence || 0}" max="1"></progress>
            </div>
        </div>
    `;
}

// Configurar gerador de playlist
function setupPlaylistGenerator(tracks) {
    const generateBtn = document.getElementById('generatePlaylistBtn');
    if (!generateBtn) {
        console.error('Botão de gerar playlist não encontrado');
        return;
    }
    
    // Remover event listeners anteriores para evitar duplicação
    const newBtn = generateBtn.cloneNode(true);
    generateBtn.parentNode.replaceChild(newBtn, generateBtn);
    
    // Adicionar novo event listener
    newBtn.addEventListener('click', async () => {
        try {
            console.log('Gerando playlist...');
            await generateSmartPlaylist(tracks);
        } catch (error) {
            console.error('Erro ao gerar playlist:', error);
            document.getElementById('generatedPlaylist').innerHTML = `
                <p>Erro ao criar playlist: ${error.message}</p>
            `;
        }
    });
    
    console.log('Botão de gerar playlist configurado');
}

// Adicionar faixas à playlist
async function addTracksToPlaylist(playlistId, trackUris) {
    const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            uris: trackUris
        })
    });
    return response.json();
}