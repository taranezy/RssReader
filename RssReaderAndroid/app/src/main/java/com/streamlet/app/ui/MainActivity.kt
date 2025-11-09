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
    
    companion object {
        private const val WEB_APP_URL = "https://taranezy.ddns.net:8444"
    }
    
    private fun enableFullscreen() {
        // Hide system UI elements for immersive fullscreen experience
        @Suppress("DEPRECATION")
        window.decorView.systemUiVisibility = (
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                or View.SYSTEM_UI_FLAG_FULLSCREEN
        )
    }
    
    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) {
            // Re-enable fullscreen when window gains focus
            enableFullscreen()
        }
    }
    
    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        Log.d("MainActivity", "onCreate started")
        
        // Enable fullscreen immersive mode
        enableFullscreen()
        
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        setSupportActionBar(binding.toolbar)
        supportActionBar?.setDisplayShowTitleEnabled(true)
        supportActionBar?.title = getString(R.string.app_name)
        
        // Get auth data from LoginActivity
        val email = intent.getStringExtra("email")
        val idToken = intent.getStringExtra("idToken")
        val displayName = intent.getStringExtra("displayName")
        
        Log.d("MainActivity", "User: $displayName ($email)")
        
        setupWebView()
        loadWebApp(email, idToken)
        
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
            CookieManager.getInstance().flush()
            Log.d("MainActivity", "Cookies synced")
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
            
            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                Log.d("MainActivity", "Page loaded: $url")
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
            
            // Store auth data for website to access
            if (email != null && idToken != null) {
                // Store in localStorage so website can access
                val jsCode = """
                    localStorage.setItem('streamlet_email', '$email');
                    localStorage.setItem('streamlet_id_token', '$idToken');
                """.trimIndent()
                webView.evaluateJavascript(jsCode) { result ->
                    Log.d("MainActivity", "Auth data stored in localStorage: $result")
                }
            }
            
            webView.loadUrl(WEB_APP_URL)
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

