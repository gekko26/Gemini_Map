export async function geocodePlace(place: string): Promise<[number, number] | null> {
  try {
    // Adding limit=1 and addressdetails=0 makes the response smaller and faster
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(place)}`;

    const res = await fetch(url, {
      headers: {
        // Nominatim requests a User-Agent to prevent bot blocking
        'User-Agent': 'AI-Explorer-App/1.0'
      }
    });

    const data = await res.json();

    if (data && data.length > 0) {
      // Nominatim returns [lat, lon] strings, we return [number, number]
      return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
    }
    
    return null;
  } catch (err) {
    console.error("Geocoding error:", err);
    return null;
  }
}