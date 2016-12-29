'use strict'

const fs = require('fs');
const qs = require('querystring');
const download = require('download');
const config = require('../package.json').config;

let argv = require('minimist')(process.argv.slice(2));
const [command, ...args] = argv._;
delete argv._;
const opts = argv;



// help message
const helpMessage = "Usage:\
\n  helen [command] [args]";

// help output
if (argv['h']) help();

function getCouchResponse(path, opts) {
	var url = config.helendb.url + 'helendb/' + path + '?' + qs.stringify(argv);
	console.log('fetching '+url);
	return download(url);
}

function getCouchView(view, opts) {
	return getCouchResponse('_design/main/_view/' + view);
}

function help (args, opts) {
	console.log(helpMessage);
	process.exit(0);
}

function data (args, opts) {
	var [view] = args;
	return getCouchView(view, opts).pipe(process.stdout);
}

function constants (args, opts) {
	return getCouchView('constants', opts).pipe(process.stdout);
}


const commands = {
	'data' : data,
	'help' : help
}

// execution
if(commands[command]) {
	commands[command](args, opts);
} else {
	help();
}