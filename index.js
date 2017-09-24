const ComponentFactory = require('./ComponentFactory');

module.exports = function(content){
    new ComponentFactory(this, content);
}