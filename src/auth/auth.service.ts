import { BadRequestException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import * as bcrypt from 'bcrypt';

import { User } from './entities/auth.entity';
import { CreateUserDto } from './dto/create-auth.dto';
import { LoginUserDto } from './dto/login.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';



@Injectable()
export class AuthService {

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

   

    private readonly jwtService: JwtService,
  ) {}


  async create( createUserDto: CreateUserDto) {
    
    try {

      const { password,  ...userData } = createUserDto;
      
      // const rol = await this.rolRepository.findOne({ where: { id: rolId } });
      // if (!rol) {
      //   throw new Error('El rol especificado no existe');
      // }

      const user = this.userRepository.create({
        ...userData,
        password: bcrypt.hashSync( password, 10 ),
        //rol,
      });

      

      await this.userRepository.save( user )
      delete user[password]
      // delete user[rolId]

      return {
        ...user,
        token: this.getJwtToken({ id: user.id, nombre: user.nombre })
      };
      // TODO: Retornar el JWT de acceso

    } catch (error) {
      this.handleDBErrors(error);
    }

  }

  

  async login( loginUserDto: LoginUserDto ) {

    const { password, email } = loginUserDto;

    const user = await this.userRepository.findOne({
      where: { email },
      select: { email: true, password: true, id: true, nombre: true } //! OJO!
    });

    if ( !user ) 
      throw new UnauthorizedException('Credentials are not valid (email)');
      
    if ( !bcrypt.compareSync( password, user.password ) )
      throw new UnauthorizedException('Credentials are not valid (password)');
    console.log(user)
    return {
      ...user,
      token: this.getJwtToken({ id: user.id, nombre: user.nombre })
    };
  }

  async checkAuthStatus( user: User ){

    return {
      ...user,
      token: this.getJwtToken({ id: user.id, nombre: user.nombre })
    };

  }


  
  private getJwtToken( payload: JwtPayload ) {

    const token = this.jwtService.sign( payload );
    return token;

  }

  private handleDBErrors( error: any ): never {


    if ( error.code === '23505' ) 
      throw new BadRequestException( error.detail );

    console.log(error)

    throw new InternalServerErrorException('Please check server logs');

  }


}
