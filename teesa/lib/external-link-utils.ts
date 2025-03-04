/**
 * Utility functions for handling external links and bypassing in-app browser restrictions
 */

/**
 * Opens a link in the external browser, bypassing in-app browser restrictions
 * This handles both iOS and Android devices, with appropriate fallbacks
 * 
 * @param e - Click event
 * @param url - URL to open
 */
export const openExternalLink = (e: any, url: string): void => {
  e.preventDefault();
  
  // Get the device info
  const userAgent = window.navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(userAgent);
  const isAndroid = /Android/.test(userAgent);
  
  // Check if we're in an in-app browser (rough detection)
  const isInAppBrowser = /FBAN|FBAV|Twitter|Instagram|TikTok/i.test(userAgent);
  
  if (isInAppBrowser) {
    if (isIOS) {
      // For iOS, try to use x-safari for iOS 17+
      window.location.href = `x-safari-${url}`;
    } else if (isAndroid) {
      // For Android, use intent scheme
      window.location.href = `intent://${url.replace(/^https?:\/\//, '')}#Intent;scheme=https;package=com.android.chrome;end`;
    } else {
      // Fallback to window.open
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  } else {
    // If not in an in-app browser, just use window.open
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}; 