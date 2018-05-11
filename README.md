# planted-back


GRAPHQL ###########################################
examples of front-end queries:

//add data

fetch('http://localhost:5000/graphql', {
	headers: {
	"authorization": someToken,
},
	method: 'POST',
	body: `
    mutation {
        addPlantData(input: {temp: 70 sun: 300 moist: 24 ph: 3.2  }) {
            userid
        } 
    }
`
})
.then( res => res.json() ).then(console.log)


// register user

fetch('http://localhost:5000/graphql', {
	headers: {
	"authorization": someToken,
},
	method: 'POST',
	body: `
    mutation {
        createUser(input: {username: "test3" email: "test3@gmail.com" passw: "3333"}) {
            userid
            username  
        } 
    }`
})
.then( res => res.json() ).then(console.log)

// get data

fetch('http://localhost:5000/graphql', {
	headers: {
	"authorization": someToken,
},
	method: 'POST',
	body: `
	query {
	  currentUser {
        user {
            username
            avatar
        }
        plantData {
            temp
            sun
            moist
            ph
        }
	  }
    }`
})
.then( res => res.json() ).then(console.log)
