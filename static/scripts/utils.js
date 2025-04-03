export async function fetchDataFromApi(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            // return Error(`HTTP error! Status: ${response.status}`);
            return null;
        }
         // Parse JSON data
        return await response.json(); // Return data so app.js can use it
    } catch (error) {
        console.error("Error fetching data:", error);
        return null; // Handle errors gracefully
    }
}