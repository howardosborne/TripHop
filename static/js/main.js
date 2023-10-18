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
        marker.properties.place_longer_desc = arr[i].place_longer_desc;
        marker.properties.place_image = arr[i].place_image;
        marker.properties.place_tags = arr[i].place_tags;
        marker.properties.place_links = arr[i].place_links;
        marker.addEventListener('click', _markerOnClick);
        marker.addTo(markers)
     }
    }
  }};

  xmlhttp.open("GET", url, true);
  xmlhttp.send();
  
}

function _markerOnClick(e) {
  var hop = e.sourceTarget.properties;
  //currently just adding to list - but need to preview in a card
  document.getElementById("preview").hidden = false
  document.getElementById("place_title").innerHTML = hop.place_name
  document.getElementById("place_image").src = hop.place_image
  document.getElementById("place_image").alt = hop.place_name
  document.getElementById("place_text").innerHTML = hop.place_longer_desc
  document.getElementById("place_id").innerHTML = hop.place_id

}

function _placeOnClick(){
  element = "<li class='list-group-item'>" + document.getElementById("place_title").innerHTML + "</li>"
  document.getElementById("triphops").insertAdjacentHTML('beforeend', element)
  document.getElementById("preview").hidden = true
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
        marker.properties.place_longer_desc = arr[i].place_longer_desc;
        marker.properties.place_image = arr[i].place_image;
        marker.properties.place_tags = arr[i].place_tags;
        marker.properties.place_links = arr[i].place_links;
        marker.addEventListener('click', _markerOnClick);
        marker.addTo(markers)
     }
    }
  }};

  xmlhttp.open("GET", url, true);
  xmlhttp.send();
}
