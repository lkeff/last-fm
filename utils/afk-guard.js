const { EventEmitter } = require('events');
const { ipcRenderer, ipcMain } = require('electron');

/**
 * AFK Guard Utility Module
 * Provides comprehensive away-from-keyboard protection with activity tracking,
 * session management, and data protection capabilities.
 */

class ActivityTracker extends EventEmitter {
    constructor(options = {}) {
        super();
        this.timeout = options.timeout || parseInt(process.env.AFK_TIMEOUT_MINUTES) * 60 * 1000 || 10 * 60 * 1000; // 10 minutes default
        this.warningTime = options.warningTime || parseInt(process.env.AFK_WARNING_MINUTES) * 60 * 1000 || 2 * 60 * 1000; // 2 minutes default
        this.sensitivity = options.sensitivity || 'normal'; // low, normal, high
        this.enabled = options.enabled !== false && process.env.AFK_ENABLED !== 'false';
        
        this.timer = null;
        this.warningTimer = null;
        this.isTracking = false;
        this.lastActivity = Date.now();
        this.activityEvents = [];
        
        // Bind methods to preserve context
        this.handleActivity = this.handleActivity.bind(this);
        this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
        this.handleFocusChange = this.handleFocusChange.bind(this);
        this.checkAudioActivity = this.checkAudioActivity.bind(this);
    }

    /**
     * Start monitoring user activity
     * @param {Object} options - Configuration options
     */
    startTracking(options = {}) {
        if (!this.enabled || this.isTracking) return;

        // Merge options
        Object.assign(this, options);
        
        this.isTracking = true;
        this.lastActivity = Date.now();
        
        // Set up activity event listeners based on environment
        if (typeof window !== 'undefined') {
            // Renderer process - DOM events
            this.setupRendererListeners();
        } else {
            // Main process - system events
            this.setupMainProcessListeners();
        }
        
        // Start inactivity timer
        this.resetTimer();
        
        this.emit('tracking-started');
    }

    /**
     * Set up event listeners for renderer process
     */
    setupRendererListeners() {
        const events = this.getActivityEvents();
        
        events.forEach(event => {
            document.addEventListener(event, this.handleActivity, { passive: true });
        });
        
        // Visibility and focus events
        document.addEventListener('visibilitychange', this.handleVisibilityChange);
        window.addEventListener('focus', this.handleFocusChange);
        window.addEventListener('blur', this.handleFocusChange);
        
        // Audio activity monitoring
        this.setupAudioMonitoring();
        
        this.activityEvents = events;
    }

    /**
     * Set up event listeners for main process
     */
    setupMainProcessListeners() {
        // System-level activity detection would require native modules
        // For now, rely on renderer process reporting
        if (ipcMain) {
            ipcMain.on('user-activity', this.handleActivity);
            ipcMain.on('app-focus-change', this.handleFocusChange);
        }
    }

    /**
     * Get activity events based on sensitivity level
     */
    getActivityEvents() {
        const baseEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
        
        switch (this.sensitivity) {
            case 'low':
                return ['mousedown', 'keydown', 'touchstart'];
            case 'high':
                return [...baseEvents, 'mouseup', 'keyup', 'wheel', 'touchend', 'touchmove'];
            default: // normal
                return baseEvents;
        }
    }

    /**
     * Set up audio activity monitoring
     */
    setupAudioMonitoring() {
        // Monitor audio elements for playback activity
        const audioElements = document.querySelectorAll('audio, video');
        audioElements.forEach(element => {
            element.addEventListener('play', this.checkAudioActivity);
            element.addEventListener('pause', this.checkAudioActivity);
            element.addEventListener('timeupdate', this.checkAudioActivity);
        });
        
        // Set up periodic audio check
        this.audioCheckInterval = setInterval(this.checkAudioActivity, 5000);
    }

    /**
     * Handle user activity events
     */
    handleActivity(event) {
        if (!this.isTracking) return;
        
        const now = Date.now();
        const timeSinceLastActivity = now - this.lastActivity;
        
        // Debounce rapid events (within 100ms)
        if (timeSinceLastActivity < 100) return;
        
        this.lastActivity = now;
        this.resetTimer();
        
        // Notify main process if in renderer
        if (typeof window !== 'undefined' && window.api && window.api.reportActivity) {
            window.api.reportActivity();
        }
        
        this.emit('activity-detected', { type: event?.type || 'system', timestamp: now });
    }

    /**
     * Handle visibility change events
     */
    handleVisibilityChange() {
        if (document.hidden) {
            // Page is hidden, reduce activity sensitivity
            this.emit('visibility-hidden');
        } else {
            // Page is visible, treat as activity
            this.handleActivity({ type: 'visibility-change' });
            this.emit('visibility-visible');
        }
    }

    /**
     * Handle focus change events
     */
    handleFocusChange(event) {
        const isFocused = event.type === 'focus' || !document.hidden;
        
        if (isFocused) {
            this.handleActivity({ type: 'focus-change' });
        }
        
        this.emit('focus-change', { focused: isFocused });
    }

    /**
     * Check for audio activity
     */
    checkAudioActivity() {
        const audioElements = document.querySelectorAll('audio, video');
        let hasActiveAudio = false;
        
        audioElements.forEach(element => {
            if (!element.paused && element.currentTime > 0) {
                hasActiveAudio = true;
            }
        });
        
        if (hasActiveAudio) {
            this.handleActivity({ type: 'audio-activity' });
        }
    }

    /**
     * Reset the inactivity timer
     */
    resetTimer() {
        if (!this.isTracking) return;
        
        // Clear existing timers
        if (this.timer) {
            clearTimeout(this.timer);
        }
        if (this.warningTimer) {
            clearTimeout(this.warningTimer);
        }
        
        // Set warning timer
        this.warningTimer = setTimeout(() => {
            this.emit('inactivity-warning', { 
                timeRemaining: this.timeout - this.warningTime,
                warningTime: this.warningTime 
            });
        }, this.timeout - this.warningTime);
        
        // Set main timeout timer
        this.timer = setTimeout(() => {
            this.emit('inactivity-timeout');
        }, this.timeout);
    }

    /**
     * Stop activity tracking
     */
    stopTracking() {
        if (!this.isTracking) return;
        
        this.isTracking = false;
        
        // Clear timers
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
        if (this.warningTimer) {
            clearTimeout(this.warningTimer);
            this.warningTimer = null;
        }
        if (this.audioCheckInterval) {
            clearInterval(this.audioCheckInterval);
            this.audioCheckInterval = null;
        }
        
        // Remove event listeners
        if (typeof window !== 'undefined') {
            this.activityEvents.forEach(event => {
                document.removeEventListener(event, this.handleActivity);
            });
            document.removeEventListener('visibilitychange', this.handleVisibilityChange);
            window.removeEventListener('focus', this.handleFocusChange);
            window.removeEventListener('blur', this.handleFocusChange);
            
            // Remove audio listeners
            const audioElements = document.querySelectorAll('audio, video');
            audioElements.forEach(element => {
                element.removeEventListener('play', this.checkAudioActivity);
                element.removeEventListener('pause', this.checkAudioActivity);
                element.removeEventListener('timeupdate', this.checkAudioActivity);
            });
        } else if (ipcMain) {
            ipcMain.removeListener('user-activity', this.handleActivity);
            ipcMain.removeListener('app-focus-change', this.handleFocusChange);
        }
        
        this.emit('tracking-stopped');
    }

    /**
     * Get current activity status
     */
    getStatus() {
        return {
            isTracking: this.isTracking,
            lastActivity: this.lastActivity,
            timeSinceActivity: Date.now() - this.lastActivity,
            timeout: this.timeout,
            warningTime: this.warningTime,
            sensitivity: this.sensitivity
        };
    }
}

class SessionManager extends EventEmitter {
    constructor(options = {}) {
        super();
        this.unlockMethod = options.unlockMethod || process.env.AFK_UNLOCK_METHOD || 'click'; // click, password, os
        this.isLocked = false;
        this.lockTime = null;
        this.sensitiveDataBackup = new Map();
        this.memoryCache = new Map();
        
        // Bind methods
        this.handleUnlockAttempt = this.handleUnlockAttempt.bind(this);
    }

    /**
     * Lock the session
     */
    lockSession() {
        if (this.isLocked) return;
        
        this.isLocked = true;
        this.lockTime = Date.now();
        
        // Blank sensitive data
        this.blankSensitiveData();
        
        // Clear memory cache
        this.clearMemoryCache();
        
        // Show lock screen
        this.showLockScreen();
        
        // Notify main process
        if (typeof window !== 'undefined' && window.api && window.api.notifySessionLock) {
            window.api.notifySessionLock();
        }
        
        this.emit('session-locked', { lockTime: this.lockTime });
    }

    /**
     * Unlock the session
     */
    async unlockSession(credentials = null) {
        if (!this.isLocked) return true;
        
        // Validate unlock attempt based on method
        const isValid = await this.validateUnlock(credentials);
        
        if (!isValid) {
            this.emit('unlock-failed', { method: this.unlockMethod });
            return false;
        }
        
        this.isLocked = false;
        const unlockTime = Date.now();
        const lockDuration = unlockTime - this.lockTime;
        
        // Restore sensitive data
        this.restoreSensitiveData();
        
        // Hide lock screen
        this.hideLockScreen();
        
        // Notify main process
        if (typeof window !== 'undefined' && window.api && window.api.notifySessionUnlock) {
            window.api.notifySessionUnlock();
        }
        
        this.emit('session-unlocked', { 
            unlockTime, 
            lockDuration,
            method: this.unlockMethod 
        });
        
        return true;
    }

    /**
     * Check if session is currently locked
     */
    isSessionLocked() {
        return this.isLocked;
    }

    /**
     * Validate unlock attempt
     */
    async validateUnlock(credentials) {
        switch (this.unlockMethod) {
            case 'click':
                return true; // Simple click to unlock
                
            case 'password':
                // Would integrate with a password system
                return credentials && credentials.password === this.getStoredPassword();
                
            case 'os':
                // Would integrate with OS authentication
                return await this.validateOSAuth(credentials);
                
            default:
                return true;
        }
    }

    /**
     * Get stored password (placeholder)
     */
    getStoredPassword() {
        // In a real implementation, this would securely retrieve the password
        return process.env.AFK_UNLOCK_PASSWORD || 'default';
    }

    /**
     * Validate OS authentication (placeholder)
     */
    async validateOSAuth(credentials) {
        // In a real implementation, this would use OS-level authentication
        // For now, return true as placeholder
        return true;
    }

    /**
     * Blank sensitive data from DOM
     */
    blankSensitiveData() {
        if (typeof window === 'undefined') return;
        
        const sensitiveSelectors = [
            '[data-sensitive]',
            '.api-key',
            '.user-token',
            '.search-history',
            '.personal-data',
            'input[type="password"]',
            '.sample-metadata',
            '.user-profile'
        ];
        
        sensitiveSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                // Store original content
                const id = this.generateElementId(element);
                this.sensitiveDataBackup.set(id, {
                    element,
                    originalContent: element.innerHTML,
                    originalValue: element.value || '',
                    originalText: element.textContent
                });
                
                // Blank the content
                if (element.tagName === 'INPUT') {
                    element.value = '••••••••';
                } else {
                    element.innerHTML = '<span class="afk-blanked">••••••••</span>';
                }
                
                element.classList.add('afk-sensitive-blanked');
            });
        });
        
        // Add blur effect to entire page
        if (document.body) {
            document.body.classList.add('afk-session-locked');
        }
    }

    /**
     * Restore sensitive data to DOM
     */
    restoreSensitiveData() {
        if (typeof window === 'undefined') return;
        
        this.sensitiveDataBackup.forEach((backup, id) => {
            const { element, originalContent, originalValue, originalText } = backup;
            
            if (element && element.parentNode) {
                if (element.tagName === 'INPUT') {
                    element.value = originalValue;
                } else {
                    element.innerHTML = originalContent;
                }
                
                element.classList.remove('afk-sensitive-blanked');
            }
        });
        
        // Clear backup
        this.sensitiveDataBackup.clear();
        
        // Remove blur effect
        if (document.body) {
            document.body.classList.remove('afk-session-locked');
        }
    }

    /**
     * Clear memory cache
     */
    clearMemoryCache() {
        // Clear various caches
        this.memoryCache.clear();
        
        // Clear browser caches if in renderer process
        if (typeof window !== 'undefined') {
            // Clear session storage of sensitive data
            const sensitiveKeys = [];
            for (let i = 0; i < sessionStorage.length; i++) {
                const key = sessionStorage.key(i);
                if (key && (key.includes('api') || key.includes('token') || key.includes('search'))) {
                    sensitiveKeys.push(key);
                }
            }
            sensitiveKeys.forEach(key => sessionStorage.removeItem(key));
            
            // Clear any global cache objects
            if (window.searchCache) {
                window.searchCache.clear();
            }
            if (window.apiCache) {
                window.apiCache.clear();
            }
        }
        
        this.emit('memory-cleared');
    }

    /**
     * Show lock screen
     */
    showLockScreen() {
        if (typeof window === 'undefined') return;
        
        // Create lock screen overlay if it doesn't exist
        let lockScreen = document.getElementById('afk-lock-screen');
        if (!lockScreen) {
            lockScreen = this.createLockScreen();
            document.body.appendChild(lockScreen);
        }
        
        lockScreen.style.display = 'flex';
        lockScreen.classList.add('afk-lock-screen-visible');
        
        // Focus on unlock button/input
        const unlockElement = lockScreen.querySelector('.afk-unlock-input, .afk-unlock-button');
        if (unlockElement) {
            setTimeout(() => unlockElement.focus(), 100);
        }
    }

    /**
     * Hide lock screen
     */
    hideLockScreen() {
        if (typeof window === 'undefined') return;
        
        const lockScreen = document.getElementById('afk-lock-screen');
        if (lockScreen) {
            lockScreen.classList.remove('afk-lock-screen-visible');
            setTimeout(() => {
                lockScreen.style.display = 'none';
            }, 300);
        }
    }

    /**
     * Create lock screen element
     */
    createLockScreen() {
        const lockScreen = document.createElement('div');
        lockScreen.id = 'afk-lock-screen';
        lockScreen.className = 'afk-lock-screen';
        
        const lockContent = document.createElement('div');
        lockContent.className = 'afk-lock-content';
        
        const lockIcon = document.createElement('div');
        lockIcon.className = 'afk-lock-icon';
        lockIcon.innerHTML = '🔒';
        
        const lockTitle = document.createElement('h2');
        lockTitle.className = 'afk-lock-title';
        lockTitle.textContent = 'Session Locked';
        
        const lockMessage = document.createElement('p');
        lockMessage.className = 'afk-lock-message';
        lockMessage.textContent = 'Your session has been locked due to inactivity.';
        
        const unlockContainer = document.createElement('div');
        unlockContainer.className = 'afk-unlock-container';
        
        // Create unlock interface based on method
        if (this.unlockMethod === 'password') {
            const passwordInput = document.createElement('input');
            passwordInput.type = 'password';
            passwordInput.className = 'afk-unlock-input';
            passwordInput.placeholder = 'Enter password to unlock';
            passwordInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleUnlockAttempt({ password: passwordInput.value });
                }
            });
            unlockContainer.appendChild(passwordInput);
        }
        
        const unlockButton = document.createElement('button');
        unlockButton.className = 'afk-unlock-button';
        unlockButton.textContent = this.unlockMethod === 'click' ? 'Click to Unlock' : 'Unlock';
        unlockButton.addEventListener('click', this.handleUnlockAttempt);
        unlockContainer.appendChild(unlockButton);
        
        lockContent.appendChild(lockIcon);
        lockContent.appendChild(lockTitle);
        lockContent.appendChild(lockMessage);
        lockContent.appendChild(unlockContainer);
        lockScreen.appendChild(lockContent);
        
        return lockScreen;
    }

    /**
     * Handle unlock attempt
     */
    async handleUnlockAttempt(credentials = null) {
        if (this.unlockMethod === 'password' && !credentials) {
            const passwordInput = document.querySelector('.afk-unlock-input');
            credentials = { password: passwordInput ? passwordInput.value : '' };
        }
        
        const success = await this.unlockSession(credentials);
        
        if (!success) {
            // Show error feedback
            const lockScreen = document.getElementById('afk-lock-screen');
            if (lockScreen) {
                lockScreen.classList.add('afk-unlock-error');
                setTimeout(() => {
                    lockScreen.classList.remove('afk-unlock-error');
                }, 2000);
            }
        }
    }

    /**
     * Generate unique ID for DOM element
     */
    generateElementId(element) {
        return `afk_${element.tagName}_${element.className}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Get session status
     */
    getStatus() {
        return {
            isLocked: this.isLocked,
            lockTime: this.lockTime,
            unlockMethod: this.unlockMethod,
            sensitiveDataCount: this.sensitiveDataBackup.size,
            cacheSize: this.memoryCache.size
        };
    }
}

/**
 * Main AFK Guard class that coordinates activity tracking and session management
 */
class AFKGuard extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.activityTracker = new ActivityTracker(options.activity);
        this.sessionManager = new SessionManager(options.session);
        this.enabled = options.enabled !== false && process.env.AFK_ENABLED !== 'false';
        
        // Set up event forwarding
        this.setupEventForwarding();
    }

    /**
     * Set up event forwarding between components
     */
    setupEventForwarding() {
        // Forward activity tracker events
        this.activityTracker.on('inactivity-timeout', () => {
            if (this.enabled) {
                this.sessionManager.lockSession();
            }
        });
        
        this.activityTracker.on('inactivity-warning', (data) => {
            this.emit('inactivity-warning', data);
        });
        
        this.activityTracker.on('activity-detected', (data) => {
            this.emit('activity-detected', data);
        });
        
        // Forward session manager events
        this.sessionManager.on('session-locked', (data) => {
            this.activityTracker.stopTracking();
            this.emit('session-locked', data);
        });
        
        this.sessionManager.on('session-unlocked', (data) => {
            if (this.enabled) {
                this.activityTracker.startTracking();
            }
            this.emit('session-unlocked', data);
        });
        
        this.sessionManager.on('unlock-failed', (data) => {
            this.emit('unlock-failed', data);
        });
    }

    /**
     * Start AFK guard protection
     */
    start(options = {}) {
        if (!this.enabled) return;
        
        this.activityTracker.startTracking(options.activity);
        this.emit('afk-guard-started');
    }

    /**
     * Stop AFK guard protection
     */
    stop() {
        this.activityTracker.stopTracking();
        if (this.sessionManager.isSessionLocked()) {
            this.sessionManager.unlockSession();
        }
        this.emit('afk-guard-stopped');
    }

    /**
     * Get comprehensive status
     */
    getStatus() {
        return {
            enabled: this.enabled,
            activity: this.activityTracker.getStatus(),
            session: this.sessionManager.getStatus()
        };
    }

    /**
     * Configure AFK guard settings
     */
    configure(options = {}) {
        if (options.activity) {
            Object.assign(this.activityTracker, options.activity);
        }
        if (options.session) {
            Object.assign(this.sessionManager, options.session);
        }
        if (options.enabled !== undefined) {
            this.enabled = options.enabled;
        }
    }
}

// Export classes and utility functions
module.exports = {
    ActivityTracker,
    SessionManager,
    AFKGuard,
    
    // Utility functions for external use
    blankSensitiveData: (sessionManager) => sessionManager.blankSensitiveData(),
    restoreSensitiveData: (sessionManager) => sessionManager.restoreSensitiveData(),
    clearMemoryCache: (sessionManager) => sessionManager.clearMemoryCache(),
    
    // Factory function for easy initialization
    createAFKGuard: (options = {}) => new AFKGuard(options),
    
    // Configuration helpers
    getDefaultConfig: () => ({
        activity: {
            timeout: parseInt(process.env.AFK_TIMEOUT_MINUTES) * 60 * 1000 || 10 * 60 * 1000,
            warningTime: parseInt(process.env.AFK_WARNING_MINUTES) * 60 * 1000 || 2 * 60 * 1000,
            sensitivity: process.env.AFK_SENSITIVITY || 'normal',
            enabled: process.env.AFK_ENABLED !== 'false'
        },
        session: {
            unlockMethod: process.env.AFK_UNLOCK_METHOD || 'click'
        },
        enabled: process.env.AFK_ENABLED !== 'false'
    })
};