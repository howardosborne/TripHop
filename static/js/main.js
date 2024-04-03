var map;
var sidePanel;
var popup;

var dbServer = "v5.db.transport.rest";

var startSelect;
var destinationSelect;

//lookups for info about all places, hops and inspired trips
var all_places = {};
var all_hops = {};
var inspiredTrips;
var agencyLookup;
var journeyLookup;
var trips = {};
var stopsPlacesLookup = {};
var stopsForPlaces = {};
//saving settings when moving between tabs
var lastScrollTop = {};
var lastTab = "tab-home";

//freestyle layers
var freestyleStartPoints;
var possibleHops;
var candidateHop;
var hops;
var routeLines;

//inspire layers
var possibleInspiredTrip;
var possibleInspiredTripRouteLines;

//fromTo layers
var possibleFromToStartPoints;
var possibleFromToEndPoints;
var fromToStartPoint;
var fromToDestination;
var fromToLines;

//live departures layers
var liveRouteLines;
var liveStops;
//var liveStop;

function startUp(){
  //make a map
  map = L.map('map').setView([45, 10], 5);
  const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {maxZoom: 19,attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'}).addTo(map);

  L.control.scale({position: 'topleft'}).addTo(map);
  L.control.zoom({position: 'bottomright'}).addTo(map);

  sidePanel = L.control.sidepanel('mySidepanelLeft', {
    tabsPosition: 'top',
    startTab: 'tab-home'
  }).addTo(map);

  //add the freestyle layers to be used
  freestyleStartPoints = L.markerClusterGroup({maxClusterRadius:40});
  possibleHops = L.markerClusterGroup({maxClusterRadius:40});
  hops = new L.LayerGroup();
  routeLines = new L.LayerGroup();
  possibleFromToStartPoints = L.markerClusterGroup({maxClusterRadius:40});
  possibleFromToEndPoints = L.markerClusterGroup({maxClusterRadius:40});
  fromToStartPoint = new L.LayerGroup();
  fromToDestination = new L.LayerGroup();
  fromToLines = new L.LayerGroup();
  possibleInspiredTrip = new L.LayerGroup();
  possibleInspiredTripRouteLines = new L.LayerGroup();
  liveStops = L.markerClusterGroup({maxClusterRadius:40});
  //liveStop = new L.LayerGroup();
  liveRouteLines = new L.LayerGroup();

  L.easyButton('<img src="./static/icons/resize.png">', function(btn, map){
    map.fitBounds(possibleHops.getBounds())
  }).addTo(map);

  getAllPlaces();
  getAgencyLookup();
  getInspiredTrips();
  showHomeTab();
}

function getAllPlaces(){
  var url = "./static/places.json";
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function() {
  if (this.readyState == 4 && this.status == 200) {
    all_places = JSON.parse(this.responseText);
    getStopsForPlaces();
  }};
  xmlhttp.open("GET", url, true);
  xmlhttp.send(); 
}

function getStopsForPlaces(){
  var url = "./static/stops_for_places.json";
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function() {
  if (this.readyState == 4 && this.status == 200) {
    stopsForPlaces = JSON.parse(this.responseText);
    getAllHopsandShowPlaceMarkers();
  }};
  xmlhttp.open("GET", url, true);
  xmlhttp.send(); 
}

function getAllHopsandShowPlaceMarkers(){
  var xmlhttp = new XMLHttpRequest();
  var url = `./static/hops.json`;
  xmlhttp.onreadystatechange = function() {
  if (this.readyState == 4 && this.status == 200) {
    var response = JSON.parse(this.responseText);
    all_hops = response;
    //now we have a set of hops we can show the start points
    addFreestyleStartPoints();
    //and destination stuff
    setupFromToOptions();
    //and live markers
    //addLiveStartPoints();
    addLiveStops();
  }};
  xmlhttp.open("GET", url, true);
  xmlhttp.send(); 
}

function addFreestyleStartPoints(){
    Object.entries(all_places).forEach((entry) => {
      const [id, place] = entry;
      if(id in all_hops){
        let my_icon = L.icon({iconUrl: `./static/icons/home.png`,iconSize: [36, 36], iconAnchor: [18,36]});
        let marker = L.marker([place.place_lat, place.place_lon],{icon:my_icon});
        marker.bindTooltip(decodeURI(place.place_name));
        marker.properties = place;
        marker.addEventListener('click', _starterMarkerOnClick);
        marker.addTo(freestyleStartPoints);
      }
    });
}

function setupFromToOptions(){
  placeSelect = {};
    Object.entries(all_places).forEach((entry) => {
      const [id, place] = entry;
      //if(id in all_hops){
      if(stopsForPlaces[id].length > 0){
        if(place.place_country in placeSelect){placeSelect[place.place_country].push(place);}
        else{placeSelect[place.place_country] = [place];} 
      }
    });
    let selectOption = {};
    let selectData = {"data":[]};
    Object.entries(placeSelect).forEach((entry) => {
      const [id, country] = entry;
      let selectOptGroup = {"label": id, "options" : []};
      selectOption += `<optgroup label="${id}">`;
      for(let i=0;i<country.length;i++){
        selectOptGroup.options.push({"value": country[i].place_id,"text": country[i].place_name});
        selectOption += `<option value="${country[i].place_id}">${country[i].place_name}</option>`;
      }
      selectOption += "</optgroup>";
      selectData.data.push(selectOptGroup);
    });
    destinationSelect = new SlimSelect({
      select: '#destinationSelect',
      data: selectData.data
    })
    startSelect = new SlimSelect({
      select: '#startSelect',
      data: selectData.data
    })    
    startSelect.setSelected("uk_1");
    destinationSelect.setSelected("spain_1");
    //document.getElementById("destinationSelect").innerHTML = selectOption;
    //document.getElementById("destinationSelect").value = "spain_1";
    //document.getElementById("startSelect").innerHTML = selectOption;   
    //document.getElementById("startSelect").value = "uk_1";
    addPossibleFromToStartPoints();
    addDestinationMarkers();
}

function addPossibleFromToStartPoints(){
    Object.entries(all_places).forEach((entry) => {
      const [id, place] = entry;
      if(stopsForPlaces[id].length > 0){
        let my_icon = L.icon({iconUrl: `./static/icons/home.png`,iconSize: [36, 36], iconAnchor: [18,36]});
        let marker = L.marker([place.place_lat, place.place_lon],{icon:my_icon});
        marker.bindTooltip(decodeURI(place.place_name));
        marker.properties = place;
        marker.addEventListener('click', _fromMarkerOnClick);
        marker.addTo(possibleFromToStartPoints)
      }
    });
}

function addDestinationMarkers(){
    Object.entries(all_places).forEach((entry) => {
      const [id, place] = entry;
      if(stopsForPlaces[id].length > 0){
        let my_icon = L.icon({iconUrl: `./static/icons/destination.png`,iconSize: [36, 36], iconAnchor: [18,36]});
        let marker = L.marker([place.place_lat, place.place_lon],{icon:my_icon});
        marker.bindTooltip(decodeURI(place.place_name));
        marker.properties = place;
        marker.addEventListener('click', _destinationMarkerOnClick);
        marker.addTo(possibleFromToEndPoints)
      }
    });
}

function showPossibleFromToStartPoints(){
  if(map.hasLayer(possibleFromToEndPoints)){map.removeLayer(possibleFromToEndPoints)}
  if(!map.hasLayer(possibleFromToStartPoints)){map.addLayer(possibleFromToStartPoints)}  
}

function showPossibleFromToEndPoints(){
  if(map.hasLayer(possibleFromToStartPoints)){map.removeLayer(possibleFromToStartPoints)}
  if(!map.hasLayer(possibleFromToEndPoints)){map.addLayer(possibleFromToEndPoints)}  
}

function addLiveStartPoints(){
  Object.entries(all_places).forEach((entry) => {
      const [id, place] = entry;
      let my_icon = L.icon({iconUrl: `./static/icons/departure_board.png`,iconSize: [24, 24], iconAnchor: [12,24]});
      let marker = L.marker([place.place_lat, place.place_lon],{icon:my_icon});
      marker.bindTooltip(decodeURI(place.place_name));
      marker.properties = place;
      marker.addEventListener('click', _showLiveOnClick);
      marker.addTo(liveStops);
    });
}

function addLiveStops(){
  var xmlhttp = new XMLHttpRequest();
  var url = `./static/stops.json`;
  xmlhttp.onreadystatechange = function() {
  if (this.readyState == 4 && this.status == 200) {
    var response = JSON.parse(this.responseText);
    let all_stops = response;
    Object.entries(all_stops).forEach((entry) => {
      const [id, stop] = entry;
      let my_icon = L.icon({iconUrl: `./static/icons/departure_board.png`,iconSize: [24, 24], iconAnchor: [12,24]});
      let marker = L.marker([stop.location.latitude, stop.location.longitude],{icon:my_icon});
      marker.bindTooltip(decodeURI(stop.name));
      marker.properties = stop;
      marker.addEventListener('click', _showLiveStopsOnClick);
      marker.addTo(liveStops);
    });
  }};
  xmlhttp.open("GET", url, true);
  xmlhttp.send(); 
}

function hideSidepanal() {
  var sp = document.getElementById("mySidepanelLeft");
  if (sp.classList.contains("opened")) {
    sp.classList.remove("opened")
    sp.classList.add("closed")
  } else {
    sp.classList.add("closed")
  }
}

function showSidepanelTab(tabName) {
  //open sidepanel
  var sp = document.getElementById("mySidepanelLeft");
  if (sp.classList.contains("closed")) {
    sp.classList.remove("closed");
    sp.classList.add("opened");
  }
  else {
    sp.classList.add("opened")
  }
  //make the tab active
  var spc = document.getElementsByClassName("sidebar-tab-link");
  for(var i=0;i<spc.length;i++){
    if (spc[i].classList.contains("active")) {
      spc[i].classList.remove("active")
    }
  }
  for(var i=0;i<spc.length;i++){
    if (spc[i].attributes["data-tab-link"].value==tabName){
      if (!spc[i].classList.contains("active")) {
        spc[i].classList.add("active")
      }
    }  
  }
   //make the tab active
   var spc = document.getElementsByClassName("sidepanel-tab-content");
   for(var i=0;i<spc.length;i++){
     if (spc[i].classList.contains("active")) {
      //save the last scroll top
      lastScrollTop[spc[i].attributes['data-tab-content'].value] = document.getElementsByClassName("sidepanel-content-wrapper")[0].scrollTop;
      if (!["tab-travel-details","tab-place"].includes(spc[i].attributes['data-tab-content'].value)){
        lastTab = spc[i].attributes['data-tab-content'].value;
      }
      spc[i].classList.remove("active");
     }
   }
   for(var i=0;i<spc.length;i++){
     if (spc[i].attributes["data-tab-content"].value==tabName){
       if (!spc[i].classList.contains("active")) {
         spc[i].classList.add("active");
         if(tabName in lastScrollTop){
          document.getElementsByClassName("sidepanel-content-wrapper")[0].scrollTop = lastScrollTop[tabName];
         }
         else{
          document.getElementsByClassName("sidepanel-content-wrapper")[0].scrollTop = 0;
         }
       }
     }  
   } 
}

function getAgencyLookup(){
  var xmlhttp = new XMLHttpRequest();
  var url = `./static/agency_lookup.json`;
  xmlhttp.onreadystatechange = function() {
  if (this.readyState == 4 && this.status == 200) {
    var response = JSON.parse(this.responseText);
    agencyLookup = response;
    //now we have a set of hops we can show the start points
  }};

  xmlhttp.open("GET", url, true);
  xmlhttp.send();

}

function getInspiredTrips(){
  var xmlhttp = new XMLHttpRequest();
  var url = `./static/trips.json`;
  xmlhttp.onreadystatechange = function() {
  if (this.readyState == 4 && this.status == 200) {
    var response = JSON.parse(this.responseText);
    inspiredTrips = response;
    Object.entries(inspiredTrips).forEach((entry) => {
      const [id, trip] = entry;
      var element = `
      <div class="col">
      <div class="card">
        <img src="${trip["trip_image"]}" class="card-img-top" alt="...">
        <div class="card-img-overlay">
          <a href="#" class="triptitle" onclick="showInspiredRoute('${id}')">${trip.trip_title}</a>
        </div>
        <div class="card-body">
          <p class="card-text">${trip.trip_description}</p>
        </div>
      </div>
      </div>
      `
      document.getElementById("inspireBody").insertAdjacentHTML('beforeend', element);
    });
  }};

  xmlhttp.open("GET", url, true);
  xmlhttp.send();
}

function zoomToPlace(id){
  place = all_places[id];
  map.flyTo([place.place_lat, place.place_lon]);
}

function showTripParts(id){
  document.getElementById(`inspireDetailsBody`).innerHTML = "";
  document.getElementById(`inspireTitle`).innerHTML = inspiredTrips[id].trip_title;
  var trip_hops = inspiredTrips[id]["hops"];
  for(var i=0;i<trip_hops.length;i++){
    place = all_places[trip_hops[i]["place_id"]];
    var element = `
    <div class="card mb-3">
      <img src="${trip_hops[i]["hop_image"]}" class="img-fluid rounded-start" alt="..." title="${trip_hops[i]["hop_image_attribution"]}">
      <div class="card-text">
      <!--<h4 style="font-family: 'Cantora One', Arial; font-weight: 700; vertical-align: baseline; color:#ff6600ff">${place["place_name"]}</h4>-->
      <a href="#" class="h3" style="font-family: 'Cantora One', Arial; font-weight: 700; vertical-align: baseline; color:#ff6600ff";" onclick="openPlaceDetails('${place["place_id"]}')">${place["place_name"]}</a>
      <p class="card-text">${trip_hops[i]["hop_description"]}</p>
      <a target="_blank" href="${trip_hops[i]["link"]}">${trip_hops[i]["link_text"]}</a>
      </div>
    </div>`
    document.getElementById(`inspireDetailsBody`).insertAdjacentHTML('beforeend', element);
  }
  showSidepanelTab('tab-inspire-details');
}

function showHomeTab(){
  if(popup){popup.close();}
  map.setView([45, 10], 5);
  if(map.hasLayer(possibleFromToStartPoints)){map.removeLayer(possibleFromToStartPoints);}
  if(map.hasLayer(possibleFromToEndPoints)){map.removeLayer(possibleFromToEndPoints);}
  if(map.hasLayer(fromToStartPoint)){map.removeLayer(fromToStartPoint);}
  if(map.hasLayer(fromToDestination)){map.removeLayer(fromToDestination);}
  if(map.hasLayer(fromToLines)){map.removeLayer(fromToLines);}

  if(map.hasLayer(possibleInspiredTrip)){map.removeLayer(possibleInspiredTrip);}
  if(map.hasLayer(possibleInspiredTripRouteLines)){map.removeLayer(possibleInspiredTripRouteLines);}

  //if(map.hasLayer(liveStop)){map.removeLayer(liveStop);}
  if(map.hasLayer(liveStops)){map.removeLayer(liveStops);}
  if(map.hasLayer(liveRouteLines)){map.removeLayer(liveRouteLines);}

  if(hops.getLayers().length > 0){ 
    buildSummary();
    if(map.hasLayer(freestyleStartPoints)){map.removeLayer(freestyleStartPoints);}

    if(!map.hasLayer(possibleHops)){map.addLayer(possibleHops);}
    if(!map.hasLayer(hops)){map.addLayer(hops);}
    if(!map.hasLayer(routeLines)){map.addLayer(routeLines);}
    document.getElementById("homeWelcome").hidden=true;
    document.getElementById("freestyleBody").hidden=false;
  }
   else{ 
    if(!map.hasLayer(freestyleStartPoints)){map.addLayer(freestyleStartPoints);}
    if(map.hasLayer(possibleHops)){map.removeLayer(possibleHops);}
    if(map.hasLayer(hops)){map.removeLayer(hops);}
    if(map.hasLayer(routeLines)){map.removeLayer(routeLines);}
    document.getElementById("homeWelcome").hidden=false;
    document.getElementById("freestyleBody").hidden=true;
  }
  if(localStorage.getItem("trips")){
    document.getElementById("savedTripDiv").hidden=false;
    showSavedTrips();
  }
  else{
    document.getElementById("savedTripDiv").hidden=true;
  }
  showSidepanelTab('tab-home');
}

function showInspireTab(){
  if(popup){popup.close();}
  map.setView([45, 10], 5);
  if(map.hasLayer(possibleFromToStartPoints)){map.removeLayer(possibleFromToStartPoints);}
  if(map.hasLayer(possibleFromToEndPoints)){map.removeLayer(possibleFromToEndPoints);}
  if(map.hasLayer(fromToStartPoint)){map.removeLayer(fromToStartPoint);}
  if(map.hasLayer(fromToDestination)){map.removeLayer(fromToDestination);}
  if(map.hasLayer(fromToLines)){map.removeLayer(fromToLines);}

  //if(map.hasLayer(liveStop)){map.removeLayer(liveStop);}
  if(map.hasLayer(liveStops)){map.removeLayer(liveStops);}
  if(map.hasLayer(liveRouteLines)){map.removeLayer(liveRouteLines);}

  if(map.hasLayer(freestyleStartPoints)){map.removeLayer(freestyleStartPoints);}
  if(map.hasLayer(possibleHops)){map.removeLayer(possibleHops);}
  if(map.hasLayer(hops)){map.removeLayer(hops);}
  if(map.hasLayer(routeLines)){map.removeLayer(routeLines);}

  if(!map.hasLayer(possibleInspiredTrip)){map.addLayer(possibleInspiredTrip);}
  if(!map.hasLayer(possibleInspiredTripRouteLines)){map.addLayer(possibleInspiredTripRouteLines);}
  //to avoid worry about loosing a trip
  if(possibleInspiredTrip.getLayers().length == 0 && hops.getLayers().length > 0){
    //show tooltip for frog
    popup_text = `
    <div>
    <div class="card-body">Wondering where your existing trip has gone?
    <br>Just click on the frog at any time to hop back.
    </div>
   </div>`
    popup = L.popup().setLatLng([45,10]).setContent(popup_text).openOn(map); 

    //toastLiveExample = document.getElementById("liveToast");
    //const toastBootstrap = bootstrap.Toast.getOrCreateInstance(toastLiveExample);
    //toastBootstrap.show();
  }
  showSidepanelTab('tab-inspire');
}

function showDestinationTab(){
  if(popup){popup.close();}
  map.setView([45, 10], 5);
  if(fromToLines.getLayers().length == 0){
    if(!map.hasLayer(possibleFromToStartPoints)){map.addLayer(possibleFromToStartPoints);}
  }
  else{
    if(!map.hasLayer(fromToStartPoint)){map.addLayer(fromToStartPoint);}
    if(!map.hasLayer(fromToDestination)){map.addLayer(fromToDestination);}
    if(!map.hasLayer(fromToLines)){map.addLayer(fromToLines);}  
  }

  //if(map.hasLayer(liveStop)){map.removeLayer(liveStop);}
  if(map.hasLayer(liveStops)){map.removeLayer(liveStops);}
  if(map.hasLayer(liveRouteLines)){map.removeLayer(liveRouteLines);}

  if(map.hasLayer(freestyleStartPoints)){map.removeLayer(freestyleStartPoints);}
  if(map.hasLayer(possibleHops)){map.removeLayer(possibleHops);}
  if(map.hasLayer(hops)){map.removeLayer(hops);}
  if(map.hasLayer(routeLines)){map.removeLayer(routeLines);}

  if(map.hasLayer(possibleInspiredTrip)){map.removeLayer(possibleInspiredTrip);}
  if(map.hasLayer(possibleInspiredTripRouteLines)){map.removeLayer(possibleInspiredTripRouteLines);}
  showSidepanelTab('tab-destination');
}

function showLiveTab(){
  if(popup){popup.close();}
  map.setView([45, 10], 5);
  if(map.hasLayer(possibleFromToStartPoints)){map.removeLayer(possibleFromToStartPoints);}
  if(map.hasLayer(possibleFromToEndPoints)){map.removeLayer(possibleFromToEndPoints);}
  if(map.hasLayer(fromToStartPoint)){map.removeLayer(fromToStartPoint);}
  if(map.hasLayer(fromToDestination)){map.removeLayer(fromToDestination);}
  if(map.hasLayer(fromToLines)){map.removeLayer(fromToLines);}

  if(!map.hasLayer(liveRouteLines)){map.addLayer(liveRouteLines);}  
  if(!map.hasLayer(liveStops)){map.addLayer(liveStops);}

  if(map.hasLayer(freestyleStartPoints)){map.removeLayer(freestyleStartPoints);}
  if(map.hasLayer(possibleHops)){map.removeLayer(possibleHops);}
  if(map.hasLayer(hops)){map.removeLayer(hops);}
  if(map.hasLayer(routeLines)){map.removeLayer(routeLines);}

  if(map.hasLayer(possibleInspiredTrip)){map.removeLayer(possibleInspiredTrip);}
  if(map.hasLayer(possibleInspiredTripRouteLines)){map.removeLayer(possibleInspiredTripRouteLines);}

  showSidepanelTab('tab-live-departures');
}

function _starterMarkerOnClick(e) {
  hops.clearLayers();
  routeLines.clearLayers();
  var my_icon = L.icon({iconUrl: `./static/icons/home.png`,iconSize: [36, 36], iconAnchor: [18,36]});
  var marker = L.marker([e.latlng.lat, e.latlng.lng],{icon:my_icon});
  marker.properties = e.sourceTarget.properties;
  marker.properties.hop_count = 1;
  marker.bindTooltip(marker.properties.place_name);
  marker.addTo(hops);
  getHops(e.sourceTarget.properties.place_id);
  showHomeTab();
  map.flyTo([e.latlng.lat, e.latlng.lng], 5);
}

function _markerOnClick(e) {
  //get the properties of the place marked
  candidateHop = e.sourceTarget.properties;
  place = all_places[candidateHop.place_id];

  var place_block = get_place_details_block(candidateHop.place_id);
  document.getElementById("place_body").innerHTML = place_block;
  // unpack the travel details
  var block = get_travel_details_block(candidateHop.details);
  document.getElementById("travel_details_body").innerHTML = `<h5 style="font-family: 'Cantora One', Arial; font-weight: 700; vertical-align: baseline; color:#ff6600ff">Journey to ${place.place_name}</h5>${block}`;

  popup_text = `
    <div class="card mb-3">
     <img src="${place.place_image}" class="img-fluid rounded-start" style="max-height:250px" alt="..." title = "${place.image_attribution}">
     <div class="card-img-overlay">
       <div class="row justify-content-evenly"><div class="col"><a href="#" class="h3" style="font-family: 'Cantora One', Arial; font-weight: 700; vertical-align: baseline; color:white; text-shadow:-1px 1px 0 #000, 1px 1px 0 #000; " onclick="openPlaceDetails('${place.place_id}')">${place.place_name}</a></div><div class="col-3"><button type="button" class="btn btn-success btn-sm" onclick="_addToTrip()">Add</button></div></div>
     </div>
     <ul class="list-group list-group-flush">
      <li class="list-group-item">${decodeURIComponent(place.place_brief_desc)} <a href="#" onclick="showSidepanelTab('tab-place')"> more...</a></li>
      <li class="list-group-item">Journey times from: ${format_duration(candidateHop.duration_min)} <a href="#" onclick="showSidepanelTab('tab-travel-details')"> more...</a></li>
     </ul>
    </div>`
//openPlaceDetails();
popup = L.popup().setLatLng([e.latlng.lat,e.latlng.lng]).setContent(popup_text).openOn(map); 
}

function _addToTrip(){
  //they've chose to add the previewed place
  if(popup){popup.close();}
  hops_items = hops.getLayers();
  var last_hop;
  last_hop = all_places[hops_items[hops_items.length-1].properties.place_id];
  pointA = new L.LatLng(parseFloat(last_hop.place_lat), parseFloat(last_hop.place_lon));
  pointB = new L.LatLng(parseFloat(candidateHop.place_lat), parseFloat(candidateHop.place_lon));
  var pointList = [pointA, pointB];
  new_line = new L.Polyline(pointList, {color: '#ff6600ff',weight: 3,opacity: 0.5,smoothFactor: 1});
  new_line.addTo(routeLines);

  //add to the hops layer
  var my_icon = L.icon({iconUrl: `./static/icons/triphop.png`,iconSize: [24, 24], iconAnchor: [12,24]});
  var marker = L.marker([parseFloat(candidateHop.place_lat), parseFloat(candidateHop.place_lon)],{icon:my_icon});
  //add property for its count
  hop = all_places[candidateHop.place_id];
  marker.properties = hop;
  marker.properties.from_place_id = last_hop.place_id;
  marker.properties.hop_count = hops_items.length + 1;
  marker.bindTooltip(hop.place_name);
  marker.addEventListener('click', _hopOnClick);
  marker.addTo(hops);
  getHops(candidateHop.place_id);
  buildSummary();
}

function _hopOnClick(e) {
  var hop = e.sourceTarget.properties;
  place = all_places[hop.place_id];
  var place_block = get_place_details_block(place.place_id);
  document.getElementById("place_body").innerHTML = place_block;
  var travel_details = get_travel_details(hop.from_place_id,hop.place_id)
  var block = get_travel_details_block(travel_details.details);
  document.getElementById("travel_details_body").innerHTML = `<h5 style="font-family: 'Cantora One', Arial; font-weight: 700; vertical-align: baseline; color:#ff6600ff">Journey to ${place.place_name}</h5>${block}`;

  popup_text = `
  <div class="card mb-3">
  <img src="${place.place_image}" class="img-fluid rounded-start" alt="..." title = "${place.image_attribution}">
  <div class="card-img-overlay">
    <div class="row justify-content-evenly"><div class="col"><a href="#" class="h3" style="font-family: 'Cantora One', Arial; font-weight: 700; vertical-align: baseline; color:white; text-shadow:-1px 1px 0 #000, 1px 1px 0 #000; " onclick="openPlaceDetails('${place.place_id}')">${place.place_name}</a></div><div class="col-4"></div></div>
  </div>
  <ul class="list-group list-group-flush">
   <li class="list-group-item">${decodeURIComponent(place.place_brief_desc)} <a href="#" onclick="showSidepanelTab('tab-place')"> more...</a></li>
   <li class="list-group-item">Journey times from: ${format_duration(travel_details.duration_min)} <a href="#" onclick="showSidepanelTab('tab-travel-details')"> more...</a></li>
  </ul>
 </div>
  `
  //openPlaceDetails();
  popup = L.popup().setLatLng([e.latlng.lat,e.latlng.lng]).setContent(popup_text).openOn(map); 
}

function _inspireHopOnClick(e) {
  var hop = e.sourceTarget.properties;
  place = all_places[hop.place_id];
  var place_block = get_place_details_block(place.place_id);
  document.getElementById("place_body").innerHTML = place_block;
  var travel_details = get_travel_details(hop.from_place_id,hop.place_id)
  var block = get_travel_details_block(travel_details.details);
  document.getElementById("travel_details_body").innerHTML = `<h5 style="font-family: 'Cantora One', Arial; font-weight: 700; vertical-align: baseline; color:#ff6600ff">Journey to ${place.place_name}</h5>${block}`;

  //check if last element
  if(hop.next_hop_index == possibleInspiredTrip.getLayers().length){
    var button = `<button class="btn btn-success btn-sm" onclick="customise('${hop.trip_id}')">Add hop</button>`;
  }
  else{
    var button = `<button class="btn btn-success btn-sm" onclick="showInspiredHop(${hop.next_hop_index})">Next</button>`
  }

  popup_text = `

  <div class="card mb-3">
  <img src="${hop.hop_image}" class="img-fluid rounded-start" style="max-height:250px" alt="..." title = "${hop.hop_image_attribution}">
  <div class="card-img-overlay">
    <div class="row justify-content-evenly"><div class="col"><a href="#" class="h3" style="font-family: 'Cantora One', Arial; font-weight: 700; vertical-align: baseline; color:white; text-shadow:-1px 1px 0 #000, 1px 1px 0 #000; " onclick="openPlaceDetails('${place.place_id}')">${place.place_name}</a></div><div class="col-4">${button}</div></div>
  </div>
  <ul class="list-group list-group-flush">
   <li class="list-group-item">${hop.hop_description} <a href="#" onclick="showSidepanelTab('tab-place')"> more...</a></li>
   <li class="list-group-item">Journey times from: ${format_duration(travel_details.duration_min)} <a href="#" onclick="showSidepanelTab('tab-travel-details')"> more...</a></li>
  </ul>
 </div>
  `

  popup = L.popup().setLatLng([place.place_lat,place.place_lon]).setContent(popup_text).openOn(map); 
}

function _startInspireHopOnClick(e) {
  var hop = e.sourceTarget.properties;
  var button = `<button class="btn btn-success btn-sm" onclick="showInspiredHop(${hop.next_hop_index})">Next</button>`
  place = all_places[hop.place_id];
  var place_block = get_place_details_block(place.place_id);
  document.getElementById("place_body").innerHTML = place_block;

  popup_text = `
  <div class="card mb-3">
  <img src="${hop.hop_image}" class="img-fluid rounded-start" style="max-height:250px" alt="..." title = "${hop.hop_image_attribution}">
  <div class="card-img-overlay">
    <div class="row justify-content-evenly"><div class="col"><a href="#" class="h3" style="font-family: 'Cantora One', Arial; font-weight: 700; vertical-align: baseline; color:white; text-shadow:-1px 1px 0 #000, 1px 1px 0 #000; " onclick="openPlaceDetails('${place.place_id}')">${place.place_name}</a></div><div class="col-4">${button}</div></div>
  </div>
  <ul class="list-group list-group-flush">
   <li class="list-group-item">${hop.hop_description}</li>
  </ul>
 </div>
    `

  popup = L.popup().setLatLng([place.place_lat,place.place_lon]).setContent(popup_text).openOn(map); 
}

function showInspiredHop(index){
  var hop = possibleInspiredTrip.getLayers()[index];
  //zoomToPlace(hop.properties.place_id);
  hop.fireEvent('click');
}

function get_place_details_block(id){
  //could use this to get an image where there isn't a local one
  //https://script.google.com/macros/s/AKfycbzQGQORse3FHygan8KZG61Ov-WM1SD3-J3J6Yqjzo6IYTJKvSq5H6QBtTN25_aFhiZq/exec?name=
  var block = `<h3 class="offcanvas-title" style="font-family: 'Cantora One', Arial; font-weight: 700; vertical-align: baseline; color:#ff6600ff">${all_places[id]["place_name"]}</h3>
  <div class="card">
    <img src="${all_places[id]["place_image"]}" class="card-img-top" alt="${all_places[id]["place_name"]}" title="all_places[id]["image_attribution"]">
    <div class="card-body">
      <p class="card-text">${all_places[id]["place_longer_desc"]}</p>
	  <a href="${all_places[id]["place_links"]}" target="_blank" class="link-dark link-offset-2 link-underline-opacity-25 link-underline-opacity-100-hover">more info</a>
    </div>
    <div class="accordion accordion-flush" id="accordionPlaceDetails">
      <div class="accordion-item">
        <h2 class="accordion-header">
          <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#flush-collapseOne" aria-expanded="false" aria-controls="flush-collapseOne">
            Things to do
          </button>
        </h2>
        <div id="flush-collapseOne" class="accordion-collapse collapse" data-bs-parent="#accordionFlushExample">
          <div class="accordion-body">
		  <p class="card-text">If you'd like to see what there is to see and do, here are some sites with ideas.</p>
          <ul class="list-group list-group-flush">
          <li class="list-group-item"><a class="link-dark link-offset-2 link-underline-opacity-25 link-underline-opacity-100-hover" href="https://tripadvisor.tp.st/iaDPCVsJ" target="_blank">TripAdvisor</a></li>
          <li class="list-group-item"><a class="link-dark link-offset-2 link-underline-opacity-25 link-underline-opacity-100-hover" href="https://viator.tp.st/dxbdWqWw" target="_blank">Viator</a></li>
          <li class="list-group-item"><a class="link-dark link-offset-2 link-underline-opacity-25 link-underline-opacity-100-hover" href="https://getyourguide.tp.st/j1O2V9WC" target="_blank">GetYourGuide</a></li>
          <li class="list-group-item"><a class="link-dark link-offset-2 link-underline-opacity-25 link-underline-opacity-100-hover" href="https://gocity.tp.st/bJKfnqLg" target="_blank">Go City</a></li>
          <li class="list-group-item"><a class="link-dark link-offset-2 link-underline-opacity-25 link-underline-opacity-100-hover" href="https://bikesbooking.tp.st/hzrEGoUL" target="_blank">BikesBooking.com</a></li>
          <li class="list-group-item"><a class="link-dark link-offset-2 link-underline-opacity-25 link-underline-opacity-100-hover" href="https://wegotrip.tp.st/9RusUZKl" target="_blank">WeGoTrip</a></li>
          </ul>
          </div>
        </div>
      </div>
      <div class="accordion-item">
        <h2 class="accordion-header">
          <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#flush-collapseTwo" aria-expanded="false" aria-controls="flush-collapseTwo">
            Places to stay
          </button>
        </h2>
        <div id="flush-collapseTwo" class="accordion-collapse collapse" data-bs-parent="#accordionFlushExample">
          <div class="accordion-body">
			    <p class="card-text">Here are some links to sites where you can find a place to stay.</p>
          <ul class="list-group list-group-flush">
          <li class="list-group-item"><a class="link-dark link-offset-2 link-underline-opacity-25 link-underline-opacity-100-hover" href="https://booking.tp.st/JFpi36Ld/" target="_blank">Booking.com</a></li>
          <li class="list-group-item"><a class="link-dark link-offset-2 link-underline-opacity-25 link-underline-opacity-100-hover" href="https://vrbo.tp.st/V3hK9T1Z" target="_blank">Vrbo</a></li>
          <li class="list-group-item"><a class="link-dark link-offset-2 link-underline-opacity-25 link-underline-opacity-100-hover" href="https://hostelworld.tp.st/kXriQ07L" target="_blank">Hostelworld</a></li>
          </ul>
          </div>
        </div>
      </div>
    </div>
  </div>`
  return block;
}

function get_travel_details_block(details){
  details_list = `<ul class="list-group list-group-flush">`;
  details.forEach(function (detail) {
    agency_name = detail.agency_name;
    if(agency_name in agencyLookup){
      agency_url = agencyLookup[agency_name];
    }
    else{
      agency_url = "https://omio.tp.st/p3bESwp0";
    }
    transport_type = detail.mode;
    details_list +=`
    <li class="list-group-item">
      <div class="row g-0">
        <div class="col-md-4">
          <img src="./static/icons/${transport_type}.png" class="img-fluid rounded-start" alt="...">
        </div>
        <div class="col-md-8">
          <div class="card-body">
            <h5 class="card-title"><a target="_blank" href="${agency_url}" >${agency_name}</a></h5>
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

function sortNextHops( a, b ) {
  if ( parseFloat(a.properties.duration_min) < parseFloat(b.properties.duration_min) ){
    return -1;
  }
  if ( parseFloat(a.properties.duration_min) > parseFloat(b.properties.duration_min)){
    return 1;
  }
  return 0;
}

function getHops(id){
  possibleHops.clearLayers();
  let hops_obj = all_hops[id].hops;
  Object.entries(hops_obj).forEach((entry) => {
    const [id, hop] = entry;
    let my_icon = L.icon({iconUrl: `./static/icons/hop.png`,iconSize: [36, 36], iconAnchor: [18,36]});
    let marker = L.marker([hop.place_lat, hop.place_lon],{icon:my_icon});
    marker.bindTooltip(`${hop.place_name}: ${format_duration(hop.duration_min)}`);
    marker.properties = hop;
    marker.addEventListener('click', _markerOnClick);
    marker.riseOnHover = true;
    marker.addTo(possibleHops);
    //marker.fireEvent('mouseover');
  });
}

function removeHop(hop_item){
  if(popup){popup.close();}
  var hops_layers = hops.getLayers();
  var ubound = hops_layers.length;
  for(var i=hop_item;i<ubound;i++){
    h = hops.getLayers();
    hops.removeLayer(h[h.length - 1]._leaflet_id);
    layers = routeLines.getLayers();
    routeLines.removeLayer(layers[layers.length - 1]._leaflet_id);
  };
  var hops_layers = hops.getLayers();
  var id = hops_layers[hops_layers.length - 1].properties.place_id;
  possibleHops.clearLayers();
  getHops(id);
  buildSummary();
}

function format_duration(mins){
  //mins = secs/60
  remainder =  mins % 60;
  str_remainder = Math.round(remainder).toString();
  hours = (mins - remainder) / 60;
  return(hours.toString() + ":" + str_remainder.padStart(2, '0'));
}

function openTravelDetails(from_place_id, to_place_id){
  var travel_details = get_travel_details(from_place_id, to_place_id);
  var block = get_travel_details_block(travel_details.details);
  document.getElementById("travel_details_body").innerHTML = `<h5 style="font-family: 'Cantora One', Arial; font-weight: 700; vertical-align: baseline; color:#ff6600ff">Journey to ${all_places[from_place_id].place_name}</h5>${block}`;
  showSidepanelTab('tab-travel-details');
}

function openPlaceDetails(place_id){
  place = all_places[place_id];
  var place_block = get_place_details_block(place.place_id);
  document.getElementById("place_body").innerHTML = place_block;
  showSidepanelTab('tab-place');
}

function showInspiredRoute(routeId){
  possibleInspiredTrip.clearLayers();
  possibleInspiredTripRouteLines.clearLayers();
  //need to go through each part of the route and add to the map
  var trip = inspiredTrips[routeId]["hops"];
  var hop = all_places[trip[0].place_id];
  var my_icon = L.icon({iconUrl: `./static/icons/home.png`, iconSize: [36, 36], iconAnchor: [18,36]});
  var starter_marker = L.marker([parseFloat(hop.place_lat), parseFloat(hop.place_lon)],{icon:my_icon});
  starter_marker.bindTooltip(decodeURI(hop.place_name));
  hop.hop_image = trip[0].hop_image;
  hop.hop_image_attribution = trip[0].hop_image_attribution;
  hop.hop_description = trip[0].hop_description;
  hop.link = trip[0].link;
  hop.link_text = trip[0].link_text;
  hop.trip_id = routeId;
  hop.next_hop_index = 1;
  starter_marker.properties = hop;
  starter_marker.addEventListener('click', _startInspireHopOnClick);
  starter_marker.riseOnHover = true;
  starter_marker.addTo(possibleInspiredTrip);

  for(var i=1;i<trip.length;i++){
    hop = all_places[trip[i].place_id];
    hop.from_place_id = trip[i-1].place_id;
    hop.hop_count = i;
    var my_icon = L.icon({iconUrl: `./static/icons/triphop.png`, iconSize: [24, 24], iconAnchor: [12,24]});
    var marker = L.marker([parseFloat(hop.place_lat), parseFloat(hop.place_lon)],{icon:my_icon});
    marker.bindTooltip(hop.place_name);
    //need to add trip items
    hop.hop_image = trip[i].hop_image;
    hop.hop_image_attribution = trip[i].hop_image_attribution;
    hop.hop_description = trip[i].hop_description;
    hop.link = trip[i].link;
    hop.link_text = trip[i].link_text;
    hop.trip_id = routeId;
    hop.next_hop_index = i + 1;
    marker.properties = hop;
 
    marker.addEventListener('click', _inspireHopOnClick);
    marker.riseOnHover = true;
    marker.addTo(possibleInspiredTrip);

    pointA = new L.LatLng(parseFloat(all_places[trip[i-1].place_id].place_lat), parseFloat(all_places[trip[i-1].place_id].place_lon));
    pointB = new L.LatLng(parseFloat(all_places[trip[i].place_id].place_lat), parseFloat(all_places[trip[i].place_id].place_lon));
    var pointList = [pointA, pointB];
    new_line = new L.Polyline(pointList, {color: '#ff6600ff',weight: 3,opacity: 0.5,smoothFactor: 1});
    new_line.addTo(possibleInspiredTripRouteLines);  
  }
  hideSidepanal();
  //starter_marker.fireEvent('click')
  showTripParts(routeId);
}

function customise(id){
  useThisRoute(id);
}

function useThisRoute(routeId){
  hops.clearLayers();
  routeLines.clearLayers();
  if(popup){popup.close();}
  var trip = inspiredTrips[routeId]["hops"];
  var hop = all_places[trip[0].place_id];
  var my_icon = L.icon({iconUrl: `./static/icons/triphop.png`, iconSize: [24, 24], iconAnchor: [12,24]});
  var marker = L.marker([parseFloat(hop.place_lat), parseFloat(hop.place_lon)],{icon:my_icon});
  marker.bindTooltip(decodeURI(hop.place_name));
  marker.properties = hop;
  marker.riseOnHover = true;
  marker.addTo(hops);

  for(var i=1;i<trip.length;i++){
    hop = all_places[trip[i].place_id];
    hop.from_place_id = trip[i-1].place_id;
    hop.hop_count = i;
    var my_icon = L.icon({iconUrl: `./static/icons/triphop.png`, iconSize: [24, 24], iconAnchor: [12,24]});
    var marker = L.marker([parseFloat(hop.place_lat), parseFloat(hop.place_lon)],{icon:my_icon});
    marker.bindTooltip(hop.place_name);
    marker.properties = hop;
    marker.addEventListener('click', _hopOnClick);
    marker.riseOnHover = true;
    marker.addTo(hops);

    pointA = new L.LatLng(parseFloat(all_places[trip[i-1].place_id].place_lat), parseFloat(all_places[trip[i-1].place_id].place_lon));
    pointB = new L.LatLng(parseFloat(all_places[trip[i].place_id].place_lat), parseFloat(all_places[trip[i].place_id].place_lon));
    var pointList = [pointA, pointB];
    new_line = new L.Polyline(pointList, {color: '#ff6600ff',weight: 3,opacity: 0.5,smoothFactor: 1});
    new_line.addTo(routeLines);  
  }
  getHops(trip[trip.length-1].place_id);
  possibleInspiredTrip.clearLayers();
  possibleInspiredTripRouteLines.clearLayers();
  showHomeTab();
}

function startAgain(){
  document.getElementById("freestyleBody").innerHTML = "";
  hops.clearLayers();
  routeLines.clearLayers();
  possibleHops.clearLayers();
  showHomeTab();
}

function buildSummary(){
  let hops_items = hops.getLayers();
  document.getElementById("freestyleBody").innerHTML = `
  <div class="row justify-content-evenly">
    <div class="col-7">
      <h5 style="font-family: 'Cantora One', Arial; font-weight: 700; vertical-align: baseline; color:#ff6600ff">Starting at ${hops_items[0].properties.place_name}</h5></div><div class="col" style="float: right;"><img src="./static/icons/save.png" onclick="checkSavingConsent()" title="save" alt="save">  <img src="./static/icons/restart.png" onclick="startAgain()" title="start again" alt="start again"> <small id="tripMessage"></small>
    </div>
    <div id="consentSection" hidden="true">This will save the trip to your device but not be shared with anyone else. Are you happy to proceed? <button class="btn btn-secondary btn-sm" onclick="giveConsent()">OK</button><button onclick="refuseConsent()" class="btn btn-secondary btn-sm">Not OK</button></div>
  </div>`;
  for(let i=1;i< hops_items.length;i++){
    let removalElement = "";
    if(i == hops_items.length - 1){removalElement = `<button class="btn btn-danger btn-sm" onclick="removeHop('${i}')">remove</button>`;}
    document.getElementById("freestyleBody").innerHTML +=`
    <div class="card border-light mb-3 ">
    <div class="row g-0">
      <div class="col-md-12">
        <img src="./static/icons/train.png" class="img-fluid rounded-start" alt="...">
        <a href="#" class="link-dark link-offset-2" onclick="openTravelDetails('${hops_items[i -1].properties.place_id}','${hops_items[i].properties.place_id}')">${hops_items[i -1].properties.place_name} to ${hops_items[i].properties.place_name} travel options</a>
       </div>
    </div>
  </div>`;
    document.getElementById("freestyleBody").innerHTML +=`
    <div class="card">
     <img src="${hops_items[i].properties.place_image}" class="img-fluid rounded-start" alt="..." title = "${hops_items[i].properties.image_attribution}" onclick="popAndZoom('${hops_items[i].properties.place_id}')">
     <div class="card-img-overlay">
     <div class="row justify-content-evenly"><div class="col"><a href="#" style="font-family: 'Cantora One', Arial; font-weight: 700; vertical-align: baseline; color:white; text-shadow:-1px 1px 0 #000, 1px 1px 0 #000; " onclick="popAndZoom('${hops_items[i].properties.place_id}')">${hops_items[i].properties.place_name}</a></div><div class="col-4">${removalElement}</div></div>
    </div>
    </div>`;
    }
    if(hops_items.length == 1){document.getElementById("freestyleBody").innerHTML +=`<h6 style="font-family: 'Cantora One', Arial; font-weight: 700; vertical-align: baseline; color:#ff6600ff" >Where next?</h6>
    <p class="text-center">Pick a place to hop to from ${hops_items[0].properties.place_name}.</p>`;}

    let nextHops = possibleHops.getLayers()
    nextHops.sort( sortNextHops );
    let nextHopSummary = `<div class="card"><div class="card-header">Where next?</div><div class="card-body">`;
    for(let i=0;i<nextHops.length;i++){
      nextHopSummary += `
      <div class="row justify-content-evenly">
      <div class="col">   
        <a href="#" onclick="popupHop('${nextHops[i].properties.place_id}')">${nextHops[i].properties.place_name}</a>
      </div>
      <div class="col">   
        <a href="#" onclick="openTravelDetails('${hops_items[hops_items.length-1].properties.place_id}','${nextHops[i].properties.place_id}')">travel time: ${format_duration(Math.round(nextHops[i].properties.duration_min))}</a>
      </div>    
      </div>`; 
    }
    nextHopSummary += `</div></div>`;
    document.getElementById("freestyleBody").insertAdjacentHTML('beforeend', nextHopSummary);

}

function popAndZoom(id){
 zoomToPlace(id);
 openPlaceDetails(id);
}

function showWholeInspiredRoute(){
  map.fitBounds([possibleInspiredTrip.getLayers()[0].getLatLng(),possibleInspiredTrip.getLayers()[possibleInspiredTrip.getLayers().length-1].getLatLng()])
}

function showWholeMap(){
  map.fitBounds(possibleHops)
}

function popupHop(place_id) {
  //loop through the possible hops
  let ph = possibleHops.getLayers();
  for(let i=0;i<ph.length;i++){
    if(ph[i].properties.place_id ==place_id){
      candidateHop = ph[i].properties;
    }
  }
  //get the properties of the place marked
  place = all_places[candidateHop.place_id];

  var place_block = get_place_details_block(candidateHop.place_id);
  document.getElementById("place_body").innerHTML = place_block;
  // unpack the travel details
  var block = get_travel_details_block(candidateHop.details);
  document.getElementById("travel_details_body").innerHTML = `<h5 style="font-family: 'Cantora One', Arial; font-weight: 700; vertical-align: baseline; color:#ff6600ff">Journey to ${place.place_name}</h5>${block}`;

  popup_text = `
    <div class="card mb-3">
     <img src="${place.place_image}" class="img-fluid rounded-start" style="max-height:250px" alt="..." title = "${place.image_attribution}">
     <div class="card-img-overlay">
       <div class="row justify-content-evenly"><div class="col"><a href="#" class="h3" style="font-family: 'Cantora One', Arial; font-weight: 700; vertical-align: baseline; color:white; text-shadow:-1px 1px 0 #000, 1px 1px 0 #000; " onclick="openPlaceDetails('${place.place_id}')">${place.place_name}</a></div><div class="col-3"><button type="button" class="btn btn-success btn-sm" onclick="_addToTrip()">Add</button></div></div>
     </div>
     <ul class="list-group list-group-flush">
      <li class="list-group-item">${decodeURIComponent(place.place_brief_desc)} <a href="#" onclick="showSidepanelTab('tab-place')"> more...</a></li>
      <li class="list-group-item">Journey times from: ${format_duration(candidateHop.duration_min)} <a href="#" onclick="showSidepanelTab('tab-travel-details')"> more...</a></li>
     </ul>
    </div>`
  hideSidepanal();
  popup = L.popup().setLatLng([place.place_lat,place.place_lon]).setContent(popup_text).openOn(map); 

}

function _fromMarkerOnClick(e) {
  //get the properties of the place marked
  candidateHop = e.sourceTarget.properties;
  place = all_places[candidateHop.place_id];

  var place_block = get_place_details_block(candidateHop.place_id);
  document.getElementById("place_body").innerHTML = place_block;

  popup_text = `
        <p>${place.place_name}</p>
        <button type="button" style="background-color:#abc837ff" class="btn btn-success btn-sm" onclick="_setStartpoint('${place.place_id}')">Start here</button>`;
  popup = L.popup().setLatLng([e.latlng.lat,e.latlng.lng]).setContent(popup_text).openOn(map); 
}

function _destinationMarkerOnClick(e) {
  //get the properties of the place marked
  candidateHop = e.sourceTarget.properties;
  place = all_places[candidateHop.place_id];

  var place_block = get_place_details_block(candidateHop.place_id);
  document.getElementById("place_body").innerHTML = place_block;

  popup_text = `
      <p>${place.place_name}</p>
      <button type="button" style="background-color:#abc837ff" class="btn btn-success btn-sm" onclick="_setDestination('${place.place_id}')">Destination</button>`
  popup = L.popup().setLatLng([e.latlng.lat,e.latlng.lng]).setContent(popup_text).openOn(map); 
}

function _setStartpoint(place_id){
  if(popup){popup.close()}
  map.removeLayer(possibleFromToStartPoints);
  map.addLayer(possibleFromToEndPoints);
  //document.getElementById("startSelect").value = place_id;
  startSelect.setSelected(place_id);
}

function _setDestination(place_id){
  if(popup){popup.close()}
  //document.getElementById("destinationSelect").value = place_id;
  destinationSelect.setSelected(place_id);
  findFabRoutes();
}

function _routeHopOnClick(e) {
  var hop = e.sourceTarget.properties;
  place = all_places[hop.place_id];
  var place_block = get_place_details_block(place.place_id);
  document.getElementById("place_body").innerHTML = place_block;
  var travel_details = get_travel_details(hop.from_place_id,hop.place_id)
  var block = get_travel_details_block(travel_details.details);
  document.getElementById("travel_details_body").innerHTML = `<h5 style="font-family: 'Cantora One', Arial; font-weight: 700; vertical-align: baseline; color:#ff6600ff">Journey to ${place.place_name}</h5>${block}`;

  //check if last element
  popup_text = `
  <div class="card mb-3">
  <img src="${hop.hop_image}" class="img-fluid rounded-start" style="max-height:250px" alt="..." title = "${hop.hop_image_attribution}">
  <div class="card-img-overlay">
    <div class="row justify-content-evenly"><div class="col"><a href="#" class="h3" style="font-family: 'Cantora One', Arial; font-weight: 700; vertical-align: baseline; color:white; text-shadow:-1px 1px 0 #000, 1px 1px 0 #000; " onclick="openPlaceDetails('${place.place_id}')">${place.place_name}</a></div></div>
  </div>
  <ul class="list-group list-group-flush">
   <li class="list-group-item">${hop.hop_description} <a href="#" onclick="showSidepanelTab('tab-place')"> more...</a></li>
   <li class="list-group-item">Journey times from: ${format_duration(travel_details.duration_min)} <a href="#" onclick="showSidepanelTab('tab-travel-details')"> more...</a></li>
  </ul>
 </div>
  `
  popup = L.popup().setLatLng([place.place_lat,place.place_lon]).setContent(popup_text).openOn(map); 
}

function clearAllLayers(){
  hops.clearLayers();
  fromToStartPoint.clearLayers();
  fromToDestination.clearLayers();
  routeLines.clearLayers();
  possibleInspiredTrip.clearLayers();
  possibleInspiredTripRouteLines.clearLayers();
  possibleHops.clearLayers();
  freestyleStartPoints.clearLayers();
  possibleFromToStartPoints.clearLayers();
  possibleFromToEndPoints.clearLayers();
  liveRouteLines.clearLayers();
  liveStops.clearLayers();
}

function toRadians (angle) {
  return angle * (Math.PI / 180);
}

function distanceBetweenTwoPoints(from_lat,from_lon,to_lat,to_lon){
    from_lat_rad = toRadians(parseFloat(from_lat))
    from_lon_rad = toRadians(parseFloat(from_lon))
    to_lat_rad = toRadians(parseFloat(to_lat))
    to_lon_rad = toRadians(parseFloat(to_lon))
    dist_lon = to_lon_rad - from_lon_rad
    dist_lat = to_lat_rad - from_lat_rad

    a = Math.sin(dist_lat / 2)**2 + Math.cos(from_lat_rad) * Math.cos(to_lat_rad) * Math.sin(dist_lon / 2)**2
    c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    // Approximate radius of earth in km
    R = 6373.0
    distance = R * c
    return distance
}

function findFabRoutes(){
  if(popup){popup.close();}
  let from_place_id = document.getElementById("startSelect").value;
  let to_place_id = document.getElementById("destinationSelect").value;

  if(from_place_id == to_place_id || from_place_id=="" || to_place_id==""){
    console.log(`dodgy ${from_place_id}`)
  }
  else{
    if(map.hasLayer(possibleFromToStartPoints)){map.removeLayer(possibleFromToStartPoints);}
    if(map.hasLayer(possibleFromToEndPoints)){map.removeLayer(possibleFromToEndPoints);}

    if(!map.hasLayer(fromToStartPoint)){map.addLayer(fromToStartPoint);}
    if(!map.hasLayer(fromToDestination)){map.addLayer(fromToDestination);}
    if(!map.hasLayer(fromToLines)){map.addLayer(fromToLines);}
    fromToStartPoint.clearLayers();
    fromToDestination.clearLayers();
    fromToLines.clearLayers();
    //TODO hide possible start and destination makers
    document.getElementById("fromToResults").innerHTML = "";
    //add a start marker
    let my_icon = L.icon({iconUrl: `./static/icons/home.png`,iconSize: [36, 36], iconAnchor: [18,36]});
    let marker = L.marker([all_places[from_place_id].place_lat, all_places[from_place_id].place_lon],{icon:my_icon});
    marker.properties = all_places[from_place_id];
    marker.bindTooltip(marker.properties.place_name);
    marker.addTo(fromToStartPoint);

    //add a destination marker
    my_icon = L.icon({iconUrl: `./static/icons/destination.png`,iconSize: [36, 36], iconAnchor: [18,36]});
    marker = L.marker([all_places[to_place_id].place_lat, all_places[to_place_id].place_lon],{icon:my_icon});
    marker.properties = all_places[to_place_id];
    marker.bindTooltip(marker.properties.place_name);
    marker.addTo(fromToDestination);
    //findFromStops(from_place_id,to_place_id);
    getJourneysWithoutDuplicates(from_place_id,to_place_id)
  }
}

function findFromStops(from_place_id,to_place_id){
  let stops = [];
  let place = all_places[from_place_id];
  //get the route file
  var url = `https://${dbServer}/stops/nearby?latitude=${place['place_lat']}&longitude=${place['place_lon']}&results=1&distance=${place['lat_lon_tolerance']}000&stops=true`
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function() {
    if (this.readyState == 4){
      if(this.status == 200) {
        var response = JSON.parse(this.responseText);
        for(var i=0;i<response.length;i++){
          const stop = response[i];
          if(stop["type"] == "stop"){
            stopsPlacesLookup[stop["id"]] = from_place_id;
            console.log(`findFromStops: ${stop["id"]} - ${stop["name"]}`);
            stops.push(stop["id"]);
          }
        }
        findToStops(from_place_id,to_place_id,stops[0]);
      }
      else{
        console.log(`Status: ${this.status} \n Response text: ${this.responseText}`);
        document.getElementById("fromToResults").innerHTML = "hmm, something went wrong... maybe time to put the kettle on";
      }
    }
  };

  xmlhttp.open("GET", url, true);
  xmlhttp.send();

}

function findToStops(from_place_id,to_place_id,from_stop_id){
  let stops = [];
  let place = all_places[to_place_id];
  //get the route file
  var url = `https://${dbServer}/stops/nearby?latitude=${place['place_lat']}&longitude=${place['place_lon']}&results=1&distance=${place['lat_lon_tolerance']}000&stops=true`
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function() {
    if (this.readyState == 4){
      if(this.status == 200) {
        var response = JSON.parse(this.responseText);
        for(var i=0;i<response.length;i++){
          const stop = response[i];
          if(stop["type"] == "stop"){
            stopsPlacesLookup[stop["id"]] = to_place_id;
            console.log(`findToStops: ${stop["id"]} - ${stop["name"]}`);
            stops.push(stop["id"]);
          }
        }
        //getFromTo(from_place_id,to_place_id,from_stop_id,stops[0]);
        getJourneysByStop(from_place_id,to_place_id,from_stop_id,stops[0]);
      }
      else{
        console.log(`Status: ${this.status} \n Response text: ${this.responseText}`);
        document.getElementById("fromToResults").innerHTML = "hmm, something went wrong... maybe time to put the kettle on";
      }
  }};

  xmlhttp.open("GET", url, true);
  xmlhttp.send();
}

function getFromTo(from_place_id,to_place_id,from_stop_id,to_stop_id){
  trips = {};
  var url=`https://${dbServer}/journeys?from=${from_stop_id}&to=${to_stop_id}&results=3&stopovers=false&transferTime=0&bike=false&startWithWalking=true&walkingSpeed=normal&tickets=false&polylines=false&subStops=true&entrances=true&remarks=true&scheduledDays=false&language=en&firstClass=false`;
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function() {
    if (this.readyState == 4){
      if(this.status == 200) {
        var response = JSON.parse(this.responseText);
        console.log("processing journeys");
        //console.log(this.responseText);
        const journeys = response.journeys;
        journeyLookup = {"journeyCount":journeys.length,"lastTripId":null};
        //gathering the route taken by each option - to avoid duplication
        let journeyFootprints = [];
        if(journeys.length==0){
          document.getElementById("fromToResults").innerHTML = "No results found";
        }
        else{
          for(var i=0;i<journeys.length;i++){
            const legs = journeys[i].legs;
            let journeyFootprint = "";
            //make sure haven't used this route before
            for(var j=0;j<legs.length;j++){
              if("line" in legs[j]){
                  let line_name = legs[j].line.name;
                  journeyFootprint += line_name;
              }
            }
            if(journeyFootprints.includes(journeyFootprint)){
              console.log("already included this journey")
            }
            else{
                console.log(`new journey ${journeyFootprint}`);
                document.getElementById("fromToResults").insertAdjacentHTML("beforeend",`<div id="${from_stop_id}_${to_stop_id}_${i}"></div>`);
                document.getElementById(`${from_stop_id}_${to_stop_id}_${i}`).insertAdjacentHTML("beforeend",`<h5>Option ${i + 1}</h5>`);
                let lastTripId;
                for(var j=0;j<legs.length;j++){
                  if(placeNear(legs[j].destination.location.latitude,legs[j].destination.location.longitude,from_place_id)){
                    console.log(`${legs[j].destination.name} ${from_place_id} haven't left start`);
                  }
                  else if(placeNear(legs[j].origin.location.latitude,legs[j].origin.location.longitude,to_place_id)){
                    console.log(`already reached destination`);
                  }
                  else{
                  //if walking plot walk?
                  //otherwise get the trip
                  if("line" in legs[j]){
                    let line_name = legs[j].line.name;
                    journeyFootprint += line_name;
                    let trip_id = legs[j].tripId;
                    //make somewhere for the results to go
                    if(line_name){
                      document.getElementById(`${from_stop_id}_${to_stop_id}_${i}`).insertAdjacentHTML("beforeend",`<div id="${legs[j].origin.id}_${legs[j].destination.id}_${i}"></div>`);
                      getTripsForLine(legs[j].origin.id,legs[j].destination.id,trip_id,line_name,`${legs[j].origin.id}_${legs[j].destination.id}_${i}`);
                      journeyLookup.lastTripId = trip_id;
                    } 
                  }
                }
              }
            }
          }
        }
      }
      else{
        console.log(`Status: ${this.status} \n Response text: ${this.responseText}`);
        document.getElementById("fromToResults").innerHTML = "hmm, something went wrong... maybe time to put the kettle on";
      }
  }};

  xmlhttp.open("GET", url, true);
  xmlhttp.send();
}

function getTripsForLine(origin_id,destination_id,trip_id,line_name,placeholder){
  let url=`https://${dbServer}/trips/${encodeURI(trip_id)}?lineName=${encodeURI(line_name)}`
  let xmlhttp = new XMLHttpRequest();

  xmlhttp.onreadystatechange = function() {
    if (this.readyState == 4){
      if(this.status == 200) {
        let trip = JSON.parse(this.responseText);
        trips[encodeURI(trip_id)] = trip;
        console.log(`processing trip from ${origin_id} to ${destination_id}`);
        console.log(line_name);
        //console.log(this.responseText);
        if("stopovers" in trip){
          let stopovers = trip["stopovers"]
          let remarks = "";
          if(trip["remarks"]){
            for(let i=0;i<trip["remarks"].length;i++){
              remarks += `<br>${trip["remarks"][i].text}`;
            }
          }
          let tripCard = '';
          let inTrip = false;
          let from_stop_id_index, to_stop_id_index;
          let latlngs = [];
          let fabHops = [];
            for(let i=0;i<stopovers.length;i++){
              if(i==0){stopovers[i].timestamp = stopovers[i].plannedDeparture;}
              else{
                if(stopovers[i].plannedArrival){stopovers[i].timestamp = stopovers[i].plannedArrival;}
                else{stopovers[i].timestamp = stopovers[i].plannedDeparture;}
              }
              if(stopovers[i].stop.id==origin_id){
                inTrip = true;
                from_stop_id_index = i;
              } 
              if(inTrip){
                //see if place is known
                let badge = "";
                let onclickFunction = `showPlaceOnMap('${stopovers[i].stop.location.latitude}', '${stopovers[i].stop.location.longitude}','${stopovers[i].stop.name}')`;
                Object.entries(all_places).forEach((entry) => {
                  const [id, place] = entry;
                  if(distanceBetweenTwoPoints(stopovers[i].stop.location.latitude,stopovers[i].stop.location.longitude,place.place_lat,place.place_lon) <= place.lat_lon_tolerance){
                    onclickFunction = `popupPlace('${place.place_id}')`;
                    if (!fabHops.includes(place.place_id)) {
                      fabHops.push(place.place_id);
                      //showPlaceOnMap(place.place_lat,place.place_lon,place.place_name)
                    }
                    badge = `<span class="badge text-bg-light">Fab Hop!</span>`;
                  }
                });
                tripCard += `<li class="list-group-item"><a href="#" onclick="${onclickFunction}">${stopovers[i].stop.name} ${badge}</a></li>`
                latlngs.push([stopovers[i].stop.location.latitude, stopovers[i].stop.location.longitude])
              }
              if(stopovers[i].stop.id==destination_id){
                to_stop_id_index = i;
                inTrip = false;
              }
            }
            if(fabHops.length > 1){badge = `<span class="badge text-bg-light">${fabHops.length} fab hops!</span>`}
            else if (fabHops.length == 1){badge = `<span class="badge text-bg-light">1 fab hop!</span>`}
            else{badge=""}
            let tripCardheader = `
            <div class="card">
              <div class="card-header">
              <img src="./static/icons/${trip.line.mode}.png" class="img-fluid rounded-start" alt="..."> <a data-bs-toggle="collapse" href="#${encodeURI(trip_id)}" aria-expanded="false" aria-controls="${encodeURI(trip_id)}">
              ${stopovers[from_stop_id_index].stop.name} to ${stopovers[to_stop_id_index].stop.name}
              </a> ${badge}
              </div>
              <div class="collapse" id="${encodeURI(trip_id)}">
              <div class="card-body">
              <ul class="list-group list-group-flush">
            `;
            //check if last journey and last trip id
            //if(trip_id==journeyLookup.lastTripId){}
            document.getElementById(placeholder).insertAdjacentHTML('beforeend',`${tripCardheader}${tripCard}</ul></div></div></div>`);
            var polyline = L.polyline(latlngs, {color: '#ff6600ff',weight: 3,opacity: 0.5,smoothFactor: 1});
            
            polyline.bindTooltip(`${trip.origin.name} to ${trip.destination.name}`);
            polyline.properties = trip;
            polyline.addTo(fromToLines);
        }
      }
      else{
          console.log(`Status: ${this.status} \n Response text: ${this.responseText}`);
          document.getElementById("fromToResults").innerHTML = "hmm, something went wrong... maybe time to put the kettle on";
      }
    }
  };

  xmlhttp.open("GET", url, true);
  xmlhttp.send();

}

async function getJourneysWithoutDuplicates(from_place_id,to_place_id) {
  var footprints = [];
  let from_stop_id;
  let to_stop_id;
  if(from_place_id in stopsForPlaces && to_place_id in stopsForPlaces){
    if(stopsForPlaces[from_place_id].length > 0 && stopsForPlaces[to_place_id].length >0){
      from_stop_id = stopsForPlaces[from_place_id][0].id;
      to_stop_id = stopsForPlaces[to_place_id][0].id;

      let url = `https://${dbServer}/journeys?from=${from_stop_id}&to=${to_stop_id}&results=3&stopovers=false&transferTime=0&bike=false&startWithWalking=true&walkingSpeed=normal&tickets=false&polylines=false&subStops=true&entrances=true&remarks=true&scheduledDays=false&language=en&firstClass=false`;
      const response = await fetch(url);
      if(response.status == 200){
        const jsonResponse = await response.json();
        const journeys = jsonResponse.journeys;
        for(let i=0;i<journeys.length;i++){
          let journey = {"from_stop_id":from_stop_id,"to_stop_id":to_stop_id,legs:[]};
          const legs = journeys[i].legs;
          for(let j=0;j<legs.length;j++){
            if(placeNear(legs[j].destination.location.latitude,legs[j].destination.location.longitude,from_place_id)){console.log(`${legs[j].destination.name} ${from_place_id} haven't left start`);}
            else if(placeNear(legs[j].origin.location.latitude,legs[j].origin.location.longitude,to_place_id)){console.log(`already reached destination`);}
            else{
            //if walking plot walk?
            //otherwise get the trip
              if("line" in legs[j]){
                let line_name = legs[j].line.name;
                let trip_id = legs[j].tripId;
                if(line_name){
                  //getTripsForLine(legs[j].origin.id,legs[j].destination.id,trip_id,line_name,i,j);
                  let tripUrl = `https://${dbServer}/trips/${encodeURI(trip_id)}?lineName=${encodeURI(line_name)}`;
                  const tripResponse = await fetch(tripUrl);
                  const trip = await tripResponse.json();
                  if("stopovers" in trip){
                    let tripMap = {"stops":[]};
                    let stopovers = trip["stopovers"];
                    //if(trip["remarks"]){
                    //  tripMap["remarks"] = trip["remarks"]
                    //}
                    let inTrip = false;
                    let from_stop_id_index, to_stop_id_index;
                      for(let k=0;k<stopovers.length;k++){
                        if(k==0){stopovers[k].timestamp = stopovers[k].plannedDeparture;}
                        else{
                          if(stopovers[k].plannedArrival){stopovers[k].timestamp = stopovers[k].plannedArrival;}
                          else{stopovers[k].timestamp = stopovers[k].plannedDeparture;}
                        }
                        if(stopovers[k].stop.id==legs[j].origin.id){
                          inTrip = true;
                          from_stop_id_index = k;
                        } 
                        if(inTrip){
                          tripMap["stops"].push({
                            "name": stopovers[k].stop.name, 
                            "latitude": stopovers[k].stop.location.latitude, 
                            "longitude":stopovers[k].stop.location.longitude
                          });                  
                        }
                        if(stopovers[k].stop.id==legs[j].destination.id){
                          to_stop_id_index = k;
                          inTrip = false;
                          journey["legs"].push(tripMap);
                        }
                      }
                  }
                }  
              }
            }
          }
          //check if footprint in footprints
          let footprintString = JSON.stringify(journey);
          let footprintUnique=true;
          for(let ifoot = 0;ifoot<footprints.length;ifoot++){
            if(footprints[ifoot]==footprintString){
              footprintUnique = false;
              console.log("found duplicate footprint");
            }
          }
          if(footprintUnique){
            footprints.push(footprintString);
            console.log(footprintString);
            let optionCount = footprints.length;
            document.getElementById("fromToResults").insertAdjacentHTML("beforeend",`<div id="${from_stop_id}_${to_stop_id}_${optionCount}"></div>`);
            document.getElementById(`${from_stop_id}_${to_stop_id}_${optionCount}`).insertAdjacentHTML("beforeend",`<h5>Option ${optionCount}</h5>`);
            let legid = 0;
            journey.legs.forEach(leg=>{
              legid++;
              let latlngs = [];
              let fabHops = []; 
              let fromStopName = leg.stops[0].name;
              let toStopName = leg.stops[leg.stops.length -1].name;
              //now write out each leg
              //let remarks = "";
              //if(leg["remarks"]){
              //  for(let iremark=0;iremark<leg["remarks"].length;iremark++){
              //    remarks += `<br>${leg["remarks"][iremark].text}`;
              //  }
              //}
              let tripCard = '';
              let stopovers = leg.stops;
              for(let iStop=0;iStop<stopovers.length;iStop++){
                //see if place is known
                let badge = "";
                let onclickFunction = `showPlaceOnMap('${stopovers[iStop].latitude}', '${stopovers[iStop].longitude}','${stopovers[iStop].name}')`;
                Object.entries(all_places).forEach((entry) => {
                  const [placeid, place] = entry;
                  if(distanceBetweenTwoPoints(stopovers[iStop].latitude,stopovers[iStop].longitude,place.place_lat,place.place_lon) <= place.lat_lon_tolerance){
                    onclickFunction = `popupPlace('${place.place_id}')`;
                    if (!fabHops.includes(place.place_id)) {
                      fabHops.push(place.place_id);
                    }
                    badge = `<span class="badge text-bg-light">Fab Hop!</span>`;
                  }
                });
                tripCard += `<li class="list-group-item"><a href="#" onclick="${onclickFunction}">${stopovers[iStop].name} ${badge}</a></li>`;
                latlngs.push([stopovers[iStop].latitude, stopovers[iStop].longitude]);
              }    
              if(fabHops.length > 1){badge = `<span class="badge text-bg-light">${fabHops.length} fab hops!</span>`}
              else if (fabHops.length == 1){badge = `<span class="badge text-bg-light">1 fab hop!</span>`}
              else{badge=""}
              let tripCardheader = `
              <div class="card">
                <div class="card-header">
                <img src="./static/icons/train.png" class="img-fluid rounded-start" alt="..."> <a data-bs-toggle="collapse" href="#journey_details_${optionCount}_${legid}" aria-expanded="false" aria-controls="journey_details_${optionCount}_${legid}">
                ${fromStopName} to ${toStopName}
                </a> ${badge}
                </div>
                <div class="collapse" id="journey_details_${optionCount}_${legid}">
                <div class="card-body">
                <ul class="list-group list-group-flush">
              `;     
              let output = `<div>
              ${tripCardheader}${tripCard}</ul></div></div>
              </div>`;
              document.getElementById(`${from_stop_id}_${to_stop_id}_${optionCount}`).insertAdjacentHTML("beforeend",output);
              var polyline = L.polyline(latlngs, {color: '#ff6600ff',weight: 3,opacity: 0.5,smoothFactor: 1});
              polyline.bindTooltip(`${fromStopName} to ${toStopName}`);
              polyline.properties = leg;
              polyline.addTo(fromToLines);        
            });
          }
        }
      }
    }
  }
  else{
    //return '{"error":"places not found"}';
  }
}

function getDepartures(from_stop_id){
  liveRouteLines.clearLayers();
  if(!map.hasLayer(liveRouteLines)){map.addLayer(liveRouteLines);}
  let place_id = stopsPlacesLookup[from_stop_id];
  let place = all_places[place_id];

  trips = {};
  var url=`https://${dbServer}/stops/${from_stop_id}/departures?duration=1440`
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function() {
    if (this.readyState == 4){
      if(this.status == 200) {
        var response = JSON.parse(this.responseText);
        console.log("processing departures");
        console.log(this.responseText);
        for(var i=0;i<response.length;i++){
          const departure = response[i];
          trip_id = departure["tripId"];
          line_name = departure["line"]["name"];
          getLiveTrips(from_stop_id,trip_id,line_name);
        };
      }
      else{
        console.log(`Status: ${this.status} \n Response text: ${this.responseText}`);
        document.getElementById("fromToResults").innerHTML = "hmm, something went wrong... maybe time to put the kettle on";
      }
    }
  };

  xmlhttp.open("GET", url, true);
  xmlhttp.send();

}

function getLiveTrips(from_stop_id,trip_id,line_name){
  let url=`https://${dbServer}/trips/${encodeURI(trip_id)}?lineName=${encodeURI(line_name)}`
  let xmlhttp = new XMLHttpRequest();

  xmlhttp.onreadystatechange = function() {
    if (this.readyState == 4){
      if(this.status == 200) {
      let trip = JSON.parse(this.responseText);
      trips[encodeURI(trip_id)] = trip;
      console.log("processing trips");
      console.log(this.responseText);
      if("stopovers" in trip){
        let stopovers = trip["stopovers"]
        let remarks = "";
        if(trip["remarks"]){
          for(let i=0;i<trip["remarks"].length;i++){
            remarks += `<br>${trip["remarks"][i].text}`;
          }
        }
        let tripCard = '';
        let from_stop_id_noted = false;
        let from_stop_id_index;
        let latlngs = [];
        let fabHops = [];
          for(let i=0;i<stopovers.length;i++){
            if(stopovers[i].stop.id==from_stop_id){
              from_stop_id_noted = true;
              from_stop_id_index = i;
            } 
            let timestamp = "";
            if(i==0){stopovers[i].timestamp = stopovers[i].plannedDeparture;}
            else{
              if(stopovers[i].plannedArrival){
              stopovers[i].timestamp = stopovers[i].plannedArrival;
              }
              else{stopovers[i].timestamp = stopovers[i].plannedDeparture;}
            }
            if(from_stop_id_noted){
              let badge = "";
              let onclickFunction = `showPlaceOnMap('${stopovers[i].stop.location.latitude}', '${stopovers[i].stop.location.longitude}','${stopovers[i].stop.name}')`;
              Object.entries(all_places).forEach((entry) => {
                const [id, place] = entry;
                if(distanceBetweenTwoPoints(stopovers[i].stop.location.latitude,stopovers[i].stop.location.longitude,place.place_lat,place.place_lon) <= place.lat_lon_tolerance){
                  onclickFunction = `popupPlace('${place.place_id}')`;
                  if (!fabHops.includes(place.place_id)) {
                    fabHops.push(place.place_id);
                    //showPlaceOnMap(place.place_lat,place.place_lon,place.place_name)
                  }
                  badge = `<span class="badge text-bg-light">Fab Hop!</span>`;
                }
              });
              //tripCard += `<li class="list-group-item"><a href="#" onclick="${onclickFunction}">${stopovers[i].stop.name} ${badge}</a></li>`
              tripCard += `<li class="list-group-item">${stopovers[i].timestamp.substring(11,19)}: <a href="#" onclick="showPlaceOnMap('${stopovers[i].stop.location.latitude}', '${stopovers[i].stop.location.longitude}','${stopovers[i].stop.name}')">${stopovers[i].stop.name}</a></li>`
              latlngs.push([stopovers[i].stop.location.latitude, stopovers[i].stop.location.longitude])
            }
          }
          if(from_stop_id_noted){
            if(fabHops.length > 1){badge = `<span class="badge text-bg-light">${fabHops.length} fab hops!</span>`}
            else if (fabHops.length == 1){badge = `<span class="badge text-bg-light">1 fab hop!</span>`}
            else{badge=""}    
            //need to add this when we have reached the stop
            let tripCardheader = `
            <div class="card">
            <div class="card-header livetrip" onmouseover="showTripOnMap('${encodeURI(trip_id)}')" timestamp="${stopovers[from_stop_id_index].timestamp.substring(11,19)}">
            ${stopovers[from_stop_id_index].timestamp.substring(11,19)} 
            <a data-bs-toggle="collapse" href="#${encodeURI(trip_id)}" aria-expanded="false" aria-controls="${encodeURI(trip_id)}">
            ${stopovers[from_stop_id_index].stop.name} to ${trip.destination.name}
            </a> ${badge}
            </div>
            <div class="collapse" id="${encodeURI(trip_id)}">
            <div class="card-body">
            <p>${trip.line.mode}
            ${remarks}
            </p>
            <ul class="list-group list-group-flush">
            `;
            document.getElementById("routes_from_places").insertAdjacentHTML('beforeend',`${tripCardheader}${tripCard}</ul></div></div></div>`);
            var polyline = L.polyline(latlngs, {color: '#ff6600ff',weight: 3,opacity: 0.5,smoothFactor: 1});      
            polyline.bindTooltip(`${trip.origin.name} to ${trip.destination.name}`);
            polyline.properties = trip;
            polyline.addTo(liveRouteLines);
          }
        }
      }
      else{
        console.log(`Status: ${this.status} \n Response text: ${this.responseText}`);
        document.getElementById("fromToResults").innerHTML = "hmm, something went wrong... maybe time to put the kettle on";
      }
    }
  };

  xmlhttp.open("GET", url, true);
  xmlhttp.send();

}

function sortTimetable(){
  let liveTrips = document.getElementsByClassName("livetrip");
  liveTrips.sort(function(a, b){
    if(a.getAttribute("timestamp") < b.getAttribute("timestamp")){
      return -1;
    }
    else{return 1}
  });
  document.getElementById("routes_from_places").html(divList);
}

function showPlaceOnMap(lat,lon,placename){
  let linktext = "";

  Object.entries(all_places).forEach((entry) => {
    const [id, place] = entry;
    if(distanceBetweenTwoPoints(lat,lon,place.place_lat,place.place_lon) <= place.lat_lon_tolerance){
      linktext = `<a href="#" onclick="popupPlace('${place.place_id}')">more...</a>`;
    }
  });
  let popup_text = `<p>${placename}<br>${linktext}</p>`;
  popup = L.popup().setLatLng([lat,lon]).setContent(popup_text).openOn(map);
}

function showTripOnMap(tripId){
  let trip = trips[tripId];
  if("stopovers" in trip){
    let stopovers = trip["stopovers"]
    departureTime = stopovers[0]["plannedDeparture"]

    latlngs = []
      for(let i=0;i<stopovers.length;i++){
        let timestamp = "";
        if(stopovers[i].departure){timestamp = stopovers[i].departure};
        if(!timestamp){ timestamp = stopovers[i].arrival}
        latlngs.push([stopovers[i].stop.location.latitude, stopovers[i].stop.location.longitude]);
      }
      var polyline = L.polyline(latlngs, {color: '#ff6600ff',weight: 3,opacity: 0.5,smoothFactor: 1});
     
      polyline.bindTooltip(`${trip.origin.name} to ${trip.destination.name}`);
      polyline.properties = trip;
      polyline.addTo(liveRouteLines);
    }
}

function _showLiveStopsOnClick(e){
  document.getElementById("routes_from_places").innerHTML = "";
  let heading = `<h5>Departures from ${e.sourceTarget.properties.name}</h5>`
  document.getElementById("routes_from_places").insertAdjacentHTML('beforeend',heading);
  getDepartures(e.sourceTarget.properties.id);
}
function _showLiveOnClick(e){
  document.getElementById("routes_from_places").innerHTML = "";
  place_id = e.sourceTarget.properties.place_id;
  place = all_places[place_id];
  let heading = `<h5>Departures from ${place.place_name}</h5>`
  document.getElementById("routes_from_places").insertAdjacentHTML('beforeend',heading);
  stopsForPlaces.forEach(stop=>{
    stopsPlacesLookup[stop["id"]] = place_id;
    getDepartures(stop["id"]);
  })
}
/*
function _showLiveOnClick(e){
  document.getElementById("routes_from_places").innerHTML = "";
  place_id = e.sourceTarget.properties.place_id;
  place = all_places[place_id];
  let heading = `<h5>Departures from ${place.place_name}</h5>`
  document.getElementById("routes_from_places").insertAdjacentHTML('beforeend',heading);

  //get the route file
  var url = `https://${dbServer}/stops/nearby?latitude=${place['place_lat']}&longitude=${place['place_lon']}&results=10&distance=${place['lat_lon_tolerance']}000&stops=true`
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function() {
    if (this.readyState == 4){
      if(this.status == 200) {
        var response = JSON.parse(this.responseText);
        console.log("processing stops");
        console.log(this.responseText);
        for(var i=0;i<response.length;i++){
          const stop = response[i];
          if(stop["type"] == "stop"){
            stopsPlacesLookup[stop["id"]] = place_id;
            getDepartures(stop["id"]);
          }
        }
      }
      else{
        console.log(`Status: ${this.status} \n Response text: ${this.responseText}`);
        document.getElementById("fromToResults").innerHTML = "hmm, something went wrong... maybe time to put the kettle on";
      }
    }
  };

  xmlhttp.open("GET", url, true);
  xmlhttp.send();

}
*/
function popupPlace(place_id) {
  //get the properties of the place marked
  let place = all_places[place_id];
  let place_block = get_place_details_block(place_id);
  document.getElementById("place_body").innerHTML = place_block;

  popup_text = `
    <div class="card mb-3">
     <img src="${place.place_image}" class="img-fluid rounded-start" style="max-height:250px" alt="..." title = "${place.image_attribution}">
     <div class="card-img-overlay">
       <div class="row justify-content-evenly"><div class="col"><a href="#" class="h3" style="font-family: 'Cantora One', Arial; font-weight: 700; vertical-align: baseline; color:white; text-shadow:-1px 1px 0 #000, 1px 1px 0 #000; " onclick="openPlaceDetails('${place.place_id}')">${place.place_name}</a></div></div>
     </div>
     <ul class="list-group list-group-flush">
      <li class="list-group-item">${decodeURIComponent(place.place_brief_desc)} <a href="#" onclick="showSidepanelTab('tab-place')"> more...</a></li>
     </ul>
    </div>`
    hideSidepanal()
  popup = L.popup().setLatLng([place.place_lat,place.place_lon]).setContent(popup_text).openOn(map); 
}

function placeNear(lat,lon,place_id){
  let place = all_places[place_id];
  let dist = distanceBetweenTwoPoints(lat,lon,place.place_lat,place.place_lon);
  if(dist <= place.lat_lon_tolerance){
    //console.log(`${dist} near ${place.place_name} ${place.lat_lon_tolerance}`)
    return true;
  }
  else{
    //console.log(`nope ${dist} further than ${place.lat_lon_tolerance}`)
    return false;
  }
}

function revertToPreviousTab(){
  showSidepanelTab(lastTab);
}

function giveConsent(){
  localStorage.setItem("savingConsentGiven",true);
  document.getElementById("consentSection").hidden = true;
  saveTrip();
}

function refuseConsent(){
  document.getElementById("consentSection").hidden = true;
}

function checkSavingConsent(){
  if(localStorage.getItem("savingConsentGiven")){
    saveTrip();
  }
  else{
    document.getElementById("consentSection").hidden = false;
  }
}
function saveTrip(){
  let ids = [];
  let names = [];
	hops.getLayers().forEach(item=>{
    ids.push(item.properties.place_id);
    names.push(item.properties.place_name);
  })
  let id = ids.join('-');
  let item = {"ids":ids,"names":names};
  if(localStorage.getItem("trips")){
    tripString = localStorage.getItem("trips");
    trips = JSON.parse(tripString);
    trips[id] = item;
    localStorage.setItem("trips", JSON.stringify(trips));
  }
  else{
    let trip = {};
    trip[id] = item;
    localStorage.setItem("trips", JSON.stringify(trip));
  }
  document.getElementById("tripMessage").innerHTML = "saved";
  setTimeout(() =>{document.getElementById("tripMessage").innerHTML = ""},3000);
  showSavedTrips();
}
function deleteSavedTrip(id){
  tripString = localStorage.getItem("trips");
  trips = JSON.parse(tripString);
  delete trips[id];
  tripString = JSON.stringify(trips);
  localStorage.setItem("trips",tripString);
  showSavedTrips();
}
function showSavedTrips(){
  document.getElementById("savedTripList").innerHTML = `<ul class="list-group list-group-flush"></ul>`;
  tripString = localStorage.getItem("trips");
  trips = JSON.parse(tripString);
	Object.entries(trips).forEach(trip=>{
    const [id, item] = trip;
    let routenames = item.names;
		summary = `<li class="list-group-item"><a href="#" onclick="showSavedTrip('${id}')">${routenames.join(">")}</a> <img src="./static/icons/delete.png" onclick="deleteSavedTrip('${id}')" title="remove" alt="remove"></li>`;
		document.getElementById("savedTripList").insertAdjacentHTML('beforeend',summary);
	});
}
function showSavedTrip(id){
  let tripString = localStorage.getItem("trips");
  let trips = JSON.parse(tripString);
  let trip = trips[id];
  let tripHops = trip.ids;

  hops.clearLayers();
  routeLines.clearLayers();
  //set starter marker
  place = all_places[tripHops[0]];
  my_icon = L.icon({iconUrl: `./static/icons/home.png`,iconSize: [36, 36], iconAnchor: [18,36]});
  marker = L.marker([place.place_lat, place.place_lon],{icon:my_icon});
  marker.properties = place;
  marker.properties.hop_count = 1;
  marker.bindTooltip(place.place_name);
  marker.addTo(hops);
  //add the rest
  for(let i=1;i<tripHops.length;i++){
    thisHop = all_places[tripHops[i]];
    lastHop = all_places[tripHops[i-1]];
    pointA = new L.LatLng(parseFloat(lastHop.place_lat), parseFloat(lastHop.place_lon));
    pointB = new L.LatLng(parseFloat(thisHop.place_lat), parseFloat(thisHop.place_lon));
    var pointList = [pointA, pointB];
    new_line = new L.Polyline(pointList, {color: '#ff6600ff',weight: 3,opacity: 0.5,smoothFactor: 1});
    new_line.addTo(routeLines);
  
    //add to the hops layer
    my_icon = L.icon({iconUrl: `./static/icons/triphop.png`,iconSize: [24, 24], iconAnchor: [12,24]});
    marker = L.marker([parseFloat(thisHop.place_lat), parseFloat(thisHop.place_lon)],{icon:my_icon});
    //add property for its count
    marker.properties = thisHop;
    marker.properties.from_place_id = lastHop.place_id;
    marker.properties.hop_count = i + 1;
    marker.bindTooltip(thisHop.place_name);
    marker.addEventListener('click', _hopOnClick);
    marker.addTo(hops);
  }
  getHops(tripHops[tripHops.length-1]);
  buildSummary();
  showHomeTab();
  document.getElementsByClassName("sidepanel-content-wrapper")[0].scrollTop = 0;
}
