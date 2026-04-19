#!/usr/bin/env python3
"""
Playmix Daily Weather Fetcher
Runs once a day via GitHub Actions to pre-fetch weather for all
countries, states and cities, saving the result to WeatherCommon/weather_data.js

API: Open-Meteo (free, no key required)
"""

import json
import urllib.request
import urllib.parse
import datetime
import os
import time

# ─── Location Registry ──────────────────────────────────────────────────────
COUNTRIES = [
    { "name":"India",         "code":"IN",  "lat":20.59,  "lon":78.96,  "flag":"🇮🇳" },
    { "name":"USA",           "code":"US",  "lat":37.09,  "lon":-95.71, "flag":"🇺🇸" },
    { "name":"Brazil",        "code":"BR",  "lat":-14.23, "lon":-51.93, "flag":"🇧🇷" },
    { "name":"China",         "code":"CN",  "lat":35.86,  "lon":104.19, "flag":"🇨🇳" },
    { "name":"Russia",        "code":"RU",  "lat":61.52,  "lon":105.32, "flag":"🇷🇺" },
    { "name":"Australia",     "code":"AU",  "lat":-25.27, "lon":133.78, "flag":"🇦🇺" },
    { "name":"Germany",       "code":"DE",  "lat":51.17,  "lon":10.45,  "flag":"🇩🇪" },
    { "name":"France",        "code":"FR",  "lat":46.23,  "lon":2.21,   "flag":"🇫🇷" },
    { "name":"Japan",         "code":"JP",  "lat":36.20,  "lon":138.25, "flag":"🇯🇵" },
    { "name":"UK",            "code":"GB",  "lat":55.38,  "lon":-3.44,  "flag":"🇬🇧" },
    { "name":"Canada",        "code":"CA",  "lat":56.13,  "lon":-106.35,"flag":"🇨🇦" },
    { "name":"Mexico",        "code":"MX",  "lat":23.63,  "lon":-102.55,"flag":"🇲🇽" },
    { "name":"South Africa",  "code":"ZA",  "lat":-30.56, "lon":22.94,  "flag":"🇿🇦" },
    { "name":"Egypt",         "code":"EG",  "lat":26.82,  "lon":30.80,  "flag":"🇪🇬" },
    { "name":"Nigeria",       "code":"NG",  "lat":9.08,   "lon":8.68,   "flag":"🇳🇬" },
    { "name":"Indonesia",     "code":"ID",  "lat":-0.79,  "lon":113.92, "flag":"🇮🇩" },
    { "name":"Argentina",     "code":"AR",  "lat":-38.42, "lon":-63.62, "flag":"🇦🇷" },
    { "name":"Saudi Arabia",  "code":"SA",  "lat":23.886, "lon":45.08,  "flag":"🇸🇦" },
    { "name":"Turkey",        "code":"TR",  "lat":38.96,  "lon":35.24,  "flag":"🇹🇷" },
    { "name":"Italy",         "code":"IT",  "lat":41.87,  "lon":12.57,  "flag":"🇮🇹" },
    { "name":"Spain",         "code":"ES",  "lat":40.46,  "lon":-3.75,  "flag":"🇪🇸" },
    { "name":"South Korea",   "code":"KR",  "lat":35.91,  "lon":127.77, "flag":"🇰🇷" },
    { "name":"Pakistan",      "code":"PK",  "lat":30.38,  "lon":69.35,  "flag":"🇵🇰" },
    { "name":"Bangladesh",    "code":"BD",  "lat":23.68,  "lon":90.36,  "flag":"🇧🇩" },
    { "name":"Vietnam",       "code":"VN",  "lat":14.06,  "lon":108.28, "flag":"🇻🇳" },
    { "name":"Thailand",      "code":"TH",  "lat":15.87,  "lon":100.99, "flag":"🇹🇭" },
    { "name":"Netherlands",   "code":"NL",  "lat":52.13,  "lon":5.29,   "flag":"🇳🇱" },
    { "name":"Ukraine",       "code":"UA",  "lat":48.38,  "lon":31.17,  "flag":"🇺🇦" },
    { "name":"Poland",        "code":"PL",  "lat":51.92,  "lon":19.14,  "flag":"🇵🇱" },
    { "name":"Sweden",        "code":"SE",  "lat":60.13,  "lon":18.64,  "flag":"🇸🇪" },
]

STATE_DATA = {
    "IN": [
        { "name":"Maharashtra",    "lat":19.75, "lon":75.71, "cities":[{"name":"Mumbai","lat":19.07,"lon":72.87},{"name":"Pune","lat":18.52,"lon":73.85},{"name":"Nagpur","lat":21.14,"lon":79.09}] },
        { "name":"Delhi",          "lat":28.70, "lon":77.10, "cities":[{"name":"New Delhi","lat":28.61,"lon":77.21},{"name":"Noida","lat":28.54,"lon":77.39},{"name":"Gurgaon","lat":28.45,"lon":77.03}] },
        { "name":"Karnataka",      "lat":15.32, "lon":75.71, "cities":[{"name":"Bengaluru","lat":12.97,"lon":77.59},{"name":"Mysuru","lat":12.30,"lon":76.65},{"name":"Hubli","lat":15.36,"lon":75.12}] },
        { "name":"Tamil Nadu",     "lat":11.13, "lon":78.66, "cities":[{"name":"Chennai","lat":13.08,"lon":80.28},{"name":"Coimbatore","lat":11.02,"lon":76.96},{"name":"Madurai","lat":9.93,"lon":78.12}] },
        { "name":"West Bengal",    "lat":22.99, "lon":87.85, "cities":[{"name":"Kolkata","lat":22.57,"lon":88.36},{"name":"Howrah","lat":22.59,"lon":88.31},{"name":"Darjeeling","lat":27.04,"lon":88.27}] },
        { "name":"Gujarat",        "lat":22.26, "lon":71.19, "cities":[{"name":"Ahmedabad","lat":23.02,"lon":72.57},{"name":"Surat","lat":21.17,"lon":72.83},{"name":"Vadodara","lat":22.31,"lon":73.18}] },
        { "name":"Rajasthan",      "lat":27.02, "lon":74.22, "cities":[{"name":"Jaipur","lat":26.91,"lon":75.79},{"name":"Jodhpur","lat":26.29,"lon":73.02},{"name":"Udaipur","lat":24.58,"lon":73.68}] },
        { "name":"Uttar Pradesh",  "lat":26.85, "lon":80.91, "cities":[{"name":"Lucknow","lat":26.85,"lon":80.95},{"name":"Kanpur","lat":26.47,"lon":80.33},{"name":"Varanasi","lat":25.32,"lon":83.01}] },
    ],
    "US": [
        { "name":"California",     "lat":36.78, "lon":-119.42,"cities":[{"name":"Los Angeles","lat":34.05,"lon":-118.24},{"name":"San Francisco","lat":37.77,"lon":-122.42},{"name":"San Diego","lat":32.72,"lon":-117.15}] },
        { "name":"Texas",          "lat":31.97, "lon":-99.90, "cities":[{"name":"Houston","lat":29.76,"lon":-95.37},{"name":"Dallas","lat":32.78,"lon":-96.80},{"name":"Austin","lat":30.27,"lon":-97.74}] },
        { "name":"New York",       "lat":42.17, "lon":-74.95, "cities":[{"name":"New York City","lat":40.71,"lon":-74.01},{"name":"Buffalo","lat":42.89,"lon":-78.86},{"name":"Albany","lat":42.65,"lon":-73.76}] },
        { "name":"Florida",        "lat":27.99, "lon":-81.76, "cities":[{"name":"Miami","lat":25.78,"lon":-80.21},{"name":"Orlando","lat":28.54,"lon":-81.38},{"name":"Tampa","lat":27.95,"lon":-82.46}] },
        { "name":"Illinois",       "lat":40.35, "lon":-88.99, "cities":[{"name":"Chicago","lat":41.85,"lon":-87.65},{"name":"Springfield","lat":39.78,"lon":-89.65},{"name":"Rockford","lat":42.27,"lon":-89.09}] },
        { "name":"Washington",     "lat":47.75, "lon":-120.74,"cities":[{"name":"Seattle","lat":47.61,"lon":-122.33},{"name":"Spokane","lat":47.66,"lon":-117.43},{"name":"Tacoma","lat":47.25,"lon":-122.44}] },
    ],
    "GB": [
        { "name":"England",        "lat":52.35, "lon":-1.17, "cities":[{"name":"London","lat":51.50,"lon":-0.12},{"name":"Manchester","lat":53.48,"lon":-2.24},{"name":"Birmingham","lat":52.48,"lon":-1.90}] },
        { "name":"Scotland",       "lat":56.49, "lon":-4.20, "cities":[{"name":"Edinburgh","lat":55.95,"lon":-3.19},{"name":"Glasgow","lat":55.86,"lon":-4.25},{"name":"Aberdeen","lat":57.15,"lon":-2.11}] },
        { "name":"Wales",          "lat":52.13, "lon":-3.78, "cities":[{"name":"Cardiff","lat":51.48,"lon":-3.18},{"name":"Swansea","lat":51.62,"lon":-3.94},{"name":"Newport","lat":51.59,"lon":-2.99}] },
    ],
    "AU": [
        { "name":"New South Wales","lat":-32.16, "lon":147.02,"cities":[{"name":"Sydney","lat":-33.87,"lon":151.21},{"name":"Newcastle","lat":-32.93,"lon":151.78},{"name":"Wollongong","lat":-34.42,"lon":150.89}] },
        { "name":"Victoria",       "lat":-36.85, "lon":144.28,"cities":[{"name":"Melbourne","lat":-37.81,"lon":144.96},{"name":"Geelong","lat":-38.15,"lon":144.36},{"name":"Ballarat","lat":-37.56,"lon":143.87}] },
        { "name":"Queensland",     "lat":-22.57, "lon":144.08,"cities":[{"name":"Brisbane","lat":-27.47,"lon":153.02},{"name":"Gold Coast","lat":-28.02,"lon":153.40},{"name":"Cairns","lat":-16.92,"lon":145.77}] },
        { "name":"Western Australia","lat":-25.33,"lon":122.03,"cities":[{"name":"Perth","lat":-31.95,"lon":115.86},{"name":"Fremantle","lat":-32.05,"lon":115.74},{"name":"Geraldton","lat":-28.78,"lon":114.61}] },
    ],
    "JP": [
        { "name":"Tokyo",          "lat":35.69, "lon":139.69,"cities":[{"name":"Tokyo","lat":35.68,"lon":139.69},{"name":"Yokohama","lat":35.44,"lon":139.64},{"name":"Kawasaki","lat":35.53,"lon":139.70}] },
        { "name":"Osaka",          "lat":34.67, "lon":135.50,"cities":[{"name":"Osaka","lat":34.68,"lon":135.50},{"name":"Kyoto","lat":35.02,"lon":135.75},{"name":"Kobe","lat":34.69,"lon":135.19}] },
        { "name":"Hokkaido",       "lat":43.46, "lon":142.83,"cities":[{"name":"Sapporo","lat":43.06,"lon":141.35},{"name":"Asahikawa","lat":43.77,"lon":142.38},{"name":"Hakodate","lat":41.77,"lon":140.73}] },
        { "name":"Fukuoka",        "lat":33.56, "lon":130.72,"cities":[{"name":"Fukuoka","lat":33.60,"lon":130.40},{"name":"Kitakyushu","lat":33.88,"lon":130.88},{"name":"Kurume","lat":33.32,"lon":130.50}] },
    ],
    "DE": [
        { "name":"Bavaria",        "lat":48.79, "lon":11.50, "cities":[{"name":"Munich","lat":48.13,"lon":11.58},{"name":"Nuremberg","lat":49.45,"lon":11.08},{"name":"Augsburg","lat":48.37,"lon":10.90}] },
        { "name":"Berlin",         "lat":52.52, "lon":13.40, "cities":[{"name":"Berlin","lat":52.52,"lon":13.41},{"name":"Potsdam","lat":52.39,"lon":13.06},{"name":"Spandau","lat":52.54,"lon":13.20}] },
        { "name":"NRW",            "lat":51.43, "lon":7.66,  "cities":[{"name":"Cologne","lat":50.94,"lon":6.96},{"name":"Düsseldorf","lat":51.22,"lon":6.78},{"name":"Dortmund","lat":51.51,"lon":7.46}] },
    ],
    "FR": [
        { "name":"Île-de-France",  "lat":48.85, "lon":2.35,  "cities":[{"name":"Paris","lat":48.86,"lon":2.35},{"name":"Versailles","lat":48.80,"lon":2.13},{"name":"Boulogne","lat":48.83,"lon":2.24}] },
        { "name":"Provence",       "lat":43.83, "lon":5.71,  "cities":[{"name":"Marseille","lat":43.30,"lon":5.37},{"name":"Nice","lat":43.70,"lon":7.27},{"name":"Toulon","lat":43.12,"lon":5.93}] },
        { "name":"Auvergne",       "lat":45.75, "lon":3.07,  "cities":[{"name":"Lyon","lat":45.75,"lon":4.84},{"name":"Grenoble","lat":45.19,"lon":5.72},{"name":"Clermont","lat":45.78,"lon":3.08}] },
    ],
    "CN": [
        { "name":"Beijing",        "lat":39.91, "lon":116.39,"cities":[{"name":"Beijing","lat":39.91,"lon":116.39},{"name":"Tianjin","lat":39.13,"lon":117.20},{"name":"Baoding","lat":38.87,"lon":115.46}] },
        { "name":"Shanghai",       "lat":31.23, "lon":121.47,"cities":[{"name":"Shanghai","lat":31.23,"lon":121.47},{"name":"Suzhou","lat":31.30,"lon":120.62},{"name":"Nanjing","lat":32.06,"lon":118.79}] },
        { "name":"Guangdong",      "lat":23.37, "lon":113.50,"cities":[{"name":"Guangzhou","lat":23.12,"lon":113.26},{"name":"Shenzhen","lat":22.55,"lon":114.06},{"name":"Zhuhai","lat":22.27,"lon":113.57}] },
        { "name":"Sichuan",        "lat":30.65, "lon":102.71,"cities":[{"name":"Chengdu","lat":30.67,"lon":104.07},{"name":"Chongqing","lat":29.56,"lon":106.55},{"name":"Mianyang","lat":31.47,"lon":104.74}] },
    ],
    "BR": [
        { "name":"São Paulo",      "lat":-23.55, "lon":-46.63,"cities":[{"name":"São Paulo","lat":-23.55,"lon":-46.63},{"name":"Campinas","lat":-22.91,"lon":-47.06},{"name":"Santos","lat":-23.96,"lon":-46.33}] },
        { "name":"Rio de Janeiro", "lat":-22.91, "lon":-43.17,"cities":[{"name":"Rio de Janeiro","lat":-22.91,"lon":-43.17},{"name":"Niterói","lat":-22.89,"lon":-43.10},{"name":"Nova Iguaçu","lat":-22.76,"lon":-43.46}] },
        { "name":"Amazonas",       "lat":-3.07,  "lon":-60.01,"cities":[{"name":"Manaus","lat":-3.10,"lon":-60.03},{"name":"Parintins","lat":-2.63,"lon":-56.74},{"name":"Itacoatiara","lat":-3.14,"lon":-58.44}] },
        { "name":"Bahia",          "lat":-12.97, "lon":-38.51,"cities":[{"name":"Salvador","lat":-12.97,"lon":-38.50},{"name":"Feira de Santana","lat":-12.27,"lon":-38.97},{"name":"Vitória da Conquista","lat":-14.87,"lon":-40.84}] },
    ],
}

# ─── API Helper ─────────────────────────────────────────────────────────────
def fetch_weather(lat, lon, retries=2):
    """Fetch current weather from Open-Meteo (free, no key required)."""
    url = (
        f"https://api.open-meteo.com/v1/forecast"
        f"?latitude={lat}&longitude={lon}"
        f"&current=temperature_2m,weathercode,precipitation,snowfall,windspeed_10m"
        f"&temperature_unit=celsius&timezone=auto"
    )
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "PlaymixWeather/1.0"})
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read())
                c = data.get("current", {})
                return {
                    "temp": round(c.get("temperature_2m", 0)),
                    "code": int(c.get("weathercode", 0)),
                    "precip": round(c.get("precipitation", 0), 1),
                    "snow": round(c.get("snowfall", 0), 1),
                    "wind": round(c.get("windspeed_10m", 0)),
                }
        except Exception as e:
            print(f"    ⚠️  Weather fetch attempt {attempt+1} failed ({lat},{lon}): {e}")
            if attempt < retries - 1:
                time.sleep(2)
    return {"temp": None, "code": 0, "precip": 0, "snow": 0, "wind": 0}

def weather_icon(code, snow):
    if code == 0: return "☀️"
    if code in [1, 2]: return "⛅"
    if code == 3: return "☁️"
    if code in [45, 48]: return "🌫️"
    if code in [51, 53, 55, 61, 63, 65, 80, 81, 82]: return "🌧️"
    if code in [71, 73, 75, 77, 85, 86] or snow > 0.1: return "❄️"
    if code in [95, 96, 99]: return "⛈️"
    return "🌡️"

# ─── Main Fetch ──────────────────────────────────────────────────────────────
def main():
    print("🌍 Playmix Daily Weather Fetcher")
    print(f"   Date: {datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}")
    print()

    result = {
        "generated_at": datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
        "countries": {},
        "states": {},
        "cities": {},
    }

    # ── Fetch country-level ──
    print(f"── Fetching {len(COUNTRIES)} countries ──")
    for country in COUNTRIES:
        code = country["code"]
        print(f"  {country['flag']} {country['name']}...", end=" ", flush=True)
        w = fetch_weather(country["lat"], country["lon"])
        w["icon"] = weather_icon(w["code"], w["snow"])
        w["lat"] = country["lat"]
        w["lon"] = country["lon"]
        w["zoom"] = 5
        result["countries"][code] = {**country, **w}
        print(f"{w['temp']}°C {w['icon']}")
        time.sleep(0.3)  # polite rate limit

    # ── Fetch state-level ──
    print()
    print(f"── Fetching states for {len(STATE_DATA)} countries ──")
    for country_code, states in STATE_DATA.items():
        result["states"][country_code] = []
        print(f"  ── {country_code} ({len(states)} states) ──")
        for state in states:
            print(f"    {state['name']}...", end=" ", flush=True)
            w = fetch_weather(state["lat"], state["lon"])
            w["icon"] = weather_icon(w["code"], w["snow"])
            state_data = {
                "name": state["name"],
                "lat": state["lat"],
                "lon": state["lon"],
                **w
            }
            result["states"][country_code].append(state_data)
            print(f"{w['temp']}°C {w['icon']}")
            time.sleep(0.3)

    # ── Fetch city-level ──
    print()
    print("── Fetching cities ──")
    for country_code, states in STATE_DATA.items():
        result["cities"][country_code] = {}
        for state in states:
            state_name = state["name"]
            result["cities"][country_code][state_name] = []
            for city in state.get("cities", []):
                print(f"    🏙️  {city['name']}...", end=" ", flush=True)
                w = fetch_weather(city["lat"], city["lon"])
                w["icon"] = weather_icon(w["code"], w["snow"])
                city_data = {
                    "name": city["name"],
                    "lat": city["lat"],
                    "lon": city["lon"],
                    **w
                }
                result["cities"][country_code][state_name].append(city_data)
                print(f"{w['temp']}°C {w['icon']}")
                time.sleep(0.3)

    # ── Write output ──
    os.makedirs("WeatherCommon", exist_ok=True)
    out_path = "WeatherCommon/weather_data.js"
    json_str = json.dumps(result, ensure_ascii=False, indent=2)
    js_output = f"// Auto-generated by Playmix fetch_weather.py — {result['generated_at']}\n// Do not edit manually. Run scripts/fetch_weather.py to refresh.\nwindow.WEATHER_DATA = {json_str};\n"

    with open(out_path, "w", encoding="utf-8") as f:
        f.write(js_output)

    print()
    print(f"✅ Written to {out_path}")
    total = len(COUNTRIES) + sum(len(s) for s in STATE_DATA.values()) + sum(len(c) for states in STATE_DATA.values() for s in states for c in [s.get("cities",[])])
    print(f"   Total locations: {total}")

if __name__ == "__main__":
    main()
