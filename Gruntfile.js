module.exports = function (grunt) {

	grunt.loadNpmTasks('grunt-curl');
	grunt.loadNpmTasks('grunt-zip');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-closure-compiler');
	grunt.loadNpmTasks('grunt-contrib-compress');

	var dirs = {
		common: 'common',
		browser: 'browser',
		static: 'browser/static',
		dest: 'browser/static',
		compat: 'browser/compat',
		ws_js: 'submodules/web-socket-js',
		ably_common: 'submodules/ably-common',
		tools_compiler: __dirname + '/tools/closure-compiler'
	};

	function compilerSpec(src, dest) {
		return {
			closurePath: dirs.tools_compiler,
			js: src,
			jsOutputFile: (dest || src.replace(/\.js/, '.min.js')),
			maxBuffer: 500,
			noreport: true,
			options: { compilation_level: 'SIMPLE_OPTIMIZATIONS' }
		};
	}

	grunt.initConfig({
		dirs: dirs,
		curl: {
			'compiler': {
				src: 'http://dl.google.com/closure-compiler/compiler-latest.zip',
				dest: '<%= dirs.tools_compiler %>/build/compiler-latest.zip'
			}
		},
		unzip: {
			'compiler': {
				src: '<%= dirs.tools_compiler %>/build/compiler-latest.zip',
				dest: '<%= dirs.tools_compiler %>/build'
			}
		},
		copy: {
			'compat-pubnub-js': {
				src: '<%= dirs.compat %>/pubnub.js',
				dest: '<%= dirs.dest %>/compat-pubnub.js',
				flatten: true,
				nonull: true
			},
			'compat-pubnub-md': {
				src: '<%= dirs.compat %>/pubnub.md',
				dest: '<%= dirs.dest %>/compat-pubnub.md',
				flatten: true
			},
			'compat-pusher-md': {
				src: '<%= dirs.compat %>/pusher.md',
				dest: '<%= dirs.dest %>/compat-pusher.md',
				flatten: true
			}
		},
		concat: {
			ably: {
				src: [
					'<%= dirs.browser %>/ably-prologue.js',

					'<%= dirs.common %>/lib/transport/connectionerror.js',

					'<%= dirs.browser %>/lib/util/bufferutils.js',
					'<%= dirs.browser %>/lib/util/cookie.js',
					'<%= dirs.browser %>/lib/util/defaults.js',
					'<%= dirs.browser %>/lib/util/http.js',
					'<%= dirs.browser %>/lib/util/crypto.js',
					'<%= dirs.browser %>/lib/util/domevent.js',
					'<%= dirs.browser %>/lib/util/msgpack.js',

//					'<%= dirs.ws_js %>/swfobject.js',
//					'<%= dirs.ws_js %>/web_socket.js',

					'<%= dirs.common %>/lib/util/eventemitter.js',
					'<%= dirs.common %>/lib/util/logger.js',
					'<%= dirs.common %>/lib/util/utils.js',
					'<%= dirs.common %>/lib/util/multicaster.js',

					'<%= dirs.common %>/lib/types/message.js',
					'<%= dirs.common %>/lib/types/presencemessage.js',
					'<%= dirs.common %>/lib/types/protocolmessage.js',

					'<%= dirs.common %>/lib/transport/connectionmanager.js',
					'<%= dirs.common %>/lib/transport/transport.js',
					'<%= dirs.common %>/lib/transport/websockettransport.js',
					'<%= dirs.common %>/lib/transport/comettransport.js',

					'<%= dirs.common %>/lib/client/resource.js',
					'<%= dirs.common %>/lib/client/paginatedresource.js',
					'<%= dirs.common %>/lib/client/auth.js',
					'<%= dirs.common %>/lib/client/rest.js',
					'<%= dirs.common %>/lib/client/realtime.js',
					'<%= dirs.common %>/lib/client/connectionstatechange.js',
					'<%= dirs.common %>/lib/client/connection.js',
					'<%= dirs.common %>/lib/client/channel.js',
					'<%= dirs.common %>/lib/client/realtimechannel.js',
					'<%= dirs.common %>/lib/client/presence.js',

					'<%= dirs.browser %>/lib/transport/jsonptransport.js',
					'<%= dirs.browser %>/lib/transport/xhrrequest.js',
					'<%= dirs.browser %>/lib/transport/xhrtransport.js',
					'<%= dirs.browser %>/lib/transport/iframetransport.js',
//					'<%= dirs.browser %>/lib/transport/flashtransport.js',

					'<%= dirs.browser %>/ably-epilogue.js'
				],
				dest: '<%= dirs.dest %>/ably.js',
				nonull: true
			},
			iframe: {
				src: [
					'<%= dirs.browser %>/prologue.js',
					'<%= dirs.common %>/lib/util/eventemitter.js',
					'<%= dirs.common %>/lib/util/logger.js',
					'<%= dirs.common %>/lib/util/multicaster.js',
					'<%= dirs.common %>/lib/util/utils.js',
					'<%= dirs.common %>/lib/types/protocolmessage.js',
					'<%= dirs.browser %>/lib/util/defaults.js',
					'<%= dirs.browser %>/lib/util/domevent.js',
					'<%= dirs.browser %>/lib/transport/xhrrequest.js',
					'<%= dirs.browser %>/lib/transport/iframeagent.js',
					'<%= dirs.browser %>/epilogue.js'
				],
				dest: '<%= dirs.dest %>/iframe.js',
				nonull: true
			},
			pusher: {
				src: [
					'<%= dirs.browser %>/prologue.js',
					'<%= dirs.common %>/lib/util/eventemitter.js',
					'<%= dirs.common %>/lib/util/utils.js',
					'<%= dirs.browser %>/compat/pusher.js',
					'<%= dirs.browser %>/epilogue.js'
				],
				dest: '<%= dirs.dest %>/compat-pusher.js',
				nonull: true
			}
		},
		'closure-compiler': {
			'ably-js': compilerSpec('<%= dirs.static %>/ably.js'),
			'iframe-js': compilerSpec('<%= dirs.static %>/iframe.js'),
			'pubnub-js': compilerSpec('<%= dirs.static %>/compat-pubnub.js'),
			'pusher-js': compilerSpec('<%= dirs.static %>/compat-pusher.js')
		},
		compress: {
			main: {
				options: {
					mode: 'gzip'
				},
				expand: true,
				cwd: dirs.static,
				src: '*.{js,html}',
				dest: dirs.static
			}
		}
	});

	grunt.registerTask('compiler', ['curl:compiler', 'unzip:compiler']);
	grunt.registerTask('all', ['copy', 'concat', 'closure-compiler', 'compress']);
	grunt.registerTask('default', 'all');
};
