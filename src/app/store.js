import { legacy_createStore as createStore, combineReducers } from "redux";
import breedsReducer from "../features/breeds/reducer";

export const store = createStore(
  combineReducers({
    breeds: breedsReducer,
  })
);
