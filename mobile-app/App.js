import React, { useRef, useState, useEffect } from "react";
import { SafeAreaView, ActivityIndicator, BackHandler, Platform, StatusBar } from "react-native";
import { WebView } from "react-native-webview";

// ActionLadder Production URL
// Must match the apiUrl in app.json extra.actionLadder.apiUrl
const APP_URL = "https://billiard-ladder-blazn03.replit.app";

export default function App() {
  const webRef = useRef(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Android back button handling - navigate back in WebView history
  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (canGoBack && webRef.current) {
        webRef.current.goBack();
        return true; // Prevent default back behavior
      }
      return false; // Allow default back behavior (exit app)
    });

    return () => subscription.remove();
  }, [canGoBack]);

  const handleNavigationStateChange = (navState) => {
    setCanGoBack(navState.canGoBack);
    setIsLoading(navState.loading);
  };

  const handleLoadEnd = () => {
    setIsLoading(false);
  };

  const handleError = (error) => {
    console.log("WebView Error:", error);
    setIsLoading(false);
  };

  // Inject JavaScript for mobile optimizations
  const injectedJavaScript = `
    // Mobile-specific optimizations for ActionLadder
    (function() {
      // Prevent zoom on input focus (common mobile issue)
      var meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
      document.getElementsByTagName('head')[0].appendChild(meta);

      // Add mobile app class for potential CSS targeting
      document.body.classList.add('mobile-app');

      // Optimize touch events for pool game interactions
      document.addEventListener('touchstart', function(e) {
        // Prevent default on certain elements to improve responsiveness
        if (e.target.closest('.pool-table, .tournament-bracket, .stream-controls')) {
          e.preventDefault();
        }
      }, { passive: false });

      // Send app ready signal
      window.ReactNativeWebView?.postMessage(JSON.stringify({
        type: 'APP_READY',
        timestamp: Date.now()
      }));
    })();
    true; // Required for iOS
  `;

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log("Message from WebView:", data);
      
      // Handle specific app messages here
      switch (data.type) {
        case 'APP_READY':
          console.log("ActionLadder app ready in WebView");
          break;
        default:
          break;
      }
    } catch (error) {
      console.log("Error parsing WebView message:", error);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0B0B0F" }}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="#0B0B0F" 
        translucent={false}
      />
      
      <WebView
        ref={webRef}
        source={{ uri: APP_URL }}
        style={{ flex: 1 }}
        
        // Core WebView settings
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        
        // Media settings for streaming
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        
        // Security settings
        mixedContentMode="compatibility"
        allowsProtectedMedia={true}
        
        // Performance optimizations
        renderToHardwareTextureAndroid={true}
        overScrollMode="never"
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        
        // Navigation
        allowsBackForwardNavigationGestures={Platform.OS === "ios"}
        onNavigationStateChange={handleNavigationStateChange}
        
        // Loading and error handling
        renderLoading={() => (
          <ActivityIndicator 
            size="large" 
            color="#00ff00" 
            style={{ 
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: [{ translateX: -25 }, { translateY: -25 }]
            }} 
          />
        )}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        
        // JavaScript injection and messaging
        injectedJavaScript={injectedJavaScript}
        onMessage={handleMessage}
        
        // UserAgent for server-side mobile detection
        userAgent={`ActionLadder-Mobile/${Platform.OS} (${Platform.Version})`}
      />
    </SafeAreaView>
  );
}