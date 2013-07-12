# Ajax Replay

If you prefer to use live api calls in your javascript based tests, Ajax Replay is for you.  Philosophically I prefer to use live api data in my tests so that if the api responses change I can still rest assured that my application will continue to work.  Ideally api responses shouldn't change, but in the real world that is seldom the case.  Accidents happen.

Ajax Replay is a simple way to allow you to use real api calls in your tests/specs, without paying the performance penalty.  If you are familiar with **[vcr](https://github.com/vcr/vcr)** for ruby, this is similar, but completely javascript/front end based.  Once Ajax Replay is loaded it takes over XMLHttpRequest and from then on will automatically cache all ajax calls and responses into localstorage.  Subsequent ajax calls that match the same method+url+params will immediately respond with the stored response.

So in short, the first time you run a test it will hit the live server you were calling, but after that all responses are local and really fast.  What you might expect to see is that the first time running a test suite a particular test might take a few seconds (depending on api server response speed), but subsequent runs will take only milliseconds.

This implementation is test harness agnostic.  I prefer **[jasmine](http://pivotal.github.io/jasmine/)** as a test suite, but Ajax Replay doesn't care if you use jasmine or not.

## Performance

In my experience using a localstorage cache for api calls results in very speedy performance in almost all cases, however there is one case where it can kill your performance.  When localstorage gets full of lots of little items I've noticed significant slow down of the browser, to the point where you can wonder if it is functioning at all.

If you add Ajax Replay to your tests and notice that your browser slows to a crawl, then you are likely making a LOT of unique api calls in your test, and ending up with a very full and fragmented localstorage.  You will need to change your tests, or set Ajax Replay to not cache on certain tests.  To do this set *ajaxReplay.noCache = true*.  This will force all calls out onto the network, and not cache the responses.  When you are ready for caching again, set it back to false.

## Requirements

AjaxReplay assumes a modern browser environment.  For me, this means the availability of XMLHttpRequest and localStorage.  Basically, make sure you are running inside recent chrome, firefox or IE 8+.  IE prior to version 8 didn't have XMLHttpRequest or localStorage.

## Setup

Setup is fairly trivial.  The only requirement is that you load Ajax Replay before any other libraries get a hold on the XMLHttpRequest object.  In practice this means making sure that Ajax Replay is the first script load, or if you use require.js, make sure that jquery or underscore or any other library that makes ajax calls have a dependency on Ajax Replay, so it loads up first.  If you use **[require.js](http://requirejs.org/)** require will load first and get a handle on the XHR object, so none of your local scripts will end up cached by Ajax Replay.

That's it.  You don't need to do anything else.  Ajax Replay will take over all XHR functions and silently cache items as they are called.

## Documentation

For documentation see the docs folder or http://mbradshawabs.github.io/ajaxreplay/docs/.