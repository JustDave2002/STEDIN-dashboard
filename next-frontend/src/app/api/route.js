const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

export const getMapData = async () => {
    try {
        // Retrieve the JWT token from localStorage
        const token = localStorage.getItem('token');

        // Add the Authorization header with the Bearer token
        const response = await fetch(`${backendUrl}/map`, {
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

export const getDeviceData = async () => {
    try {
        // Retrieve the JWT token from localStorage
        const token = localStorage.getItem('token');

        // Add the Authorization header with the Bearer token
        const response = await fetch(`${backendUrl}/devices`, {
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
        throw new Error("Failed to fetch device data: " + err.message);
    }
};

export const getEligibleDevices = async (appId) => {
    try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${backendUrl}/eligible-devices`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ application_id: appId }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        return await response.json();
    } catch (err) {
        throw new Error("Failed to fetch eligible devices: " + err.message);
    }
};
