exports.init = (app) => {

    app.use('/init', require('./init-routes'));  //todo: remover esta rota
    app.use('/user', require('./user-routes')); 
    app.use('/task', require('./task-routes')); 
    app.use('/review', require('./review-routes')); 

};