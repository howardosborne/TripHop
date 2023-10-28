import requests, json, sys
address = sys.argv[1]
lat = sys.argv[2]
lon = sys.argv[3]
req = f'https://v5.db.transport.rest/stops/reachable-from?latitude={lat}&longitude={lon}&address={address}&maxTransfers={0}'
response = requests.get(req)
stops = json.loads(response.text)
print(stops)
#for stop in stops:
    #print(stop)
#    print(f"{stop['id']}|{stop['name']}|{stop['location']['latitude']}|{stop['location']['longitude']}")