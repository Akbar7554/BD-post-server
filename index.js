const express = require('express')
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb')
require('dotenv').config()
const app = express()
const port = process.env.PORT || 5000

app.use(cors())
app.use(express.json())



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.1i934d1.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

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

        app.get('/bids', async (req, res) => {
            let query = {}
            if (req.query?.email) {
                query = { email: req.query.email }
            }
            const result = await bidCollection.find().toArray()
            res.send(result)
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