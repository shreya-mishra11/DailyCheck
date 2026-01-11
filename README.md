# TaskFlow

A beautifully designed task management app built with React Native and Expo, featuring gesture-based interactions.

![React Native](https://img.shields.io/badge/React_Native-0.81-blue)
![Expo](https://img.shields.io/badge/Expo-54-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)

## Features

### ✅ Task Management
- Add tasks via text input
- Mark tasks as complete/incomplete with a tap
- Tasks persist across sessions using AsyncStorage
- Clean, numbered task list with timestamps

### 👆 Gesture Interactions

#### Swipe to Delete
Swipe any task left to reveal the delete action. Release to confirm deletion.

#### Slide to Cancel Recording
Hold the mic button to start a voice memo recording. Slide left to cancel — just like WhatsApp!

- Hold mic → Start recording
- Slide left → Cancel zone appears  
- Release in cancel zone → Recording discarded
- Release normally → Voice memo saved as task

### 🎨 Design


https://github.com/user-attachments/assets/19edb20d-faab-4776-8838-834bd3d06c9f


A warm, editorial aesthetic that doesn't look AI-generated:

- **Color Palette**: Warm cream background with amber/terracotta accents
- **Typography**: Clean hierarchy with editorial styling
- **Layout**: Numbered list items, subtle borders, intentional spacing
- **Empty State**: Animated sparkle icon with gentle bounce and pulse

### Video

Uploading WhatsApp Video 2026-01-11 at 16.11.29.mp4…



## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI
- iOS Simulator / Android Emulator / Physical device with Expo Go

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd swipe-gesture

# Install dependencies
npm install

# Start the development server
npx expo start
```

### Running the App

```bash
# iOS
npx expo start --ios

# Android  
npx expo start --android

# Web
npx expo start --web
```

## Project Structure

```
swipe-gesture/
├── app/
│   ├── _layout.tsx      # Root layout with gesture handler
│   └── index.tsx        # Main task screen
├── assets/              # Images and icons
├── app.json             # Expo configuration
├── package.json         # Dependencies
└── tsconfig.json        # TypeScript config
```

## Tech Stack

- **Framework**: React Native + Expo
- **Navigation**: Expo Router
- **Gestures**: react-native-gesture-handler
- **Storage**: @react-native-async-storage/async-storage
- **Icons**: @expo/vector-icons (Ionicons)
- **Language**: TypeScript

## Key Dependencies

```json
{
  "expo": "~54.0.31",
  "react-native": "0.81.5",
  "react-native-gesture-handler": "~2.28.0",
  "@react-native-async-storage/async-storage": "2.1.2",
  "@expo/vector-icons": "^15.0.3"
}
```

## Gesture Implementation Details

### Swipeable List Items
Uses `Swipeable` from react-native-gesture-handler for smooth swipe-to-delete:

```tsx
<Swipeable
  renderRightActions={renderDeleteAction}
  rightThreshold={40}
  friction={2}
>
  <TaskRow />
</Swipeable>
```

### Slide to Cancel
Uses `PanGestureHandler` with state tracking:

```tsx
<PanGestureHandler
  onGestureEvent={handleSlide}
  onHandlerStateChange={handleStateChange}
>
  <Animated.View style={{ transform: [{ translateX }] }}>
    <MicButton />
  </Animated.View>
</PanGestureHandler>
```

## License

MIT

---

Built with ❤️ using React Native and Expo
