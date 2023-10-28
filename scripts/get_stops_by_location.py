import requests, json, sys
#take a raw places file and make a raw stops file
#the output needs manual sifting to weed out stops that don't relate
f = open(sys.argv[1])
for line in f:
    place_id,location = line.split("|")
    req = f'https://v5.db.transport.rest/locations?addresses=false&poi=false&query={location}'
    response = requests.get(req)
    stops = json.loads(response.text)
    for stop in stops:
        #print(stop)
        print(f"{stop['id']}|{stop['name']}|{stop['location']['latitude']}|{stop['location']['longitude']}|{place_id}|{location}")