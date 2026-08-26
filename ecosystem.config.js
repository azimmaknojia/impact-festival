module.exports = {
  apps: [
    {
      name: "impact-festival-api",
      cwd: __dirname,
      script: "server/index.js",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "128M",
      env_production: {
        NODE_ENV: "production",
        PORT: 3002,
      },
    },
  ],
};
