import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { Usuario } from 'src/interfaces/user';


@Injectable()
export class MailsService {

    constructor(
        private readonly mailerService: MailerService,
    ) { }

    async sendUserrequestPassword(user: Usuario, resetPasswordCode: string){
        await this.mailerService.sendMail({
            to: user.user_email,
            subject: 'Solicitud - Restablecimiento de contraseña',
            template: 'reset-password', 
            context: {
                name: user.firstName, 
                resetPasswordCode: resetPasswordCode, 
            },
            
        });
    
}
}