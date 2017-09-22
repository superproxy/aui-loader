
const jqlite = require('chestnut-utils').jqlite;

function stringify(str, isArraySel) {

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


class ComponentFactory {

    constructor(loaderContext, content) {

        this.loaderContext = loaderContext;

        this.$ = jqlite(content);

        const type = this.$('script').attr('type');

        if (type === 'text/javascript') {
            this.createStringModule();
        } else {
            this.createComponent();
        }
    }

    createStringModule() {
        const $ = this.$;
        const moduleStr = $('script').html();

        const funcFragments = [
            'const __mod__ = {exports:{}};',
            'const __str__ = ' + stringify(moduleStr, true)+';',
            '(new Function("module", __str__))(__mod__);',
            "module.exports = __mod__.exports;"
        ];

        this.$module = funcFragments.join('\n');
    }

    decompose() {
        const $ = this.$;
        const templateStr = $('ui').html();
        const moduleStr = $('script').html();
        const styleStr = $('style').html();
        return {
            templateStr: templateStr,
            moduleStr: moduleStr,
            styleStr: styleStr
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

    createComponent() {
        const { templateStr, moduleStr, styleStr } = this.decompose();
        const styleStruct = this.parseStyle(styleStr);
        const funcFragments = [
            moduleStr,
            '',
            'module.exports.tag = module.exports.tag || module.exports.name;',
            'module.exports.template = ' + stringify(templateStr, true) + ';',
            'module.exports.style = ' + styleStruct.styleStr + ';',
            'require("agile-ui").AuiComponent.create(module.exports);'
        ];

        funcFragments.unshift.apply(funcFragments, styleStruct.imports);

        this.$module = funcFragments.join('\n');
    }

    getModule() {
        return this.$module;
    }

}

module.exports = ComponentFactory;