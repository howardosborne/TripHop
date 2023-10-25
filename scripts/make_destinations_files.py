import csv, json,sys
destinations = {}
all_places = []
places_file = sys.argv[1]
print(places_file)
destination_dir = sys.argv[2]
with open(places_file) as f:
    lines = csv.DictReader(f)
    for line in lines:
        from_place = line["place_id_x"]
        if from_place in destinations:
            to_places = destinations[from_place]
            to_places.append(line)
            destinations[from_place] = to_places
        else:
            to_places = []
            to_places.append(line)
            destinations[from_place] = to_places
for destination in destinations:
    dump = json.dumps(destinations[destination])
    f = open(f"{destination_dir}/{destination}.json", "w")
    f.write(dump)
    f.close()
