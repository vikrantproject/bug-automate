module.exports = {
  apps: [{
    name: 'scanner',
    script: './backend/server.js',
    instances: 4,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT_START: 3001
    },
    env_production: {
      NODE_ENV: 'production',
      PORT_START: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    max_memory_restart: '1G',
    restart_delay: 4000
  }]
}
