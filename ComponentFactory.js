const loaderUtils = require('loader-utils');
const jqlite = require('chestnut-utils').jqlite;

function stringify(str, isArraySel) {
    str = str || '';
    var htmlArr = str.replace(/\\/g, "\\\\").replace(/\\/g, "\\/").replace(/\'/g, "\\\'").split('\n');
    var len = htmlArr.length;
    var outArr = [];
    if (isArraySel) {
        outArr.push("[");
        htmlArr.forEach(function (value, index) {

            if (index === len - 1) {
                outArr.push("\'" + value + "\'");
            } else {
                if (value !== "") outArr.push("\'" + value + "\',\n");
            }

        });
        outArr.push("].join(\"\\n\");");
    } else {
        htmlArr.forEach(function (value, index) {

            if (index === len - 1) {
                outArr.push("\'" + value + "\';");
            } else {
                if (value !== "") outArr.push("\'" + value + "\'+\n");
            }

        });
    }

    return outArr.join("");
}

function queryToParams(obj){
    var arr = [];
    for(var k in obj){
        arr.push(k+'='+obj[k]);
    }
    return arr.join('&');
}


class ComponentFactory {

    constructor(loaderContext, content) {

        this.loaderContext = loaderContext;

        const options = loaderUtils.getOptions(loaderContext) || {};

        this.initOptions(options);
        
        this.query = options;

        this.$ = jqlite(content);

        const type = this.$('script').attr('type');

        if(options.only === 'css'){
            this.createCssModule();
        }else if (type === 'text/javascript') {
            this.createStringModule();
        } else {
            this.createComponent();
        }

        this.createModule(this.$module);
    }

    initOptions(options){
        if(!options.cssloader) options.cssloader = 'style-loader!css-loader!postcss-loader';
        if(!options.csscache) options.csscache = '__auicssloader__';

        this.cssloader = options.cssloader;
        delete options.cssloader;
        
        this.cssStrCacheKey = options.csscache;
    }

    getPathFromRemainingRequest(){
        return loaderUtils.getRemainingRequest(this.loaderContext).split('!').pop();
    }

    set cssCache(str){
        if(!global[this.cssStrCacheKey]) global[this.cssStrCacheKey] = {};
        const key = this.getPathFromRemainingRequest();
        global[this.cssStrCacheKey][key] = str;
    }

    get cssCache(){
        const key = this.getPathFromRemainingRequest();
        return (global[this.cssStrCacheKey] || {})[key] || '';
    }

    createCssModule(){
        this.$module = this.cssCache;
    }

    trim(str){
        if(!str) return str;
        return str.trim();
    }

    createStringModule() {
        const $ = this.$;
        const moduleStr = this.trim($('script').html());

        const funcFragments = [
            'const __mod__ = {exports:{}};',
            'const __str__ = ' + stringify(moduleStr, true)+';',
            '(new Function("module", __str__))(__mod__);',
            "module.exports = __mod__.exports;"
        ];

        this.$module = funcFragments.join('\n');
    }

    decompose() {
        const decompose = this._decompose;
        if(decompose) return decompose;
        const $ = this.$;
        const templateStr = this.trim($('ui').html());
        const moduleStr = this.trim($('script').html());
        const styleStr = this.trim($('style').html());
        return this._decompose = {
            templateStr: templateStr,
            moduleStr: moduleStr,
            styleObj: {
                type: $('style').attr('type'),
                text: styleStr
            }
        }
    }

    parseStyle (styleStr){
        const imports = [];
        styleStr = (styleStr||'').replace(/\@import[ ]+url[ ]*\([ ]*([^ \)]+)[ ]*\)[ ]*;?/g, function(s, s1){
            if(s1.indexOf('.')===0){
                imports.push('require("'+s1+'");');
                return '';
            }
            return s;
        });
        return {
            imports: imports,
            styleStr: stringify(styleStr, true)
        }
    }

    makeCssReqirePath(){
        const { templateStr, moduleStr, styleObj } = this.decompose();
        this.cssCache = styleObj.text;
        const params = queryToParams(this.query);
        const cssRequirePaths = [
            'aui-loader?only=css' + (params?'&'+params:''),
            './' + loaderUtils.getRemainingRequest(this.loaderContext).split(/[\/\\]/g).pop()
        ];

        if(styleObj.type) cssRequirePaths.unshift(styleObj.type+'-loader');

        const defaultLoader = this.cssloader;
        cssRequirePaths.unshift(defaultLoader);

        return cssRequirePaths.join('!');
    }

    createComponent() {
        const { templateStr, moduleStr, styleObj } = this.decompose();
        const funcFragments = [
            moduleStr,
            '',
            '(function(){',
            'var __$$curComponent$$__ = module.exports.default || module.exports;',
            'if(!__$$curComponent$$__.tag) __$$curComponent$$__.tag = __$$curComponent$$__.name;',
            'if(!__$$curComponent$$__.template) __$$curComponent$$__.template = ' + stringify(templateStr, true) + ';',
            'require("agile-ui").AuiComponent.create(__$$curComponent$$__);',
            '})()',
        ];

        funcFragments.unshift.call(funcFragments, 'require("'+this.makeCssReqirePath()+'");');
        
        this.$module = funcFragments.join('\n');

        
    }

    createModule(){
        this.loaderContext.callback(null, this.$module);
    }

    getModule() {
        return this.$module;
    }

}

module.exports = ComponentFactory;