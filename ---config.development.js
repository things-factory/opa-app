module.exports = {
  port: 3000,
  uploads: 'uploads',
  attachmentsPath: 'attachments',
  SECRET: '0xD58F835B69D207A76CC5F84a70a1D0d4C79dfC95',
  logger: {
    file: {
      filename: 'logs/application-%DATE%.log',
      datePattern: 'YYYY-MM-DD-HH',
      zippedArchive: true,
      maxSize: '200m',
      maxFiles: '1m',
      level: 'info'
    }
  },
  ormconfig: {
    name: 'default',
    type: 'postgres',
    database: 'opa-one',
    username: 'postgres',
    password: 'Hati0SEA',
    host: 'opa-one-instance-1.cijhm4n1hbst.ap-southeast-1.rds.amazonaws.com',
    port: 5432,
    synchronize: true,
    logging: true
  },
  googleFontAPIKey: '',
  email: {
    host: 'smtp.office365.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: 'no-reply@hatiolab.com', // generated ethereal user
      pass: 'h@ti0LAB1008' // generated ethereal password
    },
    secureConnection: false,
    tls: {
      ciphers: 'SSLv3'
    }
  }
}