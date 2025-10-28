import nodemailer from 'nodemailer';

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
    }

    generatePasswordResetEmail(userName, resetLink) {
        return {
            subject: 'Recuperación de Contraseña - Tienda Online',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;">
                        <h1 style="color: #333; margin-bottom: 20px;">🔒 Recuperación de Contraseña</h1>
                        <p style="color: #666; font-size: 16px; margin-bottom: 20px;">
                            Hola <strong>${userName}</strong>,
                        </p>
                        <p style="color: #666; font-size: 16px; margin-bottom: 30px;">
                            Recibimos una solicitud para restablecer la contraseña de tu cuenta.
                        </p>
                        
                        <div style="background-color: white; padding: 25px; border-radius: 8px; margin-bottom: 30px;">
                            <p style="color: #333; font-size: 14px; margin-bottom: 20px;">
                                Haz clic en el siguiente botón para crear una nueva contraseña:
                            </p>
                            <a href="${resetLink}" 
                               style="display: inline-block; background-color: #007bff; color: white; padding: 12px 30px; 
                                      text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
                                Restablecer Contraseña
                            </a>
                        </div>

                        <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
                            <p style="color: #856404; font-size: 14px; margin: 0;">
                                ⚠️ <strong>Importante:</strong> Este enlace expirará en <strong>15 minutos</strong> por seguridad.
                            </p>
                        </div>

                        <div style="text-align: left; color: #666; font-size: 14px;">
                            <p><strong>Si no solicitaste este cambio:</strong></p>
                            <ul style="padding-left: 20px;">
                                <li>Ignora este email</li>
                                <li>Tu contraseña actual seguirá siendo válida</li>
                                <li>Considera cambiar tu contraseña por seguridad</li>
                            </ul>
                        </div>

                        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                        
                        <p style="color: #999; font-size: 12px;">
                            Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
                            <a href="${resetLink}" style="color: #007bff; word-break: break-all;">${resetLink}</a>
                        </p>
                        
                        <p style="color: #999; font-size: 12px; margin-top: 20px;">
                            Este email fue enviado desde una dirección de solo envío. No respondas a este mensaje.
                        </p>
                    </div>
                </div>
            `
        };
    }

    generatePasswordChangedEmail(userName) {
        return {
            subject: 'Contraseña Actualizada - Tienda Online',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background-color: #d4edda; padding: 30px; border-radius: 10px; text-align: center;">
                        <h1 style="color: #155724; margin-bottom: 20px;">✅ Contraseña Actualizada</h1>
                        <p style="color: #155724; font-size: 16px; margin-bottom: 20px;">
                            Hola <strong>${userName}</strong>,
                        </p>
                        <p style="color: #155724; font-size: 16px; margin-bottom: 30px;">
                            Tu contraseña ha sido actualizada exitosamente.
                        </p>
                        
                        <div style="background-color: white; padding: 25px; border-radius: 8px; margin-bottom: 30px;">
                            <p style="color: #333; font-size: 14px;">
                                <strong>Fecha del cambio:</strong> ${new Date().toLocaleString('es-ES')}
                            </p>
                        </div>

                        <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px;">
                            <p style="color: #721c24; font-size: 14px; margin: 0;">
                                <strong>¿No fuiste tú?</strong> Contacta inmediatamente a nuestro soporte.
                            </p>
                        </div>
                    </div>
                </div>
            `
        };
    }

    async sendPasswordResetEmail(email, userName, resetLink) {
        try {
            const emailContent = this.generatePasswordResetEmail(userName, resetLink);
            
            const mailOptions = {
                from: process.env.EMAIL_USER || 'pdps93m@gmail.com',
                to: email,
                subject: emailContent.subject,
                html: emailContent.html
            };

            const info = await this.transporter.sendMail(mailOptions);
            
            return {
                success: true,
                messageId: info.messageId
            };
        } catch (error) {
            console.error('Error al enviar email de recuperación:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async sendPasswordChangedEmail(email, userName) {
        try {
            const emailContent = this.generatePasswordChangedEmail(userName);
            
            const mailOptions = {
                from: process.env.EMAIL_USER || 'pdps93m@gmail.com',
                to: email,
                subject: emailContent.subject,
                html: emailContent.html
            };

            const info = await this.transporter.sendMail(mailOptions);
            
            return {
                success: true,
                messageId: info.messageId
            };
        } catch (error) {
            console.error('Error al enviar email de confirmación:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async sendEmail(to, subject, htmlContent) {
        try {
            const mailOptions = {
                from: process.env.EMAIL_USER || 'pdps93m@gmail.com',
                to: to,
                subject: subject,
                html: htmlContent
            };

            const info = await this.transporter.sendMail(mailOptions);
            
            return {
                success: true,
                messageId: info.messageId
            };
        } catch (error) {
            console.error('Error al enviar email:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

export default EmailService;