import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    
    const requiredRoles = this.reflector.getAllAndOverride<number[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);



    if (!requiredRoles) {

      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;


    // Verificar que el usuario esté autenticado
    if (!user) {
      throw new ForbiddenException('Usuario no autenticado');
    }

    const userRoles = user.rolIds || [];


    // Verificar si el usuario tiene al menos uno de los roles requeridos
    const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));


    if (!hasRequiredRole) {
  
      throw new ForbiddenException(
        `No tienes permisos para acceder a esta ruta. Roles requeridos: ${requiredRoles.join(', ')}`
      );
    }
    return true;
  }
}