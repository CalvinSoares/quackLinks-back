import nodemailer from "nodemailer";

interface MailOptions {
  to: string;
  subject: string;
  html: string;
}

async function createTransporter() {
  if (process.env.NODE_ENV === "development") {
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  } else {
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
        user: "resend",
        pass: process.env.RESEND_API_KEY,
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

async function sendEmail({ to, subject, html }: MailOptions) {
  const transporter = await createTransporter();

  const info = await transporter.sendMail({
    from: '"Seu App" <no-reply@seuapp.com>',
    to,
    subject,
    html,
  });

  if (process.env.NODE_ENV === "development") {
    console.log(
      "📬 E-mail de teste enviado! Visualize aqui: %s",
      nodemailer.getTestMessageUrl(info)
    );
  }
}

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
