const functions = require('firebase-functions');

const express = require('express');
const { ExportBundleInfo } = require('firebase-functions/lib/providers/analytics');
const app = express();

const { db } = require('./util/admin');

const FBAuth = require('./util/fbAuth');

const { getAllScreams, postOneScream, getScream, commentOnScream, likeScream, unlikeScream, deleteScream } = require('./handlers/screams');
const { signup, login, uploadImage, addUserDetails, getAuthenticatedUser } = require('./handlers/users');


const { ResultStorage } = require('firebase-functions/lib/providers/testLab');


//scream routes
app.get('/screams', getAllScreams);     //get all screams
app.post('/scream', FBAuth, postOneScream);     //post a scream
app.get('/scream/:screamId', getScream);
app.delete('/scream/:screamId', FBAuth, deleteScream);   //deleteScream
app.get('/scream/:screamId/like', FBAuth, likeScream);  //like a scream
app.get('/scream/:screamId/unlike', FBAuth, unlikeScream);  //unlike a scream
app.post('/scream/:screamId/comment', FBAuth, commentOnScream);   //comment on scream

//users routes
app.post('/signup', signup);       //signup route
app.post('/login', login);   //login route
app.post('/user/image', FBAuth, uploadImage);       //upload image
app.post('/user', FBAuth, addUserDetails);      //add user details
app.get('/user', FBAuth, getAuthenticatedUser);     //hold redux data


// https://baseurl.com/api/something
exports.api = functions.region('asia-south1').https.onRequest(app);


//notification on like
exports.createNotificationOnLike = functions.region('asia-south1').firestore.document('likes/{id}')
    .onCreate((snapshot) => {
        db.document(`/screams/${snapshot.data().screamId}`)
            .then(doc => {
                if (doc.exists) {
                    return db.doc(`/notifications/${snapshot.id}`).set({
                        createdAt: new Date().toISOString(),
                        recipient: doc.data().userHandle,
                        sender: snapshot.data().userHandle,
                        type: 'like',
                        read: false,
                        screamId: doc.id
                    });
                }
            })
            .then(() => {
                return;
            })
            .catch((err) => {
                console.error(err);
                return;
            });

    });