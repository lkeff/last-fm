// Renderer process for Brass Stabs Electron App
// Handles UI interactions and communicates with main process via preload APIs

class BrassStabsApp {
  constructor () {
    this.currentSearchType = 'lastfm'
    this.searchCache = new Map()
    this.isLoading = false
    this.selectedFiles = []
    this.fiddleTemplates = []

    // Security-related properties
    this.isSessionLocked = false
    this.sensitiveDataBackup = new Map()
    this.activityTimer = null
    this.lockScreenElement = null
    this.securityConfig = {
      afkTimeout: window.api?.constants?.SECURITY?.AFK_SETTINGS?.DEFAULT_TIMEOUT || 10 * 60 * 1000,
      warningTime: window.api?.constants?.SECURITY?.AFK_SETTINGS?.WARNING_TIME || 2 * 60 * 1000,
      activityEvents: ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'],
      sensitiveSelectors: [
        '.api-key', '.token', '.credential', '.password',
        '.search-history', '.user-data', '.personal-info'
      ]
    }

    this.init()
  }

  async init () {
    try {
      this.setupEventListeners()
      this.setupSearchDebouncing()
      this.setupSecurityFeatures()
      await this.loadFiddleTemplates()
      this.showNotification('🎺 Brass Stabs App loaded successfully!', 'success')

      // Log successful initialization with security context
      await this.secureLog('info', 'Brass Stabs App initialized successfully', {
        features: ['Security', 'AFK Guard', 'Input Validation', 'Memory Protection'],
        timestamp: Date.now()
      })
    } catch (error) {
      await this.showError('Failed to initialize app', error)
    }
  }

  setupEventListeners () {
    // Search form submissions with security validation
    const lastfmForm = document.getElementById('lastfm-search-form')
    const localBrassForm = document.getElementById('local-brass-search-form')
    const onlineBrassForm = document.getElementById('online-brass-search-form')

    if (lastfmForm) {
      lastfmForm.addEventListener('submit', (e) => this.handleSecureSearch(e, 'lastfm'))
    }
    if (localBrassForm) {
      localBrassForm.addEventListener('submit', (e) => this.handleSecureSearch(e, 'local-brass'))
    }
    if (onlineBrassForm) {
      onlineBrassForm.addEventListener('submit', (e) => this.handleSecureSearch(e, 'online-brass'))
    }

    // Tab switching with activity reporting
    const tabButtons = document.querySelectorAll('.tab-button')
    tabButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        this.reportUserActivity('tab-switch')
        this.switchTab(e.target.dataset.tab)
      })
    })

    // File selection for brass samples with security checks
    const selectFileBtn = document.getElementById('select-brass-file-btn')
    if (selectFileBtn) {
      selectFileBtn.addEventListener('click', () => {
        this.reportUserActivity('file-selection')
        this.selectBrassFiles()
      })
    }

    // Add brass sample form with input sanitization
    const addSampleForm = document.getElementById('add-sample-form')
    if (addSampleForm) {
      addSampleForm.addEventListener('submit', (e) => this.handleSecureAddSample(e))
    }

    // Fiddle template buttons with security validation
    const openFiddleBtn = document.getElementById('open-fiddle-btn')
    if (openFiddleBtn) {
      openFiddleBtn.addEventListener('click', () => {
        this.reportUserActivity('fiddle-open')
        this.openSelectedFiddle()
      })
    }

    // Clear results buttons with secure cache clearing
    const clearButtons = document.querySelectorAll('.clear-results-btn')
    clearButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.reportUserActivity('clear-results')
        this.secureClearResults(e.target.dataset.type)
      })
    })

    // Search input real-time validation with security checks
    const searchInputs = document.querySelectorAll('.search-input')
    searchInputs.forEach(input => {
      input.addEventListener('input', (e) => {
        this.reportUserActivity('input')
        this.validateSecureSearchInput(e.target)
      })
    })

    // Setup activity tracking for AFK guard
    this.setupActivityTracking()
  }

  setupSearchDebouncing () {
    // Create debounced search functions for real-time search with security validation
    this.debouncedLastFmSearch = window.api.utils.debounce(
      (query) => this.performSecureSearch('lastfm', query),
      window.api.constants.DEBOUNCE_DELAY
    )

    this.debouncedLocalSearch = window.api.utils.debounce(
      (query) => this.performSecureSearch('local-brass', query),
      window.api.constants.DEBOUNCE_DELAY
    )

    // Add real-time search listeners with security validation
    const lastfmInput = document.getElementById('lastfm-query')
    const localInput = document.getElementById('local-brass-query')

    if (lastfmInput) {
      lastfmInput.addEventListener('input', (e) => {
        this.reportUserActivity('search-input')
        const query = this.sanitizeInput(e.target.value.trim())
        if (query.length > 2 && this.validateSecureQuery(query)) {
          this.debouncedLastFmSearch(query)
        }
      })
    }

    if (localInput) {
      localInput.addEventListener('input', (e) => {
        this.reportUserActivity('search-input')
        const query = this.sanitizeInput(e.target.value.trim())
        if (query.length > 1 && this.validateSecureQuery(query)) {
          this.debouncedLocalSearch(query)
        }
      })
    }
  }

  /**
   * Setup comprehensive security features
   */
  setupSecurityFeatures () {
    this.createLockScreenOverlay()
    this.setupSessionStateMonitoring()
    this.setupMemoryProtection()
    this.setupSecureErrorHandling()

    // Initialize AFK guard if available
    if (window.api && window.api.afkGuard) {
      this.initializeAFKGuard()
    }
  }

  /**
   * Setup activity tracking for AFK guard
   */
  setupActivityTracking () {
    this.securityConfig.activityEvents.forEach(eventType => {
      document.addEventListener(eventType, () => {
        this.reportUserActivity(eventType)
      }, { passive: true })
    })

    // Track visibility changes
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.reportUserActivity('visibility-change')
      }
    })

    // Track window focus
    window.addEventListener('focus', () => {
      this.reportUserActivity('window-focus')
    })
  }

  /**
   * Report user activity to AFK guard system
   * @param {string} activityType - Type of activity
   */
  async reportUserActivity (activityType) {
    if (this.isSessionLocked) return

    try {
      if (window.api && window.api.afkGuard && window.api.afkGuard.reportActivity) {
        await window.api.afkGuard.reportActivity({
          type: activityType,
          timestamp: Date.now(),
          source: 'renderer'
        })
      }
    } catch (error) {
      // Silently handle activity reporting errors to avoid disrupting user experience
      await this.secureLog('warn', 'Failed to report user activity', {
        activityType,
        error: error.message
      })
    }
  }

  /**
   * Initialize AFK guard functionality
   */
  async initializeAFKGuard () {
    try {
      // Check initial session status
      const statusResult = await window.api.afkGuard.checkLockStatus()
      if (statusResult.success && statusResult.data && statusResult.data.locked) {
        this.handleSessionLock()
      }

      // Set up periodic status checks
      setInterval(async () => {
        try {
          const status = await window.api.afkGuard.checkLockStatus()
          if (status.success && status.data) {
            if (status.data.locked && !this.isSessionLocked) {
              this.handleSessionLock()
            } else if (!status.data.locked && this.isSessionLocked) {
              this.handleSessionUnlock()
            }
          }
        } catch (error) {
          await this.secureLog('warn', 'AFK status check failed', { error: error.message })
        }
      }, 5000) // Check every 5 seconds

      await this.secureLog('info', 'AFK Guard initialized successfully')
    } catch (error) {
      await this.secureLog('error', 'Failed to initialize AFK Guard', { error: error.message })
    }
  }

  /**
   * Create lock screen overlay
   */
  createLockScreenOverlay () {
    this.lockScreenElement = document.createElement('div')
    this.lockScreenElement.id = 'afk-lock-screen'
    this.lockScreenElement.className = 'afk-lock-screen hidden'
    this.lockScreenElement.innerHTML = `
      <div class="lock-screen-content">
        <div class="lock-icon">🔒</div>
        <h2>Session Locked</h2>
        <p>Your session has been locked due to inactivity.</p>
        <p>Click anywhere to unlock and resume your work.</p>
        <button id="unlock-session-btn" class="btn-primary">Unlock Session</button>
        <div class="security-notice">
          <small>🛡️ Your data is protected while the session is locked</small>
        </div>
      </div>
    `

    // Add unlock functionality
    this.lockScreenElement.addEventListener('click', () => {
      this.requestSessionUnlock()
    })

    document.body.appendChild(this.lockScreenElement)
  }

  /**
   * Handle session lock
   */
  async handleSessionLock () {
    if (this.isSessionLocked) return

    this.isSessionLocked = true

    try {
      // Blank sensitive data
      await this.blankSensitiveData()

      // Clear memory cache
      this.clearMemoryCache()

      // Show lock screen
      this.lockScreenElement.classList.remove('hidden')

      // Disable all interactive elements
      this.disableInteractiveElements()

      await this.secureLog('info', 'Session locked successfully')
    } catch (error) {
      await this.secureLog('error', 'Error during session lock', { error: error.message })
    }
  }

  /**
   * Handle session unlock
   */
  async handleSessionUnlock () {
    if (!this.isSessionLocked) return

    try {
      // Restore sensitive data
      await this.restoreSensitiveData()

      // Hide lock screen
      this.lockScreenElement.classList.add('hidden')

      // Re-enable interactive elements
      this.enableInteractiveElements()

      this.isSessionLocked = false

      await this.secureLog('info', 'Session unlocked successfully')
      this.showNotification('Session unlocked successfully', 'success')
    } catch (error) {
      await this.secureLog('error', 'Error during session unlock', { error: error.message })
    }
  }

  /**
   * Request session unlock
   */
  async requestSessionUnlock () {
    try {
      const result = await window.api.afkGuard.requestUnlock({
        method: 'click',
        timestamp: Date.now()
      })

      if (result.success && result.data && result.data.unlocked) {
        await this.handleSessionUnlock()
      } else {
        this.showNotification('Failed to unlock session', 'error')
      }
    } catch (error) {
      await this.secureLog('error', 'Failed to request session unlock', { error: error.message })
      this.showNotification('Failed to unlock session', 'error')
    }
  }

  /**
   * Blank sensitive data during session lock
   */
  async blankSensitiveData () {
    try {
      // Find and backup sensitive elements
      this.securityConfig.sensitiveSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector)
        elements.forEach(element => {
          if (element.textContent || element.value) {
            // Backup original content
            const elementId = element.id || `element_${Date.now()}_${Math.random()}`
            this.sensitiveDataBackup.set(elementId, {
              content: element.textContent || element.value,
              type: element.tagName.toLowerCase(),
              isInput: element.tagName.toLowerCase() === 'input'
            })

            // Blank the content
            if (element.tagName.toLowerCase() === 'input') {
              element.value = '[PROTECTED]'
            } else {
              element.textContent = '[PROTECTED]'
            }

            element.id = elementId
          }
        })
      })

      // Clear search results
      const resultContainers = document.querySelectorAll('[id$="-results"]')
      resultContainers.forEach(container => {
        if (container.innerHTML) {
          this.sensitiveDataBackup.set(container.id, {
            content: container.innerHTML,
            type: 'results'
          })
          container.innerHTML = '<div class="protected-content">🔒 Content protected during session lock</div>'
        }
      })

      // Clear search inputs
      const searchInputs = document.querySelectorAll('.search-input')
      searchInputs.forEach(input => {
        if (input.value) {
          this.sensitiveDataBackup.set(input.id || input.name, {
            content: input.value,
            type: 'search-input'
          })
          input.value = ''
        }
      })

      await this.secureLog('info', 'Sensitive data blanked successfully')
    } catch (error) {
      await this.secureLog('error', 'Error blanking sensitive data', { error: error.message })
    }
  }

  /**
   * Restore sensitive data after session unlock
   */
  async restoreSensitiveData () {
    try {
      // Restore backed up content
      for (const [elementId, backup] of this.sensitiveDataBackup.entries()) {
        const element = document.getElementById(elementId)
        if (element && backup.content) {
          if (backup.type === 'results') {
            element.innerHTML = backup.content
            // Re-setup event listeners for restored content
            this.setupResultActionListeners(element)
          } else if (backup.isInput || backup.type === 'search-input') {
            element.value = backup.content
          } else {
            element.textContent = backup.content
          }
        }
      }

      // Clear backup
      this.sensitiveDataBackup.clear()

      await this.secureLog('info', 'Sensitive data restored successfully')
    } catch (error) {
      await this.secureLog('error', 'Error restoring sensitive data', { error: error.message })
    }
  }

  /**
   * Clear memory cache for security
   */
  clearMemoryCache () {
    try {
      // Clear search cache
      this.searchCache.clear()

      // Clear selected files
      this.selectedFiles = []

      // Clear any temporary data
      if (window.searchCache) {
        window.searchCache.clear()
      }
      if (window.apiCache) {
        window.apiCache.clear()
      }

      // Force garbage collection if available
      if (window.gc) {
        window.gc()
      }
    } catch (error) {
      this.secureLog('warn', 'Error clearing memory cache', { error: error.message })
    }
  }

  /**
   * Disable interactive elements during session lock
   */
  disableInteractiveElements () {
    const interactiveElements = document.querySelectorAll('button, input, select, textarea, a')
    interactiveElements.forEach(element => {
      if (element.id !== 'unlock-session-btn') {
        element.disabled = true
        element.classList.add('session-locked')
      }
    })
  }

  /**
   * Enable interactive elements after session unlock
   */
  enableInteractiveElements () {
    const interactiveElements = document.querySelectorAll('.session-locked')
    interactiveElements.forEach(element => {
      element.disabled = false
      element.classList.remove('session-locked')
    })
  }

  /**
   * Setup session state monitoring
   */
  setupSessionStateMonitoring () {
    // Monitor for session state changes
    setInterval(async () => {
      if (window.api && window.api.afkGuard) {
        try {
          const status = await window.api.afkGuard.checkLockStatus()
          if (status.success && status.data) {
            const shouldBeLocked = status.data.locked
            if (shouldBeLocked !== this.isSessionLocked) {
              if (shouldBeLocked) {
                await this.handleSessionLock()
              } else {
                await this.handleSessionUnlock()
              }
            }
          }
        } catch (error) {
          // Silently handle monitoring errors
        }
      }
    }, 2000)
  }

  /**
   * Setup memory protection
   */
  setupMemoryProtection () {
    // Periodic memory cleanup
    setInterval(() => {
      if (!this.isSessionLocked) {
        this.cleanupMemory()
      }
    }, 5 * 60 * 1000) // Every 5 minutes

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
      this.cleanupMemory()
      this.clearSensitiveVariables()
    })
  }

  /**
   * Clean up memory periodically
   */
  cleanupMemory () {
    try {
      // Remove old cache entries
      const now = Date.now()
      const maxAge = 10 * 60 * 1000 // 10 minutes

      for (const [key, value] of this.searchCache.entries()) {
        if (value.timestamp && (now - value.timestamp) > maxAge) {
          this.searchCache.delete(key)
        }
      }

      // Clear temporary variables
      if (window.tempData) {
        window.tempData = null
      }

      // Force garbage collection if available
      if (window.gc) {
        window.gc()
      }
    } catch (error) {
      this.secureLog('warn', 'Memory cleanup error', { error: error.message })
    }
  }

  /**
   * Clear sensitive variables from memory
   */
  clearSensitiveVariables () {
    try {
      // Clear any sensitive data from instance variables
      this.selectedFiles = []
      this.searchCache.clear()
      this.sensitiveDataBackup.clear()

      // Clear any global sensitive variables
      if (window.apiKeys) window.apiKeys = null
      if (window.tokens) window.tokens = null
      if (window.credentials) window.credentials = null
    } catch (error) {
      this.secureLog('warn', 'Error clearing sensitive variables', { error: error.message })
    }
  }

  /**
   * Setup secure error handling
   */
  setupSecureErrorHandling () {
    // Override console methods to use secure logging
    const originalConsoleError = console.error
    const originalConsoleWarn = console.warn

    console.error = (...args) => {
      this.secureLog('error', 'Console Error', { args: this.sanitizeLogData(args) })
      if (process.env.NODE_ENV === 'development') {
        originalConsoleError.apply(console, args)
      }
    }

    console.warn = (...args) => {
      this.secureLog('warn', 'Console Warning', { args: this.sanitizeLogData(args) })
      if (process.env.NODE_ENV === 'development') {
        originalConsoleWarn.apply(console, args)
      }
    }
  }

  /**
   * Handle secure search with enhanced validation
   */
  async handleSecureSearch (event, searchType) {
    event.preventDefault()

    if (this.isSessionLocked) {
      this.showNotification('Session is locked. Please unlock to continue.', 'warning')
      return
    }

    try {
      this.reportUserActivity('search-submit')

      const formData = new FormData(event.target)
      const rawQuery = formData.get('query')?.trim()

      // Sanitize and validate input
      const query = this.sanitizeInput(rawQuery)

      if (!this.validateSecureQuery(query)) {
        await this.showError('Please enter a valid and safe search query')
        return
      }

      await this.performSecureSearch(searchType, query)
    } catch (error) {
      await this.showError('Search request failed', error)
    }
  }

  /**
   * Legacy method for backward compatibility
   */
  async handleSearch (event, searchType) {
    return this.handleSecureSearch(event, searchType)
  }

  /**
   * Perform secure search with enhanced validation and sanitization
   */
  async performSecureSearch (searchType, query) {
    if (this.isLoading || this.isSessionLocked) return

    try {
      this.setLoadingState(searchType, true)
      this.clearError()

      // Additional security validation
      if (!this.validateSecureQuery(query)) {
        throw new Error('Query failed security validation')
      }

      // Check cache first (with timestamp validation)
      const cacheKey = `${searchType}:${this.hashQuery(query)}`
      if (this.searchCache.has(cacheKey)) {
        const cachedEntry = this.searchCache.get(cacheKey)
        const cacheAge = Date.now() - (cachedEntry.timestamp || 0)
        const maxCacheAge = 5 * 60 * 1000 // 5 minutes

        if (cacheAge < maxCacheAge) {
          await this.displaySecureResults(searchType, cachedEntry.data, query)
          return
        } else {
          // Remove expired cache entry
          this.searchCache.delete(cacheKey)
        }
      }

      let result
      switch (searchType) {
        case 'lastfm':
          result = await window.api.searchLastFm(query)
          break
        case 'local-brass':
          result = await window.api.searchLocalBrass(query)
          break
        case 'online-brass':
          result = await window.api.searchOnlineBrass(query)
          break
        default:
          throw new Error(`Unknown search type: ${searchType}`)
      }

      if (result.success) {
        // Sanitize results before caching and display
        const sanitizedData = await this.sanitizeSearchResults(result.data)

        // Cache successful results with timestamp
        this.searchCache.set(cacheKey, {
          data: sanitizedData,
          timestamp: Date.now(),
          query: this.hashQuery(query)
        })

        await this.displaySecureResults(searchType, sanitizedData, query)
        this.showNotification(`Found ${this.getResultCount(sanitizedData)} results for "${this.sanitizeInput(query)}"`, 'success')

        await this.secureLog('info', 'Search completed successfully', {
          searchType,
          resultCount: this.getResultCount(sanitizedData),
          cached: false
        })
      } else {
        await this.showError(`Search failed: ${result.error?.message || 'Unknown error'}`)
        await this.displaySecureResults(searchType, [], query)
      }
    } catch (error) {
      await this.showError('Search failed', error)
      await this.displaySecureResults(searchType, [], query)
    } finally {
      this.setLoadingState(searchType, false)
    }
  }

  /**
   * Legacy method for backward compatibility
   */
  async performSearch (searchType, query) {
    return this.performSecureSearch(searchType, query)
  }

  /**
   * Display results with comprehensive security measures
   */
  async displaySecureResults (searchType, data, query) {
    const resultsContainer = document.getElementById(`${searchType}-results`)
    if (!resultsContainer) return

    try {
      // Clear previous results securely
      this.securelyEmptyContainer(resultsContainer)

      if (!data || (Array.isArray(data) && data.length === 0)) {
        const sanitizedQuery = await this.sanitizeHtml(query)
        resultsContainer.innerHTML = `
          <div class="no-results">
            <p>No results found for "${sanitizedQuery}"</p>
          </div>
        `
        return
      }

      switch (searchType) {
        case 'lastfm':
          await this.displaySecureLastFmResults(resultsContainer, data)
          break
        case 'local-brass':
          await this.displaySecureBrassResults(resultsContainer, data, 'local')
          break
        case 'online-brass':
          await this.displaySecureBrassResults(resultsContainer, data, 'online')
          break
      }
    } catch (error) {
      await this.secureLog('error', 'Error displaying results', {
        searchType,
        error: error.message
      })
      resultsContainer.innerHTML = '<div class="error-results"><p>Error displaying results</p></div>'
    }
  }

  /**
   * Legacy method for backward compatibility
   */
  async displayResults (searchType, data, query) {
    return this.displaySecureResults(searchType, data, query)
  }

  /**
   * Display Last.fm results with comprehensive security measures
   */
  async displaySecureLastFmResults (container, data) {
    if (!data.result) {
      container.innerHTML = '<div class="no-results"><p>No Last.fm results found</p></div>'
      return
    }

    const results = data.result
    const normalization = data.normalization || {}
    let html = '<div class="results-grid">'

    try {
      // Add normalization legend if available
      if (Object.keys(normalization).length > 0) {
        html += await this.renderSecureNormalizationLegend(normalization)
      }

      // Display artists with security sanitization
      if (results.artist && results.artist.length > 0) {
        html += '<div class="result-section"><h3>Artists</h3>'
        for (const artist of results.artist) {
          const sanitizedName = await this.sanitizeHtml(artist.name)
          const normalizedMetrics = await this.renderSecureNormalizedMetrics(artist, ['listeners', 'playcount'], normalization.artist)
          const secureUrl = await this.createSecureExternalLink(artist.url, 'View on Last.fm')

          html += `
            <div class="result-item artist-item">
              <div class="result-info">
                <h4>${sanitizedName}</h4>
                <div class="result-meta-container">
                  <p class="result-meta">Listeners: ${this.sanitizeNumber(artist.listeners) || 'N/A'}</p>
                  ${artist.playcount ? `<p class="result-meta">Play Count: ${this.sanitizeNumber(artist.playcount)}</p>` : ''}
                  ${normalizedMetrics}
                </div>
                ${secureUrl}
              </div>
            </div>
          `
        }
        html += '</div>'
      }

      // Display tracks with security sanitization
      if (results.track && results.track.length > 0) {
        html += '<div class="result-section"><h3>Tracks</h3>'
        for (const track of results.track) {
          const sanitizedName = await this.sanitizeHtml(track.name)
          const sanitizedArtist = await this.sanitizeHtml(track.artist)
          const normalizedMetrics = await this.renderSecureNormalizedMetrics(track, ['listeners', 'playcount'], normalization.track)
          const secureUrl = await this.createSecureExternalLink(track.url, 'View on Last.fm')

          html += `
            <div class="result-item track-item">
              <div class="result-info">
                <h4>${sanitizedName}</h4>
                <p class="result-artist">by ${sanitizedArtist}</p>
                <div class="result-meta-container">
                  <p class="result-meta">Listeners: ${this.sanitizeNumber(track.listeners) || 'N/A'}</p>
                  ${track.playcount ? `<p class="result-meta">Play Count: ${this.sanitizeNumber(track.playcount)}</p>` : ''}
                  ${normalizedMetrics}
                </div>
                ${secureUrl}
              </div>
            </div>
          `
        }
        html += '</div>'
      }

      // Display albums with security sanitization
      if (results.album && results.album.length > 0) {
        html += '<div class="result-section"><h3>Albums</h3>'
        for (const album of results.album) {
          const sanitizedName = await this.sanitizeHtml(album.name)
          const sanitizedArtist = await this.sanitizeHtml(album.artist)
          const normalizedMetrics = await this.renderSecureNormalizedMetrics(album, ['listeners', 'playcount'], normalization.album)
          const secureUrl = await this.createSecureExternalLink(album.url, 'View on Last.fm')

          html += `
            <div class="result-item album-item">
              <div class="result-info">
                <h4>${sanitizedName}</h4>
                <p class="result-artist">by ${sanitizedArtist}</p>
                <div class="result-meta-container">
                  <p class="result-meta">Listeners: ${this.sanitizeNumber(album.listeners) || 'N/A'}</p>
                  ${album.playcount ? `<p class="result-meta">Play Count: ${this.sanitizeNumber(album.playcount)}</p>` : ''}
                  ${normalizedMetrics}
                </div>
                ${secureUrl}
              </div>
            </div>
          `
        }
        html += '</div>'
      }

      html += '</div>'
      container.innerHTML = html

      // Setup secure event listeners for external links
      this.setupSecureExternalLinkListeners(container)
    } catch (error) {
      await this.secureLog('error', 'Error displaying Last.fm results', { error: error.message })
      container.innerHTML = '<div class="error-results"><p>Error displaying Last.fm results</p></div>'
    }
  }

  /**
   * Legacy method for backward compatibility
   */
  async displayLastFmResults (container, data) {
    return this.displaySecureLastFmResults(container, data)
  }

  /**
   * Display brass results with comprehensive security measures
   */
  async displaySecureBrassResults (container, data, source) {
    try {
      // Handle both old format (array) and new format (object with results and normalization)
      let samples, normalization
      if (Array.isArray(data)) {
        samples = data
        normalization = null
      } else {
        samples = data.results || data.data || []
        normalization = data.normalization
      }

      if (!Array.isArray(samples) || samples.length === 0) {
        container.innerHTML = '<div class="no-results"><p>No brass samples found</p></div>'
        return
      }

      let html = '<div class="results-grid">'

      // Add normalization legend if available
      if (normalization && Object.keys(normalization.ranges || {}).length > 0) {
        html += await this.renderSecureNormalizationLegend({ [source]: normalization })
      }

      for (const sample of samples) {
        const sanitizedName = await this.sanitizeHtml(sample.name)
        const sanitizedDescription = sample.description ? await this.sanitizeHtml(sample.description) : ''
        const sanitizedUsername = sample.username ? await this.sanitizeHtml(sample.username) : 'Unknown'

        const duration = sample.duration ? window.api.utils.formatDuration(sample.duration) : 'Unknown'
        const filesize = sample.filesize ? window.api.utils.formatFileSize(sample.filesize) : 'Unknown'

        // Sanitize and limit tags
        const tags = Array.isArray(sample.tags)
          ? (await Promise.all(sample.tags.slice(0, 5).map(tag => this.sanitizeHtml(tag)))).join(', ')
          : ''

        // Determine which fields to show normalized values for based on source
        const fieldsToNormalize = source === 'online' ? ['duration', 'filesize', 'downloads'] : ['duration', 'filesize']
        const normalizedMetrics = await this.renderSecureNormalizedMetrics(sample, fieldsToNormalize, normalization)

        // Sanitize sample data for JSON embedding
        const sanitizedSampleData = await this.sanitizeSampleDataForJson(sample)

        html += `
          <div class="result-item brass-item" data-sample-id="${await this.sanitizeHtml(sample.id || sample.name)}">
            <div class="result-info">
              <h4>${sanitizedName}</h4>
              ${sanitizedDescription ? `<p class="result-description">${sanitizedDescription}</p>` : ''}
              <div class="result-meta-container">
                <div class="result-meta">
                  <span class="meta-item">Duration: ${duration}</span>
                  <span class="meta-item">Size: ${filesize}</span>
                  ${source === 'online' && sample.downloads ? `<span class="meta-item">Downloads: ${this.sanitizeNumber(sample.downloads)}</span>` : ''}
                  ${source === 'online' ? `<span class="meta-item">By: ${sanitizedUsername}</span>` : ''}
                </div>
                ${normalizedMetrics}
              </div>
              ${tags ? `<div class="result-tags">${tags}</div>` : ''}
              <div class="result-actions">
                ${sample.previews && sample.previews.preview_hq_mp3
                  ? `<button class="btn-secondary play-preview-btn" data-preview-url="${await this.sanitizeUrl(sample.previews.preview_hq_mp3)}">▶ Preview</button>`
: ''}
                ${source === 'online'
                  ? `<button class="btn-primary add-sample-btn" data-sample='${sanitizedSampleData}'>Add to Library</button>`
: ''}
                ${source === 'local' && sample.path
                  ? `<button class="btn-secondary open-file-btn" data-file-path="${await this.sanitizeHtml(sample.path)}">Open File</button>`
: ''}
              </div>
            </div>
          </div>
        `
      }

      html += '</div>'
      container.innerHTML = html

      // Add secure event listeners for action buttons
      this.setupSecureResultActionListeners(container)
    } catch (error) {
      await this.secureLog('error', 'Error displaying brass results', {
        source,
        error: error.message
      })
      container.innerHTML = '<div class="error-results"><p>Error displaying brass samples</p></div>'
    }
  }

  /**
   * Legacy method for backward compatibility
   */
  async displayBrassResults (container, data, source) {
    return this.displaySecureBrassResults(container, data, source)
  }

  /**
   * Setup secure result action listeners with comprehensive validation
   */
  setupSecureResultActionListeners (container) {
    try {
      // Preview buttons with URL validation
      const playButtons = container.querySelectorAll('.play-preview-btn')
      playButtons.forEach(btn => {
        btn.addEventListener('click', async (e) => {
          this.reportUserActivity('preview-play')
          const url = e.target.dataset.previewUrl
          if (await this.validateAudioUrl(url)) {
            this.playSecurePreview(url, e.target)
          } else {
            this.showNotification('Invalid preview URL detected', 'error')
          }
        })
      })

      // Add sample buttons with data validation
      const addButtons = container.querySelectorAll('.add-sample-btn')
      addButtons.forEach(btn => {
        btn.addEventListener('click', async (e) => {
          this.reportUserActivity('sample-add')
          try {
            const sampleDataString = e.target.dataset.sample
            const sampleData = JSON.parse(sampleDataString)

            // Validate sample data
            if (await this.validateSampleData(sampleData)) {
              this.addSecureSampleToLibrary(sampleData, e.target)
            } else {
              this.showNotification('Invalid sample data detected', 'error')
            }
          } catch (parseError) {
            await this.secureLog('error', 'Failed to parse sample data', { error: parseError.message })
            this.showNotification('Invalid sample data format', 'error')
          }
        })
      })

      // Open file buttons with path validation
      const openButtons = container.querySelectorAll('.open-file-btn')
      openButtons.forEach(btn => {
        btn.addEventListener('click', async (e) => {
          this.reportUserActivity('file-open')
          const filePath = e.target.dataset.filePath
          if (await this.validateFilePath(filePath)) {
            this.openSecureFile(filePath)
          } else {
            this.showNotification('Invalid file path detected', 'error')
          }
        })
      })
    } catch (error) {
      this.secureLog('error', 'Error setting up result action listeners', { error: error.message })
    }
  }

  /**
   * Setup secure external link listeners
   */
  setupSecureExternalLinkListeners (container) {
    const externalLinks = container.querySelectorAll('.external-link')
    externalLinks.forEach(link => {
      link.addEventListener('click', async (e) => {
        e.preventDefault()
        this.reportUserActivity('external-link-click')

        const url = link.href
        if (await this.validateExternalUrl(url)) {
          this.openSecureExternalLink(url)
        } else {
          this.showNotification('Suspicious external link blocked', 'warning')
        }
      })
    })
  }

  /**
   * Legacy method for backward compatibility
   */
  setupResultActionListeners (container) {
    return this.setupSecureResultActionListeners(container)
  }

  /**
   * Play audio preview with security validation
   */
  async playSecurePreview (url, button) {
    try {
      if (this.isSessionLocked) {
        this.showNotification('Session is locked', 'warning')
        return
      }

      // Validate URL before playing
      if (!await this.validateAudioUrl(url)) {
        throw new Error('Invalid audio URL')
      }

      const originalText = button.textContent
      button.textContent = '⏸ Playing...'
      button.disabled = true

      const audio = new Audio(url)

      // Set security headers and constraints
      audio.crossOrigin = 'anonymous'
      audio.preload = 'none'

      // Add timeout for loading
      const loadTimeout = setTimeout(() => {
        audio.src = ''
        button.textContent = originalText
        button.disabled = false
        this.showNotification('Preview loading timeout', 'error')
      }, 10000)

      audio.addEventListener('loadstart', () => {
        clearTimeout(loadTimeout)
      })

      audio.addEventListener('ended', () => {
        button.textContent = originalText
        button.disabled = false
        this.reportUserActivity('preview-ended')
      })

      audio.addEventListener('error', (e) => {
        clearTimeout(loadTimeout)
        button.textContent = originalText
        button.disabled = false
        this.showError('Failed to play preview')
        this.secureLog('warn', 'Audio preview error', {
          url: this.hashUrl(url),
          error: e.message
        })
      })

      await audio.play()
      this.reportUserActivity('preview-started')

      await this.secureLog('info', 'Audio preview started', {
        urlHash: this.hashUrl(url)
      })
    } catch (error) {
      await this.showError('Failed to play preview', error)
      button.textContent = '▶ Preview'
      button.disabled = false
    }
  }

  /**
   * Legacy method for backward compatibility
   */
  async playPreview (url, button) {
    return this.playSecurePreview(url, button)
  }

  /**
   * Add sample to library with comprehensive security validation
   */
  async addSecureSampleToLibrary (sampleData, button) {
    try {
      if (this.isSessionLocked) {
        this.showNotification('Session is locked', 'warning')
        return
      }

      // Validate sample data
      if (!await this.validateSampleData(sampleData)) {
        throw new Error('Invalid sample data')
      }

      const originalText = button.textContent
      button.textContent = 'Adding...'
      button.disabled = true

      // Sanitize sample data before sending
      const sanitizedSampleData = {
        name: await this.sanitizeInput(sampleData.name),
        description: sampleData.description ? await this.sanitizeInput(sampleData.description) : '',
        tags: Array.isArray(sampleData.tags)
          ? await Promise.all(sampleData.tags.map(tag => this.sanitizeInput(tag)))
          : [],
        duration: this.sanitizeNumber(sampleData.duration),
        filesize: this.sanitizeNumber(sampleData.filesize),
        source: 'freesound',
        freesoundId: this.sanitizeNumber(sampleData.id),
        username: sampleData.username ? await this.sanitizeInput(sampleData.username) : '',
        previewUrl: sampleData.previews?.preview_hq_mp3
          ? await this.sanitizeUrl(sampleData.previews.preview_hq_mp3)
          : ''
      }

      const result = await window.api.addBrassSample(sanitizedSampleData)

      if (result.success) {
        button.textContent = '✓ Added'
        button.classList.add('added')
        this.showNotification('Sample added to library successfully!', 'success')

        await this.secureLog('info', 'Sample added to library', {
          sampleName: this.hashSensitiveData(sanitizedSampleData.name),
          source: sanitizedSampleData.source
        })
      } else {
        button.textContent = originalText
        button.disabled = false
        await this.showError(`Failed to add sample: ${result.error?.message || 'Unknown error'}`)
      }
    } catch (error) {
      button.textContent = 'Add to Library'
      button.disabled = false
      await this.showError('Failed to add sample', error)
    }
  }

  /**
   * Legacy method for backward compatibility
   */
  async addSampleToLibrary (sampleData, button) {
    return this.addSecureSampleToLibrary(sampleData, button)
  }

  /**
   * Open file with security validation
   */
  async openSecureFile (filePath) {
    try {
      if (this.isSessionLocked) {
        this.showNotification('Session is locked', 'warning')
        return
      }

      // Validate file path
      if (!await this.validateFilePath(filePath)) {
        throw new Error('Invalid file path')
      }

      // Use secure file opening through main process
      const result = await window.api.openExternalSafe(`file://${filePath}`)

      if (result.success && result.opened) {
        this.showNotification('File opened successfully', 'success')
        await this.secureLog('info', 'File opened', {
          pathHash: this.hashSensitiveData(filePath)
        })
      } else if (result.canceled) {
        this.showNotification('File opening canceled', 'info')
      } else {
        throw new Error(result.error || 'Failed to open file')
      }
    } catch (error) {
      await this.showError('Failed to open file', error)
    }
  }

  /**
   * Legacy method for backward compatibility
   */
  async openFile (filePath) {
    return this.openSecureFile(filePath)
  }

  /**
   * Open external link with security validation
   */
  async openSecureExternalLink (url) {
    try {
      if (this.isSessionLocked) {
        this.showNotification('Session is locked', 'warning')
        return
      }

      const result = await window.api.openExternalSafe(url)

      if (result.success && result.opened) {
        this.showNotification('Link opened successfully', 'success')
        await this.secureLog('info', 'External link opened', {
          urlHash: this.hashUrl(url),
          trusted: result.trusted || false,
          suspicious: result.suspicious || false
        })
      } else if (result.canceled) {
        this.showNotification('Link opening canceled', 'info')
      } else {
        throw new Error(result.error || 'Failed to open link')
      }
    } catch (error) {
      await this.showError('Failed to open external link', error)
    }
  }

  async selectBrassFiles () {
    try {
      this.setLoadingState('file-selection', true)

      const result = await window.api.selectBrassFile()

      if (result.success && !result.canceled) {
        this.selectedFiles = result.files
        this.displaySelectedFiles()
        this.showNotification(`Selected ${result.files.length} file(s)`, 'success')
      }
    } catch (error) {
      this.showError('Failed to select files', error)
    } finally {
      this.setLoadingState('file-selection', false)
    }
  }

  displaySelectedFiles () {
    const container = document.getElementById('selected-files')
    if (!container) return

    if (this.selectedFiles.length === 0) {
      container.innerHTML = '<p class="no-files">No files selected</p>'
      return
    }

    let html = '<div class="selected-files-list">'
    this.selectedFiles.forEach((file, index) => {
      html += `
        <div class="selected-file-item">
          <div class="file-info">
            <span class="file-name">${window.api.validators.sanitizeString(file.name)}</span>
            <span class="file-meta">${window.api.utils.formatFileSize(file.size)} • ${file.extension}</span>
          </div>
          <button class="btn-remove" onclick="app.removeSelectedFile(${index})">×</button>
        </div>
      `
    })
    html += '</div>'

    container.innerHTML = html
  }

  removeSelectedFile (index) {
    this.selectedFiles.splice(index, 1)
    this.displaySelectedFiles()
  }

  /**
   * Handle secure sample addition with comprehensive validation
   */
  async handleSecureAddSample (event) {
    event.preventDefault()

    if (this.isSessionLocked) {
      this.showNotification('Session is locked', 'warning')
      return
    }

    try {
      this.reportUserActivity('sample-add-form')

      const formData = new FormData(event.target)
      const rawName = formData.get('sample-name')?.trim()
      const rawDescription = formData.get('sample-description')?.trim()
      const rawTags = formData.get('sample-tags')?.trim()

      // Sanitize and validate inputs
      const name = await this.sanitizeInput(rawName)
      const description = await this.sanitizeInput(rawDescription)
      const tags = rawTags
        ? (await Promise.all(rawTags.split(',').map(tag => this.sanitizeInput(tag.trim())))).filter(tag => tag)
        : []

      if (!name || !this.validateSampleName(name)) {
        await this.showError('Valid sample name is required')
        return
      }

      if (this.selectedFiles.length === 0) {
        await this.showError('Please select at least one file')
        return
      }

      // Validate selected files
      for (const file of this.selectedFiles) {
        if (!await this.validateSelectedFile(file)) {
          await this.showError(`Invalid file: ${file.name}`)
          return
        }
      }

      this.setLoadingState('add-sample', true)

      let successCount = 0
      for (const file of this.selectedFiles) {
        const sampleData = {
          name: `${name}${this.selectedFiles.length > 1 ? ` - ${await this.sanitizeInput(file.name)}` : ''}`,
          path: file.path,
          description,
          tags,
          filesize: file.size,
          source: 'local'
        }

        const result = await window.api.addBrassSample(sampleData)

        if (result.success) {
          successCount++
        } else {
          await this.showError(`Failed to add ${file.name}: ${result.error?.message || 'Unknown error'}`)
        }
      }

      if (successCount > 0) {
        // Reset form and selected files securely
        this.secureFormReset(event.target)
        this.selectedFiles = []
        this.displaySelectedFiles()

        this.showNotification(`${successCount} sample(s) added successfully!`, 'success')

        await this.secureLog('info', 'Samples added successfully', {
          count: successCount,
          total: this.selectedFiles.length
        })

        // Refresh local search if there are results displayed
        await this.refreshLocalSearchIfNeeded()
      }
    } catch (error) {
      await this.showError('Failed to add sample', error)
    } finally {
      this.setLoadingState('add-sample', false)
    }
  }

  /**
   * Legacy method for backward compatibility
   */
  async handleAddSample (event) {
    return this.handleSecureAddSample(event)
  }

  async loadFiddleTemplates () {
    try {
      const result = await window.api.getFiddleTemplates()

      if (result.success) {
        this.fiddleTemplates = result.data
        this.displayFiddleTemplates()
      } else {
        this.showError('Failed to load fiddle templates')
      }
    } catch (error) {
      this.showError('Failed to load fiddle templates', error)
    }
  }

  displayFiddleTemplates () {
    const container = document.getElementById('fiddle-templates')
    if (!container) return

    if (this.fiddleTemplates.length === 0) {
      container.innerHTML = '<p class="no-templates">No fiddle templates available</p>'
      return
    }

    let html = '<div class="templates-grid">'
    this.fiddleTemplates.forEach(template => {
      html += `
        <div class="template-item" data-template='${JSON.stringify(template)}'>
          <h4>${window.api.validators.sanitizeString(template.name)}</h4>
          <p>${window.api.validators.sanitizeString(template.description)}</p>
          <button class="btn-primary open-template-btn">Open in Fiddle</button>
        </div>
      `
    })
    html += '</div>'

    container.innerHTML = html

    // Add event listeners for template buttons
    const templateButtons = container.querySelectorAll('.open-template-btn')
    templateButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const templateData = JSON.parse(e.target.closest('.template-item').dataset.template)
        this.openFiddle(templateData, e.target)
      })
    })
  }

  async openSelectedFiddle () {
    const selectedTemplate = document.querySelector('input[name="fiddle-template"]:checked')
    if (!selectedTemplate) {
      this.showError('Please select a fiddle template')
      return
    }

    const template = this.fiddleTemplates.find(t => t.filename === selectedTemplate.value)
    if (!template) {
      this.showError('Selected template not found')
      return
    }

    await this.openFiddle(template)
  }

  async openFiddle (template, button = null) {
    try {
      if (button) {
        const originalText = button.textContent
        button.textContent = 'Opening...'
        button.disabled = true
      }

      const result = await window.api.openFiddle(template)

      if (result.success) {
        let message = 'Fiddle opened successfully!'
        if (result.method === 'file') {
          message = 'Fiddle file created. Import it manually in Electron Fiddle.'
        } else if (result.method === 'content') {
          message = 'Electron Fiddle not found. Template content available for manual use.'
        }

        this.showNotification(message, 'success')
      } else {
        this.showError(`Failed to open fiddle: ${result.error.message}`)
      }
    } catch (error) {
      this.showError('Failed to open fiddle', error)
    } finally {
      if (button) {
        button.textContent = 'Open in Fiddle'
        button.disabled = false
      }
    }
  }

  switchTab (tabName) {
    // Hide all tab contents
    const tabContents = document.querySelectorAll('.tab-content')
    tabContents.forEach(content => content.classList.remove('active'))

    // Remove active class from all tab buttons
    const tabButtons = document.querySelectorAll('.tab-button')
    tabButtons.forEach(button => button.classList.remove('active'))

    // Show selected tab content
    const selectedContent = document.getElementById(`${tabName}-tab`)
    if (selectedContent) {
      selectedContent.classList.add('active')
    }

    // Add active class to selected tab button
    const selectedButton = document.querySelector(`[data-tab="${tabName}"]`)
    if (selectedButton) {
      selectedButton.classList.add('active')
    }

    this.currentSearchType = tabName
  }

  /**
   * Validate search input with comprehensive security checks
   */
  validateSecureSearchInput (input) {
    try {
      this.reportUserActivity('input-validation')

      const rawQuery = input.value.trim()
      const isBasicValid = window.api.validators.isValidQuery(rawQuery)
      const isSecureValid = this.validateSecureQuery(rawQuery)
      const isValid = isBasicValid && isSecureValid

      // Visual feedback for validation
      input.classList.toggle('invalid', !isValid && rawQuery.length > 0)
      input.classList.toggle('security-warning', isBasicValid && !isSecureValid)

      // Update submit button state
      const form = input.closest('form')
      const submitBtn = form?.querySelector('button[type="submit"]')
      if (submitBtn) {
        submitBtn.disabled = !isValid
      }

      // Show security warning if needed
      if (rawQuery.length > 0 && isBasicValid && !isSecureValid) {
        this.showSecurityWarning(input, 'Query contains potentially unsafe content')
      } else {
        this.clearSecurityWarning(input)
      }

      return isValid
    } catch (error) {
      this.secureLog('warn', 'Error in input validation', { error: error.message })
      return false
    }
  }

  /**
   * Legacy method for backward compatibility
   */
  validateSearchInput (input) {
    return this.validateSecureSearchInput(input)
  }

  setLoadingState (type, isLoading) {
    this.isLoading = isLoading

    // Update loading indicators
    const loadingIndicators = document.querySelectorAll(`[data-loading="${type}"]`)
    loadingIndicators.forEach(indicator => {
      indicator.style.display = isLoading ? 'block' : 'none'
    })

    // Update buttons
    const buttons = document.querySelectorAll(`[data-loading-btn="${type}"]`)
    buttons.forEach(btn => {
      btn.disabled = isLoading
      if (isLoading) {
        btn.dataset.originalText = btn.textContent
        btn.textContent = 'Loading...'
      } else if (btn.dataset.originalText) {
        btn.textContent = btn.dataset.originalText
      }
    })
  }

  /**
   * Securely clear results with memory protection
   */
  secureClearResults (type) {
    try {
      this.reportUserActivity('clear-results')

      const container = document.getElementById(`${type}-results`)
      if (container) {
        // Securely empty container
        this.securelyEmptyContainer(container)
      }

      // Securely clear cache for this type
      const keysToDelete = []
      for (const [key] of this.searchCache) {
        if (key.startsWith(`${type}:`)) {
          keysToDelete.push(key)
        }
      }

      keysToDelete.forEach(key => {
        this.searchCache.delete(key)
      })

      // Clear any related sensitive data
      this.clearTypeSpecificSensitiveData(type)

      this.showNotification(`${type} results cleared`, 'info')

      this.secureLog('info', 'Results cleared', { type, count: keysToDelete.length })
    } catch (error) {
      this.secureLog('error', 'Error clearing results', { type, error: error.message })
    }
  }

  /**
   * Legacy method for backward compatibility
   */
  clearResults (type) {
    return this.secureClearResults(type)
  }

  showNotification (message, type = 'info') {
    const notification = document.createElement('div')
    notification.className = `notification notification-${type}`
    notification.textContent = message

    const container = document.getElementById('notifications') || document.body
    container.appendChild(notification)

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification)
      }
    }, 5000)
  }

  /**
   * Show error with secure logging and sanitization
   */
  async showError (message, error = null) {
    try {
      // Sanitize error message to prevent information disclosure
      const sanitizedMessage = await this.sanitizeInput(message)
      let errorMessage = sanitizedMessage

      if (error) {
        const sanitizedError = this.sanitizeErrorMessage(error)
        errorMessage += `: ${sanitizedError}`
      }

      // Log securely without exposing sensitive details
      await this.secureLog('error', 'Application Error', {
        message: sanitizedMessage,
        hasError: !!error,
        errorType: error?.constructor?.name || 'Unknown',
        timestamp: Date.now()
      })

      this.showNotification(errorMessage, 'error')

      // Update error display element if it exists
      const errorDisplay = document.getElementById('error-display')
      if (errorDisplay) {
        errorDisplay.textContent = errorMessage
        errorDisplay.style.display = 'block'
      }
    } catch (loggingError) {
      // Fallback error handling if secure logging fails
      console.error('Error in error handling:', loggingError)
      this.showNotification('An error occurred', 'error')
    }
  }

  clearError () {
    const errorDisplay = document.getElementById('error-display')
    if (errorDisplay) {
      errorDisplay.style.display = 'none'
    }
  }

  /**
   * Renders normalized metrics as visual elements (progress bars, badges, etc.)
   * @param {Object} item - The data item containing normalized values
   * @param {Array<string>} fields - Fields to render normalized values for
   * @param {Object} normalizationMeta - Normalization metadata with ranges
   * @returns {string} HTML string with normalized value visualizations
   */
  renderNormalizedMetrics (item, fields, normalizationMeta) {
    if (!item || !fields || !normalizationMeta) {
      return ''
    }

    let html = '<div class="normalized-metrics">'

    fields.forEach(field => {
      const normalizedValue = item[`${field}_normalized`]
      const originalValue = item[`${field}_original`] || item[field]
      const fieldMeta = normalizationMeta.ranges?.[field]

      if (typeof normalizedValue === 'number' && fieldMeta) {
        const percentage = Math.round(normalizedValue)
        const colorClass = this.getNormalizedValueColorClass(percentage)
        const tooltipText = this.createNormalizationTooltip(field, originalValue, normalizedValue, fieldMeta)

        html += `
          <div class="normalized-metric" data-field="${field}">
            <div class="metric-label">${this.formatFieldName(field)} Score:</div>
            <div class="metric-visualization">
              <div class="progress-bar-container" title="${tooltipText}">
                <div class="progress-bar ${colorClass}" style="width: ${percentage}%"></div>
                <span class="progress-text">${percentage}%</span>
              </div>
              <span class="normalized-badge ${colorClass}">${this.getNormalizedValueLabel(percentage)}</span>
            </div>
          </div>
        `
      }
    })

    html += '</div>'
    return html
  }

  /**
   * Creates a normalization legend explaining the context
   * @param {Object} normalizationData - Normalization metadata for different result types
   * @returns {string} HTML string with normalization legend
   */
  renderNormalizationLegend (normalizationData) {
    let html = '<div class="normalization-legend">'
    html += '<div class="legend-header">'
    html += '<h4>📊 Normalized Scores</h4>'
    html += '<button class="legend-toggle" onclick="this.parentElement.parentElement.classList.toggle(\'expanded\')">ℹ️</button>'
    html += '</div>'
    html += '<div class="legend-content">'
    html += '<p>Values are normalized to 0-100% scale for easy comparison:</p>'
    html += '<div class="legend-items">'

    Object.entries(normalizationData).forEach(([type, meta]) => {
      if (meta && meta.ranges) {
        html += '<div class="legend-section">'
        html += `<h5>${this.formatResultType(type)}</h5>`

        Object.entries(meta.ranges).forEach(([field, range]) => {
          if (range && typeof range.min !== 'undefined' && typeof range.max !== 'undefined') {
            html += `
              <div class="legend-item">
                <span class="field-name">${this.formatFieldName(field)}:</span>
                <span class="range-info">
                  ${this.formatFieldValue(field, range.min)} - ${this.formatFieldValue(field, range.max)}
                  ${range.count ? `(${range.count} items)` : ''}
                </span>
              </div>
            `
          }
        })

        html += '</div>'
      }
    })

    html += '</div>'
    html += '<div class="legend-scale">'
    html += '<div class="scale-bar">'
    html += '<div class="scale-segment low"></div>'
    html += '<div class="scale-segment medium"></div>'
    html += '<div class="scale-segment high"></div>'
    html += '</div>'
    html += '<div class="scale-labels">'
    html += '<span>Low (0-33%)</span>'
    html += '<span>Medium (34-66%)</span>'
    html += '<span>High (67-100%)</span>'
    html += '</div>'
    html += '</div>'
    html += '</div>'
    html += '</div>'

    return html
  }

  /**
   * Gets CSS color class based on normalized percentage value
   * @param {number} percentage - Normalized percentage (0-100)
   * @returns {string} CSS class name
   */
  getNormalizedValueColorClass (percentage) {
    if (percentage >= 67) return 'high-value'
    if (percentage >= 34) return 'medium-value'
    return 'low-value'
  }

  /**
   * Gets human-readable label for normalized percentage
   * @param {number} percentage - Normalized percentage (0-100)
   * @returns {string} Label text
   */
  getNormalizedValueLabel (percentage) {
    if (percentage >= 67) return 'High'
    if (percentage >= 34) return 'Medium'
    return 'Low'
  }

  /**
   * Creates tooltip text explaining normalization context
   * @param {string} field - Field name
   * @param {*} originalValue - Original raw value
   * @param {number} normalizedValue - Normalized value (0-100)
   * @param {Object} fieldMeta - Field metadata with min/max ranges
   * @returns {string} Tooltip text
   */
  createNormalizationTooltip (field, originalValue, normalizedValue, fieldMeta) {
    const formattedOriginal = this.formatFieldValue(field, originalValue)
    const formattedMin = this.formatFieldValue(field, fieldMeta.min)
    const formattedMax = this.formatFieldValue(field, fieldMeta.max)

    return `${this.formatFieldName(field)}: ${formattedOriginal} (${Math.round(normalizedValue)}%)\nRange: ${formattedMin} - ${formattedMax}\nClick for more details`
  }

  /**
   * Formats field names for display
   * @param {string} field - Raw field name
   * @returns {string} Formatted field name
   */
  formatFieldName (field) {
    const fieldNames = {
      listeners: 'Listeners',
      playcount: 'Play Count',
      duration: 'Duration',
      filesize: 'File Size',
      downloads: 'Downloads'
    }
    return fieldNames[field] || field.charAt(0).toUpperCase() + field.slice(1)
  }

  /**
   * Formats field values for display based on field type
   * @param {string} field - Field name
   * @param {*} value - Value to format
   * @returns {string} Formatted value
   */
  formatFieldValue (field, value) {
    if (typeof value !== 'number' || isNaN(value)) {
      return 'N/A'
    }

    switch (field) {
      case 'duration':
        return window.api.utils.formatDuration(value)
      case 'filesize':
        return window.api.utils.formatFileSize(value)
      case 'listeners':
      case 'playcount':
      case 'downloads':
        return value.toLocaleString()
      default:
        return value.toString()
    }
  }

  /**
   * Formats result type names for display
   * @param {string} type - Raw type name
   * @returns {string} Formatted type name
   */
  formatResultType (type) {
    const typeNames = {
      artist: 'Artists',
      track: 'Tracks',
      album: 'Albums',
      local: 'Local Samples',
      online: 'Online Samples'
    }
    return typeNames[type] || type.charAt(0).toUpperCase() + type.slice(1)
  }

  getResultCount (data) {
    if (Array.isArray(data)) {
      return data.length
    }
    if (data && data.results) {
      return Array.isArray(data.results) ? data.results.length : 0
    }
    if (data && data.result) {
      let count = 0
      Object.values(data.result).forEach(items => {
        if (Array.isArray(items)) count += items.length
      })
      return count
    }
    return 0
  }

  // ============================================================================
  // SECURITY UTILITY METHODS
  // ============================================================================

  /**
   * Secure logging wrapper
   */
  async secureLog (level, message, data = null) {
    try {
      if (window.api && window.api.secureLog) {
        const sanitizedData = data ? this.sanitizeLogData(data) : null
        await window.api.secureLog(level, message, sanitizedData)
      } else {
        // Fallback to console in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`[${level.toUpperCase()}] ${message}`, data)
        }
      }
    } catch (error) {
      // Silent fallback to prevent logging loops
      if (process.env.NODE_ENV === 'development') {
        console.error('Secure logging failed:', error)
      }
    }
  }

  /**
   * Sanitize HTML content using API or fallback
   */
  async sanitizeHtml (htmlString) {
    try {
      if (window.api && window.api.security && window.api.security.sanitizeHtml) {
        const result = await window.api.security.sanitizeHtml(htmlString)
        return result.success ? result.data : window.api.security.escapeHtml(htmlString)
      } else {
        return window.api?.security?.escapeHtml(htmlString) || this.fallbackEscapeHtml(htmlString)
      }
    } catch (error) {
      await this.secureLog('warn', 'HTML sanitization failed, using fallback', { error: error.message })
      return this.fallbackEscapeHtml(htmlString)
    }
  }

  /**
   * Fallback HTML escaping
   */
  fallbackEscapeHtml (string) {
    if (typeof string !== 'string') return ''

    const htmlEscapes = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    }

    return string.replace(/[&<>"'/]/g, (match) => htmlEscapes[match])
  }

  /**
   * Sanitize input with comprehensive validation
   */
  async sanitizeInput (input) {
    if (typeof input !== 'string') return ''

    try {
      // Use API sanitization if available
      if (window.api && window.api.security && window.api.security.sanitizeInput) {
        return window.api.security.sanitizeInput(input)
      } else {
        // Fallback sanitization
        return this.fallbackSanitizeInput(input)
      }
    } catch (error) {
      await this.secureLog('warn', 'Input sanitization failed, using fallback', { error: error.message })
      return this.fallbackSanitizeInput(input)
    }
  }

  /**
   * Fallback input sanitization
   */
  fallbackSanitizeInput (input) {
    if (typeof input !== 'string') return ''

    // Remove dangerous patterns
    const dangerousPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /data:/gi,
      /vbscript:/gi,
      /on\w+\s*=/gi
    ]

    let sanitized = input
    dangerousPatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '')
    })

    return sanitized.trim()
  }

  /**
   * Validate query for security issues
   */
  validateSecureQuery (query) {
    if (typeof query !== 'string') return false

    try {
      // Use API validation if available
      if (window.api && window.api.validators && window.api.validators.validateWithSecurity) {
        return window.api.validators.validateWithSecurity(query, 'query')
      } else {
        // Fallback validation
        return this.fallbackValidateQuery(query)
      }
    } catch (error) {
      this.secureLog('warn', 'Query validation failed, using fallback', { error: error.message })
      return this.fallbackValidateQuery(query)
    }
  }

  /**
   * Fallback query validation
   */
  fallbackValidateQuery (query) {
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return false
    }

    // Check for dangerous patterns
    const dangerousPatterns = [
      /<script/i,
      /javascript:/i,
      /data:/i,
      /vbscript:/i,
      /on\w+\s*=/i,
      /\.\./, // Path traversal
      /[<>]/ // HTML tags
    ]

    return !dangerousPatterns.some(pattern => pattern.test(query))
  }

  /**
   * Validate URLs for security
   */
  async validateExternalUrl (url) {
    try {
      if (window.api && window.api.security && window.api.security.validateUrl) {
        const result = await window.api.security.validateUrl(url)
        return result.success && result.data && result.data.safe
      } else {
        return this.fallbackValidateUrl(url)
      }
    } catch (error) {
      await this.secureLog('warn', 'URL validation failed', { error: error.message })
      return false
    }
  }

  /**
   * Fallback URL validation
   */
  fallbackValidateUrl (url) {
    if (!url || typeof url !== 'string') return false

    try {
      const urlObj = new URL(url)
      const trustedDomains = [
        'last.fm', 'www.last.fm', 'ws.audioscrobbler.com',
        'freesound.org', 'www.freesound.org',
        'github.com', 'www.github.com'
      ]

      return ['https:', 'http:'].includes(urlObj.protocol) &&
             trustedDomains.some(domain => urlObj.hostname === domain || urlObj.hostname.endsWith('.' + domain))
    } catch {
      return false
    }
  }

  /**
   * Validate audio URLs
   */
  async validateAudioUrl (url) {
    if (!await this.validateExternalUrl(url)) return false

    try {
      const urlObj = new URL(url)
      const audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a']
      return audioExtensions.some(ext => urlObj.pathname.toLowerCase().endsWith(ext))
    } catch {
      return false
    }
  }

  /**
   * Validate file paths
   */
  async validateFilePath (filePath) {
    if (!filePath || typeof filePath !== 'string') return false

    // Check for path traversal and dangerous patterns
    const dangerousPatterns = [
      /\.\./,
      /[<>"|?*]/,
      /^[a-z]:/i // Windows drive letters should be at start
    ]

    return !dangerousPatterns.some(pattern => pattern.test(filePath)) &&
           filePath.length < 260 // Windows path limit
  }

  /**
   * Validate sample data
   */
  async validateSampleData (sampleData) {
    if (!sampleData || typeof sampleData !== 'object') return false

    return sampleData.name &&
           typeof sampleData.name === 'string' &&
           sampleData.name.trim().length > 0 &&
           this.validateSampleName(sampleData.name)
  }

  /**
   * Validate sample name
   */
  validateSampleName (name) {
    if (!name || typeof name !== 'string') return false

    const dangerousPatterns = [
      /<script/i,
      /javascript:/i,
      /[<>]/
    ]

    return name.trim().length > 0 &&
           name.length <= 255 &&
           !dangerousPatterns.some(pattern => pattern.test(name))
  }

  /**
   * Validate selected file
   */
  async validateSelectedFile (file) {
    if (!file || typeof file !== 'object') return false

    const allowedExtensions = ['.wav', '.mp3', '.aiff', '.flac', '.ogg']
    const maxSize = 50 * 1024 * 1024 // 50MB

    return file.name &&
           file.size &&
           file.size <= maxSize &&
           allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext))
  }

  /**
   * Sanitize URLs
   */
  async sanitizeUrl (url) {
    if (!url || typeof url !== 'string') return ''

    try {
      const urlObj = new URL(url)
      return urlObj.toString()
    } catch {
      return ''
    }
  }

  /**
   * Sanitize numbers
   */
  sanitizeNumber (value) {
    if (typeof value === 'number' && !isNaN(value)) {
      return value
    }
    if (typeof value === 'string') {
      const parsed = parseFloat(value)
      return isNaN(parsed) ? 0 : parsed
    }
    return 0
  }

  /**
   * Sanitize search results
   */
  async sanitizeSearchResults (results) {
    if (!Array.isArray(results)) return results

    try {
      if (window.api && window.api.security && window.api.security.sanitizeSearchResults) {
        const result = await window.api.security.sanitizeSearchResults(results)
        return result.success ? result.data : results
      } else {
        // Fallback sanitization
        return await Promise.all(results.map(item => this.sanitizeResultItem(item)))
      }
    } catch (error) {
      await this.secureLog('warn', 'Search results sanitization failed', { error: error.message })
      return results
    }
  }

  /**
   * Sanitize individual result item
   */
  async sanitizeResultItem (item) {
    if (!item || typeof item !== 'object') return item

    const sanitized = { ...item }

    // Sanitize string fields
    const stringFields = ['name', 'description', 'artist', 'username']
    for (const field of stringFields) {
      if (sanitized[field] && typeof sanitized[field] === 'string') {
        sanitized[field] = await this.sanitizeInput(sanitized[field])
      }
    }

    // Sanitize tag arrays
    if (Array.isArray(sanitized.tags)) {
      sanitized.tags = await Promise.all(
        sanitized.tags.map(tag => this.sanitizeInput(tag))
      )
    }

    return sanitized
  }

  /**
   * Sanitize sample data for JSON embedding
   */
  async sanitizeSampleDataForJson (sample) {
    const sanitized = await this.sanitizeResultItem(sample)
    return JSON.stringify(sanitized).replace(/[<>]/g, '')
  }

  /**
   * Hash sensitive data for logging
   */
  hashSensitiveData (data) {
    if (!data) return ''

    try {
      // Simple hash for logging purposes
      let hash = 0
      const str = data.toString()
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash // Convert to 32-bit integer
      }
      return `hash_${Math.abs(hash).toString(16)}`
    } catch {
      return 'hash_unknown'
    }
  }

  /**
   * Hash URLs for logging
   */
  hashUrl (url) {
    return this.hashSensitiveData(url)
  }

  /**
   * Hash queries for caching
   */
  hashQuery (query) {
    return this.hashSensitiveData(query)
  }

  /**
   * Sanitize log data
   */
  sanitizeLogData (data) {
    try {
      if (window.api && window.api.securityUtils && window.api.securityUtils.sanitizeForLogging) {
        return window.api.securityUtils.sanitizeForLogging(data)
      } else {
        return this.fallbackSanitizeLogData(data)
      }
    } catch (error) {
      return { error: 'Failed to sanitize log data' }
    }
  }

  /**
   * Fallback log data sanitization
   */
  fallbackSanitizeLogData (data) {
    if (typeof data === 'string') {
      const sensitivePatterns = [
        /api[_-]?key/i,
        /secret/i,
        /token/i,
        /password/i,
        /auth/i
      ]

      const lowerData = data.toLowerCase()
      if (sensitivePatterns.some(pattern => pattern.test(lowerData))) {
        return '[REDACTED]'
      }
    }

    if (typeof data === 'object' && data !== null) {
      const sanitized = {}
      for (const [key, value] of Object.entries(data)) {
        const keyLower = key.toLowerCase()
        if (['api_key', 'secret', 'token', 'password', 'auth'].some(sensitive => keyLower.includes(sensitive))) {
          sanitized[key] = '[REDACTED]'
        } else {
          sanitized[key] = this.fallbackSanitizeLogData(value)
        }
      }
      return sanitized
    }

    return data
  }

  /**
   * Sanitize error messages
   */
  sanitizeErrorMessage (error) {
    if (!error) return 'Unknown error'

    const message = error.message || error.toString() || 'Unknown error'

    // Remove potentially sensitive information from error messages
    const sensitivePatterns = [
      /api[_-]?key[:\s=]+[^\s]+/gi,
      /token[:\s=]+[^\s]+/gi,
      /secret[:\s=]+[^\s]+/gi,
      /password[:\s=]+[^\s]+/gi,
      /file:\/\/[^\s]+/gi,
      /[a-z]:\\[^\s]+/gi
    ]

    let sanitized = message
    sensitivePatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '[REDACTED]')
    })

    return sanitized
  }

  /**
   * Create secure external link
   */
  async createSecureExternalLink (url, text) {
    if (!url) return ''

    const sanitizedUrl = await this.sanitizeUrl(url)
    const sanitizedText = await this.sanitizeHtml(text)

    if (await this.validateExternalUrl(sanitizedUrl)) {
      return `<a href="#" class="external-link" data-url="${sanitizedUrl}">${sanitizedText}</a>`
    } else {
      return `<span class="invalid-link" title="Invalid or unsafe URL">${sanitizedText}</span>`
    }
  }

  /**
   * Render secure normalized metrics
   */
  async renderSecureNormalizedMetrics (item, fields, normalizationMeta) {
    try {
      const originalMetrics = this.renderNormalizedMetrics(item, fields, normalizationMeta)
      return await this.sanitizeHtml(originalMetrics)
    } catch (error) {
      await this.secureLog('warn', 'Error rendering normalized metrics', { error: error.message })
      return ''
    }
  }

  /**
   * Render secure normalization legend
   */
  async renderSecureNormalizationLegend (normalizationData) {
    try {
      const originalLegend = this.renderNormalizationLegend(normalizationData)
      return await this.sanitizeHtml(originalLegend)
    } catch (error) {
      await this.secureLog('warn', 'Error rendering normalization legend', { error: error.message })
      return ''
    }
  }

  /**
   * Securely empty container
   */
  securelyEmptyContainer (container) {
    try {
      // Remove event listeners to prevent memory leaks
      const elements = container.querySelectorAll('*')
      elements.forEach(element => {
        element.removeEventListener?.('click', () => {})
        element.removeEventListener?.('input', () => {})
      })

      // Clear content
      container.innerHTML = ''
    } catch (error) {
      this.secureLog('warn', 'Error securely emptying container', { error: error.message })
      container.innerHTML = ''
    }
  }

  /**
   * Secure form reset
   */
  secureFormReset (form) {
    try {
      // Clear sensitive data before reset
      const sensitiveInputs = form.querySelectorAll('input[type="password"], input[data-sensitive]')
      sensitiveInputs.forEach(input => {
        input.value = ''
      })

      form.reset()
    } catch (error) {
      this.secureLog('warn', 'Error in secure form reset', { error: error.message })
      form.reset()
    }
  }

  /**
   * Clear type-specific sensitive data
   */
  clearTypeSpecificSensitiveData (type) {
    try {
      // Clear any type-specific caches or data
      if (type === 'lastfm') {
        // Clear Last.fm specific data
      } else if (type === 'local-brass' || type === 'online-brass') {
        // Clear brass samples specific data
      }
    } catch (error) {
      this.secureLog('warn', 'Error clearing type-specific data', { type, error: error.message })
    }
  }

  /**
   * Refresh local search if needed
   */
  async refreshLocalSearchIfNeeded () {
    try {
      const localResults = document.getElementById('local-brass-results')
      if (localResults && localResults.children.length > 0) {
        const lastQuery = document.getElementById('local-brass-query')?.value
        if (lastQuery && this.validateSecureQuery(lastQuery)) {
          await this.performSecureSearch('local-brass', lastQuery)
        }
      }
    } catch (error) {
      await this.secureLog('warn', 'Error refreshing local search', { error: error.message })
    }
  }

  /**
   * Show security warning
   */
  showSecurityWarning (element, message) {
    try {
      let warningElement = element.parentNode.querySelector('.security-warning')
      if (!warningElement) {
        warningElement = document.createElement('div')
        warningElement.className = 'security-warning'
        element.parentNode.appendChild(warningElement)
      }
      warningElement.textContent = `⚠️ ${message}`
      warningElement.style.display = 'block'
    } catch (error) {
      this.secureLog('warn', 'Error showing security warning', { error: error.message })
    }
  }

  /**
   * Clear security warning
   */
  clearSecurityWarning (element) {
    try {
      const warningElement = element.parentNode.querySelector('.security-warning')
      if (warningElement) {
        warningElement.style.display = 'none'
      }
    } catch (error) {
      this.secureLog('warn', 'Error clearing security warning', { error: error.message })
    }
  }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.app = new BrassStabsApp()
})

// Enhanced global error handler with security features
window.addEventListener('error', async (event) => {
  try {
    if (window.app) {
      await window.app.secureLog('error', 'Global Error', {
        message: window.app.sanitizeErrorMessage(event.error),
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      })
      await window.app.showError('An unexpected error occurred', event.error)
    } else {
      console.error('Global error (app not initialized):', event.error)
    }
  } catch (loggingError) {
    console.error('Error in global error handler:', loggingError)
  }
})

// Enhanced unhandled promise rejection handler with security features
window.addEventListener('unhandledrejection', async (event) => {
  try {
    if (window.app) {
      await window.app.secureLog('error', 'Unhandled Promise Rejection', {
        reason: window.app.sanitizeErrorMessage(event.reason),
        stack: process.env.NODE_ENV === 'development' ? event.reason?.stack : undefined
      })
      await window.app.showError('An unexpected error occurred', event.reason)
    } else {
      console.error('Unhandled promise rejection (app not initialized):', event.reason)
    }
  } catch (loggingError) {
    console.error('Error in promise rejection handler:', loggingError)
  }
})

// Security event listeners
window.addEventListener('beforeunload', () => {
  if (window.app) {
    window.app.clearSensitiveVariables()
    window.app.cleanupMemory()
  }
})

// Visibility change handler for security
document.addEventListener('visibilitychange', () => {
  if (window.app && !document.hidden) {
    window.app.reportUserActivity('visibility-change')
  }
})

// Focus/blur handlers for security
window.addEventListener('focus', () => {
  if (window.app) {
    window.app.reportUserActivity('window-focus')
  }
})

window.addEventListener('blur', () => {
  if (window.app) {
    window.app.reportUserActivity('window-blur')
  }
})
