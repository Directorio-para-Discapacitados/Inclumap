import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { Usuario } from 'src/interfaces/user';
import { join } from 'path';

@Injectable()
export class MailsService {
  constructor(private readonly mailerService: MailerService) {}

  async sendUserrequestPassword(user: Usuario, resetPasswordCode: string) {
    const logoPath = join(
      __dirname,
      'templates',
      'assets',
      'logo-inclumap.png',
    );

    await this.mailerService.sendMail({
      to: user.user_email,
      subject: 'Solicitud - Restablecimiento de contraseña',
      template: 'reset-password',
      context: {
        name: user.firstName,
        resetPasswordCode: resetPasswordCode,
      },

      attachments: [
        {
          filename: 'logo-inclumap.png',
          path: logoPath,
          cid: 'logo-inclumap',
        },
      ],
    });
  }
}
