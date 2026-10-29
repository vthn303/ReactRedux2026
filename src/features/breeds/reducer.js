import {
  FETCH_BREEDS_REQUEST,
  FETCH_BREEDS_SUCCESS,
  FETCH_BREEDS_FAILURE,
} from "./actions";

const initialState = {
  items: [],
  meta: null,
  loading: false,
  error: null, // { code, message }
};

export default function breedsReducer(state = initialState, action) {
  switch (action.type) {
    case FETCH_BREEDS_REQUEST:
      return { ...state, loading: true, error: null };

    case FETCH_BREEDS_SUCCESS:
      return {
        ...state,
        loading: false,
        items: action.payload.items,
        meta: action.payload.meta,
      };

    case FETCH_BREEDS_FAILURE:
      // Giữ nguyên items cũ => khi offline vẫn còn dữ liệu đã tải trước đó
      return { ...state, loading: false, error: action.payload };

    default:
      return state;
  }
}

