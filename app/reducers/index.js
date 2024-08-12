// reducers/index.js
import { combineReducers } from 'redux';
// Import your slice reducers here
import userReducer from './userSlice';

const rootReducer = combineReducers({
  user: userReducer,
  // Add more reducers here
});

export default rootReducer;
