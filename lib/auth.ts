import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './prisma';
import type { NextAuthOptions } from 'next-auth';
import EmailProvider from 'next-auth/providers/email';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'database' },
  providers: [
    EmailProvider({
      from: process.env.EMAIL_FROM,
      async sendVerificationRequest({ identifier, url }) {
        await resend.emails.send({
          from: process.env.EMAIL_FROM!,
          to: identifier,
          subject: 'Tu enlace de acceso a openSwiss',
          html: `
            <div style="font-family:system-ui,Segoe UI,Arial">
              <h2>Acceso a openSwiss</h2>
              <p>Haz clic para entrar:</p>
              <p><a href="${url}" style="background:#111;color:#fff;padding:10px 14px;border-radius:8px;text-decoration:none">Entrar</a></p>
              <p>Si no solicitaste este acceso, ignora este email.</p>
            </div>
          `,
        });
      },
    }),
  ],
  pages: { signIn: '/signin' },
  secret: process.env.NEXTAUTH_SECRET,
};
