var places = [];
var map;
var markers;
var start;
var hops = [];
var current_places = {}

function start(){
  //make a map
  map = L.map('map').setView([45, 10], 5);
  const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);
  markers = new L.LayerGroup();
  map.addLayer(markers);

  //get some places to put on the map 
  var url = "/api/start";

  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function() {
  if (this.readyState == 4 && this.status == 200) {
    var arr = JSON.parse(this.responseText);
    for(i = 0; i < arr.length; i++) {
      if(arr[i].place_longer_desc.length > 0){
        var marker = L.marker([arr[i].stop_lat, arr[i].stop_lon]).addTo(map);
        marker.bindTooltip(arr[i].place_name);
        marker.properties = {};
        marker.properties.place_id = arr[i].place_id;
        marker.properties.place_name = arr[i].place_name;
        marker.properties.place_brief_desc = arr[i].place_brief_desc;
        marker.properties.place_longer_desc = decodeURIComponent(arr[i].place_longer_desc);
        marker.properties.place_image = arr[i].place_image;
        marker.properties.place_tags = arr[i].place_tags;
        marker.properties.place_links = arr[i].place_links;
        marker.properties.duration = arr[i].duration;
        marker.properties.place_id_x = arr[i].place_id_x;
        marker.addEventListener('click', _starterMarkerOnClick);
        marker.addTo(markers)
        const popup = L.popup().setLatLng([45, 10]).setContent("choose a starting point then see where you can go!").openOn(map);
        //map.bindTooltip("choose a starting point then see where you can go!")
     }
    }
  }};

  xmlhttp.open("GET", url, true);
  xmlhttp.send();
  
}

function _starterMarkerOnClick(e) {
  var hop = e.sourceTarget.properties;
  document.getElementById("preview").hidden = true
  acc = `
  <div class="accordion-item" id="accordion_block_0"}>
    <h2 class="accordion-header">
      <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#accordion_0" aria-expanded="true" aria-controls="accordion_0">
      Starting at ${hop.place_name}
      </button>
    </h2>
    <span id="accordion_0_place_id" hidden>${hop.place_id}</span>
    <div id="accordion_0" class="accordion-collapse collapse" data-bs-parent="#accordionExample">
      <div class="accordion-body">
        <button type="button" class="btn btn-primary" onclick="start_again()">start again</button>
      </div>
    </div>
  </div>
  `
document.getElementById("accordionExample").insertAdjacentHTML('beforeend', acc)

  //document.getElementById("starter_message").hidden = true
  get_destinations(hop.place_id)
}

function _markerOnClick(e) {
  var hop = e.sourceTarget.properties;
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
}

function _placeOnClick(){
  place_id = document.getElementById("place_id").innerHTML
  document.getElementById("preview").hidden = true
  current_accordion_count = document.getElementsByClassName("accordion-item").length
  new_accordion_count = current_accordion_count++
  acc = `
  <div class="accordion-item" id="accordion_block_${new_accordion_count}">
    <h2 class="accordion-header">
      <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#accordion_${new_accordion_count}" aria-expanded="true" aria-controls="accordion_${new_accordion_count}">
        => ${document.getElementById("place_title").innerHTML}
      </button>
    </h2>
    <span id="accordion_block_${new_accordion_count}_place_id" hidden>${place_id}</span>
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
    document.getElementById(`remove_button_${current_accordion_count}`).innerHTML = "Remove hops from here"
  }
  document.getElementById("accordionExample").insertAdjacentHTML('beforeend', acc)
  get_destinations(document.getElementById("place_id").innerHTML)
}

function get_destinations(id){
  //remove old markers
  markers.clearLayers();
  var xmlhttp = new XMLHttpRequest();
  var url = "/api/destinations/"+id;
  xmlhttp.onreadystatechange = function() {
  if (this.readyState == 4 && this.status == 200) {
    var arr = JSON.parse(this.responseText);
    for(i = 0; i < arr.length; i++) {
      if(arr[i].place_longer_desc.length > 0){
        var marker = L.marker([arr[i].stop_lat, arr[i].stop_lon]).addTo(map);
        marker.bindTooltip(arr[i].place_name).openTooltip();
        marker.properties = {};
        marker.properties.place_id = arr[i].place_id;
        marker.properties.place_name = arr[i].place_name;
        marker.properties.place_brief_desc = arr[i].place_brief_desc;
        marker.properties.place_longer_desc = decodeURIComponent(arr[i].place_longer_desc);
        marker.properties.place_image = arr[i].place_image;
        marker.properties.place_tags = arr[i].place_tags;
        marker.properties.place_links = arr[i].place_links;
        marker.properties.duration = arr[i].duration;
        marker.addEventListener('click', _markerOnClick);
        marker.addTo(markers)
     }
    }
  }};

  xmlhttp.open("GET", url, true);
  xmlhttp.send();
}

function remove_hop(hop_id){
  ubound = document.getElementsByClassName("accordion-item").length
  console.log(`length ${ubound}`)
  for(var i=hop_id;i<ubound;i++){
    console.log(`accordion_block_${i}`)
    document.getElementById(`accordion_block_${i}`).remove()
  }
  //get the id for the last
  id = document.getElementById(`accordion_block_${document.getElementsByClassName("accordion-item").length - 1}_place_id`).innerHTML
  console.log(`get destinations ${id}`)
  get_destinations(id)
}
function start_again(){
  ubound = document.getElementsByClassName("accordion-item").length
  for(var i=0;i<ubound;i++){
    console.log(`accordion_block_${i}`)
    document.getElementById(`accordion_block_${i}`).remove()
  }
    //get some places to put on the map 
    var url = "/api/start";

    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      var arr = JSON.parse(this.responseText);
      for(i = 0; i < arr.length; i++) {
        if(arr[i].place_longer_desc.length > 0){
          var marker = L.marker([arr[i].stop_lat, arr[i].stop_lon]).addTo(map);
          marker.bindTooltip(arr[i].place_name);
          marker.properties = {};
          marker.properties.place_id = arr[i].place_id;
          marker.properties.place_name = arr[i].place_name;
          marker.properties.place_brief_desc = arr[i].place_brief_desc;
          marker.properties.place_longer_desc = decodeURIComponent(arr[i].place_longer_desc);
          marker.properties.place_image = arr[i].place_image;
          marker.properties.place_tags = arr[i].place_tags;
          marker.properties.place_links = arr[i].place_links;
          marker.properties.duration = arr[i].duration;
          marker.properties.place_id_x = arr[i].place_id_x;
          marker.addEventListener('click', _starterMarkerOnClick);
          marker.addTo(markers)
          const popup = L.popup().setLatLng([45, 10]).setContent("choose a starting point then see where you can go!").openOn(map);
          //map.bindTooltip("choose a starting point then see where you can go!")
       }
      }
    }};
  
    xmlhttp.open("GET", url, true);
    xmlhttp.send();
    
}