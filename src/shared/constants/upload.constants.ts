/**
 * Constantes para upload de arquivos
 */

// Limite de fotos por produto
export const MAX_PRODUCT_PHOTOS = 3;

// Limite por plano (opcional - para implementação futura)
export const PRODUCT_PHOTOS_BY_PLAN = {
  BASIC: 1,
  PLUS: 2,
  PRO: 3,
};

// Tipos de arquivo aceitos
export const ALLOWED_IMAGE_MIMETYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
];

// Extensões aceitas
export const ALLOWED_IMAGE_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.gif',
];

// Tamanho máximo por arquivo (5MB)
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB em bytes

// Dimensões para redimensionamento
export const IMAGE_DIMENSIONS = {
  MAX_WIDTH: 1200,
  MAX_HEIGHT: 1200,
  THUMBNAIL_WIDTH: 300,
  THUMBNAIL_HEIGHT: 300,
};

// Subpasta para fotos de produtos
export const PRODUCT_PHOTOS_SUBFOLDER = 'products';

