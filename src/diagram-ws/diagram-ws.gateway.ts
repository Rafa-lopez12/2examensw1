import { 
  OnGatewayConnection, 
  OnGatewayDisconnect, 
  OnGatewayInit, 
  SubscribeMessage, 
  WebSocketGateway, 
  WebSocketServer 
} from '@nestjs/websockets';
import { DiagramWsService } from './diagram-ws.service';
import { Server, Socket } from 'socket.io';
import { FiguraService } from '../figura/figura.service';
import { CreateFiguraDto } from '../figura/dto/create-figura.dto';
import { UpdateFiguraDto } from '../figura/dto/update-figura.dto';

@WebSocketGateway({
  cors: {
    origin: '*', // Permitir cualquier origen (puedes cambiarlo a una lista de dominios específicos)
    methods: ['GET', 'POST'],
    credentials: true,
    allowedHeaders: ['my-custom-header'],
  },
  transports: ['websocket', 'polling'], // Asegúrate de incluir 'polling' para mayor compatibilidad
  path: '/socket.io/',
})
export class DiagramWsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  
  @WebSocketServer() 
  wss: Server;

  constructor(
    private readonly diagramWsService: DiagramWsService,
    private readonly figurasService: FiguraService
  ) {}

  handleConnection(client: Socket) {
    console.log('Cliente conectado', client.id);
  }
  
  handleDisconnect(client: Socket) {
    console.log('Cliente desconectado', client.id);
  }

  afterInit(server: Server) {
    console.log('WebSocket iniciado');
  }

  // Unirse a la sala de una página específica
  @SubscribeMessage('joinPage')
  handleJoinPage(client: Socket, pageId: string) {
    // Dejar todas las salas previas (si estaba en alguna)
    const rooms = Object.keys(client.rooms).filter(room => room !== client.id);
    rooms.forEach(room => client.leave(room));
    
    // Unirse a la sala de la página actual
    client.join(`page_${pageId}`);
    console.log(`Cliente ${client.id} unido a la página ${pageId}`);
    
    return { success: true, message: `Unido a la página ${pageId}` };
  }

  // Escuchar cuando un usuario mueve una forma
  @SubscribeMessage('moveShape')
  handleMoveShape(client: Socket, payload: any) {
    const { figuraId, id, pageId, ...updateData } = payload;
    const figId = figuraId || id; // Usar cualquiera que esté disponible
    
    console.log(`Movimiento recibido para figura ${figId}:`, updateData);
    
    // Reenviar la actualización a los demás clientes en la misma página
    client.to(`page_${pageId}`).emit('updateShape', payload);
    
    // Solo actualizar si tenemos campos para actualizar y un ID válido
    if (figId && Object.keys(updateData).length > 0) {
      // Persistir el cambio en la base de datos
      this.figurasService.update(figId, updateData)
        .catch(error => console.error('Error al actualizar figura:', error));
    }
    
    return { success: true };
  }

  // Crear una nueva figura
  @SubscribeMessage('createFigure')
  async handleCreateFigure(client: Socket, payload: CreateFiguraDto) {
    console.log('Creando nueva figura:', payload);
    
    try {
      // Guardar en la base de datos
      const newFigure = await this.figurasService.create(payload);
      
      // Importante: asegúrate de que estás enviando la figura completa, incluyendo el ID generado
      console.log('Figura creada, emitiendo evento:', newFigure);
      
      // Notificar a TODOS los clientes en la misma página, incluido el que creó la figura
      this.wss.to(`page_${payload.vistaId}`).emit('figureCreated', newFigure);
      
      return { 
        success: true, 
        figure: newFigure 
      };
    } catch (error) {
      console.error('Error al crear figura:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  // Actualizar una figura existente
@SubscribeMessage('updateFigure')
async handleUpdateFigure(client: Socket, payload: { id: string, data: UpdateFiguraDto, pageId: string }) {
  const { id, data, pageId } = payload;
  console.log(`Actualizando figura ${id}:`, data);
  
  try {
    // Actualizar en la base de datos
    const updatedFigure = await this.figurasService.update(id, data);
    
    // Importante: recuperar la figura completa actualizada para enviar todos los datos
    const figuraCompleta = await this.figurasService.findOne(id);
    
    // Notificar a todos los clientes en la misma página
    this.wss.to(`page_${pageId}`).emit('figureUpdated', figuraCompleta);
    
    return { 
      success: true, 
      figure: figuraCompleta 
    };
  } catch (error) {
    console.error('Error al actualizar figura:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

@SubscribeMessage('deleteFigure')
async handleDeleteFigure(client: Socket, payload: { id: string, pageId: string }) {
  const { id, pageId } = payload;
  console.log(`Eliminando figura ${id}`);
  
  try {
    // Eliminar de la base de datos
    await this.figurasService.remove(id);
    
    // Notificar a todos los clientes en la misma página
    this.wss.to(`page_${pageId}`).emit('figureDeleted', { id });
    
    return { success: true };
  } catch (error) {
    console.error('Error al eliminar figura:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}
}

