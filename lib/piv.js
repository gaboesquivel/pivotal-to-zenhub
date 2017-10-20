const tracker = require('pivotaltracker')
const _ = require('lodash')
const rp = require('request-promise')

const getPivIterations = async ({pivotalToken, pivotalId}) => {
  const options = {
    uri: `https://www.pivotaltracker.com/services/v5/projects/${pivotalId}/iterations?limit=500&offset=1`,
    headers: {
      'X-TrackerToken': `${pivotalToken}`,
      Accept: 'application/json',
      'user-agent': 'Pivotal-To-ZenHub'
    },
    transform: (body) => JSON.parse(body)
  }
  return rp(options)
}

const getPivProjectName = async ({pivotalToken, pivotalId}) => {
  const options = {
    uri: `https://www.pivotaltracker.com/services/v5/projects/${pivotalId}`,
    headers: {
      'X-TrackerToken': `${pivotalToken}`,
      Accept: 'application/json',
      'user-agent': 'Pivotal-To-ZenHub'
    },
    transform: (body) => JSON.parse(body)
  }
  return rp(options).then((project) => project.name)
}

const getPivPeople = async ({pivotalToken, pivotalId}) => {
  return new Promise((resolve, reject) => {
    const client = new tracker.Client(pivotalToken)
    client.project(pivotalId).memberships.all((err, people) => {
      if (err) {
        reject(new Error(err))
      }
      resolve(_(people).pluck('person').indexBy('id').value())
    })
  })
}

const getPivStories = async ({pivotalToken, pivotalId}) => {
  return new Promise((resolve, reject) => {
    const client = new tracker.Client(pivotalToken)
    client.project(pivotalId).stories.all((err, stories) => {
      if (err) {
        reject(new Error(err))
      }
      resolve(stories)
    })
  })
}

const getPivComments = async ({pivotalToken, pivotalId}) => {
  const client = new tracker.Client(pivotalToken)
  const getStories = Promise.promisify(client.project(pivotalId).stories.all)
  return getStories().then((stories) => {

  })
}

const getPivTasks = async ({pivotalToken, pivotalId}) => {
  const client = new tracker.Client(pivotalToken)
  const getStories = Promise.promisify(client.project(pivotalId).stories.all)
  return getStories().then((stories) => {
    return stories
  })
}

module.exports = {
  getPivPeople,
  getPivStories,
  getPivComments,
  getPivTasks,
  getPivIterations,
  getPivProjectName
}

//   client.project(pivotalId).stories.all(function (err, stories) {
//     if (err) return cb(err)
//
//     // TODO: review this code, why are getting falsy values in stories array ?
//     stories = _.compact(stories)
//
//     console.log('--> Fetching tasks and comments...')
//     async.map(stories, function (story, cb) {
//       if (!story) {
//         return console.log('===> no story!')
//       }
//
//       client.project(projectId).story(story.id).comments.all(function (err, comments) {
//         if (err) return cb(err)
//
//         client.project(projectId).story(story.id).tasks.all(function (err, tasks) {
//           if (err) return cb(err)
//           story.comments = comments
//           story.tasks = tasks
//           cb(err, story)
//         })
//       })
//     }, (err, stories) => {
//       console.log('--> Fetching people...')
//       client.project(projectId).memberships.all(function (err, people) {
//         cb(err, stories, _(people).pluck('person').indexBy('id').value())
//       })
//     })
//   })
//   return Promise.resolve([])
// }
