/*************** FIREBASE CONFIG ***************/
var firebaseConfig = {
  apiKey: "PASTE_API_KEY",
  authDomain: "PASTE_AUTH_DOMAIN",
  databaseURL: "PASTE_DATABASE_URL",
  projectId: "PASTE_PROJECT_ID",
  storageBucket: "PASTE_STORAGE_BUCKET",
  messagingSenderId: "PASTE_SENDER_ID",
  appId: "PASTE_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();

/*************** LOCATIONS (EXTENDED) ***************/
const locations = {
    // NORTH / NORTH-EAST
    "Hebbal": [13.0358, 77.5970],
    "Hennur": [13.0352, 77.6400],
    "Bagalur": [13.1386, 77.6683],
    "Yelahanka": [13.1007, 77.5963],
    "Kattigenahalli": [13.1210, 77.6207],
    "Thanisandra": [13.0478, 77.6330],
    "Nagavara": [13.0466, 77.6255],
    "REVA University": [13.1163, 77.6349],

    // CENTRAL
    "Malleshwaram": [13.0031, 77.5640],
    "Rajajinagar": [12.9916, 77.5554],
    "Majestic": [12.9767, 77.5713],
    "KR Market": [12.9641, 77.5776],

    // EAST
    "Indiranagar": [12.9719, 77.6412],
    "Whitefield": [12.9698, 77.7500],
    "Marathahalli": [12.9592, 77.6974],

    // SOUTH
    "Jayanagar": [12.9250, 77.5938],
    "JP Nagar": [12.9077, 77.5856],
    "Banashankari": [12.9255, 77.5468],
    "Vaddarapalya": [12.8995, 77.5447],
    "BTM Layout": [12.9166, 77.6101],
    "Silk Board": [12.9177, 77.6233],
    "Electronic City": [12.8452, 77.6600]
};

/*************** GRAPH (WEIGHTED) ***************/
const graph = {
    "Hebbal": { "Malleshwaram": 7, "Hennur": 6, "Yelahanka": 8 },
    "Hennur": { "Hebbal": 6, "Bagalur": 10, "Thanisandra": 5 },
    "Bagalur": { "Hennur": 10 },
    "Yelahanka": { "Hebbal": 8, "Kattigenahalli": 5 },
    "Kattigenahalli": { "Yelahanka": 5, "REVA University": 3 },
    "REVA University": { "Kattigenahalli": 3 },

    "Thanisandra": { "Hennur": 5, "Nagavara": 4 },
    "Nagavara": { "Thanisandra": 4, "Indiranagar": 8 },

    "Malleshwaram": { "Hebbal": 7, "Rajajinagar": 3 },
    "Rajajinagar": { "Malleshwaram": 3, "Majestic": 4 },
    "Majestic": { "Rajajinagar": 4, "KR Market": 3 },
    "KR Market": { "Majestic": 3, "Jayanagar": 6 },

    "Indiranagar": { "Nagavara": 8, "Marathahalli": 6 },
    "Marathahalli": { "Indiranagar": 6, "Whitefield": 7 },
    "Whitefield": { "Marathahalli": 7 },

    "Jayanagar": { "KR Market": 6, "JP Nagar": 3, "Banashankari": 4 },
    "JP Nagar": { "Jayanagar": 3, "BTM Layout": 4 },
    "Banashankari": { "Jayanagar": 4, "Vaddarapalya": 3 },
    "Vaddarapalya": { "Banashankari": 3 },
    "BTM Layout": { "JP Nagar": 4, "Silk Board": 3 },
    "Silk Board": { "BTM Layout": 3, "Electronic City": 10 },
    "Electronic City": { "Silk Board": 10 }
};

/*************** MAP INIT ***************/
const map = L.map("map").setView([12.9716, 77.5946], 11);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap"
}).addTo(map);

let routeLine = null;
let markers = [];

/*************** DIJKSTRA ***************/
function dijkstra(start, end) {
    let dist = {}, prev = {}, visited = new Set();
    Object.keys(graph).forEach(n => dist[n] = Infinity);
    dist[start] = 0;

    while (visited.size < Object.keys(graph).length) {
        let u = Object.keys(dist)
            .filter(n => !visited.has(n))
            .reduce((a, b) => dist[a] < dist[b] ? a : b);

        visited.add(u);

        for (let v in graph[u]) {
            let alt = dist[u] + graph[u][v];
            if (alt < dist[v]) {
                dist[v] = alt;
                prev[v] = u;
            }
        }
    }

    let path = [end];
    while (end !== start) {
        end = prev[end];
        path.unshift(end);
    }
    return { path, distance: dist[path[path.length - 1]] };
}

/*************** BFS (EXTRA ALGORITHM) ***************/
function bfs(start, end) {
    let queue = [[start]];
    let visited = new Set([start]);

    while (queue.length) {
        let path = queue.shift();
        let node = path[path.length - 1];

        if (node === end) return path;

        for (let n in graph[node]) {
            if (!visited.has(n)) {
                visited.add(n);
                queue.push([...path, n]);
            }
        }
    }
    return [];
}

/*************** ROUTE DRAWING ***************/
function clearMap() {
    markers.forEach(m => map.removeLayer(m));
    markers = [];
    if (routeLine) map.removeLayer(routeLine);
}

function drawRoute(path, text) {
    clearMap();

    path.forEach(loc => {
        markers.push(L.marker(locations[loc]).addTo(map).bindPopup(loc));
    });

    let waypoints = path.map(p => L.latLng(...locations[p]));
    routeLine = L.Routing.control({
        waypoints,
        addWaypoints: false,
        draggableWaypoints: false,
        show: false,
        lineOptions: { styles: [{ color: "blue", weight: 6 }] }
    }).addTo(map);

    document.getElementById("output").innerHTML = text;
}

function findRoute() {
    let s = start.value.trim();
    let e = end.value.trim();
    let r = dijkstra(s, e);
    drawRoute(r.path, `<b>Dijkstra:</b><br>${r.path.join(" → ")}<br>Distance: ${r.distance} km`);
}

function findRouteBFS() {
    let s = start.value.trim();
    let e = end.value.trim();
    let p = bfs(s, e);
    drawRoute(p, `<b>BFS:</b><br>${p.join(" → ")}`);
}

/*************** LIVE PHONE TRACKING ***************/
function startLiveTracking() {
    navigator.geolocation.watchPosition(pos => {
        database.ref("devices/phone1").set({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            time: Date.now()
        });
    }, () => alert("Location denied"), { enableHighAccuracy: true });
}

let trackedMarker = null;
database.ref("devices/phone1").on("value", snap => {
    let d = snap.val();
    if (!d) return;

    let ll = [d.lat, d.lng];
    if (!trackedMarker) {
        trackedMarker = L.marker(ll).addTo(map).bindPopup("📍 Tracked Phone");
    } else {
        trackedMarker.setLatLng(ll);
    }
    map.setView(ll, 14);
});

/*************** ARROW KEYS MOVE MAP ***************/
document.addEventListener("keydown", e => {
    const step = 0.002;
    let c = map.getCenter();

    if (e.key === "ArrowUp") c.lat += step;
    if (e.key === "ArrowDown") c.lat -= step;
    if (e.key === "ArrowLeft") c.lng -= step;
    if (e.key === "ArrowRight") c.lng += step;

    map.panTo(c);
});

/*************** TRAFFIC SIGNALS ***************/
[
    [12.9767, 77.5713, "Majestic Signal"],
    [12.9177, 77.6233, "Silk Board Signal"],
    [12.9250, 77.5938, "Jayanagar Signal"],
    [13.0358, 77.5970, "Hebbal Signal"]
].forEach(s => {
    L.circleMarker([s[0], s[1]], {
        radius: 6,
        color: "red",
        fillColor: "yellow",
        fillOpacity: 1
    }).addTo(map).bindPopup("🚦 " + s[2]);
});

/*************** PEAK TRAFFIC ZONES ***************/
[
    [12.9177, 77.6233],
    [12.9767, 77.5713],
    [12.9719, 77.6412],
    [13.0466, 77.6255]
].forEach(z => {
    L.circle(z, {
        radius: 800,
        color: "red",
        fillColor: "red",
        fillOpacity: 0.25
    }).addTo(map).bindPopup("🚗 Peak Traffic Zone");
});
