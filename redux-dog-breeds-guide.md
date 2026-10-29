# Redux Setup trong React: Lấy danh sách giống chó (Dog API v2)

## 1. Yêu cầu

| # | Yêu cầu | Kết quả mong đợi |
|---|---------|------------------|
| 1 | **Có Internet**: gọi API `GET https://dogapi.dog/api/v2/breeds` và hiển thị thông tin từng giống chó | Hiển thị danh sách **card**: lưới 2x2 gồm 4 ảnh (image url), bên dưới là tên giống chó và mô tả (xem mục 10) |
| 2 | **Mất Internet**: ngắt mạng rồi gọi lại API get all breeds | Không crash app, hiển thị thông báo lỗi "Không có kết nối Internet", có nút **Thử lại**; dữ liệu đã tải trước đó (nếu có) vẫn được giữ |

### Công nghệ

- ReactJS (Vite hoặc CRA)
- Redux Toolkit + React-Redux
- Axios + **interceptor** (request và response)
- **MUI + Tailwind CSS** cho giao diện (mục 10)

> Tài liệu có 2 hướng: **Redux Toolkit + `createAsyncThunk`** (mục 3 đến 8) và **Redux thuần không dùng `createAsyncThunk`** (mục 9, dễ hiểu hơn cho người mới).

### Cấu trúc response của API (theo dữ liệu thực tế, rút gọn)

```json
{
  "data": [
    {
      "id": "036feed0-da8a-42c9-ab9a-57449b530b13",
      "type": "breed",
      "attributes": {
        "name": "Affenpinscher",
        "description": "The Affenpinscher is a small and playful breed of dog...",
        "life": { "max": 16, "min": 14 },
        "male_weight": { "max": 6, "min": 4 },
        "female_weight": { "max": 6, "min": 4 },
        "hypoallergenic": true,
        "male_height": { "max": 29, "min": 23 },
        "female_height": { "max": 29, "min": 23 },
        "origin": { "era": "17th century", "region": "Central Europe", "country": "Germany" },
        "coat": { "type": "wire", "colors": ["black", "gray"], "length": "short" },
        "traits": { "energy": 3, "barking": 3, "temperament": ["confident", "curious"] },
        "other_names": ["Monkey Terrier", "Affen"],
        "recognized_by": ["AKC", "FCI"],
        "sources": [{ "url": "https://...", "title": "..." }],
        "images": [
          {
            "id": "1861dc37-a00b-4e34-b9b8-8c03b6e58b61",
            "url": "https://images.dogapi.dog/01v98q4ttqulz609aw8r5h8i1g44",
            "thumb": "https://images.dogapi.dog/zpwegcab6hzq09q0eyl8oxf66lve",
            "medium": "https://images.dogapi.dog/f57sae5b2xqi6pxdq6r8tw1h4c8t",
            "large": "https://images.dogapi.dog/21mg55zlym6nq3o6cm56v0itkdad",
            "attribution": { "author": "Futurebreak", "license": "CC0" }
          }
        ]
      },
      "relationships": {
        "group": { "data": { "id": "f56dc4b1-ba1a-4454-8ce2-bd5d41404a0c", "type": "group" } }
      }
    }
  ]
}
```

Các trường dùng cho giao diện card (mục 10):

| Trường | Dùng để |
|--------|---------|
| `attributes.images[0..3].medium` | 4 ảnh trong lưới 2x2 (một breed có thể có nhiều hơn hoặc ít hơn 4 ảnh) |
| `attributes.name` | Tên giống chó |
| `attributes.description` | Mô tả |

> Theo docs, ngoài `data` API còn trả `meta` / `links` để phân trang (`?page[number]=1&page[size]=10`). Dữ liệu mẫu ở trên không có hai phần này.

---

## 2. Cài đặt

```bash
npm create vite@latest dog-breeds -- --template react
cd dog-breeds
npm install @reduxjs/toolkit react-redux axios
```

---

## 3. Cấu trúc thư mục

```
src/
├── api/
│   ├── axiosClient.js          # axios instance + interceptors
│   └── breedApi.js             # các hàm gọi API breeds
├── app/
│   └── store.js                # configureStore
├── features/
│   └── breeds/
│       ├── breedsSlice.js      # state, reducers, createAsyncThunk
│       ├── BreedList.jsx       # container: dispatch + hiển thị trạng thái
│       └── BreedCard.jsx       # hiển thị 1 breed
├── components/
│   ├── Loading.jsx
│   ├── ErrorMessage.jsx        # thông báo lỗi + nút Thử lại
│   └── NetworkStatus.jsx       # banner online/offline
├── hooks/
│   └── useOnlineStatus.js      # lắng nghe sự kiện online/offline
├── pages/
│   └── BreedHome.jsx           # TRANG CHÍNH: tiêu đề + danh sách breed
├── App.jsx                     # banner mạng + render <BreedHome />
└── main.jsx                    # bọc <Provider store={store}>
```

Quy ước: thư mục `pages/` chứa các **trang** (ghép layout + các component/feature lại với nhau). `features/` và `components/` chỉ chứa phần dùng lại được. `App.jsx` chỉ giữ những thứ toàn cục (banner offline) và render trang chính `BreedHome`.

---

## 4. Luồng hoạt động

```
Component (BreedList)
   │ dispatch(fetchBreeds())
   ▼
createAsyncThunk ──► breedApi.getAll() ──► axiosClient
                                              │
                      ┌───────────────────────┴──────────────────────┐
                      │ Request interceptor: navigator.onLine?       │
                      │   - offline → reject ngay (OFFLINE)          │
                      │   - online  → gửi request                    │
                      └───────────────────────┬──────────────────────┘
                                              ▼
                      ┌──────────────────────────────────────────────┐
                      │ Response interceptor                         │
                      │   - success → trả về response.data           │
                      │   - error   → chuẩn hoá { code, message }    │
                      └───────────────────────┬──────────────────────┘
                                              ▼
              extraReducers: pending / fulfilled / rejected
                                              ▼
              useSelector → UI (loading / list / error + Retry)
```

---

## 5. Cách thực hiện (code)

### 5.1 `src/api/axiosClient.js`: axios instance + interceptor

```js
import axios from "axios";

const axiosClient = axios.create({
  baseURL: "https://dogapi.dog/api/v2",
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

// ---------- REQUEST INTERCEPTOR ----------
axiosClient.interceptors.request.use(
  (config) => {
    // Chặn sớm nếu trình duyệt báo offline, không cần chờ timeout
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      return Promise.reject({
        code: "OFFLINE",
        message: "Không có kết nối Internet. Vui lòng kiểm tra mạng và thử lại.",
      });
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ---------- RESPONSE INTERCEPTOR ----------
axiosClient.interceptors.response.use(
  // Trả thẳng data để không phải viết res.data ở mọi nơi
  (response) => response.data,

  (error) => {
    // Lỗi đã được chuẩn hoá từ request interceptor
    if (error?.code === "OFFLINE") return Promise.reject(error);

    // Có request nhưng không có response => mất mạng / không kết nối được server
    if (axios.isAxiosError(error) && !error.response) {
      const isTimeout = error.code === "ECONNABORTED";
      return Promise.reject({
        code: isTimeout ? "TIMEOUT" : "NETWORK_ERROR",
        message: isTimeout
          ? "Hết thời gian chờ. Vui lòng thử lại."
          : "Không thể kết nối tới máy chủ. Kiểm tra Internet của bạn.",
      });
    }

    // Server trả lỗi (4xx, 5xx)
    return Promise.reject({
      code: `HTTP_${error.response?.status ?? "UNKNOWN"}`,
      message:
        error.response?.data?.errors?.[0]?.title ||
        error.message ||
        "Đã xảy ra lỗi không xác định.",
    });
  }
);

export default axiosClient;
```

### 5.2 `src/api/breedApi.js`

```js
import axiosClient from "./axiosClient";

const breedApi = {
  getAll: (params) => axiosClient.get("/breeds", { params }),
  // vd: breedApi.getAll({ "page[number]": 1, "page[size]": 20 })
};

export default breedApi;
```

### 5.3 `src/features/breeds/breedsSlice.js`

```js
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
```

### 5.4 `src/app/store.js`

```js
import { configureStore } from "@reduxjs/toolkit";
import breedsReducer from "../features/breeds/breedsSlice";

export const store = configureStore({
  reducer: {
    breeds: breedsReducer,
  },
});
```

### 5.5 `src/main.jsx`

```jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "./app/store";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <App />
  </Provider>
);
```

### 5.6 `src/hooks/useOnlineStatus.js`

```js
import { useEffect, useState } from "react";

export default function useOnlineStatus() {
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  return online;
}
```

### 5.7 `src/components/NetworkStatus.jsx`

```jsx
import useOnlineStatus from "../hooks/useOnlineStatus";

export default function NetworkStatus() {
  const online = useOnlineStatus();
  if (online) return null;
  return (
    <div style={{ background: "#b00020", color: "#fff", padding: 8, textAlign: "center" }}>
      Bạn đang offline
    </div>
  );
}
```

### 5.8 `src/components/ErrorMessage.jsx`

```jsx
export default function ErrorMessage({ error, onRetry }) {
  return (
    <div style={{ border: "1px solid #f5c2c7", background: "#f8d7da", padding: 16, borderRadius: 8 }}>
      <strong>Lỗi ({error.code}):</strong> {error.message}
      <div style={{ marginTop: 8 }}>
        <button onClick={onRetry}>Thử lại</button>
      </div>
    </div>
  );
}
```

### 5.9 `src/features/breeds/BreedCard.jsx`

> Bản dưới chỉ là bản tạm hiển thị text. Bản chính thức (card 4 ảnh theo thiết kế, dùng MUI + Tailwind) nằm ở **mục 10.5**.

```jsx
export default function BreedCard({ breed }) {
  const { name, description, life, male_weight, female_weight, hypoallergenic } =
    breed.attributes;

  return (
    <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16 }}>
      <h3>{name}</h3>
      <p>{description}</p>
      <ul>
        <li>Tuổi thọ: {life.min} - {life.max} năm</li>
        <li>Cân nặng (đực): {male_weight.min} - {male_weight.max} kg</li>
        <li>Cân nặng (cái): {female_weight.min} - {female_weight.max} kg</li>
        <li>Hypoallergenic: {hypoallergenic ? "Có" : "Không"}</li>
      </ul>
    </div>
  );
}
```

### 5.10 `src/features/breeds/BreedList.jsx`

```jsx
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchBreeds,
  selectBreeds,
  selectBreedsStatus,
  selectBreedsError,
} from "./breedsSlice";
import BreedCard from "./BreedCard";
import ErrorMessage from "../../components/ErrorMessage";

export default function BreedList() {
  const dispatch = useDispatch();
  const breeds = useSelector(selectBreeds);
  const status = useSelector(selectBreedsStatus);
  const error = useSelector(selectBreedsError);

  const load = () => dispatch(fetchBreeds({ "page[number]": 1, "page[size]": 20 }));

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <button onClick={load} disabled={status === "loading"}>
        Gọi lại API get all breeds
      </button>

      {status === "loading" && <p>Đang tải...</p>}
      {status === "failed" && error && <ErrorMessage error={error} onRetry={load} />}

      <div style={{ display: "grid", gap: 16, marginTop: 16 }}>
        {breeds.map((b) => (
          <BreedCard key={b.id} breed={b} />
        ))}
      </div>
    </div>
  );
}
```

### 5.11 `src/pages/BreedHome.jsx`: trang chính

```jsx
import BreedList from "../features/breeds/BreedList";

export default function BreedHome() {
  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 16 }}>
      <h1>Dog Breeds</h1>
      <BreedList />
    </div>
  );
}
```

### 5.12 `src/App.jsx`: đặt BreedHome vào App

```jsx
import NetworkStatus from "./components/NetworkStatus";
import BreedHome from "./pages/BreedHome";

export default function App() {
  return (
    <>
      <NetworkStatus />
      <BreedHome />
    </>
  );
}
```

---

## 6. Cách kiểm thử

### Test 1: Có Internet
1. `npm run dev`, mở app.
2. Danh sách breed hiển thị (tên, mô tả, tuổi thọ, cân nặng...).
3. Mở Redux DevTools: thấy `breeds/fetchBreeds/pending` rồi `fulfilled`.

### Test 2: Mất Internet
1. Tải trang khi còn mạng (để có dữ liệu).
2. Ngắt mạng: tắt Wi-Fi/rút cáp, hoặc DevTools → **Network** → chọn **Offline**.
3. Banner "Bạn đang offline" xuất hiện.
4. Bấm **Gọi lại API get all breeds**.
5. Kết quả:
   - Request bị chặn ở request interceptor (`code: OFFLINE`), không có request nào gửi đi.
   - Redux DevTools: `pending` rồi `rejected`, `state.breeds.error = { code: "OFFLINE", message: "..." }`.
   - UI hiển thị `ErrorMessage` kèm nút **Thử lại**, danh sách cũ vẫn còn.
6. Bật lại mạng, bấm **Thử lại**: dữ liệu tải lại bình thường.

> Để test nhánh `NETWORK_ERROR` (response interceptor), có thể tạm comment đoạn check `navigator.onLine` trong request interceptor, khi đó axios sẽ lỗi `ERR_NETWORK` và interceptor chuẩn hoá thành `NETWORK_ERROR`.

---

## 7. Bảng mã lỗi

| `code` | Nguyên nhân | Nơi xử lý |
|--------|-------------|-----------|
| `OFFLINE` | `navigator.onLine === false` | Request interceptor |
| `NETWORK_ERROR` | Có request nhưng không có response | Response interceptor |
| `TIMEOUT` | Quá `timeout` 10s | Response interceptor |
| `HTTP_4xx/5xx` | Server trả lỗi | Response interceptor |

---

## 8. Mở rộng (tuỳ chọn)

- **Giữ dữ liệu sau khi reload khi offline**: dùng `redux-persist` để lưu `breeds.items` vào `localStorage`.
- **Tự động gọi lại khi có mạng**: trong `BreedList`, dùng `useOnlineStatus` và `useEffect` dispatch `fetchBreeds` khi chuyển từ offline sang online.
- **Retry tự động**: thêm `axios-retry` vào `axiosClient`.
- **Phân trang**: dùng `meta.pagination` và tham số `page[number]`.
- **Hủy request**: truyền `signal` từ `createAsyncThunk` (`thunkAPI.signal`) vào axios.

---

## 9. Phương án khác: không dùng `createAsyncThunk` (Redux thuần, dễ hiểu hơn)

Phần 5 dùng Redux Toolkit (`createAsyncThunk`). Nếu muốn dễ hiểu hơn, có thể chỉ dùng `redux` + `react-redux`. Các file **giữ nguyên**: `axiosClient.js`, `breedApi.js`, `BreedCard.jsx`, `ErrorMessage.jsx`, `NetworkStatus.jsx`, `useOnlineStatus.js`, `main.jsx`, `pages/BreedHome.jsx`, `App.jsx` (đã tạo ở mục 5.11 và 5.12).

Ý tưởng: một request có 3 trạng thái (đang tải, thành công, thất bại), mỗi trạng thái là một action thường.

```
dispatch(REQUEST)  ──►  gọi API (axios + interceptor)
                          ├─ thành công ──► dispatch(SUCCESS, data)
                          └─ thất bại   ──► dispatch(FAILURE, error)   (gồm cả OFFLINE)
```

### 9.1 Cài đặt

```bash
npm install redux react-redux axios
# Chỉ cần thêm nếu dùng Cách B:
npm install redux-thunk
```

### 9.2 Cấu trúc thư mục (thay đổi so với mục 3)

```
src/
├── api/
│   ├── axiosClient.js          # giữ nguyên
│   └── breedApi.js             # giữ nguyên
├── app/
│   └── store.js                # createStore + combineReducers (+ thunk nếu Cách B)
├── features/
│   └── breeds/
│       ├── actions.js          # hằng số type + action creators (+ thunk nếu Cách B)
│       ├── reducer.js          # switch/case thuần
│       ├── BreedList.jsx
│       └── BreedCard.jsx
├── components/                 # giữ nguyên
├── hooks/                      # giữ nguyên
├── pages/
│   └── BreedHome.jsx           # giữ nguyên: trang chính
├── App.jsx                     # giữ nguyên: render <BreedHome />
└── main.jsx
```

> Không còn `breedsSlice.js`, thay bằng `actions.js` + `reducer.js`.

### 9.3 `src/features/breeds/actions.js`: 3 action thường

```js
export const FETCH_BREEDS_REQUEST = "FETCH_BREEDS_REQUEST";
export const FETCH_BREEDS_SUCCESS = "FETCH_BREEDS_SUCCESS";
export const FETCH_BREEDS_FAILURE = "FETCH_BREEDS_FAILURE";

export const fetchBreedsRequest = () => ({ type: FETCH_BREEDS_REQUEST });

export const fetchBreedsSuccess = (items, meta) => ({
  type: FETCH_BREEDS_SUCCESS,
  payload: { items, meta },
});

export const fetchBreedsFailure = (error) => ({
  type: FETCH_BREEDS_FAILURE,
  payload: error, // { code, message } do interceptor chuẩn hoá
});
```

### 9.4 `src/features/breeds/reducer.js`

```js
import {
  FETCH_BREEDS_REQUEST,
  FETCH_BREEDS_SUCCESS,
  FETCH_BREEDS_FAILURE,
} from "./actions";

const initialState = {
  items: [],
  meta: null,
  loading: false,
  error: null,
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
      // giữ nguyên items cũ => khi offline vẫn còn dữ liệu đã tải
      return { ...state, loading: false, error: action.payload };

    default:
      return state;
  }
}
```

### 9.5 Cách A: gọi API ngay trong component (không cần middleware)

**`src/app/store.js`**

```js
import { legacy_createStore as createStore, combineReducers } from "redux";
import breedsReducer from "../features/breeds/reducer";

export const store = createStore(
  combineReducers({
    breeds: breedsReducer,
  })
);
```

**`src/features/breeds/BreedList.jsx`**

```jsx
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import breedApi from "../../api/breedApi";
import {
  fetchBreedsRequest,
  fetchBreedsSuccess,
  fetchBreedsFailure,
} from "./actions";
import BreedCard from "./BreedCard";
import ErrorMessage from "../../components/ErrorMessage";

export default function BreedList() {
  const dispatch = useDispatch();
  const { items, loading, error } = useSelector((state) => state.breeds);

  const load = async () => {
    dispatch(fetchBreedsRequest()); // 1. báo đang tải
    try {
      const res = await breedApi.getAll({ "page[number]": 1, "page[size]": 20 });
      dispatch(fetchBreedsSuccess(res.data, res.meta)); // 2. thành công
    } catch (err) {
      dispatch(fetchBreedsFailure(err)); // 3. thất bại (kể cả OFFLINE)
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <button onClick={load} disabled={loading}>
        Gọi lại API get all breeds
      </button>

      {loading && <p>Đang tải...</p>}
      {error && <ErrorMessage error={error} onRetry={load} />}

      <div style={{ display: "grid", gap: 16, marginTop: 16 }}>
        {items.map((b) => (
          <BreedCard key={b.id} breed={b} />
        ))}
      </div>
    </div>
  );
}
```

### 9.6 Cách B: tách logic ra khỏi component bằng `redux-thunk`

Thunk chỉ là một hàm trả về hàm nhận `dispatch`. Component sẽ gọn hơn (chỉ `dispatch(fetchBreeds())`).

**Thêm vào cuối `actions.js`**

```js
import breedApi from "../../api/breedApi";

export const fetchBreeds = (params) => async (dispatch) => {
  dispatch(fetchBreedsRequest());
  try {
    const res = await breedApi.getAll(params);
    dispatch(fetchBreedsSuccess(res.data, res.meta));
  } catch (err) {
    dispatch(fetchBreedsFailure(err));
  }
};
```

**`src/app/store.js`**: thêm middleware

```js
import {
  legacy_createStore as createStore,
  combineReducers,
  applyMiddleware,
} from "redux";
import { thunk } from "redux-thunk";
import breedsReducer from "../features/breeds/reducer";

export const store = createStore(
  combineReducers({ breeds: breedsReducer }),
  applyMiddleware(thunk)
);
```

**`BreedList.jsx`**: phần `load` rút gọn

```jsx
import { fetchBreeds } from "./actions";

const load = () => dispatch(fetchBreeds({ "page[number]": 1, "page[size]": 20 }));
```

### 9.7 So sánh các phương án

| | Redux Toolkit (mục 5) | Cách A (thuần) | Cách B (redux-thunk) |
|---|---|---|---|
| Thư viện | `@reduxjs/toolkit`, `react-redux` | `redux`, `react-redux` | `redux`, `react-redux`, `redux-thunk` |
| Chỗ viết logic gọi API | `createAsyncThunk` | Trong component | Trong `actions.js` |
| Lượng code | Ít nhất | Nhiều hơn (viết tay action/reducer) | Nhiều hơn |
| Độ dễ hiểu | Cần học API của RTK | Cao nhất, thấy rõ từng bước | Dễ, cần hiểu "action là hàm" |
| Tái sử dụng | Tốt | Phải copy nếu dùng nhiều nơi | Tốt (`dispatch(fetchBreeds())`) |

Gợi ý: người mới học Redux nên bắt đầu với **Cách A** để thấy rõ vòng `request → success/failure`, rồi chuyển sang **Cách B** khi cần tái sử dụng, và sang Redux Toolkit khi muốn giảm boilerplate.

### 9.8 Kiểm thử offline với phương án thuần

Các bước giống mục 6. Khác biệt chỉ ở tên action trong Redux DevTools:

1. Tải trang khi có mạng: thấy `FETCH_BREEDS_REQUEST` rồi `FETCH_BREEDS_SUCCESS`, danh sách hiển thị.
2. Ngắt mạng (DevTools → Network → Offline), bấm **Gọi lại API get all breeds**.
3. Request interceptor reject với `code: "OFFLINE"`, thấy `FETCH_BREEDS_REQUEST` rồi `FETCH_BREEDS_FAILURE`.
4. `state.breeds.error = { code: "OFFLINE", message: "..." }`, UI hiện `ErrorMessage` kèm nút **Thử lại**, danh sách cũ vẫn còn.
5. Bật lại mạng, bấm **Thử lại**: dữ liệu tải lại bình thường.

---

## 10. Giao diện với MUI + Tailwind CSS (card theo thiết kế)

### 10.1 Thiết kế card

```
┌──────────────┬──────────────┐
│  Image url   │  Image url   │   ← images[0].medium , images[1].medium
├──────────────┼──────────────┤
│  Image url   │  Image url   │   ← images[2].medium , images[3].medium
├──────────────┴──────────────┤
│  Name of type breed         │   ← attributes.name
│  Descriptions               │   ← attributes.description
└─────────────────────────────┘
```

| Phần | Màu (theo thiết kế) | Ghi chú |
|------|---------------------|---------|
| Nền trang | `#2b2224` (nâu đen) | |
| Ô ảnh (placeholder) | `#d9d9d9` (xám) | Hiện khi thiếu ảnh hoặc ảnh lỗi (ví dụ đang offline) |
| Đường kẻ giữa các ảnh | Trắng | `gap-0.5` trên nền trắng |
| Khối thông tin | `#bc9c98` (hồng nâu) | Chữ trắng, tên to hơn mô tả |

Quy tắc dữ liệu:
- Lấy **4 ảnh đầu tiên** của `attributes.images`, dùng bản `medium`.
- Breed có ít hơn 4 ảnh: các ô còn thiếu hiển thị ô xám placeholder.
- Ảnh tải lỗi (`onError`): chuyển sang ô xám placeholder.
- Mô tả dài: cắt còn 3 dòng (`line-clamp-3`).

### 10.2 Cài đặt

```bash
# MUI
npm install @mui/material @emotion/react @emotion/styled

# Tailwind CSS v4 (dùng plugin Vite)
npm install tailwindcss @tailwindcss/vite
```

**`vite.config.js`**

```js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
```

**`src/index.css`**

```css
@import "tailwindcss";
```

### 10.3 Cho MUI và Tailwind chạy chung

Tailwind v4 đặt class trong CSS layer, còn style của MUI (Emotion) mặc định không nằm trong layer nên sẽ **đè** Tailwind. Cách xử lý (MUI v7 trở lên): bật `enableCssLayer` và khai báo thứ tự layer, để `utilities` của Tailwind luôn thắng MUI.

**`src/main.jsx`** (thay bản ở mục 5.5)

```jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { StyledEngineProvider, GlobalStyles } from "@mui/material";
import { store } from "./app/store";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <StyledEngineProvider enableCssLayer>
      <GlobalStyles styles="@layer theme, base, mui, components, utilities;" />
      <App />
    </StyledEngineProvider>
  </Provider>
);
```

Ghi chú:
- Không dùng `CssBaseline` của MUI vì Tailwind đã có preflight (reset CSS).
- Nếu một class Tailwind vẫn không đè được style MUI, thêm dấu `!` ở cuối class (Tailwind v4), ví dụ `bg-[#bc9c98]!`, hoặc dùng prop `sx` của MUI cho phần đó.
- Phân vai: **MUI** cho component có sẵn (Card, Typography, Alert, Skeleton, Button), **Tailwind** cho layout, khoảng cách và màu.

### 10.4 Cấu trúc thư mục (bổ sung)

```
src/
├── components/
│   ├── ErrorMessage.jsx        # viết lại bằng MUI Alert
│   ├── NetworkStatus.jsx       # viết lại bằng MUI Alert
│   └── BreedCardSkeleton.jsx   # MỚI: khung chờ khi đang tải
├── features/breeds/
│   ├── BreedCard.jsx           # viết lại: card 4 ảnh + tên + mô tả
│   └── BreedList.jsx           # cập nhật: lưới card + skeleton + lỗi
├── pages/
│   └── BreedHome.jsx           # cập nhật: layout + tiêu đề bằng Tailwind/MUI
├── App.jsx                     # cập nhật: nền tối + NetworkStatus + <BreedHome />
├── index.css                   # MỚI: @import "tailwindcss"
└── main.jsx                    # cập nhật: StyledEngineProvider
```

Các file `BreedCard.jsx`, `ErrorMessage.jsx`, `NetworkStatus.jsx`, `BreedHome.jsx`, `App.jsx` trong mục 5 (và "giữ nguyên" ở mục 9) được **thay bằng bản dưới đây**. Phần Redux, axios, interceptor không đổi.

### 10.5 `src/features/breeds/BreedCard.jsx`

```jsx
import { useState } from "react";
import { Card, CardContent, Typography } from "@mui/material";

const IMAGE_SLOTS = 4;

function ImageTile({ src, alt }) {
  const [failed, setFailed] = useState(false);

  // Thiếu ảnh hoặc ảnh lỗi (vd: đang offline) => ô xám
  if (!src || failed) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center bg-[#d9d9d9] text-sm text-white">
        No image
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className="aspect-[4/3] h-full w-full object-cover"
    />
  );
}

export default function BreedCard({ breed }) {
  const { name, description, images = [] } = breed.attributes;

  // Luôn đủ 4 ô, thiếu ảnh thì undefined
  const tiles = Array.from({ length: IMAGE_SLOTS }, (_, i) => images[i]?.medium);

  return (
    <Card elevation={0} className="overflow-hidden rounded-none bg-[#bc9c98] text-white">
      {/* Lưới 2x2, nền trắng + gap tạo đường kẻ giữa các ảnh */}
      <div className="grid grid-cols-2 gap-0.5 bg-white">
        {tiles.map((src, i) => (
          <ImageTile key={i} src={src} alt={`${name} ${i + 1}`} />
        ))}
      </div>

      <CardContent className="px-5 py-4">
        <Typography variant="h6" component="h3" className="font-normal">
          {name}
        </Typography>
        <Typography variant="body2" className="mt-1 line-clamp-3">
          {description}
        </Typography>
      </CardContent>
    </Card>
  );
}
```

### 10.6 `src/components/BreedCardSkeleton.jsx`

```jsx
import { Skeleton } from "@mui/material";

export default function BreedCardSkeleton() {
  return (
    <div className="overflow-hidden bg-[#bc9c98]/40">
      <Skeleton variant="rectangular" className="aspect-[4/3] h-auto w-full" />
      <div className="p-4">
        <Skeleton width="60%" />
        <Skeleton />
        <Skeleton width="80%" />
      </div>
    </div>
  );
}
```

### 10.7 `src/components/ErrorMessage.jsx` và `NetworkStatus.jsx`

```jsx
// ErrorMessage.jsx
import { Alert, AlertTitle, Button } from "@mui/material";

export default function ErrorMessage({ error, onRetry }) {
  return (
    <Alert
      severity="error"
      variant="filled"
      action={
        <Button color="inherit" size="small" onClick={onRetry}>
          Thử lại
        </Button>
      }
    >
      <AlertTitle>Lỗi ({error.code})</AlertTitle>
      {error.message}
    </Alert>
  );
}
```

```jsx
// NetworkStatus.jsx
import { Alert } from "@mui/material";
import useOnlineStatus from "../hooks/useOnlineStatus";

export default function NetworkStatus() {
  const online = useOnlineStatus();
  if (online) return null;

  return (
    <Alert severity="warning" variant="filled" className="justify-center rounded-none">
      Bạn đang offline
    </Alert>
  );
}
```

### 10.8 `src/features/breeds/BreedList.jsx`

Phần lấy state tuỳ theo bạn dùng hướng nào, chỉ cần **một** trong hai đoạn:

```jsx
// Nếu dùng Redux Toolkit (mục 5):
const breeds = useSelector(selectBreeds);
const status = useSelector(selectBreedsStatus);
const error = useSelector(selectBreedsError);
const loading = status === "loading";

// Nếu dùng Redux thuần (mục 9):
const { items: breeds, loading, error } = useSelector((state) => state.breeds);
```

Component đầy đủ (ví dụ với Redux thuần, Cách B dùng thunk):

```jsx
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "@mui/material";
import { fetchBreeds } from "./actions";
import BreedCard from "./BreedCard";
import BreedCardSkeleton from "../../components/BreedCardSkeleton";
import ErrorMessage from "../../components/ErrorMessage";

export default function BreedList() {
  const dispatch = useDispatch();
  const { items: breeds, loading, error } = useSelector((state) => state.breeds);

  const load = () => dispatch(fetchBreeds({ "page[number]": 1, "page[size]": 12 }));

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showSkeleton = loading && breeds.length === 0;

  return (
    <div className="space-y-6">
      <Button variant="contained" onClick={load} disabled={loading}>
        Gọi lại API get all breeds
      </Button>

      {error && <ErrorMessage error={error} onRetry={load} />}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {showSkeleton
          ? Array.from({ length: 6 }, (_, i) => <BreedCardSkeleton key={i} />)
          : breeds.map((b) => <BreedCard key={b.id} breed={b} />)}
      </div>
    </div>
  );
}
```

### 10.9 `src/pages/BreedHome.jsx` và `src/App.jsx`

**`src/pages/BreedHome.jsx`**: trang chính, chứa layout và tiêu đề

```jsx
import { Typography } from "@mui/material";
import BreedList from "../features/breeds/BreedList";

export default function BreedHome() {
  return (
    <main className="mx-auto max-w-6xl p-6">
      <Typography variant="h4" component="h1" className="mb-6 font-semibold">
        Dog Breeds
      </Typography>

      <BreedList />
    </main>
  );
}
```

**`src/App.jsx`**: nền toàn trang, banner mạng và trang chính

```jsx
import NetworkStatus from "./components/NetworkStatus";
import BreedHome from "./pages/BreedHome";

export default function App() {
  return (
    <div className="min-h-screen bg-[#2b2224] text-white">
      <NetworkStatus />
      <BreedHome />
    </div>
  );
}
```

Phân chia trách nhiệm:

| File | Trách nhiệm |
|------|-------------|
| `App.jsx` | Thứ toàn cục: nền trang, banner online/offline. Render trang chính |
| `pages/BreedHome.jsx` | Trang chính: bố cục (căn giữa, padding), tiêu đề, ghép `BreedList` |
| `features/breeds/BreedList.jsx` | Gọi API qua Redux, hiển thị skeleton / lỗi / lưới card |
| `features/breeds/BreedCard.jsx` | Hiển thị 1 card breed |

> Sau này thêm trang mới (ví dụ `BreedDetail.jsx`) chỉ cần tạo file trong `pages/`. Khi cần nhiều trang, thêm `react-router-dom` và để `App.jsx` khai báo các route trỏ tới các page.

### 10.10 Kiểm thử giao diện

**Có Internet**
1. Mở app: thấy 6 khung skeleton, sau đó thay bằng các card.
2. Mỗi card: 4 ảnh xếp 2x2 có đường kẻ trắng, bên dưới là khối hồng nâu chứa tên breed và mô tả (tối đa 3 dòng).
3. Thu nhỏ cửa sổ: lưới đổi 3 cột, 2 cột, 1 cột.
4. Breed có ít hơn 4 ảnh: ô còn thiếu là ô xám "No image".

**Mất Internet**
1. Sau khi đã có dữ liệu, bật DevTools → Network → **Offline**.
2. Banner vàng "Bạn đang offline" xuất hiện.
3. Bấm **Gọi lại API get all breeds**: hiện `Alert` đỏ (`OFFLINE`) kèm nút **Thử lại**, các card cũ vẫn còn trong Redux.
4. Ảnh chưa được trình duyệt cache sẽ lỗi và chuyển sang ô xám (`onError`). Ảnh đã cache có thể vẫn hiển thị.
5. Nếu mở app lần đầu khi đang offline: không có card nào, chỉ có `Alert` lỗi và nút **Thử lại**.
6. Bật lại mạng, bấm **Thử lại**: card hiển thị bình thường.

> Redux chỉ lưu **URL** ảnh, không lưu file ảnh. Muốn xem được ảnh khi offline hoàn toàn cần thêm Service Worker / Cache API (ngoài phạm vi bài này).
