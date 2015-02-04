'use strict'

module.exports = angular.module('grockitApp.login', [])
    .config(($stateProvider) ->
      $stateProvider.state 'login',
      url: '/login'
      templateUrl: 'app/account/login/login.html'
      controller: 'LoginController'
      controllerAs: 'vmlog'
      return
)
.config(require('./config/index.config'))
.constant "grockitAuth", require('./auth.constants')
.controller 'LoginController', require('./loginController')

