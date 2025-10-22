const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const express = require('express');
const router = express.Router();
const { user } = require('../db');
const z = require('zod');
const { auth_middleware } = require('../middleware');

const signupSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6)
})

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6)
})

router.post("/signup", async (req, res) => {
    const { success } = signupSchema.safeParse(req.body)
    if (!success) {
        return res.status(411).json({
            message: "Email already taken / Incorrect inputs"
        })
    }

    const existingUser = await user.findOne({
        email: req.body.email
    })

    if (existingUser) {
        return res.status(411).json({
            message: "Email already taken/Incorrect inputs"
        })
    }

    const abc = await user.create({
        name:req.body.name,
        email: req.body.email,
        password: req.body.password,
        balance: 1 + Math.floor(Math.random() * 100000)
    })
    const userId = abc._id;
    if (!abc) {
        return res.status(500).json({
            message: "Error while creating user"
        })
    }
    if (req.body.password.length < 8) {
        return res.status(411).json({
            message: "Password must be at least 8 characters long"
        });
    }
   
    const token = jwt.sign({
        userId
    }, process.env.JWT_SECRET);

    res.json({
        message: "User created successfully",
        token: token,
        name: abc.name,
        email: abc.email
    })
})
router.post("/login", async (req,res)=>{
    const body = req.body;
    console.log("body:", body);
    const{success} = loginSchema.safeParse(body);
    if(!success){
        return res.status(411).json({
            message:"invalid email/password"
        })
    }
    const user_sign = await user.findOne({
        email: body.email,
        password: body.password
    });
    if(user_sign){
        const token = jwt.sign({
            userId:user_sign._id
        },process.env.JWT_SECRET);
        console.log("User first name:", user_sign);
        res.json({
            token:token,
            firstName: user_sign.firstName,
        });
        return;
    }
        res.status(411).json({
                message: "invalid username/password"
        })
})
// Return the authenticated user's basic profile
router.get('/me', auth_middleware, async (req, res) => {
    try {
        const u = await user.findById(req.userId).select('name email')
        if (!u) return res.status(404).json({ message: 'User not found' })
        res.json({ name: u.name, email: u.email })
    } catch (err) {
        console.error('GET /me error:', err)
        res.status(500).json({ message: 'Internal server error' })
    }
})
router.get('/balance', auth_middleware, async (req, res) => {
    try {
        const u = await user.findById(req.userId).select('balance')
        if (!u) return res.status(404).json({ message: 'User not found' })
        res.json({ balance: u.balance })
    } catch (err) {
        console.error('GET /balance error:', err)
        res.status(500).json({ message: 'Internal server error' })
    }
})
module.exports = router;