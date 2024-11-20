export const getMapData = async () => {
    try {
        // Retrieve the JWT token from localStorage
        const token = localStorage.getItem('token');

        // Add the Authorization header with the Bearer token
        const response = await fetch("http://localhost:8000/map", {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        return await response.json();
    } catch (err) {
        throw new Error("Failed to fetch map data: " + err.message);
    }
};