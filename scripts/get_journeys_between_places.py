import requests, json, sys
#got to be direct...
transfers = 0
#open the file of stops coming from
from_file = open(sys.argv[1], encoding="utf-16")
from_lines = from_file.read().splitlines()
#open the file of stops going to
to_file = open(sys.argv[2], encoding="utf-16")
to_lines = to_file.read().splitlines()
#where the results are going to be written
output = open(sys.argv[3], "a")
for i in range(len(from_lines)):
    from_id,from_stop_name,from_lat,from_lon,from_place_id,from_place_name = from_lines[i].split("|")
    for j in range(len(to_lines)):
        to_id,to_stop_name,to_lat,to_lon,to_place_id,to_place_name = to_lines[j].split("|")
        #only make the request if it is a different place
        if to_place_id != from_place_id:
            print(f"looking for journeys:{from_id} {from_place_name} to {to_id} {to_place_name}")
            req = f'https://v5.db.transport.rest/journeys?from={from_id}&to={to_id}&transfers={transfers}'
            response = requests.get(req)
            journeys = json.loads(response.text)
            if "journeys" in journeys:
                for journey in journeys["journeys"]:
            #    #print(stop)
                    departure_time = journey["legs"][0]["plannedDeparture"]
                    arrival_time = journey["legs"][-1]["plannedArrival"]
                    output.write(f"{from_place_name}|{from_place_id}|{from_id}|{from_lat}|{from_lon}|{to_place_name}|{to_place_id}|{to_id}|{to_lat}|{to_lon}|{departure_time}|{arrival_time}\n")
            else:
                print(f"could not find journeys:{from_id} {from_place_name} to {to_id} {to_place_name}")