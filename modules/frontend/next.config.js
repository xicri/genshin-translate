let backendBaseURL;

if (process.env.NODE_ENV === "production") {
  backendBaseURL = "https://translate-backend.genshin-dictionary.com";
} else if (process.env.NODE_ENV === "preview") {
  backendBaseURL = "https://translate-backend-preview.genshin-dictionary.com";
} else if (process.env.NODE_ENV === "development") {
  backendBaseURL = "http://127.0.0.1:8787";
} else {
  throw new Error(`Unexpected NODE_ENV: ${process.env.NODE_ENV}`);
}

const nextConfig = {
  reactStrictMode: true,
  env: {
    backendBaseURL,
  },
};

module.exports = nextConfig;
