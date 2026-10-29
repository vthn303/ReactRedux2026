// 3 hằng số kiểu action
export const FETCH_BREEDS_REQUEST = "FETCH_BREEDS_REQUEST";
export const FETCH_BREEDS_SUCCESS = "FETCH_BREEDS_SUCCESS";
export const FETCH_BREEDS_FAILURE = "FETCH_BREEDS_FAILURE";

// Action creators tương ứng
export const fetchBreedsRequest = () => ({ type: FETCH_BREEDS_REQUEST });

export const fetchBreedsSuccess = (items, meta) => ({
  type: FETCH_BREEDS_SUCCESS,
  payload: { items, meta },
});

export const fetchBreedsFailure = (error) => ({
  type: FETCH_BREEDS_FAILURE,
  payload: error, // { code, message } do interceptor chuẩn hoá
});

