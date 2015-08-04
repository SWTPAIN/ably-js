"use strict";

define(['ably', 'shared_helper', 'async'], function(Ably, helper, async) {
	var rest, exports = {},
		displayError = helper.displayError,
		preAttachMessages = [1,2,3,4,5].map(function(i) {
			return { name: 'pre-attach-' + i,
				data: 'some data' }
		}),
		postAttachMessages = [1,2,3,4,5].map(function(i) {
			return { name: 'post-attach-' + i,
				data: 'some data' }
		});

	var parallelPublishMessages = function(test, channel, messages, callback) {
		var publishTasks = messages.map(function(event) {
			return function(publishCb) {
				channel.publish(event.name, event.data, publishCb);
			};
		});

		try {
			async.parallel(publishTasks, function(err) {
				if(err) {
					test.ok(false, displayError(err));
					test.done();
					return;
				}
				callback();
			});
		} catch(e) {
			console.log(e.stack);
		}
	};

	exports.setup_realtime_history = function(test) {
		test.expect(1);
		helper.setupApp(function(err) {
			if(err) {
				test.ok(false, helper.displayError(err));
			} else {
				test.ok(true, 'app set up');
			}
			test.done();
		});
	};

	exports.history_until_attach = function(test) {
		test.expect(4);
		var rest = helper.AblyRest();
		var realtime = helper.AblyRealtime();
		var restChannel = rest.channels.get('persisted:history_until_attach');

		/* first, send a number of events to this channel before attaching */
		parallelPublishMessages(test, restChannel, preAttachMessages, function(){

			/* second, connect and attach to the channel */
			try {
				realtime.connection.on('connected', function() {
					var rtChannel = realtime.channels.get('persisted:history_until_attach');
					rtChannel.attach(function(err) {
						if(err) {
							test.ok(false, 'Attach failed with error: ' + err);
							test.done();
							realtime.close();
							return;
						}

						/* third, send some more events post-attach (over rest, not using the
						 * new realtime connection) */

						parallelPublishMessages(test, restChannel, postAttachMessages, function(){

							/* fourth, query history using the realtime connection with
							 * untilAttach both true, false, and not present, checking that
							 * the right messages are returned in each case */

							var tests = [
								function(callback) {
									rtChannel.history(function(err, resultPage) {
										if(err) { callback(err); }
										var expectedLength = preAttachMessages.length + postAttachMessages.length
										test.equal(resultPage.items.length, expectedLength, 'Verify all messages returned when no params');
										callback();
									});
								},
								function(callback) {
									rtChannel.history({untilAttach: false}, function(err, resultPage) {
										if(err) { callback(err); }
										var expectedLength = preAttachMessages.length + postAttachMessages.length
										test.equal(resultPage.items.length, expectedLength, 'Verify all messages returned when untilAttached is false');
										callback();
									});
								},
								function(callback) {
									rtChannel.history({untilAttach: true}, function(err, resultPage) {
										if(err) { callback(err); }

										/* verify only the pre-attached messages are received */
										var messages = resultPage.items;
										test.equal(messages.length, preAttachMessages.length, 'Verify right number of messages returned when untilAttached is true');
										test.ok(messages.every(function(message) {
											return message.name.substring(0,10) == "pre-attach";
										}), "Verify all returned messages were pre-attach ones")
										callback();
									});
								}
							]

							async.parallel(tests, function(err){
								if(err) {
									test.ok(false, displayError(err));
									test.done();
									realtime.close();
									return;
								}
								test.done();
								realtime.close();
							})
						});
					});
				});

				var exitOnState = function(state) {
					realtime.connection.on(state, function () {
						test.ok(false, 'connection to server failed');
						test.done();
						realtime.close();
					});
				};
				exitOnState('failed');
				exitOnState('suspended');
			} catch(e) {
				test.ok(false, 'Channel attach failed with exception: ' + e.stack);
				test.done();
				realtime.close();
			}
		});
	};

	return module.exports = helper.withTimeout(exports);
});
