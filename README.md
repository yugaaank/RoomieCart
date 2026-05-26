# RoomieCart 🛒

RoomieCart is a collaborative shopping and grocery coordination app designed for households, roommates, and families. It ensures everyone is on the same page, prevents duplicates, and facilitates consensus on quantity changes.

## ✨ Key Features

- **🏠 Room Management:** Create or join rooms via unique 6-digit invite codes.
- **🛒 Shared Shopping List:** Real-time synchronized shopping list for all room members.
- **⚡ Real-time Updates:** Instant synchronization of items, quantities, and status via Supabase Realtime (<100ms).
- **🛡️ Duplicate Prevention:** Smart detection of existing items before adding new ones.
- **⚖️ Quantity Negotiation:** Consensus-based workflow for quantity changes with reason-tracking and member voting.
- **✅ Purchase Tracking:** Easily mark items as purchased and keep them organized.
- **👤 User Profiles:** Manage your display name and view your activity.
- **🌓 Dark Mode:** Full support for system-wide light and dark themes.

## 🛠️ Tech Stack

- **Frontend:** [React Native](https://reactnative.dev/) (Expo SDK 54)
- **UI Framework:** [Tamagui](https://tamagui.dev/) for styling and components
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **State Management:** [Zustand](https://github.com/pmndrs/zustand)
- **Data Fetching:** [React Query](https://tanstack.com/query/latest)
- **Backend:** [Supabase](https://supabase.com/) (Auth, Postgres, Realtime, Row Level Security)
- **Navigation:** [React Navigation](https://reactnavigation.org/)

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh/) installed on your machine.
- A [Supabase](https://supabase.com/) project.
- [Expo Go](https://expo.dev/go) app on your mobile device (for testing).

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd RoomieCart
   ```

2. **Install dependencies:**
   ```bash
   bun install
   ```

3. **Environment Setup:**
   Create a `.env` file in the root directory and add your Supabase credentials:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Database Setup:**
   Apply the migrations located in the `supabase/migrations` directory to your Supabase project.

### Running the App

Start the Expo development server:

```bash
bun start
```

- Press `a` for Android Emulator.
- Press `i` for iOS Simulator.
- Scan the QR code with your Expo Go app to run on a physical device.

### Other Commands

- **Linting:** `bun run lint`
- **Sync Secrets to EAS:** `./scripts/sync-secrets.sh` (Requires EAS CLI and login)

## 📂 Project Structure

- `src/components/`: Reusable UI components.
- `src/hooks/`: Custom React hooks (e.g., `useRealtimeItems`).
- `src/lib/`: External library configurations (Supabase client, validation).
- `src/navigation/`: App navigation logic and stacks.
- `src/screens/`: Main application screens.
- `src/services/`: API and business logic for items, rooms, and profiles.
- `src/store/`: Zustand state stores (Auth, Room, Theme).
- `src/types/`: TypeScript definitions and database types.
- `supabase/migrations/`: SQL migration files for the backend schema.

## 🛡️ Security

RoomieCart uses **Supabase Row Level Security (RLS)** to ensure that:
- Users can only access data for rooms they are members of.
- Only room owners can delete rooms or manage members.
- Item changes are protected and validated on the database level.

## 📜 License

This project is licensed under the MIT License - see the LICENSE file for details.
