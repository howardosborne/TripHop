import sys

places_file = open(sys.argv[1], encoding="utf-8")
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
    block = f"""
    <h5 class="offcanvas-title">{fields[1]}</h5>
    <div class="card">
        <img src="{fields[6]}" class="card-img-top" alt="{fields[1]}">
        <div class="card-body">
            <p class="card-text">{fields[5]}</p>
        </div>
        <a class="btn btn-outline-primary" id="offcanvas_hotel" target="_blank">places to stay</a>
		<a class="btn btn-outline-primary" id="offcanvas_guide" target="_blank">rough planet</a>
    </div>"""
    f = open(f'{fields[8]}', "w",encoding="utf-8")
    f.write(block)
    f.close()
