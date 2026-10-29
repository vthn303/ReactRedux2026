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

    // Cache-busting: thêm timestamp vào params để browser không dùng HTTP cache.
    // Nếu không có _t, trình duyệt có thể trả về response cũ từ cache khi offline
    // khiến interceptor không bắt được lỗi và app vẫn hiển thị dữ liệu như thể online.
    config.params = { ...config.params, _t: Date.now() };

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

