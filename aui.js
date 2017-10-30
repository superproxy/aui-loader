define(['agile-ui'], function(aui) {
	var styleHandlers = {
		'text' : function(o, cb) {
			cb(o);
		},
		'less' : function(o, cb) {
			require(['less'], function(less) {
				less.render(o, function(e, tree) {
					cb(tree.css);
				});
			});
		}
	};

	var getAui = function(url) {
		var xmlhttp;
		if (window.XMLHttpRequest) {// code for IE7+, Firefox, Chrome, Opera, Safari
			xmlhttp = new XMLHttpRequest();
		} else {// code for IE6, IE5
			xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
		}
		xmlhttp.open("GET", url, false);
		xmlhttp.send();
		return xmlhttp.responseText || '';
	};

	var createComponent = function(anestor, templateStr, $style, cb) {
		var Component = anestor;
		var AuiComponent = aui.AuiComponent;
		//Component.style = $style.content;
		Component.template = templateStr;
		//onload(new AuiComponent(Component));

		var styleHandler = styleHandlers[$style.type] || styleHandlers['text'];

		styleHandler.call(this, $style.content || '', function(content) {
			Component.style = content || '';
			AuiComponent.create(Component);
			cb(Component);
		});
	};
	return {
		load : function(name, parentRequire, onload, config) {
			var _args = arguments;
			var auiPath = parentRequire.toUrl(name);
			var auiPaths = auiPath.split('?');
			if (auiPaths[0].split('.').pop() !== 'aui') {
				auiPaths[0] = auiPaths[0] + '.aui';
				auiPath = auiPaths.join('?');
			}
			var $aui = document.createElement('div');
			$aui.innerHTML = getAui(auiPath);
			var auiInfo = {};
			var $auiChildren = $aui.children;
			for (var i = 0,
			    len = $auiChildren.length; i < len; i++) {
				var $target = $auiChildren[i],
				    tag = ($target.tagName||'').toLowerCase();
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
});