# 🧾 BillBuddy — Expense & Bill Tracker

BillBuddy helps you **manage your monthly bills, track expenses, and set reminders** — all in one clean, modern app.

---

## 🚀 Get Started

1️⃣ **Install dependencies**

```bash
  npm install
```

2️⃣ **Start the app**

```bash
  npx expo start
```

---

## ✨ Features

- 📅 Add & manage monthly bills (electricity, rent, Wi-Fi, etc.)
- 🔔 Get payment reminders before due dates
- 📊 Visualize spending with expense charts
- 👥 Split bills with friends
- 🎨 Dark / Light mode support

### 📱 Dashboard

[![IMG-4360.jpg](https://i.postimg.cc/L6fxRJ3w/IMG-4360.jpg)](https://postimg.cc/WhNGwbKw)

### 💵 Manage Bills

[![IMG-4361.jpg](https://i.postimg.cc/RVfg9WL2/IMG-4361.jpg)](https://postimg.cc/ppWfJX7B)

### 💱 Currency Converter

[![IMG-4362.jpg](https://i.postimg.cc/0yscN9Vt/IMG-4362.jpg)](https://postimg.cc/dL58HcPd)

### ⚙️ Settings

[![IMG-4363.jpg](https://i.postimg.cc/bwh3vqmm/IMG-4363.jpg)](https://postimg.cc/vc0WqwFn)

---

## 🛠️ Tech Stack

- **Framework:** React Native (Expo)  
- **Language:** JavaScript / TypeScript  
- **UI Library:** React Native Paper / NativeWind (Tailwind for RN)  
- **Navigation:** React Navigation  
- **Backend (optional):** Firebase Firestore  
- **Build System:** EAS Build  

---

## 📦 EAS Build Configuration

BillBuddy uses **Expo Application Services (EAS)** for building APKs & publishing updates.

### Example `app.json` configuration

```json
{
  "expo": {
    "name": "BillBuddy",
    "slug": "billbuddy",
    "android": {
      "package": "com.grdh_ravan.BillBuddy",
      "versionCode": 2
    },
    "ios": {
      "bundleIdentifier": "com.grdh_ravan.BillBuddy"
    },
    "extra": {
      "eas": {
        "projectId": "your-project-id-here"
      }
    }
  }
}
```

### Generate your `projectId` automatically

```bash
  eas build:configure
```

---

## 🧠 Author

**Nischal Acharya**  
📍 Developer | Designer | Innovator  
