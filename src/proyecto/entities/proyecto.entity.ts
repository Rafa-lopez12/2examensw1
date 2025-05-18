import { Column, Entity, JoinTable, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { User } from '../../auth/entities/auth.entity';
import { Vista } from '../../vista/entities/vista.entity';

@Entity('proyecto')
export class Proyecto {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    nombre:string

    @ManyToOne(
        () => User,
        ( user ) => user.proyecto,
        { eager: true }
    )
    usuario: User
    
    @OneToMany(() => Vista, (vista) => vista.proyecto)
    vista: Vista;

   
    @ManyToMany(() => User, (user) => user.proyec)
     // Necesario para definir la tabla intermedia
    user: User[];

      
}
