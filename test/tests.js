
const request = require('supertest');
const mocha = require('mocha');
const describe = mocha.describe;
const before = mocha.before;
const after = mocha.after;
const it = mocha.it;

process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://localhost/handyapp-testing';

let app;
let clientJsonLogin, professionalJsonLogin;

describe('Testing routes -', () => {

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
        return request(app).get('/init')
        .expect(200)
        .expect(res => {

            if (res.text === "") {
                throw new Error('Missing information on json after load the test database');
            }

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

    it('Failed Login test', () => {
        return request(app)
            .post('/user/login')
            .send('data={"email": "new@hotmail.com", "password": "xxx"}')
            .expect(401);
    });
    
    it('Correct Login test', () => {
        return request(app)
            .post('/user/login')
            .send('data={"email": "new@hotmail.com", "password": "123"}')
            .expect(200)
            .expect(res => {
                clientJsonLogin = JSON.parse(res.text);

                if (clientJsonLogin.token === null ||
                    clientJsonLogin.profile === null ||
                    clientJsonLogin.services === null ||
                    clientJsonLogin.tasks === null) {

                    throw new Error('Missing information on json after login');
                }
        });

    });

    it('Update profile test', () => {
        
        let data = {
            "token": clientJsonLogin.token,
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

    it('Update profile with a false token test', () => {
        
        let data = {
            "token": "123123132132121321",
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
            .expect(403);
        
    });    

    it('Check if profile was updated test', () => {
        return request(app)
            .post('/user/login')
            .send('data={"email": "newUpdated@hotmail.com", "password": "123"}')
            .expect(200)
            .expect(res => {
                let login = JSON.parse(res.text);

                if (login.token === null ||
                    login.profile === null ||
                    login.services === null ||
                    login.tasks === null ||
                    login.profile.name !== "Updated profile") {

                    throw new Error('Missing information on json after login');
                }
        });

    });    
    
    it('Update profile to existing email test', () => {
        
        let data = {
            "token": clientJsonLogin.token,
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

    it('Create new professional profile with picture test', () => {
        
        let data = {
            "profile": {
                "picture": encodeURIComponent("data:image/jpeg;base64,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"),
                "type": "professional",
                "name": "New profile",
                "email": "professional@hotmail.com",
                "password": "123", 
                "tel": "647 608 3027",
                "services": [{ "service": clientJsonLogin.services[0]._id, "rate_hour": 100 },
                              { "service": clientJsonLogin.services[1]._id, "rate_hour": 80 }],
                "location": {
                    "type": "Point",
                    "coordinates": [ 
                        43.7785100, 
                        -79.346100
                    ]
                }
            }
        };

        return request(app)
            .post('/user/saveProfile')
            .send('data=' + JSON.stringify(data))
            .expect(200)
            .expect({ "message": "Success!" });
        
    });

    it('Get professional Login test', () => {
        return request(app)
            .post('/user/login')
            .send('data={"email": "professional@hotmail.com", "password": "123"}')
            .expect(200)
            .expect(res => {
                professionalJsonLogin = JSON.parse(res.text);

                if (professionalJsonLogin.token === null ||
                    professionalJsonLogin.profile === null ||
                    professionalJsonLogin.profile.services === null ||
                    professionalJsonLogin.profile.location === null ||
                    professionalJsonLogin.services === null ||
                    professionalJsonLogin.tasks === null) {

                    throw new Error('Missing information on json after login');
                }
        });

    });

    it('Search professional test', () => {

        let data = {
            "token": clientJsonLogin.token,
            "service": clientJsonLogin.services[0]._id,
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

    it('Search professional with an expired token test', () => {

        let data = {
            "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVhMTdiZjY4MjQzYWQ2NDc3YzUzOWJlMiIsImVtYWlsIjoiaXZhbnZhbGFkYXJlc0Bob3RtYWlsLmNvbSIsInR5cGUiOiJwcm9mZXNzaW9uYWwiLCJpYXQiOjE1MTE1NjY1MjksImV4cCI6MTUxMTU2NzEyOX0.rfzl0sVCG3dOzwc1EAlg-F9nHyU90563SHA-YaXxvLk",
            "service": clientJsonLogin.services[0]._id,
            "location": [43.7785100, -79.346100]
        };

        return request(app)
            .post('/user/searchProfessionals')
            .send('data=' + JSON.stringify(data))
            .expect(401);
        
    });

    it('Get client tasks without tasks test', () => {

        let data = {
            "token": clientJsonLogin.token,
            "type": "client"
        };

        return request(app)
            .post('/task/getTasks')
            .send('data=' + JSON.stringify(data))
            .expect(200)
            .expect(res => {

                let jsonResp = JSON.parse(res.text);

                if (jsonResp.results === undefined || 
                    jsonResp.results.length > 0) {

                    throw new Error('Error on get tasks for user without tasks');
                }

        });
        
    });

    it('Create a task test', () => {
        
        let data = {
            "token": clientJsonLogin.token,
            "service": clientJsonLogin.services[0]._id,
            "tasker": professionalJsonLogin.profile._id,
            "date": "2017/01/01",
            "hour": "12:10",
            "address": {
                "street": "yyyyy", 
                "unit": "603",
                "city": "North york",
                "state": "Ontario",
                "country": "Canada",
                "zip": "m2j 0b3"
            },
            "location": {
                "type": "Point",
                "coordinates": [ 
                    43.7785100, 
                    -79.346100
                ]
            }
        };

        return request(app)
            .post('/task/saveTask')
            .send('data=' + JSON.stringify(data))
            .expect(200)
            .expect({ "message": "Success!" });
        
    });

    it('Create a task with an expired token test', () => {
        
        let data = {
            "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVhMTdiZjY4MjQzYWQ2NDc3YzUzOWJlMiIsImVtYWlsIjoiaXZhbnZhbGFkYXJlc0Bob3RtYWlsLmNvbSIsInR5cGUiOiJwcm9mZXNzaW9uYWwiLCJpYXQiOjE1MTE1NjY1MjksImV4cCI6MTUxMTU2NzEyOX0.rfzl0sVCG3dOzwc1EAlg-F9nHyU90563SHA-YaXxvLk",
            "service": clientJsonLogin.services[0]._id,
            "tasker": professionalJsonLogin.profile._id,
            "date": "2017/01/01",
            "hour": "12:10",
            "address": {
                "street": "yyyyy", 
                "unit": "603",
                "city": "North york",
                "state": "Ontario",
                "country": "Canada",
                "zip": "m2j 0b3"
            },
            "location": {
                "type": "Point",
                "coordinates": [ 
                    43.7785100, 
                    -79.346100
                ]
            }
        };

        return request(app)
            .post('/task/saveTask')
            .send('data=' + JSON.stringify(data))
            .expect(401);
        
    });
    
    it('Create a second task test', () => {
        
        let data = {
            "token": clientJsonLogin.token,
            "service": clientJsonLogin.services[0]._id,
            "tasker": professionalJsonLogin.profile._id,
            "date": "2017/01/02",
            "hour": "12:15",
            "address": {
                "street": "yyyyy", 
                "unit": "603",
                "city": "North york",
                "state": "Ontario",
                "country": "Canada",
                "zip": "m2j 0b3"
            },
            "location": {
                "type": "Point",
                "coordinates": [ 
                    43.7785100, 
                    -79.346100
                ]
            }
        };

        return request(app)
            .post('/task/saveTask')
            .send('data=' + JSON.stringify(data))
            .expect(200)
            .expect({ "message": "Success!" });
        
    });
    
    let taskJson;
    it('Get client tasks with tasks test', () => {

        let data = {
            "token": clientJsonLogin.token,
            "type": "client"
        };

        return request(app)
            .post('/task/getTasks')
            .send('data=' + JSON.stringify(data))
            .expect(200)
            .expect(res => {

                taskJson = JSON.parse(res.text);

                if (taskJson.results === undefined || 
                    taskJson.results.length !== 2) {

                    throw new Error('Error on get tasks for user with tasks');
                }

        });
        
    });

    it('Get client tasks with an expired token test', () => {

        let data = {
            "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVhMTdiZjY4MjQzYWQ2NDc3YzUzOWJlMiIsImVtYWlsIjoiaXZhbnZhbGFkYXJlc0Bob3RtYWlsLmNvbSIsInR5cGUiOiJwcm9mZXNzaW9uYWwiLCJpYXQiOjE1MTE1NjY1MjksImV4cCI6MTUxMTU2NzEyOX0.rfzl0sVCG3dOzwc1EAlg-F9nHyU90563SHA-YaXxvLk",
            "type": "client"
        };

        return request(app)
            .post('/task/getTasks')
            .send('data=' + JSON.stringify(data))
            .expect(401);
        
    });    

    it('Update a task test', () => {
        
        let data = {
            "token": clientJsonLogin.token,
            "_id": taskJson.results[0]._id,
            "service": clientJsonLogin.services[0]._id,
            "tasker": professionalJsonLogin.profile._id,
            "date": "2017/02/02",
            "hour": "12:30",
            "address": {
                "street": "xxxxx", 
                "unit": "603",
                "city": "North york",
                "state": "Ontario",
                "country": "Canada",
                "zip": "m2j 0b3"
            },
            "location": {
                "type": "Point",
                "coordinates": [ 
                    44.7785100, 
                    -79.346100
                ]
            }
        };

        return request(app)
            .post('/task/saveTask')
            .send('data=' + JSON.stringify(data))
            .expect(200)
            .expect({ "message": "Success!" });
        
    });

    it('Fail to accepts a task test', () => {
        
        let data = {
            "token": clientJsonLogin.token,
            "_id": taskJson.results[0]._id
        };

        return request(app)
            .post('/task/acceptTask')
            .send('data=' + JSON.stringify(data))
            .expect(401);
        
    });     
   
    it('Failt to reject a task test', () => {
        
        let data = {
            "token": clientJsonLogin.token,
            "_id": taskJson.results[0]._id
        };

        return request(app)
            .post('/task/rejectTask')
            .send('data=' + JSON.stringify(data))
            .expect(401);
        
    });   

    it('Accepts a task with an expired token test', () => {
        
        let data = {
            "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVhMTdiZjY4MjQzYWQ2NDc3YzUzOWJlMiIsImVtYWlsIjoiaXZhbnZhbGFkYXJlc0Bob3RtYWlsLmNvbSIsInR5cGUiOiJwcm9mZXNzaW9uYWwiLCJpYXQiOjE1MTE1NjY1MjksImV4cCI6MTUxMTU2NzEyOX0.rfzl0sVCG3dOzwc1EAlg-F9nHyU90563SHA-YaXxvLk",
            "_id": taskJson.results[0]._id
        };

        return request(app)
            .post('/task/acceptTask')
            .send('data=' + JSON.stringify(data))
            .expect(401);
        
    }); 
        
    it('Accepts a task test', () => {
        
        let data = {
            "token": professionalJsonLogin.token,
            "_id": taskJson.results[0]._id
        };

        return request(app)
            .post('/task/acceptTask')
            .send('data=' + JSON.stringify(data))
            .expect(200)
            .expect({ "message": "Success!" });
        
    }); 
    
    it('Reject a task with an expired token test', () => {
        
        let data = {
            "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVhMTdiZjY4MjQzYWQ2NDc3YzUzOWJlMiIsImVtYWlsIjoiaXZhbnZhbGFkYXJlc0Bob3RtYWlsLmNvbSIsInR5cGUiOiJwcm9mZXNzaW9uYWwiLCJpYXQiOjE1MTE1NjY1MjksImV4cCI6MTUxMTU2NzEyOX0.rfzl0sVCG3dOzwc1EAlg-F9nHyU90563SHA-YaXxvLk",
            "_id": taskJson.results[1]._id
        };

        return request(app)
            .post('/task/rejectTask')
            .send('data=' + JSON.stringify(data))
            .expect(401);
        
    }); 
    
    it('Reject a task test', () => {
        
        let data = {
            "token": professionalJsonLogin.token,
            "_id": taskJson.results[1]._id
        };

        return request(app)
            .post('/task/rejectTask')
            .send('data=' + JSON.stringify(data))
            .expect(200)
            .expect({ "message": "Success!" });
        
    }); 

    it('Complete a task without a token test', () => {
        
        let data = {
            "_id": taskJson.results[0]._id,
            "review": {"text": "novo review", "stars": 4.5}
        };

        return request(app)
            .post('/task/completeTask')
            .send('data=' + JSON.stringify(data))
            .expect(400);
        
    });    
  
    it('Complete a task test', () => {
        
        let data = {
            "token": clientJsonLogin.token,
            "_id": taskJson.results[0]._id,
            "review": {"text": "novo review", "stars": 4.5}
        };

        return request(app)
            .post('/task/completeTask')
            .send('data=' + JSON.stringify(data))
            .expect(200)
            .expect({ "message": "Success!" });
        
    });        
    
    it('Check if professional was rated test', () => {
        
        return request(app)
        .post('/user/login')
        .send('data={"email": "professional@hotmail.com", "password": "123"}')
        .expect(200)
        .expect(res => {
            let profile = JSON.parse(res.text);

            if (profile.token === null ||
                profile.profile === null ||
                profile.profile.services === null ||
                profile.profile.location === null ||
                profile.services === null ||
                profile.tasks === null ||
                profile.profile.total_tasks !== 1 ||
                profile.profile.reviews.length !== 1) {

                throw new Error('Missing information on json after login');
            }
        });
        
    }); 

    it('Fail to complete an unaccepted task test', () => {
        
        let data = {
            "token": clientJsonLogin.token,
            "_id": taskJson.results[1]._id,
            "review": {"text": "novo review", "stars": 4.5}
        };

        return request(app)
            .post('/task/completeTask')
            .send('data=' + JSON.stringify(data))
            .expect(401);
        
    });      
        
    it('Remove a task with an expired token test', () => {
        
        let data = {
            "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVhMTdiZjY4MjQzYWQ2NDc3YzUzOWJlMiIsImVtYWlsIjoiaXZhbnZhbGFkYXJlc0Bob3RtYWlsLmNvbSIsInR5cGUiOiJwcm9mZXNzaW9uYWwiLCJpYXQiOjE1MTE1NjY1MjksImV4cCI6MTUxMTU2NzEyOX0.rfzl0sVCG3dOzwc1EAlg-F9nHyU90563SHA-YaXxvLk",
            "_id": taskJson.results[1]._id
        };

        return request(app)
            .post('/task/removeTask')
            .send('data=' + JSON.stringify(data))
            .expect(401);
        
    });            
        
    it('Remove a task test', () => {
        
        let data = {
            "token": clientJsonLogin.token,
            "_id": taskJson.results[1]._id
        };

        return request(app)
            .post('/task/removeTask')
            .send('data=' + JSON.stringify(data))
            .expect(200)
            .expect({ "message": "Success!" });
        
    });    
    
    it('Fail to remove a completed task test', () => {
        
        let data = {
            "token": clientJsonLogin.token,
            "_id": taskJson.results[0]._id
        };

        return request(app)
            .post('/task/removeTask')
            .send('data=' + JSON.stringify(data))
            .expect(401);
        
    });    
    
    it('Fail to reject a completed task test', () => {
        
        let data = {
            "token": professionalJsonLogin.token,
            "_id": taskJson.results[0]._id
        };

        return request(app)
            .post('/task/rejectTask')
            .send('data=' + JSON.stringify(data))
            .expect(401);
        
    });

    it('Create a review test', () => {
        
        let data = {
            "token": clientJsonLogin.token,
            "tasker": professionalJsonLogin.profile._id.toString(),
            "text": "Outro review", 
            "stars": 5
        };

        return request(app)
            .post('/review/saveReview')
            .send('data=' + JSON.stringify(data))
            .expect(200)
            .expect({ "message": "Success!" });
        
    });  

    it('Create a review with an expired token test', () => {
        
        let data = {
            "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVhMTdiZjY4MjQzYWQ2NDc3YzUzOWJlMiIsImVtYWlsIjoiaXZhbnZhbGFkYXJlc0Bob3RtYWlsLmNvbSIsInR5cGUiOiJwcm9mZXNzaW9uYWwiLCJpYXQiOjE1MTE1NjY1MjksImV4cCI6MTUxMTU2NzEyOX0.rfzl0sVCG3dOzwc1EAlg-F9nHyU90563SHA-YaXxvLk",
            "tasker": professionalJsonLogin.profile._id.toString(),
            "text": "Outro review", 
            "stars": 5
        };

        return request(app)
            .post('/review/saveReview')
            .send('data=' + JSON.stringify(data))
            .expect(401);
        
    });     
    
    it('Get all reviews of a professsional test', () => {

        let data = {
            "token": clientJsonLogin.token,
            "tasker": professionalJsonLogin.profile._id.toString()
        };

        return request(app)
            .post('/review/getReviews')
            .send('data=' + JSON.stringify(data))
            .expect(200)
            .expect(res => {

                let reviews = JSON.parse(res.text);

                if (reviews.results === undefined || 
                    reviews.results.length !== 2) {

                    throw new Error('Error on get reviews of a professional');
                }

        });
        
    }); 
        
    it('Get all reviews of a professsional without a token test', () => {

        let data = {
            "token": "",
            "tasker": professionalJsonLogin.profile._id.toString()
        };

        return request(app)
            .post('/review/getReviews')
            .send('data=' + JSON.stringify(data))
            .expect(400);
        
    });
        
    it('Get all reviews of a professsional with an expired token test', () => {

        let data = {
            "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVhMTdiZjY4MjQzYWQ2NDc3YzUzOWJlMiIsImVtYWlsIjoiaXZhbnZhbGFkYXJlc0Bob3RtYWlsLmNvbSIsInR5cGUiOiJwcm9mZXNzaW9uYWwiLCJpYXQiOjE1MTE1NjY1MjksImV4cCI6MTUxMTU2NzEyOX0.rfzl0sVCG3dOzwc1EAlg-F9nHyU90563SHA-YaXxvLk",
            "tasker": professionalJsonLogin.profile._id.toString()
        };

        return request(app)
            .post('/review/getReviews')
            .send('data=' + JSON.stringify(data))
            .expect(401);
        
    }); 

});