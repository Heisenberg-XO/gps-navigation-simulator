/************ FIREBASE CONFIG ************/
var firebaseConfig = {
  apiKey: "PASTE_API_KEY",
  authDomain: "PASTE_AUTH_DOMAIN",
  databaseURL: "PASTE_DATABASE_URL",
  projectId: "PASTE_PROJECT_ID"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();

/************ LOCATIONS ************/
const locations = {
    "Hebbal": [13.0358, 77.5970],
    "Hennur": [13.0352, 77.6400],
    "Yelahanka": [13.1007, 77.5963],
    "Malleshwaram": [13.0031, 77.5640],
    "Majestic": [12.9767, 77.5713]
};

/************ MAP ************/
const map = L.map("map").setView([12.9716, 77.5946], 12);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap"
}).addTo(map);

let routeControl = null;

/************ ROUTE ************/
function findRoute() {
    let from = document.getElementById("from").value.trim();
    let to = document.getElementById("to").value.trim();

    if (!(from in locations) || !(to in locations)) {
        alert("Invalid location");
        return;
    }

    if (routeControl) map.removeControl(routeControl);

    routeControl = L.Routing.control({
        waypoints: [
            L.latLng(...locations[from]),
            L.latLng(...locations[to])
        ],
        addWaypoints: false
    }).addTo(map);
}

/************ LIVE TRACKING (CODE BASED) ************/
let liveMarker = null;

// PHONE USER
function shareLocation() {
    let code = document.getElementById("code").value.trim();
    if (!code) {
        alert("Enter tracking code");
        return;
    }

    navigator.geolocation.watchPosition(pos => {
        database.ref("tracking/" + code).set({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            time: Date.now()
        });
    });
}

// VIEWER
function watchLocation() {
    let code = document.getElementById("code").value.trim();
    if (!code) {
        alert("Enter tracking code");
        return;
    }

    database.ref("tracking/" + code).on("value", snap => {
        let d = snap.val();
        if (!d) return;

        let latlng = [d.lat, d.lng];

        if (!liveMarker) {
            liveMarker = L.marker(latlng)
                .addTo(map)
                .bindPopup("Live Device");
        } else {
            liveMarker.setLatLng(latlng);
        }

        map.setView(latlng, 15);
    });
}
