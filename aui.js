define(['agile-ui'], function(aui) {
	var base = document.getElementsByTagName('base');
	base = base && base[0] && base[0] && base[0].href;
	var pagePath = (base || window.location.href.split('#')[0].split('?')[0]).split('/');
	pagePath[pagePath.length - 1] = '';
	pagePath = pagePath.join('/');
	
	var styleHandlers = {
		'text' : function(o, cb) {
			cb(o);
		},
		'less' : function(o, cb) {
			var fileUrl = this[0];
			require(['less', 'lessc', 'normalize'], function(less, lessc, normalize) {
				var parser = new lessc.Parser(window.less);
				parser.parse(o, function(err, tree) {
					if (err)
						return cb('');
					var css = normalize(tree.toCSS(), normalize.absoluteURI(fileUrl, pagePath), pagePath);
					cb(css);
				}, window.less);
			});
		}
	};

	var createComponent = function(anestor, templateStr, $style, cb) {
		var Component = anestor;
		var AuiComponent = aui.AuiComponent;
		//Component.style = $style.content;
		Component.template = templateStr;
		//onload(new AuiComponent(Component));

		var styleHandler = styleHandlers[$style.type] || styleHandlers['text'];

		styleHandler.call(this, $style.content || '', function(content) {
			if(content) Component.style = content;
			AuiComponent.create(Component);
			cb(Component);
		});
	};
	var _loader = {
		getAui: function(url) {
			var xmlhttp;
			if (window.XMLHttpRequest) {// code for IE7+, Firefox, Chrome, Opera, Safari
				xmlhttp = new XMLHttpRequest();
			} else {// code for IE6, IE5
				xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
			}
			xmlhttp.open("GET", url, false);
			xmlhttp.send();
			return xmlhttp.responseText || '';
		},
		load : function(name, parentRequire, onload, config) {
			var _args = arguments;
			var auiPath = parentRequire.toUrl(name);
			var auiPaths = auiPath.split('?');
			if (auiPaths[0].split('.').pop() !== 'aui') {
				auiPaths[0] = auiPaths[0] + '.aui';
				auiPath = auiPaths.join('?');
			}
			var $aui = document.createElement('div');
			$aui.innerHTML = _loader.getAui(auiPath);
			var auiInfo = {};
			var $auiChildren = $aui.children;
			for (var i = 0,
			    len = $auiChildren.length; i < len; i++) {
				var $target = $auiChildren[i],
				    tag = ($target.tagName || '').toLowerCase();
				if (tag === 'style') {
					auiInfo[tag] = {
						type : $target.getAttribute('type'),
						content : $target.innerHTML
					};
				} else {
					auiInfo[tag] = $target.innerHTML;
				}

			}

			var templateStr = auiInfo.ui,
			    moduleStr = auiInfo.script,
			    $style = auiInfo.style || {};

			if (!moduleStr) {
				return onload.error(new Error('模块[' + name + ']不符合auicomponent规范'));
			}
			try {
				var func = new Function('module', 'exports', 'require', 'define', moduleStr),
				    module = {
					exports : {}
				};

				func(module, module.exports, require, function() {

					var args = Array.prototype.slice.call(arguments, 0),
					    cb = args.pop(),
					    deps = args.pop() || [];

					require(deps, function() {
						var anestor = cb.apply(cb, arguments);
						createComponent.call(_args, anestor, templateStr, $style, onload);
					});

				});
				var anestor = module.exports;
				if (anestor && typeof anestor === 'function') {
					createComponent.call(_args, anestor, templateStr, $style, onload);
				}
			} catch(e) {
				console.log(name, moduleStr, e);
				onload.error(new Error('模块[' + name + ']加载失败'));
			}

		},
		addStyleHandler : function(k, func) {
			styleHandlers[k] = func;
		}
	};
	return _loader;
});