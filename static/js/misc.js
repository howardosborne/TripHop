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

function buildAccordion(){
  document.getElementById("trip_accordion").innerHTML = "";
  hops_items = hops.getLayers();
  //add startpoint
  acc = `
  <div class="accordion-item" id="accordion_block_0"}>
    <h5 class="accordion-header">
      Starting at ${decodeURI(hops_items[0].properties.place_name)}
    </h5>
    <div class="accordion-body">
    </div>
    <div id="accordion_0" class="accordion-collapse collapse" data-bs-parent="#trip_accordion">
    </div>
  </div>
  `
  document.getElementById("trip_accordion").insertAdjacentHTML('beforeend', acc);

  //add each hop
  for(var i=1;i< hops_items.length;i++){
    hop = hops_items[i];
    current_accordion_count = document.getElementsByClassName("accordion-item").length;
    new_accordion_count = current_accordion_count++;
    var travel_details = get_travel_details(hop.properties.from_place_id, hop.properties.place_id);
    var travel_block = get_travel_details_block(travel_details.details);
    var do_block = get_do_details_block(hop.properties.place_id);
    var stay_block = get_stay_details_block(hop.properties.place_id);

    acc = `
    <div class="accordion-item" id="accordion_travel_block_${new_accordion_count}">
      <h2 class="accordion-header">
        <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#accordion_travel_${new_accordion_count}" aria-expanded="true" aria-controls="accordion_travel_${new_accordion_count}">
          Travel to ${hop.properties.place_name}
        </button>
      </h2>
      <div id="accordion_travel_${new_accordion_count}" class="accordion-collapse collapse" data-bs-parent="#trip_accordion">
        <div class="accordion-body">
          <div class="card card-body">${travel_block}</div>
        </div>
      </div>
    </div>`
    document.getElementById("trip_accordion").insertAdjacentHTML('beforeend', acc);

    acc = `
    <div class="accordion-item" id="accordion_block_${new_accordion_count}">
      <h2 class="accordion-header">
        <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#accordion_${new_accordion_count}" aria-expanded="true" aria-controls="accordion_${new_accordion_count}">
          ${hop.properties.place_name}
        </button>
      </h2>
      <div id="accordion_${new_accordion_count}" class="accordion-collapse collapse" data-bs-parent="#trip_accordion">
        <div class="accordion-body">
          <ul class="nav nav-tabs">
            <li class="nav-item">
              <a class="btn btn-outline-secondary btn-sm" data-bs-toggle="collapse" href="#collapse_do_${new_accordion_count}" role="button" aria-expanded="false" aria-controls="collapse_do_${new_accordion_count}">do</a>
            </li>
            <li class="nav-item">
              <a class="btn btn-outline-secondary btn-sm" data-bs-toggle="collapse" href="#collapse_stay_${new_accordion_count}" role="button" aria-expanded="false" aria-controls="collapse_stay_${new_accordion_count}">stay</a>
            </li>
            <li class="nav-item">
            <a class="btn btn-outline-danger btn-sm" id="remove_button_${new_accordion_count}" onclick="remove_hop_using_accordion_button('${new_accordion_count}')">Remove hop</a>
            </li>
          </ul>
          <div class="collapse" id="collapse_do_${new_accordion_count}"><div class="card card-body">${do_block}</div></div>
          <div class="collapse" id="collapse_stay_${new_accordion_count}"><div class="card card-body">${stay_block}</div></div>
        </div>
      </div>
    </div>`
    document.getElementById("trip_accordion").insertAdjacentHTML('beforeend', acc);
  }
}

function remove_hop_using_accordion_button(count){
  remove_hop(count);
  buildAccordion();
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
function get_do_details_block(id){
  var block = `
  <div class="card">
    <div class="card-body" id="things_to_do">
      <a href="https://viator.tp.st/dxbdWqWw" target="_blank">Viator</a>
    </div>
  </div>`
  return block;
}

function get_stay_details_block(id){
  var block = `
  <div class="card">
    <div class="card-body">
      <ul class="list-group list-group-flush">
        <li class="list-group-item"><a href="https://booking.tp.st/JFpi36Ld/" target="_blank">Booking.com</a></li>
        <li class="list-group-item"><a href="https://hostelworld.tp.st/kXriQ07L" target="_blank">Hostelworld</a></li>
      </ul>
    </div>
  </div>`
  return block;
}
