import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import breedApi from "../../api/breedApi";

export const fetchBreeds = createAsyncThunk(
  "breeds/fetchBreeds",
  async (params, { rejectWithValue }) => {
    try {
      const res = await breedApi.getAll(params);
      return res; // { data, meta, links }
    } catch (err) {
      // err đã được interceptor chuẩn hoá { code, message }
      return rejectWithValue(err);
    }
  }
);

const initialState = {
  items: [],
  meta: null,
  status: "idle", // idle | loading | succeeded | failed
  error: null,    // { code, message }
};

const breedsSlice = createSlice({
  name: "breeds",
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBreeds.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchBreeds.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload.data;
        state.meta = action.payload.meta;
      })
      .addCase(fetchBreeds.rejected, (state, action) => {
        state.status = "failed";
        // KHÔNG xoá state.items => giữ dữ liệu cũ khi offline
        state.error = action.payload || {
          code: "UNKNOWN",
          message: action.error.message,
        };
      });
  },
});

export const { clearError } = breedsSlice.actions;
export default breedsSlice.reducer;

// Selectors
export const selectBreeds = (state) => state.breeds.items;
export const selectBreedsStatus = (state) => state.breeds.status;
export const selectBreedsError = (state) => state.breeds.error;

