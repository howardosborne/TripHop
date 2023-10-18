import csv

all_places = []

def get_places():
    places_file = "./data/france/places.csv"
    #open places csv
    try:
        with open(places_file) as f:
            places = csv.DictReader(f)
            for place in places:
                all_places.append(place)
    except:
        pass
    return "OK"

s = get_places()
for place in all_places:
    print(place)

