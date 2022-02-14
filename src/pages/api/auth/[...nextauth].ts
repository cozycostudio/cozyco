import NextAuth from "next-auth";
import DiscordProvider from "next-auth/providers/discord";

export default NextAuth({
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 365 * 24 * 60 * 60,
  },

  callbacks: {
    async session({ session, user }) {
      session.userId = user.userId;
      return Promise.resolve(session);
    },
    async jwt({ token, account }) {
      if (account?.id) {
        token.userId = account.id;
      }
      return token;
    },
  },

  // Enable debug messages in the console if you are having problems
  debug: false,
});
