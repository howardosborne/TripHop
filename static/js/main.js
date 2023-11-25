var map;

//layers
var possible_start_points;
var possible_hops;
var route_lines;
var possible_trip;
var possible_trip_route_lines;
var popup;

//the start point
var start_point;
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
    /*L.easyButton({
      id: 'inspire_button',  
      position: 'topleft',      
      type: 'replace',          
      leafletClasses: true,     
      states:[{                 
        stateName: 'inspire_me',
        onClick: function(button, map){
          open_offcanvas('offcanvasInspire');
        },
        title: 'inspire me',
        icon: '<img src="./static/icons/lightbulb.png">'
      }]
    }).addTo(map);
  */
    L.easyButton({
      id: 'mytrip_button',  
      position: 'topleft',      
      type: 'replace',          
      leafletClasses: true,     
      states:[{                 
        stateName: 'my_trip',
        onClick: function(button, map){
          buildAccordion();

          open_offcanvas('offcanvasTrip');
        },
        title: 'my trip',
        icon: '<img src="./static/icons/triphop_icon.png">'
      }]
    }).addTo(map);    

    //add the various layers to be used
    possible_start_points = new L.LayerGroup();
    map.addLayer(possible_start_points);
    possible_hops = new L.LayerGroup();
    map.addLayer(possible_hops);
  
    hops = new L.LayerGroup();
    map.addLayer(hops);
    
    route_lines = new L.LayerGroup();
    map.addLayer(route_lines);

    possible_trip = new L.LayerGroup();
    map.addLayer(possible_trip);
    possible_trip_route_lines = new L.LayerGroup();
    map.addLayer(possible_trip_route_lines)  

    get_start_points();
    get_all_hops();
    get_trips();
}

function get_start_points(){
  var url = "./static/places.json";
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function() {
  if (this.readyState == 4 && this.status == 200) {
    all_places = JSON.parse(this.responseText);
    Object.entries(all_places).forEach((entry) => {
      const [id, place] = entry;
      var marker = L.circle([place.place_lat, place.place_lon], {color: '#633974',fillColor: '#633974',fillOpacity: 0.5,radius: 10000});
      marker.bindTooltip(decodeURI(place.place_name));
      marker.properties = place;
      marker.addEventListener('click', _starterMarkerOnClick);
      marker.addTo(possible_start_points)
    });
  }};

  xmlhttp.open("GET", url, true);
  xmlhttp.send();
  //popup a start message when the map opens
  show_start_message();
  //open_sidebar_tab("home")
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

function get_trips(){
  var xmlhttp = new XMLHttpRequest();
  var url = `./static/trips.json`;
  xmlhttp.onreadystatechange = function() {
  if (this.readyState == 4 && this.status == 200) {
    var response = JSON.parse(this.responseText);
    trips = response;
    document.getElementById("travel_details_body").innerHTML = "";
    Object.entries(trips).forEach((entry) => {
      const [id, trip] = entry;
      var element = `
      <div class="card">
        <img src="${trip["trip_image"]}" class="card-img-top" alt="...">
        <div class="card-body">
          <h5 class="card-title">${trip.trip_title}</h5>
          <p class="card-text">${trip.trip_description}</p>
          <button class="btn btn-primary-outline" onclick="show_route('${id}')">Show route</button>
        </div>
      </div>>
      `
      document.getElementById("offCanvasInspireBody").insertAdjacentHTML('beforeend', element);
    });
  }};

  xmlhttp.open("GET", url, true);
  xmlhttp.send();
}

function show_start_message(){
  popup_text = `<h3 class="card-title" id="place_title">TripHop</h3>
  <p>Pick a place to start</p>
  <p>See where you can get to next in a single hop</p>
  <p>Want some inspiration? Try one of these <a href="#" onclick="open_offcanvas('offcanvasInspire')" class="card-link">ideas</a></p> 
`
  popup = L.popup([45,10],{content: popup_text, closeButton: false}).openOn(map);
}

function start_again(){
  hops.clearLayers();
  route_lines.clearLayers();
  start_point.remove();
  get_start_points();
}

function _starterMarkerOnClick(e) {
  //add home layer
  var my_icon = L.icon({iconUrl: `./static/icons/triphop.png`,iconSize: [28, 28], iconAnchor: [14,28]});
  start_point = L.marker([e.latlng.lat, e.latlng.lng],{icon:my_icon}).addTo(map);
  start_point.properties = e.sourceTarget.properties;
  //remove potential start points
  possible_start_points.clearLayers();
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
    <li class="list-group-item"><a class="btn btn-outline-primary btn-sm" id="show_button" onclick="showTrip()">show whole trip</a> <a class="btn btn-outline-warning btn-sm" id="remove_button" onclick="remove_hop(${hop.hop_count})">remove hop(s)</a></li>
    </ul>
    `
  popup = L.popup().setLatLng([e.latlng.lat,e.latlng.lng]).setContent(popup_text).openOn(map); 



}

function showTrip(){
  buildAccordion();
  open_offcanvas("offcanvasTrip");
}

function _addToTrip(){
  //they've chose to add the previewed place
  popup.close();
  hops_items = hops.getLayers();
  var last_hop;
  if(hops_items.length > 0){
    last_hop = all_places[hops_items[hops_items.length-1].properties.place_id];
  }
  else{last_hop = start_point.properties;}
  pointA = new L.LatLng(parseFloat(last_hop.place_lat), parseFloat(last_hop.place_lon));
  pointB = new L.LatLng(parseFloat(candidate_hop.place_lat), parseFloat(candidate_hop.place_lon));
  var pointList = [pointA, pointB];
  new_line = new L.Polyline(pointList, {color: '#7A7D7D',weight: 3,opacity: 0.5,smoothFactor: 1});
  new_line.addTo(route_lines);

  //add to the hops layer
  var my_icon = L.icon({iconUrl: `./static/icons/${hops_items.length + 1}.png`, iconSize: [28, 28], iconAnchor: [14,28]});

  var marker = L.marker([parseFloat(candidate_hop.place_lat), parseFloat(candidate_hop.place_lon)],{icon:my_icon});
  //add property for its count
  marker.properties = {};
  marker.properties.place_name = candidate_hop.place_name;
  marker.properties.place_id = candidate_hop.place_id;
  marker.properties.from_place_id = last_hop.place_id;
  marker.properties.hop_count = hops_items.length + 1;
  marker.properties.place_links = candidate_hop.place_links;
  marker.properties.place_brief_desc = candidate_hop.place_brief_desc;
  marker.properties.place_longer_desc = candidate_hop.place_longer_desc;
  marker.bindTooltip(candidate_hop.place_name);
  marker.addEventListener('click', _hopOnClick);
  marker.addTo(hops);
  get_hops(candidate_hop.place_id);
}

function get_place_details_block(id){
  var block = `<h5 class="offcanvas-title">${all_places[id]["place_name"]}</h5>
  <div class="card">
    <img src="${all_places[id]["place_image"]}" class="card-img-top" alt="${all_places[id]["place_name"]}">
    <div class="card-body">
      <p class="card-text">${all_places[id]["place_longer_desc"]}</p>
    </div>
    <div class="card-body" id="places_to_stay">
      <h5>Places to stay</h5>
      <ul class="list-group list-group-flush">
        <li class="list-group-item"><a href="https://ecobnb.com/" target="_blank">EcoBnB</a></li>
        <li class="list-group-item"><a href="https://airbnb.com/" target="_blank">AirBnB</a></li>
        <li class="list-group-item"><a href="https://booking.com/" target="_blank">Booking.com</a></li>
        <li class="list-group-item"><a href="https://expedia.com/" target="_blank">Expedia</a></li>
        <li class="list-group-item"><a href="https://trivago.com/" target="_blank">Trivago</a></li>
      </ul>
    </div>
    <div class="card-body" id="things_to_do">
      <h5>Things to do</h5>
      <a href="https://tripadvisor.com/" target="_blank">Trip Advisor</a>
    </div>
  </div>`
  return block;
}

function get_travel_details_block(details){
  details_list = `<ul class="list-group">`;
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
            <h5 class="card-title"><a target="_blank" href="${detail.agency_url}">${detail.agency_name}</a></h5>
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
    var marker = L.circle(
      [hop.place_lat, hop.place_lon], 
      {color: '#FF7933',fillColor: '#FF7933',fillOpacity: 0.5,radius: 10000}
      );
    marker.bindTooltip(hop.place_name);
    marker.properties = hop;
    marker.addEventListener('click', _markerOnClick);
    marker.riseOnHover = true;
    marker.addTo(possible_hops)
  });
}

function remove_hop(hop_id){
  popup.close();
  var hops_layers = hops.getLayers();
  var ubound = hops_layers.length + 1;
  for(var i=hop_id;i<ubound;i++){
    h = hops.getLayers();
    hops.removeLayer(h[h.length -1]._leaflet_id);
    layers = route_lines.getLayers();
    route_lines.removeLayer(layers[layers.length -1]._leaflet_id);
  };
  var id = hops_layers[hops_layers.length - 1].properties.place_id;
  get_hops(id);
}

function format_duration(mins){
  //mins = secs/60
  remainder =  mins % 60;
  str_remainder = remainder.toString();
  console.log(str_remainder.padStart(2, '0'));
  hours = (mins - remainder) / 60;
  return(hours.toString() + ":" + str_remainder.padStart(2, '0'));
}

function share_trip(){
  //collect together the hops and show the offcanvas
  trip_hops = [];
  for(var i=0;i<document.getElementsByClassName("accordion-item").length;i++){
    trip_hops.push(document.getElementById(`accordion_block_${i}_place_id`).innerHTML);
  }
  document.getElementById("trip_hops").innerHTML = trip_hops.join(",");
  var of = document.getElementById("offcanvasSubmitNewTrip");
  var offcanvas = new bootstrap.Offcanvas(of);
  offcanvas.toggle();
}

function send_trip(){
const XHR = new XMLHttpRequest();
const urlEncodedDataPairs = [];
// Turn the data object into an array of URL-encoded key/value pairs.
name = "trip_name_input"
value = document.getElementById("trip_name_input").value
urlEncodedDataPairs.push(`${encodeURIComponent(name)}=${encodeURIComponent(value)}`);
name = "trip_short_desc"
value = document.getElementById("trip_short_desc").value
urlEncodedDataPairs.push(`${encodeURIComponent(name)}=${encodeURIComponent(value)}`);
name = "place_longer_desc"
value = document.getElementById("place_longer_desc").value
urlEncodedDataPairs.push(`${encodeURIComponent(name)}=${encodeURIComponent(value)}`);
name = "tags_input"
value = document.getElementById("tags_input").value
urlEncodedDataPairs.push(`${encodeURIComponent(name)}=${encodeURIComponent(value)}`);
name = "submitter_name"
value = document.getElementById("submitter_name").value
urlEncodedDataPairs.push(`${encodeURIComponent(name)}=${encodeURIComponent(value)}`);
name = "submitter_profile"
value = document.getElementById("submitter_profile").value
urlEncodedDataPairs.push(`${encodeURIComponent(name)}=${encodeURIComponent(value)}`);
name = "trip_hops"
value = document.getElementById("trip_hops").value
urlEncodedDataPairs.push(`${encodeURIComponent(name)}=${encodeURIComponent(value)}`);
// Combine the pairs into a single string and replace all %-encoded spaces to
// the '+' character; matches the behavior of browser form submissions.
const urlEncodedData = urlEncodedDataPairs.join("&").replace(/%20/g, "+");

// Define what happens on successful data submission
XHR.addEventListener("load", (event) => {
  const alertPlaceholder = document.getElementById('liveAlertPlaceholder');
  const wrapper = document.createElement('div')
  wrapper.innerHTML = [
    `<div class="alert alert-sucess alert-dismissible" role="alert">`,
    `   <div>Thanks for sending!</div>`,
    '   <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>',
    '</div>'
  ].join('')

  alertPlaceholder.append(wrapper)
});

// Define what happens in case of an error
XHR.addEventListener("error", (event) => {
  const alertPlaceholder = document.getElementById('liveAlertPlaceholder');
  const wrapper = document.createElement('div')
  wrapper.innerHTML = [
    `<div class="alert alert-danger alert-dismissible" role="alert">`,
    `   <div>messge not sent</div>`,
    '   <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>',
    '</div>'
  ].join('')

  alertPlaceholder.append(wrapper)
});

// Set up our request
XHR.open("POST", "https://script.google.com/macros/s/AKfycbwlrLCuGUUVEKdQweKAjyZg2ZqVTQqZjZQoxUKvZr328LHL4ynTv81Blm_flwzIXo53/exec");
// Add the required HTTP header for form data POST requests
XHR.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
// Finally, send our data.
XHR.send(urlEncodedData);
document.getElementById("trip_hops").innerHTML = trip_hops.join(",");

}

function open_offcanvas(offcanvas){
  var of = document.getElementById(offcanvas);
  var offcanvas = new bootstrap.Offcanvas(of);
  offcanvas.toggle();
}

function open_travel_details(from_place_id, to_place_id){
  var travel_details = get_travel_details(from_place_id, to_place_id);
  var block = get_travel_details_block(travel_details.details);
  document.getElementById("travel_details_body").innerHTML = block;
  var of = document.getElementById("offcanvasTravelDetails");
  var offcanvas = new bootstrap.Offcanvas(of);
  offcanvas.toggle();
}

function show_route(route_id){
  popup.close();
  possible_start_points.clearLayers();  
  possible_trip.clearLayers();
  possible_trip_route_lines.clearLayers();
  hops.clearLayers();
  route_lines.clearLayers();
  //need to go through each part of the route and add to the map
  var trip = trips[route_id]["hops"];
  var hop = all_places[trip[0]];
  var my_icon = L.icon({iconUrl: `./static/icons/triphop.png`,iconSize: [28, 28], iconAnchor: [14,28]});
  start_point = L.marker([hop.place_lat, hop.place_lon],{icon:my_icon}).addTo(map);
  start_point.bindTooltip(decodeURI(hop.place_name));
  start_point.properties = hop;

  for(var i=1;i<trip.length;i++){
    hop = all_places[trip[i]];
    hop.from_place_id = trip[i-1];
    hop.hop_count = i;
    var my_icon = L.icon({iconUrl: `./static/icons/${i}.png`, iconSize: [28, 28], iconAnchor: [14,28]});
    var marker = L.marker([hop.place_lat, hop.place_lon],{icon:my_icon}).addTo(map);
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
}

function _tripMarkerOnClick(e) {
  //get the properties of the place marked
  var hop = e.sourceTarget.properties;
  place = all_places[hop.place_id];

  var place_block = get_place_details_block(place.place_id);
  document.getElementById("place_body").innerHTML = place_block;
  var hop_travel_details = get_travel_details(hop.from_place_id, hop.place_id);
  var block = get_travel_details_block(hop_travel_details["details"]);
  document.getElementById("travel_details_body").innerHTML = block;

  popup_text = `
    <h5 class="card-title" id="place_title">${place.place_name}</h5>
    <ul class="list-group list-group-flush">
    <li class="list-group-item">${decodeURIComponent(place.place_brief_desc)} 
    <a data-bs-toggle="offcanvas" href="#offcanvasPlace" aria-controls="offcanvasPlace">more...</a>
    </li>
    <li class="list-group-item">Journey times from: ${format_duration(hop_travel_details.duration_min)} <a data-bs-toggle="offcanvas" href="#offcanvasTravelDetails" aria-controls="offcanvasTravelDetails">more...</a>
    </li>
    <li class="list-group-item"><a class="btn btn-outline-primary btn-sm" id="add_button" onclick="_addTrip()">Use this idea</a>
    </li>
    </ul>
    `
  popup = L.popup().setLatLng([e.latlng.lat,e.latlng.lng]).setContent(popup_text).openOn(map);
  
}

function buildAccordion(){
  document.getElementById("trip_accordion").innerHTML = "";
//add startpoint
acc = `
<div class="accordion-item" id="accordion_block_0"}>
  <h2 class="accordion-header">
    <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#accordion_0" aria-expanded="true" aria-controls="accordion_0">
    Starting at ${decodeURI(start_point.properties.place_name)}
    </button>
  </h2>
  <div class="accordion-body">
    <button type="button" class="btn btn-outline-primary" onclick="start_again()">start again</button>
  </div>
  <div id="accordion_0" class="accordion-collapse collapse" data-bs-parent="#trip_accordion">
  </div>
</div>
`
document.getElementById("trip_accordion").insertAdjacentHTML('beforeend', acc);

//add each hop
hops_items = hops.getLayers();
hops_items.forEach((hop) => {
  current_accordion_count = document.getElementsByClassName("accordion-item").length;
  new_accordion_count = current_accordion_count++;
  var travel_details = get_travel_details(from_place_id, to_place_id);
  var travel_block = get_travel_details_block(travel_details.details);
  var place_block = get_place_details_block(to_place_id);
  acc = `
  <div class="accordion-item" id="accordion_block_${new_accordion_count}">
    <h2 class="accordion-header">
      <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#accordion_${new_accordion_count}" aria-expanded="true" aria-controls="accordion_${new_accordion_count}">
        ${new_accordion_count}. ${hop.properties.place_name}
      </button>
    </h2>
    <div id="accordion_${new_accordion_count}" class="accordion-collapse collapse" data-bs-parent="#trip_accordion">
      <div class="accordion-body">
      <ul class="list-group list-group-flush">
        <li class="d-inline-flex gap-1"><a class="btn btn-primary" data-bs-toggle="collapse" href="#collapse_travel_${new_accordion_count}" role="button" aria-expanded="false" aria-controls="collapse_travel_${new_accordion_count}">travel options</a></li>
        <div class="collapse" id="collapse_travel_${new_accordion_count}"><div class="card card-body">${travel_block}</div></div>
        <li class="d-inline-flex gap-1"><a class="btn btn-primary" data-bs-toggle="collapse" href="#collapse_place_${new_accordion_count}" role="button" aria-expanded="false" aria-controls="collapse_place_${new_accordion_count}">travel options</a></li>
        <div class="collapse" id="collapse_place_${new_accordion_count}"><div class="card card-body">${place_block}</div></div>
        <li class="list-group-item"><a class="btn btn-outline-warning btn-sm" id="remove_button_${new_accordion_count}" onclick="remove_hop_using_accordion_button('${new_accordion_count}')">Remove hop</a></li>
        </ul>
      </div>
    </div>
  </div>`
  document.getElementById("trip_accordion").insertAdjacentHTML('beforeend', acc);
});
}

function remove_hop_using_accordion_button(count){
  remove_hop(count);
  buildAccordion();
}
