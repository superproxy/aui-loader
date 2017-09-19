const ComponentFactory = require('./ComponentFactory');

module.exports = function(content){
    const component = new ComponentFactory(content);
    return component.getModule();
}