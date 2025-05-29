// src/openai/openai.controller.ts
// src/openai/openai.controller.ts
import { 
  Controller, 
  Post, 
  Body, 
  UploadedFile, 
  UseInterceptors,
  HttpException,
  HttpStatus,
  Logger
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { OpenAIService } from './openai.service';
import { Auth } from '../auth/decorators/auth.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../auth/entities/auth.entity';
import { 
  CodeGenerationResult, 
  ScreenshotGenerationParams 
} from './openai.interfaces';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';

@Controller('code-generator')
export class OpenAIController {
  private readonly logger = new Logger('OpenAIController');

  constructor(private readonly openaiService: OpenAIService) {}

@Post('generate-ui-from-image')
@Auth()
@UseInterceptors(
  FileInterceptor('image', {
    storage: diskStorage({
      destination: './uploads/sketches',
      filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${uuidv4()}`;
        const ext = extname(file.originalname);
        cb(null, `sketch-${uniqueSuffix}${ext}`);
      },
    }),
    fileFilter: (req, file, cb) => {
      if (!file.originalname.match(/\.(jpg|jpeg|png|gif|bmp)$/)) {
        return cb(
          new HttpException(
            'Solo se permiten archivos de imagen',
            HttpStatus.BAD_REQUEST
          ),
          false
        );
      }
      cb(null, true);
    },
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB tamaño máximo
    },
  })
)
async generateUIFromImage(
  @UploadedFile() image,
  @Body('vistaId') vistaId: string,
  @Body('description') description: string,
  @GetUser() user: User
) {
  try {
    if (!image) {
      throw new HttpException(
        'No se proporcionó ninguna imagen',
        HttpStatus.BAD_REQUEST
      );
    }

    if (!vistaId || vistaId.trim() === '') {
      throw new HttpException(
        'El ID de la vista es obligatorio',
        HttpStatus.BAD_REQUEST
      );
    }

    this.logger.log(`Usuario ${user.id} solicitó interpretación de UI a partir de una imagen para la vista "${vistaId}"`);

    // Leer la imagen como un Buffer
    let imageBuffer;
    if (image.buffer) {
      imageBuffer = image.buffer;
    } else if (image.path) {
      imageBuffer = fs.readFileSync(image.path);
    } else {
      throw new HttpException(
        'Formato de imagen no válido',
        HttpStatus.BAD_REQUEST
      );
    }

    // Procesar la imagen con OpenAI para extraer los elementos de UI
    const uiElements = await this.openaiService.extractUIElementsFromImage(
      imageBuffer,
      vistaId,
      description
    );
    
    return {
      success: true,
      message: 'Elementos de UI extraídos exitosamente',
      figuresCount: uiElements.length,
      data: uiElements
    };
  } catch (error) {
    this.logger.error(`Error al procesar imagen de UI: ${error.message}`);
    
    return {
      success: false,
      message: `Error al procesar imagen de UI: ${error.message}`,
      error: error.message
    };
  }
}



  @Post('generate-flutter-from-screenshot')
  @Auth()
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads/screenshots',
        filename: (req, file, cb) => {
          // Genera un nombre único para el archivo
          const uniqueSuffix = `${Date.now()}-${uuidv4()}`;
          const ext = extname(file.originalname);
          cb(null, `screenshot-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        // Acepta solo imágenes
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif|bmp)$/)) {
          return cb(
            new HttpException(
              'Solo se permiten archivos de imagen',
              HttpStatus.BAD_REQUEST
            ),
            false
          );
        }
        cb(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB tamaño máximo
      },
    })
  )
  async generateFlutterCodeFromScreenshot(
    @UploadedFile() image,
    @Body('pageName') pageName: string,
    @Body('description') description: string,
    @GetUser() user: User
  ): Promise<CodeGenerationResult> {
    try {
      if (!image) {
        throw new HttpException(
          'No se proporcionó ninguna imagen',
          HttpStatus.BAD_REQUEST
        );
      }

      if (!pageName || pageName.trim() === '') {
        throw new HttpException(
          'El nombre de la página es obligatorio',
          HttpStatus.BAD_REQUEST
        );
      }

      this.logger.log(`Usuario ${user.id} solicitó generación de código Flutter para la pantalla "${pageName}"`);

      // Leer la imagen como un Buffer
      let imageBuffer;
      if (image.buffer) {
        // Si ya está como buffer, usarlo directamente
        imageBuffer = image.buffer;
      } else if (image.path) {
        // Si tenemos la ruta del archivo guardado, leerlo
        imageBuffer = fs.readFileSync(image.path);
      } else {
        throw new HttpException(
          'Formato de imagen no válido',
          HttpStatus.BAD_REQUEST
        );
      }

      // Generar el código Flutter a partir de la captura de pantalla
      const generatedCode = await this.openaiService.generateFlutterCodeFromScreenshot({
        image: imageBuffer,
        pageName,
        description
      });
      
      return {
        success: true,
        message: 'Código Flutter generado exitosamente a partir de captura de pantalla',
        data: generatedCode,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error(`Error al generar código Flutter: ${error.message}`);
      
      return {
        success: false,
        message: `Error al generar código Flutter desde captura: ${error.message}`,
        error: error.message
      };
    }
  }

  // Se puede mantener el endpoint antiguo de Angular como referencia o eliminarlo
  @Post('generate-from-screenshot')
  @Auth()
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads/screenshots',
        filename: (req, file, cb) => {
          const uniqueSuffix = `${Date.now()}-${uuidv4()}`;
          const ext = extname(file.originalname);
          cb(null, `screenshot-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif|bmp)$/)) {
          return cb(
            new HttpException(
              'Solo se permiten archivos de imagen',
              HttpStatus.BAD_REQUEST
            ),
            false
          );
        }
        cb(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    })
  )
  async generateAngularCodeFromScreenshot(
    @UploadedFile() image,
    @Body('pageName') pageName: string,
    @Body('description') description: string,
    @GetUser() user: User
  ): Promise<CodeGenerationResult> {
    this.logger.warn(`DEPRECATED: El usuario ${user.id} utilizó el endpoint de generación Angular en lugar de Flutter`);
    
    // Informar al usuario que este endpoint está obsoleto
    return {
      success: false,
      message: 'Este endpoint para generación de código Angular está obsoleto. Por favor utilice /generate-flutter-from-screenshot para generar código Flutter.',
      error: 'Endpoint obsoleto'
    };
  }

}
