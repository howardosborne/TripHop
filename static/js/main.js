var map;
var sidePanel;
//colours
var chosenHopsColour = "#563d7c";
var possibleHopsColour = "#FF7933";
var inspirePlacesColour = "#466600";
var circleSize = 10000;
var frogGreen = "#abc837ff";
var headingsColour = "";
//layers
var possible_start_points;
var possible_hops;
var route_lines;
var possible_trip;
var possible_trip_route_lines;
var popup;
var lastScrollTop = {};
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
var agency_lookup;

function start(){
    //make a map

    map = L.map('map').setView([45, 10], 5);
    const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {maxZoom: 19,attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'}).addTo(map);

		L.control.scale({position: 'topleft'}).addTo(map);
		L.control.zoom({position: 'bottomright'}).addTo(map);

		sidePanel = L.control.sidepanel('mySidepanelLeft', {
			tabsPosition: 'top',
			startTab: 'tab-home'
		}).addTo(map);

    //add the various layers to be used

    //possible_start_points = new L.LayerGroup();
    possible_start_points = L.markerClusterGroup({maxClusterRadius:40});
    map.addLayer(possible_start_points);

    //possible_hops = new L.LayerGroup();
    possible_hops = L.markerClusterGroup({maxClusterRadius:40});
    map.addLayer(possible_hops);
  
    hops = new L.LayerGroup();
    map.addLayer(hops);
    
    route_lines = new L.LayerGroup();
    map.addLayer(route_lines);

    possible_trip = new L.LayerGroup();
    map.addLayer(possible_trip);

    possible_trip_route_lines = new L.LayerGroup();
    map.addLayer(possible_trip_route_lines)  

    L.easyButton('<img src="./static/icons/resize.png">', function(btn, map){
      map.fitBounds(possible_hops.getBounds())
    }).addTo(map);

    getAllHops();
    getAgencyLookup()
    getTrips();
    showHome();
    //showSplash();
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
      spc[i].classList.remove("active")
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

function showSplash(){
  var text = `<img src="./static/icons/logo.png" class="card-img-top" alt="" title="">
  <div>
    <h2 class="text-center" style="font-family: 'Cantora One', Arial; font-weight: 700; vertical-align: baseline; color:#ff6600ff" >Plan your next trip</h2>
    <h2 class="text-center" style="font-family: 'Cantora One', Arial; font-weight: 700; vertical-align: baseline; color:#abc837ff"><em> one hop at a time</em></h2>
    <p class="text-center">Pick a place and see where you can go in a single hop - stay for as little or long as you like and move on.</p>
    <p class="text-center">Want some inspiration? Start with an <a class="h5 triphop sidebar-tab-link" href="#" role="tab" data-tab-link="tab-inspire"  onclick="showSidepanelTab('tab-inspire')">inspired idea</a> and customise it. </p>
    </div>`;
  popup = L.popup().setLatLng([40,10]).setContent(text).openOn(map); 

  //const myModal = new bootstrap.Modal(document.getElementById("splashModal"));
  //myModal.show();
}

function getStartPoints(){
  var url = "./static/places.json";

  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function() {
  if (this.readyState == 4 && this.status == 200) {
    all_places = JSON.parse(this.responseText);
    Object.entries(all_places).forEach((entry) => {
      const [id, place] = entry;
      if(id in all_hops){
        //var marker = L.circle([place.place_lat, place.place_lon], {color: inspirePlacesColour, fillColor: inspirePlacesColour,fillOpacity: 0.5,radius: 10000});
        var my_icon = L.icon({iconUrl: `./static/icons/home.png`,iconSize: [36, 36], iconAnchor: [18,36]});
        var marker = L.marker([place.place_lat, place.place_lon],{icon:my_icon});
          //var marker = L.marker([place.place_lat, place.place_lon]);
        marker.bindTooltip(decodeURI(place.place_name));
        marker.properties = place;
        marker.addEventListener('click', _starterMarkerOnClick);
        marker.addTo(possible_start_points)
      }
    });
  }};

  xmlhttp.open("GET", url, true);
  xmlhttp.send();
}

function getAllHops(){
  var xmlhttp = new XMLHttpRequest();
  var url = `./static/hops.json`;
  xmlhttp.onreadystatechange = function() {
  if (this.readyState == 4 && this.status == 200) {
    var response = JSON.parse(this.responseText);
    all_hops = response;
    //now we have a set of hops we can show the start points
    getStartPoints();
  }};

  xmlhttp.open("GET", url, true);
  xmlhttp.send();
}

function getAgencyLookup(){
  var xmlhttp = new XMLHttpRequest();
  var url = `./static/agency_lookup.json`;
  xmlhttp.onreadystatechange = function() {
  if (this.readyState == 4 && this.status == 200) {
    var response = JSON.parse(this.responseText);
    agency_lookup = response;
    //now we have a set of hops we can show the start points
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
      <div class="col">
      <div class="card">
        <img src="${trip["trip_image"]}" class="card-img-top" alt="...">
        <div class="card-img-overlay">
          <a href="#" class="triptitle" onclick="showRoute('${id}')">${trip.trip_title}</a>
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
  map.flyTo([place.place_lat, place.place_lon], 9);
}

function showTripParts(id){
  document.getElementById(`inspireDetailsBody`).innerHTML = "";
  document.getElementById(`inspireTitle`).innerHTML = trips[id].trip_title;
  var trip_hops = trips[id]["hops"];
  for(var i=0;i<trip_hops.length;i++){
    place = all_places[trip_hops[i]["place_id"]];
    var element = `
    <div class="card mb-3">
      <img src="${trip_hops[i]["hop_image"]}" class="img-fluid rounded-start" alt="..." title="${trip_hops[i]["hop_image_attribution"]}">
      <div class="card-text">
      <h4 style="font-family: 'Cantora One', Arial; font-weight: 700; vertical-align: baseline; color:#ff6600ff">${place["place_name"]}</h4>
      <p class="card-text">${trip_hops[i]["hop_description"]}</p>
      <a target="_blank" href="${trip_hops[i]["link"]}">${trip_hops[i]["link_text"]}</a>
      </div>
    </div>`
    document.getElementById(`inspireDetailsBody`).insertAdjacentHTML('beforeend', element);
  }
  var element = `<button class="btn btn-success" data-bs-dismiss="offcanvas" onclick="customise(${id})">Add hop</button>`;
  var element = `<img src="./static/icons/customise.png"  data-bs-dismiss="offcanvas"  class="card-img-top" alt="..."  onclick="customise(${id})"></img>`;
  document.getElementById(`inspireDetailsBody`).insertAdjacentHTML('beforeend', element);
  showSidepanelTab('tab-inspire-details');
}

function showHome(){
  if(hops.getLayers().length > 0){
    buildSummary();
    document.getElementById("homeWelcome").hidden=true;
    document.getElementById("welcomeMessage").hidden=true;
    showSidepanelTab('tab-home');
  }
   else{
    document.getElementById("homeWelcome").hidden=false;
    document.getElementById("welcomeMessage").hidden=false;
    showSidepanelTab('tab-home');
  }
}

function _starterMarkerOnClick(e) {
  //add home layer
  var my_icon = L.icon({iconUrl: `./static/icons/home.png`,iconSize: [36, 36], iconAnchor: [18,36]});
  var marker = L.marker([e.latlng.lat, e.latlng.lng],{icon:my_icon});
  //var marker = L.circle([e.latlng.lat, e.latlng.lng], {color: inspirePlacesColour, fillColor: inspirePlacesColour,fillOpacity: 0.5,radius: circleSize});
  marker.properties = e.sourceTarget.properties;
  marker.properties.hop_count = 1;
  marker.bindTooltip(marker.properties.place_name);
  marker.addTo(hops);

  //remove potential start points
  possible_start_points.clearLayers();
  get_hops(e.sourceTarget.properties.place_id);
  var popupText = `<h6 class="text-center" style="font-family: 'Cantora One', Arial; font-weight: 700; vertical-align: baseline; color:#ff6600ff" >Where next?</h6>
    <p class="text-center">Here are some places you can get to from ${marker.properties.place_name} in a single hop.</p>
    `  
  //showWholeMap();
  showHome();
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
    <div class="card mb-3">
     <img src="${place.place_image}" class="img-fluid rounded-start" style="max-height:250px" alt="..." title = "${place.image_attribution}">
     <div class="card-img-overlay">
       <div class="row justify-content-evenly"><div class="col"><a href="#" class="h3" style="font-family: 'Cantora One', Arial; font-weight: 700; vertical-align: baseline; color:white; text-shadow:-1px 1px 0 #000, 1px 1px 0 #000; " onclick="openPlaceDetails('${place.place_id}')">${place.place_name}</a></div><div class="col-3"><button type="button" class="btn btn-success btn-sm" onclick="_addToTrip()">Add</button></div></div>
     </div>
     <ul class="list-group list-group-flush">
      <li class="list-group-item">${decodeURIComponent(place.place_brief_desc)} <a href="#" onclick="showSidepanelTab('tab-place')"> more...</a></li>
      <li class="list-group-item">Journey times from: ${format_duration(candidate_hop.duration_min)} <a href="#" onclick="showSidepanelTab('tab-travel-details')"> more...</a></li>
     </ul>
    </div>`
//openPlaceDetails();
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
  <div class="card mb-3">
  <img src="${place.place_image}" class="img-fluid rounded-start" alt="..." title = "${place.image_attribution}">
  <div class="card-img-overlay">
    <div class="row justify-content-evenly"><div class="col"><a href="#" class="h3" style="font-family: 'Cantora One', Arial; font-weight: 700; vertical-align: baseline; color:white; text-shadow:-1px 1px 0 #000, 1px 1px 0 #000; " onclick="openPlaceDetails('${place.place_id}')">${place.place_name}</a></div><div class="col-4"><button type="button" class="btn btn-success btn-sm" onclick="_addToTrip()">Add</button></div></div>
  </div>
  <ul class="list-group list-group-flush">
   <li class="list-group-item">${decodeURIComponent(place.place_brief_desc)} <a data-bs-toggle="offcanvas" href="#offcanvasPlace" aria-controls="offcanvasPlace"> more...</a></li>
   <li class="list-group-item">Journey times from: ${format_duration(travel_details.duration_min)} <a data-bs-toggle="offcanvas" href="#offcanvasTravelDetails" aria-controls="offcanvasTravelDetails"> more...</a></li>
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
  document.getElementById("travel_details_body").innerHTML = block;

  //check if last element
  if(hop.next_hop_index == possible_trip.getLayers().length){
    //var button = `<button class="btn btn-success" onclick="get_hops('${place.place_id}')">Add Hop</button>`;
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
  var hop = possible_trip.getLayers()[index];
  //zoomToPlace(hop.properties.place_id);
  hop.fireEvent('click');
}


function _addToTrip(){
  //they've chose to add the previewed place
  if(popup){popup.close();}
  showHome();
  hops_items = hops.getLayers();
  var last_hop;
  //if(hops_items.length > 0){
  last_hop = all_places[hops_items[hops_items.length-1].properties.place_id];
  //}
  //else{last_hop = start_point.properties;}
  pointA = new L.LatLng(parseFloat(last_hop.place_lat), parseFloat(last_hop.place_lon));
  pointB = new L.LatLng(parseFloat(candidate_hop.place_lat), parseFloat(candidate_hop.place_lon));
  var pointList = [pointA, pointB];
  new_line = new L.Polyline(pointList, {color: '#ff6600ff',weight: 3,opacity: 0.5,smoothFactor: 1});
  new_line.addTo(route_lines);

  //add to the hops layer
  //var marker = L.circle([parseFloat(candidate_hop.place_lat), parseFloat(candidate_hop.place_lon)], {color: chosenHopsColour, fillColor: chosenHopsColour,fillOpacity: 0.5,radius: circleSize});
  var my_icon = L.icon({iconUrl: `./static/icons/triphop.png`,iconSize: [24, 24], iconAnchor: [12,24]});
  var marker = L.marker([parseFloat(candidate_hop.place_lat), parseFloat(candidate_hop.place_lon)],{icon:my_icon});
  //add property for its count
  hop = all_places[candidate_hop.place_id];
  marker.properties = hop;
  marker.properties.from_place_id = last_hop.place_id;
  marker.properties.hop_count = hops_items.length + 1;
  marker.bindTooltip(hop.place_name);
  marker.addEventListener('click', _hopOnClick);
  marker.addTo(hops);
  get_hops(candidate_hop.place_id);
  buildSummary();
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
    if(agency_name in agency_lookup){
      agency_url = agency_lookup[agency_name];
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

function get_hops(id){
  possible_hops.clearLayers();
  hops_obj = all_hops[id].hops;
  Object.entries(hops_obj).forEach((entry) => {
    const [id, hop] = entry;
    //var marker = L.circle([hop.place_lat, hop.place_lon],{color: possibleHopsColour,fillColor: possibleHopsColour,fillOpacity: 0.5,radius: 10000});
    var my_icon = L.icon({iconUrl: `./static/icons/hop.png`,iconSize: [36, 36], iconAnchor: [18,36]});
    var marker = L.marker([hop.place_lat, hop.place_lon],{icon:my_icon});
    //var marker = L.marker([hop.place_lat, hop.place_lon]);
    marker.bindTooltip(`${hop.place_name} - travel time: ${format_duration(hop.duration_min)}`);
    marker.properties = hop;
    marker.addEventListener('click', _markerOnClick);
    marker.riseOnHover = true;
    marker.addTo(possible_hops)
  });
}

function removeHop(hop_item){
  if(popup){popup.close();}
  var hops_layers = hops.getLayers();
  var ubound = hops_layers.length;
  for(var i=hop_item;i<ubound;i++){
    h = hops.getLayers();
    hops.removeLayer(h[h.length - 1]._leaflet_id);
    layers = route_lines.getLayers();
    route_lines.removeLayer(layers[layers.length - 1]._leaflet_id);
  };
  var hops_layers = hops.getLayers();
  var id = hops_layers[hops_layers.length - 1].properties.place_id;
  possible_hops.clearLayers();
  get_hops(id);
  buildSummary();
}

function format_duration(mins){
  //mins = secs/60
  remainder =  mins % 60;
  str_remainder = remainder.toString();
  hours = (mins - remainder) / 60;
  return(hours.toString() + ":" + str_remainder.padStart(2, '0'));
}

function openTravelDetails(from_place_id, to_place_id){
  var travel_details = get_travel_details(from_place_id, to_place_id);
  var block = get_travel_details_block(travel_details.details);
  document.getElementById("travel_details_body").innerHTML = block;
  showSidepanelTab('tab-travel-details');
  //open_offcanvas('offcanvasTravelDetails');

}

function openPlaceDetails(place_id){
  place = all_places[place_id];
  var place_block = get_place_details_block(place.place_id);
  document.getElementById("place_body").innerHTML = place_block;
  showSidepanelTab('tab-place');
  //open_offcanvas('offcanvasPlace');
}

function showRoute(routeId){
  possible_end_points.clearLayers();
  possible_start_points.clearLayers();  
  possible_trip.clearLayers();
  possible_trip_route_lines.clearLayers();
  hops.clearLayers();
  route_lines.clearLayers();
  //need to go through each part of the route and add to the map
  var trip = trips[routeId]["hops"];
  var hop = all_places[trip[0].place_id];
  //var marker = L.circle([parseFloat(hop.place_lat), parseFloat(hop.place_lon)], {color: inspirePlacesColour, fillColor: inspirePlacesColour,fillOpacity: 0.5,radius: circleSize});
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
  starter_marker.addTo(possible_trip);

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
    marker.addTo(possible_trip);

    pointA = new L.LatLng(parseFloat(all_places[trip[i-1].place_id].place_lat), parseFloat(all_places[trip[i-1].place_id].place_lon));
    pointB = new L.LatLng(parseFloat(all_places[trip[i].place_id].place_lat), parseFloat(all_places[trip[i].place_id].place_lon));
    var pointList = [pointA, pointB];
    new_line = new L.Polyline(pointList, {color: '#ff6600ff',weight: 3,opacity: 0.5,smoothFactor: 1});
    new_line.addTo(possible_trip_route_lines);  
  }
  hideSidepanal();
  //starter_marker.fireEvent('click')
  showTripParts(routeId)
}
function customise(id){
  useThisRoute(id);
  //showSidepanelTab("tab-home");
}
function useThisRoute(routeId){
  //check if hops empty if not then do something?
  //if(hops.getLayers().length > 0){}
  hops.clearLayers();
  route_lines.clearLayers();
  if(popup){popup.close();}
  var trip = trips[routeId]["hops"];
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
    //var marker = L.marker([hop.place_lat, hop.place_lon],{icon:my_icon}).addTo(map);
    //var marker = L.circle([parseFloat(hop.place_lat), parseFloat(hop.place_lon)], {color: chosenHopsColour, fillColor: chosenHopsColour,fillOpacity: 0.5,radius: circleSize});  
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
    new_line.addTo(route_lines);  
  }
  get_hops(trip[trip.length-1].place_id);
  possible_trip.clearLayers();
  possible_trip_route_lines.clearLayers();
  showHome();
}

function startAgain(){
  document.getElementById("freestyleBody").innerHTML = "";
  showFreestyle();
}

function buildSummary(){
  hops_items = hops.getLayers();
  document.getElementById("freestyleBody").innerHTML = `<div class="row justify-content-evenly"><div class="col-7"><h5 style="font-family: 'Cantora One', Arial; font-weight: 700; vertical-align: baseline; color:#ff6600ff">Starting at ${hops_items[0].properties.place_name}</h5></div><div class="col" style="float: right;"><button style="float: right;" class="btn btn-outline-success btn-sm" onclick="startAgain()">start again</button></div></div>`;
  for(var i=1;i< hops_items.length;i++){
    var removalElement = "";
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

    let nextHops = possible_hops.getLayers()
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
  map.fitBounds([possible_trip.getLayers()[0].getLatLng(),possible_trip.getLayers()[possible_trip.getLayers().length-1].getLatLng()])
}

function showWholeMap(){
  map.fitBounds(possible_hops)
}

function loadScript(src, parentId){
  var tag = document.createElement("script");
  tag.src = src;
  document.getElementById(parentId)[0].appendChild(tag);
}

function open_offcanvas(offcanvas){
  if(popup){popup.close();}
  hideSidepanal();
  var of = document.getElementById(offcanvas);
  var offcanvas = new bootstrap.Offcanvas(of);
  offcanvas.toggle();
}

function popupHop(place_id) {
  //loop through the possible hops
  let ph = possible_hops.getLayers();
  for(let i=0;i<ph.length;i++){
    if(ph[i].properties.place_id ==place_id){
      candidate_hop = ph[i].properties;
    }
  }
  //get the properties of the place marked
  place = all_places[candidate_hop.place_id];

  var place_block = get_place_details_block(candidate_hop.place_id);
  document.getElementById("place_body").innerHTML = place_block;
  // unpack the travel details
  var block = get_travel_details_block(candidate_hop.details);
  document.getElementById("travel_details_body").innerHTML = block;

  popup_text = `
    <div class="card mb-3">
     <img src="${place.place_image}" class="img-fluid rounded-start" style="max-height:250px" alt="..." title = "${place.image_attribution}">
     <div class="card-img-overlay">
       <div class="row justify-content-evenly"><div class="col"><a href="#" class="h3" style="font-family: 'Cantora One', Arial; font-weight: 700; vertical-align: baseline; color:white; text-shadow:-1px 1px 0 #000, 1px 1px 0 #000; " onclick="openPlaceDetails('${place.place_id}')">${place.place_name}</a></div><div class="col-3"><button type="button" class="btn btn-success btn-sm" onclick="_addToTrip()">Add</button></div></div>
     </div>
     <ul class="list-group list-group-flush">
      <li class="list-group-item">${decodeURIComponent(place.place_brief_desc)} <a href="#" onclick="showSidepanelTab('tab-place')"> more...</a></li>
      <li class="list-group-item">Journey times from: ${format_duration(candidate_hop.duration_min)} <a href="#" onclick="showSidepanelTab('tab-travel-details')"> more...</a></li>
     </ul>
    </div>`
  hideSidepanal();
  popup = L.popup().setLatLng([place.place_lat,place.place_lon]).setContent(popup_text).openOn(map); 

}