describe('LearnJS', function() {
    it('can show a problem view', function(){
        learnjs.showView('#problem-1');
        expect($('.view-container .problem-view').length).toEqual(1);
    });

    it('shows the landing page when there is no hash', function() {
        learnjs.showView('');
        expect($('.view-container .landing-view').length).toEqual(1);
    });

    it('passes the hash view parameter to the view function', function(){
        spyOn(learnjs, 'problemView');
        learnjs.showView('#problem-42');
        expect(learnjs.problemView).toHaveBeenCalledWith('42');
    });

    it('invokes the router when loaded', function() {
        spyOn(learnjs, 'showView');
        learnjs.onReady();
        expect(learnjs.showView).toHaveBeenCalledWith(window.location.hash);
    });

    it('subscribes to hash change event', function() {
        learnjs.onReady();
        spyOn(learnjs, 'showView');
        $(window).trigger('hashchange');
        expect(learnjs.showView).toHaveBeenCalledWith(window.location.hash);
    });

    it('returns a named template', function() {
        var template = learnjs.template('problem-view');
        expect(template).toBeDefined();
    });

    describe('problem view', function(){
        var view;

        beforeEach(function() {
            view = learnjs.problemView('1');
        });

        it('has a title that includes the problem number', function() {
            expect(view.find('.title').text()).toEqual('Problem number 1');
        });

        it('has a description that binds to problem data', function() {
            expect(view.find('p[data-name="description"]').text()).toEqual('What is truth?');
        });

        it('can bind data to an element using data attributes', function () {
            var data = [{ description: "test description" }];
            var element = $('<p>', { 'data-name': 'description', 'class': 'test'});
            var testView = $('<div></div>').append(element);
            learnjs.applyObject(data[0], testView);

            expect(testView.find('.test').text()).toEqual('test description');
        });

        describe('answer section', function() {
            it('can check a correct answer by hitting a button', function() {
                view.find('.answer').val('true');
                view.find('.check-btn').click();
                expect(view.find('.result > div > span').text()).toEqual('Correct!');
            });

            it('calls the build correct flash function with a correct answer', function() {
                spyOn(learnjs, 'buildCorrectFlash');
                view.find('.answer').val('true');
                view.find('.check-btn').click();
                expect(learnjs.buildCorrectFlash).toHaveBeenCalledWith(1);
            });

            it('rejects an incorrect answer', function() {
                view.find('.answer').val('false');
                view.find('.check-btn').click();
                expect(view.find('.result').text()).toEqual('Incorrect!');
            });
        });
    });

});