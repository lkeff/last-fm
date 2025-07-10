/**
 * Security Utility Module for Last.fm Desktop Application
 * Provides comprehensive security functions including HTML sanitization,
 * URL validation, data protection, and encryption utilities.
 * 
 * @module security
 * @author Traycer.AI
 * @version 1.0.0
 */

const crypto = require('crypto');
const os = require('os');
const { URL } = require('url');

// Security Configuration Constants
const SECURITY_CONFIG = {
    // Trusted domains for external links
    TRUSTED_DOMAINS: [
        'last.fm',
        'www.last.fm',
        'ws.audioscrobbler.com',
        'freesound.org',
        'www.freesound.org',
        'github.com',
        'www.github.com',
        'nodejs.org',
        'www.nodejs.org',
        'electronjs.org',
        'www.electronjs.org',
        'traycer.ai',
        'www.traycer.ai'
    ],
    
    // Suspicious TLDs and patterns
    SUSPICIOUS_TLDS: [
        '.tk', '.ml', '.ga', '.cf', '.click', '.download', '.loan', '.win',
        '.bid', '.racing', '.party', '.review', '.trade', '.date', '.stream'
    ],
    
    // URL shortener domains
    URL_SHORTENERS: [
        'bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly', 'short.link',
        'tiny.cc', 'is.gd', 'buff.ly', 'rebrand.ly'
    ],
    
    // Encryption settings
    ENCRYPTION: {
        ALGORITHM: 'aes-256-gcm',
        KEY_LENGTH: 32,
        IV_LENGTH: 16,
        TAG_LENGTH: 16,
        SALT_LENGTH: 32
    },
    
    // Sensitive data patterns for scrubbing
    SENSITIVE_PATTERNS: [
        /api[_-]?key/i,
        /secret/i,
        /token/i,
        /password/i,
        /auth/i,
        /credential/i,
        /private[_-]?key/i
    ],
    
    // HTML sanitization settings
    HTML_SANITIZATION: {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'u', 'br', 'p', 'span', 'div'],
        ALLOWED_ATTRIBUTES: ['class', 'id'],
        DANGEROUS_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'textarea'],
        DANGEROUS_ATTRIBUTES: ['onclick', 'onload', 'onerror', 'onmouseover', 'onfocus', 'onblur', 'href', 'src']
    }
};

/**
 * HTML Sanitization Functions
 */

/**
 * Sanitizes HTML string by removing dangerous tags, attributes, and scripts
 * while preserving safe formatting elements.
 * 
 * @param {string} htmlString - The HTML string to sanitize
 * @returns {string} Sanitized HTML string
 * @throws {Error} If input is not a string
 * 
 * @example
 * const safe = sanitizeHtml('<p>Hello <script>alert("xss")</script>World</p>');
 * // Returns: '<p>Hello World</p>'
 */
function sanitizeHtml(htmlString) {
    if (typeof htmlString !== 'string') {
        throw new Error('Input must be a string');
    }
    
    if (!htmlString.trim()) {
        return '';
    }
    
    let sanitized = htmlString;
    
    // Remove dangerous tags completely
    SECURITY_CONFIG.HTML_SANITIZATION.DANGEROUS_TAGS.forEach(tag => {
        const regex = new RegExp(`<${tag}[^>]*>.*?<\/${tag}>`, 'gis');
        sanitized = sanitized.replace(regex, '');
        
        // Also remove self-closing versions
        const selfClosingRegex = new RegExp(`<${tag}[^>]*\/?>`, 'gis');
        sanitized = sanitized.replace(selfClosingRegex, '');
    });
    
    // Remove dangerous attributes from all tags
    SECURITY_CONFIG.HTML_SANITIZATION.DANGEROUS_ATTRIBUTES.forEach(attr => {
        const regex = new RegExp(`\\s${attr}\\s*=\\s*["'][^"']*["']`, 'gis');
        sanitized = sanitized.replace(regex, '');
    });
    
    // Remove javascript: and data: URLs
    sanitized = sanitized.replace(/javascript:/gi, '');
    sanitized = sanitized.replace(/data:/gi, '');
    
    // Remove any remaining script content
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    
    // Clean up any malformed tags
    sanitized = sanitized.replace(/<[^>]*>/g, (match) => {
        // Only allow whitelisted tags
        const tagMatch = match.match(/<\/?(\w+)/);
        if (tagMatch) {
            const tagName = tagMatch[1].toLowerCase();
            if (SECURITY_CONFIG.HTML_SANITIZATION.ALLOWED_TAGS.includes(tagName)) {
                return match;
            }
        }
        return '';
    });
    
    return sanitized.trim();
}

/**
 * Batch sanitizes search result objects, targeting common fields that may contain HTML.
 * 
 * @param {Array} resultsArray - Array of search result objects
 * @returns {Array} Array of sanitized search result objects
 * @throws {Error} If input is not an array
 * 
 * @example
 * const results = [{ name: '<script>alert("xss")</script>Song', description: 'Safe text' }];
 * const safe = sanitizeSearchResults(results);
 * // Returns: [{ name: 'Song', description: 'Safe text' }]
 */
function sanitizeSearchResults(resultsArray) {
    if (!Array.isArray(resultsArray)) {
        throw new Error('Input must be an array');
    }
    
    const fieldsToSanitize = ['name', 'description', 'tags', 'artist', 'album', 'title', 'username'];
    
    return resultsArray.map(result => {
        if (typeof result !== 'object' || result === null) {
            return result;
        }
        
        const sanitizedResult = { ...result };
        
        fieldsToSanitize.forEach(field => {
            if (typeof sanitizedResult[field] === 'string') {
                sanitizedResult[field] = sanitizeHtml(sanitizedResult[field]);
            } else if (Array.isArray(sanitizedResult[field])) {
                sanitizedResult[field] = sanitizedResult[field].map(item => 
                    typeof item === 'string' ? sanitizeHtml(item) : item
                );
            }
        });
        
        return sanitizedResult;
    });
}

/**
 * Escapes HTML entities in a string to prevent XSS attacks.
 * 
 * @param {string} string - The string to escape
 * @returns {string} HTML-escaped string
 * @throws {Error} If input is not a string
 * 
 * @example
 * const escaped = escapeHtml('<script>alert("xss")</script>');
 * // Returns: '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
 */
function escapeHtml(string) {
    if (typeof string !== 'string') {
        throw new Error('Input must be a string');
    }
    
    const htmlEscapes = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '/': '&#x2F;'
    };
    
    return string.replace(/[&<>"'/]/g, (match) => htmlEscapes[match]);
}

/**
 * URL Validation and Anti-Scam Functions
 */

/**
 * Validates if a URL is safe by checking against trusted domains.
 * 
 * @param {string} url - The URL to validate
 * @returns {boolean} True if URL is safe, false otherwise
 * 
 * @example
 * const safe = isUrlSafe('https://last.fm/user/example');
 * // Returns: true
 */
function isUrlSafe(url) {
    if (typeof url !== 'string' || !url.trim()) {
        return false;
    }
    
    try {
        const urlObj = new URL(url);
        
        // Only allow HTTPS and HTTP protocols
        if (!['https:', 'http:'].includes(urlObj.protocol)) {
            return false;
        }
        
        // Check against trusted domains
        const hostname = urlObj.hostname.toLowerCase();
        return SECURITY_CONFIG.TRUSTED_DOMAINS.some(domain => 
            hostname === domain || hostname.endsWith('.' + domain)
        );
    } catch (error) {
        return false;
    }
}

/**
 * Detects suspicious URLs using heuristic analysis.
 * 
 * @param {string} url - The URL to analyze
 * @returns {Object} Analysis result with suspicious flag and reasons
 * 
 * @example
 * const analysis = detectSuspiciousUrl('http://bit.ly/suspicious');
 * // Returns: { suspicious: true, reasons: ['URL shortener detected'] }
 */
function detectSuspiciousUrl(url) {
    const result = {
        suspicious: false,
        reasons: []
    };
    
    if (typeof url !== 'string' || !url.trim()) {
        result.suspicious = true;
        result.reasons.push('Invalid URL format');
        return result;
    }
    
    try {
        const urlObj = new URL(url);
        const hostname = urlObj.hostname.toLowerCase();
        
        // Check for suspicious TLDs
        const hasSuspiciousTLD = SECURITY_CONFIG.SUSPICIOUS_TLDS.some(tld => 
            hostname.endsWith(tld)
        );
        if (hasSuspiciousTLD) {
            result.suspicious = true;
            result.reasons.push('Suspicious top-level domain detected');
        }
        
        // Check for URL shorteners
        const isShortener = SECURITY_CONFIG.URL_SHORTENERS.some(shortener => 
            hostname === shortener || hostname.endsWith('.' + shortener)
        );
        if (isShortener) {
            result.suspicious = true;
            result.reasons.push('URL shortener detected');
        }
        
        // Check for homograph attacks (mixed scripts)
        const hasNonAscii = /[^\x00-\x7F]/.test(hostname);
        if (hasNonAscii) {
            result.suspicious = true;
            result.reasons.push('Non-ASCII characters in domain (potential homograph attack)');
        }
        
        // Check for excessive subdomains
        const subdomainCount = hostname.split('.').length - 2;
        if (subdomainCount > 3) {
            result.suspicious = true;
            result.reasons.push('Excessive subdomains detected');
        }
        
        // Check for suspicious patterns in URL
        const suspiciousPatterns = [
            /secure.*login/i,
            /verify.*account/i,
            /update.*payment/i,
            /suspended.*account/i,
            /click.*here/i,
            /urgent.*action/i
        ];
        
        const urlString = url.toLowerCase();
        suspiciousPatterns.forEach(pattern => {
            if (pattern.test(urlString)) {
                result.suspicious = true;
                result.reasons.push('Suspicious phishing pattern detected');
            }
        });
        
        // Check for IP addresses instead of domains
        const ipPattern = /^https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/;
        if (ipPattern.test(url)) {
            result.suspicious = true;
            result.reasons.push('IP address used instead of domain name');
        }
        
    } catch (error) {
        result.suspicious = true;
        result.reasons.push('Malformed URL');
    }
    
    return result;
}

/**
 * Performs comprehensive validation before opening external links.
 * 
 * @param {string} url - The URL to validate
 * @returns {Object} Validation result with safe flag and details
 * 
 * @example
 * const validation = validateExternalLink('https://last.fm/user/example');
 * // Returns: { safe: true, trusted: true, suspicious: false, reasons: [] }
 */
function validateExternalLink(url) {
    const result = {
        safe: false,
        trusted: false,
        suspicious: false,
        reasons: []
    };
    
    // Check if URL is trusted
    result.trusted = isUrlSafe(url);
    
    // Check for suspicious patterns
    const suspiciousAnalysis = detectSuspiciousUrl(url);
    result.suspicious = suspiciousAnalysis.suspicious;
    result.reasons = [...suspiciousAnalysis.reasons];
    
    // Determine overall safety
    result.safe = result.trusted && !result.suspicious;
    
    if (!result.trusted && !result.suspicious) {
        result.reasons.push('Domain not in trusted list');
    }
    
    return result;
}

/**
 * Data Protection and Hashing Functions
 */

/**
 * Hashes sensitive data using SHA-256 for secure logging.
 * 
 * @param {string} data - The sensitive data to hash
 * @returns {string} SHA-256 hash of the data
 * @throws {Error} If input is not a string
 * 
 * @example
 * const hashed = hashSensitiveData('api_key_12345');
 * // Returns: 'sha256:a1b2c3d4...'
 */
function hashSensitiveData(data) {
    if (typeof data !== 'string') {
        throw new Error('Input must be a string');
    }
    
    if (!data.trim()) {
        return 'sha256:empty';
    }
    
    const hash = crypto.createHash('sha256');
    hash.update(data);
    return 'sha256:' + hash.digest('hex');
}

/**
 * Scrubs log objects by removing or hashing sensitive information.
 * 
 * @param {Object} logObject - The log object to scrub
 * @returns {Object} Scrubbed log object with sensitive data removed/hashed
 * 
 * @example
 * const scrubbed = scrubLogData({ message: 'Login', api_key: 'secret123' });
 * // Returns: { message: 'Login', api_key: 'sha256:...' }
 */
function scrubLogData(logObject) {
    if (typeof logObject !== 'object' || logObject === null) {
        return logObject;
    }
    
    const scrubbed = {};
    
    for (const [key, value] of Object.entries(logObject)) {
        const keyLower = key.toLowerCase();
        
        // Check if key matches sensitive patterns
        const isSensitive = SECURITY_CONFIG.SENSITIVE_PATTERNS.some(pattern => 
            pattern.test(keyLower)
        );
        
        if (isSensitive && typeof value === 'string') {
            scrubbed[key] = hashSensitiveData(value);
        } else if (typeof value === 'object' && value !== null) {
            scrubbed[key] = scrubLogData(value);
        } else {
            scrubbed[key] = value;
        }
    }
    
    return scrubbed;
}

/**
 * Generates a cryptographically secure random key for encryption.
 * 
 * @param {number} length - Key length in bytes (default: 32)
 * @returns {Buffer} Secure random key
 * 
 * @example
 * const key = generateSecureKey();
 * // Returns: Buffer with 32 random bytes
 */
function generateSecureKey(length = SECURITY_CONFIG.ENCRYPTION.KEY_LENGTH) {
    if (typeof length !== 'number' || length <= 0) {
        throw new Error('Key length must be a positive number');
    }
    
    return crypto.randomBytes(length);
}

/**
 * Encryption Utilities
 */

/**
 * Encrypts data using AES-256-GCM encryption.
 * 
 * @param {string|Buffer} data - Data to encrypt
 * @param {Buffer} key - Encryption key (32 bytes)
 * @returns {Object} Encrypted data with IV and authentication tag
 * @throws {Error} If encryption fails or invalid parameters
 * 
 * @example
 * const key = generateSecureKey();
 * const encrypted = encryptData('sensitive data', key);
 * // Returns: { encrypted: Buffer, iv: Buffer, tag: Buffer }
 */
function encryptData(data, key) {
    if (!data) {
        throw new Error('Data is required for encryption');
    }
    
    if (!Buffer.isBuffer(key) || key.length !== SECURITY_CONFIG.ENCRYPTION.KEY_LENGTH) {
        throw new Error('Key must be a 32-byte Buffer');
    }
    
    try {
        const iv = crypto.randomBytes(SECURITY_CONFIG.ENCRYPTION.IV_LENGTH);
        const cipher = crypto.createCipher(SECURITY_CONFIG.ENCRYPTION.ALGORITHM, key, { iv });
        
        let encrypted = cipher.update(data, 'utf8');
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        
        const tag = cipher.getAuthTag();
        
        return {
            encrypted,
            iv,
            tag
        };
    } catch (error) {
        throw new Error(`Encryption failed: ${error.message}`);
    }
}

/**
 * Decrypts data encrypted with encryptData function.
 * 
 * @param {Object} encryptedData - Object containing encrypted data, IV, and tag
 * @param {Buffer} key - Decryption key (32 bytes)
 * @returns {string} Decrypted data
 * @throws {Error} If decryption fails or invalid parameters
 * 
 * @example
 * const decrypted = decryptData(encryptedData, key);
 * // Returns: 'sensitive data'
 */
function decryptData(encryptedData, key) {
    if (!encryptedData || typeof encryptedData !== 'object') {
        throw new Error('Encrypted data object is required');
    }
    
    const { encrypted, iv, tag } = encryptedData;
    
    if (!Buffer.isBuffer(encrypted) || !Buffer.isBuffer(iv) || !Buffer.isBuffer(tag)) {
        throw new Error('Invalid encrypted data format');
    }
    
    if (!Buffer.isBuffer(key) || key.length !== SECURITY_CONFIG.ENCRYPTION.KEY_LENGTH) {
        throw new Error('Key must be a 32-byte Buffer');
    }
    
    try {
        const decipher = crypto.createDecipher(SECURITY_CONFIG.ENCRYPTION.ALGORITHM, key, { iv });
        decipher.setAuthTag(tag);
        
        let decrypted = decipher.update(encrypted);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        
        return decrypted.toString('utf8');
    } catch (error) {
        throw new Error(`Decryption failed: ${error.message}`);
    }
}

/**
 * Derives an encryption key from machine-specific identifiers.
 * 
 * @returns {Buffer} Machine-specific encryption key
 * 
 * @example
 * const machineKey = deriveKeyFromMachine();
 * // Returns: Buffer with machine-specific key
 */
function deriveKeyFromMachine() {
    try {
        // Collect machine-specific identifiers
        const identifiers = [
            os.hostname(),
            os.platform(),
            os.arch(),
            os.userInfo().username,
            process.env.COMPUTERNAME || '',
            process.env.USER || '',
            process.env.USERNAME || ''
        ].filter(Boolean).join('|');
        
        // Add some entropy from network interfaces
        const networkInterfaces = os.networkInterfaces();
        const macAddresses = [];
        
        for (const interfaceName in networkInterfaces) {
            const interfaces = networkInterfaces[interfaceName];
            for (const iface of interfaces) {
                if (iface.mac && iface.mac !== '00:00:00:00:00:00') {
                    macAddresses.push(iface.mac);
                }
            }
        }
        
        const machineString = identifiers + '|' + macAddresses.join('|');
        
        // Derive key using PBKDF2
        const salt = crypto.createHash('sha256').update('lastfm-security-salt').digest();
        return crypto.pbkdf2Sync(machineString, salt, 100000, SECURITY_CONFIG.ENCRYPTION.KEY_LENGTH, 'sha256');
        
    } catch (error) {
        // Fallback to a less secure but functional key
        console.warn('Failed to derive machine-specific key, using fallback');
        const fallback = 'lastfm-fallback-key-' + Date.now();
        return crypto.createHash('sha256').update(fallback).digest();
    }
}

// Export all functions and configuration
module.exports = {
    // HTML Sanitization
    sanitizeHtml,
    sanitizeSearchResults,
    escapeHtml,
    
    // URL Validation and Anti-Scam
    isUrlSafe,
    detectSuspiciousUrl,
    validateExternalLink,
    
    // Data Protection and Hashing
    hashSensitiveData,
    scrubLogData,
    generateSecureKey,
    
    // Encryption Utilities
    encryptData,
    decryptData,
    deriveKeyFromMachine,
    
    // Configuration
    SECURITY_CONFIG
};