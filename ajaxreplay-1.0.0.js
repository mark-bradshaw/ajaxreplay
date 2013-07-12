// Ajax Replay v1.0.0
// https://github.com/mbradshawabs/ajaxreplay
// http://mbradshawabs.github.io/ajaxreplay/

// If you prefer to use live api calls in your javascript based tests, Ajax Replay is for you.  Philosophically I prefer to use live api data in my tests so that if the api responses change I can still rest assured that my application will continue to work.  Ideally api responses shouldn't change, but in the real world that is seldom the case.  Accidents happen.

// Ajax Replay is a simple way to allow you to use real api calls in your tests/specs, without paying the performance penalty.  If you are familiar with **[vcr](https://github.com/vcr/vcr)** for ruby, this is similar, but completely javascript/front end based.  Once Ajax Replay is loaded it takes over XMLHttpRequest and from then on will automatically cache all ajax calls and responses into localstorage.  Subsequent ajax calls that match the same method+url+params will immediately respond with the stored response.

// So in short, the first time you run a test it will hit the live server you were calling, but after that all responses are local and really fast.  What you might expect to see is that the first time running a test suite a particular test might take a few seconds (depending on api server response speed), but subsequent runs will take only milliseconds.

// This implementation is test harness agnostic.  I prefer **[jasmine](http://pivotal.github.io/jasmine/)** as a test suite, but Ajax Replay doesn't care if you use jasmine or not.  The only requirement is that you load Ajax Replay before any other libraries get a hold on the XMLHttpRequest object.  In practice this means making sure that Ajax Replay is the first script load, or if you use require.js, make sure that jquery or underscore or ... have a dependency on Ajax Replay.
var ajaxReplay = {

  // If you want to disable Ajax Replay for some ajax calls, just set noCache to true.  When you are ready for caching again, set it back to false.
  noCache: false,

  // First save a reference to the original XMLHttpRequest.  If for some reason you need to get back at the original XHR object in your testing, here it is.
  originalXHR: window.XMLHttpRequest
};

// Now replace XMLHttpRequest with a new dummy constructor object for everyone else to use.
window.XMLHttpRequest = function() {};

// We only need to duplicate a few XHR functions.  The first is **open**.  When a new XHR object is getting setup the open function will be called with most of the necessary bits and pieces.  We'll just store that info for later use.  At this point, no network calls have been initiated, so we do nothing.
XMLHttpRequest.prototype.open = function(method, url, async, user, pass) {
  this.method = method;
  this.url = url;
  this.async = async;
  this.user = user;
  this.pass = pass;

  // This will store any future headers that will be set.
  this.headers = [];

  // The cacheid that will be used will incorporate the http method and url.  We prepend 'ajaxreplay' to make sure that we can clear Ajax Replay objects back out of the cache at will.
  this.cacheid = 'ajaxreplay'+this.method+this.url;
};

// We'll also provide a simple method to set headers.  These are not considered part of the cacheid, so some cache collisions are possible if you expect different headers to provide different results.
XMLHttpRequest.prototype.setRequestHeader = function(name, value) {
  this.headers.push({name: name, value: value});
};

// **Send** is where all the interesting stuff happens.  Send will make the determination on whether to serve back a response from the cache (localStorage) or send off a network call.
XMLHttpRequest.prototype.send = function(params) {
  // If a POST is being sent with parameters, add those on to the cacheid.
  if (params) {
    this.cacheid += params;
  }

  // The cache is stored in localStorage, for simplicity.  LocalStorage has a 5 meg limit, and I've witness significant slow down if you have a LocalStorage that is full.  When there are lots of little items, the browser will crawl.  If you start noticing this, you probably will want to clear LocalStorage out (*localStorage.clear()).  The cache has no expiration date associated with each item, so they are stored permanently.
  if (!ajaxReplay.noCache && localStorage[this.cacheid]) {
    // The request is already stored in the cache.  Switch to a final readyState.
    this.readyState = 4;
    // Set the response status to 200 indicating all is well.
    this.status = 200;
    // Pull the response text out of storage.
    this.responseText = localStorage[this.cacheid];
    // If the caller wants to get a callback (this is almost always the case) then fire off the callback function.
    if (this.onreadystatechange) {
      this.onreadystatechange.call(this);
    }
  }

  // If the response has not been previously cached, then we send off an AJAX call to the original location.
  else {
    // Keep a record of this around for future reference.
    var me = this;
    // Pull up the original XHR object.
    var xhr = new ajaxReplay.originalXHR();
    // Set the AJAX call data.
    xhr.open(this.method, this.url, this.async, this.user, this.pass);

    // If any custom headers were set on Ajax Replay, set them on the XHR object.
    if (this.headers.length > 0) {
      for (var i=0, len=this.headers.length; i<len; i++) {
        xhr.setRequestHeader(this.headers[i].name, this.headers[i].value);
      }
    }

    // Now look for state chagne events.  We ignore anything that isn't readyState 4 and status 200.  We only cache those.  But we always note any state and status changes internally...
    xhr.onreadystatechange = function() {
      me.readyState = xhr.readyState;
      me.status = xhr.status;
      me.responseText = xhr.responseText;

      // if we finished (state = 4) with a 200 status and caching is enabled, save to cache.
      if (!ajaxReplay.noCache && me.readyState === 4 && me.status === 200) {
        localStorage[me.cacheid] = me.responseText;
      }

      // and fire off a callback if one has been setup.
      if (me.onreadystatechange) {
        me.onreadystatechange();
      }
    };

    // Now everything is setup, so fire off the remote call.
    xhr.send(params);
  }
};

// To clear out all cached items call **clearCache**.
ajaxReplay.clearCache = function() {
  for (var key in localStorage) {
    if (key.indexOf('ajaxreplay') !== -1) {
      localStorage.removeItem(key);
    }
  }
};
