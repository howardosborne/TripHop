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