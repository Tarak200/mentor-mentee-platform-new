const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create upload directories if they don't exist
const createUploadDirectories = () => {
    const uploadDirs = [
        path.join(__dirname, '../../uploads'),
        path.join(__dirname, '../../uploads/avatars'),
        path.join(__dirname, '../../uploads/documents'),
        path.join(__dirname, '../../uploads/temp')
    ];

    uploadDirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    });
};

// Initialize upload directories
createUploadDirectories();

// File filter function
const fileFilter = (req, file, cb) => {
    // Define allowed file types
    const allowedMimeTypes = {
        image: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
        document: ['application/pdf', 'text/plain', 'text/csv', 'application/json'],
        avatar: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    };

    // Determine file category based on fieldname or general rules
    let category = 'image';
    if (file.fieldname === 'avatar') {
        category = 'avatar';
    } else if (file.fieldname === 'document') {
        category = 'document';
    }

    // Check if file type is allowed
    if (allowedMimeTypes[category].includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`Invalid file type. Allowed types: ${allowedMimeTypes[category].join(', ')}`), false);
    }
};

// Storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let uploadPath = path.join(__dirname, '../../uploads');
        
        // Determine destination based on file type
        if (file.fieldname === 'avatar') {
            uploadPath = path.join(uploadPath, 'avatars');
        } else if (file.fieldname === 'document') {
            uploadPath = path.join(uploadPath, 'documents');
        } else {
            uploadPath = path.join(uploadPath, 'temp');
        }
        
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        const baseName = path.basename(file.originalname, extension);
        
        // Sanitize filename
        const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9]/g, '_');
        const filename = `${sanitizedBaseName}_${uniqueSuffix}${extension}`;
        
        cb(null, filename);
    }
});

// Create multer instance
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
        files: 5 // Maximum 5 files per request
    }
});

// Error handling middleware
const handleUploadError = (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        switch (error.code) {
            case 'LIMIT_FILE_SIZE':
                return res.status(400).json({ 
                    error: 'File too large. Maximum file size is 10MB.' 
                });
            case 'LIMIT_FILE_COUNT':
                return res.status(400).json({ 
                    error: 'Too many files. Maximum 5 files allowed per request.' 
                });
            case 'LIMIT_UNEXPECTED_FILE':
                return res.status(400).json({ 
                    error: 'Unexpected file field.' 
                });
            default:
                return res.status(400).json({ 
                    error: 'File upload error: ' + error.message 
                });
        }
    } else if (error) {
        return res.status(400).json({ 
            error: error.message 
        });
    }
    next();
};

// Utility function to clean up uploaded files
const cleanupFiles = (files) => {
    if (!files) return;
    
    const filesToClean = Array.isArray(files) ? files : [files];
    filesToClean.forEach(file => {
        if (file && file.path && fs.existsSync(file.path)) {
            fs.unlink(file.path, (err) => {
                if (err) console.error('Error cleaning up file:', file.path, err);
            });
        }
    });
};

// Middleware to validate file after upload
const validateUploadedFile = (req, res, next) => {
    if (req.file) {
        // Additional validation can be added here
        // For example, checking file content, virus scanning, etc.
        
        // Check file size again (just in case)
        if (req.file.size > 10 * 1024 * 1024) {
            cleanupFiles(req.file);
            return res.status(400).json({ error: 'File too large' });
        }
        
        // Validate image dimensions for avatars
        if (req.file.fieldname === 'avatar') {
            // You could add image processing here to validate dimensions
            // and potentially resize the image
        }
    }
    
    next();
};

// Export configured upload middleware with different configurations
module.exports = {
    // Single file upload
    single: (fieldName) => [
        upload.single(fieldName),
        handleUploadError,
        validateUploadedFile
    ],
    
    // Multiple files upload
    array: (fieldName, maxCount = 5) => [
        upload.array(fieldName, maxCount),
        handleUploadError,
        validateUploadedFile
    ],
    
    // Multiple fields upload
    fields: (fields) => [
        upload.fields(fields),
        handleUploadError,
        validateUploadedFile
    ],
    
    // No file upload (for forms with other data)
    none: () => [
        upload.none(),
        handleUploadError
    ],
    
    // Utility functions
    cleanupFiles,
    
    // Default single file upload (for backward compatibility)
    __proto__: upload
};

// Clean up old temporary files (run periodically)
const cleanupOldTempFiles = () => {
    const tempDir = path.join(__dirname, '../../uploads/temp');
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    if (fs.existsSync(tempDir)) {
        fs.readdir(tempDir, (err, files) => {
            if (err) return;
            
            files.forEach(file => {
                const filePath = path.join(tempDir, file);
                fs.stat(filePath, (err, stats) => {
                    if (err) return;
                    
                    const fileAge = Date.now() - stats.mtime.getTime();
                    if (fileAge > maxAge) {
                        fs.unlink(filePath, (err) => {
                            if (!err) {
                                console.log('Cleaned up old temp file:', file);
                            }
                        });
                    }
                });
            });
        });
    }
};

// Run cleanup every 6 hours
setInterval(cleanupOldTempFiles, 6 * 60 * 60 * 1000);
