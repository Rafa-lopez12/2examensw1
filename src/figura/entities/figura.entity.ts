import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Vista } from '../../vista/entities/vista.entity';

@Entity('figura')
export class Figura {
    @PrimaryGeneratedColumn('uuid')
    id:string

    @ManyToOne(
        () => Vista,
         ( vista ) => vista.figura,
         { eager: true }
    )
    vista:Vista

    @Column({ type: 'varchar', length: 50, nullable: false })
    tipo: string; // 'rectangle', 'circle', 'text', 'line', etc.
  
    // Propiedades de posición
    @Column({ type: 'float', nullable: false, default: 0 })
    x: number;
  
    @Column({ type: 'float', nullable: false, default: 0 })
    y: number;
  
    // Propiedades de tamaño (diferentes según el tipo)
    @Column({ type: 'float', nullable: true })
    width: number;
  
    @Column({ type: 'float', nullable: true })
    height: number;
  
    @Column({ type: 'float', nullable: true })
    radius: number;

    @Column({ type: 'simple-json', nullable: true })
    points: number[];
  
    // Propiedades de texto
    @Column({ type: 'text', nullable: true })
    text: string;
  
    @Column({ type: 'float', nullable: true })
    fontSize: number;
  
    @Column({ type: 'varchar', length: 50, nullable: true })
    fontFamily: string;
  
    // Propiedades de estilo
    @Column({ type: 'varchar', length: 20, nullable: true, default: '#cccccc' })
    fill: string;
  
    @Column({ type: 'varchar', length: 20, nullable: true, default: '#000000' })
    stroke: string;
  
    @Column({ type: 'float', nullable: true, default: 1 })
    strokeWidth: number;
  
    // Propiedad de rotación
    @Column({ type: 'float', nullable: true, default: 0 })
    rotation: number;
  
    // Propiedad de opacidad
    @Column({ type: 'float', nullable: true, default: 1 })
    opacity: number;

    @Column({ type: 'int', nullable: true, default: 0 })
    zIndex: number;

    // Nueva propiedad para la URL de la imagen (cuando tipo = 'image')
    @Column({ type: 'text', nullable: true })
    imageUrl: string;
  
    // Propiedades adicionales como JSON para extensibilidad
    @Column({ type: 'simple-json', nullable: true })
    additionalProps: Record<string, any>;


}
