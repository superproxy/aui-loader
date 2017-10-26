/**
 *aui-loader aui组件加载器
 *Version: 0.2.0.1509011446631
 *Author: nandy007
 *License MIT @ https://github.com/nandy007/aui-loader
*/
define(['agile-vm', 'agile-ui'], function ($, aui) {
	var styleHandlers = {
		'text': function (o, cb) {
			cb(o);
		},
		'less': function (o, cb) {
			require(['less'], function (less) {
				less.render(o, function (e, tree) {
					cb(tree.css);
				});
			});
		}
	};

	var createComponent = function (anestor, templateStr, $style, cb) {
		var Component = anestor;
		var AuiComponent = aui.AuiComponent;
		//Component.style = $style.content;
		Component.template = templateStr;
		//onload(new AuiComponent(Component));

		var styleHandler = styleHandlers[$style.type] || styleHandlers['text'];

		styleHandler.call(this, $style.content, function (content) {
			Component.style = content;
			cb(new AuiComponent(Component));
		});
	};
	return {
		load: function (name, parentRequire, onload, config) {
			var _args = arguments;
			var auiPath = parentRequire.toUrl(name);
			var auiPaths = auiPath.split('?');
			if (auiPaths[0].split('/').pop() !== 'aui') {
				auiPaths[0] = auiPaths[0] + '.aui';
				auiPath = auiPaths.join('?');
			}
			$.ajax({
				url: auiPath,
				success: function (data) {
					var $content = $('<root>' + data + '</root>'),
						templateStr = $content.children('ui').html(),
						moduleStr = $content.children('script').html(),
						$style = {
							type: $content.children('style').attr('type') || 'text',
							content: $content.children('style').html()
						};
					if (!moduleStr) {
						return onload.error(new Error('模块[' + name + ']不符合auicomponent规范'));
					}

					var func = new Function('module', 'exports', 'require', 'define', moduleStr),
						module = { exports: {} };
					func(module, module.exports, require, function () {
						var args = Array.prototype.slice.call(arguments, 0), 
							cb = args.pop(),
							deps = args.pop() || [];
						
						require(deps, function(){
							var anestor = cb.apply(cb, arguments);
							createComponent.call(_args, anestor, templateStr, $style, onload);
						});
					});
					var anestor = module.exports;
					if(anestor){
						createComponent.call(_args, anestor, templateStr, $style, onload);
					}

				},
				error: function () {
					onload.error(new Error('模块[' + name + ']加载失败'));
				}
			});

		},
		addStyleHandler: function (k, func) {
			styleHandlers[k] = func;
		}
	};
});