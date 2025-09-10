# Frontend Migration Guide - Firebase zu Backend API

## ✅ Bereits umgestellte Komponenten

1. **AuthProvider** - Komplett auf API umgestellt
2. **MobileLoginPage** - Nutzt jetzt API Login
3. **MobileRegisterPage** - Nutzt jetzt API Registration  
4. **SeriesListProvider** - Komplett auf API umgestellt
5. **MovieListProvider** - Komplett auf API umgestellt
6. **API Service** - Zentraler Service für alle API Calls

## 🔧 Wichtige Änderungen die noch durchgeführt werden müssen

### 1. App.tsx anpassen

```typescript
// Alte Imports entfernen:
import { useAuth } from './components/auth/AuthProvider';
// Statt Firebase Auth Context

// Import-Pfade anpassen wo nötig
```

### 2. Friends Provider umstellen

```typescript
// In OptimizedFriendsProvider.tsx
import apiService from '../services/api.service';

// Ersetze Firebase Calls:
// ALT: firebase.database().ref(`users/${userId}/friends`)
// NEU: apiService.getFriends()

// ALT: firebase.database().ref('friendRequests').push()
// NEU: apiService.sendFriendRequest(username, message)
```

### 3. Badge System umstellen

In allen Badge-bezogenen Dateien:
- `services/badgeCounterService.ts`
- `services/offlineBadgeSystem.ts`

```typescript
// Ersetze Firebase mit API:
// ALT: firebase.database().ref(`badgeCounters/${userId}`)
// NEU: apiService.getBadgeCounters()

// ALT: ref.transaction()
// NEU: apiService.updateBadgeCounter(type, increment)
```

### 4. Upload Services anpassen

In Komponenten die Uploads verwenden:
- `MobileProfileSettingsPage.tsx`
- `MobileSettingsPage.tsx`

```typescript
// ALT: firebase.storage().ref().child(`profile-images/${userId}`)
// NEU: apiService.uploadProfileImage(file)

// ALT: firebase.storage().ref().child(`themes/${userId}`)
// NEU: apiService.uploadThemeImage(file)
```

### 5. Series/Movie Update Funktionen

In Detail Pages und Management Pages:

```typescript
// Beispiel für Series Update:
// ALT:
await firebase.database().ref(`${userId}/serien/${seriesId}`).update(data);

// NEU:
const { updateSeries } = useSeriesList();
await updateSeries(seriesId, data);
```

### 6. Episode Management

```typescript
// ALT:
await firebase.database()
  .ref(`${userId}/serien/${seriesId}/seasons/${season}/episodes/${episode}`)
  .update({ watched: true });

// NEU:
await apiService.updateEpisode(seriesId, {
  seasonNumber,
  episodeNumber,
  watched: true
});
```

### 7. Activity System

```typescript
// ALT:
await firebase.database().ref(`activities/${userId}`).push(activity);

// NEU:
await apiService.createActivity(type, data, visibility);
```

### 8. WebSocket Integration

In Komponenten die Realtime Updates brauchen:

```typescript
useEffect(() => {
  const socket = apiService.getSocket();
  
  socket?.on('friendRequest', (data) => {
    // Handle friend request
  });
  
  socket?.on('newActivity', (data) => {
    // Handle new activity
  });
  
  return () => {
    socket?.off('friendRequest');
    socket?.off('newActivity');
  };
}, []);
```

## 📝 Globale Such- und Ersetz-Aktionen

### Firebase Imports entfernen:
```
SUCHE: import.*firebase.*
ERSETZE: // Removed - using API service
```

### Auth Hook anpassen:
```
SUCHE: import { useAuth } from '../App'
ERSETZE: import { useAuth } from '../components/auth/AuthProvider'
```

### Database Referenzen:
```
SUCHE: firebase\.database\(\)\.ref\(
ERSETZE: apiService.
```

### Storage Referenzen:
```
SUCHE: firebase\.storage\(\)\.ref\(
ERSETZE: apiService.upload
```

## 🎯 Komponenten-spezifische Änderungen

### MobileSeriesDetailPage.tsx
- Nutze `useSeriesList()` Hook
- Ersetze Firebase Updates mit `updateSeries()`
- Rating Updates über API

### MobileEpisodeManagementPage.tsx
- Nutze `apiService.updateEpisode()`
- Batch Updates über API
- WebSocket für Live Updates

### MobileProfilePage.tsx
- Nutze `useAuth()` für Logout
- Stats über `apiService.getStats()`
- Profile Updates über `updateProfile()`

### MobileFriendsPage.tsx
- Nutze `apiService.getFriends()`
- Friend Requests über API
- WebSocket für Online Status

### MobileActivityPage.tsx
- Nutze `apiService.getActivities()`
- Infinite Scroll mit Offset
- WebSocket für neue Activities

## 🔌 Environment Variables

Stelle sicher dass `.env` korrekt ist:
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

## 🚀 Testing Checklist

Nach der Migration teste:
- [ ] Login/Logout
- [ ] Registration
- [ ] Series hinzufügen/bearbeiten/löschen
- [ ] Episodes als gesehen markieren
- [ ] Movies hinzufügen/bearbeiten/löschen
- [ ] Friend System
- [ ] Badge System
- [ ] Activity Feed
- [ ] Profile Upload
- [ ] Offline Mode
- [ ] WebSocket Updates

## 🔍 Häufige Fehler

1. **Token nicht gefunden**: Stelle sicher dass nach Login das Token gespeichert wird
2. **CORS Fehler**: Backend muss CORS für Frontend URL erlauben
3. **WebSocket Connection Failed**: Prüfe Socket URL in .env
4. **Offline Mode**: LocalStorage Keys müssen angepasst werden

## 💡 Performance Tipps

1. Nutze die Cache-Mechanismen in den Providern
2. WebSocket nur wenn nötig verbinden
3. Batch API Calls wo möglich
4. Lazy Loading für große Listen

## 🛠️ Utility Funktionen

Erstelle Helper für wiederkehrende Patterns:

```typescript
// utils/api-helpers.ts
export const handleApiError = (error: any) => {
  const message = error.response?.data?.error || 'Ein Fehler ist aufgetreten';
  console.error('API Error:', message);
  return message;
};
```

## 📦 NPM Scripts anpassen

In package.json:
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "deploy": "npm run build && scp -r dist/* user@server:/var/www/frontend"
  }
}
```

Firebase Deploy entfernen!