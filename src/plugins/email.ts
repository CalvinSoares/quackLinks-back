// src/lib/email.ts

import nodemailer from "nodemailer";

interface MailOptions {
  to: string;
  subject: string;
  html: string;
}

// Função para criar o "transporter" (o objeto que envia o e-mail)
async function createTransporter() {
  // Se estivermos em desenvolvimento, usamos o Ethereal
  if (process.env.NODE_ENV === "development") {
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: testAccount.user, // generated ethereal user
        pass: testAccount.pass, // generated ethereal password
      },
    });
  }
  // Se estivermos em produção, usamos um serviço real (ex: Resend, SendGrid)
  else {
    if (!process.env.RESEND_API_KEY) {
      throw new Error(
        "Chave de API de produção (RESEND_API_KEY) não está definida no ambiente."
      );
    }
    return nodemailer.createTransport({
      host: "smtp.resend.com",
      secure: true,
      port: 465,
      auth: {
        user: "resend", // Sempre 'resend'
        pass: process.env.RESEND_API_KEY, // Sua API Key do Resend
      },
    });

    /*
    // Exemplo para SendGrid:
    return nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      auth: {
        user: 'apikey', // Sempre 'apikey'
        pass: process.env.SENDGRID_API_KEY, // Sua API Key do SendGrid
      }
    });
    */
  }
}

// Função principal para enviar um e-mail genérico
async function sendEmail({ to, subject, html }: MailOptions) {
  const transporter = await createTransporter();

  const info = await transporter.sendMail({
    from: '"Seu App" <no-reply@seuapp.com>', // TODO: Use um e-mail do seu domínio verificado em produção
    to,
    subject,
    html,
  });

  // Se estivermos em desenvolvimento, logamos o link de visualização do Ethereal
  if (process.env.NODE_ENV === "development") {
    console.log(
      "📬 E-mail de teste enviado! Visualize aqui: %s",
      nodemailer.getTestMessageUrl(info)
    );
  }
}

// Função específica para o e-mail de verificação, que usa a função genérica
export async function sendVerificationEmail(email: string, token: string) {
  const subject = "Verifique seu endereço de e-mail";
  const html = `
    <div style="font-family: sans-serif; text-align: center;">
      <h2>Olá!</h2>
      <p>Obrigado por se registrar. Por favor, use o código abaixo para ativar sua conta:</p>
      <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px; background-color: #f0f0f0; padding: 10px; border-radius: 5px;">
        ${token}
      </p>
      <p>Este código expira em 15 minutos.</p>
    </div>
  `;

  await sendEmail({ to: email, subject, html });
}
