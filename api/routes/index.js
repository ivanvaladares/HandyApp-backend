exports.init = (app) => {

    app.use('/init', require('./init-routes'));  //todo: remove this route
    app.use('/user', require('./user-routes')); 
    app.use('/task', require('./task-routes')); 
    app.use('/review', require('./review-routes')); 
    app.use('/service', require('./service-routes')); 

};