const path = require('path')
const appRootPath = require('app-root-path').path
const { getManager, Not, Equal, Raw, createConnection, getRepository } = require('typeorm')
const inquirer = require('inquirer')
const chalk = require('chalk')

const validators = {
  name: async name => {
    if (/^[a-zA-Z ]+$/.test(name)) {
      const { Bizplace } = require('@things-factory/biz-base')
      const bizplace = await getRepository(Bizplace).findOne({
        where: {
          name: Raw(alias => `LOWER(${alias}) LIKE '${name.toLowerCase()}'`)
        }
      })
      return bizplace ? chalk.redBright(`There's a bizplace named ${chalk.cyan(name)} already.`) : true
    } else {
      return chalk.redBright('Bizplace name must be only characters and spaces')
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
  name: {
    type: 'text',
    name: 'name',
    message: chalk.cyanBright.bold('Bizplace name: '),
    validate: validators.name
  },
  description: {
    type: 'text',
    name: 'description',
    message: chalk.cyanBright.bold('Description for new bizplace: ')
  },
  address: {
    type: 'text',
    name: 'address',
    message: chalk.cyanBright.bold('Address: ')
  },
  postalCode: {
    type: 'text',
    name: 'postalCode',
    message: chalk.cyanBright.bold('Postal code: ')
  },
  latlng: {
    type: 'text',
    name: 'latlng',
    message: chalk.cyanBright.bold('Latlng: ')
  },
  email: {
    type: 'text',
    name: 'email',
    message: chalk.cyanBright.bold('User email for manager of new bizplace: '),
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
 * @description Generate Bizplace
 */
async function generateBizplce() {
  // 1. Create DB connection
  const opts = parseOptions()
  const ormconfig = await getOrmConfig(opts.mode)
  createConnection({
    ...ormconfig,
    logging: true
  }).then(async connection => {
    console.log(chalk.cyanBright.bold('Database connection established'))
    let { name, description, address, postalCode, latlng, email } = await promptBizplaceInfo(
      opts.name,
      opts.description,
      opts.address,
      opts.postalCode,
      opts.latlng,
      opts.email
    )

    // Start transaction
    await getManager().transaction(async trxMgr => {
      const bizplace = await createBizplace(trxMgr, name, description, address, postalCode, latlng)
      await createRelations(trxMgr, bizplace, email)
    })

    await connection.close()
    console.log(chalk.cyanBright.bold(`Bizplace [${chalk.blueBright.bold(name)}] is generated successfully.`))
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

async function promptBizplaceInfo(name, description, address, postalCode, latlng, email) {
  let neededQuestions = []

  if (!name) {
    neededQuestions.push(questions.name)
  } else {
    let result = await validators.name(name)
    if (typeof result === 'string') {
      throw new Error(result)
    }
  }

  if (!description) {
    neededQuestions.push(questions.description)
  }

  if (!address) {
    neededQuestions.push(questions.address)
  }

  if (!postalCode) {
    neededQuestions.push(questions.postalCode)
  }

  if (!latlng) {
    neededQuestions.push(questions.latlng)
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
    name,
    description,
    address,
    postalCode,
    latlng,
    email,
    ...answers
  }
}

async function createBizplace(trxMgr, name, description, address, postalCode, latlng) {
  const { Bizplace } = require('@things-factory/biz-base')

  return await trxMgr.getRepository(Bizplace).save({
    name,
    description,
    address,
    postalCode,
    latlng
  })
}

async function createRelations(trxMgr, bizplace, email) {
  // 1. Assign user as bizplace manager
  const { User, Role } = require('@things-factory/auth-base')
  const { BizplaceUser } = require('@things-factory/biz-base')
  const { Domain } = require('@things-factory/shell')
  const systemDomain = await trxMgr.getRepository(Domain).findOne({ where: { systemFlag: true } })
  const bizplaceManagerRole = await trxMgr.getRepository(Role).findOne({
    where: { domain: systemDomain, name: 'Bizplace Manager' }
  })

  const userRepo = trxMgr.getRepository(User)
  const user = await userRepo.findOne({ where: { email }, relations: ['roles'] })
  await userRepo.save({
    ...user,
    roles: [...user.roles, bizplaceManagerRole]
  })

  await trxMgr.getRepository(BizplaceUser).save({
    user,
    bizplace
  })
}

generateBizplce()
