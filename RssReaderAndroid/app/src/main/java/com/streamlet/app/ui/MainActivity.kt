package com.streamlet.app.ui

import android.annotation.SuppressLint
import android.net.Uri
import android.os.Bundle
import android.util.Log
import android.view.KeyEvent
import android.view.Menu
import android.view.MenuItem
import android.view.View
import android.webkit.CookieManager
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import com.google.android.material.snackbar.Snackbar
import com.streamlet.app.R
import com.streamlet.app.databinding.ActivityMainBinding

class MainActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivityMainBinding
    private lateinit var webView: WebView
    private var userEmail: String? = null
    private var userIdToken: String? = null
    
    companion object {
        // For Android Emulator/Physical Device debugging: Use your PC's local IP
        // For Production: Use https://streamlet.taranezy.com:8444
        private const val WEB_APP_URL = "http://192.168.100.10:4200"  // Your PC's local IP
    }
    
    private fun enableFullscreen() {
        // Make status bar transparent and draw content behind it
        window.statusBarColor = android.graphics.Color.TRANSPARENT
        window.navigationBarColor = android.graphics.Color.parseColor("#5a4a82")
        
        // Enable edge-to-edge mode (content goes under system bars)
        @Suppress("DEPRECATION")
        window.decorView.systemUiVisibility = (
            View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
        )
    }
    
    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) {
            // Re-apply edge-to-edge when window gains focus
            enableFullscreen()
        }
    }
    
    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        Log.d("MainActivity", "onCreate started")
        Log.d("MainActivity", "Loading URL: $WEB_APP_URL")
        
        // Enable WebView debugging for Chrome DevTools
        WebView.setWebContentsDebuggingEnabled(true)
        
        // Enable fullscreen immersive mode
        enableFullscreen()
        
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        // Removed toolbar setup - using web app's header instead
        
        // Get auth data from LoginActivity
        userEmail = intent.getStringExtra("email")
        userIdToken = intent.getStringExtra("idToken")
        val displayName = intent.getStringExtra("displayName")
        
        Log.d("MainActivity", "User: $displayName ($userEmail)")
        
        setupWebView()
        loadWebApp(userEmail, userIdToken)
        
        Log.d("MainActivity", "onCreate completed successfully")
    }

    override fun onNewIntent(intent: android.content.Intent?) {
        super.onNewIntent(intent)
        // Handle OAuth callback if the activity is resumed
        intent?.data?.let { uri ->
            Log.d("MainActivity", "Received URI: $uri")
            // After OAuth completes, user will manually return to app
            // WebView will have the session cookies from Chrome
        }
    }
    
    override fun onResume() {
        super.onResume()
        // After returning from Chrome Custom Tab, cookies should be synced
        syncCookies()
    }
    
    private fun syncCookies() {
        try {
            // Sync cookies between Chrome and WebView  
            val cookieManager = CookieManager.getInstance()
            cookieManager.setAcceptCookie(true)
            cookieManager.setAcceptThirdPartyCookies(webView, true)
            cookieManager.flush()
            Log.d("MainActivity", "Cookies synced")
            
            // Log current cookies for debugging
            val url = WEB_APP_URL
            val cookies = cookieManager.getCookie(url)
            Log.d("MainActivity", "Cookies for $url: $cookies")
        } catch (e: Exception) {
            Log.e("MainActivity", "Failed to sync cookies", e)
        }
    }
    
    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        webView = binding.webView
        
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            allowContentAccess = true
            allowFileAccess = false
            setSupportZoom(true)
            builtInZoomControls = true
            displayZoomControls = false
            loadWithOverviewMode = true
            useWideViewPort = true
            javaScriptCanOpenWindowsAutomatically = false
            mediaPlaybackRequiresUserGesture = false
            mixedContentMode = android.webkit.WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
        }
        
        // Enable cookies for session management
        CookieManager.getInstance().apply {
            setAcceptCookie(true)
            setAcceptThirdPartyCookies(webView, true)
        }
        
        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                if (request == null) return false
                // Allow all URLs to load normally in WebView (no OAuth interception needed)
                return false
            }
            
            override fun onPageStarted(view: WebView?, url: String?, favicon: android.graphics.Bitmap?) {
                super.onPageStarted(view, url, favicon)
                Log.d("MainActivity", "Page started: $url")
                
                // Inject backend URL to bypass proxy
                val backendUrl = "http://192.168.100.10:3000"
                val jsBackendConfig = """
                    (function() {
                        try {
                            window.BACKEND_API_URL = '$backendUrl';
                            localStorage.setItem('backend_api_url', '$backendUrl');
                        } catch(e) {
                            console.error('[Streamlet] Failed to set backend URL: ' + e);
                        }
                    })();
                """.trimIndent()
                
                view?.evaluateJavascript(jsBackendConfig) { result ->
                    Log.d("MainActivity", "Backend URL injection result: $result")
                }
                
                // Inject auth data into page BEFORE it fully loads
                if (!userEmail.isNullOrEmpty() && !userIdToken.isNullOrEmpty()) {
                    Log.d("MainActivity", "Injecting auth data on page start for: $userEmail")
                    val jsCode = """
                        (function() {
                            try {
                                localStorage.setItem('streamlet_email', '$userEmail');
                                localStorage.setItem('streamlet_id_token', '$userIdToken');
                                localStorage.setItem('streamlet_authenticated', 'true');
                                localStorage.setItem('streamlet_skip_login', 'true');
                                localStorage.setItem('streamlet_native_app', 'true');
                                window.streamletAuthenticated = true;
                                window.streamletEmail = '$userEmail';
                            } catch(e) {
                                console.error('[Streamlet] Failed to inject auth: ' + e);
                            }
                        })();
                    """.trimIndent()
                    
                    view?.evaluateJavascript(jsCode) { result ->
                        Log.d("MainActivity", "Auth injection result: $result")
                    }
                }
            }
            
            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                Log.d("MainActivity", "Page loaded: $url")
                
                // Force save cookies after page load
                try {
                    CookieManager.getInstance().flush()
                    Log.d("MainActivity", "Cookies flushed after page load")
                } catch (e: Exception) {
                    Log.e("MainActivity", "Failed to flush cookies", e)
                }
                
                // Double-check auth data is set after page fully loads
                if (!userEmail.isNullOrEmpty() && !userIdToken.isNullOrEmpty()) {
                    Log.d("MainActivity", "Verifying auth data after page load")
                    val jsCode = """
                        (function() {
                            try {
                                // Verify data is set
                                const token = localStorage.getItem('streamlet_id_token');
                                const auth = localStorage.getItem('streamlet_authenticated');
                                
                                // Emit event for Angular app to detect native login
                                const event = new CustomEvent('streamletNativeLogin', { 
                                    detail: { 
                                        authenticated: true, 
                                        email: localStorage.getItem('streamlet_email')
                                    }
                                });
                                window.dispatchEvent(event);
                            } catch(e) {
                                console.error('[Streamlet] Error verifying auth: ' + e);
                            }
                        })();
                    """.trimIndent()
                    
                    view?.evaluateJavascript(jsCode) {}
                }
            }
            
            override fun onReceivedError(
                view: WebView?,
                request: WebResourceRequest?,
                error: android.webkit.WebResourceError?
            ) {
                super.onReceivedError(view, request, error)
                Log.e("MainActivity", "WebView error: ${error?.description} (${error?.errorCode})")
                Log.e("MainActivity", "Failed URL: ${request?.url}")
            }
            
            override fun onReceivedHttpError(
                view: WebView?,
                request: WebResourceRequest?,
                errorResponse: android.webkit.WebResourceResponse?
            ) {
                super.onReceivedHttpError(view, request, errorResponse)
                Log.e("MainActivity", "HTTP error: ${errorResponse?.statusCode} - ${errorResponse?.reasonPhrase}")
                Log.e("MainActivity", "Failed URL: ${request?.url}")
            }
        }
        
        webView.webChromeClient = object : WebChromeClient() {
            override fun onProgressChanged(view: WebView?, newProgress: Int) {
                binding.progressBar.progress = newProgress
                binding.progressBar.visibility = if (newProgress < 100) {
                    android.view.View.VISIBLE
                } else {
                    android.view.View.GONE
                }
            }
        }
    }
    
    private fun loadWebApp(email: String?, idToken: String?) {
        try {
            Log.d("MainActivity", "Loading web app: $WEB_APP_URL")
            
            // Store auth data for website to access BEFORE loading URL
            if (email != null && idToken != null) {
                Log.d("MainActivity", "Setting auth credentials for: $email")
                
                // JavaScript to set auth data in localStorage AND skip login
                val jsCode = """
                    try {
                        // Store auth credentials
                        localStorage.setItem('streamlet_email', '$email');
                        localStorage.setItem('streamlet_id_token', '$idToken');
                        localStorage.setItem('streamlet_authenticated', 'true');
                        localStorage.setItem('streamlet_skip_login', 'true');
                        
                        // Mark as native app login
                        localStorage.setItem('streamlet_native_app', 'true');
                        
                    } catch(e) {
                        console.error('Failed to set auth data: ' + e);
                    }
                """.trimIndent()
                
                // Execute JavaScript AFTER page loads to set credentials
                webView.evaluateJavascript(jsCode) { result ->
                    Log.d("MainActivity", "Auth data injected: $result")
                }
            }
            
            // Load URL with skip_login parameter to bypass login page
            val urlWithParams = if (email != null && idToken != null) {
                "$WEB_APP_URL?skip_login=true&native_app=true"
            } else {
                WEB_APP_URL
            }
            
            webView.loadUrl(urlWithParams)
            
            Log.d("MainActivity", "Loading URL: $urlWithParams")
        } catch (e: Exception) {
            Log.e("MainActivity", "Failed to load web app", e)
            Snackbar.make(binding.root, "Failed to load app", Snackbar.LENGTH_LONG).show()
        }
    }
    
    override fun onCreateOptionsMenu(menu: Menu?): Boolean {
        menuInflater.inflate(R.menu.main_menu, menu)
        return true
    }
    
    override fun onOptionsItemSelected(item: MenuItem): Boolean {
        return when (item.itemId) {
            R.id.menu_refresh -> {
                webView.reload()
                true
            }
            R.id.menu_logout -> {
                logout()
                true
            }
            else -> super.onOptionsItemSelected(item)
        }
    }
    
    private fun logout() {
        try {
            // Clear WebView data
            webView.clearCache(true)
            webView.clearHistory()
            CookieManager.getInstance().removeAllCookies(null)
            CookieManager.getInstance().flush()
            
            // Clear localStorage
            webView.evaluateJavascript("localStorage.clear()") {}
            
            Log.d("MainActivity", "Logout successful - returning to LoginActivity")
            
            // Return to LoginActivity
            val intent = android.content.Intent(this, LoginActivity::class.java)
            intent.flags = android.content.Intent.FLAG_ACTIVITY_NEW_TASK or android.content.Intent.FLAG_ACTIVITY_CLEAR_TASK
            startActivity(intent)
            finish()
        } catch (e: Exception) {
            Log.e("MainActivity", "Logout error", e)
            Snackbar.make(binding.root, "Logout failed", Snackbar.LENGTH_SHORT).show()
        }
    }
    
    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        // Handle back button for WebView navigation
        if (keyCode == KeyEvent.KEYCODE_BACK && webView.canGoBack()) {
            webView.goBack()
            return true
        }
        return super.onKeyDown(keyCode, event)
    }
    
    override fun onDestroy() {
        webView.destroy()
        super.onDestroy()
    }
}

