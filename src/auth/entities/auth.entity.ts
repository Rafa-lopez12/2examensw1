
import { BeforeInsert, BeforeUpdate, Column, Entity, JoinTable, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Proyecto } from '../../proyecto/entities/proyecto.entity';


@Entity('users')
export class User {
    
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('text', {
        unique: true
    })
    email: string;

    @Column('text', {
        select: false
    })
    password: string;

    @Column('text')
    nombre: string;

    @Column('bool', {
        default: true
    })
    isActive: boolean;

    @OneToMany(() => Proyecto, (proye) => proye.usuario)
    proyecto: Proyecto;

    @ManyToMany(() => Proyecto, (proye) => proye.user, {cascade:true})
    @JoinTable() 
    proyec: Proyecto[]; 

    // @Column('text', {
    //     array: true,
    //     default: ['user']
    // })
    // roles: string[];
    // @ManyToOne(
    //     () => Rol,
    //     ( rol ) => rol.user,
    //     { eager: true }
    // )
    // rol: Rol

    @BeforeInsert()
    checkFieldsBeforeInsert() {
        this.email = this.email.toLowerCase().trim();
    }

    @BeforeUpdate()
    checkFieldsBeforeUpdate() {
        this.checkFieldsBeforeInsert();   
    }

}
