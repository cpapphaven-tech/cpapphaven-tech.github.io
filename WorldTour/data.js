const CATEGORIES = [
    {
        "name": "Iconic Streets & Roads",
        "icon": "\ud83d\udee3\ufe0f",
        "type": "theme",
        "places": [
            {
                "name": "Times Square",
                "country": "USA",
                "lat": 40.758896,
                "lng": -73.98513,
                "heading": 200,
                "pitch": 10
            },
            {
                "name": "Golden Gate Bridge",
                "country": "USA",
                "lat": 37.819929,
                "lng": -122.478255,
                "heading": 180,
                "pitch": 0
            },
            {
                "name": "Champs-\u00c9lys\u00e9es",
                "country": "France",
                "lat": 48.870502,
                "lng": 2.304897,
                "heading": 300,
                "pitch": 5
            },
            {
                "name": "Lombard Street",
                "country": "USA",
                "lat": 37.802111,
                "lng": -122.418721,
                "heading": 90,
                "pitch": 10
            },
            {
                "name": "Abbey Road",
                "country": "UK",
                "lat": 51.532223,
                "lng": -0.177263,
                "heading": 150,
                "pitch": 0
            },
            {
                "name": "Shibuya Crossing",
                "country": "Japan",
                "lat": 35.659556,
                "lng": 139.700547,
                "heading": 270,
                "pitch": 0
            },
            {
                "name": "Las Vegas Strip",
                "country": "USA",
                "lat": 36.114705,
                "lng": -115.172813,
                "heading": 0,
                "pitch": 10
            },
            {
                "name": "Wall Street",
                "country": "USA",
                "lat": 40.706036,
                "lng": -74.008816,
                "heading": 100,
                "pitch": 20
            },
            {
                "name": "Bourbon Street",
                "country": "USA",
                "lat": 29.957502,
                "lng": -90.06644,
                "heading": 45,
                "pitch": 0
            },
            {
                "name": "Ocean Drive, Miami",
                "country": "USA",
                "lat": 25.777484,
                "lng": -80.130985,
                "heading": 0,
                "pitch": 10
            }
        ]
    },
    {
        "name": "Monuments (Street View)",
        "icon": "\ud83c\udfdb\ufe0f",
        "type": "theme",
        "places": [
            {
                "name": "Colosseum (Outside)",
                "country": "Italy",
                "lat": 41.890472,
                "lng": 12.490805,
                "heading": 90,
                "pitch": 10
            },
            {
                "name": "Eiffel Tower (Pont d'I\u00e9na)",
                "country": "France",
                "lat": 48.859663,
                "lng": 2.292558,
                "heading": 120,
                "pitch": 10
            },
            {
                "name": "Statue of Liberty (Ferry View)",
                "country": "USA",
                "lat": 40.688849,
                "lng": -74.04561,
                "heading": 45,
                "pitch": 10
            },
            {
                "name": "Arc de Triomphe",
                "country": "France",
                "lat": 48.873792,
                "lng": 2.295028,
                "heading": 90,
                "pitch": 15
            },
            {
                "name": "Big Ben & Parliament",
                "country": "UK",
                "lat": 51.501065,
                "lng": -0.124584,
                "heading": 120,
                "pitch": 20
            },
            {
                "name": "Brandenburg Gate",
                "country": "Germany",
                "lat": 52.516274,
                "lng": 13.377704,
                "heading": 270,
                "pitch": 10
            },
            {
                "name": "Washington Monument",
                "country": "USA",
                "lat": 38.889484,
                "lng": -77.035278,
                "heading": 90,
                "pitch": 20
            },
            {
                "name": "Mount Rushmore (Viewpoint)",
                "country": "USA",
                "lat": 43.878952,
                "lng": -103.459817,
                "heading": 210,
                "pitch": 20
            },
            {
                "name": "Sydney Opera House (Forecourt)",
                "country": "Australia",
                "lat": -33.857022,
                "lng": 151.21447,
                "heading": 30,
                "pitch": 10
            },
            {
                "name": "Taj Mahal (Main Gate)",
                "country": "India",
                "lat": 27.173891,
                "lng": 78.042068,
                "heading": 0,
                "pitch": 10
            }
        ]
    },
    {
        "name": "Modern Marvels",
        "icon": "\ud83c\udfd9\ufe0f",
        "type": "theme",
        "places": [
            {
                "name": "Burj Khalifa (Street)",
                "country": "UAE",
                "lat": 25.197361,
                "lng": 55.275465,
                "heading": 250,
                "pitch": 40
            },
            {
                "name": "Empire State Building",
                "country": "USA",
                "lat": 40.748342,
                "lng": -73.985011,
                "heading": 300,
                "pitch": 50
            },
            {
                "name": "Tokyo Tower",
                "country": "Japan",
                "lat": 35.658742,
                "lng": 139.745512,
                "heading": 0,
                "pitch": 30
            },
            {
                "name": "Marina Bay Sands",
                "country": "Singapore",
                "lat": 1.284051,
                "lng": 103.859062,
                "heading": 150,
                "pitch": 20
            },
            {
                "name": "CN Tower (Front St)",
                "country": "Canada",
                "lat": 43.642732,
                "lng": -79.387063,
                "heading": 180,
                "pitch": 40
            },
            {
                "name": "Petronas Towers",
                "country": "Malaysia",
                "lat": 3.158102,
                "lng": 101.711586,
                "heading": 180,
                "pitch": 40
            },
            {
                "name": "The Shard",
                "country": "UK",
                "lat": 51.504938,
                "lng": -0.086029,
                "heading": 200,
                "pitch": 40
            },
            {
                "name": "Space Needle",
                "country": "USA",
                "lat": 47.619864,
                "lng": -122.348604,
                "heading": 0,
                "pitch": 30
            },
            {
                "name": "Willis Tower",
                "country": "USA",
                "lat": 41.878876,
                "lng": -87.635915,
                "heading": 90,
                "pitch": 40
            },
            {
                "name": "One World Trade Center",
                "country": "USA",
                "lat": 40.713,
                "lng": -74.013146,
                "heading": 180,
                "pitch": 40
            }
        ]
    },
    {
        "name": "North America",
        "icon": "\ud83d\udccd",
        "type": "continent",
        "places": [
            {
                "name": "Central Park South",
                "country": "USA",
                "lat": 40.765668,
                "lng": -73.977239,
                "heading": 330,
                "pitch": 10
            },
            {
                "name": "Hollywood Boulevard",
                "country": "USA",
                "lat": 34.101569,
                "lng": -118.326759,
                "heading": 270,
                "pitch": 10
            },
            {
                "name": "Brooklyn Bridge (Drive)",
                "country": "USA",
                "lat": 40.705976,
                "lng": -73.996841,
                "heading": 110,
                "pitch": 10
            },
            {
                "name": "Old Quebec City",
                "country": "Canada",
                "lat": 46.812328,
                "lng": -71.205021,
                "heading": 45,
                "pitch": 10
            },
            {
                "name": "Miami Beach",
                "country": "USA",
                "lat": 25.790654,
                "lng": -80.130045,
                "heading": 90,
                "pitch": 0
            },
            {
                "name": "Navy Pier",
                "country": "USA",
                "lat": 41.891823,
                "lng": -87.605051,
                "heading": 90,
                "pitch": 0
            },
            {
                "name": "Santa Monica Pier",
                "country": "USA",
                "lat": 34.010103,
                "lng": -118.496296,
                "heading": 230,
                "pitch": 0
            },
            {
                "name": "Pike Place Market",
                "country": "USA",
                "lat": 47.609467,
                "lng": -122.341645,
                "heading": 330,
                "pitch": 0
            }
        ]
    },
    {
        "name": "Europe",
        "icon": "\ud83d\udccd",
        "type": "continent",
        "places": [
            {
                "name": "Louvre Pyramid (Street)",
                "country": "France",
                "lat": 48.861073,
                "lng": 2.335967,
                "heading": 90,
                "pitch": 10
            },
            {
                "name": "Pantheon (Piazza)",
                "country": "Italy",
                "lat": 41.898862,
                "lng": 12.476839,
                "heading": 180,
                "pitch": 20
            },
            {
                "name": "Buckingham Palace (Gates)",
                "country": "UK",
                "lat": 51.501364,
                "lng": -0.14189,
                "heading": 270,
                "pitch": 10
            },
            {
                "name": "Trevi Fountain (Street)",
                "country": "Italy",
                "lat": 41.900989,
                "lng": 12.483321,
                "heading": 90,
                "pitch": 10
            },
            {
                "name": "Tower Bridge",
                "country": "UK",
                "lat": 51.505456,
                "lng": -0.075356,
                "heading": 180,
                "pitch": 10
            },
            {
                "name": "Piccadilly Circus",
                "country": "UK",
                "lat": 51.510067,
                "lng": -0.133869,
                "heading": 270,
                "pitch": 20
            },
            {
                "name": "Duomo di Milano",
                "country": "Italy",
                "lat": 45.464161,
                "lng": 9.189585,
                "heading": 90,
                "pitch": 20
            },
            {
                "name": "Sagrada Familia (Street)",
                "country": "Spain",
                "lat": 41.403204,
                "lng": 2.174668,
                "heading": 330,
                "pitch": 30
            }
        ]
    },
    {
        "name": "Asia",
        "icon": "\ud83d\udccd",
        "type": "continent",
        "places": [
            {
                "name": "Burj Al Arab (Road)",
                "country": "UAE",
                "lat": 25.141151,
                "lng": 55.185265,
                "heading": 300,
                "pitch": 10
            },
            {
                "name": "Orchard Road",
                "country": "Singapore",
                "lat": 1.30396,
                "lng": 103.831969,
                "heading": 135,
                "pitch": 10
            },
            {
                "name": "Akihabara",
                "country": "Japan",
                "lat": 35.698353,
                "lng": 139.773114,
                "heading": 0,
                "pitch": 10
            },
            {
                "name": "The Bund",
                "country": "China",
                "lat": 31.239611,
                "lng": 121.489725,
                "heading": 90,
                "pitch": 0
            },
            {
                "name": "Hong Kong Victoria Harbour",
                "country": "Hong Kong",
                "lat": 22.29345,
                "lng": 114.169123,
                "heading": 180,
                "pitch": 0
            },
            {
                "name": "Gyeongbokgung Palace (Gate)",
                "country": "South Korea",
                "lat": 37.575936,
                "lng": 126.976822,
                "heading": 0,
                "pitch": 10
            },
            {
                "name": "Asakusa Kaminarimon",
                "country": "Japan",
                "lat": 35.710729,
                "lng": 139.796395,
                "heading": 0,
                "pitch": 10
            },
            {
                "name": "Dubai Marina",
                "country": "UAE",
                "lat": 25.078426,
                "lng": 55.140228,
                "heading": 45,
                "pitch": 10
            }
        ]
    }
];