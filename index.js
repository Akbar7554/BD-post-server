const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb')
require('dotenv').config()
const app = express()
const port = process.env.PORT || 5000

app.use(cors({
    origin: ['http://localhost:5173'],
    credentials: true,
}
))
app.use(express.json())
app.use(cookieParser())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.1i934d1.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

// middlewares
const logger = (req, res, next) => {
    console.log(req.method, req.url)
    next()
}
const verifyToken = (req, res, next) => {
    const token = req.cookies?.token
    console.log('token in middleware', token)
    if (!token) {
        return res.status(401).send({ message: "Unauthorized access" })
    }
    jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
        if (err) {
            return res.status(401).send({message : 'unauthorized access'})
        }
        req.user = decoded
        next()
    })
}

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const jobsCollection = client.db('jobsDB').collection('jobs')
        const bidCollection = client.db('jobsDB').collection('bids')

        app.post('/jobs', async (req, res) => {
            const newJob = req.body
            console.log(newJob)
            const result = await jobsCollection.insertOne(newJob)
            res.send(result)
        })

        app.get('/jobs', async (req, res) => {
            let query = {}
            if (req.query?.email) {
                query = { email: req.query.email }
            }
            const result = await jobsCollection.find(query).toArray()
            res.send(result)
        })

        app.get('/jobs/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await jobsCollection.findOne(query)
            res.send(result)
        })

        app.patch('/jobs/:id', async (req, res) => {
            const id = req.params.id
            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true }
            const updateJob = req.body
            const job = {
                $set: {
                    jobTitle: updateJob.jobTitle,
                    category: updateJob.category,
                    minimumPrice: updateJob.minimumPrice,
                    maximumPrice: updateJob.maximumPrice,
                    description: updateJob.description,
                }
            }
            const result = await jobsCollection.updateOne(filter, job, options)
            res.send(result)
        })

        app.delete('/jobs/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await jobsCollection.deleteOne(query)
            res.send(result)
        })


        // Bid Save Route

        app.post('/bids', async (req, res) => {
            const newBid = req.body
            console.log(newBid)
            const result = await bidCollection.insertOne(newBid)
            res.send(result)
        })
        // userEmail wise bid
        app.get('/bids', logger, verifyToken, async (req, res) => {
            console.log(req.query.email);
            console.log('token owner info', req.user)
            let query = {}
            if (req.query?.email) {
                query = { userEmail: req.query.email }
            }
            if (req.user.email !== req.query.email) {
                return res.status(403).send({message: "forbidden access"})
            }
            const result = await bidCollection.find(query).toArray()
            res.send(result)
        })
        // buyerEmail wise bid
        app.get('/bids/buyerEmail', logger, verifyToken, async (req, res) => {
            console.log(req.query.email);
            console.log('token owner info', req.user)
            let query = {}
            if (req.query?.email) {
                query = { buyerEmail: req.query.email }
            }
            if (req.user.email !== req.query.email) {
                return res.status(403).send({message: "forbidden access"})
            }
            const result = await bidCollection.find(query).toArray()
            res.send(result)
        })

        app.get('/bids/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await bidCollection.findOne(query)
            res.send(result)
        })

        app.patch('/bids/:id', async (req, res) => {
            const id = req.params.id
            const filter = { _id: new ObjectId(id) }
            const updateBids = req.body
            console.log(updateBids)
            const updateDoc = {
                $set: {
                    status: updateBids.status
                }
            }
            const result = await bidCollection.updateOne(filter, updateDoc)
            res.send(result)
        })


        // jwt auth related api

        app.post('/jwt', async (req, res) => {
            const user = req.body
            console.log(user)
            const token = jwt.sign(user, process.env.ACCESS_TOKEN, { expiresIn: '1h' })
            // res.cookie('token', token, {
            //     httpOnly: true,
            //     secure: false,
            //     sameSite: 'none'
            // })
            //     .send({ success: true })
                res.cookie('token', token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',

                })
                    .send({ success: true })
        })

        app.post('/logout', async (req, res) => {
            const user = req.body
            console.log('logged out', user);
            res.clearCookie('token', { maxAge: 0 }).send({ success: true })
        })




        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('Server is running')
})

app.listen(port, () => {
    console.log(`Server is running on ${port}`)
})