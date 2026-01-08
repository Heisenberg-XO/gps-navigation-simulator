/******** FIREBASE ********/
var firebaseConfig = {
  apiKey: "PASTE_API_KEY",
  authDomain: "PASTE_AUTH_DOMAIN",
  databaseURL: "PASTE_DATABASE_URL",
  projectId: "PASTE_PROJECT_ID"
};
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

/******** LOCATIONS ********/
const locations = {
    "Hebbal": [13.0358, 77.5970],
    "Hennur": [13.0352, 77.6400],
    "Yelahanka": [13.1007, 77.5963],
    "Malleshwaram": [13.0031, 77.5640],
    "Majestic": [12.9767, 77.5713],
    "Jayanagar": [12.9250, 77.5938]
};

/******** MAP ********/
const map = L.map("map").setView([12.9716, 77.5946], 12);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap"
}).addTo(map);

/******** ROUTING ********/
let routeControl = null;

function findRoute() {
    const start = document.getElementById("start").value.trim();
    const end = document.getElementById("end").value.trim();

    if (!(start in locations) || !(end in locations)) {
        alert("Invalid location name");
        return;
    }

    if (routeControl) map.removeControl(routeControl);

    routeControl = L.Routing.control({
        waypoints: [
            L.latLng(...locations[start]),
            L.latLng(...locations[end])
        ],
        routeWhileDragging: false,
        addWaypoints: false
    }).addTo(map);
}

/******** FIREBASE LIVE TRACKING ********/
let liveMarker = null;

function startLiveTracking() {
    navigator.geolocation.watchPosition(pos => {
        database.ref("device1").set({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
        });
    });
}

database.ref("device1").on("value", snap => {
    let d = snap.val();
    if (!d) return;

    if (!liveMarker) {
        liveMarker = L.marker([d.lat, d.lng]).addTo(map)
            .bindPopup("Live Device");
    } else {
        liveMarker.setLatLng([d.lat, d.lng]);
    }
});

/******** TRAFFIC SIGNALS ********/
[
    [12.9767, 77.5713, "Majestic Signal"],
    [12.9177, 77.6233, "Silk Board Signal"],
    [13.0358, 77.5970, "Hebbal Signal"]
].forEach(s => {
    L.circleMarker([s[0], s[1]], {
        radius: 6,
        color: "red",
        fillColor: "yellow",
        fillOpacity: 1
    }).addTo(map).bindPopup("🚦 " + s[2]);
});

/******** TRAFFIC ZONES ********/
[
    [12.9767, 77.5713],
    [12.9177, 77.6233]
].forEach(z => {
    L.circle(z, {
        radius: 700,
        color: "red",
        fillOpacity: 0.25
    }).addTo(map).bindPopup("Peak Traffic Area");
});
