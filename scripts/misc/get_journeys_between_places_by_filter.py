import requests, json, sys
#got to be direct...
transfers = 0
#open the file of stops coming
from_file = open(sys.argv[1], encoding="utf-8")
from_lines = from_file.read().splitlines()
from_file.close()
#make a copy
to_file = open(sys.argv[2], encoding="utf-8")
to_lines = to_file.read().splitlines()
#where the results are going to be written
output = open(sys.argv[3], "a")

#just pass a | if you want to match every thing
from_filter = sys.argv[4]
to_filter = sys.argv[5]

for i in range(len(from_lines)):
    from_id,from_stop_name,from_lat,from_lon,from_place_id,from_place_name = from_lines[i].split("|")
    if from_filter in from_lines[i]:
        for j in range(len(to_lines)):
            if to_filter in to_lines[j]:
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
                            price = journey["price"]
                            departure_time = journey["legs"][0]["plannedDeparture"]
                            arrival_time = journey["legs"][-1]["plannedArrival"]
                            mode = ""
                            operator = ""
                            try:
                                if "line" in journey["legs"][0]:
                                    if "mode" in journey["legs"][0]["line"]:
                                        mode = journey["legs"][0]["line"]["mode"]
                                    if "operator" in journey["legs"][0]["line"]:
                                        if "name" in journey["legs"][0]["line"]["operator"]:
                                            operator = journey["legs"][0]["line"]["operator"]["name"]
                            except:
                                pass
                            output.write(f"{from_place_name}|{from_place_id}|{from_id}|{from_lat}|{from_lon}|{to_place_name}|{to_place_id}|{to_id}|{to_lat}|{to_lon}|{departure_time}|{arrival_time}|{mode}|{operator}|{price}\n")
                    else:
                        print(f"could not find journeys:{from_id} {from_place_name} to {to_id} {to_place_name}")