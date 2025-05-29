// src/openai/openai.service.ts
// src/openai/openai.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { 
  FlutterWidget, 
  FlutterModel, 
  FlutterService, 
  FlutterScreen, 
  ProcessedResponse, 
  MainApp 
} from './openai.interfaces';
import { FiguraService } from 'src/figura/figura.service';
import { ModuleRef } from '@nestjs/core';
@Injectable()
export class OpenAIService {
  private openai: OpenAI;
  private readonly logger = new Logger('OpenAIService');

  constructor(
    private configService: ConfigService,
    private readonly moduleRef: ModuleRef
    
  ) {
    // Inicializar el cliente OpenAI con la API key desde las variables de entorno
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  /**
   * Genera código Flutter a partir de una captura de pantalla
   */
  async generateFlutterCodeFromScreenshot(data: {
    image: Buffer | string, // Imagen en formato base64 o Buffer
    pageName: string,
    description?: string
  }): Promise<ProcessedResponse> {
    try {
      this.logger.log('Generando código Flutter a partir de captura de pantalla...');
      
      // 1. Preparar la imagen en formato base64
      const imageBase64 = this.prepareImageBase64(data.image);
      this.logger.log(`Tamaño de la imagen en base64: ${imageBase64.length} caracteres`);
      
      // 2. Llamar a la API de OpenAI con el formato correcto
      this.logger.log(`Enviando solicitud a OpenAI para generación de código Flutter de página "${data.pageName}"`);
      const response = await this.callOpenAI(imageBase64, data.pageName, data.description);
      
      // 3. Procesar la respuesta
      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('La respuesta de OpenAI no contiene contenido.');
      }
      
      this.logger.log(`Longitud del contenido de respuesta: ${content.length} caracteres`);
      this.logger.log(`Primeros 100 caracteres: ${content.substring(0, 100)}...`);
      
      // 4. Extraer y procesar el código
      const processedResult = this.processCode(content);
      this.logger.log(`Resultado procesado: ${JSON.stringify({
        screens: processedResult.screens.length,
        widgets: processedResult.widgets.length,
        models: processedResult.models.length,
        services: processedResult.services.length
      })}`);
      
      return processedResult;
    } catch (error) {
      this.logger.error(`Error al generar código Flutter: ${error.message}`);
      
      // Si el error viene de OpenAI, obtener más detalles
      if (error.response) {
        this.logger.error(`Error de la API OpenAI: ${JSON.stringify({
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        })}`);
      }
      
      throw new Error(`Error al generar código Flutter: ${error.message}`);
    }
  }

  /**
   * Prepara la imagen en formato base64
   */
  private prepareImageBase64(image: Buffer | string): string {
    if (Buffer.isBuffer(image)) {
      return image.toString('base64');
    } else if (typeof image === 'string') {
      if (image.startsWith('data:image')) {
        return image.split(',')[1];
      }
      return image;
    }
    throw new Error('Formato de imagen no soportado');
  }

  /**
   * Realiza la llamada a la API de OpenAI
   */
  private async callOpenAI(imageBase64: string, pageName: string, description?: string) {
    return await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Eres un desarrollador experto en Flutter que puede analizar diseños visuales y generar código Flutter preciso. Tu tarea es generar código completo para implementar la interfaz mostrada en la imagen.
  
INSTRUCCIONES IMPORTANTES:
1. Genera todo el código Flutter necesario (widgets, pantallas, modelos, servicios) de forma completa y funcional.
2. ASEGÚRATE DE INCLUIR EL CÓDIGO DART COMPLETO para cada archivo. El código debe reflejar exactamente la interfaz que se muestra en la imagen.
3. Para cada archivo, usa el formato adecuado con un comentario claro:

PARA PANTALLAS FLUTTER:
\`\`\`dart
// nombre_pantalla.dart
[código completo aquí]
\`\`\`

PARA WIDGETS FLUTTER:
\`\`\`dart
// nombre_widget.dart
[código completo aquí]
\`\`\`

PARA MODELOS:
\`\`\`dart
// nombre_modelo.dart
[código completo aquí]
\`\`\`

PARA SERVICIOS:
\`\`\`dart
// nombre_servicio.dart
[código completo aquí]
\`\`\`

PARA LA APP PRINCIPAL (OBLIGATORIO):
\`\`\`dart
// main.dart
[código completo aquí]
\`\`\`

4. Asegúrate de que cada tipo de archivo esté claramente separado y etiquetado.
5. Organiza la respuesta por secciones (Pantallas, Widgets, Modelos, Servicios, Main).
6. NO OMITAS NINGÚN CÓDIGO bajo ninguna circunstancia.
7. Implementa los widgets de Flutter más apropiados para recrear exactamente la UI de la imagen.
8. Usa una arquitectura limpia como Provider, Bloc, o GetX para la gestión de estado si es necesario.
9. Incluye dependencias en pubspec.yaml si usas paquetes de terceros.`
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Por favor, genera el código Flutter completo para implementar la interfaz de usuario que se muestra en la imagen. Esta es una pantalla llamada "${pageName}"${description ? ` que ${description}` : ''}.
  
Analiza cuidadosamente la imagen y genera el código Flutter necesario para implementar esta interfaz de manera funcional.
  
Por favor incluye:
1. Estructura de pantallas y widgets (archivos .dart para cada pantalla y widget reutilizable)
2. Modelos de datos (.dart para cada modelo)
3. Servicios necesarios (si aplica)
4. Archivo main.dart principal que incluya todo lo necesario
5. Cualquier archivo pubspec.yaml o configuración adicional necesaria

Recuerda: Genera código Flutter limpio y bien estructurado que implemente fielmente la interfaz mostrada.`
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/png;base64,${imageBase64}`
              }
            }
          ]
        }
      ],
      max_tokens: 8192,
      temperature: 0.2,
    });
  }

  /**
   * Procesa el código obtenido de la API
   */
  private processCode(responseText: string): ProcessedResponse {
    try {
      this.logger.log("Procesando el código...");
      
      // Colecciones para almacenar los resultados
      const screens: FlutterScreen[] = [];
      const widgets: FlutterWidget[] = [];
      const models: FlutterModel[] = [];
      const services: FlutterService[] = [];
      let mainApp: MainApp | undefined = undefined;
      
      // Almacenar bloques de código por nombre de archivo
      const codeBlocks = new Map<string, string>();
      const processedFiles = new Map<string, boolean>();
      
      // 1. Extraer todos los bloques de código con sus nombres de archivo
      this.extractFileBlocks(responseText, codeBlocks);
      this.logger.log(`Bloques de código extraídos: ${codeBlocks.size}`);
      
      // 2. Procesar cada bloque de código según su tipo
      const processedResult = this.processCodeBlocks(codeBlocks, processedFiles, screens, widgets, models, services);
      
      // 3. Si no se encontró código, intentar con un método más flexible
      if (screens.length === 0 && widgets.length === 0 && models.length === 0 && services.length === 0 && !processedResult.mainApp) {
        this.logger.warn('No se encontraron archivos con el formato esperado. Intentando método alternativo...');
        return this.extractWithExtendedPatterns(responseText);
      }
      
      // 4. Si no tenemos un main.dart, generarlo
      if (!processedResult.mainApp) {
        processedResult.mainApp = this.generateMainApp({ 
          screens, 
          widgets, 
          models,
          services 
        });
        this.logger.log('main.dart generado automáticamente');
      }
      
      return processedResult;
    } catch (error) {
      this.logger.error(`Error al procesar el código: ${error.message}`);
      // Intentar con método alternativo en caso de error
      return this.extractWithExtendedPatterns(responseText);
    }
  }

  /**
   * Extrae bloques de código y sus nombres de archivo
   */
  private extractFileBlocks(text: string, blocks: Map<string, string>): void {
    // Patrones para diferentes tipos de archivos
    const patterns = [
      // main.dart específicamente
      /```(?:dart)[\s\n]*\/\/[\s\n]*main\.dart[\s\S]*?```/g,
      
      // Pantallas Flutter (.dart)
      /```dart[\s\n]*\/\/[\s\n]*([\w-]+_screen\.dart)[\s\S]*?```/g,
      
      // Widgets Flutter (.dart)
      /```dart[\s\n]*\/\/[\s\n]*([\w-]+_widget\.dart)[\s\S]*?```/g,
      
      // Modelos (.dart)
      /```dart[\s\n]*\/\/[\s\n]*([\w-]+_model\.dart)[\s\S]*?```/g,
      
      // Servicios (.dart)
      /```dart[\s\n]*\/\/[\s\n]*([\w-]+_service\.dart)[\s\S]*?```/g,
      
      // Cualquier archivo dart genérico
      /```dart[\s\n]*\/\/[\s\n]*([\w\/-]+\.dart)[\s\S]*?```/g
    ];
    
    // Comprobar primero si hay un main.dart explícito
    const mainAppMatch = text.match(/```dart[\s\n]*\/\/[\s\n]*main\.dart[\s\S]*?```/);
    if (mainAppMatch) {
      const mainAppCode = this.extractCodeContent(mainAppMatch[0]);
      blocks.set('main.dart', mainAppCode);
      this.logger.log(`Bloque encontrado: main.dart (${mainAppCode.length} caracteres)`);
    }
    
    // Procesar los demás patrones
    for (let i = mainAppMatch ? 1 : 0; i < patterns.length; i++) {
      const pattern = patterns[i];
      const matches = text.matchAll(pattern);
      
      for (const match of matches) {
        if (match[0]) {
          // El patrón de main.dart es especial
          if (i === 0 && mainAppMatch) {
            continue; // Ya procesamos main.dart arriba
          }
          
          // Para los demás patrones, usar el grupo de captura para el nombre del archivo
          const fileName = match[1]?.trim();
          if (!fileName) continue;
          
          // Evitar procesar main.dart dos veces
          if (fileName === 'main.dart' && blocks.has('main.dart')) {
            continue;
          }
          
          const codeBlock = match[0];
          const codeContent = this.extractCodeContent(codeBlock);
          
          blocks.set(fileName, codeContent);
          this.logger.log(`Bloque encontrado: ${fileName} (${codeContent.length} caracteres)`);
        }
      }
    }
    
    // Si no encontramos bloques específicos, buscar bloques de código dart genéricos
    if (blocks.size === 0) {
      const dartBlocks = Array.from(text.matchAll(/```dart[\s\S]*?```/g));
      
      for (let i = 0; i < dartBlocks.length; i++) {
        const dartContent = this.extractCodeContent(dartBlocks[i][0]);
        
        // Intentar identificar el tipo de archivo por el contenido
        const fileName = this.inferFileNameFromContent(dartContent, i);
        
        blocks.set(fileName, dartContent);
        this.logger.log(`Bloque dart genérico asociado con: ${fileName}`);
      }
    }
  }

  /**
   * Intenta inferir un nombre de archivo basado en el contenido del código
   */
  private inferFileNameFromContent(content: string, index: number): string {
    if (content.includes('void main()') || content.includes('runApp(')) {
      return 'main.dart';
    } else if (content.includes('StatefulWidget') || content.includes('StatelessWidget')) {
      if (content.includes('Screen') || content.includes('Page')) {
        return `screen_${index}.dart`;
      } else {
        return `widget_${index}.dart`;
      }
    } else if (content.includes('class') && content.includes('extends') === false) {
      return `model_${index}.dart`;
    } else if (content.includes('service') || content.includes('Service') || content.includes('Repository')) {
      return `service_${index}.dart`;
    } else {
      return `file_${index}.dart`;
    }
  }

  /**
   * Procesa los bloques de código extraídos
   */
  private processCodeBlocks(
    codeBlocks: Map<string, string>,
    processedFiles: Map<string, boolean>,
    screens: FlutterScreen[],
    widgets: FlutterWidget[],
    models: FlutterModel[],
    services: FlutterService[]
  ): ProcessedResponse {
    let mainApp: MainApp | undefined = undefined;
    
    // Primero verificar si existe un main.dart
    if (codeBlocks.has('main.dart')) {
      const mainAppCode = codeBlocks.get('main.dart');
      if (mainAppCode) {
        mainApp = { code: mainAppCode };
        processedFiles.set('main.dart', true);
        this.logger.log('main.dart procesado desde el código generado');
      }
    }
    
    // Procesar el resto de archivos
    for (const [fileName, codeContent] of codeBlocks.entries()) {
      // Evitar procesar el mismo archivo más de una vez
      if (processedFiles.has(fileName)) {
        continue;
      }
      
      if (fileName === 'main.dart') {
        continue; // Ya lo procesamos arriba
      }
      
      if (fileName.includes('_screen') || fileName.includes('page')) {
        // Es un archivo de pantalla Flutter
        const screenName = fileName.replace('.dart', '');
        
        screens.push({
          name: screenName,
          code: codeContent
        });
        
        processedFiles.set(fileName, true);
        this.logger.log(`Pantalla procesada: ${screenName}`);
      }
      else if (fileName.includes('_widget') || (fileName.includes('widget') && !fileName.includes('screen'))) {
        // Es un archivo de widget Flutter
        const widgetName = fileName.replace('.dart', '');
        
        widgets.push({
          name: widgetName,
          dartCode: codeContent
        });
        
        processedFiles.set(fileName, true);
        this.logger.log(`Widget procesado: ${widgetName}`);
      }
      else if (fileName.includes('_model') || fileName.includes('model')) {
        // Es un archivo de modelo
        const modelName = fileName.replace('.dart', '');
        
        models.push({
          name: modelName,
          code: codeContent
        });
        
        processedFiles.set(fileName, true);
        this.logger.log(`Modelo procesado: ${modelName}`);
      }
      else if (fileName.includes('_service') || fileName.includes('service') || fileName.includes('provider')) {
        // Es un archivo de servicio
        const serviceName = fileName.replace('.dart', '');
        
        services.push({
          name: serviceName,
          code: codeContent
        });
        
        processedFiles.set(fileName, true);
        this.logger.log(`Servicio procesado: ${serviceName}`);
      }
      else {
        // Intentar inferir el tipo de archivo por el contenido
        if (codeContent.includes('StatefulWidget') || codeContent.includes('StatelessWidget')) {
          if (codeContent.includes('Screen') || codeContent.includes('Page')) {
            const screenName = fileName.replace('.dart', '');
            screens.push({
              name: screenName,
              code: codeContent
            });
          } else {
            const widgetName = fileName.replace('.dart', '');
            widgets.push({
              name: widgetName,
              dartCode: codeContent
            });
          }
        } else if (codeContent.includes('class') && !codeContent.includes('extends')) {
          const modelName = fileName.replace('.dart', '');
          models.push({
            name: modelName,
            code: codeContent
          });
        } else if (codeContent.includes('Service') || codeContent.includes('Provider') || codeContent.includes('Repository')) {
          const serviceName = fileName.replace('.dart', '');
          services.push({
            name: serviceName,
            code: codeContent
          });
        }
        
        processedFiles.set(fileName, true);
        this.logger.log(`Archivo procesado como genérico: ${fileName}`);
      }
    }
    
    return { screens, widgets, models, services, mainApp };
  }

  /**
   * Método alternativo para extraer código si el primer método falla
   */
  private extractWithExtendedPatterns(responseText: string): ProcessedResponse {
    this.logger.log('Usando método alternativo de extracción...');
    
    const screens: FlutterScreen[] = [];
    const widgets: FlutterWidget[] = [];
    const models: FlutterModel[] = [];
    const services: FlutterService[] = [];
    let mainApp: MainApp | undefined = undefined;
    
    // 1. Intentar extraer el main.dart directamente
    const mainAppMatch = responseText.match(/```dart[\s\S]*?void\s+main[\s\S]*?runApp[\s\S]*?```/);
    if (mainAppMatch) {
      mainApp = { code: this.extractCodeContent(mainAppMatch[0]) };
      this.logger.log('main.dart extraído con método alternativo');
    }
    
    // 2. Extraer pantallas y widgets
    this.extractWidgetsAndScreens(responseText, screens, widgets);
    
    // 3. Extraer modelos
    this.extractModels(responseText, models);
    
    // 4. Extraer servicios
    this.extractServices(responseText, services);
    
    // 5. Si aún no encontramos nada, crear widget de error
    if (screens.length === 0 && widgets.length === 0 && models.length === 0 && services.length === 0) {
      this.createErrorWidget(widgets, responseText);
    }
    
    // 6. Si no tenemos un main.dart, generarlo
    if (!mainApp) {
      mainApp = this.generateMainApp({ screens, widgets, models, services });
      this.logger.log('main.dart generado automáticamente');
    }
    
    return { screens, widgets, models, services, mainApp };
  }

  /**
   * Extrae widgets y pantallas del texto de respuesta
   */
  private extractWidgetsAndScreens(text: string, screens: FlutterScreen[], widgets: FlutterWidget[]): void {
    // Encontrar bloques de widgets por StatelessWidget o StatefulWidget
    const widgetBlocks = [
      ...this.findAllMatches(text, /class\s+(\w+)\s+extends\s+StatelessWidget[\s\S]*?(?=```|class\s+\w+\s+extends)/g),
      ...this.findAllMatches(text, /class\s+(\w+)\s+extends\s+StatefulWidget[\s\S]*?(?=```|class\s+\w+\s+extends)/g)
    ];
    
    for (const [blockText, className] of widgetBlocks) {
      const code = this.extractRelevantCode(blockText, 'dart');
      
      // Determinar si es una pantalla o un widget
      if (className.includes('Screen') || className.includes('Page')) {
        screens.push({
          name: this.toSnakeCase(className),
          code
        });
        this.logger.log(`Pantalla extraída: ${className}`);
      } else {
        widgets.push({
          name: this.toSnakeCase(className),
          dartCode: code
        });
        this.logger.log(`Widget extraído: ${className}`);
      }
    }
  }

  /**
   * Extrae modelos del texto de respuesta
   */
  private extractModels(text: string, models: FlutterModel[]): void {
    // Encontrar modelos de datos por clases sin extends
    const modelBlocks = this.findAllMatches(text, /class\s+(\w+)(?!\s+extends)[\s\S]*?(?=```|class\s+\w+)/g);
    
    for (const [blockText, className] of modelBlocks) {
      // Verificar que parece un modelo y no otro tipo de clase
      if (blockText.includes('final') || blockText.includes('const') || blockText.includes('constructor')) {
        const code = this.extractRelevantCode(blockText, 'dart');
        
        models.push({
          name: this.toSnakeCase(className),
          code
        });
        this.logger.log(`Modelo extraído: ${className}`);
      }
    }
  }

  /**
   * Extrae servicios del texto de respuesta
   */
  private extractServices(text: string, services: FlutterService[]): void {
    // Encontrar servicios por nombres típicos
    const serviceBlocks = this.findAllMatches(text, /class\s+(\w+(?:Service|Provider|Repository|Client|Api))[\s\S]*?(?=```|class\s+\w+)/g);
    
    for (const [blockText, className] of serviceBlocks) {
      const code = this.extractRelevantCode(blockText, 'dart');
      
      services.push({
        name: this.toSnakeCase(className),
        code
      });
      this.logger.log(`Servicio extraído: ${className}`);
    }
  }

  /**
   * Crea un widget de error
   */
  private createErrorWidget(widgets: FlutterWidget[], responseText: string): void {
    this.logger.warn('No se pudo extraer ningún código válido de la respuesta.');
    
    widgets.push({
      name: 'error_widget',
      dartCode: `
        import 'package:flutter/material.dart';
        
        class ErrorWidget extends StatelessWidget {
          const ErrorWidget({Key? key}) : super(key: key);
          
          @override
          Widget build(BuildContext context) {
            return Scaffold(
              appBar: AppBar(
                title: const Text('Error de Generación'),
              ),
              body: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Error al generar código',
                      style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 16),
                    const Text(
                      'No se pudo procesar la respuesta de la IA. Por favor intenta con otra captura o contacta al soporte.',
                    ),
                    const SizedBox(height: 16),
                    Container(
                      padding: const EdgeInsets.all(8),
                      color: Colors.grey[200],
                      child: Text(
                        '${responseText.substring(0, 500)}...',
                        style: const TextStyle(fontFamily: 'monospace', fontSize: 12),
                      ),
                    )
                  ],
                ),
              ),
            );
          }
        }
      `
    });
  }

  /**
   * Encuentra todas las coincidencias de un patrón con captura de grupos
   */
  private findAllMatches(text: string, pattern: RegExp): Array<[string, string]> {
    const results: Array<[string, string]> = [];
    const matches = text.matchAll(pattern);
    
    for (const match of matches) {
      if (match[0] && match[1]) {
        results.push([match[0], match[1]]);
      }
    }
    
    return results;
  }

  /**
   * Extrae código relevante buscando el bloque markdown completo
   */
  private extractRelevantCode(text: string, language: string): string {
    // Buscar el bloque de código más cercano
    const blockMatch = text.match(new RegExp(`\`\`\`(?:${language})?[\\s\\S]*?\`\`\``));
    
    if (blockMatch) {
      return this.extractCodeContent(blockMatch[0]);
    }
    
    // Si no se encuentra un bloque, intentar extraer el código directamente
    const codeStart = text.indexOf('import ');
    if (codeStart >= 0) {
      return text.substring(codeStart);
    }
    
    return text;
  }

  /**
   * Extrae el contenido de un bloque de código markdown
   */
  private extractCodeContent(codeBlock: string): string {
    return codeBlock
      .replace(/```dart[\s\n]*\/\/[\s\n]*.*[\s\n]*/g, '') 
      .replace(/```dart[\s\n]*/g, '') 
      .replace(/```$/g, '')
      .trim();
  }

  /**
   * Genera un archivo main.dart básico
   */
  private generateMainApp(result: ProcessedResponse): MainApp {
    const { screens } = result;
    
    let homeScreenImport = '';
    let homeScreenWidget = 'const Center(child: Text("Pantalla principal"))';
    
    if (screens.length > 0) {
      const homeScreen = screens[0];
      const homeScreenName = this.toSnakeCase(homeScreen.name);
      const className = this.toPascalCase(homeScreen.name);
      
      homeScreenImport = `import '${homeScreenName}.dart';`;
      homeScreenWidget = `${className}()`;
    }
    
    const code = `import 'package:flutter/material.dart';
${homeScreenImport}

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Flutter Demo',
      theme: ThemeData(
        primarySwatch: Colors.blue,
        visualDensity: VisualDensity.adaptivePlatformDensity,
      ),
      home: ${homeScreenWidget},
    );
  }
}`;
  
    return { code };
  }
  
  /**
   * Convierte PascalCase a snake_case
   */
  private toSnakeCase(text: string): string {
    return text
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .replace(/^_/, '');
  }
  
  /**
   * Convierte snake_case a PascalCase
   */
  private toPascalCase(text: string): string {
    if (!text) return '';
    
    return text
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  }


  /**
 * Extrae elementos de UI a partir de una imagen utilizando OpenAI
 * @param {Buffer} imageBuffer - La imagen en formato Buffer
 * @param {string} vistaId - ID de la vista donde se agregarán las figuras
 * @param {string} description - Descripción opcional para la IA
 * @returns {Promise<Array>} - Las figuras creadas en la base de datos
 */
async extractUIElementsFromImage(
  imageBuffer: Buffer,
  vistaId: string,
  description: string = ''
): Promise<any[]> {
  try {
    this.logger.log('Analizando imagen para extraer elementos de UI...');
    
    // 1. Convertir imagen a base64
    const imageBase64 = this.prepareImageBase64(imageBuffer);
    
    // 2. Llamar a la API de OpenAI para analizar la imagen
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Eres un experto en diseño de interfaces de usuario que puede identificar elementos de UI en bocetos o dibujos a mano.
           
Tu tarea es analizar la imagen y detectar todos los elementos de UI (botones, cuadros de texto, imágenes, etc.) 
incluyendo sus posiciones aproximadas y tamaños. Debes convertir esta información en especificaciones JSON 
que se puedan usar para recrear estos elementos en un canvas.

INSTRUCCIONES IMPORTANTES:
1. Identifica cada elemento visible en la imagen (rectángulos, círculos, textos, etc.).
2. Para cada elemento, especifica: tipo, posición (x, y), dimensiones (ancho/alto o radio), y propiedades adicionales como texto o color.
3. Utiliza coordenadas relativas dentro de un lienzo de 1200x800 píxeles.
4. Devuelve un array JSON con todos los elementos encontrados.
5. Asegúrate de que cada elemento tenga todas las propiedades requeridas según su tipo.

TIPOS DE FIGURAS COMPATIBLES:
- rectangle: requiere x, y, width, height, fill (color), stroke, strokeWidth
- circle: requiere x, y, radius, fill, stroke, strokeWidth
- text: requiere x, y, text, fontSize, fontFamily, fill
- line: requiere x, y, points (array de coordenadas [x1, y1, x2, y2])

EJEMPLO DE RESPUESTA:
[
  {
    "tipo": "rectangle",
    "x": 100,
    "y": 50,
    "width": 200,
    "height": 80,
    "fill": "#4285F4",
    "stroke": "#000000",
    "strokeWidth": 1
  },
  {
    "tipo": "text",
    "x": 130,
    "y": 80,
    "text": "Botón de Guardar",
    "fontSize": 18,
    "fontFamily": "Arial",
    "fill": "#FFFFFF"
  },
  {
    "tipo": "circle",
    "x": 400,
    "y": 200,
    "radius": 40,
    "fill": "#FBBC05",
    "stroke": "#000000",
    "strokeWidth": 2
  }
]`
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Por favor, analiza esta imagen de un boceto/dibujo de interfaz de usuario ${description ? ' que ' + description : ''}.
              
Identifica todos los elementos de UI y genera las especificaciones JSON para recrearlos en un canvas. 
Utiliza coordenadas relativas para un lienzo de 1200x800 píxeles.

Devuelve SOLO el array JSON con los elementos, sin ningún texto adicional.`
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/png;base64,${imageBase64}`
              }
            }
          ]
        }
      ],
      temperature: 0.2,
      max_tokens: 4000
    });
    
    // 3. Procesar la respuesta
    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('La respuesta de OpenAI no contiene contenido');
    }
    
    // 4. Extraer el array JSON
    const jsonMatch = content.match(/\[\s*\{[\s\S]*\}\s*\]/);
    let uiElements = [];
    
    if (jsonMatch) {
      try {
        uiElements = JSON.parse(jsonMatch[0]);
      } catch (error) {
        this.logger.error(`Error al parsear JSON de elementos UI: ${error.message}`);
        throw new Error('No se pudo procesar la respuesta de la IA. Formato incorrecto.');
      }
    } else {
      // Intento alternativo: toda la respuesta podría ser un JSON válido
      try {
        uiElements = JSON.parse(content);
        if (!Array.isArray(uiElements)) {
          throw new Error('La respuesta no es un array');
        }
      } catch (error) {
        this.logger.error(`Error al parsear respuesta completa como JSON: ${error.message}`);
        throw new Error('No se pudo procesar la respuesta de la IA. Formato incorrecto.');
      }
    }
    
    // 5. Crear las figuras en la base de datos
    const createdFigures = await this.createFiguresFromUIElements(uiElements, vistaId);
    
    return createdFigures;
  } catch (error) {
    this.logger.error(`Error al analizar imagen para UI: ${error.message}`);
    throw new Error(`Error al procesar la imagen: ${error.message}`);
  }
}


private async createFiguresFromUIElements(uiElements: any[], vistaId: string): Promise<any[]> {
  try {
    // Obtener la instancia del servicio de figuras
    const figuraService = this.moduleRef.get(FiguraService, { strict: false });
    
    if (!figuraService) {
      throw new Error('No se pudo obtener el servicio de figuras');
    }
    
    const createdFigures: any[] = [];
    
    // Procesar cada elemento y crear la figura correspondiente
    for (const element of uiElements) {
      try {
        // Asegurarnos de que tiene todas las propiedades necesarias
        const figuraData = {
          ...element,
          vistaId // Asignar el ID de la vista
        };
        
        // Crear la figura en la base de datos
        const createdFigure = await figuraService.create(figuraData);
        createdFigures.push(createdFigure);
        
        this.logger.log(`Figura creada: ${createdFigure.id} (${element.tipo})`);
      } catch (figureError) {
        this.logger.error(`Error al crear figura individual: ${figureError.message}`);
        // Continuar con las demás figuras en caso de error
      }
    }
    
    this.logger.log(`Total de figuras creadas: ${createdFigures.length} de ${uiElements.length}`);
    return createdFigures;
  } catch (error) {
    this.logger.error(`Error al crear figuras a partir de elementos UI: ${error.message}`);
    throw new Error(`Error al crear figuras: ${error.message}`);
  }
}





}