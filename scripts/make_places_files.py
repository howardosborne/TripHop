import json,sys
#takes a places download in tab separated format and turns it into json files for each place.
#also need to make a super-duper lookup file (I think)
destinations = {}
all_places = []
places_file = sys.argv[1]
destination_dir = sys.argv[2]
places_file = open(sys.argv[1])
places_lines = places_file.read().splitlines()
for line in places_lines[1:]:
    fields = line.split("\t")
    place = {}
    place["place_id"] = fields[0]
    place["place_name"] = fields[1]
    place["place_lat"] = fields[2]
    place["place_lon"] = fields[3]
    place["place_brief_desc"] = fields[4]
    place["place_longer_desc"] = fields[5]
    place["place_image"] = fields[6]
    place["place_tags"] = fields[7]
    place["place_links"] = fields[8]
    place["place_country"] = fields[9]
    all_places.append(place)
    dump = json.dumps(place)
    f = open(f'{destination_dir}{place["place_id"]}.json', "w")
    f.write(dump)
    f.close()
dump = json.dumps(all_places)
f = open(f'{destination_dir}all_places.json', "w")
f.write(dump)
f.close()