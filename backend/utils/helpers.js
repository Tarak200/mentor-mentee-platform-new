const crypto = require('crypto');
const path = require('path');
const fs = require('fs').promises;

class HelperUtils {
    // Generate unique ID
    generateId(prefix = '') {
        const timestamp = Date.now().toString(36);
        const randomStr = crypto.randomBytes(6).toString('hex');
        return prefix ? `${prefix}_${timestamp}_${randomStr}` : `${timestamp}_${randomStr}`;
    }

    // Generate UUID v4
    generateUUID() {
        return crypto.randomUUID();
    }

    // Generate random token
    generateToken(length = 32) {
        return crypto.randomBytes(length).toString('hex');
    }

    // Hash string with salt
    hashString(str, salt = null) {
        const actualSalt = salt || crypto.randomBytes(16).toString('hex');
        const hash = crypto.pbkdf2Sync(str, actualSalt, 10000, 64, 'sha512').toString('hex');
        return { hash, salt: actualSalt };
    }

    // Verify hashed string
    verifyHash(str, hash, salt) {
        const verifyHash = crypto.pbkdf2Sync(str, salt, 10000, 64, 'sha512').toString('hex');
        return verifyHash === hash;
    }

    // Format date for display
    formatDate(date, format = 'YYYY-MM-DD') {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const seconds = String(d.getSeconds()).padStart(2, '0');

        const formatMap = {
            'YYYY': year,
            'MM': month,
            'DD': day,
            'HH': hours,
            'mm': minutes,
            'ss': seconds
        };

        return format.replace(/YYYY|MM|DD|HH|mm|ss/g, match => formatMap[match]);
    }

    // Get time ago string
    getTimeAgo(date) {
        const now = new Date();
        const past = new Date(date);
        const diffInSeconds = Math.floor((now - past) / 1000);

        const intervals = {
            year: 31536000,
            month: 2592000,
            week: 604800,
            day: 86400,
            hour: 3600,
            minute: 60
        };

        for (const [unit, seconds] of Object.entries(intervals)) {
            const interval = Math.floor(diffInSeconds / seconds);
            if (interval >= 1) {
                return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
            }
        }

        return 'just now';
    }

    // Capitalize first letter
    capitalize(str) {
        if (!str || typeof str !== 'string') return str;
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }

    // Convert to title case
    titleCase(str) {
        if (!str || typeof str !== 'string') return str;
        return str.replace(/\w\S*/g, (txt) => 
            txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        );
    }

    // Convert to slug
    slugify(str) {
        if (!str || typeof str !== 'string') return '';
        return str
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    // Truncate text
    truncate(str, length = 100, suffix = '...') {
        if (!str || typeof str !== 'string') return str;
        if (str.length <= length) return str;
        return str.substring(0, length).trim() + suffix;
    }

    // Deep clone object
    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        if (typeof obj === 'object') {
            const cloned = {};
            Object.keys(obj).forEach(key => {
                cloned[key] = this.deepClone(obj[key]);
            });
            return cloned;
        }
    }

    // Merge objects deeply
    deepMerge(target, source) {
        const result = { ...target };
        
        for (const key in source) {
            if (source.hasOwnProperty(key)) {
                if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                    result[key] = this.deepMerge(result[key] || {}, source[key]);
                } else {
                    result[key] = source[key];
                }
            }
        }
        
        return result;
    }

    // Check if object is empty
    isEmpty(obj) {
        if (obj === null || obj === undefined) return true;
        if (typeof obj === 'string' || Array.isArray(obj)) return obj.length === 0;
        if (typeof obj === 'object') return Object.keys(obj).length === 0;
        return false;
    }

    // Pick properties from object
    pick(obj, keys) {
        const result = {};
        keys.forEach(key => {
            if (obj.hasOwnProperty(key)) {
                result[key] = obj[key];
            }
        });
        return result;
    }

    // Omit properties from object
    omit(obj, keys) {
        const result = { ...obj };
        keys.forEach(key => delete result[key]);
        return result;
    }

    // Group array by property
    groupBy(array, key) {
        return array.reduce((groups, item) => {
            const group = item[key];
            groups[group] = groups[group] || [];
            groups[group].push(item);
            return groups;
        }, {});
    }

    // Remove duplicates from array
    unique(array, key = null) {
        if (!key) {
            return [...new Set(array)];
        }
        
        const seen = new Set();
        return array.filter(item => {
            const value = item[key];
            if (seen.has(value)) {
                return false;
            }
            seen.add(value);
            return true;
        });
    }

    // Sort array by property
    sortBy(array, key, direction = 'asc') {
        return array.sort((a, b) => {
            const valueA = a[key];
            const valueB = b[key];
            
            if (valueA < valueB) {
                return direction === 'asc' ? -1 : 1;
            }
            if (valueA > valueB) {
                return direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
    }

    // Paginate array
    paginate(array, page = 1, limit = 10) {
        const offset = (page - 1) * limit;
        const paginatedItems = array.slice(offset, offset + limit);
        
        return {
            data: paginatedItems,
            pagination: {
                page,
                limit,
                total: array.length,
                totalPages: Math.ceil(array.length / limit),
                hasNext: offset + limit < array.length,
                hasPrev: page > 1
            }
        };
    }

    // Generate random number in range
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // Generate random string
    randomString(length = 10, chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789') {
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    // Sleep/delay function
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Retry function with exponential backoff
    async retry(fn, options = {}) {
        const {
            maxAttempts = 3,
            delay = 1000,
            backoff = 2,
            onRetry = () => {}
        } = options;

        let lastError;
        
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return await fn();
            } catch (error) {
                lastError = error;
                
                if (attempt === maxAttempts) {
                    throw error;
                }
                
                const retryDelay = delay * Math.pow(backoff, attempt - 1);
                onRetry(error, attempt, retryDelay);
                await this.sleep(retryDelay);
            }
        }
        
        throw lastError;
    }

    // Format file size
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Get file extension
    getFileExtension(filename) {
        return path.extname(filename).toLowerCase();
    }

    // Generate safe filename
    generateSafeFilename(originalName) {
        const extension = this.getFileExtension(originalName);
        const timestamp = Date.now();
        const randomString = this.randomString(8);
        return `${timestamp}_${randomString}${extension}`;
    }

    // Ensure directory exists
    async ensureDir(dirPath) {
        try {
            await fs.access(dirPath);
        } catch {
            await fs.mkdir(dirPath, { recursive: true });
        }
    }

    // Calculate percentage
    calculatePercentage(value, total, decimals = 1) {
        if (total === 0) return 0;
        return parseFloat(((value / total) * 100).toFixed(decimals));
    }

    // Generate color from string
    stringToColor(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        const color = (hash & 0x00FFFFFF).toString(16).toUpperCase();
        return '#' + '00000'.substring(0, 6 - color.length) + color;
    }

    // Validate environment variables
    validateEnvVars(requiredVars) {
        const missing = requiredVars.filter(varName => !process.env[varName]);
        if (missing.length > 0) {
            throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
        }
    }

    // Rate limiting helper
    createRateLimiter(windowMs, maxRequests) {
        const requests = new Map();
        
        return (identifier) => {
            const now = Date.now();
            const windowStart = now - windowMs;
            
            // Clean old entries
            for (const [id, timestamps] of requests.entries()) {
                const validTimestamps = timestamps.filter(time => time > windowStart);
                if (validTimestamps.length === 0) {
                    requests.delete(id);
                } else {
                    requests.set(id, validTimestamps);
                }
            }
            
            // Check current identifier
            const userRequests = requests.get(identifier) || [];
            const validRequests = userRequests.filter(time => time > windowStart);
            
            if (validRequests.length >= maxRequests) {
                return { allowed: false, remaining: 0, resetTime: Math.min(...validRequests) + windowMs };
            }
            
            validRequests.push(now);
            requests.set(identifier, validRequests);
            
            return { 
                allowed: true, 
                remaining: maxRequests - validRequests.length,
                resetTime: now + windowMs
            };
        };
    }
}

const helperUtils = new HelperUtils();

module.exports = {
    generateId: helperUtils.generateId.bind(helperUtils),
    generateUUID: helperUtils.generateUUID.bind(helperUtils),
    generateToken: helperUtils.generateToken.bind(helperUtils),
    hashString: helperUtils.hashString.bind(helperUtils),
    verifyHash: helperUtils.verifyHash.bind(helperUtils),
    formatDate: helperUtils.formatDate.bind(helperUtils),
    getTimeAgo: helperUtils.getTimeAgo.bind(helperUtils),
    capitalize: helperUtils.capitalize.bind(helperUtils),
    titleCase: helperUtils.titleCase.bind(helperUtils),
    slugify: helperUtils.slugify.bind(helperUtils),
    truncate: helperUtils.truncate.bind(helperUtils),
    deepClone: helperUtils.deepClone.bind(helperUtils),
    deepMerge: helperUtils.deepMerge.bind(helperUtils),
    isEmpty: helperUtils.isEmpty.bind(helperUtils),
    pick: helperUtils.pick.bind(helperUtils),
    omit: helperUtils.omit.bind(helperUtils),
    groupBy: helperUtils.groupBy.bind(helperUtils),
    unique: helperUtils.unique.bind(helperUtils),
    sortBy: helperUtils.sortBy.bind(helperUtils),
    paginate: helperUtils.paginate.bind(helperUtils),
    randomInt: helperUtils.randomInt.bind(helperUtils),
    randomString: helperUtils.randomString.bind(helperUtils),
    sleep: helperUtils.sleep.bind(helperUtils),
    retry: helperUtils.retry.bind(helperUtils),
    formatFileSize: helperUtils.formatFileSize.bind(helperUtils),
    getFileExtension: helperUtils.getFileExtension.bind(helperUtils),
    generateSafeFilename: helperUtils.generateSafeFilename.bind(helperUtils),
    ensureDir: helperUtils.ensureDir.bind(helperUtils),
    calculatePercentage: helperUtils.calculatePercentage.bind(helperUtils),
    stringToColor: helperUtils.stringToColor.bind(helperUtils),
    validateEnvVars: helperUtils.validateEnvVars.bind(helperUtils),
    createRateLimiter: helperUtils.createRateLimiter.bind(helperUtils)
};
