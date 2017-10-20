
const ProgressBar = require('progress')
const _ = require('lodash')
const assert = require('assert')
const Promise = require('bluebird')
const pAll = require('p-all')

const {
  getPivPeople,
  getPivStories,
  getPivProjectName,
  getPivIterations
} = require('./piv')

const {
  getGihubRepoId,
  createMilestones,
  createIssue
} = require('./zenhub')

module.exports = async function pivotalToGithub (options, cb) {
  if (!cb) cb = function () {}
  assert(options, 'Missing required parameter `options`')
  assert(options.githubRepo, 'Missing required option `options.githubRepo`')
  assert(options.githubToken, 'Missing required option `options.githubToken`')
  assert(options.githubUser, 'Missing required option `options.githubUser`')
  assert(options.pivotalId, 'Missing required option `options.pivotalId`')
  assert(options.pivotalToken, 'Missing required option `options.pivotalToken`')
  assert(options.zenhubToken, 'Missing required option `options.zenhubToken`')

  console.log('Fetching Data...')

  const initialDataRequestPromises = [
    getPivProjectName(options),
    getPivStories(options),
    getPivPeople(options),
    getPivIterations(options),
    getGihubRepoId(options)
  ]

  // _.zipObject(['foo', 'bar', 'baz'], await getData());
  const [
    pivProjectName,
    pivStories,
    pivPeople,
    pivIterations,
    githubRepoId
  ] = await Promise.all(initialDataRequestPromises).catch((err) => {
    return console.log(err)
  })

  console.log(`pivProjectName ${pivProjectName}`)
  console.log(`pivStories ${pivStories.length}`)
  console.log(`pivPeople ${_.size(pivPeople)}`)
  console.log(`pivIterations ${pivIterations.length}`)
  console.log(`githubRepoId ${githubRepoId}`)

  console.log('\nMigrating to Zenhub...')

  // create github milestones
  let milestones
  try {
    milestones = await createMilestones(options, pivIterations)
  } catch (err) {
    return console.log(err)
  }

  // create github issues
  console.log('Creating Pivotal Tracker stories as GitHub issues on ' + options.githubUser + '/' + options.githubRepo)
  console.log('\n   This will take ' + (2 * pivStories.length) + ' seconds.')
  console.log('   We\'re conservative about the rate-limit because of GitHub\'s abuse limitting.\n')

  const data = {
    pivPeople,
    githubRepoId,
    pivStoriesIterationsMap: getPivStoriesIterationsMap(pivIterations),
    milestonesNumbersMap: getMilestoneNumbersMap(milestones)
  }

  const pg = new ProgressBar('Tickets to Issues [:current/:total] [|:bar|]', {
    total: pivStories.length,
    width: 40
  })

  const githubActions = pivStories.map((story) => async () => {
    console.log(`\nCreating Github Issue for Piv Story #${story.id} ...`)
    let issue
    try {
      issue = await createIssue(options, story, data)
    } catch (err) {
      console.error('ERROR:', err.message)
      console.error('Offending story:', JSON.stringify(story))
      pg.tick()
      return
    }

    process.stdout.clearLine()
    process.stdout.cursorTo(0)
    console.log(`--> Created Piv story ' + story.id + ' as Github issue #${issue.number}`)
    pg.tick()
  })

  try {
    await pAll(githubActions, {concurrency: 1})
  } catch (err) {
    console.log('------------------')
    console.log(err)
    console.log('------------------')
  }
}

//  ======= Helpers =======

const getMilestoneNumbersMap = (githubMilestones) => {
  const milestonesNumbers = {}
  _.each(githubMilestones, (milestone) => {
    milestonesNumbers[milestone.title] = milestone.number
  })
  return milestonesNumbers
}

const getPivStoriesIterationsMap = (pivIterations) => {
  const issuesIterations = {}
  _.each(pivIterations, (pivotalIteration) => {
    const milestoneName = pivotalIteration.finish.substring(0, 10)
    _.each(pivotalIteration.stories, story => {
      issuesIterations[story.id] = milestoneName
    })
  })
  return issuesIterations
}
