var map;
//possible starting points initially shown
var possible_start_points;
var start_point;
var possible_hops;
var hops;
var possible_route_line;
var possible_route_lines;
var route_lines;

function start(){
  //make a map
  map = L.map('map').setView([45, 10], 5);
  const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {maxZoom: 19,attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'}).addTo(map);
  //add the various layers to be used
  possible_start_points = new L.LayerGroup();
  map.addLayer(possible_start_points);

  possible_hops = new L.LayerGroup();
  map.addLayer(possible_hops);

  possible_route_lines = new L.LayerGroup();
  map.addLayer(possible_route_lines); 

  hops = new L.LayerGroup();
  map.addLayer(hops);
  
  route_lines = new L.LayerGroup();
  map.addLayer(route_lines);

  //get some places to put on the map 
  var url = "/api/start";

  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function() {
  if (this.readyState == 4 && this.status == 200) {
    var arr = JSON.parse(this.responseText);
    for(i = 0; i < arr.length; i++) {
      if(arr[i].place_longer_desc.length > 0){
        //var marker = L.marker([arr[i].stop_lat, arr[i].stop_lon]).addTo(map);
        var marker = L.circle([arr[i].stop_lat, arr[i].stop_lon], {color: '#FF7933',fillColor: '#FF7933',fillOpacity: 0.5,radius: 10000});
        marker.bindTooltip(arr[i].place_name);
        marker.properties = arr[i];
        marker.addEventListener('click', _starterMarkerOnClick);
        marker.addTo(possible_start_points)
     }
    }
  }};

  xmlhttp.open("GET", url, true);
  xmlhttp.send();
  
}

function _starterMarkerOnClick(e) {
  start_point = L.circle([e.latlng.lat, e.latlng.lng], {color: '#BE33FF',fillColor: '#BE33FF',fillOpacity: 0.5,radius: 10000}).addTo(map);
  start_point.properties = e.sourceTarget.properties;
  //remove potential start points
  possible_start_points.clearLayers();
  document.getElementById("preview").hidden = true;
  acc = `
  <div class="accordion-item" id="accordion_block_0"}>
    <h2 class="accordion-header">
      <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#accordion_0" aria-expanded="true" aria-controls="accordion_0">
      Starting at ${e.sourceTarget.properties.place_name}
      </button>
    </h2>
    <span id="accordion_0_place_id" hidden>${e.sourceTarget.properties.place_id}</span>
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
  document.getElementById("place_id").innerHTML = e.sourceTarget.properties.place_id
  document.getElementById("lat").innerHTML = e.latlng.lat
  document.getElementById("lng").innerHTML = e.latlng.lng
  //document.getElementById("starter_message").hidden = true
  get_destinations(e.sourceTarget.properties.place_id)
}

function _markerOnClick(e) {
  //get the properties of the place marked
  var hop = e.sourceTarget.properties;
  //clear all existing possible route lines
  possible_route_lines.clearLayers();
  //add a possible route line
  //get the points of the last hop 
  lat = document.getElementById(`accordion_${document.getElementsByClassName("accordion-item").length - 1}_lat`).innerHTML
  lng = document.getElementById(`accordion_${document.getElementsByClassName("accordion-item").length - 1}_lng`).innerHTML
  pointA = new L.LatLng(parseFloat(lat), parseFloat(lng));
  pointB = new L.LatLng(e.latlng.lat, e.latlng.lng);
  var pointList = [pointA, pointB];
  possible_route_line = new L.Polyline(pointList, {color: '#1A898C',weight: 3,opacity: 0.5,smoothFactor: 1});
  possible_route_line.addTo(possible_route_lines);

  //fill in the preview and see what the user want to do
  document.getElementById("preview").hidden = false;
  document.getElementById("place_title").innerHTML = hop.place_name;
  document.getElementById("place_image").src = hop.place_image;
  document.getElementById("place_image").alt = hop.place_name;
  document.getElementById("place_text").innerHTML = decodeURIComponent(hop.place_longer_desc);
  duration = parseInt(hop.duration);
  remainder =  duration % 60
  str_remainder = remainder.toString()
  console.log(str_remainder.padStart(2, '0'));
  hours = (duration - remainder) / 60
  formatted_duration = hours.toString() + ":" + str_remainder.padStart(2, '0') 
  document.getElementById("journey_details").innerHTML = "avg trip time: " + formatted_duration
  document.getElementById("place_id").innerHTML = hop.place_id
  document.getElementById("lat").innerHTML = e.latlng.lat
  document.getElementById("lng").innerHTML = e.latlng.lng
}

function _addToTrip(){
  //they've chose to add the previewed place

  //hide the preview window
  document.getElementById("preview").hidden = true;

  //add to the trip list accordion
  current_accordion_count = document.getElementsByClassName("accordion-item").length;
  new_accordion_count = current_accordion_count++;
  acc = `
  <div class="accordion-item" id="accordion_block_${new_accordion_count}">
    <h2 class="accordion-header">
      <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#accordion_${new_accordion_count}" aria-expanded="true" aria-controls="accordion_${new_accordion_count}">
        => ${document.getElementById("place_title").innerHTML}
      </button>
    </h2>
    <span id="accordion_block_${new_accordion_count}_place_id" hidden>${document.getElementById("place_id").innerHTML}</span>
    <span id="accordion_${new_accordion_count}_lat" hidden>${document.getElementById("lat").innerHTML}</span>
    <span id="accordion_${new_accordion_count}_lng" hidden>${document.getElementById("lng").innerHTML}</span>
    <div id="accordion_${new_accordion_count}" class="accordion-collapse collapse" data-bs-parent="#accordionExample">
      <div class="accordion-body">
        <strong>Travel to ${document.getElementById("place_title").innerHTML}</strong>
        <p>${document.getElementById("journey_details").innerHTML}</p>
        <button type="button" class="btn btn-secondary">buy ticket</button>
        <button type="button" class="btn btn-secondary">look at hotels</button>
        <button type="button" class="btn btn-primary" id="remove_button_${new_accordion_count}" onclick="remove_hop('${new_accordion_count}')">remove hop</button>
      </div>
    </div>
  </div>`
  if(document.getElementById(`remove_button_${current_accordion_count}`)){
    document.getElementById(`remove_button_${current_accordion_count}`).innerHTML = "Remove hops from here";
  }
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
  
  var marker = L.circle([parseFloat(lat_b), parseFloat(lng_b)], {color: '#FF7933',fillColor: '#FF7933',fillOpacity: 0.5,radius: 10000});
  marker.bindTooltip(document.getElementById("place_title").innerHTML);
  marker.addTo(hops);

  //clear the possible hops
  possible_hops.clearLayers();
  //clear the possible route lines
  possible_route_lines.clearLayers();

  get_destinations(document.getElementById("place_id").innerHTML);
}

function get_destinations(id){
  var xmlhttp = new XMLHttpRequest();
  var url = "/api/destinations/"+id;
  xmlhttp.onreadystatechange = function() {
  if (this.readyState == 4 && this.status == 200) {
    var arr = JSON.parse(this.responseText);
    for(i = 0; i < arr.length; i++) {
      if(arr[i].place_longer_desc.length > 0){
        var marker = L.circle([arr[i].stop_lat, arr[i].stop_lon], {color: '#FF7933',fillColor: '#FF7933',fillOpacity: 0.5,radius: 10000});
        marker.bindTooltip(arr[i].place_name);
        marker.properties = arr[i];
        marker.addEventListener('click', _markerOnClick);
        marker.addTo(possible_hops)
     }
    }
  }};

  xmlhttp.open("GET", url, true);
  xmlhttp.send();
}

function remove_hop(hop_id){
  ubound = document.getElementsByClassName("accordion-item").length

  var id;
  for(var i=hop_id;i<ubound;i++){
    document.getElementById(`accordion_block_${i}`).remove();
    h = hops.getLayers()
    hops.removeLayer(h[h.length -1]._leaflet_id)

    layers = route_lines.getLayers()
    route_lines.removeLayer(layers[layers.length -1]._leaflet_id)
    
  }
  id = document.getElementById(  `accordion_block_${parseInt(document.getElementsByClassName("accordion-item").length) - 1}_place_id`).innerHTML
  console.log(`id ${id}`)
  get_destinations(id)
}

function start_again(){
  ubound = document.getElementsByClassName("accordion-item").length
  for(var i=0;i<ubound;i++){
    console.log(`accordion_block_${i}`)
    document.getElementById(`accordion_block_${i}`).remove();
    hops.clearLayers();
    route_lines.clearLayers();
  }
  //get some places to put on the map 
  var url = "/api/start";

  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function() {
  if (this.readyState == 4 && this.status == 200) {
    var arr = JSON.parse(this.responseText);
    for(i = 0; i < arr.length; i++) {
      if(arr[i].place_longer_desc.length > 0){
        //var marker = L.marker([arr[i].stop_lat, arr[i].stop_lon]).addTo(map);
        var marker = L.circle([arr[i].stop_lat, arr[i].stop_lon], {color: '#FF7933',fillColor: '#FF7933',fillOpacity: 0.5,radius: 10000});
        marker.bindTooltip(arr[i].place_name);
        marker.properties = arr[i];
        marker.addEventListener('click', _starterMarkerOnClick);
        marker.addTo(possible_start_points)
     }
    }
  }};

  xmlhttp.open("GET", url, true);
  xmlhttp.send();

}