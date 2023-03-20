// @ts-check
/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation.
 * This is especially useful for Docker builds.
 */
!process.env.SKIP_ENV_VALIDATION && (await import("./src/env/server.mjs"));

/** @type {import("next").NextConfig} */
const config = {
  reactStrictMode: true,
  swcMinify: false,
  i18n: {
    locales: ["en"],
    defaultLocale: "en",
  },
  webpack:(config)=>{
    config.optimization.minimizer = []
    config.optimization.minimize = false
    return config
  }
};
export default config;
