const HttpError = require('../models/http-error');
const { v4: uuidv4, stringify } = require('uuid');


//DUMMY DATA
const DUMMY_DATA = [
    {
        id: 'u1',
        firstName: "David",
        lastName: "Acosta",
        email: "test.acosta@gmail.com",
        password: "asdf"
    },
    {
        id: 'u2',
        firstName: "Lara",
        lastName: "Croft",
        email: "test.croft@gmail.com",
        password: "asdf"
    },
    {
        id: 'u3',
        firstName: "Leilanni",
        lastName: "Acosta",
        email: "test.makoske@gmail.com",
        password: "asdf"
    }
];



const getUsers = (req, res, next) => {
    //setup filterable options that return filtered users. If no filters indicated in req queryparams, then return all users.
    res.status(200).json(DUMMY_DATA);
};



const getUserById = (req, res, next) => {
    console.log('Getting user by id');
    const user = DUMMY_DATA.find(user => user.id === req.params.id);
    res.status(200).json(user);
    res.end();
};



//POST new user
const signupNewUser = (req, res, next) => {
    console.log("POSTING new user");
    const requiredFields = ["firstName", "lastName", "email", "password"];
    for (let i = 0; i < requiredFields.length; i++) {
        if (!(req.body[requiredFields[i]])) {
            const errMsg = `Missing "${requiredFields[i]}" field in body`;
            console.error(errMsg);
            return res.status(400).send(errMsg);
            res.end();
        };
    };

    //normalize email...
    req.body.email = req.body.email.toLowerCase();

    //Check if the email already exists...
    if (DUMMY_DATA.find(user => user.email === req.body.email)) {
        throw new HttpError('Account already exists with that email.', 422);
    }


    const newUser = { ...req.body, id: uuidv4() };
    DUMMY_DATA.push(newUser);
    return res.status(201).json(newUser).end();
};



//Login existing user
const loginUser = (req, res, next) => {
    //normalize email...
    req.body.email = req.body.email.toLowerCase();

    const { email, password } = req.body;
    const user = DUMMY_DATA.find(usr => (usr.email === email) && (usr.password === password));
    if (!user) {
        throw new HttpError('Please check email or password.', 401);
    }

    return res.status(200).send('LOGGED IN successfully!').end();

};



const updateUserById = (req, res, next) => {
    //check if the req.params.id and req.body.id match
    if (req.params.id !== req.body.id) {
        const errMsg = "id in body and in url must match. Need both.";
        console.error(errMsg);
        return res.status(400).send(errMsg).end();
        res.end();
    };

    const updateableFields = ["firstName", "lastName"];
    const newUser = {};
    updateableFields.forEach(field => {
        if (field in req.body) {
            newUser[field] = req.body[field];
        }
    });

    DUMMY_DATA.find(user => {
        if (user.id === req.body.id) {
            DUMMY_DATA[user] = Object.assign(user, newUser);
        }
    });

    const updatedUser = DUMMY_DATA.find(user => user.id === req.body.id);

    res.status(200).json(updatedUser);

};



//DELETE a user using id
const deleteUserById = (req, res, next) => {
    console.log('Deleting user...');
    const itemIndexToDelete = DUMMY_DATA.findIndex(user => user.id === req.params.id);
    if (itemIndexToDelete < 0) {
        throw new HttpError('Could not find any user by that id.', 402)
    };
    DUMMY_DATA.splice(itemIndexToDelete, 1);

    return res.status(200).send("User successfully deleted").end();

};



module.exports = {
    getUserById,
    getUsers,
    signupNewUser,
    loginUser,
    updateUserById,
    deleteUserById
};