import csv, json,sys

all_places = []
places_file = sys.argv[1]
with open(places_file) as f:
    places = csv.DictReader(f)
    for place in places:
        all_places.append(place)

dump = json.dumps(all_places)
print(dump)
