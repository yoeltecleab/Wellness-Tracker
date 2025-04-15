import time

import requests
from geopy.distance import geodesic


class Location:
    @staticmethod
    def get_nearest_location(address, store):
        # Step 1: Geocode the address
        geocode_url = "https://nominatim.openstreetmap.org/search"
        try:
            start = time.time()
            geocode_response = requests.get(
                geocode_url,
                params={"q": address, "format": "json"},
                headers={"User-Agent": "YourAppName/1.0"}  # Required by Nominatim
            )
            geocode_response.raise_for_status()
            geocode_data = geocode_response.json()
            print(f"Geocode took {time.time() - start} seconds")
        except Exception as e:
            # return f"Geocoding error: {e}"
            return {
                'address': f'Geocoding error: {e}',
                'full_address': f'Geocoding error: {e}',
                'distance': 0
            },

        if not geocode_data:
            return {
                'address': 'Could not geocode the provided address.',
                'full_address': 'Could not geocode the provided address.',
                'distance': 0
            },

        user_lat = float(geocode_data[0]['lat'])
        user_lon = float(geocode_data[0]['lon'])
        user_coords = (user_lat, user_lon)

        # Step 2: Search for "location" nearby
        search_url = "https://nominatim.openstreetmap.org/search"
        try:
            radius = 0.5
            viewbox = f"{user_lon - radius},{user_lat - radius},{user_lon + radius},{user_lat + radius}"
            start = time.time()
            search_response = requests.get(
                search_url,
                params={
                    "q": store,
                    "format": "json",
                    "lat": user_lat,
                    "lon": user_lon,
                    "bounded": 1,
                    "viewbox": viewbox
                },
                headers={"User-Agent": "YourAppName/1.0"}
            )
            search_response.raise_for_status()
            search_data = search_response.json()
            print(f"Search took {time.time() - start} seconds")
        except Exception as e:
            return f"Search error: {e}"

        if not search_data:
            # return f"No {store} found nearby."
            response = {
                'address': 'Not nearby',
                'full_address': 'Not nearby',
                'distance': 0
            }
            return response
        # Step 3: Find nearest location
        nearest_location = None
        min_distance = float('inf')

        start = time.time()
        for location in search_data:
            try:
                location_lat = float(location['lat'])
                location_lon = float(location['lon'])
                location_coords = (location_lat, location_lon)
                distance = geodesic(user_coords, location_coords).km

                if distance < min_distance:
                    min_distance = distance
                    nearest_location = location
            except (KeyError, ValueError):
                continue  # Skip entries with missing/invalid coordinates
        print(f"Distance calculation took {time.time() - start} seconds")

        # Step 4: Return result
        if nearest_location:
            response = {
                'address': " ".join((nearest_location.get('display_name').split(',')[1:3])),
                'full_address': " ".join(nearest_location.get('display_name').split(',')),
                'distance': round(min_distance, 2)
            }
            return response
        else:
            response = {
                'address': None,
                'full_address': None,
                'distance': None
            }
            return response


if __name__ == "__main__":
    address_input = "9201 University City Blvd, Charlotte, NC 28223"
    store_input = "Walmart"
    start = time.time()
    nearest_address = Location.get_nearest_location(address_input, store_input)
    print(f"Total process took {time.time() - start} seconds")
    print(f"The {store_input} location to {address_input} is likely:\n{nearest_address['full_address']}\n")
