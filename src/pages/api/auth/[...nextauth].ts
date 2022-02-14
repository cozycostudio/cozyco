import NextAuth from "next-auth";
import DiscordProvider from "next-auth/providers/discord";

export default NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
      authorization: { params: { scope: "identify" } },
      profile: (profile) => {
        let userAvatar = `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`;
        return {
          id: profile.id,
          name: profile.username,
          email: profile.id, // Workaround to get the discord user ID into the session
          image: userAvatar,
        };
      },
    }),
  ],

  session: {
    maxAge: 365 * 24 * 60 * 60,
  },

  callbacks: {
    async session({ session }) {
      if (session.user) {
        session.userId = session.user.email;
      }
      return Promise.resolve(session);
    },
    async jwt({ token, account, ...rest }) {
      if (account?.id) {
        token.userId = account.id;
      }
      return token;
    },
  },

  // Enable debug messages in the console if you are having problems
  debug: false,
});
