(function() {
    'use strict';
    angular
        .module("grockitApp.practice.factories", [])
        .constant('practiceConstants', {
            'optionList': 'abcdefghijklmnopqrstuvwxyz',
            'questionTypesUrl': 'app/components/question-types/directives/'
        })
        .factory('questionTypesService', questionTypesService)
        .factory('practiceUtilities', practiceUtilities)
        .factory('Level', Level)
        .factory('SplashMessages', SplashMessages)
        .factory('practiceResource', practiceResource);


    practiceUtilities.$inject = ['$q', '$sce', 'utilities', 'PracticeApi', 'alerts', 'YoutubeVideoApi','practiceConstants'];

    practiceResource.$inject = ['$q', 'PracticeApi','environmentCons','$resource'];

    function practiceResource($q, PracticeApi,environmentCons,$resource) {
        var questionsData = null,
            position = 0,gameId=null,
            service = {
                setQuestionsData: setQuestionsData,
                getQuestionData: getQuestionData,
                getRoundSession: getRoundSession,
                getQuestionFromApi: getQuestionFromApi,
                createNewGame: createNewGame,
                getTimingInformation: getTimingInformation
            };
        return service;


        function setQuestionsData(groupId, subjectId, type) {
            var deferred = $q.defer();
            PracticeApi.getQuestions(groupId, subjectId, type).then(function(result) {
                questionsData = null;
                console.log(result.data.questions)
                questionsData = result.data.questions;
                deferred.resolve(true);
            });

            return deferred.promise;
        }

        function getQuestionData() {
            var questionResult = questionsData[position];
            position++;
            return questionResult;
        };

        function getRoundSession(questionToRequest) {

            return PracticeApi.createQuestionPresentation(gameId, questionToRequest)
                .then(getRoundSessionsComplete)
                .catch(getRoundSessionsFailed);

            function getRoundSessionsComplete(reponse) {
                return reponse.data.round_session;
            }

            function getRoundSessionsFailed(e) {
                alerts.showAlert(alerts.setErrorApiMsg(e), 'danger');
            }
        }

        function getQuestionFromApi(questionId) {
            return PracticeApi.getQuestionById(questionId)
                .then(getQuestionComplete)
                .catch(getQuestionFailed);

            function getQuestionComplete() {
                return result.data.question;
            }

            function getQuestionFailed(e) {
                alerts.showAlert(alerts.setErrorApiMsg(e), 'danger');
            }
        }

        function createNewGame(activeGroupId, url) {

            return PracticeApi.createNewPracticeGame(activeGroupId, url)
                .then(getNewGamecomplete)
                .catch(getNewGameFailed);

            function getNewGamecomplete(game) {
                gameId=null;
                gameId=game.data.practice_game.id
                return gameId;
            }

            function getNewGameFailed(e) {
                alerts.showAlert(alerts.setErrorApiMsg(e), 'danger');
            }
        }

        function getTimingInformation(trackId, groupId, questionId) {
            var url = environmentCons.timingData + groupId + '/' + trackId + '/' + questionId + '.json';
            return $resource(url).query({
                array: true
            });
        }
    }

    function practiceUtilities($q, $sce, utilities, PracticeApi, alerts, YoutubeVideoApi, practiceConstants) {

        var service = {
            presentQuestion: presentQuestion,
            confirmChoice: confirmChoice,
            resetLayout: resetLayout,
            parseTagsAndResources: parseTagsAndResources,
            displayGeneralConfirmInfo: displayGeneralConfirmInfo,
            getVideoExplanation: getVideoExplanation,
            doNotKnowAnswer: doNotKnowAnswer,
            numericEntryConfirmChoice: numericEntryConfirmChoice,
            setMailToInformation: setMailToInformation,
            usersRunOutQuestions: usersRunOutQuestions,
            getAnswerType: getAnswerType
        };
        return service;

        function getAnswerType(questionKind) {
            var template = '';

            switch (questionKind) {
                case 'MultipleChoiceOneCorrect':
                    template = "_oneChoice.directive.html";
                    break;
                case 'MultipleChoiceOneOrMoreCorrect':
                    template = "_multipleChoice.directive.html";
                    break;
                case 'MultipleChoiceMatrixTwoByThree':
                    template = "_matrix2x3.directive.html";
                    break;
                case 'MultipleChoiceMatrixThreeByThree':
                    template = "_matrix3x3.directive.html";
                    break;
                case 'NumericEntryFraction':
                    template = "_fraction.directive.html";
                    break;
                case 'SPR':
                    template = "_provisionalSat.directive.html";
                    break;
                case 'NumericEntry':
                    template = "_numeric.directive.html";
                    break;
                case 'sat':
                    template = "_sat.directive.html";
                    break;
                case 'MultipleChoiceTwoCorrect':
                    template = "_twoChoice.directive.html";
                    break;
            }

            return practiceConstants.questionTypesUrl + template;
        }
        /*This methods takes care to set the practice layout based on the API response*/
        function setLayoutBasedOnQuestionInfo(setLayout) {
            var panel1 = angular.element('#Panel1'),
                panel2 = angular.element('#Panel2');

            if (setLayout) {
                panel1.removeClass('col-md-offset-3');
                panel2.removeClass('col-md-offset-3');

            } else {
                panel1.addClass('col-md-offset-3');
                panel2.addClass('col-md-offset-3');
            }
        }

        function removeBadImage() {
            /*This function was added to solve the problem with the img on LSAT, loaded from the content editor*/
            angular.element('img').error(function() {

                angular.element('img').attr('src', '');
            });
        }

        function setQuestionTypeMatrixGroups(items) {
            return _.forEach(items, function(answer, i) {
                answer["matrix_group"] = ((i - (i % 3)) / 3);
            });
        }

        function presentQuestion(questionResponse) {
            var resultObject = {},setLayoutType=null;

            resultObject = questionResponse;

            //resultObject.fixedWidth = resultObject.questionResult.question_set.fixed_info_width;

            //resultObject.questionInformation = $sce.trustAsHtml(resultObject.questionResult.question_set.info);

            /*Find if there is a question info defined or retrieve it by the API*/
            setLayoutType = angular.isDefined(resultObject.questionInformation) && resultObject.questionInformation != null &&
                resultObject.questionInformation != '' ? true : false;

            /*Set the layout based on the question info*/
            //setLayoutBasedOnQuestionInfo(setLayoutType);

            /*@Jose TODO This can be performed on a better way*/
            angular.element('.choice.active').removeClass('active');

            //resultObject.items = [];
            //resultObject.stimulus = "";

            resultObject.stimulus = $sce.trustAsHtml(questionResponse.stimulus);
            var optionList = practiceConstants.optionList,
                options = optionList.toUpperCase().split(""),
                answers = resultObject.answers,
                len = angular.isDefined(answers) ? answers.length : 0,
                i;

            for (i = 0; i < len; i++) {
                var value = answers[i];
                value["option"] = options[i];
                value["selected"] = false;
                resultObject.items.push(value);
            }
            if (resultObject.lastAnswerLoaded === 'MultipleChoiceMatrixTwoByThree' || resultObject.lastAnswerLoaded === 'MultipleChoiceMatrixThreeByThree') {
                resultObject.items = setQuestionTypeMatrixGroups(resultObject.items);
            }

            removeBadImage();
            return resultObject;
        }

        function doNotKnowAnswer(questionResult) {
            var resultObject = {};
            /*Question Explanation*/
            resultObject.questionExplanation = questionResult.explanation;

            if (resultObject.questionExplanation != null)
                resultObject.showExplanation = true;

            /*Get answers from the previous request and Explain*/
            var answers = questionResult.answers,
                len = questionResult.answers.length,
                i,
                parsedTags = this.parseTagsAndResources(questionResult.tags);

            resultObject.tagsResources = parsedTags.resources;
            resultObject.tags = parsedTags.tags;

            resultObject.xpTag = questionResult.experience_points;

            /*   Work with the styles to shown result
            define is some answer is bad.*/
            angular.element('.choice button').removeClass('btn-primary');

            for (i = 0; i < len; i++) {
                var answer = answers[i],
                    selectIdButton = '#' + answer.id;
                if (answer.correct) {
                    angular.element(selectIdButton).addClass('btn-success');
                }
            };

            angular.element("#answercontent *").prop('disabled', true);
            return resultObject;
        }

        function loadQuestion(questionToRequest) {
            var deferred = $q.defer(),
                setLayoutType = false,
                resultObject = {};

            PracticeApi.getQuestionById(questionToRequest)
                .then(function(result) {

                    resultObject.questionResult = result.data.question;
                    resultObject.fixedWidth = resultObject.questionResult.question_set.fixed_info_width;

                    if (resultObject.lastAnswerLoaded == '' || resultObject.lastAnswerLoaded != resultObject.questionResult.kind) {
                        resultObject.lastAnswerLoaded = resultObject.questionResult.kind;
                    }
                    resultObject.questionInformation = $sce.trustAsHtml(resultObject.questionResult.question_set.info);

                    /*Find if there is a question info defined or retrieve it by the API*/
                    setLayoutType = angular.isDefined(resultObject.questionInformation) && resultObject.questionInformation != null && resultObject.questionInformation != '' ? true : false;

                    /*Set the layout based on the question info*/
                    setLayoutBasedOnQuestionInfo(setLayoutType);

                    /*@Jose TODO This can be performed on a better way*/
                    angular.element('.choice.active').removeClass('active');

                    resultObject.items = [];
                    resultObject.stimulus = "";

                    resultObject.stimulus = $sce.trustAsHtml(resultObject.questionResult.stimulus);
                    var optionList = practiceConstants.optionList,
                        options = optionList.toUpperCase().split(""),
                        answers = resultObject.questionResult.answers,
                        len = answers.length,
                        i;

                    for (i = 0; i < len; i++) {
                        var value = answers[i];
                        value["option"] = options[i];
                        value["selected"] = false;
                        resultObject.items.push(value);
                    }
                    if (resultObject.lastAnswerLoaded === 'MultipleChoiceMatrixTwoByThree' || resultObject.lastAnswerLoaded === 'MultipleChoiceMatrixThreeByThree') {
                        resultObject.items = setQuestionTypeMatrixGroups(resultObject.items);
                    }

                    removeBadImage();
                    deferred.resolve(resultObject);
                }).catch(function errorHandler(e) {
                    deferred.reject(resultObject);
                    alerts.showAlert(alerts.setErrorApiMsg(e), 'danger');
                });

            return deferred.promise;
        }

        function confirmChoice(questionResult, roundSessionAnswer, answers, questionType) {
            var i, answerStatus = true,
                len = answers.length,
                correctAnswers = _.filter(answers, {
                    'correct': true
                }),
                selectedAnswers = _.filter(answers, {
                    'selected': true
                });
            if (correctAnswers.length === selectedAnswers.length) {
                angular.element('.choice button').removeClass('btn-primary');

                for (i = 0; i < len; i++) {
                    var answer = answers[i],
                        selectIdButton = ('#' + answer.id);
                    if (answer.correct) {
                        if (answer.selected) {

                            if (angular.isDefined(roundSessionAnswer)) {
                                PracticeApi.updateAnswer(roundSessionAnswer.id, answer.id);
                            }
                        } else {
                            answerStatus = false;
                        }
                        angular.element(selectIdButton).addClass('btn-success');
                    } else {
                        if (answer.selected) {
                            if (angular.isDefined(roundSessionAnswer)) {
                                PracticeApi.updateAnswer(roundSessionAnswer.id, answer.id);
                            }
                            angular.element(selectIdButton).addClass('btn-danger');
                            angular.element(selectIdButton).parents('#answer').addClass('incorrectAnswer');
                            answerStatus = false;
                        }
                    }
                }
                angular.element("#answercontent *").prop('disabled', true);

                return answerStatus;
            } else {
                if (correctAnswers.length > 1)
                    alerts.showAlert('Please select at least one option of each section!', 'warning');
                else
                    alerts.showAlert('Please select an option!', 'warning');
            }
        }

        function resetLayout() {
            setLayoutBasedOnQuestionInfo(true);
            angular.element('#skipAction').addClass('hide');
            angular.element('#nextAction').removeClass('btn-primary');
            angular.element('.list-group *').addClass('no-hover');
        }

        function parseTagsAndResources(tags) {
            var parsedTags = [],
                parsedResources = [],
                tgR = {},
                tagsLen = tags.length,
                i, j;

            for (i = 0; i < tagsLen; i++) {
                var tagR = tags[i].tag_resources,
                    tagRLen = tagR.length,
                    currentTag = tags[i];

                if (!_.find(parsedTags, function(tag) {
                    return tag.name === currentTag.name;
                }))
                    parsedTags.push(currentTag);

                for (j = 0; j < tagRLen; j++) {
                    var currentTagResource = tagR[j];
                    tgR = {
                        name: currentTag.name,
                        resource_type: currentTagResource.resource_type,
                        resource: currentTagResource.resource_type == 'youtube' ? utilities.getYoutubeVideosId(currentTagResource.resource) : currentTagResource.resource
                    };
                    parsedResources.push(tgR);
                }
            }
            return {
                tags: parsedTags,
                resources: parsedResources
            };
        }

        function displayGeneralConfirmInfo(questionResult) {
            var generalObject = {};
            /* Question Explanation*/
            generalObject.questionExplanation = questionResult.explanation;

            if (generalObject.questionExplanation != null)
                generalObject.showExplanation = true;

            /*Evaluate tag resources info, get video Ids and video time*/
            var parsedTags = this.parseTagsAndResources(questionResult.tags);

            generalObject.tagsResources = parsedTags.resources;
            generalObject.tags = parsedTags.tags;
            generalObject.xpTag = questionResult.experience_points;
            return generalObject;
        }

        function getVideoExplanation(questionResult) {
            var deferred = $q.defer(),
                videoObject = {};

            /* video validation*/
            if (questionResult.youtube_video_id !== null) {
                videoObject.showVideo = true;
                videoObject.videoId = questionResult.youtube_video_id;
                YoutubeVideoApi.setYouTubeTitle(videoObject.videoId).then(function(videoTime) {
                    videoObject.videoText = 'Video Explanation (' + videoTime + ')';
                    deferred.resolve(videoObject);
                });
            } else {
                deferred.resolve(videoObject);
            }


            return deferred.promise;
        }

        function numericEntryConfirmChoice(options) {

            var userAnswer = 0,
                selectedAnswer = 0,
                answerStatus = true,
                answers = '',
                numerator = options.numerator,
                denominator = options.denominator,
                lastAnswerLoaded = options.lastAnswerLoaded,
                questionResult = options.questionResult,
                roundSessionAnswer = options.roundSessionAnswer;
            /*Get selected answers*/

            if (numerator || denominator) {


                if (numerator > 0 && denominator > 0) {

                    userAnswer = numerator + '/' + denominator;
                } else {
                    userAnswer = numerator;
                }

                answers = questionResult.answers;
                var len = answers.length,
                    i, roundAnswer = (eval(userAnswer).toFixed(1));
                selectedAnswer = 0;

                for (i = 0; i < len; i++) {
                    var answer = answers[i],

                        /*evaluate just one time the equivalence between body and numerator*/
                        answerEval = (answer.body === userAnswer || eval(answer.body).toFixed(1) === roundAnswer);

                    if (answerEval)
                        selectedAnswer = answer.answer_id;

                    answerStatus = answerEval;
                };

                PracticeApi.updateAnswer(roundSessionAnswer.id, selectedAnswer);

                angular.element("#answercontent *").prop('disabled', true);
                return answerStatus;

            } else {
                alerts.showAlert(alerts.setErrorApiMsg(error), 'warning');

            }
        }

        function setMailToInformation(questionId, titleQuest) {
            return 'Problem with ' + titleQuest + ' question #' + questionId;
        }

        function usersRunOutQuestions(trackTitle, activeGroupId) {
            var options = {
                message: "You've answered all of the adaptive questions we have for you in " + trackTitle + ".  " +
                    "That's a lot of practice.  Would you like to review questions you've answered or go back to the main dashboard? ",
                title: "Congratulations!",
                buttons: {
                    review: {
                        label: "Go to Review",
                        className: "btn-info",
                        callback: function() {
                            utilities.redirect('https://grockit.com/reviews');
                        }
                    },
                    main: {
                        label: "Go to Dashboard",
                        className: "btn-primary",
                        callback: function() {
                            utilities.internalRedirect('/' + activeGroupId + "/dashboard");
                        }
                    }
                }
            };
            utilities.dialogService(options);
        }
    }

    function Level() {
        var messages = {
            2: 'Lowest',
            4: 'Low',
            8: 'Medium',
            16: 'High',
            32: 'Highest'
        };
        return {
            getMessage: function(level) {
                return messages[level];
            }
        };
    }

    function SplashMessages(utilities) {
        var loadingMessages = [
            'Spinning up the hamster...',
            'Shovelling coal into the server...',
            'Programming the flux capacitor',
            'Adjusting data for your IQ...',
            'Generating next funny line...',
            'Entertaining you while you wait...',
            'Improving your reading skills...',
            'Dividing eternity by zero, please be patient...',
            'Just stalling to simulate activity...',
            'Adding random changes to your data...',
            'Waiting for approval from Bill Gates...',
            'Adapting your practice questions...',
            'Supercharging your study...'
        ];
        return {
            getLoadingMessage: function() {
                return loadingMessages[utilities.random(loadingMessages.length - 1)];
            }
        };
    }

    function questionTypesService() {
        var service = {
            satFactory: satFactory,
            numericEntry: numericEntry,
            fractionEntry: fractionEntry
        };
        return service;

        function numericEntry(scope) {

            scope.$watch('portal.numerator', function(newVal, oldVal) {
                scope.isNumeratorValid = validateNumber(newVal);
                handleValidation(scope.isNumeratorValid);
            });
        }

        function fractionEntry(scope) {
            scope.$watch('portal.numerator', function(newVal, oldVal) {
                scope.isNumeratorValid = validateNumber(newVal);
                handleValidation(scope.isNumeratorValid && scope.isDenominatorValid);
            });
            scope.$watch('portal.denominator', function(newVal, oldVal) {
                scope.isDenominatorValid = validateNumber(newVal);
                handleValidation(scope.isNumeratorValid && scope.isDenominatorValid);
            });
        }

        function validateNumber(value) {
            if (angular.isUndefined(value) || value === '' || value === null) {
                return null;
            } else {
                value = value * 1;
                return (angular.isDefined(value) && value != null && !isNaN(value) && angular.isNumber(value));
            }
        }

        function handleValidation(isValid) {
            var nexAction = $('#nextAction'),
                seeAnswer = $('#skipAction');
            if (isValid) {
                nexAction.addClass('btn-primary');
                seeAnswer.addClass('hide');
            } else {
                nexAction.removeClass('btn-primary');
                seeAnswer.removeClass('hide');
            }
        }

        function satFactory() {
            var content = $('#parent');
            content
                .on('click', '#sat .column-matrix', function(e) {
                    if (e.handled !== true) {
                        var choice = $(e.target),
                            choiceVal = choice.text(),
                            selectedGroup = $(e.target).parents('td').data('group'),
                            groups = $(e.target).parents('.choice').find('[data-group=' + selectedGroup + ']'),
                            hasPrimary = choice.hasClass('btn-primary'),
                            nexAction = $('#nextAction'),
                            seeAnswer = $('#skipAction');

                        groups.find('[type=button]').removeClass('btn-primary');
                        groups.find('[type=button]').addClass('btn-outline');
                        if (!hasPrimary) {
                            choice.removeClass('btn-outline');
                            choice.addClass('btn-primary');
                            $('#input' + selectedGroup).text(choiceVal);
                            nexAction.addClass('btn-primary');
                            seeAnswer.addClass('hide');
                        } else {
                            $('#input' + selectedGroup).text('');
                            choice.removeClass('btn-primary');
                            choice.addClass('btn-outline');
                        }
                    }
                    e.handled = true;
                });
        }
    }




})();
