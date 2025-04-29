// Using built-in fetch API
const API_KEY = 'gEeMyW1mZSJ2erGENUNWl9rCvAcqjtNXiHzko5Vd';
const BASE_URL = 'https://api.sportradar.com/mlb/trial/v8';

async function testSportradarAPI() {
    try {
        // Get today's date in YYYY/MM/DD format
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        
        const url = `${BASE_URL}/en/games/${year}/${month}/${day}/boxscore.json?api_key=${API_KEY}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}, statusText: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Return more detailed information
        return {
            success: true,
            data: data,
            status: response.status,
            debugInfo: {
                url: url,
                responseStatus: response.status,
                responseStatusText: response.statusText,
                timestamp: new Date().toISOString()
            }
        };
    } catch (error: unknown) {
        const errorResponse = {
            success: false,
            error: error instanceof Error ? error.message : 'An unknown error occurred',
            details: String(error),
            debugInfo: {
                timestamp: new Date().toISOString(),
                errorType: error instanceof Error ? error.name : 'Unknown Error Type'
            }
        };
        return errorResponse;
    }
}

export { testSportradarAPI }; 