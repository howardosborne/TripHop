from math import sin, cos, sqrt, atan2, radians
import sys,csv,json

def distance_between_to_points(from_lat,from_lon,to_lat,to_lon):
    from_lat_rad = radians(float(from_lat))
    from_lon_rad = radians(float(from_lon))
    to_lat_rad = radians(float(to_lat))
    to_lon_rad = radians(float(to_lon))
    dist_lon = to_lon_rad - from_lon_rad
    dist_lat = to_lat_rad - from_lat_rad

    a = sin(dist_lat / 2)**2 + cos(from_lat_rad) * cos(to_lat_rad) * sin(dist_lon / 2)**2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    # Approximate radius of earth in km
    R = 6373.0
    distance = R * c
    return distance

#output_file = open("entity_output.tsv","w")
stops_for_places = {}

#need an 'entity' file with a list of entities with lat and long 
with open(sys.argv[1]) as fp:
    places = json.load(fp)

destination_dir = sys.argv[3]

#need to know the acceptable distance (in km) from entity to the stop
acceptable_distance = 3

#for each entity
for place in places:
    place_id = place["place_id"]
    place_name = place["place_name"]
    place_lat = place["place_lat"]
    place_lon = place["place_lon"]
    print(place_name)
    with open(sys.argv[2], newline='', encoding="utf8") as stops_file:
        stops_reader = csv.DictReader(stops_file, delimiter=',', quotechar='"')
        for row in stops_reader:
            try:
                stop_id =  row['stop_id']
                stop_name =  row['stop_name']
                stop_lat = row['stop_lat']
                stop_lon = row['stop_lon']
                distance = distance_between_to_points(place_lat,place_lon,stop_lat,stop_lon)
                if distance <= acceptable_distance:
                    print(f"adding {stop_name}")
                    stop = {"stop_id": stop_id,
                            "stop_name": stop_name,
                            "stop_lon": stop_lon,
                            "stop_lat": stop_lat,
                            "place_id": place_id,
                            "place_name": place_name,
                            "distance": distance
                            }
                    stops_for_places[stop_id] = stop
                    if "stops" in place:
                        place["stops"].append(stop)
                    else:
                        place["stops"] = [stop]
                    #output_file.write(f"{stop_id}{delimiter}{stop_name}{delimiter}{stop_lon}{delimiter}{stop_lat}{delimiter}{entity_id}{delimiter}{entity_name}{delimiter}\n")
            except Exception as e: 
                print(e)
                pass

dump = json.dumps(stops_for_places)
f = open(f'{destination_dir}stops_for_places.json', "w")
f.write(dump)
f.close()

dump = json.dumps(places)
f = open(f'{destination_dir}places_with_stops.json', "w")
f.write(dump)
f.close()