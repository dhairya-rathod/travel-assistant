import { Router } from 'express';

const router = Router();

const startTime = new Date();
// Health check configuration
const healthConfig = {
  serviceName: 'Travel Assistant AI Service',
  version: process.env.npm_package_version || '1.0.0',
  environment: process.env.NODE_ENV_AI || 'development',
};

// Basic health check endpoint
router.get('/', (req, res) => {
  const healthStatus = {
    status: 'UP',
    timestamp: new Date().toISOString(),
    service: healthConfig.serviceName,
    version: healthConfig.version,
    environment: healthConfig.environment,
    uptime: Math.floor(process.uptime()),
    uptimeFormatted: formatUptime(process.uptime()),
  };

  res.status(200).json(healthStatus);
});

// Utility function to format uptime
function formatUptime(seconds: number) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  return `${days}d ${hours}h ${minutes}m ${secs}s`;
}

export default router;
