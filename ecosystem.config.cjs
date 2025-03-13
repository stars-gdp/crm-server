module.exports = {
  apps: [
    {
      name: "crm-server",
      script: "build/server.js",
      env: {
        NODE_ENV: "production",
      },
      instances: "max",
      exec_mode: "cluster",
      watch: false,
      max_memory_restart: "500M",
    },
    {
      name: "crm-cron",
      script: "build/cron/runner.js",
      env: {
        NODE_ENV: "production",
      },
      instances: 1,
      exec_mode: "fork",
      watch: false,
      max_memory_restart: "200M",
      autorestart: true,
    },
  ],
};
