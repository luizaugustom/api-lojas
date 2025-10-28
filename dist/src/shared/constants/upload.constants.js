"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PRODUCT_PHOTOS_SUBFOLDER = exports.IMAGE_DIMENSIONS = exports.MAX_FILE_SIZE = exports.ALLOWED_IMAGE_EXTENSIONS = exports.ALLOWED_IMAGE_MIMETYPES = exports.PRODUCT_PHOTOS_BY_PLAN = exports.MAX_PRODUCT_PHOTOS = void 0;
exports.MAX_PRODUCT_PHOTOS = 3;
exports.PRODUCT_PHOTOS_BY_PLAN = {
    BASIC: 1,
    PLUS: 2,
    PRO: 3,
};
exports.ALLOWED_IMAGE_MIMETYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
];
exports.ALLOWED_IMAGE_EXTENSIONS = [
    '.jpg',
    '.jpeg',
    '.png',
    '.webp',
    '.gif',
];
exports.MAX_FILE_SIZE = 5 * 1024 * 1024;
exports.IMAGE_DIMENSIONS = {
    MAX_WIDTH: 1200,
    MAX_HEIGHT: 1200,
    THUMBNAIL_WIDTH: 300,
    THUMBNAIL_HEIGHT: 300,
};
exports.PRODUCT_PHOTOS_SUBFOLDER = 'products';
//# sourceMappingURL=upload.constants.js.map