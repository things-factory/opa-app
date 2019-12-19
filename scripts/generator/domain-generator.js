/*
 * 1. Create DB connection
 *
 * 2. Type in domain information and do validation
 *    1) name (name of domain): required
 *    2) subdomain (subdomain of domain): required
 *    3) description (description of domain): nullable
 *    4) email (email of user who will be a manager of the domain): : required
 *
 * 3. Start to initialize required data to create new domain
 *    1) Domain
 *    2) Menu
 *    3) Code
 *    4) Role
 *    5) Privilege
 *    6) setting
 *
 * 4. Creating relations
 *    1) users_domains table
 *    2) roles_priviledges table
 *    3) users_roles table
 */
const path = require('path')
const appRootPath = require('app-root-path').path
const { getManager, Not, Equal, Raw, createConnection, getRepository } = require('typeorm')
const inquirer = require('inquirer')
const chalk = require('chalk')

const validators = {
  bizplaceName: async bizplaceName => {
    const { Bizplace } = require('@things-factory/biz-base')
    const bizplace = await getRepository(Bizplace).findOne({
      where: {
        name: Raw(alias => `LOWER(${alias}) LIKE '${bizplaceName.toLowerCase()}'`)
      }
    })

    return bizplace ? true : chalk.redBright(`There's a bizplace named ${chalk.cyan(bizplaceName)} already.`)
  },
  name: async name => {
    if (/^[a-zA-Z ]+$/.test(name)) {
      const { Domain } = require('@things-factory/shell')
      const domain = await getRepository(Domain).findOne({
        where: {
          name: Raw(alias => `LOWER(${alias}) LIKE '${name.toLowerCase()}'`)
        }
      })
      return domain ? chalk.redBright(`There's a domain named ${chalk.cyan(name)} already.`) : true
    } else {
      return chalk.redBright('Domain name must be only characters and spaces')
    }
  },
  subdomain: async subdomain => {
    if (/^[a-z0-9]+$/.test(subdomain)) {
      const { Domain } = require('@things-factory/shell')
      const domain = await getRepository(Domain).findOne({
        where: {
          name: Raw(alias => `LOWER(${alias}) LIKE '${subdomain.toLowerCase()}'`)
        }
      })
      return domain ? chalk.redBright(`There's a domain has ${chalk.cyan(name)} as subdomain already.`) : true
    } else {
      return chalk.redBright('Subdomain must be only lowercase characters and numbers without spaces')
    }
  },
  email: async email => {
    if (/.+\@.+\..+/.test(email)) {
      const { User } = require('@things-factory/auth-base')
      const user = await getRepository(User).findOne({
        where: { email: Raw(alias => `LOWER(${alias}) LIKE '${email.toLowerCase()}'`) }
      })
      return user ? true : chalk.redBright(`There's no user has ${chalk.cyan(email)} as email.`)
    } else {
      return chalk.redBright('Please type right format of email')
    }
  }
}

const questions = {
  bizplaceName: {
    type: 'text',
    name: 'bizplaceName',
    message: chalk.cyanBright.bold('Bizplace name: '),
    validate: validators.bizplaceName
  },
  name: {
    type: 'text',
    name: 'name',
    message: chalk.cyanBright.bold('Domain name: '),
    validate: validators.name
  },
  subdomain: {
    type: 'text',
    name: 'subdomain',
    message: chalk.cyanBright.bold('Subdomain: '),
    validate: validators.subdomain
  },
  description: {
    type: 'text',
    name: 'description',
    message: chalk.cyanBright.bold('Description for new domain: ')
  },
  email: {
    type: 'text',
    name: 'email',
    message: chalk.cyanBright.bold('User email for manager of new domain: '),
    validate: validators.email
  }
}

/**
 * @description Get orm configuration based on current mode (development or production)
 */
async function getOrmConfig(mode) {
  if (!mode) {
    let answers = await inquirer.prompt({
      type: 'list',
      name: 'mode',
      message: 'Mode:',
      choices: [
        {
          name: 'Development',
          value: 'development'
        },
        {
          name: 'Production',
          value: 'production'
        }
      ],
      default: 'development'
    })
    mode = answers.mode
  }

  process.env.NODE_ENV = mode == 'development' ? 'development' : 'production'

  let ormconfig

  try {
    ormconfig = require(path.resolve(appRootPath, 'ormconfig'))
  } catch (e) {
    ormconfig = require('@things-factory/shell/ormconfig')
  }

  if (ormconfig.host) {
    await confirmHost(ormconfig.host)
  }

  return ormconfig
}

/**
 * @description double check whether user wants to process it through this host
 * @param {string} host
 */
async function confirmHost(host) {
  return await inquirer.prompt([
    {
      type: 'input',
      name: 'hostConfirm',
      message: `Please type [${chalk.bold.cyan(host)}] to confirm`,
      validate: v => {
        return v == host ? true : 'Wrong typed!'
      },
      transformer: (v, answers, flags) => {
        return v == host ? chalk.greenBright(v) : chalk.red(v)
      }
    }
  ])
}

/**
 * @description Generate domain
 */
async function generateDomain() {
  // 1. Create DB connection
  const opts = parseOptions()
  const ormconfig = await getOrmConfig(opts.mode)
  createConnection({
    ...ormconfig,
    logging: true
  }).then(async connection => {
    console.log(chalk.cyanBright.bold('Database connection established'))
    let { bizplaceName, name, subdomain, description, email } = await promptDomainInfo(
      opts.bizplaceName,
      opts.name,
      opts.subdomain,
      opts.description,
      opts.email
    )

    // Start transaction
    await getManager().transaction(async trxMgr => {
      const domain = await createDomain(trxMgr, bizplaceName, name, subdomain, description)
      /* 3. Start to initialize required data to create new domain
       *    1) Domain
       *    2) Menu
       *    3) Code
       *    4) Role
       *    5) Privilege
       *    6) setting
       */
      await initData(trxMgr, domain, opts.filePath)

      /* 4. Creating relations
       *    1) users_domains table
       *    2) roles_priviledges table
       *    3) users_roles table
       */
      await createRelations(trxMgr, domain, email)
    })

    await connection.close()
    console.log(
      chalk.cyanBright.bold(`Domain [${chalk.blueBright.bold(name)}] and initial data are generated successfully.`)
    )
    process.exit(0)
  })
}

/**
 * @description Command line option parser
 */
function parseOptions() {
  let options = process.argv.filter(arg => /^--\w+=/.test(arg))
  const regex = /^--(\w+)=([\w/@ .\-_]+)/
  return options.reduce((optionObj, option) => {
    const optKey = regex.exec(option)[1]
    const optValue = regex.exec(option)[2]

    return {
      ...optionObj,
      [optKey]: optValue
    }
  }, {})
}

/**
 * @description: prompt domain info from user.
 * @returns name, subdomain, description, email
 */
async function promptDomainInfo(bizplaceName, name, subdomain, description, email) {
  let neededQuestions = []

  if (!bizplaceName) {
    neededQuestions.push(questions.bizplaceName)
  } else {
    let result = await validators.bizplaceName(bizplaceName)
    if (typeof result === 'string') {
      throw new Error(result)
    }
  }

  if (!name) {
    neededQuestions.push(questions.name)
  } else {
    let result = await validators.name(name)
    if (typeof result === 'string') {
      throw new Error(result)
    }
  }

  if (!subdomain) {
    neededQuestions.push(questions.subdomain)
  } else {
    let result = await validators.subdomain(subdomain)
    if (typeof result === 'string') {
      throw new Error(result)
    }
  }

  if (!description) {
    neededQuestions.push(questions.description)
  }

  if (!email) {
    neededQuestions.push(questions.email)
  } else {
    let result = await validators.email(email)
    if (typeof result === 'string') {
      throw new Error(result)
    }
  }

  const answers = await inquirer.prompt(neededQuestions)

  return {
    bizplaceName,
    name,
    subdomain,
    description,
    email,
    ...answers
  }
}

/**
 * @description Create domain
 *
 * @param {string} name
 * @param {string} subdomain
 * @param {string} description
 * @returns Domain object
 */
async function createDomain(trxMgr, bizplaceName, name, subdomain, description) {
  const { Domain } = require('@things-factory/shell')
  const { Bizplace } = require('@things-factory/biz-base')

  const domain = await trxMgr.getRepository(Domain).save({
    name,
    subdomain,
    description
  })

  const bizplace = await trxMgr.getRepository(Bizplace).findOne({ where: { name: bizplaceName } })
  await trxMgr.getRepository(Bizplace).save({
    ...bizplace,
    domain
  })

  return domain
}

async function initData(trxMgr, domain, filePath = './initializers') {
  const initializers = require(filePath)
  for (let funcName in initializers) {
    await initializers[funcName](trxMgr, domain)
  }
}

async function createRelations(trxMgr, domain, email) {
  const { User, Role, Priviledge } = require('@things-factory/auth-base')
  const { Bizplace } = require('@things-factory/biz-base')
  const { Manager } = require('@things-factory/biz-base')

  // 1) roles_priviledges table
  const roleRepo = trxMgr.getRepository(Role)
  let superAdminRole = await roleRepo.findOne({
    where: { domain, name: 'Super Admin' },
    relations: ['priviledges']
  })

  const customerRole = await roleRepo.findOne({
    where: { domain, name: 'Customer' },
    relations: ['priviledges']
  })

  const privilegeRepo = trxMgr.getRepository(Priviledge)
  const ownerPrivileges = await privilegeRepo.find({
    where: { domain, category: Not(Equal('customer')) }
  })
  const customerPrivileges = await privilegeRepo.find({ where: { domain, name: 'role', category: 'customer' } })

  superAdminRole = await roleRepo.save({
    ...superAdminRole,
    priviledges: [...superAdminRole.priviledges, ...ownerPrivileges]
  })

  await roleRepo.save({
    ...customerRole,
    priviledges: [...customerRole.priviledges, ...customerPrivileges]
  })

  // 2) users_domains table
  // 3) users_roles table
  const userRepo = trxMgr.getRepository(User)
  const user = await userRepo.findOne({ where: { email }, relations: ['domains', 'roles'] })
  await userRepo.save({
    ...user,
    domains: [...user.domains, domain],
    roles: [...user.roles, superAdminRole]
  })

  // 4) Set user as domain manager
  const bizplace = await trxMgr.getRepository(Bizplace).findOne({ where: { domain } })
  await trxMgr.getRepository(Manager).save({
    type: 'domain manager',
    user,
    bizplace
  })
}

generateDomain()
