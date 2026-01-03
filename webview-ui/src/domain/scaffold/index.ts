/**
 * ScaffoldIndex - Barrel export for scaffolding module
 */
export { 
  HEXAGONAL_FOLDERS, 
  getHexFolderPaths,
  type HexFolderConfig 
} from './hexagonal_folders';

export {
  FILE_TEMPLATES,
  QUICK_CREATE_EXTENSIONS,
  getTemplateByExtension,
  getTemplatesByCategory,
  type FileLanguage,
  type FileTemplate,
} from './file_templates';
