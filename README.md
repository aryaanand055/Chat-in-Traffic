# 🚦 Real-time Traffic Signal Chat & Awareness System

A **web-based real-time traffic awareness and communication platform** that connects users at or near traffic signals.  
It allows them to join a **dedicated chatroom**, share live updates, and access **real-time traffic data visualizations** – all integrated with an interactive map.

---

## ✨ Features

### 🗺️ Interactive Map with Traffic Signals
- Built with **Leaflet.js** (no Google Maps API dependency).
- Each traffic signal is marked on the map with tooltips.
- **Access behavior:**
  - In **testing mode**, users can click on any signal to join its chatroom and view traffic data.  
  - In **real-world use**, the user must physically be near that traffic signal to access its chatroom and data.  
- Clicking a signal:
  - Opens the chatroom for that location.
  - Fetches and displays **real traffic data** for that position.
  - Loads a live/simulated **traffic video feed**.

### 💬 Signal-based Chatrooms
- Users at the same signal join a **shared chatroom** automatically.
- Powered by **Firebase Realtime Database**:
  - Instant updates for all participants.
  - Messages are stored so new users can see previous updates.
- **Predefined Message System**:
  - Users cannot send arbitrary text.  
  - Instead, they select from a **set of predefined messages** (e.g., “Heavy traffic”, “Accident ahead”, “Signal cleared”).  
  - Each message can be **slightly customized** (e.g., adding a duration: “Heavy traffic for ~10 min”).  
  - This ensures consistency, reduces spam, and keeps communication clear.


### 📊 Traffic Data Box
- Displays **real traffic data** for the selected signal, including congestion levels, vehicle density, and estimated wait times.
- Updates instantly when a signal is clicked or when the user is at that location.

### 🎥 Video Simulation
- Each traffic signal marker is linked to a video player.  
- **Intended Behavior (Real-world use case):**  
  - The video box should display **live CCTV footage** of the respective junction.  
  - This would allow users to visually verify traffic conditions in real-time.  

- **Current Implementation (Simulation Mode):**  
  - Since live feeds are not available in the demo, we use **predefined videos** mapped to each signal.  
  - Clicking a signal marker will load and play its associated sample video.  
  - A loading indicator is shown until the video is ready, and video playback errors are gracefully handled.  

---

## 🛠️ Tech Stack
- **Frontend:** HTML, CSS, JavaScript  
- **Mapping:** Leaflet.js  
- **Backend / Database:** Firebase Realtime Database  
- **Video Integration:** HTML5 `<video>` with dynamic source switching  
- **Traffic Data:** Real-time traffic data APIs using TOM-TOM

---
## 🚀 How It Works
1. **Location Access**  
   - In the real deployment, the app automatically detects the user’s GPS location and connects them to the nearest traffic signal.  
   - For testing/demo, users can simply click on any signal marker on the map.  

2. **Signal Interaction**  
   - When a user is at (or clicks) a traffic signal, the app:  
     - Opens a **dedicated chatroom** for that signal.  
     - Fetches and displays **real-time traffic data** for the junction.  
     - Loads the corresponding **traffic video feed** (live footage in production, predefined videos in demo mode).  


---

## 📌 Future Improvements
- 📱 Mobile app version with push notifications.  
- 🚨 Smart alerts (accidents, diversions, emergency vehicles).  
- 📊 AI-based congestion prediction.  

---

## 📷 Screenshots
- Project Screenshot: <img width="1920" height="927" alt="Screenshot (18)" src="https://github.com/user-attachments/assets/938756ef-c725-43ca-89d4-2a83405f0b58" />
 
---
## 📋 Requirements

- Works on any modern browser (Chrome, Firefox, Edge, Safari).  
- Internet connection is required (for Firebase & Leaflet).  
- No additional installation or server setup is needed.  
- For best experience, allow location access (otherwise use testing mode by clicking a signal marker). 
