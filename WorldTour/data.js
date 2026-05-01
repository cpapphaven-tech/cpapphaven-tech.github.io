const CATEGORIES = [
    {
        "name": "Argentina",
        "icon": "\ud83d\udccd",
        "type": "country",
        "places": [
            {
                "name": "Buenos Aires (Obelisco)",
                "country": "Argentina",
                "lat": -34.6037,
                "lng": -58.3816,
                "heading": 270,
                "pitch": 20
            }
        ]
    },
    {
        "name": "Australia",
        "icon": "\ud83d\udccd",
        "type": "country",
        "places": [
            {
                "name": "Sydney Opera House (Forecourt)",
                "country": "Australia",
                "lat": -33.857022,
                "lng": 151.21447,
                "heading": 30,
                "pitch": 10
            },
            {
                "name": "Sydney (Harbour Bridge Road)",
                "country": "Australia",
                "lat": -33.8523,
                "lng": 151.2108,
                "heading": 180,
                "pitch": 0
            },
            {
                "name": "Melbourne (Flinders St)",
                "country": "Australia",
                "lat": -37.8183,
                "lng": 144.9671,
                "heading": 90,
                "pitch": 10
            },
            {
                "name": "Gold Coast (Surfers Paradise)",
                "country": "Australia",
                "lat": -28.0,
                "lng": 153.43,
                "heading": 0,
                "pitch": 0
            }
        ]
    },
    {
        "name": "Austria",
        "icon": "\ud83d\udccd",
        "type": "country",
        "places": [
            {
                "name": "Vienna (Sch\u00f6nbrunn Gates)",
                "country": "Austria",
                "lat": 48.1856,
                "lng": 16.315,
                "heading": 180,
                "pitch": 10
            }
        ]
    },
    {
        "name": "Belgium",
        "icon": "\ud83d\udccd",
        "type": "country",
        "places": [
            {
                "name": "Brussels (Grand Place)",
                "country": "Belgium",
                "lat": 50.8467,
                "lng": 4.3525,
                "heading": 180,
                "pitch": 20
            }
        ]
    },
    {
        "name": "Brazil",
        "icon": "\ud83d\udccd",
        "type": "country",
        "places": [
            {
                "name": "Rio de Janeiro (Copacabana Beach)",
                "country": "Brazil",
                "lat": -22.9711,
                "lng": -43.1822,
                "heading": 180,
                "pitch": 0
            },
            {
                "name": "Sao Paulo (Paulista Avenue)",
                "country": "Brazil",
                "lat": -23.5615,
                "lng": -46.6559,
                "heading": 90,
                "pitch": 10
            }
        ]
    },
    {
        "name": "Canada",
        "icon": "\ud83d\udccd",
        "type": "country",
        "places": [
            {
                "name": "CN Tower (Front St)",
                "country": "Canada",
                "lat": 43.642732,
                "lng": -79.387063,
                "heading": 180,
                "pitch": 40
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
                "name": "Toronto (Yonge-Dundas Sq)",
                "country": "Canada",
                "lat": 43.6561,
                "lng": -79.3802,
                "heading": 180,
                "pitch": 10
            },
            {
                "name": "Vancouver (Stanley Park Drive)",
                "country": "Canada",
                "lat": 49.3,
                "lng": -123.14,
                "heading": 270,
                "pitch": 0
            },
            {
                "name": "Montreal (Old Port Road)",
                "country": "Canada",
                "lat": 45.5052,
                "lng": -73.5535,
                "heading": 90,
                "pitch": 0
            }
        ]
    },
    {
        "name": "Chile",
        "icon": "\ud83d\udccd",
        "type": "country",
        "places": [
            {
                "name": "Santiago (Plaza de Armas)",
                "country": "Chile",
                "lat": -33.4379,
                "lng": -70.6504,
                "heading": 0,
                "pitch": 10
            }
        ]
    },
    {
        "name": "China",
        "icon": "\ud83d\udccd",
        "type": "country",
        "places": [
            {
                "name": "The Bund",
                "country": "China",
                "lat": 31.239611,
                "lng": 121.489725,
                "heading": 90,
                "pitch": 0
            },
            {
                "name": "Beijing (Tiananmen Square Road)",
                "country": "China",
                "lat": 39.9042,
                "lng": 116.3972,
                "heading": 0,
                "pitch": 0
            },
            {
                "name": "Shanghai (Nanjing Road)",
                "country": "China",
                "lat": 31.2359,
                "lng": 121.4805,
                "heading": 270,
                "pitch": 10
            }
        ]
    },
    {
        "name": "Colombia",
        "icon": "\ud83d\udccd",
        "type": "country",
        "places": [
            {
                "name": "Bogota (Plaza Bolivar)",
                "country": "Colombia",
                "lat": 4.5981,
                "lng": -74.0758,
                "heading": 90,
                "pitch": 10
            }
        ]
    },
    {
        "name": "Cuba",
        "icon": "\ud83d\udccd",
        "type": "country",
        "places": [
            {
                "name": "Havana (Malecon)",
                "country": "Cuba",
                "lat": 23.1432,
                "lng": -82.3846,
                "heading": 270,
                "pitch": 0
            }
        ]
    },
    {
        "name": "Czechia",
        "icon": "\ud83d\udccd",
        "type": "country",
        "places": [
            {
                "name": "Prague (Charles Bridge Gate)",
                "country": "Czechia",
                "lat": 50.0865,
                "lng": 14.4114,
                "heading": 270,
                "pitch": 10
            }
        ]
    },
    {
        "name": "Denmark",
        "icon": "\ud83d\udccd",
        "type": "country",
        "places": [
            {
                "name": "Copenhagen (Nyhavn Street)",
                "country": "Denmark",
                "lat": 55.6802,
                "lng": 12.5905,
                "heading": 90,
                "pitch": 0
            }
        ]
    },
    {
        "name": "Egypt",
        "icon": "\ud83d\udccd",
        "type": "country",
        "places": [
            {
                "name": "Cairo (Pyramids Road)",
                "country": "Egypt",
                "lat": 29.9829,
                "lng": 31.1342,
                "heading": 230,
                "pitch": 10
            }
        ]
    },
    {
        "name": "France",
        "icon": "\ud83d\udccd",
        "type": "country",
        "places": [
            {
                "name": "Champs-\u00c9lys\u00e9es",
                "country": "France",
                "lat": 48.870502,
                "lng": 2.304897,
                "heading": 300,
                "pitch": 5
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
                "name": "Arc de Triomphe",
                "country": "France",
                "lat": 48.873792,
                "lng": 2.295028,
                "heading": 90,
                "pitch": 15
            },
            {
                "name": "Louvre Pyramid (Street)",
                "country": "France",
                "lat": 48.861073,
                "lng": 2.335967,
                "heading": 90,
                "pitch": 10
            },
            {
                "name": "Louvre (Rue de Rivoli)",
                "country": "France",
                "lat": 48.8625,
                "lng": 2.3364,
                "heading": 180,
                "pitch": 10
            },
            {
                "name": "Notre-Dame (Parvis)",
                "country": "France",
                "lat": 48.853,
                "lng": 2.3499,
                "heading": 90,
                "pitch": 20
            },
            {
                "name": "Palace of Versailles (Gates)",
                "country": "France",
                "lat": 48.8034,
                "lng": 2.1245,
                "heading": 270,
                "pitch": 10
            },
            {
                "name": "Mont Saint-Michel (Causeway)",
                "country": "France",
                "lat": 48.6346,
                "lng": -1.5115,
                "heading": 0,
                "pitch": 10
            }
        ]
    },
    {
        "name": "Germany",
        "icon": "\ud83d\udccd",
        "type": "country",
        "places": [
            {
                "name": "Brandenburg Gate",
                "country": "Germany",
                "lat": 52.516274,
                "lng": 13.377704,
                "heading": 270,
                "pitch": 10
            },
            {
                "name": "Berlin (Alexanderplatz)",
                "country": "Germany",
                "lat": 52.5219,
                "lng": 13.4132,
                "heading": 180,
                "pitch": 10
            },
            {
                "name": "Munich (Marienplatz Road)",
                "country": "Germany",
                "lat": 48.1372,
                "lng": 11.5755,
                "heading": 0,
                "pitch": 10
            }
        ]
    },
    {
        "name": "Greece",
        "icon": "\ud83d\udccd",
        "type": "country",
        "places": [
            {
                "name": "Athens (Acropolis Street)",
                "country": "Greece",
                "lat": 37.9715,
                "lng": 23.7267,
                "heading": 90,
                "pitch": 20
            }
        ]
    },
    {
        "name": "Hong Kong",
        "icon": "\ud83d\udccd",
        "type": "country",
        "places": [
            {
                "name": "Hong Kong Victoria Harbour",
                "country": "Hong Kong",
                "lat": 22.29345,
                "lng": 114.169123,
                "heading": 180,
                "pitch": 0
            }
        ]
    },
    {
        "name": "Hungary",
        "icon": "\ud83d\udccd",
        "type": "country",
        "places": [
            {
                "name": "Budapest (Parliament Street)",
                "country": "Hungary",
                "lat": 47.5071,
                "lng": 19.0456,
                "heading": 270,
                "pitch": 20
            }
        ]
    },
    {
        "name": "Iceland",
        "icon": "\ud83d\udccd",
        "type": "country",
        "places": [
            {
                "name": "Reykjavik (Hallgrimskirkja Road)",
                "country": "Iceland",
                "lat": 64.1415,
                "lng": -21.9315,
                "heading": 135,
                "pitch": 20
            }
        ]
    },
    {
        "name": "India",
        "icon": "\ud83d\udccd",
        "type": "country",
        "places": [
            {
                "name": "Taj Mahal (Main Gate)",
                "country": "India",
                "lat": 27.173891,
                "lng": 78.042068,
                "heading": 0,
                "pitch": 10
            },
            {
                "name": "Taj Mahal (Outer Road)",
                "country": "India",
                "lat": 27.1732,
                "lng": 78.0426,
                "heading": 300,
                "pitch": 10
            },
            {
                "name": "Mumbai (Gateway of India)",
                "country": "India",
                "lat": 18.922,
                "lng": 72.8347,
                "heading": 135,
                "pitch": 10
            },
            {
                "name": "Delhi (India Gate Road)",
                "country": "India",
                "lat": 28.6129,
                "lng": 77.2295,
                "heading": 90,
                "pitch": 10
            },
            {
                "name": "Jaipur (Hawa Mahal Street)",
                "country": "India",
                "lat": 26.9239,
                "lng": 75.8267,
                "heading": 270,
                "pitch": 20
            }
        ]
    },
    {
        "name": "Indonesia",
        "icon": "\ud83d\udccd",
        "type": "country",
        "places": [
            {
                "name": "Bali (Kuta Beach Road)",
                "country": "Indonesia",
                "lat": -8.7183,
                "lng": 115.1686,
                "heading": 180,
                "pitch": 0
            },
            {
                "name": "Jakarta (Monas Square Road)",
                "country": "Indonesia",
                "lat": -6.1754,
                "lng": 106.8271,
                "heading": 0,
                "pitch": 10
            }
        ]
    },
    {
        "name": "Ireland",
        "icon": "\ud83d\udccd",
        "type": "country",
        "places": [
            {
                "name": "Dublin (Temple Bar Street)",
                "country": "Ireland",
                "lat": 53.3453,
                "lng": -6.2642,
                "heading": 90,
                "pitch": 0
            }
        ]
    },
    {
        "name": "Israel",
        "icon": "\ud83d\udccd",
        "type": "country",
        "places": [
            {
                "name": "Jerusalem (Jaffa Gate)",
                "country": "Israel",
                "lat": 31.7766,
                "lng": 35.2275,
                "heading": 90,
                "pitch": 10
            },
            {
                "name": "Tel Aviv (Rothschild Blvd)",
                "country": "Israel",
                "lat": 32.0628,
                "lng": 34.7738,
                "heading": 0,
                "pitch": 0
            }
        ]
    },
    {
        "name": "Italy",
        "icon": "\ud83d\udccd",
        "type": "country",
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
                "name": "Pantheon (Piazza)",
                "country": "Italy",
                "lat": 41.898862,
                "lng": 12.476839,
                "heading": 180,
                "pitch": 20
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
                "name": "Duomo di Milano",
                "country": "Italy",
                "lat": 45.464161,
                "lng": 9.189585,
                "heading": 90,
                "pitch": 20
            },
            {
                "name": "Rome (Piazza Navona)",
                "country": "Italy",
                "lat": 41.8992,
                "lng": 12.4731,
                "heading": 0,
                "pitch": 10
            },
            {
                "name": "Florence (Ponte Vecchio)",
                "country": "Italy",
                "lat": 43.7687,
                "lng": 11.2536,
                "heading": 90,
                "pitch": 0
            },
            {
                "name": "Venice (Rialto Bridge View)",
                "country": "Italy",
                "lat": 45.4381,
                "lng": 12.3359,
                "heading": 180,
                "pitch": 0
            },
            {
                "name": "Pisa (Leaning Tower Street)",
                "country": "Italy",
                "lat": 43.7229,
                "lng": 10.3966,
                "heading": 90,
                "pitch": 20
            },
            {
                "name": "Milan (Galleria Road)",
                "country": "Italy",
                "lat": 45.4659,
                "lng": 9.1899,
                "heading": 180,
                "pitch": 30
            }
        ]
    },
    {
        "name": "Japan",
        "icon": "\ud83d\udccd",
        "type": "country",
        "places": [
            {
                "name": "Shibuya Crossing",
                "country": "Japan",
                "lat": 35.659556,
                "lng": 139.700547,
                "heading": 270,
                "pitch": 0
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
                "name": "Akihabara",
                "country": "Japan",
                "lat": 35.698353,
                "lng": 139.773114,
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
                "name": "Kyoto (Gion Street)",
                "country": "Japan",
                "lat": 35.0037,
                "lng": 135.775,
                "heading": 90,
                "pitch": 0
            },
            {
                "name": "Osaka (Dotonbori Bridge)",
                "country": "Japan",
                "lat": 34.6687,
                "lng": 135.5013,
                "heading": 180,
                "pitch": 10
            },
            {
                "name": "Tokyo (Shinjuku Kabukicho)",
                "country": "Japan",
                "lat": 35.6938,
                "lng": 139.7034,
                "heading": 0,
                "pitch": 10
            },
            {
                "name": "Hiroshima (Peace Park Road)",
                "country": "Japan",
                "lat": 34.3955,
                "lng": 132.4536,
                "heading": 90,
                "pitch": 0
            },
            {
                "name": "Mt Fuji (Kawaguchiko Road)",
                "country": "Japan",
                "lat": 35.4983,
                "lng": 138.7611,
                "heading": 180,
                "pitch": 10
            }
        ]
    },
    {
        "name": "Kenya",
        "icon": "\ud83d\udccd",
        "type": "country",
        "places": [
            {
                "name": "Nairobi (Kenyatta Avenue)",
                "country": "Kenya",
                "lat": -1.2844,
                "lng": 36.8208,
                "heading": 90,
                "pitch": 10
            }
        ]
    },
    {
        "name": "Malaysia",
        "icon": "\ud83d\udccd",
        "type": "country",
        "places": [
            {
                "name": "Petronas Towers",
                "country": "Malaysia",
                "lat": 3.158102,
                "lng": 101.711586,
                "heading": 180,
                "pitch": 40
            },
            {
                "name": "KL (Batu Caves Road)",
                "country": "Malaysia",
                "lat": 3.2374,
                "lng": 101.6835,
                "heading": 0,
                "pitch": 20
            }
        ]
    },
    {
        "name": "Mexico",
        "icon": "\ud83d\udccd",
        "type": "country",
        "places": [
            {
                "name": "Mexico City (Zocalo)",
                "country": "Mexico",
                "lat": 19.4326,
                "lng": -99.1332,
                "heading": 0,
                "pitch": 10
            },
            {
                "name": "Cancun (Hotel Zone Road)",
                "country": "Mexico",
                "lat": 21.1214,
                "lng": -86.7645,
                "heading": 180,
                "pitch": 0
            }
        ]
    },
    {
        "name": "Morocco",
        "icon": "\ud83d\udccd",
        "type": "country",
        "places": [
            {
                "name": "Marrakech (Medina Walls)",
                "country": "Morocco",
                "lat": 31.6258,
                "lng": -7.9891,
                "heading": 180,
                "pitch": 0
            },
            {
                "name": "Casablanca (Hassan II Mosque Road)",
                "country": "Morocco",
                "lat": 33.6054,
                "lng": -7.6322,
                "heading": 270,
                "pitch": 10
            }
        ]
    },
    {
        "name": "Netherlands",
        "icon": "\ud83d\udccd",
        "type": "country",
        "places": [
            {
                "name": "Amsterdam (Dam Square Road)",
                "country": "Netherlands",
                "lat": 52.3728,
                "lng": 4.8936,
                "heading": 0,
                "pitch": 10
            }
        ]
    },
    {
        "name": "New Zealand",
        "icon": "\ud83d\udccd",
        "type": "country",
        "places": [
            {
                "name": "Auckland (Sky Tower Street)",
                "country": "New Zealand",
                "lat": -36.8485,
                "lng": 174.7622,
                "heading": 180,
                "pitch": 30
            },
            {
                "name": "Wellington (Cuba Street)",
                "country": "New Zealand",
                "lat": -41.2924,
                "lng": 174.7758,
                "heading": 0,
                "pitch": 0
            },
            {
                "name": "Auckland (Harbour Bridge)",
                "country": "New Zealand",
                "lat": -36.8329,
                "lng": 174.7454,
                "heading": 0,
                "pitch": 0
            }
        ]
    },
    {
        "name": "Norway",
        "icon": "\ud83d\udccd",
        "type": "country",
        "places": [
            {
                "name": "Oslo (Karl Johans Gate)",
                "country": "Norway",
                "lat": 59.9141,
                "lng": 10.7388,
                "heading": 270,
                "pitch": 10
            }
        ]
    },
    {
        "name": "Peru",
        "icon": "\ud83d\udccd",
        "type": "country",
        "places": [
            {
                "name": "Lima (Plaza Mayor Street)",
                "country": "Peru",
                "lat": -12.0453,
                "lng": -77.0311,
                "heading": 180,
                "pitch": 10
            }
        ]
    },
    {
        "name": "Philippines",
        "icon": "\ud83d\udccd",
        "type": "country",
        "places": [
            {
                "name": "Manila (Intramuros Gates)",
                "country": "Philippines",
                "lat": 14.5891,
                "lng": 120.9754,
                "heading": 90,
                "pitch": 10
            }
        ]
    },
    {
        "name": "Portugal",
        "icon": "\ud83d\udccd",
        "type": "country",
        "places": [
            {
                "name": "Lisbon (Pra\u00e7a do Com\u00e9rcio)",
                "country": "Portugal",
                "lat": 38.7075,
                "lng": -9.1364,
                "heading": 0,
                "pitch": 10
            },
            {
                "name": "Porto (Ribeira)",
                "country": "Portugal",
                "lat": 41.1404,
                "lng": -8.6128,
                "heading": 180,
                "pitch": 0
            }
        ]
    },
    {
        "name": "Qatar",
        "icon": "\ud83d\udccd",
        "type": "country",
        "places": [
            {
                "name": "Doha (Corniche)",
                "country": "Qatar",
                "lat": 25.2958,
                "lng": 51.5276,
                "heading": 135,
                "pitch": 0
            }
        ]
    },
    {
        "name": "Russia",
        "icon": "\ud83d\udccd",
        "type": "country",
        "places": [
            {
                "name": "Moscow (St. Basil's Street)",
                "country": "Russia",
                "lat": 55.7525,
                "lng": 37.6231,
                "heading": 0,
                "pitch": 20
            },
            {
                "name": "St. Petersburg (Hermitage Road)",
                "country": "Russia",
                "lat": 59.9398,
                "lng": 30.3146,
                "heading": 90,
                "pitch": 10
            }
        ]
    },
    {
        "name": "Saudi Arabia",
        "icon": "\ud83d\udccd",
        "type": "country",
        "places": [
            {
                "name": "Riyadh (Kingdom Centre Road)",
                "country": "Saudi Arabia",
                "lat": 24.7114,
                "lng": 46.6744,
                "heading": 0,
                "pitch": 30
            }
        ]
    },
    {
        "name": "Singapore",
        "icon": "\ud83d\udccd",
        "type": "country",
        "places": [
            {
                "name": "Marina Bay Sands",
                "country": "Singapore",
                "lat": 1.284051,
                "lng": 103.859062,
                "heading": 150,
                "pitch": 20
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
                "name": "Singapore (Merlion Park)",
                "country": "Singapore",
                "lat": 1.2868,
                "lng": 103.8545,
                "heading": 135,
                "pitch": 10
            },
            {
                "name": "Singapore (Chinatown St)",
                "country": "Singapore",
                "lat": 1.2848,
                "lng": 103.844,
                "heading": 270,
                "pitch": 0
            }
        ]
    },
    {
        "name": "South Africa",
        "icon": "\ud83d\udccd",
        "type": "country",
        "places": [
            {
                "name": "Cape Town (Camps Bay Dr)",
                "country": "South Africa",
                "lat": -33.951,
                "lng": 18.3772,
                "heading": 180,
                "pitch": 0
            }
        ]
    },
    {
        "name": "South Korea",
        "icon": "\ud83d\udccd",
        "type": "country",
        "places": [
            {
                "name": "Gyeongbokgung Palace (Gate)",
                "country": "South Korea",
                "lat": 37.575936,
                "lng": 126.976822,
                "heading": 0,
                "pitch": 10
            },
            {
                "name": "Seoul (Gangnam Street)",
                "country": "South Korea",
                "lat": 37.4979,
                "lng": 127.0276,
                "heading": 90,
                "pitch": 10
            }
        ]
    },
    {
        "name": "Spain",
        "icon": "\ud83d\udccd",
        "type": "country",
        "places": [
            {
                "name": "Sagrada Familia (Street)",
                "country": "Spain",
                "lat": 41.403204,
                "lng": 2.174668,
                "heading": 330,
                "pitch": 30
            },
            {
                "name": "Barcelona (Las Ramblas)",
                "country": "Spain",
                "lat": 41.3809,
                "lng": 2.1734,
                "heading": 135,
                "pitch": 0
            },
            {
                "name": "Madrid (Plaza Mayor Street)",
                "country": "Spain",
                "lat": 40.4154,
                "lng": -3.7074,
                "heading": 90,
                "pitch": 10
            }
        ]
    },
    {
        "name": "Sweden",
        "icon": "\ud83d\udccd",
        "type": "country",
        "places": [
            {
                "name": "Stockholm (Gamla Stan Road)",
                "country": "Sweden",
                "lat": 59.325,
                "lng": 18.0707,
                "heading": 0,
                "pitch": 10
            }
        ]
    },
    {
        "name": "Switzerland",
        "icon": "\ud83d\udccd",
        "type": "country",
        "places": [
            {
                "name": "Zurich (Bahnhofstrasse)",
                "country": "Switzerland",
                "lat": 47.3732,
                "lng": 8.5398,
                "heading": 180,
                "pitch": 0
            }
        ]
    },
    {
        "name": "Taiwan",
        "icon": "\ud83d\udccd",
        "type": "country",
        "places": [
            {
                "name": "Taipei (Taipei 101 Street)",
                "country": "Taiwan",
                "lat": 25.0336,
                "lng": 121.5645,
                "heading": 180,
                "pitch": 40
            }
        ]
    },
    {
        "name": "Thailand",
        "icon": "\ud83d\udccd",
        "type": "country",
        "places": [
            {
                "name": "Bangkok (Khao San Road)",
                "country": "Thailand",
                "lat": 13.759,
                "lng": 100.4971,
                "heading": 270,
                "pitch": 0
            },
            {
                "name": "Phuket (Patong Beach Road)",
                "country": "Thailand",
                "lat": 7.8932,
                "lng": 98.2952,
                "heading": 180,
                "pitch": 0
            }
        ]
    },
    {
        "name": "Turkey",
        "icon": "\ud83d\udccd",
        "type": "country",
        "places": [
            {
                "name": "Istanbul (Blue Mosque Street)",
                "country": "Turkey",
                "lat": 41.0054,
                "lng": 28.9768,
                "heading": 135,
                "pitch": 10
            }
        ]
    },
    {
        "name": "UAE",
        "icon": "\ud83d\udccd",
        "type": "country",
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
                "name": "Burj Al Arab (Road)",
                "country": "UAE",
                "lat": 25.141151,
                "lng": 55.185265,
                "heading": 300,
                "pitch": 10
            },
            {
                "name": "Dubai Marina",
                "country": "UAE",
                "lat": 25.078426,
                "lng": 55.140228,
                "heading": 45,
                "pitch": 10
            },
            {
                "name": "Dubai (Palm Jumeirah Road)",
                "country": "UAE",
                "lat": 25.1124,
                "lng": 55.139,
                "heading": 300,
                "pitch": 10
            },
            {
                "name": "Abu Dhabi (Corniche)",
                "country": "UAE",
                "lat": 24.4667,
                "lng": 54.3333,
                "heading": 45,
                "pitch": 0
            }
        ]
    },
    {
        "name": "UK",
        "icon": "\ud83d\udccd",
        "type": "country",
        "places": [
            {
                "name": "Abbey Road",
                "country": "UK",
                "lat": 51.532223,
                "lng": -0.177263,
                "heading": 150,
                "pitch": 0
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
                "name": "The Shard",
                "country": "UK",
                "lat": 51.504938,
                "lng": -0.086029,
                "heading": 200,
                "pitch": 40
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
                "name": "London Eye (Westminster Bridge)",
                "country": "UK",
                "lat": 51.5008,
                "lng": -0.1219,
                "heading": 90,
                "pitch": 20
            },
            {
                "name": "Oxford Street",
                "country": "UK",
                "lat": 51.5145,
                "lng": -0.1428,
                "heading": 270,
                "pitch": 10
            },
            {
                "name": "Trafalgar Square (Road)",
                "country": "UK",
                "lat": 51.508,
                "lng": -0.1281,
                "heading": 0,
                "pitch": 10
            },
            {
                "name": "Edinburgh (Royal Mile)",
                "country": "UK",
                "lat": 55.9495,
                "lng": -3.1909,
                "heading": 90,
                "pitch": 0
            },
            {
                "name": "Stonehenge (A344 Road)",
                "country": "UK",
                "lat": 51.1788,
                "lng": -1.8262,
                "heading": 180,
                "pitch": 0
            }
        ]
    },
    {
        "name": "USA",
        "icon": "\ud83d\udccd",
        "type": "country",
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
                "name": "Lombard Street",
                "country": "USA",
                "lat": 37.802111,
                "lng": -122.418721,
                "heading": 90,
                "pitch": 10
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
                "name": "Empire State Building",
                "country": "USA",
                "lat": 40.748342,
                "lng": -73.985011,
                "heading": 300,
                "pitch": 50
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
            },
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
            },
            {
                "name": "White House (Pennsylvania Ave)",
                "country": "USA",
                "lat": 38.8976,
                "lng": -77.0365,
                "heading": 180,
                "pitch": 0
            },
            {
                "name": "Las Vegas (Fremont Street)",
                "country": "USA",
                "lat": 36.1699,
                "lng": -115.1398,
                "heading": 90,
                "pitch": 10
            },
            {
                "name": "Yosemite Valley Road",
                "country": "USA",
                "lat": 37.7225,
                "lng": -119.6433,
                "heading": 0,
                "pitch": 10
            },
            {
                "name": "Beverly Hills (Rodeo Drive)",
                "country": "USA",
                "lat": 34.0673,
                "lng": -118.4034,
                "heading": 45,
                "pitch": 0
            },
            {
                "name": "Key West (US Route 1)",
                "country": "USA",
                "lat": 24.5465,
                "lng": -81.7975,
                "heading": 180,
                "pitch": 0
            },
            {
                "name": "Chicago (Millennium Park St)",
                "country": "USA",
                "lat": 41.8826,
                "lng": -87.6226,
                "heading": 270,
                "pitch": 20
            },
            {
                "name": "Seattle (Space Needle St)",
                "country": "USA",
                "lat": 47.6205,
                "lng": -122.3493,
                "heading": 0,
                "pitch": 30
            }
        ]
    },
    {
        "name": "Venezuela",
        "icon": "\ud83d\udccd",
        "type": "country",
        "places": [
            {
                "name": "Caracas (Plaza Altamira)",
                "country": "Venezuela",
                "lat": 10.495,
                "lng": -66.8488,
                "heading": 0,
                "pitch": 10
            }
        ]
    },
    {
        "name": "Vietnam",
        "icon": "\ud83d\udccd",
        "type": "country",
        "places": [
            {
                "name": "Hanoi (Old Quarter)",
                "country": "Vietnam",
                "lat": 21.0336,
                "lng": 105.85,
                "heading": 180,
                "pitch": 0
            },
            {
                "name": "Ho Chi Minh City (Ben Thanh)",
                "country": "Vietnam",
                "lat": 10.7725,
                "lng": 106.698,
                "heading": 90,
                "pitch": 10
            }
        ]
    }
];