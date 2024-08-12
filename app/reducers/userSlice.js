// reducers/userSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  clientUid: null,
  token: null,
  location: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    loginUser: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.location = action.payload.location;
    },
    setClientUid: (state, action) => {
      state.clientUid = action.payload;
    },
    logoutUser: (state) => {
      state.user = null;
      state.clientUid = null;
      state.token = null;
      state.location = null;
    },
  },
});

export const { loginUser, setClientUid, logoutUser } = userSlice.actions;

export default userSlice.reducer;
