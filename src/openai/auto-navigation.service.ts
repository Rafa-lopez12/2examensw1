import { Injectable, Logger } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { VistaService } from '../vista/vista.service';
import { FiguraService } from '../figura/figura.service';

@Injectable()
export class AutoNavigationService {
  private readonly logger = new Logger('AutoNavigationService');

  constructor(private readonly moduleRef: ModuleRef) {}

  /**
   * Genera navegación automáticamente cuando se procesan capturas
   */
  async generateNavigationForProject(projectId: string): Promise<any> {
    try {
      const vistaService = this.moduleRef.get(VistaService, { strict: false });
      const figuraService = this.moduleRef.get(FiguraService, { strict: false });
      
      if (!vistaService || !figuraService) {
        throw new Error('Servicios requeridos no disponibles');
      }

      const vistas = await vistaService.findAll(projectId);
      
      if (!vistas || vistas.length < 2) {
        this.logger.log(`Proyecto ${projectId} tiene menos de 2 vistas, no se genera navegación`);
        return null;
      }

      this.logger.log(`Generando navegación SIMPLE para proyecto ${projectId} con ${vistas.length} vistas`);

      const vistaDetails = await Promise.all(
        vistas.map(async (vista) => {
          try {
            const figuras = await figuraService.findAll(vista.id);
            return {
              id: vista.id,
              nombre: vista.nombre,
              figuras: figuras || [],
              proyecto: vista.proyecto
            };
          } catch (error) {
            this.logger.warn(`Error obteniendo figuras para vista ${vista.id}: ${error.message}`);
            return {
              id: vista.id,
              nombre: vista.nombre,
              figuras: [],
              proyecto: vista.proyecto
            };
          }
        })
      );

      // Generar estructura SIMPLE
      const navigationStructure = this.createNavigationStructure(vistaDetails);
      
      return navigationStructure;
    } catch (error) {
      this.logger.error(`Error generando navegación automática: ${error.message}`);
      return null;
    }
  }

  /**
   * Crea la estructura de navegación basada en las vistas
   */
  private createNavigationStructure(vistas: any[]): any {
    // Crear rutas basadas en las vistas
    const routes = vistas.map((vista, index) => ({
      name: this.toSnakeCase(vista.nombre),
      screenName: this.toPascalCase(vista.nombre) + 'Screen',
      path: `/${this.toSnakeCase(vista.nombre)}`,
      isInitial: this.determineIfInitial(vista, index),
      description: vista.nombre,
      figuraCount: vista.figuras.length
    }));

    // SOLO generar main.dart con todo integrado
    const files = {
      mainApp: this.generateSimpleMainApp(routes, vistas[0]?.proyecto?.nombre || 'MyApp')
    };

    return {
      routes,
      files
    };
  }

  /**
   * Genera main.dart con navegación integrada - TODO EN UNO
   */
  private generateSimpleMainApp(routes: any[], projectName: string): string {
    const className = this.toPascalCase(projectName);
    const initialRoute = routes.find(r => r.isInitial)?.path || routes[0]?.path || '/';
    
    return `// lib/main.dart
import 'package:flutter/material.dart';
// Importar todas las pantallas
${routes.map(route => `import 'screens/${route.name}_screen.dart';`).join('\n')}

void main() {
  runApp(const ${className}App());
}

class ${className}App extends StatelessWidget {
  const ${className}App({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: '${projectName}',
      theme: ThemeData(
        primarySwatch: Colors.blue,
        visualDensity: VisualDensity.adaptivePlatformDensity,
      ),
      initialRoute: '${initialRoute}',
      routes: {
        // Definir todas las rutas directamente aquí
${routes.map(route => `        '${route.path}': (context) => ${route.screenName}(),`).join('\n')}
      },
      debugShowCheckedModeBanner: false,
    );
  }
}

// Navegación simple - TODO EN UNA CLASE
class AppNavigation {
  // Rutas disponibles
${routes.map(route => `  static const String ${route.name} = '${route.path}';`).join('\n')}

  // Métodos simples para navegar
  static void goTo(BuildContext context, String route) {
    Navigator.pushNamed(context, route);
  }

  static void goBack(BuildContext context) {
    if (Navigator.canPop(context)) {
      Navigator.pop(context);
    }
  }

  // Lista para el drawer
  static List<NavigationItem> get allRoutes => [
${routes.map(route => `    NavigationItem('${route.description}', ${route.name}, Icons.${this.getIconForRoute(route.name)}),`).join('\n')}
  ];
}

// Item simple de navegación
class NavigationItem {
  final String title;
  final String route;
  final IconData icon;
  const NavigationItem(this.title, this.route, this.icon);
}

// Drawer automático
class AppDrawer extends StatelessWidget {
  const AppDrawer({super.key});

  @override
  Widget build(BuildContext context) {
    return Drawer(
      child: ListView(
        padding: EdgeInsets.zero,
        children: [
          const DrawerHeader(
            decoration: BoxDecoration(color: Colors.blue),
            child: Text(
              'Navegación',
              style: TextStyle(color: Colors.white, fontSize: 24),
            ),
          ),
          ...AppNavigation.allRoutes.map((item) => ListTile(
            leading: Icon(item.icon),
            title: Text(item.title),
            onTap: () {
              Navigator.pop(context);
              AppNavigation.goTo(context, item.route);
            },
          )),
        ],
      ),
    );
  }
}`;
  }

  /**
   * Determina si una vista debería ser la inicial
   */
  private determineIfInitial(vista: any, index: number): boolean {
    const name = vista.nombre.toLowerCase();
    const initialPatterns = [
      'login', 'signin', 'auth', 'welcome', 'onboarding', 
      'splash', 'home', 'dashboard', 'main', 'inicio', 'principal'
    ];

    for (const pattern of initialPatterns) {
      if (name.includes(pattern)) {
        return true;
      }
    }

    return index === 0; // Primera vista por defecto
  }

  /**
   * Obtiene icono apropiado para la ruta
   */
  private getIconForRoute(routeName: string): string {
    const iconMap = {
      'home': 'home',
      'login': 'login',
      'register': 'person_add',
      'profile': 'person',
      'settings': 'settings',
      'dashboard': 'dashboard',
      'lista': 'list',
      'principal': 'home',
      'usuario': 'person',
      'registro': 'person_add'
    };

    for (const [key, icon] of Object.entries(iconMap)) {
      if (routeName.toLowerCase().includes(key)) {
        return icon;
      }
    }
    
    return 'pages';
  }

  /**
   * Convierte texto a snake_case
   */
  private toSnakeCase(text: string): string {
    return text
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .replace(/^_/, '')
      .replace(/\s+/g, '_');
  }

  /**
   * Convierte texto a PascalCase
   */
  private toPascalCase(text: string): string {
    return text
      .split(/[\s_-]+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }
}