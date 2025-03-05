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
  ],
};
