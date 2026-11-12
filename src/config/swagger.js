import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API RESTful avec Node.js et Express',
      version: '1.0.0',
      description: 'Documentation complète de l\'API RESTful avec authentification JWT',
      contact: {
        name: 'Support API',
        email: 'support@example.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3010',
        description: 'Serveur de développement'
      },
      {
        url: 'https://api.example.com',
        description: 'Serveur de production'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Entrez le token JWT reçu lors de la connexion ou de l\'inscription'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Identifiant unique de l\'utilisateur'
            },
            username: {
              type: 'string',
              description: 'Nom d\'utilisateur'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Adresse email de l\'utilisateur'
            },
            role: {
              type: 'string',
              enum: ['user', 'admin'],
              description: 'Rôle de l\'utilisateur'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Date de création du compte'
            }
          }
        },
        RegisterRequest: {
          type: 'object',
          required: ['username', 'email', 'password'],
          properties: {
            username: {
              type: 'string',
              minLength: 3,
              description: 'Nom d\'utilisateur (minimum 3 caractères)'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Adresse email valide'
            },
            password: {
              type: 'string',
              minLength: 8,
              description: 'Mot de passe (minimum 8 caractères)'
            }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'Adresse email'
            },
            password: {
              type: 'string',
              description: 'Mot de passe'
            }
          }
        },
        UpdateProfileRequest: {
          type: 'object',
          properties: {
            username: {
              type: 'string',
              minLength: 3,
              description: 'Nouveau nom d\'utilisateur'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Nouvelle adresse email'
            }
          }
        },
        ChangePasswordRequest: {
          type: 'object',
          required: ['currentPassword', 'newPassword'],
          properties: {
            currentPassword: {
              type: 'string',
              description: 'Mot de passe actuel'
            },
            newPassword: {
              type: 'string',
              minLength: 8,
              description: 'Nouveau mot de passe (minimum 8 caractères, différent de l\'actuel)'
            }
          }
        },
        AuthResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            data: {
              type: 'object',
              properties: {
                user: {
                  $ref: '#/components/schemas/User'
                },
                token: {
                  type: 'string',
                  description: 'Token JWT pour l\'authentification'
                }
              }
            }
          }
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            data: {
              type: 'object'
            }
          }
        },
        MessageResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              description: 'Message de confirmation'
            }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              description: 'Message d\'erreur'
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string'
                  },
                  message: {
                    type: 'string'
                  }
                }
              }
            }
          }
        },
        Todo: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Identifiant unique de la tâche' },
            userId: { type: 'string', description: 'Identifiant du propriétaire' },
            title: { type: 'string', maxLength: 200, description: 'Intitulé de la tâche' },
            completed: { type: 'boolean', description: 'Tâche terminée ou non' },
            createdAt: { type: 'string', format: 'date-time', description: 'Date de création' },
            updatedAt: { type: 'string', format: 'date-time', description: 'Date de dernière modification' }
          }
        },
        CreateTodoRequest: {
          type: 'object',
          required: ['title'],
          properties: {
            title: { type: 'string', minLength: 1, maxLength: 200, description: 'Intitulé de la tâche' }
          }
        },
        UpdateTodoRequest: {
          type: 'object',
          description: 'Au moins un des deux champs est requis',
          properties: {
            title: { type: 'string', minLength: 1, maxLength: 200, description: 'Nouvel intitulé' },
            completed: { type: 'boolean', description: 'Nouveau statut' }
          }
        },
        TodoResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { $ref: '#/components/schemas/Todo' }
          }
        },
        TodoListResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'array', items: { $ref: '#/components/schemas/Todo' } }
          }
        },
        UsersListResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            data: {
              type: 'object',
              properties: {
                users: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/User'
                  }
                },
                pagination: {
                  type: 'object',
                  properties: {
                    page: {
                      type: 'integer',
                      description: 'Page actuelle'
                    },
                    pages: {
                      type: 'integer',
                      description: 'Nombre total de pages'
                    },
                    total: {
                      type: 'integer',
                      description: 'Nombre total d\'utilisateurs'
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    security: []
  },
  apis: ['./src/routes/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
