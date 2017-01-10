'use strict';
var learnjs = {};

learnjs.problemView = function(problem) {
    var view = learnjs.template('problem-view');
    view.find('.title').text('Problem number ' + problem);

    var problemNumber = parseInt(problem, 10);
    var data = learnjs.problems[problemNumber - 1];
    var resultFlash = view.find('.result');

    function checkAnswer() {
        var answer = view.find('.answer').val();
        var test = data.code.replace('__', answer) + '; problem();';

        return eval(test);
    }

    function checkButtonOnClick() {
        if (checkAnswer()) {
            var flash = learnjs.buildCorrectFlash(problemNumber);

            learnjs.flashElement(resultFlash, flash);            
        } else {
            learnjs.flashElement(resultFlash, 'Incorrect!');
        }
        
        return false;
    }

    view.find('.check-btn').click(checkButtonOnClick);

    learnjs.applyObject(data, view);

    return view;
    //var title = 'Problem ' + problem + ' coming soon!'; 
    //return $('<div class="problem-view">').text(title);
};

learnjs.landingView = function() {
    return learnjs.template('landing-view');
}

learnjs.buildCorrectFlash = function (problemNum) {
    var correctFlash = learnjs.template('correct-flash');
    var link = correctFlash.find('a');
    if (problemNum < learnjs.problems.length) {
        link.attr('href', '#problem-' + (problemNum + 1));
    } else {
        link.attr('href', '');
        link.text("You're Finished!");
    }
    return correctFlash;
};

learnjs.showView = function(hash) {
    var routes = {
        '#problem': learnjs.problemView,
        '': learnjs.landingView
    };

    var hashParts = hash.split('-');
    var viewFn = routes[hashParts[0]];
    if(viewFn) {
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
}

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
}

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
