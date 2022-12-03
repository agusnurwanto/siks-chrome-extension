try {
  	importScripts(
	  	"/config.js",
	  	"js/crypto-js.min.js",
	  	"js/background/promise.js",
		"js/background/bg-functions.js",
		"js/background/background.js"
  	);
} catch (e) {
  	console.log(e);
}