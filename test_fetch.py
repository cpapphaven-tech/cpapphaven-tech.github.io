import urllib.request
import xml.etree.ElementTree as ET

url = "https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req) as response:
        xml_data = response.read()
        print("Fetched XML length:", len(xml_data))
        root = ET.fromstring(xml_data)
        item = root.find('.//item')
        print(ET.tostring(item, encoding='unicode'))
except Exception as e:
    print("Error:", e)
