var possible_end_points;
var start_point;
var destination;
var possible_routes = {};
var possible_route_lines = {};
var ft;
var ftp;
var destinationSelect;

function destinationStart(){
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

  possible_end_points = L.markerClusterGroup({maxClusterRadius:40});
  map.addLayer(possible_end_points);

  start_point = new L.LayerGroup();
  map.addLayer(start_point);

  destination = new L.LayerGroup();
  map.addLayer(destination);

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

  getAllPlaces();
  getAgencyLookup();
  getTrips();
  showHome();
}

function getAllPlaces(){
  var url = "./static/places.json";
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function() {
  if (this.readyState == 4 && this.status == 200) {
    all_places = JSON.parse(this.responseText);
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
    addPlaceMarkersToMap();
  }};
  xmlhttp.open("GET", url, true);
  xmlhttp.send(); 
}

function addPlaceMarkersToMap(){
  clearAllLayers();
  placeSelect = {};
    Object.entries(all_places).forEach((entry) => {
      const [id, place] = entry;
      if(id in all_hops){
        let my_icon = L.icon({iconUrl: `./static/icons/destination.png`,iconSize: [36, 36], iconAnchor: [18,36]});
        let marker = L.marker([place.place_lat, place.place_lon],{icon:my_icon});
        marker.bindTooltip(decodeURI(place.place_name));
        marker.properties = place;
        marker.addEventListener('click', _placeMarkerOnClick);
        marker.addTo(possible_end_points)
        
        if(place.place_country in placeSelect){placeSelect[place.place_country].push(place);}
        else{placeSelect[place.place_country] = [place];} 
      }
    });
    let selectOption = {};
    let selectData = {"results":[],"pagination":{"more": true}};
    Object.entries(placeSelect).forEach((entry) => {
      const [id, country] = entry;
      let selectOptGroup = {"text": id, "children" : []};
      selectOption += `<optgroup label="${id}">`;
      for(let i=0;i<country.length;i++){
        selectOptGroup.children.push({"id": country[i].place_id,"text": country[i].place_name});
        selectOption += `<option value="${country[i].place_id}">${country[i].place_name}</option>`;
      }
      selectOption += "</optgroup>";
      selectData.results.push(selectOptGroup);
    });
    document.getElementById("destinationSelect").innerHTML = selectOption;
    document.getElementById("destinationSelect").value = "spain_1"
    document.getElementById("startSelect").innerHTML = selectOption;
    document.getElementById("startSelect").value = "uk_1"
}

function _placeMarkerOnClick(e) {
  //get the properties of the place marked
  candidate_hop = e.sourceTarget.properties;
  place = all_places[candidate_hop.place_id];

  var place_block = get_place_details_block(candidate_hop.place_id);
  document.getElementById("place_body").innerHTML = place_block;

  popup_text = `
    <div class="card mb-3">
     <img src="${place.place_image}" class="img-fluid rounded-start" style="max-height:250px" alt="..." title = "${place.image_attribution}">
     <div class="card-img-overlay">
      <div class="row justify-content-evenly">
      <div class="col">
        <a href="#" class="h3" style="font-family: 'Cantora One', Arial; font-weight: 700; vertical-align: baseline; color:white; text-shadow:-1px 1px 0 #000, 1px 1px 0 #000; " onclick="openPlaceDetails('${place.place_id}')">${place.place_name}</a>
        <button type="button" class="btn btn-success btn-sm" onclick="_setStartpoint('${place.place_id}')">Start</button>
        <button type="button" class="btn btn-success btn-sm" onclick="_setDestination('${place.place_id}')">Destination</button>
      </div>
       </div>
     </div>
     <ul class="list-group list-group-flush">
      <li class="list-group-item">${decodeURIComponent(place.place_brief_desc)} <a href="#" onclick="showSidepanelTab('tab-place')"> more...</a></li>
     </ul>
    </div>`
  popup = L.popup().setLatLng([e.latlng.lat,e.latlng.lng]).setContent(popup_text).openOn(map); 
}

function _setStartpoint(place_id){
  document.getElementById("startSelect").value = place_id;
  /*
  possible_end_points.clearLayers();
  place = all_places[place_id];
  var my_icon = L.icon({iconUrl: `./static/icons/home.png`,iconSize: [36, 36], iconAnchor: [18,36]});
  var marker = L.marker([place.place_lat, place.place_lon],{icon:my_icon});
  marker.bindTooltip(decodeURI(place.place_name));
  marker.properties = place;
  marker.addEventListener('click', _existingStartpointMarkerOnClick);
  marker.addTo(start_point);
  */
}

function _setDestination(place_id){
  document.getElementById("destinationSelect").value = place_id;
  /*
  possible_end_points.clearLayers();
  place = all_places[place_id];
  var my_icon = L.icon({iconUrl: `./static/icons/destination.png`,iconSize: [36, 36], iconAnchor: [18,36]});
  var marker = L.marker([place.place_lat, place.place_lon],{icon:my_icon});
  marker.bindTooltip(decodeURI(place.place_name));
  marker.properties = place;
  marker.addEventListener('click', _existingDestinationMarkerOnClick);
  marker.addTo(destination);
  */
}

function _existingStartpointMarkerOnClick(){
  console.log("clicked _existingStartpointMarkerOnClick")
}

function _existingDestinationMarkerOnClick(){
  console.log("clicked _existingDestinationMarkerOnClick")
}

function getStartPointsForDestination(destination_place_id){
    Object.entries(all_places).forEach((entry) => {
      const [id, place] = entry;
      if(id in all_hops && id != destination_place_id){
        var my_icon = L.icon({iconUrl: `./static/icons/home.png`,iconSize: [36, 36], iconAnchor: [18,36]});
        var marker = L.marker([place.place_lat, place.place_lon],{icon:my_icon});
        marker.bindTooltip(decodeURI(place.place_name));
        marker.properties = place;
        marker.addEventListener('click', _starterForDestinationMarkerOnClick);
        marker.addTo(possible_start_points)
      }
    });
  //map.fitBounds(possible_start_points);
  popup_text = `Pick a start point!`;
  popup = L.popup().setLatLng([place.place_lat, place.place_lon]).setContent(popup_text).openOn(map); 
}

function _starterForDestinationMarkerOnClick(e) {
  document.getElementById("startSelect").value = e.sourceTarget.properties.place_id;
  var my_icon = L.icon({iconUrl: `./static/icons/home.png`,iconSize: [36, 36], iconAnchor: [18,36]});
  var marker = L.marker([e.latlng.lat, e.latlng.lng],{icon:my_icon});
  marker.properties = e.sourceTarget.properties;
  marker.properties.hop_count = 1;
  marker.bindTooltip(marker.properties.place_name);
  marker.addTo(start_point);

  //remove potential start points
  possible_start_points.clearLayers();
  searchRoutes();
}

function searchRoutes(){
  if(popup){popup.close();}
  possible_end_points.clearLayers();
  let from_place_id = document.getElementById("startSelect").value;
  let to_place_id = document.getElementById("destinationSelect").value;

  if(from_place_id == to_place_id || from_place_id=="" || to_place_id==""){
    //not sure how to handle this
    console.log(`dodgy ${from_place_id}`)
  }
  else{
    //possible_end_points.clearLayers();
    //possible_start_points.clearLayers();
    hops.clearLayers();
    start_point.clearLayers();
    destination.clearLayers();
    route_lines.clearLayers();
    possible_trip.clearLayers();
    possible_trip_route_lines.clearLayers();
    possible_hops.clearLayers();


    //need to do something to clear previous possible routes?
    //possible_routes = {}

    let my_icon = L.icon({iconUrl: `./static/icons/home.png`,iconSize: [36, 36], iconAnchor: [18,36]});
    let marker = L.marker([all_places[from_place_id].place_lat, all_places[from_place_id].place_lon],{icon:my_icon});
    marker.properties = all_places[from_place_id];
    marker.bindTooltip(marker.properties.place_name);
    marker.addTo(start_point);

    my_icon = L.icon({iconUrl: `./static/icons/destination.png`,iconSize: [36, 36], iconAnchor: [18,36]});
    marker = L.marker([all_places[to_place_id].place_lat, all_places[to_place_id].place_lon],{icon:my_icon});
    marker.properties = all_places[to_place_id];
    marker.bindTooltip(marker.properties.place_name);
    marker.addTo(destination);

    let maxHops = 4;
    ft = fromTo(from_place_id,to_place_id,maxHops);
    
    if (ft.length == 0){
      console.log("upping journey time to 9 hours");
      ft = fromTo(from_place_id,to_place_id,4,maxHopTime=540);
    }
    if (ft.length == 0){
      console.log("upping search to 6 hops");
      ft = fromTo(from_place_id,to_place_id,6,maxHopTime=540);
    }
    if (ft.length == 0){
      console.log("upping search to 9 hops and 12 hours");
      ft = fromTo(from_place_id,to_place_id,9,maxHopTime=720);
    }

    ftp = ft.sort(compare);
   let filterablePlaces = [];
    document.getElementById("fromToResults").innerHTML = "";
    for(let i=0;i<ftp.length;i++){
      let journeyFeatures = {"possibleRouteTitle": "","maxHopTime": 0,"noHops": 0,
      "minJourneyTime":0, "hopTags": [],"transportTypes": [],"places":[]};
        journeyFeatures.noHops = ftp[i].length - 1;
        let resultSummary = "";
        for(let j=0;j<ftp[i].length;j++){
        //take each item and put on map and write it in a collapsable list/accordion
        journeyFeatures.possibleRouteTitle += `${ftp[i][j].place_name} `;
        if (!filterablePlaces.includes(ftp[i][j].place_name)){
          filterablePlaces.push(ftp[i][j].place_name)}
        journeyFeatures.places.push(ftp[i][j].place_id);
        place = all_places[ftp[i][j].place_id];
        if(place.place_tags){journeyFeatures.hopTags.push(place.place_tags)}
        let duration = parseFloat(ftp[i][j].duration_min);
        if(j>0){resultSummary+= `
        <div class="row">
          <div class="col">
            <a href="#" onclick="popupPlace('${ftp[i][j].place_id}')">${ftp[i][j].place_name}</a>
          </div>
          <div class="col"><a href="#" onclick="openTravelDetails('${ftp[i][j-1].place_id}', '${ftp[i][j].place_id}')">journey time: ${format_duration(duration)}</a>
          </div>
        </div>`}
        if(duration){
          journeyFeatures.minJourneyTime += duration;
          if(duration > journeyFeatures.maxHopTime){journeyFeatures.maxHopTime = duration};
        }
      }
      //fill a card
      let element = `
      <div class="col">
        <div class="card result ${journeyFeatures.possibleRouteTitle}" onmouseover="showPossibleRoute('${i}')">
          <div class="card-header">
            <a href="#" onclick="hideSidepanal()">${journeyFeatures.possibleRouteTitle}</a>
          </div>
          <div class="card-body">
            ${resultSummary}
          </div>
      </div>
      `
      document.getElementById("fromToResults").insertAdjacentHTML('beforeend', element);
    }
    //need to add summary block with filter
    //if no hops found ask to run with more journey time?
  let  filterablePlacesElements = "";
  for(let i=0;i<filterablePlaces.length;i++){
    filterablePlacesElements += `<option value="${filterablePlaces[i]}">${filterablePlaces[i]}</option>`
  }
   let summaryBlock =  `<div class="col">
     <div class="card">
       <div class="card-body">
         Routes found: ${ftp.length}
       </div>
       <!--<div class="card-body">
       <label> Show routes including (coming soon):
        <select name="hops" multiple size="1" disabled>
         ${filterablePlacesElements}
         </select>
       </label>
       <label> 
         Max journey time between hops (coming soon):
         <input id="maxTimeFilter" type="range" min="120" max="720" value="360" step="60" disabled>
         </label>
         <span id="maxTimeFilterValue"></span>
         </div>-->
   </div>`;
   document.getElementById("fromToResults").insertAdjacentHTML('afterbegin', summaryBlock);
   //document.getElementById("maxTimeFilterValue").innerHTML = document.getElementById("maxTimeFilter").value;
   //input.document.getElementById("maxTimeFilter").addEventListener("input", (event) => {
   //document.getElementById("maxTimeFilterValue").innerHTML = event.target.value;
   //});
    showHome();
}
}

function showPossibleRoutes(){
  let from_place_id = start_point.getLayers()[0].properties.place_id;
  let to_place_id = destination.getLayers()[0].properties.place_id;
  //need to do something to clear previous possible routes?
  //possible_routes = {}

  let maxHops = 3;
  ft = fromTo(from_place_id,to_place_id,maxHops);
  while(ft.length < 10){
    maxHops += 1;
    console.log(`${ft.length} routes found: looking for ${maxHops} hops`);
    ft = fromTo(from_place_id,to_place_id,maxHops);
    if(maxHops>10){
      console.log(`max hops exceeded ${maxHops}`);
      break;
    }
  }
  
  document.getElementById("fromToBody").innerHTML = `
  <div class="row justify-content-evenly">
    <div class="col-7">
      <h5 style="font-family: 'Cantora One', Arial; font-weight: 700; vertical-align: baseline; color:#ff6600ff">
      From ${start_point.getLayers()[0].properties.place_name} to ${destination.getLayers()[0].properties.place_name}</h5>
    </div>
  </div>`;
  ftp = ft.sort(compare);
  let resultFilters = { "maxHopTime": 1200,"noHops": 10,
  "maxJourneyTime":12000, "hopTags": [],
  "transportTypes": ["train","bus","ferry","nighttrain","nightferry"]};
  for(let i=0;i<ftp.length;i++){
    let journeyFeatures = {"possibleRouteTitle": "","maxHopTime": 0,"noHops": 0,
    "minJourneyTime":0, "hopTags": [],"transportTypes": [],"places":[]};
      journeyFeatures.noHops = ftp[i].length - 1;
      for(let j=0;j<ftp[i].length;j++){
      //take each item and put on map and write it in a collapsable list/accordion
      journeyFeatures.possibleRouteTitle += `${ftp[i][j].place_name} `;
      journeyFeatures.places.push(ftp[i][j].place_id);
      place = all_places[ftp[i][j].place_id];
      if(place.place_tags){journeyFeatures.hopTags.push(place.place_tags)}
      let duration = parseFloat(ftp[i][j].duration_min);
      if(duration){
        journeyFeatures.minJourneyTime += duration;
        if(duration > journeyFeatures.maxHopTime){journeyFeatures.maxHopTime = duration};
      }
    }
    //fill a card
    let element = `
    <div class="col">
      <div class="card">
        <div class="card-header">
          <a href="#" onclick="showPossibleRoute('${i}')">${journeyFeatures.possibleRouteTitle}</a>
        </div>
        <div class="card-body">
          <div class="row">
            <div class="col">Maximum journey: ${format_duration(journeyFeatures.maxHopTime)}</div>  
            <div class="col">Total journey time: ${format_duration(journeyFeatures.minJourneyTime)}</div>
          </div>
        </div>
    </div>
    `
    document.getElementById("fromToBody").insertAdjacentHTML('beforeend', element);
  }
  showHome();
}

function showPossibleRoute(routeId){
  possible_start_points.clearLayers();  
  possible_trip.clearLayers();
  possible_trip_route_lines.clearLayers();
  hops.clearLayers();
  route_lines.clearLayers();
  //need to go through each part of the route and add to the map
  var trip = ftp[routeId];
  var hop = all_places[trip[0].place_id];
  var my_icon = L.icon({iconUrl: `./static/icons/home.png`, iconSize: [36, 36], iconAnchor: [18,36]});
  var starter_marker = L.marker([parseFloat(hop.place_lat), parseFloat(hop.place_lon)],{icon:my_icon});
  starter_marker.bindTooltip(decodeURI(hop.place_name));
  hop.hop_image = trip[0].place_image;
  hop.hop_image_attribution = trip[0].image_attribution;
  hop.hop_description = trip[0].place_brief_desc;
  hop.link = trip[0].place_links;
  hop.link_text = "more info";
  hop.trip_id = routeId;
  hop.next_hop_index = 1;
  starter_marker.properties = hop;
  starter_marker.addEventListener('click', _startInspireHopOnClick);
  starter_marker.riseOnHover = true;
  starter_marker.addTo(possible_trip);

  document.getElementById(`fromToDetailsBody`).innerHTML = `
  <div class="row justify-content-evenly">
    <div class="col-7">
      <h5 style="font-family: 'Cantora One', Arial; font-weight: 700; vertical-align: baseline; color:#ff6600ff">
      Starting at ${hop.place_name}</h5>
    </div>
  </div>`;

  for(var i=1;i<trip.length;i++){
    hop = all_places[trip[i].place_id];
    hop.from_place_id = trip[i-1].place_id;
    hop.hop_count = i;
    let my_icon = L.icon({iconUrl: `./static/icons/triphop.png`, iconSize: [24, 24], iconAnchor: [12,24]});
    let marker = L.marker([parseFloat(hop.place_lat), parseFloat(hop.place_lon)],{icon:my_icon});
    marker.bindTooltip(hop.place_name);
    //need to add trip items
    hop.hop_image = hop.place_image;
    hop.hop_image_attribution = hop.image_attribution;
    hop.hop_description = hop.place_brief_desc;
    hop.link = hop.place_links;
    hop.link_text = "more info";
    hop.trip_id = routeId;
    hop.next_hop_index = i + 1;
    marker.properties = hop;
 
    marker.addEventListener('click', _routeHopOnClick);
    marker.riseOnHover = true;
    marker.addTo(possible_trip);

    pointA = new L.LatLng(parseFloat(all_places[trip[i-1].place_id].place_lat), parseFloat(all_places[trip[i-1].place_id].place_lon));
    pointB = new L.LatLng(parseFloat(all_places[trip[i].place_id].place_lat), parseFloat(all_places[trip[i].place_id].place_lon));
    let pointList = [pointA, pointB];
    new_line = new L.Polyline(pointList, {color: '#ff6600ff',weight: 3,opacity: 0.5,smoothFactor: 1});
    new_line.addTo(possible_trip_route_lines);
    let element =`
    <div class="card border-light mb-3 ">
    <div class="row g-0">
      <div class="col-md-12">
        <img src="./static/icons/train.png" class="img-fluid rounded-start" alt="...">
        <a href="#" class="link-dark link-offset-2" onclick="openTravelDetails('${trip[i-1].place_id}','${trip[i].place_id}')">${all_places[trip[i-1].place_id].place_name} to ${all_places[trip[i].place_id].place_name} travel options</a>
       </div>
    </div>
    </div>`;
    document.getElementById(`fromToDetailsBody`).insertAdjacentHTML('beforeend', element);

    element = `
    <div class="card mb-3">
      <img src="${hop.place_image}" class="img-fluid rounded-start" alt="..." title="${hop.image_attribution}">
      <div class="card-text">
      <h4 style="font-family: 'Cantora One', Arial; font-weight: 700; vertical-align: baseline; color:#ff6600ff">${hop.place_name}</h4>
      <p class="card-text">${hop.place_brief_desc}</p>
      <a target="_blank" href="${hop.place_links}">${hop.link_text}</a>
      </div>
    </div>`;
    document.getElementById(`fromToDetailsBody`).insertAdjacentHTML('beforeend', element);

  }
  //showSidepanelTab('tab-fromto-details');
}

function _routeHopOnClick(e) {
  var hop = e.sourceTarget.properties;
  place = all_places[hop.place_id];
  var place_block = get_place_details_block(place.place_id);
  document.getElementById("place_body").innerHTML = place_block;
  var travel_details = get_travel_details(hop.from_place_id,hop.place_id)
  var block = get_travel_details_block(travel_details.details);
  document.getElementById("travel_details_body").innerHTML = block;

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

function showDestHome(){
  showSidepanelTab('tab-home');
}

function showFromTo(){
  document.getElementById("fromToBody").hidden=false;
  document.getElementById("homeWelcome").hidden=true;
}

function clearAllLayers(){
  hops.clearLayers();
  start_point.clearLayers();
  destination.clearLayers();
  route_lines.clearLayers();
  possible_trip.clearLayers();
  possible_trip_route_lines.clearLayers();
  possible_hops.clearLayers();
  possible_start_points.clearLayers();
  possible_end_points.clearLayers();
}

function showFreestyle(){
  clearAllLayers();
  getStartPoints();
  map.setView([45, 10], 5)
  document.getElementById("freestyleWelcome").hidden = false;
  showSidepanelTab('tab-freestyle');
}

//returns a full set of possible routes between two places up to a maxHops count
function fromTo(from_place_id,to_place_id,maxHops,maxHopTime=360){
  let arcs = [];
  let destination = all_places[to_place_id]
  let places =[
    [all_places[from_place_id]]
  ];
  for(let i=0;i<maxHops;i++){
    var newPlaces = [];
    console.log(`hops:${i} places:${places.length}`)
    for(let j=0; j<places.length;j++){
      //let hopsFromPlace = getHopsFromPlaceId(placeIds[j][placeIds[j].length -1]);
      let place_id = places[j][places[j].length -1].place_id;
      let hopsFromPlace = all_hops[place_id]['hops'];
      for(let k=0; k<hopsFromPlace.length;k++){
        if(!places[j].includes(hopsFromPlace[k])){
          if(parseFloat(hopsFromPlace[k].duration_min) <= maxHopTime){ 
            if(hopsFromPlace[k].place_id != from_place_id){
              hopsFromPlace[k]["distanceToDestination"] = distance_between_to_points(hopsFromPlace[k].place_lat,hopsFromPlace[k].place_lon,destination.place_lat,destination.place_lon)
              let newPlace = places[j].slice();
              newPlace.push(hopsFromPlace[k]);
              if(hopsFromPlace[k].place_id == to_place_id){
                //add some attributes which will allow it to be sorted?
                arcs.push(newPlace);
              }
              else{
                newPlaces.push(newPlace);
              }
            }
          }
        }
      }
    }
    //only pick the top n
    newPlaces.sort(nearest);
    places = newPlaces.slice(1,1000);
  }
  return arcs;
}

function nearest( a, b ) {
  if ( a[a.length-1].distanceToDestination < b[b.length-1].distanceToDestination ){
    return -1;
  }
  if ( a[a.length-1].distanceToDestination > b[b.length-1].distanceToDestination){
    return 1;
  }
  return 0;
}


function compare( a, b ) {
  atotalJourneyTime = 0.0;
  btotalJourneyTime = 0.0;
  aMaxJourneyTime = 0.0;
  bMaxJourneyTime = 0.0;
  for(var i=1;i<a.length;i++){
    let duration = parseFloat(a[i].duration_min)
    atotalJourneyTime += duration;
    aMaxJourneyTime = duration >= aMaxJourneyTime ? duration : aMaxJourneyTime;
  }
  for(var i=1;i<b.length;i++){
    let duration = parseFloat(b[i].duration_min)
    btotalJourneyTime += duration;
    bMaxJourneyTime = duration >= bMaxJourneyTime ? duration : bMaxJourneyTime;
  }

  if ( atotalJourneyTime < btotalJourneyTime ){
    return -1;
  }
  if ( atotalJourneyTime > btotalJourneyTime ){
    return 1;
  }
  return 0;
}
function toRadians (angle) {
  return angle * (Math.PI / 180);
}
function distance_between_to_points(from_lat,from_lon,to_lat,to_lon){
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

function pruneFromTos(fromTos,maxRoutes=10,maxJourneyTime=1200,mode=['train','bus','ferry','nighttrain','nightferry'],exemptNightTravel=true){
  //prune journeys according to travel criteria like journey length
  let prunedFromTos = [];
  fromTos.sort( compare );
  for(var i=0;i<fromTos.length;i++){
    let include = true;
    let totalJourneyTime = 0
    for(var j=1;j<fromTos[i].length;j++){
      totalJourneyTime += parseFloat(fromTos[i][j].duration_min)
      if(parseFloat(fromTos[i][j].duration_min)>maxJourneyTime){
        include = false;
      }
      //can look at each item in details to see the modes
      //if(!mode.includes(fromTos[i][j].mode)){
      //  include = false;
      //}
      
    }
    if(include){prunedFromTos.push(fromTos[i])}
  }
  
  prunedFromTos = fromTos.slice(0,9);
  return fromTos;
}

var liveStops = {};
function showLiveStartPoints(){
  liveStops = {};
  possible_start_points.clearLayers();
  Object.entries(all_places).forEach((entry) => {
      const [id, place] = entry;
      var marker = L.circle([place.place_lat, place.place_lon], {color: "#6DC623", fillColor: "#6DC623",fillOpacity: 0.5,radius: 10000});
      //var marker = L.marker([place.place_lat, place.place_lon]);
      marker.bindTooltip(decodeURI(place.place_name));
      marker.properties = place;
      marker.addEventListener('click', _showLiveOnClick);
      marker.addTo(raw_stops);
    });
}
function getLiveTrips(from_stop_id,trip_id,line_name){
  var url=`https://v5.db.transport.rest/trips/${encodeURI(trip_id)}?lineName=${encodeURI(line_name)}`
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function() {
  if (this.readyState == 4 && this.status == 200) {
    var trip = JSON.parse(this.responseText);
    console.log("processing trips");
    console.log(this.responseText);
    if("stopovers" in trip){
      
        var stopovers = trip["stopovers"]
        departureTime = stopovers[0]["plannedDeparture"]
        latlngs = []
          for(var i=0;i<stopovers.length;i++){
            latlngs.push([stopovers[i].stop.location.latitude, stopovers[i].stop.location.longitude])
          }
          var polyline = L.polyline(latlngs, {color: '#ff6600ff',weight: 3,opacity: 0.5,smoothFactor: 1});
         
          polyline.bindTooltip(`${trip.origin.name} to ${trip.destination.name}`);
          polyline.properties = trip;
          polyline.addEventListener('click', _rawLiveTripOnClick);
          polyline.addTo(raw_route_lines);
        }
  }};

  xmlhttp.open("GET", url, true);
  xmlhttp.send();

}
function getDepartures(from_stop_id){
  var url=`https://v5.db.transport.rest/stops/${from_stop_id}/departures?duration=1440`

  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function() {
  if (this.readyState == 4 && this.status == 200) {
    var response = JSON.parse(this.responseText);
    console.log("processing departures");
    console.log(this.responseText);
    for(var i=0;i<response.length;i++){
      const departure = response[i];
      trip_id = departure["tripId"];
      line_name = departure["line"]["name"];
      getLiveTrips(from_stop_id,trip_id,line_name);
    };
  }};

  xmlhttp.open("GET", url, true);
  xmlhttp.send();

}
function _rawLiveTripOnClick(e){
  trip = e.sourceTarget.properties;
  message = `<h6>${trip.origin.name} to ${trip.destination.name}</h6>`
  message +=`<h6>departure: ${trip.plannedDeparture}</h6>`
  message +=`<h6>arrival: ${trip.plannedArrival}</h6>`
  message +=`<ul>`

  stops = trip['stopovers']
  for(var i=0;i<stops.length;i++){
    message += `<li>${stops[i].stop.name}</li>`
    var marker = L.marker([stops[i].stop.location.latitude, stops[i].stop.location.longitude]);
    marker.bindTooltip(decodeURI(stops[i].stop.name));
    marker.addTo(raw_stops);
  }
  message += "</ul>"
  //map.fitBounds(e.sourceTarget.getBounds());
  document.getElementById("map_details").innerHTML = message;
}
function _showLiveOnClick(e){
  document.getElementById("routes_from_places").innerHTML = "";
  place_id = e.sourceTarget.properties.place_id;
  place = all_places[place_id]
  //get the route file
  var url = `https://v5.db.transport.rest/stops/nearby?latitude=${place['place_lat']}&longitude=${place['place_lon']}&results=10&distance=${place['lat_lon_tolerance']}000&stops=true`
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function() {
  if (this.readyState == 4 && this.status == 200) {
    var response = JSON.parse(this.responseText);
    console.log("processing stops");
    console.log(this.responseText);
    for(var i=0;i<response.length;i++){
      const stop = response[i];
      if(stop["type"] == "stop"){
        getDepartures(stop["id"]);
      }
    }
  }};

  xmlhttp.open("GET", url, true);
  xmlhttp.send();

}
function showPlacesWithRoutes(){
  possible_start_points.clearLayers();
  Object.entries(all_places).forEach((entry) => {
      const [id, place] = entry;
      var marker = L.circle([place.place_lat, place.place_lon], {color: inspirePlacesColour, fillColor: inspirePlacesColour,chosenHopsColour: 0.5,radius: 10000});
      //var marker = L.marker([place.place_lat, place.place_lon]);
      marker.bindTooltip(decodeURI(place.place_name));
      marker.properties = place;
      marker.addEventListener('click', _showRoutesForPlaceOnClick);
      marker.addTo(raw_stops);
    });
}
function _showRoutesForPlaceOnClick(e){
  raw_route_lines.clearLayers();
  place_id = e.sourceTarget.properties.place_id;
  //get the route file
  var xmlhttp = new XMLHttpRequest();
  var url = `./static/place_routes/${place_id}_routes.json`;
  xmlhttp.onreadystatechange = function() {
  if (this.readyState == 4 && this.status == 200) {
    var response = JSON.parse(this.responseText);
    routelist = "<ul>"
    Object.entries(response).forEach((entry) => {
      const [id, route] = entry;
      stops = route.stops;
      latlngs = []
      for(var i=0;i<stops.length;i++){
        latlngs.push([stops[i].stop_lat, stops[i].stop_lon])
      }
      routelist += `<li>${stops[0].stop_name} to ${stops[stops.length - 1].stop_name}</li>`;
      var polyline = L.polyline(latlngs, {color: '#ff6600ff',weight: 3,opacity: 0.5,smoothFactor: 1});
      
      polyline.bindTooltip(`${stops[0].stop_name} to ${stops[stops.length -1].stop_name}`);
      polyline.properties = route;
      polyline.addEventListener('click', _rawRouteLineOnClick);
      polyline.addTo(raw_route_lines);  
    })
    routelist += "</ul>";
    document.getElementById("map_details").innerHTML += routelist;
    map.fitBounds(raw_route_lines.getBounds());
  }};

  xmlhttp.open("GET", url, true);
  xmlhttp.send();
}
function _rawRouteLineOnClick(e){
  raw_stops.clearLayers();
  route = e.sourceTarget.properties;
  message=``
  stops = route['stops']
  for(var i=0;i<stops.length;i++){
    if(stops[i].place_id !=""){
      entry = `<a href="#" class="link-dark link-offset-2 link-underline-opacity-25 link-underline-opacity-100-hover" onclick="openPlaceDetails('${stops[i].place_id}')">${stops[i].stop_name}<a>`;
    }
    else{
     entry =  stops[i].stop_name;
    }
    message += `<li>${entry}</li>`
    var marker = L.marker([stops[i].stop_lat, stops[i].stop_lon]);
    marker.bindTooltip(decodeURI(stops[i].stop_name));
    marker.addTo(raw_stops);
  }
  message += "</ul>"
  //map.fitBounds(e.sourceTarget.getBounds());
  document.getElementById("map_details").innerHTML = message;
}
function showAgencyRawRouteLines(line){
  var url = line;
  possible_start_points.clearLayers();
  raw_stops.clearLayers();
  raw_route_lines.clearLayers();
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function() {
  if (this.readyState == 4 && this.status == 200) {
    agency = JSON.parse(this.responseText);
    routes = agency.routes;
    routelist = "<ul>"
    for(var j=0;j<routes.length;j++){
      route = routes[j];
      stops = route.stops;
      latlngs = []
      for(var i=0;i<stops.length;i++){
        entry += `${stops[i].stop_name} `;
        latlngs.push([stops[i].stop_lat, stops[i].stop_lon])
      }
      routelist += `<li>${stops[0].stop_name} to ${stops[stops.length - 1].stop_name}</li>`;

      var polyline = L.polyline(latlngs, {color: '#ff6600ff',weight: 3,opacity: 0.5,smoothFactor: 1});
      
      polyline.bindTooltip(`${stops[0].stop_name} to ${stops[stops.length -1].stop_name}`);
      route['agency_name'] = agency.agency_name;
      route['agency_url'] = agency.agency_url;
      polyline.properties = route;
      polyline.addEventListener('click', _rawLineOnClick);
      polyline.addTo(raw_route_lines);  
    }
    routelist += "</ul>"
    document.getElementById("map_details").innerHTML += routelist;
  }};

  xmlhttp.open("GET", url, true);
  xmlhttp.send();

}
function _rawLineOnClick(e){
  raw_stops.clearLayers();
  route = e.sourceTarget.properties;
  message=`
  <h4>${route.agency_name}<h4>
  <h6>${route.agency_url}<h6><ul>`
  stops = route['stops']
  for(var i=0;i<stops.length;i++){
    if(stops[i].place_id !=""){
      entry = `<a href="#" class="link-dark link-offset-2 link-underline-opacity-25 link-underline-opacity-100-hover" onclick="openPlaceDetails('${stops[i].place_id}')">${stops[i].stop_name}<a>`;
    }
    else{
     entry =  stops[i].stop_name;
    }
    message += `<li>${entry}</li>`
    var marker = L.marker([stops[i].stop_lat, stops[i].stop_lon]);
    marker.bindTooltip(decodeURI(stops[i].stop_name));
    marker.addTo(raw_stops);
  }
  message += "</ul>"
  map.fitBounds(e.sourceTarget.getBounds());
  document.getElementById("map_details").innerHTML = message;
}

function popupPlace(place_id) {
  //get the properties of the place marked
  let place = all_places[place_id];
  let place_block = get_place_details_block(place_id);
  document.getElementById("place_body").innerHTML = place_block;
  // unpack the travel details
  //var block = get_travel_details_block(candidate_hop.details);
  //document.getElementById("travel_details_body").innerHTML = block;

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

function postTrip(){
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

