const ComponentFactory = require('./ComponentFactory');

module.exports = function(content){
    const component = new ComponentFactory(this, content);
    return component.getModule();
}