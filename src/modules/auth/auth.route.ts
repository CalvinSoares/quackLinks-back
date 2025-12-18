import { FastifyPluginAsync } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { AuthController } from "./auth.controller";
import { Strategy as LocalStrategy } from "passport-local";
import { registerUserSchema, verifyEmailSchema } from "./auth.schema";
import { Strategy as DiscordStrategy } from "passport-discord";
import { User as PrismaUser } from "@prisma/client";
import jwt from "jsonwebtoken";

import passport from "@fastify/passport";
import { Strategy as SpotifyStrategy } from "passport-spotify";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

const authRoutes: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  const server = fastify.withTypeProvider<ZodTypeProvider>();
  const authController = new AuthController(server.authService);
  const { prisma } = server;

  passport.use(
    "discord",
    new DiscordStrategy(
      {
        clientID: process.env.DISCORD_CLIENT_ID!,
        clientSecret: process.env.DISCORD_CLIENT_SECRET!,
        callbackURL: process.env.DISCORD_REDIRECT_URI!,
        scope: ["identify", "email"],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // A lógica de `handleDiscordCallback` agora vive aqui
          const user = await server.authService.findOrCreateDiscordUser(
            profile
          );
          return done(null, user); // Passa o usuário para o Passport, que chamará `req.logIn` por baixo dos panos
        } catch (error) {
          return done(error as Error);
        }
      }
    )
  );

  passport.use(
    "google",
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        callbackURL: process.env.GOOGLE_CALLBACK_URL!,
        scope: ["profile", "email"],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const profileWithToken = { ...profile, accessToken };

          const user = await server.authService.findOrCreateGoogleUser(
            profileWithToken
          );
          return done(null, user);
        } catch (error) {
          return done(error as Error);
        }
      }
    )
  );

  server.get("/discord", authController.discordLoginHandler);
  server.get(
    "/discord/callback",
    {
      preHandler: passport.authenticate("discord", {
        failureRedirect: `${process.env.FRONTEND_URL}/login?error=discord_login_failed`,
      }),
    },
    async (request, reply) => {
      if (!request.user) {
        return reply.code(401).send({ message: "Não autorizado." });
      }

      const user = request.user as PrismaUser;
      const payload = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      };
      const token = jwt.sign(
        payload,
        process.env.JWT_SECRET || "super-secret-key-change-this-in-production",
        { expiresIn: "7d" }
      );

      return reply.redirect(
        `${process.env.FRONTEND_URL}/auth/callback?token=${token}`
      );
    }
  );

  server.get(
    "/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
  );

  server.get(
    "/google/callback",
    {
      preHandler: passport.authenticate("google", {
        failureRedirect: `${process.env.FRONTEND_URL}/login?error=google_login_failed`,
      }),
    },
    async (request, reply) => {
      if (!request.user) {
        return reply.code(401).send({ message: "Não autorizado." });
      }

      const user = request.user as PrismaUser;

      const payload = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      };

      const token = jwt.sign(
        payload,
        process.env.JWT_SECRET || "super-secret-key-change-this-in-production",
        { expiresIn: "7d" }
      );

      return reply.redirect(
        `${process.env.FRONTEND_URL}/auth/callback?token=${token}`
      );
    }
  );

  passport.use(
    "local",
    new LocalStrategy(
      { usernameField: "email", passwordField: "password" },
      async (email, password, done) => {
        try {
          // A lógica de login que estava no controller agora vive aqui
          const user = await server.authService.login({ email, password });
          return done(null, user);
        } catch (error) {
          // Retorna o erro para o Passport, que o tratará como falha
          return done(error as Error);
        }
      }
    )
  );

  server.post(
    "/register",
    { schema: registerUserSchema },
    authController.registerHandler
  );

  server.post(
    "/login",
    {
      preHandler: passport.authenticate("local"), // Usa a estratégia local
    },
    authController.generateTokenHandler
  );

  server.post(
    "/verify-email",
    { schema: verifyEmailSchema },
    authController.verifyEmailHandler
  );

  if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
    throw new Error("Credenciais do Spotify não configuradas.");
  }

  const spotifyCallbackUrl =
    process.env.SPOTIFY_REDIRECT_URI ||
    "http://localhost:3000/api/v1/auth/spotify/callback";

  passport.use(
    "spotify",
    new SpotifyStrategy(
      {
        clientID: process.env.SPOTIFY_CLIENT_ID,
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
        callbackURL: spotifyCallbackUrl,
        scope: ["user-read-email", "user-top-read", "playlist-read-private"],
        passReqToCallback: true,
      },
      async (
        req: any,
        accessToken,
        refreshToken,
        _expires_in,
        profile,
        done
      ) => {
        try {
          const loggedInUser = req.user;
          if (!loggedInUser) {
            return done(
              new Error(
                "Você precisa estar logado para conectar sua conta do Spotify."
              )
            );
          }
          await prisma.account.upsert({
            where: {
              provider_providerAccountId: {
                provider: "spotify",
                providerAccountId: profile.id,
              },
            },
            update: { access_token: accessToken, refresh_token: refreshToken },
            create: {
              userId: loggedInUser.id,
              type: "oauth",
              provider: "spotify",
              providerAccountId: profile.id,
              access_token: accessToken,
              refresh_token: refreshToken,
            },
          });
          return done(null, loggedInUser);
        } catch (error) {
          return done(error as Error);
        }
      }
    )
  );

  server.get(
    "/spotify",
    {
      preHandler: async (request, reply) => {
        const { token } = request.query as { token?: string };

        if (!token) {
          if (request.isAuthenticated()) return;
          return reply
            .code(401)
            .send({ message: "Token JWT necessário na URL (?token=...)." });
        }

        try {
          const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET ||
              "super-secret-key-change-this-in-production"
          ) as { id: string };

          const user = await prisma.user.findUnique({
            where: { id: decoded.id },
          });

          if (!user) {
            return reply.code(401).send({ message: "Usuário inválido." });
          }

          await request.logIn(user);
        } catch (err) {
          return reply.code(401).send({ message: "Token inválido." });
        }
      },
    },
    passport.authenticate("spotify")
  );

  server.get(
    "/spotify/callback",
    {
      preHandler: passport.authenticate("spotify", {
        failureRedirect: `${process.env.FRONTEND_URL}/dashboard/appearance?spotify_error=true`,
      }),
    },
    (req, reply) => {
      reply.redirect(
        `${process.env.FRONTEND_URL}/dashboard/appearance?spotify_success=true`
      );
    }
  );
};

export default authRoutes;
