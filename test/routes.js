
const request = require('supertest');
const mocha = require('mocha');
const assert = require("assert");
const describe = mocha.describe;
const before = mocha.before;
const after = mocha.after;
const it = mocha.it;

process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://localhost/handyapp-testing';

let app;
let jsonLogin;

describe('Test routes -', () => {

    before(done => {
            
        //start the server
        app = require('../index.js');

        app.on('testEvent', () => {
            setTimeout(() => { 
                done();
            }, 500);            
        });
        
    });
    
    after((done) => {
        app.emit('finishTest');
        done();
    });
    
    it('clean and load the test database', () => {
        return request(app).get('/init').expect(200)
        .expect(res => {
            assert(
                res != null
            );
          });
    });

    it('No root route is expected', () => {
        return request(app).get('/').expect(302); //
    });    

    it('Create new profile without picture test', () => {
        
        let data = {
            "profile": {
                "type": "client",
                "name": "New profile",
                "email": "new@hotmail.com",
                "password": "123", 
                "tel": "647 608 3027",
                "address": [
                    {
                        "street": "street address",
                        "unit": "603",
                        "city": "North york",
                        "state": "Ontario",
                        "country": "Canada",
                        "zip": "m2j0b3"
                    }
                ]
            }
        };

        return request(app)
            .post('/user/saveProfile')
            .send('data=' + JSON.stringify(data))
            .expect(200)
            .expect({ "message": "Success!" });
        
    });

    it('Login test', () => {
        return request(app)
            .post('/user/login')
            .send('data={"email": "new@hotmail.com", "password": "123"}')
            .expect(200)
            .expect(res => {
                jsonLogin = JSON.parse(res.text);

                if (jsonLogin.token === null ||
                    jsonLogin.profile === null ||
                    jsonLogin.services === null ||
                    jsonLogin.tasks === null) {

                    throw new Error('Missing information on json after login');
                }
        });

    });

    it('Update profile test', () => {
        
        let data = {
            "token": jsonLogin.token,
            "profile": {
                "type": "client",
                "name": "Updated profile",
                "email": "newUpdated@hotmail.com",
                "password": "123", 
                "tel": "647 608 3027",
                "address": [
                    {
                        "street": "street address",
                        "unit": "603",
                        "city": "North york",
                        "state": "Ontario",
                        "country": "Canada",
                        "zip": "m2j0b3"
                    }
                ]
            }
        };

        return request(app)
            .post('/user/saveProfile')
            .send('data=' + JSON.stringify(data))
            .expect(200)
            .expect({ "message": "Success!" });
        
    });
    
    it('Update profile to existing email test', () => {
        
        let data = {
            "token": jsonLogin.token,
            "profile": {
                "type": "client",
                "name": "Updated profile",
                "email": "ivanvaladares@hotmail.com",
                "password": "123", 
                "tel": "647 608 3027",
                "address": [
                    {
                        "street": "street address",
                        "unit": "603",
                        "city": "North york",
                        "state": "Ontario",
                        "country": "Canada",
                        "zip": "m2j0b3"
                    }
                ]
            }
        };

        return request(app)
            .post('/user/saveProfile')
            .send('data=' + JSON.stringify(data))
            .expect(403);
        
    });  
    

    it('Create new profile with picture test', () => {
        
        let data = {
            "profile": {
                "picture": encodeURIComponent("data:image/jpeg;base64,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"),
                "type": "client",
                "name": "New profile",
                "email": "withpicture@hotmail.com",
                "password": "123", 
                "tel": "647 608 3027",
                "address": [
                    {
                        "street": "street address",
                        "unit": "603",
                        "city": "North york",
                        "state": "Ontario",
                        "country": "Canada",
                        "zip": "m2j0b3"
                    }
                ]
            }
        };

        return request(app)
            .post('/user/saveProfile')
            .send('data=' + JSON.stringify(data))
            .expect(200)
            .expect({ "message": "Success!" });
        
    });


    it('Search professional test', () => {

        let data = {
            "token": jsonLogin.token,
            "service": jsonLogin.services[0]._id,
            "location": [43.7785100, -79.346100]
        };

        return request(app)
            .post('/user/searchProfessionals')
            .send('data=' + JSON.stringify(data))
            .expect(200)
            .expect(res => {

                let jsonResp = JSON.parse(res.text);

                if (jsonResp.results === undefined || 
                    jsonResp.results.length <= 0) {

                    throw new Error('Missing information on json after search for professionals');
                }

        });
        
    });
    
});