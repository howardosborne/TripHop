import sys

places_file = open(sys.argv[1])
places_lines = places_file.read().splitlines()
for line in places_lines[1:]:
    fields = line.split("\t")
    place = {}
    place["place_name"] = fields[1]
    place["place_lat"] = fields[2]
    place["place_lon"] = fields[3]
    place["place_brief_desc"] = fields[4]
    place["place_longer_desc"] = fields[5]
    place["place_image"] = fields[6]
    place["place_tags"] = fields[7]
    place["place_links"] = fields[8]
    place["place_country"] = fields[9]
    block = f"""<div class="card">
    <img src="{fields[6]}" class="card-img-top" alt="{fields[1]}">
    <div class="card-body">
    <p class="card-text">{fields[4]}
	</p>
</div>
</div>"""
    f = open(f'{fields[5]}', "w")
    f.write(block)
    f.close()
