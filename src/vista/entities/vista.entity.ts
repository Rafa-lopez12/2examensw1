import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Proyecto } from '../../proyecto/entities/proyecto.entity';
import { Figura } from '../../figura/entities/figura.entity';

@Entity('vista')
export class Vista {
    @PrimaryGeneratedColumn('uuid')
    id:string

    @Column()
    nombre:string

    @ManyToOne(
             () => Proyecto,
             ( proyec ) => proyec.vista,
             { eager: true }
    )
    proyecto: Proyecto
    
    @OneToMany(() => Figura, (figura) => figura.vista)
    figura:Figura;
}
