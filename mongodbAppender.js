var layouts = require('log4js').layouts,
	mongoose = require('mongoose'), 
	Schema = mongoose.Schema, 
	util = require('util');

var LogMessageSchema = new Schema({
	time: Date, 
	msg: String, 
	category: String, 
	level: String
});

// url = 'mongodb://username:password@localhost/db'
function init(url){
	url = url || 'mongodb://localhost/log';
	mongoose.connect(url);
}
var LogMessage = mongoose.model('LogMessage', LogMessageSchema);

function log(event) {
	new LogMessage({ 
		time: event.startTime, 
		msg: event.data, 
		category: event.categoryName, 
		level: event.level
	}).save(function(err) {
		//console.log('err: ',err);
	});
}

function mongodbAppender(layout) {
    layout = layout || layouts.colouredLayout;
    return function(loggingEvent) {
		loggingEvent.data = formatLogData(loggingEvent.data);
		log(loggingEvent);
    };
}

function configure(config) {
    var layout;
    if (config.layout) {
		layout = layouts.layout(config.layout.type, config.layout);
    }
    return consoleAppender(layout);
}

function formatLogData(logData) {
    var output = "",
	data = Array.isArray(logData) ? logData.slice() : Array.prototype.slice.call(arguments)
    format = data.shift(), 
	replacementRegExp = /%[sdj]/g;

    if (typeof format === "string") {
        output = format.replace(replacementRegExp, function(match) {
            switch (match) {
            case "%s": return new String(data.shift());
            case "%d": return new Number(data.shift());
            case "%j": return JSON.stringify(data.shift());
            default:
                return match;
            }
        });
    } else {
        //put it back, it's not a format string
        data.unshift(format);
    }

    data.forEach(function (item) {
        if (output) {
            output += ' ';
        }
        if (item && item.stack) {
            output += item.stack;
        } else {
            output += util.inspect(item);
        }
    });

    return output;
}

exports.name = "mongodbAppender";
exports.appender = mongodbAppender;
exports.configure = configure;
exports.init = init;