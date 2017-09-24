# 关于

aui-loader是用于agile-ui框架在webpack中自动化构建开发的工具

agile-ui介绍和使用请查看https://github.com/nandy007/agile-ui

aui-loader可以将任意符合如下格式的aui后缀文件加载为webpack的模块：

	<ui>
	<!-- some html fragment -->
	</ui>
	
	<script>
	/*
	function Component(){
	}
	Component.prototype = {
	};
	Component.tag = 'componentName';
	module.exports = Component;
	*/
	</script>
	
	<style type="blank|less|sass">
	
	</style>