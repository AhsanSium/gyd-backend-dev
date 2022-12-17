const express = require("express");
const app = express();
const cors = require("cors");
const admin = require("firebase-admin");
require("dotenv").config();
const { MongoClient } = require("mongodb");
const port = process.env.PORT || 5000;

//helping-hand-5b0f1-firebase-adminsdk-uo1i9-71dba24ce3.json

const serviceAccount = require("./helping-hand-5b0f1-firebase-adminsdk-uo1i9-71dba24ce3.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

//middleware
app.use(cors());
app.use(express.json());

var ObjectId = require('mongodb').ObjectID;

const uri = `mongodb+srv://doctorsDB:lsEACJFqgMxfOemt@cluster0.lzwpo.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function verifyToken(req, res, next) {
  if (req.headers?.authorization?.startsWith("Bearer ")) {
    const token = req.headers.authorization.split(" ")[1];

    try {
      const decodedUser = await admin.auth().verifyIdToken(token);
      req.decodedEmail = decodedUser.email;
    } catch { }
  }
  next();
}

async function run() {
  try {
    await client.connect();
    const database = client.db("doctors_portal");
    const appointmentsCollection = database.collection("appointments");
    const prescriptionCollection = database.collection("prescription");
    const prescriptionSolvedCollection = database.collection("prescription-solved");
    const testCollection = database.collection("test");
    const usersCollection = database.collection("users");

    app.get("/appdata/:email", async (req, res) => {
      const email = req.params.email;
      //const date = req.query.date;

      const query = { email: email };

      const cursor = appointmentsCollection.find(query);
      const appointments = await cursor.toArray();
      res.json(appointments);
    });

    app.post("/appointments", async (req, res) => {
      const appointment = req.body;
      const result = await appointmentsCollection.insertOne(appointment);
      console.log(appointment);
      res.json(result);
    });

    app.post("/prescription", async (req, res) => {
      const appointment = req.body;
      if (!appointment.email) {
        res.status(500).json({ err: "Empty Form, Try Again" })
      }
      else {
        const result = await prescriptionCollection.insertOne(appointment);
        console.log(appointment);
        res.json(result);
      }
    });

    app.get("/prescription", async (req, res) => {

      prescriptionCollection.find({}).toArray(function (err, user) {
        if (err) {
          console.log(err);
        }

        if (user) {
          // return user (without hashed password)
          console.log("\n", user);
          res.json(user);
        } else {
          // user not found

        }
      });

    });

    app.post("/prescription-solved", async (req, res) => {
      const appointment = req.body;
      if (!appointment.prescriptionId) {
        res.status(500).json({ err: "Empty Form, Try Again" })
      }
      else {
        const result = await prescriptionSolvedCollection.insertOne(appointment);
        console.log(appointment);
        res.json(result);
      }
    });

    app.get("/prescription-solved", async (req, res) => {

      prescriptionSolvedCollection.find({}).toArray(function (err, user) {
        if (err) {
          console.log(err);
        }

        if (user) {
          // return user (without hashed password)
          console.log("\n", user);
          res.json(user);
        } else {
          // user not found

        }
      });

    });

    app.post("/test-solved", async (req, res) => {
      const appointment = req.body;
      if (!appointment.prescriptionId) {
        res.status(500).json({ err: "Empty Form, Try Again" })
      }
      else {
        const result = await testCollection.insertOne(appointment);
        console.log(appointment);
        res.json(result);
      }
    });

    app.get("/test-solved", async (req, res) => {

      testCollection.find({}).toArray(function (err, user) {
        if (err) {
          console.log(err);
        }

        if (user) {
          // return user (without hashed password)
          console.log("\n", user);
          res.json(user);
        } else {
          // user not found

        }
      });

    });

    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      let isAdmin = false;
      if (user?.role === "admin") {
        isAdmin = true;
      }
      res.json({ admin: isAdmin });
    });

    app.get("/users", async (req, res) => {

      usersCollection.find({}).toArray(function (err, user) {


        if (err) {
          console.log(err);
        }

        if (user) {
          // return user (without hashed password)
          console.log("\n", user);
          res.json(user);
        } else {
          // user not found

        }
      });



    });


    app.get("/usersData/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      res.json({ "data": user });
      console.log(user);
    });

    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      console.log(result);

      res.json(result);
    });

    app.delete("/users", async (req, res) => {
      const user_id = req.body.id;
      console.log(user_id);
      const result = await usersCollection.deleteOne({ "_id": ObjectId(user_id) });
      console.log(result);

      res.json(result);
    });

    app.put("/users", async (req, res) => {
      const user = req.body;
      const filter = { email: user.email };
      const options = { upsert: true };
      const updateDoc = { $set: user };
      const result = await usersCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.json(result);
    });

    app.put("/users/admin", verifyToken, async (req, res) => {
      const user = req.body;
      const requester = req.decodedEmail;
      if (requester) {
        const requesterAccount = await usersCollection.findOne({
          email: requester,
        });
        if (requesterAccount.role === "admin") {
          const filter = { email: user.email };
          const updateDoc = { $set: { role: "admin" } };
          const result = await usersCollection.updateOne(filter, updateDoc);
          res.json(result);
        }
      } else {
        res
          .status(403)
          .json({ message: "you do not have access to make admin" });
      }
    });
  } finally {
  }
}

run().catch(console.dir);

app.get("/", async (req, res) => {
  res.send("Hello World");
});

app.listen(port, () => {
  console.log("Server running on port :", port);
});
