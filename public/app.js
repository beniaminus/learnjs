'use strict';
var learnjs = {
    poolId: 'us-east-1:d0a0706d-e606-495d-8594-8934b1e86b75'
};

learnjs.problemView = function(problem) {
    var view = learnjs.template('problem-view');
    view.find('.title').text('Problem number ' + problem);

    var problemNumber = parseInt(problem, 10);
    var data = learnjs.problems[problemNumber - 1];
    var resultFlash = view.find('.result');
    if (problemNumber < learnjs.problems.length) {
        var buttonItem = learnjs.template('skip-btn');
        buttonItem.find('a').attr('href', '#problem-' + (problemNumber + 1));
        $('.nav-list').append(buttonItem);
        view.bind('removingView', function() {
            buttonItem.remove();
        });        
    }

    var answer = view.find('.answer');
    function checkAnswer() {
        var test = data.code.replace('__', answer.val()) + '; problem();';

        return eval(test);
    }

    function checkButtonOnClick() {
        if (checkAnswer()) {
            var flash = learnjs.buildCorrectFlash(problemNumber);

            learnjs.flashElement(resultFlash, flash);        
            learnjs.saveAnswer(problemNumber, answer.val())    
        } else {
            learnjs.flashElement(resultFlash, 'Incorrect!');
        }
        
        return false;
    }

    learnjs.fetchAnswer(problemNumber).then(function(data) {
        if (data.Item) {
            answer.val(data.Item.answer);
        }
    });

    view.find('.check-btn').click(checkButtonOnClick);

    learnjs.applyObject(data, view);

    return view;
    //var title = 'Problem ' + problem + ' coming soon!'; 
    //return $('<div class="problem-view">').text(title);
};

learnjs.landingView = function() {
    return learnjs.template('landing-view');
};

learnjs.profileView = function() {
    var view = learnjs.template('profile-view');
    learnjs.identity.done(function(identity) {
        view.find('.email').text(identity.email);
    });
    return view;
};

learnjs.buildCorrectFlash = function (problemNum) {
    var correctFlash = learnjs.template('correct-flash');
    var nextLink = correctFlash.find('a');
    if (problemNum < learnjs.problems.length) {
        nextLink.attr('href', '#problem-' + (problemNum + 1));
    } else {
        nextLink.attr('href', '#');
        nextLink.text("You're Finished!");
    }
    return correctFlash;
};

learnjs.addProfileLink = function(profile) {
    var link = learnjs.template('profile-link');
    link.find('a').text(profile.email);
    $('.signin-bar').prepend(link);
};

learnjs.showView = function(hash) {
    var routes = {
        '#problem': learnjs.problemView,
        '#profile': learnjs.profileView,
        '#': learnjs.landingView,
        '': learnjs.landingView
    };

    var hashParts = hash.split('-');
    var viewFn = routes[hashParts[0]];
    if(viewFn) {
        learnjs.triggerEvent('removingView', []);
        $('.view-container').empty().append(viewFn(hashParts[1]));
    }
};

learnjs.applyObject = function(obj, elem) {
    for (var key in obj) {
        elem.find('[data-name="' + key + '"]').text(obj[key]);
    }
};

learnjs.template = function(name) {
    return $('.templates .' + name).clone();
};

learnjs.flashElement = function(elem, content) {
    elem.fadeOut('fast', function() {
        elem.html(content);
        elem.fadeIn();
    });
};

learnjs.triggerEvent = function(name, args) {
    $('.view-container>*').trigger(name, args);
};

learnjs.flashElement = function(elem, content) {
    elem.fadeOut('fast', function() {
        elem.html(content);
        elem.fadeIn();
    });
};

learnjs.onReady = function(){
    window.onhashchange = function(){
        learnjs.showView(window.location.hash);
    };
    learnjs.showView(window.location.hash);
    learnjs.identity.done(learnjs.addProfileLink);
};

learnjs.problems = [
    {
        description: "What is truth?",
        code: "function problem() { return __; }"
    },
    {
        description: "Simple math",
        code: "function problem() { return 42 === 6 * __; }"
    }
];

learnjs.identity = new $.Deferred();

learnjs.awsRefresh = function() {
    var deferred = new $.Deferred();
    AWS.config.credentials.refresh(function(err) {
        if (err) {
            deferred.reject(err);
        } else {
            deferred.resolve(AWS.config.credentials.identityId);
        }
    });

    return deferred.promise();
};

learnjs.sendDbRequest = function(req, retry) {
    var promise = new $.Deferred();
    req.on('error', function(error){
        if (error.code === "CredentialsError") {
            learnjs.identity.then(function(identity) {
                return identity.refresh().then(function() {
                    return retry();
                }, function() {
                    promise.reject(resp);
                });
            });
        } else {
            promise.reject(error);
        }
    });

    req.on('success', function(resp) {
        promise.resolve(resp.data);
    });

    req.send();
    return promise;
};

learnjs.saveAnswer = function(problemId, answer) {
    return learnjs.identity.then(function(identity) {
        var db = new AWS.DynamoDB.DocumentClient();
        var item = {
            TableName: 'learnjs',
            Item: {
                userId: identity.id,
                problemId: problemId,
                answer: answer
            }
        };

        return learnjs.sendDbRequest(db.put(item), function() {
            return learnjs.saveAnswer(problemId, answer);
        });
    });
};

learnjs.fetchAnswer = function(problemId) {
    return learnjs.identity.then(function(identity) {
        var db = new AWS.DynamoDB.DocumentClient();
        var item = {
            TableName: 'learnjs',
            Key: {
                userId: identity.id,
                problemId: problemId
            }
        };

        return learnjs.sendDbRequest(db.get(item), function() {
            return learnjs.fetchAnswer(problemId);
        });
    });
};

function googleSignIn(googleUser) {
    //console.log(arguments);
    function refresh() {
        return gapi.auth2.getAuthInstance().signIn({
            prompt: 'login'
        }).then(function(userUpdate) {
            var creds = AWS.config.credentials;
            var newToken = userUpdate.getAuthResponse().id_token;
            creds.params.Logins['accounts.google.com'] = newToken;
            return learnjs.awsRefresh().then(function(id) {
                learnjs.identity.resolve({
                    id: id,
                    email: googleUser.getBasicProfile().getEmail(),
                    refresh: refresh
                });
            });
        });
    };

    var id_token = googleUser.getAuthResponse().id_token;
    AWS.config.update({
        region: 'us-east-1',
        credentials: new AWS.CognitoIdentityCredentials({
            IdentityPoolId: learnjs.poolId,
            Logins: {
                'accounts.google.com': id_token
            }
        })
    });
    learnjs.awsRefresh().then(function(id) {
        learnjs.identity.resolve({
            id: id,
            email: googleUser.getBasicProfile().getEmail(),
            refresh: refresh
        });
    });
}