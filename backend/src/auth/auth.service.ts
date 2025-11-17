import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { RolEntity } from 'src/roles/entity/rol.entity';
import { UserEntity } from 'src/user/entity/user.entity';
import { UserRolesEntity } from 'src/user_rol/entity/user_rol.entity';
import { Repository } from 'typeorm';
import { LoginDto } from './dtos/login.dto';
import { compare } from 'bcrypt';
import { CreateFullUserDto } from './dtos/createFullUser.dto';
import * as bcrypt from 'bcrypt';
import { PeopleEntity } from 'src/people/entity/people.entity';
import { BusinessEntity } from 'src/business/entity/business.entity';
import { BusinessAccessibilityEntity } from 'src/business_accessibility/entity/business_accessibility.entity';
import { AccessibilityEntity } from 'src/accessibility/entity/accesibility.entity';
import { CreateFullBusinessDto } from './dtos/createFullBusiness.dto';
import { TokenDto } from './dtos/token.dto';
import { usuarioEmailResetPasswordDto } from './dtos/usuario-email-resetpassword.dto';
import { UpgradeToBusinessDto } from './dtos/upgradeToBusiness.dto';
import { MailsService } from 'src/mails/mails.service';
import { MoreThan } from 'typeorm';
import { ChangePasswordDto } from './dtos/change-password.dto';
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import { ConfigService } from '@nestjs/config';
import { GoogleAuthDto } from './dtos/google-auth.dto';
import { FindOneOptions } from 'typeorm';
import { MapsService } from 'src/maps/maps.service';
import { PayloadInterface } from './payload/payload.interface';

@Injectable()
export class AuthService {
  private readonly googleClient: OAuth2Client;

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,

    @InjectRepository(PeopleEntity)
    private readonly peopleRepository: Repository<PeopleEntity>,

    @InjectRepository(RolEntity)
    private readonly rolRepository: Repository<RolEntity>,

    @InjectRepository(UserRolesEntity)
    private readonly userRolesRepository: Repository<UserRolesEntity>,

    @InjectRepository(BusinessEntity)
    private readonly businessRepository: Repository<BusinessEntity>,

    @InjectRepository(BusinessAccessibilityEntity)
    private readonly businessAccessibilityRepository: Repository<BusinessAccessibilityEntity>,

    @InjectRepository(AccessibilityEntity)
    private readonly accessibilityRepository: Repository<AccessibilityEntity>,

    private readonly jwtService: JwtService,
    private readonly mailService: MailsService,
    private readonly configService: ConfigService,
    private readonly mapsService: MapsService,
  ) {
    this.googleClient = new OAuth2Client(
      this.configService.get<string>('GOOGLE_CLIENT_ID'),
    );
  }

  async registerFullUser(
    userData: CreateFullUserDto,
  ): Promise<{ message: string; token: string }> {
    try {
      const existingUser: UserEntity | null = await this.userRepository.findOne(
        {
          where: { user_email: userData.user_email },
        },
      );
      if (existingUser) {
        throw new BadRequestException(
          'El correo electrónico ya está registrado',
        );
      }

      // Generar un salt y hashear la contraseña
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.user_password, salt);

      const newUser: UserEntity = this.userRepository.create({
        user_email: userData.user_email,
        user_password: hashedPassword,
      });
      await this.userRepository.save(newUser);

      let rol: RolEntity | null;
      if (userData.rolIds && userData.rolIds.length > 0) {
        rol = await this.rolRepository.findOne({
          where: { rol_id: userData.rolIds[0] },
        });
      } else {
        rol = await this.rolRepository.findOne({ where: { rol_id: 2 } });
      }

      if (!rol) {
        throw new BadRequestException('Rol no encontrado');
      }

      // Crear la relación entre el usuario y el rol
      const userRole = this.userRolesRepository.create({
        user: newUser,
        rol: rol,
      });
      await this.userRolesRepository.save(userRole);

      // Crear la persona asociada a ese usuario
      const newPeople: PeopleEntity = this.peopleRepository.create({
        ...userData,
        user: newUser,
      });
      await this.peopleRepository.save(newPeople);

      // Crear el payload para el token JWT
      const payload: PayloadInterface = {
        user_id: newUser.user_id,
        user_email: newUser.user_email,
        firstName: newPeople.firstName,
        firstLastName: newPeople.firstLastName,
        cellphone: newPeople.cellphone,
        address: newPeople.address,
        rolIds: [rol.rol_id],

        business_id: null,
        business_name: null,
        business_address: null,
        NIT: null,
      };

      // Generar el token JWT
      const token = this.jwtService.sign(payload);

      return { message: 'Usuario registrados exitosamente', token };
    } catch (error) {
      // Manejo de errores seguro
      if (error instanceof HttpException) {
        throw error;
      }
      if (error instanceof Error) {
        throw new HttpException(
          error.message,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      throw new HttpException(
        'Un error inesperado ocurrió durante el registro',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async registerFullBusiness(
    businessData: CreateFullBusinessDto,
  ): Promise<{ message: string; token: string }> {
    try {
      // Verificar si el correo electrónico ya está registrado
      const existingUser: UserEntity | null = await this.userRepository.findOne(
        {
          where: { user_email: businessData.user_email },
        },
      );
      if (existingUser) {
        throw new BadRequestException(
          'El correo electrónico ya está registrado',
        );
      }

      // Verificar si el NIT ya está registrado
      const existingBusiness: BusinessEntity | null =
        await this.businessRepository.findOne({
          where: { NIT: businessData.NIT },
        });
      if (existingBusiness) {
        throw new BadRequestException('El NIT ya está registrado');
      }

      // Generar hash de contraseña
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(
        businessData.user_password,
        salt,
      );

      // Crear el nuevo usuario
      const newUser: UserEntity = this.userRepository.create({
        user_email: businessData.user_email,
        user_password: hashedPassword,
      });
      await this.userRepository.save(newUser);

      // Asignar múltiples roles: Usuario (2) + Propietario/Negocio (3)
      const rolesToAssign =
        businessData.rolIds && businessData.rolIds.length > 0
          ? businessData.rolIds
          : [2, 3]; // Por defecto: usuario + negocio

      for (const rolId of rolesToAssign) {
        const rol: RolEntity | null = await this.rolRepository.findOne({
          where: { rol_id: rolId },
        });

        if (!rol) {
          throw new BadRequestException(`Rol con ID ${rolId} no encontrado`);
        }

        // Crear la relación entre el usuario y el rol
        const userRole = this.userRolesRepository.create({
          user: newUser,
          rol: rol,
        });
        await this.userRolesRepository.save(userRole);
      }

      // Crear la persona asociada
      const newPeople: PeopleEntity = this.peopleRepository.create({
        firstName: businessData.firstName,
        firstLastName: businessData.firstLastName,
        cellphone: businessData.cellphone,
        address: businessData.address,
        gender: businessData.gender,
        user: newUser,
      });
      await this.peopleRepository.save(newPeople);

      //  Obtener coordenadas automáticamente usando MapsService
      const coordinates = await this.mapsService.getCoordinates(
        businessData.business_address,
      );

      let latitude: number | null = null;
      let longitude: number | null = null;

      if (coordinates) {
        latitude = coordinates.lat;
        longitude = coordinates.lon;
      }

      // Crear el negocio asociado con coordenadas automáticas
      const newBusiness: BusinessEntity = this.businessRepository.create({
        business_name: businessData.business_name,
        address: businessData.business_address,
        NIT: businessData.NIT,
        description: businessData.description,
        coordinates: businessData.coordinates,
        latitude: latitude,
        longitude: longitude,
        user: newUser,
      });

      const savedBusiness: BusinessEntity =
        await this.businessRepository.save(newBusiness);

      // Crear relaciones de accesibilidad
      if (
        businessData.accessibilityIds &&
        businessData.accessibilityIds.length > 0
      ) {
        for (const accessibilityId of businessData.accessibilityIds) {
          const accessibility: AccessibilityEntity | null =
            await this.accessibilityRepository.findOne({
              where: { accessibility_id: accessibilityId },
            });

          if (!accessibility) {
            throw new BadRequestException(
              `Accesibilidad con ID ${accessibilityId} no encontrada`,
            );
          }

          const businessAccessibility =
            this.businessAccessibilityRepository.create({
              business: savedBusiness,
              accessibility: accessibility,
            });

          await this.businessAccessibilityRepository.save(
            businessAccessibility,
          );
        }
      }

      // Obtener todos los roles asignados para el payload
      const userRoles: UserRolesEntity[] = await this.userRolesRepository.find({
        where: { user: { user_id: newUser.user_id } },
        relations: ['rol'],
      });

      const rolIds = userRoles.map((ur) => ur.rol.rol_id);

      // Crear payload para el token JWT
      const payload: PayloadInterface = {
        user_id: newUser.user_id,
        user_email: newUser.user_email,
        firstName: newPeople.firstName,
        firstLastName: newPeople.firstLastName,
        cellphone: newPeople.cellphone,
        address: newPeople.address,
        business_id: savedBusiness.business_id,
        business_name: savedBusiness.business_name,
        business_address: savedBusiness.address,
        NIT: savedBusiness.NIT,
        rolIds: rolIds,
        accessibilityIds: businessData.accessibilityIds || [],
      };

      // Generar el token JWT
      const token = this.jwtService.sign(payload);

      return {
        message: 'Negocio registrado exitosamente',
        token,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      if (error instanceof Error) {
        throw new HttpException(
          error.message,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      throw new HttpException(
        'Un error inesperado ocurrió durante el registro del negocio',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async login(dto: LoginDto): Promise<{ message: string; token: string }> {
    try {
      const { user_email, user_password } = dto;

      const user: UserEntity | null = await this.userRepository.findOne({
        where: { user_email },
        relations: ['people', 'userroles', 'userroles.rol', 'business'],
      });

      // Esta comprobación ahora también funciona como type guard
      if (!user) {
        throw new UnauthorizedException(
          'Usuario no registrado, verifique su correo u contraseña',
        );
      }

      const passwordOK = await compare(user_password, user.user_password);
      if (!passwordOK) {
        throw new UnauthorizedException('Contraseña incorrecta');
      }

      if (!user.userroles || user.userroles.length === 0) {
        throw new UnauthorizedException('El usuario no tiene roles asignados');
      }

      const rolIds = user.userroles.map((ur) => ur.rol.rol_id);

      const payload: PayloadInterface = {
        user_id: user.user_id,
        user_email: user.user_email,
        firstName: user.people?.firstName || null,
        firstLastName: user.people?.firstLastName || null,
        cellphone: user.people?.cellphone || null,
        address: user.people?.address || null,
        rolIds: rolIds,

        business_id: user.business?.business_id || null,
        business_name: user.business?.business_name || null,
        business_address: user.business?.address || null,
        NIT: user.business?.NIT || null,
      };

      const token = this.jwtService.sign(payload);

      return { message: 'Usuario logueado exitosamente', token };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      if (error instanceof Error) {
        throw new HttpException(
          error.message,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      throw new HttpException(
        'Un error inesperado ocurrió durante el login',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async upgradeToBusiness(
    userId: number,
    businessData: UpgradeToBusinessDto,
  ): Promise<{ message: string; token: string }> {
    try {
      // Verificar que el usuario existe
      const user: UserEntity | null = await this.userRepository.findOne({
        where: { user_id: userId },
        relations: ['people', 'business', 'userroles', 'userroles.rol'],
      });

      if (!user) {
        throw new BadRequestException('Usuario no encontrado');
      }

      if (user.business) {
        throw new BadRequestException(
          'El usuario ya tiene un negocio registrado',
        );
      }

      // Verificar si el NIT ya está registrado
      const existingBusiness: BusinessEntity | null =
        await this.businessRepository.findOne({
          where: { NIT: businessData.NIT },
        });

      if (existingBusiness) {
        throw new BadRequestException('El NIT ya está registrado');
      }

      // Verificar y agregar rol de negocio
      const hasBusinessRole = user.userroles.some((ur) => ur.rol.rol_id === 3);
      if (!hasBusinessRole) {
        const businessRole: RolEntity | null = await this.rolRepository.findOne(
          {
            where: { rol_id: 3 },
          },
        );

        if (!businessRole) {
          throw new BadRequestException('Rol de negocio no encontrado');
        }

        const userRole = this.userRolesRepository.create({
          user: user,
          rol: businessRole,
        });
        await this.userRolesRepository.save(userRole);
      }

      const coordinates = await this.mapsService.getCoordinates(
        businessData.business_address,
      );

      let latitude: number | null = null;
      let longitude: number | null = null;

      if (coordinates) {
        latitude = coordinates.lat;
        longitude = coordinates.lon;
      }

      // Crear el negocio
      const newBusiness: BusinessEntity = this.businessRepository.create({
        business_name: businessData.business_name,
        address: businessData.business_address,
        NIT: businessData.NIT,
        description: businessData.description,
        coordinates: businessData.coordinates,
        latitude: latitude,
        longitude: longitude,
        user: user,
      });

      await this.businessRepository.save(newBusiness);

      // Crear relaciones de accesibilidad
      if (
        businessData.accessibilityIds &&
        businessData.accessibilityIds.length > 0
      ) {
        for (const accessibilityId of businessData.accessibilityIds) {
          const accessibility: AccessibilityEntity | null =
            await this.accessibilityRepository.findOne({
              where: { accessibility_id: accessibilityId },
            });

          if (accessibility) {
            const businessAccessibility =
              this.businessAccessibilityRepository.create({
                business: newBusiness,
                accessibility: accessibility,
              });
            await this.businessAccessibilityRepository.save(
              businessAccessibility,
            );
          }
        }
      }

      // Obtener usuario actualizado con todos los roles
      const updatedUser: UserEntity | null = await this.userRepository.findOne({
        where: { user_id: userId },
        relations: ['people', 'userroles', 'userroles.rol', 'business'],
      });

      if (!updatedUser) {
        throw new BadRequestException('Error al actualizar el usuario');
      }
      if (!updatedUser.people) {
        throw new BadRequestException('Datos de persona no encontrados');
      }

      const rolIds = updatedUser.userroles.map((ur) => ur.rol.rol_id);

      // Generar nuevo token con la información actualizada
      const payload: PayloadInterface = {
        user_id: updatedUser.user_id,
        user_email: updatedUser.user_email,
        firstName: updatedUser.people.firstName,
        firstLastName: updatedUser.people.firstLastName,
        cellphone: updatedUser.people.cellphone,
        address: updatedUser.people.address,
        business_id: newBusiness.business_id,
        business_name: newBusiness.business_name,
        business_address: newBusiness.address,
        NIT: newBusiness.NIT,
        rolIds: rolIds,
        accessibilityIds: businessData.accessibilityIds || [],
      };

      const token = this.jwtService.sign(payload);

      return {
        message: 'Negocio registrado exitosamente',
        token,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      if (error instanceof Error) {
        throw new HttpException(
          error.message,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      throw new HttpException(
        'Un error inesperado ocurrió al actualizar a negocio',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  //Metodo refrescarToken
  refreshToken(payload: PayloadInterface): string { 
    try {
      const newPayload: PayloadInterface = {
        user_id: payload.user_id,
        user_email: payload.user_email,
        firstName: payload.firstName,
        firstLastName: payload.firstLastName,
        cellphone: payload.cellphone,
        address: payload.address,
        rolIds: payload.rolIds,
        business_id: payload.business_id,
        business_name: payload.business_name,
        business_address: payload.business_address || null,
        NIT: payload.NIT || null,
      };

      const token = this.jwtService.sign(newPayload);

      return token;
      
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      if (error instanceof Error) {
        throw new HttpException(
          error.message,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      throw new HttpException(
        'Un error inesperado ocurrió al refrescar el token',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  //Generar Codigo de restablecimiento de contraseña
  generarcodigoResetPassword(): string {
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    return codigo;
  }

  //Solicitar restablecimiento de contraseña
  async solicitarRestablecimientoPassword(
    userdto: usuarioEmailResetPasswordDto,
  ): Promise<{ message: string }> {
    //extraer el correo electrónico del DTO
    const { user_email } = userdto;

    try {
      const user: UserEntity | null = await this.userRepository.findOne({
        where: { user_email },
        relations: ['people'],
      });

      if (!user) {
        throw new UnauthorizedException(
          'El correo electrónico no está registrado',
        );
      }

      // Generar un código de restablecimiento de contraseña
      const resetPasswordCode = this.generarcodigoResetPassword();
      user.resetpassword_token = resetPasswordCode;
      user.resetpassword_token_expiration = new Date(
        Date.now() + 10 * 60 * 1000,
      ); // 10 minutos

      await this.userRepository.save(user);

      // Construir objeto Usuario para el mail
      const usuarioMail = {
        user_email: user.user_email,
        firstName: user.people?.firstName || '',
      };

      //enviar correo electrónico al usuario con el código de restablecimiento
      await this.mailService.sendUserrequestPassword(
        usuarioMail,
        resetPasswordCode,
      );

      setTimeout(
        () => {
          (async () => {
            try {
              const userToUpdate: UserEntity | null =
                await this.userRepository.findOne({
                  where: { user_id: user.user_id },
                });

              // Solo limpiamos el token si sigue siendo el mismo
              if (
                userToUpdate &&
                userToUpdate.resetpassword_token === resetPasswordCode
              ) {
                userToUpdate.resetpassword_token = null;
                userToUpdate.resetpassword_token_expiration = null;
                await this.userRepository.save(userToUpdate);
              }
            } catch (err) {
              // Si esto falla, solo lo logueamos
              console.error('Error al limpiar el token de reseteo:', err);
            }
          })();
        },
        10 * 60 * 1000,
      ); // 10 minutos

      return {
        message:
          'Su solicitud se completó correctamente. Revise su correo electrónico.',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      if (error instanceof Error) {
        throw new HttpException(
          error.message,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      throw new HttpException(
        'Error en la solicitud',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  async verificarCodigoRestablecimiento(
    codigo: string,
  ): Promise<{ isValid: boolean; message: string; user_email?: string }> {
    try {
      const user: UserEntity | null = await this.userRepository.findOne({
        where: {
          resetpassword_token: codigo,
          resetpassword_token_expiration: MoreThan(new Date()),
        },
        relations: ['people'],
      });

      if (!user) {
        return {
          isValid: false,
          message: 'Código inválido o expirado',
        };
      }

      return {
        isValid: true,
        message: 'Código válido',
        user_email: user.user_email,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      if (error instanceof Error) {
        throw new HttpException(
          error.message,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      throw new HttpException(
        'Error verificando el código',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Restablecer contraseña
  async restablecerPassword(
    codigo: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    try {
      const user: UserEntity | null = await this.userRepository.findOne({
        where: {
          resetpassword_token: codigo,
          resetpassword_token_expiration: MoreThan(new Date()),
        },
      });

      // Esta comprobación funciona como un type guard
      if (!user) {
        throw new BadRequestException('Código inválido o expirado');
      }

      if (newPassword.length < 6) {
        throw new BadRequestException(
          'La contraseña debe tener al menos 6 caracteres',
        );
      }

      // Hash de la nueva contraseña
      const salt = await bcrypt.genSalt(10);

      user.user_password = await bcrypt.hash(newPassword, salt);

      // Limpiar el código de restablecimiento
      user.resetpassword_token = null;
      user.resetpassword_token_expiration = null;

      await this.userRepository.save(user);

      return { message: 'Contraseña restablecida exitosamente' };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      if (error instanceof Error) {
        throw new HttpException(
          error.message,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      throw new HttpException(
        'Error restableciendo la contraseña',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  //Cambio de contraseña con usuario Logueado
  async changePassword(
    user_id: number,
    changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    try {
      const user: UserEntity | null = await this.userRepository.findOne({
        where: { user_id },
      });

      if (!user) {
        throw new NotFoundException('Usuario no encontrado');
      }

      // Verificar contraseña actual
      const isCurrentPasswordValid = await bcrypt.compare(
        changePasswordDto.currentPassword,
        user.user_password,
      );
      if (!isCurrentPasswordValid) {
        throw new BadRequestException('La contraseña actual es incorrecta');
      }

      // Verificar que la nueva contraseña sea diferente
      const isSamePassword = await bcrypt.compare(
        changePasswordDto.newPassword,
        user.user_password,
      );
      if (isSamePassword) {
        throw new BadRequestException(
          'La nueva contraseña debe ser diferente a la actual',
        );
      }

      // Hash de la nueva contraseña
      const salt = await bcrypt.genSalt(10);
      user.user_password = await bcrypt.hash(
        changePasswordDto.newPassword,
        salt,
      );

      await this.userRepository.save(user);

      return { message: 'Contraseña cambiada exitosamente' };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      // Maneja errores genéricos de forma segura
      if (error instanceof Error) {
        throw new InternalServerErrorException(
          `Error al cambiar la contraseña: ${error.message}`,
        );
      }
      throw new InternalServerErrorException('Error al cambiar la contraseña');
    }
  }

  /**
   * Devuelve el estado post-login para mostrar advertencias en el frontend
   * - Si el usuario tiene negocio asociado: verifica logo_url y coordinates
   * - Si no tiene negocio: sugiere completar registro de negocio
   */
  async getPostLoginStatus(userId: number): Promise<{
    hasBusiness: boolean;
    businessId: number | null;
    missing: { logo: boolean; location: boolean };
    warnings: string[];
  }> {
    try {
      const warnings: string[] = [];
      const options: FindOneOptions<BusinessEntity> = {
        where: { user: { user_id: userId } },
      };

      const business: BusinessEntity | null =
        await this.businessRepository.findOne(options);

      if (!business) {
        warnings.push(
          'Completa el registro de negocio y sube la imagen del local.',
        );
        return {
          hasBusiness: false,
          businessId: null,
          missing: { logo: true, location: true },
          warnings,
        };
      }

      const missingLogo =
        !business.logo_url || business.logo_url.trim().length === 0;
      const missingLocation =
        !business.coordinates || business.coordinates.trim().length === 0;

      if (missingLogo)
        warnings.push('Te falta subir la imagen (logo/fachada) del local.');
      if (missingLocation)
        warnings.push('Te falta establecer la ubicación exacta del local.');

      return {
        hasBusiness: true,
        businessId: business.business_id,
        missing: { logo: missingLogo, location: missingLocation },
        warnings,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      if (error instanceof Error) {
        throw new HttpException(
          error.message,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      throw new HttpException(
        'Error obteniendo el estado post-login',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async googleLoginClient(
    googleAuthDto: GoogleAuthDto,
  ): Promise<{ message: string; token: string }> {
    const { idToken } = googleAuthDto;

    if (!idToken) {
      throw new BadRequestException('Google ID Token no proporcionado');
    }

    try {
      // Verificar el ID token con Google
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: this.configService.get<string>('GOOGLE_CLIENT_ID'),
      });

      const payload: TokenPayload | undefined = ticket.getPayload();

      if (!payload) {
        throw new UnauthorizedException('Token de Google inválido');
      }

      interface GoogleUserPayload {
        email: string | null | undefined;
        firstName: string | null | undefined;
        lastName: string | null | undefined;
        picture: string | null | undefined;
      }

      const googleUser: GoogleUserPayload = {
        email: payload.email,
        firstName: payload.given_name,
        lastName: payload.family_name,
        picture: payload.picture,
      };

      if (!googleUser.email) {
        throw new BadRequestException(
          'No se pudo obtener el email de Google. Asegúrate de que el scope "email" esté solicitado.',
        );
      }

      // Pasamos el objeto tipado a la siguiente función
      return this.googleLogin(googleUser);
    } catch (error) {
      console.error('Error verifying Google ID token:', error);

      if (error instanceof HttpException) {
        throw error;
      }

      if (error instanceof Error) {
        throw new UnauthorizedException(
          'Error al validar el token de Google: ' + error.message,
        );
      }

      throw new UnauthorizedException(
        'Error desconocido al validar el token de Google',
      );
    }
  }

  async googleLogin(googleUser: {
    email: string | null | undefined;
    firstName: string | null | undefined;
    lastName: string | null | undefined;
    picture: string | null | undefined;
  }): Promise<{ message: string; token: string }> {
    try {
      const { email } = googleUser;

      if (!email) {
        throw new BadRequestException(
          'El perfil de Google no incluye un correo electrónico.',
        );
      }

      const user: UserEntity | null = await this.userRepository.findOne({
        where: { user_email: email },
        relations: ['people', 'userroles', 'userroles.rol', 'business'],
      });

      if (!user) {
        throw new UnauthorizedException(
          'Usuario no registrado. Por favor, regístrese primero con correo y contraseña antes de usar Google.',
        );
      }

      if (!user.people) {
        throw new InternalServerErrorException(
          'Datos de persona no encontrados para este usuario. Contacte a soporte.',
        );
      }

      const rolIds =
        user.userroles && user.userroles.length > 0
          ? user.userroles.map((ur) => ur.rol.rol_id)
          : [2]; // Rol de usuario por defecto

      const payload: PayloadInterface = {
        user_id: user.user_id,
        user_email: user.user_email,
        firstName: user.people.firstName,
        firstLastName: user.people.firstLastName,
        cellphone: user.people.cellphone,
        address: user.people.address,
        rolIds: rolIds,
        business_id: user.business?.business_id || null,
        business_name: user.business?.business_name || null,
        business_address: user.business?.address || null,
        NIT: user.business?.NIT || null,
      };

      const token = this.jwtService.sign(payload);

      return {
        message: 'Login con Google exitoso',
        token,
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof InternalServerErrorException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }

      console.error('Error en googleLogin:', error);

      if (error instanceof Error) {
        throw new InternalServerErrorException(
          'Error en login con Google: ' + error.message,
        );
      }

      throw new InternalServerErrorException('Error en login con Google');
    }
  }

  async getProfile(userId: number): Promise<{
    user_id: number;
    displayName: string;
    roleDescription: string;
    email: string;
    rolIds: number[];
    avatar: string | null;
    logo_url?: string | null;
    verified?: boolean;
  }> {
    try {
      const user: UserEntity | null = await this.userRepository.findOne({
        where: { user_id: userId },
        relations: ['people', 'business', 'userroles', 'userroles.rol'],
      });

      if (!user) {
        throw new NotFoundException('Usuario no encontrado');
      }

      const rolIds =
        user.userroles?.map((userRole) => userRole.rol.rol_id) || [];

      let displayName: string;
      let roleDescription: string;
      let logo_url: string | null = null;
      let verified: boolean = false;

      if (rolIds.includes(3) && user.business?.business_name) {
        // Propietario de negocio
        displayName = user.business.business_name;
        roleDescription = 'Propietario';
        logo_url = user.business.logo_url || null;
        verified = user.business.verified || false;
      } else if (user.people) {
        // Usuario normal
        displayName =
          `${user.people.firstName} ${user.people.firstLastName}`.trim();
        roleDescription = this.getRoleDescription(rolIds);
      } else {
        displayName = 'Usuario';
        roleDescription = this.getRoleDescription(rolIds);
      }

      // Continúa con el resto del código...

      return {
        user_id: user.user_id,
        displayName,
        roleDescription,
        email: user.user_email,
        rolIds,
        avatar: user.people?.avatar || null,
        logo_url,
        verified,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      console.error('Error getting profile:', error);

      if (error instanceof Error) {
        throw new InternalServerErrorException(
          'Error al obtener el perfil: ' + error.message,
        );
      }

      throw new InternalServerErrorException('Error al obtener el perfil');
    }
  }

  private getRoleDescription(rolIds: number[]): string {
    if (rolIds.includes(1)) return 'Administrador';
    if (rolIds.includes(3)) return 'Propietario';
    if (rolIds.includes(2)) return 'Usuario';
    return 'Usuario';
  }
}
