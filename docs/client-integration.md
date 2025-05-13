# Client Integration Guide for Firebase Cloud Messaging

This guide explains how to integrate Firebase Cloud Messaging (FCM) in client mobile applications to receive push notifications from your Strapi backend.

## Prerequisites

- Firebase project set up and configured with your Strapi backend
- Mobile app project (iOS/Android)

## Android Integration

### Step 1: Add Firebase to your Android project

1. In the [Firebase console](https://console.firebase.google.com/), add your Android app to your Firebase project
2. Register your app with your package name (e.g., `com.example.myapp`)
3. Download the `google-services.json` file and add it to your app-level directory
4. Add the Firebase SDK to your project's build files as per the [official guide](https://firebase.google.com/docs/android/setup)

### Step 2: Implement FCM in your Android app

Add the FCM dependency to your app-level `build.gradle`:

```gradle
dependencies {
    // Import the Firebase BoM
    implementation platform('com.google.firebase:firebase-bom:32.0.0')
    
    // FCM dependency
    implementation 'com.google.firebase:firebase-messaging'
}
```

### Step 3: Create a service to handle FCM messages

```kotlin
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.media.RingtoneManager
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

class MyFirebaseMessagingService : FirebaseMessagingService() {
    
    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        // Handle received message
        Log.d(TAG, "From: ${remoteMessage.from}")
        
        // Check if message contains notification payload
        remoteMessage.notification?.let {
            Log.d(TAG, "Message Notification Body: ${it.body}")
            sendNotification(it.title ?: "New Message", it.body ?: "")
        }
        
        // Handle data payload
        remoteMessage.data.isNotEmpty().let {
            Log.d(TAG, "Message data payload: ${remoteMessage.data}")
            // Process data payload if needed
        }
    }
    
    override fun onNewToken(token: String) {
        // If FCM token is refreshed, send to server
        Log.d(TAG, "Refreshed token: $token")
        sendRegistrationToServer(token)
    }
    
    private fun sendRegistrationToServer(token: String) {
        // Send token to your Strapi backend
        // Example using Retrofit or your preferred HTTP client
        ApiClient.updateFcmToken(token)
    }
    
    private fun sendNotification(title: String, messageBody: String) {
        val intent = Intent(this, MainActivity::class.java)
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
        val pendingIntent = PendingIntent.getActivity(this, 0, intent,
            PendingIntent.FLAG_IMMUTABLE)
            
        val channelId = "fcm_default_channel"
        val defaultSoundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
        val notificationBuilder = NotificationCompat.Builder(this, channelId)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle(title)
            .setContentText(messageBody)
            .setAutoCancel(true)
            .setSound(defaultSoundUri)
            .setContentIntent(pendingIntent)
            
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        
        // Create the notification channel for Android 8.0+
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                "Channel human readable title",
                NotificationManager.IMPORTANCE_DEFAULT
            )
            notificationManager.createNotificationChannel(channel)
        }
        
        notificationManager.notify(0, notificationBuilder.build())
    }
    
    companion object {
        private const val TAG = "MyFirebaseMsgService"
    }
}
```

### Step 4: Register the service in your AndroidManifest.xml

```xml
<manifest ...>
    <application ...>
        <service
            android:name=".MyFirebaseMessagingService"
            android:exported="false">
            <intent-filter>
                <action android:name="com.google.firebase.MESSAGING_EVENT" />
            </intent-filter>
        </service>
    </application>
</manifest>
```

### Step 5: Send the FCM token to your Strapi backend

When you get the token, send it to your Strapi backend:

```kotlin
class LoginActivity : AppCompatActivity() {
    // ...
    
    private fun loginSuccess(user: User) {
        // User logged in successfully
        
        // Get current FCM token
        FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
            if (!task.isSuccessful) {
                Log.w(TAG, "Fetching FCM registration token failed", task.exception)
                return@addOnCompleteListener
            }
            
            // Get the token
            val token = task.result
            
            // Send to server
            sendFcmTokenToServer(token)
        }
    }
    
    private fun sendFcmTokenToServer(token: String) {
        // Using Retrofit or your preferred HTTP client
        apiClient.updateFcmToken(token)
            .enqueue(object : Callback<TokenUpdateResponse> {
                override fun onResponse(call: Call<TokenUpdateResponse>, response: Response<TokenUpdateResponse>) {
                    if (response.isSuccessful) {
                        Log.d(TAG, "FCM token updated successfully")
                    } else {
                        Log.e(TAG, "Failed to update FCM token: ${response.errorBody()?.string()}")
                    }
                }
                
                override fun onFailure(call: Call<TokenUpdateResponse>, t: Throwable) {
                    Log.e(TAG, "Error updating FCM token", t)
                }
            })
    }
}
```

## iOS Integration

### Step 1: Add Firebase to your iOS project

1. In the [Firebase console](https://console.firebase.google.com/), add your iOS app to your Firebase project
2. Register your app with your Bundle ID
3. Download the `GoogleService-Info.plist` file and add it to your Xcode project
4. Add the Firebase SDK to your project using CocoaPods or Swift Package Manager

### Step 2: Configure your app for FCM

In your `AppDelegate.swift`:

```swift
import UIKit
import Firebase
import FirebaseMessaging
import UserNotifications

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {
    
    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Configure Firebase
        FirebaseApp.configure()
        
        // Set FCM messaging delegate
        Messaging.messaging().delegate = self
        
        // Request permission for notifications
        UNUserNotificationCenter.current().delegate = self
        let authOptions: UNAuthorizationOptions = [.alert, .badge, .sound]
        UNUserNotificationCenter.current().requestAuthorization(
            options: authOptions,
            completionHandler: { _, _ in }
        )
        
        application.registerForRemoteNotifications()
        
        return true
    }
    
    // Handle registration for remote notifications
    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        Messaging.messaging().apnsToken = deviceToken
    }
}

// MARK: - UNUserNotificationCenterDelegate
extension AppDelegate: UNUserNotificationCenterDelegate {
    // Handle notifications received when app is in foreground
    func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification, withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        let userInfo = notification.request.content.userInfo
        
        // Handle notification data if needed
        print("Notification received in foreground: \(userInfo)")
        
        // Show the notification even when in foreground
        completionHandler([.alert, .badge, .sound])
    }
    
    // Handle notification tap
    func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse, withCompletionHandler completionHandler: @escaping () -> Void) {
        let userInfo = response.notification.request.content.userInfo
        
        // Handle notification tap
        print("Notification tapped: \(userInfo)")
        
        completionHandler()
    }
}

// MARK: - MessagingDelegate
extension AppDelegate: MessagingDelegate {
    // Handle FCM token refresh
    func messaging(_ messaging: Messaging, didReceiveRegistrationToken fcmToken: String?) {
        print("Firebase registration token: \(String(describing: fcmToken))")
        
        // Send token to server
        if let token = fcmToken {
            sendFcmTokenToServer(token)
        }
    }
    
    func sendFcmTokenToServer(_ token: String) {
        // Using URLSession or your preferred networking library
        guard let url = URL(string: "https://your-strapi-server.com/api/notifications/update-token") else {
            return
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "PUT"
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")
        request.addValue("Bearer \(UserDefaults.standard.string(forKey: "jwt") ?? "")", forHTTPHeaderField: "Authorization")
        
        let body: [String: Any] = ["fcmToken": token]
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        
        let task = URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                print("Error sending FCM token: \(error)")
                return
            }
            
            if let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 {
                print("FCM token updated successfully")
            } else {
                print("Failed to update FCM token: \(response.debugDescription)")
            }
        }
        task.resume()
    }
}
```

### Step 3: Send the FCM token to your Strapi backend

When a user logs in, ensure you also send the FCM token:

```swift
func loginUser(email: String, password: String, completion: @escaping (Result<User, Error>) -> Void) {
    // Login logic
    apiClient.login(email: email, password: password) { result in
        switch result {
        case .success(let response):
            // Save JWT token
            UserDefaults.standard.set(response.jwt, forKey: "jwt")
            
            // Get the latest FCM token and send it
            if let token = Messaging.messaging().fcmToken {
                self.sendFcmTokenToServer(token)
            }
            
            completion(.success(response.user))
        case .failure(let error):
            completion(.failure(error))
        }
    }
}
```

## React Native Integration

If you're using React Native, you can use the `@react-native-firebase/messaging` package:

### Step 1: Install the required packages

```bash
npm install @react-native-firebase/app @react-native-firebase/messaging
```

### Step 2: Configure Firebase for iOS and Android

Follow the setup instructions for each platform in the [React Native Firebase documentation](https://rnfirebase.io/).

### Step 3: Request permissions and handle the FCM token

```javascript
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api'; // Your API client

// Request permissions
async function requestUserPermission() {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    console.log('Authorization status:', authStatus);
    return true;
  }
  return false;
}

// Get FCM token and send to server
async function getFcmToken() {
  const hasPermission = await requestUserPermission();
  
  if (!hasPermission) return;
  
  // Check if we already have a token
  const oldToken = await AsyncStorage.getItem('fcmToken');
  
  // Get the FCM token
  const fcmToken = await messaging().getToken();
  
  if (oldToken !== fcmToken) {
    // Save the token locally
    await AsyncStorage.setItem('fcmToken', fcmToken);
    
    // Send to server
    try {
      const jwt = await AsyncStorage.getItem('jwt');
      if (jwt) {
        await api.updateFcmToken(fcmToken, jwt);
        console.log('FCM token updated on server');
      }
    } catch (error) {
      console.error('Failed to update FCM token on server:', error);
    }
  }
  
  return fcmToken;
}

// Handle token refresh
messaging().onTokenRefresh(async (token) => {
  await AsyncStorage.setItem('fcmToken', token);
  try {
    const jwt = await AsyncStorage.getItem('jwt');
    if (jwt) {
      await api.updateFcmToken(token, jwt);
    }
  } catch (error) {
    console.error('Failed to update refreshed FCM token:', error);
  }
});

// Handle foreground messages
messaging().onMessage(async (remoteMessage) => {
  console.log('A new FCM message arrived!', JSON.stringify(remoteMessage));
  // Show local notification
  // ...
});

// Handle background/quit state messages
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log('Message handled in the background!', remoteMessage);
});

// Check initial notification when app was closed
messaging()
  .getInitialNotification()
  .then((remoteMessage) => {
    if (remoteMessage) {
      console.log(
        'Notification caused app to open from quit state:',
        remoteMessage,
      );
      // Navigate to appropriate screen based on notification data
    }
  });

export { requestUserPermission, getFcmToken };
```

### Step 4: Update token after login

```javascript
async function login(email, password) {
  try {
    const response = await api.login(email, password);
    const { jwt, user } = response.data;
    
    // Save JWT
    await AsyncStorage.setItem('jwt', jwt);
    
    // Update FCM token on the server
    const fcmToken = await getFcmToken();
    if (fcmToken) {
      await api.updateFcmToken(fcmToken, jwt);
    }
    
    return user;
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
}
```

## API Client Implementation

Here's an example of the API client methods needed for FCM token updates:

```javascript
// React Native example
import axios from 'axios';

const API_URL = 'https://your-strapi-server.com';

const apiClient = {
  updateFcmToken: async (fcmToken, jwt) => {
    return axios.put(
      `${API_URL}/api/notifications/update-token`,
      { fcmToken },
      {
        headers: {
          Authorization: `Bearer ${jwt}`,
          'Content-Type': 'application/json',
        },
      }
    );
  },
  
  // Other API methods
  // ...
};

export default apiClient;
```

## Testing Notifications

To test that your implementation is working correctly:

1. Implement the client-side code
2. Login to your app and ensure the FCM token is sent to the server
3. Use the admin endpoint to send a test notification:

```http
POST /api/notifications/send
Content-Type: application/json
Authorization: Bearer YOUR_ADMIN_JWT

{
  "userId": 1,
  "title": "Test Notification",
  "body": "This is a test notification from the Strapi backend",
  "data": {
    "type": "TEST",
    "key1": "value1"
  }
}
```

4. Verify that the notification appears on the device

## Troubleshooting

- **Notifications not appearing**: Check the device notification settings, ensure permissions are granted
- **Token not being sent**: Verify network requests in your debugging tools
- **iOS notifications not working**: Make sure you have the proper certificates and provisioning profiles
- **Android notifications not working**: Check that the `google-services.json` file is in the correct location

For more detailed troubleshooting, refer to the [Firebase documentation](https://firebase.google.com/docs/cloud-messaging/troubleshooting). 