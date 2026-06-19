/* global importScripts, firebase */
importScripts(
"https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js"
);

importScripts(
"https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js"
);

firebase.initializeApp({

apiKey:
"AIzaSyBhElj_3kG-8X09JsQS5t0IJR9I_mzYQJc",

authDomain:
"fire-baadshah-arena.firebaseapp.com",

projectId:
"fire-baadshah-arena",

storageBucket:
"fire-baadshah-arena.appspot.com",

messagingSenderId:
"501695322845",

appId:
"1:501695322845:web:45747610276974719d5934",

});

const messaging =
firebase.messaging();

messaging.onBackgroundMessage(
(payload) => {

self.registration.showNotification(

payload.notification.title,

{
body:
payload.notification.body,

icon:
"/logo192.png",
}

);

}
);