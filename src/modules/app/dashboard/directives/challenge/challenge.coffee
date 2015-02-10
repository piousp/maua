'use strict'
class Challenge
  constructor: () ->
  ## Constructor stuff
  restrict: 'AE'
  replace: true
  scope:
    challenges: '='
  link: (scope, element, attr) ->
    scope.newChallenge = (index) ->
      currentChallenge = scope.challenges[index]
      pieces = currentChallenge.url.split('/')
      id = pieces[pieces.length - 1]
      baseUrl = utilities.originalGrockit().url
      scope.challengeId = id
      utilities.redirect baseUrl + '/assessment/introcards/' + scope.challengeId
      return