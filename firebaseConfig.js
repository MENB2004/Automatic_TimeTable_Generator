import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase, ref, set, get, update, remove } from 'firebase/database';

const firebaseConfig = {
  apiKey: 'AIzaSyDISijyQwv0wZ-4i-jHdKDOe9zorkpWpbk',
  authDomain: 'timetablegenerator-tg.firebaseapp.com',
  databaseURL: 'https://timetablegenerator-tg-default-rtdb.firebaseio.com',
  projectId: 'timetablegenerator-tg',
  storageBucket: 'timetablegenerator-tg.appspot.com',
  messagingSenderId: '973876403718',
  appId: '1:973876403718:web:2cd359227fd6dae06bed87',
  measurementId: 'G-7DGWGXZVW4',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

export { app, auth, database, ref, set, get, update, remove };
