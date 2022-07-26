require("dotenv").config();
require("./config/database").connect();
const User = require("./model/user");
const auth = require("./middleware/auth");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const express = require("express");

const app = express();

app.use(express.json());

// Register
app.post("/register", async(req, res) => {

    try {
   
        const { first_name, last_name, email, password, isAdmin } = req.body;

       
        if (!(email && password && first_name && last_name && isAdmin)) {
        res.status(400).send("All input is required");
        }


        const oldUser = await User.findOne({ email });

        if (oldUser) {
        return res.status(409).send("User Already Exist. Please Login");
        }

        encryptedPassword = await bcrypt.hash(password, 10);
        
        const user = await User.create({
        first_name,
        last_name,
        email: email.toLowerCase(), // sanitize: convert email to lowercase
        password: encryptedPassword,
        isAdmin
        });

        const token = jwt.sign(
        { 
            user_id: user._id, email, isAdmin 
        },
        process.env.TOKEN_KEY,
        {
            expiresIn: "2h",
        }
        );

        user.token = token;

        res.status(201).json(user);
    } catch (err) {
        console.log(err);
    }
    
});
    
    // Login
app.post("/login", async(req, res) => {
  try {

        const { email, password } = req.body;


        if (!(email && password)) {
        res.status(400).send("All input is required");
        }


        const user = await User.findOne({ email });

        if (user && (await bcrypt.compare(password, user.password))) {

        const token = jwt.sign(
            { 
                user_id: user._id, email, isAdmin 
            },
            process.env.TOKEN_KEY,
            {
            expiresIn: "2h",
            }
        );

        // save user token
        user.token = token;

        // user
        res.status(200).json(user);
        }
        res.status(400).send("Invalid Credentials");
    } catch (err) {
        console.log(err);
    }
});

app.post("/welcome", auth, async (req, res) => {
    res.status(200).send("Welcome 🙌 ");
});

app.get("/databyId/:id", auth, async(req,res) =>{  
      let id = req.params.id
      await axios
        .get(`https://kasirpintar.co.id/allAddress.txt`)
        .then(function (response) {
            var defined_id = id.toString().length;
            var newArray = []
            let results;
            if(defined_id == 0){
                console.log("Id tidak diisi")
            }
            if(defined_id == 7){
                results = response.data.address_kecamatan.filter(hasil => hasil.id == id)
                if(results.length === 0){
                    res.status(404).send("Data tidak ada")
                }
                res.status(200).json(results) 
            }
            if(defined_id == 2){
                results = response.data.address_provinsi.filter(hasil => hasil.id == id)
                if(results.length === 0){
                    res.status(404).send("Data tidak ada")
                }
                res.status(200).json(results)
            }
            if(defined_id == 4){
                results = response.data.address_kota.filter(hasil => hasil.id == id)
                if(results.length === 0){
                    res.status(404).send("Data tidak ada")
                }
                res.status(200).json(results)
            }
            if(defined_id == 10){
                results = response.data.address_kelurahan.filter(hasil => hasil.id == id)
                if(results.length === 0){
                    res.status(404).send("Data tidak ada")
                }
                res.status(200).json(results)
            }
            if(defined_id != 0 && defined_id != 7 && defined_id != 4 && defined_id != 2 && defined_id != 10 ){
                res.status(403).send("Id yang Anda masukkan Salah")
            }
    })
    .catch(function (error){
        console.log(error)
    })
});


app.get("/kotabyId/:id", auth, async(req, res) => {
   let id = req.params.id
   let tempId
   let tempKota
   let kecamatan
   let kota


   tempId = id.toString().length
   if(tempId == 0){
    console.log("Data Id Kosong")
   }

   if(tempId < 4){
    console.log("Data tidak sesuai kriteria")
   }
   if(tempId > 7){
    console.log("Data tidak sesuai")
   }
   tempKota         = id.substring(0,4)
   await axios
    .get(`https://kasirpintar.co.id/allAddress.txt`)
    .then(function (response){

        //console.log(tempKota)
        // kecamatan = response.data.address_kecamatan.filter(function (el){
        //      return el.kota_id == tempKota
        // })
        // kota = response.data.address_kota.filter(function (el){
        //     return el.id == tempKota
        // })
        kecamatan = response.data.address_kecamatan.filter(kecamatans => kecamatans.kota_id == tempKota)
        kota = response.data.address_kota.filter(kotas => kotas.id == tempKota)
        if(kota.length === 0){
             res.status(404).send("Data tidak ada")
             console.log(kota)
        }
        res.status(200).json({
            kota,
            kecamatan
        })
        //res.status(200).json(kecamatan)
        // res.status(200).json({
        //     kota,
        //     kecamatan
        // })
        
    })
    .catch(function (error){
        console.log(error)
    })

});


module.exports = app;