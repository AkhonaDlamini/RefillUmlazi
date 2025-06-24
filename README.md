# 💧 RefillUmlazi – Community Water Refill App

**RefillUmlazi** is a React Native mobile application built using [Expo](https://expo.dev), designed to help residents of Umlazi locate and interact with water refill stations in their community. The app leverages Firebase Realtime Database for live data syncing and includes features for chat, notifications, and reporting.

---

## 📲 About the App

RefillUmlazi is built to solve a local infrastructure challenge: inconsistent water access. By mapping refill stations, tracking their availability, and enabling two-way communication between users and admins, this app empowers residents to get updated info and take action.

---

## 🚀 Getting Started

Follow these steps to run the app locally.

### 1. Clone the Repository

git clone https://github.com/your-username/refillumlazi.git
cd refillumlazi

---

### 2. Install Dependencies

npm install

### 3. Start the App

npx expo start

Use Expo Go (iOS/Android), an emulator, or a development build to test the app.

# 📦 Project Structure

refillumlazi/
│
├── app/                # Main screens and navigation
├── components/         # Reusable UI components
├── firebase/           # Firebase configuration and utilities
├── assets/             # Icons, images, fonts
├── App.tsx             # Entry point
├── app.json            # Expo config
└── README.md

# ✨ Key Features

- 📍 **Map View:** Interactive, zoomable map showing clustered water refill stations.
- 🔎 **Smart Search:** Autocomplete search bar with live suggestions.
- 🧾 **Station Info:** Each marker provides station number, address, water status, and last updated time.
- 📢 **Push Notifications:** Triggered on events like:
   - New station added
   - Station status changes (available, unavailable, low pressure)
   - User-submitted reports
   - Chat replies and announcements
   - Scheduled water outages
- 💬 **Real-Time Chat:** Users can message admins; replies are displayed in a threaded format.
- 📝 **Reporting:** Users can report station issues directly from the app.
- 🔐 **Role-Based Access:** Separate access paths for Admins and Users.
- 📅 **Scheduling:** Admins can schedule outages/maintenance and broadcast to users.

# 🧠 Built With
- React Native
- Expo
- Firebase Realtime Database
- Firebase Cloud Functions
- Expo Push Notifications
- React Native Maps
- TypeScript

# 🛠 Setup Requirements
1. Before running the app, you must:
2. Create a Firebase project
3. Enable Realtime Database & Authentication
4. Set up push notification credentials with Expo
5. Store your Firebase config in a file at /firebase/config.ts

# 🧪 Admin Features
- Add/edit/delete refill stations
- Update water availability
- Reply to user reports/chats
- Monitor push notifications

# 📚 Learn More
[Expo Docs](https://docs.expo.dev/)
[Firebase Realtime Database](https://firebase.google.com/docs/database)
[Push Notifications](https://firebase.google.com/docs/cloud-messaging)
[React Native Maps](https://docs.expo.dev/versions/latest/sdk/map-view/)

# 👩🏽‍💻 Author
Tech Nomads
Final-year student in Diploma in IT: Software Development
Project for Development Software 3


🙌 Acknowledgements
- Umlazi residents for inspiring this project
- Expo and Firebase for powerful free developer tools
- My IS3 project team for collaboration and documentation support

