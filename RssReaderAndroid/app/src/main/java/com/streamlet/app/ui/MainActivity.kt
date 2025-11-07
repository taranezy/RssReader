package com.streamlet.app.ui

import android.annotation.SuppressLint
import android.net.Uri
import android.os.Bundle
import android.util.Log
import android.view.KeyEvent
import android.view.Menu
import android.view.MenuItem
import android.webkit.CookieManager
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity
import androidx.browser.customtabs.CustomTabsIntent
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
    
    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        Log.d("MainActivity", "onCreate started")
        
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        setSupportActionBar(binding.toolbar)
        supportActionBar?.setDisplayShowTitleEnabled(true)
        supportActionBar?.title = getString(R.string.app_name)
        
        setupWebView()
        loadWebApp()
        
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
            databaseEnabled = true
            allowContentAccess = true
            allowFileAccess = false
            setSupportZoom(true)
            builtInZoomControls = true
            displayZoomControls = false
            loadWithOverviewMode = true
            useWideViewPort = true
            javaScriptCanOpenWindowsAutomatically = false
            mediaPlaybackRequiresUserGesture = false
        }
        
        // Enable cookies for session management
        CookieManager.getInstance().apply {
            setAcceptCookie(true)
            setAcceptThirdPartyCookies(webView, true)
        }
        
        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                val url = request?.url.toString()
                Log.d("MainActivity", "URL loading: $url")
                
                // Intercept Google OAuth URLs
                if (isGoogleOAuthUrl(url)) {
                    Log.d("MainActivity", "OAuth URL detected, opening Chrome Custom Tab")
                    openChromeCustomTab(url)
                    return true // Don't load in WebView
                }
                
                return false // Load normally in WebView
            }
            
            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                Log.d("MainActivity", "Page loaded: $url")
            }
            
            override fun onReceivedError(
                view: WebView?,
                errorCode: Int,
                description: String?,
                failingUrl: String?
            ) {
                super.onReceivedError(view, errorCode, description, failingUrl)
                Log.e("MainActivity", "WebView error: $description")
                Snackbar.make(
                    binding.root,
                    "Error loading page: $description",
                    Snackbar.LENGTH_LONG
                ).show()
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
    
    private fun loadWebApp() {
        Log.d("MainActivity", "Loading web app: $WEB_APP_URL")
        webView.loadUrl(WEB_APP_URL)
    }
    
    private fun isGoogleOAuthUrl(url: String): Boolean {
        return url.contains("accounts.google.com/o/oauth2") ||
               url.contains("accounts.google.com/signin") ||
               url.contains("accounts.google.com/ServiceLogin") ||
               url.contains("accounts.google.com/gsi")
    }
    
    private fun openChromeCustomTab(url: String) {
        try {
            val builder = CustomTabsIntent.Builder()
            builder.setToolbarColor(ContextCompat.getColor(this, R.color.primary_purple))
            builder.setShowTitle(true)
            
            val customTabsIntent = builder.build()
            customTabsIntent.launchUrl(this, Uri.parse(url))
            
            Log.d("MainActivity", "Chrome Custom Tab launched successfully")
        } catch (e: Exception) {
            Log.e("MainActivity", "Failed to open Chrome Custom Tab", e)
            Snackbar.make(
                binding.root,
                "Failed to open login page. Please ensure Chrome is installed.",
                Snackbar.LENGTH_LONG
            ).show()
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
        // Clear WebView data - this will log out of the web app
        webView.clearCache(true)
        webView.clearHistory()
        CookieManager.getInstance().removeAllCookies(null)
        CookieManager.getInstance().flush()
        
        // Reload to show login page
        webView.loadUrl(WEB_APP_URL)
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

