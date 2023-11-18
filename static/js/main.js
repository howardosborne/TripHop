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
var all_hops = {};

var sidebar;

function start(){
    //make a map
    map = L.map('map').setView([45, 10], 5);
    const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {maxZoom: 19,attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'}).addTo(map);
    //add the various layers to be used
    possible_start_points = new L.LayerGroup();
    map.addLayer(possible_start_points);
    sidebar = L.control.sidebar({
      autopan: false,       // whether to maintain the centered map point when opening the sidebar
      closeButton: true,    // whether t add a close button to the panes
      container: 'sidebar', // the DOM container or #ID of a predefined sidebar container that should be used
      position: 'left',     // left or right
  }).addTo(map);
    possible_hops = new L.LayerGroup();
    map.addLayer(possible_hops);
  
    hops = new L.LayerGroup();
    map.addLayer(hops);
    
    route_lines = new L.LayerGroup();
    map.addLayer(route_lines);
    get_start_points();
    get_all_hops();
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
  //show_start_message();
  open_sidebar_tab("home")
}

function show_start_message(){
  popup_text = `<h3 class="card-title" id="place_title">TripHop</h3>
    <p class="card-text" id="place_text">Pick a place to start your trip</p>
    <p>Want some inspiration? Try one of <button type="button" class="btn btn-link" onclick="open_sidebar_tab('inspireme')">these?</button></p>
  </div>`
  popup = L.popup([45,10],{content: popup_text, closeButton: false}).openOn(map);
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

function start_again(){
  ubound = document.getElementsByClassName("accordion-item").length;
  for(var i=0;i<ubound;i++){
    document.getElementById(`accordion_block_${i}`).remove();
    hops.clearLayers();
    route_lines.clearLayers();
    start_point.remove();
  }
  get_start_points();
}

function _starterMarkerOnClick(e) {

  //add home layer
  var my_icon = L.icon({iconUrl: `./static/icons/triphop.png`,iconSize: [28, 28], iconAnchor: [14,28]});
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
    </div>
  </div>
  `
  document.getElementById("accordionExample").insertAdjacentHTML('beforeend', acc);

  //prompt to choose next hop
  //popup_text = `<h5 class="card-title" id="place_title">Starting point: ${decodeURI(e.sourceTarget.properties.place_name)}</h5>
  //  <p class="card-text" id="place_text"> Where do you want to go next?</p>`
  //popup = L.popup().setLatLng([e.latlng.lat,e.latlng.lng]).setContent(popup_text).openOn(map);
  get_hops(e.sourceTarget.properties.place_id);
}

function _markerOnClick(e) {
  //get the properties of the place marked
  var hop = e.sourceTarget.properties;
  place = all_places[hop.place_id];

  //fill in the preview and see what the user want to do
  
  get_place_details(place.place_id);
  // unpack the travel details
  get_travel_details(hop.details);

  popup_text = `
    <h5 class="card-title" id="place_title">${place.place_name}</h5>
    <p class="card-text" id="place_short_text">${decodeURIComponent(place.place_brief_desc)} 
    <a data-bs-toggle="offcanvas" href="#offcanvasPlace" aria-controls="offcanvasPlace">more...</a>
    </p>
    <p class="card-text d-inline-flex gap-1" id="journey_details"> 
    Journey times from: ${format_duration(hop.duration_min)} <a data-bs-toggle="offcanvas" href="#offcanvasTravelDetails" aria-controls="offcanvasTravelDetails">more...</a>
    </p>
    <a class="btn btn-outline-primary" id="add_button" onclick="_addToTrip('${hop.place_id}','${hop.details}')">Add to trip</a>
    `
  popup = L.popup().setLatLng([e.latlng.lat,e.latlng.lng]).setContent(popup_text).openOn(map);
  
}

function _hopOnClick(e) {
  var hop = e.sourceTarget.properties;
  place = all_places[hop.place_id];
  get_place_details(place.place_id);
  /*popup_text = `
    <h5 class="card-title" id="place_title">${hop.place_name}</h5>
    <div class="btn-group">
      <a class="btn btn-outline-primary" data-bs-toggle="offcanvas" href="#offcanvasPlace" role="button" aria-controls="offcanvasPlace">more about ${decodeURI(place.place_name)}</a>
      <a class="btn btn-outline-primary" data-bs-toggle="offcanvas" role="button" onclick="open_sidebar_tab('mytrip')">trip details</a>
      <a class="btn btn-outline-primary" id="close_popup_and_remove_hop_button" onclick="remove_hop('${hop.hop_count}')">remove hop</a>
    </div>`
  popup = L.popup().setLatLng([e.latlng.lat,e.latlng.lng]).setContent(popup_text).openOn(map); 
  */ 
  open_sidebar_tab("mytrip")

}

function _addToTrip(place_id){
  //they've chose to add the previewed place
  popup.close();
  place = all_places[place_id];
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
          <p><a data-bs-toggle="offcanvas" href="#offcanvasTravelDetails" aria-controls="offcanvasTravelDetails">travel options</a></p>
          <p><a data-bs-toggle="offcanvas" href="#offcanvasPlace" aria-controls="offcanvasPlace">Where to stay</a></p>
          <p><a data-bs-toggle="offcanvas" href="#offcanvasPlace" aria-controls="offcanvasPlace">Things to do</a></p>
          <p><a class="btn btn-outline-primary" id="close_popup_and_remove_hop_button" id="remove_button_${new_accordion_count}" onclick="remove_hop('${new_accordion_count}')">remove hop</p>
      </div>
    </div>
  </div>`
  //if(document.getElementById(`remove_button_${current_accordion_count}`)){
  //  document.getElementById(`remove_button_${current_accordion_count}`).innerHTML = "Remove hops from here";
  //}
  document.getElementById("accordionExample").insertAdjacentHTML('beforeend', acc);

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
    iconSize: [28, 28], iconAnchor: [14,28]});

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
  get_hops(place_id);
}

function get_place_details(id){
  document.getElementById("place_body").innerHTML = `<h5 class="offcanvas-title">${all_places[id]["place_name"]}</h5>
  <div class="card">
    <img src="${all_places[id]["place_image"]}" class="card-img-top" alt="${all_places[id]["place_name"]}">
    <div class="card-body">
      <p class="card-text">${all_places[id]["place_longer_desc"]}</p>
    </div>
    <div class="card-body" id="places_to_stay">
      <h5>Places to stay</h5>
      <ul class="list-group">
        <li><a href="https://ecobnb.com/" target="_blank">EcoBnB</a></li>
        <li><a href="https://airbnb.com/" target="_blank">AirBnB</a></li>
        <li><a href="https://booking.com/" target="_blank">Booking.com</a></li>
        <li><a href="https://expedia.com/" target="_blank">Expedia</a></li>
        <li><a href="https://trivago.com/" target="_blank">Trivago</a></li>
      </ul>
    </div>
    <div class="card-body" id="things_to_do">
      <h5>Things to do</h5>
      <a href="https://tripadvisor.com/" target="_blank">Trip Advisor</a>
    </div>
  </div>`
}

function get_travel_details(details){
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
  document.getElementById("travel_details_body").innerHTML  =  details_list;
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
  
  ubound = document.getElementsByClassName("accordion-item").length;
  var id;
  for(var i=hop_id;i<ubound;i++){
    document.getElementById(`accordion_block_${i}`).remove();
    h = hops.getLayers();
    hops.removeLayer(h[h.length -1]._leaflet_id);
    layers = route_lines.getLayers();
    route_lines.removeLayer(layers[layers.length -1]._leaflet_id);
  }
  id = document.getElementById(`accordion_block_${parseInt(document.getElementsByClassName("accordion-item").length) - 1}_place_id`).innerHTML;
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

function open_sidebar_tab(tab){
  sidebar.open(tab);
}

function show_route(route_id){
  //start_again();
  //need to go through each part of the route and add to the map
  //_starterMarkerOnClick(e);
  //_addToTrip(place_id);
}