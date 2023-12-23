var map;

//colours
var chosenHopsColour = "#563d7c";
var possibleHopsColour = "#FF7933";
var inspirePlacesColour = "#466600";
var circleSize = 10000;
//layers
var possible_start_points;
var possible_hops;
var route_lines;
var possible_trip;
var possible_trip_route_lines;
var popup;

//the start point - not quite sure how to manage this...
var start_point;
var start_points;
//when a marker is click, it becomes a candidate ( a lousy way of passing a reference)
var candidate_hop;
//all the hops from the start point
var hops;

//lookups for info about all places, hops and trips
var all_places = {};
var all_hops = {};
var trips;

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
    
    start_points = new L.LayerGroup();
    map.addLayer(start_points);

    route_lines = new L.LayerGroup();
    map.addLayer(route_lines);

    possible_trip = new L.LayerGroup();
    map.addLayer(possible_trip);
    possible_trip_route_lines = new L.LayerGroup();
    map.addLayer(possible_trip_route_lines)  

    get_start_points();
    get_all_hops();
    getTrips();
}

function get_start_points(){
  var url = "./static/places.json";

  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function() {
  if (this.readyState == 4 && this.status == 200) {
    all_places = JSON.parse(this.responseText);
    Object.entries(all_places).forEach((entry) => {
      const [id, place] = entry;
      var marker = L.circle([place.place_lat, place.place_lon], {color: inspirePlacesColour, fillColor: inspirePlacesColour,fillOpacity: 0.5,radius: 5000});
      marker.bindTooltip(decodeURI(place.place_name));
      marker.properties = place;
      marker.addEventListener('click', _starterMarkerOnClick);
      marker.addTo(possible_start_points)
    });
  }};

  xmlhttp.open("GET", url, true);
  xmlhttp.send();

  showHome();
}

function get_all_hops(){
  var xmlhttp = new XMLHttpRequest();
  var url = `./static/hops.json`;
  xmlhttp.onreadystatechange = function() {
  if (this.readyState == 4 && this.status == 200) {
    var response = JSON.parse(this.responseText);
    all_hops = response;
  }};

  xmlhttp.open("GET", url, true);
  xmlhttp.send();
}

function getTrips(){
  var xmlhttp = new XMLHttpRequest();
  var url = `./static/trips.json`;
  xmlhttp.onreadystatechange = function() {
  if (this.readyState == 4 && this.status == 200) {
    var response = JSON.parse(this.responseText);
    trips = response;
    Object.entries(trips).forEach((entry) => {
      const [id, trip] = entry;
      var element = `
      <div class="card" onmouseover="showRoute('${id}')">
        <img src="${trip["trip_image"]}" class="card-img-top" alt="...">
        <div class="card-body">
          <h5 class="card-title">${trip.trip_title}</h5>
          <p class="card-text">${trip.trip_description}</p>
          <a href="#" class="card-link" onclick="showTripParts(${id})">more details...</a>
          <a href="#" class="card-link" onclick="useThisRoute(${id})">pick this one!</a>
        </div>
      </div>
      `
      document.getElementById("inspireBody").insertAdjacentHTML('beforeend', element);
    });
  }};

  xmlhttp.open("GET", url, true);
  xmlhttp.send();
}

function showTripParts(id){
  document.getElementById(`offCanvasInspireBody`).innerHTML = "";
  var hop_ids = trips[id]["hops"];
  for(var i=0;i<hop_ids.length;i++){
    place = all_places[hop_ids[i]];
    var element = `
    <div class="card mb-3" style="max-width: 540px;">
      <div class="row g-0">
        <div class="col-md-4">
          <img src="${place["place_image"]}" class="img-fluid rounded-start" alt="...">
        </div>
        <div class="col-md-8">
          <div class="card-body">
            <h5 class="card-title">${place["place_name"]}</h5>
            <p class="card-text">${place["place_brief_desc"]}</p>  
          </div>
        </div>
      </div>
    </div>
    `
    document.getElementById(`offCanvasInspireBody`).insertAdjacentHTML('beforeend', element);
  }
  open_offcanvas("offcanvasInspire");
}

function showHome(){
  if(hops.getLayers().length > 0){
    buildSummary();
  }
  document.getElementById("homeBody").hidden = false;
  document.getElementById("inspireBody").hidden = true;
  document.getElementById("settingsBody").hidden = true;
}

function showInspireMe(){

  document.getElementById("homeBody").hidden = true;
  document.getElementById("inspireBody").hidden = false;
  document.getElementById("settingsBody").hidden = true;
}

function showSettings(){
  document.getElementById("homeBody").hidden = true;
  document.getElementById("inspireBody").hidden = true;
  document.getElementById("settingsBody").hidden = false;
}

function show_start_message(){
  popup_text = `
  <div class="card" style="width: 18rem;">
    <img src="./static/icons/triphop_2.png" class="card-img-top" alt="...">
      <h5 class="card-title">Plan your next trip - one hop at a time</h5>
      <p class="card-text">Pick a place and see where you can go in a single hop - stay for as little or long as you like and move on.</p>
      <p class="card-text">Want some inspiration? Try one of these... 
      <a class="icon-link" href="#" onclick="open_offcanvas('offcanvasInspire')">Inspire me!<svg class="bi" aria-hidden="true"><use xlink:href="#arrow-right"></use></svg></a>
      </p>
  </div> 
`
  //document.getElementById("startBody").innerHTML = popup_text;
  //popup = L.popup([35,10],{content: popup_text, closeButton: true}).openOn(map);
  //open_offcanvas('offcanvasStart');
}

function start_again(){
  if(popup){popup.close();}
  hops.clearLayers();
  route_lines.clearLayers();
  //start_points.clearLayers();
  get_start_points();
}

function _starterMarkerOnClick(e) {
  //add home layer
  //var my_icon = L.icon({iconUrl: `./static/icons/triphop.png`,iconSize: [36, 36], iconAnchor: [18,36]});
  //point = L.marker([e.latlng.lat, e.latlng.lng],{icon:my_icon});
  var marker = L.circle([e.latlng.lat, e.latlng.lng], {color: inspirePlacesColour, fillColor: inspirePlacesColour,fillOpacity: 0.5,radius: circleSize});
  marker.properties = e.sourceTarget.properties;
  marker.properties.hop_count = 1;
  marker.bindTooltip(marker.properties.place_name);
  marker.addTo(hops);
  //remove potential start points
  possible_start_points.clearLayers();
  buildSummary();
  get_hops(e.sourceTarget.properties.place_id);
}

function _markerOnClick(e) {
  //get the properties of the place marked
  candidate_hop = e.sourceTarget.properties;
  place = all_places[candidate_hop.place_id];

  var place_block = get_place_details_block(candidate_hop.place_id);
  document.getElementById("place_body").innerHTML = place_block;
  // unpack the travel details
  var block = get_travel_details_block(candidate_hop.details);
  document.getElementById("travel_details_body").innerHTML = block;

  popup_text = `
    <h5 class="card-title" id="place_title">${candidate_hop.place_name}</h5>
    <ul class="list-group list-group-flush">
    <li class="list-group-item">${decodeURIComponent(place.place_brief_desc)} <a data-bs-toggle="offcanvas" href="#offcanvasPlace" aria-controls="offcanvasPlace">more...</a></li>
    <li class="list-group-item">Journey times from: ${format_duration(candidate_hop.duration_min)} <a data-bs-toggle="offcanvas" href="#offcanvasTravelDetails" aria-controls="offcanvasTravelDetails">more...</a></li>
    <li class="list-group-item"><a class="btn btn-outline-primary btn-sm" id="add_button" onclick="_addToTrip()">Add to trip</a></li>
    </ul>
    `
  popup = L.popup().setLatLng([e.latlng.lat,e.latlng.lng]).setContent(popup_text).openOn(map); 
}

function _hopOnClick(e) {
  var hop = e.sourceTarget.properties;
  place = all_places[hop.place_id];
  var place_block = get_place_details_block(place.place_id);
  document.getElementById("place_body").innerHTML = place_block;
  var travel_details = get_travel_details(hop.from_place_id,hop.place_id)
  var block = get_travel_details_block(travel_details.details);
  document.getElementById("travel_details_body").innerHTML = block;

  popup_text = `
    <h5 class="card-title" id="place_title">${hop.place_name}</h5>
    <ul class="list-group list-group-flush">
    <li class="list-group-item">${decodeURIComponent(place.place_brief_desc)} <a data-bs-toggle="offcanvas" href="#offcanvasPlace" aria-controls="offcanvasPlace">more...</a></li>
    <li class="list-group-item">Journey times from: ${format_duration(travel_details.duration_min)} <a data-bs-toggle="offcanvas" href="#offcanvasTravelDetails" aria-controls="offcanvasTravelDetails">more...</a></li>
   <!--<li class="list-group-item"><a class="btn btn-outline-primary btn-sm" id="show_button" onclick="showTrip()">show trip</a> <a class="btn btn-outline-danger btn-sm" id="remove_button" onclick="removeHop(${hop.hop_count})">remove hop(s)</a></li>-->
    </ul>
    `
  popup = L.popup().setLatLng([e.latlng.lat,e.latlng.lng]).setContent(popup_text).openOn(map); 
}

function showTrip(){
  buildSummary();
  open_offcanvas("offcanvasTrip");
}

function _addToTrip(){
  //they've chose to add the previewed place
  popup.close();
  hops_items = hops.getLayers();
  var last_hop;
  //if(hops_items.length > 0){
  last_hop = all_places[hops_items[hops_items.length-1].properties.place_id];
  //}
  //else{last_hop = start_point.properties;}
  pointA = new L.LatLng(parseFloat(last_hop.place_lat), parseFloat(last_hop.place_lon));
  pointB = new L.LatLng(parseFloat(candidate_hop.place_lat), parseFloat(candidate_hop.place_lon));
  var pointList = [pointA, pointB];
  new_line = new L.Polyline(pointList, {color: '#7A7D7D',weight: 3,opacity: 0.5,smoothFactor: 1});
  new_line.addTo(route_lines);

  //add to the hops layer
  //var my_icon = L.icon({iconUrl: `./static/icons/${hops_items.length + 1}.png`, iconSize: [36, 36], iconAnchor: [18,36]});
  var marker = L.circle([parseFloat(candidate_hop.place_lat), parseFloat(candidate_hop.place_lon)], {color: chosenHopsColour, fillColor: chosenHopsColour,fillOpacity: 0.5,radius: circleSize});
  //var marker = L.marker([parseFloat(candidate_hop.place_lat), parseFloat(candidate_hop.place_lon)],{icon:my_icon});
  //add property for its count
  hop = all_places[candidate_hop.place_id];
  marker.properties = hop;
  marker.properties.from_place_id = last_hop.place_id;
  marker.properties.hop_count = hops_items.length + 1;
  marker.bindTooltip(hop.place_name);
  marker.addEventListener('click', _hopOnClick);
  marker.addTo(hops);
  buildSummary();
  get_hops(candidate_hop.place_id);
}

function get_place_details_block(id){
  //could use this to get an image where there isn't a local one
  //https://script.google.com/macros/s/AKfycbzQGQORse3FHygan8KZG61Ov-WM1SD3-J3J6Yqjzo6IYTJKvSq5H6QBtTN25_aFhiZq/exec?name=
  var block = `<h5 class="offcanvas-title">${all_places[id]["place_name"]}</h5>
  <div class="card">
    <img src="${all_places[id]["place_image"]}" class="card-img-top" alt="${all_places[id]["place_name"]}">
    <div class="card-body">
      <p class="card-text">${all_places[id]["place_longer_desc"]}</p>
    </div>
    <div class="card-body" id="things_to_do">
      <h5>Things to do</h5>
      <ul class="list-group list-group-flush">
      <li class="list-group-item"><a href="https://tripadvisor.tp.st/iaDPCVsJ" target="_blank">TripAdvisor</a></li>
      <li class="list-group-item"><a href="https://viator.tp.st/dxbdWqWw" target="_blank">Viator</a></li>
      <li class="list-group-item"><a href="https://getyourguide.tp.st/j1O2V9WC" target="_blank">GetYourGuide</a></li>
      <li class="list-group-item"><a href="https://gocity.tp.st/bJKfnqLg" target="_blank">Go City</a></li>
      <li class="list-group-item"><a href="https://bikesbooking.tp.st/hzrEGoUL" target="_blank">BikesBooking.com</a></li>
      <li class="list-group-item"><a href="https://wegotrip.tp.st/9RusUZKl" target="_blank">WeGoTrip</a></li>
      </ul>
    </div>
    <div class="card-body" id="places_to_stay">
      <h5>Places to stay</h5>
      <ul class="list-group list-group-flush">
        <li class="list-group-item"><a href="https://booking.tp.st/JFpi36Ld/" target="_blank">Booking.com</a></li>
        <li class="list-group-item"><a href="https://vrbo.tp.st/V3hK9T1Z" target="_blank">Vrbo</a></li>
        <li class="list-group-item"><a href="https://hostelworld.tp.st/kXriQ07L" target="_blank">Hostelworld</a></li>
      </ul>
    </div>

  </div>`
  return block;
}

function get_travel_details_block(details){
  details_list = `<ul class="list-group list-group-flush">`;
  details.forEach(function (detail) {
    agency_name = detail.agency_name
    if(agency_name.toLowerCase().includes("bus")){
      transport_type = "bus";
    }
    else{
      transport_type = "train";
    }
    details_list +=`
    <li class="list-group-item">
      <div class="row g-0">
        <div class="col-md-4">
          <img src="./static/icons/${transport_type}.png" class="img-fluid rounded-start" alt="...">
        </div>
        <div class="col-md-8">
          <div class="card-body">
            <h5 class="card-title"><a target="_blank">${detail.agency_name}</a></h5>
            <p class="card-text"><small class="text-body-secondary">Journey time: ${format_duration(detail.duration_min)}</small></p>
            </div>
        </div>
      </div>     
    </li>`;
  });
  details_list += "</ul>";
  return details_list;
}

function get_travel_details(from_place_id, to_place_id){
  var hop;
  all_hops[from_place_id]['hops'].forEach((element) => {
    if(element["place_id"] == to_place_id){
      hop = element;
    }
  });
  return hop;
}

function get_hops(id){
  possible_hops.clearLayers();
  hops_obj = all_hops[id].hops;

  Object.entries(hops_obj).forEach((entry) => {
    const [id, hop] = entry;
    var marker = L.circle([hop.place_lat, hop.place_lon],{color: possibleHopsColour,fillColor: possibleHopsColour,fillOpacity: 0.5,radius: 5000});
    marker.bindTooltip(hop.place_name);
    marker.properties = hop;
    marker.addEventListener('click', _markerOnClick);
    marker.riseOnHover = true;
    marker.addTo(possible_hops)
  });
}

function removeHop(hop_item){
  popup.close();
  var hops_layers = hops.getLayers();
  var ubound = hops_layers.length;
  for(var i=hop_item;i<ubound;i++){
    h = hops.getLayers();
    hops.removeLayer(h[h.length - 1]._leaflet_id);
    layers = route_lines.getLayers();
    route_lines.removeLayer(layers[layers.length - 1]._leaflet_id);
  };
  var id = hops_layers[hops_layers.length - 1].properties.place_id;
  possible_hops.clearLayers();
  buildSummary();
  get_hops(id);
}

function format_duration(mins){
  //mins = secs/60
  remainder =  mins % 60;
  str_remainder = remainder.toString();
  hours = (mins - remainder) / 60;
  return(hours.toString() + ":" + str_remainder.padStart(2, '0'));
}

function open_offcanvas(offcanvas){
  if(popup){popup.close();}
  var of = document.getElementById(offcanvas);
  var offcanvas = new bootstrap.Offcanvas(of);
  offcanvas.toggle();
}

function openTravelDetails(from_place_id, to_place_id){
  var travel_details = get_travel_details(from_place_id, to_place_id);
  var block = get_travel_details_block(travel_details.details);
  document.getElementById("travel_details_body").innerHTML = block;
  var of = document.getElementById("offcanvasTravelDetails");
  var offcanvas = new bootstrap.Offcanvas(of);
  offcanvas.toggle();
}

function openPlaceDetails(place_id){
  place = all_places[place_id];
  var place_block = get_place_details_block(place.place_id);
  document.getElementById("place_body").innerHTML = place_block;
  var of = document.getElementById("offcanvasPlace");
  var offcanvas = new bootstrap.Offcanvas(of);
  offcanvas.toggle();
}

function showRoute(routeId){
  possible_start_points.clearLayers();  
  possible_trip.clearLayers();
  possible_trip_route_lines.clearLayers();
  //hops.clearLayers();
  //route_lines.clearLayers();
  //need to go through each part of the route and add to the map
  var trip = trips[routeId]["hops"];
  var hop = all_places[trip[0]];
  var marker = L.circle([parseFloat(hop.place_lat), parseFloat(hop.place_lon)], {color: inspirePlacesColour, fillColor: inspirePlacesColour,fillOpacity: 0.5,radius: circleSize});
  marker.bindTooltip(decodeURI(hop.place_name));
  marker.properties = hop;
  marker.riseOnHover = true;
  marker.addTo(possible_trip);

  for(var i=1;i<trip.length;i++){
    hop = all_places[trip[i]];
    hop.from_place_id = trip[i-1];
    hop.hop_count = i;
    //var my_icon = L.icon({iconUrl: `./static/icons/${i}.png`, iconSize: [36, 36], iconAnchor: [18,36]});
    //var marker = L.marker([hop.place_lat, hop.place_lon],{icon:my_icon}).addTo(map);
    var marker = L.circle([parseFloat(hop.place_lat), parseFloat(hop.place_lon)], {color: inspirePlacesColour, fillColor: inspirePlacesColour,fillOpacity: 0.5,radius: circleSize});  
    marker.bindTooltip(hop.place_name);
    marker.properties = hop;
    marker.addEventListener('click', _hopOnClick);
    marker.riseOnHover = true;
    marker.addTo(possible_trip);

    pointA = new L.LatLng(parseFloat(all_places[trip[i-1]].place_lat), parseFloat(all_places[trip[i-1]].place_lon));
    pointB = new L.LatLng(parseFloat(all_places[trip[i]].place_lat), parseFloat(all_places[trip[i]].place_lon));
    var pointList = [pointA, pointB];
    new_line = new L.Polyline(pointList, {color: '#7A7D7D',weight: 3,opacity: 0.5,smoothFactor: 1});
    new_line.addTo(possible_trip_route_lines);  
  }
  //buildSummary();
}

function useThisRoute(routeId){
  //check if hops empty if not then do something?
  //if(hops.getLayers().length > 0){}

  var trip = trips[routeId]["hops"];
  var hop = all_places[trip[0]];
  var marker = L.circle([parseFloat(hop.place_lat), parseFloat(hop.place_lon)], {color: chosenHopsColour, fillColor: chosenHopsColour,fillOpacity: 0.5,radius: circleSize});
  marker.bindTooltip(decodeURI(hop.place_name));
  marker.properties = hop;
  marker.riseOnHover = true;
  marker.addTo(hops);

  for(var i=1;i<trip.length;i++){
    hop = all_places[trip[i]];
    hop.from_place_id = trip[i-1];
    hop.hop_count = i;
    //var my_icon = L.icon({iconUrl: `./static/icons/${i}.png`, iconSize: [36, 36], iconAnchor: [18,36]});
    //var marker = L.marker([hop.place_lat, hop.place_lon],{icon:my_icon}).addTo(map);
    var marker = L.circle([parseFloat(hop.place_lat), parseFloat(hop.place_lon)], {color: chosenHopsColour, fillColor: chosenHopsColour,fillOpacity: 0.5,radius: circleSize});  
    marker.bindTooltip(hop.place_name);
    marker.properties = hop;
    marker.addEventListener('click', _hopOnClick);
    marker.riseOnHover = true;
    marker.addTo(hops);

    pointA = new L.LatLng(parseFloat(all_places[trip[i-1]].place_lat), parseFloat(all_places[trip[i-1]].place_lon));
    pointB = new L.LatLng(parseFloat(all_places[trip[i]].place_lat), parseFloat(all_places[trip[i]].place_lon));
    var pointList = [pointA, pointB];
    new_line = new L.Polyline(pointList, {color: '#7A7D7D',weight: 3,opacity: 0.5,smoothFactor: 1});
    new_line.addTo(route_lines);  
  }
  get_hops(trip[trip.length-1]);
  possible_trip.clearLayers();
  possible_trip_route_lines.clearLayers();

  showHome();
}

function buildSummary(){
  hops_items = hops.getLayers();
  document.getElementById("homeBody").innerHTML = `<h5>Starting at ${hops_items[0].properties.place_name}</h5>`;
  for(var i=1;i< hops_items.length;i++){
    var removalElement = "";
    if(i == hops_items.length - 1){removalElement = `<a href="#" class="card-link" onclick="removeHop('${i}')">remove</a>`;}
    document.getElementById("homeBody").innerHTML +=`
    <div class="card mb-3" style="max-width: 540px;">
    <div class="row g-0">
      <div class="col-md-2">
        <img src="./static/icons/train.png" class="img-fluid rounded-start" alt="...">
      </div>
      <div class="col-md-10">
           <a href="#" class="card-link" onclick="openTravelDetails('${hops_items[i -1].properties.place_id}','${hops_items[i].properties.place_id}')">${hops_items[i -1].properties.place_name} to ${hops_items[i].properties.place_name} travel details</a>
       </div>
    </div>
  </div>`;
    document.getElementById("homeBody").innerHTML +=`
    <div class="card mb-3" style="max-width: 540px;">
      <div class="row g-0">
        <div class="col-md-4">
          <img src="${hops_items[i].properties.place_image}" class="img-fluid rounded-start" alt="...">
        </div>
        <div class="col-md-8">
          <div class="card-body">
            <h5 class="card-title">${hops_items[i].properties.place_name}</h5>
            <p class="card-text"  text-truncate><small>${hops_items[i].properties.place_brief_desc}</small>
            <a href="#" class="card-link" onclick="openPlaceDetails('${hops_items[i].properties.place_id}')">more...</a>
            </p>
            ${removalElement}
          </div>
        </div>
      </div>
    </div>`;
    }
}