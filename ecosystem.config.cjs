module.exports = {
  apps: [{
    name: "crm-server",
    script: "server.js",
    env: {
      NODE_ENV: "production",
    },
    instances: "max",          // Use all available CPUs
    exec_mode: "cluster",      // Run in cluster mode for load balancing
    watch: false,              // Don't watch for file changes
    max_memory_restart: "500M" // Restart if memory usage exceeds 500M
  }]
};
