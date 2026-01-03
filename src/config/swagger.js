import swaggerJsdoc from 'swagger-jsdoc';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Cab Management Portal API',
      version: '1.0.0',
      description: 'API documentation for Inter-city Cab Management Portal',
      contact: {
        name: 'API Support'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server',
        url: 'https://cab-management-portal-qedf.onrender.com',
        description: 'Production server'

      }
    ],
    components: {
      schemas: {
        Cab: {
          type: 'object',
          properties: {
            _id: {
              type: 'string'
            },
            cabId: {
              type: 'string'
            },
            state: {
              type: 'string',
              enum: ['IDLE', 'ON_TRIP']
            },
            cityId: {
              type: 'string'
            },
            lastIdleTime: {
              type: 'string',
              format: 'date-time'
            },
            totalIdleTime: {
              type: 'number'
            }
          }
        },
        City: {
          type: 'object',
          properties: {
            _id: {
              type: 'string'
            },
            name: {
              type: 'string'
            },
            code: {
              type: 'string'
            }
          }
        },
        Trip: {
          type: 'object',
          properties: {
            _id: {
              type: 'string'
            },
            cabId: {
              type: 'string'
            },
            cityId: {
              type: 'string'
            },
            startTime: {
              type: 'string',
              format: 'date-time'
            },
            endTime: {
              type: 'string',
              format: 'date-time'
            },
            status: {
              type: 'string',
              enum: ['ACTIVE', 'COMPLETED']
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string'
            }
          }
        }
      }
    }
  },
  apis: [join(__dirname, '../routes/*.js')]
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
