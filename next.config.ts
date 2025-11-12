import type { NextConfig } from "next";

/**** your existing config ****/
const nextConfig: NextConfig = {
  // ...other config
  images: {
    domains: [
      "media.bunnings.com.au",
      "public.bowens.com.au",
      "ubgeneralstore.com.au",
      "www.bunnings.com.au",
      // add more domains as needed
    ],
  },
};

export default nextConfig;
