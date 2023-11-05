var map;
//various layers
var possible_start_points;
var possible_hops;
var hops;
var route_lines;

var start_point;
var popup;

var possible_route_line;
var possible_route_lines;

//lookup for info about all places
var all_places = {};

function start(){
    //make a map
    map = L.map('map').setView([45, 10], 5);
    const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {maxZoom: 19,attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'}).addTo(map);
    //add the various layers to be used
    possible_start_points = new L.LayerGroup();
    map.addLayer(possible_start_points);
  
    possible_hops = new L.LayerGroup();
    map.addLayer(possible_hops);
  
    hops = new L.LayerGroup();
    map.addLayer(hops);
    
    route_lines = new L.LayerGroup();
    map.addLayer(route_lines);
    get_start_points()
}

function get_start_points(){
  var url = "./static/places/start_points.json";
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function() {
  if (this.readyState == 4 && this.status == 200) {
    var arr = JSON.parse(this.responseText);
    for(i = 0; i < arr.length; i++) {
      all_places[arr[i].place_id] = arr[i];
        //var marker = L.marker([arr[i].stop_lat, arr[i].stop_lon]).addTo(map);
        var marker = L.circle([arr[i].place_lat, arr[i].place_lon], {color: '#633974',fillColor: '#633974',fillOpacity: 0.5,radius: 10000});
        marker.bindTooltip(decodeURI(arr[i].place_name));
        marker.properties = arr[i];
        marker.addEventListener('click', _starterMarkerOnClick);
        marker.addTo(possible_start_points)
    }
  }};

  xmlhttp.open("GET", url, true);
  xmlhttp.send();
  //popup a start message when the map opens
  popup_text = `<h5 class="card-title" id="place_title">TripHop</h5>
    <p class="card-text" id="place_text">Pick a place to start your trip</p>`
  popup = L.popup([45,10],{content: popup_text, closeButton: false}).openOn(map);
}

function start_again(){
  document.getElementById("hop_crumbs").innerHTML = "My trip";
  ubound = document.getElementsByClassName("accordion-item").length
  for(var i=0;i<ubound;i++){
    console.log(`accordion_block_${i}`)
    document.getElementById(`accordion_block_${i}`).remove();
    hops.clearLayers();
    route_lines.clearLayers();
    start_point.remove();
  }
  get_start_points();
}

function _starterMarkerOnClick(e) {

  //add home layer
  var my_icon = L.icon({iconUrl: `./static/icons/home.png`,iconSize: [28, 28]});
  start_point = L.marker([e.latlng.lat, e.latlng.lng],{icon:my_icon}).addTo(map);
  //start_point = L.circle([e.latlng.lat, e.latlng.lng], {color: '#BE33FF',fillColor: '#BE33FF',fillOpacity: 0.5,radius: 10000}).addTo(map);
  start_point.properties = e.sourceTarget.properties;
  //remove potential start points
  possible_start_points.clearLayers();
  
  acc = `
  <div class="accordion-item" id="accordion_block_0"}>
    <h2 class="accordion-header">
      <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#accordion_0" aria-expanded="true" aria-controls="accordion_0">
      Starting at ${decodeURI(e.sourceTarget.properties.place_name)}
      </button>
    </h2>
    <span id="accordion_block_0_place_id" hidden>${e.sourceTarget.properties.place_id}</span>
    <span id="accordion_0_lat" hidden>${e.latlng.lat}</span>
    <span id="accordion_0_lng" hidden>${e.latlng.lng}</span>
    <div id="accordion_0" class="accordion-collapse collapse" data-bs-parent="#accordionExample">
      <div class="accordion-body">
        <button type="button" class="btn btn-primary" onclick="start_again()">start again</button>
      </div>
    </div>
  </div>
  `
  document.getElementById("accordionExample").insertAdjacentHTML('beforeend', acc)

  //prompt to choose next hop
  popup_text = `<h5 class="card-title" id="place_title">Starting point: ${decodeURI(e.sourceTarget.properties.place_name)}</h5>
    <p class="card-text" id="place_text"> Where do you want to go next?</p>`
  popup = L.popup().setLatLng([e.latlng.lat,e.latlng.lng]).setContent(popup_text).openOn(map);
  document.getElementById("hop_crumbs").innerHTML = `Start: ${decodeURI(e.sourceTarget.properties.place_name)}`
  get_hops(e.sourceTarget.properties.place_id)
}

function _markerOnClick(e) {
  //get the properties of the place marked
  var hop = e.sourceTarget.properties;
  place = all_places[hop.place_id]

  //fill in the preview and see what the user want to do
  formatted_duration =format_duration(hop.duration_median)
  formatted_min_duration =format_duration(hop.duration_min)

  get_place_details(place.place_links)
  hop.journey_details = `Journey times: typical - ${formatted_duration} fastest - ${formatted_min_duration}`

  popup_text = `
    <h5 class="card-title" id="place_title">${place.place_name}</h5>
    <p class="card-text" id="place_text">${decodeURIComponent(place.place_brief_desc)}</p>
    <p class="card-text" id="journey_details">${hop.journey_details}</p>
    <a class="btn btn-outline-primary" data-bs-toggle="offcanvas" href="#offcanvasRight" role="button" aria-controls="offcanvasRight">more about ${decodeURI(place.place_name)}</a>
    <a class="btn btn-outline-primary" id="add_button" onclick="_addToTrip('${hop.place_id}','${hop.journey_details}')">Add to trip</a>`
  popup = L.popup().setLatLng([e.latlng.lat,e.latlng.lng]).setContent(popup_text).openOn(map);
  
}


function _hopOnClick(e) {
  //get the properties of the place marked
  var hop = e.sourceTarget.properties;
  place = all_places[hop.place_id]
  get_place_details(place.place_links)
  popup_text = `
    <h5 class="card-title" id="place_title">${hop.place_name}</h5>
    <a class="btn btn-outline-primary" data-bs-toggle="offcanvas" href="#offcanvasRight" role="button" aria-controls="offcanvasRight">more about ${decodeURI(place.place_name)}</a>
    <a class="btn btn-outline-primary" data-bs-toggle="offcanvas" href="#offcanvasNavbar" role="button" aria-controls="offcanvasNavbar">trip details</a>
    <a class="btn btn-outline-primary" id="close_popup_and_remove_hop_button" onclick="remove_hop('${hop.hop_count}')">remove hop</a>`
  popup = L.popup().setLatLng([e.latlng.lat,e.latlng.lng]).setContent(popup_text).openOn(map);  
}


function _addToTrip(place_id, journey_details){
  //they've chose to add the previewed place
  popup.close()
  place = all_places[place_id]
  //add to the trip list accordion
  current_accordion_count = document.getElementsByClassName("accordion-item").length;
  new_accordion_count = current_accordion_count++;
  acc = `
  <div class="accordion-item" id="accordion_block_${new_accordion_count}">
    <h2 class="accordion-header">
      <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#accordion_${new_accordion_count}" aria-expanded="true" aria-controls="accordion_${new_accordion_count}">
        ${new_accordion_count}. ${place.place_name}
      </button>
    </h2>
    <span id="accordion_block_${new_accordion_count}_place_id" hidden>${place_id}</span>
    <span id="accordion_${new_accordion_count}_lat" hidden>${place.place_lat}</span>
    <span id="accordion_${new_accordion_count}_lng" hidden>${place.place_lon}</span>
    <div id="accordion_${new_accordion_count}" class="accordion-collapse collapse" data-bs-parent="#accordionExample">
      <div class="accordion-body">
        <strong>Travel to ${place.place_name}</strong>
        <p>${journey_details}</p>
        <button type="button" class="btn btn-outline-primary">buy ticket</button>
        <button type="button" class="btn btn-outline-primary">look at hotels</button>
        <button type="button" class="btn btn-outline-primary" id="remove_button_${new_accordion_count}" onclick="remove_hop('${new_accordion_count}')">remove hop</button>
      </div>
    </div>
  </div>`
  if(document.getElementById(`remove_button_${current_accordion_count}`)){
    document.getElementById(`remove_button_${current_accordion_count}`).innerHTML = "Remove hops from here";
  }
  document.getElementById("accordionExample").insertAdjacentHTML('beforeend', acc);
  document.getElementById("hop_crumbs").innerHTML += ` => ${place.place_name}`;

  //add to the route lines layer
  //var route_line = new L.Polyline(possible_route_line.Polyline.pointList, {color: '#7A7D7D',weight: 3,opacity: 0.5,smoothFactor: 1});
  lat_a = document.getElementById(`accordion_${document.getElementsByClassName("accordion-item").length - 2}_lat`).innerHTML
  lng_a = document.getElementById(`accordion_${document.getElementsByClassName("accordion-item").length - 2}_lng`).innerHTML

  lat_b = document.getElementById(`accordion_${document.getElementsByClassName("accordion-item").length - 1}_lat`).innerHTML
  lng_b = document.getElementById(`accordion_${document.getElementsByClassName("accordion-item").length - 1}_lng`).innerHTML  

  pointA = new L.LatLng(parseFloat(lat_a), parseFloat(lng_a));
  pointB = new L.LatLng(parseFloat(lat_b), parseFloat(lng_b));
  var pointList = [pointA, pointB];
  new_line = new L.Polyline(pointList, {color: '#7A7D7D',weight: 3,opacity: 0.5,smoothFactor: 1});
  new_line.addTo(route_lines);

  //add to the hops layer
  var my_icon = L.icon({
    iconUrl: `./static/icons/${new_accordion_count}.png`,
    iconSize: [28, 28]});

  //var marker = L.circle([parseFloat(lat_b), parseFloat(lng_b)], {color: '#7A7D7D',fillColor: '#7A7D7D',fillOpacity: 0.5,radius: 10000});
  var marker = L.marker([parseFloat(lat_b), parseFloat(lng_b)],{icon:my_icon});
  //add property for its count
  marker.properties = {};
  marker.properties.place_name = place.place_name;
  marker.properties.place_id = place_id;
  marker.properties.hop_count = new_accordion_count;
  marker.properties.place_links = place.place_links;
  marker.properties.place_brief_desc = place.place_brief_desc;
  marker.properties.place_longer_desc = place.place_longer_desc;
  marker.bindTooltip(place.place_name);
  marker.addEventListener('click', _hopOnClick);
  marker.addTo(hops);

  //clear the possible hops
  //possible_hops.clearLayers();
  //clear the possible route lines
  //possible_route_lines.clearLayers();

  get_hops(place_id);
}

function get_place_details(url){
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function() {
  if (this.readyState == 4 && this.status == 200) {
    document.getElementById("place_body").innerHTML = this.responseText;
    //trigger the offcanvas?
    //var myOffcanvas = document.getElementById('offcanvasRight')
    //var bsOffcanvas = new bootstrap.Offcanvas(myOffcanvas)
    //bsOffcanvas.show()
  }};

  xmlhttp.open("GET", url, true);
  xmlhttp.send();
}

function get_hops(id){
  possible_hops.clearLayers();
  var xmlhttp = new XMLHttpRequest();
  var url = `./static/hops/${id}.json`;
  xmlhttp.onreadystatechange = function() {
  if (this.readyState == 4 && this.status == 200) {
    var response = JSON.parse(this.responseText);
    hops_obj = response.hops;
    Object.entries(hops_obj).forEach((entry) => {
      const [id, hop] = entry;
      var marker = L.circle([hop.place_lat, hop.place_lon], {color: '#FF7933',fillColor: '#FF7933',fillOpacity: 0.5,radius: 10000});
      marker.bindTooltip(hop.place_name);
      marker.properties = hop;
      marker.addEventListener('click', _markerOnClick);
      marker.addTo(possible_hops)
    });
  }};

  xmlhttp.open("GET", url, true);
  xmlhttp.send();
}

function remove_hop(hop_id){
  popup.close();
  
  ubound = document.getElementsByClassName("accordion-item").length;
  var id;
  for(var i=hop_id;i<ubound;i++){
    document.getElementById(`accordion_block_${i}`).remove();
    h = hops.getLayers()
    hops.removeLayer(h[h.length -1]._leaflet_id)

    layers = route_lines.getLayers()
    route_lines.removeLayer(layers[layers.length -1]._leaflet_id)
    
    crumbs = document.getElementById("hop_crumbs").innerHTML
    position = crumbs.lastIndexOf("=&gt");
    document.getElementById("hop_crumbs").innerHTML = crumbs.substr(0,position);
  }
  id = document.getElementById(  `accordion_block_${parseInt(document.getElementsByClassName("accordion-item").length) - 1}_place_id`).innerHTML
  
  get_hops(id)
}

function format_duration(mins){
  //mins = secs/60
  remainder =  mins % 60
  str_remainder = remainder.toString()
  console.log(str_remainder.padStart(2, '0'));
  hours = (mins - remainder) / 60
  return(hours.toString() + ":" + str_remainder.padStart(2, '0'));
}


//not used
function show_place_details(){
  document.getElementById('offcanvasRight')
}
