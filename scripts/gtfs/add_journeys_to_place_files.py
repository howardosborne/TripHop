#take a journeys file and add entries to places files
import json,sys,statistics
from datetime import datetime

hops = {}
places_directory = "./templates/"
destination_dir = "./places_with_journeys/"
#need to lookup details about places to add to hops
with open(f'{places_directory}all_places_with_key.json') as place_lookup_file:
    all_places = json.load(place_lookup_file)


journeys = open(sys.argv[1]).read().splitlines()

for line in journeys[1:]:
    fields = line.split(",")
    #id,index,place_id_x,place_id_y,duration_min,duration_max,duration_median,duration_count
    from_place_id = fields[2]
    to_place_id = fields[3]
    duration_min =  fields[4]
    duration_max =  fields[5]
    duration_median =  fields[6]
    duration_count = fields[7]
    to_place_name = all_places[to_place_id]["place_name"]
    to_lat = all_places[to_place_id]["place_lat"]
    to_lon = all_places[to_place_id]["place_lon"]
    hop = {"place_id": to_place_id,
         "place_name": to_place_name,
         "place_lat": to_lat,
         "place_lon": to_lon,
         "duration_min" : duration_min,
         "duration_max" :  duration_max,
         "duration_median": duration_median,
         "duration_count" : duration_count}
    if "hops" in all_places[from_place_id]:
        all_places[from_place_id]["hops"].append(hop)
    else:
        all_places[from_place_id]["hops"] = [hop]

for place in all_places:
    if "hops" in all_places[place]:
        with open(f'{places_directory}{place}.json') as fin:
            place_file = json.load(fin)
            if "hops" in place_file:
                #need to merge
                # check if to_place is there etc.
                pass
            else:
                place_file["hops"] = all_places[place]["hops"]
            dump = json.dumps(place_file)
            with open(f'{destination_dir}{place}.json', "w") as place_f:
                place_f.write(dump)
                place_f.close()
#intermediate step to make sure that the data looks good to add to places files
dump = json.dumps(all_places)
with open(f'{destination_dir}all_places_with_journeys.json', "w") as all_f:
    all_f.write(dump)
    all_f.close()
