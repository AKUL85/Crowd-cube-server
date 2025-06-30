const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
app.use(cors());
app.use(express.json());
const port = process.env.PORT || 5000;

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rdbtijm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const Campaigns = client.db('DonateDB').collection('Campaign');
    const Donations = client.db('DonateDB').collection('Donations');

    
    app.post('/Campaign', async (req, res) => {
      const campaign = req.body;
      const result = await Campaigns.insertOne(campaign);
      res.send(result);
    });


    app.get('/Campaign', async (req, res) => {
      const cursor = Campaigns.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    
    app.get('/Campaign/:id', async (req, res) => {
      const id = req.params.id;
      try {
        const campaign = await Campaigns.findOne({ _id: new ObjectId(id) });
        res.send(campaign);
      } catch (error) {
        res.status(500).send({ success: false, error: error.message });
      }
    });

  
    app.delete('/Campaign/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await Campaigns.deleteOne(query);
      res.send(result);
    });

    app.put('/Campaign/:id', async (req, res) => {
      const id = req.params.id;
      const updatedCampaign = req.body;


      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          title: updatedCampaign.title,
          type: updatedCampaign.type,
          description: updatedCampaign.description,
          minimumDonation: updatedCampaign.minimumDonation,
          image: updatedCampaign.image,
          deadline: updatedCampaign.deadline,
        },
      };

      const result = await Campaigns.updateOne(query, updateDoc);

      if (result.matchedCount === 0) {
        return res.status(404).send({ success: false, message: "Campaign not found" });
      }

      res.send({ success: true, result });

    });


  
    app.post('/Donation', async (req, res) => {
      const donation = req.body;

      
      const result = await Donations.insertOne(donation);

  
      const campaignId = new ObjectId(donation.campaignId);
      const updateResult = await Campaigns.updateOne(
        { _id: campaignId },
        {
          $inc: {
            totalRaised: donation.amount,
            donorsCount: 1,
          },
        }
      );

      res.send({ success: true, donationResult: result, updateResult });

    });
  
    app.get('/Donation/:campaignId', async (req, res) => {
      const campaignId = req.params.campaignId;
     
        const cursor = Donations.find({ campaignId: campaignId });
        const donations = await cursor.toArray();
        res.send(donations);
      
    });



    app.get('/Donation', async (req, res) => {
      const cursor = Donations.find()
      const result = await cursor.toArray()
      res.send(result);
    });


    app.get('/Donations/user/:email', async (req, res) => {
      const email = req.params.email;
      
        const cursor = Donations.find({ userEmail: email });
        const donations = await cursor.toArray();
        res.send(donations);
     
    });

    await client.db('admin').command({ ping: 1 });
    console.log("Connected to MongoDB!");
  } finally {
  
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Server is running!');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
