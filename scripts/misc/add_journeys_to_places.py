#take a journeys file and add entries to places files
import json,sys,statistics
from datetime import datetime

places = {}
destination_dir = sys.argv[2]
journey_lines = open(sys.argv[1]).read().splitlines()
for line in journey_lines[1:]:
    fields = line.split("|")
    #from_place_name|from_place_id|from_stop_id|from_lat|from_lon|to_place_name|to_place_id|to_stop_id|to_lat|to_lon|from_time|to_time
    from_place_name = fields[0]
    from_place_id = fields[1]
    from_lat = fields[3]
    from_lon = fields[4]
    to_place_name = fields[5]
    to_place_id = fields[6]
    to_lat = fields[8]
    to_lon = fields[9]
    from_time = fields[10]
    to_time = fields[11]
    #work out the time of the journey
    journey_time = (datetime.strptime(to_time, '%Y-%m-%dT%H:%M:%S%z') - datetime.strptime(from_time, '%Y-%m-%dT%H:%M:%S%z')).seconds

    if from_place_id in places:
        #add hop to hop entity
        if to_place_id in places[from_place_id]:
            places[from_place_id][to_place_id]["journeys"].append(journey_time)
        else:
            to_places[to_place_id] = {"place_id": to_place_id, 
                                      "place_name": to_place_name,
                                      "place_lat": to_lat,
                                      "place_lon": to_lon,
                                      "journeys":[journey_time]}
            places[from_place_id] = to_places
    else:
        to_places = {}
        to_places[to_place_id] = {"place_id": to_place_id, 
                                      "place_name": to_place_name,
                                      "place_lat": to_lat,
                                      "place_lon": to_lon,
                                      "journeys":[journey_time]}
        places[from_place_id] = to_places


#iterate through each place and create summaries for the journey times
for place in places:
    for to_place in places[place]:
        places[place][to_place]["journeys"]
        places[place][to_place]["duration_median"] = statistics.median(places[place][to_place]["journeys"])
        places[place][to_place]["duration_min"] = min(places[place][to_place]["journeys"])
        places[place][to_place]["duration_max"] = max(places[place][to_place]["journeys"])
    #now to add to each place file

    with open(f'../templates/{place}.json') as fin:
        place_file = json.load(fin)
        place_file["hops"] = places[place]
        dump = json.dumps(place_file)
        fout = open(f'{place}.json', "w")
        fout.write(dump)
        fout.close()
#intermediate step to make sure that the data looks good to add to places files
dump = json.dumps(places)
f = open(f'all_journeys.json', "w")
f.write(dump)
f.close()
