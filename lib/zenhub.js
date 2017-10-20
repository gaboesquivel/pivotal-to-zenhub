const rp = require('request-promise')
const Promise = require('bluebird')
const _ = require('lodash')
const GitHubApi = require('github')
const pAll = require('p-all')

const github = new GitHubApi({
  version: '3.0.0',
  headers: {
    'user-agent': 'Pivotal-To-ZenHub'
  }
})

const createIssue = async (options, story, data) => {
  const user = options.githubUser
  const repo = options.githubRepo
  const people = data.pivPeople

  github.authenticate({
    type: 'token',
    token: options.githubToken
  })

  function getComments (story) {
    // return '### Comments\n\n' + story.comments.map(function (comment) {
    //   var commenter = people[comment.personId] ? people[comment.personId].name : comment.personId
    //   return '[' + comment.createdAt + '] **' + commenter + '**: ' + comment.text + '\n'
    // }).join('\n')
    return ''
  }

  function getTasks (story) {
    return '### Tasks\n\n' + _.sortBy(story.tasks, 'position').map(function (task) {
      return '- [' + (task.complete ? 'x' : ' ') + '] ' + task.description
    }).join('\n')
  }

  function getDescription (story) {
    const requester = people[story.requestedById] ? people[story.requestedById].name : story.requestedById
    const owner = people[story.ownedById] ? people[story.ownedById].name : story.ownedById
    story.comments = story.comments || []
    story.tasks = story.tasks || []

    return (story.description || '') + '\n\n- - -\n\n' +
      '- **Original Ticket**: ' + story.url + '\n' +
      '- **Created by:** ' + requester + '\n' +
      (story.ownedById ? ('- **Owned by:** ' + owner + '\n') : '') +
      (story.estimate != null ? ('- **Estimate:** ' + story.estimate + '\n') : '') +
      (story.currentState === 'accepted' ? '- **Accepted at:** ' + story.acceptedAt + '\n' : '') +
      '- **State:** ' + story.currentState +
      (story.comments.length ? '\n\n- - -\n\n' + getComments(story) : '') +
      (story.tasks.length ? '\n\n- - -\n\n' + getTasks(story) : '')
  }

  const createGithubIssue = Promise.promisify(github.issues.create)
  const editGithubIssue = Promise.promisify(github.issues.edit)

  const githubIssueData = {
    title: story.name,
    body: getDescription(story),
    repo: repo,
    user: user,
    milestone: data.milestonesNumbersMap[data.pivStoriesIterationsMap[story.id]],
    labels: [story.storyType].concat(_.pluck(story.labels, 'name').concat([
      'pivotal', `${options.pivotalProjectName}`
    ]))
  }

  const handleCreateGithubIssueResponse = async (githubIssue) => {
    const estimate = parseInt(story.estimate)
    if (_.isNumber(estimate)) {
      console.log(`Setting Issue #${githubIssue.number} Estimate...`)
      await setIssueEstimate(data.githubRepoId, options.zenhubToken, githubIssue.number, estimate)
    }

    if (story.currentState === 'accepted') {
      await editGithubIssue({
        repo: repo,
        user: user,
        number: githubIssue.number,
        state: 'closed'
      })
    }

    return githubIssue
  }

  return createGithubIssue(githubIssueData)
    .then(handleCreateGithubIssueResponse)
}

const createMilestones = async ({githubUser, githubRepo, githubToken}, pivIterations) => {
  console.log('--> Creating milestones ...')
  const options = {
    method: 'POST',
    uri: `https://api.github.com/repos/${githubUser}/${githubRepo}/milestones`,
    headers: {
      Authorization: `token ${githubToken}`,
      Accept: 'application/json',
      'user-agent': 'Pivotal-To-ZenHub'
    },
    transform: (body) => JSON.parse(body)
  }

  const milestonesPromises = _.map(pivIterations, (pivIteration) => {
    const milestone = {
      title: pivIteration.finish.substring(0, 10),
      // title: 'test_28_' + pivIteration.finish.substring(0, 10),
      state: 'open',
      description: pivIteration.descritiption,
      'due_on': pivIteration.finish
    }

    const opts = _.merge({}, options, { body: JSON.stringify(milestone) })
    return () => rp(opts).then((milestone) => {
      console.log(`--> Created Github milestone ${milestone.title} \n`)
      return milestone
    })
  })

  return pAll(milestonesPromises, {concurrency: 2}).then((milestones) => {
    console.log(`--> ${milestones.length} milestones were created succesfully.`)
    return milestones
  })
}

const getGihubRepoId = async ({githubUser, githubRepo, githubToken}) => {
  const options = {
    uri: `https://api.github.com/repos/${githubUser}/${githubRepo}`,
    headers: {
      Authorization: `token ${githubToken}`,
      Accept: 'application/json',
      'user-agent': 'Pivotal-To-ZenHub'
    },
    transform: (body) => JSON.parse(body)
  }
  return rp(options).then((response) => response.id)
}

const setIssueEstimate = async (githubRepoId, zenhubToken, issueNumber, estimate) => {
  const bodyData = {
    estimate: estimate || 0
  }
  const options = {
    method: 'PUT',
    uri: `https://api.zenhub.io/p1/repositories/${githubRepoId}/issues/${issueNumber}/estimate`,
    headers: {
      'X-Authentication-Token': `${zenhubToken}`,
      Accept: 'application/json',
      'User-Agent': 'Pivotal-To-ZenHub'
    },
    json: true,
    body: bodyData
  }
  return rp(options)
}

module.exports = {
  getGihubRepoId,
  createMilestones,
  setIssueEstimate,
  createIssue
}
