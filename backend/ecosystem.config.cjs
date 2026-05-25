// cspell:words rakhwala
module.exports = {
  apps: [
    {
      name: 'cyber-rakhwala-backend',
      script: 'server.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
