console.log("running sciprt...")

const firebaseConfig = {
    apiKey: "AIzaSyA7JnDMzfWKVhlX7eeQb8xSKCMXg1fvwN8",
    authDomain: "chat-in-traffic.firebaseapp.com",
    databaseURL: "https://chat-in-traffic-default-rtdb.firebaseio.com",
    projectId: "chat-in-traffic",
    storageBucket: "chat-in-traffic.firebasestorage.app",
    messagingSenderId: "725368377159",
    appId: "1:725368377159:web:45fd4cf3ec5abd57e14662",
    measurementId: "G-6KXE075NJR"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

/* ---------------------------
   Global state
   --------------------------- */
let currentSignal = null;
const userId = "user_" + Math.floor(Math.random() * 10000);
let chatRef = null;       // firebase ref for current chat
let chatListener = null;  // callback used for .on('child_added') to detach

/* ---------------------------
   Map + signals
   --------------------------- */
const map = L.map('map').setView([11.0168, 76.9958], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

const signals = [
    { id: "signal_1", name: "Singanallur Junction", coords: [11.000510, 77.029844], video: "videos/video1.mp4" },
    { id: "signal_2", name: "Hopes Peelamedu", coords: [11.026399, 77.021142], video: "videos/video4.mp4" },
    { id: "signal_3", name: "Townhall", coords: [10.993512, 76.960833], video: "videos/video3.mp4" },
    { id: "signal_4", name: "The Lakshmi Mills", coords: [11.013075, 76.986275], video: "videos/simulation.mp4" },
    { id: "signal_5", name: "SITRA", coords: [11.038178, 77.037561], video: "videos/video2.mp4" },
];

// Add markers with hover tooltip and click handler
signals.forEach(sig => {
    const marker = L.marker(sig.coords).addTo(map);
    marker.bindTooltip(sig.name, { className: 'my-tooltip', direction: 'top', offset: [0, -10] });
    marker.on("click", async () => {
        openChatForSignal(sig);
        try {
            const data = await getTrafficData(sig);
            updateTrafficBox(data);
        } catch (err) {
            console.error("Failed to fetch traffic data:", err);
        }
        const videoEl = document.getElementById("simulationVideo");
        const sourceEl = videoEl.querySelector("source");

        sourceEl.src = sig.video;
        videoEl.load();
        videoEl.oncanplay = () => {
            loadingEl.style.display = "none"; 
            videoEl.play();
        };

        videoEl.onerror = () => {
            loadingEl.textContent = "Failed to load video 😢";
        };
    });

});

/* ---------------------------
   DOM refs
   --------------------------- */
const chatPanel = document.getElementById('chatPanel');
const chatTitle = document.getElementById('chatTitle');
const messagesDiv = document.getElementById('messages');
const presetSelect = document.getElementById('preset-select');
const customNote = document.getElementById('custom-note');
const sendBtn = document.getElementById('send-btn');
const minimizeChatBtn = document.getElementById('minimizeChatBtn');

const videoPanel = document.getElementById('videoPanel');
const videoTitle = document.getElementById('videoTitle');
const videoMinimizeBtn = document.getElementById('videoMinimizeBtn');
const videoMaximizeBtn = document.getElementById('videoMaximizeBtn');
const simulationVideo = document.getElementById('simulationVideo');



/* ---------------------------
   Chat open/close/minimize logic
   --------------------------- */
function openChatForSignal(signal) {
    // set current
    currentSignal = signal;
    chatTitle.textContent = `${signal.name} Chat`;
    chatPanel.classList.remove('minimized');
    chatPanel.classList.add('open');
    chatPanel.setAttribute('aria-hidden', 'false');

    // Video show
    videoTitle.textContent = `${signal.name} Simulation`;
    videoPanel.classList.add('open');
    videoPanel.classList.remove('minimized');
    videoPanel.classList.remove('maximized');
    videoPanel.setAttribute('aria-hidden', 'false');

    // attach firebase listener for that signal
    attachChatListener(signal.id);

    // run cleanup - remove old or overflow right away
    cleanupMessages(signal.id);
}

minimizeChatBtn.addEventListener('click', () => {
    if (chatPanel.classList.contains('minimized')) {
        // restore
        chatPanel.classList.remove('minimized');
        chatPanel.classList.add('open');
    } else {
        // minimize into small bar
        chatPanel.classList.remove('open');
        chatPanel.classList.add('minimized');
    }
});


/* ---------------------------
   Chat send & UI update
   --------------------------- */
sendBtn.addEventListener('click', async () => {
    const preset = presetSelect.value;
    const note = customNote.value.trim();
    if (!preset || !currentSignal) {
        // require a preset and an open signal
        return;
    }
    const finalText = note ? `${preset} - ${note}` : preset;
    const chatPath = `chats/${currentSignal.id}`;
    const newRef = db.ref(chatPath).push();
    await newRef.set({
        user: userId,
        text: finalText,
        timestamp: Date.now()
    });
    // clear inputs
    presetSelect.value = "";
    customNote.value = "";
    // enforce retention rules immediately after sending
    cleanupMessages(currentSignal.id);
});

/* ---------------------------
   Firebase chat listener helpers
   --------------------------- */
function attachChatListener(signalId) {
    // detach old
    if (chatRef && chatListener) {
        chatRef.off('child_added', chatListener);
    }
    // set new
    chatRef = db.ref(`chats/${signalId}`);
    // we will clear current UI and re-populate on initial snapshot; easiest is to use 'value' then 'child_added' for realtime
    chatRef.once('value', snapshot => {
        // populate all current messages ordered by timestamp
        const items = [];
        snapshot.forEach(child => {
            const v = child.val();
            v._key = child.key;
            items.push(v);
        });
        // sort ascending by timestamp
        items.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
        messagesDiv.innerHTML = "";
        items.forEach(msg => appendMessageToUI(msg));
        // scroll
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    });

    // add live listener for new children
    chatListener = chatRef.on('child_added', snapshot => {
        const msg = snapshot.val();
        appendMessageToUI(msg);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    });
}

function appendMessageToUI(msg) {
    const div = document.createElement('div');
    div.className = 'msg ' + (msg.user === userId ? 'user' : 'other');
    div.textContent = msg.text;
    // optional: timestamp meta (small)
    if (msg.timestamp) {
        const meta = document.createElement('div');
        meta.className = 'meta';
        const d = new Date(msg.timestamp);
        meta.textContent = d.toLocaleString();
        div.appendChild(meta);
    }
    messagesDiv.appendChild(div);
}

/* ---------------------------
   Cleanup logic: delete messages older than 24h OR keep only last 50
   Uses Realtime DB (reads all messages under chat, sorts and deletes)
   --------------------------- */
async function cleanupMessages(signalId) {
    try {
        const chatPath = `chats/${signalId}`;
        const snap = await db.ref(chatPath).once('value');
        if (!snap.exists()) return;
        const entries = [];
        snap.forEach(child => {
            const val = child.val();
            entries.push({ key: child.key, timestamp: val.timestamp || 0 });
        });
        if (entries.length === 0) return;

        // sort ascending
        entries.sort((a, b) => a.timestamp - b.timestamp);

        const now = Date.now();
        const toDelete = new Set();

        // 1) delete anything older than 24 hours
        const DAY_MS = 24 * 60 * 60 * 1000;
        for (const e of entries) {
            if (now - e.timestamp > DAY_MS) {
                toDelete.add(e.key);
            }
        }

        // 2) after removing old ones, ensure we keep only last 50 (delete oldest beyond latest 50)
        // compute remaining entries after removing old ones
        const remaining = entries.filter(e => !toDelete.has(e.key));
        if (remaining.length > 50) {
            const excess = remaining.length - 50;
            for (let i = 0; i < excess; i++) {
                toDelete.add(remaining[i].key);
            }
        }

        // apply deletions
        if (toDelete.size > 0) {
            const updates = {};
            toDelete.forEach(k => updates[`${k}`] = null);
            // Realtime DB expects updates under child keys; we'll remove each directly to avoid nested path issues
            // Use Promise.all to delete
            const delPromises = [];
            toDelete.forEach(k => {
                delPromises.push(db.ref(`${chatPath}/${k}`).remove());
            });
            await Promise.all(delPromises);
        }
    } catch (err) {
        console.error("cleanupMessages error:", err);
    }
}

videoMinimizeBtn.addEventListener('click', () => {
    if (document.getElementById("videoPanel").classList.contains("minimized")) {
        document.getElementById("videoPanel").classList.remove("minimized")
        document.getElementById("videoPanel").classList.remove("maximized")

        document.getElementById("videoBody").classList.remove("d-none")
        // document.getElementById("videoPanel").classList.add("w-50")
        document.getElementById("videoPanel").classList.remove("w-75")
        document.getElementById("videoPanel").classList.remove("w-25")
    } else {
        document.getElementById("videoPanel").classList.add("minimized")
        document.getElementById("videoPanel").classList.add("w-25")
        document.getElementById("videoPanel").classList.remove("maximized")

        document.getElementById("videoPanel").classList.remove("w-75")
        document.getElementById("videoPanel").classList.remove("w-50")
        document.getElementById("videoBody").classList.add("d-none")
    }
});

videoMaximizeBtn.addEventListener('click', () => {
    if (document.getElementById("videoPanel").classList.contains("maximized")) {
        document.getElementById("videoPanel").classList.remove("maximized")
        document.getElementById("videoPanel").classList.remove("minimized")

        document.getElementById("videoPanel").classList.remove("w-25")
        document.getElementById("videoPanel").classList.add("w-50")
        document.getElementById("videoPanel").classList.remove("w-75")
        document.getElementById("videoBody").classList.remove("d-none")

    } else {
        document.getElementById("videoPanel").classList.remove("w-50")
        document.getElementById("videoPanel").classList.remove("w-25")
        document.getElementById("videoPanel").classList.add("w-75")
        document.getElementById("videoPanel").classList.add("maximized")
        document.getElementById("videoPanel").classList.remove("minimized")

        document.getElementById("videoBody").classList.remove("d-none")
    }
});

/* ---------------------------
   Utility: close everything helper (not required but useful)
   --------------------------- */
function hidePanels() {
    // detach listener
    if (chatRef && chatListener) {
        chatRef.off('child_added', chatListener);
        chatRef = null;
        chatListener = null;
    }
    currentSignal = null;
    // hide UI
    chatPanel.classList.remove('open');
    chatPanel.classList.remove('minimized');
    chatPanel.style.transform = ''; // fallback
    chatPanel.setAttribute('aria-hidden', 'true');

    videoPanel.classList.remove('open');
    videoPanel.classList.remove('minimized');
    videoPanel.classList.remove('maximized');
    videoPanel.setAttribute('aria-hidden', 'true');
    try { simulationVideo.pause(); } catch (e) { }
}

//    Initial note: if you want chat to auto-open the nearest signal based on GPS,
//    we can add geolocation logic. For now click triggers openChatForSignal.


// Traffic Updates
// Cache object
// ---- Config ----
const TOMTOM_API_KEY = "JNbfhfjPFBtulLotGmJHJPrEKlOw8bVR"; // replace with your key
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Cache object { signalId: { data: {...}, timestamp: number } }
const trafficCache = {};



// ---- Function to fetch/cached traffic data ----
async function getTrafficData(signal) {
    const now = Date.now();

    // If cached and within 5 minutes, return cached data
    if (trafficCache[signal.id] && (now - trafficCache[signal.id].timestamp < CACHE_DURATION)) {
        return trafficCache[signal.id].data;
    }

    const url = `https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/xml?key=${TOMTOM_API_KEY}&point=${signal.coords[0]},${signal.coords[1]}`;

    try {
        const response = await fetch(url);
        const xmlText = await response.text();

        // Parse XML
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, "application/xml");

        const data = {
            signal: signal.name,
            speed: xmlDoc.querySelector("currentSpeed")?.textContent || "--",
            freeFlow: xmlDoc.querySelector("freeFlowSpeed")?.textContent || "--",
            travel: xmlDoc.querySelector("currentTravelTime")?.textContent || "--",
            freeFlowTime: xmlDoc.querySelector("freeFlowTravelTime")?.textContent || "--",
            confidence: xmlDoc.querySelector("confidence")?.textContent || "--",
            closure: xmlDoc.querySelector("roadClosure")?.textContent === "true" ? "Yes" : "No"
        };

        // Cache result
        trafficCache[signal.id] = { data, timestamp: now };
        return data;

    } catch (err) {
        console.error("Error fetching traffic data:", err);
        return null;
    }
}

// ---- Function to update HTML ----
function updateTrafficBox(data) {
    if (!data) return;

    document.getElementById("traffic-signal").textContent = data.signal;
    document.getElementById("traffic-speed").textContent = data.speed;
    document.getElementById("traffic-freeflow").textContent = data.freeFlow;
    document.getElementById("traffic-travel").textContent = data.travel;
    document.getElementById("traffic-freeflowtime").textContent = data.freeFlowTime;
    // document.getElementById("traffic-confidence").textContent = data.confidence;
    document.getElementById("traffic-closure").textContent = data.closure;
}
