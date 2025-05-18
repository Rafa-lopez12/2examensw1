
// Cambio de componentes/servicios de Angular a widgets/clases de Flutter
export interface FlutterWidget {
  name: string;
  dartCode: string;
}

/**
 * Interfaz para los modelos de datos Flutter
 */
export interface FlutterModel {
  name: string;
  code: string;
}

/**
 * Interfaz para los servicios Flutter generados
 */
export interface FlutterService {
  name: string;
  code: string;
}

/**
 * Interfaz para las pantallas Flutter generadas
 */
export interface FlutterScreen {
  name: string;
  code: string;
}

/**
 * Interfaz para el archivo main.dart generado
 */
export interface MainApp {
  code: string;
}

/**
 * Interfaz para el resultado procesado
 */
export interface ProcessedResponse {
  screens: FlutterScreen[];
  widgets: FlutterWidget[];
  models: FlutterModel[];
  services: FlutterService[];
  mainApp?: MainApp;
}

/**
 * Interfaz para los parámetros de generación de código desde captura
 */
export interface ScreenshotGenerationParams {
  image: Buffer | string;
  pageName: string;
  description?: string;
}

/**
 * Interfaz para el resultado de generación de código
 */
export interface CodeGenerationResult {
  success: boolean;
  message: string;
  data?: ProcessedResponse;
  error?: string;
  generatedAt?: string;
}

/**
 * Interfaz para los mensajes de estado de la generación
 */
export interface CodeGenerationStatus {
  status: 'started' | 'processing' | 'completed' | 'error' | 'cancelled';
  message: string;
}

/**
 * Interfaz para el archivo pubspec.yaml (opcional)
 */
export interface PubspecYaml {
  content: string;
}

/**
 * Interfaz para la configuración de dependencias de Flutter
 */
export interface FlutterDependencies {
  name: string;
  version: string;
  isDevDependency?: boolean;
}

/**
 * Interfaz para la estructura de proyecto recomendada
 */
export interface ProjectStructure {
  folders: string[];
  description: string;
}

/**
 * Interfaz para la organización final del resultado
 */
export interface FlutterProjectBundle {
  mainApp: MainApp;
  screens: FlutterScreen[];
  widgets: FlutterWidget[];
  models: FlutterModel[];
  services: FlutterService[];
  dependencies: FlutterDependencies[];
  pubspec?: PubspecYaml;
  projectStructure?: ProjectStructure;
}

/**
 * Interfaz para los metadatos del proyecto generado
 */
export interface ProjectMetadata {
  name: string;
  description: string;
  generatedAt: string;
  flutterVersion: string;
  dartVersion: string;
  creator: string;
}

/**
 * Interfaz para el resultado detallado de la generación
 */
export interface DetailedGenerationResult extends CodeGenerationResult {
  projectMetadata?: ProjectMetadata;
  bundle?: FlutterProjectBundle;
  previewImageUrl?: string;
}