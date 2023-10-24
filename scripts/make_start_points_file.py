import csv, json

all_places = []
places_file = "./data/france/places_france.csv"
with open(places_file) as f:
    places = csv.DictReader(f)
    for place in places:
        all_places.append(place)

dump = json.dumps(all_places)
print(dump)
