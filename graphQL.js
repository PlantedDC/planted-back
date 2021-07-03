const bcrypt = require('bcrypt');

const { graphql } = require('graphql');
const { makeExecutableSchema } = require('graphql-tools');
const db = require('./db');

let getUserById = (userid) => db.one(`
    SELECT * FROM users
    WHERE userid = ${userid};
`)

let getAllPlantData = (userid) => db.query(`
    SELECT * FROM plant_data
    WHERE userid = ${userid}
    ORDER BY created DESC;
`)

let getPlantDataFor = (userid, hours) => {
    let dateAfter = new Date();
    dateAfter.setHours( dateAfter.getHours() - hours - 4) //EDT timezone
    dateAfter = dateAfter.toISOString(); 
    console.log('dateAFTER', dateAfter)

    return db.query(`
        SELECT * FROM plant_data
        WHERE userid = ${userid}
        AND created >= '${dateAfter}';
`)}


let typeDefs = (`
	type Query {
	  currentUser(userid: ID): Data
	}
	
    type Data {
        user: UserInfo
        plantData: [PlantData]
        getPlantDataFor(hours: Float): [PlantData]
    }
    

    type UserInfo {
        username: String
        avatar: String
        userid: ID
        email: String
        passw: String
    }
    
    type PlantData {
        userid: ID
        temp: Float
        sun: Float
        moist: Float
        humidity: Float
        created: String
        dataid: Int
    }

    type Mutation {
        createUser(input: AddUser): UserInfo
        addPlantData(input: AddData): PlantData
    }

    input AddUser {
        username: String!
        avatar: String
        email: String!
        passw: String!
    }

    input AddData {
        temp: Float
        sun: Float
        moist: Float
        humidity: Float
    }


`)

// ###### queries for a reference and testing ##########

// let query = `
//     mutation {
//         addPlantData(input: {userid: 1 temp: 70 sun: 300 moist: 24 humidity: 3.2  }) {
//             userid
//         } 
//     }
// `
// let query = `
//     mutation {
//         createUser(input: {username: "test3" email: "test3@gmail.com" passw: "3333"}) {
//             userid
//             username  
//         } 
//     }
// `   
// let query = `
//     query { 
//         currentUser(userid: 1) { 
//             user { 
//                 username 
//                 avatar 
//             } 
//             getPlantDataFor(hours: 3) { 
//                 temp 
//                 sun 
//                 moist 
//                 humidity 
//                 created
//             } 
//         } 
//     }`



let resolvers = {
    Query: {
        currentUser: (parent, args, userid) => {
            return userid
        }
    },
    Data: {
        user: (userid) => getUserById(userid),
        plantData: (userid) => getAllPlantData(userid),
        getPlantDataFor: (userid, args) => getPlantDataFor(userid, args.hours),
    },

    UserInfo: {
        username: (p) => p.username,
        avatar: (p) => p.avatar,
        userid: (p) => p.userid,
        email: (p) => p.email,
    },

    PlantData: {
        userid: (p) => p.userid,
        temp: (p) => p.temp,
        sun: (p) => p.sun,
        moist: (p) => p.moist,
        humidity: (p) => p.humidity,
        created: (p) => p.created.toISOString(),
        dataid: (p) => p.dataid,
    },


    Mutation: {
        createUser: async (parent, args) => {
            let {username, email, avatar, passw} = args.input
            let hash = await bcrypt.hash(passw, 10);
            // no avatar ==> insert default
            avatar ? {} : avatar = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQzlDPRr1xSW0lukY2EmVpAx5Ye1S8H5luUVOK2IqFdcsjCDQxK';
            let insert = await db.query(`
                INSERT INTO users (
                    username, email, passw, avatar
                ) 
                VALUES (
                        '${username}',
                        '${email}',
                        '${hash}',
                        '${avatar}'
                )
                RETURNING *;
            `)
            return insert[0];
        },
        addPlantData: async (parent, args, userid) => {
            let { temp, sun, moist, humidity} = args.input;
            //no data ==> insert 0
            temp ? {} : temp = 0;
            sun ? {} : sun = 0;
            moist ? {} : moist = 0;
            humidity ? {} : humidity = 0;

            let insert = await db.query(`
                INSERT INTO plant_data (
                    userid, temp, sun, moist, humidity
                )
                VALUES (
                    '${userid}',
                    '${temp}',
                    '${sun}',
                    '${moist}',
                    '${humidity}'
                )
                RETURNING *;
            `)
            return insert[0];
        }
    }
}

let schema = makeExecutableSchema({typeDefs, resolvers})

let getResults = async (query, userid) => {
    let results = await graphql({
        schema,
        source: query,
        rootValue: resolvers,
        contextValue: userid}
    ).then( res => JSON.stringify(res));
    return results
}

// getResults(query).then(console.log)

module.exports = {
    getResults
}
